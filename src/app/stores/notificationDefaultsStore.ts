// Company notification defaults (Settings → Company profile → Notifications,
// task 9253 / Figma 178:14957). Same shape as the backend's
// CompanyNotificationDefault: per event key, IsEnabled + IsLocked. An event the
// company locks is what every person gets — their profile shows it read-only.
// A key with no row is enabled and unlocked (the backend's default too).

import { allNotificationEvents } from "../constants/notificationEvents";

export interface NotificationDefault { enabled: boolean; locked: boolean }
type Defaults = Record<string, NotificationDefault>;

const KEY = "vision360.notificationDefaults.v1";
const listeners = new Set<() => void>();

const read = (): Defaults => {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};
let state: Defaults = read();

export const notificationDefaultsStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => state,
  get(key: string): NotificationDefault { return state[key] ?? { enabled: true, locked: false }; },
  set(key: string, patch: Partial<NotificationDefault>) {
    state = { ...state, [key]: { ...notificationDefaultsStore.get(key), ...patch } };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
    listeners.forEach((l) => l());
  },
  keys: () => allNotificationEvents.map((e) => e.key),
};
