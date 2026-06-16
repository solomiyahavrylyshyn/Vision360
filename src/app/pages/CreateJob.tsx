import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { jobTypesStore } from "../stores/jobTypesStore";
import { clientsStore } from "../stores/clientsStore";
import { jobsStore } from "../stores/jobsStore";
import { estimatesStore } from "../stores/estimatesStore";
import { toast } from "sonner";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { scheduleSettingsStore, formatScheduleHour } from "../stores/scheduleSettingsStore";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";
import { itemsStore } from "../stores/itemsStore";
import { type JobStatus, JOB_STATUSES } from "../constants/jobStatuses";
import { expandRecurrence, describeRecurrence, type RecurrenceFrequency, type RecurrenceRule } from "../utils/recurrence";

// ── Time helpers (shared by the bidirectional duration ⇄ end-time logic) ──
const timeToMin = (t: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};
const minToTime = (mins: number): string => {
  const wrapped = ((Math.round(mins) % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

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

export interface CreateJobPrefill {
  title?: string;
  client?: string;
  address?: string;
  jobCategory?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  scheduleJob?: boolean;
}

/** Values the full modal collects — emitted on Save in EDIT mode (see onSubmit). */
export interface CreateJobValues {
  title: string;
  client: string;
  jobCategory: string;
  assignedTo: string;
  address: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  scheduleJob: boolean;
}

export interface CreateJobProps {
  /** Render inside the Figma modal shell (overlay + centered card) instead of a full page. */
  asModal?: boolean;
  /** Modal-mode: called on Cancel / X / backdrop click. */
  onClose?: () => void;
  /** Modal-mode: called after the job record is created (the calendar refreshes via jobsStore). */
  onCreated?: (record: ReturnType<typeof jobsStore.add>) => void;
  /** Seed values (e.g. the clicked calendar slot, or the job being edited). */
  prefill?: CreateJobPrefill;
  /** Header text override (e.g. "Edit job #16"). Defaults to "Create job". */
  heading?: string;
  /** Primary button label override. Defaults to "Save job". */
  submitLabel?: string;
  /** EDIT mode: when provided, Save emits the form values instead of creating a
   *  new job (the caller persists the change, e.g. the board patches the job). */
  onSubmit?: (values: CreateJobValues) => void;
  /** Slot-create from the board: returns true if the chosen technician already has
   *  a time-overlapping job on that date (drives the inline overlap error). When
   *  omitted, CreateJob falls back to checking the jobsStore records itself. */
  checkConflict?: (info: { assignedTo: string; startDate: string; startHour: number; endHour: number }) => boolean;
}

export function CreateJob({ asModal = false, onClose, onCreated, prefill, heading, submitLabel, onSubmit, checkConflict }: CreateJobProps = {}) {
  const navigate = useNavigate();
  // When opened from a client's Jobs tab, the URL carries the client + a return path.
  const [sp] = useSearchParams();
  const returnTo = sp.get("returnTo");
  // Modal mode closes via callback; page mode navigates back.
  const goBack = () => { if (asModal) { onClose?.(); return; } navigate(returnTo || "/jobs"); };
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [client, setClient] = useState(prefill?.client ?? sp.get("client") ?? "");
  const [clientSearch, setClientSearch] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [jobNumber, setJobNumber] = useState("10245-J02");
  const [jobType, setJobType] = useState<"one-off" | "recurring">("one-off");
  // Recurring wizard (Marek, Jun 8). A recurring job is created as a SERIES of
  // unscheduled + unassigned jobs (Marek, Jun 5) — the dispatcher schedules each.
  const [recFreq, setRecFreq] = useState<RecurrenceFrequency>("weekly");
  const [recInterval, setRecInterval] = useState("1");
  const [recWeekdays, setRecWeekdays] = useState<number[]>([new Date().getDay()]);
  const [recEndMode, setRecEndMode] = useState<"count" | "date">("count");
  const [recCount, setRecCount] = useState("12");
  const [recEndDate, setRecEndDate] = useState("");
  const buildRecurrenceRule = (): RecurrenceRule => ({
    frequency: recFreq,
    interval: Math.max(1, Number(recInterval) || 1),
    weekdays: recFreq === "weekly" ? recWeekdays : undefined,
    endMode: recEndMode,
    count: Math.max(1, Number(recCount) || 1),
    endDate: recEndDate || undefined,
  });
  const [jobCategory, setJobCategory] = useState(prefill?.jobCategory ?? "");
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
  // The calendar slot carries a single address string; seed it into the street line.
  const [serviceStreet, setServiceStreet] = useState(prefill?.address ?? "");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceState, setServiceState] = useState("");
  const [serviceZip, setServiceZip] = useState("");
  const [serviceCounty, setServiceCounty] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [startDate, setStartDate] = useState(() => prefill?.startDate ?? new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => prefill?.endDate ?? prefill?.startDate ?? new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(prefill?.startTime ?? "");
  const [endTime, setEndTime] = useState(prefill?.endTime ?? "");
  // Figma "Job period": a numeric duration + a "Schedule job" toggle. When the
  // toggle is OFF the job is created UNSCHEDULED (no date) and the date/time
  // fields are hidden (brief: toggle scheduled off → unscheduled).
  const [scheduleJob, setScheduleJob] = useState(prefill?.scheduleJob ?? true);
  // Job duration (hours). Defaults from the prefilled slot's start/end if present,
  // otherwise from the job type (Installation → 8h, else 2h). Bidirectional with
  // the End time field below.
  const [jobDuration, setJobDuration] = useState(() => {
    const s = timeToMin(prefill?.startTime ?? "");
    const e = timeToMin(prefill?.endTime ?? "");
    if (s != null && e != null && e > s) return String((e - s) / 60);
    return String(jobTypesStore.getDuration(prefill?.jobCategory));
  });
  const [assignedTo, setAssignedTo] = useState(prefill?.assignedTo ?? "");
  // US-4 out-of-range confirm: holds a pending save while the warning modal is up.
  const [outOfRangeOpen, setOutOfRangeOpen] = useState(false);
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);
  // Figma "Estimates" section: a table of linked estimates (multiple). Prefilled
  // when a job is created from an estimate (Convert flow); editable otherwise.
  type LinkedEstimate = { id: number; estimateNumber: string; estimateName: string; createdBy: string; status: string; amount: number };
  const [linkedEstimates, setLinkedEstimates] = useState<LinkedEstimate[]>([]);
  const [estPickerOpen, setEstPickerOpen] = useState(false);
  const [estSearch, setEstSearch] = useState("");
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
    // Seed the Estimates table with the source estimate (Convert → Job flow).
    setLinkedEstimates([{
      id: est.id,
      estimateNumber: est.estimateNumber,
      estimateName: est.estimateName || "",
      createdBy: (est as { createdBy?: string }).createdBy || "—",
      status: est.status,
      amount: preloaded.reduce((s, li) => s + li.total, 0),
    }]);
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

  const estimateAmount = (e: { items?: { amount: number }[] }) => e.items?.reduce((s, it) => s + (it.amount ?? 0), 0) ?? 0;
  // Eligible estimates not already linked, filtered by the in-panel search.
  const availableEstimates = clientEstimates.filter(
    (e) => !linkedEstimates.some((l) => l.id === e.id) &&
      (!estSearch || `${e.estimateNumber} ${e.estimateName ?? ""}`.toLowerCase().includes(estSearch.toLowerCase())),
  );
  const addEstimate = (e: typeof clientEstimates[number]) => {
    setLinkedEstimates((prev) => [...prev, {
      id: e.id,
      estimateNumber: e.estimateNumber,
      estimateName: e.estimateName || "",
      createdBy: (e as { createdBy?: string }).createdBy || "—",
      status: e.status,
      amount: estimateAmount(e),
    }]);
    setEstPickerOpen(false);
    setEstSearch("");
  };
  const removeEstimate = (id: number) => setLinkedEstimates((prev) => prev.filter((l) => l.id !== id));
  const estimatesTotal = linkedEstimates.reduce((s, l) => s + l.amount, 0);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Bidirectional Job duration ⇄ End time (US-4) ──────────────────────────
  // Editing one field recomputes the other so they never drift. Start time is the
  // anchor: duration + start → end, and end − start → duration. Arbitrary minute
  // values are allowed (e.g. 10:25), not just :00/:30.
  const durHours = () => { const n = Number(jobDuration); return Number.isFinite(n) && n > 0 ? n : 0; };
  const syncStartTime = (v: string) => {
    setStartTime(v);
    const s = timeToMin(v); const d = durHours();
    if (s != null && d > 0) setEndTime(minToTime(s + d * 60));
  };
  const syncDuration = (v: string) => {
    setJobDuration(v);
    const s = timeToMin(startTime); const n = Number(v);
    if (s != null && Number.isFinite(n) && n > 0) setEndTime(minToTime(s + n * 60));
  };
  const syncEndTime = (v: string) => {
    setEndTime(v);
    const s = timeToMin(startTime); const e = timeToMin(v);
    if (s != null && e != null && e > s) setJobDuration(String(Math.round(((e - s) / 60) * 100) / 100));
  };
  // Selecting a job type resets the duration to that type's configured default
  // (Settings → Job Types; Installation 8h, else 2h) and re-syncs the end time.
  const onJobTypeChange = (v: string) => {
    setJobCategory(v);
    const d = jobTypesStore.getDuration(v);
    setJobDuration(String(d));
    const s = timeToMin(startTime);
    if (s != null) setEndTime(minToTime(s + d * 60));
  };

  // ── Working-hours range + technician overlap (US-4) ───────────────────────
  const schedSettings = scheduleSettingsStore.getSnapshot();
  const startMin = timeToMin(startTime);
  const endMin = timeToMin(endTime);
  const outOfRange =
    scheduleJob &&
    ((startMin != null && (startMin < schedSettings.startHour * 60 || startMin > schedSettings.endHour * 60)) ||
      (endMin != null && (endMin < schedSettings.startHour * 60 || endMin > schedSettings.endHour * 60)));
  // Overlap: prefer the board-supplied checker (sees the live board jobs); else
  // fall back to scanning the jobsStore for the same assignee + date + overlap.
  const fallbackConflict = (): boolean => {
    if (!scheduleJob || !assignedTo || !startDate || startMin == null || endMin == null || endMin <= startMin) return false;
    return jobsStore.getSnapshot().some((j) => {
      if (j.assignedTo !== assignedTo || j.startDate !== startDate || j.status === "Cancelled") return false;
      const js = timeToMin(j.startTime || ""); const je = timeToMin(j.endTime || "");
      if (js == null || je == null) return false;
      return startMin < je && js < endMin;
    });
  };
  const hasConflict =
    scheduleJob && assignedTo && startMin != null && endMin != null && endMin > startMin
      ? (checkConflict
          ? checkConflict({ assignedTo, startDate, startHour: startMin / 60, endHour: endMin / 60 })
          : fallbackConflict())
      : false;

  // Save gate: validate, block on overlap, then warn (non-blocking) if the job
  // falls outside working hours before committing via doSave().
  // A recurring create produces an unscheduled series, so the per-occurrence
  // scheduling checks (date / overlap / out-of-range) don't apply to it.
  const isRecurringCreate = !onSubmit && jobType === "recurring";
  const handleSave = () => {
    if (!client.trim()) { toast.error("Select a client before saving the job."); return; }
    // Service address is mandatory (PO decision) — it auto-fills from the client.
    if (!serviceStreet.trim()) { toast.error("Service address is required."); return; }
    // At least one line item is required to create/schedule a job (makes the
    // "Line Items *" marker real). EDIT mode (onSubmit) doesn't manage line items.
    if (!onSubmit && lineItems.length === 0) { toast.error("Add at least one line item before saving the job."); return; }
    if (!isRecurringCreate) {
      // Start date is required ONLY when scheduling a one-off job.
      if (scheduleJob && !startDate) { toast.error("Select a start date, or turn off “Schedule job”."); return; }
      // Overlap is a hard block — the inline error explains it.
      if (hasConflict) { toast.error("This technician already has a job in that time range."); return; }
      // Out-of-range only WARNS (non-blocking) — confirm via the modal.
      if (outOfRange) { setOutOfRangeOpen(true); return; }
    }
    doSave();
  };

  const doSave = () => {
    setOutOfRangeOpen(false);
    // EDIT mode: hand the collected values to the caller (which persists the
    // change in place) instead of creating a new job record.
    if (onSubmit) {
      onSubmit({ title, client: client.trim(), jobCategory, assignedTo, address: serviceStreet, startDate, endDate, startTime, endTime, scheduleJob });
      onClose?.();
      return;
    }

    const computedSubtotal = lineItems.reduce((s, li) => s + li.total, 0);
    const computedTaxable = lineItems.filter((li) => li.taxable).reduce((s, li) => s + li.total, 0);
    const computedTotal = computedSubtotal + computedTaxable * (taxRate / 100);
    const today = formatRegionalDate(new Date());

    // ── Recurring: generate a SERIES of unscheduled + unassigned jobs ──────────
    // (Marek, Jun 8 wizard + Jun 5 "those jobs are unassigned and unscheduled").
    if (jobType === "recurring") {
      const occurrences = expandRecurrence(buildRecurrenceRule(), new Date());
      const n = Math.max(1, occurrences.length);
      const clientId = liveClients.find((c) => c.name === client.trim())?.id ?? "";
      let firstRecord: ReturnType<typeof jobsStore.add> | null = null;
      occurrences.forEach((_d, i) => {
        const rec = jobsStore.add({
          jobNumber,
          title: `${title.trim() || "Untitled Job"} (${i + 1}/${n})`,
          client: client.trim(), clientId,
          address: serviceStreet, city: serviceCity, state: serviceState, zip: serviceZip, gateCode,
          assignedTo: "",                 // unassigned
          jobType: jobCategory || "Service", jobCategory,
          startDate: "", endDate: "", startTime: "", endTime: "", // unscheduled
          status: "Unscheduled",
          totalPrice: Math.round(computedTotal * 100) / 100,
          notes, fieldNotes, privateNotes, taxRate,
        });
        if (i === 0) firstRecord = rec;
      });
      toast.success(`Created ${n} recurring jobs (unscheduled) · ${describeRecurrence(buildRecurrenceRule())}`);
      if (asModal) { if (firstRecord) onCreated?.(firstRecord); onClose?.(); return; }
      navigate(returnTo || "/jobs");
      return;
    }

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
      // The first linked estimate is the primary back-compat link; the rest are
      // listed in the Estimates table (MVP keeps one structural link on the job).
      estimateId: fromEstimateId || linkedEstimates[0]?.id || undefined,
      estimateNumber: linkedEstimates[0]?.estimateNumber
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
    // Modal mode: hand the record back and close, leaving the calendar in place
    // (it re-renders from jobsStore). Page mode navigates to the new job.
    if (asModal) { onCreated?.(record); onClose?.(); return; }
    navigate(returnTo || `/jobs/${record.id}`);
  };

  // Service address dropdown is sourced from the selected client's address.
  const selClient = liveClients.find((c) => c.name === client.trim());
  const selClientAddress = selClient
    ? [selClient.address, selClient.city, selClient.state, selClient.zip].filter(Boolean).join(", ")
    : "";

  // Shared field styles (Figma: 36px tall, 8px radius, 14px Geist, subtle shadow).
  const fieldCls = "w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF]";
  const reqStar = <span className="text-[#DC2626]">*</span>;

  return (
    <CreateJobShell asModal={asModal} goBack={goBack} returnTo={returnTo} heading={heading}>
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 md:p-6 flex flex-col gap-6">

        {/* ── Job overview ── */}
        <FormSection label="Job overview">
          <div>
            <label className="block text-[14px] text-[#1A2332] mb-2" style={{ fontWeight: 500 }}>Job frequency {reqStar}</label>
            <div className="flex gap-4 border-b border-[#E5E7EB] pb-4">
              {([["one-off", "One-off"], ["recurring", "Recurring"]] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setJobType(val)}
                  className={`flex-1 flex items-start gap-3 rounded-[10px] border p-3 text-left transition-colors ${jobType === val ? "border-[#4A6FA5]" : "border-[#E5E7EB]"}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${jobType === val ? "border-[#4A6FA5]" : "border-[#E5E7EB]"}`}>
                    {jobType === val && <span className="h-2 w-2 rounded-full bg-[#4A6FA5]" />}
                  </span>
                  <span className="text-[14px] text-[#1A2332]">{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Job title {reqStar}</label>
              <input type="text" placeholder="e.g. AC Estimate" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Job type {reqStar}</label>
              <select value={jobCategory} onChange={(e) => onJobTypeChange(e.target.value)} className={fieldCls}>
                <option value="">Select job type</option>
                {availableJobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Client name {reqStar}</label>
              <div className="relative">
                <input
                  type="text"
                  value={clientPickerOpen ? clientSearch : client}
                  onFocus={() => { setClientSearch(client); setClientPickerOpen(true); }}
                  onClick={() => setClientPickerOpen(true)}
                  onChange={(e) => { setClientSearch(e.target.value); setClient(e.target.value); setClientPickerOpen(true); }}
                  placeholder="Select client"
                  className={`${fieldCls} pr-9 placeholder:text-[#9CA3AF]`}
                />
                <button
                  type="button"
                  onClick={() => { setClientSearch(client); setClientPickerOpen((open) => !open); }}
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
                          onClick={() => { setClient(mockClient.name); setClientSearch(mockClient.name); setServiceStreet(mockClient.address); setClientPickerOpen(false); }}
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
              <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Service address {reqStar}</label>
              <select value={serviceStreet} onChange={(e) => setServiceStreet(e.target.value)} disabled={!client.trim()} className={fieldCls}>
                <option value="">{client.trim() ? "Select service address" : "Select a client first"}</option>
                {selClientAddress && <option value={selClientAddress}>{selClientAddress}</option>}
                {serviceStreet && serviceStreet !== selClientAddress && <option value={serviceStreet}>{serviceStreet}</option>}
              </select>
            </div>
            <div>
              <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Assigned to</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={fieldCls}>
                <option value="">Unassigned</option>
                {fieldEmployees.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
        </FormSection>

        {/* ── Job period ── */}
        <FormSection label="Job period">
          <div className="border-b border-[#E5E7EB] pb-4">
            <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Job duration (hours)</label>
            <input type="number" min={0} step={0.5} placeholder="e.g. 1" value={jobDuration} onChange={(e) => syncDuration(e.target.value)} className={fieldCls} />
            <p className="mt-1 text-[12px] text-[#8899AA]">Defaults from the job type · syncs with the end time below</p>
          </div>

          {/* One-off: Schedule toggle + a single date/time. Recurring shows the
              wizard below instead (the series is created unscheduled). */}
          {jobType === "one-off" && (<>
          {/* Schedule job toggle — bordered row (Figma "Item"). */}
          <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-4 py-3">
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Schedule job</span>
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
          </div>

          {scheduleJob && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Start date {reqStar}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Start time {reqStar}</label>
                  <input type="time" step={60} value={startTime} onChange={(e) => syncStartTime(e.target.value)} className={`${fieldCls} ${hasConflict ? "border-[#DC2626]" : ""}`} />
                </div>
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>End time {reqStar}</label>
                  <input type="time" step={60} value={endTime} onChange={(e) => syncEndTime(e.target.value)} className={`${fieldCls} ${hasConflict ? "border-[#DC2626]" : ""}`} />
                </div>
              </div>
              {/* US-4 out-of-range: non-blocking hint (a confirm modal also appears on save). */}
              {outOfRange && !hasConflict && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#B45309]">
                  <span className="material-icons" style={{ fontSize: "15px" }}>schedule</span>
                  Outside working hours ({formatScheduleHour(schedSettings.startHour)}–{formatScheduleHour(schedSettings.endHour)}). You can still schedule it.
                </p>
              )}
              {/* US-4 overlap: inline error at the bottom of the section. */}
              {hasConflict && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#DC2626]" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "15px" }}>error_outline</span>
                  {assignedTo} already has a job in this time range. Pick another time or technician.
                </p>
              )}
            </>
          )}
          </>)}

          {/* ── Recurring wizard (Marek, Jun 8). Generates a series of unscheduled jobs. ── */}
          {jobType === "recurring" && (
            <div className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] p-4">
              <p className="text-[13px] text-[#546478]">Creates a series of <span style={{ fontWeight: 600 }}>unscheduled</span> jobs you can schedule on the board later.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Repeat</label>
                  <select value={recFreq} onChange={(e) => setRecFreq(e.target.value as RecurrenceFrequency)} className={fieldCls}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Every</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={recInterval} onChange={(e) => setRecInterval(e.target.value)} className={`${fieldCls} w-20`} />
                    <span className="text-[14px] text-[#546478]">{recFreq === "daily" ? "day(s)" : recFreq === "weekly" ? "week(s)" : recFreq === "monthly" ? "month(s)" : "year(s)"}</span>
                  </div>
                </div>
              </div>
              {recFreq === "weekly" && (
                <div>
                  <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>On days</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((lbl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRecWeekdays((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))}
                        className={`w-9 h-9 rounded-lg text-[12px] border transition-colors ${recWeekdays.includes(i) ? "bg-[#4A6FA5] text-white border-[#4A6FA5]" : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA]"}`}
                        style={{ fontWeight: 600 }}
                      >
                        {lbl[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Ends</label>
                <div className="flex items-center gap-2">
                  <input type="radio" name="recEnd" checked={recEndMode === "count"} onChange={() => setRecEndMode("count")} />
                  <span className="text-[14px] text-[#1A2332]">After</span>
                  <input type="number" min={1} value={recCount} onChange={(e) => setRecCount(e.target.value)} disabled={recEndMode !== "count"} className={`${fieldCls} w-20 ${recEndMode !== "count" ? "opacity-50" : ""}`} />
                  <span className="text-[14px] text-[#546478]">occurrence(s)</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="radio" name="recEnd" checked={recEndMode === "date"} onChange={() => setRecEndMode("date")} />
                  <span className="text-[14px] text-[#1A2332]">On date</span>
                  <input type="date" value={recEndDate} onChange={(e) => setRecEndDate(e.target.value)} disabled={recEndMode !== "date"} className={`${fieldCls} w-44 ${recEndMode !== "date" ? "opacity-50" : ""}`} />
                </div>
              </div>
              <p className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                {(() => { const occ = expandRecurrence(buildRecurrenceRule(), new Date()); return `Creates ${occ.length} job${occ.length === 1 ? "" : "s"} · ${describeRecurrence(buildRecurrenceRule())}`; })()}
              </p>
            </div>
          )}
        </FormSection>

        {/* ── Estimates ── */}
        <FormSection label="Estimates">
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB]">
              <div className="relative max-w-[300px] flex-1">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                <input
                  type="text"
                  value={estSearch}
                  onChange={(e) => setEstSearch(e.target.value)}
                  onFocus={() => client.trim() && setEstPickerOpen(true)}
                  disabled={!client.trim()}
                  placeholder="Search estimates..."
                  className="w-full h-8 pl-8 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] bg-white outline-none focus:border-[#4A6FA5] disabled:bg-[#F5F7FA] disabled:opacity-60"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEstPickerOpen((o) => !o)}
                  disabled={!client.trim()}
                  className="h-8 px-3 bg-[#4A6FA5] text-white rounded-lg text-[13px] inline-flex items-center gap-1.5 hover:bg-[#3d5a85] disabled:opacity-50"
                  style={{ fontWeight: 500 }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add estimate
                </button>
                {estPickerOpen && (
                  <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[320px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg max-h-[240px] overflow-y-auto py-1">
                    {availableEstimates.length === 0 ? (
                      <div className="px-3 py-3 text-[12px] text-[#8899AA]">No eligible estimates</div>
                    ) : availableEstimates.map((e) => (
                      <button key={e.id} type="button" onClick={() => addEstimate(e)} className="w-full text-left px-3 py-2 hover:bg-[#F5F7FA]">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{e.estimateNumber}{e.estimateName ? ` — ${e.estimateName}` : ""}</div>
                        <div className="text-[11px] text-[#8899AA]">{e.status} · ${fmt(estimateAmount(e))}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
                  <th className="px-4 py-2 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Estimate</th>
                  <th className="px-4 py-2 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Created by</th>
                  <th className="px-4 py-2 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Status</th>
                  <th className="px-4 py-2 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Amount</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {linkedEstimates.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#8899AA]">No estimates linked</td></tr>
                ) : linkedEstimates.map((l) => (
                  <tr key={l.id} className="border-b border-[#F1F3F7] last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{l.estimateNumber}</div>
                      {l.estimateName && <div className="text-[12px] text-[#8899AA]">{l.estimateName}</div>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#374151]">{l.createdBy}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px]" style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#16A34A", fontWeight: 500 }}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(l.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeEstimate(l.id)} className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-[#FEE2E2]" aria-label="Remove estimate">
                        <span className="material-icons text-[#9CA3AF] hover:text-[#DC2626]" style={{ fontSize: "16px" }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {linkedEstimates.length > 0 && (
              <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-4 py-3 bg-[#F5F7FA]">
                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Total:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(estimatesTotal)}</span>
              </div>
            )}
          </div>
        </FormSection>

        {/* ── Line Items ── */}
        <FormSection label="Line Items" required>
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB]">
              <div className="relative max-w-[300px] flex-1 opacity-60">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                <input type="text" disabled placeholder="Search items..." className="w-full h-8 pl-8 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] bg-white outline-none" />
              </div>
              <button
                type="button"
                onClick={() => setItemPickerOpen(true)}
                className="h-8 px-3 bg-[#4A6FA5] text-white rounded-lg text-[13px] inline-flex items-center gap-1.5 hover:bg-[#3d5a85]"
                style={{ fontWeight: 500 }}
              >
                <PlusIcon className="h-4 w-4" />
                Add item
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
                  <th className="px-4 py-2 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Item</th>
                  <th className="px-4 py-2 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Quantity</th>
                  <th className="px-4 py-2 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Unit price</th>
                  <th className="px-4 py-2 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Unit cost</th>
                  <th className="px-4 py-2 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Total</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#8899AA]">No items added yet — click “Add item”.</td></tr>
                ) : lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#F1F3F7] last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                      {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                        className="w-[84px] h-8 px-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none focus:border-[#4A6FA5]"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-[#6B7280]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeLineItem(item.id)} className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-[#FEE2E2]" aria-label="Remove item">
                        <span className="material-icons text-[#9CA3AF] hover:text-[#DC2626]" style={{ fontSize: "16px" }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lineItems.length > 0 && (
              <div className="border-t border-[#E5E7EB] px-4 py-4 bg-[#F5F7FA]">
                <div className="ml-auto w-[285px] space-y-2">
                  <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                    <span>Subtotal:</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                    <span>Taxable amount:</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                    <span>Tax ({taxRate}%):</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2 text-[14px]">
                    <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>Total:</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* ── Notes ── */}
        <FormSection label="Job Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible on the job..." className="w-full min-h-[76px] resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]" />
        </FormSection>
        <FormSection label="Field Notes">
          <textarea value={fieldNotes} onChange={(e) => setFieldNotes(e.target.value)} placeholder="Technician notes..." className="w-full min-h-[76px] resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]" />
        </FormSection>
        <FormSection label="Internal Notes" last>
          <textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} placeholder="Internal private notes..." className="w-full min-h-[76px] resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]" />
        </FormSection>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-2">
          <button onClick={goBack} className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!client.trim() || (!onSubmit && lineItems.length === 0)}
            title={!onSubmit && lineItems.length === 0 ? "Add at least one line item first" : undefined}
            className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 500 }}
          >
            {submitLabel ?? "Save job"}
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

      {/* US-4 out-of-range confirm — warns but does not block. */}
      {outOfRangeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setOutOfRangeOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(28,43,58,0.10)" }} />
          <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-2xl border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="material-icons text-[#B45309] mt-0.5" style={{ fontSize: "22px" }}>schedule</span>
              <div>
                <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Outside working hours</h3>
                <p className="mt-1 text-[14px] text-[#546478]">
                  This job is outside your working hours ({formatScheduleHour(schedSettings.startHour)}–{formatScheduleHour(schedSettings.endHour)}). Schedule it anyway?
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOutOfRangeOpen(false)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={doSave} className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>
                Schedule anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </CreateJobShell>
  );
}

/**
 * Figma "form_container": section label on the left, the form column on the
 * right, divided by a bottom border. The last section omits the divider.
 */
function FormSection({ label, required, last, children }: { label: string; required?: boolean; last?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:gap-10 ${last ? "" : "border-b border-[#E5E7EB] pb-6"}`}>
      <h3 className="md:w-[220px] md:shrink-0 text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>
        {label} {required && <span className="text-[#DC2626]">*</span>}
      </h3>
      <div className="flex-1 min-w-0 md:max-w-[777px] flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Page vs. modal chrome for {@link CreateJob}. Page mode keeps the back link +
 * PageHeader; modal mode renders the Figma overlay + centered card with a
 * "Create job" title and close button. The form body is identical in both.
 */
function CreateJobShell({
  asModal,
  goBack,
  returnTo,
  heading,
  children,
}: {
  asModal: boolean;
  goBack: () => void;
  returnTo: string | null;
  heading?: string;
  children: ReactNode;
}) {
  if (asModal) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ background: "rgba(28,43,58,0.10)" }}
        onClick={goBack}
      >
        <div className="min-h-full flex items-start justify-center p-4">
          <div
            className="relative my-4 w-[min(1100px,96vw)] bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "32px" }}>
                {heading ?? "Create job"}
              </h2>
              <button
                onClick={goBack}
                aria-label="Close"
                className="w-9 h-9 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center text-[#1A2332]"
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-6 pt-5">{children}</div>
          </div>
        </div>
      </div>
    );
  }

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
        <PageHeader title="Create Job" className="mb-6" />
        {children}
      </div>
    </div>
  );
}
