// Shared store for company-level settings that need to be read across pages.
// Persisted to localStorage so values survive page refreshes.

import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

const STORAGE_KEY = "v360_company_name";
const DEFAULT_NAME = "Omega Home Services";

let companyName: string = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_NAME;

let listeners: Listener[] = [];
function notify() { listeners.forEach(l => l()); }

const sync = createSettingsSync<string>("companyName");
const cache = (name: string) => {
  try { localStorage.setItem(STORAGE_KEY, name); } catch { /* quota */ }
};

export const companyStore = {
  getCompanyName: () => companyName,
  setCompanyName: (name: string) => {
    companyName = name;
    cache(name);
    sync.persist(name);
    notify();
  },
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(companyName, (value) => { companyName = value; cache(value); notify(); });
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
};
