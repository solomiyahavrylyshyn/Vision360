import { createSettingsSync } from "./settingsSync";

// Custom notes — company text written once in Settings and copied into each new
// document as its starting point (PRD §9.6; behaviour spec "Vision360 Custom
// Notes"). A document keeps its own copy from the moment it is created, so a
// later change here only reaches documents created after it.
//
//   invoiceNote  Settings → Invoices → Notes on invoice → Invoice fine print
//   receiptNote  Settings → Invoices → Receipt note (also Finance → Notes on receipt)
//   jobNotes     Settings → Jobs → Notes on Jobs — titled blocks a job sheet
//                prints; "include by default" ones are pre-ticked on a new job.

export const NOTE_LIMIT = 500;
export const NOTE_WARN_AT = 450;

export interface JobNoteBlock {
  id: string;
  title: string;
  body: string;
  /** Pre-ticked on every job; otherwise offered as an option. */
  includeByDefault: boolean;
}

export interface NoteDefaults {
  invoiceNote: string;
  receiptNote: string;
  jobNotes: JobNoteBlock[];
}

const DEFAULTS: NoteDefaults = {
  invoiceNote: "Thank you for your business! Equipment remains property of Omega Home Services until the invoice is paid in full.",
  receiptNote: "Paid in full. Thank you for your business.",
  jobNotes: [
    { id: "jn1", title: "Authorization to proceed", includeByDefault: true,
      body: "I authorize Omega Home Services to perform the work described above and accept full responsibility for the agreed amount." },
    { id: "jn2", title: "Pets and access", includeByDefault: true,
      body: "Please secure pets and clear access to the unit before the technician arrives." },
    { id: "jn3", title: "Mold disclaimer", includeByDefault: false,
      body: "Omega Home Services is not responsible for pre-existing mold found during the work." },
  ],
};

const STORAGE_KEY = "vision360.noteDefaults.v1";
const clip = (s: unknown, fallback: string) =>
  (typeof s === "string" ? s : fallback).slice(0, NOTE_LIMIT);

const normalize = (v: Partial<NoteDefaults> | null | undefined): NoteDefaults => ({
  invoiceNote: clip(v?.invoiceNote, DEFAULTS.invoiceNote),
  receiptNote: clip(v?.receiptNote, DEFAULTS.receiptNote),
  jobNotes: Array.isArray(v?.jobNotes)
    ? v!.jobNotes.map((n, i) => ({
        id: typeof n?.id === "string" && n.id ? n.id : `jn${Date.now()}${i}`,
        title: typeof n?.title === "string" ? n.title : "",
        body: clip(n?.body, ""),
        includeByDefault: !!n?.includeByDefault,
      }))
    : DEFAULTS.jobNotes,
});

const read = (): NoteDefaults => {
  if (typeof localStorage === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

let current = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<NoteDefaults>("noteDefaults");

const commit = (next: NoteDefaults) => {
  current = normalize(next);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* quota */ }
  sync.persist(current);
  listeners.forEach((l) => l());
};

export const noteDefaultsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(current, (value) => {
      current = normalize(value);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* quota */ }
      listeners.forEach((l) => l());
    });
    return () => { listeners.delete(listener); };
  },
  getSnapshot: (): NoteDefaults => current,
  setInvoiceNote: (text: string) => commit({ ...current, invoiceNote: text }),
  setReceiptNote: (text: string) => commit({ ...current, receiptNote: text }),
  addJobNote: () => commit({
    ...current,
    jobNotes: [...current.jobNotes, { id: `jn${Date.now()}`, title: "New note", body: "", includeByDefault: false }],
  }),
  updateJobNote: (id: string, patch: Partial<Omit<JobNoteBlock, "id">>) => commit({
    ...current,
    jobNotes: current.jobNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
  }),
  removeJobNote: (id: string) => commit({ ...current, jobNotes: current.jobNotes.filter((n) => n.id !== id) }),
  /** Ids a new job's sheet starts with. */
  defaultJobNoteIds: (): string[] => current.jobNotes.filter((n) => n.includeByDefault).map((n) => n.id),
};
