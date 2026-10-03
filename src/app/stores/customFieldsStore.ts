// Shared store for custom field configuration across the app — backed by the
// settings collection so a field defined on one device exists on all of them.
//
// Behaviour spec "Vision360 Custom Fields" (PRD §15.5.2, decisions of May 13):
// every form has exactly two slots. A slot with no label is off and appears
// nowhere. Each slot has a label, a type (text / number / date / checkbox /
// dropdown), dropdown options, Required and Visible. Values are stored on the
// record by slot index ("0", "1"), so renaming a field keeps its values.
import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

export type CfFieldType = "text" | "number" | "date" | "checkbox" | "dropdown";
export type CfEntity = "clients" | "jobs" | "estimates" | "invoices" | "items" | "team";
export interface CfField {
  label: string;
  type: CfFieldType;
  options: string[];
  /** The form will not save until the field has a value. */
  required: boolean;
  /** Off hides the field from forms and details; values are kept. */
  visible: boolean;
}

export const CF_ENTITIES: CfEntity[] = ["clients", "jobs", "estimates", "invoices", "items", "team"];
const TYPES: CfFieldType[] = ["text", "number", "date", "checkbox", "dropdown"];
const STORAGE_KEY = "vision360.customFields.v2";

const blank = (): CfField => ({ label: "", type: "text", options: [], required: false, visible: true });

// Jobs ship with the field the PRD names (May 13): "Job custom field one, we're
// changing the title to … job category … metal roof, shingle roofs, wooden roofs."
const SEED: Record<CfEntity, CfField[]> = {
  clients: [blank(), blank()],
  jobs: [
    { label: "Job category", type: "dropdown", options: ["Metal roof", "Shingle roof", "Tile roof"], required: false, visible: true },
    blank(),
  ],
  estimates: [blank(), blank()],
  invoices: [blank(), blank()],
  items: [blank(), blank()],
  team: [blank(), blank()],
};

const normalizeField = (f: Partial<CfField> | undefined): CfField => {
  const visible = f?.visible !== false;
  return {
    label: typeof f?.label === "string" ? f.label : "",
    type: TYPES.includes(f?.type as CfFieldType) ? (f!.type as CfFieldType) : "text",
    options: Array.isArray(f?.options) ? f!.options.filter((o) => typeof o === "string" && o.trim()) : [],
    // Required and hidden cannot go together: a hidden field could never be filled.
    required: visible && !!f?.required,
    visible,
  };
};

const normalize = (value: Partial<Record<CfEntity, Partial<CfField>[]>> | undefined): Record<CfEntity, CfField[]> => {
  const out = {} as Record<CfEntity, CfField[]>;
  for (const e of CF_ENTITIES) {
    const list = Array.isArray(value?.[e]) ? value![e]! : SEED[e];
    out[e] = [normalizeField(list[0]), normalizeField(list[1])];
  }
  return out;
};

const read = (): Record<CfEntity, CfField[]> => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? normalize(JSON.parse(raw)) : normalize(SEED);
  } catch {
    return normalize(SEED);
  }
};

let fields: Record<CfEntity, CfField[]> = read();

let listeners: Listener[] = [];
function notify() { listeners.forEach(l => l()); }

const sync = createSettingsSync<Record<CfEntity, CfField[]>>("customFields");
const cache = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch { /* quota / private mode */ }
};
const save = () => {
  cache();
  sync.persist(fields);
  notify();
};

const setEntity = (entity: CfEntity, idx: number, next: CfField) => {
  const updated = [...fields[entity]];
  updated[idx] = normalizeField(next);
  fields = { ...fields, [entity]: updated };
  save();
};

export const customFieldsStore = {
  getFields: () => fields,
  getEntityFields: (entity: CfEntity) => fields[entity],
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate(fields, (value) => { fields = normalize({ ...fields, ...value }); cache(); notify(); });
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  updateField: (entity: CfEntity, idx: number, patch: Partial<CfField>) => {
    const next = { ...fields[entity][idx], ...patch };
    // Hiding a field also drops Required.
    if (patch.visible === false) next.required = false;
    setEntity(entity, idx, next);
  },
  addOption: (entity: CfEntity, idx: number, option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    const f = fields[entity][idx];
    if (f.options.includes(trimmed)) return;
    setEntity(entity, idx, { ...f, options: [...f.options, trimmed] });
  },
  removeOption: (entity: CfEntity, idx: number, option: string) => {
    const f = fields[entity][idx];
    setEntity(entity, idx, { ...f, options: f.options.filter(o => o !== option) });
  },
};

/** A slot is on when it has a label and is visible. */
export const isFieldOn = (f: CfField) => f.label.trim() !== "" && f.visible;
