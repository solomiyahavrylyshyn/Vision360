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
  /** Financing plans an estimate can offer (Estimate details → Financing). */
  financingPlans: FinancingPlan[];
}

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

/** The small line under the monthly figure. */
export function planLine(plan: FinancingPlan): string {
  if (plan.kind === "percent") return `${plan.percent ?? 0}% of the price per month${plan.lender ? ` · through ${plan.lender}` : ""}`;
  return `through ${plan.lender || "our lender"} · ${plan.apr ?? 0}% APR · ${plan.months ?? 0} mo`;
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
  financing: { enabled: true, lender: "Ally", apr: 7.99, months: 144, minAmount: 1000 },
  financingPlans: [
    { id: "ally-144", name: "Ally — 7.99% APR, 144 months", kind: "apr", lender: "Ally", apr: 7.99, months: 144 },
    { id: "one-percent", name: "1% of the price per month", kind: "percent", percent: 1 },
  ],
};

const listeners = new Set<() => void>();

const normalize = (s: Partial<EstimateSettings>): EstimateSettings => {
  const n = Number(s.defaultValidityDays);
  return {
    defaultValidityDays: Number.isFinite(n) && n >= 0 && n <= 365 ? Math.round(n) : DEFAULT_SETTINGS.defaultValidityDays,
    usesDeposits: typeof s.usesDeposits === "boolean" ? s.usesDeposits : DEFAULT_SETTINGS.usesDeposits,
    financing: s.financing && typeof s.financing === "object"
      ? { ...DEFAULT_SETTINGS.financing, ...s.financing }
      : DEFAULT_SETTINGS.financing,
    financingPlans: Array.isArray(s.financingPlans) && s.financingPlans.length ? s.financingPlans : DEFAULT_SETTINGS.financingPlans,
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
};
