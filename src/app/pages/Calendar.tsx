import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../components/ui/page-header";
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays,
} from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  client: string;
  date: Date;
  startHour: number;
  duration: number;
  color: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
  tech: string;
  techInitials: string;
  property: string;
  amount: number;
}

interface DispatchJob {
  id: number;
  num: string;
  client: string;
  service: string;
  address: string;
  dayIdx: number;
  start: number;
  end: number;
  amount: number;
  bg: string;
  border: string;
  statusIcon?: string;
  statusIconColor?: string;
  techName: string;
  priority: string;
  jobType: string;
  source: string;
}

interface UnscheduledJob {
  id: number;
  client: string;
  service: string;
  address: string;
  highPriority?: boolean;
  typeBg: string;
  typeColor: string;
  typeLabel: string;
  amount: string;
  distance: string;
  date: string;
}

const COLORS = {
  blue:   { bg: "#EBF0F8", border: "#4A6FA5", text: "#1A2332", accent: "#4A6FA5" },
  amber:  { bg: "#FEF3C7", border: "#D97706", text: "#92400E", accent: "#D97706" },
  green:  { bg: "#D1FAE5", border: "#16A34A", text: "#14532D", accent: "#16A34A" },
  red:    { bg: "#FEE2E2", border: "#DC2626", text: "#7F1D1D", accent: "#DC2626" },
  purple: { bg: "#EDE9FE", border: "#7C3AED", text: "#4C1D95", accent: "#7C3AED" },
};

const mockEvents: CalendarEvent[] = [
  { id: 1,  title: "AC Installation",      client: "Travis Jones",  date: new Date(2026, 3, 6),  startHour: 9,  duration: 2,   color: "blue",   status: "Scheduled",   tech: "Marek Stroz",   techInitials: "MS", property: "4405 N Clark Ave", amount: 2850 },
  { id: 2,  title: "Plumbing Repair",       client: "Sarah Johnson", date: new Date(2026, 3, 6),  startHour: 13, duration: 1.5, color: "amber",  status: "In Progress", tech: "John Smith",    techInitials: "JS", property: "1220 Elm St",      amount: 425  },
  { id: 3,  title: "HVAC Maintenance",      client: "Mike Davis",    date: new Date(2026, 3, 6),  startHour: 15, duration: 1,   color: "green",  status: "Completed",   tech: "Sarah Johnson", techInitials: "SJ", property: "890 Oak Dr",       amount: 129  },
  { id: 4,  title: "Electrical Inspection", client: "Lisa Brown",    date: new Date(2026, 3, 7),  startHour: 10, duration: 2,   color: "purple", status: "Scheduled",   tech: "Marek Stroz",   techInitials: "MS", property: "567 Pine Rd",      amount: 175  },
  { id: 5,  title: "Tree Removal",          client: "James Wilson",  date: new Date(2026, 3, 8),  startHour: 8,  duration: 4,   color: "red",    status: "Overdue",     tech: "Mike Davis",    techInitials: "MD", property: "234 Maple Ln",     amount: 850  },
  { id: 6,  title: "Gutter Cleaning",       client: "Anna Lee",      date: new Date(2026, 3, 9),  startHour: 11, duration: 1.5, color: "blue",   status: "Scheduled",   tech: "John Smith",    techInitials: "JS", property: "56 Birch Ct",      amount: 180  },
  { id: 7,  title: "Fence Repair",          client: "Tom Richards",  date: new Date(2026, 3, 10), startHour: 9,  duration: 3,   color: "amber",  status: "Scheduled",   tech: "Marek Stroz",   techInitials: "MS", property: "12 Cedar Way",     amount: 625  },
  { id: 8,  title: "Lawn Service",          client: "Emily Clark",   date: new Date(2026, 3, 13), startHour: 8,  duration: 2,   color: "green",  status: "Scheduled",   tech: "Sarah Johnson", techInitials: "SJ", property: "88 Willow Dr",     amount: 95   },
  { id: 9,  title: "Roof Inspection",       client: "David Park",    date: new Date(2026, 3, 15), startHour: 10, duration: 2.5, color: "blue",   status: "Scheduled",   tech: "Marek Stroz",   techInitials: "MS", property: "321 Aspen Blvd",  amount: 250  },
  { id: 10, title: "Window Install",        client: "Karen White",   date: new Date(2026, 3, 20), startHour: 9,  duration: 5,   color: "purple", status: "Scheduled",   tech: "John Smith",    techInitials: "JS", property: "45 Spruce Rd",     amount: 1450 },
];

// ── Dispatch Board Data (Week view) ──────────────────────────────────────────
function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${period}`;
}

const unscheduledJobs: UnscheduledJob[] = [
  { id: 101, client: "Johnson Residence", service: "AC Not Cooling",   address: "1250 Oak Dr, Tampa, FL 33602",    highPriority: true, typeBg: "#EBF0F8", typeColor: "#4A6FA5", typeLabel: "Estimate",     amount: "$350 – $450", distance: "2.5 mi", date: "Today"    },
  { id: 102, client: "Williams Home",     service: "Install New System", address: "5332 Pine Ridge Rd, Tampa, FL",                      typeBg: "#D1FAE5", typeColor: "#16A34A", typeLabel: "Installation", amount: "$6 800",      distance: "8.7 mi", date: "Tomorrow" },
  { id: 103, client: "Anderson Office",   service: "Duct Cleaning",     address: "777 Business Park Dr, Tampa, FL",                     typeBg: "#FEF3C7", typeColor: "#D97706", typeLabel: "Service",      amount: "$600",        distance: "5.3 mi", date: "Tomorrow" },
];

const dispatchJobs: DispatchJob[] = [
  { id: 1,  num: "2401", client: "Smith Resi...",  service: "AC Repair",       address: "123 Main St",     dayIdx: 1, start: 8,    end: 10,   amount: 89,   bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "Marek Stroz",   priority: "Normal", jobType: "Repair",       source: "Phone" },
  { id: 2,  num: "2402", client: "Miller Resi...", service: "AC Repair",       address: "862 Pine St",     dayIdx: 1, start: 8,    end: 10,   amount: 210,  bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "John Smith",    priority: "Normal", jobType: "Repair",       source: "Web"   },
  { id: 3,  num: "2403", client: "Brown Ho...",    service: "AC Repair",       address: "456 Elm St",      dayIdx: 1, start: 10,   end: 12,   amount: 385,  bg: "#FEF3C7", border: "#D97706", statusIcon: "play_circle",     statusIconColor: "#D97706", techName: "Marek Stroz",   priority: "High",   jobType: "Repair",       source: "Phone" },
  { id: 4,  num: "2404", client: "Wilson Ho...",   service: "AC Tune-Up",      address: "135 Cedar Dr",    dayIdx: 2, start: 8,    end: 10,   amount: 2005, bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "Sarah Johnson", priority: "Normal", jobType: "Maintenance",  source: "App"   },
  { id: 5,  num: "2405", client: "Taylor Home",    service: "Water Heater",    address: "852 Bay St",      dayIdx: 2, start: 8,    end: 11,   amount: 2005, bg: "#EDE9FE", border: "#7C3AED", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "Mike Davis",    priority: "Normal", jobType: "Repair",       source: "Phone" },
  { id: 6,  num: "2406", client: "Jackson R...",   service: "Leak Repair",     address: "951 Lake Dr",     dayIdx: 2, start: 11.5, end: 13.5, amount: 320,  bg: "#FEE2E2", border: "#DC2626", statusIcon: "warning",         statusIconColor: "#DC2626", techName: "John Smith",    priority: "High",   jobType: "Repair",       source: "Phone" },
  { id: 7,  num: "2407", client: "Moore Resi...",  service: "AC Repair",       address: "753 Spruce St",   dayIdx: 2, start: 12.5, end: 14.5, amount: 129,  bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "hourglass_empty", statusIconColor: "#8899AA", techName: "Marek Stroz",   priority: "Normal", jobType: "Repair",       source: "Web"   },
  { id: 8,  num: "2408", client: "Clark Resi...",  service: "Receiver Upgr.",  address: "951 Hillside Dr", dayIdx: 4, start: 8,    end: 10,   amount: 2400, bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "Sarah Johnson", priority: "Normal", jobType: "Installation", source: "App"   },
  { id: 9,  num: "2409", client: "Hall Home",      service: "Receiver Upgr.",  address: "753 Summit St",   dayIdx: 4, start: 10.5, end: 12,   amount: 750,  bg: "#EDE9FE", border: "#7C3AED", statusIcon: "check_circle",    statusIconColor: "#16A34A", techName: "John Smith",    priority: "Normal", jobType: "Installation", source: "Web"   },
  { id: 10, num: "2410", client: "Lewis Resi...",  service: "Wiring Inspec.",  address: "952 Ridge Dr",    dayIdx: 5, start: 13,   end: 15,   amount: 180,  bg: "#FEF3C7", border: "#D97706", statusIcon: "warning",         statusIconColor: "#D97706", techName: "Mike Davis",    priority: "Normal", jobType: "Inspection",   source: "Phone" },
];

// ── Day / Gantt Data ──────────────────────────────────────────────────────────
const TECHNICIANS = [
  { id: 1, name: "Peter",  initials: "PE", color: "#4A6FA5", revenue: "$7,898", route: 1, calls: 3, success: 47 },
  { id: 2, name: "Travis", initials: "TR", color: "#7C3AED", revenue: "$6,420", route: 2, calls: 4, success: 52 },
  { id: 3, name: "Igor",   initials: "IG", color: "#16A34A", revenue: "$4,185", route: 3, calls: 3, success: 41 },
];

interface GanttJob {
  id: number;
  techId: number;
  start: number;
  end: number;
  client: string;
  service: string;
  address: string;
  amount: number;
  bg: string;
  border: string;
  statusIcon: string;
  statusColor: string;
}

const DAY_JOBS: GanttJob[] = [
  // Peter
  { id: 1,  techId: 1, start: 8,    end: 10,   client: "Miller Residence", service: "AC Repair",         address: "862 Pine St",          amount: 420,  bg: "#FEF3C7", border: "#D97706", statusIcon: "calendar_today", statusColor: "#D97706" },
  { id: 2,  techId: 1, start: 10,   end: 12,   client: "Brown Home",       service: "AC Repair",         address: "456 Elm St",           amount: 385,  bg: "#FEE2E2", border: "#DC2626", statusIcon: "cancel",         statusColor: "#DC2626" },
  { id: 3,  techId: 1, start: 13,   end: 15,   client: "Clark Residence",  service: "Receiver Upgrade",  address: "951 Hillside Dr",      amount: 2400, bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "near_me",        statusColor: "#4A6FA5" },
  { id: 4,  techId: 1, start: 15.5, end: 17.5, client: "Hall Home",        service: "Water Heater",      address: "753 Summit St",        amount: 750,  bg: "#D1FAE5", border: "#16A34A", statusIcon: "play_circle",    statusColor: "#16A34A" },
  // Travis
  { id: 5,  techId: 2, start: 8,    end: 11,   client: "Taylor Home",      service: "Water Heater",      address: "852 Bay St",           amount: 1150, bg: "#EDE9FE", border: "#7C3AED", statusIcon: "calendar_today", statusColor: "#D97706" },
  { id: 6,  techId: 2, start: 11.5, end: 13.5, client: "Jackson Residence",service: "Leak Repair",       address: "951 Lake Dr",          amount: 2005, bg: "#FEE2E2", border: "#DC2626", statusIcon: "check_circle",   statusColor: "#16A34A" },
  { id: 7,  techId: 2, start: 14,   end: 16,   client: "Cooper Office",    service: "Maintenance",       address: "600 Main St",          amount: 450,  bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle",   statusColor: "#16A34A" },
  { id: 8,  techId: 2, start: 16.5, end: 18,   client: "Smith Residence",  service: "Estimate",          address: "123 Oak St",           amount: 0,    bg: "#F3F4F6", border: "#6B7280", statusIcon: "pause_circle",   statusColor: "#6B7280" },
  // Igor
  { id: 9,  techId: 3, start: 8,    end: 10,   client: "Williams Home",    service: "Install New System",address: "5332 Pine Ridge Rd",   amount: 1800, bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle",   statusColor: "#16A34A" },
  { id: 10, techId: 3, start: 10.5, end: 12,   client: "Lewis Residence",  service: "Wiring Inspect.",   address: "952 Ridge Dr",         amount: 180,  bg: "#FEF3C7", border: "#D97706", statusIcon: "check_circle",   statusColor: "#16A34A" },
  { id: 11, techId: 3, start: 13,   end: 14.5, client: "Anderson Office",  service: "Duct Cleaning",     address: "777 Business Park Dr", amount: 600,  bg: "#FEE2E2", border: "#DC2626", statusIcon: "cancel",         statusColor: "#DC2626" },
  { id: 12, techId: 3, start: 15,   end: 17,   client: "Johnson Residence",service: "AC Not Cooling",    address: "1250 Oak Dr",          amount: 750,  bg: "#D1FAE5", border: "#16A34A", statusIcon: "play_circle",    statusColor: "#16A34A" },
];

const DAY_UNSCHEDULED = [
  { id: 201, client: "Baker Residence",  service: "AC Not Cooling",     address: "321 Cedar Dr",     date: "Today",    amount: "$750",   highPriority: true  },
  { id: 202, client: "Green Residence",  service: "Install Thermostat", address: "789 Maple St",     date: "Today",    amount: "$450",   highPriority: false },
  { id: 203, client: "Evans Home",       service: "Maintenance",        address: "159 Pine St",      date: "Tomorrow", amount: "$320",   highPriority: false },
  { id: 204, client: "Wilson Residence", service: "AC Repair",          address: "357 Lake View Dr", date: "Tomorrow", amount: "$2,730", highPriority: false },
];

// Gantt constants
const GANTT_START_HOUR = 7;   // 7 AM
const GANTT_END_HOUR   = 18;  // 6 PM (exclusive label at 18)
const HOUR_WIDTH       = 90;  // px per hour
const ROW_HEIGHT       = 110; // px per technician row
const CURRENT_TIME     = 10.5; // 10:30 AM

type ViewMode = "month" | "week" | "day";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 12));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDispatchJob, setSelectedDispatchJob] = useState<DispatchJob | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

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

  const EventPopover = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    const c = getC(event.color);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden border border-[#DDE3EE]" onClick={e => e.stopPropagation()}>
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
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "17px" }}>engineering</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>{event.techInitials}</div>
                  <span className="text-[#1A2332] text-[12px]" style={{ fontWeight: 500 }}>{event.tech}</span>
                </div>
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
              <button className="px-3 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDE3EE] rounded-lg bg-white text-[13px] text-[#374151] hover:bg-[#F5F7FA]">
              All Technicians (3)
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>keyboard_arrow_down</span>
            </button>
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
            <button
              onClick={() => navigate("/jobs/new")}
              className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
              Create Job
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
        {[
          { value: "28",     label: "Total Jobs",   icon: "work",                color: "#4A6FA5" },
          { value: "22",     label: "Scheduled",    icon: "check_circle",        color: "#16A34A" },
          { value: "4",      label: "Unscheduled",  icon: "warning",             color: "#D97706" },
          { value: "3",      label: "In Progress",  icon: "play_circle_filled",  color: "#7C3AED" },
          { value: "1",      label: "Cancelled",    icon: "cancel",              color: "#DC2626" },
          { value: "$18,503",label: "Revenue",      icon: "attach_money",        color: "#16A34A", sub: "+12%" },
          { value: "92%",    label: "Success",      icon: "speed",               color: "#16A34A" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-[#DDE3EE] rounded-xl px-4 py-3 shrink-0">
            <span className="material-icons shrink-0" style={{ fontSize: "20px", color: s.color }}>{s.icon}</span>
            <div>
              <div className="text-[18px] text-[#1A2332] leading-none" style={{ fontWeight: 700 }}>{s.value}</div>
              {"sub" in s && s.sub && (
                <div className="text-[10px] mt-0.5" style={{ color: "#16A34A", fontWeight: 600 }}>{s.sub} ↑</div>
              )}
              <div className="text-[11px] text-[#546478] mt-0.5 whitespace-nowrap">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar content */}
      <div className="flex-1 bg-white border border-[#DDE3EE] rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 0 }}>

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

        {/* ── WEEK / DISPATCH BOARD ── */}
        {viewMode === "week" && (
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

            {/* Left: Unscheduled */}
            <div className="w-[210px] shrink-0 border-r border-[#DDE3EE] flex flex-col bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-3 border-b border-[#DDE3EE] shrink-0">
                <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Unscheduled</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px]" style={{ fontWeight: 700 }}>3</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {unscheduledJobs.map(job => (
                  <div key={job.id} className="bg-[#FAFBFC] border border-[#E5E7EB] rounded-lg p-2.5 cursor-pointer hover:border-[#4A6FA5] hover:bg-white transition-all">
                    {job.highPriority && (
                      <div className="text-[10px] text-[#DC2626] mb-1 flex items-center gap-1" style={{ fontWeight: 600 }}>
                        <span className="material-icons" style={{ fontSize: "11px" }}>priority_high</span>
                        High Priority
                      </div>
                    )}
                    <div className="text-[12px] text-[#1A2332] mb-0.5" style={{ fontWeight: 600 }}>{job.client}</div>
                    <div className="text-[11px] text-[#546478] mb-1.5 truncate">{job.service}</div>
                    <div className="text-[10px] text-[#8899AA] mb-2" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.address}</div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ fontWeight: 600, backgroundColor: job.typeBg, color: job.typeColor }}>{job.typeLabel}</span>
                      <span className="text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>{job.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8899AA]">
                      <span>{job.distance}</span>
                      <span>{job.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Grid */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Day headers */}
              <div className="grid shrink-0 border-b border-[#E5E7EB] bg-[#FAFBFC]" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                <div />
                {weekDays.map((d, i) => {
                  const isTodayD = isSameDay(d, new Date(2026, 3, 14));
                  const dayTotal = dispatchJobs.filter(j => j.dayIdx === i).reduce((sum, j) => sum + j.amount, 0);
                  return (
                    <div key={i} className="py-2.5 text-center border-l border-[#E5E7EB]">
                      <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>{format(d, "EEE")}</div>
                      <div className={`text-[16px] mt-0.5 ${isTodayD ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: isTodayD ? 700 : 600 }}>
                        {format(d, "d")}
                      </div>
                      {dayTotal > 0 && (
                        <div className="text-[10px] mt-0.5" style={{ fontWeight: 600, color: "#16A34A" }}>${dayTotal.toLocaleString()}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="flex-1 overflow-auto relative">
                <div className="relative" style={{ height: `${GRID_H}px` }}>
                  {/* Hour rows */}
                  {hours.map((h) => (
                    <div key={h} className="absolute w-full flex" style={{ top: `${(h - 7) * 64}px`, height: "64px" }}>
                      <div className="w-[52px] shrink-0 flex items-start justify-end pr-2 -mt-2 text-[10px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                        {h > 12 ? h - 12 : h}{h >= 12 ? "PM" : "AM"}
                      </div>
                      {weekDays.map((_, ti) => (
                        <div key={ti} className="flex-1 border-l border-b border-[#E5E7EB]" />
                      ))}
                    </div>
                  ))}

                  {/* Open time slots */}
                  {[0, 3, 6].map((dayIdx) => (
                    <div
                      key={`open-${dayIdx}`}
                      className="absolute rounded-lg border border-dashed border-[#DDE3EE] bg-[#FAFBFC] flex items-center justify-center"
                      style={{
                        top: `${(8 - 7) * 64}px`,
                        height: `${10 * 64 - 2}px`,
                        left: `calc(52px + ${dayIdx} * ((100% - 52px) / 7) + 2px)`,
                        width: `calc((100% - 52px) / 7 - 4px)`,
                      }}
                    >
                      <div className="text-[10px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>Open</div>
                    </div>
                  ))}

                  {/* Dispatch jobs */}
                  {dispatchJobs.map((job) => {
                    const top = (job.start - 7) * 64;
                    const heightNum = (job.end - job.start) * 64 - 2;
                    const isSelected = selectedDispatchJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        className="absolute rounded-lg overflow-hidden cursor-pointer transition-all border border-transparent hover:border-[#4A6FA5] hover:shadow-sm"
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(heightNum, 24)}px`,
                          left: `calc(52px + ${job.dayIdx} * ((100% - 52px) / 7) + 2px)`,
                          width: `calc((100% - 52px) / 7 - 4px)`,
                          backgroundColor: job.bg,
                          borderLeft: `3px solid ${job.border}`,
                          boxShadow: isSelected ? `0 0 0 2px ${job.border}` : "none",
                        }}
                        onClick={() => setSelectedDispatchJob(isSelected ? null : job)}
                      >
                        <div className="px-2 py-1.5 h-full flex flex-col">
                          <div className="text-[9px] text-[#9CA3AF] tabular-nums mb-0.5">{fmtHour(job.start)} – {fmtHour(job.end)}</div>
                          <div className="text-[11px] leading-tight truncate" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</div>
                          <div className="text-[10px] text-[#546478] truncate">{job.service}</div>
                          {heightNum > 62 && <div className="text-[10px] text-[#9CA3AF] truncate mt-0.5">{job.address}</div>}
                          <div className="flex items-center justify-between mt-auto pt-1">
                            <span className="text-[10px] tabular-nums" style={{ fontWeight: 700, color: job.border }}>${job.amount.toLocaleString()}</span>
                            {job.statusIcon && <span className="material-icons" style={{ fontSize: "13px", color: job.statusIconColor }}>{job.statusIcon}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  <div
                    className="absolute z-10 pointer-events-none"
                    style={{ top: `${(10.5 - 7) * 64}px`, left: "52px", right: 0, height: "2px", backgroundColor: "#DC2626" }}
                  >
                    <div className="w-2 h-2 bg-[#DC2626] rounded-full absolute -left-1 -top-0.5" />
                    <div className="absolute -top-3.5 left-2 text-[9px] text-[#DC2626] bg-white px-1.5 py-0.5 rounded border border-[#DC2626]" style={{ fontWeight: 600 }}>10:30 AM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Job detail panel */}
            {selectedDispatchJob && (
              <div className="w-[320px] shrink-0 flex flex-col overflow-hidden border-l border-[#DDE3EE] bg-white">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#DDE3EE] shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Job #{selectedDispatchJob.num}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: "#D1FAE5", color: "#16A34A" }}>Scheduled</span>
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
                  <div className="p-4 bg-white mx-3 mt-3 rounded-xl border border-[#DDE3EE]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{selectedDispatchJob.client}</div>
                        <div className="text-[12px] text-[#546478] mt-0.5">{selectedDispatchJob.service}</div>
                        <div className="text-[11px] text-[#8899AA] mt-1">{selectedDispatchJob.address}</div>
                        <div className="text-[11px] text-[#8899AA]">Tampa, FL 33602</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button className="w-8 h-8 rounded-lg border border-[#DDE3EE] flex items-center justify-center hover:bg-[#F5F7FA] transition-colors">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "17px" }}>phone</span>
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-[#DDE3EE] flex items-center justify-center hover:bg-[#F5F7FA] transition-colors">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "17px" }}>chat</span>
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-[#E5E7EB] pt-3 mt-3">
                      {[
                        { icon: "event",        label: "Time",   value: `${fmtHour(selectedDispatchJob.start)} – ${fmtHour(selectedDispatchJob.end)}` },
                        { icon: "engineering",  label: "Tech",   value: selectedDispatchJob.techName },
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
                <div className="p-4 border-t border-[#DDE3EE] shrink-0 bg-white">
                  <button className="w-full py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] transition-colors mb-2" style={{ fontWeight: 600 }}>
                    Start Job
                  </button>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border border-[#DDE3EE] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    <button className="flex-1 py-2 border border-[#DDE3EE] text-[#546478] rounded-lg text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Reschedule</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DAY VIEW — Horizontal Gantt Dispatch Board ── */}
        {viewMode === "day" && (
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

            {/* Left: Technician column (240px fixed) */}
            <div className="shrink-0 flex flex-col border-r border-[#DDE3EE] bg-[#FAFBFC]" style={{ width: 240 }}>
              {/* Header spacer matching time header */}
              <div className="border-b border-[#E5E7EB] bg-[#FAFBFC] shrink-0" style={{ height: 40 }}>
                <div className="flex items-center h-full px-4">
                  <span className="text-[11px] text-[#8899AA] uppercase tracking-wide" style={{ fontWeight: 600 }}>Technician</span>
                </div>
              </div>
              {/* Tech rows */}
              {TECHNICIANS.map((tech) => (
                <div
                  key={tech.id}
                  className="flex flex-col justify-center px-4 border-b border-[#E5E7EB] bg-white shrink-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] shrink-0"
                      style={{ backgroundColor: tech.color, fontWeight: 700 }}
                    >
                      {tech.initials}
                    </div>
                    <div>
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{tech.name}</div>
                      <div className="text-[11px] text-[#8899AA]">Route #{tech.route} · {tech.calls} calls</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-11">
                    <span className="text-[11px] tabular-nums" style={{ fontWeight: 700, color: "#16A34A" }}>{tech.revenue}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{tech.success}% success</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Center: Scrollable time grid */}
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

                  {/* Tech rows with job blocks */}
                  {TECHNICIANS.map((tech) => {
                    const techJobs = DAY_JOBS.filter(j => j.techId === tech.id);
                    return (
                      <div
                        key={tech.id}
                        className="relative border-b border-[#E5E7EB]"
                        style={{ height: ROW_HEIGHT }}
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

                        {/* Job blocks */}
                        {techJobs.map((job) => {
                          const left = (job.start - GANTT_START_HOUR) * HOUR_WIDTH + 3;
                          const width = (job.end - job.start) * HOUR_WIDTH - 6;
                          const timeLabel = `${fmtHour(job.start)} – ${fmtHour(job.end)}`;
                          return (
                            <div
                              key={job.id}
                              className="absolute rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                              style={{
                                left,
                                width: Math.max(width, 60),
                                top: 8,
                                height: ROW_HEIGHT - 16,
                                backgroundColor: job.bg,
                                borderLeft: `3px solid ${job.border}`,
                              }}
                            >
                              <div className="flex flex-col h-full px-2 py-1.5">
                                <div className="text-[9px] text-[#9CA3AF] tabular-nums mb-0.5 shrink-0">{timeLabel}</div>
                                <div className="text-[11px] leading-tight truncate shrink-0" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</div>
                                <div className="text-[10px] text-[#546478] truncate shrink-0">{job.service}</div>
                                <div className="text-[10px] text-[#9CA3AF] truncate mt-0.5 flex-1 min-h-0">{job.address}</div>
                                <div className="flex items-center justify-between mt-1 shrink-0">
                                  {job.amount > 0 ? (
                                    <span className="text-[10px] tabular-nums" style={{ fontWeight: 700, color: job.border }}>${job.amount.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-[10px] text-[#9CA3AF]">—</span>
                                  )}
                                  <span className="material-icons" style={{ fontSize: "13px", color: job.statusColor }}>{job.statusIcon}</span>
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

            {/* Right: Unscheduled panel (220px fixed) */}
            <div className="shrink-0 flex flex-col border-l border-[#DDE3EE] bg-white overflow-hidden" style={{ width: 220 }}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#DDE3EE] shrink-0" style={{ height: 40 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Unscheduled</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{ fontWeight: 700, backgroundColor: "#FEF3C7", color: "#D97706" }}
                  >
                    4
                  </span>
                </div>
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>grid_view</span>
              </div>

              {/* Job cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {DAY_UNSCHEDULED.map((job) => (
                  <div
                    key={job.id}
                    className="bg-[#FAFBFC] border border-[#E5E7EB] rounded-lg p-2.5 cursor-pointer hover:border-[#4A6FA5] hover:bg-white transition-all"
                  >
                    {job.highPriority && (
                      <div className="text-[10px] text-[#DC2626] mb-1 flex items-center gap-1" style={{ fontWeight: 600 }}>
                        <span className="material-icons" style={{ fontSize: "11px" }}>priority_high</span>
                        High Priority
                      </div>
                    )}
                    <div className="text-[12px] text-[#1A2332] mb-0.5 truncate" style={{ fontWeight: 600 }}>{job.client}</div>
                    <div className="text-[11px] text-[#546478] mb-1 truncate">{job.service}</div>
                    <div className="text-[10px] text-[#9CA3AF] mb-2 truncate">{job.address}</div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: job.date === "Today" ? "#FEF3C7" : "#F3F4F6",
                          color: job.date === "Today" ? "#D97706" : "#6B7280",
                          fontWeight: 600,
                        }}
                      >
                        {job.date}
                      </span>
                      <span className="text-[11px] tabular-nums" style={{ fontWeight: 700, color: "#1A2332" }}>{job.amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 border-t border-[#DDE3EE] shrink-0">
                <button className="w-full text-[12px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors text-left" style={{ fontWeight: 600 }}>
                  + View all unscheduled
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map placeholder — below main card, only in Day view */}
      {viewMode === "day" && (
        <div
          className="mt-4 rounded-xl flex flex-col items-center justify-center gap-2 shrink-0"
          style={{ backgroundColor: "#E5E7EB", height: 220 }}
        >
          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "32px" }}>map</span>
          <span className="text-[13px] text-[#9CA3AF]" style={{ fontWeight: 500 }}>Map view coming soon</span>
        </div>
      )}

      {/* Legend bar — bottom, outside main card */}
      <div className="mt-4 bg-white border border-[#DDE3EE] rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 shrink-0">
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
        <div className="w-px h-4 bg-[#DDE3EE] mx-1" />
        {[
          { label: "Scheduled",   color: "#D97706" },
          { label: "Dispatched",  color: "#4A6FA5" },
          { label: "Enroute",     color: "#4A6FA5" },
          { label: "In Progress", color: "#7C3AED" },
          { label: "Paused",      color: "#6B7280" },
          { label: "Cancelled",   color: "#DC2626" },
          { label: "Completed",   color: "#16A34A" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-[#546478]" style={{ fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {selectedEvent && <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
