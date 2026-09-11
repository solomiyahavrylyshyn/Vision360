// Simple in-memory store for relationship types shared across the app
// In production this would be backed by a database

import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

const defaultRelationships = [
  "Daughter",
  "Son",
  "Parent",
  "Tenant",
  "Property Manager",
  "Neighbor",
  "Friend",
  "Caregiver",
  "Realtor",
  "Builder",
  "General Contractor",
  "Office Manager",
  "Assistant",
  "Maintenance Manager",
  "HOA Representative",
  "Landlord",
  "Emergency Contact",
  "Billing Contact",
  "Decision Maker",
];

let relationships: string[] = [...defaultRelationships];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

const sync = createSettingsSync<string[]>("relationships");
// Every mutation writes through, so the list survives a refresh and is shared
// with everyone else on the company account.
const save = () => {
  sync.persist(relationships);
  notify();
};

export const relationshipsStore = {
  getRelationships: () => relationships,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(relationships, (value) => { relationships = value; notify(); });
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addRelationship: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !relationships.includes(trimmed)) {
      relationships = [...relationships, trimmed];
      save();
    }
  },
  removeRelationship: (name: string) => {
    relationships = relationships.filter((r) => r !== name);
    save();
  },
  renameRelationship: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !relationships.includes(trimmed)) {
      relationships = relationships.map((r) => (r === oldName ? trimmed : r));
      save();
    }
  },
};
