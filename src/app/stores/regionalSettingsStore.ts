export type DateFormatOption = "MM-DD-YYYY" | "DD-MM-YYYY" | "YYYY-MM-DD" | "MMM D, YYYY";
export type TimeFormatOption = "12h" | "24h";

export interface RegionalSettings {
  country: string;
  language: string;
  timeZone: string;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
  firstDayOfWeek: "Sunday" | "Monday";
}

const STORAGE_KEY = "vision360.regionalSettings";

export const DEFAULT_REGIONAL_SETTINGS: RegionalSettings = {
  country: "United States",
  language: "English",
  timeZone: "America/New_York",
  // Default to long-form American ("May 31, 2026") so dates read naturally
  // across the app. Users can switch to MM-DD-YYYY / DD-MM-YYYY / YYYY-MM-DD
  // in Settings → Localization.
  dateFormat: "MMM D, YYYY",
  timeFormat: "12h",
  firstDayOfWeek: "Sunday",
};

const listeners = new Set<() => void>();

const isValidDateFormat = (value: unknown): value is DateFormatOption =>
  value === "MM-DD-YYYY" || value === "DD-MM-YYYY" || value === "YYYY-MM-DD" || value === "MMM D, YYYY";

const isValidTimeFormat = (value: unknown): value is TimeFormatOption => value === "12h" || value === "24h";

const SUPPORTED_LANGUAGES = ["English", "Spanish", "Portuguese", "French", "German", "Danish", "Dutch"];

const normalizeSettings = (settings: Partial<RegionalSettings>): RegionalSettings => ({
  country: settings.country || DEFAULT_REGIONAL_SETTINGS.country,
  language: SUPPORTED_LANGUAGES.includes(settings.language || "") ? (settings.language as string) : DEFAULT_REGIONAL_SETTINGS.language,
  timeZone: settings.timeZone || DEFAULT_REGIONAL_SETTINGS.timeZone,
  dateFormat: isValidDateFormat(settings.dateFormat) ? settings.dateFormat : DEFAULT_REGIONAL_SETTINGS.dateFormat,
  timeFormat: isValidTimeFormat(settings.timeFormat) ? settings.timeFormat : DEFAULT_REGIONAL_SETTINGS.timeFormat,
  firstDayOfWeek: settings.firstDayOfWeek === "Monday" ? "Monday" : DEFAULT_REGIONAL_SETTINGS.firstDayOfWeek,
});

const readSettings = (): RegionalSettings => {
  if (typeof localStorage === "undefined") return DEFAULT_REGIONAL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REGIONAL_SETTINGS;
    return normalizeSettings(JSON.parse(raw) as Partial<RegionalSettings>);
  } catch {
    return DEFAULT_REGIONAL_SETTINGS;
  }
};

let currentSettings = readSettings();

const persist = () => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
};

const updateSettings = (patch: Partial<RegionalSettings>) => {
  currentSettings = normalizeSettings({ ...currentSettings, ...patch });
  persist();
  listeners.forEach((listener) => listener());
};

const parseDateInput = (value: string | Date) => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12));
  }
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  }
  return new Date(value);
};

export const regionalSettingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentSettings;
  },
  setSettings(patch: Partial<RegionalSettings>) {
    updateSettings(patch);
  },
};

export const formatRegionalDate = (value: string | Date, settings = currentSettings) => {
  if (!value) return "-";
  const date = parseDateInput(value);
  const options: Intl.DateTimeFormatOptions = { timeZone: settings.timeZone };

  if (settings.dateFormat === "YYYY-MM-DD") {
    options.year = "numeric";
    options.month = "2-digit";
    options.day = "2-digit";
    return new Intl.DateTimeFormat("en-CA", options).format(date);
  }

  if (settings.dateFormat === "DD-MM-YYYY") {
    options.year = "numeric";
    options.month = "2-digit";
    options.day = "2-digit";
    return new Intl.DateTimeFormat("en-GB", options).format(date).replace(/\//g, "-");
  }

  if (settings.dateFormat === "MMM D, YYYY") {
    options.year = "numeric";
    options.month = "short";
    options.day = "numeric";
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  options.year = "numeric";
  options.month = "2-digit";
  options.day = "2-digit";
  return new Intl.DateTimeFormat("en-US", options).format(date).replace(/\//g, "-");
};

export const formatRegionalTime = (hour: number, settings = currentSettings) => {
  const date = new Date(Date.UTC(2026, 0, 1, Math.floor(hour), Math.round((hour % 1) * 60)));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12h",
    timeZone: "UTC",
  }).format(date);
};

export const getWeekStartsOn = (settings = currentSettings) => settings.firstDayOfWeek === "Monday" ? 1 : 0;
