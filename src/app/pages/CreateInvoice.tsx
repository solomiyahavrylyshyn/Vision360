import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { clientsStore } from "../stores/clientsStore";
import { jobsStore } from "../stores/jobsStore";
import { estimatesStore } from "../stores/estimatesStore";
import { itemsStore } from "../stores/itemsStore";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";

// Legacy HVAC/plumbing options kept alongside the live Items catalog.
const legacyCatalogItems: CatalogItem[] = [
  { id: 1000, name: "Heat Pump Repair or Service", itemDescription: "Standard heat pump repair service call", salesDescription: "Heat pump diagnostic, repair and service", brand: "Carrier", modelNumber: "HP-2500", rate: 285, cost: 120, taxable: false, category: "HVAC", type: "Service" },
  { id: 1001, name: "SEER Heat Pump Condenser Unit", itemDescription: "SEER 16 heat pump condenser outdoor unit", salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit", brand: "Trane", modelNumber: "XR16-048", rate: 3200, cost: 1800, taxable: true, category: "HVAC", type: "Product" },
  { id: 1002, name: "SEER Heat Pump Condenser Premium", itemDescription: "SEER 20 premium heat pump condenser", salesDescription: "SEER Premium Heat Pump Condenser — ultra high efficiency", brand: "Lennox", modelNumber: "XP25-048", rate: 4800, cost: 2900, taxable: true, category: "HVAC", type: "Product" },
  { id: 1003, name: "Copper Piping Installation", itemDescription: "Install copper piping per linear foot", salesDescription: "Professional copper piping installation (per ft)", brand: "", modelNumber: "", rate: 18.50, cost: 6.75, taxable: true, category: "Plumbing", type: "Service" },
  { id: 1004, name: "Electrical Panel Upgrade 200A", itemDescription: "Upgrade existing panel to 200 amp service", salesDescription: "200A electrical panel upgrade — parts and labor", brand: "Square D", modelNumber: "HOM2040M200PC", rate: 2800, cost: 1100, taxable: true, category: "Electrical", type: "Equipment" },
  { id: 1005, name: "General Labor - Technician", itemDescription: "Standard technician labor rate per hour", salesDescription: "Technician labor (hourly)", brand: "", modelNumber: "", rate: 95, cost: 45, taxable: false, category: "Labor", type: "Labor" },
  { id: 1006, name: "Drain Cleaning Service", itemDescription: "Standard drain cleaning and snaking", salesDescription: "Professional drain cleaning service", brand: "", modelNumber: "", rate: 175, cost: 40, taxable: false, category: "Plumbing", type: "Service" },
  { id: 1007, name: "Thermostat - Smart WiFi", itemDescription: "Smart thermostat with WiFi connectivity", salesDescription: "Smart WiFi Thermostat — professional installation included", brand: "Ecobee", modelNumber: "EB-STATE5-01", rate: 450, cost: 180, taxable: true, category: "HVAC", type: "Product" },
];

export function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [client, setClient] = useState(searchParams.get("client") || "");
  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const clientNames = liveClients.map((c) => c.name);
  const clientOptions = client && !clientNames.includes(client) ? [client, ...clientNames] : clientNames;

  // Live jobs from jobsStore + legacy demo labels so the picker shows real jobs.
  const liveJobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const jobOptions = [
    ...liveJobs.map(j => `${j.jobNumber}: ${j.title || "Service"}`),
    "10245-J01: Kitchen Renovation", "10246-J01: Bathroom Remodel",
    "10247-J01: Plumbing Fix", "10248-J01: Electrical Work", "10250-J01: HVAC Install",
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  // Live estimates from estimatesStore + legacy demo labels.
  const liveEstimates = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const estimateOptions = [
    ...liveEstimates.map(e => `${e.estimateNumber}: ${e.estimateName || e.clientName}`),
    "10245-E01: HVAC System Quote", "10246-E01: Kitchen Quote", "10248-E01: Electrical Quote",
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Catalog = live Items + legacy (deduped by name).
  const catalogStoreItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const catalogItems: CatalogItem[] = (() => {
    const names = new Set(catalogStoreItems.map(i => i.name.toLowerCase()));
    return [...catalogStoreItems, ...legacyCatalogItems.filter(i => !names.has(i.name.toLowerCase()))];
  })();

  const fromJobId = Number(searchParams.get("fromJob") || 0);
  const fromEstimateId = Number(searchParams.get("fromEstimate") || 0);

  const [invoiceNumber] = useState("10245-I02");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; });

  // Pre-populate from source job or estimate. Jobs are a MULTI-select: one
  // invoice can settle several jobs at once (windows + doors + fence sold as
  // three jobs, closed with a single invoice). "None" (empty) is a valid value.
  const [linkedJobs, setLinkedJobs] = useState<string[]>(() => {
    if (fromJobId) {
      const j = liveJobs.find(j => j.id === fromJobId);
      if (j) return [`${j.jobNumber}: ${j.title || "Service"}`];
    }
    const param = searchParams.get("job");
    return param ? [param] : [];
  });
  const [jobsDropdownOpen, setJobsDropdownOpen] = useState(false);
  const [linkedEstimate, setLinkedEstimate] = useState(() => {
    if (fromEstimateId) {
      const e = liveEstimates.find(e => e.id === fromEstimateId);
      return e ? `${e.estimateNumber}: ${e.estimateName || e.clientName}` : searchParams.get("estimate") || "";
    }
    return searchParams.get("estimate") || "";
  });

  // Pre-populate line items from the source job or estimate.
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>(() => {
    const sourceJob = fromJobId ? liveJobs.find(j => j.id === fromJobId) : null;
    const sourceEst = fromEstimateId ? liveEstimates.find(e => e.id === fromEstimateId) : null;
    const items = sourceJob?.items ?? sourceEst?.items ?? [];
    return items.map((it, idx) => ({
      id: idx + 1, catalogItemId: 0,
      name: it.name, description: it.description,
      quantity: it.quantity, unitPrice: it.price,
      unitCost: it.cost ?? 0, taxable: it.taxable,
      total: it.amount,
    }));
  });

  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days of invoice date.");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  // Carry tax rate from the source job/estimate.
  const [taxRate, setTaxRate] = useState(() => {
    const sourceJob = fromJobId ? liveJobs.find(j => j.id === fromJobId) : null;
    const sourceEst = fromEstimateId ? liveEstimates.find(e => e.id === fromEstimateId) : null;
    return sourceJob?.taxRate ?? sourceEst?.taxRate ?? 7.5;
  });

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

  const removeLineItem = (id: number) => setLineItems(lineItems.filter(li => li.id !== id));

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    setLineItems([...lineItems, catalogItemToLineItem(catalogItem, newId, 1)]);
    setItemPickerOpen(false);
  };

  // Selecting an estimate copies its line items into the invoice (they stay
  // fully editable afterwards). One invoice links to at most ONE estimate.
  const applyEstimateSelection = (value: string) => {
    setLinkedEstimate(value);
    if (!value) return;
    const num = value.split(":")[0].trim();
    const est = liveEstimates.find(e => e.estimateNumber === num);
    if (est?.items?.length) {
      setLineItems(est.items.map((it, idx) => ({
        id: idx + 1, catalogItemId: 0,
        name: it.name, description: it.description,
        quantity: it.quantity, unitPrice: it.price,
        unitCost: it.cost ?? 0, taxable: it.taxable,
        total: it.amount,
      })));
      if (est.taxRate != null) setTaxRate(est.taxRate);
      toast.success(`Copied ${est.items.length} line item${est.items.length === 1 ? "" : "s"} from ${num}`);
    }
  };

  const toggleLinkedJob = (label: string) =>
    setLinkedJobs(js => js.includes(label) ? js.filter(j => j !== label) : [...js, label]);

  // "Create new job" lives as the last row of the jobs dropdown so the user can
  // spin up a fresh job without leaving the form (the existing jobs may all be
  // stale, e.g. 60 days old and irrelevant).
  const createNewJobInline = () => {
    if (!client.trim()) { toast.error("Select a client before creating a job."); return; }
    const rec = liveClients.find(c => c.name === client);
    const base = rec?.id || "10245";
    const prefix = `${base}-J`;
    const used = liveJobs
      .filter(j => j.jobNumber.startsWith(prefix))
      .map(j => Number(j.jobNumber.slice(prefix.length)))
      .filter(Number.isFinite);
    const next = used.length ? Math.max(...used) + 1 : 1;
    const record = jobsStore.add({
      jobNumber: `${prefix}${String(next).padStart(2, "0")}`,
      title: "New Job", client, clientId: rec?.id || "",
      address: rec?.address || "", city: rec?.city || "", state: rec?.state || "", zip: rec?.zip || "",
      gateCode: "", assignedTo: "", jobType: "One-off", jobCategory: "Service",
      startDate: "", endDate: "", startTime: "", endTime: "",
      status: "Scheduled", totalPrice: 0, notes: "", fieldNotes: "", privateNotes: "",
      taxRate: 7.5,
    });
    setLinkedJobs(js => [...js, `${record.jobNumber}: ${record.title}`]);
    setJobsDropdownOpen(false);
    toast.success(`Job ${record.jobNumber} created and linked`);
  };

  // Save handlers with validation + feedback (was a silent redirect with no checks).
  // Required: Client, Invoice date, Due date. Linked jobs/estimate are optional —
  // "None" is a valid value (an invoice with no estimate and no job is a real
  // case, e.g. selling used equipment off the shelf).
  const handleSaveInvoice = () => {
    if (!client.trim()) { toast.error("Select a client before saving the invoice."); return; }
    if (!invoiceDate) { toast.error("Invoice date is required."); return; }
    if (!dueDate) { toast.error("Due date is required."); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item before saving."); return; }
    toast.success("Invoice created");
    navigate(returnTo || "/invoices");
  };
  const handleSaveDraft = () => {
    if (!client.trim() && lineItems.length === 0) { toast.error("Add a client or a line item before saving a draft."); return; }
    toast.success("Draft saved");
    navigate(returnTo || "/invoices");
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-full bg-white">
      <div className="h-1 bg-[#4A6FA5]" />

      <div className="max-w-[800px] mx-auto py-6 px-4 sm:px-6">
        <button
          onClick={() => navigate(returnTo || "/invoices")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-6"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          <span>Back to Invoices</span>
        </button>
        {/* Header */}
        <PageHeader
          title="Create Invoice"
          icon="receipt"
          className="mb-6"
          actions={<span className="text-[14px] text-[#546478]">{invoiceNumber}</span>}
        />

        {/* Client */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Client <span className="text-[#DC2626]">*</span></label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white"
            >
              <option value="">Select a client</option>
              {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Invoice Date <span className="text-[#DC2626]">*</span></label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5]" />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Due Date <span className="text-[#DC2626]">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5]" />
            </div>
          </div>

          {/* Linked Jobs / Estimate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Linked Jobs</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setJobsDropdownOpen(o => !o)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white text-left flex items-center justify-between gap-2"
                >
                  <span className="text-[#1A2332]">
                    {linkedJobs.length === 0 ? "None" : `${linkedJobs.length} job${linkedJobs.length === 1 ? "" : "s"} linked`}
                  </span>
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>arrow_drop_down</span>
                </button>
                {jobsDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setJobsDropdownOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-[#E5E7EB] rounded-md shadow-lg max-h-[260px] overflow-y-auto">
                      {jobOptions.map(j => (
                        <label key={j} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={linkedJobs.includes(j)}
                            onChange={() => toggleLinkedJob(j)}
                            className="accent-[#4A6FA5]"
                          />
                          <span className="truncate">{j}</span>
                        </label>
                      ))}
                      {/* Shortcut: create a job without leaving the form — always the last row. */}
                      <button
                        type="button"
                        onClick={createNewJobInline}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#4A6FA5] hover:bg-[#EEF3FA] border-t border-[#E5E7EB]"
                        style={{ fontWeight: 600 }}
                      >
                        <PlusIcon className="h-3.5 w-3.5" /> Create new job
                      </button>
                    </div>
                  </>
                )}
              </div>
              {linkedJobs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {linkedJobs.map(j => (
                    <span key={j} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-[#EEF3FA] text-[#4A6FA5] rounded-md text-[12px]" style={{ fontWeight: 500 }}>
                      {j.split(":")[0]}
                      <button type="button" onClick={() => toggleLinkedJob(j)} aria-label={`Unlink ${j}`} className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#DCE6F5]">
                        <span className="material-icons" style={{ fontSize: "13px" }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Linked Estimate</label>
              <select value={linkedEstimate} onChange={(e) => applyEstimateSelection(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white">
                <option value="">None</option>
                {estimateOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <div className="mt-1.5 text-[12px] text-[#9CA3AF]">Selecting an estimate copies its line items into the invoice.</div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-[#E5E7EB] rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Line Items</h3>
            {/* Same style as the estimate form's "Add item". */}
            <button
              onClick={() => setItemPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              <PlusIcon className="h-4 w-4" /> Add item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
              </div>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Click "Add item" to choose from your pricebook</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC]">
                      {["Item", "Qty", "Unit Price", "Unit Cost", "Total", ""].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[50px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.id} className="border-b border-[#EDF0F5] hover:bg-[#FAFBFC]">
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          {item.taxable && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="1" value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-[#E5E7EB] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                            className="w-28 px-2 py-1 border border-[#E5E7EB] rounded text-[13px] text-right focus:outline-none focus:border-[#4A6FA5]"
                            style={{ fontVariantNumeric: "tabular-nums" }} />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
                        <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeLineItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
                            <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-[#E5E7EB] px-5 py-4 bg-[#FAFBFC]">
                <div className="flex justify-end">
                  <div className="space-y-2 min-w-[300px]">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">Subtotal:</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">Taxable amount:</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478] flex items-center gap-1.5">
                        Tax
                        <span className="relative inline-flex items-center">
                          <input type="number" min="0" max="100" step="0.1" value={taxRate}
                            onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                            className="w-16 pl-2 pr-4 py-0.5 border border-[#E5E7EB] rounded text-[13px] tabular-nums text-right focus:outline-none focus:border-[#4A6FA5]"
                            aria-label="Tax rate percent" />
                          <span className="absolute right-1.5 text-[#9CA3AF] pointer-events-none">%</span>
                        </span>
                      </span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span>
                      <span className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes & Terms */}
        <div className="mb-8">
          <h3 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Notes & Terms</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Internal Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] min-h-[100px] resize-y"
                placeholder="Notes visible only to your team..." />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Terms & Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] min-h-[100px] resize-y"
                placeholder="Terms visible to client..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => navigate(returnTo || "/invoices")} className="px-6 py-2.5 text-sm text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-6 py-2.5 border border-[#E5E7EB] rounded-md text-sm text-[#1A2332] hover:bg-[#F5F7FA]"
            style={{ fontWeight: 500 }}
          >
            Save as Draft
          </button>
          <button
            onClick={handleSaveInvoice}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-sm hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Invoice
          </button>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker catalogItems={catalogItems} onSelect={handleSelectItem} onClose={() => setItemPickerOpen(false)} />
      )}
    </div>
  );
}
