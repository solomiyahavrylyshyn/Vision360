// Simple in-memory store for customer tags shared across the app
// In production this would be backed by a database

import { createSettingsSync } from "./settingsSync";

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

const sync = createSettingsSync<string[]>("tags");
// Every mutation writes through, so the list survives a refresh and is shared
// with everyone else on the company account.
const save = () => {
  sync.persist(tags);
  notify();
};

export const tagsStore = {
  getTags: () => tags,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(tags, (value) => { tags = value; notify(); });
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addTag: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags = [...tags, trimmed];
      save();
    }
  },
  removeTag: (name: string) => {
    tags = tags.filter((t) => t !== name);
    save();
  },
  renameTag: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags = tags.map((t) => (t === oldName ? trimmed : t));
      save();
    }
  },
};
