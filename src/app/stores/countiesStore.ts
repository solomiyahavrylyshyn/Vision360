// Simple in-memory store for counties shared across the app
// In production this would be backed by a database

import { createSettingsSync } from "./settingsSync";

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

const sync = createSettingsSync<string[]>("counties");
// Every mutation writes through, so the list survives a refresh and is shared
// with everyone else on the company account.
const save = () => {
  sync.persist(counties);
  notify();
};

export const countiesStore = {
  getCounties: () => counties,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(counties, (value) => { counties = value; notify(); });
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addCounty: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !counties.includes(trimmed)) {
      counties = [...counties, trimmed];
      save();
    }
  },
  removeCounty: (name: string) => {
    counties = counties.filter((c) => c !== name);
    save();
  },
  renameCounty: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !counties.includes(trimmed)) {
      counties = counties.map((c) => (c === oldName ? trimmed : c));
      save();
    }
  },
};
