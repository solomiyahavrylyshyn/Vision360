import { createSettingsSync } from "./settingsSync";

// Company-level estimate preferences. MVP holds the default validity window used
// to pre-fill an estimate's expiration date (Marek, Jun 11 call: "by default 30
// days... configurable in settings; our salespeople will change this to 3 days").
export interface EstimateSettings {
  /** Days added to the creation date to pre-fill the expiration date. */
  defaultValidityDays: number;
  /** Whether this company asks for deposits on estimates (Figma 261:15834,
   *  "Use deposits"). Off stops new deposits; estimates that already carry
   *  one keep it. */
  usesDeposits: boolean;
  /** Legacy single financing setting — kept so older saved settings load; the
   *  minimum amount still applies to every plan. */
  financing: { enabled: boolean; lender: string; apr: number; months: number; /** Below this the full price leads — nobody finances a $300 repair. */ minAmount: number };
  /** Finance plans an estimate can offer — the company's own list, set up in
   *  Settings → Estimates → Finance plans (Marek, Oct 12). "Full amount" is not a
   *  plan: it's always there. */
  financingPlans: FinancingPlan[];
  /** Set once the company edits its plans, so its list is kept as is. */
  financingPlansEdited?: boolean;
  /** The short line printed at the bottom of every option (Marek, Oct 5): one
   *  field per option, called "Warranty" by default — a company can rename it
   *  ("Guarantee", …). The title and detail pre-fill each new option. */
  optionFooter: OptionFooterSettings;
}

export interface OptionFooterSettings {
  enabled: boolean;
  label: string;
  title: string;
  detail: string;
}

/** Kept short so the option sheet's layout holds (a link can carry the rest). */
export const OPTION_FOOTER_LIMITS = { label: 20, title: 24, detail: 36 } as const;

/** A way the client can pay over time. "apr" is a loan at a rate over a term;
 *  "percent" is the "1% a month" kind: the payment is a share of the price. */
export interface FinancingPlan {
  id: string;
  name: string;
  kind: "apr" | "percent";
  lender?: string;
  apr?: number;
  months?: number;
  percent?: number;
}

/** What one month costs on a plan. */
export function planMonthly(plan: FinancingPlan, total: number): number {
  if (plan.kind === "percent") return total * ((plan.percent ?? 0) / 100);
  return monthlyPayment(total, plan.apr ?? 0, plan.months ?? 0);
}

/** The small line under the monthly figure. No lender or rate: in MVP we don't
 *  offer financing through any provider, and "customer doesn't care which"
 *  (Marek, Oct 8) — it's just the price times the plan's percent. */
export function planLine(plan: FinancingPlan): string {
  if (plan.kind === "percent") return plan.name?.trim() || `${plan.percent ?? 0}% payment plan`;
  return plan.name?.trim() || "payment plan";
}

/** Plans that were offered before (a lender's loan) now read as a % plan. */
const LEGACY_PLANS: Record<string, string> = { "ally-144": "one-25" };

/** The plan behind an id, following ids of plans that are gone. */
export function findPlan(plans: FinancingPlan[], id: string | undefined): FinancingPlan | undefined {
  if (!id) return undefined;
  return plans.find((p) => p.id === id) ?? plans.find((p) => p.id === LEGACY_PLANS[id]);
}

/** Monthly payment on a fixed-rate loan of the whole amount. */
export function monthlyPayment(total: number, apr: number, months: number): number {
  if (total <= 0 || months <= 0) return 0;
  const r = apr / 100 / 12;
  return r === 0 ? total / months : (total * r) / (1 - Math.pow(1 + r, -months));
}

const STORAGE_KEY = "vision360.estimateSettings";
const DEFAULT_SETTINGS: EstimateSettings = {
  defaultValidityDays: 30,
  usesDeposits: true,
  financing: { enabled: true, lender: "", apr: 0, months: 0, minAmount: 1000 },
  // Marek: "financing with 1% payment plan, 1.25… sometimes 1.69%" — a multiplier.
  financingPlans: [
    { id: "one-percent", name: "1% payment plan", kind: "percent", percent: 1 },
    { id: "one-25", name: "1.25% payment plan", kind: "percent", percent: 1.25 },
    { id: "one-69", name: "1.69% payment plan", kind: "percent", percent: 1.69 },
  ],
  optionFooter: { enabled: true, label: "Warranty", title: "1 year labor", detail: "1 year parts" },
};

const DEFAULT_OPTION_FOOTER: OptionFooterSettings = { enabled: true, label: "Warranty", title: "1 year labor", detail: "1 year parts" };

const listeners = new Set<() => void>();

const normalize = (s: Partial<EstimateSettings>): EstimateSettings => {
  const n = Number(s.defaultValidityDays);
  return {
    defaultValidityDays: Number.isFinite(n) && n >= 0 && n <= 365 ? Math.round(n) : DEFAULT_SETTINGS.defaultValidityDays,
    usesDeposits: typeof s.usesDeposits === "boolean" ? s.usesDeposits : DEFAULT_SETTINGS.usesDeposits,
    financing: s.financing && typeof s.financing === "object"
      ? { ...DEFAULT_SETTINGS.financing, ...s.financing }
      : DEFAULT_SETTINGS.financing,
    // A company that edited its plans keeps its list exactly (even empty).
    // Otherwise: saved settings may still hold the old lender plan; only % plans stay.
    financingPlans: s.financingPlansEdited && Array.isArray(s.financingPlans)
      ? s.financingPlans.filter((p) => p?.kind === "percent")
      : Array.isArray(s.financingPlans) && s.financingPlans.some((p) => p?.kind === "percent")
        ? [...DEFAULT_SETTINGS.financingPlans, ...s.financingPlans.filter((p) => p?.kind === "percent" && !DEFAULT_SETTINGS.financingPlans.some((d) => d.id === p.id))]
        : DEFAULT_SETTINGS.financingPlans,
    financingPlansEdited: !!s.financingPlansEdited,
    optionFooter: (() => {
      const f = { ...DEFAULT_OPTION_FOOTER, ...(s.optionFooter ?? {}) };
      return {
        enabled: f.enabled !== false,
        label: (f.label || DEFAULT_OPTION_FOOTER.label).slice(0, OPTION_FOOTER_LIMITS.label),
        title: (f.title ?? "").slice(0, OPTION_FOOTER_LIMITS.title),
        detail: (f.detail ?? "").slice(0, OPTION_FOOTER_LIMITS.detail),
      };
    })(),
  };
};

const read = (): EstimateSettings => {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalize(JSON.parse(raw) as Partial<EstimateSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

let current = read();

const cache = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* quota */ }
};
const sync = createSettingsSync<EstimateSettings>("estimateSettings");
const persist = () => {
  cache();
  sync.persist(current);
};

const notify = () => listeners.forEach((l) => l());

export const estimateSettingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    sync.hydrate(current, (value) => { current = normalize(value); cache(); notify(); });
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  setDefaultValidityDays(days: number) {
    current = normalize({ ...current, defaultValidityDays: days });
    persist();
    notify();
  },
  setUsesDeposits(on: boolean) {
    current = normalize({ ...current, usesDeposits: on });
    persist();
    notify();
  },
  addFinancingPlan(plan: { name: string; percent: number }): FinancingPlan {
    const added: FinancingPlan = { id: `plan-${Date.now().toString(36)}`, kind: "percent", name: plan.name, percent: plan.percent };
    current = normalize({ ...current, financingPlansEdited: true, financingPlans: [...current.financingPlans, added] });
    persist();
    notify();
    return added;
  },
  updateFinancingPlan(id: string, patch: { name?: string; percent?: number }) {
    current = normalize({ ...current, financingPlansEdited: true, financingPlans: current.financingPlans.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    persist();
    notify();
  },
  removeFinancingPlan(id: string) {
    current = normalize({ ...current, financingPlansEdited: true, financingPlans: current.financingPlans.filter((p) => p.id !== id) });
    persist();
    notify();
  },
  setFinancingMinAmount(amount: number) {
    current = normalize({ ...current, financing: { ...current.financing, minAmount: Math.max(0, Math.round(amount) || 0) } });
    persist();
    notify();
  },
  setOptionFooter(patch: Partial<OptionFooterSettings>) {
    current = normalize({ ...current, optionFooter: { ...current.optionFooter, ...patch } });
    persist();
    notify();
  },
};
