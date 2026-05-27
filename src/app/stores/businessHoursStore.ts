export interface BusinessHourRow {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

const STORAGE_KEY = "vision360.businessHours";

export const DEFAULT_BUSINESS_HOURS: BusinessHourRow[] = [
  { day: "Sunday", open: false, from: "9:00 AM", to: "5:00 PM" },
  { day: "Monday", open: true, from: "9:00 AM", to: "5:00 PM" },
  { day: "Tuesday", open: true, from: "9:00 AM", to: "5:00 PM" },
  { day: "Wednesday", open: true, from: "9:00 AM", to: "5:00 PM" },
  { day: "Thursday", open: true, from: "9:00 AM", to: "5:00 PM" },
  { day: "Friday", open: true, from: "9:00 AM", to: "5:00 PM" },
  { day: "Saturday", open: false, from: "9:00 AM", to: "5:00 PM" },
];

const listeners = new Set<() => void>();
const dayOrder = DEFAULT_BUSINESS_HOURS.map((row) => row.day);

const normalizeRows = (rows: Partial<BusinessHourRow>[]): BusinessHourRow[] =>
  DEFAULT_BUSINESS_HOURS.map((defaultRow) => {
    const found = rows.find((row) => row.day === defaultRow.day);
    return {
      day: defaultRow.day,
      open: typeof found?.open === "boolean" ? found.open : defaultRow.open,
      from: found?.from || defaultRow.from,
      to: found?.to || defaultRow.to,
    };
  });

const readRows = (): BusinessHourRow[] => {
  if (typeof localStorage === "undefined") return DEFAULT_BUSINESS_HOURS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BUSINESS_HOURS;
    return normalizeRows(JSON.parse(raw) as Partial<BusinessHourRow>[]);
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
};

let currentRows = readRows();

const persist = () => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRows));
};

const notify = () => listeners.forEach((listener) => listener());

export const businessHoursStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentRows;
  },
  setRows(rows: BusinessHourRow[]) {
    currentRows = normalizeRows(rows);
    persist();
    notify();
  },
};

export const isDateOpenForBusiness = (date: Date, rows = currentRows) => {
  const dayName = dayOrder[date.getDay()];
  return Boolean(rows.find((row) => row.day === dayName)?.open);
};
