// In-memory store for job types — managed in Settings → Job Types.
// Each type carries a DEFAULT DURATION (hours) used to pre-fill a job's end time
// on create (Marek, Jun 8: "Job duration would be from the selected job type").
import { createSettingsSync } from "./settingsSync";

type Listener = () => void;

const defaultJobTypes = ["Estimate", "Installation", "Maintenance", "Inspection"];
// Marek (Jun 8): 2h for every type, except Installation which defaults to 8h.
const DEFAULT_TYPE_DURATION = 2;
const defaultDurations: Record<string, number> = {
  Estimate: 2,
  Installation: 8,
  Install: 8,
  Maintenance: 2,
  Inspection: 2,
};

let jobTypes: string[] = [...defaultJobTypes];
let durations: Record<string, number> = { ...defaultDurations };
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

// The list and its durations are one setting — they are edited together in
// Settings → Job Types and only make sense together.
const sync = createSettingsSync<{ jobTypes: string[]; durations: Record<string, number> }>("jobTypes");
const save = () => {
  sync.persist({ jobTypes, durations });
  notify();
};

export const jobTypesStore = {
  getJobTypes: () => jobTypes,
  /** Default duration (hours) for a job type — falls back to 2h for unknown/custom types. */
  getDuration: (name?: string) => (name && durations[name] != null ? durations[name] : DEFAULT_TYPE_DURATION),
  /** Reactive snapshot of the per-type duration map (for Settings to render). */
  getDurations: () => durations,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    sync.hydrate({ jobTypes, durations }, (value) => {
      if (Array.isArray(value?.jobTypes)) jobTypes = value.jobTypes;
      if (value?.durations) durations = { ...durations, ...value.durations };
      notify();
    });
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addJobType: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !jobTypes.includes(trimmed)) {
      jobTypes = [...jobTypes, trimmed];
      if (durations[trimmed] == null) durations = { ...durations, [trimmed]: DEFAULT_TYPE_DURATION };
      save();
    }
  },
  removeJobType: (name: string) => {
    jobTypes = jobTypes.filter((t) => t !== name);
    save();
  },
  renameJobType: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !jobTypes.includes(trimmed)) {
      jobTypes = jobTypes.map((t) => (t === oldName ? trimmed : t));
      if (durations[oldName] != null) {
        durations = { ...durations, [trimmed]: durations[oldName] };
        delete durations[oldName];
      }
      save();
    }
  },
  /** Set the default duration (hours) for a job type (Settings → Job Types). */
  setDuration: (name: string, hours: number) => {
    const h = Number.isFinite(hours) && hours >= 0 ? hours : DEFAULT_TYPE_DURATION;
    durations = { ...durations, [name]: h };
    save();
  },
};
