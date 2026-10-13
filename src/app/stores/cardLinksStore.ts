// Card links (client profile → Billing details → "Send card link"). The only way
// a card gets saved: the office emails the client a link, the client saves a
// card on the public /card/:token page, and it lands in Billing details. Paying
// an invoice by link never saves a card. In production the page is a Stripe
// SetupIntent; the prototype saves the card when the client presses Save card.
import { createSettingsSync } from "./settingsSync";

export type CardLinkStatus = "open" | "used" | "cancelled";

export interface CardLink {
  token: string;
  clientId: string;
  clientName: string;
  sentTo: string;
  sentAt: string;
  status: CardLinkStatus;
}

const STORAGE_KEY = "vision360.cardLinks.v1";

const read = (): CardLink[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let links: CardLink[] = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<CardLink[]>("cardLinks");

const commit = (next: CardLink[]) => {
  links = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch { /* quota / private mode */ }
  sync.persist(links);
  listeners.forEach((l) => l());
};

const newToken = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const cardLinksStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(links, (value) => {
      if (Array.isArray(value)) {
        links = value;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch { /* ignore */ }
        listeners.forEach((l) => l());
      }
    });
    return () => listeners.delete(listener);
  },
  getSnapshot: () => links,
  /** A new link for the client replaces any earlier open one ("This link has expired"). */
  create: (link: Omit<CardLink, "token" | "sentAt" | "status">): CardLink => {
    const cancelled = links.map((l) => (l.status === "open" && l.clientId === link.clientId ? { ...l, status: "cancelled" as const } : l));
    const record: CardLink = { ...link, token: newToken(), sentAt: new Date().toISOString(), status: "open" };
    commit([record, ...cancelled]);
    return record;
  },
  markUsed: (token: string) => commit(links.map((l) => (l.token === token ? { ...l, status: "used" } : l))),
};
