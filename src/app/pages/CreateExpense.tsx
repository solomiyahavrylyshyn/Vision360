import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PlusIcon } from "../components/ui/plus-icon";
import { expensesStore } from "../stores/expensesStore";

// Mock catalog items
const mockCatalogItems: CatalogItem[] = [
  { id: 1000, name: "Heat Pump Repair or Service", itemDescription: "Standard heat pump repair service call", salesDescription: "Heat pump diagnostic, repair and service", brand: "Carrier", modelNumber: "HP-2500", rate: 285, cost: 120, taxable: false, category: "HVAC", type: "Service" },
  { id: 1001, name: "SEER Heat Pump Condenser Unit", itemDescription: "SEER 16 heat pump condenser outdoor unit", salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit", brand: "Trane", modelNumber: "XR16-048", rate: 3200, cost: 1800, taxable: true, category: "HVAC", type: "Product" },
  { id: 1003, name: "Copper Piping Installation", itemDescription: "Install copper piping per linear foot", salesDescription: "Professional copper piping installation (per ft)", brand: "", modelNumber: "", rate: 18.50, cost: 6.75, taxable: true, category: "Plumbing", type: "Service" },
  { id: 1005, name: "General Labor - Technician", itemDescription: "Standard technician labor rate per hour", salesDescription: "Technician labor (hourly)", brand: "", modelNumber: "", rate: 95, cost: 45, taxable: false, category: "Labor", type: "Labor" },
];

const categories = [
  "Materials",
  "Fuel",
  "Tools",
  "Software",
  "Meals",
  "Travel",
  "Subcontractor",
  "Office Supplies",
  "Equipment Rental",
  "Other",
];

const vendors = [
  "Home Depot",
  "Lowe's",
  "Shell Gas Station",
  "Grainger",
  "Microsoft",
  "Ferguson Plumbing",
  "Delta Airlines",
  "Starbucks",
  "Office Depot",
  "Best Buy",
];

const mockJobs = [
  { id: "J-1234", title: "HVAC Installation — 123 Main St" },
  { id: "J-1235", title: "Plumbing Repair — 456 Oak Ave" },
  { id: "J-1236", title: "Equipment Repair — 789 Pine Rd" },
  { id: "J-1237", title: "Electrical Work — 101 Elm St" },
  { id: "J-1238", title: "Roof Inspection — 202 Birch Ln" },
];

interface ReceiptFile {
  name: string;
  size: string;
  type: "image" | "pdf";
  preview?: string;
}

// Shared field styles (Figma: 40px tall, 8px radius, subtle focus ring).
const fieldCls =
  "w-full h-10 px-3.5 border border-[#E5E7EB] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all";
const selectCls = `${fieldCls} pr-9 cursor-pointer appearance-none`;

// One row of the form: a left label column + the content on the right, with a
// divider between sections (Figma 1141-104297 single-column layout).
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-x-8 gap-y-4 px-6 py-6 border-t border-[#E5E7EB] first:border-t-0">
      <h2 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{label}</h2>
      <div className="space-y-4 min-w-0">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] text-[#546478] mb-1.5" style={{ fontWeight: 500 }}>
        {label}{required && <span className="text-[#DC2626]"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function CreateExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Section 7.2 — batch entry shortcut: read context from query params
  const initialJobId = searchParams.get("fromJob") || "";
  const initialInvoiceId = searchParams.get("fromInvoice") || "";
  // Return to the page this was opened from (job/client/etc.), falling back to the list.
  const returnTo = searchParams.get("returnTo");
  const expenseHome = returnTo || "/expenses";

  // EXP-3 — "Duplicate" copies vendor/category/description/notes/job from a
  // source expense but deliberately leaves the amount blank so the user must
  // re-enter it for the new expense. The amount field is highlighted until typed.
  const isDuplicate = searchParams.get("dup") === "1";
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [merchant, setMerchant] = useState(searchParams.get("vendor") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [total, setTotal] = useState("");
  const [description, setDescription] = useState(searchParams.get("description") || "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState(searchParams.get("notes") || "");
  const [jobId, setJobId] = useState(initialJobId);
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate] = useState(7.5);

  // On a duplicate, drop focus straight onto the (blank) amount field so the
  // one piece the user must re-enter is front and center.
  useEffect(() => {
    if (isDuplicate) amountInputRef.current?.focus();
  }, [isDuplicate]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newReceipts: ReceiptFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024
        ? (f.size / 1024).toFixed(1) + " KB"
        : (f.size / (1024 * 1024)).toFixed(1) + " MB",
      type: f.type.startsWith("image/") ? "image" : "pdf",
      preview: f.type.startsWith("image/")
        ? URL.createObjectURL(f)
        : undefined,
    }));
    setReceipts((prev) => [...prev, ...newReceipts]);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeReceipt = (idx: number) => {
    setReceipts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    const newLineItem = catalogItemToLineItem(catalogItem, newId, 1);
    setLineItems([...lineItems, newLineItem]);
    setItemPickerOpen(false);
  };

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setLineItems(lineItems.map((li) => {
      if (li.id === id) {
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return li;
    }));
  };

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter((li) => li.id !== id));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const calculatedTotal = subtotal + taxAmount;

  // Persist through expensesStore so the new expense shows up in the Expenses
  // list / detail / report and survives a page refresh.
  const persistExpense = () => {
    const job = mockJobs.find((j) => j.id === jobId);
    return expensesStore.add({
      id: expensesStore.nextId(),
      date: new Date(`${expenseDate} 12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      category,
      merchant,
      amount: lineItems.length > 0 ? calculatedTotal : parseFloat(total) || 0,
      jobId: jobId || undefined,
      jobTitle: job ? job.title.split(" — ")[0] : undefined,
      invoiceId: invoiceId || undefined,
      notes: [description.trim(), notes.trim()].filter(Boolean).join(" — ") || undefined,
      receipts: receipts.length,
    });
  };

  const handleSave = () => {
    setSaving(true);
    persistExpense();
    toast.success("Expense saved");
    setTimeout(() => navigate(expenseHome), 600);
  };

  // Section 7.2 — Save and Create Another: persist + clear non-context fields,
  // keep job so the user can keep entering a stack of receipts.
  const handleSaveAndCreateAnother = () => {
    setSaving(true);
    persistExpense();
    setTimeout(() => {
      toast.success("Expense saved");
      setMerchant("");
      setCategory("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setTotal("");
      setDescription("");
      setReferenceNumber("");
      setNotes("");
      setReceipts([]);
      setLineItems([]);
      // jobId stays so the next expense lands on the same job
      setSaving(false);
    }, 600);
  };

  const isValid = merchant.trim() && category && expenseDate && (total || lineItems.length > 0);
  const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-full bg-[#F5F7FA]">
      {/* Page header — back + title (Figma 1141-104297) */}
      <div className="max-w-[1120px] mx-auto px-6 pt-6 pb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(expenseHome)}
          aria-label="Back to Expenses"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#546478] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "20px" }}>arrow_back</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332] leading-[32px]" style={{ fontWeight: 700 }}>Create expense</h1>
      </div>

      {/* Single card with label-left sections */}
      <div className="max-w-[1120px] mx-auto px-6 pb-10">
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          {/* ── Basic info ── */}
          <Section label="Basic info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" required>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${selectCls} ${category ? "text-[#1A2332]" : "text-[#B0BEC5]"}`}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" style={{ fontSize: "18px" }}>expand_more</span>
                </div>
              </Field>
              <Field label="Vendor" required>
                <div className="relative">
                  <select value={merchant} onChange={(e) => setMerchant(e.target.value)} className={`${selectCls} ${merchant ? "text-[#1A2332]" : "text-[#B0BEC5]"}`}>
                    <option value="">Select vendor</option>
                    {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" style={{ fontSize: "18px" }}>expand_more</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Expense date" required>
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={fieldCls} />
              </Field>
              <Field label="Total amount">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]" style={{ fontWeight: 500 }}>$</span>
                  <input
                    ref={amountInputRef}
                    type="number" step="0.01" min="0"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0"
                    className={`w-full h-10 pl-8 pr-3.5 border rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none transition-all ${
                      isDuplicate && !total
                        ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/20 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20"
                        : "border-[#E5E7EB] focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10"
                    }`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
                {isDuplicate && !total && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#B45309]" style={{ fontWeight: 500 }}>
                    <span className="material-icons" style={{ fontSize: "14px" }}>edit</span>
                    Enter the amount for this duplicated expense
                  </p>
                )}
              </Field>
            </div>

            <Field label="Document reference number">
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Receipt # or vendor invoice #" className={fieldCls} />
            </Field>

            <Field label="Expense description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Supplies for commercial HVAC project"
                rows={3}
                className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none resize-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all leading-relaxed"
              />
            </Field>
          </Section>

          {/* ── Link job ── */}
          <Section label="Link job">
            <Field label="Job">
              <div className="relative">
                <select value={jobId} onChange={(e) => { setJobId(e.target.value); setInvoiceId(""); }} className={`${selectCls} ${jobId ? "text-[#1A2332]" : "text-[#B0BEC5]"}`}>
                  <option value="">Select job</option>
                  {mockJobs.map((j) => <option key={j.id} value={j.id}>#{j.id} — {j.title}</option>)}
                </select>
                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" style={{ fontSize: "18px" }}>expand_more</span>
              </div>
            </Field>
          </Section>

          {/* ── Receipt ── */}
          <Section label="Receipt">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            <div
              ref={dropZoneRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed py-10 transition-all cursor-pointer ${
                dragOver ? "border-[#4A6FA5] bg-[#4A6FA5]/5" : "border-[#E5E7EB] hover:border-[#4A6FA5]/40 hover:bg-[#F9FAFB]"
              }`}
            >
              <div className="flex flex-col items-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-[#F0F4FA] flex items-center justify-center mb-3">
                  <span className="material-icons text-[#8899AA]" style={{ fontSize: "22px" }}>file_upload</span>
                </div>
                <p className="text-[13px] text-[#546478]">
                  {dragOver ? "Drop files here" : <>Drop your files here, or <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>click to browse</span></>}
                </p>
                <p className="text-[11px] text-[#8899AA] mt-1">SVG, PNG, JPG or GIF (max. 3MB)</p>
              </div>
            </div>

            {receipts.length > 0 && (
              <div className="space-y-2.5">
                {receipts.map((r, idx) => (
                  <div key={idx} className="group flex items-center gap-3 p-2.5 bg-[#F9FAFB] rounded-lg border border-[#EDF0F5] hover:border-[#E5E7EB] transition-colors">
                    {r.preview ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-[#E5E7EB]">
                        <img src={r.preview} alt={r.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[#EBF2FC] flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>picture_as_pdf</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{r.name}</p>
                      <p className="text-[11px] text-[#8899AA]">{r.size}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeReceipt(idx); }} className="w-7 h-7 rounded-md flex items-center justify-center text-[#8899AA] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors opacity-0 group-hover:opacity-100">
                      <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Line items ── */}
          <Section label="Line items">
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-2 p-3 border-b border-[#E5E7EB]">
                <div className="relative flex-1 max-w-[280px]">
                  <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                  <input
                    readOnly
                    onClick={() => setItemPickerOpen(true)}
                    placeholder="Search items..."
                    className="w-full h-8 pl-8 pr-3 border border-[#E5E7EB] rounded-md text-[12px] bg-white text-[#1A2332] placeholder:text-[#9CA3AF] outline-none cursor-pointer focus:border-[#4A6FA5]"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setItemPickerOpen(true); }}
                  className="flex items-center gap-1.5 px-3 h-8 bg-[#4A6FA5] hover:bg-[#3D5F8F] text-white rounded-lg text-[12px] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "32px" }}>inventory_2</span>
                  <p className="text-[13px] text-[#8899AA]">No items added yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      {["Item", "Quantity", "Unit price", "Unit cost", "Total", ""].map((h, i) => (
                        <th key={i} className={`px-4 py-2.5 text-[12px] text-[#546478] ${i === 0 ? "text-left" : i === 5 ? "" : "text-right"}`} style={{ fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.id} className="border-b border-[#F1F3F7] last:border-0">
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{li.name}</div>
                          {li.description && <div className="text-[12px] text-[#8899AA] mt-0.5">{li.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number" min="1"
                            value={li.quantity}
                            onChange={(e) => updateLineItem(li.id, "quantity", Number(e.target.value))}
                            className="w-16 h-8 px-2 border border-[#E5E7EB] rounded text-[12px] text-right outline-none focus:border-[#4A6FA5]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${money(li.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${money((li as { unitCost?: number }).unitCost ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${money(li.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeLineItem(li.id)} className="w-7 h-7 rounded flex items-center justify-center text-[#8899AA] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors">
                            <span className="material-icons" style={{ fontSize: "18px" }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {lineItems.length > 0 && (
                <div className="bg-[#F9FAFB] px-4 py-3 border-t border-[#E5E7EB]">
                  <div className="ml-auto w-full max-w-[280px] space-y-1.5">
                    <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Subtotal:</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${money(subtotal)}</span></div>
                    <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Taxable amount:</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${money(taxableAmount)}</span></div>
                    <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Tax ({taxRate}%):</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${money(taxAmount)}</span></div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB] text-[14px]"><span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span><span className="text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${money(calculatedTotal)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── Notes ── */}
          <Section label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any internal notes about this expense..."
              rows={4}
              className="w-full px-3.5 py-3 border border-[#E5E7EB] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none resize-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all leading-relaxed"
            />
          </Section>

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => navigate(expenseHome)}
              className="h-10 px-5 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] transition-colors"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            {jobId && (
              <button
                onClick={handleSaveAndCreateAnother}
                disabled={!isValid || saving}
                className="h-10 px-5 rounded-lg border border-[#E5E7EB] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontWeight: 500 }}
                title="Save and start a new expense on the same job"
              >
                Save and create another
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="h-10 px-6 rounded-lg bg-[#4A6FA5] text-white text-[13px] hover:bg-[#3D5F8F] transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {saving && <span className="material-icons animate-spin" style={{ fontSize: "16px" }}>refresh</span>}
              {saving ? "Saving..." : "Save expense"}
            </button>
          </div>
        </div>
      </div>

      {/* ItemPicker Modal */}
      {itemPickerOpen && (
        <ItemPicker
          open={itemPickerOpen}
          onClose={() => setItemPickerOpen(false)}
          catalogItems={mockCatalogItems}
          onSelectItem={handleSelectItem}
        />
      )}
    </div>
  );
}
