// In-memory store for job types — managed in Settings → Job Types.
// Each type carries a DEFAULT DURATION (hours) used to pre-fill a job's end time
// on create (Marek, Jun 8: "Job duration would be from the selected job type").
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

export const jobTypesStore = {
  getJobTypes: () => jobTypes,
  /** Default duration (hours) for a job type — falls back to 2h for unknown/custom types. */
  getDuration: (name?: string) => (name && durations[name] != null ? durations[name] : DEFAULT_TYPE_DURATION),
  /** Reactive snapshot of the per-type duration map (for Settings to render). */
  getDurations: () => durations,
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  addJobType: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !jobTypes.includes(trimmed)) {
      jobTypes = [...jobTypes, trimmed];
      if (durations[trimmed] == null) durations = { ...durations, [trimmed]: DEFAULT_TYPE_DURATION };
      notify();
    }
  },
  removeJobType: (name: string) => {
    jobTypes = jobTypes.filter((t) => t !== name);
    notify();
  },
  renameJobType: (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && !jobTypes.includes(trimmed)) {
      jobTypes = jobTypes.map((t) => (t === oldName ? trimmed : t));
      if (durations[oldName] != null) {
        durations = { ...durations, [trimmed]: durations[oldName] };
        delete durations[oldName];
      }
      notify();
    }
  },
  /** Set the default duration (hours) for a job type (Settings → Job Types). */
  setDuration: (name: string, hours: number) => {
    const h = Number.isFinite(hours) && hours >= 0 ? hours : DEFAULT_TYPE_DURATION;
    durations = { ...durations, [name]: h };
    notify();
  },
};
