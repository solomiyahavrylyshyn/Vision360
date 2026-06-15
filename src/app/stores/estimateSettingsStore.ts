// Company-level estimate preferences. MVP holds the default validity window used
// to pre-fill an estimate's expiration date (Marek, Jun 11 call: "by default 30
// days... configurable in settings; our salespeople will change this to 3 days").
export interface EstimateSettings {
  /** Days added to the creation date to pre-fill the expiration date. */
  defaultValidityDays: number;
}

const STORAGE_KEY = "vision360.estimateSettings";
const DEFAULT_SETTINGS: EstimateSettings = {
  defaultValidityDays: 30,
};

const listeners = new Set<() => void>();

const normalize = (s: Partial<EstimateSettings>): EstimateSettings => {
  const n = Number(s.defaultValidityDays);
  return {
    defaultValidityDays: Number.isFinite(n) && n >= 0 && n <= 365 ? Math.round(n) : DEFAULT_SETTINGS.defaultValidityDays,
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

const persist = () => {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* quota */ }
};

const notify = () => listeners.forEach((l) => l());

export const estimateSettingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  setDefaultValidityDays(days: number) {
    current = normalize({ defaultValidityDays: days });
    persist();
    notify();
  },
};
