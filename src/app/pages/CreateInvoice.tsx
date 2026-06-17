import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { clientsStore } from "../stores/clientsStore";
import { jobsStore } from "../stores/jobsStore";
import { estimatesStore } from "../stores/estimatesStore";
import { invoicesStore } from "../stores/invoicesStore";
import { itemsStore } from "../stores/itemsStore";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
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

const JOB_STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  "Completed": { bg: "#DCFCE7", color: "#16A34A" },
  "Scheduled": { bg: "#EBF0F8", color: "#4A6FA5" },
  "In Progress": { bg: "#FEF3C7", color: "#D97706" },
  "Unscheduled": { bg: "#F3F4F6", color: "#6B7280" },
  "Cancelled": { bg: "#FEE2E2", color: "#DC2626" },
  "Paused": { bg: "#FEF3C7", color: "#D97706" },
  "On Hold": { bg: "#FEF3C7", color: "#D97706" },
};

export function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [client, setClient] = useState(searchParams.get("client") || "");
  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const clientNames = liveClients.map((c) => c.name);
  const clientOptions = client && !clientNames.includes(client) ? [client, ...clientNames] : clientNames;

  const liveJobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const jobOptions = [
    ...liveJobs.map(j => `${j.jobNumber}: ${j.title || "Service"}`),
    "10245-J01: Kitchen Renovation", "10246-J01: Bathroom Remodel",
    "10247-J01: Plumbing Fix", "10248-J01: Electrical Work", "10250-J01: HVAC Install",
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Only estimates a customer could act on are linkable — hide Draft/Rejected/
  // Archived; show Sent/Viewed/Approved/Expired (Marek, Jun 5).
  const INVOICE_ESTIMATE_PICKABLE = ["Sent", "Viewed", "Approved", "Expired"];
  const liveEstimates = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const estimateOptions = [
    ...liveEstimates.filter(e => INVOICE_ESTIMATE_PICKABLE.includes(e.status)).map(e => `${e.estimateNumber}: ${e.estimateName || e.clientName}`),
    "10245-E01: HVAC System Quote", "10246-E01: Kitchen Quote", "10248-E01: Electrical Quote",
  ].filter((v, i, a) => a.indexOf(v) === i);

  const catalogStoreItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const catalogItems: CatalogItem[] = (() => {
    const names = new Set(catalogStoreItems.map(i => i.name.toLowerCase()));
    return [...catalogStoreItems, ...legacyCatalogItems.filter(i => !names.has(i.name.toLowerCase()))];
  })();

  const fromJobId = Number(searchParams.get("fromJob") || 0);
  const fromEstimateId = Number(searchParams.get("fromEstimate") || 0);

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; });

  // One invoice can settle SEVERAL jobs; items aggregate from all of them.
  const [linkedJobs, setLinkedJobs] = useState<string[]>(() => {
    if (fromJobId) {
      const j = liveJobs.find(j => j.id === fromJobId);
      if (j) return [`${j.jobNumber}: ${j.title || "Service"}`];
    }
    const param = searchParams.get("job");
    return param ? [param] : [];
  });
  const [jobAddOpen, setJobAddOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  // At most ONE estimate per invoice. "None" is valid.
  const [linkedEstimate, setLinkedEstimate] = useState(() => {
    if (fromEstimateId) {
      const e = liveEstimates.find(e => e.id === fromEstimateId);
      return e ? `${e.estimateNumber}: ${e.estimateName || e.clientName}` : searchParams.get("estimate") || "";
    }
    return searchParams.get("estimate") || "";
  });

  // Line items are SNAPSHOT copies — independent of their source. `sourceJob`
  // tags items that came from a job so unlinking that job can clean them up.
  type InvLineItem = SelectedLineItem & { sourceJob?: string };
  const [lineItems, setLineItems] = useState<InvLineItem[]>(() => {
    const sourceJob = fromJobId ? liveJobs.find(j => j.id === fromJobId) : null;
    const sourceEst = fromEstimateId ? liveEstimates.find(e => e.id === fromEstimateId) : null;
    const items = sourceJob?.items ?? sourceEst?.items ?? [];
    return items.map((it, idx) => ({
      id: idx + 1, catalogItemId: 0,
      name: it.name, description: it.description,
      quantity: it.quantity, unitPrice: it.price,
      unitCost: it.cost ?? 0, taxable: it.taxable, total: it.amount,
      sourceJob: sourceJob ? sourceJob.jobNumber : undefined,
    }));
  });

  const [notes, setNotes] = useState("");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate] = useState(() => {
    const sourceJob = fromJobId ? liveJobs.find(j => j.id === fromJobId) : null;
    const sourceEst = fromEstimateId ? liveEstimates.find(e => e.id === fromEstimateId) : null;
    return sourceJob?.taxRate ?? sourceEst?.taxRate ?? 7.5;
  });

  const nextItemId = (items: InvLineItem[]) => (items.length ? Math.max(...items.map(li => li.id)) + 1 : 1);

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setLineItems(items => items.map((li) => {
      if (li.id === id) {
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unitPrice") updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return li;
    }));
  };
  const removeLineItem = (id: number) => setLineItems(items => items.filter(li => li.id !== id));
  const handleSelectItem = (catalogItem: CatalogItem) => {
    setLineItems(items => [...items, catalogItemToLineItem(catalogItem, nextItemId(items), 1)]);
    setItemPickerOpen(false);
  };

  // Estimate of the currently linked estimate label → its job number (for overlap).
  const linkedEstimateJobNumber = (() => {
    if (!linkedEstimate) return "";
    const num = linkedEstimate.split(":")[0].trim();
    return liveEstimates.find(e => e.estimateNumber === num)?.job || "";
  })();

  // Add a job: warn (don't block) if it overlaps the linked estimate, then
  // aggregate the job's items into the invoice as snapshot copies.
  const addJob = (label: string) => {
    if (linkedJobs.includes(label)) return;
    const num = label.split(":")[0].trim();
    if (linkedEstimateJobNumber && linkedEstimateJobNumber === num) {
      toast.warning(`Job ${num} from the linked estimate is already covered — items may duplicate`);
    }
    setLinkedJobs(js => [...js, label]);
    const job = liveJobs.find(j => j.jobNumber === num);
    if (job?.items?.length) {
      setLineItems(items => [
        ...items,
        ...job.items!.map((it) => ({
          id: 0, catalogItemId: 0, name: it.name, description: it.description,
          quantity: it.quantity, unitPrice: it.price, unitCost: it.cost ?? 0,
          taxable: it.taxable, total: it.amount, sourceJob: num,
        })),
      ].map((li, i) => ({ ...li, id: i + 1 })));
      toast.success(`Added ${job.items.length} item${job.items.length === 1 ? "" : "s"} from ${num}`);
    }
    setJobAddOpen(false);
  };
  // Unlinking a job removes the job + the items it contributed (its snapshot copies).
  const removeJob = (label: string) => {
    const num = label.split(":")[0].trim();
    setLinkedJobs(js => js.filter(j => j !== label));
    setLineItems(items => items.filter(li => li.sourceJob !== num));
  };

  // Selecting an estimate copies its line items in (max 1 estimate). Warn if it
  // overlaps an already-linked job.
  const applyEstimateSelection = (value: string) => {
    setLinkedEstimate(value);
    if (!value) return;
    const num = value.split(":")[0].trim();
    const est = liveEstimates.find(e => e.estimateNumber === num);
    if (est?.job && linkedJobs.some(l => l.split(":")[0].trim() === est.job)) {
      toast.warning(`Job ${est.job} from this estimate is already selected — items may duplicate`);
    }
    if (est?.items?.length) {
      setLineItems(items => {
        const manual = items.filter(li => !li.sourceJob); // keep job-sourced items
        const copied = est.items!.map((it) => ({
          id: 0, catalogItemId: 0, name: it.name, description: it.description,
          quantity: it.quantity, unitPrice: it.price, unitCost: it.cost ?? 0,
          taxable: it.taxable, total: it.amount,
        }));
        return [...manual, ...copied].map((li, i) => ({ ...li, id: i + 1 }));
      });
      toast.success(`Copied ${est.items.length} line item${est.items.length === 1 ? "" : "s"} from ${num}`);
    }
  };

  const createNewJobInline = () => {
    if (!client.trim()) { toast.error("Select a client before creating a job."); return; }
    const rec = liveClients.find(c => c.name === client);
    const base = rec?.id || "10245";
    const prefix = `${base}-J`;
    const used = liveJobs.filter(j => j.jobNumber.startsWith(prefix)).map(j => Number(j.jobNumber.slice(prefix.length))).filter(Number.isFinite);
    const next = used.length ? Math.max(...used) + 1 : 1;
    const record = jobsStore.add({
      jobNumber: `${prefix}${String(next).padStart(2, "0")}`,
      title: "New Job", client, clientId: rec?.id || "",
      address: rec?.address || "", city: rec?.city || "", state: rec?.state || "", zip: rec?.zip || "",
      gateCode: "", assignedTo: "", jobType: "One-off", jobCategory: "Service",
      startDate: "", endDate: "", startTime: "", endTime: "",
      status: "Scheduled", totalPrice: 0, notes: "", fieldNotes: "", privateNotes: "", taxRate: 7.5,
    });
    setLinkedJobs(js => [...js, `${record.jobNumber}: ${record.title}`]);
    setJobAddOpen(false);
    toast.success(`Job ${record.jobNumber} created and linked`);
  };

  const handleSaveInvoice = () => {
    if (!client.trim()) { toast.error("Select a client before saving the invoice."); return; }
    if (!invoiceDate) { toast.error("Invoice date is required."); return; }
    if (!dueDate) { toast.error("Due date is required."); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item before saving."); return; }

    const clientRec = liveClients.find((c) => c.name === client.trim());
    const base = clientRec?.id || "10250";
    const firstJob = linkedJobs[0] || "";
    const jobNumber = firstJob.includes(":") ? firstJob.split(":")[0].trim() : firstJob.trim();
    const jobName = firstJob.includes(":") ? firstJob.split(":").slice(1).join(":").trim() : "";
    const grand = Math.round(total * 100) / 100;

    invoicesStore.add({
      number: invoicesStore.nextInvoiceNumber(jobNumber || base),
      type: "Standard",
      date: invoiceDate,
      status: "Unpaid",
      clientName: client.trim(),
      customerEmail: clientRec?.email || "",
      phone: clientRec?.mobilePhone || clientRec?.phone || "",
      jobNumber,
      jobName,
      total: grand,
      balance: grand,
      linkedEstimate: linkedEstimate ? linkedEstimate.split(":")[0].trim() : "",
      memo: notes,
      billingAddress: clientRec?.address || "", billingCity: clientRec?.city || "", billingState: clientRec?.state || "", billingZip: clientRec?.zip || "",
      serviceAddress: clientRec?.address || "", serviceCity: clientRec?.city || "", serviceState: clientRec?.state || "", serviceZip: clientRec?.zip || "",
      paymentTerms: "Net 30",
      dueDate,
      dateCreated: invoiceDate,
      createdBy: "You",
      stage: "Sent",
      noteToCustomer: notes,
      dateSent: invoiceDate,
    });
    toast.success("Invoice created");
    navigate(returnTo || "/invoices");
  };
  const handleSaveDraft = () => {
    if (!client.trim()) { toast.error("Select a client before saving the draft."); return; }
    toast.success("Draft saved");
    navigate(returnTo || "/invoices");
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // Resolve a linked-job label to its live record fields for the Jobs table.
  const resolveJob = (label: string) => {
    const num = label.split(":")[0].trim();
    const title = label.split(":").slice(1).join(":").trim();
    const j = liveJobs.find(x => x.jobNumber === num);
    return { num, title: j?.title || title, scheduled: j?.startDate || "", status: j?.status || "", total: j?.totalPrice ?? null };
  };
  const linkedJobsTotal = linkedJobs.reduce((s, l) => s + (resolveJob(l).total ?? 0), 0);
  const filteredJobOptions = jobOptions.filter(j => !jobSearch || j.toLowerCase().includes(jobSearch.toLowerCase()));

  const reqStar = <span className="text-[#DC2626]">*</span>;
  const fieldClass = "w-full h-11 px-3.5 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[13px] text-[#374151] mb-1.5";

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
          <button onClick={() => navigate(returnTo || "/invoices")} className="flex h-8 w-8 items-center justify-center rounded-md text-[#546478] hover:bg-[#EDF0F5]" aria-label="Back to Invoices">
            <span className="material-icons" style={{ fontSize: "22px" }}>chevron_left</span>
          </button>
          <span className="material-icons text-[#1A2332]" style={{ fontSize: "22px" }}>receipt</span>
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>Create invoice</h1>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          {/* Invoice details */}
          <Section label="Invoice details">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Client name {reqStar}</label>
                <select value={client} onChange={(e) => setClient(e.target.value)} className={fieldClass}>
                  <option value="">Select client</option>
                  {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Invoice date {reqStar}</label>
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Due date {reqStar}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Linked estimate</label>
                <select value={linkedEstimate} onChange={(e) => applyEstimateSelection(e.target.value)} className={fieldClass}>
                  <option value="">None</option>
                  {estimateOptions.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Jobs */}
          <Section label="Jobs">
            <div className="overflow-visible rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
                <div className="relative w-[280px] max-w-full">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                  <input type="text" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} placeholder="Search jobs..."
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5]" />
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setJobAddOpen(o => !o)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4A6FA5] px-3.5 text-[13px] text-white transition-colors hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                    <PlusIcon className="h-4 w-4" /> Add job
                    <span className="material-icons" style={{ fontSize: "18px" }}>arrow_drop_down</span>
                  </button>
                  {jobAddOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setJobAddOpen(false)} />
                      <div className="absolute right-0 z-20 mt-1 w-[300px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg max-h-[280px] overflow-y-auto">
                        {filteredJobOptions.filter(j => !linkedJobs.includes(j)).map(j => (
                          <button key={j} type="button" onClick={() => addJob(j)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]">
                            <span className="truncate">{j}</span>
                          </button>
                        ))}
                        <button type="button" onClick={createNewJobInline} className="flex w-full items-center gap-2 border-t border-[#E5E7EB] px-3 py-2.5 text-[13px] text-[#4A6FA5] hover:bg-[#EEF3FA]" style={{ fontWeight: 600 }}>
                          <PlusIcon className="h-3.5 w-3.5" /> Create new job
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {linkedJobs.length === 0 ? (
                <div className="px-5 py-10 text-center text-[13px] text-[#8899AA]">No jobs linked. Line items will come from the jobs you add.</div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Number</th>
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Scheduled</th>
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Status</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Total</th>
                        <th className="w-[44px] px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {linkedJobs.map((label) => {
                        const j = resolveJob(label);
                        const badge = JOB_STATUS_BADGE[j.status] || { bg: "#F3F4F6", color: "#6B7280" };
                        return (
                          <tr key={label} className="border-b border-[#EDF0F5] last:border-b-0">
                            <td className="px-4 py-3">
                              <button onClick={() => { const n = liveJobs.find(x => x.jobNumber === j.num); if (n) navigate(`/jobs/${n.id}`); }} className="text-left text-[14px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>{j.num}</button>
                              {j.title && <div className="text-[13px] text-[#8899AA]">{j.title}</div>}
                            </td>
                            <td className="px-4 py-3 text-[14px] text-[#546478]">{j.scheduled || "—"}</td>
                            <td className="px-4 py-3">
                              {j.status ? <span className="rounded-md px-2.5 py-1 text-[12px]" style={{ fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>{j.status}</span> : <span className="text-[#C8D5E8]">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{j.total != null ? `$${fmt(j.total)}` : "—"}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => removeJob(label)} className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#DC2626]" aria-label="Unlink job">
                                <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex justify-end border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                    Total: ${fmt(linkedJobsTotal)}
                  </div>
                </>
              )}
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Line Items */}
          <Section label={<>Line Items {reqStar}</>}>
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
                <div className="relative w-[280px] max-w-full">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                  <input type="text" disabled placeholder="Search items..."
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] text-[#9CA3AF] outline-none" />
                </div>
                <button type="button" onClick={() => setItemPickerOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4A6FA5] px-3.5 text-[13px] text-white transition-colors hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                  <PlusIcon className="h-4 w-4" /> Add item
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F7FA]">
                    <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
                  </div>
                  <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
                  <div className="mt-1 text-[12px] text-[#8899AA]">Items come from linked jobs/estimate, or click "Add item"</div>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Item</th>
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Quantity</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Unit price</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Unit cost</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Total</th>
                        <th className="w-[44px] px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-[#EDF0F5] last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                            {item.description && <div className="text-[13px] text-[#8899AA]">{item.description}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="0" step="1" value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                              className="h-9 w-16 rounded-md border border-[#E5E7EB] px-2 text-center text-[13px] focus:border-[#4A6FA5] focus:outline-none" />
                          </td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeLineItem(item.id)} className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#DC2626]" aria-label="Remove item">
                              <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4">
                    <div className="ml-auto w-full max-w-[320px] space-y-2">
                      <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Subtotal:</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span></div>
                      <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Taxable amount:</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span></div>
                      <div className="flex items-center justify-between text-[13px]"><span className="text-[#546478]">Tax ({taxRate}%):</span><span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span></div>
                      <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2"><span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Total:</span><span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Internal Notes */}
          <Section label="Internal Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="min-h-[96px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]"
              placeholder={`Notes for your team - e.g. "Do not walk on right side, dog in yard"...`} />
          </Section>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between pb-8">
          <button onClick={() => navigate(returnTo || "/invoices")} className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-[13px] text-[#546478] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-[13px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Save as draft</button>
            <button onClick={handleSaveInvoice} className="h-10 rounded-lg bg-[#4A6FA5] px-5 text-[13px] text-white transition-colors hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save invoice</button>
          </div>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker catalogItems={catalogItems} onSelect={handleSelectItem} onClose={() => setItemPickerOpen(false)} />
      )}
    </div>
  );
}
