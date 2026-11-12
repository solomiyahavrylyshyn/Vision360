// Settings → Report Cards — the Report Card designer, first version (W-14, M5).
//
// What the first version does (Marek 02.11.2026 + 05.11.2026, epic M5):
// - the company starts with the ready cards for its trades (AC, plumbing,
//   electrical) and changes them here — no blank-page start required;
// - a card is sections of numbered fields; a field has one or more inputs
//   (rating, dropdown from a value list, checkbox, number with unit, text,
//   date, notes, calculated, signature, fixed text), an optional photo slot,
//   an optional "visible when", and "must be filled when assigned";
// - value lists and the waiver text are edited here (M5-10 moved here);
// - "Who fills it": job types × roles — the card shows on the job's Forms
//   tab, a hint at Completed if not filled, never blocking;
// - Publish makes a new version; forms already started keep their version,
//   the app gets the new one at its next sync — no app release.
// Not in the first version: blank-template wizard per industry beyond the
// three ready cards, custom formulas (only ratio %, difference, sum), the
// PDF layout editor, office editing of filled forms.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { jobTypesStore } from "../stores/jobTypesStore";

type Rating = "Good" | "Needs attention" | "Needs immediate action";
type InputType = "rating" | "dropdown" | "checkbox" | "number" | "text" | "date" | "notes" | "calculated" | "signature" | "static";
// a colour threshold: from ≤ value < to; null = open end ("below", "and above")
interface Band { from: number | null; to: number | null; result: Rating }
interface Inp {
  id: string; type: InputType; label?: string;
  list?: string; unit?: string; min?: number; max?: number; decimals?: number;
  formula?: "ratio" | "difference" | "sum"; of?: [string, string]; bands?: Band[];
  maxLen?: number; multiline?: boolean; signer?: "Customer" | "Technician"; textKey?: string; checkLabel?: string;
}
interface Block {
  id: string; kind: "field" | "heading"; label: string; help?: string; numbered: boolean;
  inputs: Inp[]; slot?: string; visibleWhen?: { field: string; values: string[] };
  required: boolean; flaggable: boolean; system?: boolean;
}
interface Section { id: string; title: string; blocks: Block[] }
interface Version { n: number; at: string; by: string; note: string }
interface Template {
  id: string; name: string; trade: string; sections: Section[]; lists: Record<string, string[]>;
  texts: { waiver: string }; jobTypes: string[]; roles: string[];
  versions: Version[]; dirty: boolean; on: boolean;
}

const TYPE_LABEL: Record<InputType, string> = {
  rating: "Rating", dropdown: "Dropdown", checkbox: "Checkbox", number: "Number", text: "Text", date: "Date",
  notes: "Technician notes", calculated: "Calculated", signature: "Signature", static: "Fixed text",
};
const TYPE_ICON: Record<InputType, string> = {
  rating: "traffic", dropdown: "arrow_drop_down_circle", checkbox: "check_box", number: "pin", text: "notes", date: "event",
  notes: "sticky_note_2", calculated: "functions", signature: "draw", static: "article",
};
const ADDABLE: InputType[] = ["rating", "dropdown", "checkbox", "number", "text", "date", "calculated"];
const ROLES = ["Technician", "Warranty Technician", "Sales Technician", "Admin"];
const FORMULA_LABEL = { ratio: "A ÷ B × 100 (%)", difference: "A − B", sum: "A + B" };

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;
const r = (): Inp => ({ id: uid("i"), type: "rating" });
const dd = (list: string, label?: string): Inp => ({ id: uid("i"), type: "dropdown", list, label });
const num = (label: string, unit: string): Inp => ({ id: uid("i"), type: "number", label, unit, decimals: 0 });
const f = (label: string, inputs: Inp[], extra: Partial<Block> = {}): Block =>
  ({ id: uid("b"), kind: "field", label, numbered: true, inputs, required: false, flaggable: inputs.some(i => i.type === "rating" || i.type === "calculated"), ...extra });
const h = (label: string, slot?: string): Block => ({ id: uid("b"), kind: "heading", label, numbered: false, inputs: [], slot, required: false, flaggable: false });
const G: Rating = "Good", A: Rating = "Needs attention", X: Rating = "Needs immediate action";
// rated vs actual within ±10% is fine, ±20% needs a look, beyond that is urgent
const RATIO_BANDS = (): Band[] => [
  { from: null, to: 80, result: X }, { from: 80, to: 90, result: A }, { from: 90, to: 110, result: G },
  { from: 110, to: 120, result: A }, { from: 120, to: null, result: X },
];
function calc(label: string, unit: string, formula: Inp["formula"], bands?: Band[], extra: Partial<Block> = {}): Block {
  if (!bands && formula === "ratio") bands = RATIO_BANDS();
  const a = num(formula === "ratio" ? "Rated" : "Return", unit), b = num(formula === "ratio" ? "Actual" : "Supply", unit);
  return f(label, [a, b, { id: uid("i"), type: "calculated", formula, of: formula === "ratio" ? [b.id, a.id] : [a.id, b.id], unit: formula === "ratio" ? "%" : unit, decimals: 0, bands }], extra);
}

function acCard(): Template {
  const sysType = f("System type", [dd("System types")], { numbered: false });
  const hpsc = dd("HP / SC", "HP / SC");
  return {
    id: "ac", name: "AC Report Card", trade: "HVAC", on: true, dirty: false,
    jobTypes: ["Maintenance", "Inspection"], roles: ["Technician", "Warranty Technician"],
    texts: { waiver: "I understand the findings above and that {Company name} recommended the repairs marked Needs Immediate Action. I chose not to have them done today." },
    lists: {
      "Thermostat settings": Array.from({ length: 26 }, (_, k) => `${60 + k} °F`),
      "Electric bill bands": ["Under $100", "$100–$200", "$200–$300", "$300–$400", "Over $400"],
      "House sizes": ["Under 1,000 sq ft", "1,000–1,500", "1,500–2,000", "2,000–2,500", "2,500–3,000", "Over 3,000"],
      Rooms: ["None", "Master bedroom", "Bedroom", "Living room", "Kitchen", "Bonus room", "Upstairs"],
      Concerns: ["None", "Allergies", "Asthma", "Dust", "Humidity", "Odors", "Noise"],
      "Filter types": ["Fiberglass", "Pleated", "HEPA", "EAC"],
      Locations: ["Closet", "Garage", "Attic", "Hall"],
      Brands: ["Daikin", "Rheem", "Carrier", "Trane", "Goodman", "Bryant"],
      "System types": ["Furnace", "Air handler"],
      "HP / SC": ["HP", "SC"],
    },
    versions: [
      { n: 1, at: "Oct 30, 2026", by: "Vision360 (ready card for HVAC)", note: "The AC Report Card from the paper form, fields 1–54" },
      { n: 2, at: "Nov 4, 2026", by: "Helen Park", note: "Brands list: added Lennox · waiver wording" },
      { n: 3, at: "Nov 10, 2026", by: "Helen Park", note: "Field 23 bands: Good 16–20 °F" },
    ],
    sections: [
      { id: uid("s"), title: "Household Analysis", blocks: [
        f("The thermostat setting", [dd("Thermostat settings")]),
        f("The average electric bill", [dd("Electric bill bands")]),
        f("The house sq ft", [dd("House sizes")]),
        f("A room difficult to cool?", [dd("Rooms")]),
        f("Health Concerns", [dd("Concerns")]),
        f("Other Concern 1", [dd("Concerns")]),
        f("Other Concern 2", [dd("Concerns")]),
      ] },
      { id: uid("s"), title: "Comfort Analysis", blocks: [
        h("Thermostat", "P1"),
        f("Wi-Fi Capability", [r()]),
        f("Overall Condition", [r()], { required: true }),
        h("Indoor Air Quality"),
        f("Filter Type", [dd("Filter types")]),
        f("Filter Location", [dd("Locations")], { slot: "P2" }),
        f("Filter size 1", [num("W", "in"), num("H", "in"), num("Qty", "")]),
        f("Filter size 2", [num("W", "in"), num("H", "in"), num("Qty", "")]),
        f("Filter Condition", [r()], { required: true }),
        f("Ductwork Condition", [r()], { slot: "P3" }),
        f("Ductwork Cleanliness", [r()]),
        f("Attic Insulation", [{ ...num("R-value", "R"), bands: [{ from: null, to: 19, result: X }, { from: 19, to: 38, result: A }, { from: 38, to: null, result: G }] }, r()], { slot: "P4", help: "R-38 recommended" }),
        f("UV Location", [dd("Locations"), r()]),
        f("UV Bulb", [r()]),
      ] },
      { id: uid("s"), title: "System Analysis", blocks: [
        sysType,
        f("Brand", [dd("Brands"), dd("Brands", "Manufacture year")], { slot: "P5" }),
        f("Location", [dd("Locations")]),
        calc("Static pressure", "in. WC", "sum", [{ from: null, to: 0.5, result: G }, { from: 0.5, to: 0.8, result: A }, { from: 0.8, to: null, result: X }]),
        calc("Air Temp dT", "°F", "difference", [
          { from: null, to: 12, result: X }, { from: 12, to: 16, result: A }, { from: 16, to: 21, result: G }, { from: 21, to: 24, result: A }, { from: 24, to: null, result: X },
        ], { required: true }),
        f("Blower Motor", [r()]),
        f("Blower Wheel", [r()]),
        calc("Blower Capacitor µF", "µF", "ratio"),
        f("Evap Coil Condition", [r()]),
        f("Drain Pan", [r()]),
        f("Drain Line Cleaned", [r()]),
        f("Blower Compartment", [r()]),
        f("Heat Strip Test", [r()], { visibleWhen: { field: sysType.id, values: ["Air handler"] } }),
        f("Safety Switches Test", [r()]),
        f("Igniter, Burner", [r()], { visibleWhen: { field: sysType.id, values: ["Furnace"] } }),
        h("Condenser"),
        f("Brand", [dd("Brands"), dd("Brands", "Age"), hpsc], { slot: "P7" }),
        calc("Compressor Cap µF", "µF", "ratio", undefined, { slot: "P9" }),
        calc("Compressor Amp RLA", "A", "ratio", undefined, { slot: "P10" }),
        f("Fan Blade", [r()]),
        f("Fan Motor Condition", [r()]),
        calc("Fan Cap µF", "µF", "ratio", undefined, { slot: "P11" }),
        calc("Fan Amp RLA", "A", "ratio"),
        f("Drain holes", [{ id: uid("i"), type: "checkbox", checkLabel: "Debris Cleaned" }, r()], { slot: "P12" }),
        f("Electrical Connections", [r()]),
        f("Disconnect", [r()]),
        f("Defrost cycle", [r()]),
        f("Refrig. Pressure Before", [num("L", "psi"), num("H", "psi")], { slot: "P13" }),
        f("Refrig. Pressure After", [num("L", "psi"), num("H", "psi")], { slot: "P14" }),
        f("Refrigerant Pressure", [r()]),
        f("Sequence of operation tested", [{ id: uid("i"), type: "checkbox", checkLabel: "Check if YES" }]),
        { ...h("Photos"), slot: "P15 Air Handler · P16 Electrical Panel · P17 Front of House" },
      ] },
      { id: uid("s"), title: "Customer Section", blocks: [
        f("Waiver", [{ id: uid("i"), type: "static", textKey: "waiver" }], { system: true }),
        f("Customer Waiver", [{ id: uid("i"), type: "signature", signer: "Customer" }, { id: uid("i"), type: "date" }], { system: true }),
      ] },
      { id: uid("s"), title: "Technician Section", blocks: [
        f("The other trades explained", [{ id: uid("i"), type: "checkbox", checkLabel: "Check if YES" }]),
        f("Home service plans explained", [{ id: uid("i"), type: "checkbox", checkLabel: "Check if YES" }]),
        f("Tech notes section", [{ id: uid("i"), type: "notes" }]),
        f("Tech Signature", [{ id: uid("i"), type: "signature", signer: "Technician" }, { id: uid("i"), type: "date" }], { system: true }),
      ] },
    ],
  };
}

function smallCard(id: string, name: string, trade: string, fields: Block[], on: boolean): Template {
  return {
    id, name, trade, on, dirty: false, jobTypes: on ? ["Inspection"] : [], roles: on ? ["Technician"] : [],
    texts: { waiver: "I understand the findings above and that {Company name} recommended the repairs marked Needs Immediate Action." },
    lists: { Locations: ["Kitchen", "Bathroom", "Garage", "Basement", "Outside"] },
    versions: [{ n: 1, at: "Oct 30, 2026", by: `Vision360 (ready card for ${trade})`, note: "Ready card" }],
    sections: [
      { id: uid("s"), title: "Inspection", blocks: fields },
      { id: uid("s"), title: "Customer Section", blocks: [
        f("Waiver", [{ id: uid("i"), type: "static", textKey: "waiver" }], { system: true }),
        f("Customer Waiver", [{ id: uid("i"), type: "signature", signer: "Customer" }, { id: uid("i"), type: "date" }], { system: true }),
      ] },
      { id: uid("s"), title: "Technician Section", blocks: [
        f("Tech notes section", [{ id: uid("i"), type: "notes" }]),
        f("Tech Signature", [{ id: uid("i"), type: "signature", signer: "Technician" }, { id: uid("i"), type: "date" }], { system: true }),
      ] },
    ],
  };
}

function seed(): Template[] {
  return [
    acCard(),
    smallCard("plumbing", "Plumbing Report Card", "Plumbing", [
      f("Water heater", [r()], { slot: "P1" }), f("Water pressure", [num("Pressure", "psi"), r()]),
      f("Shut-off valves", [r()]), f("Leaks found", [{ id: uid("i"), type: "checkbox", checkLabel: "Check if YES" }, dd("Locations")]),
    ], false),
    smallCard("electrical", "Electrical Report Card", "Electrical", [
      f("Main panel", [r()], { slot: "P1" }), f("Breakers labeled", [{ id: uid("i"), type: "checkbox", checkLabel: "Check if YES" }]),
      f("GFCI outlets tested", [r()]), f("Smoke detectors", [r()]),
    ], false),
  ];
}

// numbering runs across the card: numbered fields only (System type, headings, Photos are not)
function numbering(t: Template) {
  const map: Record<string, number> = {}; let n = 0;
  t.sections.forEach(s => s.blocks.forEach(b => { if (b.kind === "field" && b.numbered) map[b.id] = ++n; }));
  return map;
}
function sectionRange(s: Section, nums: Record<string, number>) {
  const ns = s.blocks.map(b => nums[b.id]).filter(Boolean);
  if (!ns.length) return "";
  return ns.length === 1 ? String(ns[0]) : `${ns[0]}-${ns[ns.length - 1]}`;
}
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const chip = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px]";
const selectCls = "h-9 w-full rounded-md border border-[#D8DEE8] bg-white px-2 text-[13px] text-[#1A2332]";

export function ReportCardBuilder() {
  const [templates, setTemplates] = useState<Template[]>(() => seed());
  const [openId, setOpenId] = useState<string | null>(null);
  const open = templates.find(t => t.id === openId) || null;
  const update = (fn: (t: Template) => void) => setTemplates(ts => ts.map(t => {
    if (t.id !== openId) return t;
    const c = clone(t); fn(c); c.dirty = true; return c;
  }));
  if (open) return <Editor t={open} update={update} onBack={() => setOpenId(null)} onPublish={(note) => setTemplates(ts => ts.map(t => {
    if (t.id !== openId) return t;
    const c = clone(t); const n = c.versions[c.versions.length - 1].n + 1;
    c.versions.push({ n, at: "Nov 12, 2026", by: "John Doe", note: note || "Changes" }); c.dirty = false; return c;
  }))} />;

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>Report Cards</h1>
          <p className="mt-1.5 max-w-[740px] text-[14px] leading-5 text-[#546478]">
            Forms your technicians fill in on a job, in the app. You started with the ready cards for your trades; change them here and publish.
            The app picks up a published version at its next sync.
          </p>
        </div>
        <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}
          onClick={() => toast("New cards start as a copy of a ready card — use Duplicate on one of them", { icon: "ℹ️" })}>
          <span className="material-icons mr-1" style={{ fontSize: 18 }}>add</span>New report card
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-[1.6fr_1.4fr_1.1fr_110px_40px] gap-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[12px] text-[#6B7280]" style={{ fontWeight: 600 }}>
          <div>Card</div><div>Who fills it</div><div>Live version</div><div>Status</div><div />
        </div>
        {templates.map(t => {
          const v = t.versions[t.versions.length - 1];
          const fields = Object.keys(numbering(t)).length;
          return (
            <div key={t.id} className="grid cursor-pointer grid-cols-[1.6fr_1.4fr_1.1fr_110px_40px] items-center gap-3 border-b border-[#F0F2F5] px-4 py-3 last:border-0 hover:bg-[#F8FAFD]" onClick={() => setOpenId(t.id)}>
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{t.name}</div>
                <div className="text-[12px] text-[#6B7280]">{t.trade} · {t.sections.length} sections · {fields} fields</div>
              </div>
              <div className="text-[13px] text-[#546478]">
                {t.on && t.jobTypes.length ? <>{t.jobTypes.join(", ")}<div className="text-[12px] text-[#8A97A8]">{t.roles.join(", ")}</div></> : <span className="text-[#8A97A8]">Not on any job yet</span>}
              </div>
              <div className="text-[13px] text-[#546478]">Version {v.n}<div className="text-[12px] text-[#8A97A8]">{v.at} · {v.by}</div></div>
              <div>
                <span className={`${chip} ${t.dirty ? "bg-[#FEF3C7] text-[#B45309]" : t.on ? "bg-[#E8F6ED] text-[#15803D]" : "bg-[#F1F3F6] text-[#546478]"}`} style={{ fontWeight: 600 }}>
                  {t.dirty ? "Draft changes" : t.on ? "In use" : "Off"}
                </span>
              </div>
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 20 }}>chevron_right</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] leading-5 text-[#6B7280]">
        A card is shown on the job&rsquo;s Forms tab for the job types and roles in &ldquo;Who fills it&rdquo;. Filling it is never required to complete a job — the app gives a hint at Completed.
      </p>
    </>
  );
}

type Tab = "fields" | "lists" | "texts" | "who" | "versions";

function Editor({ t, update, onBack, onPublish }: { t: Template; update: (fn: (t: Template) => void) => void; onBack: () => void; onPublish: (note: string) => void }) {
  const [tab, setTab] = useState<Tab>("fields");
  const [secId, setSecId] = useState(t.sections[0]?.id);
  const [selId, setSelId] = useState<string | null>(null);
  const [preview, setPreview] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [note, setNote] = useState("");
  const nums = useMemo(() => numbering(t), [t]);
  const sec = t.sections.find(s => s.id === secId) || t.sections[0];
  const sel = sec?.blocks.find(b => b.id === selId) || null;
  const live = t.versions[t.versions.length - 1].n;

  const editSec = (fn: (s: Section, tt: Template) => void) => update(tt => { const s = tt.sections.find(x => x.id === sec.id); if (s) fn(s, tt); });
  const editSel = (fn: (b: Block) => void) => editSec(s => { const b = s.blocks.find(x => x.id === selId); if (b) fn(b); });
  const move = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  const TABS: [Tab, string][] = [["fields", "Fields"], ["lists", "Value lists"], ["texts", "Texts"], ["who", "Who fills it"], ["versions", "Versions"]];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#F5F7FA]">
      {/* top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-5 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-[#546478] hover:text-[#1A2332]">
          <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>Report Cards
        </button>
        <span className="text-[#D1D5DB]">/</span>
        <input value={t.name} onChange={e => { const v = e.target.value; update(tt => { tt.name = v; }); }}
          className="min-w-0 flex-1 rounded px-1 text-[17px] text-[#1A2332] outline-none hover:bg-[#F5F7FA] focus:bg-[#F5F7FA]" style={{ fontWeight: 700 }} />
        <span className={`${chip} ${t.dirty ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#E8F6ED] text-[#15803D]"}`} style={{ fontWeight: 600 }}>
          {t.dirty ? `Draft · version ${live} is live` : `Version ${live} · published`}
        </span>
        <Button variant="outline" className="h-9 border-[#D8DEE8] px-3 text-[13px]" onClick={() => setPreview(p => !p)}>
          <span className="material-icons mr-1" style={{ fontSize: 17 }}>smartphone</span>{preview ? "Hide preview" : "Preview on phone"}
        </Button>
        <Button disabled={!t.dirty} className="h-9 bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85] disabled:opacity-50" style={{ fontWeight: 600 }} onClick={() => setPublishOpen(true)}>
          Publish version {live + 1}
        </Button>
      </div>
      <div className="flex gap-1 border-b border-[#E5E7EB] bg-white px-5">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`border-b-2 px-3 py-2.5 text-[13.5px] ${tab === k ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#546478] hover:text-[#1A2332]"}`} style={{ fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === "fields" && (
        <div className="flex gap-4 p-5">
          {/* sections */}
          <div className="w-[210px] shrink-0">
            <div className="mb-2 text-[12px] uppercase tracking-wide text-[#8A97A8]" style={{ fontWeight: 600 }}>Sections</div>
            <div className="space-y-1">
              {t.sections.map((s, i) => {
                const locked = s.blocks.some(b => b.system);
                return (
                  <div key={s.id} onClick={() => { setSecId(s.id); setSelId(null); }}
                    className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 ${s.id === sec.id ? "border-[#C8D5E8] bg-white shadow-sm" : "border-transparent hover:bg-white"}`}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] text-[#1A2332]" style={{ fontWeight: 600 }}>{s.title}</div>
                      <div className="text-[11.5px] text-[#8A97A8]">{sectionRange(s, nums) || "No numbered fields"}</div>
                    </div>
                    {!locked && (
                      <div className="hidden flex-col group-hover:flex">
                        <span className="material-icons cursor-pointer text-[#9CA3AF] hover:text-[#1A2332]" style={{ fontSize: 16 }} onClick={e => { e.stopPropagation(); update(tt => move(tt.sections, i, -1)); }}>expand_less</span>
                        <span className="material-icons cursor-pointer text-[#9CA3AF] hover:text-[#1A2332]" style={{ fontSize: 16 }} onClick={e => { e.stopPropagation(); update(tt => move(tt.sections, i, 1)); }}>expand_more</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-[#C8D5E8] px-2.5 py-2 text-[13px] text-[#4A6FA5] hover:bg-white" style={{ fontWeight: 600 }}
              onClick={() => { const id = uid("s"); const idx = Math.max(0, t.sections.findIndex(s => s.blocks.some(b => b.system))); update(tt => { tt.sections.splice(idx, 0, { id, title: "New section", blocks: [] }); }); setSecId(id); setSelId(null); }}>
              <span className="material-icons" style={{ fontSize: 17 }}>add</span>Add section
            </button>
            <p className="mt-3 text-[11.5px] leading-4 text-[#8A97A8]">Customer and Technician sections stay last: they hold the waiver and the signatures.</p>
          </div>

          {/* blocks */}
          <div className="min-w-[380px] flex-1">
            <div className="mb-2 flex items-center gap-2">
              <input value={sec.title} onChange={e => { const v = e.target.value; editSec(s => { s.title = v; }); }}
                className="min-w-0 flex-1 rounded bg-transparent px-1 text-[16px] text-[#1A2332] outline-none hover:bg-white focus:bg-white" style={{ fontWeight: 700 }} />
              <span className="text-[12px] text-[#8A97A8]">{sectionRange(sec, nums)}</span>
              {!sec.blocks.some(b => b.system) && (
                <span className="material-icons cursor-pointer text-[#9CA3AF] hover:text-[#DC2626]" title="Delete section" style={{ fontSize: 19 }}
                  onClick={() => { if (sec.blocks.length) { toast.error("Move or delete its fields first"); return; } update(tt => { tt.sections = tt.sections.filter(s => s.id !== sec.id); }); setSecId(t.sections[0].id); }}>delete_outline</span>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
              {sec.blocks.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-[#8A97A8]">No fields yet. Add the first one below.</div>}
              {sec.blocks.map((b, i) => (
                <div key={b.id} onClick={() => setSelId(b.id)}
                  className={`group flex cursor-pointer items-start gap-3 border-b border-[#F0F2F5] px-3 py-2.5 last:border-0 ${b.id === selId ? "bg-[#EEF3FA]" : "hover:bg-[#F8FAFD]"} ${b.kind === "heading" ? "bg-[#FAFBFC]" : ""}`}>
                  <div className="w-7 shrink-0 pt-0.5 text-right text-[12.5px] text-[#8A97A8]" style={{ fontWeight: 600 }}>{nums[b.id] || ""}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[13.5px] ${b.kind === "heading" ? "uppercase tracking-wide text-[#546478]" : "text-[#1A2332]"}`} style={{ fontWeight: 600 }}>{b.label}</span>
                      {b.slot && <span className={`${chip} bg-[#EBF0F8] text-[#4A6FA5]`}><span className="material-icons" style={{ fontSize: 13 }}>photo_camera</span>{b.slot}</span>}
                      {b.required && <span className={`${chip} bg-[#FDECEC] text-[#B42318]`}>Must be filled</span>}
                      {b.system && <span className={`${chip} bg-[#F1F3F6] text-[#546478]`}><span className="material-icons" style={{ fontSize: 13 }}>lock</span>Always on the card</span>}
                    </div>
                    {b.kind === "field" && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {b.inputs.map(inp => (
                          <span key={inp.id} className={`${chip} border border-[#E5E7EB] text-[#546478]`}>
                            <span className="material-icons" style={{ fontSize: 13 }}>{TYPE_ICON[inp.type]}</span>
                            {TYPE_LABEL[inp.type]}{inp.label ? ` · ${inp.label}` : ""}{inp.list ? ` · ${inp.list}` : ""}{inp.unit && inp.type !== "calculated" ? ` · ${inp.unit}` : ""}
                            {inp.type === "calculated" && inp.formula ? ` · ${FORMULA_LABEL[inp.formula]}` : ""}
                            {inp.bands?.length ? <BandStrip bands={inp.bands} /> : null}
                          </span>
                        ))}
                      </div>
                    )}
                    {b.visibleWhen && (
                      <div className="mt-1 text-[11.5px] text-[#B45309]">
                        <span className="material-icons align-middle" style={{ fontSize: 13 }}>visibility</span> Shown when {labelOf(t, b.visibleWhen.field)} is {b.visibleWhen.values.join(" or ")}
                      </div>
                    )}
                  </div>
                  {!b.system && (
                    <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                      <IconBtn icon="arrow_upward" title="Move up" onClick={() => editSec(s => move(s.blocks, i, -1))} />
                      <IconBtn icon="arrow_downward" title="Move down" onClick={() => editSec(s => move(s.blocks, i, 1))} />
                      <IconBtn icon="content_copy" title="Duplicate" onClick={() => editSec(s => { const c = clone(b); c.id = uid("b"); c.inputs.forEach(x => { x.id = uid("i"); }); s.blocks.splice(i + 1, 0, c); })} />
                      <IconBtn icon="delete_outline" title="Delete" danger onClick={() => { editSec(s => { s.blocks.splice(i, 1); }); setSelId(null); toast("Field deleted · forms already filled keep its value in their version"); }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!sec.blocks.some(b => b.system) && (
              <div className="mt-2 flex gap-2">
                <AddBtn icon="add" label="Add field" onClick={() => { const b = f("New field", [r()]); editSec(s => { s.blocks.push(b); }); setSelId(b.id); }} />
                <AddBtn icon="title" label="Add heading" onClick={() => { const b = h("New heading"); editSec(s => { s.blocks.push(b); }); setSelId(b.id); }} />
              </div>
            )}
          </div>

          {/* inspector */}
          <div className="sticky top-[110px] w-[310px] shrink-0 self-start">
            {sel ? <Inspector t={t} b={sel} nums={nums} edit={editSel} /> : (
              <div className="rounded-lg border border-dashed border-[#D8DEE8] bg-white p-4 text-[13px] leading-5 text-[#6B7280]">
                Click a field to change its name, inputs, photo slot, when it shows and whether it must be filled.
              </div>
            )}
          </div>

          {preview && <PhonePreview t={t} sec={sec} nums={nums} />}
        </div>
      )}

      {tab === "lists" && <ListsTab t={t} update={update} />}
      {tab === "texts" && (
        <div className="max-w-[760px] p-5">
          <Card title="Waiver" sub="Printed on the card and the customer's PDF above the customer's signature (field Waiver). {Company name} is filled from Company info.">
            <textarea value={t.texts.waiver} onChange={e => { const v = e.target.value; update(tt => { tt.texts.waiver = v; }); }}
              className="mt-3 h-32 w-full rounded-md border border-[#D8DEE8] p-3 text-[13.5px] leading-5 outline-none focus:border-[#4A6FA5]" maxLength={1500} />
            <div className="mt-1 text-right text-[12px] text-[#8A97A8]">{t.texts.waiver.length} / 1500</div>
          </Card>
        </div>
      )}
      {tab === "who" && <WhoTab t={t} update={update} />}
      {tab === "versions" && (
        <div className="max-w-[760px] p-5">
          <Card title="Versions" sub="Each Publish makes a new version. A form already started on a job keeps the version it started with; new forms use the latest. The app gets a new version at its next sync — no app update.">
            <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB]">
              {t.dirty && (
                <div className="flex items-center gap-3 border-b border-[#F0F2F5] bg-[#FFFBEB] px-4 py-3">
                  <span className="w-20 text-[13px] text-[#B45309]" style={{ fontWeight: 700 }}>Draft</span>
                  <span className="flex-1 text-[13px] text-[#546478]">Unpublished changes — technicians still see version {live}</span>
                </div>
              )}
              {[...t.versions].reverse().map((v, k) => (
                <div key={v.n} className="flex items-center gap-3 border-b border-[#F0F2F5] px-4 py-3 last:border-0">
                  <span className="w-20 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Version {v.n}</span>
                  <span className="flex-1 text-[13px] text-[#546478]">{v.note}<div className="text-[12px] text-[#8A97A8]">{v.at} · {v.by}</div></span>
                  {k === 0 ? <span className={`${chip} bg-[#E8F6ED] text-[#15803D]`} style={{ fontWeight: 600 }}>Live</span>
                    : <span className="text-[12px] text-[#8A97A8]">{k === 1 ? "3 forms in progress" : "Filled forms only"}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPublishOpen(false)} />
          <div className="relative w-[460px] rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Publish version {live + 1} of {t.name}?</h3>
            <p className="mb-3 text-[13px] leading-5 text-[#6B7280]">
              New forms use version {live + 1} after the technician&rsquo;s app syncs. Forms already started on a job keep version {live}, so nothing a technician filled changes.
            </p>
            <label className="mb-1 block text-[12.5px] text-[#374151]" style={{ fontWeight: 500 }}>What changed (shown in Versions)</label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Added Duct leakage test" className="h-9 text-[13px]" />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="h-9 border-[#D8DEE8] px-4 text-[13px]" onClick={() => setPublishOpen(false)}>Cancel</Button>
              <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}
                onClick={() => { onPublish(note.trim()); setPublishOpen(false); setNote(""); toast.success(`Version ${live + 1} published · technicians get it at the next sync`); }}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function labelOf(t: Template, blockId: string) {
  for (const s of t.sections) for (const b of s.blocks) if (b.id === blockId) return b.label;
  return "a field";
}
function dropdownFields(t: Template) {
  const out: { id: string; label: string; list: string }[] = [];
  t.sections.forEach(s => s.blocks.forEach(b => { const d = b.inputs.find(i => i.type === "dropdown" && i.list); if (d && d.list) out.push({ id: b.id, label: b.label, list: d.list }); }));
  return out;
}

function IconBtn({ icon, title, onClick, danger }: { icon: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick(); }}
      className={`flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-white ${danger ? "hover:text-[#DC2626]" : "hover:text-[#1A2332]"}`}>
      <span className="material-icons" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );
}
function AddBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#C8D5E8] bg-white px-3 py-2 text-[13px] text-[#4A6FA5] hover:bg-[#F8FAFD]" style={{ fontWeight: 600 }}>
      <span className="material-icons" style={{ fontSize: 17 }}>{icon}</span>{label}
    </button>
  );
}
function Card({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</div>
      {sub && <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">{sub}</p>}
      {children}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mt-3"><div className="mb-1 text-[12px] text-[#374151]" style={{ fontWeight: 500 }}>{label}</div>{children}</div>;
}

function Inspector({ t, b, nums, edit }: { t: Template; b: Block; nums: Record<string, number>; edit: (fn: (b: Block) => void) => void }) {
  const lists = Object.keys(t.lists);
  const conds = dropdownFields(t).filter(x => x.id !== b.id);
  const numInputs = b.inputs.filter(i => i.type === "number");
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-wide text-[#8A97A8]" style={{ fontWeight: 600 }}>{b.kind === "heading" ? "Heading" : `Field ${nums[b.id] || "(not numbered)"}`}</div>
        {b.system && <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 16 }} title="Always on the card">lock</span>}
      </div>
      <Row label="Name"><Input value={b.label} onChange={e => { const v = e.target.value; edit(x => { x.label = v; }); }} className="h-9 text-[13px]" maxLength={80} /></Row>
      {b.kind === "field" && !b.system && (
        <Row label="Help text (under the name in the app)"><Input value={b.help || ""} onChange={e => { const v = e.target.value; edit(x => { x.help = v || undefined; }); }} className="h-9 text-[13px]" placeholder="e.g. R-38 recommended" maxLength={80} /></Row>
      )}

      {b.kind === "field" && (
        <Row label="Inputs">
          <div className="space-y-2">
            {b.inputs.map((inp, k) => (
              <div key={inp.id} className="rounded-md border border-[#E5E7EB] p-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-[#546478]" style={{ fontSize: 16 }}>{TYPE_ICON[inp.type]}</span>
                  {b.system ? <span className="flex-1 text-[13px]" style={{ fontWeight: 600 }}>{TYPE_LABEL[inp.type]}{inp.signer ? ` · ${inp.signer}` : ""}</span> : (
                    <select value={inp.type} className="h-8 flex-1 rounded border border-[#D8DEE8] px-1.5 text-[12.5px]"
                      onChange={e => { const v = e.target.value as InputType; edit(x => { const i = x.inputs[k]; i.type = v; if (v === "dropdown" && !i.list) i.list = lists[0]; if (v === "calculated") { const ns = x.inputs.filter(n => n.type === "number"); i.formula = "difference"; i.of = ns.length >= 2 ? [ns[0].id, ns[1].id] : undefined; } x.flaggable = x.inputs.some(n => n.type === "rating" || n.type === "calculated"); }); }}>
                      {(ADDABLE.includes(inp.type) ? ADDABLE : [inp.type, ...ADDABLE]).map(o => <option key={o} value={o}>{TYPE_LABEL[o]}</option>)}
                    </select>
                  )}
                  {!b.system && b.inputs.length > 1 && <IconBtn icon="close" title="Remove input" onClick={() => edit(x => { x.inputs.splice(k, 1); })} />}
                </div>
                {inp.type === "dropdown" && (
                  <select value={inp.list} onChange={e => { const v = e.target.value; edit(x => { x.inputs[k].list = v; }); }} className={`${selectCls} mt-1.5 h-8 text-[12.5px]`}>
                    {lists.map(l => <option key={l} value={l}>List: {l} ({t.lists[l].length})</option>)}
                  </select>
                )}
                {inp.type === "number" && (
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    <Input value={inp.label || ""} placeholder="Label" onChange={e => { const v = e.target.value; edit(x => { x.inputs[k].label = v; }); }} className="h-8 text-[12.5px]" />
                    <Input value={inp.unit || ""} placeholder="Unit" onChange={e => { const v = e.target.value; edit(x => { x.inputs[k].unit = v; }); }} className="h-8 text-[12.5px]" />
                    <select value={inp.decimals ?? 0} onChange={e => { const v = +e.target.value; edit(x => { x.inputs[k].decimals = v; }); }} className="h-8 rounded border border-[#D8DEE8] px-1 text-[12px]">
                      {[0, 1, 2].map(d => <option key={d} value={d}>{d} decimals</option>)}
                    </select>
                  </div>
                )}
                {inp.type === "number" && !b.inputs.some(n => n.type === "calculated") && (
                  <Thresholds inp={inp} onChange={bands => edit(x => { x.inputs[k].bands = bands; x.flaggable = x.inputs.some(n => n.type === "rating" || n.type === "calculated" || !!n.bands?.length); })} />
                )}
                {inp.type === "checkbox" && (
                  <Input value={inp.checkLabel || ""} placeholder="Check if YES" onChange={e => { const v = e.target.value; edit(x => { x.inputs[k].checkLabel = v; }); }} className="mt-1.5 h-8 text-[12.5px]" />
                )}
                {inp.type === "text" && (
                  <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#546478]">
                    <Input value={String(inp.maxLen ?? 200)} onChange={e => { const v = parseInt(e.target.value, 10) || 0; edit(x => { x.inputs[k].maxLen = v; }); }} className="h-8 w-20 text-[12.5px]" /> characters max
                  </div>
                )}
                {inp.type === "calculated" && (
                  <div className="mt-1.5 space-y-1.5">
                    {numInputs.length < 2 ? <div className="text-[12px] text-[#B45309]">Add two Number inputs to this field first — a calculation uses this field&rsquo;s own numbers.</div> : <>
                      <select value={inp.formula} onChange={e => { const v = e.target.value as Inp["formula"]; edit(x => { x.inputs[k].formula = v; }); }} className={`${selectCls} h-8 text-[12.5px]`}>
                        {(Object.keys(FORMULA_LABEL) as Array<keyof typeof FORMULA_LABEL>).map(o => <option key={o} value={o}>{FORMULA_LABEL[o]}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[0, 1].map(ix => (
                          <select key={ix} value={inp.of?.[ix]} onChange={e => { const v = e.target.value; edit(x => { const i = x.inputs[k]; const of: [string, string] = [...(i.of || [numInputs[0].id, numInputs[1].id])] as [string, string]; of[ix] = v; i.of = of; }); }} className="h-8 rounded border border-[#D8DEE8] px-1 text-[12px]">
                            {numInputs.map(n => <option key={n.id} value={n.id}>{ix ? "B" : "A"}: {n.label || "Number"}</option>)}
                          </select>
                        ))}
                      </div>
                      <Thresholds inp={inp} onChange={bands => edit(x => { x.inputs[k].bands = bands; })} ratio={inp.formula === "ratio"} />
                    </>}
                  </div>
                )}
                {inp.type === "static" && <div className="mt-1.5 text-[12px] text-[#546478]">The waiver text — edit it on the Texts tab.</div>}
              </div>
            ))}
            {!b.system && b.inputs.length < 4 && (
              <button className="text-[12.5px] text-[#4A6FA5]" style={{ fontWeight: 600 }} onClick={() => edit(x => { x.inputs.push({ id: uid("i"), type: "number", label: "", unit: "", decimals: 0 }); })}>+ Add input</button>
            )}
          </div>
        </Row>
      )}

      {!b.system && (
        <Row label="Photo slot">
          <div className="flex items-center gap-2">
            <Switch checked={!!b.slot} onCheckedChange={on => edit(x => { x.slot = on ? `P${slotNext(t)}` : undefined; })} />
            {b.slot ? <Input value={b.slot} onChange={e => { const v = e.target.value; edit(x => { x.slot = v; }); }} className="h-8 text-[12.5px]" /> : <span className="text-[12.5px] text-[#8A97A8]">No camera button</span>}
          </div>
          <div className="mt-1 text-[11.5px] leading-4 text-[#8A97A8]">A photo taken from the slot is labelled with it on the job.</div>
        </Row>
      )}

      {b.kind === "field" && !b.system && (
        <>
          <Row label="Shown when">
            <select value={b.visibleWhen?.field || ""} className={selectCls}
              onChange={e => { const v = e.target.value; edit(x => { if (!v) { x.visibleWhen = undefined; return; } const c = conds.find(cc => cc.id === v); x.visibleWhen = { field: v, values: c ? [t.lists[c.list]?.[0]] : [] }; }); }}>
              <option value="">Always</option>
              {conds.map(c => <option key={c.id} value={c.id}>{nums[c.id] ? `${nums[c.id]}. ` : ""}{c.label} is…</option>)}
            </select>
            {b.visibleWhen && (() => {
              const c = conds.find(cc => cc.id === b.visibleWhen!.field);
              const opts = c ? t.lists[c.list] || [] : [];
              return (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {opts.map(o => {
                    const on = b.visibleWhen!.values.includes(o);
                    return <button key={o} onClick={() => edit(x => { const vs = x.visibleWhen!.values; x.visibleWhen!.values = on ? vs.filter(v => v !== o) : [...vs, o]; })}
                      className={`${chip} border ${on ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#4A6FA5]" : "border-[#E5E7EB] text-[#546478]"}`}>{o}</button>;
                  })}
                  <div className="mt-1 w-full text-[11.5px] leading-4 text-[#8A97A8]">Hidden fields are not printed; a value is cleared when the field hides.</div>
                </div>
              );
            })()}
          </Row>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div><div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Must be filled</div><div className="text-[11.5px] leading-4 text-[#8A97A8]">Counts toward &ldquo;Filled&rdquo;. Never blocks completing the job.</div></div>
            <Switch checked={b.required} onCheckedChange={v => edit(x => { x.required = v; })} />
          </div>
          {b.flaggable && <div className="mt-3 rounded-md bg-[#FEF3E2] px-2.5 py-2 text-[11.5px] leading-4 text-[#8A6114]">Needs Attention and Needs Immediate Action count in the section&rsquo;s badge.</div>}
        </>
      )}
    </div>
  );
}
function slotNext(t: Template) {
  let max = 0;
  t.sections.forEach(s => s.blocks.forEach(b => { (b.slot || "").replace(/P(\d+)/g, (_m, d) => { max = Math.max(max, +d); return ""; }); }));
  return max + 1;
}

function ListsTab({ t, update }: { t: Template; update: (fn: (t: Template) => void) => void }) {
  const names = Object.keys(t.lists);
  const [cur, setCur] = useState(names[0]);
  const [draft, setDraft] = useState("");
  const vals = t.lists[cur] || [];
  const used = t.sections.flatMap(s => s.blocks).filter(b => b.inputs.some(i => i.list === cur)).map(b => b.label);
  return (
    <div className="flex gap-4 p-5">
      <div className="w-[240px] shrink-0 space-y-1">
        {names.map(n => (
          <button key={n} onClick={() => setCur(n)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] ${n === cur ? "bg-white text-[#4A6FA5] shadow-sm" : "text-[#546478] hover:bg-white"}`} style={{ fontWeight: 600 }}>
            {n}<span className="text-[12px] text-[#8A97A8]">{t.lists[n].length}</span>
          </button>
        ))}
        <button className="mt-1 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-[#C8D5E8] px-3 py-2 text-[13px] text-[#4A6FA5]" style={{ fontWeight: 600 }}
          onClick={() => { let n = "New list", k = 2; while (t.lists[n]) n = `New list ${k++}`; update(tt => { tt.lists[n] = []; }); setCur(n); }}>
          <span className="material-icons" style={{ fontSize: 17 }}>add</span>New list
        </button>
      </div>
      <div className="max-w-[560px] flex-1">
        <Card title={cur} sub={used.length ? `Used by: ${used.join(", ")}` : "Not used by any field yet"}>
          <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB]">
            {vals.map((v, i) => (
              <div key={i} className="group flex items-center gap-2 border-b border-[#F0F2F5] px-3 py-1.5 last:border-0">
                <span className="material-icons text-[#C4CBD6]" style={{ fontSize: 16 }}>drag_indicator</span>
                <input value={v} onChange={e => { const nv = e.target.value; update(tt => { tt.lists[cur][i] = nv; }); }} className="flex-1 bg-transparent text-[13.5px] outline-none" />
                <div className="hidden group-hover:flex">
                  <IconBtn icon="arrow_upward" title="Up" onClick={() => update(tt => { const a = tt.lists[cur]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; })} />
                  <IconBtn icon="delete_outline" title="Remove" danger onClick={() => update(tt => { tt.lists[cur].splice(i, 1); })} />
                </div>
              </div>
            ))}
          </div>
          <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); const v = draft.trim(); if (!v) return; if (vals.includes(v)) { toast.error("Already in the list"); return; } update(tt => { tt.lists[cur].push(v); }); setDraft(""); }}>
            <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a value" className="h-9 text-[13px]" maxLength={60} />
            <Button type="submit" variant="outline" className="h-9 border-[#D8DEE8] px-3 text-[13px]">Add</Button>
          </form>
          <p className="mt-2 text-[12px] leading-4 text-[#8A97A8]">A removed value stays on forms that already have it; it is no longer offered.</p>
        </Card>
      </div>
    </div>
  );
}

function WhoTab({ t, update }: { t: Template; update: (fn: (t: Template) => void) => void }) {
  const types = jobTypesStore.getJobTypes();
  const toggle = (key: "jobTypes" | "roles", v: string) => update(tt => { const a = tt[key]; tt[key] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; tt.on = tt.jobTypes.length > 0 && tt.roles.length > 0; });
  const Box = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13.5px] ${on ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#1A2332]" : "border-[#E5E7EB] bg-white text-[#546478]"}`}>
      <span className="material-icons" style={{ fontSize: 18, color: on ? "#4A6FA5" : "#C4CBD6" }}>{on ? "check_box" : "check_box_outline_blank"}</span>{label}
    </button>
  );
  return (
    <div className="max-w-[760px] space-y-4 p-5">
      <Card title="Job types" sub="The card is on the Forms tab of jobs of these types. On any other job a technician can still add it by hand.">
        <div className="mt-3 grid grid-cols-3 gap-2">{types.map(ty => <Box key={ty} on={t.jobTypes.includes(ty)} label={ty} onClick={() => toggle("jobTypes", ty)} />)}</div>
      </Card>
      <Card title="Roles" sub="Who is expected to fill it. If it is not filled, the app says so when the job is set to Completed — it never blocks.">
        <div className="mt-3 grid grid-cols-2 gap-2">{ROLES.map(ro => <Box key={ro} on={t.roles.includes(ro)} label={ro} onClick={() => toggle("roles", ro)} />)}</div>
      </Card>
      <div className="rounded-lg bg-[#EBF0F8] px-4 py-3 text-[13px] leading-5 text-[#1A2332]">
        {t.jobTypes.length && t.roles.length
          ? <>On <b>{t.jobTypes.join(", ")}</b> jobs, <b>{t.roles.join(", ")}</b> see{t.roles.length === 1 ? "s" : ""} {t.name} on the Forms tab. One card of this kind per job. The customer gets its PDF when the technician sends it.</>
          : <>{t.name} is not shown on any job. Pick at least one job type and one role.</>}
      </div>
    </div>
  );
}

const RATING_COLOR: Record<string, string> = { Good: "#16A34A", "Needs attention": "#D97706", "Needs immediate action": "#DC2626" };
function PhonePreview({ t, sec, nums }: { t: Template; sec: Section; nums: Record<string, number> }) {
  return (
    <div className="sticky top-[110px] w-[290px] shrink-0 self-start">
      <div className="mb-2 text-[12px] uppercase tracking-wide text-[#8A97A8]" style={{ fontWeight: 600 }}>In the app</div>
      <div className="overflow-hidden rounded-[28px] border-[6px] border-[#1C2B3A] bg-[#F2F5F9] shadow-lg">
        <div className="flex items-center gap-2 bg-white px-3 py-2.5">
          <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
          <span className="flex-1 truncate text-[14px]" style={{ fontWeight: 600 }}>{t.name}</span>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-2.5">
          <div className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2.5">
            <span className="text-[13px]" style={{ fontWeight: 700 }}>{sec.title}</span>
            <span className="text-[11px] text-[#8A97A8]">{sectionRange(sec, nums)}</span>
          </div>
          <div className="space-y-1.5">
            {sec.blocks.map(b => b.kind === "heading" ? (
              <div key={b.id} className="flex items-center justify-between px-1 pt-2 text-[11px] uppercase tracking-wide text-[#8A97A8]" style={{ fontWeight: 600 }}>
                {b.label}{b.slot && <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 16 }}>photo_camera</span>}
              </div>
            ) : (
              <div key={b.id} className="rounded-lg bg-white px-3 py-2.5">
                <div className="flex items-start gap-1.5">
                  <span className="flex-1 text-[12.5px] leading-4" style={{ fontWeight: 600 }}>{nums[b.id] ? `${nums[b.id]}. ` : ""}{b.label}{b.required && <span className="text-[#DC2626]"> *</span>}</span>
                  {b.slot && <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 16 }}>photo_camera</span>}
                </div>
                {b.help && <div className="text-[10.5px] text-[#8A97A8]">{b.help}</div>}
                {b.visibleWhen && <div className="text-[10px] text-[#B45309]">Only when {labelOf(t, b.visibleWhen.field)} is {b.visibleWhen.values.join(" / ")}</div>}
                <div className="mt-1.5 space-y-1">
                  {b.inputs.map(inp => <PreviewInput key={inp.id} inp={inp} t={t} b={b} />)}
                </div>
              </div>
            ))}
            {!sec.blocks.length && <div className="py-6 text-center text-[11.5px] text-[#8A97A8]">Empty section</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
function PreviewInput({ inp, t, b }: { inp: Inp; t: Template; b: Block }) {
  const box = "flex h-7 items-center justify-between rounded-md border border-[#DDE3EE] bg-[#F8FAFD] px-2 text-[11px] text-[#546478]";
  switch (inp.type) {
    case "rating": return (
      <div className="flex gap-1">{(["Good", "Needs attention", "Needs immediate action"] as Rating[]).map(o => (
        <span key={o} className="flex-1 rounded-md border px-1 py-1 text-center text-[9.5px] leading-3" style={{ borderColor: RATING_COLOR[o] + "55", color: RATING_COLOR[o], fontWeight: 600 }}>{o === "Needs immediate action" ? "Immediate" : o === "Needs attention" ? "Attention" : o}</span>
      ))}</div>);
    case "dropdown": return <div className={box}>{inp.label ? `${inp.label}: ` : ""}{(t.lists[inp.list || ""] || [])[0] || "Select"}<span className="material-icons" style={{ fontSize: 15 }}>expand_more</span></div>;
    case "checkbox": return <div className="flex items-center gap-1.5 text-[11px] text-[#546478]"><span className="material-icons text-[#A9B4C2]" style={{ fontSize: 16 }}>check_box_outline_blank</span>{inp.checkLabel || "Check if YES"}</div>;
    case "number": return <div><div className={box}><span>{inp.label || "Value"}</span><span>— {inp.unit}</span></div>{inp.bands?.length ? <PreviewBands inp={inp} /> : null}</div>;
    case "text": return <div className={box}>Text</div>;
    case "date": return <div className={box}>Date<span className="material-icons" style={{ fontSize: 14 }}>event</span></div>;
    case "notes": return <div className="text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>+ Add technician&rsquo;s note</div>;
    case "calculated": {
      const a = b.inputs.find(i => i.id === inp.of?.[0]), c = b.inputs.find(i => i.id === inp.of?.[1]);
      return <div className="rounded-md bg-[#EBF0F8] px-2 py-1 text-[10.5px] text-[#1A2332]">= {inp.formula === "ratio" ? `${a?.label || "A"} ÷ ${c?.label || "B"} × 100` : inp.formula === "sum" ? `${a?.label || "A"} + ${c?.label || "B"}` : `${a?.label || "A"} − ${c?.label || "B"}`} · {inp.unit}{inp.bands?.length ? <PreviewBands inp={inp} /> : null}</div>;
    }
    case "signature": return <div className="flex h-12 items-end rounded-md border border-dashed border-[#C8D5E8] bg-white px-2 pb-1 text-[10px] text-[#8A97A8]">{inp.signer} signs here</div>;
    case "static": return <div className="text-[10.5px] leading-[14px] text-[#546478]">{t.texts.waiver.replace("{Company name}", "Omega Home Services").slice(0, 140)}…</div>;
  }
}

const RATINGS: Rating[] = ["Good", "Needs attention", "Needs immediate action"];
const RATING_SHORT: Record<Rating, string> = { Good: "Green · Good", "Needs attention": "Amber · Needs attention", "Needs immediate action": "Red · Needs immediate action" };
const lo = (b: Band) => (b.from == null ? -Infinity : b.from);
const hi = (b: Band) => (b.to == null ? Infinity : b.to);
const fmtN = (n: number | null) => (n == null ? "" : String(n));
function rangeText(b: Band, unit?: string) {
  const u = unit ? ` ${unit}` : "";
  if (b.from == null && b.to == null) return "any value";
  if (b.from == null) return `below ${b.to}${u}`;
  if (b.to == null) return `${b.from}${u} and above`;
  return `${b.from}–${b.to}${u}`;
}
// what is wrong with a set of thresholds: overlaps, gaps, empty ranges
function bandProblems(bands: Band[]) {
  const out: string[] = [];
  const s = [...bands].sort((x, y) => lo(x) - lo(y));
  s.forEach(b => { if (lo(b) >= hi(b)) out.push(`${rangeText(b)}: "from" must be below "to"`); });
  for (let i = 1; i < s.length; i++) {
    if (lo(s[i]) < hi(s[i - 1])) out.push(`${rangeText(s[i - 1])} and ${rangeText(s[i])} overlap`);
    else if (lo(s[i]) > hi(s[i - 1])) out.push(`No colour for ${hi(s[i - 1])} to ${lo(s[i])}`);
  }
  if (s.length && lo(s[0]) !== -Infinity) out.push(`No colour below ${lo(s[0])}`);
  if (s.length && hi(s[s.length - 1]) !== Infinity) out.push(`No colour from ${hi(s[s.length - 1])} up`);
  return out;
}
function BandStrip({ bands }: { bands: Band[] }) {
  const s = [...bands].sort((x, y) => lo(x) - lo(y));
  return (
    <span className="ml-1 inline-flex h-2 w-12 overflow-hidden rounded-full" title={s.map(b => `${rangeText(b)}: ${b.result}`).join(" · ")}>
      {s.map((b, i) => <span key={i} className="h-full flex-1" style={{ background: RATING_COLOR[b.result] }} />)}
    </span>
  );
}
function Thresholds({ inp, onChange, ratio }: { inp: Inp; onChange: (b: Band[] | undefined) => void; ratio?: boolean }) {
  const bands = inp.bands || [];
  const sorted = bands.map((b, i) => ({ b, i })).sort((x, y) => lo(x.b) - lo(y.b));
  const problems = bandProblems(bands);
  const set = (i: number, patch: Partial<Band>) => onChange(bands.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const parse = (v: string) => (v.trim() === "" ? null : Number.isFinite(+v) ? +v : null);
  return (
    <div className="mt-2 rounded-md bg-[#F8FAFD] p-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#374151]" style={{ fontWeight: 600 }}>Colour thresholds</span>
        {bands.length > 0 && <BandStrip bands={bands} />}
      </div>
      <div className="mt-0.5 text-[11px] leading-4 text-[#8A97A8]">
        The value turns green, amber or red in the app and on the PDF; amber and red count in the section&rsquo;s badge.
      </div>
      {!bands.length && (
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }} onClick={() => onChange([{ from: null, to: null, result: "Good" }])}>+ Add thresholds</button>
          {ratio && <button className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }} onClick={() => onChange(RATIO_BANDS())}>Use ±10% / ±20%</button>}
        </div>
      )}
      <div className="mt-1.5 space-y-1">
        {sorted.map(({ b, i }) => (
          <div key={i} className="rounded border bg-white p-1.5 text-[12px] text-[#546478]" style={{ borderColor: RATING_COLOR[b.result] + "66" }}>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RATING_COLOR[b.result] }} />
              <Input value={fmtN(b.from)} placeholder="min" onChange={e => set(i, { from: parse(e.target.value) })} className="h-7 w-14 px-1.5 text-[12px]" />
              <span>to under</span>
              <Input value={fmtN(b.to)} placeholder="max" onChange={e => set(i, { to: parse(e.target.value) })} className="h-7 w-14 px-1.5 text-[12px]" />
              <span className="flex-1 truncate">{inp.unit}</span>
              <IconBtn icon="close" title="Remove" onClick={() => onChange(bands.length > 1 ? bands.filter((_, j) => j !== i) : undefined)} />
            </div>
            <select value={b.result} onChange={e => set(i, { result: e.target.value as Rating })} className="mt-1 h-7 w-full rounded border border-[#D8DEE8] px-1 text-[12px]" style={{ color: RATING_COLOR[b.result], fontWeight: 600 }}>
              {RATINGS.map(o => <option key={o} value={o}>{RATING_SHORT[o]}</option>)}
            </select>
          </div>
        ))}
      </div>
      {bands.length > 0 && (
        <>
          <button className="mt-1.5 text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }}
            onClick={() => { const top = bands.reduce((m, b) => Math.max(m, b.to ?? b.from ?? 0), 0); onChange([...bands, { from: top, to: null, result: "Needs attention" }]); }}>+ Add range</button>
          <div className="mt-1 text-[11px] leading-4 text-[#8A97A8]">Leave &ldquo;min&rdquo; empty for &ldquo;below&rdquo;, &ldquo;max&rdquo; empty for &ldquo;and above&rdquo;.</div>
          {problems.length > 0 && (
            <div className="mt-1.5 rounded bg-[#FEF3E2] px-2 py-1.5 text-[11.5px] leading-4 text-[#8A6114]">
              {problems.map(p => <div key={p}>· {p}</div>)}
              <div className="mt-0.5">A value with no colour shows plain. Publish still works.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
function PreviewBands({ inp }: { inp: Inp }) {
  const s = [...(inp.bands || [])].sort((x, y) => lo(x) - lo(y));
  return (
    <div className="mt-1 flex gap-0.5">
      {s.map((b, i) => (
        <span key={i} className="flex-1 rounded px-1 py-0.5 text-center text-[8.5px] leading-3 text-white" style={{ background: RATING_COLOR[b.result] }}>{rangeText(b, inp.type === "calculated" ? inp.unit : inp.unit)}</span>
      ))}
    </div>
  );
}
