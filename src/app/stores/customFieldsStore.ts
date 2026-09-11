// Shared store for custom field configuration across the app — backed by the
// settings collection so a field defined on one device exists on all of them.
import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

export type CfFieldType = "text" | "number" | "date" | "checkbox" | "dropdown";
export type CfEntity = "clients" | "jobs" | "estimates" | "invoices" | "items" | "team";
export interface CfField { label: string; type: CfFieldType; options: string[] }

const defaultFields = (): CfField[] => [
  { label: "", type: "text", options: [] },
  { label: "", type: "text", options: [] },
];

let fields: Record<CfEntity, CfField[]> = {
  clients:   defaultFields(),
  jobs:      defaultFields(),
  estimates: defaultFields(),
  invoices:  defaultFields(),
  items:     defaultFields(),
  team:      defaultFields(),
};

let listeners: Listener[] = [];
function notify() { listeners.forEach(l => l()); }

const sync = createSettingsSync<Record<CfEntity, CfField[]>>("customFields");
// Custom fields had no persistence at all — an edit vanished on refresh.
const save = () => {
  sync.persist(fields);
  notify();
};

export const customFieldsStore = {
  getFields: () => fields,
  getEntityFields: (entity: CfEntity) => fields[entity],
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(fields, (value) => { fields = { ...fields, ...value }; notify(); });
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  updateField: (entity: CfEntity, idx: number, patch: Partial<CfField>) => {
    const updated = [...fields[entity]];
    updated[idx] = { ...updated[idx], ...patch };
    fields = { ...fields, [entity]: updated };
    save();
  },
  addOption: (entity: CfEntity, idx: number, option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    const updated = [...fields[entity]];
    if (updated[idx].options.includes(trimmed)) return;
    updated[idx] = { ...updated[idx], options: [...updated[idx].options, trimmed] };
    fields = { ...fields, [entity]: updated };
    save();
  },
  removeOption: (entity: CfEntity, idx: number, option: string) => {
    const updated = [...fields[entity]];
    updated[idx] = { ...updated[idx], options: updated[idx].options.filter(o => o !== option) };
    fields = { ...fields, [entity]: updated };
    save();
  },
};
