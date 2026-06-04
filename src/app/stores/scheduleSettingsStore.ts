export interface ScheduleSettings {
  startHour: number;
  endHour: number;
  slotMinutes: number;
  // Default job length (minutes) used to auto-fill the end time when a start
  // time is entered without an end. Start time itself is optional.
  defaultJobMinutes: number;
}

const STORAGE_KEY = "vision360.scheduleSettings";
const DEFAULT_SETTINGS: ScheduleSettings = {
  startHour: 7,
  endHour: 19,
  slotMinutes: 30,
  defaultJobMinutes: 120,
};

const listeners = new Set<() => void>();

const isValidHour = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 24;

const normalizeSettings = (settings: Partial<ScheduleSettings>): ScheduleSettings => {
  const startHour = isValidHour(settings.startHour) ? settings.startHour! : DEFAULT_SETTINGS.startHour;
  const endHour = isValidHour(settings.endHour) && settings.endHour! > startHour ? settings.endHour! : DEFAULT_SETTINGS.endHour;
  const slotMinutes = [15, 30, 60].includes(Number(settings.slotMinutes))
    ? Number(settings.slotMinutes)
    : DEFAULT_SETTINGS.slotMinutes;
  const defaultJobMinutes = [30, 60, 90, 120, 180, 240, 480].includes(Number(settings.defaultJobMinutes))
    ? Number(settings.defaultJobMinutes)
    : DEFAULT_SETTINGS.defaultJobMinutes;

  return {
    startHour,
    endHour: Math.max(endHour, startHour + 1),
    slotMinutes,
    defaultJobMinutes,
  };
};

const readSettings = (): ScheduleSettings => {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw) as Partial<ScheduleSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

let currentSettings = readSettings();

const persist = () => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
};

const notify = () => listeners.forEach((listener) => listener());

const updateSettings = (nextSettings: Partial<ScheduleSettings>) => {
  currentSettings = normalizeSettings({ ...currentSettings, ...nextSettings });
  persist();
  notify();
};

export const parseScheduleHour = (label: string): number => {
  const match = label.trim().match(/^(\d{1,2}):00\s?(AM|PM)$/i);
  if (!match) return DEFAULT_SETTINGS.startHour;

  const hour = Number(match[1]);
  const period = match[2].toUpperCase();
  if (period === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
};

export const formatScheduleHour = (hour: number): string => {
  const normalized = ((Math.round(hour) % 24) + 24) % 24;
  const period = normalized >= 12 ? "PM" : "AM";
  const display = normalized > 12 ? normalized - 12 : normalized === 0 ? 12 : normalized;
  return `${display}:00 ${period}`;
};

export const scheduleSettingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentSettings;
  },
  setStartHour(startHour: number) {
    updateSettings({
      startHour,
      endHour: Math.max(currentSettings.endHour, startHour + 1),
    });
  },
  setEndHour(endHour: number) {
    updateSettings({
      endHour: Math.max(endHour, currentSettings.startHour + 1),
    });
  },
  setSlotMinutes(slotMinutes: number) {
    updateSettings({ slotMinutes });
  },
  setDefaultJobMinutes(defaultJobMinutes: number) {
    updateSettings({ defaultJobMinutes });
  },
};
