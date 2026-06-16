// Legal documents store — the single source of truth for the company's default
// Terms & Conditions (plus Policies / Privacy), configured in Settings → General
// and attached to estimates & invoices sent to clients. localStorage-backed so
// the configuration survives a refresh. Each doc is either a typed free-text
// block or an uploaded file (name + optional data URL for download/preview).

type Listener = () => void;

export type LegalMode = "file" | "text";
export type LegalDocId = "terms" | "policies" | "privacy";

export interface LegalDoc {
  mode: LegalMode;
  text: string;
  fileName: string | null;
  fileData: string | null; // data URL of the uploaded file (for download / preview)
}

export interface LegalDocsState {
  terms: LegalDoc;
  policies: LegalDoc;
  privacy: LegalDoc;
}

const LS_KEY = "vision360.legalDocs.v1";

// Seeded sample Terms & Conditions so an estimate/invoice shows real terms out of
// the box (and matches the clauses rendered in the customer preview). A matching
// downloadable example lives at /sample-terms-and-conditions.txt for the upload flow.
export const SAMPLE_TERMS = `1. Acceptance of estimate
Approving or signing this estimate constitutes acceptance of these terms and conditions in full.

2. Pricing and validity
Pricing is valid until the expiration date shown on the estimate. Work or materials not listed in the line items are not included and will be estimated separately.

3. Deposits and payment
Where a deposit is required, work is scheduled after the deposit is received. The remaining balance is due upon completion unless otherwise agreed in writing.

4. Changes and cancellations
Changes to the scope of work must be agreed in writing and may affect the price and schedule. Cancellations after materials have been ordered may incur restocking charges.

5. Warranty
Labor is warranted for the period stated in the service agreement. Manufacturer warranties apply to supplied equipment and materials.

6. Liability
The company is not responsible for pre-existing conditions, concealed defects, or damage not caused by its work.`;

const DEFAULT_STATE: LegalDocsState = {
  terms: { mode: "text", text: SAMPLE_TERMS, fileName: null, fileData: null },
  policies: { mode: "text", text: "", fileName: null, fileData: null },
  privacy: { mode: "file", text: "", fileName: null, fileData: null },
};

let state: LegalDocsState = DEFAULT_STATE;
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.terms) state = { ...DEFAULT_STATE, ...parsed };
  }
} catch { /* corrupt cache → keep defaults */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach((l) => l());
const persist = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
};

export const termsStore = {
  getSnapshot: (): LegalDocsState => state,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
  /** Replace the whole legal-docs state (Settings persists all three together). */
  set: (next: LegalDocsState) => {
    state = next;
    persist();
    notify();
  },
  /** Patch a single doc. */
  setDoc: (id: LegalDocId, patch: Partial<LegalDoc>) => {
    state = { ...state, [id]: { ...state[id], ...patch } };
    persist();
    notify();
  },
};

// Has the company configured any Terms & Conditions content to attach?
export const hasTerms = (d: LegalDoc): boolean =>
  d.mode === "text" ? d.text.trim().length > 0 : !!d.fileName;

// Short one-line summary for the estimate/invoice banner.
export const termsSummary = (d: LegalDoc): string => {
  if (!hasTerms(d)) return "No terms configured yet — add them in Settings.";
  if (d.mode === "file") return d.fileName || "Uploaded document";
  const firstLine = d.text.trim().split("\n").find((l) => l.trim());
  return firstLine ? firstLine.replace(/^\d+\.\s*/, "") : "Standard terms apply.";
};
