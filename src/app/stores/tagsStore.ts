// Simple in-memory store for customer tags shared across the app
// In production this would be backed by a database

type Listener = () => void;

const defaultTags = [
  "VIP Customer",
  "New Homeowner",
  "Self-Generated Lead",
  "Repeat Client",
  "High Priority",
  "Commercial Account",
  "Residential Account",
  "Seasonal Customer",
  "Referral Partner",
  "At Risk",
];

let tags: string[] = [...defaultTags];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const tagsStore = {
  getTags: () => tags,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addTag: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags = [...tags, trimmed];
      notify();
    }
  },
  removeTag: (name: string) => {
    tags = tags.filter((t) => t !== name);
    notify();
  },
  renameTag: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags = tags.map((t) => (t === oldName ? trimmed : t));
      notify();
    }
  },
};
