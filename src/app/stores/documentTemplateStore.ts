import { createSettingsSync } from "./settingsSync";

// Which paper the estimate and invoice PDFs are laid out for (FR-5.15: templates
// in Letter and Legal sizes; colours follow Company profile → Brand assets, the
// fields never move). Chosen in Settings → Estimates / Invoices → templates and
// read by the document preview, print and PDF.

export type PaperSize = "letter" | "legal";
export type DocumentKind = "estimate" | "invoice";

export interface PaperSpec {
  id: PaperSize;
  name: string;
  description: string;
  /** Portrait dimensions in inches. Landscape sheets swap them. */
  widthIn: number;
  heightIn: number;
}

export const PAPER_SIZES: PaperSpec[] = [
  { id: "letter", name: "Letter", description: "8.5 × 11 in — the US default for letters and statements.", widthIn: 8.5, heightIn: 11 },
  { id: "legal", name: "Legal", description: "8.5 × 14 in — three extra inches for long item lists and terms.", widthIn: 8.5, heightIn: 14 },
];

export const paperSpec = (id: PaperSize): PaperSpec => PAPER_SIZES.find((p) => p.id === id) ?? PAPER_SIZES[0];

type Settings = Record<DocumentKind, PaperSize>;

const STORAGE_KEY = "vision360.documentTemplates";
const DEFAULTS: Settings = { estimate: "letter", invoice: "letter" };

const listeners = new Set<() => void>();

const isPaper = (v: unknown): v is PaperSize => v === "letter" || v === "legal";

const normalize = (s: Partial<Record<DocumentKind, unknown>> | null | undefined): Settings => ({
  estimate: isPaper(s?.estimate) ? s.estimate : DEFAULTS.estimate,
  invoice: isPaper(s?.invoice) ? s.invoice : DEFAULTS.invoice,
});

const read = (): Settings => {
  if (typeof localStorage === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

let current = read();

// Same contract as the other settings stores: the local cache answers first,
// the shared row in Postgres makes the choice the company's rather than this
// browser's.
const cache = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* quota */ }
};
const sync = createSettingsSync<Settings>("documentTemplates");
const persist = () => {
  cache();
  sync.persist(current);
};
const notify = () => listeners.forEach((l) => l());

export const documentTemplateStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(current, (value) => { current = normalize(value); cache(); notify(); });
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  setPaperSize(kind: DocumentKind, size: PaperSize) {
    if (current[kind] === size) return;
    current = { ...current, [kind]: size };
    persist();
    notify();
  },
};
