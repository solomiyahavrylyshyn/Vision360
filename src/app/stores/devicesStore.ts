// Devices a team member is signed in on (Manage team → row menu → Devices).
// Revoke lets the device send what it still holds, then signs it out; Wipe signs
// it out and clears it now — anything not sent is lost. The server can't know
// what a device hasn't sent yet, so there are no "2 payments, 9 photos not
// sent" counts (Mykola, Nov 5) — only when it was last seen / synced / offline.
import { createSettingsSync } from "./settingsSync";

export type DeviceStatus = "active" | "revoked" | "wiped";

export interface Device {
  id: string;
  memberEmail: string;
  name: string;
  model: string;
  os: string;
  appVersion: string;
  signedInAt: string;
  lastSeenAt: string;
  lastSyncAt: string;
  /** Set while the device is offline. */
  offlineSince?: string;
  status: DeviceStatus;
  changedAt?: string;
}

const today = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };

const SEED: Device[] = [
  { id: "dev-gary", memberEmail: "gary@omega-home.com", name: "Gary's phone", model: "Samsung Galaxy S23", os: "Android 14", appVersion: "1.4.0",
    signedInAt: "2026-10-29T08:10:00", lastSeenAt: today(9, 42), lastSyncAt: today(9, 41), offlineSince: today(10, 12), status: "active" },
  { id: "dev-emily", memberEmail: "parker.emily@email.com", name: "Emily's iPhone", model: "iPhone 15", os: "iOS 18.1", appVersion: "1.4.0",
    signedInAt: "2026-10-21T07:55:00", lastSeenAt: today(10, 31), lastSyncAt: today(10, 31), status: "active" },
];

const KEY = "vision360.devices.v1";
const read = (): Device[] => {
  try { const raw = localStorage.getItem(KEY); const p = raw ? JSON.parse(raw) : null; return Array.isArray(p) ? p : SEED; } catch { return SEED; }
};
let devices: Device[] = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<Device[]>("devices");
const commit = (next: Device[]) => {
  devices = next;
  try { localStorage.setItem(KEY, JSON.stringify(devices)); } catch { /* ignore */ }
  sync.persist(devices);
  listeners.forEach((l) => l());
};
const patch = (id: string, p: Partial<Device>) => commit(devices.map((d) => (d.id === id ? { ...d, ...p } : d)));

export const devicesStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    sync.hydrate(devices, (v) => { if (Array.isArray(v)) { devices = v; try { localStorage.setItem(KEY, JSON.stringify(devices)); } catch { /* ignore */ } listeners.forEach((x) => x()); } });
    return () => listeners.delete(l);
  },
  getSnapshot: () => devices,
  rename: (id: string, name: string) => patch(id, { name }),
  revoke: (id: string) => patch(id, { status: "revoked", changedAt: new Date().toISOString() }),
  allow: (id: string) => patch(id, { status: "active", changedAt: new Date().toISOString() }),
  wipe: (id: string) => patch(id, { status: "wiped", changedAt: new Date().toISOString() }),
};

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** "9:42 AM" today, "Oct 29, 9:42 AM" otherwise. */
export const fmtWhen = (iso: string) => {
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString() ? fmtTime(iso) : `${fmtDay(iso)}, ${fmtTime(iso)}`;
};
