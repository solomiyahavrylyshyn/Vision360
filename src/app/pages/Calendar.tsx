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

// ── Dispatch Board Data ───────────────────────────────────────────────────
function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, "0")} ${period}`;
}

const unscheduledJobs: UnscheduledJob[] = [
  { id: 101, client: "Johnson Residence", service: "AC Not Cooling",   address: "1250 Oak Dr, Tampa, FL 33602",       highPriority: true, typeBg: "#EBF0F8", typeColor: "#4A6FA5", typeLabel: "Estimate",     amount: "$350 – $450", distance: "2.5 mi", date: "Today"    },
  { id: 102, client: "Williams Home",     service: "Install New System", address: "5332 Pine Ridge Rd, Tampa, FL",                         typeBg: "#D1FAE5", typeColor: "#16A34A", typeLabel: "Installation", amount: "$6 800",      distance: "8.7 mi", date: "Tomorrow" },
  { id: 103, client: "Anderson Office",   service: "Duct Cleaning",     address: "777 Business Park Dr, Tampa, FL",                        typeBg: "#FEF3C7", typeColor: "#D97706", typeLabel: "Service",      amount: "$600",        distance: "5.3 mi", date: "Tomorrow" },
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

type ViewMode = "month" | "week" | "day";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 12));
  const [viewMode, setViewMode] = useState<ViewMode>("week");
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
        title="Calendar"
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
          { value: "38",  label: "Total",       icon: "schedule",            color: "#4A6FA5" },
          { value: "32",  label: "Scheduled",   icon: "check_circle",        color: "#16A34A" },
          { value: "3",   label: "Unscheduled", icon: "warning",             color: "#D97706" },
          { value: "2",   label: "In Progress", icon: "play_circle_filled",  color: "#7C3AED" },
          { value: "1",   label: "On Hold",     icon: "pause_circle_filled", color: "#6B7280" },
          { value: "92%", label: "Utilization", icon: "speed",               color: "#16A34A" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-[#DDE3EE] rounded-xl px-4 py-3 shrink-0">
            <span className="material-icons shrink-0" style={{ fontSize: "20px", color: s.color }}>{s.icon}</span>
            <div>
              <div className="text-[18px] text-[#1A2332] leading-none" style={{ fontWeight: 700 }}>{s.value}</div>
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

        {/* ── DAY VIEW ── */}
        {viewMode === "day" && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-[64px_1fr] relative" style={{ height: `${GRID_H}px` }}>
                {hours.map((h) => (
                  <div key={h} className="contents">
                    <div className="h-20 flex items-start justify-end pr-3 text-[10px] text-[#9CA3AF] -mt-2" style={{ fontWeight: 500 }}>
                      {h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}
                    </div>
                    <div className="h-20 border-b border-[#E5E7EB]" />
                  </div>
                ))}
                {getEventsForDay(currentDate).map((ev) => {
                  const c = getC(ev.color);
                  const top = (ev.startHour - 7) * 80;
                  const height = ev.duration * 80 - 4;
                  return (
                    <div
                      key={ev.id}
                      className="absolute rounded-lg px-3 py-2.5 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-[#4A6FA5]"
                      style={{
                        top: `${top}px`, left: "72px", right: "16px", height: `${height}px`,
                        backgroundColor: c.bg, borderLeft: `3px solid ${c.border}`,
                      }}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>{ev.title}</div>
                          <div className="text-[12px] text-[#546478] mt-0.5 truncate">{ev.client}</div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>{ev.techInitials}</div>
                          <div className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${c.border}20`, color: c.border, fontWeight: 600 }}>{ev.status}</div>
                        </div>
                      </div>
                      {height > 60 ? (
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-[11px] text-[#8899AA] flex items-center gap-1">
                            <span className="material-icons" style={{ fontSize: "13px" }}>schedule</span>
                            {ev.startHour > 12 ? ev.startHour - 12 : ev.startHour}:00 – {(() => { const end = ev.startHour + ev.duration; return `${end > 12 ? end - 12 : end}:${ev.duration % 1 === 0.5 ? "30" : "00"}`; })()}
                          </div>
                          <div className="text-[11px] tabular-nums" style={{ fontWeight: 700, color: c.border }}>${ev.amount.toLocaleString()}</div>
                        </div>
                      ) : (
                        <div className="text-[11px] tabular-nums mt-1" style={{ fontWeight: 700, color: c.border }}>${ev.amount.toLocaleString()}</div>
                      )}
                    </div>
                  );
                })}
                <div className="absolute left-16 right-0 h-[2px] bg-[#DC2626] z-10" style={{ top: `${(9 - 7) * 80 + 30}px` }}>
                  <div className="w-2 h-2 bg-[#DC2626] rounded-full absolute -left-1 -top-0.5" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEvent && <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
