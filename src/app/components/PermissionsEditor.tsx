// Full RBAC permissions editor (FR-2b) — extracted from NewUser so the SAME
// editor serves both the Invite-user page (/settings/team/new) and the
// Edit-user modal on Settings → Manage team. Controlled component: all state
// (preset, perms, report access, custom presets) lives with the caller.

import { useState } from "react";
import { toast } from "sonner";
import { ReportAccessPanel } from "./ReportAccessPanel";

// ─── Types ───────────────────────────────────────────────────────────────────
export type BuiltInPreset = "admin" | "employee" | "custom";
export type PresetId = BuiltInPreset | string; // string for custom-saved preset ids

export type ScheduleLevel = "viewOwn" | "viewCompleteOwn" | "editOwn" | "viewAll" | "editAll" | "editDeleteAll";
export type TimeLevel = "viewRecordOwn" | "viewRecordEditOwn" | "viewRecordEditAll";
export type NotesLevel = "viewJobsOnly" | "viewAll" | "viewAddAll" | "viewEditAll" | "viewEditDeleteAll";
export type ExpensesLevel = "viewRecordEditOwn" | "viewRecordEditAll" | "viewRecordEditDeleteAll";
// Per the MVP walkthrough, records are never hard-deleted — each module uses a
// history-preserving terminal action instead (deactivate / archive / void / cancel),
// and Payments is a leveled permission ending in refund.
export type ClientsLevel = "nameAddressOnly" | "viewFull" | "viewCreateEditFull" | "viewCreateEditDeactivateFull";
export type EstimatesLevel = "viewOnly" | "viewCreateEdit" | "viewCreateEditArchive";
export type InvoicesLevel = "viewOnly" | "viewCreateEdit" | "viewCreateEditVoidArchive";
export type JobsLevel = "viewOnly" | "viewCreateEdit" | "viewCreateEditCancel";
export type PaymentsLevel = "viewOnly" | "viewCollect" | "viewCollectEdit" | "viewCollectEditRefund";
// Items is a role-based capability ladder (Marek's matrix): CSR/Dispatch →
// Sales/Technician → Manager → Accounting/Purchasing → Admin (Item Master Control).
export type ItemsLevel =
  | "viewSellPrice"
  | "discountOverride"
  | "approveOverrides"
  | "viewCostTaxesCreate"
  | "fullControl";

export interface PermissionsState {
  isAdmin: boolean;
  schedule: { enabled: boolean; level: ScheduleLevel };
  timeTracking: { enabled: boolean; level: TimeLevel };
  notes: { enabled: boolean; level: NotesLevel };
  expenses: { enabled: boolean; level: ExpensesLevel };
  items: { enabled: boolean; level: ItemsLevel };
  jobCosting: boolean;
  clients: { enabled: boolean; level: ClientsLevel };
  estimates: { enabled: boolean; level: EstimatesLevel };
  jobs: { enabled: boolean; level: JobsLevel };
  invoices: { enabled: boolean; level: InvoicesLevel };
  payments: { enabled: boolean; level: PaymentsLevel };
  clientCommunications: boolean;
  reports: boolean;
}

export interface CustomPreset {
  id: string;
  name: string;
  permissions: PermissionsState;
}

// ─── Preset definitions & persistence ────────────────────────────────────────
export const employeePreset: PermissionsState = {
  isAdmin: false,
  schedule: { enabled: true, level: "viewCompleteOwn" },
  timeTracking: { enabled: true, level: "viewRecordOwn" },
  notes: { enabled: true, level: "viewAddAll" },
  expenses: { enabled: true, level: "viewRecordEditOwn" },
  items: { enabled: false, level: "viewSellPrice" },
  jobCosting: false,
  clients: { enabled: true, level: "viewFull" },
  estimates: { enabled: false, level: "viewOnly" },
  jobs: { enabled: true, level: "viewOnly" },
  invoices: { enabled: false, level: "viewOnly" },
  payments: { enabled: false, level: "viewOnly" },
  clientCommunications: false,
  reports: false,
};

export const adminPreset: PermissionsState = {
  isAdmin: true,
  schedule: { enabled: true, level: "editDeleteAll" },
  timeTracking: { enabled: true, level: "viewRecordEditAll" },
  notes: { enabled: true, level: "viewEditDeleteAll" },
  expenses: { enabled: true, level: "viewRecordEditAll" },
  items: { enabled: true, level: "fullControl" },
  jobCosting: true,
  clients: { enabled: true, level: "viewCreateEditDeactivateFull" },
  estimates: { enabled: true, level: "viewCreateEditArchive" },
  jobs: { enabled: true, level: "viewCreateEditCancel" },
  invoices: { enabled: true, level: "viewCreateEditVoidArchive" },
  payments: { enabled: true, level: "viewCollectEditRefund" },
  clientCommunications: true,
  reports: true,
};

const CUSTOM_PRESETS_KEY = "vision360.customPresets";

export const loadCustomPresets = (): CustomPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? (JSON.parse(raw) as CustomPreset[]) : [];
  } catch {
    return [];
  }
};

export const saveCustomPresets = (presets: CustomPreset[]) => {
  try {
    window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota errors */
  }
};

// Upgrade any preset saved under the old `showPricing` boolean to the new
// leveled `items` shape, so older localStorage data doesn't break the radios.
export const ensureItemsPerm = (p: PermissionsState): PermissionsState => {
  if (p && p.items) return p;
  const legacy = (p as unknown as { showPricing?: boolean })?.showPricing ?? false;
  return { ...p, items: { enabled: legacy, level: legacy ? "fullControl" : "viewSellPrice" } };
};

// ─── Small UI helpers ────────────────────────────────────────────────────────
export const Radio = ({
  checked,
  onClick,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-start gap-2.5 text-left ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9FAFB] cursor-pointer"} rounded-md px-1 py-1`}
  >
    <span
      className={`mt-[3px] inline-block w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
        checked ? "border-[#4A6FA5]" : "border-[#D1D5DB]"
      }`}
    >
      {checked && (
        <span className="block w-2 h-2 m-[2px] rounded-full bg-[#4A6FA5]" />
      )}
    </span>
    {/* NOTE: `description` is intentionally NOT rendered (matches the original
        NewUser radio, and keeps the accessible name equal to the label). */}
    <span className="flex flex-col">
      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{label}</span>
    </span>
  </button>
);

export const Toggle = ({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!on)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      on ? "bg-[#4A6FA5]" : "bg-[#D1D5DB]"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
        on ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export const FeatureSection = ({
  title,
  description,
  enabled,
  onToggle,
  toggleable = true,
  children,
}: {
  title: string;
  description?: string;
  enabled: boolean;
  onToggle?: (v: boolean) => void;
  toggleable?: boolean;
  children?: React.ReactNode;
}) => (
  <div className="border-t border-[#E5E7EB] py-5">
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="flex-1">
        <h4 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h4>
        {description && <p className="text-[12px] text-[#6B7280] mt-0.5">{description}</p>}
      </div>
      {toggleable && onToggle && <Toggle on={enabled} onChange={onToggle} />}
    </div>
    {enabled && children && <div className="flex flex-col gap-1.5 pl-1">{children}</div>}
  </div>
);

// ─── The editor ──────────────────────────────────────────────────────────────
export function PermissionsEditor({
  preset,
  setPreset,
  perms,
  setPerms,
  reportAccess,
  setReportAccess,
  customPresets,
  setCustomPresets,
}: {
  preset: PresetId;
  setPreset: (p: PresetId) => void;
  perms: PermissionsState;
  setPerms: React.Dispatch<React.SetStateAction<PermissionsState>>;
  reportAccess: Record<string, boolean>;
  setReportAccess: (next: Record<string, boolean>) => void;
  customPresets: CustomPreset[];
  setCustomPresets: React.Dispatch<React.SetStateAction<CustomPreset[]>>;
}) {
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const applyPreset = (next: PresetId) => {
    setPreset(next);
    if (next === "admin") setPerms(adminPreset);
    else if (next === "employee") setPerms(employeePreset);
    else if (next !== "custom") {
      const found = customPresets.find(cp => cp.id === next);
      if (found) setPerms(ensureItemsPerm(found.permissions));
    }
    // "custom" keeps current state
  };

  // Any direct edit flips preset → custom
  const editPerms = (updater: (prev: PermissionsState) => PermissionsState) => {
    setPerms(updater);
    setPreset("custom");
  };

  const saveAsCustomPreset = () => {
    const name = newPresetName.trim();
    if (!name) {
      toast.error("Preset name required");
      return;
    }
    if (customPresets.some(cp => cp.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A preset with that name already exists");
      return;
    }
    const id = `custom-${Date.now()}`;
    setCustomPresets(prev => [...prev, { id, name, permissions: perms }]);
    setPreset(id);
    setNewPresetName("");
    setShowSavePresetInput(false);
    toast.success(`Saved preset "${name}"`);
  };

  const deleteCustomPreset = (id: string) => {
    const target = customPresets.find(cp => cp.id === id);
    if (!target) return;
    setCustomPresets(prev => prev.filter(cp => cp.id !== id));
    if (preset === id) setPreset("custom");
    toast.success(`Deleted preset "${target.name}"`);
  };

  return (
    <>
      {/* Preset roles */}
      <div className="pb-5">
        <h3 className="text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Preset permission levels</h3>
        <p className="text-[12px] text-[#6B7280] mb-3">Start with a preset permission level, and customize further as needed.</p>
        <div className="flex flex-col gap-2">
          <Radio
            checked={preset === "admin"}
            onClick={() => applyPreset("admin")}
            label="Admin"
            description="Full access to the account including billing, settings, and all user permissions."
          />
          <Radio
            checked={preset === "employee"}
            onClick={() => applyPreset("employee")}
            label="Employee"
            description="View and complete their own schedule, track time, see assigned jobs and clients."
          />

          {/* Saved custom presets */}
          {customPresets.map(cp => (
            <div key={cp.id} className="flex items-start justify-between gap-2 group">
              <div className="flex-1">
                <Radio
                  checked={preset === cp.id}
                  onClick={() => applyPreset(cp.id)}
                  label={cp.name}
                  description="Saved custom preset."
                />
              </div>
              <button
                type="button"
                onClick={() => deleteCustomPreset(cp.id)}
                className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-[#DC2626] transition-opacity p-1"
                title={`Delete "${cp.name}"`}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>delete</span>
              </button>
            </div>
          ))}

          <Radio
            checked={preset === "custom"}
            onClick={() => applyPreset("custom")}
            label="Custom"
            description="Fine-tune each permission below."
          />
        </div>

        {/* Save-as-preset inline form */}
        {preset === "custom" && (
          <div className="mt-3 pl-7">
            {showSavePresetInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveAsCustomPreset();
                    } else if (e.key === "Escape") {
                      setShowSavePresetInput(false);
                      setNewPresetName("");
                    }
                  }}
                  placeholder="e.g. Field Tech, Dispatcher"
                  className="h-8 px-2.5 text-[13px] border border-[#E5E7EB] rounded-md outline-none focus:border-[#4A6FA5] w-[220px]"
                />
                <button
                  type="button"
                  onClick={saveAsCustomPreset}
                  className="h-8 px-3 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[12px]"
                  style={{ fontWeight: 600 }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSavePresetInput(false); setNewPresetName(""); }}
                  className="h-8 px-2 text-[#6B7280] hover:text-[#1A2332] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSavePresetInput(true)}
                className="inline-flex items-center gap-1 text-[13px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
                Save current settings as preset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      <FeatureSection
        title="Schedule"
        enabled={perms.schedule.enabled}
        onToggle={v => editPerms(p => ({ ...p, schedule: { ...p.schedule, enabled: v } }))}
      >
        {(["viewOwn", "viewCompleteOwn", "editOwn", "viewAll", "editAll", "editDeleteAll"] as ScheduleLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.schedule.level === level}
            onClick={() => editPerms(p => ({ ...p, schedule: { ...p.schedule, level } }))}
            label={{
              viewOwn: "View their own schedule",
              viewCompleteOwn: "View and complete their own schedule",
              editOwn: "Edit their own schedule",
              viewAll: "View everyone's schedule",
              editAll: "Edit everyone's schedule",
              editDeleteAll: "Edit and delete everyone's schedule",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Time tracking */}
      <FeatureSection
        title="Time tracking and timesheets"
        enabled={perms.timeTracking.enabled}
        onToggle={v => editPerms(p => ({ ...p, timeTracking: { ...p.timeTracking, enabled: v } }))}
      >
        {(["viewRecordOwn", "viewRecordEditOwn", "viewRecordEditAll"] as TimeLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.timeTracking.level === level}
            onClick={() => editPerms(p => ({ ...p, timeTracking: { ...p.timeTracking, level } }))}
            label={{
              viewRecordOwn: "View and record their own",
              viewRecordEditOwn: "View, record, and edit their own",
              viewRecordEditAll: "View, record, and edit everyone's",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Notes */}
      <FeatureSection
        title="Notes"
        description="Includes all notes across Vision360. You can hide notes for a feature by turning off permissions for that feature."
        enabled={perms.notes.enabled}
        onToggle={v => editPerms(p => ({ ...p, notes: { ...p.notes, enabled: v } }))}
      >
        {(["viewJobsOnly", "viewAll", "viewAddAll", "viewEditAll", "viewEditDeleteAll"] as NotesLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.notes.level === level}
            onClick={() => editPerms(p => ({ ...p, notes: { ...p.notes, level } }))}
            label={{
              viewJobsOnly: "View notes on jobs only",
              viewAll: "View all notes",
              viewAddAll: "View all notes and add new ones",
              viewEditAll: "View and edit all",
              viewEditDeleteAll: "View, edit, and delete all",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Expenses */}
      <FeatureSection
        title="Expenses"
        enabled={perms.expenses.enabled}
        onToggle={v => editPerms(p => ({ ...p, expenses: { ...p.expenses, enabled: v } }))}
      >
        {(["viewRecordEditOwn", "viewRecordEditAll", "viewRecordEditDeleteAll"] as ExpensesLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.expenses.level === level}
            onClick={() => editPerms(p => ({ ...p, expenses: { ...p.expenses, level } }))}
            label={{
              viewRecordEditOwn: "View, record, and edit their own",
              viewRecordEditAll: "View, record, and edit everyone's",
              viewRecordEditDeleteAll: "View, record, edit, and delete everyone's",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Items — role-based capability ladder (Marek's matrix). */}
      <FeatureSection
        title="Items"
        enabled={perms.items.enabled}
        onToggle={v => editPerms(p => ({ ...p, items: { ...p.items, enabled: v }, jobCosting: v ? p.jobCosting : false }))}
      >
        {(["viewSellPrice", "discountOverride", "approveOverrides", "viewCostTaxesCreate", "fullControl"] as ItemsLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.items.level === level}
            onClick={() => editPerms(p => ({ ...p, items: { ...p.items, level } }))}
            label={{
              viewSellPrice: "View sell price",
              discountOverride: "View sell price; discount within limit; raise price freely, lower price needs approval",
              approveOverrides: "View sell price; discount and override price either way; approve lower-price overrides",
              viewCostTaxesCreate: "View sell price, cost, and taxes; create items",
              fullControl: "Upload, create, view and edit; sell price, cost, taxes, pricebook; delete / deactivate items",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Show job profit (a.k.a. job costing) */}
      <FeatureSection
        title="Show job profit"
        description={
          perms.items.enabled && perms.timeTracking.enabled && perms.expenses.enabled
            ? "When on, this role sees revenue, expenses, compensation, and profit on jobs. When off, they see only the total price."
            : "When on, this role sees revenue, expenses, compensation, and profit on jobs (otherwise just the total price). Turn on Items, Time tracking, and Expenses to enable it."
        }
        enabled={perms.jobCosting}
        onToggle={v => editPerms(p => ({ ...p, jobCosting: v }))}
      />

      {/* Clients and properties */}
      <FeatureSection
        title="Clients and properties"
        description="Includes access to all client custom fields."
        enabled={perms.clients.enabled}
        onToggle={v => editPerms(p => ({ ...p, clients: { ...p.clients, enabled: v } }))}
      >
        {(["nameAddressOnly", "viewFull", "viewCreateEditFull", "viewCreateEditDeactivateFull"] as ClientsLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.clients.level === level}
            onClick={() => editPerms(p => ({ ...p, clients: { ...p.clients, level } }))}
            label={{
              nameAddressOnly: "View client name and address only",
              viewFull: "View full client and property info",
              viewCreateEditFull: "View, create, and edit full client and property info",
              viewCreateEditDeactivateFull: "View, create, edit, and deactivate full client and property info",
            }[level]}
            description={level === "nameAddressOnly"
              ? "Hides the phone number — for sales roles, so jobs can't be booked off the books."
              : undefined}
          />
        ))}
      </FeatureSection>

      {/* Estimates */}
      <FeatureSection
        title="Estimates"
        enabled={perms.estimates.enabled}
        onToggle={v => editPerms(p => ({ ...p, estimates: { ...p.estimates, enabled: v } }))}
      >
        {(["viewOnly", "viewCreateEdit", "viewCreateEditArchive"] as EstimatesLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.estimates.level === level}
            onClick={() => editPerms(p => ({ ...p, estimates: { ...p.estimates, level } }))}
            label={{
              viewOnly: "View only",
              viewCreateEdit: "View, create, and edit estimates; view and apply estimate templates",
              viewCreateEditArchive: "View, create, edit, and archive estimates; view and apply estimate templates",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Jobs */}
      <FeatureSection
        title="Jobs"
        enabled={perms.jobs.enabled}
        onToggle={v => editPerms(p => ({ ...p, jobs: { ...p.jobs, enabled: v } }))}
      >
        {(["viewOnly", "viewCreateEdit", "viewCreateEditCancel"] as JobsLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.jobs.level === level}
            onClick={() => editPerms(p => ({ ...p, jobs: { ...p.jobs, level } }))}
            label={{
              viewOnly: "View only",
              viewCreateEdit: "View, create, and edit",
              viewCreateEditCancel: "View, create, edit, and cancel",
            }[level]}
            disabled={level !== "viewOnly" && perms.schedule.level !== "editOwn" && perms.schedule.level !== "editAll" && perms.schedule.level !== "editDeleteAll"}
          />
        ))}
      </FeatureSection>

      {/* Invoices */}
      <FeatureSection
        title="Invoices"
        enabled={perms.invoices.enabled}
        onToggle={v => editPerms(p => ({ ...p, invoices: { ...p.invoices, enabled: v } }))}
      >
        {(["viewOnly", "viewCreateEdit", "viewCreateEditVoidArchive"] as InvoicesLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.invoices.level === level}
            onClick={() => editPerms(p => ({ ...p, invoices: { ...p.invoices, level } }))}
            label={{
              viewOnly: "View only",
              viewCreateEdit: "View, create, and edit (change prices)",
              viewCreateEditVoidArchive: "View, create, edit, void, and archive",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Payments */}
      <FeatureSection
        title="Payments"
        description="How much this role can do with payments."
        enabled={perms.payments.enabled}
        onToggle={v => editPerms(p => ({ ...p, payments: { ...p.payments, enabled: v } }))}
      >
        {(["viewOnly", "viewCollect", "viewCollectEdit", "viewCollectEditRefund"] as PaymentsLevel[]).map(level => (
          <Radio
            key={level}
            checked={perms.payments.level === level}
            onClick={() => editPerms(p => ({ ...p, payments: { ...p.payments, level } }))}
            label={{
              viewOnly: "View only",
              viewCollect: "View and collect",
              viewCollectEdit: "View, collect, and edit",
              viewCollectEditRefund: "View, collect, edit, and refund",
            }[level]}
          />
        ))}
      </FeatureSection>

      {/* Client communications */}
      <FeatureSection
        title="Client communications"
        description="Users will be able to view email and text message history available to them based on their other permissions."
        enabled={perms.clientCommunications}
        onToggle={v => editPerms(p => ({ ...p, clientCommunications: v }))}
      />

      {/* Reports */}
      <FeatureSection
        title="Reports"
        description="Users will only be able to see reports available to them based on their other permissions."
        enabled={perms.reports}
        onToggle={v => editPerms(p => ({ ...p, reports: v }))}
      />
      {/* When Reports is on, grant access to specific reports (RPT-2). */}
      {perms.reports && (
        <div className="mt-4">
          <ReportAccessPanel value={reportAccess} onChange={setReportAccess} />
        </div>
      )}
    </>
  );
}
