// The client signs for a job (9355 / 8932, Figma "client - job - …").
//
// Two moments: before work starts ("start") and on completion ("completion").
// Each is switched on in Settings → System preferences → Jobs → Signature
// Settings. What the client agrees to is the note picked for that moment in
// Notes on Jobs. The office emails a link from the job page; the client signs on
// the public /j/:token page by typing the full name. With a moment switched on,
// the job can't move to In progress (start) / Completed (completion) unsigned.
import { createSettingsSync } from "./settingsSync";

export type SignMoment = "start" | "completion";

export const MOMENT_LABEL: Record<SignMoment, string> = {
  start: "Before work starts",
  completion: "On completion",
};

// ── Settings ────────────────────────────────────────────────────────────────

export interface JobNote { id: string; title: string; body: string; moment: SignMoment }

export interface JobSignSettings {
  requireBeforeStart: boolean;
  requireOnCompletion: boolean;
  notes: JobNote[];
}

const SETTINGS_KEY = "vision360.jobSignSettings.v1";
// Off by default: with both switches off statuses move exactly as before (8932).
const DEFAULT_SETTINGS: JobSignSettings = {
  requireBeforeStart: false,
  requireOnCompletion: false,
  notes: [
    { id: "jn1", title: "Authorization to Proceed", moment: "start",
      body: "I authorize Omega Home Services to perform the work described above and accept full responsibility for the agreed amount." },
    { id: "jn2", title: "Completion sign-off", moment: "completion",
      body: "I confirm that the work described above is done and the technician walked me through it." },
  ],
};

const readSettings = (): JobSignSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.notes) ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

let settings: JobSignSettings = readSettings();
const settingsListeners = new Set<() => void>();
const settingsSync = createSettingsSync<JobSignSettings>("jobSignSettings");

export const jobSignSettingsStore = {
  subscribe(l: () => void) {
    settingsListeners.add(l);
    settingsSync.hydrate(settings, (value) => {
      if (value && Array.isArray((value as JobSignSettings).notes)) {
        settings = { ...DEFAULT_SETTINGS, ...(value as JobSignSettings) };
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
        settingsListeners.forEach((x) => x());
      }
    });
    return () => settingsListeners.delete(l);
  },
  getSnapshot: () => settings,
  update(patch: Partial<JobSignSettings>) {
    settings = { ...settings, ...patch };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    settingsSync.persist(settings);
    settingsListeners.forEach((l) => l());
  },
};

export const isRequired = (s: JobSignSettings, m: SignMoment) => (m === "start" ? s.requireBeforeStart : s.requireOnCompletion);

/** The notes shown to the client for a moment; none → a plain default text. */
export function notesFor(s: JobSignSettings, m: SignMoment, company: string): { title: string; body: string }[] {
  const picked = s.notes.filter((n) => n.moment === m && (n.title.trim() || n.body.trim()));
  if (picked.length) return picked.map((n) => ({ title: n.title.trim() || (m === "start" ? "Authorization to proceed" : "Completion sign-off"), body: n.body }));
  return m === "start"
    ? [{ title: "Authorization to proceed", body: `I authorize ${company} to do the work described above.` }]
    : [{ title: "Completion sign-off", body: "I confirm that the work described above is done." }];
}

// ── Links and signatures ────────────────────────────────────────────────────

/** What the page shows — taken from the job when the link is sent. */
export interface JobSnapshot {
  jobNumber: string;
  title: string;
  clientName: string;
  address: string;
  technician: string;
  dateLabel: string;
  timeLabel: string;
  description: string;
  items: { name: string; description: string; quantity: number; unitPrice: number; tax: number; amount: number }[];
  total: number;
}

export interface JobSignLink {
  token: string;
  /** The job page id (route param) — store jobs and demo jobs alike. */
  jobKey: string;
  moment: SignMoment;
  sentTo: string;
  sentAt: string;
  status: "open" | "signed" | "cancelled";
  job: JobSnapshot;
  signedBy?: string;
  signedAt?: string;
  /** "27.95, -82.46" or "not shared". */
  location?: string;
}

const LINKS_KEY = "vision360.jobSignLinks.v1";
const readLinks = (): JobSignLink[] => {
  try { const raw = localStorage.getItem(LINKS_KEY); const p = raw ? JSON.parse(raw) : null; return Array.isArray(p) ? p : []; } catch { return []; }
};
let links: JobSignLink[] = readLinks();
const linkListeners = new Set<() => void>();
const linksSync = createSettingsSync<JobSignLink[]>("jobSignLinks");
const commit = (next: JobSignLink[]) => {
  links = next;
  try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); } catch { /* ignore */ }
  linksSync.persist(links);
  linkListeners.forEach((l) => l());
};
const newToken = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const jobSignLinksStore = {
  subscribe(l: () => void) {
    linkListeners.add(l);
    linksSync.hydrate(links, (value) => {
      if (Array.isArray(value)) {
        links = value;
        try { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); } catch { /* ignore */ }
        linkListeners.forEach((x) => x());
      }
    });
    return () => linkListeners.delete(l);
  },
  getSnapshot: () => links,
  byToken: (token: string) => links.find((l) => l.token === token),
  /** The current state of a moment on a job: the signed link if any, else the latest one sent. */
  current(jobKey: string, moment: SignMoment): JobSignLink | undefined {
    const mine = links.filter((l) => l.jobKey === jobKey && l.moment === moment);
    return mine.find((l) => l.status === "signed") ?? mine.filter((l) => l.status === "open").sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
  },
  /** A new link replaces an earlier open one for the same job and moment (it then reads "expired"). */
  send(input: { jobKey: string; moment: SignMoment; sentTo: string; job: JobSnapshot }): JobSignLink {
    const record: JobSignLink = { ...input, token: newToken(), sentAt: new Date().toISOString(), status: "open" };
    commit([...links.map((l) => (l.status === "open" && l.jobKey === input.jobKey && l.moment === input.moment ? { ...l, status: "cancelled" as const } : l)), record]);
    return record;
  },
  sign(token: string, name: string, location: string) {
    commit(links.map((l) => (l.token === token ? { ...l, status: "signed" as const, signedBy: name, signedAt: new Date().toISOString(), location } : l)));
  },
};

export const signLinkUrl = (token: string) => `${window.location.origin}/j/${token}`;

/** What is missing before a job may move to `next`, or null when nothing is. */
export function missingSignature(jobKey: string, next: string): SignMoment | null {
  const s = settings;
  const signed = (m: SignMoment) => jobSignLinksStore.current(jobKey, m)?.status === "signed";
  if (next === "In Progress" && s.requireBeforeStart && !signed("start")) return "start";
  if (next === "Completed" && s.requireOnCompletion && !signed("completion")) return "completion";
  return null;
}

export const missingMessage = (m: SignMoment, client: string) =>
  m === "start"
    ? { title: "Can't start the job yet", body: `${client || "The client"} hasn't signed the authorization to proceed.` }
    : { title: "Can't complete the job yet", body: `${client || "The client"} hasn't signed off the work.` };

export const fmtSignedAt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
