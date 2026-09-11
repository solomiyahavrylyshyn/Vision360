// Simple in-memory store for marketing sources shared across the app
// In production this would be backed by a database

import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

const defaultSources = [
  "Google",
  "Yelp",
  "Facebook",
  "Instagram",
  "Referral",
  "Yard Sign",
  "Direct Mail",
  "Door Hanger",
  "HomeAdvisor",
  "Angi",
  "Thumbtack",
  "Nextdoor",
  "Website",
  "Repeat Client",
  "Other",
];

let sources: string[] = [...defaultSources];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

const sync = createSettingsSync<string[]>("marketingSources");
// Every mutation writes through, so the list survives a refresh and is shared
// with everyone else on the company account.
const save = () => {
  sync.persist(sources);
  notify();
};

export const marketingSourcesStore = {
  getSources: () => sources,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(sources, (value) => { sources = value; notify(); });
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addSource: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !sources.includes(trimmed)) {
      sources = [...sources, trimmed];
      save();
    }
  },
  removeSource: (name: string) => {
    sources = sources.filter((s) => s !== name);
    save();
  },
  renameSource: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !sources.includes(trimmed)) {
      sources = sources.map((s) => (s === oldName ? trimmed : s));
      save();
    }
  },
};
