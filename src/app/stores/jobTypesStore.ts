// In-memory store for job types — managed in Settings → Job Types
type Listener = () => void;

const defaultJobTypes = ["Estimate", "Installation", "Maintenance", "Inspection"];

let jobTypes: string[] = [...defaultJobTypes];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const jobTypesStore = {
  getJobTypes: () => jobTypes,
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
      notify();
    }
  },
};
