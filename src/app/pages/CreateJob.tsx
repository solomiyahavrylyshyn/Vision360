import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { jobTypesStore } from "../stores/jobTypesStore";
import { clientsStore } from "../stores/clientsStore";
import { jobsStore } from "../stores/jobsStore";
import { estimatesStore } from "../stores/estimatesStore";
import { toast } from "sonner";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { scheduleSettingsStore } from "../stores/scheduleSettingsStore";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";
import { itemsStore } from "../stores/itemsStore";
import { type JobStatus, JOB_STATUSES } from "../constants/jobStatuses";

// Note: mockClients is replaced by live clientsStore data — removed.

// Legacy HVAC/plumbing options kept available alongside the live Items catalog.
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

export function CreateJob() {
  const navigate = useNavigate();
  // When opened from a client's Jobs tab, the URL carries the client + a return path.
  const [sp] = useSearchParams();
  const returnTo = sp.get("returnTo");
  const goBack = () => navigate(returnTo || "/jobs");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState(sp.get("client") ?? "");
  const [clientSearch, setClientSearch] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [jobNumber, setJobNumber] = useState("10245-J02");
  const [jobType, setJobType] = useState<"one-off" | "recurring">("one-off");
  const [jobCategory, setJobCategory] = useState("");
  const availableJobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  // Live clients from the shared store — replaces the old hardcoded mockClients array.
  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  // Catalog = live Items module items + legacy options not already present.
  const catalogStoreItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const catalogItems: CatalogItem[] = (() => {
    const names = new Set(catalogStoreItems.map((i) => i.name.toLowerCase()));
    return [...catalogStoreItems, ...legacyCatalogItems.filter((i) => !names.has(i.name.toLowerCase()))];
  })();
  // Keep in sync with Calendar TEAM and JobDetail FIELD_EMPLOYEES.
  const fieldEmployees = ["Peter Novak", "Travis Brown", "Maria Garcia", "Emily Parker"];
  const [serviceCountry, setServiceCountry] = useState("United States");
  const [serviceStreet, setServiceStreet] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceState, setServiceState] = useState("");
  const [serviceZip, setServiceZip] = useState("");
  const [serviceCounty, setServiceCounty] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  // Figma "Job period": a numeric duration + a "Schedule job" toggle. When the
  // toggle is OFF the job is created UNSCHEDULED (no date) and the date/time
  // fields are hidden (brief: toggle scheduled off → unscheduled).
  const [scheduleJob, setScheduleJob] = useState(true);
  const [jobDuration, setJobDuration] = useState("2");
  const [assignedTo, setAssignedTo] = useState("");
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);
  // Figma "Estimate" link field in Job overview (e.g. 1024-E01). Prefilled when
  // a job is created from an estimate (Convert flow); editable otherwise.
  const [estimateNumber, setEstimateNumber] = useState("");
  const [pickedEstimateId, setPickedEstimateId] = useState<number | undefined>(undefined);
  // Optional status at creation (Part 8). Blank → derived on save: Scheduled when
  // the job is being scheduled, else Unscheduled.
  const [status, setStatus] = useState<JobStatus | "">("");
  const allEstimates = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const fromEstimateId = Number(sp.get("fromEstimate") || 0);
  // Pre-populate line items from the source estimate (Convert → Job flow).
  useState(() => {
    if (!fromEstimateId) return;
    const est = estimatesStore.getById(fromEstimateId);
    if (!est?.items?.length) return;
    const preloaded = est.items.map((it, idx) => ({
      id: idx + 1,
      catalogItemId: 0,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.price,
      unitCost: it.cost,
      taxable: it.taxable,
      total: it.amount,
    }));
    setLineItems(preloaded);
    if (est.estimateNumber) setEstimateNumber(est.estimateNumber);
    if (!title) setTitle(est.estimateName || "");
    // Carry the estimate's tax rate so Estimate→Job total continuity holds (V05.5).
    if (est.taxRate != null) setTaxRate(est.taxRate);
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), name: "", description: "", quantity: 1, unitCost: 0, unitPrice: 0 }]);
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

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    const newLineItem = catalogItemToLineItem(catalogItem, newId, 1);
    setLineItems([...lineItems, newLineItem]);
    setItemPickerOpen(false);
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;
  const filteredClients = liveClients
    .filter((c) => {
      const query = clientSearch.trim().toLowerCase();
      if (!query) return true;
      const addr = [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ");
      return (
        c.name.toLowerCase().includes(query) ||
        addr.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.mobilePhone || c.phone || "").includes(query)
      );
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(", "),
    }));

  // Estimate dropdown (Part 7): the SELECTED client's estimates, filtered to the
  // statuses that can still become a job — Sent / Viewed / Approved / Expired.
  // Draft / Rejected / Archived / Converted are hidden to force finalization.
  // Expired is shown on purpose (it's only a timer; a late-accepted estimate can
  // still spawn a job).
  const ESTIMATE_PICKABLE = new Set(["Sent", "Viewed", "Approved", "Expired"]);
  const clientEstimates = allEstimates.filter(
    (e) => ESTIMATE_PICKABLE.has(e.status) && e.clientName === client.trim(),
  );

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSave = () => {
    if (!client.trim()) { toast.error("Select a client before saving the job."); return; }
    // Start date is required ONLY when the job is being scheduled. With the
    // "Schedule job" toggle off, the job is created unscheduled (no date).
    if (scheduleJob && !startDate) { toast.error("Select a start date, or turn off “Schedule job”."); return; }

    const computedSubtotal = lineItems.reduce((s, li) => s + li.total, 0);
    const computedTaxable = lineItems.filter((li) => li.taxable).reduce((s, li) => s + li.total, 0);
    const computedTotal = computedSubtotal + computedTaxable * (taxRate / 100);
    const today = formatRegionalDate(new Date());

    // If a start time is given but no end time, default end = start + the
    // configured default job length (Settings → Scheduling).
    let resolvedEndTime = endTime;
    if (startTime && !endTime) {
      const [h, m] = startTime.split(":").map(Number);
      const total = h * 60 + m + scheduleSettingsStore.getSnapshot().defaultJobMinutes;
      const eh = Math.floor((total % (24 * 60)) / 60);
      const em = total % 60;
      resolvedEndTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    }

    const record = jobsStore.add({
      jobNumber,
      title: title.trim() || "Untitled Job",
      client: client.trim(),
      clientId: liveClients.find((c) => c.name === client.trim())?.id ?? "",
      address: serviceStreet,
      city: serviceCity,
      state: serviceState,
      zip: serviceZip,
      gateCode,
      assignedTo,
      jobType: jobCategory || "Service",
      jobCategory,
      startDate: scheduleJob ? startDate : "",
      endDate: scheduleJob ? endDate : "",
      startTime: scheduleJob ? startTime : "",
      endTime: scheduleJob ? resolvedEndTime : "",
      // Use the chosen status; if left blank, derive it — Unscheduled when the
      // "Schedule job" toggle is off (no date), otherwise Scheduled.
      status: status || (scheduleJob ? "Scheduled" : "Unscheduled"),
      totalPrice: Math.round(computedTotal * 100) / 100,
      notes,
      fieldNotes,
      privateNotes,
      taxRate,
      estimateId: fromEstimateId || pickedEstimateId || undefined,
      estimateNumber: estimateNumber.trim()
        || (fromEstimateId ? estimatesStore.getById(fromEstimateId)?.estimateNumber : undefined),
    });

    // Mark the source estimate as Converted and lock it to prevent
    // duplicate conversions (V05.6 / V05.7).
    if (fromEstimateId) {
      estimatesStore.update(fromEstimateId, {
        status: "Converted",
        job: record.jobNumber,
        jobTitle: record.title,
      });
    }

    toast.success(`Job ${record.jobNumber} created`);
    navigate(returnTo || `/jobs/${record.id}`);
  };

  return (
    <div className="min-h-full bg-white">
      <div className="h-1 bg-[#4A6FA5]" />

      <div className="max-w-[1180px] mx-auto py-8 px-6">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-6"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          <span>{returnTo ? "Back to client" : "Back to Jobs"}</span>
        </button>
        {/* Header */}
        <PageHeader title="Create Job" className="mb-6" />

        {/* Job details layout mirrors the Job Details page */}
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-4 mb-6">
          <div className="border border-[#E5E7EB] rounded-lg p-5 flex flex-col gap-5">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Overview</h3>
                {/* Figma: One-off / Recurring are RADIO buttons, not toggles. */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                    <input type="radio" name="job-frequency" checked={jobType === "one-off"} onChange={() => setJobType("one-off")} className="w-4 h-4 accent-[#4A6FA5] cursor-pointer" />
                    One-off
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                    <input type="radio" name="job-frequency" checked={jobType === "recurring"} onChange={() => setJobType("recurring")} className="w-4 h-4 accent-[#4A6FA5] cursor-pointer" />
                    Recurring
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job Title</label>
                  <input type="text" placeholder="AC Estimate" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job Type</label>
                  <select value={jobCategory} onChange={e => setJobCategory(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">Select job type</option>
                    {availableJobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Client</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientPickerOpen ? clientSearch : client}
                      onFocus={() => {
                        setClientSearch(client);
                        setClientPickerOpen(true);
                      }}
                      onClick={() => setClientPickerOpen(true)}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClient(e.target.value);
                        setClientPickerOpen(true);
                      }}
                      placeholder="Select a client"
                      className="w-full h-10 px-3 pr-9 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4A6FA5] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearch(client);
                        setClientPickerOpen(open => !open);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F7FA]"
                      aria-label="Open client list"
                    >
                      <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>expand_more</span>
                    </button>
                    {clientPickerOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                        <div className="max-h-[220px] overflow-y-auto py-1">
                          {filteredClients.length === 0 ? (
                            <div className="px-3 py-3 text-[12px] text-[#8899AA]">No clients found</div>
                          ) : filteredClients.map((mockClient) => (
                            <button
                              key={mockClient.id}
                              type="button"
                              onClick={() => {
                                setClient(mockClient.name);
                                setClientSearch(mockClient.name);
                                setClientPickerOpen(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-[#F5F7FA]"
                            >
                              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{mockClient.name}</div>
                              <div className="text-[11px] text-[#8899AA]">{mockClient.address}</div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-[#E5E7EB] p-1">
                          <button
                            type="button"
                            onClick={() => navigate("/clients/new")}
                            className="w-full px-3 py-2 text-left text-[13px] text-[#4A6FA5] hover:bg-[#EEF3FA] rounded-md flex items-center gap-2"
                            style={{ fontWeight: 600 }}
                          >
                            <PlusIcon className="h-4 w-4" />
                            Create new client
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job #</label>
                  <input type="text" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Assigned To</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">Unassigned</option>
                    {fieldEmployees.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  {/* Part 8: status is optional at creation; blank → derived on save
                      (Scheduled when scheduling, otherwise Unscheduled). */}
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus | "")} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">Default ({scheduleJob ? "Scheduled" : "Unscheduled"})</option>
                    {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  {/* Figma + Part 7: Estimate is a DROPDOWN of the selected client's
                      estimates, filtered to Sent / Viewed / Approved / Expired. */}
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Estimate</label>
                  <select
                    value={estimateNumber}
                    onChange={(e) => {
                      setEstimateNumber(e.target.value);
                      setPickedEstimateId(clientEstimates.find((es) => es.estimateNumber === e.target.value)?.id);
                    }}
                    disabled={!client.trim()}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF]"
                  >
                    <option value="">{!client.trim() ? "Select a client first" : clientEstimates.length ? "No estimate" : "No eligible estimates"}</option>
                    {/* Keep a prefilled (converted-from) number visible even if it's not in the eligible list. */}
                    {estimateNumber && !clientEstimates.some((es) => es.estimateNumber === estimateNumber) && (
                      <option value={estimateNumber}>{estimateNumber}</option>
                    )}
                    {clientEstimates.map((es) => (
                      <option key={es.id} value={es.estimateNumber}>
                        {es.estimateNumber}{es.estimateName ? ` — ${es.estimateName}` : ""} · {es.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9CA3AF] mb-1 block">Service Address</label>
                <select value={serviceCountry} onChange={(e) => setServiceCountry(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] mb-2">
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Mexico">Mexico</option>
                </select>
                <input type="text" placeholder="Street address" value={serviceStreet} onChange={(e) => setServiceStreet(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5] mb-2" />
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input type="text" placeholder="City" value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="State" value={serviceState} onChange={(e) => setServiceState(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="Zip" value={serviceZip} onChange={(e) => setServiceZip(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="County" value={serviceCounty} onChange={(e) => setServiceCounty(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="Gate code" value={gateCode} onChange={(e) => setGateCode(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              </div>
            </section>

            <div className="h-px bg-[#E5E7EB]" />

            <section className="flex flex-col gap-4">
              {/* Figma "Job period": duration + a Schedule-job toggle that reveals
                  the date/time fields. Toggle OFF → job is created unscheduled. */}
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job period</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[12px] text-[#546478]" style={{ fontWeight: 500 }}>Schedule job</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={scheduleJob}
                    aria-label="Schedule job"
                    onClick={() => setScheduleJob((s) => !s)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${scheduleJob ? "bg-[#4A6FA5]" : "bg-[#D1D5DB]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${scheduleJob ? "translate-x-4" : ""}`} />
                  </button>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job duration (hours)</label>
                  <input type="number" min={0} step={0.5} value={jobDuration} onChange={(e) => setJobDuration(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              </div>
              {scheduleJob && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-[#9CA3AF] mb-1 block">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#9CA3AF] mb-1 block">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#9CA3AF] mb-1 block">Start Time</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#9CA3AF] mb-1 block">End Time</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { title: "Job Notes", value: notes, setValue: setNotes, placeholder: "Notes visible on the job..." },
              { title: "Field Notes", value: fieldNotes, setValue: setFieldNotes, placeholder: "Technician notes..." },
              { title: "Internal Notes", value: privateNotes, setValue: setPrivateNotes, placeholder: "Internal notes..." },
            ].map((note) => (
              <div key={note.title} className="border border-[#E5E7EB] rounded-lg bg-white">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  <h3 className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{note.title}</h3>
                </div>
                <div className="p-4">
                  <textarea value={note.value} onChange={(e) => note.setValue(e.target.value)} placeholder={note.placeholder} className="w-full min-h-[84px] resize-y border-none p-0 text-[13px] leading-[20px] text-[#374151] focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-[#E5E7EB] rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Line Items</h3>
            <button
              onClick={() => setItemPickerOpen(true)}
              className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
              </div>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Click "Add Item" to select from catalog</div>
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
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-[#EDF0F5] hover:bg-[#FAFBFC]">
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          {item.taxable && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-[#E5E7EB] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]"
                          />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
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
                      <span className="text-[#546478]">Tax ({taxRate}%):</span>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={goBack} className="px-6 py-2.5 text-sm text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-sm hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Job
          </button>
        </div>
      </div>

      {/* Item Picker Modal */}
      {itemPickerOpen && (
        <ItemPicker
          catalogItems={catalogItems}
          onSelect={handleSelectItem}
          onClose={() => setItemPickerOpen(false)}
        />
      )}
    </div>
  );
}
