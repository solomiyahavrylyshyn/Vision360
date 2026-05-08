// Shared store for custom field configuration across the app.
// In production this would be backed by a database / user settings API.

type Listener = () => void;

export type CfFieldType = "text" | "number" | "date" | "checkbox" | "dropdown";
export type CfEntity = "clients" | "jobs" | "estimates" | "invoices" | "items";
export interface CfField { label: string; type: CfFieldType; options: string[] }

const defaultFields = (): CfField[] => [
  { label: "Custom Field 1", type: "text", options: [] },
  { label: "Custom Field 2", type: "text", options: [] },
  { label: "Custom Field 3", type: "text", options: [] },
];

let fields: Record<CfEntity, CfField[]> = {
  clients:   defaultFields(),
  jobs:      defaultFields(),
  estimates: defaultFields(),
  invoices:  defaultFields(),
  items:     defaultFields(),
};

let listeners: Listener[] = [];
function notify() { listeners.forEach(l => l()); }

export const customFieldsStore = {
  getFields: () => fields,
  getEntityFields: (entity: CfEntity) => fields[entity],
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  updateField: (entity: CfEntity, idx: number, patch: Partial<CfField>) => {
    const updated = [...fields[entity]];
    updated[idx] = { ...updated[idx], ...patch };
    fields = { ...fields, [entity]: updated };
    notify();
  },
  addOption: (entity: CfEntity, idx: number, option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    const updated = [...fields[entity]];
    if (updated[idx].options.includes(trimmed)) return;
    updated[idx] = { ...updated[idx], options: [...updated[idx].options, trimmed] };
    fields = { ...fields, [entity]: updated };
    notify();
  },
  removeOption: (entity: CfEntity, idx: number, option: string) => {
    const updated = [...fields[entity]];
    updated[idx] = { ...updated[idx], options: updated[idx].options.filter(o => o !== option) };
    fields = { ...fields, [entity]: updated };
    notify();
  },
};
