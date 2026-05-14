// Shared store for company-level settings that need to be read across pages.
// Persisted to localStorage so values survive page refreshes.

type Listener = () => void;

const STORAGE_KEY = "v360_company_name";
const DEFAULT_NAME = "Omega Home Services";

let companyName: string = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_NAME;

let listeners: Listener[] = [];
function notify() { listeners.forEach(l => l()); }

export const companyStore = {
  getCompanyName: () => companyName,
  setCompanyName: (name: string) => {
    companyName = name;
    localStorage.setItem(STORAGE_KEY, name);
    notify();
  },
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
};
