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

// Demo field technician (W-03): app on, web off — see technicianPreset.
const TECH_DEMO: TeamMember = { name: "Gary Wells", username: "wells.gary", phone: "+1-813-555-0142", email: "gary@omega-home.com", role: "Technician", rate: "$30/hr", status: "Active" };
// Warranty technician — his role can see all his own jobs in the app, not only dispatched ones.
const WARRANTY_DEMO: TeamMember = { name: "Tom Richards", username: "richards.tom", phone: "+1-813-555-0167", email: "tom@omega-home.com", role: "Warranty Technician", rate: "$32/hr", status: "Active" };
/** Lists saved before these roles existed get the demo technicians. */
const withTechDemo = (list: TeamMember[]): TeamMember[] => {
  let out = list.some((m) => m.role === "Technician" || m.email === TECH_DEMO.email) ? list : [...list, TECH_DEMO];
  if (!out.some((m) => m.email === WARRANTY_DEMO.email)) out = [...out, WARRANTY_DEMO];
  return out;
};

const SEED: TeamMember[] = [
  { name: "Peter Novak", username: "novak.peter", phone: "+1-813-555-0184", email: "peter@omega-home.com", role: "Admin", rate: "$0/hr", status: "Active" },
  { name: "Emily Parker", username: "parker.emily", phone: "+1-234-234-5555", email: "parker.emily@email.com", role: "Employee", rate: "$28/hr", status: "Active" },
  { name: "Elliot Harper", username: "harper.elliot", phone: "+1-813-555-0198", email: "elliot@omega-home.com", role: "Dispatcher", rate: "$32/hr", status: "Active" },
  TECH_DEMO,
  WARRANTY_DEMO,
];

const STORAGE_KEY = "vision360.team.v1";

const read = (): TeamMember[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? withTechDemo(parsed) : SEED;
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
      if (Array.isArray(value) && value.length) {
        const next = withTechDemo(value);
        team = next; cache();
        if (next !== value) sync.persist(team);
        listeners.forEach((l) => l());
      }
    });
    return () => { listeners.delete(listener); };
  },
  getSnapshot: (): TeamMember[] => team,
  /** Replace the list, or derive it from the current one. */
  set: (next: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) =>
    commit(typeof next === "function" ? next(team) : next),
  add: (member: TeamMember) => commit([...team, member]),
};
