type TrialState = {
  signupAt: string;
  expiresAt: string;
  activatedAt: string | null;
};

const TRIAL_STORAGE_KEY = "vision360_trial_state";
const TRIAL_DAYS = 7;

const listeners = new Set<() => void>();
let cachedTrial: TrialState | null | undefined;

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const readStoredTrial = (): TrialState | null => {
  if (cachedTrial !== undefined) return cachedTrial;
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!raw) {
      cachedTrial = null;
      return cachedTrial;
    }
    const parsed = JSON.parse(raw) as TrialState;
    cachedTrial = parsed.signupAt && parsed.expiresAt ? parsed : null;
    return cachedTrial;
  } catch {
    cachedTrial = null;
    return null;
  }
};

const writeStoredTrial = (state: TrialState) => {
  cachedTrial = state;
  if (canUseStorage()) {
    window.localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((listener) => listener());
};

const createTrialState = (signupDate = new Date()): TrialState => ({
  signupAt: signupDate.toISOString(),
  expiresAt: addDays(signupDate, TRIAL_DAYS).toISOString(),
  activatedAt: null,
});

export const trialStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): TrialState | null {
    return readStoredTrial();
  },
  startTrial() {
    const next = createTrialState();
    writeStoredTrial(next);
    return next;
  },
  startTrialIfMissing() {
    const existing = readStoredTrial();
    if (existing) return existing;
    const next = createTrialState();
    writeStoredTrial(next);
    return next;
  },
  activateSubscription() {
    const current = readStoredTrial() || createTrialState();
    writeStoredTrial({ ...current, activatedAt: new Date().toISOString() });
  },
};

export const isTrialActive = (trial: TrialState | null) => {
  if (!trial || trial.activatedAt) return false;
  return new Date(trial.expiresAt).getTime() >= Date.now();
};

export const formatTrialDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(isoDate));

export const getTrialDaysRemaining = (trial: TrialState | null) => {
  if (!trial || trial.activatedAt) return 0;
  const msRemaining = new Date(trial.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
};
