import { useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { itemsStore } from "../stores/itemsStore";
import { categoriesStore } from "../stores/categoriesStore";
import { ItemPicker, type CatalogItem } from "../components/ItemPicker";
import { PlusIcon } from "../components/ui/plus-icon";
import { toCatalogItem } from "./Items";
import {
  breakdownForItem, breakdownTotal, rollUpBreakdown, rollUpPrice,
  type CostBreakdown, type ItemGroupMember,
} from "../utils/itemCost";

// Create / edit an item group — the Price Book entry (Marek, Sep 10 call).
//
// A group is how a real job actually gets quoted: "replace AC system" is labor
// plus several materials plus equipment plus a permit fee, and sometimes an
// asset (the crane) for an hour. Rather than overloading one small item with
// every kind of cost, the group carries the components and rolls their costs up
// into labor / commission / materials — which is what the job KPI tiles and the
// labor-vs-commission reporting read.
//
// A group is stored in the same collection as every other item, with item type
// "Price Book" and a groupItems array, so it appears in the Items list and in
// every estimate / job / invoice picker with no special casing.

const DEPARTMENTS = ["Field Service", "Materials", "Equipment", "Administrative", "Office"];
const TAX_PROFILES = ["No Tax", "Florida Sales Tax 7%", "Texas Sales Tax 8.25%", "Polish Sales Tax 23%"];

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CreateItemGroup() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/items";

  const storeItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const categories = useSyncExternalStore(categoriesStore.subscribe, categoriesStore.getSnapshot);

  const editId = Number(params.id || 0);
  const existing = editId ? storeItems.find((i) => i.id === editId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [salesDesc, setSalesDesc] = useState(existing?.salesDescription ?? "");
  const [internalDesc, setInternalDesc] = useState(existing?.itemDescription ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [department, setDepartment] = useState(existing?.department ?? "");
  const [members, setMembers] = useState<ItemGroupMember[]>(existing?.groupItems ?? []);
  const [groupPricing, setGroupPricing] = useState<"flat" | "sum">(existing?.groupPricing ?? "flat");
  const [flatPrice, setFlatPrice] = useState(existing ? String(existing.rate ?? "") : "");
  const [taxable, setTaxable] = useState(existing?.taxable ?? true);
  const [taxProfile, setTaxProfile] = useState(existing?.taxProfile || "Florida Sales Tax 7%");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Only plain items can be members: a group inside a group would make the cost
  // rollup ambiguous, so groups are filtered out of the picker.
  const pickableItems = useMemo(
    () => storeItems.filter((i) => !i.groupItems?.length && i.id !== editId),
    [storeItems, editId],
  );

  // The group's cost is exactly its members' costs — anything else the package
  // pays for (a commission, an extra hour) is an item in the group, which keeps
  // one place to look and one place to edit.
  const totalBreakdown: CostBreakdown = rollUpBreakdown(members);
  const totalCost = breakdownTotal(totalBreakdown);
  const summedPrice = rollUpPrice(members);
  const price = groupPricing === "sum" ? summedPrice : parseFloat(flatPrice) || 0;
  const margin = price > 0 ? ((price - totalCost) / price) * 100 : 0;

  const addMember = (item: CatalogItem) => {
    setMembers((prev) => [...prev, {
      itemId: item.id,
      name: item.name,
      itemType: item.itemType || item.type,
      quantity: item.defaultQty || 1,
      unitPrice: item.rate || 0,
      unitCost: item.cost || 0,
      costBreakdown: breakdownForItem(item),
    }]);
    setPickerOpen(false);
  };

  const updateMember = (idx: number, patch: Partial<ItemGroupMember>) =>
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));

  const save = () => {
    if (!name.trim()) { toast.error("Group name is required."); return; }
    if (!members.length) { toast.error("Add at least one item to the group."); return; }
    if (groupPricing === "flat" && flatPrice === "") { toast.error("Price is required for a flat-rate group."); return; }
    const id = editId || (storeItems.length ? Math.max(...storeItems.map((i) => i.id)) + 1 : 1);
    itemsStore.upsert(toCatalogItem({
      id,
      name: name.trim(),
      description: internalDesc,
      salesDescription: salesDesc,
      additionalInfo: "",
      brand: "",
      modelNumber: "",
      rate: price,
      cost: totalCost,
      costBreakdown: totalBreakdown,
      groupItems: members,
      groupPricing,
      taxable,
      taxProfile: taxable ? taxProfile : "",
      category,
      department,
      vendor: "",
      defaultQty: 1,
      active: true,
      // A group IS a price book entry — same collection, same pickers.
      type: "Price Book",
    }));
    toast.success(editId ? "Item group updated" : "Item group created");
    // Land on the group itself, not back in a paginated list where a new row is
    // invisible on page 1 — the detail page shows the members that were saved.
    navigate(`/items/${id}`);
  };

  const fieldClass = "w-full h-11 px-3.5 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[13px] text-[#374151] mb-1.5";
  const reqStar = <span className="text-[#DC2626]">*</span>;

  const Section = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 px-6 py-6">
      <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 flex items-center gap-2">
          <button onClick={() => navigate(returnTo)} className="flex h-8 w-8 items-center justify-center rounded-md text-[#546478] hover:bg-[#EDF0F5]" aria-label="Back to Items">
            <span className="material-icons" style={{ fontSize: "22px" }}>chevron_left</span>
          </button>
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>{editId ? "Edit item group" : "Create item group"}</h1>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <Section label="Basic info">
            <div>
              <label className={labelClass}>Name {reqStar}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Replace AC system" className={fieldClass} />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Sales description</label>
              <textarea value={salesDesc} onChange={(e) => setSalesDesc(e.target.value)} placeholder="What the customer sees on the estimate"
                className="min-h-[64px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Internal description</label>
              <textarea value={internalDesc} onChange={(e) => setInternalDesc(e.target.value)} placeholder="Internal description is not shown to client"
                className="min-h-[64px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" />
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          <Section label="Classification">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <input type="text" list="group-departments" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className={fieldClass} />
                <datalist id="group-departments">
                  {DEPARTMENTS.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-[#8899AA]">Saved as an item of type <span style={{ fontWeight: 600 }}>Price Book</span> — a price book entry is a group of items.</p>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Members — services, materials, equipment, admin fees and assets,
              each with its own cost, which is what the rollup adds up. */}
          <Section label={<>Items in this group {reqStar}</>}>
            {members.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-8 text-center">
                <div className="text-[13px] text-[#546478]">No items yet</div>
                <div className="mt-1 text-[12px] text-[#8899AA]">Add the labor, materials, equipment and fees this package is made of.</div>
              </div>
            ) : (
              // Scrolls rather than clipping: the form column is ~480px wide on
              // a narrow window and the row does not fit.
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead className="bg-[#F9FAFB] text-left text-[#546478]">
                    <tr>
                      <th className="px-3 py-2.5 w-full" style={{ fontWeight: 600 }}>Item</th>
                      <th className="px-3 py-2.5 w-[104px] min-w-[104px]" style={{ fontWeight: 600 }}>Type</th>
                      <th className="px-3 py-2.5 w-[84px] min-w-[84px]" style={{ fontWeight: 600 }}>Qty</th>
                      <th className="px-3 py-2.5 w-[96px] min-w-[96px] text-right" style={{ fontWeight: 600 }}>Price</th>
                      <th className="px-3 py-2.5 w-[96px] min-w-[96px] text-right" style={{ fontWeight: 600 }}>Cost</th>
                      <th className="w-10 px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => {
                      return (
                        <tr key={`${m.itemId}-${idx}`} className="border-t border-[#F1F3F7]">
                          <td className="px-3 py-2.5 text-[#1A2332]" style={{ fontWeight: 500 }}>{m.name}</td>
                          <td className="px-3 py-2.5 text-[#546478]">{m.itemType || "—"}</td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number" min="0" step="1" value={String(m.quantity)}
                              onChange={(e) => updateMember(idx, { quantity: parseFloat(e.target.value) || 0 })}
                              className="h-9 w-full rounded-lg border border-[#E5E7EB] px-2 text-[13px] outline-none focus:border-[#4A6FA5]"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{money((m.quantity || 0) * m.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{money((m.quantity || 0) * m.unitCost)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button" onClick={() => setMembers((prev) => prev.filter((_, i) => i !== idx))}
                              className="h-8 w-8 rounded-lg text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]" aria-label={`Remove ${m.name}`}
                            >
                              <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button" onClick={() => setPickerOpen(true)}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]"
              style={{ fontWeight: 600 }}
            >
              <PlusIcon className="h-4 w-4" />
              Add item
            </button>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          <Section label={<>Pricing &amp; tax</>}>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: "flat", title: "Flat rate", hint: "One price for the package, whatever it contains." },
                { key: "sum", title: "Sum of the items", hint: `Adds up to ${money(summedPrice)} from the items above.` },
              ] as const).map((opt) => (
                <button
                  key={opt.key} type="button" onClick={() => setGroupPricing(opt.key)}
                  className={`rounded-lg border bg-white px-3.5 py-3 text-left transition-colors ${groupPricing === opt.key ? "border-[#4A6FA5]" : "border-[#E5E7EB] hover:border-[#C5CEDD]"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${groupPricing === opt.key ? "border-[#4A6FA5]" : "border-[#C5CEDD]"}`}>
                      {groupPricing === opt.key && <span className="h-2 w-2 rounded-full bg-[#4A6FA5]" />}
                    </span>
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{opt.title}</span>
                  </span>
                  <span className="mt-1 block pl-[26px] text-[12px] text-[#8899AA]">{opt.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Price {groupPricing === "flat" && reqStar}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={groupPricing === "sum" ? String(summedPrice) : flatPrice}
                    readOnly={groupPricing === "sum"}
                    onChange={(e) => setFlatPrice(e.target.value)}
                    placeholder="0"
                    className={`${fieldClass} pl-7 ${groupPricing === "sum" ? "bg-[#F9FAFB] text-[#546478]" : ""}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cost</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]">$</span>
                  <input type="number" readOnly value={String(totalCost)} className={`${fieldClass} pl-7 bg-[#F9FAFB] text-[#546478]`} style={{ fontVariantNumeric: "tabular-nums" }} />
                </div>
                <p className="mt-1.5 text-[12px] text-[#8899AA]">Rolled up from the items</p>
              </div>
              <div>
                <label className={labelClass}>Margin</label>
                <div className={`${fieldClass} flex items-center bg-[#F9FAFB] text-[#546478]`} style={{ fontVariantNumeric: "tabular-nums" }}>{margin.toFixed(1)}%</div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#E5E7EB] p-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="h-4 w-4 cursor-pointer rounded border-[#CBD5E1] accent-[#4A6FA5]" />
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
            </div>
          </Section>

          <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
            <button onClick={() => navigate(returnTo)} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={save} disabled={!name.trim() || members.length === 0}
              className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white hover:bg-[#3d5a85] disabled:opacity-40" style={{ fontWeight: 500 }}>
              {editId ? "Save group" : "Save item group"}
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ItemPicker
          catalogItems={pickableItems}
          onSelect={addMember}
          onClose={() => setPickerOpen(false)}
          placeholder="Search services, materials, equipment, fees..."
        />
      )}
    </div>
  );
}
