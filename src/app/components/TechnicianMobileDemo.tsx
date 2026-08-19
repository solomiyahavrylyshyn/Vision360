import { useEffect, useState } from "react";

// Click-through mockup of the technician mobile app, following the actual
// PRD work packages (R-003…R-010, "Mobile App for Aptora") and the Figma_Mobile
// screens — used from the Help Center's "Play as Technician" role sandbox.
// Illustrative only: no real data, no stores, no persistence beyond this
// session's local state.

type Screen = "home" | "history" | "filter" | "search" | "job" | "media" | "imageDesc" | "changesHistory" | "photos" | "files" | "equipment" | "assets"
  | "estimateAddOption" | "estimateAddItem" | "estimateAddCustomItem" | "estimateCustomerView";
type JobTab = "general" | "notes" | "report" | "estimate";
type Status = "none" | "enroute" | "working" | "done";
type FieldKind = "text" | "select3" | "computed";
interface RCField { label: string; value?: string; kind: FieldKind }

// R-007 — Estimate (options-based)
interface EstItem { name: string; description: string; price: number; warranty: string; category: string }
interface OptionItem extends EstItem { qty: number }
interface EstOption { id: number; name: string; pricingType: "Monthly payment + Total" | "Total Only" | "Monthly Only"; notesOn: boolean; notes: string; items: OptionItem[]; adjustPct: number }
type EstStatus = "draft" | "inReview" | "readyToPresent" | "approved";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PLAN = { label: "Ally - 7.99% / 1.29%", factor: "1.29%", monthlyRate: 0.046, interest: "9.9%", apr: "7.99%", terms: "12 months" };

const ESTIMATE_CATALOG: Record<string, EstItem[]> = {
  Repairs: [
    { name: "AC Tune-Up", description: "Routine inspection and cleaning of air conditioning system", price: 129, warranty: "5 years", category: "Repairs" },
    { name: "Air Handler Replacement", description: "Replace indoor air handler unit including labor", price: 2800, warranty: "5 years", category: "Repairs" },
    { name: "Attic Insulation Top-Up", description: "Add insulation to attic to improve efficiency", price: 1800, warranty: "5 years", category: "Repairs" },
    { name: "Blower Motor Repair", description: "Diagnose and repair blower motor malfunction", price: 350, warranty: "5 years", category: "Repairs" },
    { name: "Capacitor Replacement", description: "Replace faulty run/start capacitor in AC system", price: 180, warranty: "5 years", category: "Repairs" },
    { name: "Condenser Coil Cleaning", description: "Deep clean outdoor condenser coils for optimal performance", price: 250, warranty: "5 years", category: "Repairs" },
    { name: "Drain Pan Replacement", description: "Replace rusted or leaking condensate drain pan", price: 260, warranty: "5 years", category: "Repairs" },
    { name: "Duct Cleaning", description: "Clean air ducts to improve air quality and efficiency", price: 450, warranty: "5 years", category: "Repairs" },
    { name: "Emergency HVAC Call", description: "24/7 emergency service visit fee", price: 150, warranty: "5 years", category: "Repairs" },
    { name: "HVAC Filter Replacement", description: "Replace standard air filter", price: 40, warranty: "5 years", category: "Repairs" },
    { name: "HVAC System Installation", description: "Install complete HVAC system in residential property", price: 8900, warranty: "5 years", category: "Repairs" },
    { name: "HVAC Zoning Setup", description: "Install zoning dampers and controls for multi-zone climate", price: 3500, warranty: "5 years", category: "Repairs" },
    { name: "Mini-Split System Install", description: "Install ductless mini-split system for room or zone", price: 4200, warranty: "5 years", category: "Repairs" },
    { name: "Refrigerant Recharge", description: "Refill refrigerant and check for leaks", price: 350, warranty: "5 years", category: "Repairs" },
    { name: "Thermostat Calibration", description: "Adjust and calibrate thermostat for accurate temperature control", price: 90, warranty: "5 years", category: "Repairs" },
    { name: "Thermostat Replacement", description: "Replace existing thermostat with programmable or smart unit", price: 220, warranty: "5 years", category: "Repairs" },
  ],
  Equipment: [
    { name: "Condenser Unit", description: "Replace outdoor condenser unit", price: 2600, warranty: "10 years", category: "Equipment" },
    { name: "Air Handler Unit", description: "New indoor air handler unit", price: 2100, warranty: "10 years", category: "Equipment" },
    { name: "Package Unit", description: "Residential package unit", price: 5200, warranty: "10 years", category: "Equipment" },
  ],
  Ductwork: [
    { name: "Duct Replacement", description: "Replace damaged ductwork section", price: 600, warranty: "5 years", category: "Ductwork" },
    { name: "Duct Sealing", description: "Seal duct leaks throughout system", price: 349, warranty: "5 years", category: "Ductwork" },
    { name: "Flex Duct Install", description: "Install flexible ductwork run", price: 220, warranty: "5 years", category: "Ductwork" },
  ],
  IAQ: [
    { name: "UV Light Install", description: "Install UV germicidal light", price: 399, warranty: "5 years", category: "IAQ" },
    { name: "Air Purifier Install", description: "Install electronic air purifier", price: 549, warranty: "5 years", category: "IAQ" },
    { name: "Humidifier Install", description: "Whole-home humidifier installation", price: 699, warranty: "5 years", category: "IAQ" },
  ],
  Others: [
    { name: "Custom Consultation", description: "On-site consultation and assessment", price: 0, warranty: "—", category: "Others" },
    { name: "Miscellaneous Charge", description: "Miscellaneous service charge", price: 0, warranty: "—", category: "Others" },
  ],
};

const optionTotal = (o: EstOption) => o.items.reduce((s, it) => s + it.price * it.qty, 0) * (1 + o.adjustPct / 100);
const optionMonthly = (o: EstOption) => optionTotal(o) * PLAN.monthlyRate;
const nextOptionName = (n: number) => `Option ${String.fromCharCode(65 + n)}`;

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

function SignaturePad({ label, name, presigned }: { label: string; name?: string; presigned?: boolean }) {
  const [signed, setSigned] = useState(!!presigned);
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

  // Estimate (R-007)
  const [estOptions, setEstOptions] = useState<EstOption[]>([]);
  const [estStatus, setEstStatus] = useState<EstStatus>("draft");
  const [estDraft, setEstDraft] = useState<EstOption | null>(null);
  const [estItemCategory, setEstItemCategory] = useState("Repairs");
  const [estItemQuery, setEstItemQuery] = useState("");
  const [estDownPayment, setEstDownPayment] = useState(false);
  const [estDownAmount, setEstDownAmount] = useState("");
  const [estMenuOpenId, setEstMenuOpenId] = useState<number | null>(null);
  const [estShowAlt, setEstShowAlt] = useState<Record<number, boolean>>({});
  const [estApprovedId, setEstApprovedId] = useState<number | null>(null);
  const [estCustomerChoice, setEstCustomerChoice] = useState<string>("");
  const [estFollowUpDate, setEstFollowUpDate] = useState("Oct 7, 2025");

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
                {(["general", "notes", "report", "estimate"] as JobTab[]).map((t) => (
                  <button key={t} onClick={() => setJobTab(t)} className="px-2.5 py-2" style={{ color: jobTab === t ? "#4A6FA5" : "#8899AA", fontWeight: jobTab === t ? 700 : 500, borderBottom: jobTab === t ? "2px solid #4A6FA5" : "2px solid transparent" }}>
                    {{ general: "General", notes: "Notes", report: "Report Card", estimate: "Estimate" }[t]}
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
                      <button onClick={() => window.alert("Item picker — mock only.")} className="text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add item</button>
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

              {/* ---- Estimate (R-007) ---- */}
              {jobTab === "estimate" && (
                <div className="flex-1 overflow-y-auto p-3">
                  {estOptions.length === 0 ? (
                    <div className="flex flex-col items-center pt-16 text-center">
                      <div className="mb-1 text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>No estimate yet!</div>
                      <div className="mb-5 text-[12px] text-[#8899AA]">Start by adding a new Option.<br />You can create up to 6 options.</div>
                      <button
                        onClick={() => { setEstDraft({ id: Date.now(), name: nextOptionName(0), pricingType: "Monthly payment + Total", notesOn: false, notes: "", items: [], adjustPct: 0 }); setScreen("estimateAddOption"); }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A6FA5] py-3 text-[13px] text-white"
                        style={{ fontWeight: 700 }}
                      >
                        <span className="material-icons" style={{ fontSize: "16px" }}>add</span>Add new option
                      </button>
                    </div>
                  ) : estStatus === "approved" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded px-2 py-1 text-[10px] text-white" style={{ backgroundColor: "#16A34A", fontWeight: 700 }}>Approved</span>
                        <span className="text-[10px] text-[#8899AA]">Oct 7, 2025, 9:09 AM</span>
                      </div>
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Approved option</div>
                      {estOptions.filter((o) => o.id === estApprovedId).map((o) => (
                        <div key={o.id} className="rounded-lg border border-[#E5E7EB] p-3">
                          <div className="mb-1.5 rounded bg-[#F0FDF4] px-2 py-1 text-center text-[10px] text-[#16A34A]" style={{ fontWeight: 700 }}>✓ Approved (Oct 7, 2025, 9:09 AM)</div>
                          <div className="mb-1 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{o.name}</div>
                          {o.items.map((it) => <div key={it.name} className="text-[12px] text-[#546478]">{it.qty} × {it.name}</div>)}
                          <div className="mt-2 rounded-md bg-[#EBF0F8] px-2.5 py-1.5 text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{money(optionTotal(o))}</div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-[#E5E7EB] p-3">
                        <SignaturePad label="Customer signature" name="Johnson" presigned />
                      </div>
                      <button onClick={() => setOpenSection(openSection === -1 ? null : -1)} className="flex w-full items-center justify-between text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                        Rejected options <span className="material-icons" style={{ fontSize: "16px", transform: openSection === -1 ? "rotate(180deg)" : "none" }}>expand_more</span>
                      </button>
                      {openSection === -1 && (
                        <div className="space-y-1.5">
                          {estOptions.filter((o) => o.id !== estApprovedId).map((o) => (
                            <div key={o.id} className="rounded-md bg-[#F5F7FA] px-2.5 py-1.5 text-[11px] text-[#8899AA]">{o.name} — {money(optionTotal(o))}</div>
                          ))}
                        </div>
                      )}
                      <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Plan selected</div>
                      <div className="text-[11px] text-[#546478]">{PLAN.label}<br />Monthly factor: {PLAN.factor} · Interest rate: {PLAN.interest} · APR: {PLAN.apr} · Terms: {PLAN.terms}</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded px-2 py-1 text-[10px] text-white" style={{ backgroundColor: { draft: "#8899AA", inReview: "#D97706", readyToPresent: "#4A6FA5" }[estStatus], fontWeight: 700 }}>
                          {{ draft: "Draft", inReview: "In review", readyToPresent: "Ready to present" }[estStatus]}
                        </span>
                        <span className="text-[10px] text-[#8899AA]">Autosaved 2 min ago</span>
                        <button onClick={() => setScreen("estimateCustomerView")} className="flex items-center gap-1 text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>
                          <span className="material-icons" style={{ fontSize: "14px" }}>visibility</span>Preview
                        </button>
                      </div>
                      {estStatus === "inReview" && (
                        <div className="flex gap-2 rounded-md bg-[#FEF3C7] p-2.5 text-[11px] text-[#92400E]">
                          <span className="material-icons" style={{ fontSize: "16px" }}>warning</span>
                          This estimate is currently being reviewed by your manager. You will be notified when it is ready to be presented to the customer or if any changes are required.
                        </div>
                      )}
                      {estStatus === "readyToPresent" && (
                        <div className="flex gap-2 rounded-md bg-[#F0FDF4] p-2.5 text-[11px] text-[#16A34A]">
                          <span className="material-icons" style={{ fontSize: "16px" }}>check_circle</span>
                          This estimate has been approved by the manager and is ready to be shown to the customer.
                        </div>
                      )}
                      <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Options list</div>
                      {estOptions.map((o) => (
                        <div key={o.id} className="rounded-lg border border-[#E5E7EB]">
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{o.name}</span>
                            <div className="relative">
                              <button onClick={() => setEstMenuOpenId(estMenuOpenId === o.id ? null : o.id)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                                <span className="material-icons text-[#8899AA]" style={{ fontSize: "16px" }}>more_vert</span>
                              </button>
                              {estMenuOpenId === o.id && (
                                <div className="absolute right-0 top-7 z-10 w-36 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                                  <button onClick={() => { setEstDraft(o); setEstMenuOpenId(null); setScreen("estimateAddOption"); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Edit</button>
                                  <button onClick={() => { setEstOptions((os) => [...os, { ...o, id: Date.now(), name: nextOptionName(os.length) }]); setEstMenuOpenId(null); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Duplicate</button>
                                  <button onClick={() => { setEstOptions((os) => os.map((x) => x.id === o.id ? { ...x, notesOn: !x.notesOn } : x)); setEstMenuOpenId(null); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">Show/hide note</button>
                                  <button onClick={() => { setEstOptions((os) => os.filter((x) => x.id !== o.id)); setEstMenuOpenId(null); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]">Delete option</button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-0.5 px-3 pb-2 text-[12px] text-[#546478]">
                            {o.items.map((it) => <div key={it.name}>{it.qty} × {it.name}</div>)}
                          </div>
                          {(() => {
                            const showMonthly = o.pricingType === "Monthly Only" || (o.pricingType === "Monthly payment + Total" && !estShowAlt[o.id]);
                            const canToggle = o.pricingType === "Monthly payment + Total";
                            return (
                              <button
                                disabled={!canToggle}
                                onClick={() => setEstShowAlt((s) => ({ ...s, [o.id]: !s[o.id] }))}
                                className="flex w-full items-center justify-between bg-[#EBF0F8] px-3 py-2 text-left"
                              >
                                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{showMonthly ? `${money(optionMonthly(o))}/month` : money(optionTotal(o))}</span>
                                {canToggle && <span className="text-[10px] text-[#4A6FA5]">Tap for {showMonthly ? "total" : "monthly"}</span>}
                              </button>
                            );
                          })()}
                          {o.notesOn && o.notes && (
                            <div className="flex gap-1.5 border-t border-[#EDF0F5] px-3 py-2 text-[10px] text-[#8899AA]">
                              <span className="material-icons" style={{ fontSize: "13px" }}>description</span>{o.notes}
                            </div>
                          )}
                        </div>
                      ))}
                      {estOptions.length < 6 && (
                        <button
                          onClick={() => { setEstDraft({ id: Date.now(), name: nextOptionName(estOptions.length), pricingType: "Monthly payment + Total", notesOn: false, notes: "", items: [], adjustPct: 0 }); setScreen("estimateAddOption"); }}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A6FA5] py-2.5 text-[13px] text-white"
                          style={{ fontWeight: 700 }}
                        >
                          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>Add new option
                        </button>
                      )}

                      <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Plan selection</div>
                      <div className="rounded-lg border border-[#E5E7EB] p-2.5">
                        <div className="mb-0.5 text-[10px] text-[#8899AA]">Pick a plan</div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{PLAN.label}</div>
                      </div>
                      <div className="text-[10px] text-[#8899AA]">Monthly factor: {PLAN.factor} • Interest rate: {PLAN.interest} • APR: {PLAN.apr} • Terms: {PLAN.terms}</div>
                      <label className="flex items-center gap-2 text-[12px] text-[#546478]">
                        <span className="flex h-5 w-9 items-center rounded-full px-0.5" style={{ backgroundColor: estDownPayment ? "#4A6FA5" : "#D1D5DB" }} onClick={() => setEstDownPayment((v) => !v)}>
                          <span className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: estDownPayment ? "translateX(16px)" : "none" }} />
                        </span>
                        Add down payment
                      </label>
                      {estDownPayment && (
                        <input value={estDownAmount} onChange={(e) => setEstDownAmount(e.target.value)} placeholder="Down payment amount" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                      )}
                      <div className="flex items-center justify-between text-[11px] text-[#8899AA]">
                        <span>Options: {estOptions.length}/6</span>
                        <span>Price range: {money(Math.min(...estOptions.map(optionTotal)))} - {money(Math.max(...estOptions.map(optionTotal)))}</span>
                      </div>
                      {estStatus === "draft" && (
                        <button onClick={() => setEstStatus("inReview")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#16A34A] py-3 text-[13px] text-white" style={{ fontWeight: 700 }}>
                          <span className="material-icons" style={{ fontSize: "16px" }}>send</span>Send to review
                        </button>
                      )}
                      {estStatus === "inReview" && (
                        <button onClick={() => setEstStatus("readyToPresent")} className="w-full py-1 text-center text-[11px] text-[#4A6FA5] underline">Simulate manager approval (demo)</button>
                      )}
                      {estStatus === "readyToPresent" && (
                        <button onClick={() => setScreen("estimateCustomerView")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#16A34A] py-3 text-[13px] text-white" style={{ fontWeight: 700 }}>
                          <span className="material-icons" style={{ fontSize: "16px" }}>visibility</span>Present to customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Add new option (R-007.3) ---- */}
          {screen === "estimateAddOption" && estDraft && (
            <>
              <Header
                title="Add new option"
                onBack={() => { setEstDraft(null); setScreen("job"); setJobTab("estimate"); }}
                right={
                  <button
                    onClick={() => {
                      setEstOptions((os) => {
                        const exists = os.some((o) => o.id === estDraft.id);
                        return exists ? os.map((o) => (o.id === estDraft.id ? estDraft : o)) : [...os, estDraft];
                      });
                      setEstDraft(null);
                      setScreen("job");
                      setJobTab("estimate");
                    }}
                    className="rounded-md bg-[#4A6FA5] px-3 py-1.5 text-[12px] text-white"
                    style={{ fontWeight: 700 }}
                  >
                    Save
                  </button>
                }
              />
              <div className="flex-1 space-y-4 overflow-y-auto p-3">
                <div>
                  <div className="mb-1 text-[10px] text-[#8899AA]">Option name</div>
                  <input value={estDraft.name} onChange={(e) => setEstDraft({ ...estDraft, name: e.target.value })} className="w-full border-b border-[#1A2332] px-1 py-1.5 text-[14px] text-[#1A2332] outline-none" />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-[#8899AA]">Pricing preview type</div>
                  <select value={estDraft.pricingType} onChange={(e) => setEstDraft({ ...estDraft, pricingType: e.target.value as EstOption["pricingType"] })} className="w-full border-b border-[#E5E7EB] px-1 py-1.5 text-[13px] text-[#1A2332] outline-none">
                    <option>Monthly payment + Total</option>
                    <option>Total Only</option>
                    <option>Monthly Only</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-[12px] text-[#546478]">
                  <span className="flex h-5 w-9 items-center rounded-full px-0.5" style={{ backgroundColor: estDraft.notesOn ? "#4A6FA5" : "#D1D5DB" }} onClick={() => setEstDraft({ ...estDraft, notesOn: !estDraft.notesOn })}>
                    <span className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: estDraft.notesOn ? "translateX(16px)" : "none" }} />
                  </span>
                  Add extra notes
                </label>
                {estDraft.notesOn && (
                  <textarea value={estDraft.notes} onChange={(e) => setEstDraft({ ...estDraft, notes: e.target.value })} placeholder="Write your note here" className="h-16 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[12px] outline-none" />
                )}

                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Option items</div>
                {estDraft.items.length === 0 ? (
                  <div className="text-[12px] text-[#8899AA]">There is no items added yet. Click on the button below to add a new item to the list.</div>
                ) : (
                  <div className="space-y-2">
                    {estDraft.items.map((it) => (
                      <div key={it.name} className="rounded-lg border border-[#E5E7EB] p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>{it.qty} × {it.name}</div>
                            <div className="text-[10px] text-[#8899AA]">{it.description}</div>
                            <div className="text-[10px] text-[#8899AA]">Warranty: {it.warranty}</div>
                          </div>
                          <button onClick={() => setEstDraft({ ...estDraft, items: estDraft.items.filter((x) => x.name !== it.name) })} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FEF2F2] text-[#DC2626]">
                            <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                          </button>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEstDraft({ ...estDraft, items: estDraft.items.map((x) => x.name === it.name ? { ...x, qty: Math.max(1, x.qty - 1) } : x) })} className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB]">−</button>
                            <span className="w-5 text-center text-[12px]">{it.qty}</span>
                            <button onClick={() => setEstDraft({ ...estDraft, items: estDraft.items.map((x) => x.name === it.name ? { ...x, qty: x.qty + 1 } : x) })} className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB]">+</button>
                          </div>
                          <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Subtotal: {money(it.price * it.qty)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setScreen("estimateAddItem")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A6FA5] py-2.5 text-[13px] text-white" style={{ fontWeight: 700 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>add</span>Add new items
                </button>

                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Summary</div>
                <div className="flex justify-between text-[12px]"><span className="text-[#546478]"># of items:</span><span style={{ fontWeight: 700 }}>{estDraft.items.length}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-[#546478]">Monthly payment:</span><span style={{ fontWeight: 700 }}>{money(optionMonthly(estDraft))}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-[#546478]">Total:</span><span style={{ fontWeight: 700 }}>{money(optionTotal(estDraft))}</span></div>
                <label className="flex items-center gap-2 text-[12px] text-[#546478]">
                  <span className="flex h-5 w-9 items-center rounded-full px-0.5" style={{ backgroundColor: estDraft.adjustPct !== 0 ? "#4A6FA5" : "#D1D5DB" }} onClick={() => setEstDraft({ ...estDraft, adjustPct: estDraft.adjustPct !== 0 ? 0 : 1 })}>
                    <span className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: estDraft.adjustPct !== 0 ? "translateX(16px)" : "none" }} />
                  </span>
                  Adjust the price
                </label>
                {estDraft.adjustPct !== 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] text-[#8899AA]">Price adjustments</div>
                    <input type="range" min={-20} max={20} value={estDraft.adjustPct} onChange={(e) => setEstDraft({ ...estDraft, adjustPct: Number(e.target.value) })} className="w-full" />
                    <div className="flex justify-between text-[10px] text-[#8899AA]"><span>-20%</span><span>{estDraft.adjustPct > 0 ? "+" : ""}{estDraft.adjustPct}%</span><span>+20%</span></div>
                  </div>
                )}
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Add new item (R-006.1) ---- */}
          {screen === "estimateAddItem" && estDraft && (
            <>
              <Header title="Add new item" onBack={() => setScreen("estimateAddOption")} />
              <div className="border-b border-[#E5E7EB] p-3">
                <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2">
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                  <input value={estItemQuery} onChange={(e) => setEstItemQuery(e.target.value)} placeholder="Search for item" className="w-full text-[13px] outline-none" />
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto border-b border-[#E5E7EB] px-3 text-[12px]">
                {Object.keys(ESTIMATE_CATALOG).map((cat) => (
                  <button key={cat} onClick={() => setEstItemCategory(cat)} className="whitespace-nowrap py-2" style={{ color: estItemCategory === cat ? "#4A6FA5" : "#8899AA", fontWeight: estItemCategory === cat ? 700 : 500, borderBottom: estItemCategory === cat ? "2px solid #4A6FA5" : "2px solid transparent" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {ESTIMATE_CATALOG[estItemCategory].filter((it) => it.name.toLowerCase().includes(estItemQuery.toLowerCase())).map((it) => {
                  const added = estDraft.items.some((x) => x.name === it.name);
                  return (
                    <div key={it.name} className="flex items-start justify-between gap-2 rounded-lg border border-[#E5E7EB] p-2.5">
                      <div className="min-w-0">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{it.name}</div>
                        <div className="text-[10px] text-[#8899AA]">{it.description}</div>
                        <div className="text-[10px] text-[#8899AA]">Warranty: {it.warranty}</div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{money(it.price)}</span>
                        <button
                          onClick={() => setEstDraft({
                            ...estDraft,
                            items: added ? estDraft.items.filter((x) => x.name !== it.name) : [...estDraft.items, { ...it, qty: 1 }],
                          })}
                          className="rounded-md px-2.5 py-1 text-[11px] text-white"
                          style={{ backgroundColor: added ? "#16A34A" : "#4A6FA5", fontWeight: 700 }}
                        >
                          {added ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setScreen("estimateAddCustomItem")} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] py-2.5 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>add</span>Add custom item
                </button>
              </div>
              <BottomNav active="history" onNav={setScreen} />
            </>
          )}

          {/* ---- Add custom item (R-006.2) ---- */}
          {screen === "estimateAddCustomItem" && estDraft && (
            <EstimateCustomItemForm
              onBack={() => setScreen("estimateAddItem")}
              onSave={(item) => { setEstDraft({ ...estDraft, items: [...estDraft.items, item] }); setScreen("estimateAddItem"); }}
              onNav={setScreen}
            />
          )}

          {/* ---- Customer options — signing view (R-007.5) ---- */}
          {screen === "estimateCustomerView" && (
            <>
              <Header title="Customer options" onBack={() => setScreen("job")} right={
                <button onClick={() => window.alert("Send by email / SMS / Print — mock only.")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                  <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>more_vert</span>
                </button>
              } />
              <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[12px]">
                <Field label="Customer" value="Johnson, Randy" />
                <Field label="Address" value="5010 N Cortez Ave, Tampa, FL 33614" />
                <Field label="Number of options" value={String(estOptions.length)} />
                <Field label="Price range" value={`${money(Math.min(...estOptions.map(optionTotal)))} - ${money(Math.max(...estOptions.map(optionTotal)))}`} />
                <div>
                  <div className="text-[#8899AA]">Plan selection</div>
                  <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>{PLAN.label}</div>
                  <div className="text-[10px] text-[#8899AA]">Monthly factor: {PLAN.factor} • Interest rate: {PLAN.interest} • APR: {PLAN.apr} • Terms: {PLAN.terms}</div>
                </div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Options list</div>
                {estOptions.map((o) => (
                  <div key={o.id} className={`rounded-lg border p-2.5 ${estCustomerChoice === String(o.id) ? "border-[#4A6FA5] bg-[#EBF0F8]" : "border-[#E5E7EB]"}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{o.name}</span>
                    </div>
                    {o.items.map((it) => <div key={it.name} className="text-[11px] text-[#546478]">{it.qty} × {it.name}</div>)}
                    <div className="mt-1.5 rounded-md bg-[#F5F7FA] px-2 py-1 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{money(optionTotal(o))}</div>
                  </div>
                ))}

                <div>
                  <div className="mb-1 text-[10px] text-[#8899AA]">Select option</div>
                  <select value={estCustomerChoice} onChange={(e) => setEstCustomerChoice(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none">
                    <option value="">Select option</option>
                    {estOptions.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                    <option value="pending">Pending — customer hasn't decided</option>
                  </select>
                </div>

                {estCustomerChoice === "pending" ? (
                  <>
                    <div>
                      <div className="mb-1 text-[10px] text-[#8899AA]">Follow-up date</div>
                      <input value={estFollowUpDate} onChange={(e) => setEstFollowUpDate(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                    </div>
                    <button onClick={() => { setScreen("job"); setJobTab("estimate"); }} className="w-full rounded-lg bg-[#4A6FA5] py-3 text-[13px] text-white" style={{ fontWeight: 700 }}>Complete estimate</button>
                  </>
                ) : estCustomerChoice ? (
                  <>
                    <label className="flex items-center gap-2 text-[12px] text-[#546478]">
                      <span className="flex h-5 w-9 items-center rounded-full bg-[#4A6FA5] px-0.5"><span className="h-4 w-4 rounded-full bg-white" /></span>
                      Add special notes
                    </label>
                    <textarea placeholder="Write additional special notes" className="h-16 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[12px] outline-none" />
                    <div className="rounded-lg border border-[#E5E7EB] p-2.5">
                      <SignaturePad label="Customer signature" name="Johnson" />
                    </div>
                    <button
                      onClick={() => {
                        setEstApprovedId(Number(estCustomerChoice));
                        setEstStatus("approved");
                        setScreen("job");
                        setJobTab("estimate");
                      }}
                      className="w-full rounded-lg bg-[#4A6FA5] py-3 text-[13px] text-white"
                      style={{ fontWeight: 700 }}
                    >
                      I confirm and order
                    </button>
                  </>
                ) : null}
              </div>
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
        Click-through mockup built from the actual PRD work packages (R-003–R-010) — statuses, Report Card field counts, options-based Estimate, media & changes history all match spec.
      </div>
    </div>
  );
}

// R-006.2 — custom estimate line item. Per PRD assumption #4, custom items are
// stored separately with no sync to the Aptora catalog — kept local to the
// option being edited, not written back to the shared item catalog.
function EstimateCustomItemForm({ onBack, onSave, onNav }: { onBack: () => void; onSave: (item: OptionItem) => void; onNav: (s: Screen) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [warranty, setWarranty] = useState("");
  return (
    <>
      <Header
        title="Add custom item"
        onBack={onBack}
        right={
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), description, price: Number(price) || 0, qty: Number(qty) || 1, warranty: warranty ? `${warranty} years` : "—", category: "Custom" });
            }}
            className="rounded-md bg-[#4A6FA5] px-3 py-1.5 text-[12px] text-white"
            style={{ fontWeight: 700 }}
          >
            Save
          </button>
        }
      />
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="text-[12px] text-[#546478]">You can add a custom service item by filling up the form below. Custom items aren't synced back to the shared catalog.</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Item description" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Unit price" inputMode="decimal" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none" />
        <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Default quantity" inputMode="numeric" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none" />
        <input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="Warranty (in years)" inputMode="numeric" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none" />
      </div>
      <BottomNav active="history" onNav={onNav} />
    </>
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
