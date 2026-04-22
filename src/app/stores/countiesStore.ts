// Simple in-memory store for counties shared across the app
// In production this would be backed by a database

type Listener = () => void;

const defaultCounties = [
  "Hillsborough",
  "Miami-Dade",
  "Broward",
  "Palm Beach",
  "Orange",
  "Pinellas",
  "Duval",
  "Lee",
  "Polk",
  "Brevard",
  "Volusia",
  "Pasco",
  "Seminole",
  "Sarasota",
  "Manatee",
  "Collier",
  "Osceola",
  "Marion",
  "Lake",
  "St. Lucie",
];

let counties: string[] = [...defaultCounties];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const countiesStore = {
  getCounties: () => counties,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addCounty: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !counties.includes(trimmed)) {
      counties = [...counties, trimmed];
      notify();
    }
  },
  removeCounty: (name: string) => {
    counties = counties.filter((c) => c !== name);
    notify();
  },
  renameCounty: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !counties.includes(trimmed)) {
      counties = counties.map((c) => (c === oldName ? trimmed : c));
      notify();
    }
  },
};
