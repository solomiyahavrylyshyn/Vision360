// Team members (Settings → Manage team). Kept in one store so the Invite-user
// page, the Edit-user modal and the users table share the same list, and so
// team custom fields (Settings → General → Custom fields → Team) have a record
// to live on. Cached locally and synced through the settings collection.
import { createSettingsSync } from "./settingsSync";

export interface TeamMember {
  name: string;
  username: string;
  phone: string;
  email: string;
  /** Role label, e.g. "Admin", "Employee", "Dispatcher". */
  role: string;
  rate: string;
  status: string;
  /** Custom field values by slot ("0", "1"). */
  customFields?: Record<string, string>;
}

const SEED: TeamMember[] = [
  { name: "Peter Novak", username: "novak.peter", phone: "+1-813-555-0184", email: "peter@omega-home.com", role: "Admin", rate: "$0/hr", status: "Active" },
  { name: "Emily Parker", username: "parker.emily", phone: "+1-234-234-5555", email: "parker.emily@email.com", role: "Employee", rate: "$28/hr", status: "Active" },
  { name: "Elliot Harper", username: "harper.elliot", phone: "+1-813-555-0198", email: "elliot@omega-home.com", role: "Dispatcher", rate: "$32/hr", status: "Active" },
];

const STORAGE_KEY = "vision360.team.v1";

const read = (): TeamMember[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
};

let team: TeamMember[] = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<TeamMember[]>("team");

const cache = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(team)); } catch { /* quota / private mode */ }
};
const commit = (next: TeamMember[]) => {
  team = next;
  cache();
  sync.persist(team);
  listeners.forEach((l) => l());
};

export const teamStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(team, (value) => {
      if (Array.isArray(value) && value.length) { team = value; cache(); listeners.forEach((l) => l()); }
    });
    return () => { listeners.delete(listener); };
  },
  getSnapshot: (): TeamMember[] => team,
  /** Replace the list, or derive it from the current one. */
  set: (next: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) =>
    commit(typeof next === "function" ? next(team) : next),
  add: (member: TeamMember) => commit([...team, member]),
};
