import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, startOfDay, getHours,
} from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  client: string;
  date: Date;
  startHour: number;
  duration: number; // hours
  color: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
  tech: string;
  techInitials: string;
  property: string;
}

const COLORS = {
  blue: { bg: "#EBF0F8", border: "#4A6FA5", text: "#1A2332", accent: "#4A6FA5" },
  amber: { bg: "#FEF3C7", border: "#D97706", text: "#92400E", accent: "#D97706" },
  green: { bg: "#D1FAE5", border: "#16A34A", text: "#14532D", accent: "#16A34A" },
  red: { bg: "#FEE2E2", border: "#DC2626", text: "#7F1D1D", accent: "#DC2626" },
  purple: { bg: "#EDE9FE", border: "#7C3AED", text: "#4C1D95", accent: "#7C3AED" },
};

const colorKeys = Object.keys(COLORS) as (keyof typeof COLORS)[];

const mockEvents: CalendarEvent[] = [
  { id: 1, title: "AC Installation", client: "Travis Jones", date: new Date(2026, 3, 6), startHour: 9, duration: 2, color: "blue", status: "Scheduled", tech: "Marek Stroz", techInitials: "MS", property: "4405 N Clark Ave" },
  { id: 2, title: "Plumbing Repair", client: "Sarah Johnson", date: new Date(2026, 3, 6), startHour: 13, duration: 1.5, color: "amber", status: "In Progress", tech: "John Smith", techInitials: "JS", property: "1220 Elm St" },
  { id: 3, title: "HVAC Maintenance", client: "Mike Davis", date: new Date(2026, 3, 6), startHour: 15, duration: 1, color: "green", status: "Completed", tech: "Sarah Johnson", techInitials: "SJ", property: "890 Oak Dr" },
  { id: 4, title: "Electrical Inspection", client: "Lisa Brown", date: new Date(2026, 3, 7), startHour: 10, duration: 2, color: "purple", status: "Scheduled", tech: "Marek Stroz", techInitials: "MS", property: "567 Pine Rd" },
  { id: 5, title: "Tree Removal", client: "James Wilson", date: new Date(2026, 3, 8), startHour: 8, duration: 4, color: "red", status: "Overdue", tech: "Mike Davis", techInitials: "MD", property: "234 Maple Ln" },
  { id: 6, title: "Gutter Cleaning", client: "Anna Lee", date: new Date(2026, 3, 9), startHour: 11, duration: 1.5, color: "blue", status: "Scheduled", tech: "John Smith", techInitials: "JS", property: "56 Birch Ct" },
  { id: 7, title: "Fence Repair", client: "Tom Richards", date: new Date(2026, 3, 10), startHour: 9, duration: 3, color: "amber", status: "Scheduled", tech: "Marek Stroz", techInitials: "MS", property: "12 Cedar Way" },
  { id: 8, title: "Lawn Service", client: "Emily Clark", date: new Date(2026, 3, 13), startHour: 8, duration: 2, color: "green", status: "Scheduled", tech: "Sarah Johnson", techInitials: "SJ", property: "88 Willow Dr" },
  { id: 9, title: "Roof Inspection", client: "David Park", date: new Date(2026, 3, 15), startHour: 10, duration: 2.5, color: "blue", status: "Scheduled", tech: "Marek Stroz", techInitials: "MS", property: "321 Aspen Blvd" },
  { id: 10, title: "Window Install", client: "Karen White", date: new Date(2026, 3, 20), startHour: 9, duration: 5, color: "purple", status: "Scheduled", tech: "John Smith", techInitials: "JS", property: "45 Spruce Rd" },
];

// ─── Dispatch Board Data ──────────────────────────────────────────────────────
interface DJob { id: number; num: string; client: string; address: string; service: string; start: number; end: number; dayIdx: number; techName: string; bg: string; border: string; statusIcon: string; statusIconColor: string; jobType: string; source: string; priority: string; amount: number; }
interface UJob { id: number; client: string; service: string; address: string; typeLabel: string; typeBg: string; typeColor: string; amount: string; distance: string; date: string; highPriority?: boolean; }

// dayIdx: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat (matches weekDays array index)
const dispatchJobs: DJob[] = [
  { id: 101, num: "10241", client: "Smith Residence", address: "123 Main St", service: "AC Tune-Up", start: 8, end: 10, dayIdx: 1, techName: "Mike Tech", bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle", statusIconColor: "#16A34A", jobType: "Maintenance", source: "Website", priority: "Normal", amount: 89 },
  { id: 102, num: "10245", client: "Brown Home", address: "456 Elm St", service: "AC Repair", start: 10.25, end: 12.25, dayIdx: 1, techName: "Mike Tech", bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "play_circle_filled", statusIconColor: "#4A6FA5", jobType: "Repair", source: "Website", priority: "Normal", amount: 385 },
  { id: 201, num: "10238", client: "Miller Residence", address: "852 Pine St", service: "AC Repair", start: 8, end: 10, dayIdx: 2, techName: "Sarah Tech", bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle", statusIconColor: "#16A34A", jobType: "Repair", source: "Phone", priority: "Normal", amount: 210 },
  { id: 202, num: "10242", client: "Wilson Home", address: "159 Cedar Dr", service: "AC Tune-Up", start: 10.25, end: 12, dayIdx: 2, techName: "Sarah Tech", bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle", statusIconColor: "#16A34A", jobType: "Maintenance", source: "App", priority: "Normal", amount: 89 },
  { id: 203, num: "10247", client: "Moore Residence", address: "753 Spruce St", service: "System Check", start: 12.5, end: 14.5, dayIdx: 2, techName: "Sarah Tech", bg: "#EDE9FE", border: "#7C3AED", statusIcon: "play_circle_filled", statusIconColor: "#7C3AED", jobType: "Inspection", source: "Website", priority: "Normal", amount: 129 },
  { id: 301, num: "10239", client: "Taylor Home", address: "852 Bay St", service: "Water Heater Install", start: 8, end: 11, dayIdx: 3, techName: "John Tech", bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "", statusIconColor: "", jobType: "Installation", source: "Referral", priority: "Normal", amount: 1200 },
  { id: 302, num: "10246", client: "Jackson Residence", address: "951 Lake Dr", service: "Leak Repair", start: 11.5, end: 13.5, dayIdx: 3, techName: "John Tech", bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "play_circle_filled", statusIconColor: "#4A6FA5", jobType: "Repair", source: "Phone", priority: "High", amount: 320 },
  { id: 303, num: "10248", client: "White Home", address: "357 River St", service: "Pipe Replacement", start: 14, end: 16, dayIdx: 3, techName: "John Tech", bg: "#D1FAE5", border: "#16A34A", statusIcon: "check_circle", statusIconColor: "#16A34A", jobType: "Repair", source: "Website", priority: "Normal", amount: 485 },
  { id: 401, num: "10240", client: "Clark Residence", address: "951 Hillside Dr", service: "Panel Upgrade", start: 8, end: 10, dayIdx: 4, techName: "David Tech", bg: "#EBF0F8", border: "#4A6FA5", statusIcon: "", statusIconColor: "", jobType: "Installation", source: "Website", priority: "Normal", amount: 2400 },
  { id: 402, num: "10243", client: "Hall Home", address: "753 Summit St", service: "Recessed Lights", start: 10.5, end: 12, dayIdx: 4, techName: "David Tech", bg: "#FEF3C7", border: "#D97706", statusIcon: "play_circle_filled", statusIconColor: "#D97706", jobType: "Installation", source: "App", priority: "Normal", amount: 750 },
  { id: 403, num: "10249", client: "Lewis Residence", address: "852 Ridge Dr", service: "Wiring Inspection", start: 13, end: 15, dayIdx: 4, techName: "David Tech", bg: "#FEF3C7", border: "#D97706", statusIcon: "play_circle_filled", statusIconColor: "#D97706", jobType: "Inspection", source: "Phone", priority: "Normal", amount: 175 },
  { id: 404, num: "10251", client: "Walker Office", address: "159 Commerce St", service: "Troubleshooting", start: 15.5, end: 17, dayIdx: 4, techName: "David Tech", bg: "#EDE9FE", border: "#7C3AED", statusIcon: "play_circle_filled", statusIconColor: "#7C3AED", jobType: "Service", source: "Website", priority: "Normal", amount: 225 },
];

const openTimeBlocks = [
  { dayIdx: 2, start: 15, end: 16.5 },
  { dayIdx: 3, start: 16.25, end: 17 },
];

const unscheduledJobs: UJob[] = [
  { id: 1, client: "Johnson Residence", service: "AC Not Cooling", address: "1250 Oak Dr, Tampa, FL 33602", typeLabel: "Estimate", typeBg: "#EBF0F8", typeColor: "#4A6FA5", amount: "$350 – $450", distance: "2.5 mi", date: "Today", highPriority: true },
  { id: 2, client: "Williams Home", service: "Install New System", address: "5332 Pine Ridge Rd, Tampa, FL", typeLabel: "Installation", typeBg: "#D1FAE5", typeColor: "#16A34A", amount: "$6,800", distance: "8.7 mi", date: "Tomorrow" },
  { id: 3, client: "Anderson Office", service: "Duct Cleaning", address: "777 Business Park Dr, Tampa, FL", typeLabel: "Service", typeBg: "#EDE9FE", typeColor: "#7C3AED", amount: "$600", distance: "5.3 mi", date: "Tomorrow" },
];

const dispatchStats = [
  { label: "Total Jobs", value: "38", icon: "schedule", color: "#4A6FA5" },
  { label: "Scheduled", value: "32", icon: "check_circle", color: "#16A34A" },
  { label: "Unscheduled", value: "3", icon: "warning", color: "#D97706" },
  { label: "In Progress", value: "2", icon: "play_circle_filled", color: "#7C3AED" },
  { label: "On Hold", value: "1", icon: "pause_circle_filled", color: "#6B7280" },
  { label: "Canceled", value: "0", icon: "cancel", color: "#DC2626" },
  { label: "Utilization", value: "92%", icon: "speed", color: "#16A34A" },
];

type ViewMode = "month" | "week" | "day";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 6));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [selectedDispatchJob, setSelectedDispatchJob] = useState<DJob | null>(dispatchJobs[1]); // default Brown Home selected

  // Navigation
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
  const goToday = () => setCurrentDate(new Date(2026, 3, 6));

  // Month view days
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 6pm

  const getEventsForDay = (day: Date) => mockEvents.filter(e => isSameDay(e.date, day));

  const getC = (color: string) => COLORS[color as keyof typeof COLORS] || COLORS.blue;

  const fmtHour = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h % 1) * 60);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return mm === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewMode === "week"
    ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
    : format(currentDate, "EEEE, MMMM d, yyyy");

  // Event detail popover
  const EventPopover = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    const c = getC(event.color);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="h-1.5" style={{ backgroundColor: c.border }} />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#8899AA] mb-1" style={{ fontWeight: 600 }}>{event.status}</div>
                <h3 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>{event.title}</h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#8899AA]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>person</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{event.client}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>schedule</span>
                <span className="text-[#546478]">{format(event.date, "EEE, MMM d")} · {event.startHour > 12 ? event.startHour - 12 : event.startHour}:00 {event.startHour >= 12 ? "PM" : "AM"} – {(() => { const end = event.startHour + event.duration; return `${end > 12 ? end - 12 : end}:${event.duration % 1 === 0.5 ? "30" : "00"} ${end >= 12 ? "PM" : "AM"}`; })()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>location_on</span>
                <span className="text-[#546478]">{event.property}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>engineering</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>{event.techInitials}</div>
                  <span className="text-[#1A2332]">{event.tech}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <button className="flex-1 px-4 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-sm hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                View Job
              </button>
              <button className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-sm hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
                Edit
              </button>
              <button className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-sm hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE3EE]">
        <div className="flex items-center gap-4">
          <h1 className="text-[26px] text-[#1A2332]" style={{ fontWeight: 700 }}>Calendar</h1>
          <div className="h-6 w-px bg-[#DDE3EE]" />
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
            </button>
            <button onClick={goToday} className="px-3 py-1.5 text-sm text-[#4A6FA5] hover:bg-[#EBF0F8] rounded-lg" style={{ fontWeight: 600 }}>
              Today
            </button>
            <button onClick={goForward} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
              <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
            </button>
          </div>
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>{headerLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-[#F0F2F5] rounded-lg overflow-hidden p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs rounded-md capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white text-[#1A2332] shadow-sm"
                    : "text-[#546478] hover:text-[#1A2332]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/jobs/new")}
            className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-sm hover:bg-[#3d5a85] flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
            Create Job
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {/* ====== MONTH VIEW ====== */}
        {viewMode === "month" && (
          <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#DDE3EE]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-3 text-center text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Days grid */}
            <div
              className="flex-1 grid grid-cols-7"
              style={{ gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, 1fr)` }}
            >
              {monthDays.map((day, idx) => {
                const events = getEventsForDay(day);
                const isCurrentMo = isSameMonth(day, currentDate);
                const isTodayD = isToday(day) || isSameDay(day, new Date(2026, 3, 6));
                const isHovered = hoveredDay && isSameDay(day, hoveredDay);

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r border-[#EDF0F5] p-1.5 transition-colors cursor-pointer ${
                      !isCurrentMo ? "bg-[#FAFBFC]" : isHovered ? "bg-[#F5F7FA]" : "bg-white"
                    }`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                  >
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full mb-1 text-[13px] ${
                      isTodayD
                        ? "bg-[#4A6FA5] text-white"
                        : !isCurrentMo
                        ? "text-[#C8D5E8]"
                        : "text-[#1A2332]"
                    }`} style={{ fontWeight: isTodayD ? 700 : 500 }}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev) => {
                        const c = getC(ev.color);
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] truncate cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: c.bg, color: c.text, borderLeft: `2px solid ${c.border}` }}
                          >
                            <span className="truncate" style={{ fontWeight: 500 }}>{ev.title}</span>
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <div className="text-[10px] text-[#8899AA] pl-1.5" style={{ fontWeight: 500 }}>+{events.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== WEEK VIEW — DISPATCH BOARD ====== */}
        {viewMode === "week" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Stats Bar */}
            <div className="flex items-center border-b border-[#DDE3EE] bg-white shrink-0 overflow-x-auto">
              {dispatchStats.map((s, i) => (
                <div key={s.label} className={`flex items-center gap-3 px-5 py-3 shrink-0 ${i < dispatchStats.length - 1 ? "border-r border-[#DDE3EE]" : ""}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}18` }}>
                    <span className="material-icons" style={{ fontSize: "20px", color: s.color }}>{s.icon}</span>
                  </div>
                  <div>
                    <div className="text-[20px] text-[#1A2332] leading-none" style={{ fontWeight: 700 }}>{s.value}</div>
                    <div className="text-[11px] text-[#546478] mt-0.5 whitespace-nowrap">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main: Left + Grid + Right */}
            <div className="flex flex-1 overflow-hidden">

              {/* Left: Unscheduled Jobs */}
              <div className="w-[210px] shrink-0 border-r border-[#DDE3EE] flex flex-col bg-[#FAFBFC] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#DDE3EE] shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Unscheduled Jobs</span>
                    <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-[10px] flex items-center justify-center" style={{ fontWeight: 700 }}>3</span>
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#EDF0F5]">
                    <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>more_horiz</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {unscheduledJobs.map(job => (
                    <div key={job.id} className="bg-white border border-[#DDE3EE] rounded-xl p-3 cursor-pointer hover:shadow-sm transition-shadow">
                      {job.highPriority && (
                        <div className="text-[10px] text-[#DC2626] mb-1.5 flex items-center gap-1" style={{ fontWeight: 600 }}>
                          <span className="material-icons" style={{ fontSize: "12px" }}>priority_high</span>
                          High Priority
                        </div>
                      )}
                      <div className="text-[13px] text-[#1A2332] mb-0.5" style={{ fontWeight: 600 }}>{job.client}</div>
                      <div className="text-[12px] text-[#546478] mb-1.5">{job.service}</div>
                      <div className="text-[11px] text-[#8899AA] mb-2 flex items-start gap-1">
                        <span className="material-icons mt-0.5 shrink-0" style={{ fontSize: "12px", color: "#DC2626" }}>location_on</span>
                        <span className="leading-snug">{job.address}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px]" style={{ fontWeight: 600, backgroundColor: job.typeBg, color: job.typeColor }}>{job.typeLabel}</span>
                        <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>{job.amount}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1 text-[11px] text-[#8899AA]">
                          <span className="material-icons" style={{ fontSize: "12px" }}>near_me</span>
                          {job.distance}
                        </div>
                        <span className="text-[11px] text-[#8899AA]">{job.date}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                    <span className="material-icons text-[#8899AA] mb-1" style={{ fontSize: "32px" }}>account_circle</span>
                    <div className="text-[11px] text-[#546478]">Drag & drop jobs<br />to assign</div>
                  </div>
                </div>
              </div>

              {/* Center: Time × Day grid */}
              <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                {/* Day headers */}
                <div
                  className="grid shrink-0 border-b border-[#DDE3EE] bg-white"
                  style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
                >
                  <div />
                  {weekDays.map((d, i) => {
                    const isTodayD = isSameDay(d, new Date(2026, 3, 6));
                    const dayTotal = dispatchJobs.filter(j => j.dayIdx === i).reduce((sum, j) => sum + j.amount, 0);
                    return (
                      <div key={i} className="py-2 text-center border-l border-[#EDF0F5]">
                        <div className="text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>{format(d, "EEE")}</div>
                        <div className={`text-[18px] mt-0.5 ${isTodayD ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: isTodayD ? 700 : 500 }}>
                          {format(d, "d")}
                        </div>
                        {dayTotal > 0 && (
                          <div className="text-[11px] mt-0.5" style={{ fontWeight: 600, color: "#16A34A" }}>
                            ${dayTotal.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scrollable time grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="relative" style={{ height: `${hours.length * 64}px` }}>
                    {/* Hour row backgrounds */}
                    {hours.map(h => (
                      <div
                        key={h}
                        className="absolute w-full flex"
                        style={{ top: `${(h - 7) * 64}px`, height: "64px" }}
                      >
                        <div className="w-[52px] shrink-0 flex items-start justify-end pr-2 -mt-2 text-[11px] text-[#8899AA]" style={{ fontWeight: 500 }}>
                          {h > 12 ? h - 12 : h}{h >= 12 ? "PM" : "AM"}
                        </div>
                        {weekDays.map((_, ti) => (
                          <div key={ti} className="flex-1 border-l border-b border-[#EDF0F5]" />
                        ))}
                      </div>
                    ))}

                    {/* Job blocks */}
                    {dispatchJobs.map(job => {
                      const top = (job.start - 7) * 64;
                      const height = Math.max((job.end - job.start) * 64 - 2, 30);
                      const isSelected = selectedDispatchJob?.id === job.id;
                      return (
                        <div
                          key={job.id}
                          className="absolute rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            top,
                            height,
                            left: `calc(52px + ${job.dayIdx} * ((100% - 52px) / 7) + 2px)`,
                            width: `calc((100% - 52px) / 7 - 4px)`,
                            backgroundColor: job.bg,
                            borderLeft: `3px solid ${job.border}`,
                            outline: isSelected ? `2px solid ${job.border}` : "none",
                            outlineOffset: "1px",
                          }}
                          onClick={() => setSelectedDispatchJob(job)}
                        >
                          <div className="px-2 py-1.5 h-full flex flex-col">
                            <div className="text-[10px] text-[#8899AA] tabular-nums mb-0.5">
                              {fmtHour(job.start)} – {fmtHour(job.end)}
                            </div>
                            <div className="text-[12px] leading-tight truncate" style={{ fontWeight: 600, color: "#1A2332" }}>{job.client}</div>
                            <div className="text-[11px] text-[#546478] truncate">{job.service}</div>
                            {height > 62 && <div className="text-[11px] text-[#8899AA] truncate">{job.address}</div>}
                            <div className="flex items-center justify-between mt-auto pt-0.5">
                              <span className="text-[11px] tabular-nums" style={{ fontWeight: 600, color: job.border }}>${job.amount.toLocaleString()}</span>
                              {job.statusIcon && (
                                <span className="material-icons" style={{ fontSize: "14px", color: job.statusIconColor }}>{job.statusIcon}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Open time blocks */}
                    {openTimeBlocks.map((block, bi) => {
                      const top = (block.start - 7) * 64;
                      const height = (block.end - block.start) * 64 - 2;
                      return (
                        <div
                          key={`open-${bi}`}
                          className="absolute rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-center"
                          style={{
                            top,
                            height,
                            left: `calc(52px + ${block.dayIdx} * ((100% - 52px) / 7) + 2px)`,
                            width: `calc((100% - 52px) / 7 - 4px)`,
                          }}
                        >
                          <div className="text-center">
                            <div className="text-[11px] text-[#8899AA]" style={{ fontWeight: 500 }}>Open Time</div>
                            <div className="text-[10px] text-[#B0BCC8]">Available</div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    <div
                      className="absolute z-10 pointer-events-none"
                      style={{ top: `${(10.5 - 7) * 64}px`, left: "52px", right: 0, height: "2px", backgroundColor: "#DC2626" }}
                    >
                      <div className="w-2.5 h-2.5 bg-[#DC2626] rounded-full absolute -left-1 -top-1" />
                      <div className="absolute -top-4 left-2 text-[10px] text-[#DC2626] bg-white px-1 rounded" style={{ fontWeight: 600 }}>10:30 AM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Job Detail Panel */}
              {selectedDispatchJob && (
                <div className="w-[300px] shrink-0 border-l border-[#DDE3EE] flex flex-col bg-white overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDE3EE] shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Job #{selectedDispatchJob.num}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ fontWeight: 600, backgroundColor: "#D1FAE5", color: "#16A34A" }}>Scheduled</span>
                    </div>
                    <button onClick={() => setSelectedDispatchJob(null)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>close</span>
                    </button>
                  </div>
                  {/* Tabs */}
                  <div className="flex border-b border-[#DDE3EE] shrink-0">
                    {["Details", "Customer", "Job Info", "History"].map((tab, i) => (
                      <button key={tab} className={`flex-1 py-2 text-[12px] transition-colors ${i === 0 ? "text-[#4A6FA5] border-b-2 border-[#4A6FA5]" : "text-[#546478] hover:text-[#1A2332]"}`} style={{ fontWeight: 500 }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      {/* Client info */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{selectedDispatchJob.client}</div>
                          <div className="text-[12px] text-[#546478] mt-0.5">{selectedDispatchJob.service}</div>
                          <div className="text-[12px] text-[#8899AA] mt-0.5">{selectedDispatchJob.address}</div>
                          <div className="text-[12px] text-[#8899AA]">Tampa, FL 33602</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button className="w-8 h-8 rounded-lg border border-[#DDE3EE] flex items-center justify-center hover:bg-[#F5F7FA]">
                            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>phone</span>
                          </button>
                          <button className="w-8 h-8 rounded-lg border border-[#DDE3EE] flex items-center justify-center hover:bg-[#F5F7FA]">
                            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>chat</span>
                          </button>
                        </div>
                      </div>
                      {/* Fields */}
                      {[
                        { icon: "event", label: "Appointment", value: `${fmtHour(selectedDispatchJob.start)} – ${fmtHour(selectedDispatchJob.end)} (Today)` },
                        { icon: "engineering", label: "Technician", value: selectedDispatchJob.techName },
                        { icon: "schedule", label: "Duration", value: `${Math.floor(selectedDispatchJob.end - selectedDispatchJob.start)}h ${String(Math.round(((selectedDispatchJob.end - selectedDispatchJob.start) % 1) * 60)).padStart(2, "0")}m` },
                        { icon: "stars", label: "Priority", value: selectedDispatchJob.priority },
                        { icon: "attach_money", label: "Amount", value: `$${selectedDispatchJob.amount.toFixed(2)}` },
                        { icon: "build", label: "Job Type", value: selectedDispatchJob.jobType },
                        { icon: "web", label: "Source", value: selectedDispatchJob.source },
                      ].map(f => (
                        <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-[#F5F7FA]">
                          <span className="material-icons text-[#4A6FA5] shrink-0" style={{ fontSize: "16px" }}>{f.icon}</span>
                          <span className="text-[12px] text-[#8899AA] w-[88px] shrink-0">{f.label}</span>
                          <span className="text-[12px] text-[#1A2332] flex-1" style={{ fontWeight: 500 }}>
                            {f.label === "Priority" ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#4A6FA5] inline-block shrink-0" />
                                {f.value}
                              </span>
                            ) : f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="p-4 space-y-2 border-t border-[#DDE3EE] shrink-0">
                    <button className="w-full py-2.5 bg-[#4A6FA5] text-white rounded-xl text-[13px] hover:bg-[#3d5a85] transition-colors" style={{ fontWeight: 600 }}>
                      Start Job
                    </button>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-xl text-[13px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Reschedule</button>
                      <button className="flex-1 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-xl text-[13px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>Edit</button>
                    </div>
                    <button className="w-full py-2.5 border border-[#FCA5A5] text-[#DC2626] rounded-xl text-[13px] hover:bg-[#FEF2F2] transition-colors" style={{ fontWeight: 500 }}>
                      Cancel Job
                    </button>
                    {/* Map placeholder */}
                    <div className="pt-2">
                      <div className="text-[12px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Location</div>
                      <div className="h-24 bg-[#EEF2F8] rounded-xl relative flex items-center justify-center border border-[#DDE3EE] overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg,#4A6FA530 0,#4A6FA530 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#4A6FA530 0,#4A6FA530 1px,transparent 1px,transparent 48px)" }} />
                        <span className="material-icons text-[#DC2626] relative z-10" style={{ fontSize: "32px" }}>location_on</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-[11px] text-[#546478]">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "13px" }}>near_me</span>
                          2.4 mi away
                        </div>
                        <button className="text-[11px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>Get Directions</button>
                      </div>
                      <button className="w-full mt-2 py-2 border border-[#DDE3EE] text-[#546478] rounded-xl text-[12px] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>
                        View on Map
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== DAY VIEW ====== */}
        {viewMode === "day" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-[64px_1fr] relative">
                {hours.map((h) => (
                  <div key={h} className="contents">
                    <div className="h-20 flex items-start justify-end pr-3 text-[11px] text-[#8899AA] -mt-2" style={{ fontWeight: 500 }}>
                      {h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}
                    </div>
                    <div className="h-20 border-b border-[#EDF0F5] relative" />
                  </div>
                ))}
                {/* Render events for day */}
                {getEventsForDay(currentDate).map((ev) => {
                  const c = getC(ev.color);
                  const top = (ev.startHour - 7) * 80;
                  const height = ev.duration * 80 - 4;
                  return (
                    <div
                      key={ev.id}
                      className="absolute rounded-xl px-4 py-3 cursor-pointer hover:shadow-lg transition-shadow"
                      style={{
                        top: `${top}px`,
                        left: "72px",
                        right: "16px",
                        height: `${height}px`,
                        backgroundColor: c.bg,
                        borderLeft: `4px solid ${c.border}`,
                      }}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{ev.title}</div>
                          <div className="text-[13px] text-[#546478] mt-0.5">{ev.client} · {ev.property}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[11px]" style={{ fontWeight: 600 }}>{ev.techInitials}</div>
                          <div className={`px-2 py-0.5 rounded-full text-[11px]`} style={{ backgroundColor: `${c.border}20`, color: c.border, fontWeight: 600 }}>
                            {ev.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#8899AA] mt-1.5 flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: "14px" }}>schedule</span>
                        {ev.startHour > 12 ? ev.startHour - 12 : ev.startHour}:00 {ev.startHour >= 12 ? "PM" : "AM"} – {(() => { const end = ev.startHour + ev.duration; return `${end > 12 ? end - 12 : end}:${ev.duration % 1 === 0.5 ? "30" : "00"} ${end >= 12 ? "PM" : "AM"}`; })()}
                        <span className="mx-1">·</span>
                        <span className="material-icons" style={{ fontSize: "14px" }}>location_on</span>
                        {ev.property}
                      </div>
                    </div>
                  );
                })}
                {/* Current time indicator */}
                <div
                  className="absolute left-16 right-0 h-0.5 bg-[#DC2626] z-10"
                  style={{ top: `${(9 - 7) * 80 + 30}px` }}
                >
                  <div className="w-2.5 h-2.5 bg-[#DC2626] rounded-full absolute -left-1 -top-1" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event detail popover */}
      {selectedEvent && <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}