import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { itemsStore } from "../stores/itemsStore";
import { toCatalogItem, ITEM_TYPES, TYPE_CATEGORIES } from "./Items";

// Create item — full page aligned to Figma node 1494:127168.
// 2-column section layout (Basic info / Type / Classification / Pricing & tax /
// Vendor / Images / Custom fields / Notes); saves through toCatalogItem so the
// new item flows into the Items list + Estimate/Invoice/Job pickers.

const MANUFACTURERS = ["Carrier", "Trane", "Lennox", "Goodman", "Rheem", "Ferguson", "Square D", "Ecobee"];
const DEPARTMENTS = ["Field Service", "Materials", "Equipment", "Administrative", "Office"];
const VENDORS = ["HVAC Supply Co.", "Ferguson Enterprises", "Johnstone Supply", "Grainger", "HD Supply"];
const TAX_PROFILES = ["No Tax", "Florida Sales Tax 7%", "Texas Sales Tax 8.25%", "Polish Sales Tax 23%"];

export function CreateItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/items";

  const storeItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);

  const [name, setName] = useState("");
  const [internalDesc, setInternalDesc] = useState("");
  const [salesDesc, setSalesDesc] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [type, setType] = useState("Service");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [department, setDepartment] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [cost, setCost] = useState("");
  const [defaultQty, setDefaultQty] = useState("1");
  const [taxable, setTaxable] = useState(true);
  const [taxProfile, setTaxProfile] = useState("Florida Sales Tax 7%");
  const [vendor, setVendor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customField1, setCustomField1] = useState("");
  const [customField2, setCustomField2] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddImages = (files: FileList | null) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    list.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, String(reader.result)]);
      reader.readAsDataURL(f);
    });
  };

  const save = () => {
    if (!name.trim()) { toast.error("Item name is required."); return; }
    if (retailPrice === "") { toast.error("Price is required."); return; }
    if (cost === "") { toast.error("Cost is required."); return; }
    const nextId = storeItems.length ? Math.max(...storeItems.map((i: any) => i.id)) + 1 : 1;
    itemsStore.upsert(toCatalogItem({
      id: nextId,
      name: name.trim(),
      description: internalDesc,
      salesDescription: salesDesc,
      additionalInfo,
      brand: manufacturer,
      modelNumber: "",
      rate: parseFloat(retailPrice) || 0,
      cost: parseFloat(cost) || 0,
      taxable,
      taxProfile: taxable ? taxProfile : "",
      category,
      department,
      vendor,
      defaultQty: parseInt(defaultQty) || 1,
      customField1,
      customField2,
      notes,
      images: [...images, ...(imageUrl.trim() ? [imageUrl.trim()] : [])],
      active: true,
      type,
    }));
    toast.success("Item created");
    navigate(returnTo);
  };

  const fieldClass = "w-full h-11 px-3.5 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[13px] text-[#374151] mb-1.5";
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const manageHint = (text: React.ReactNode) => <p className="mt-2 text-[12px] text-[#8899AA]">{text}</p>;

  const Section = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 px-6 py-6">
      <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-5 flex items-center gap-2">
          <button onClick={() => navigate(returnTo)} className="flex h-8 w-8 items-center justify-center rounded-md text-[#546478] hover:bg-[#EDF0F5]" aria-label="Back to Items">
            <span className="material-icons" style={{ fontSize: "22px" }}>chevron_left</span>
          </button>
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>Create item</h1>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          {/* Basic info (Figma: Name* → Sales description → Internal description → Additional information) */}
          <Section label="Basic info">
            <div>
              <label className={labelClass}>Name {reqStar}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className={fieldClass} />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Sales description</label>
              <textarea value={salesDesc} onChange={(e) => setSalesDesc(e.target.value)} placeholder="Client-facing description"
                className="min-h-[64px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Internal description</label>
              <textarea value={internalDesc} onChange={(e) => setInternalDesc(e.target.value)} placeholder="Internal description is not shown to client"
                className="min-h-[64px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Additional information</label>
              <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Add any relevant information"
                className="min-h-[64px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Type — 6 radio cards (Figma 1494:127168: Service / Material /
               Equipment / Asset / Admin / Price Book) */}
          <Section label={<>Type {reqStar}</>}>
            <div className="grid grid-cols-3 gap-4">
              {ITEM_TYPES.map((t) => {
                const selected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategory(""); }}
                    className={`flex h-11 items-center gap-2.5 rounded-lg border bg-white px-3.5 text-left transition-colors ${selected ? "border-[#4A6FA5]" : "border-[#E5E7EB] hover:border-[#C5CEDD]"}`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#4A6FA5]" : "border-[#C5CEDD]"}`}>
                      {selected && <span className="h-2 w-2 rounded-full bg-[#4A6FA5]" />}
                    </span>
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{t}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Classification (Figma: Category select · Manufacturer · Department) */}
          <Section label="Classification">
            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                  <option value="">Select category</option>
                  {(TYPE_CATEGORIES[type] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Manufacturer</label>
                <input type="text" list="create-item-manufacturers" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Manufacturer" className={fieldClass} />
                <datalist id="create-item-manufacturers">
                  {MANUFACTURERS.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <input type="text" list="create-item-departments" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className={fieldClass} />
                <datalist id="create-item-departments">
                  {DEPARTMENTS.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>
            </div>
            {manageHint(<>Manage categories in <span className="cursor-pointer text-[#4A6FA5] hover:underline" onClick={() => navigate("/settings?section=items#item-categories")}>Settings &gt; Items &gt; Categories</span></>)}
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Pricing & tax (Figma: Price* · Cost* · Default quantity + Taxable box) */}
          <Section label={<>Pricing &amp; tax {reqStar}</>}>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Price {reqStar}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
                  <input type="number" min="0" step="0.01" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} placeholder="0" className={`${fieldClass} pl-7`} style={{ fontVariantNumeric: "tabular-nums" }} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cost {reqStar}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
                  <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className={`${fieldClass} pl-7`} style={{ fontVariantNumeric: "tabular-nums" }} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Default quantity</label>
                <input type="number" min="0" step="1" value={defaultQty} onChange={(e) => setDefaultQty(e.target.value)} className={fieldClass} style={{ fontVariantNumeric: "tabular-nums" }} />
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#E5E7EB] p-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="h-4 w-4 rounded border-[#CBD5E1] accent-[#4A6FA5] cursor-pointer" />
                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Taxable</span>
              </label>
              {taxable && (
                <div className="mt-3">
                  <label className={labelClass}>Tax profile</label>
                  <select value={taxProfile} onChange={(e) => setTaxProfile(e.target.value)} className={fieldClass}>
                    {TAX_PROFILES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {manageHint(<>Manage tax profiles in <span className="cursor-pointer text-[#4A6FA5] hover:underline" onClick={() => navigate("/settings")}>Settings &gt; Tax profiles</span></>)}
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Vendor */}
          <Section label="Vendor">
            <div className="max-w-[335px]">
              <label className={labelClass}>Vendor</label>
              <select value={vendor} onChange={(e) => setVendor(e.target.value)} className={fieldClass}>
                <option value="">Select vendor</option>
                {VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Images */}
          <Section label="Images">
            {images.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <div key={i} className="group/img relative h-16 w-[78px] overflow-hidden rounded-lg border border-[#E5E7EB]">
                    <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove image"
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white group-hover/img:flex">
                      <span className="material-icons" style={{ fontSize: "13px" }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-7 text-center transition-colors hover:border-[#4A6FA5]">
              <span className="material-icons text-[#8899AA]" style={{ fontSize: "26px" }}>upload</span>
              <span className="text-[13px] text-[#546478]">Drop your files here, or <span className="text-[#4A6FA5]">click to browse</span></span>
              <span className="text-[12px] text-[#9CA3AF]">SVG, PNG, JPG or GIF (max. 3MB)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAddImages(e.target.files)} />
            </label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image URL" className={`${fieldClass} mt-3`} />
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Custom fields */}
          <Section label="Custom fields">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Custom field 1</label>
                <input type="text" value={customField1} onChange={(e) => setCustomField1(e.target.value)} placeholder="Custom field 1" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Custom field 2</label>
                <input type="text" value={customField2} onChange={(e) => setCustomField2(e.target.value)} placeholder="Custom field 2" className={fieldClass} />
              </div>
            </div>
            {manageHint(<>Manage custom fields in <span className="cursor-pointer text-[#4A6FA5] hover:underline" onClick={() => navigate("/settings")}>Settings &gt; Custom fields</span></>)}
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Notes */}
          <Section label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any internal notes..."
              className="min-h-[80px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
          </Section>

          {/* Footer — Cancel / Save item (Figma: right-aligned inside the card) */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
            <button onClick={() => navigate(returnTo)} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={save} disabled={!name.trim()}
              className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-40" style={{ fontWeight: 500 }}>
              Save item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
