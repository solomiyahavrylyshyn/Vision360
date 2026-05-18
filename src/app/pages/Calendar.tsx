import { useState, useMemo, type DragEvent, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../components/ui/page-header";
import { CreateActionButton } from "../components/ui/create-action-button";
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays,
} from "date-fns";

type JobStatus = "Scheduled" | "In Progress" | "Completed";

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

const STATUS_STYLES: Record<JobStatus, { bg: string; color: string }> = {
  Scheduled: { bg: "#EBF0F8", color: "#4A6FA5" },
  "In Progress": { bg: "#FEF3C7", color: "#D97706" },
  Completed: { bg: "#D1FAE5", color: "#16A34A" },
};

const nextStatus = (status: JobStatus): JobStatus => {
  if (status === "Scheduled") return "In Progress";
  if (status === "In Progress") return "Completed";
  return "Scheduled";
};

const mockEvents: CalendarEvent[] = [
  { id: 1,  title: "AC Installation",      client: "Travis Jones",  date: new Date(2026, 3, 6),  startHour: 9,  duration: 2,   color: "blue",   status: "Scheduled",   property: "4405 N Clark Ave", amount: 2850 },
  { id: 2,  title: "Plumbing Repair",       client: "Sarah Johnson", date: new Date(2026, 3, 6),  startHour: 13, duration: 1.5, color: "amber",  status: "In Progress", property: "1220 Elm St",      amount: 425  },
  { id: 3,  title: "HVAC Maintenance",      client: "Mike Davis",    date: new Date(2026, 3, 6),  startHour: 15, duration: 1,   color: "green",  status: "Completed",   property: "890 Oak Dr",       amount: 129  },
  { id: 4,  title: "Electrical Inspection", client: "Lisa Brown",    date: new Date(2026, 3, 7),  startHour: 10, duration: 2,   color: "purple", status: "Scheduled",   property: "567 Pine Rd",      amount: 175  },
  { id: 5,  title: "Tree Removal",          client: "James Wilson",  date: new Date(2026, 3, 8),  startHour: 8,  duration: 4,   color: "red",    status: "Scheduled",   property: "234 Maple Ln",     amount: 850  },
  { id: 6,  title: "Gutter Cleaning",       client: "Anna Lee",      date: new Date(2026, 3, 9),  startHour: 11, duration: 1.5, color: "blue",   status: "Scheduled",   property: "56 Birch Ct",      amount: 180  },
  { id: 7,  title: "Fence Repair",          client: "Tom Richards",  date: new Date(2026, 3, 10), startHour: 9,  duration: 3,   color: "amber",  status: "Scheduled",   property: "12 Cedar Way",     amount: 625  },
  { id: 8,  title: "Lawn Service",          client: "Emily Clark",   date: new Date(2026, 3, 13), startHour: 8,  duration: 2,   color: "green",  status: "Scheduled",   property: "88 Willow Dr",     amount: 95   },
  { id: 9,  title: "Roof Inspection",       client: "David Park",    date: new Date(2026, 3, 15), startHour: 10, duration: 2.5, color: "blue",   status: "Scheduled",   property: "321 Aspen Blvd",  amount: 250  },
  { id: 10, title: "Window Install",        client: "Karen White",   date: new Date(2026, 3, 20), startHour: 9,  duration: 5,   color: "purple", status: "Scheduled",   property: "45 Spruce Rd",     amount: 1450 },
];

// ── Dispatch Board Data (Week view) ──────────────────────────────────────────
function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${period}`;
}

const dispatchJobs: DispatchJob[] = [
  { id: 1,  num: "2401", technicianId: "peter",  client: "Smith Resi...",  service: "AC Repair",       address: "123 Main St",     status: "Scheduled",   dayIdx: 1, start: 8,    end: 10,   amount: 89,   bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Repair",       source: "Phone" },
  { id: 2,  num: "2402", technicianId: "travis", client: "Miller Resi...", service: "AC Repair",       address: "862 Pine St",     status: "In Progress", dayIdx: 1, start: 8,    end: 10,   amount: 210,  bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Repair",       source: "Web"   },
  { id: 3,  num: "2403", technicianId: "maria",  client: "Brown Ho...",    service: "AC Repair",       address: "456 Elm St",      status: "Completed",   dayIdx: 1, start: 10,   end: 12,   amount: 385,  bg: "#FEF3C7", border: "#D97706", priority: "High",   jobType: "Repair",       source: "Phone" },
  { id: 4,  num: "2404", technicianId: "peter",  client: "Wilson Ho...",   service: "AC Tune-Up",      address: "135 Cedar Dr",    status: "Scheduled",   dayIdx: 2, start: 8,    end: 10,   amount: 2005, bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Maintenance",  source: "App"   },
  { id: 5,  num: "2405", technicianId: "travis", client: "Taylor Home",    service: "Water Heater",    address: "852 Bay St",      status: "Scheduled",   dayIdx: 2, start: 8,    end: 11,   amount: 2005, bg: "#EDE9FE", border: "#7C3AED", priority: "Normal", jobType: "Repair",       source: "Phone" },
  { id: 6,  num: "2406", technicianId: "travis", client: "Jackson R...",   service: "Leak Repair",     address: "951 Lake Dr",     status: "In Progress", dayIdx: 2, start: 11.5, end: 13.5, amount: 320,  bg: "#FEE2E2", border: "#DC2626", priority: "High",   jobType: "Repair",       source: "Phone" },
  { id: 7,  num: "2407", technicianId: "maria",  client: "Moore Resi...",  service: "AC Repair",       address: "753 Spruce St",   status: "Scheduled",   dayIdx: 2, start: 12.5, end: 14.5, amount: 129,  bg: "#EBF0F8", border: "#4A6FA5", priority: "Normal", jobType: "Repair",       source: "Web"   },
  { id: 8,  num: "2408", technicianId: "peter",  client: "Clark Resi...",  service: "Receiver Upgr.",  address: "951 Hillside Dr", status: "Scheduled",   dayIdx: 4, start: 8,    end: 10,   amount: 2400, bg: "#D1FAE5", border: "#16A34A", priority: "Normal", jobType: "Installation", source: "App"   },
  { id: 9,  num: "2409", technicianId: "maria",  client: "Hall Home",      service: "Receiver Upgr.",  address: "753 Summit St",   status: "Scheduled",   dayIdx: 4, start: 10.5, end: 12,   amount: 750,  bg: "#EDE9FE", border: "#7C3AED", priority: "Normal", jobType: "Installation", source: "Web"   },
  { id: 10, num: "2410", technicianId: "travis", client: "Lewis Resi...",  service: "Wiring Inspec.",  address: "952 Ridge Dr",    status: "Completed",   dayIdx: 5, start: 13,   end: 15,   amount: 180,  bg: "#FEF3C7", border: "#D97706", priority: "Normal", jobType: "Inspection",   source: "Phone" },
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
  { id: "peter", name: "Peter", initial: "P", color: "#4A6FA5" },
  { id: "travis", name: "Travis", initial: "T", color: "#16A34A" },
  { id: "maria", name: "Maria", initial: "M", color: "#D97706" },
];

const DAY_JOBS: DayJob[] = [
  { id: 1,  technicianId: "peter",  start: 8,    end: 10,   client: "Miller Residence",  service: "AC Repair",          address: "862 Pine St",          status: "Scheduled",   amount: 420,  bg: "#FEF3C7", border: "#D97706" },
  { id: 2,  technicianId: "peter",  start: 10.5, end: 12,   client: "Taylor Home",       service: "Water Heater",       address: "852 Bay St",           status: "In Progress", amount: 1150, bg: "#EDE9FE", border: "#7C3AED" },
  { id: 3,  technicianId: "peter",  start: 13,   end: 15,   client: "Clark Residence",   service: "Receiver Upgrade",   address: "951 Hillside Dr",      status: "Scheduled",   amount: 2400, bg: "#EBF0F8", border: "#4A6FA5" },
  { id: 4,  technicianId: "peter",  start: 15,   end: 17,   client: "Johnson Residence", service: "AC Not Cooling",     address: "1250 Oak Dr",          status: "Completed",   amount: 750,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 5,  technicianId: "travis", start: 8,    end: 10,   client: "Williams Home",     service: "Install New System", address: "5332 Pine Ridge Rd",   status: "Scheduled",   amount: 1800, bg: "#D1FAE5", border: "#16A34A" },
  { id: 6,  technicianId: "travis", start: 11.5, end: 13.5, client: "Jackson Residence", service: "Leak Repair",        address: "951 Lake Dr",          status: "In Progress", amount: 2005, bg: "#FEE2E2", border: "#DC2626" },
  { id: 7,  technicianId: "travis", start: 14,   end: 16,   client: "Cooper Office",     service: "Maintenance",        address: "600 Main St",          status: "Scheduled",   amount: 450,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 8,  technicianId: "maria",  start: 10,   end: 12,   client: "Brown Home",        service: "AC Repair",          address: "456 Elm St",           status: "Completed",   amount: 385,  bg: "#FEE2E2", border: "#DC2626" },
  { id: 9,  technicianId: "maria",  start: 13,   end: 14.5, client: "Anderson Office",   service: "Duct Cleaning",      address: "777 Business Park Dr", status: "Scheduled",   amount: 600,  bg: "#FEE2E2", border: "#DC2626" },
  { id: 10, technicianId: "maria",  start: 15.5, end: 17.5, client: "Hall Home",         service: "Water Heater",       address: "753 Summit St",        status: "Scheduled",   amount: 750,  bg: "#D1FAE5", border: "#16A34A" },
  { id: 11, technicianId: "maria",  start: 8,    end: 9,    client: "Smith Residence",   service: "Estimate",           address: "123 Oak St",           status: "Scheduled",   amount: 0,    bg: "#F3F4F6", border: "#6B7280" },
];

// Day view constants
const GANTT_START_HOUR = 7;   // 7 AM
const GANTT_END_HOUR   = 18;  // 6 PM (exclusive label at 18)
const HOUR_WIDTH       = 90;  // px per hour
const CURRENT_TIME     = 10.5; // 10:30 AM
const WEEK_LABEL_WIDTH = 220;

type ViewMode = "month" | "week" | "day";
type SlotPointerEvent = DragEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>;

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 12));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDispatchJob, setSelectedDispatchJob] = useState<DispatchJob | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [weekJobs, setWeekJobs] = useState<DispatchJob[]>(dispatchJobs);
  const [dayJobs, setDayJobs] = useState<DayJob[]>(DAY_JOBS);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [quickJobDraft, setQuickJobDraft] = useState<QuickJobDraft | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [selectedMapJobId, setSelectedMapJobId] = useState<number | null>(DAY_JOBS[0]?.id ?? null);

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

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const GRID_H = hours.length * 64;

  const getEventsForDay = (day: Date) => mockEvents.filter(e => isSameDay(e.date, day));
  const getC = (color: string) => COLORS[color as keyof typeof COLORS] || COLORS.blue;

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewMode === "week"
    ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
    : format(currentDate, "EEEE, MMMM d, yyyy");

  // Gantt grid total width
  const ganttHours = Array.from({ length: GANTT_END_HOUR - GANTT_START_HOUR + 1 }, (_, i) => GANTT_START_HOUR + i);
  const ganttTotalWidth = (GANTT_END_HOUR - GANTT_START_HOUR) * HOUR_WIDTH;
  const monthRevenue = mockEvents.reduce((sum, event) => sum + event.amount, 0);
  const weekRevenue = weekJobs.reduce((sum, job) => sum + job.amount, 0);
  const dayRevenue = dayJobs.reduce((sum, job) => sum + job.amount, 0);
  const topRevenue = viewMode === "month" ? monthRevenue : viewMode === "week" ? weekRevenue : dayRevenue;
  const topRevenueLabel = viewMode === "month" ? "Revenue this month" : viewMode === "week" ? "Revenue this week" : "Revenue today";

  const hourFromPointer = (event: SlotPointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, ganttTotalWidth - 1));
    const halfHour = Math.round((x / HOUR_WIDTH) * 2) / 2;
    return Math.max(GANTT_START_HOUR, Math.min(GANTT_END_HOUR - 0.5, GANTT_START_HOUR + halfHour));
  };

  const hasOverlap = (start: number, end: number, otherStart: number, otherEnd: number) => start < otherEnd && end > otherStart;

  const dayHasConflict = (jobs: DayJob[], jobId: number | null, technicianId: string, start: number, end: number) =>
    jobs.some((job) => job.id !== jobId && job.technicianId === technicianId && hasOverlap(start, end, job.start, job.end));

  const weekHasConflict = (jobs: DispatchJob[], jobId: number | null, dayIdx: number, technicianId: string, start: number, end: number) =>
    jobs.some((job) => job.id !== jobId && job.dayIdx === dayIdx && job.technicianId === technicianId && hasOverlap(start, end, job.start, job.end));

  const updateDayStatus = (jobId: number, status: JobStatus) => {
    setDayJobs((jobs) => jobs.map((job) => job.id === jobId ? { ...job, status } : job));
  };

  const updateWeekStatus = (jobId: number, status: JobStatus) => {
    setWeekJobs((jobs) => jobs.map((job) => job.id === jobId ? { ...job, status } : job));
    setSelectedDispatchJob((job) => job?.id === jobId ? { ...job, status } : job);
  };

  const openQuickCreate = (view: "day" | "week", date: Date, startHour: number, technicianId: string, dayIdx?: number) => {
    const start = Math.max(GANTT_START_HOUR, Math.min(GANTT_END_HOUR - 0.5, startHour));
    setConflictMessage(null);
    setQuickJobDraft({
      view,
      date,
      dayIdx,
      technicianId,
      start,
      end: Math.min(GANTT_END_HOUR, start + 1),
      client: "",
      service: "Service Call",
      address: "",
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
      setDayJobs((jobs) => [...jobs, { id: nextId, ...base }]);
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
      const duration = targetJob.end - targetJob.start;
      const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
      if (weekHasConflict(jobs, jobId, dayIdx, technicianId, dropStart, dropEnd)) {
        setConflictMessage("That move conflicts with another job for the same person.");
        return jobs;
      }
      setConflictMessage(null);
      return jobs.map((job) => {
        if (job.id !== jobId) return job;
        return { ...job, dayIdx, technicianId, start: dropStart, end: dropEnd };
      });
    });
  };

  const handleWeekDragOver = (event: DragEvent<HTMLDivElement>, dayIdx: number, technicianId: string) => {
    event.preventDefault();
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
      const duration = targetJob.end - targetJob.start;
      const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
      if (dayHasConflict(jobs, jobId, technicianId, dropStart, dropEnd)) {
        setConflictMessage("That move conflicts with another job for the same person.");
        return jobs;
      }
      setConflictMessage(null);
      return jobs.map((job) => {
        if (job.id !== jobId) return job;
        return { ...job, technicianId, start: dropStart, end: dropEnd };
      });
    });
  };

  const handleDayDragOver = (event: DragEvent<HTMLDivElement>, technicianId: string) => {
    event.preventDefault();
    setDropPreview({ view: "day", technicianId, start: hourFromPointer(event) });
  };

  const handleWeekSlotDoubleClick = (event: MouseEvent<HTMLDivElement>, date: Date, technicianId: string, dayIdx: number) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    openQuickCreate("week", date, hourFromPointer(event), technicianId, dayIdx);
  };

  const handleDaySlotDoubleClick = (event: MouseEvent<HTMLDivElement>, technicianId: string) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    openQuickCreate("day", currentDate, hourFromPointer(event), technicianId);
  };

  const selectedMapJob = dayJobs.find((job) => job.id === selectedMapJobId) ?? dayJobs[0];

  const EventPopover = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    const c = getC(event.color);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden border border-[#E5E7EB]" onClick={e => e.stopPropagation()}>
          <div className="h-1" style={{ backgroundColor: c.border }} />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-1" style={{ fontWeight: 600 }}>{event.status}</div>
                <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>{event.title}</h3>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center transition-colors">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "17px" }}>person</span>
                <span className="text-[#1A2332] text-sm" style={{ fontWeight: 500 }}>{event.client}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "17px" }}>schedule</span>
                <span className="text-[#546478] text-[12px]">{format(event.date, "EEE, MMM d")} · {event.startHour > 12 ? event.startHour - 12 : event.startHour}:00 {event.startHour >= 12 ? "PM" : "AM"} – {(() => { const end = event.startHour + event.duration; return `${end > 12 ? end - 12 : end}:${event.duration % 1 === 0.5 ? "30" : "00"} ${end >= 12 ? "PM" : "AM"}`; })()}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "17px" }}>location_on</span>
                <span className="text-[#546478] text-[12px]">{event.property}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "17px" }}>attach_money</span>
                <span className="text-[#1A2332] text-[13px] tabular-nums" style={{ fontWeight: 700 }}>${event.amount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button className="flex-1 px-4 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] transition-colors" style={{ fontWeight: 600 }}>
                View Job
              </button>
              <button className="px-3 py-2.5 border border-[#E5E7EB] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>
                Edit
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
        subtitle={
          <div className="flex items-center gap-3 ml-4">
            <div className="flex items-center gap-1">
              <button onClick={goBack} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
              </button>
              <button onClick={goToday} className="px-3 py-1.5 text-[13px] text-[#4A6FA5] hover:bg-[#EBF0F8] rounded-lg" style={{ fontWeight: 600 }}>
                Today
              </button>
              <button onClick={goForward} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
              </button>
            </div>
            <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{headerLabel}</span>
          </div>
        }
        className="mb-4"
        actions={
          <>
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
            <CreateActionButton onClick={() => navigate("/jobs/new")}>
              Create Job
            </CreateActionButton>
          </>
        }
      />

      {/* Stat cards */}
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
        {[
          { value: `$${topRevenue.toLocaleString("en-US")}`, label: topRevenueLabel, icon: "attach_money", color: "#16A34A" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 shrink-0">
            <span className="material-icons shrink-0" style={{ fontSize: "20px", color: s.color }}>{s.icon}</span>
            <div>
              <div className="text-[18px] text-[#1A2332] leading-none" style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-[11px] text-[#546478] mt-0.5 whitespace-nowrap">{s.label}</div>
            </div>
          </div>
        ))}
        {conflictMessage && (
          <div className="px-3 py-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-[12px] text-[#B91C1C]" style={{ fontWeight: 600 }}>
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

        {/* ── MONTH VIEW ── */}
        {viewMode === "month" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#FAFBFC] shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] text-[#8899AA] uppercase tracking-wide" style={{ fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, minmax(110px, 1fr))` }}>
                {monthDays.map((day, idx) => {
                  const events = getEventsForDay(day);
                  const isCurrentMo = isSameMonth(day, currentDate);
                  const isTodayD = isToday(day) || isSameDay(day, new Date(2026, 3, 6));
                  const isHovered = hoveredDay && isSameDay(day, hoveredDay);
                  return (
                    <div
                      key={idx}
                      className={`border-b border-r border-[#E5E7EB] p-2 transition-colors cursor-pointer ${
                        !isCurrentMo ? "bg-[#FAFBFC]" : isHovered ? "bg-[#F9FAFB]" : "bg-white"
                      }`}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full mb-1.5 text-[12px] ${
                        isTodayD ? "bg-[#4A6FA5] text-white" : !isCurrentMo ? "text-[#D1D5DB]" : "text-[#1A2332]"
                      }`} style={{ fontWeight: isTodayD ? 700 : 500 }}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((ev) => {
                          const c = getC(ev.color);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className="px-1.5 py-1 rounded text-[10px] truncate cursor-pointer hover:shadow-sm transition-shadow"
                              style={{ backgroundColor: c.bg, color: c.text, borderLeft: `3px solid ${c.border}`, fontWeight: 600 }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {events.length > 3 && (
                          <div className="text-[10px] text-[#9CA3AF] pl-1.5" style={{ fontWeight: 500 }}>+{events.length - 3} more</div>
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
            <div className="flex-1 overflow-auto" style={{ minWidth: 0 }}>
              <div style={{ width: ganttTotalWidth + WEEK_LABEL_WIDTH, minWidth: "100%" }}>

                {/* Sticky header: [Day-col spacer] [Hours] */}
                <div
                  className="flex sticky top-0 z-20 border-b border-[#E5E7EB] bg-[#FAFBFC]"
                  style={{ height: 40 }}
                >
                  {/* Corner spacer — sticky left */}
                  <div
                    className="shrink-0 sticky left-0 z-30 bg-[#FAFBFC] border-r border-[#E5E7EB]"
                    style={{ width: WEEK_LABEL_WIDTH, minWidth: WEEK_LABEL_WIDTH }}
                  >
                    <div className="grid h-full" style={{ gridTemplateColumns: "96px 1fr" }}>
                      <div className="flex items-center px-4 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>Day</div>
                      <div className="flex items-center px-3 border-l border-[#E5E7EB] text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>Person</div>
                    </div>
                  </div>
                  {/* Hour labels */}
                  {ganttHours.map((h) => {
                    const isCurrentHour = h === Math.floor(CURRENT_TIME);
                    const label = h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
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
                              10:30 AM
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#8899AA]" style={{ fontWeight: 500 }}>{label}</span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day rows */}
                {weekDays.map((d, dayI) => {
                  const isToday = isSameDay(d, new Date(2026, 3, 14));
                  const isWeekend = dayI === 0 || dayI === 6;
                  const labelBg = isToday ? "#DDE8F5" : isWeekend ? "#ECEEF3" : "#F8F9FB";
                  // Per Marek: shorter schedule rows so the map below gets more space
                  // (only 3 techs in MVP — wasted vertical space under each lane).
                  const ROW_H = 52;

                  return (
                    <div key={dayI}>
                      <div
                        style={{
                          height: 3,
                          minWidth: ganttTotalWidth + WEEK_LABEL_WIDTH,
                          background: isToday
                            ? `linear-gradient(90deg,#4A6FA5 ${WEEK_LABEL_WIDTH}px,#B8CADF ${WEEK_LABEL_WIDTH}px)`
                            : isWeekend
                            ? "#D4D8E2"
                            : "#DDE1E9",
                        }}
                      />

                      {TEAM.map((member, memberIdx) => {
                        const memberJobs = weekJobs
                          .filter((job) => job.dayIdx === dayI && job.technicianId === member.id)
                          .sort((a, b) => a.start - b.start);
                        const memberTotal = memberJobs.reduce((sum, job) => sum + job.amount, 0);
                        const rowBg = isToday ? "#EBF0F8" : isWeekend ? "#F4F5F8" : "#FFFFFF";

                        return (
                          <div key={`${dayI}-${member.id}`} className="flex" style={{ height: ROW_H }}>
                            <div
                              className="shrink-0 sticky left-0 z-10"
                              style={{
                                width: WEEK_LABEL_WIDTH,
                                minWidth: WEEK_LABEL_WIDTH,
                                height: ROW_H,
                                backgroundColor: labelBg,
                                borderRight: "1px solid #D8DCE6",
                                borderBottom: memberIdx === TEAM.length - 1 ? "0" : "1px solid #E5E7EB",
                              }}
                            >
                              <div className="grid h-full" style={{ gridTemplateColumns: "96px 1fr" }}>
                                <div className="flex flex-col justify-center px-4">
                                  {memberIdx === 0 && (
                                    <>
                                      <div
                                        className={`text-[13px] ${isToday ? "text-[#4A6FA5]" : isWeekend ? "text-[#8899AA]" : "text-[#1A2332]"}`}
                                        style={{ fontWeight: isToday ? 700 : 600 }}
                                      >
                                        {format(d, "EEE")}
                                      </div>
                                      <div className={`text-[12px] mt-0.5 ${isToday ? "text-[#4A6FA5]" : "text-[#9CA3AF]"}`} style={{ fontWeight: isToday ? 600 : 400 }}>
                                        {format(d, "MMM d")}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 px-3 border-l border-[#D8DCE6]">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                                    style={{ backgroundColor: member.color, fontWeight: 700 }}
                                  >
                                    {member.initial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>{member.name}</div>
                                    <div className="text-[11px] text-[#16A34A] tabular-nums" style={{ fontWeight: 600 }}>
                                      ${memberTotal.toLocaleString("en-US")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className="relative"
                              style={{ minWidth: ganttTotalWidth, height: ROW_H, backgroundColor: rowBg }}
                              onDragOver={(event) => handleWeekDragOver(event, dayI, member.id)}
                              onDragLeave={() => setDropPreview(null)}
                              onDrop={(event) => handleWeekDrop(event, dayI, member.id)}
                              onDoubleClick={(event) => handleWeekSlotDoubleClick(event, d, member.id, dayI)}
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

                              {memberJobs.length === 0 && (
                                <div className="absolute inset-2 rounded-lg border border-dashed border-[#CDD1DA] flex items-center justify-center">
                                  <div className="text-[10px] text-[#B8BEC9]" style={{ fontWeight: 500 }}>No jobs</div>
                                </div>
                              )}

                              {memberJobs.map((job, idx) => {
                                const left = (job.start - GANTT_START_HOUR) * HOUR_WIDTH + 3;
                                const width = (job.end - job.start) * HOUR_WIDTH - 6;
                                const isSelected = selectedDispatchJob?.id === job.id;
                                const routeNumber = idx + 1;
                                const statusStyle = STATUS_STYLES[job.status];
                                return (
                                  <div
                                    key={job.id}
                                    data-job-card="true"
                                    draggable
                                    className="absolute rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                    style={{
                                      left,
                                      width: Math.max(width, 70),
                                      top: 8,
                                      height: 58,
                                      backgroundColor: job.bg,
                                      borderLeft: `3px solid ${job.border}`,
                                      boxShadow: isSelected ? `0 0 0 2px ${job.border}` : "none",
                                    }}
                                    onDragStart={(event) => event.dataTransfer.setData("text/plain", `week:${job.id}`)}
                                    onClick={() => setSelectedDispatchJob(isSelected ? null : job)}
                                    onDoubleClick={(event) => event.stopPropagation()}
                                  >
                                    <div className="flex flex-col h-full px-2 py-1">
                                      <div className="flex items-center justify-between gap-2 text-[9px] text-[#9CA3AF] tabular-nums shrink-0">
                                        <span>{fmtHour(job.start)} – {fmtHour(job.end)}</span>
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white" style={{ backgroundColor: job.border, fontWeight: 700 }}>
                                          {routeNumber}
                                        </span>
                                      </div>
                                      <div className="text-[11px] leading-tight truncate" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</div>
                                      <div className="flex items-center gap-1 mt-auto shrink-0">
                                        <span className="text-[10px] text-[#546478] truncate flex-1">{job.service}</span>
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
	              <div className="w-[300px] shrink-0 flex flex-col overflow-hidden border-l border-[#E5E7EB] bg-white">
	                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E7EB] shrink-0">
	                  <div className="flex items-center gap-2">
	                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Job #{selectedDispatchJob.num}</span>
	                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: STATUS_STYLES[selectedDispatchJob.status].bg, color: STATUS_STYLES[selectedDispatchJob.status].color }}>{selectedDispatchJob.status}</span>
	                  </div>
                  <button onClick={() => setSelectedDispatchJob(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>close</span>
                  </button>
                </div>
                <div className="flex border-b border-[#E5E7EB] shrink-0">
                  {["Details", "Notes", "History"].map((tab, i) => (
                    <button key={tab} className={`flex-1 py-2.5 text-[12px] transition-colors relative ${i === 0 ? "text-[#4A6FA5]" : "text-[#546478] hover:text-[#1A2332]"}`} style={{ fontWeight: 500 }}>
                      {tab}
                      {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A6FA5]" />}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto bg-[#FAFBFC]">
                  <div className="p-4 bg-white mx-3 mt-3 rounded-xl border border-[#E5E7EB]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{selectedDispatchJob.client}</div>
                        <div className="text-[12px] text-[#546478] mt-0.5">{selectedDispatchJob.service}</div>
                        <div className="text-[11px] text-[#8899AA] mt-1">{selectedDispatchJob.address}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F5F7FA] transition-colors">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "17px" }}>phone</span>
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F5F7FA] transition-colors">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "17px" }}>chat</span>
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                      {[
                        { icon: "event",        label: "Time",   value: `${fmtHour(selectedDispatchJob.start)} – ${fmtHour(selectedDispatchJob.end)}` },
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
                    <button className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    <button className="flex-1 py-2 border border-[#E5E7EB] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Reschedule</button>
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
            <div className="shrink-0 flex flex-col bg-white border-r border-[#E5E7EB]" style={{ width: 140 }}>
              {/* Spacer aligns with time header */}
              <div className="border-b border-[#E5E7EB] bg-[#FAFBFC]" style={{ height: 40 }} />
              {TEAM.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 border-b border-[#E5E7EB]"
                  style={{ height: 96 }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                    style={{ backgroundColor: member.color, fontWeight: 700 }}
                  >
                    {member.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 600 }}>{member.name}</div>
                    <div className="text-[11px] text-[#16A34A] tabular-nums" style={{ fontWeight: 600 }}>
                      ${dayJobs.filter((job) => job.technicianId === member.id).reduce((sum, job) => sum + job.amount, 0).toLocaleString("en-US")} today
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
                      const label = h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
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
                                10:30 AM
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
                    const memberJobs = dayJobs
                      .filter((job) => job.technicianId === member.id)
                      .sort((a, b) => a.start - b.start);

                    return (
                      <div
                        key={member.id}
                        className="relative border-b border-[#E5E7EB]"
                        style={{ height: 96 }}
                        onDragOver={(event) => handleDayDragOver(event, member.id)}
                        onDragLeave={() => setDropPreview(null)}
                        onDrop={(event) => handleDayDrop(event, member.id)}
                        onDoubleClick={(event) => handleDaySlotDoubleClick(event, member.id)}
                      >
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

                        {memberJobs.map((job, idx) => {
                          const left = (job.start - GANTT_START_HOUR) * HOUR_WIDTH + 3;
                          const width = (job.end - job.start) * HOUR_WIDTH - 6;
                          const routeNumber = idx + 1;
                          const statusStyle = STATUS_STYLES[job.status];
                          return (
                            <div
                              key={job.id}
                              data-job-card="true"
                              draggable
                              className="absolute rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                              style={{
                                left,
                                width: Math.max(width, 60),
                                top: 10,
                                height: 72,
                                backgroundColor: job.bg,
                                borderLeft: `3px solid ${job.border}`,
                              }}
                              onDragStart={(event) => event.dataTransfer.setData("text/plain", `day:${job.id}`)}
                              onDoubleClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col h-full px-2 py-1">
                                <div className="flex items-center justify-between gap-2 text-[9px] text-[#9CA3AF] tabular-nums shrink-0">
                                  <span>{fmtHour(job.start)} – {fmtHour(job.end)}</span>
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white" style={{ backgroundColor: job.border, fontWeight: 700 }}>
                                    {routeNumber}
                                  </span>
                                </div>
                                <div className="text-[11px] leading-tight truncate shrink-0" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</div>
                                <div className="text-[10px] text-[#546478] truncate shrink-0">{job.service}</div>
                                <div className="flex items-center justify-between mt-auto shrink-0">
                                  {job.amount > 0 ? (
                                    <span className="text-[10px] tabular-nums" style={{ fontWeight: 700, color: job.border }}>${job.amount.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-[10px] text-[#9CA3AF]">-</span>
                                  )}
                                  <button
                                    className="px-1.5 py-0.5 rounded-full text-[9px] max-w-[88px] truncate"
                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }}
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

          </div>
        )}
      </div>

      {/* Map — below main card, only in Day view */}
      {viewMode === "day" && (
        <div
          className="mt-4 rounded-xl border border-[#D8DCE6] bg-[#EEF3F8] overflow-hidden shrink-0 relative"
          style={{ height: 240 }}
        >
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-0 right-0 top-[32%] h-[2px] bg-white" />
            <div className="absolute left-0 right-0 top-[64%] h-[2px] bg-white" />
            <div className="absolute top-0 bottom-0 left-[24%] w-[2px] bg-white" />
            <div className="absolute top-0 bottom-0 left-[52%] w-[2px] bg-white" />
            <div className="absolute top-0 bottom-0 left-[78%] w-[2px] bg-white" />
            <div className="absolute -left-10 top-10 h-32 w-[120%] rotate-[-8deg] border-y-2 border-white/80" />
          </div>
          <div className="absolute left-4 top-4 rounded-lg bg-white/95 border border-[#E5E7EB] px-3 py-2 shadow-sm">
            <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Route map</div>
            <div className="text-[11px] text-[#546478]">Pins match schedule route numbers</div>
          </div>
          {dayJobs.map((job) => {
            const member = TEAM.find((person) => person.id === job.technicianId) ?? TEAM[0];
            const memberJobs = dayJobs.filter((item) => item.technicianId === job.technicianId).sort((a, b) => a.start - b.start);
            const routeNumber = memberJobs.findIndex((item) => item.id === job.id) + 1;
            const left = 13 + ((job.id * 19 + Math.round(job.start * 7)) % 74);
            const top = 20 + ((job.id * 23 + Math.round(job.end * 11)) % 58);
            return (
              <button
                key={job.id}
                className="absolute h-8 w-8 rounded-full text-white text-[12px] shadow-md border-2 border-white hover:scale-105 transition-transform"
                style={{ left: `${left}%`, top: `${top}%`, backgroundColor: member.color, fontWeight: 800 }}
                onClick={() => setSelectedMapJobId(job.id)}
                title={`${member.name}: ${job.client}`}
              >
                {routeNumber}
              </button>
            );
          })}
          {selectedMapJob && (
            <div className="absolute right-4 bottom-4 w-[280px] rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>{selectedMapJob.client}</div>
                  <div className="text-[12px] text-[#546478] mt-0.5 truncate">{selectedMapJob.service}</div>
                  <div className="text-[11px] text-[#8899AA] mt-1 truncate">{selectedMapJob.address}</div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] shrink-0"
                  style={{ backgroundColor: STATUS_STYLES[selectedMapJob.status].bg, color: STATUS_STYLES[selectedMapJob.status].color, fontWeight: 700 }}
                >
                  {selectedMapJob.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#546478]">
                <span>{fmtHour(selectedMapJob.start)} - {fmtHour(selectedMapJob.end)}</span>
                <span className="tabular-nums" style={{ color: "#16A34A", fontWeight: 700 }}>${selectedMapJob.amount.toLocaleString("en-US")}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend bar — bottom, outside main card */}
      <div className="mt-4 bg-white border border-[#E5E7EB] rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 shrink-0">
        <span className="text-[11px] text-[#8899AA] uppercase tracking-wide mr-1" style={{ fontWeight: 600 }}>Legend:</span>
        {[
          { label: "Service",     color: "#D97706" },
          { label: "Maintenance", color: "#16A34A" },
          { label: "Installation",color: "#4A6FA5" },
          { label: "Estimate",    color: "#6B7280" },
          { label: "Emergency",   color: "#DC2626" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-[#546478]" style={{ fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {quickJobDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setQuickJobDraft(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <form
            onSubmit={submitQuickJob}
            className="relative w-[420px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Create job</div>
                <div className="text-[12px] text-[#546478] mt-0.5">
                  {format(quickJobDraft.date, "EEE, MMM d")} · {fmtHour(quickJobDraft.start)} · {TEAM.find((member) => member.id === quickJobDraft.technicianId)?.name}
                </div>
              </div>
              <button type="button" onClick={() => setQuickJobDraft(null)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block">
                <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Customer</span>
                <input
                  autoFocus
                  value={quickJobDraft.client}
                  onChange={(event) => setQuickJobDraft({ ...quickJobDraft, client: event.target.value })}
                  className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  placeholder="Customer name"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Service</span>
                  <input
                    value={quickJobDraft.service}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, service: event.target.value })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  />
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
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Start</span>
                  <input
                    type="number"
                    min={GANTT_START_HOUR}
                    max={GANTT_END_HOUR - 0.5}
                    step={0.5}
                    value={quickJobDraft.start}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, start: Number(event.target.value) })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>End</span>
                  <input
                    type="number"
                    min={GANTT_START_HOUR + 0.5}
                    max={GANTT_END_HOUR}
                    step={0.5}
                    value={quickJobDraft.end}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, end: Number(event.target.value) })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Revenue</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={quickJobDraft.amount}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, amount: event.target.value })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Address</span>
                <input
                  value={quickJobDraft.address}
                  onChange={(event) => setQuickJobDraft({ ...quickJobDraft, address: event.target.value })}
                  className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5]"
                  placeholder="Job location"
                />
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
    </div>
  );
}
