// Payment links (New payment → "Send payment link"). The office sends the
// client a link to pay the selected invoices; the client pays on the public
// /pay/:token page and the payment records itself — nobody waits on the form.
// In production the link is a Stripe page and a webhook records the payment;
// the prototype records it when the client presses Pay. Cached locally and
// synced through the settings collection so the link opens on another device.
import { createSettingsSync } from "./settingsSync";

export type PaymentLinkStatus = "open" | "paid" | "cancelled";

export interface PaymentLink {
  token: string;
  clientName: string;
  /** Invoices the link pays. One invoice may be paid in part; several are paid in full. */
  invoiceIds: number[];
  amount: number;
  sentTo: string;
  /** Phone the link also went to by SMS, if any. */
  smsTo?: string;
  sentAt: string;
  status: PaymentLinkStatus;
  paidAt?: string;
  /** "Visa •••• 4242" — what the client paid with. */
  paidWith?: string;
}

const STORAGE_KEY = "vision360.paymentLinks.v1";

const read = (): PaymentLink[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let links: PaymentLink[] = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<PaymentLink[]>("paymentLinks");

const commit = (next: PaymentLink[]) => {
  links = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch { /* quota / private mode */ }
  sync.persist(links);
  listeners.forEach((l) => l());
};

const newToken = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const paymentLinksStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(links, (value) => {
      if (Array.isArray(value)) {
        links = value;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch { /* ignore */ }
        listeners.forEach((l) => l());
      }
    });
    return () => { listeners.delete(listener); };
  },
  getSnapshot: (): PaymentLink[] => links,
  getByToken: (token: string | undefined) => links.find((l) => l.token === token),
  /** The unpaid link covering this invoice, if one is out. */
  openForInvoice: (invoiceId: number) => links.find((l) => l.status === "open" && l.invoiceIds.includes(invoiceId)),
  create: (link: Omit<PaymentLink, "token" | "sentAt" | "status">): PaymentLink => {
    // A new link for an invoice replaces any earlier open one.
    const cancelled = links.map((l) =>
      l.status === "open" && l.invoiceIds.some((id) => link.invoiceIds.includes(id)) ? { ...l, status: "cancelled" as const } : l);
    const record: PaymentLink = { ...link, token: newToken(), sentAt: new Date().toISOString(), status: "open" };
    commit([record, ...cancelled]);
    return record;
  },
  resend: (token: string) => commit(links.map((l) => (l.token === token ? { ...l, sentAt: new Date().toISOString() } : l))),
  cancel: (token: string) => commit(links.map((l) => (l.token === token ? { ...l, status: "cancelled" } : l))),
  markPaid: (token: string, paidWith: string) =>
    commit(links.map((l) => (l.token === token ? { ...l, status: "paid", paidAt: new Date().toISOString(), paidWith } : l))),
};
