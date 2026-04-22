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

type ViewMode = "month" | "week" | "day";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 6));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

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

      {/* Status Legend */}
      <div className="flex items-center gap-5 px-6 py-2.5 border-b border-[#DDE3EE] bg-[#FAFBFC]">
        <span className="text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>Status:</span>
        {[
          { label: "Scheduled", color: "#4A6FA5" },
          { label: "In Progress", color: "#D97706" },
          { label: "Completed", color: "#16A34A" },
          { label: "Overdue", color: "#DC2626" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[12px] text-[#546478]" style={{ fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
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

        {/* ====== WEEK VIEW ====== */}
        {viewMode === "week" && (
          <div className="flex flex-col h-full">
            {/* Day headers */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[#DDE3EE] sticky top-0 bg-white z-10">
              <div />
              {weekDays.map((d, i) => {
                const isTodayD = isSameDay(d, new Date(2026, 3, 6));
                return (
                  <div key={i} className="py-3 text-center border-l border-[#EDF0F5]">
                    <div className="text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>{format(d, "EEE")}</div>
                    <div className={`text-[18px] mt-0.5 ${isTodayD ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: isTodayD ? 700 : 500 }}>
                      {format(d, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Time grid */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
                {hours.map((h) => (
                  <div key={h} className="contents">
                    <div className="h-16 flex items-start justify-end pr-3 pt-0 text-[11px] text-[#8899AA] -mt-2" style={{ fontWeight: 500 }}>
                      {h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}
                    </div>
                    {weekDays.map((d, di) => (
                      <div key={di} className="h-16 border-l border-b border-[#EDF0F5] relative" />
                    ))}
                  </div>
                ))}
                {/* Render events */}
                {weekDays.map((d, di) => {
                  const dayEvents = getEventsForDay(d);
                  return dayEvents.map((ev) => {
                    const c = getC(ev.color);
                    const top = (ev.startHour - 7) * 64;
                    const height = ev.duration * 64 - 2;
                    return (
                      <div
                        key={ev.id}
                        className="absolute rounded-lg px-2 py-1.5 cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                        style={{
                          top: `${top}px`,
                          left: `calc(64px + ${di} * ((100% - 64px) / 7) + 2px)`,
                          width: `calc((100% - 64px) / 7 - 4px)`,
                          height: `${height}px`,
                          backgroundColor: c.bg,
                          borderLeft: `3px solid ${c.border}`,
                        }}
                        onClick={() => setSelectedEvent(ev)}
                      >
                        <div className="text-[11px] truncate" style={{ fontWeight: 600, color: c.text }}>{ev.title}</div>
                        <div className="text-[10px] truncate" style={{ color: c.accent }}>{ev.client}</div>
                        {ev.duration >= 2 && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-4 h-4 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[8px]" style={{ fontWeight: 600 }}>{ev.techInitials}</div>
                            <span className="text-[10px]" style={{ color: c.text }}>{ev.tech.split(" ")[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
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