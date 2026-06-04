import { useState, useMemo, useRef, useSyncExternalStore, useEffect, type DragEvent, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../components/ui/page-header";
import { scheduleSettingsStore } from "../stores/scheduleSettingsStore";
import { businessHoursStore, isDateOpenForBusiness } from "../stores/businessHoursStore";
import { jobTypesStore } from "../stores/jobTypesStore";
import { formatRegionalDate, formatRegionalTime, getWeekStartsOn, regionalSettingsStore } from "../stores/regionalSettingsStore";
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays,
} from "date-fns";
import routeMapImg from "../../assets/route-map.png";
import { type JobStatus, JOB_STATUS_STYLES as STATUS_STYLES, JOB_STATUSES as ALL_JOB_STATUSES } from "../constants/jobStatuses";
import { isPending, pendingJobs, type PendingFilter, hasTimeConflict, statusAfterAssignToSlot, statusAfterMoveToPending, durationForType, isDraggable, isShownOnBoard } from "../utils/scheduleLogic";
import { jobTypeColor, jobTypeTint, JOB_TYPE_ORDER, JOB_TYPE_COLORS } from "../constants/jobTypeColors";

interface CalendarEvent {
  id: number;
  title: string;
  client: string;
  date: Date;
  startHour: number;
  duration: number;
  color: string;
  status: JobStatus;
  property: string;
  amount: number;
  // Drives month-cell card colour (Figma legend); see jobTypeColors.
  jobType?: string;
}

interface DispatchJob {
  id: number;
  num: string;
  technicianId: string;
  client: string;
  service: string;
  address: string;
  status: JobStatus;
  dayIdx: number;
  start: number;
  end: number;
  amount: number;
  bg: string;
  border: string;
  priority: string;
  jobType: string;
  source: string;
}

const COLORS = {
  blue:   { bg: "#EBF0F8", border: "#4A6FA5", text: "#1A2332", accent: "#4A6FA5" },
  amber:  { bg: "#FEF3C7", border: "#D97706", text: "#92400E", accent: "#D97706" },
  green:  { bg: "#D1FAE5", border: "#16A34A", text: "#14532D", accent: "#16A34A" },
  red:    { bg: "#FEE2E2", border: "#DC2626", text: "#7F1D1D", accent: "#DC2626" },
  purple: { bg: "#EDE9FE", border: "#7C3AED", text: "#4C1D95", accent: "#7C3AED" },
};


// Pill-styled <select> used in job-detail popovers so dispatchers can flip
// status to Cancelled / Paused without leaving the schedule (BUG-S05).
function StatusPillSelect({ value, onChange }: { value: JobStatus; onChange: (next: JobStatus) => void }) {
  const styles = STATUS_STYLES[value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      aria-label="Change job status"
      className="appearance-none cursor-pointer rounded-full px-2 pr-5 py-0.5 text-[10px] outline-none focus:ring-2 focus:ring-[#4A6FA5]/30 bg-no-repeat"
      style={{
        fontWeight: 600,
        backgroundColor: styles.bg,
        color: styles.color,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='${encodeURIComponent(styles.color)}'><path d='M3 4.5l3 3 3-3'/></svg>")`,
        backgroundPosition: "right 4px center",
        backgroundSize: "8px 8px",
      }}
    >
      {ALL_JOB_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

const nextStatus = (status: JobStatus): JobStatus => {
  if (status === "Scheduled") return "Dispatched";
  if (status === "Dispatched") return "In Progress";
  if (status === "In Progress") return "Completed";
  if (status === "Completed") return "Scheduled";
  if (status === "Paused") return "In Progress";
  // Cancelled stays Cancelled when click-cycled; user must explicitly pick another via the dropdown.
  return status;
};

// Demo events anchored relative to today so the schedule always opens on a populated week.
const _schedBase = new Date(); _schedBase.setHours(0, 0, 0, 0);
const schedDay = (offset: number) => { const d = new Date(_schedBase); d.setDate(d.getDate() + offset); return d; };

const mockEvents: CalendarEvent[] = [
  { id: 1,  title: "AC Installation",      client: "Travis Jones",  date: schedDay(0),  startHour: 9,  duration: 2,   color: "blue",   jobType: "Installation", status: "Scheduled",   property: "4405 N Clark Ave", amount: 2850 },
  { id: 2,  title: "Plumbing Repair",       client: "Sarah Johnson", date: schedDay(0),  startHour: 13, duration: 1.5, color: "amber",  jobType: "Service",      status: "In Progress", property: "1220 Elm St",      amount: 425  },
  { id: 3,  title: "HVAC Maintenance",      client: "Mike Davis",    date: schedDay(0),  startHour: 15, duration: 1,   color: "green",  jobType: "Maintenance",  status: "Completed",   property: "890 Oak Dr",       amount: 129  },
  { id: 4,  title: "Electrical Inspection", client: "Lisa Brown",    date: schedDay(1),  startHour: 10, duration: 2,   color: "purple", jobType: "Estimate",     status: "Scheduled",   property: "567 Pine Rd",      amount: 175  },
  { id: 5,  title: "Tree Removal",          client: "James Wilson",  date: schedDay(2),  startHour: 8,  duration: 4,   color: "red",    jobType: "Emergency",    status: "Scheduled",   property: "234 Maple Ln",     amount: 850  },
  { id: 6,  title: "Gutter Cleaning",       client: "Anna Lee",      date: schedDay(3),  startHour: 11, duration: 1.5, color: "blue",   jobType: "Maintenance",  status: "Scheduled",   property: "56 Birch Ct",      amount: 180  },
  { id: 7,  title: "Fence Repair",          client: "Tom Richards",  date: schedDay(-1), startHour: 9,  duration: 3,   color: "amber",  jobType: "Service",      status: "Scheduled",   property: "12 Cedar Way",     amount: 625  },
  { id: 8,  title: "Lawn Service",          client: "Emily Clark",   date: schedDay(-2), startHour: 8,  duration: 2,   color: "green",  jobType: "Maintenance",  status: "Scheduled",   property: "88 Willow Dr",     amount: 95   },
  { id: 9,  title: "Roof Inspection",       client: "David Park",    date: schedDay(2),  startHour: 10, duration: 2.5, color: "blue",   jobType: "Estimate",     status: "Scheduled",   property: "321 Aspen Blvd",  amount: 250  },
  { id: 10, title: "Window Install",        client: "Karen White",   date: schedDay(5),  startHour: 9,  duration: 5,   color: "purple", jobType: "Installation", status: "Scheduled",   property: "45 Spruce Rd",     amount: 1450 },
];

// Customers and their saved service locations — powers the create-job customer/address pickers.
const CUSTOMERS: { name: string; locations: string[] }[] = [
  { name: "John Smith",    locations: ["123 Main St, Tampa, FL 33602", "4820 Cypress Creek Blvd, Tampa, FL 33613"] },
  { name: "Sarah Johnson", locations: ["1220 Elm St, Tampa, FL 33606"] },
  { name: "Mike Davis",    locations: ["890 Oak Dr, Tampa, FL 33611", "910 Harbour Island Blvd, Tampa, FL 33602"] },
  { name: "Robert Lee",    locations: ["567 Pine Rd, Brandon, FL 33510"] },
  { name: "Emily Parker",  locations: ["234 Maple Ln, Riverview, FL 33578", "56 Birch Ct, Riverview, FL 33578", "12 Cedar Way, Riverview, FL 33579"] },
  { name: "Tom Carter",    locations: ["321 Aspen Blvd, Tampa, FL 33647"] },
];

const dispatchJobs: DispatchJob[] = [
  { id: 1,  num: "2401", technicianId: "peter",  client: "Smith Resi...",  service: "AC Repair",       address: "123 Main St",     status: "Scheduled",   dayIdx: 1, start: 8,    end: 10,   amount: 89,   bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Service",      source: "Phone" },
  { id: 2,  num: "2402", technicianId: "travis", client: "Miller Resi...", service: "AC Repair",       address: "862 Pine St",     status: "In Progress", dayIdx: 1, start: 8,    end: 10,   amount: 210,  bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Service",      source: "Web"   },
  { id: 3,  num: "2403", technicianId: "maria",  client: "Brown Ho...",    service: "AC Repair",       address: "456 Elm St",      status: "Completed",   dayIdx: 1, start: 10,   end: 12,   amount: 385,  bg: "#FEF3C7", border: "#D97706", priority: "High",   jobType: "Service",      source: "Phone" },
  { id: 4,  num: "2404", technicianId: "peter",  client: "Wilson Ho...",   service: "AC Tune-Up",      address: "135 Cedar Dr",    status: "Scheduled",   dayIdx: 2, start: 8,    end: 10,   amount: 2005, bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Maintenance",  source: "App"   },
  { id: 5,  num: "2405", technicianId: "travis", client: "Taylor Home",    service: "Water Heater",    address: "852 Bay St",      status: "Scheduled",   dayIdx: 2, start: 8,    end: 11,   amount: 2005, bg: "#EDE9FE", border: "#7C3AED", priority: "Normal", jobType: "Installation", source: "Phone" },
  { id: 6,  num: "2406", technicianId: "travis", client: "Jackson R...",   service: "Leak Repair",     address: "951 Lake Dr",     status: "In Progress", dayIdx: 2, start: 11.5, end: 13.5, amount: 320,  bg: "#FEE2E2", border: "#DC2626", priority: "High",   jobType: "Emergency",    source: "Phone" },
  { id: 7,  num: "2407", technicianId: "maria",  client: "Moore Resi...",  service: "AC Repair",       address: "753 Spruce St",   status: "Scheduled",   dayIdx: 2, start: 12.5, end: 14.5, amount: 129,  bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Service",      source: "Web"   },
  { id: 8,  num: "2408", technicianId: "peter",  client: "Clark Resi...",  service: "Receiver Upgr.",  address: "951 Hillside Dr", status: "Scheduled",   dayIdx: 4, start: 8,    end: 10,   amount: 2400, bg: "#D1FAE5", border: "#16A34A", priority: "Normal", jobType: "Installation", source: "App"   },
  { id: 9,  num: "2409", technicianId: "maria",  client: "Hall Home",      service: "Receiver Upgr.",  address: "753 Summit St",   status: "Scheduled",   dayIdx: 4, start: 10.5, end: 12,   amount: 750,  bg: "#EDE9FE", border: "#7C3AED", priority: "Normal", jobType: "Installation", source: "Web"   },
  { id: 10, num: "2410", technicianId: "travis", client: "Lewis Resi...",  service: "Wiring Inspec.",  address: "952 Ridge Dr",    status: "Completed",   dayIdx: 5, start: 13,   end: 15,   amount: 180,  bg: "#FEF3C7", border: "#D97706", priority: "Normal", jobType: "Maintenance",  source: "Phone" },
];

// ── Day View Data ──────────────────────────────────────────────────────────────
interface DayJob {
  id: number;
  technicianId: string;
  start: number;
  end: number;
  client: string;
  service: string;
  address: string;
  status: JobStatus;
  amount: number;
  bg: string;
  border: string;
  // Drives the card colour (border + tint) + legend, per the Figma design:
  // Service / Maintenance / Installation / Estimate / Emergency.
  jobType?: string;
  // Unscheduled = no fixed date/time yet (may or may not have a technician).
  // Such jobs live in the Pending column until a date is set.
  unscheduled?: boolean;
}

interface QuickJobDraft {
  view: "day" | "week";
  date: Date;
  dayIdx?: number;
  technicianId: string;
  start: number;
  end: number;
  client: string;
  service: string;
  address: string;
  amount: string;
}

interface DropPreview {
  view: "day" | "week";
  technicianId: string;
  dayIdx?: number;
  start: number;
}

// Team operating the schedule. Core tier supports 1–3 people (solo operator
// or solo + up to 2 helpers). Extend this array to add helpers — every other
// piece of the calendar (day view rows, week view sub-rows, route numbers)
// derives from it.
const TEAM: { id: string; name: string; initial: string; color: string }[] = [
  { id: "peter", name: "Peter Novak", initial: "PN", color: "#4A6FA5" },
  { id: "travis", name: "Travis Brown", initial: "TB", color: "#16A34A" },
  { id: "maria", name: "Maria Garcia", initial: "MG", color: "#D97706" },
];

const DAY_JOBS: DayJob[] = [
  { id: 1,  technicianId: "peter",  start: 8,    end: 10,   client: "Miller Residence",  service: "AC Repair",          jobType: "Service",      address: "862 Pine St",          status: "Scheduled",   amount: 420,  bg: "#FEF3C7", border: "#F59E0B" },
  { id: 2,  technicianId: "peter",  start: 10.5, end: 12,   client: "Taylor Home",       service: "Water Heater",       jobType: "Installation", address: "852 Bay St",           status: "In Progress", amount: 1150, bg: "#EBF0F8", border: "#4A6FA5" },
  { id: 3,  technicianId: "peter",  start: 13,   end: 15,   client: "Clark Residence",   service: "Receiver Upgrade",   jobType: "Installation", address: "951 Hillside Dr",      status: "Scheduled",   amount: 2400, bg: "#EBF0F8", border: "#4A6FA5" },
  { id: 4,  technicianId: "peter",  start: 15,   end: 17,   client: "Johnson Residence", service: "AC Not Cooling",     jobType: "Service",      address: "1250 Oak Dr",          status: "Completed",   amount: 750,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 5,  technicianId: "travis", start: 8,    end: 10,   client: "Williams Home",     service: "Install New System", jobType: "Installation", address: "5332 Pine Ridge Rd",   status: "Scheduled",   amount: 1800, bg: "#D1FAE5", border: "#16A34A" },
  { id: 6,  technicianId: "travis", start: 11.5, end: 13.5, client: "Jackson Residence", service: "Leak Repair",        jobType: "Emergency",    address: "951 Lake Dr",          status: "In Progress", amount: 2005, bg: "#FEE2E2", border: "#DC2626" },
  { id: 7,  technicianId: "travis", start: 14,   end: 16,   client: "Cooper Office",     service: "Maintenance",        jobType: "Maintenance",  address: "600 Main St",          status: "Scheduled",   amount: 450,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 8,  technicianId: "maria",  start: 10,   end: 12,   client: "Brown Home",        service: "AC Repair",          jobType: "Service",      address: "456 Elm St",           status: "Completed",   amount: 385,  bg: "#FEE2E2", border: "#DC2626" },
  { id: 9,  technicianId: "maria",  start: 13,   end: 14.5, client: "Anderson Office",   service: "Duct Cleaning",      jobType: "Maintenance",  address: "777 Business Park Dr", status: "Scheduled",   amount: 600,  bg: "#FEE2E2", border: "#DC2626" },
  { id: 10, technicianId: "maria",  start: 15.5, end: 17.5, client: "Hall Home",         service: "Water Heater",       jobType: "Installation", address: "753 Summit St",        status: "Scheduled",   amount: 750,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 11, technicianId: "maria",  start: 8,    end: 9,    client: "Smith Residence",   service: "Estimate",           jobType: "Estimate",     address: "123 Oak St",           status: "Scheduled",   amount: 0,    bg: "#F3F4F6", border: "#6B7280" },
  // Unassigned jobs (no technicianId yet) — show up in the right-side
  // "Unassigned" panel so a dispatcher can drag them onto a tech's lane.
  { id: 12, technicianId: "",       start: 9,    end: 11,   client: "Garcia Residence",  service: "AC Repair",          jobType: "Service",      address: "320 Birch Ln",         status: "Scheduled",   amount: 380,  bg: "#FEF3C7", border: "#F59E0B" },
  { id: 13, technicianId: "",       start: 13,   end: 14,   client: "Nguyen Home",       service: "Estimate",           jobType: "Estimate",     address: "12 Sunset Ave",        status: "Scheduled",   amount: 0,    bg: "#F3F4F6", border: "#6B7280" },
  { id: 14, technicianId: "",       start: 15,   end: 17,   client: "Patel Office",      service: "Maintenance",        jobType: "Maintenance",  address: "880 Commerce Blvd",    status: "Scheduled",   amount: 220,  bg: "#D1FAE5", border: "#16A34A" },
  // Unscheduled jobs — no fixed date/time yet (waiting on the customer). The
  // no-date state is derived from `unscheduled`, NOT a status: these keep a
  // workflow status (Scheduled) and show "No date" in the Pending column.
  { id: 15, technicianId: "",       start: 9,    end: 10,   client: "Clark Residence",   service: "AC Install",         jobType: "Installation", address: "951 Hillside Dr",      status: "Scheduled",   amount: 4200, bg: "#EDE9FE", border: "#7C3AED", unscheduled: true },
  { id: 16, technicianId: "",       start: 9,    end: 10,   client: "Reyes Home",        service: "Furnace Tune-Up",    jobType: "Maintenance",  address: "44 Vista Way",         status: "Scheduled",   amount: 160,  bg: "#FEF3C7", border: "#F59E0B", unscheduled: true },
];

// Day view constants
const GANTT_START_HOUR = 7;   // 7 AM
const GANTT_END_HOUR   = 18;  // 6 PM (exclusive label at 18)
const HOUR_WIDTH       = 120; // px per hour (matches Figma schedule columns)
const CURRENT_TIME     = 10.5; // 10:30 AM
const WEEK_LABEL_WIDTH = 180; // matches the day-view technician column
const WEEK_TODAY = _schedBase; // today, highlighted in the week view

// Route-map pin layout — matches the Figma day view (node 746:71297). left/top are
// percentages of the map container; n is each technician's stop order on the route.
const ROUTE_MAP_PINS: { technicianId: string; n: number; left: number; top: number }[] = [
  { technicianId: "travis", n: 1, left: 12.9, top: 33.2 },
  { technicianId: "maria",  n: 1, left: 37.2, top: 24.7 },
  { technicianId: "maria",  n: 2, left: 57.4, top: 34.2 },
  { technicianId: "peter",  n: 1, left: 77.8, top: 20.5 },
  { technicianId: "travis", n: 3, left: 96.2, top: 10.0 },
  { technicianId: "maria",  n: 3, left: 37.2, top: 68.4 },
  { technicianId: "travis", n: 2, left: 65.7, top: 69.7 },
  { technicianId: "peter",  n: 2, left: 91.4, top: 61.3 },
  { technicianId: "peter",  n: 3, left: 52.5, top: 85.5 },
];

type ViewMode = "month" | "week" | "day";
type SidebarTab = "Details" | "Notes" | "History";
type SlotPointerEvent = DragEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>;

const VIEW_MODE_STORAGE_KEY = "vision360.calendar.viewMode";

const readPersistedViewMode = (): ViewMode => {
  if (typeof localStorage === "undefined") return "week";
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "day" || stored === "week" || stored === "month" ? stored : "week";
};

export function Calendar() {
  const navigate = useNavigate();
  const scheduleSettings = useSyncExternalStore(scheduleSettingsStore.subscribe, scheduleSettingsStore.getSnapshot);
  const businessHours = useSyncExternalStore(businessHoursStore.subscribe, businessHoursStore.getSnapshot);
  const regionalSettings = useSyncExternalStore(regionalSettingsStore.subscribe, regionalSettingsStore.getSnapshot);
  const jobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  const GANTT_START_HOUR = scheduleSettings.startHour;
  const GANTT_END_HOUR = scheduleSettings.endHour;
  const SLOT_HOURS = scheduleSettings.slotMinutes / 60;
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readPersistedViewMode());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDispatchJob, setSelectedDispatchJob] = useState<DispatchJob | null>(null);
  const [selectedDayJob, setSelectedDayJob] = useState<DayJob | null>(null);
  const [weekJobs, setWeekJobs] = useState<DispatchJob[]>(dispatchJobs);
  const [dayJobs, setDayJobs] = useState<DayJob[]>(DAY_JOBS);
  // Right-side "Unassigned" panel: open by default so dispatchers see what
  // still needs an owner. Toggle from the schedule header chip.
  const [unassignedPanelOpen, setUnassignedPanelOpen] = useState(true);
  // "Pending jobs" bucket = everything still in the right column: no technician
  // (unassigned) and/or no fixed date/time (unscheduled). The filter narrows it.
  const [pendingFilter, setPendingFilter] = useState<PendingFilter>("all");
  const pendingBucket = dayJobs.filter(isPending);
  const pendingDayJobs = pendingJobs(dayJobs, pendingFilter);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>(mockEvents);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [pendingDropActive, setPendingDropActive] = useState(false);
  const [quickJobDraft, setQuickJobDraft] = useState<QuickJobDraft | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [selectedMapJobId, setSelectedMapJobId] = useState<number | null>(DAY_JOBS[0]?.id ?? null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Details");
  const [jobNotes, setJobNotes] = useState<Record<string, string[]>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedWeekDays, setCollapsedWeekDays] = useState<Set<number>>(() => new Set());
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const weekTodayRef = useRef<HTMLDivElement>(null);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof localStorage !== "undefined") localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Reset sidebar tab when selection changes
  useEffect(() => {
    setSidebarTab("Details");
    setNoteDraft("");
  }, [selectedDispatchJob?.id, selectedDayJob?.id, selectedEvent?.id]);

  // Week view: auto-scroll today's section into view when entering the view or changing weeks.
  // The active vertical scroller may be the gantt itself or a page-level container (the card
  // grows to fit content), so walk up to the nearest scrollable ancestor and scroll that.
  useEffect(() => {
    if (viewMode !== "week") return;
    const target = weekTodayRef.current;
    if (!target) return;
    const raf = requestAnimationFrame(() => {
      let el: HTMLElement | null = target.parentElement;
      let scroller: HTMLElement | null = null;
      while (el) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 4) {
          scroller = el;
          break;
        }
        el = el.parentElement;
      }
      if (scroller) {
        const cRect = scroller.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        scroller.scrollTop += tRect.top - cRect.top - 12;
      } else {
        target.scrollIntoView({ block: "start" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [viewMode, currentDate]);

  const goBack = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const goForward = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date(2026, 3, 12));
  const toggleWeekDay = (dayI: number) =>
    setCollapsedWeekDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayI)) next.delete(dayI); else next.add(dayI);
      return next;
    });

  // Notes / history helpers
  const activeJobKey = selectedDispatchJob
    ? `dispatch:${selectedDispatchJob.id}`
    : selectedDayJob
    ? `day:${selectedDayJob.id}`
    : selectedEvent
    ? `event:${selectedEvent.id}`
    : null;
  const notesForActive = activeJobKey ? jobNotes[activeJobKey] ?? [] : [];
  const addNote = () => {
    if (!activeJobKey || !noteDraft.trim()) return;
    const entry = `${format(new Date(), "MMM d, yyyy h:mm a")} — ${noteDraft.trim()}`;
    setJobNotes((prev) => ({ ...prev, [activeJobKey]: [entry, ...(prev[activeJobKey] ?? [])] }));
    setNoteDraft("");
    setToast("Note added");
  };

  // Job history derived from current state (status + assignment for the selected job)
  const historyForActive = useMemo(() => {
    const entries: { when: string; label: string }[] = [];
    if (selectedDispatchJob) {
      entries.push({ when: "Today", label: `Status: ${selectedDispatchJob.status}` });
      entries.push({ when: "Today", label: `Assigned to ${TEAM.find((t) => t.id === selectedDispatchJob.technicianId)?.name ?? "Unassigned"}` });
      entries.push({ when: "On create", label: `Job created via ${selectedDispatchJob.source}` });
    } else if (selectedDayJob) {
      entries.push({ when: "Today", label: `Status: ${selectedDayJob.status}` });
      entries.push({ when: "Today", label: `Assigned to ${TEAM.find((t) => t.id === selectedDayJob.technicianId)?.name ?? "Unassigned"}` });
      entries.push({ when: "On create", label: "Job scheduled" });
    } else if (selectedEvent) {
      entries.push({ when: "Today", label: `Status: ${selectedEvent.status}` });
      entries.push({ when: "Today", label: `Assigned to ${TEAM[(selectedEvent.id - 1) % TEAM.length].name}` });
      entries.push({ when: "On create", label: "Job scheduled" });
    }
    return entries;
  }, [selectedDispatchJob, selectedDayJob, selectedEvent]);

  // Quick contact actions: phone -> tel link, chat -> messaging center
  const handlePhoneClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.location.href = "tel:+18132867572";
  };
  const handleChatClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("vision360:open-messaging"));
    setToast("Opening messaging…");
  };

  const monthDays = useMemo(() => {
    const weekStartsOn = getWeekStartsOn(regionalSettings);
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [currentDate, regionalSettings]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: getWeekStartsOn(regionalSettings) });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate, regionalSettings]);

  // Week view defaults to ALL days collapsed except today (per the design).
  // Resets whenever the visible week changes; user toggles persist within a
  // week. Closed days are collapsed regardless, so this only decides which open
  // day starts expanded.
  const weekStartKey = weekDays[0] ? format(weekDays[0], "yyyy-MM-dd") : "";
  useEffect(() => {
    const todayIdx = weekDays.findIndex((d) => isSameDay(d, WEEK_TODAY));
    const collapsed = new Set<number>();
    weekDays.forEach((_, i) => { if (i !== todayIdx) collapsed.add(i); });
    setCollapsedWeekDays(collapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartKey]);

  const isCurrentDateOpen = isDateOpenForBusiness(currentDate, businessHours);
  const getEventsForDay = (day: Date) => isDateOpenForBusiness(day, businessHours)
    ? monthEvents.filter(e => isSameDay(e.date, day))
    : [];
  const getC = (color: string) => COLORS[color as keyof typeof COLORS] || COLORS.blue;

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewMode === "week"
    ? `${formatRegionalDate(weekDays[0], regionalSettings)} - ${formatRegionalDate(weekDays[6], regionalSettings)}`
    : `${format(currentDate, "EEEE")}, ${formatRegionalDate(currentDate, regionalSettings)}`;

  // Gantt grid total width
  const ganttHours = Array.from({ length: GANTT_END_HOUR - GANTT_START_HOUR + 1 }, (_, i) => GANTT_START_HOUR + i);
  const ganttTotalWidth = (GANTT_END_HOUR - GANTT_START_HOUR) * HOUR_WIDTH;
  const openWeekDayIndexes = new Set(weekDays.map((day, index) => isDateOpenForBusiness(day, businessHours) ? index : -1).filter(index => index >= 0));
  const filteredMonthEvents = monthEvents.filter(event => isDateOpenForBusiness(event.date, businessHours));
  const filteredWeekJobs = weekJobs.filter(job => openWeekDayIndexes.has(job.dayIdx));
  const filteredDayJobs = isCurrentDateOpen ? dayJobs : [];
  const monthRevenue = filteredMonthEvents.reduce((sum, event) => sum + event.amount, 0);
  const weekRevenue = filteredWeekJobs.reduce((sum, job) => sum + job.amount, 0);
  const dayRevenue = filteredDayJobs.reduce((sum, job) => sum + job.amount, 0);
  const topRevenue = viewMode === "month" ? monthRevenue : viewMode === "week" ? weekRevenue : dayRevenue;
  const topRevenueLabel = viewMode === "month" ? "Revenue this month" : viewMode === "week" ? "Revenue this week" : "Revenue today";
  const scheduleJobCount = viewMode === "month" ? filteredMonthEvents.length : viewMode === "week" ? filteredWeekJobs.length : filteredDayJobs.length;
  const completedJobCount = viewMode === "month"
    ? filteredMonthEvents.filter((event) => event.status === "Completed").length
    : viewMode === "week"
    ? filteredWeekJobs.filter((job) => job.status === "Completed").length
    : filteredDayJobs.filter((job) => job.status === "Completed").length;
  const inProgressJobCount = viewMode === "month"
    ? filteredMonthEvents.filter((event) => event.status === "In Progress").length
    : viewMode === "week"
    ? filteredWeekJobs.filter((job) => job.status === "In Progress").length
    : filteredDayJobs.filter((job) => job.status === "In Progress").length;
  const completionRate = scheduleJobCount > 0 ? Math.round((completedJobCount / scheduleJobCount) * 1000) / 10 : 0;
  const scopedJobLabel = viewMode === "month" ? "Jobs this month" : viewMode === "week" ? "Jobs this week" : "Jobs today";
  const scheduleKpis = [
    { value: `$${topRevenue.toLocaleString("en-US")}`, label: topRevenueLabel, icon: "payments", color: "#16A34A", bg: "#D1FAE5" },
    { value: String(scheduleJobCount), label: scopedJobLabel, icon: "work", color: "#4A6FA5", bg: "#EBF0F8" },
    { value: String(inProgressJobCount), label: "In progress", icon: "schedule", color: "#D97706", bg: "#FEF3C7" },
    { value: `${completionRate}%`, label: "Completion rate", icon: "check_circle", color: "#7C3AED", bg: "#EDE9FE" },
  ];

  const hourFromPointer = (event: SlotPointerEvent, snap = SLOT_HOURS) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, ganttTotalWidth - 1));
    const snappedOffset = Math.floor((x / HOUR_WIDTH) / snap) * snap;
    return Math.max(GANTT_START_HOUR, Math.min(GANTT_END_HOUR - snap, GANTT_START_HOUR + snappedOffset));
  };

  const hasOverlap = (start: number, end: number, otherStart: number, otherEnd: number) => start < otherEnd && end > otherStart;

  const dayHasConflict = (jobs: DayJob[], jobId: number | null, technicianId: string, start: number, end: number) =>
    hasTimeConflict(jobs, jobId, technicianId, start, end);

  const weekHasConflict = (jobs: DispatchJob[], jobId: number | null, dayIdx: number, technicianId: string, start: number, end: number) =>
    jobs.some((job) => job.id !== jobId && job.dayIdx === dayIdx && job.technicianId === technicianId && hasOverlap(start, end, job.start, job.end));

  const updateDayStatus = (jobId: number, status: JobStatus) => {
    setDayJobs((jobs) => jobs.map((job) => job.id === jobId ? { ...job, status } : job));
    setSelectedDayJob((job) => job?.id === jobId ? { ...job, status } : job);
  };

  const updateWeekStatus = (jobId: number, status: JobStatus) => {
    setWeekJobs((jobs) => jobs.map((job) => job.id === jobId ? { ...job, status } : job));
    setSelectedDispatchJob((job) => job?.id === jobId ? { ...job, status } : job);
  };

  const updateEventStatus = (eventId: number, status: JobStatus) => {
    setMonthEvents((events) => events.map((ev) => ev.id === eventId ? { ...ev, status } : ev));
    setSelectedEvent((ev) => ev?.id === eventId ? { ...ev, status } : ev);
  };

  const openQuickCreate = (view: "day" | "week", date: Date, startHour: number, technicianId: string, dayIdx?: number) => {
    if (!isDateOpenForBusiness(date, businessHours)) {
      setToast("This day is closed in business hours.");
      return;
    }
    const start = Math.max(GANTT_START_HOUR, Math.min(GANTT_END_HOUR - SLOT_HOURS, startHour));
    setConflictMessage(null);
    setQuickJobDraft({
      view,
      date,
      dayIdx,
      technicianId,
      start,
      end: Math.min(GANTT_END_HOUR, start + Math.max(1, SLOT_HOURS)),
      client: CUSTOMERS[0].name,
      service: jobTypes[0] ?? "Service",
      address: CUSTOMERS[0].locations[0] ?? "",
      amount: "0",
    });
  };

  const submitQuickJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quickJobDraft) return;
    const amount = Number(quickJobDraft.amount) || 0;
    if (quickJobDraft.end <= quickJobDraft.start) {
      setConflictMessage("End time must be after the start time.");
      return;
    }
    const base = {
      technicianId: quickJobDraft.technicianId,
      start: quickJobDraft.start,
      end: quickJobDraft.end,
      client: quickJobDraft.client.trim() || "New Customer",
      service: quickJobDraft.service.trim() || "Service Call",
      address: quickJobDraft.address.trim() || "Address TBD",
      status: "Scheduled" as JobStatus,
      amount,
      bg: "#EBF0F8",
      border: "#4A6FA5",
    };

    if (quickJobDraft.view === "day") {
      if (dayHasConflict(dayJobs, null, base.technicianId, base.start, base.end)) {
        setConflictMessage("This slot overlaps with another job for the same person.");
        return;
      }
      const nextId = Math.max(0, ...dayJobs.map((job) => job.id)) + 1;
      const newJob = { id: nextId, ...base };
      setDayJobs((jobs) => [...jobs, newJob]);
      setSelectedDayJob(newJob);
      setSelectedMapJobId(nextId);
    } else {
      const dayIdx = quickJobDraft.dayIdx ?? 0;
      if (weekHasConflict(weekJobs, null, dayIdx, base.technicianId, base.start, base.end)) {
        setConflictMessage("This slot overlaps with another job for the same person.");
        return;
      }
      const nextId = Math.max(0, ...weekJobs.map((job) => job.id)) + 1;
      setWeekJobs((jobs) => [...jobs, {
        id: nextId,
        num: `24${String(nextId).padStart(2, "0")}`,
        dayIdx,
        priority: "Normal",
        jobType: "Repair",
        source: "Schedule",
        ...base,
      }]);
    }

    setQuickJobDraft(null);
    setConflictMessage(null);
  };

  const handleWeekDrop = (event: DragEvent<HTMLDivElement>, dayIdx: number, technicianId: string) => {
    event.preventDefault();
    setDropPreview(null);
    const [kind, rawId] = event.dataTransfer.getData("text/plain").split(":");
    if (kind !== "week") return;
    const jobId = Number(rawId);
    const dropStart = hourFromPointer(event);
    setWeekJobs((jobs) => {
      const targetJob = jobs.find((job) => job.id === jobId);
      if (!targetJob) return jobs;
      if (!openWeekDayIndexes.has(dayIdx)) {
        setConflictMessage("This day is closed in business hours.");
        return jobs;
      }
      const duration = targetJob.end - targetJob.start;
      const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
      if (weekHasConflict(jobs, jobId, dayIdx, technicianId, dropStart, dropEnd)) {
        setConflictMessage("That move conflicts with another job for the same person.");
        return jobs;
      }
      setConflictMessage(null);
      const nextJobs = jobs.map((job) => {
        if (job.id !== jobId) return job;
        return { ...job, dayIdx, technicianId, start: dropStart, end: dropEnd };
      });
      const movedJob = nextJobs.find((job) => job.id === jobId) ?? null;
      // Don't auto-open the detail modal — leave the job in place; user can click it to open.
      if (movedJob) setToast(`Moved to ${formatRegionalTime(movedJob.start, regionalSettings)}`);
      return nextJobs;
    });
  };

  const handleWeekDragOver = (event: DragEvent<HTMLDivElement>, dayIdx: number, technicianId: string) => {
    event.preventDefault();
    if (!openWeekDayIndexes.has(dayIdx)) return;
    setDropPreview({ view: "week", dayIdx, technicianId, start: hourFromPointer(event) });
  };

  const handleDayDrop = (event: DragEvent<HTMLDivElement>, technicianId: string) => {
    event.preventDefault();
    setDropPreview(null);
    const [kind, rawId] = event.dataTransfer.getData("text/plain").split(":");
    if (kind !== "day") return;
    const jobId = Number(rawId);
    const dropStart = hourFromPointer(event);
    setDayJobs((jobs) => {
      const targetJob = jobs.find((job) => job.id === jobId);
      if (!targetJob) return jobs;
      if (!isCurrentDateOpen) {
        setConflictMessage("This day is closed in business hours.");
        return jobs;
      }
      // Pending jobs (no tech and/or no date) get a default duration by job
      // type; already-scheduled jobs keep their length when moved slot→slot.
      const fromPending = isPending(targetJob);
      const duration = fromPending ? durationForType(targetJob.jobType) : (targetJob.end - targetJob.start);
      const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
      if (dayHasConflict(jobs, jobId, technicianId, dropStart, dropEnd)) {
        setConflictMessage("That move conflicts with another job for the same person.");
        return jobs;
      }
      setConflictMessage(null);
      const nextJobs = jobs.map((job) => {
        if (job.id !== jobId) return job;
        // Placing a job on a lane gives it a technician + time. Status follows
        // the backlog rule: pending→Scheduled, paused→In Progress (resume),
        // slot→slot unchanged.
        return {
          ...job,
          technicianId,
          start: dropStart,
          end: dropEnd,
          unscheduled: false,
          status: statusAfterAssignToSlot(job.status, fromPending),
        };
      });
      const movedJob = nextJobs.find((job) => job.id === jobId) ?? null;
      // Don't auto-open the detail modal — leave the job in place; user can click it to open.
      if (movedJob) setToast(`Moved to ${formatRegionalTime(movedJob.start, regionalSettings)}`);
      return nextJobs;
    });
  };

  const handleDayDragOver = (event: DragEvent<HTMLDivElement>, technicianId: string) => {
    event.preventDefault();
    if (!isCurrentDateOpen) return;
    setDropPreview({ view: "day", technicianId, start: hourFromPointer(event) });
  };

  // Drag a board job back into the Pending column. Per the 2026-06 agreement it
  // loses its DATE (becomes unscheduled) but KEEPS its technician for history;
  // an in-progress job pauses. Completed/cancelled jobs can't be moved.
  const handleMoveToPending = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setPendingDropActive(false);
    setDropPreview(null);
    const [kind, rawId] = event.dataTransfer.getData("text/plain").split(":");
    if (kind !== "day") return;
    const jobId = Number(rawId);
    setDayJobs((jobs) => {
      const targetJob = jobs.find((job) => job.id === jobId);
      if (!targetJob || isPending(targetJob) || !isDraggable(targetJob.status)) return jobs;
      setConflictMessage(null);
      setToast("Moved to Pending — date cleared, technician kept");
      return jobs.map((job) =>
        job.id === jobId
          ? { ...job, unscheduled: true, status: statusAfterMoveToPending(job.status) }
          : job,
      );
    });
  };

  const handleWeekSlotClick = (event: MouseEvent<HTMLDivElement>, date: Date, technicianId: string, dayIdx: number) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    if (!openWeekDayIndexes.has(dayIdx)) return;
    openQuickCreate("week", date, hourFromPointer(event, 1), technicianId, dayIdx);
  };

  const handleDaySlotClick = (event: MouseEvent<HTMLDivElement>, technicianId: string) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    if (!isCurrentDateOpen) return;
    openQuickCreate("day", currentDate, hourFromPointer(event, 1), technicianId);
  };

  const openHeaderQuickCreate = () => {
    if (viewMode === "week") {
      const openDayIndex = weekDays.findIndex(day => isDateOpenForBusiness(day, businessHours));
      if (openDayIndex === -1) {
        setToast("This week has no open business days.");
        return;
      }
      openQuickCreate("week", weekDays[openDayIndex], GANTT_START_HOUR, TEAM[0].id, openDayIndex);
      return;
    }
    openQuickCreate("day", currentDate, GANTT_START_HOUR, TEAM[0].id);
  };


  // Keyboard shortcuts: ← → navigate, T today, D/W/M view, N new job, Esc close
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        if (quickJobDraft) { setQuickJobDraft(null); event.preventDefault(); return; }
        if (selectedEvent) { setSelectedEvent(null); event.preventDefault(); return; }
        if (selectedDispatchJob) { setSelectedDispatchJob(null); event.preventDefault(); return; }
        if (selectedDayJob) { setSelectedDayJob(null); event.preventDefault(); return; }
        return;
      }
      if (isTyping || quickJobDraft) return;
      switch (event.key) {
        case "ArrowLeft":  event.preventDefault(); goBack(); break;
        case "ArrowRight": event.preventDefault(); goForward(); break;
        case "t": case "T": event.preventDefault(); goToday(); break;
        case "d": case "D": event.preventDefault(); setViewMode("day"); break;
        case "w": case "W": event.preventDefault(); setViewMode("week"); break;
        case "m": case "M": event.preventDefault(); setViewMode("month"); break;
        case "n": case "N": event.preventDefault(); openHeaderQuickCreate(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewMode, currentDate, quickJobDraft, selectedEvent, selectedDispatchJob, selectedDayJob]);

  const EventPopover = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    const eventEndHour = event.startHour + event.duration;
    const tech = TEAM[(event.id - 1) % TEAM.length];
    const statusStyle = STATUS_STYLES[event.status];
    const primaryLabel = event.status === "Scheduled" ? "Start Job" : event.status === "In Progress" ? "Complete Job" : "Reopen Job";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative bg-white shadow-2xl w-[400px] max-h-[85vh] overflow-hidden rounded-2xl border border-[#E5E7EB] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-[#E5E7EB] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[20px] text-[#1A2332] truncate leading-tight" style={{ fontWeight: 600 }}>Job #{event.id}</span>
              <span className="px-2 py-0.5 rounded-lg text-[12px] shrink-0" style={{ fontWeight: 500, backgroundColor: statusStyle.bg, color: statusStyle.color }}>{event.status}</span>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center transition-colors shrink-0">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E5E7EB] shrink-0" role="tablist" aria-label="Job tabs">
            {(["Details", "Notes", "History"] as SidebarTab[]).map((tab) => {
              const active = sidebarTab === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-3 text-[13px] relative transition-colors ${active ? "text-[#4A6FA5]" : "text-[#546478] hover:text-[#1A2332]"}`}
                  style={{ fontWeight: active ? 600 : 500 }}
                >
                  {tab}
                  {active && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#4A6FA5]" />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {sidebarTab === "Details" && (
              <div className="rounded-xl border border-[#E5E7EB] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[16px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>{event.client}</div>
                    <div className="text-[14px] text-[#546478] mt-0.5 truncate">{event.title}</div>
                    <div className="text-[14px] text-[#8899AA] mt-0.5 truncate">{event.property}</div>
                  </div>
                  <a href="tel:+18132867572" className="flex items-center gap-1.5 shrink-0 text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                    <span className="material-icons" style={{ fontSize: "16px" }}>call</span>
                    (813) 286-7572
                  </a>
                </div>
                <div className="h-px bg-[#E5E7EB] my-3.5" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-[14px]">
                    <span className="material-icons text-[#8899AA] shrink-0" style={{ fontSize: "17px" }}>build</span>
                    <span className="text-[#546478]">Technician:</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{tech.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[14px]">
                    <span className="material-icons text-[#8899AA] shrink-0" style={{ fontSize: "17px" }}>schedule</span>
                    <span className="text-[#546478]">Scheduled:</span>
                    <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{formatRegionalTime(event.startHour, regionalSettings)} - {formatRegionalTime(eventEndHour, regionalSettings)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[14px]">
                    <span className="material-icons text-[#8899AA] shrink-0" style={{ fontSize: "17px" }}>paid</span>
                    <span className="text-[#546478]">Amount:</span>
                    <span className="text-[#1A2332] tabular-nums" style={{ fontWeight: 600 }}>${event.amount.toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>
            )}
            {sidebarTab === "Notes" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "15px" }}>work_outline</span>
                  <span style={{ fontWeight: 600 }}>Job notes</span>
                  <span>· visible to your team on this job</span>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add a note for this job…"
                    className="w-full text-[13px] text-[#1A2332] resize-none outline-none placeholder:text-[#9CA3AF] min-h-[64px]"
                  />
                  <div className="flex justify-end">
                    <button onClick={addNote} disabled={!noteDraft.trim()} className="px-3 py-1.5 rounded-lg bg-[#4A6FA5] text-white text-[12px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                      Save note
                    </button>
                  </div>
                </div>
                {notesForActive.length === 0 ? (
                  <div className="text-center text-[12px] text-[#9CA3AF] py-4">No notes yet</div>
                ) : (
                  notesForActive.map((note, i) => (
                    <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-[13px] text-[#1A2332]">{note}</div>
                  ))
                )}
              </div>
            )}
            {sidebarTab === "History" && (
              <div className="space-y-2">
                {historyForActive.map((entry, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                    <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 700 }}>{entry.when}</div>
                    <div className="text-[13px] text-[#1A2332] mt-1">{entry.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-t border-[#E5E7EB] shrink-0 bg-white">
            <button
              onClick={() => { setCurrentDate(event.date); setViewMode("day"); onClose(); }}
              className="px-4 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA] transition-colors"
              style={{ fontWeight: 500 }}
            >
              Reschedule
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/jobs/${event.id}`)}
                className="px-4 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Edit
              </button>
              <button
                onClick={() => updateEventStatus(event.id, nextStatus(event.status))}
                className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] transition-colors"
                style={{ fontWeight: 600 }}
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-7 py-5 bg-[#F5F7FA] min-h-full flex flex-col">
      <PageHeader
        title="Schedule"
        className="mb-4"
        actions={
          <div className="flex bg-[#F0F2F5] rounded-lg overflow-hidden p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs rounded-md capitalize transition-all ${
                  viewMode === mode ? "bg-white text-[#1A2332] shadow-sm" : "text-[#546478] hover:text-[#1A2332]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      />

      {/* Stat cards — same 80px height as every other list page */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {scheduleKpis.map(s => (
          <div
            key={s.label}
            className="flex h-[80px] items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 min-w-0"
            style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
          >
            <div className="flex flex-col justify-center min-w-0">
              <div className="truncate text-[20px] text-[#1A2332] tabular-nums" style={{ fontWeight: 600, lineHeight: "27px" }}>{s.value}</div>
              <div className="mt-0.5 truncate text-[14px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "20px" }}>{s.label}</div>
            </div>
            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: s.color, backgroundColor: s.bg }}>
              <span className="material-icons" style={{ fontSize: "18px" }}>{s.icon}</span>
            </div>
          </div>
        ))}
        {conflictMessage && (
          <div className="col-span-4 px-3 py-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-[12px] text-[#B91C1C]" style={{ fontWeight: 600 }}>
            {conflictMessage}
          </div>
        )}
      </div>

      {/* Calendar content */}
      {/* For Month/Week views the card stretches to fill the page (flex-1).
          For Day view it hugs its rows so the map sits flush underneath. */}
      <div
        className={`bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col ${viewMode === "day" ? "" : "flex-1"}`}
        style={{ minHeight: 0 }}
      >

        {/* ── Card header bar: date nav (left) + job-type legend (right), matches Figma schedule header ── */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB] bg-white shrink-0">
          {/* Date navigation */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={goBack} aria-label="Previous" className="w-9 h-9 rounded-lg hover:bg-[#F0F2F5] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
            </button>
            <button onClick={goToday} title="Jump to today" className="px-2 text-[15px] text-[#1A2332] hover:text-[#4A6FA5] whitespace-nowrap" style={{ fontWeight: 600 }}>
              {headerLabel}
            </button>
            <button onClick={goForward} aria-label="Next" className="w-9 h-9 rounded-lg hover:bg-[#F0F2F5] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
            </button>
            {/* Pending-jobs toggle chip — only relevant on Day view */}
            {viewMode === "day" && (
              <button
                onClick={() => setUnassignedPanelOpen(o => !o)}
                title={unassignedPanelOpen ? "Hide pending jobs panel" : "Show pending jobs panel"}
                className={`ml-2 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] transition-colors ${
                  unassignedPanelOpen
                    ? "bg-[#EEF3FA] border border-[#C5D5EC] text-[#4A6FA5]"
                    : "border border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA]"
                }`}
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>inbox</span>
                Pending jobs
                {pendingBucket.length > 0 && (
                  <span
                    className="ml-0.5 px-1.5 rounded-full text-[11px] text-white"
                    style={{ background: "#DC2626", fontWeight: 700, minWidth: 18, textAlign: "center" }}
                  >
                    {pendingBucket.length}
                  </span>
                )}
              </button>
            )}
          </div>
          {/* Job-type legend — colours sourced from the shared constant so the
              key and the cards can never drift (matches the Figma legend). */}
          <div data-testid="job-type-legend" className="flex items-center gap-3 flex-wrap justify-end">
            {JOB_TYPE_ORDER.map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: JOB_TYPE_COLORS[label] }} />
                <span className="text-[13px] text-[#6B7280] whitespace-nowrap" style={{ fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {viewMode === "month" && (
          <div className="flex-1 flex flex-col overflow-hidden" role="region" aria-label="Month calendar">
            {/* Weekday header — Closed badge on non-business days (matches Figma) */}
            <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#FAFBFC] shrink-0" role="row">
              {monthDays.slice(0, 7).map((day, i) => {
                const open = isDateOpenForBusiness(day, businessHours);
                return (
                  <div key={i} role="columnheader" className="flex items-center justify-center gap-1.5 h-9 text-[13px] text-[#546478]" style={{ fontWeight: 600 }}>
                    <span>{format(day, "EEE")}</span>
                    {!open && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEE2E2] text-[#DC2626]" style={{ fontWeight: 700 }}>Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex-1 overflow-auto" role="grid" aria-label="Month grid">
              <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, minmax(121px, 1fr))` }}>
                {monthDays.map((day, idx) => {
                  const events = getEventsForDay(day);
                  const isCurrentMo = isSameMonth(day, currentDate);
                  const open = isDateOpenForBusiness(day, businessHours);
                  const isTodayD = isSameDay(day, WEEK_TODAY);
                  const dim = !isCurrentMo || !open;
                  return (
                    <div
                      key={idx}
                      role="gridcell"
                      aria-label={`${format(day, "EEEE, MMMM d")}, ${events.length} event${events.length === 1 ? "" : "s"}`}
                      className={`border-b border-r border-[#E5E7EB] p-2 overflow-hidden transition-colors cursor-pointer ${
                        !open ? "bg-[#FAFBFC]" : "bg-white hover:bg-[#F9FAFB]"
                      }`}
                      onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                    >
                      <div className="px-1 mb-1">
                        <span
                          className="text-[14px] tabular-nums"
                          style={{ fontWeight: isTodayD ? 700 : 500, color: isTodayD ? "#4A6FA5" : dim ? "#B8BEC9" : "#1A2332" }}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((ev) => {
                          // Colour by job type (Figma legend), like the day/week cards.
                          const typeColor = ev.jobType ? jobTypeColor(ev.jobType) : getC(ev.color).border;
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className="rounded-lg px-3 py-2 text-[14px] leading-5 truncate cursor-pointer hover:shadow-sm transition-shadow"
                              style={{ backgroundColor: ev.jobType ? jobTypeTint(ev.jobType) : `color-mix(in srgb, ${typeColor} 6%, white)`, color: "#1A2332", borderLeft: `3px solid ${typeColor}`, fontWeight: 600 }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {events.length > 3 && (
                          <div className="text-[11px] text-[#9CA3AF] px-1" style={{ fontWeight: 500 }}>+{events.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── WEEK VIEW — Horizontal Day×Time Gantt ── */}
        {viewMode === "week" && (
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

            {/* Main: sticky-col + sticky-header scrollable grid */}
            <div ref={weekScrollRef} className="flex-1 overflow-auto" style={{ minWidth: 0 }}>
              <div style={{ width: ganttTotalWidth + WEEK_LABEL_WIDTH, minWidth: "100%" }}>

                {/* Sticky header: [Day-col spacer] [Hours] */}
                <div
                  className="flex sticky top-0 z-20 border-b border-[#E5E7EB] bg-[#FAFBFC]"
                  style={{ height: 40 }}
                >
                  {/* Corner spacer — sticky left (blank tech-column header) */}
                  <div
                    className="shrink-0 sticky left-0 z-30 bg-[#FAFBFC] border-r border-[#E5E7EB]"
                    style={{ width: WEEK_LABEL_WIDTH, minWidth: WEEK_LABEL_WIDTH }}
                  />
                  {/* Hour labels */}
                  {ganttHours.map((h) => {
                    const isCurrentHour = h === Math.floor(CURRENT_TIME);
                    const label = formatRegionalTime(h, regionalSettings);
                    const isLastHour = h === GANTT_END_HOUR;
                    return (
                      <div
                        key={h}
                        className="flex items-center justify-center shrink-0 border-r border-[#E5E7EB]"
                        style={{ width: isLastHour ? 0 : HOUR_WIDTH, minWidth: isLastHour ? 0 : HOUR_WIDTH, overflow: "visible" }}
                      >
                        {!isLastHour && (
                          isCurrentHour ? (
                            <span className="px-2 py-0.5 rounded-full text-white text-[10px]" style={{ backgroundColor: "#DC2626", fontWeight: 700 }}>
                              {formatRegionalTime(CURRENT_TIME, regionalSettings)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#8899AA]" style={{ fontWeight: 500 }}>{label}</span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day sections — one per weekday (matches Figma: full-width day header + technician lanes) */}
                {weekDays.map((d, dayI) => {
                  const isToday = isSameDay(d, WEEK_TODAY);
                  const dayOpen = openWeekDayIndexes.has(dayI);
                  const dayCollapsed = collapsedWeekDays.has(dayI);
                  const showLanes = dayOpen && !dayCollapsed;
                  const ROW_H = 92;

                  return (
                    <div key={dayI} ref={isToday ? weekTodayRef : undefined}>
                      {/* Day header row — full width, sticky label */}
                      <div
                        className="border-b border-[#E5E7EB]"
                        style={{ minWidth: ganttTotalWidth + WEEK_LABEL_WIDTH, backgroundColor: isToday ? "#EBF0F8" : "#F8F9FB" }}
                      >
                        <div className="sticky left-0 flex items-center gap-1.5 px-3" style={{ height: 36, width: "max-content" }}>
                          {dayOpen ? (
                            <button
                              type="button"
                              onClick={() => toggleWeekDay(dayI)}
                              aria-label={dayCollapsed ? `Expand ${format(d, "EEEE")}` : `Collapse ${format(d, "EEEE")}`}
                              aria-expanded={!dayCollapsed}
                              className="-ml-1 w-5 h-5 flex items-center justify-center rounded text-[#546478] hover:bg-black/5 hover:text-[#1A2332]"
                            >
                              <span
                                className="material-icons"
                                style={{ fontSize: "20px", transition: "transform 0.15s ease", transform: dayCollapsed ? "rotate(-90deg)" : "none" }}
                              >
                                expand_more
                              </span>
                            </button>
                          ) : (
                            <span className="-ml-1 w-5 h-5 shrink-0" />
                          )}
                          <span className={`text-[13px] ${isToday ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: 700 }}>
                            {format(d, "EEE")} {formatRegionalDate(d, regionalSettings)}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#4A6FA5] text-white" style={{ fontWeight: 700 }}>Today</span>
                          )}
                          {!dayOpen && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEE2E2] text-[#DC2626]" style={{ fontWeight: 700 }}>Closed</span>
                          )}
                          {dayOpen && dayCollapsed && (
                            <span className="text-[12px] text-[#8899AA]" style={{ fontWeight: 500 }}>collapsed</span>
                          )}
                        </div>
                      </div>

                      {/* Technician lanes — open days that aren't manually collapsed */}
                      {showLanes && TEAM.map((member, memberIdx) => {
                        const memberJobs = filteredWeekJobs
                          .filter((job) => job.dayIdx === dayI && job.technicianId === member.id)
                          .sort((a, b) => a.start - b.start);
                        const memberTotal = memberJobs.reduce((sum, job) => sum + job.amount, 0);
                        const isLastMember = memberIdx === TEAM.length - 1;

                        return (
                          <div key={`${dayI}-${member.id}`} className="flex" style={{ height: ROW_H }}>
                            <div
                              className="shrink-0 sticky left-0 z-10 flex items-center gap-2.5 px-3 bg-white"
                              style={{
                                width: WEEK_LABEL_WIDTH,
                                minWidth: WEEK_LABEL_WIDTH,
                                height: ROW_H,
                                borderRight: "1px solid #E5E7EB",
                                borderBottom: isLastMember ? "0" : "1px solid #F0F2F5",
                              }}
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                                style={{ backgroundColor: member.color, fontWeight: 700 }}
                              >
                                {member.initial}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 600 }}>{member.name}</div>
                                <div className="text-[13px] text-[#546478] tabular-nums mt-0.5" style={{ fontWeight: 600 }}>
                                  ${memberTotal.toLocaleString("en-US")}
                                </div>
                              </div>
                            </div>

                            <div
                              className="relative"
                              style={{
                                minWidth: ganttTotalWidth,
                                height: ROW_H,
                                backgroundColor: isToday ? "#F7FAFE" : "#FFFFFF",
                                borderBottom: isLastMember ? "0" : "1px solid #F0F2F5",
                              }}
                              onDragOver={(event) => handleWeekDragOver(event, dayI, member.id)}
                              onDragLeave={() => setDropPreview(null)}
                              onDrop={(event) => handleWeekDrop(event, dayI, member.id)}
                              onClick={(event) => handleWeekSlotClick(event, d, member.id, dayI)}
                            >
                              {ganttHours.slice(0, -1).map((h) => (
                                <div
                                  key={h}
                                  className="absolute top-0 bottom-0"
                                  style={{ left: (h - GANTT_START_HOUR) * HOUR_WIDTH, width: 1, backgroundColor: isToday ? "#CCDAEC" : "#E8EBF0" }}
                                />
                              ))}

                              {isToday && (
                                <div
                                  className="absolute top-0 bottom-0 z-10 pointer-events-none"
                                  style={{ left: (CURRENT_TIME - GANTT_START_HOUR) * HOUR_WIDTH, width: 2, backgroundColor: "#DC2626" }}
                                />
                              )}

                              {dropPreview?.view === "week" && dropPreview.dayIdx === dayI && dropPreview.technicianId === member.id && (
                                <div
                                  className="absolute top-2 bottom-2 rounded-lg border-2 border-dashed border-[#4A6FA5] bg-[#4A6FA5]/10 pointer-events-none"
                                  style={{ left: (dropPreview.start - GANTT_START_HOUR) * HOUR_WIDTH + 4, width: HOUR_WIDTH - 8 }}
                                />
                              )}

                              {/* Highlighted target slot while the create-job modal is open */}
                              {quickJobDraft?.view === "week" && quickJobDraft.dayIdx === dayI && quickJobDraft.technicianId === member.id && (
                                <div
                                  className="absolute top-2 bottom-2 rounded-lg border-2 border-[#4A6FA5] bg-[#4A6FA5]/25 pointer-events-none z-20"
                                  style={{ left: (quickJobDraft.start - GANTT_START_HOUR) * HOUR_WIDTH + 4, width: Math.max((quickJobDraft.end - quickJobDraft.start) * HOUR_WIDTH - 8, HOUR_WIDTH - 8) }}
                                />
                              )}

                              {memberJobs.length === 0 && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openQuickCreate("week", d, GANTT_START_HOUR, member.id, dayI);
                                  }}
                                  className="absolute inset-2 rounded-lg border border-dashed border-[#CDD1DA] flex items-center justify-center gap-1.5 hover:border-[#4A6FA5] hover:bg-[#F5F8FD] transition-colors group"
                                >
                                  <span className="material-icons text-[#B8BEC9] group-hover:text-[#4A6FA5]" style={{ fontSize: "14px" }}>add</span>
                                  <span className="text-[10px] text-[#B8BEC9] group-hover:text-[#4A6FA5]" style={{ fontWeight: 500 }}>Add job</span>
                                </button>
                              )}

                              {memberJobs.map((job, idx) => {
                                const left = (job.start - GANTT_START_HOUR) * HOUR_WIDTH + 3;
                                const width = (job.end - job.start) * HOUR_WIDTH - 6;
                                const isSelected = selectedDispatchJob?.id === job.id;
                                const routeNumber = idx + 1;
                                const statusStyle = STATUS_STYLES[job.status];
                                // Card colour by job type (Figma legend) — matches the day board.
                                const typeColor = jobTypeColor(job.jobType);
                                return (
                                  <div
                                    key={job.id}
                                    data-job-card="true"
                                    draggable
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Job for ${job.client}, ${job.service}, ${formatRegionalTime(job.start, regionalSettings)}-${formatRegionalTime(job.end, regionalSettings)}, status ${job.status}`}
                                    className="absolute rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6FA5]"
                                    style={{
                                      left,
                                      width: Math.max(width, 70),
                                      top: 8,
                                      height: 76,
                                      backgroundColor: jobTypeTint(job.jobType),
                                      borderLeft: `3px solid ${typeColor}`,
                                      boxShadow: isSelected ? `0 0 0 2px ${typeColor}` : "none",
                                    }}
                                    onDragStart={(event) => event.dataTransfer.setData("text/plain", `week:${job.id}`)}
                                    onClick={() => setSelectedDispatchJob(isSelected ? null : job)}
                                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDispatchJob(isSelected ? null : job); } }}
                                    onDoubleClick={(event) => event.stopPropagation()}
                                  >
                                    <div className="flex flex-col h-full px-2 py-1">
                                      <div className="flex items-center justify-between gap-1 text-[9px] text-[#9CA3AF] tabular-nums shrink-0">
                                        <span className="truncate">{formatRegionalTime(job.start, regionalSettings)} - {formatRegionalTime(job.end, regionalSettings)}</span>
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white shrink-0" style={{ backgroundColor: member.color, fontWeight: 700 }}>
                                          {routeNumber}
                                        </span>
                                      </div>
                                      <div className="text-[11px] leading-tight truncate shrink-0" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</div>
                                      <div className="text-[9px] text-[#546478] truncate shrink-0">{job.service}</div>
                                      <div className="flex items-center justify-between gap-1 mt-auto shrink-0">
                                        {job.amount > 0 ? (
                                          <span className="text-[10px] tabular-nums" style={{ fontWeight: 700, color: typeColor }}>${job.amount.toLocaleString()}</span>
                                        ) : (
                                          <span className="text-[10px] text-[#9CA3AF]">-</span>
                                        )}
                                        <button
                                          className="px-1.5 py-0.5 rounded-full text-[9px] shrink-0"
                                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            updateWeekStatus(job.id, nextStatus(job.status));
                                          }}
                                        >
                                          {job.status}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Job detail panel */}
	            {selectedDispatchJob ? (
	              <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedDispatchJob(null)}>
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                {/* Docked right-side job-info panel (matches Figma), not a modal. */}
                <div className="relative w-[400px] max-w-[92vw] h-full shrink-0 flex flex-col overflow-hidden border-l border-[#E5E7EB] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
	                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E7EB] shrink-0">
	                  <div className="flex items-center gap-2">
	                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Job #{selectedDispatchJob.num}</span>
	                    <StatusPillSelect
	                      value={selectedDispatchJob.status}
	                      onChange={(next) => updateWeekStatus(selectedDispatchJob.id, next)}
	                    />
	                  </div>
                  <button onClick={() => setSelectedDispatchJob(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>close</span>
                  </button>
                </div>
                <div className="flex border-b border-[#E5E7EB] shrink-0" role="tablist" aria-label="Job sidebar tabs">
                  {(["Details", "Notes", "History"] as SidebarTab[]).map((tab) => {
                    const active = sidebarTab === tab;
                    return (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSidebarTab(tab)}
                        className={`flex-1 py-2.5 text-[12px] transition-colors relative ${active ? "text-[#4A6FA5]" : "text-[#546478] hover:text-[#1A2332]"}`}
                        style={{ fontWeight: active ? 700 : 500 }}
                      >
                        {tab}{tab === "Notes" && notesForActive.length > 0 ? ` (${notesForActive.length})` : ""}
                        {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A6FA5]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto bg-[#FAFBFC]">
                  {sidebarTab === "Details" && (
                    <div className="p-4 bg-white mx-3 mt-3 rounded-xl border border-[#E5E7EB]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{selectedDispatchJob.client}</div>
                          <div className="text-[12px] text-[#546478] mt-0.5">{selectedDispatchJob.service}</div>
                          <div className="text-[11px] text-[#8899AA] mt-1">{selectedDispatchJob.address}</div>
                        </div>
                        <a href="tel:+18132867572" className="flex items-center gap-1.5 shrink-0 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                          <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                          (813) 286-7572
                        </a>
                      </div>
                      <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                        {[
                          { icon: "event",        label: "Time",   value: `${formatRegionalTime(selectedDispatchJob.start, regionalSettings)} - ${formatRegionalTime(selectedDispatchJob.end, regionalSettings)}` },
                          { icon: "attach_money", label: "Amount", value: `$${selectedDispatchJob.amount.toFixed(2)}` },
                          { icon: "build",        label: "Type",   value: selectedDispatchJob.jobType },
                        ].map(f => (
                          <div key={f.label} className="flex items-center gap-2.5 py-2 border-b border-[#F5F7FA] last:border-0">
                            <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "16px" }}>{f.icon}</span>
                            <span className="text-[11px] text-[#8899AA] w-[60px] shrink-0">{f.label}</span>
                            <span className="text-[12px] text-[#1A2332] flex-1" style={{ fontWeight: 500 }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {sidebarTab === "Notes" && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                        <span className="material-icons" style={{ fontSize: "15px" }}>work_outline</span>
                        <span style={{ fontWeight: 600 }}>Job notes</span>
                        <span>· visible to your team on this job</span>
                      </div>
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add a note for this job…"
                          className="w-full text-[12px] text-[#1A2332] resize-none outline-none placeholder:text-[#9CA3AF] min-h-[64px]"
                        />
                        <div className="flex justify-end">
                          <button onClick={addNote} disabled={!noteDraft.trim()} className="px-3 py-1.5 rounded-lg bg-[#4A6FA5] text-white text-[11px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                            Save note
                          </button>
                        </div>
                      </div>
                      {notesForActive.length === 0 ? (
                        <div className="text-center text-[11px] text-[#9CA3AF] py-4">No notes yet</div>
                      ) : (
                        notesForActive.map((note, i) => (
                          <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-[12px] text-[#1A2332]">{note}</div>
                        ))
                      )}
                    </div>
                  )}
                  {sidebarTab === "History" && (
                    <div className="p-3 space-y-2">
                      {historyForActive.map((entry, i) => (
                        <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                          <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 700 }}>{entry.when}</div>
                          <div className="text-[12px] text-[#1A2332] mt-1">{entry.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
	                <div className="p-4 border-t border-[#E5E7EB] shrink-0 bg-white">
	                  <button
                      onClick={() => updateWeekStatus(selectedDispatchJob.id, selectedDispatchJob.status === "Completed" ? "Scheduled" : nextStatus(selectedDispatchJob.status))}
                      className="w-full py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] transition-colors mb-2"
                      style={{ fontWeight: 600 }}
                    >
	                    {selectedDispatchJob.status === "Scheduled" ? "Start Job" : selectedDispatchJob.status === "In Progress" ? "Complete Job" : "Reopen Job"}
	                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/jobs/${selectedDispatchJob.id}`)} className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    <button onClick={() => openQuickCreate("week", weekDays[selectedDispatchJob.dayIdx] ?? weekDays[0], selectedDispatchJob.start, selectedDispatchJob.technicianId, selectedDispatchJob.dayIdx)} className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Reschedule</button>
                  </div>
                </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── DAY VIEW — Horizontal Timeline ── */}
        {/* No flex-1 here: the schedule card should only be as tall as its rows,
            so the map below sits flush underneath instead of being pushed down
            by a stretched empty container. */}
        {viewMode === "day" && (
          <div className="flex overflow-hidden">

            {/* Left: sticky team-member column */}
            <div className="shrink-0 flex flex-col bg-white border-r border-[#E5E7EB]" style={{ width: 180 }}>
              {/* Spacer aligns with time header */}
              <div className="border-b border-[#E5E7EB] bg-[#FAFBFC]" style={{ height: 40 }} />
              {TEAM.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 px-3 border-b border-[#E5E7EB]"
                  style={{ height: 121 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                    style={{ backgroundColor: member.color, fontWeight: 700 }}
                  >
                    {member.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 600 }}>{member.name}</div>
                    <div className="text-[13px] text-[#546478] tabular-nums mt-0.5" style={{ fontWeight: 600 }}>
                      ${filteredDayJobs.filter((job) => job.technicianId === member.id).reduce((sum, job) => sum + job.amount, 0).toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Center: Scrollable horizontal time grid */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <div style={{ width: `${ganttTotalWidth}px`, minWidth: "100%" }}>

                  {/* Time header row */}
                  <div
                    className="flex border-b border-[#E5E7EB] bg-[#FAFBFC] sticky top-0 z-10 shrink-0"
                    style={{ height: 40 }}
                  >
                    {ganttHours.map((h) => {
                      const isCurrentHour = h === Math.floor(CURRENT_TIME);
                      const label = formatRegionalTime(h, regionalSettings);
                      const isLastHour = h === GANTT_END_HOUR;
                      return (
                        <div
                          key={h}
                          className="flex items-center justify-center shrink-0 border-r border-[#E5E7EB] relative"
                          style={{ width: isLastHour ? 0 : HOUR_WIDTH, overflow: "visible" }}
                        >
                          {!isLastHour && (
                            isCurrentHour ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-white text-[10px]"
                                style={{ backgroundColor: "#DC2626", fontWeight: 700 }}
                              >
                                {formatRegionalTime(CURRENT_TIME, regionalSettings)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8899AA]" style={{ fontWeight: 500 }}>{label}</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {TEAM.map((member) => {
                    const memberJobs = filteredDayJobs
                      .filter((job) => job.technicianId === member.id)
                      // Unscheduled (no date) jobs live in the Pending column, not on
                      // the time grid — even though they keep their technician.
                      .filter((job) => !job.unscheduled)
                      // Backlog: cancelled jobs are not shown on the board (working
                      // default per the open Marek question; they remain in lists).
                      .filter((job) => isShownOnBoard(job.status))
                      .sort((a, b) => a.start - b.start);

                    return (
                      <div
                        key={member.id}
                        className="relative border-b border-[#E5E7EB]"
                        style={{ height: 121 }}
                        onDragOver={(event) => handleDayDragOver(event, member.id)}
                        onDragLeave={() => setDropPreview(null)}
                        onDrop={(event) => handleDayDrop(event, member.id)}
                        onClick={(event) => handleDaySlotClick(event, member.id)}
                      >
                        {!isCurrentDateOpen && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#F8FAFC]/85 text-[12px] text-[#8899AA]" style={{ fontWeight: 700 }}>
                            Closed
                          </div>
                        )}
                        {/* Hour grid lines */}
                        {ganttHours.slice(0, -1).map((h) => (
                          <div
                            key={h}
                            className="absolute top-0 bottom-0 border-r border-[#F0F2F5]"
                            style={{ left: (h - GANTT_START_HOUR) * HOUR_WIDTH }}
                          />
                        ))}

                        {/* Current time indicator line */}
                        <div
                          className="absolute top-0 bottom-0 z-10 pointer-events-none"
                          style={{
                            left: (CURRENT_TIME - GANTT_START_HOUR) * HOUR_WIDTH,
                            width: 2,
                            backgroundColor: "#DC2626",
                          }}
                        />

                        {dropPreview?.view === "day" && dropPreview.technicianId === member.id && (
                          <div
                            className="absolute top-2 bottom-2 rounded-lg border-2 border-dashed border-[#4A6FA5] bg-[#4A6FA5]/10 pointer-events-none"
                            style={{ left: (dropPreview.start - GANTT_START_HOUR) * HOUR_WIDTH + 4, width: HOUR_WIDTH - 8 }}
                          />
                        )}

                        {/* Highlighted target slot while the create-job modal is open */}
                        {quickJobDraft?.view === "day" && quickJobDraft.technicianId === member.id && (
                          <div
                            className="absolute top-3 bottom-3 rounded-lg border-2 border-[#4A6FA5] bg-[#4A6FA5]/25 pointer-events-none z-20"
                            style={{ left: (quickJobDraft.start - GANTT_START_HOUR) * HOUR_WIDTH + 4, width: Math.max((quickJobDraft.end - quickJobDraft.start) * HOUR_WIDTH - 8, HOUR_WIDTH - 8) }}
                          />
                        )}

                        {memberJobs.map((job, idx) => {
                          const left = (job.start - GANTT_START_HOUR) * HOUR_WIDTH + 3;
                          const width = (job.end - job.start) * HOUR_WIDTH - 6;
                          const routeNumber = idx + 1;
                          const statusStyle = STATUS_STYLES[job.status];
                          // Card colour follows the JOB TYPE (per the Figma legend);
                          // technician identity is the lane + the route-number badge.
                          const typeColor = jobTypeColor(job.jobType);
                          // Backlog: completed jobs are locked (not draggable, faded).
                          const canDrag = isDraggable(job.status);
                          return (
                            <div
                              key={job.id}
                              data-job-card="true"
                              draggable={canDrag}
                              role="button"
                              tabIndex={0}
                              aria-label={`Job for ${job.client}, ${job.service}, ${formatRegionalTime(job.start, regionalSettings)}-${formatRegionalTime(job.end, regionalSettings)}, status ${job.status}${canDrag ? "" : " (locked)"}`}
                              title={`${job.client} — ${job.service}${job.jobType ? ` (${job.jobType})` : ""}\n${job.address}\n${formatRegionalTime(job.start, regionalSettings)}–${formatRegionalTime(job.end, regionalSettings)} · ${job.status}`}
                              className={`absolute rounded-lg overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6FA5] ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                              style={{
                                left,
                                width: Math.max(width, 60),
                                top: 15,
                                height: 92,
                                backgroundColor: jobTypeTint(job.jobType),
                                borderLeft: `3px solid ${typeColor}`,
                                boxShadow: selectedDayJob?.id === job.id ? `0 0 0 2px ${typeColor}` : "none",
                                opacity: canDrag ? 1 : 0.6,
                              }}
                              onDragStart={(event) => {
                                if (!canDrag) { event.preventDefault(); return; }
                                event.dataTransfer.setData("text/plain", `day:${job.id}`);
                              }}
                              onClick={() => {
                                setSelectedDayJob(job);
                                setSelectedMapJobId(job.id);
                              }}
                              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDayJob(job); setSelectedMapJobId(job.id); } }}
                              onDoubleClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col h-full px-3 py-2">
                                <div className="flex items-center gap-2 w-full shrink-0">
                                  <span className="flex-1 min-w-0 truncate text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 400 }}>
                                    {formatRegionalTime(job.start, regionalSettings)} - {formatRegionalTime(job.end, regionalSettings)}
                                  </span>
                                  <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[12px] leading-4 text-white shrink-0" style={{ backgroundColor: member.color, fontWeight: 500 }}>
                                    {routeNumber}
                                  </span>
                                </div>
                                <div className="text-[14px] leading-5 text-[#1A2332] truncate shrink-0" style={{ fontWeight: 600 }}>{job.client}</div>
                                <div className="text-[14px] leading-5 text-[#6B7280] truncate shrink-0" style={{ fontWeight: 500 }}>{job.service}</div>
                                <div className="flex items-center justify-between gap-2 mt-auto shrink-0">
                                  {job.amount > 0 ? (
                                    <span className="text-[14px] leading-5 tabular-nums shrink-0" style={{ fontWeight: 500, color: typeColor }}>${job.amount.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-[14px] leading-5 text-[#9CA3AF] shrink-0" style={{ fontWeight: 500 }}>—</span>
                                  )}
                                  <button
                                    className="px-2 py-0.5 rounded-lg text-[12px] leading-4 shrink-0 truncate max-w-[120px]"
                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      updateDayStatus(job.id, nextStatus(job.status));
                                    }}
                                  >
                                    {job.status}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Unassigned jobs panel — shrinks the time grid to make room.
                Each card is draggable onto a tech lane to assign + schedule. */}
            {unassignedPanelOpen && (
              <aside
                className={`shrink-0 flex flex-col border-l transition-colors ${pendingDropActive ? "bg-[#4A6FA5]/5 border-[#4A6FA5]" : "bg-[#FAFBFC] border-[#E5E7EB]"}`}
                style={{ width: 280 }}
                onDragOver={(e) => { e.preventDefault(); setPendingDropActive(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPendingDropActive(false); }}
                onDrop={handleMoveToPending}
              >
                <div className="flex items-center gap-2 px-4 border-b border-[#E5E7EB] bg-white" style={{ height: 40 }}>
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>inbox</span>
                  <span className="flex-1 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                    Pending jobs{pendingDayJobs.length > 0 ? ` (${pendingDayJobs.length})` : ""}
                  </span>
                  <button
                    onClick={() => setUnassignedPanelOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F0F2F5] text-[#6B7280]"
                    title="Hide panel"
                    aria-label="Hide pending jobs panel"
                  >
                    <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                  </button>
                </div>
                {/* Filter — unassigned = no technician; unscheduled = no fixed date */}
                <div className="px-3 py-2 border-b border-[#E5E7EB] bg-white">
                  <select
                    value={pendingFilter}
                    onChange={(e) => setPendingFilter(e.target.value as PendingFilter)}
                    className="w-full h-8 px-2 rounded-md border border-[#E5E7EB] text-[12px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5] cursor-pointer"
                  >
                    <option value="all">Show all</option>
                    <option value="unassigned">Show unassigned</option>
                    <option value="unscheduled">Show unscheduled</option>
                    <option value="scheduled">Show scheduled</option>
                    <option value="paused">Show paused</option>
                    <option value="both">Show unassigned + unscheduled</option>
                  </select>
                </div>
                <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "min(300px, calc(100vh - 280px))" }}>
                  {pendingDayJobs.length === 0 ? (
                    <div className="py-10 text-center">
                      <span className="material-icons text-[#D1D5DB] mb-1 block" style={{ fontSize: "32px" }}>check_circle</span>
                      <div className="text-[12px] text-[#9CA3AF]">{pendingFilter === "all" ? "Nothing pending" : pendingFilter === "both" ? "No unassigned + unscheduled jobs" : `No ${pendingFilter} jobs`}</div>
                    </div>
                  ) : (
                    pendingDayJobs.map((job) => {
                      const typeColor = jobTypeColor(job.jobType);
                      // The Pending card's badge shows the DERIVED state (per the
                      // Figma design): Paused > Unscheduled (no date) > Unassigned
                      // (no technician). Priority order matters for combos.
                      const stateBadge = job.status === "Paused"
                        ? { label: "Paused", color: STATUS_STYLES.Paused.color, bg: STATUS_STYLES.Paused.bg }
                        : job.unscheduled
                        ? { label: "Unscheduled", color: "#6B7280", bg: "rgba(107,114,128,0.15)" }
                        : !job.technicianId
                        ? { label: "Unassigned", color: "#6B7280", bg: "rgba(107,114,128,0.15)" }
                        : { label: job.status, color: STATUS_STYLES[job.status].color, bg: STATUS_STYLES[job.status].bg };
                      return (
                      <div
                        key={job.id}
                        data-job-card="true"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", `day:${job.id}`)}
                        onClick={() => setSelectedDayJob(job)}
                        className="bg-white border border-[#E5E7EB] rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        style={{ borderLeft: `3px solid ${typeColor}`, backgroundColor: jobTypeTint(job.jobType) }}
                        title={`${job.client} — ${job.service}${job.jobType ? ` (${job.jobType})` : ""}\n${job.address}\n${job.unscheduled ? "No date" : `${formatRegionalTime(job.start, regionalSettings)}–${formatRegionalTime(job.end, regionalSettings)}`} · ${stateBadge.label}`}
                      >
                        {/* Pending card layout per the Figma mockup: time (dashes
                            when unscheduled) → service title (bold) → client →
                            amount + derived state badge. No address / drag hint. */}
                        <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] tabular-nums">
                          {job.status === "Paused" && (
                            <span className="material-icons text-[#A856F7] shrink-0" style={{ fontSize: "13px" }} title="Paused — higher priority">pause_circle</span>
                          )}
                          <span className="truncate">{job.unscheduled ? "--:-- – --:--" : `${formatRegionalTime(job.start, regionalSettings)} – ${formatRegionalTime(job.end, regionalSettings)}`}</span>
                        </div>
                        <div className="text-[13px] text-[#1A2332] mt-1 truncate" style={{ fontWeight: 700 }}>{job.service}</div>
                        <div className="text-[11px] text-[#546478] truncate">{job.client}</div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          {job.amount > 0 ? (
                            <span className="text-[12px] tabular-nums" style={{ fontWeight: 700, color: typeColor }}>${job.amount.toLocaleString()}</span>
                          ) : (
                            <span className="text-[12px] text-[#9CA3AF]">—</span>
                          )}
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] max-w-[110px] truncate"
                            style={{ backgroundColor: stateBadge.bg, color: stateBadge.color, fontWeight: 600 }}
                          >
                            {stateBadge.label}
                          </span>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </aside>
            )}

            {selectedDayJob ? (
              <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedDayJob(null)}>
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                {/* Docked right-side "job-info" panel (matches Figma 876:72691 /
                    761:19636) — not a centered modal. */}
                <div className="relative w-[400px] max-w-[92vw] h-full shrink-0 flex flex-col overflow-hidden border-l border-[#E5E7EB] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E7EB] shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>Job #{selectedDayJob.id}</span>
                    <StatusPillSelect
                      value={selectedDayJob.status}
                      onChange={(next) => updateDayStatus(selectedDayJob.id, next)}
                    />
                  </div>
                  <button onClick={() => setSelectedDayJob(null)} aria-label="Close job details" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>close</span>
                  </button>
                </div>
                <div className="flex border-b border-[#E5E7EB] shrink-0" role="tablist" aria-label="Job sidebar tabs">
                  {(["Details", "Notes", "History"] as SidebarTab[]).map((tab) => {
                    const active = sidebarTab === tab;
                    return (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSidebarTab(tab)}
                        className={`flex-1 py-2.5 text-[12px] transition-colors relative ${active ? "text-[#4A6FA5]" : "text-[#546478] hover:text-[#1A2332]"}`}
                        style={{ fontWeight: active ? 700 : 500 }}
                      >
                        {tab}{tab === "Notes" && notesForActive.length > 0 ? ` (${notesForActive.length})` : ""}
                        {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A6FA5]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto bg-[#FAFBFC]">
                  {sidebarTab === "Details" && (
                    <div className="p-3">
                      <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{selectedDayJob.client}</div>
                            <div className="text-[12px] text-[#546478] mt-0.5">{selectedDayJob.service}</div>
                            <div className="text-[11px] text-[#8899AA] mt-1">{selectedDayJob.address}</div>
                          </div>
                          <a href="tel:+18132867572" className="flex items-center gap-1.5 shrink-0 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                            <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                            (813) 286-7572
                          </a>
                        </div>
                        <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                          {[
                            { icon: "engineering", label: "Person", value: TEAM.find((member) => member.id === selectedDayJob.technicianId)?.name ?? "Unassigned" },
                            { icon: "event", label: "Time", value: `${formatRegionalTime(selectedDayJob.start, regionalSettings)} - ${formatRegionalTime(selectedDayJob.end, regionalSettings)}` },
                            { icon: "attach_money", label: "Amount", value: `$${selectedDayJob.amount.toLocaleString("en-US")}` },
                          ].map((field) => (
                            <div key={field.label} className="flex items-center gap-2.5 py-2 border-b border-[#F5F7FA] last:border-0">
                              <span className="material-icons text-[#9CA3AF] shrink-0" style={{ fontSize: "16px" }}>{field.icon}</span>
                              <span className="text-[11px] text-[#8899AA] w-[58px] shrink-0">{field.label}</span>
                              <span className="text-[12px] text-[#1A2332] flex-1" style={{ fontWeight: 500 }}>{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {sidebarTab === "Notes" && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                        <span className="material-icons" style={{ fontSize: "15px" }}>work_outline</span>
                        <span style={{ fontWeight: 600 }}>Job notes</span>
                        <span>· visible to your team on this job</span>
                      </div>
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add a note for this job…"
                          className="w-full text-[12px] text-[#1A2332] resize-none outline-none placeholder:text-[#9CA3AF] min-h-[64px]"
                        />
                        <div className="flex justify-end">
                          <button onClick={addNote} disabled={!noteDraft.trim()} className="px-3 py-1.5 rounded-lg bg-[#4A6FA5] text-white text-[11px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                            Save note
                          </button>
                        </div>
                      </div>
                      {notesForActive.length === 0 ? (
                        <div className="text-center text-[11px] text-[#9CA3AF] py-4">No notes yet</div>
                      ) : (
                        notesForActive.map((note, i) => (
                          <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-[12px] text-[#1A2332]">{note}</div>
                        ))
                      )}
                    </div>
                  )}
                  {sidebarTab === "History" && (
                    <div className="p-3 space-y-2">
                      {historyForActive.map((entry, i) => (
                        <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                          <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 700 }}>{entry.when}</div>
                          <div className="text-[12px] text-[#1A2332] mt-1">{entry.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-[#E5E7EB] shrink-0 bg-white">
                  <button
                    onClick={() => updateDayStatus(selectedDayJob.id, selectedDayJob.status === "Completed" ? "Scheduled" : nextStatus(selectedDayJob.status))}
                    className="w-full py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] transition-colors mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {selectedDayJob.status === "Scheduled" ? "Start Job" : selectedDayJob.status === "In Progress" ? "Complete Job" : "Reopen Job"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/jobs/${selectedDayJob.id}`)} className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    <button onClick={() => openQuickCreate("day", currentDate, selectedDayJob.start, selectedDayJob.technicianId)} className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Reschedule</button>
                  </div>
                </div>
                </div>
              </div>
            ) : null}

          </div>
        )}

        {/* ── Route map nested inside the schedule card (day view), matches Figma ── */}
        {viewMode === "day" && (
          <div className="border-t border-[#E5E7EB] bg-white shrink-0">
            <div className="px-4 pt-4 pb-3">
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Route map</div>
            </div>
            <div className="mx-4 mb-4 rounded-xl border border-[#D8DCE6] bg-[#EAEFF3] overflow-hidden relative" style={{ height: 380 }}>
              <img
                src={routeMapImg}
                alt="Route map"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
              {ROUTE_MAP_PINS.map((pin, idx) => {
                const member = TEAM.find((person) => person.id === pin.technicianId) ?? TEAM[0];
                const techJobs = filteredDayJobs
                  .filter((job) => job.technicianId === pin.technicianId)
                  .sort((a, b) => a.start - b.start);
                const job = techJobs[pin.n - 1];
                const isSelected = job ? selectedMapJobId === job.id : false;
                return (
                  <button
                    key={idx}
                    className="absolute h-8 w-8 rounded-full text-white text-[12px] border-2 border-white shadow-md hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2332]"
                    style={{
                      left: `${pin.left}%`,
                      top: `${pin.top}%`,
                      backgroundColor: member.color,
                      fontWeight: 800,
                      zIndex: isSelected ? 2 : 1,
                      boxShadow: isSelected ? "0 0 0 3px rgba(26,35,50,0.35), 0 2px 6px rgba(0,0,0,0.35)" : undefined,
                    }}
                    onClick={() => {
                      if (!job) return;
                      setSelectedMapJobId(job.id);
                      setSelectedDayJob(job);
                    }}
                    title={job ? `${member.name}: ${job.client}` : `${member.name}: Stop ${pin.n}`}
                  >
                    {pin.n}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {quickJobDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQuickJobDraft(null)}>
          <div className="absolute inset-0 bg-black/10" />
          <form
            onSubmit={submitQuickJob}
            className="relative w-[400px] max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl border border-[#E5E7EB]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Create job</div>
              <button type="button" onClick={() => setQuickJobDraft(null)} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block">
                <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Customer</span>
                <select
                  autoFocus
                  value={quickJobDraft.client}
                  onChange={(event) => {
                    const name = event.target.value;
                    const locs = CUSTOMERS.find((c) => c.name === name)?.locations ?? [];
                    setQuickJobDraft({ ...quickJobDraft, client: name, address: locs[0] ?? "" });
                  }}
                  className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                >
                  {CUSTOMERS.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Service</span>
                  <select
                    value={quickJobDraft.service}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, service: event.target.value })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                  >
                    {jobTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Person</span>
                  <select
                    value={quickJobDraft.technicianId}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, technicianId: event.target.value })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                  >
                    {TEAM.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Start date</span>
                  <input
                    type="date"
                    value={format(quickJobDraft.date, "yyyy-MM-dd")}
                    onChange={(event) => {
                      const [y, m, d] = event.target.value.split("-").map(Number);
                      if (y && m && d) setQuickJobDraft({ ...quickJobDraft, date: new Date(y, m - 1, d) });
                    }}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Revenue</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8899AA] pointer-events-none">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={quickJobDraft.amount}
                      onChange={(event) => setQuickJobDraft({ ...quickJobDraft, amount: event.target.value })}
                      className="w-full h-10 rounded-lg border border-[#D8DCE6] pl-6 pr-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Address</span>
                <select
                  value={quickJobDraft.address}
                  onChange={(event) => setQuickJobDraft({ ...quickJobDraft, address: event.target.value })}
                  className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                >
                  {(CUSTOMERS.find((c) => c.name === quickJobDraft.client)?.locations ?? []).map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </label>
              {conflictMessage && (
                <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-3 py-2 text-[12px] text-[#B91C1C]" style={{ fontWeight: 600 }}>
                  {conflictMessage}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E5E7EB] flex justify-end gap-2">
              <button type="button" onClick={() => setQuickJobDraft(null)} className="px-4 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                Add job
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEvent && <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[#1A2332] text-white text-[13px] shadow-xl flex items-center gap-2" style={{ fontWeight: 500 }}>
          <span className="material-icons text-[#22C55E]" style={{ fontSize: "18px" }}>check_circle</span>
          {toast}
        </div>
      )}
    </div>
  );
}
