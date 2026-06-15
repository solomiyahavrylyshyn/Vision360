// Tracks whether the user finished Company Setup during onboarding. Skipping
// setup is non-blocking (AUTH-2) — the user lands in the app immediately — but
// we then nudge them to finish via a bell notification and a dismissible banner
// (AUTH-3). Persisted to localStorage so the choice survives refreshes.
//
// Default is "complete": a fresh/seeded session is NOT nagged. The reminders
// only switch on once the user explicitly skips setup.

type SetupState = { complete: boolean; bannerDismissed: boolean };

const INCOMPLETE_KEY = "vision360_setup_incomplete";
const BANNER_KEY = "vision360_setup_banner_dismissed";

const listeners = new Set<() => void>();

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const readFlag = (key: string) => canUseStorage() && window.localStorage.getItem(key) === "1";

// useSyncExternalStore needs a stable reference between unchanged reads, so we
// cache the snapshot object and only rebuild it when a value actually changes.
let snapshot: SetupState = {
  complete: !readFlag(INCOMPLETE_KEY),
  bannerDismissed: readFlag(BANNER_KEY),
};

const rebuild = () => {
  snapshot = {
    complete: !readFlag(INCOMPLETE_KEY),
    bannerDismissed: readFlag(BANNER_KEY),
  };
  listeners.forEach((l) => l());
};

const writeFlag = (key: string, on: boolean) => {
  if (canUseStorage()) {
    if (on) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  }
  rebuild();
};

export const setupStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): SetupState {
    return snapshot;
  },
  // Full onboarding finished (or finished later from Settings) → stop nagging.
  markComplete() {
    writeFlag(INCOMPLETE_KEY, false);
  },
  // User skipped setup → start nagging (bell + banner).
  markIncomplete() {
    writeFlag(INCOMPLETE_KEY, true);
  },
  // "Don't show again" on the banner — hides the banner but keeps the bell item
  // until setup is actually completed.
  dismissBanner() {
    writeFlag(BANNER_KEY, true);
  },
};
