// Simple in-memory store for marketing sources shared across the app
// In production this would be backed by a database

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

export const marketingSourcesStore = {
  getSources: () => sources,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addSource: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !sources.includes(trimmed)) {
      sources = [...sources, trimmed];
      notify();
    }
  },
  removeSource: (name: string) => {
    sources = sources.filter((s) => s !== name);
    notify();
  },
  renameSource: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !sources.includes(trimmed)) {
      sources = sources.map((s) => (s === oldName ? trimmed : s));
      notify();
    }
  },
};
