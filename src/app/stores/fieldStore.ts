// What the technician app tells the office (M3-3 / M3-4 / M3-8 / M3-9, M4-7b).
//
// • fieldSettingsStore — Settings → Jobs → In the field: start a job only at the
//   address (+ distance) and the "hasn't tapped En route" reminder (+ minutes).
// • fieldLiveStore — the live state the schedule board shows, pushed by the hub
//   in production: each technician's status in the lane header, the phone's last
//   contact, pause reasons and the small flags on job cards. The prototype seeds
//   it and has a demo button ("Demo: Tom taps En route") that changes it without
//   a reload — that's how the hub will look.
import { createSettingsSync } from "./settingsSync";

// ── Settings ─────────────────────────────────────────────────────────────────
export interface FieldSettings {
  /** M3-4 — off by default for a new company. */
  startAtAddressOnly: boolean;
  /** Feet, whole number 50–1,000. */
  startRadiusFt: number;
  /** M3-8 */
  remindEnRoute: boolean;
  /** Minutes after the job's start time, 5–240. */
  remindAfterMin: number;
}
export const FIELD_LIMITS = { radius: [50, 1000], remind: [5, 240] } as const;
const DEFAULT_FIELD: FieldSettings = { startAtAddressOnly: false, startRadiusFt: 100, remindEnRoute: true, remindAfterMin: 30 };
const FKEY = "vision360.fieldSettings.v1";
const readField = (): FieldSettings => { try { const r = localStorage.getItem(FKEY); return r ? { ...DEFAULT_FIELD, ...JSON.parse(r) } : DEFAULT_FIELD; } catch { return DEFAULT_FIELD; } };
let field = readField();
const fListeners = new Set<() => void>();
const fSync = createSettingsSync<FieldSettings>("fieldSettings");
export const fieldSettingsStore = {
  subscribe(l: () => void) {
    fListeners.add(l);
    fSync.hydrate(field, (v) => { if (v && typeof v === "object") { field = { ...DEFAULT_FIELD, ...(v as FieldSettings) }; try { localStorage.setItem(FKEY, JSON.stringify(field)); } catch { /* ignore */ } fListeners.forEach((x) => x()); } });
    return () => fListeners.delete(l);
  },
  getSnapshot: () => field,
  update(p: Partial<FieldSettings>) {
    field = { ...field, ...p };
    try { localStorage.setItem(FKEY, JSON.stringify(field)); } catch { /* ignore */ }
    fSync.persist(field);
    fListeners.forEach((l) => l());
  },
};

// ── Live state (in memory — the hub's job in production) ────────────────────
export type TechState = "enRoute" | "working" | "paused" | "idle";
export interface TechLive {
  state: TechState;
  jobNumber?: string;
  /** When the state began (ISO). */
  since: string;
  pauseReason?: string;
  /** Last time the phone reached the server (ISO). Over 10 minutes → shown grey. */
  lastContact: string;
}
export type FlagKind = "noEnRoute" | "outsideRadius" | "afterCompletion";
export interface CardFlag { id: string; jobId: number; kind: FlagKind; at: string; feet?: number; seen?: boolean }

const at = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const nowIso = () => new Date().toISOString();

interface Live { techs: Record<string, TechLive>; flags: CardFlag[]; pauseReasons: Record<number, string> }
let live: Live = {
  techs: {
    tom: { state: "idle", since: at(7, 30), lastContact: nowIso() },
    maria: { state: "paused", since: at(12, 0), pauseReason: "Lunch", lastContact: nowIso() },
    mike: { state: "idle", since: at(11, 40), lastContact: nowIso() },
    travis: { state: "working", jobNumber: "10498-J01", since: at(11, 35), lastContact: nowIso() },
    james: { state: "working", jobNumber: "10477-J03", since: at(7, 20), lastContact: at(7, 40) },
    // Peter's phone went quiet at 10:12 — Reassign / Cancel on his jobs warn first.
    peter: { state: "working", jobNumber: "10501-J01", since: at(9, 58), lastContact: at(10, 12) },
  },
  flags: [
    { id: "f1", jobId: 1, kind: "noEnRoute", at: at(8, 30) },
    { id: "f2", jobId: 6, kind: "outsideRadius", feet: 180, at: at(11, 34) },
    { id: "f3", jobId: 4, kind: "afterCompletion", at: at(17, 20) },
  ],
  // Board demo job 8 (Maria, Brown Home) is paused for lunch.
  pauseReasons: { 8: "Lunch" },
};
const lListeners = new Set<() => void>();
const emit = (next: Live) => { live = next; lListeners.forEach((l) => l()); };

export const fieldLiveStore = {
  subscribe(l: () => void) { lListeners.add(l); return () => lListeners.delete(l); },
  getSnapshot: () => live,
  setTech: (id: string, t: Partial<TechLive>) => emit({ ...live, techs: { ...live.techs, [id]: { ...(live.techs[id] ?? { state: "idle", since: nowIso(), lastContact: nowIso() }), ...t } } }),
  markSeen: (flagId: string) => emit({ ...live, flags: live.flags.map((f) => (f.id === flagId ? { ...f, seen: true } : f)) }),
};

export const OFFLINE_AFTER_MS = 10 * 60 * 1000;
export const isOffline = (t?: TechLive) => !!t && Date.now() - new Date(t.lastContact).getTime() > OFFLINE_AFTER_MS;
export const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** The lane-header line: "En route · 10512-J02 · 7:45 AM", "Paused · Lunch · since 12:00 PM", "Idle since 11:40 AM". */
export function techLine(t?: TechLive): string | null {
  if (!t) return null;
  if (t.state === "enRoute") return `En route · ${t.jobNumber ?? ""}${t.jobNumber ? " · " : ""}${clock(t.since)}`;
  if (t.state === "working") return `In progress · ${t.jobNumber ?? ""}${t.jobNumber ? " · " : ""}since ${clock(t.since)}`;
  if (t.state === "paused") return `Paused${t.pauseReason ? ` · ${t.pauseReason}` : ""} · since ${clock(t.since)}`;
  return `Idle since ${clock(t.since)}`;
}

export function flagText(f: CardFlag, s: FieldSettings): string {
  if (f.kind === "noEnRoute") return `No En route · ${s.remindAfterMin} min`;
  if (f.kind === "outsideRadius") return `Started outside the radius · ${f.feet ?? s.startRadiusFt} ft`;
  return "Added from the device after completion";
}
