import { useEffect, useState } from "react";

// Click-through mockup of the technician mobile app, following the actual
// PRD work packages (R-003…R-010, "Mobile App for Aptora") and the Figma_Mobile
// screens — used from the Help Center's "Play as Technician" role sandbox.
// Illustrative only: no real data, no stores, no persistence beyond this
// session's local state.

type Screen = "home" | "history" | "filter" | "search" | "job" | "media" | "imageDesc" | "changesHistory" | "photos" | "files" | "equipment" | "assets";
type JobTab = "general" | "notes" | "report";
type Status = "none" | "enroute" | "working" | "done";
type FieldKind = "text" | "select3" | "computed";
interface RCField { label: string; value?: string; kind: FieldKind }

const jobs = [
  { name: "Randy Johnson", date: "Dec 1, 2025", badge: "Estimate", color: "#16A34A", addr: "5010 N Cortez Ave, Tampa, FL 33614", phone: "(813) 456-7890", range: "$79.00 - $3,509.00" },
  { name: "Brent Kenzie", date: "Dec 12, 2025", badge: "Maintenance", color: "#D97706", addr: "4407 Main St, Brandon, FL 33594", phone: "(727) 415-3481", range: "$929.00 - $1,109.00" },
  { name: "Joseph Lane", date: "Dec 23, 2025", badge: "Demand Service", color: "#4A6FA5", addr: "255 Standish Drive, Tampa, FL 33615", phone: "(352) 258-9710", range: "$428.00 - $18,525.00" },
];

// R-010.1 — Household analysis (7 parameters)
const householdFields: RCField[] = [
  { label: "Thermostat setting", value: "74F", kind: "text" },
  { label: "Average electric bill", value: "~$325", kind: "text" },
  { label: "House sq ft", value: "2100", kind: "text" },
  { label: "Room difficult to cool?", value: "Bedroom 1", kind: "text" },
  { label: "Health concerns", value: "Pick concerns", kind: "text" },
  { label: "Other concern 1", value: "Pick concerns", kind: "text" },
  { label: "Other concern 2", value: "Pick concerns", kind: "text" },
];
// R-010.1 — Comfort analysis (12 parameters)
const comfortFields: RCField[] = [
  { label: "Thermostat", kind: "select3" },
  { label: "Overall Condition", kind: "select3" },
  { label: "Filter Type", value: "Pleated", kind: "text" },
  { label: "Filter Location", value: "Hallway", kind: "text" },
  { label: "Filter size 1", value: "16 x 20 x 1", kind: "text" },
  { label: "Filter size 2", value: "—", kind: "text" },
  { label: "Filter Condition", kind: "select3" },
  { label: "Ductwork Condition", kind: "select3" },
  { label: "Ductwork Cleanliness", kind: "select3" },
  { label: "Attic Insulation", value: "R-30", kind: "text" },
  { label: "UV Location", value: "—", kind: "text" },
  { label: "UV Bulb", value: "—", kind: "text" },
];
// R-010.1 — System analysis (29 parameters) — first 11 rendered, rest summarised
const systemFields: RCField[] = [
  { label: "Type", value: "Furnace", kind: "text" },
  { label: "Brand", value: "Daikin — 2017", kind: "text" },
  { label: "Location", value: "Garage", kind: "text" },
  { label: "Static pressure", value: "0.00", kind: "computed" },
  { label: "Air Temp ΔT", value: "0.00", kind: "computed" },
  { label: "Blower Motor", kind: "select3" },
  { label: "Blower Wheel", kind: "select3" },
  { label: "Evap Coil Condition", kind: "select3" },
  { label: "Drain Pan", kind: "select3" },
  { label: "Compressor Cap µF", value: "35", kind: "text" },
  { label: "Fan Cap µF", value: "110%", kind: "computed" },
];
const systemFieldsMore = ["Drain Line Cleared", "Blower Compartment", "Frost Strip Test", "Safety Switches Test", "Igniter/Burner", "Compressor Amp RLA", "Fan Blade", "Fan Motor Condition", "Fan Amp RLA", "Electrical Connections", "Disconnect", "Defrost Cycle", "Refrig. Pressure Before", "Refrig. Pressure After", "Refrigerant Pressure", "Sequence of Operation Tested"];

const changes = [
  { date: "Oct 7, 2025, 9:39 AM", by: "Marek Stroz", diffs: [["The thermostat setting", "72F", "74F"], ["The average electric bill", "~$300", "~$325"]] },
  { date: "Oct 2, 2025, 7:45 PM", by: "Marek Stroz", diffs: [["The thermostat setting", "70F", "72F"], ["Wi-Fi capability", "No", "Yes"], ["Filter Type", "—", "Pleated"]] },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>
      <span>9:30</span>
      <div className="flex items-center gap-1">
        <span className="material-icons" style={{ fontSize: "13px" }}>signal_cellular_alt</span>
        <span className="material-icons" style={{ fontSize: "13px" }}>wifi</span>
        <span className="material-icons" style={{ fontSize: "13px" }}>battery_full</span>
      </div>
    </div>
  );
}

function BottomNav({ active, onNav }: { active: string; onNav: (s: Screen) => void }) {
  const items: { key: Screen; label: string; icon: string }[] = [
    { key: "home", label: "Home", icon: "home" },
    { key: "history", label: "History", icon: "history" },
    { key: "search" /* stand-in for Chat */, label: "Chat", icon: "chat_bubble_outline" },
    { key: "search" /* stand-in for Timesheet */, label: "Timesheet", icon: "schedule" },
    { key: "search" /* stand-in for More */, label: "More", icon: "more_horiz" },
  ];
  return (
    <div className="flex border-t border-[#E5E7EB] bg-white px-1 pb-2 pt-1.5">
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => {
            if (it.label === "Home" || it.label === "History") onNav(it.key);
            else window.alert(`"${it.label}" isn't wired up in this quick mockup.`);
          }}
          className="flex flex-1 flex-col items-center gap-0.5 py-1"
        >
          <span className="material-icons" style={{ fontSize: "18px", color: it.label.toLowerCase() === active ? "#4A6FA5" : "#9CA3AF" }}>{it.icon}</span>
          <span className="text-[9px]" style={{ color: it.label.toLowerCase() === active ? "#4A6FA5" : "#9CA3AF", fontWeight: it.label.toLowerCase() === active ? 600 : 500 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2.5">
      {onBack && (
        <button onClick={onBack} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
          <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>arrow_back</span>
        </button>
      )}
      <span className="flex-1 truncate text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</span>
      {right}
    </div>
  );
}

function Select3({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const opts = [["check", "check_circle", "#16A34A"], ["warning", "warning", "#D97706"], ["na", "remove_circle_outline", "#9CA3AF"]] as const;
  return (
    <div className="flex gap-1.5">
      {opts.map(([key, icon, color]) => (
        <button key={key} onClick={() => onChange(key)} className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: value === key ? color : "#E5E7EB", backgroundColor: value === key ? `${color}1A` : "white" }}>
          <span className="material-icons" style={{ fontSize: "14px", color: value === key ? color : "#C8D5E8" }}>{icon}</span>
        </button>
      ))}
    </div>
  );
}

function ReportCardFields({ fields, selections, onSelect }: { fields: RCField[]; selections: Record<string, string>; onSelect: (label: string, v: string) => void }) {
  return (
    <div className="space-y-2.5">
      {fields.map((f) => (
        <div key={f.label} className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-[#8899AA]">{f.label}</div>
          {f.kind === "select3" ? (
            <Select3 value={selections[f.label]} onChange={(v) => onSelect(f.label, v)} />
          ) : f.kind === "computed" ? (
            <span className="rounded bg-[#1A2332] px-2 py-0.5 text-[11px] text-white" style={{ fontWeight: 700 }}>{f.value}</span>
          ) : (
            <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>{f.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SignaturePad({ label, name }: { label: string; name?: string }) {
  const [signed, setSigned] = useState(false);
  return (
    <div>
      <div className="mb-1 text-[11px] text-[#8899AA]">{label}{name ? ` — ${name}` : ""}</div>
      <button
        onClick={() => setSigned(true)}
        className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-[#C8D5E8] bg-[#F9FAFB]"
      >
        {signed ? <span className="font-['cursive'] text-[22px] italic text-[#1A2332]">{name ?? "Signed"}</span> : <span className="text-[11px] text-[#9CA3AF]">Tap to sign</span>}
      </button>
    </div>
  );
}

export function TechnicianMobileDemo({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("history");
  const [jobTab, setJobTab] = useState<JobTab>("general");
  const [status, setStatus] = useState<Status>("none");
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [addPhotoMenuOpen, setAddPhotoMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [completedJobs, setCompletedJobs] = useState<string[]>([]);
  const [rcSelections, setRcSelections] = useState<Record<string, string>>({ "Overall Condition": "warning", "Filter Condition": "warning", "Blower Motor": "check", "Blower Wheel": "check", "Evap Coil Condition": "check", "Drain Pan": "check", "Ductwork Condition": "check", "Ductwork Cleanliness": "check", "Thermostat": "check" });

  useEffect(() => {
    if (status === "none" || status === "done") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const statusMeta: Record<Status, { label: string; color: string } | null> = {
    none: null,
    enroute: { label: "En route", color: "#D97706" },
    working: { label: "Working", color: "#4A6FA5" },
    done: { label: "Completed", color: "#16A34A" },
  };
  const goHistory = () => setScreen("history");
  const visibleJobs = jobs.filter((j) => !completedJobs.includes(j.name));

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center bg-[#1A2332]/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="mb-4 flex items-center gap-3 text-white">
        <span className="material-icons" style={{ fontSize: "20px" }}>smartphone</span>
        <span className="text-[14px]" style={{ fontWeight: 600 }}>Technician mobile app — interactive mockup</span>
        <button onClick={onClose} className="ml-4 rounded-md bg-white/15 px-3 py-1.5 text-[13px] text-white hover:bg-white/25" style={{ fontWeight: 600 }}>
          Exit demo
        </button>
      </div>

      <div className="w-[340px] shrink-0 overflow-hidden rounded-[36px] border-[6px] border-[#111827] bg-white shadow-2xl">
        <div className="flex h-[700px] flex-col">
          <StatusBar />

          {/* ---- Home (R-003.1 / R-003.2) ---- */}
          {screen === "home" && (
            <>
              <Header title="Overview" />
              <div className="flex-1 space-y-4 overflow-y-auto p-3">
                <div className="flex gap-1.5">
                  {["Week", "Month", "Quarter", "Year"].map((t) => (
                    <button key={t} onClick={() => t !== "Month" && window.alert("Quick filter — visual only in this mockup.")} className={`rounded-full px-2.5 py-1 text-[11px] ${t === "Month" ? "bg-[#4A6FA5] text-white" : "bg-[#F5F7FA] text-[#546478]"}`} style={{ fontWeight: 600 }}>{t}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[["Revenue", "$65.2K", "+12.1%", "#16A34A"], ["Estimates", "14 / 22.5%", "conversion", "#4A6FA5"], ["Avg / ticket", "$1.2K", "+3.2%", "#16A34A"], ["Closing %", "27%", "+4.5%", "#16A34A"]].map(([k, v, sub, color]) => (
                    <div key={k} className="rounded-lg border border-[#E5E7EB] p-2.5">
                      <div className="text-[10px] text-[#8899AA]">{k}</div>
                      <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{v}</div>
                      <div className="text-[10px]" style={{ color }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1.5 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Next job</div>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Randy Johnson</span>
                      <span className="text-[11px] text-[#8899AA]">Today, 9:09 AM</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#546478]">AC not cooling — 5010 N Cortez Ave</div>
                    <button onClick={() => { setScreen("job"); setJobTab("general"); }} className="mt-2 rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Details</button>
                  </div>
                </div>
              </div>
              <BottomNav active="home" onNav={setScreen} />
            </>
          )}

          {/* ---- History (R-005) ---- */}
          {screen === "history" && (
            <>
              <Header
                title="Jobs history"
                right={
                  <div className="flex items-center gap-1">
                    <button onClick={() => setScreen("filter")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>tune</span>
                    </button>
                    <button onClick={() => setScreen("search")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>search</span>
                    </button>
                  </div>
                }
              />
              <div className="flex gap-2 px-3 py-2">
                {["Today", "Week", "Month", "Quarter"].map((t, i) => (
                  <span key={t} className={`rounded-full px-3 py-1 text-[12px] ${i === 0 ? "bg-[#4A6FA5] text-white" : "bg-[#F5F7FA] text-[#546478]"}`} style={{ fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
                {visibleJobs.length === 0 && <div className="pt-10 text-center text-[12px] text-[#9CA3AF]">No active jobs — everything's completed 🎉</div>}
                {visibleJobs.map((j) => (
                  <div key={j.name} className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{j.name}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: j.color, fontWeight: 600 }}>{j.badge}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#8899AA]">{j.date}</div>
                    <div className="mt-1.5 text-[12px] text-[#546478]">{j.addr}</div>
                    <div className="text-[12px] text-[#546478]">{j.phone}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <button onClick={() => { setScreen("job"); setJobTab("general"); }} className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                        Job Details
                      </button>
                      <span className="text-[11px] text-[#8899AA]">Range: <span style={{ fontWeight: 700, color: "#1A2332" }}>{j.range}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Filter ---- */}
          {screen === "filter" && (
            <>
              <Header title="Filter" onBack={goHistory} right={<span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>Reset filters</span>} />
              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div>
                  <div className="mb-2 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Follow-ups</div>
                  <div className="flex items-center gap-2 text-[12px] text-[#546478]">
                    <span className="flex h-5 w-9 items-center rounded-full bg-[#4A6FA5] px-0.5"><span className="h-4 w-4 rounded-full bg-white" /></span>
                    Show only follow-ups
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                    <span>Price range</span><span className="text-[#8899AA]" style={{ fontWeight: 500 }}>$6,000–$15,000</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E5E7EB]"><div className="h-1.5 w-1/2 rounded-full bg-[#4A6FA5]" /></div>
                </div>
                <div>
                  <div className="mb-2 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Estimate status</div>
                  {["Pending", "Rejected", "Accepted"].map((s) => (
                    <label key={s} className="mb-1.5 flex items-center gap-2 text-[13px] text-[#546478]">
                      <input type="checkbox" className="h-4 w-4" /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Search ---- */}
          {screen === "search" && (
            <>
              <Header title="" onBack={goHistory} right={
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none" />
              } />
              <div className="flex-1 overflow-y-auto p-2">
                {["Julia Robinson", "Julia Stephens"].filter((n) => n.toLowerCase().includes(query.toLowerCase())).map((n) => (
                  <div key={n} className="flex items-center gap-2 rounded-lg px-2 py-2.5 hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                    <span className="text-[13px] text-[#1A2332]">{n}</span>
                  </div>
                ))}
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Job (R-009) ---- */}
          {screen === "job" && (
            <>
              <Header
                title="Job"
                onBack={goHistory}
                right={
                  status === "none" || status === "enroute" ? (
                    <div className="relative">
                      <button onClick={() => setStartMenuOpen((v) => !v)} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] text-white`} style={{ fontWeight: 700, backgroundColor: status === "enroute" ? "#D97706" : "#16A34A" }}>
                        {status === "enroute" ? (
                          <><span className="material-icons" style={{ fontSize: "14px" }}>timer</span> {mm}:{ss}</>
                        ) : (
                          <><span className="material-icons" style={{ fontSize: "14px" }}>play_arrow</span> Start</>
                        )}
                      </button>
                      {startMenuOpen && (
                        <div className="absolute right-0 top-9 z-10 w-44 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                          {status === "none" && (
                            <button onClick={() => { setStatus("enroute"); setElapsed(0); setStartMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">En route</button>
                          )}
                          {status === "enroute" && (
                            <button onClick={() => { setStatus("working"); setElapsed(0); setStartMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Clock in — Working</button>
                          )}
                          <button onClick={() => { setStartMenuOpen(false); setScreen("equipment"); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Equipment</button>
                          <button onClick={() => { setStartMenuOpen(false); setScreen("assets"); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Assets</button>
                          <button onClick={() => { setStatus("done"); setCompletedJobs((c) => [...c, "Randy Johnson"]); setStartMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]">Set to "Completed"</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] text-white" style={{ backgroundColor: statusMeta[status]!.color, fontWeight: 700 }}>
                      {status === "working" && <span className="material-icons" style={{ fontSize: "13px" }}>timer</span>}
                      {status === "working" ? `${mm}:${ss} · Working` : statusMeta[status]!.label}
                    </span>
                  )
                }
              />
              <div className="flex border-b border-[#E5E7EB] px-1 text-[11px]">
                {(["general", "notes", "report"] as JobTab[]).map((t) => (
                  <button key={t} onClick={() => setJobTab(t)} className="px-2.5 py-2" style={{ color: jobTab === t ? "#4A6FA5" : "#8899AA", fontWeight: jobTab === t ? 700 : 500, borderBottom: jobTab === t ? "2px solid #4A6FA5" : "2px solid transparent" }}>
                    {{ general: "General", notes: "Notes", report: "Report Card" }[t]}
                  </button>
                ))}
              </div>

              {status === "done" && jobTab === "general" && (
                <div className="mx-3 mt-2 rounded-md bg-[#F0FDF4] px-2.5 py-2 text-[11px] text-[#16A34A]">
                  Job completed — removed from your active Jobs History (per R-009.4).
                </div>
              )}

              {jobTab === "general" && (
                <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[12px]">
                  <Field label="Customer" value="Johnson, Randy (12 Jobs)" link />
                  <Field label="Contact" value="Soto, Elvin" link />
                  <Field label="Start Date & Time" value="Oct 7, 2025, 9:09 AM" />
                  <Field label="Brief Description" value="AC not cooling" />
                  <Field label="Type" value={<span className="rounded bg-[#16A34A] px-1.5 py-0.5 text-[10px] text-white" style={{ fontWeight: 700 }}>Estimate</span>} />
                  <Field label="Work Address" value="5010 N Cortez Ave, Tampa, FL 33614" link />
                  <div>
                    <div className="mb-1 text-[#8899AA]">Media</div>
                    <div className="flex gap-2">
                      <button onClick={() => setScreen("media")} className="relative h-12 w-12 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F5F7FA] text-center text-[10px] text-[#546478]">
                        📷<span className="absolute bottom-0 left-0 rounded-tr bg-[#4A6FA5] px-1 text-[8px] text-white" style={{ fontWeight: 700 }}>B</span>
                      </button>
                      <button onClick={() => setScreen("media")} className="relative h-12 w-12 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F5F7FA] text-center text-[10px] text-[#546478]">
                        📷<span className="absolute bottom-0 left-0 rounded-tr bg-[#16A34A] px-1 text-[8px] text-white" style={{ fontWeight: 700 }}>A</span>
                      </button>
                      <button onClick={() => setScreen("media")} className="relative flex h-12 w-12 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F5F7FA] text-[14px]">▶</button>
                      <div className="relative">
                        <button onClick={() => setAddPhotoMenuOpen((v) => !v)} className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-[#C8D5E8] text-[#4A6FA5]">
                          +
                        </button>
                        {addPhotoMenuOpen && (
                          <div className="absolute left-14 top-0 z-10 w-40 rounded-lg border border-[#E5E7EB] bg-white py-1 text-left shadow-lg">
                            {["Choose from gallery", "Use camera"].map((o) => (
                              <button key={o} onClick={() => { setAddPhotoMenuOpen(false); window.alert(`"${o}" — mock only, no camera in this demo.`); }} className="block w-full whitespace-nowrap px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">{o}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[#8899AA]">Items used</span>
                      <button onClick={() => window.alert("Item picker — mock only (no price shown to Technicians, unlike Field Sales).")} className="text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add item</button>
                    </div>
                    <div className="space-y-1 rounded-lg border border-[#E5E7EB] p-2">
                      <div className="flex justify-between text-[12px]"><span className="text-[#1A2332]">R-410A</span><span className="text-[#8899AA]">Qty: 2</span></div>
                      <div className="flex justify-between text-[12px]"><span className="text-[#1A2332]">Capacitors</span><span className="text-[#8899AA]">Qty: 1</span></div>
                    </div>
                  </div>
                  <button onClick={() => setScreen("files")} className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2">
                    <span className="flex items-center gap-2 text-[#546478]"><span className="material-icons" style={{ fontSize: "16px" }}>insert_drive_file</span>Files</span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>chevron_right</span>
                  </button>
                </div>
              )}

              {jobTab === "notes" && (
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <button onClick={() => setScreen("photos")} className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                    <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Photos (34)</span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>chevron_right</span>
                  </button>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Detailed description (2)</div>
                    <div className="mt-1 text-[12px] text-[#546478]">AC system stopped working last night. AC age unknown. Customer wants to buy a new one.</div>
                    <div className="mt-1 text-[10px] text-[#8899AA]">Oct 26, 2025, 9:11 AM • Sarah Thompson</div>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Technician's Notes (1)</div>
                    <div className="mt-1 text-[12px] text-[#546478]">Client was very pleasant during the service visit. Interested in a yearly maintenance plan.</div>
                    <button onClick={() => window.alert("Add note — mock only.")} className="mt-2 text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add technician's note</button>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Private Notes (1)</div>
                    <div className="mt-1 text-[12px] text-[#546478]">Client was very pleasant. Do not ring the doorbell.</div>
                  </div>
                </div>
              )}

              {jobTab === "report" && (
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <button onClick={() => setScreen("changesHistory")} className="flex w-full items-center justify-between text-left">
                    <span className="text-[11px] text-[#8899AA]">Latest change: <span className="text-[#4A6FA5]" style={{ fontWeight: 600 }}>Oct 7, 2025, 9:39 AM by Marek Stroz</span></span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>chevron_right</span>
                  </button>
                  {[
                    { title: "Household Analysis", count: 7, fields: householdFields },
                    { title: "Comfort Analysis", count: 12, fields: comfortFields },
                    { title: "System Analysis", count: 29, fields: systemFields, more: systemFieldsMore },
                  ].map((sec, i) => (
                    <div key={sec.title} className="rounded-lg border border-[#E5E7EB]">
                      <button onClick={() => setOpenSection(openSection === i ? null : i)} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
                        <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{sec.title} <span className="text-[#9CA3AF]" style={{ fontWeight: 500 }}>({sec.count})</span></span>
                        <span className="material-icons text-[#8899AA]" style={{ fontSize: "16px", transform: openSection === i ? "rotate(180deg)" : "none" }}>expand_more</span>
                      </button>
                      {openSection === i && (
                        <div className="space-y-2 border-t border-[#EDF0F5] px-3 py-2.5">
                          <ReportCardFields fields={sec.fields} selections={rcSelections} onSelect={(l, v) => setRcSelections((s) => ({ ...s, [l]: v }))} />
                          {sec.more && <div className="pt-1 text-[10px] italic text-[#9CA3AF]">+ {sec.more.length} more: {sec.more.join(", ")}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="mb-2 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Customer Section</div>
                    <div className="mb-2 text-[10px] leading-[1.5] text-[#8899AA]">Customer acknowledges the existing safety concerns noted by the technician and elects not to proceed with the recommended repairs at this time.</div>
                    <SignaturePad label="Customer signature" name="R. Johnson" />
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="mb-2 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Technician Section</div>
                    {["Other trades explained", "Home service plans explained"].map((t) => (
                      <div key={t} className="mb-1.5 flex items-center gap-2 text-[11px] text-[#546478]">
                        <span className="flex h-5 w-9 items-center rounded-full bg-[#4A6FA5] px-0.5"><span className="h-4 w-4 rounded-full bg-white" /></span>{t}
                      </div>
                    ))}
                    <div className="mt-2 rounded-md bg-[#F5F7FA] p-2 text-[11px] text-[#546478]">
                      Checked in after the recent pipe repair — client confirmed everything is working well with no further leaks.
                      <div className="mt-1 text-[9px] text-[#9CA3AF]">Dec 29, 2025, 2:30 PM · Jaime Reynolds</div>
                    </div>
                    <button onClick={() => window.alert("Add note — mock only.")} className="my-2 text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add your note</button>
                    <SignaturePad label="Tech signature" name="Marek Stroz" />
                  </div>
                </div>
              )}
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Equipment (R-009.4) ---- */}
          {screen === "equipment" && (
            <>
              <Header title="Equipment" onBack={() => setScreen("job")} />
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {[["AC Condenser", "Trane XR16 — installed 2018"], ["Furnace", "Daikin — installed 2017"]].map(([n, sub]) => (
                  <div key={n} className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{n}</div>
                    <div className="text-[11px] text-[#8899AA]">{sub}</div>
                  </div>
                ))}
                <button onClick={() => window.alert("Add equipment — mock only.")} className="w-full rounded-lg border border-dashed border-[#C8D5E8] py-2 text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add equipment</button>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Assets (R-009.4) ---- */}
          {screen === "assets" && (
            <>
              <Header title="Assets" onBack={() => setScreen("job")} />
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {[["Water Heater", "Rheem — 2020"], ["Thermostat", "Ecobee — Wi-Fi enabled"]].map(([n, sub]) => (
                  <div key={n} className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{n}</div>
                    <div className="text-[11px] text-[#8899AA]">{sub}</div>
                  </div>
                ))}
                <div className="rounded-md bg-[#F5F7FA] px-2.5 py-2 text-[10px] text-[#8899AA]">Read-only for Technicians — asset records are managed by Warehouse.</div>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Photos grid ---- */}
          {screen === "photos" && (
            <>
              <Header title="Photos" onBack={() => { setScreen("job"); setJobTab("notes"); }} />
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <button key={i} onClick={() => setScreen("media")} className="flex aspect-square items-center justify-center rounded bg-[#F5F7FA] text-[16px]">📷</button>
                  ))}
                </div>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Files ---- */}
          {screen === "files" && (
            <>
              <Header title="Files (2)" onBack={() => setScreen("job")} />
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {["file_scope_of_work.pdf", "file_permit_copy.pdf"].map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-2.5">
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>description</span>
                    <span className="flex-1 truncate text-[12px] text-[#1A2332]">{f}</span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>download</span>
                  </div>
                ))}
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Media viewer (R-009.2 / R-009.3) ---- */}
          {screen === "media" && (
            <>
              <Header title="Media" onBack={() => setScreen("job")} right={
                <div className="flex gap-1">
                  {[["draw", "Draw"], ["send", "Send in message"], ["download", "Download"], ["delete_outline", "Delete"]].map(([ic, label]) => (
                    <button key={ic} onClick={() => ic === "draw" ? setScreen("imageDesc") : window.alert(`"${label}" — mock only.`)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>{ic}</span>
                    </button>
                  ))}
                </div>
              } />
              <div className="flex flex-1 flex-col items-center justify-center bg-[#F5F7FA] p-4">
                <div className="flex h-52 w-52 items-center justify-center rounded-lg bg-[#E5E7EB] text-5xl">📷</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[#4A6FA5] px-1.5 py-0.5 text-[10px] text-white" style={{ fontWeight: 700 }}>After</span>
                  <span className="text-[12px] text-[#8899AA]">Image description goes here</span>
                </div>
                <div className="mt-1 text-[11px] text-[#9CA3AF]">1 / 2</div>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Image description ---- */}
          {screen === "imageDesc" && (
            <>
              <Header title="Image description" onBack={() => setScreen("media")} />
              <div className="flex-1 space-y-4 p-4">
                <div>
                  <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Image type</div>
                  <div className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#1A2332]">After</div>
                </div>
                <div>
                  <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Image description</div>
                  <div className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#8899AA]">Image description goes here</div>
                </div>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Changes history (R-010.2) ---- */}
          {screen === "changesHistory" && (
            <>
              <Header title="Changes history" onBack={() => setScreen("job")} />
              <div className="flex-1 space-y-4 overflow-y-auto p-3">
                {changes.map((c) => (
                  <div key={c.date}>
                    <div className="text-[11px] text-[#8899AA]">{c.date} by {c.by}</div>
                    <div className="mt-1 space-y-1.5 rounded-lg border border-[#E5E7EB] p-2.5">
                      {c.diffs.map(([label, from, to]) => (
                        <div key={label} className="text-[12px]">
                          <div className="text-[#8899AA]">{label}</div>
                          <div><span className="text-[#DC2626] line-through">{from}</span> <span className="text-[#9CA3AF]">→</span> <span className="text-[#16A34A]" style={{ fontWeight: 600 }}>{to}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}
        </div>
      </div>
      <div className="mt-4 max-w-[340px] text-center text-[11px] text-white/60">
        Click-through mockup built from the actual PRD work packages (R-003–R-010) — statuses, Report Card field counts, media & changes history match spec; pricing/estimate tabs are intentionally hidden (Field Salesperson scope, not Technician).
      </div>
    </div>
  );
}

function Field({ label, value, link }: { label: string; value: React.ReactNode; link?: boolean }) {
  return (
    <div>
      <div className="text-[#8899AA]">{label}</div>
      <div className={link ? "text-[#4A6FA5]" : "text-[#1A2332]"} style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
