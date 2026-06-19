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
import { type JobStatus, JOB_STATUS_STYLES as STATUS_STYLES, JOB_STATUS_ICONS as STATUS_ICONS, JOB_STATUSES as ALL_JOB_STATUSES } from "../constants/jobStatuses";
import { isPending, pendingJobs, type PendingFilter, hasTimeConflict, statusAfterAssignToSlot, schedulingTags, durationForType, isDraggable, isShownOnBoard, occupiesSlot, packOverlaps, deconflict } from "../utils/scheduleLogic";
import { jobTypeColor, jobTypeTint, JOB_TYPE_ORDER, JOB_TYPE_COLORS } from "../constants/jobTypeColors";
import { jobsStore, type JobRecord } from "../stores/jobsStore";
import { CreateJob, type CreateJobPrefill, type CreateJobValues } from "./CreateJob";

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
  // no date yet (e.g. after a drag-back to Pending on the week view)
  unscheduled?: boolean;
}

const COLORS = {
  blue:   { bg: "#EBF0F8", border: "#4A6FA5", text: "#1A2332", accent: "#4A6FA5" },
  amber:  { bg: "#FEF3C7", border: "#D97706", text: "#92400E", accent: "#D97706" },
  green:  { bg: "#D1FAE5", border: "#16A34A", text: "#14532D", accent: "#16A34A" },
  red:    { bg: "#FEE2E2", border: "#DC2626", text: "#7F1D1D", accent: "#DC2626" },
  purple: { bg: "#EDE9FE", border: "#7C3AED", text: "#4C1D95", accent: "#7C3AED" },
};


// Pill-styled <select> used in job-detail popovers so dispatchers can flip
// status (e.g. to Cancelled) without leaving the schedule (BUG-S05).
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
  if (status === "Unscheduled") return "Scheduled"; // once it gets a date
  if (status === "Scheduled") return "Dispatched";
  if (status === "Dispatched") return "In Progress";
  if (status === "In Progress") return "Completed";
  if (status === "Paused") return "In Progress";     // resuming returns to in progress (Part 5)
  if (status === "Completed") return "Scheduled";
  // Cancelled stays Cancelled when click-cycled; user must explicitly pick another via the dropdown.
  return status;
};

// ── Job info side panel (Figma) ───────────────────────────────────────────
// One drawer for both day & week board selections: header (title + status
// dropdown + close), segmented Details / Notes / Activity tabs, an editable
// details card, and a footer (Edit · [Reopen job] · Save). Replaces the old
// per-view reschedule/edit modal + popover. Date/time/duration are display-only
// here (deep edits go through Edit → full job form); Job type & Technician are
// live selects; status is the header dropdown.
interface DrawerJob {
  id: number; headerTitle: string; client: string; service: string; address: string;
  status: JobStatus; technicianId: string; jobType?: string; amount: number; unscheduled?: boolean;
  startLabel: string; endLabel: string; dateLabel: string; durationLabel: string;
  frequency: "One-off" | "Recurring"; recurrenceSummary?: string;
}
function JobInfoDrawer({
  job, jobTypes, onClose, onStatus, onType, onTechnician, onEdit, onReopen,
  notes, noteDraft, setNoteDraft, addNote, history,
}: {
  job: DrawerJob;
  jobTypes: string[];
  onClose: () => void;
  onStatus: (s: JobStatus) => void;
  onType: (t: string) => void;
  onTechnician: (id: string) => void;
  onEdit: () => void;
  onReopen: () => void;
  notes: string[];
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  addNote: () => void;
  history: { when: string; label: string }[];
}) {
  const [tab, setTab] = useState<"Details" | "Notes" | "Activity">("Details");
  const [addingNote, setAddingNote] = useState(false);
  const labelCls = "flex items-center gap-2 w-[140px] shrink-0 text-[14px] text-[#6B7280]";
  const ctrlCls = "flex-1 h-8 px-2 border border-[#E5E7EB] rounded-lg text-[13px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]";
  const roCls = `${ctrlCls} text-[#6B7280]`;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(28,43,58,0.10)" }} onClick={onClose}>
      <div className="relative w-[400px] max-w-[92vw] h-full flex flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-[59px] shrink-0">
          <h2 className="text-[20px] text-[#1A2332] truncate flex-1" style={{ fontWeight: 600 }}>{job.headerTitle}</h2>
          {!job.unscheduled && <StatusPillSelect value={job.status} onChange={onStatus} />}
          <button onClick={onClose} aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F7FA]">
            <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
        {/* Tabs */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center p-[3px] bg-[#F5F7FA] rounded-[10px]">
            {(["Details", "Notes", "Activity"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-[29px] rounded-lg text-[14px] transition-colors ${tab === t ? "bg-[#4A6FA5] text-white shadow-sm" : "text-[#6B7280] hover:text-[#1A2332]"}`}
                style={{ fontWeight: 500 }}
              >
                {t}{t === "Notes" && notes.length > 0 ? ` (${notes.length})` : ""}
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {tab === "Details" && (
            <div className="rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>{job.client}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.service}</span>
                    <span className="px-2 py-0.5 rounded-lg text-[12px] bg-[#F5F7FA] text-[#1A2332]" style={{ fontWeight: 500 }}>{job.frequency}</span>
                  </div>
                  {job.frequency === "Recurring" && job.recurrenceSummary && (
                    <div className="text-[12px] text-[#6B7280] mt-1">{job.recurrenceSummary}</div>
                  )}
                  <div className="text-[14px] text-[#6B7280] mt-1">{job.address}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href="tel:+18132867572" aria-label="Call" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA]"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>phone</span></a>
                  <a href="mailto:" aria-label="Email" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA]"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>mail</span></a>
                </div>
              </div>
              <div className="border-t border-[#E5E7EB] my-3" />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>work_outline</span>Job type:</span>
                  <select value={job.jobType ?? ""} onChange={(e) => onType(e.target.value)} className={ctrlCls}>
                    <option value="">Select job type</option>
                    {[...new Set([job.jobType, ...jobTypes].filter(Boolean) as string[])].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>build</span>Technician:</span>
                  <select value={job.technicianId} onChange={(e) => onTechnician(e.target.value)} className={ctrlCls}>
                    <option value="">Select technician</option>
                    {TEAM.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>calendar_today</span>Job duration:</span>
                  <input readOnly value={job.durationLabel} className={roCls} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>event</span>Start date:</span>
                  <input readOnly value={job.dateLabel} placeholder="DD-MM-YYYY" className={roCls} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>schedule</span>Start time:</span>
                  <input readOnly value={job.startLabel} placeholder="--:--" className={roCls} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>schedule</span>End time:</span>
                  <input readOnly value={job.endLabel} placeholder="--:--" className={roCls} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={labelCls}><span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>attach_money</span>Amount:</span>
                  <span className="flex-1 text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>${job.amount.toLocaleString("en-US")}</span>
                </div>
              </div>
            </div>
          )}
          {tab === "Notes" && (
            notes.length === 0 && !addingNote ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>edit_note</span></div>
                <div className="text-[14px] text-[#1A2332]">No notes yet</div>
                <div className="text-[12px] text-[#6B7280]">Anything worth remembering? Add it here</div>
                <button onClick={() => setAddingNote(true)} className="mt-1 px-3 h-8 rounded-lg bg-[#4A6FA5] text-white text-[14px]" style={{ fontWeight: 500 }}>Add note</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</span>
                  <button onClick={() => setAddingNote((a) => !a)} aria-label="Add note" className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F5F7FA]"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>add</span></button>
                </div>
                {addingNote && (
                  <div className="rounded-xl border border-[#E5E7EB] p-3">
                    <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note…" className="w-full text-[13px] resize-none outline-none min-h-[56px]" />
                    <div className="flex justify-end"><button onClick={() => { addNote(); setAddingNote(false); }} disabled={!noteDraft.trim()} className="px-3 h-8 rounded-lg bg-[#4A6FA5] text-white text-[12px] disabled:opacity-50" style={{ fontWeight: 600 }}>Save note</button></div>
                  </div>
                )}
                {notes.map((n, i) => {
                  const [head, ...rest] = n.split(" — ");
                  const body = rest.join(" — ");
                  return (
                    <div key={i} className="border-b border-[#F1F3F7] pb-2 last:border-0">
                      {body ? <div className="text-[12px] text-[#9CA3AF]">Added {head}</div> : null}
                      <div className="text-[14px] text-[#1A2332]">{body || n}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}
          {tab === "Activity" && (
            history.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center"><span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>history</span></div>
                <div className="text-[14px] text-[#1A2332]">No activity yet</div>
                <div className="text-[12px] text-[#6B7280]">Completed actions will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((e, i) => (
                  <div key={i} className="border-b border-[#F1F3F7] pb-2 last:border-0">
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{e.label}</div>
                    <div className="text-[12px] text-[#6B7280]">{e.when}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 h-[68px] shrink-0 border-t border-[#E5E7EB]">
          <button onClick={onEdit} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Edit</button>
          <div className="flex items-center gap-2">
            {job.status === "Completed" && (
              <button onClick={onReopen} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Reopen job</button>
            )}
            <button onClick={onClose} className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  // Pending week jobs so the sidebar shows pending on the week view too:
  // unassigned = has a date but no technician; unscheduled = no date.
  { id: 11, num: "2411", technicianId: "",       client: "Diaz Home",       service: "AC Repair",       address: "210 Park Ave",    status: "Scheduled",   dayIdx: 1, start: 9,    end: 11,   amount: 340,  bg: "#FEF3C7", border: "#F59E0B", priority: "Normal", jobType: "Service",      source: "Phone" },
  { id: 12, num: "2412", technicianId: "",       client: "Reyes Office",    service: "Furnace Tune-Up", address: "44 Vista Way",    status: "Scheduled",   dayIdx: 3, start: 13,   end: 14,   amount: 160,  bg: "#D1FAE5", border: "#16A34A", priority: "Normal", jobType: "Maintenance",  source: "Web",   unscheduled: true },
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
  // When set, this dialog EDITS an existing job in place (updates it, preserving
  // its identity) instead of creating a new one. null/undefined = create. This
  // is what keeps "Reschedule"/"Edit" distinct from "Create" (brief §6).
  editJobId?: number;
  // true = full Edit (customer/service/address are editable). false/undefined =
  // Reschedule (identity locked; only date/time/assignee change). Both update in
  // place — this is the demo-safe Edit that avoids navigating to /jobs/:id, whose
  // records don't match the calendar's per-view jobs (the BUG-002 mismatch).
  editIdentity?: boolean;
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
  { id: "james", name: "James Wilson", initial: "JW", color: "#7C3AED" },
  { id: "emily", name: "Emily Clark", initial: "EC", color: "#DC2626" },
  { id: "david", name: "David Park", initial: "DP", color: "#0891B2" },
  { id: "karen", name: "Karen White", initial: "KW", color: "#DB2777" },
  { id: "tom", name: "Tom Richards", initial: "TR", color: "#4338CA" },
  { id: "anna", name: "Anna Lee", initial: "AL", color: "#65A30D" },
  { id: "mike", name: "Mike Davis", initial: "MD", color: "#0D9488" },
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
  // Unscheduled jobs — no fixed date/time yet. The no-date state is derived from
  // `unscheduled`, NOT a status. Two DISTINCT cases on purpose so the sidebar
  // filters are visibly independent (not nested):
  //  - id 15 Clark: brand-new job, no date AND no technician → shows BOTH the
  //    "Unscheduled" and "Unassigned" tags (the §9 overlap case).
  //  - id 16 Reyes: a job dragged back off the board — Marek's rule KEEPS the
  //    technician, so it is unscheduled but still assigned → "Unscheduled" ONLY,
  //    and it must NOT appear under the "unassigned" filter.
  { id: 15, technicianId: "",       start: 9,    end: 10,   client: "Clark Residence",   service: "AC Install",         jobType: "Installation", address: "951 Hillside Dr",      status: "Scheduled",   amount: 4200, bg: "#EDE9FE", border: "#7C3AED", unscheduled: true },
  { id: 16, technicianId: "peter",  start: 9,    end: 10,   client: "Reyes Home",        service: "Furnace Tune-Up",    jobType: "Maintenance",  address: "44 Vista Way",         status: "Scheduled",   amount: 160,  bg: "#FEF3C7", border: "#F59E0B", unscheduled: true },
];

// ── ONE unified Job collection (BUG-006) ───────────────────────────────────────
// A single source of truth for every view. Day / Week / Month are now DERIVED by
// windowing this one list over the calendar's current scope (see the selectors in
// the component), instead of three disjoint per-view arrays. A job's scheduling
// state is the two-flag model from scheduleLogic: `date` (null ⇒ unscheduled) +
// `technicianId` ("" ⇒ unassigned). The view-specific fields (dayIdx, startHour,
// duration) are computed in the selectors, never stored.
interface UnifiedJob {
  id: number;
  num: string;
  date: Date | null;        // real calendar date; null ⇒ unscheduled. Invariant: (date == null) === unscheduled
  technicianId: string;     // "" ⇒ unassigned
  start: number;
  end: number;
  unscheduled?: boolean;
  client: string;
  service: string;
  address: string;
  status: JobStatus;
  amount: number;
  jobType?: string;
  title: string;            // month-cell label / popover title
  property: string;         // month popover "property" line
  priority: string;
  source: string;
  color: string;            // legacy month colour key (fallback)
  bg: string;
  border: string;
}

// Build the unified seed from the existing per-view seeds so every field/flag is
// preserved, but renumbered into ONE id namespace and given real dates:
//   • day-origin  → ids 1-16, dated TODAY (Miller stays id 1; dated 7-day window)
//   • week-origin → ids 17-28, dated to this week (Mon-Fri, safe for any week start)
//   • month-origin→ ids 29-38, their own dates, with a technician assigned
const _wkStart = startOfWeek(_schedBase);            // Sunday-start; mid-week days are in-range for any locale
const _wk = (i: number) => addDays(_wkStart, i);
const INITIAL_JOBS_RAW: UnifiedJob[] = [
  ...DAY_JOBS.map((j) => ({
    ...j,
    num: `D${String(j.id).padStart(2, "0")}`,
    date: j.unscheduled ? null : _schedBase,
    unscheduled: !!j.unscheduled,
    title: j.service,
    property: j.address,
    priority: "Normal",
    source: "Schedule",
    color: "blue",
  })),
  ...dispatchJobs.map((j) => ({
    ...j,
    id: j.id + 16,
    date: j.unscheduled ? null : _wk(j.dayIdx),
    unscheduled: !!j.unscheduled,
    title: j.service,
    property: j.address,
    color: "blue",
  })),
  ...mockEvents.map((e, i) => ({
    id: e.id + 28,
    num: `M${String(e.id).padStart(2, "0")}`,
    date: e.date,
    technicianId: TEAM[i % TEAM.length].id,
    start: e.startHour,
    end: e.startHour + e.duration,
    unscheduled: false,
    client: e.client,
    service: e.title,
    address: e.property,
    status: e.status,
    amount: e.amount,
    jobType: e.jobType,
    title: e.title,
    property: e.property,
    priority: "Normal",
    source: "Web",
    color: e.color,
    bg: "#EBF0F8",
    border: "#4A6FA5",
  })),
];

// Deconflict the merged demo seed so NO technician is ever double-booked: the
// three legacy per-view seeds (day / week / month), once unified onto real dates,
// could put the same tech in two places at once (e.g. two 8-10 AM jobs for Peter).
// The day seed is listed first, so it wins ties → "today" resolves to the clean
// day schedule. (Logic lives in scheduleLogic + is unit-tested there.)
const INITIAL_JOBS: UnifiedJob[] = deconflict(INITIAL_JOBS_RAW);

// ── jobsStore ⇄ board adapter (unify create flow with the board) ────────────
// The board's local seed (INITIAL_JOBS) and the shared jobsStore (what /jobs/new
// writes to) were two disconnected arrays, so created jobs never appeared on the
// schedule. We now MERGE jobsStore records into the board collection and route
// any board mutation on a store-origin job back to jobsStore. Store ids are
// offset so they never collide with the local board ids (1-38, board-created 39+).
const JOBSTORE_ID_BASE = 100000;
const isStoreJob = (id: number) => id >= JOBSTORE_ID_BASE;

const ASSIGNEE_TO_TECH: Record<string, string> = Object.fromEntries(TEAM.map((t) => [t.name, t.id]));
const assigneeToTechId = (name: string): string => ASSIGNEE_TO_TECH[name?.trim()] ?? ""; // unknown / "" ⇒ unassigned
const techIdToAssignee = (id: string): string => TEAM.find((t) => t.id === id)?.name ?? "";

const pad2 = (n: number) => String(n).padStart(2, "0");
const hourToTimeStr = (h: number): string => `${pad2(Math.floor(h))}:${pad2(Math.round((h - Math.floor(h)) * 60))}`;
const timeStrToHour = (s: string): number => {
  const [h, m] = (s || "").split(":").map(Number);
  return Number.isFinite(h) ? h + (Number.isFinite(m) ? m / 60 : 0) : 9;
};
const isoFromDate = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateFromISO = (s: string): Date => { const [y, m, d] = s.split("-").map(Number); return new Date(y, (m ?? 1) - 1, d ?? 1); };

// Map a persisted JobRecord onto the board's UnifiedJob shape.
function unifiedFromRecord(rec: JobRecord): UnifiedJob {
  const start = rec.startTime ? timeStrToHour(rec.startTime) : 9;
  const end = rec.endTime ? timeStrToHour(rec.endTime) : start + 2;
  const jobType = rec.jobCategory || rec.jobType || "Service";
  return {
    id: rec.id + JOBSTORE_ID_BASE,
    num: rec.jobNumber || `J${rec.id}`,
    date: rec.startDate ? dateFromISO(rec.startDate) : null,
    technicianId: assigneeToTechId(rec.assignedTo),
    start,
    end,
    unscheduled: !rec.startDate,
    client: rec.client || "—",
    service: rec.title || "Job",
    address: rec.address || "",
    status: (rec.status as JobStatus) || "Scheduled",
    amount: Math.round(rec.totalPrice || 0),
    jobType,
    title: rec.title || "Job",
    property: rec.address || "",
    priority: "Normal",
    source: "Jobs",
    color: "blue",
    bg: jobTypeTint(jobType),
    border: jobTypeColor(jobType),
  };
}

// Convert a board UnifiedJob patch back into a JobRecord patch for jobsStore.
function recordPatchFromUnified(p: Partial<UnifiedJob>): Partial<JobRecord> {
  const rp: Partial<JobRecord> = {};
  if (p.technicianId !== undefined) rp.assignedTo = techIdToAssignee(p.technicianId);
  if (p.start !== undefined) rp.startTime = hourToTimeStr(p.start);
  if (p.end !== undefined) rp.endTime = hourToTimeStr(p.end);
  if (p.status !== undefined) rp.status = p.status;
  if (p.client !== undefined) rp.client = p.client;
  if (p.service !== undefined) rp.title = p.service;
  if (p.address !== undefined) rp.address = p.address;
  if (p.amount !== undefined) rp.totalPrice = p.amount;
  // The board's date==null / unscheduled invariant ⇒ clear the stored date.
  if (p.unscheduled === true || p.date === null) { rp.startDate = ""; rp.endDate = ""; }
  else if (p.date instanceof Date) { rp.startDate = isoFromDate(p.date); rp.endDate = isoFromDate(p.date); }
  return rp;
}

// Day view constants
const GANTT_START_HOUR = 7;   // 7 AM
const GANTT_END_HOUR   = 18;  // 6 PM (exclusive label at 18)
const HOUR_WIDTH       = 120; // px per hour (matches Figma schedule columns)
const CURRENT_TIME     = 10.5; // 10:30 AM
const WEEK_LABEL_WIDTH = 180; // matches the day-view technician column
const WEEK_TODAY = _schedBase; // today, highlighted in the week view

// Lane layout — when a technician's jobs overlap in time they stack into
// sub-rows (see packOverlaps) and the lane grows to fit. With a single row the
// math below reproduces the original fixed heights exactly (day 121, week 92),
// so non-overlapping lanes look unchanged.
const DAY_TOP_PAD = 15, DAY_CARD_H = 66, DAY_ROW_GAP = 6, DAY_BOT_PAD = 14; // 15+66+14 = 95
const WK_TOP_PAD  = 8,  WK_CARD_H  = 54, WK_ROW_GAP  = 4, WK_BOT_PAD  = 8;  // 8+54+8 = 70
const laneHeight = (rowCount: number, top: number, card: number, gap: number, bot: number) =>
  top + rowCount * card + (rowCount - 1) * gap + bot;

// ── US-3 Dispatch map ───────────────────────────────────────────────────────
// Read-only map of the selected day's scheduled jobs (Daily view only). Each
// job's coordinates are derived deterministically from its address (a stand-in
// for real geocoding); pins are coloured by technician and numbered by visit
// order; the view auto-fits all pins. Zoom in/out only — no drag, no route
// optimisation (MVP). Stays in sync with the board because it consumes the same
// filtered day jobs.
type DispatchMapJob = { id: number; technicianId: string; client: string; service: string; address: string; start: number };

// Stable hash → unit [0,1). Two salts give two independent coordinates.
const hashUnit = (seed: string, salt: number): number => {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
};

function DispatchMap({ jobs, team, selectedJobId, onSelect, floating = false }: {
  jobs: DispatchMapJob[];
  team: { id: string; name: string; color: string }[];
  selectedJobId: number | null;
  onSelect: (id: number) => void;
  floating?: boolean;
}) {
  const W = 900, H = 380, PAD = 56;
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  // Auto-fit (reset zoom) whenever the mapped set changes — date/filter/status sync.
  const idKey = jobs.map((j) => j.id).join(",");
  useEffect(() => { setZoom(1); }, [idKey]);

  // Visit number per job: per technician, ordered by start time.
  const visitNo = useMemo(() => {
    const m: Record<number, number> = {};
    const byTech: Record<string, DispatchMapJob[]> = {};
    for (const j of jobs) (byTech[j.technicianId] ??= []).push(j);
    for (const t of Object.keys(byTech)) {
      [...byTech[t]].sort((a, b) => a.start - b.start).forEach((j, i) => { m[j.id] = i + 1; });
    }
    return m;
  }, [jobs]);

  // Raw unit coords auto-fitted (bbox-normalised) into the padded canvas.
  const base = useMemo(() => {
    const raw = jobs.map((j) => ({ id: j.id, ux: hashUnit(j.address || j.client, 7), uy: hashUnit(j.address || j.client, 131) }));
    const xs = raw.map((p) => p.ux), ys = raw.map((p) => p.uy);
    const minX = Math.min(1, ...xs), maxX = Math.max(0, ...xs);
    const minY = Math.min(1, ...ys), maxY = Math.max(0, ...ys);
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
    const out: Record<number, { x: number; y: number }> = {};
    raw.forEach((p) => {
      out[p.id] = {
        x: PAD + (raw.length === 1 ? 0.5 : (p.ux - minX) / spanX) * (W - 2 * PAD),
        y: PAD + (raw.length === 1 ? 0.5 : (p.uy - minY) / spanY) * (H - 2 * PAD),
      };
    });
    return out;
  }, [jobs]);

  // Zoom by scaling positions around the centre; marker size stays constant.
  const cx = W / 2, cy = H / 2;
  const at = (id: number) => {
    const p = base[id] ?? { x: cx, y: cy };
    return { x: cx + (p.x - cx) * zoom, y: cy + (p.y - cy) * zoom };
  };
  const teamById = (id: string) => team.find((t) => t.id === id) ?? team[0];

  // Per-technician route polylines (visit order) — suggest the route, not optimise it.
  const routes = useMemo(() => {
    const byTech: Record<string, DispatchMapJob[]> = {};
    for (const j of jobs) (byTech[j.technicianId] ??= []).push(j);
    return Object.entries(byTech).map(([techId, list]) => ({
      techId,
      order: [...list].sort((a, b) => (visitNo[a.id] ?? 0) - (visitNo[b.id] ?? 0)),
    }));
  }, [jobs, visitNo]);

  // Shared map canvas (street-grid backdrop + routes + pins + zoom controls).
  // Rendered identically whether the map is the full-width strip or the
  // compact floating panel — only the surrounding chrome differs.
  const canvas =
    jobs.length === 0 ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="material-icons text-[#B6C2CF]" style={{ fontSize: "40px" }}>map</span>
        <p className="mt-2 text-[14px] text-[#546478]" style={{ fontWeight: 600 }}>No scheduled jobs to map</p>
        <p className="mt-0.5 text-[13px] text-[#8899AA]">Scheduled, in-range jobs for this day appear here.</p>
      </div>
    ) : (
      <>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Faint street grid backdrop */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={(W / 10) * i} y1={0} x2={(W / 10) * i} y2={H} stroke="#D4DCE6" strokeWidth={1} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="#D4DCE6" strokeWidth={1} />
          ))}
          {/* Routes (visit order) */}
          {routes.map(({ techId, order }) => order.length > 1 && (
            <polyline
              key={techId}
              fill="none"
              stroke={teamById(techId).color}
              strokeWidth={2}
              strokeOpacity={0.45}
              strokeDasharray="5 5"
              points={order.map((j) => { const p = at(j.id); return `${p.x},${p.y}`; }).join(" ")}
            />
          ))}
          {/* Pins */}
          {jobs.map((j) => {
            const p = at(j.id);
            const member = teamById(j.technicianId);
            const sel = selectedJobId === j.id;
            return (
              <g key={j.id} style={{ cursor: "pointer" }} onClick={() => onSelect(j.id)}>
                <title>{`${member.name}: ${j.client} — ${j.service}\n${j.address}`}</title>
                <circle cx={p.x} cy={p.y} r={sel ? 17 : 15} fill={member.color} stroke="#fff" strokeWidth={sel ? 4 : 3}
                  style={sel ? { filter: "drop-shadow(0 0 0 3px rgba(26,35,50,0.25))" } : undefined} />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={13} fontWeight={800}>
                  {visitNo[j.id]}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Zoom controls (zoom in/out only — read-only map) */}
        <div className="absolute bottom-3 right-3 flex flex-col rounded-lg border border-[#D8DCE6] bg-white shadow-sm overflow-hidden">
          <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F2F5] border-b border-[#E5E7EB]">
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>add</span>
          </button>
          <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F2F5]">
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>remove</span>
          </button>
        </div>
      </>
    );

  // Compact floating panel — pinned in the top-right corner over the board,
  // collapsible to just its header so it never hides the table for long.
  if (floating) {
    return (
      <div className="w-[360px] rounded-xl border border-[#D8DCE6] bg-white shadow-xl overflow-hidden pointer-events-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#EEF1F5]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>map</span>
            <span className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 700 }}>Route map</span>
            <span className="text-[12px] text-[#9CA3AF] shrink-0">{jobs.length} {jobs.length === 1 ? "stop" : "stops"}</span>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand route map" : "Collapse route map"}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F0F2F5] shrink-0"
          >
            <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>{collapsed ? "expand_more" : "expand_less"}</span>
          </button>
        </div>
        {!collapsed && (
          <div className="relative bg-[#EAEFF3]" style={{ height: 230 }}>
            {canvas}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-[#E5E7EB] bg-white shrink-0">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Route map</div>
        {/* Technician colour legend */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {team.map((t) => (
            <div key={t.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-[12px] text-[#6B7280] whitespace-nowrap" style={{ fontWeight: 500 }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-xl border border-[#D8DCE6] bg-[#EAEFF3] overflow-hidden relative" style={{ height: H }}>
        {canvas}
      </div>
    </div>
  );
}

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
  // Working-hours window — drives the DEFAULT visible range, the out-of-range
  // warning, and the dispatch-map filter. The rendered axis (GANTT_START/END
  // below) can grow past this to reach jobs scheduled outside working hours.
  const workStart = scheduleSettings.startHour;
  const workEnd = scheduleSettings.endHour;
  // Slot granularity is fixed at 15 min — you can always shift a job by a quarter
  // hour (no per-board granularity switcher; arbitrary minute entry stays in the form).
  const SLOT_HOURS = 0.25;
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readPersistedViewMode());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDispatchJob, setSelectedDispatchJob] = useState<DispatchJob | null>(null);
  const [selectedDayJob, setSelectedDayJob] = useState<DayJob | null>(null);
  // BUG-006: ONE job collection. The Day/Week/Month arrays the renderers consume
  // are now selectors that window this list over the calendar's current scope
  // (defined below, after `weekDays`). All mutations go through setJobs.
  const [jobs, setJobs] = useState<UnifiedJob[]>(INITIAL_JOBS);
  // Merge the shared jobsStore (what /jobs/new writes to) into the board so
  // created jobs appear on the schedule and in Pending. Local seed keeps the
  // rich demo; store jobs are mapped + id-offset so the two never collide.
  const storeRecords = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const storeJobs = useMemo(() => storeRecords.map(unifiedFromRecord), [storeRecords]);
  const allJobs = useMemo(() => [...jobs, ...storeJobs], [jobs, storeJobs]);
  // One mutation entry point: store-origin jobs (id ≥ base) persist through
  // jobsStore; local board-seed jobs mutate the local array as before.
  const patchJob = (id: number, patch: Partial<UnifiedJob>) => {
    if (isStoreJob(id)) jobsStore.update(id - JOBSTORE_ID_BASE, recordPatchFromUnified(patch));
    else setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };
  // Right-side "Unassigned" panel: open by default so dispatchers see what
  // still needs an owner. Toggle from the schedule header chip.
  const [unassignedPanelOpen, setUnassignedPanelOpen] = useState(true);
  // "Pending jobs" bucket = everything still in the right column: no technician
  // (unassigned) and/or no fixed date/time (unscheduled). The filter narrows it.
  const [pendingFilter, setPendingFilter] = useState<PendingFilter>("all");

  // Derived state chips for a job — the OVERLAPPING scheduling tags from
  // schedulingTags(). Rendered identically on the sidebar card AND the job panel
  // so the two views can never disagree (the panel used to hardcode the time +
  // workflow status and contradict the card). Falls back to the workflow status
  // for a fully scheduled+assigned board job.
  const stateChips = (j: { status: JobStatus; technicianId: string; unscheduled?: boolean }) => {
    const labels = schedulingTags(j);
    const final = labels.length ? labels : [j.status];
    return final.map((label) => {
      if (label === "Unscheduled" || label === "Unassigned") return { label, color: "#6B7280", bg: "rgba(107,114,128,0.15)" };
      const s = STATUS_STYLES[label as JobStatus];
      return { label, color: s?.color ?? "#6B7280", bg: s?.bg ?? "rgba(107,114,128,0.15)" };
    });
  };
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [pendingDropActive, setPendingDropActive] = useState(false);
  const [quickJobDraft, setQuickJobDraft] = useState<QuickJobDraft | null>(null);
  // Full "Create job" modal (Figma) opened from a board slot / header. Holds the
  // prefill seeded from the clicked slot; null when closed. Edit/reschedule of an
  // existing job still uses the lightweight quickJobDraft above.
  const [fullCreateDraft, setFullCreateDraft] = useState<CreateJobPrefill | null>(null);
  // Editing an existing board job opens the SAME full modal (Figma) in edit mode.
  const [fullEditDraft, setFullEditDraft] = useState<{ view: "day" | "week"; job: DayJob | DispatchJob; dateStr: string } | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [selectedMapJobId, setSelectedMapJobId] = useState<number | null>(DAY_JOBS[0]?.id ?? null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Details");
  const [jobNotes, setJobNotes] = useState<Record<string, string[]>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedWeekDays, setCollapsedWeekDays] = useState<Set<number>>(() => new Set());
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const weekTodayRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

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
  // US-2: clicking the date label jumps back to today. (Legacy "Today" button
  // was dropped — the date label itself is the affordance.)
  const goToday = () => setCurrentDate(new Date());
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

  // ── BUG-006: derive each view by windowing the ONE `jobs` collection ────────
  // Day = jobs dated to currentDate (+ all unscheduled, which are date-agnostic
  // and live in the pending sidebar). Week = jobs whose date falls in the visible
  // week (dayIdx computed from the date). Month = all dated jobs (getEventsForDay
  // windows further per day). The renderers consume the SAME DayJob/DispatchJob/
  // CalendarEvent shapes as before — these selectors just project the union.
  const dayJobsView: DayJob[] = useMemo(
    () => allJobs
      .filter((j) => j.unscheduled || (j.date != null && isSameDay(j.date, currentDate)))
      .map((j) => ({ id: j.id, technicianId: j.technicianId, start: j.start, end: j.end, client: j.client, service: j.service, address: j.address, status: j.status, amount: j.amount, bg: j.bg, border: j.border, jobType: j.jobType, unscheduled: j.unscheduled })),
    [allJobs, currentDate],
  );
  const weekJobsView: DispatchJob[] = useMemo(
    () => allJobs
      .map((j) => ({ id: j.id, num: j.num, technicianId: j.technicianId, client: j.client, service: j.service, address: j.address, status: j.status, dayIdx: j.date != null ? weekDays.findIndex((d) => isSameDay(d, j.date!)) : -1, start: j.start, end: j.end, amount: j.amount, bg: j.bg, border: j.border, priority: j.priority, jobType: j.jobType, source: j.source, unscheduled: j.unscheduled }))
      .filter((j) => j.unscheduled || j.dayIdx >= 0),
    [allJobs, weekDays],
  );
  const monthEventsView: CalendarEvent[] = useMemo(
    () => allJobs
      .filter((j) => j.date != null)
      .map((j) => ({ id: j.id, title: j.title, client: j.client, date: j.date!, startHour: j.start, duration: j.end - j.start, color: j.color, jobType: j.jobType, status: j.status, property: j.property, amount: j.amount })),
    [allJobs],
  );

  // Month pending is windowed to the visible MONTH — so "Scheduled this month"
  // surfaces everything dated this month that still needs an owner (Marek's
  // production-manager rollup) — plus the date-agnostic unscheduled jobs.
  const monthPendingView: DayJob[] = useMemo(
    () => allJobs
      .filter((j) => j.unscheduled || (j.date != null && isSameMonth(j.date, currentDate)))
      .map((j) => ({ id: j.id, technicianId: j.technicianId, start: j.start, end: j.end, client: j.client, service: j.service, address: j.address, status: j.status, amount: j.amount, bg: j.bg, border: j.border, jobType: j.jobType, unscheduled: j.unscheduled })),
    [allJobs, currentDate],
  );
  // Pending sidebar = the ACTIVE view's window of the same collection — so the
  // "scheduled" filter reflects the calendar's current scope (Acceptance Check 5):
  // day → today, week → this week, month → this month.
  const pendingSource: (DayJob | DispatchJob)[] = viewMode === "week" ? weekJobsView : viewMode === "month" ? monthPendingView : dayJobsView;
  const pendingBucket = pendingSource.filter(isPending);
  const pendingDayJobs = pendingJobs(pendingSource, pendingFilter);
  // "Scheduled" filter label — bare, no time scope (Figma): the dropdown reads
  // "Show scheduled" on every view, and the empty state "No jobs scheduled".
  // The filter still windows to the ACTIVE calendar scope (day/week/month) via
  // pendingSource; only the LABEL drops the "today / this week / this month"
  // suffix.
  const scheduledScopeLabel = "Scheduled";

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
    ? monthEventsView.filter(e => isSameDay(e.date, day))
    : [];
  const getC = (color: string) => COLORS[color as keyof typeof COLORS] || COLORS.blue;

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewMode === "week"
    ? `${formatRegionalDate(weekDays[0], regionalSettings)} - ${formatRegionalDate(weekDays[6], regionalSettings)}`
    : `${format(currentDate, "EEEE")}, ${formatRegionalDate(currentDate, regionalSettings)}`;

  const openWeekDayIndexes = new Set(weekDays.map((day, index) => isDateOpenForBusiness(day, businessHours) ? index : -1).filter(index => index >= 0));
  const filteredMonthEvents = monthEventsView.filter(event => isDateOpenForBusiness(event.date, businessHours));
  // Exclude unscheduled jobs (no date) from the week board — they live in the
  // Pending sidebar, not on a day column (e.g. after a drag-back to Pending).
  const filteredWeekJobs = weekJobsView.filter(job => openWeekDayIndexes.has(job.dayIdx) && !job.unscheduled);
  const filteredDayJobs = isCurrentDateOpen ? dayJobsView : [];

  // The time axis defaults to working hours but EXPANDS to include any job
  // scheduled outside them (e.g. a 3 AM visit) so it stays reachable by
  // scrolling. With no such job it equals the working-hours window (no change).
  const boardExtent = (() => {
    let lo = workStart, hi = workEnd;
    const src = viewMode === "week" ? filteredWeekJobs : filteredDayJobs;
    for (const j of src) {
      if (j.unscheduled || !j.technicianId) continue;
      lo = Math.min(lo, Math.floor(j.start));
      hi = Math.max(hi, Math.ceil(j.end));
    }
    return { lo, hi };
  })();
  const GANTT_START_HOUR = boardExtent.lo;
  const GANTT_END_HOUR = boardExtent.hi;

  // Gantt grid total width
  const ganttHours = Array.from({ length: GANTT_END_HOUR - GANTT_START_HOUR + 1 }, (_, i) => GANTT_START_HOUR + i);
  const ganttTotalWidth = (GANTT_END_HOUR - GANTT_START_HOUR) * HOUR_WIDTH;

  // Default the board's horizontal scroll to working-hours start, so out-of-range
  // jobs sit off to the side until the dispatcher scrolls to them. Re-applied on
  // day / view change (and when the extent grows past working hours).
  useEffect(() => {
    const el = viewMode === "day" ? dayScrollRef.current : viewMode === "week" ? weekScrollRef.current : null;
    if (el) el.scrollLeft = Math.max(0, (workStart - GANTT_START_HOUR) * HOUR_WIDTH);
  }, [viewMode, currentDate, GANTT_START_HOUR, workStart]);
  // Per-technician packed lane height for the DAY board: time-overlapping jobs
  // stack into sub-rows (packOverlaps) and the lane grows to fit. Computed once
  // so the sticky left label column and the time-grid lane stay row-aligned.
  const dayPackByMember: Record<string, { rowByJobId: Record<number, number>; laneH: number }> =
    Object.fromEntries(
      TEAM.map((m) => {
        const memberJobs = filteredDayJobs
          .filter((job) => job.technicianId === m.id && !job.unscheduled && isShownOnBoard(job.status))
          .sort((a, b) => a.start - b.start);
        const { rowByJobId, rowCount } = packOverlaps(memberJobs);
        return [m.id, { rowByJobId, laneH: laneHeight(rowCount, DAY_TOP_PAD, DAY_CARD_H, DAY_ROW_GAP, DAY_BOT_PAD) }];
      }),
    );
  const monthRevenue = filteredMonthEvents.reduce((sum, event) => sum + event.amount, 0);
  const weekRevenue = filteredWeekJobs.reduce((sum, job) => sum + job.amount, 0);
  const dayRevenue = filteredDayJobs.reduce((sum, job) => sum + job.amount, 0);
  const topRevenue = viewMode === "month" ? monthRevenue : viewMode === "week" ? weekRevenue : dayRevenue;
  const topRevenueLabel = "Revenue"; // unscoped (Figma); period is shown by the date navigator
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
  const scopedJobLabel = "Jobs"; // unscoped (Figma)
  const scheduleKpis = [
    { value: `$${topRevenue.toLocaleString("en-US")}`, label: topRevenueLabel, icon: "payments", color: "#16A34A", bg: "#D1FAE5" },
    { value: String(scheduleJobCount), label: scopedJobLabel, icon: "work", color: "#4A6FA5", bg: "#EBF0F8" },
    { value: String(inProgressJobCount), label: "In progress", icon: "schedule", color: "#D97706", bg: "#FEF3C7" },
    // Completion rate shown on all views — Figma Day includes it as the 4th card.
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
    jobs.some((job) => job.id !== jobId && job.dayIdx === dayIdx && job.technicianId === technicianId && occupiesSlot(job.status) && hasOverlap(start, end, job.start, job.end));

  // US-4: overlap check the Create-Job modal calls live while the dispatcher sets
  // the time. Scans the WHOLE board collection (seeds + store jobs) for the same
  // technician on the same date, so the inline error reflects the real board.
  const boardCheckConflict = ({ assignedTo, startDate, startHour, endHour }: { assignedTo: string; startDate: string; startHour: number; endHour: number }): boolean => {
    const techId = assigneeToTechId(assignedTo);
    if (!techId) return false;
    const date = dateFromISO(startDate);
    return allJobs.some(
      (j) =>
        j.technicianId === techId &&
        !j.unscheduled &&
        j.date != null &&
        isSameDay(j.date, date) &&
        occupiesSlot(j.status) &&
        hasOverlap(startHour, endHour, j.start, j.end),
    );
  };

  // All three operate on the ONE collection now; they keep their own projected
  // selection (selectedDayJob / selectedDispatchJob / selectedEvent) in sync.
  const updateDayStatus = (jobId: number, status: JobStatus) => {
    patchJob(jobId, { status });
    setSelectedDayJob((job) => job?.id === jobId ? { ...job, status } : job);
  };

  const updateWeekStatus = (jobId: number, status: JobStatus) => {
    patchJob(jobId, { status });
    setSelectedDispatchJob((job) => job?.id === jobId ? { ...job, status } : job);
  };

  const updateEventStatus = (eventId: number, status: JobStatus) => {
    patchJob(eventId, { status });
    setSelectedEvent((ev) => ev?.id === eventId ? { ...ev, status } : ev);
  };

  // Creating a job from the board now opens the FULL Create job modal (Figma),
  // seeded with the clicked slot's date/time/technician (§Jun 11 call). The
  // lightweight quick modal is reserved for reschedule/edit of existing jobs.
  const openQuickCreate = (_view: "day" | "week", date: Date, startHour: number, technicianId: string, _dayIdx?: number) => {
    if (!isDateOpenForBusiness(date, businessHours)) {
      setToast("This day is closed in business hours.");
      return;
    }
    const start = Math.max(GANTT_START_HOUR, Math.min(GANTT_END_HOUR - SLOT_HOURS, startHour));
    const end = Math.min(GANTT_END_HOUR, start + Math.max(1, SLOT_HOURS));
    setConflictMessage(null);
    setFullCreateDraft({
      startDate: format(date, "yyyy-MM-dd"),
      endDate: format(date, "yyyy-MM-dd"),
      startTime: hourToTimeStr(start),
      endTime: hourToTimeStr(end),
      assignedTo: TEAM.find((m) => m.id === technicianId)?.name,
      scheduleJob: true,
    });
  };

  // Reschedule an EXISTING job (brief §6: reschedule ≠ create). Prefills the
  // dialog from the job itself and flags it as an edit (editJobId) so submit
  // UPDATES the job in place — preserving its identity, type colour and workflow
  // status — instead of inserting a brand-new job (the old bug).
  const openReschedule = (view: "day" | "week", job: DayJob | DispatchJob) => {
    if (!isDraggable(job.status)) return; // completed/cancelled are locked (§7.3)
    const dayIdx = view === "week" ? (job as DispatchJob).dayIdx : undefined;
    const date = view === "week" ? (weekDays[dayIdx ?? 0] ?? weekDays[0]) : currentDate;
    if (!isDateOpenForBusiness(date, businessHours)) {
      setToast("This day is closed in business hours.");
      return;
    }
    setConflictMessage(null);
    setQuickJobDraft({
      view,
      date,
      dayIdx,
      technicianId: job.technicianId,
      start: job.start,
      end: job.end,
      client: job.client,
      service: job.service,
      address: job.address,
      amount: String(job.amount ?? 0),
      editJobId: job.id,
    });
  };

  // Full Edit of an existing job, in place (BUG-002 demo-safe fix). Same as
  // reschedule but the identity fields are editable. Crucially this does NOT
  // navigate to /jobs/:id — the calendar's per-view jobs aren't in jobsStore, so
  // that route falls back to an unrelated mock record. Edits the actual job.
  const openEditJob = (view: "day" | "week", job: DayJob | DispatchJob) => {
    if (!isDraggable(job.status)) return; // completed/cancelled are locked (§7.3)
    const dayIdx = view === "week" ? (job as DispatchJob).dayIdx : undefined;
    const date = view === "week" ? (weekDays[dayIdx ?? 0] ?? weekDays[0]) : currentDate;
    setConflictMessage(null);
    setQuickJobDraft({
      view,
      date,
      dayIdx,
      technicianId: job.technicianId,
      start: job.start,
      end: job.end,
      client: job.client,
      service: job.service,
      address: job.address,
      amount: String(job.amount ?? 0),
      editJobId: job.id,
      editIdentity: true,
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
    // Fields shared by create and reschedule. For a reschedule we deliberately
    // DON'T touch status / type colour — only the scheduling + editable fields,
    // and we clear `unscheduled` because the job now has a date again.
    const common = {
      technicianId: quickJobDraft.technicianId,
      start: quickJobDraft.start,
      end: quickJobDraft.end,
      client: quickJobDraft.client.trim() || "New Customer",
      service: quickJobDraft.service.trim() || "Service Call",
      address: quickJobDraft.address.trim() || "Address TBD",
      amount,
    };
    const createExtras = { status: "Scheduled" as JobStatus, bg: "#EBF0F8", border: "#4A6FA5" };
    const editId = quickJobDraft.editJobId;

    if (quickJobDraft.view === "day") {
      if (dayHasConflict(dayJobsView, editId ?? null, common.technicianId, common.start, common.end)) {
        setConflictMessage("This slot overlaps with another job for the same person.");
        return;
      }
      if (editId != null) {
        patchJob(editId, { ...common, date: currentDate, unscheduled: false });
        setSelectedDayJob((j) => (j && j.id === editId ? { ...j, ...common, unscheduled: false } : j));
        setSelectedMapJobId(editId);
        setToast("Job rescheduled");
      } else {
        const nextId = Math.max(0, ...jobs.map((j) => j.id)) + 1;
        const newJob: UnifiedJob = {
          id: nextId, num: `D${String(nextId).padStart(2, "0")}`, date: currentDate, unscheduled: false,
          title: common.service, property: common.address, priority: "Normal", source: "Schedule", color: "blue", jobType: "Service",
          ...common, ...createExtras,
        };
        setJobs((js) => [...js, newJob]);
        setSelectedDayJob({ id: newJob.id, technicianId: newJob.technicianId, start: newJob.start, end: newJob.end, client: newJob.client, service: newJob.service, address: newJob.address, status: newJob.status, amount: newJob.amount, bg: newJob.bg, border: newJob.border, jobType: newJob.jobType, unscheduled: newJob.unscheduled });
        setSelectedMapJobId(nextId);
      }
    } else {
      const dayIdx = quickJobDraft.dayIdx ?? 0;
      const storedDate = weekDays[dayIdx] ?? currentDate;   // the real date for that week column
      if (weekHasConflict(weekJobsView, editId ?? null, dayIdx, common.technicianId, common.start, common.end)) {
        setConflictMessage("This slot overlaps with another job for the same person.");
        return;
      }
      if (editId != null) {
        patchJob(editId, { ...common, date: storedDate, unscheduled: false });
        setSelectedDispatchJob((j) => (j && j.id === editId ? { ...j, ...common, dayIdx, unscheduled: false } : j));
        setToast("Job rescheduled");
      } else {
        const nextId = Math.max(0, ...jobs.map((j) => j.id)) + 1;
        const newJob: UnifiedJob = {
          id: nextId, num: `24${String(nextId).padStart(2, "0")}`, date: storedDate, unscheduled: false,
          title: common.service, property: common.address, priority: "Normal", source: "Schedule", color: "blue", jobType: "Repair",
          ...common, ...createExtras,
        };
        setJobs((js) => [...js, newJob]);
      }
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
    const targetJob = allJobs.find((job) => job.id === jobId);
    if (!targetJob) return;
    if (!openWeekDayIndexes.has(dayIdx)) {
      setConflictMessage("This day is closed in business hours.");
      return;
    }
    const duration = targetJob.end - targetJob.start;
    const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
    if (weekHasConflict(weekJobsView, jobId, dayIdx, technicianId, dropStart, dropEnd)) {
      setConflictMessage("That move conflicts with another job for the same person.");
      return;
    }
    setConflictMessage(null);
    // Dropping onto a week (day × tech) cell gives the job that day's real DATE
    // + technician + slot, and clears unscheduled. patchJob routes store jobs
    // back to jobsStore so created jobs are fully draggable.
    patchJob(jobId, { date: weekDays[dayIdx] ?? targetJob.date, technicianId, start: dropStart, end: dropEnd, unscheduled: false });
    setToast(`Moved to ${formatRegionalTime(dropStart, regionalSettings)}`);
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
    const targetJob = allJobs.find((job) => job.id === jobId);
    if (!targetJob) return;
    if (!isCurrentDateOpen) {
      setConflictMessage("This day is closed in business hours.");
      return;
    }
    // Pending jobs (no tech and/or no date) get a default duration by job
    // type; already-scheduled jobs keep their length when moved slot→slot.
    const fromPending = isPending(targetJob);
    const duration = fromPending ? durationForType(targetJob.jobType) : (targetJob.end - targetJob.start);
    const dropEnd = Math.min(GANTT_END_HOUR, dropStart + duration);
    if (dayHasConflict(dayJobsView, jobId, technicianId, dropStart, dropEnd)) {
      setConflictMessage("That move conflicts with another job for the same person.");
      return;
    }
    setConflictMessage(null);
    // Placing a job on a day lane gives it TODAY's date + a technician + time.
    // Status follows the backlog rule: pending→Scheduled, else unchanged.
    patchJob(jobId, { date: currentDate, technicianId, start: dropStart, end: dropEnd, unscheduled: false, status: statusAfterAssignToSlot(targetJob.status, fromPending) });
    setToast(`Moved to ${formatRegionalTime(dropStart, regionalSettings)}`);
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
    if (kind !== "week" && kind !== "day") return;
    const jobId = Number(rawId);
    // One collection now — clear the DATE (→ unscheduled) but KEEP the technician
    // (Marek's leftover history). Completed/cancelled and already-pending jobs are
    // ignored. patchJob routes store jobs back to jobsStore.
    const targetJob = allJobs.find((job) => job.id === jobId);
    if (!targetJob || isPending(targetJob) || !isDraggable(targetJob.status)) return;
    setConflictMessage(null);
    patchJob(jobId, { unscheduled: true, date: null });
    setToast("Moved to Pending — date cleared, technician kept");
  };

  const handleWeekSlotClick = (event: MouseEvent<HTMLDivElement>, date: Date, technicianId: string, dayIdx: number) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    if (!openWeekDayIndexes.has(dayIdx)) return;
    openQuickCreate("week", date, hourFromPointer(event), technicianId, dayIdx);
  };

  const handleDaySlotClick = (event: MouseEvent<HTMLDivElement>, technicianId: string) => {
    if ((event.target as HTMLElement).closest("[data-job-card='true']")) return;
    if (!isCurrentDateOpen) return;
    openQuickCreate("day", currentDate, hourFromPointer(event), technicianId);
  };

  const openHeaderQuickCreate = () => {
    if (viewMode === "week") {
      const openDayIndex = weekDays.findIndex(day => isDateOpenForBusiness(day, businessHours));
      if (openDayIndex === -1) {
        setToast("This week has no open business days.");
        return;
      }
      openQuickCreate("week", weekDays[openDayIndex], workStart, TEAM[0].id, openDayIndex);
      return;
    }
    openQuickCreate("day", currentDate, workStart, TEAM[0].id);
  };


  // Keyboard shortcuts: ← → navigate, T today, D/W/M view, N new job, Esc close
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        if (fullEditDraft) { setFullEditDraft(null); event.preventDefault(); return; }
        if (fullCreateDraft) { setFullCreateDraft(null); event.preventDefault(); return; }
        if (quickJobDraft) { setQuickJobDraft(null); event.preventDefault(); return; }
        if (selectedEvent) { setSelectedEvent(null); event.preventDefault(); return; }
        if (selectedDispatchJob) { setSelectedDispatchJob(null); event.preventDefault(); return; }
        if (selectedDayJob) { setSelectedDayJob(null); event.preventDefault(); return; }
        return;
      }
      if (isTyping || quickJobDraft || fullCreateDraft || fullEditDraft) return;
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
  }, [viewMode, currentDate, quickJobDraft, fullCreateDraft, fullEditDraft, selectedEvent, selectedDispatchJob, selectedDayJob]);

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

  // Pending-jobs panel as a full-height, embedded right-side sidebar drawer
  // (Figma 876:71887). Rendered at the page level so it docks beside the whole
  // board (KPIs + grid + route map) and the content shrinks to make room —
  // not a short column inside the board card, and not a floating overlay.
  const pendingPanel = (
    <aside
      data-testid="pending-drawer"
      className={`w-[340px] shrink-0 self-start sticky top-4 flex flex-col rounded-xl border overflow-hidden transition-colors ${pendingDropActive ? "bg-[#4A6FA5]/5 border-[#4A6FA5]" : "bg-[#FAFBFC] border-[#E5E7EB]"}`}
      style={{ height: "calc(100vh - 96px)" }}
      onDragEnter={(e) => { e.preventDefault(); setPendingDropActive(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setPendingDropActive(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPendingDropActive(false); }}
      onDrop={handleMoveToPending}
    >
      <div className="flex items-center gap-2 px-4 border-b border-[#E5E7EB] bg-white shrink-0" style={{ height: 48 }}>
        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>inbox</span>
        <span className="flex-1 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
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
      <div className="px-3 py-2 border-b border-[#E5E7EB] bg-white shrink-0">
        <select
          value={pendingFilter}
          onChange={(e) => setPendingFilter(e.target.value as PendingFilter)}
          className="w-full h-9 px-2 rounded-md border border-[#E5E7EB] text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5] cursor-pointer"
        >
          <option value="all">Show all</option>
          <option value="unassigned">Show unassigned</option>
          <option value="unscheduled">Show unscheduled</option>
          <option value="scheduled">Show {scheduledScopeLabel.toLowerCase()}</option>
          <option value="both">Show unassigned + unscheduled</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pendingDayJobs.length === 0 ? (
          <div className="py-10 text-center">
            <span className="material-icons text-[#D1D5DB] mb-1 block" style={{ fontSize: "32px" }}>check_circle</span>
            <div className="text-[12px] text-[#9CA3AF]">{pendingFilter === "all" ? "Nothing pending" : pendingFilter === "both" ? "No unassigned + unscheduled jobs" : pendingFilter === "scheduled" ? `No jobs ${scheduledScopeLabel.toLowerCase()}` : `No ${pendingFilter} jobs`}</div>
          </div>
        ) : (
          pendingDayJobs.map((job) => {
            const typeColor = jobTypeColor(job.jobType);
            const chips = stateChips(job);
            return (
              <div
                key={job.id}
                data-job-card="true"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", `${viewMode === "week" ? "week" : "day"}:${job.id}`)}
                onClick={() => (viewMode === "week" ? setSelectedDispatchJob(job as DispatchJob) : setSelectedDayJob(job as DayJob))}
                className="bg-white border border-[#E5E7EB] rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                style={{ borderLeft: `3px solid ${typeColor}`, backgroundColor: jobTypeTint(job.jobType) }}
                title={`${job.client} — ${job.service}${job.jobType ? ` (${job.jobType})` : ""}\n${job.address}\n${job.unscheduled ? "No date" : `${formatRegionalTime(job.start, regionalSettings)}–${formatRegionalTime(job.end, regionalSettings)}`} · ${chips.map((c) => c.label).join(" · ")}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] tabular-nums">
                  <span className="truncate">{job.unscheduled ? "--:-- – --:--" : `${formatRegionalTime(job.start, regionalSettings)} – ${formatRegionalTime(job.end, regionalSettings)}`}</span>
                </div>
                <div className="text-[13px] text-[#1A2332] mt-1 truncate" style={{ fontWeight: 700 }}>{job.service}</div>
                <div className="text-[11px] text-[#546478] truncate">{job.client}</div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {job.amount > 0 ? (
                    <span className="text-[12px] tabular-nums" style={{ fontWeight: 700, color: typeColor }}>${job.amount.toLocaleString("en-US")}</span>
                  ) : (
                    <span className="text-[12px] text-[#9CA3AF]">—</span>
                  )}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {chips.map((c) => (
                      <span
                        key={c.label}
                        className="px-2 py-0.5 rounded-full text-[10px] max-w-[110px] truncate"
                        style={{ backgroundColor: c.bg, color: c.color, fontWeight: 600 }}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

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

      {/* Board content (left) + the Pending-jobs sidebar drawer (right). The
          drawer is embedded: it docks full-height beside the board and the
          content column shrinks to make room (no overlay). */}
      <div className="flex gap-4 min-w-0 items-stretch">
        <div className="flex-1 min-w-0 flex flex-col relative">
      {/* Route map — compact panel pinned to the top-right corner over the
          board (day view only). The wrapper is a zero-height sticky row so the
          map floats above the table without pushing the grid down, and stays
          put while the rows scroll. pointer-events pass through to the grid
          everywhere except the panel itself. */}
      {viewMode === "day" && (
        <div className="pointer-events-none sticky top-3 z-30 h-0 flex justify-end items-start pr-1">
          {/* offset below the card's date-nav/legend header so the panel floats
              over the grid cells (scrollable) rather than the nav controls */}
          <div className="mt-[56px]">
            <DispatchMap
              floating
              jobs={filteredDayJobs.filter(
                (j) => !j.unscheduled && j.technicianId && occupiesSlot(j.status) && j.start >= workStart && j.end <= workEnd,
              )}
              team={TEAM}
              selectedJobId={selectedMapJobId}
              onSelect={(id) => {
                const job = filteredDayJobs.find((j) => j.id === id) ?? null;
                setSelectedMapJobId(id);
                if (job) setSelectedDayJob(job);
              }}
            />
          </div>
        </div>
      )}
      {/* KPI stat cards removed (per request) — the schedule grid is pulled up.
          The scheduling-conflict banner stays. */}
      {conflictMessage && (
        <div className="mb-4 px-3 py-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-[12px] text-[#B91C1C]" style={{ fontWeight: 600 }}>
          {conflictMessage}
        </div>
      )}

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
            {/* Pending-jobs toggle chip — available on day, week and month views */}
            {(
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
                        // Stack time-overlapping jobs into sub-rows (same as the day board).
                        const { rowByJobId, rowCount } = packOverlaps(memberJobs);
                        const laneH = laneHeight(rowCount, WK_TOP_PAD, WK_CARD_H, WK_ROW_GAP, WK_BOT_PAD);

                        return (
                          <div key={`${dayI}-${member.id}`} className="flex" style={{ height: laneH }}>
                            <div
                              className="shrink-0 sticky left-0 z-10 flex items-center gap-2.5 px-3 bg-white"
                              style={{
                                width: WEEK_LABEL_WIDTH,
                                minWidth: WEEK_LABEL_WIDTH,
                                height: laneH,
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
                                height: laneH,
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
                                      top: WK_TOP_PAD + (rowByJobId[job.id] ?? 0) * (WK_CARD_H + WK_ROW_GAP),
                                      height: WK_CARD_H,
                                      backgroundColor: jobTypeTint(job.jobType),
                                      borderLeft: `3px solid ${typeColor}`,
                                      boxShadow: isSelected ? `0 0 0 2px ${typeColor}` : "none",
                                    }}
                                    onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", `week:${job.id}`); }}
                                    onClick={() => setSelectedDispatchJob(isSelected ? null : job)}
                                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDispatchJob(isSelected ? null : job); } }}
                                    onDoubleClick={(event) => event.stopPropagation()}
                                  >
                                    <div className="flex flex-col h-full px-2 py-1.5 gap-1">
                                      {/* Line 1: client + route counter in the corner */}
                                      <div className="flex items-start gap-1.5">
                                        <span className="flex-1 min-w-0 truncate text-[11px] leading-tight" style={{ fontWeight: 700, color: "#1A2332" }}>{job.client}</span>
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white shrink-0" style={{ backgroundColor: member.color, fontWeight: 700 }}>
                                          {routeNumber}
                                        </span>
                                      </div>
                                      {/* Line 2: job title + price + status */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="flex-1 min-w-0 truncate text-[10px] text-[#546478]">{job.service}</span>
                                        {job.amount > 0 && (
                                          <span className="text-[10px] tabular-nums shrink-0" style={{ fontWeight: 700, color: "#1A2332" }}>${job.amount.toLocaleString("en-US")}</span>
                                        )}
                                        <button
                                          className="material-icons flex h-5 w-5 items-center justify-center rounded-full shrink-0 text-[14px] leading-none"
                                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                                          title={job.status}
                                          aria-label={`Status: ${job.status}. Click to advance.`}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            updateWeekStatus(job.id, nextStatus(job.status));
                                          }}
                                        >
                                          {STATUS_ICONS[job.status]}
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
              <JobInfoDrawer
                job={{
                  id: selectedDispatchJob.id,
                  headerTitle: selectedDispatchJob.service || `Job #${selectedDispatchJob.num}`,
                  client: selectedDispatchJob.client,
                  service: selectedDispatchJob.service,
                  address: selectedDispatchJob.address,
                  status: selectedDispatchJob.status,
                  technicianId: selectedDispatchJob.technicianId,
                  jobType: selectedDispatchJob.jobType,
                  amount: selectedDispatchJob.amount,
                  unscheduled: selectedDispatchJob.unscheduled,
                  startLabel: selectedDispatchJob.unscheduled ? "" : formatRegionalTime(selectedDispatchJob.start, regionalSettings),
                  endLabel: selectedDispatchJob.unscheduled ? "" : formatRegionalTime(selectedDispatchJob.end, regionalSettings),
                  dateLabel: selectedDispatchJob.unscheduled ? "" : format(weekDays[selectedDispatchJob.dayIdx] ?? currentDate, "dd-MM-yyyy"),
                  durationLabel: String(Math.max(0, selectedDispatchJob.end - selectedDispatchJob.start)),
                  frequency: "One-off",
                }}
                jobTypes={jobTypes}
                onClose={() => setSelectedDispatchJob(null)}
                onStatus={(s) => updateWeekStatus(selectedDispatchJob.id, s)}
                onType={(t) => { patchJob(selectedDispatchJob.id, { jobType: t }); setSelectedDispatchJob((j) => (j ? { ...j, jobType: t } : j)); }}
                onTechnician={(tid) => { patchJob(selectedDispatchJob.id, { technicianId: tid }); setSelectedDispatchJob((j) => (j ? { ...j, technicianId: tid } : j)); }}
                onEdit={() => setFullEditDraft({ view: "week", job: selectedDispatchJob, dateStr: format(weekDays[selectedDispatchJob.dayIdx] ?? currentDate, "yyyy-MM-dd") })}
                onReopen={() => updateWeekStatus(selectedDispatchJob.id, "Scheduled")}
                notes={notesForActive}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                addNote={addNote}
                history={historyForActive}
              />
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
                  style={{ height: dayPackByMember[member.id].laneH }}
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
              <div ref={dayScrollRef} className="flex-1 overflow-x-auto overflow-y-auto">
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
                      // PO decision: cancelled jobs STAY on the board (greyed, struck
                      // through) so a new job can be scheduled over them; isShownOnBoard
                      // now returns true for every status. They just never block a slot.
                      .filter((job) => isShownOnBoard(job.status))
                      .sort((a, b) => a.start - b.start);
                    // Sub-row layout (overlapping jobs never cover each other);
                    // shared with the left label column so both stay aligned.
                    const { rowByJobId, laneH } = dayPackByMember[member.id];

                    return (
                      <div
                        key={member.id}
                        className="relative border-b border-[#E5E7EB]"
                        style={{ height: laneH }}
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
                          // Cancelled stays on the board but reads as struck-through /
                          // greyed so it's clear you can schedule over it.
                          const isCancelled = job.status === "Cancelled";
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
                                top: DAY_TOP_PAD + (rowByJobId[job.id] ?? 0) * (DAY_CARD_H + DAY_ROW_GAP),
                                height: DAY_CARD_H,
                                backgroundColor: jobTypeTint(job.jobType),
                                borderLeft: `3px solid ${typeColor}`,
                                boxShadow: selectedDayJob?.id === job.id ? `0 0 0 2px ${typeColor}` : "none",
                                opacity: canDrag ? 1 : 0.6,
                              }}
                              onDragStart={(event) => {
                                if (!canDrag) { event.preventDefault(); return; }
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", `day:${job.id}`);
                              }}
                              onClick={() => {
                                setSelectedDayJob(job);
                                setSelectedMapJobId(job.id);
                              }}
                              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDayJob(job); setSelectedMapJobId(job.id); } }}
                              onDoubleClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col h-full px-3 py-2 gap-1" style={{ textDecoration: isCancelled ? "line-through" : undefined, textDecorationColor: isCancelled ? "#9CA3AF" : undefined }}>
                                {/* Line 1: client + route counter in the corner */}
                                <div className="flex items-start gap-2">
                                  <span className="flex-1 min-w-0 truncate text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 600 }}>{job.client}</span>
                                  <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[12px] leading-4 text-white shrink-0" style={{ backgroundColor: member.color, fontWeight: 500, textDecoration: "none" }}>
                                    {routeNumber}
                                  </span>
                                </div>
                                {/* Line 2: job title + price + status */}
                                <div className="flex items-center gap-2">
                                  <span className="flex-1 min-w-0 truncate text-[13px] leading-5 text-[#6B7280]" style={{ fontWeight: 500 }}>{job.service}</span>
                                  {job.amount > 0 && (
                                    <span className="text-[13px] leading-5 tabular-nums shrink-0" style={{ fontWeight: 600, color: "#1A2332" }}>${job.amount.toLocaleString("en-US")}</span>
                                  )}
                                  <button
                                    className="material-icons flex h-6 w-6 items-center justify-center rounded-full shrink-0 text-[16px] leading-none"
                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, textDecoration: "none" }}
                                    title={job.status}
                                    aria-label={`Status: ${job.status}. Click to advance.`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      updateDayStatus(job.id, nextStatus(job.status));
                                    }}
                                  >
                                    {STATUS_ICONS[job.status]}
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

            {/* Pending-jobs panel moved out to a page-level full-height sidebar
                drawer (see `pendingPanel` above the return). */}

            {selectedDayJob ? (
              <JobInfoDrawer
                job={{
                  id: selectedDayJob.id,
                  headerTitle: selectedDayJob.service || `Job #${selectedDayJob.id}`,
                  client: selectedDayJob.client,
                  service: selectedDayJob.service,
                  address: selectedDayJob.address,
                  status: selectedDayJob.status,
                  technicianId: selectedDayJob.technicianId,
                  jobType: selectedDayJob.jobType,
                  amount: selectedDayJob.amount,
                  unscheduled: selectedDayJob.unscheduled,
                  startLabel: selectedDayJob.unscheduled ? "" : formatRegionalTime(selectedDayJob.start, regionalSettings),
                  endLabel: selectedDayJob.unscheduled ? "" : formatRegionalTime(selectedDayJob.end, regionalSettings),
                  dateLabel: selectedDayJob.unscheduled ? "" : format(currentDate, "dd-MM-yyyy"),
                  durationLabel: String(Math.max(0, selectedDayJob.end - selectedDayJob.start)),
                  frequency: "One-off",
                }}
                jobTypes={jobTypes}
                onClose={() => setSelectedDayJob(null)}
                onStatus={(s) => updateDayStatus(selectedDayJob.id, s)}
                onType={(t) => { patchJob(selectedDayJob.id, { jobType: t }); setSelectedDayJob((j) => (j ? { ...j, jobType: t } : j)); }}
                onTechnician={(tid) => { patchJob(selectedDayJob.id, { technicianId: tid }); setSelectedDayJob((j) => (j ? { ...j, technicianId: tid } : j)); }}
                onEdit={() => setFullEditDraft({ view: "day", job: selectedDayJob, dateStr: format(currentDate, "yyyy-MM-dd") })}
                onReopen={() => updateDayStatus(selectedDayJob.id, "Scheduled")}
                notes={notesForActive}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                addNote={addNote}
                history={historyForActive}
              />
            ) : null}

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
              <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>{quickJobDraft.editJobId == null ? "Create job" : quickJobDraft.editIdentity ? `Edit job #${quickJobDraft.editJobId}` : `Reschedule job #${quickJobDraft.editJobId}`}</div>
              <button type="button" onClick={() => setQuickJobDraft(null)} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block">
                <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Client</span>
                {quickJobDraft.editJobId != null && !quickJobDraft.editIdentity ? (
                  // Reschedule keeps the job's identity — customer is read-only.
                  <div className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-[13px] bg-[#F9FAFB] text-[#1A2332] flex items-center">{quickJobDraft.client}</div>
                ) : (
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
                  {/* Inject the job's current client so Edit displays it even when
                      it isn't one of the canned CUSTOMERS (calendar seed names). */}
                  {[...new Set([quickJobDraft.client, ...CUSTOMERS.map((c) => c.name)])].map((name) => (<option key={name} value={name}>{name}</option>))}
                </select>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] text-[#8899AA] mb-1" style={{ fontWeight: 700 }}>Service</span>
                  {quickJobDraft.editJobId != null && !quickJobDraft.editIdentity ? (
                  <div className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-[13px] bg-[#F9FAFB] text-[#1A2332] flex items-center truncate">{quickJobDraft.service}</div>
                  ) : (
                  <select
                    value={quickJobDraft.service}
                    onChange={(event) => setQuickJobDraft({ ...quickJobDraft, service: event.target.value })}
                    className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                  >
                    {[...new Set([quickJobDraft.service, ...jobTypes])].map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  )}
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
                {quickJobDraft.editJobId != null && !quickJobDraft.editIdentity ? (
                  <div className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-[13px] bg-[#F9FAFB] text-[#1A2332] flex items-center truncate">{quickJobDraft.address}</div>
                ) : (
                <select
                  value={quickJobDraft.address}
                  onChange={(event) => setQuickJobDraft({ ...quickJobDraft, address: event.target.value })}
                  className="w-full h-10 rounded-lg border border-[#D8DCE6] px-3 text-[13px] outline-none focus:border-[#4A6FA5] bg-white"
                >
                  {[...new Set([quickJobDraft.address, ...(CUSTOMERS.find((c) => c.name === quickJobDraft.client)?.locations ?? [])])].filter(Boolean).map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                )}
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
                {quickJobDraft.editJobId != null ? "Save changes" : "Add job"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full Create job modal (Figma) — opened from any board create action.
          Writes to jobsStore; the board re-renders from that subscription. */}
      {fullCreateDraft && (
        <CreateJob
          asModal
          prefill={fullCreateDraft}
          checkConflict={boardCheckConflict}
          onClose={() => setFullCreateDraft(null)}
          onCreated={() => setFullCreateDraft(null)}
        />
      )}

      {/* Edit an existing board job in the SAME full modal (edit mode) — opened
          from the Job-info drawer's Edit button. Persists via patchJob. */}
      {fullEditDraft && (
        <CreateJob
          asModal
          heading={`Edit job #${(fullEditDraft.job as DispatchJob).num ?? fullEditDraft.job.id}`}
          submitLabel="Save changes"
          prefill={{
            title: fullEditDraft.job.service,
            client: fullEditDraft.job.client,
            jobCategory: fullEditDraft.job.jobType,
            assignedTo: TEAM.find((t) => t.id === fullEditDraft.job.technicianId)?.name ?? "",
            address: fullEditDraft.job.address,
            startDate: fullEditDraft.job.unscheduled ? "" : fullEditDraft.dateStr,
            endDate: fullEditDraft.job.unscheduled ? "" : fullEditDraft.dateStr,
            startTime: fullEditDraft.job.unscheduled ? "" : hourToTimeStr(fullEditDraft.job.start),
            endTime: fullEditDraft.job.unscheduled ? "" : hourToTimeStr(fullEditDraft.job.end),
            scheduleJob: !fullEditDraft.job.unscheduled,
          }}
          onClose={() => setFullEditDraft(null)}
          onSubmit={(v: CreateJobValues) => {
            const id = fullEditDraft.job.id;
            const techId = TEAM.find((t) => t.name === v.assignedTo)?.id ?? "";
            const toHour = (s: string): number | undefined => {
              if (!s) return undefined;
              const [h, m] = s.split(":").map(Number);
              return h + (m || 0) / 60;
            };
            const patch: Parameters<typeof patchJob>[1] = {
              client: v.client,
              service: v.title || fullEditDraft.job.service,
              jobType: v.jobCategory || fullEditDraft.job.jobType,
              address: v.address,
              technicianId: techId,
            };
            if (v.scheduleJob) {
              patch.unscheduled = false;
              if (v.startDate) patch.date = new Date(`${v.startDate}T00:00:00`);
              const s = toHour(v.startTime); const e = toHour(v.endTime);
              if (s != null) patch.start = s;
              if (e != null) patch.end = e;
            } else {
              patch.unscheduled = true;
              patch.date = null;
            }
            patchJob(id, patch);
            setSelectedDayJob((j) => (j && j.id === id ? { ...j, ...patch } as DayJob : j));
            setSelectedDispatchJob((j) => (j && j.id === id ? { ...j, ...patch } as DispatchJob : j));
            setFullEditDraft(null);
          }}
        />
      )}

      {selectedEvent && <EventPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[#1A2332] text-white text-[13px] shadow-xl flex items-center gap-2" style={{ fontWeight: 500 }}>
          <span className="material-icons text-[#22C55E]" style={{ fontSize: "18px" }}>check_circle</span>
          {toast}
        </div>
      )}
        </div>{/* /main board column */}
        {unassignedPanelOpen && pendingPanel}
      </div>{/* /board + drawer row */}
    </div>
  );
}
