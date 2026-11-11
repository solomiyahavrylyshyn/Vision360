// Roles in Manage team → Roles (M1-19). A role is a named set of permissions —
// every module with its level, plus the Mobile app section (W-03). Editing a
// role writes a line to the role's Activity ("Helen Smith turned off Price book
// in More"). Your own role is read-only: "ask the Owner or another admin".
// Home tiles are not on the role — they're fixed per role (A12, Nov 2).
import { createSettingsSync } from "./settingsSync";
import { teamStore } from "./teamStore";
import {
  adminPreset, employeePreset, technicianPreset, defaultMobileApp,
  type PermissionsState,
} from "../components/PermissionsEditor";

export interface TeamRole { id: string; name: string; builtIn?: boolean; perms: PermissionsState }
export interface RoleActivity { id: string; roleId: string; actor: string; text: string; at: string }

/** The signed-in user (prototype): an admin. Their own role can't be edited by them. */
export const CURRENT_USER = { name: "John Doe", role: "Admin" };

const dispatcherPerms: PermissionsState = {
  ...employeePreset,
  schedule: { enabled: true, level: "editAll" },
  jobs: { enabled: true, level: "viewCreateEdit" },
  clients: { enabled: true, level: "viewCreateEditFull" },
  estimates: { enabled: true, level: "viewOnly" },
  webApp: true,
  mobileApp: { ...defaultMobileApp, enabled: false },
};

// Warranty technicians (Tom Richards) — the role whose "Jobs he sees" Helen switches to
// "All own jobs" so their Scheduled, not-yet-dispatched jobs reach the phone too.
const WARRANTY_ROLE: TeamRole = { id: "warranty", name: "Warranty Technician", perms: technicianPreset };

const SEED_ROLES: TeamRole[] = [
  { id: "admin", name: "Admin", builtIn: true, perms: adminPreset },
  { id: "employee", name: "Employee", builtIn: true, perms: employeePreset },
  { id: "technician", name: "Technician", builtIn: true, perms: technicianPreset },
  { id: "dispatcher", name: "Dispatcher", perms: dispatcherPerms },
  WARRANTY_ROLE,
];
/** Lists saved before the warranty role existed get it added. */
const withWarranty = (roles: TeamRole[]): TeamRole[] => (roles.some((r) => r.id === WARRANTY_ROLE.id) ? roles : [...roles, WARRANTY_ROLE]);

const SEED_ACTIVITY: RoleActivity[] = [
  { id: "ra1", roleId: "technician", actor: "Helen Smith", text: "turned off Price book in More", at: "2026-11-11T10:05:00" },
  { id: "ra2", roleId: "technician", actor: "Helen Smith", text: "turned on Price book in More", at: "2026-11-11T10:07:00" },
];

interface State { roles: TeamRole[]; activity: RoleActivity[] }
const KEY = "vision360.teamRoles.v1";
const read = (): State => {
  try {
    const raw = localStorage.getItem(KEY); const p = raw ? JSON.parse(raw) : null;
    if (p && Array.isArray(p.roles) && p.roles.length) return { roles: withWarranty(p.roles), activity: Array.isArray(p.activity) ? p.activity : [] };
  } catch { /* ignore */ }
  return { roles: SEED_ROLES, activity: SEED_ACTIVITY };
};
let state: State = read();
const listeners = new Set<() => void>();
const sync = createSettingsSync<State>("teamRoles");
const commit = (next: State) => {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  sync.persist(state);
  listeners.forEach((l) => l());
};

export const teamRolesStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    sync.hydrate(state, (v) => {
      if (v && Array.isArray(v.roles) && v.roles.length) { state = { roles: withWarranty(v.roles), activity: v.activity ?? [] }; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } listeners.forEach((x) => x()); }
    });
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  byName: (name: string) => state.roles.find((r) => r.name.toLowerCase() === name.toLowerCase()),
  /** Save a role's permissions; each difference becomes an Activity line. */
  save(roleId: string, perms: PermissionsState, actor = CURRENT_USER.name) {
    const role = state.roles.find((r) => r.id === roleId);
    if (!role) return 0;
    const changes = describeChanges(role.perms, perms);
    const at = new Date().toISOString();
    commit({
      roles: state.roles.map((r) => (r.id === roleId ? { ...r, perms } : r)),
      activity: [...changes.map((text, i) => ({ id: `ra${Date.now()}-${i}`, roleId, actor, text, at })), ...state.activity],
    });
    return changes.length;
  },
};

// ── Human-readable differences ───────────────────────────────────────────────
const MODULES: { key: keyof PermissionsState; name: string }[] = [
  { key: "schedule", name: "Schedule" }, { key: "timeTracking", name: "Time tracking" }, { key: "notes", name: "Notes" },
  { key: "expenses", name: "Expenses" }, { key: "items", name: "Items" }, { key: "clients", name: "Clients and properties" },
  { key: "estimates", name: "Estimates" }, { key: "jobs", name: "Jobs" }, { key: "invoices", name: "Invoices" }, { key: "payments", name: "Payments" },
];
const FLAGS: { key: keyof PermissionsState; name: string }[] = [
  { key: "jobCosting", name: "Show job profit" }, { key: "adjustPrice", name: "Adjust price" },
  { key: "clientCommunications", name: "Client communications" }, { key: "reports", name: "Reports" },
  { key: "webApp", name: "Can use the web app" }, { key: "setInvoiceStatus", name: "Set invoice status by hand" },
];
const onOff = (v: boolean) => (v ? "turned on" : "turned off");
const PHOTO = { fast: "Fast upload", balanced: "Balanced", high: "High detail" } as const;

export function describeChanges(a: PermissionsState, b: PermissionsState): string[] {
  const out: string[] = [];
  for (const m of MODULES) {
    const x = a[m.key] as { enabled: boolean; level: string }, y = b[m.key] as { enabled: boolean; level: string };
    if (!x || !y) continue;
    if (x.enabled !== y.enabled) out.push(`${onOff(y.enabled)} ${m.name}`);
    else if (y.enabled && x.level !== y.level) out.push(`changed the ${m.name} level`);
  }
  for (const f of FLAGS) if (!!a[f.key] !== !!b[f.key]) out.push(`${onOff(!!b[f.key])} ${f.name}`);
  const ma = a.mobileApp ?? defaultMobileApp, mb = b.mobileApp ?? defaultMobileApp;
  if (ma.enabled !== mb.enabled) out.push(`${onOff(mb.enabled)} Can use the technician app`);
  if (ma.jobsScope !== mb.jobsScope) out.push(`set Jobs in the app to ${mb.jobsScope === "active" ? "Active jobs only" : "All own jobs"}`);
  if (ma.modules.mySchedule !== mb.modules.mySchedule) out.push(`${onOff(mb.modules.mySchedule)} My schedule in More`);
  if (ma.modules.priceBook !== mb.modules.priceBook) out.push(`${onOff(mb.modules.priceBook)} Price book in More`);
  if (ma.photoQuality !== mb.photoQuality) out.push(`set Photo upload quality to ${PHOTO[mb.photoQuality]}`);
  if (ma.language !== mb.language) out.push(`set the app language to ${mb.language === "en" ? "English" : "Spanish"}`);
  return out;
}

export const fmtActivityAt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// ── Web sign-in gate ─────────────────────────────────────────────────────────
/** The team member signing in with this email, when their role has "Can use the web app" off —
 *  they get the "Your role uses the Vision360 technician app" page instead of the web app. */
export function appOnlyMember(email: string) {
  const m = teamStore.getSnapshot().find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!m) return null;
  const role = teamRolesStore.byName(m.role);
  return role && role.perms.webApp === false ? { name: m.name, email: m.email, role: role.name } : null;
}
