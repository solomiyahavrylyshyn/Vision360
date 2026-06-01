// Dismissals store — persists "not a duplicate" and "keep both" decisions so
// dismissed pairs are excluded from future duplicate scans.
// Keyed by a canonical pair key "minId_maxId".

type Listener = () => void;

export type DismissalReason = "not_duplicate" | "keep_both";

export interface Dismissal {
  id: string;           // canonical pair key: `${minId}_${maxId}`
  clientIdA: string;
  clientIdB: string;
  reason: DismissalReason;
  dismissedBy: string;
  dismissedAt: string;  // ISO timestamp
}

const LS_KEY = "vision360.dismissals.v1";

let dismissals: Dismissal[] = [];
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) dismissals = parsed;
  }
} catch { /* corrupt cache → start empty */ }

let listeners: Listener[] = [];
const notify = () => listeners.forEach(l => l());
const saveLS = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(dismissals)); } catch { /* quota */ }
};

export const pairKey = (a: string, b: string) => {
  const [lo, hi] = [a, b].sort();
  return `${lo}_${hi}`;
};

export const dismissalsStore = {
  getSnapshot: (): Dismissal[] => dismissals,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  isDismissed: (a: string, b: string): boolean =>
    dismissals.some(d => d.id === pairKey(a, b)),
  add: (a: string, b: string, reason: DismissalReason, by = "You") => {
    const id = pairKey(a, b);
    if (dismissals.some(d => d.id === id)) return; // already dismissed
    const [lo, hi] = [a, b].sort();
    dismissals = [...dismissals, {
      id, clientIdA: lo, clientIdB: hi, reason, dismissedBy: by,
      dismissedAt: new Date().toISOString(),
    }];
    saveLS();
    notify();
  },
  remove: (a: string, b: string) => {
    const id = pairKey(a, b);
    dismissals = dismissals.filter(d => d.id !== id);
    saveLS();
    notify();
  },
};
