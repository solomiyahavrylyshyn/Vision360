// What the server refused from the technician app (M2-8), office side.
//
// Tom took $250.00 cash on 10511-J01 while his phone was offline. When it got
// signal the server refused the payment: the office had already closed invoice
// 10511-I01 (Linda paid it by card over the phone). The money is real, so the
// app has no Dismiss — the office has to put it somewhere. Until it does, the
// bell, the job and the invoice carry a marker; once it does, the payment
// shows where it landed, both Activity logs say who handled it, and Tom's Sync
// screen turns the row into "Handled by the office".
//
// Kept in this browser tab only (sessionStorage), like a demo: the hub's job in
// production. Nothing is written to the shared demo database; "Demo: start
// over" (or a new tab) brings the case back.

export type Resolution =
  | { kind: "apply"; invoiceKey: string; invoiceNumber: string; by: string; at: string; note: string }
  | { kind: "credit"; by: string; at: string; note: string }
  | { kind: "refund"; by: string; at: string; note: string };

export interface RefusedPayment {
  id: string;
  amount: number;
  method: string;
  technician: string;
  device: string;
  jobKey: string;
  jobNumber: string;
  jobTitle: string;
  client: string;
  /** Route id of the invoice the payment was meant for. */
  invoiceKey: string;
  invoiceNumber: string;
  /** When the technician took the money (offline). */
  takenAt: string;
  /** When the phone got signal and the server refused it. */
  refusedAt: string;
  /** The server's words — the same line the app shows under Not sent. */
  reason: string;
  /** Open invoices of the same client the money can go to. */
  openInvoices: { key: string; number: string; title: string; balance: number }[];
  resolution?: Resolution;
}

const today = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };

const seed = (): RefusedPayment[] => [{
  id: "rp1",
  amount: 250,
  method: "Cash",
  technician: "Tom Richards",
  device: "Samsung Galaxy S23",
  jobKey: "10511-J01",
  jobNumber: "10511-J01",
  jobTitle: "AC Tune-Up",
  client: "Linda Carter",
  invoiceKey: "10511-I01",
  invoiceNumber: "10511-I01",
  takenAt: today(9, 4),
  refusedAt: today(9, 42),
  reason: "The invoice is already paid in full in the office.",
  openInvoices: [{ key: "10511-I02", number: "10511-I02", title: "Maintenance plan · 2 visits", balance: 320 }],
}];

const SKEY = "vision360.syncIssues.v1";
const read = (): RefusedPayment[] => {
  try { const r = sessionStorage.getItem(SKEY); if (r) { const v = JSON.parse(r); if (Array.isArray(v)) return v; } } catch { /* ignore */ }
  return seed();
};
let items: RefusedPayment[] = read();
const listeners = new Set<() => void>();
const emit = () => {
  try { sessionStorage.setItem(SKEY, JSON.stringify(items)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};

export const OFFICE_USER = "Helen Smith";

export const syncIssuesStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => items,
  forJob: (jobKey: string) => items.filter((p) => p.jobKey === jobKey),
  /** Refused payments meant for this invoice, or moved to it. */
  forInvoice: (invoiceKey: string) => items.filter((p) =>
    p.invoiceKey === invoiceKey || (p.resolution?.kind === "apply" && p.resolution.invoiceKey === invoiceKey)),
  resolve(id: string, r: Resolution) {
    items = items.map((p) => (p.id === id ? { ...p, resolution: r } : p));
    emit();
  },
  /** Demo: start the case over. */
  reset() { items = seed(); try { sessionStorage.removeItem(SKEY); } catch { /* ignore */ } listeners.forEach((l) => l()); },
};

export const money2 = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
/** "2026-11-11 09:42" — the invoice Activity log's format. */
export const stampOf = (iso: string) => {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** One line on where the money went — the banner, the bell and both Activity logs use it. */
export function resolutionLine(p: RefusedPayment): string {
  const r = p.resolution; if (!r) return "";
  if (r.kind === "apply") return `Applied to ${r.invoiceNumber}`;
  if (r.kind === "credit") return `Kept as credit for ${p.client}`;
  return `Refunded to ${p.client}`;
}
