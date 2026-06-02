import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────
type BuiltInPreset = "admin" | "employee" | "custom";
type PresetId = BuiltInPreset | string; // string for custom-saved preset ids

interface CustomPreset {
  id: string;
  name: string;
  permissions: PermissionsState;
}

const CUSTOM_PRESETS_KEY = "vision360.customPresets";

const loadCustomPresets = (): CustomPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? (JSON.parse(raw) as CustomPreset[]) : [];
  } catch {
    return [];
  }
};

const saveCustomPresets = (presets: CustomPreset[]) => {
  try {
    window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota errors */
  }
};

type ScheduleLevel = "viewOwn" | "viewCompleteOwn" | "editOwn" | "editAll" | "editDeleteAll";
type TimeLevel = "viewRecordOwn" | "viewRecordEditOwn" | "viewRecordEditAll";
type NotesLevel = "viewJobsOnly" | "viewAll" | "viewEditAll" | "viewEditDeleteAll";
type ExpensesLevel = "viewRecordEditOwn" | "viewRecordEditAll";
type ClientsLevel = "nameAddressOnly" | "viewFull" | "viewEditFull" | "viewEditDeleteFull";
type DocLevel = "viewOnly" | "viewCreateEdit" | "viewCreateEditDelete";
type PaymentsScope = "estimatesOnly" | "invoicesOnly" | "both";

interface PermissionsState {
  isAdmin: boolean;
  schedule: { enabled: boolean; level: ScheduleLevel };
  timeTracking: { enabled: boolean; level: TimeLevel };
  notes: { enabled: boolean; level: NotesLevel };
  expenses: { enabled: boolean; level: ExpensesLevel };
  showPricing: boolean;
  jobCosting: boolean;
  clients: { enabled: boolean; level: ClientsLevel; showOnMenu: boolean };
  estimates: { enabled: boolean; level: DocLevel; showOnMenu: boolean };
  jobs: { enabled: boolean; level: DocLevel; showOnMenu: boolean };
  invoices: { enabled: boolean; level: DocLevel; showOnMenu: boolean };
  payments: { enabled: boolean; scope: PaymentsScope };
  clientCommunications: boolean;
  reports: boolean;
}

// ─── Preset definitions ──────────────────────────────────────────────────────
const employeePreset: PermissionsState = {
  isAdmin: false,
  schedule: { enabled: true, level: "viewCompleteOwn" },
  timeTracking: { enabled: true, level: "viewRecordOwn" },
  notes: { enabled: true, level: "viewEditAll" },
  expenses: { enabled: true, level: "viewRecordEditOwn" },
  showPricing: false,
  jobCosting: false,
  clients: { enabled: true, level: "viewFull", showOnMenu: false },
  estimates: { enabled: false, level: "viewOnly", showOnMenu: false },
  jobs: { enabled: true, level: "viewOnly", showOnMenu: false },
  invoices: { enabled: false, level: "viewOnly", showOnMenu: false },
  payments: { enabled: false, scope: "both" },
  clientCommunications: false,
  reports: false,
};

const adminPreset: PermissionsState = {
  isAdmin: true,
  schedule: { enabled: true, level: "editDeleteAll" },
  timeTracking: { enabled: true, level: "viewRecordEditAll" },
  notes: { enabled: true, level: "viewEditDeleteAll" },
  expenses: { enabled: true, level: "viewRecordEditAll" },
  showPricing: true,
  jobCosting: true,
  clients: { enabled: true, level: "viewEditDeleteFull", showOnMenu: true },
  estimates: { enabled: true, level: "viewCreateEditDelete", showOnMenu: true },
  jobs: { enabled: true, level: "viewCreateEditDelete", showOnMenu: true },
  invoices: { enabled: true, level: "viewCreateEditDelete", showOnMenu: true },
  payments: { enabled: true, scope: "both" },
  clientCommunications: true,
  reports: true,
};

// Enabling Payments also grants the permissions it depends on, exactly as the
// section's description promises ("Turning this on will apply the required
// permissions below"). Any higher access the user already has is preserved.
const grantPaymentsPrereqs = (p: PermissionsState): PermissionsState => ({
  ...p,
  showPricing: true,
  clients: {
    ...p.clients,
    enabled: true,
    level: p.clients.level === "viewEditDeleteFull" ? "viewEditDeleteFull" : "viewEditFull",
  },
  estimates: {
    ...p.estimates,
    enabled: true,
    level: p.estimates.level === "viewCreateEditDelete" ? "viewCreateEditDelete" : "viewCreateEdit",
  },
  invoices: {
    ...p.invoices,
    enabled: true,
    level: p.invoices.level === "viewCreateEditDelete" ? "viewCreateEditDelete" : "viewCreateEdit",
  },
});

// ─── Small UI helpers ────────────────────────────────────────────────────────
const Radio = ({
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
    <span className="flex flex-col">
      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{label}</span>
      {description && <span className="text-[12px] text-[#6B7280] leading-relaxed">{description}</span>}
    </span>
  </button>
);

const Toggle = ({
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

const FeatureSection = ({
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
        {description && (
          <p className="text-[12px] text-[#6B7280] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {toggleable && onToggle && <Toggle on={enabled} onChange={onToggle} />}
    </div>
    {enabled && children && <div className="flex flex-col gap-1.5 pl-1">{children}</div>}
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────
export function NewUser() {
  const navigate = useNavigate();

  // Personal info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [laborCost, setLaborCost] = useState("0.00");

  // Permissions
  const [preset, setPreset] = useState<PresetId>("employee");
  const [perms, setPerms] = useState<PermissionsState>(employeePreset);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => loadCustomPresets());
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Persist custom presets
  useEffect(() => {
    saveCustomPresets(customPresets);
  }, [customPresets]);

  // Communications
  const [language, setLanguage] = useState<"english" | "spanish">("english");

  const applyPreset = (next: PresetId) => {
    setPreset(next);
    if (next === "admin") setPerms(adminPreset);
    else if (next === "employee") setPerms(employeePreset);
    else if (next !== "custom") {
      const found = customPresets.find(cp => cp.id === next);
      if (found) setPerms(found.permissions);
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
    const next: CustomPreset = { id, name, permissions: perms };
    setCustomPresets(prev => [...prev, next]);
    setPreset(id);
    setNewPresetName("");
    setShowSavePresetInput(false);
    toast.success(`Saved preset "${name}"`);
  };

  const deleteCustomPreset = (id: string) => {
    const target = customPresets.find(cp => cp.id === id);
    if (!target) return;
    setCustomPresets(prev => prev.filter(cp => cp.id !== id));
    if (preset === id) {
      setPreset("custom");
    }
    toast.success(`Deleted preset "${target.name}"`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    toast.success(`Invitation sent to ${email}`);
    navigate("/settings?section=team");
  };

  // ── Validation helpers for Payments dependencies ──
  const docHasEdit = (d: { enabled: boolean; level: DocLevel }) =>
    d.enabled && (d.level === "viewCreateEdit" || d.level === "viewCreateEditDelete");
  const clientsHasEdit =
    perms.clients.enabled &&
    (perms.clients.level === "viewEditFull" || perms.clients.level === "viewEditDeleteFull");
  const docsHasEdit = docHasEdit(perms.estimates) || docHasEdit(perms.invoices);
  const paymentsReady = perms.showPricing && clientsHasEdit && docsHasEdit;

  // Reverse dependency: if a required permission is later removed, Payments
  // turns off automatically — the other half of the description's promise.
  useEffect(() => {
    if (perms.payments.enabled && !paymentsReady) {
      setPerms(p => ({ ...p, payments: { ...p.payments, enabled: false } }));
    }
  }, [perms.payments.enabled, paymentsReady]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-6">
          <button
            type="button"
            onClick={() => navigate("/settings?section=team")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-4"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Manage Team</span>
          </button>
          <h1 className="text-[26px] text-[#1A2332]" style={{ fontWeight: 700 }}>New User</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white">
          <div className="px-8 py-8">
            <div className="space-y-10">

              {/* ── Personal Info ─────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Personal info</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left column: contact */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Full name *</Label>
                      <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Full name"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Email address *</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Mobile phone number (if applicable)</Label>
                      <Input
                        value={mobile}
                        onChange={e => setMobile(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Right column: address */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Street address</Label>
                      <Input
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="123 Main St"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>State / Province</Label>
                      <Input
                        value={state}
                        onChange={e => setState(e.target.value)}
                        placeholder="State"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Postal code</Label>
                        <Input
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value)}
                          placeholder="12345"
                          className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Country</Label>
                        <Input
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labor cost */}
                <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Labor cost</h3>
                    <span
                      className="material-icons text-[#9CA3AF]"
                      style={{ fontSize: "16px" }}
                      title="Used for job costing calculations"
                    >
                      help_outline
                    </span>
                  </div>
                  <div className="max-w-[260px]">
                    <Label className="text-[11px] text-[#6B7280] mb-1 block">Employee cost</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[14px]">$</span>
                      <Input
                        type="text"
                        value={laborCost}
                        onChange={e => setLaborCost(e.target.value)}
                        className="border-[#E5E7EB] bg-white h-10 text-[14px] pl-7 pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-[12px]">per hour</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Permissions ───────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Permissions</h2>

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
                  {(["viewOwn", "viewCompleteOwn", "editOwn", "editAll", "editDeleteAll"] as ScheduleLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.schedule.level === level}
                      onClick={() => editPerms(p => ({ ...p, schedule: { ...p.schedule, level } }))}
                      label={{
                        viewOwn: "View their own schedule",
                        viewCompleteOwn: "View and complete their own schedule",
                        editOwn: "Edit their own schedule",
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
                  {(["viewJobsOnly", "viewAll", "viewEditAll", "viewEditDeleteAll"] as NotesLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.notes.level === level}
                      onClick={() => editPerms(p => ({ ...p, notes: { ...p.notes, level } }))}
                      label={{
                        viewJobsOnly: "View notes on jobs and visits only",
                        viewAll: "View all notes",
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
                  {(["viewRecordEditOwn", "viewRecordEditAll"] as ExpensesLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.expenses.level === level}
                      onClick={() => editPerms(p => ({ ...p, expenses: { ...p.expenses, level } }))}
                      label={{
                        viewRecordEditOwn: "View, record, and edit their own",
                        viewRecordEditAll: "View, record, and edit everyone's",
                      }[level]}
                    />
                  ))}
                </FeatureSection>

                {/* Show pricing */}
                <FeatureSection
                  title="Show pricing"
                  description="Allows editing of estimates, invoices, and line items on jobs."
                  enabled={perms.showPricing}
                  onToggle={v => editPerms(p => ({ ...p, showPricing: v, jobCosting: v ? p.jobCosting : false }))}
                />

                {/* Job costing */}
                <FeatureSection
                  title="Job costing"
                  description={
                    perms.showPricing && perms.timeTracking.enabled && perms.expenses.enabled
                      ? "Show job profit by tracking revenue and costs from line items, labor, and expenses."
                      : "Show job profit by tracking revenue and costs from line items, labor, and expenses. Turn on Show pricing, Time tracking, and Expenses to give access to job costing."
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
                  {(["nameAddressOnly", "viewFull", "viewEditFull", "viewEditDeleteFull"] as ClientsLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.clients.level === level}
                      onClick={() => editPerms(p => ({ ...p, clients: { ...p.clients, level } }))}
                      label={{
                        nameAddressOnly: "View client name and address only",
                        viewFull: "View full client and property info",
                        viewEditFull: "View and edit full client and property info",
                        viewEditDeleteFull: "View, edit, and delete full client and property info",
                      }[level]}
                    />
                  ))}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perms.clients.showOnMenu}
                      onChange={e => editPerms(p => ({ ...p, clients: { ...p.clients, showOnMenu: e.target.checked } }))}
                      className="w-4 h-4 accent-[#4A6FA5]"
                    />
                    <span className="text-[13px] text-[#374151]">Show clients on their Vision360 menu</span>
                  </label>
                </FeatureSection>

                {/* Estimates */}
                <FeatureSection
                  title="Estimates"
                  enabled={perms.estimates.enabled}
                  onToggle={v => editPerms(p => ({ ...p, estimates: { ...p.estimates, enabled: v } }))}
                >
                  {(["viewOnly", "viewCreateEdit", "viewCreateEditDelete"] as DocLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.estimates.level === level}
                      onClick={() => editPerms(p => ({ ...p, estimates: { ...p.estimates, level } }))}
                      label={{
                        viewOnly: "View only",
                        viewCreateEdit: "View, create, and edit estimates; view and apply estimate templates",
                        viewCreateEditDelete: "View, create, edit, and delete estimates; view and apply estimate templates",
                      }[level]}
                    />
                  ))}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perms.estimates.showOnMenu}
                      onChange={e => editPerms(p => ({ ...p, estimates: { ...p.estimates, showOnMenu: e.target.checked } }))}
                      className="w-4 h-4 accent-[#4A6FA5]"
                    />
                    <span className="text-[13px] text-[#374151]">Show estimates on their Vision360 menu</span>
                  </label>
                </FeatureSection>

                {/* Jobs */}
                <FeatureSection
                  title="Jobs"
                  enabled={perms.jobs.enabled}
                  onToggle={v => editPerms(p => ({ ...p, jobs: { ...p.jobs, enabled: v } }))}
                >
                  {(["viewOnly", "viewCreateEdit", "viewCreateEditDelete"] as DocLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.jobs.level === level}
                      onClick={() => editPerms(p => ({ ...p, jobs: { ...p.jobs, level } }))}
                      label={{
                        viewOnly: "View only",
                        viewCreateEdit: "View, create, and edit",
                        viewCreateEditDelete: "View, create, edit, and delete",
                      }[level]}
                      disabled={level !== "viewOnly" && perms.schedule.level !== "editOwn" && perms.schedule.level !== "editAll" && perms.schedule.level !== "editDeleteAll"}
                    />
                  ))}
                  <p className="text-[12px] text-[#6B7280] mt-1">
                    Select <span style={{ fontWeight: 600 }}>edit their own schedule</span> or higher to create and edit jobs.
                  </p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perms.jobs.showOnMenu}
                      onChange={e => editPerms(p => ({ ...p, jobs: { ...p.jobs, showOnMenu: e.target.checked } }))}
                      className="w-4 h-4 accent-[#4A6FA5]"
                    />
                    <span className="text-[13px] text-[#374151]">Show jobs on their Vision360 menu</span>
                  </label>
                </FeatureSection>

                {/* Invoices */}
                <FeatureSection
                  title="Invoices"
                  enabled={perms.invoices.enabled}
                  onToggle={v => editPerms(p => ({ ...p, invoices: { ...p.invoices, enabled: v } }))}
                >
                  {(["viewOnly", "viewCreateEdit", "viewCreateEditDelete"] as DocLevel[]).map(level => (
                    <Radio
                      key={level}
                      checked={perms.invoices.level === level}
                      onClick={() => editPerms(p => ({ ...p, invoices: { ...p.invoices, level } }))}
                      label={{
                        viewOnly: "View only",
                        viewCreateEdit: "View, create, and edit",
                        viewCreateEditDelete: "View, create, edit, and delete",
                      }[level]}
                    />
                  ))}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perms.invoices.showOnMenu}
                      onChange={e => editPerms(p => ({ ...p, invoices: { ...p.invoices, showOnMenu: e.target.checked } }))}
                      className="w-4 h-4 accent-[#4A6FA5]"
                    />
                    <span className="text-[13px] text-[#374151]">Show invoices on their Vision360 menu</span>
                  </label>
                </FeatureSection>

                {/* Payments */}
                <FeatureSection
                  title="Payments"
                  description="Allow payment collection on estimates and invoices. Turning this on will apply the required permissions below. If any of them are removed, payments will also be removed automatically."
                  enabled={perms.payments.enabled}
                  onToggle={v => editPerms(p => v
                    ? { ...grantPaymentsPrereqs(p), payments: { ...p.payments, enabled: true } }
                    : { ...p, payments: { ...p.payments, enabled: false } })}
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B7280] mb-3">
                    <span style={{ fontWeight: 500 }}>Required permissions:</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-icons" style={{ fontSize: "14px", color: perms.showPricing ? "#16A34A" : "#DC2626" }}>
                        {perms.showPricing ? "check" : "close"}
                      </span>
                      Show pricing
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-icons" style={{ fontSize: "14px", color: clientsHasEdit ? "#16A34A" : "#DC2626" }}>
                        {clientsHasEdit ? "check" : "close"}
                      </span>
                      Clients and Properties: Edit access
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-icons" style={{ fontSize: "14px", color: docsHasEdit ? "#16A34A" : "#DC2626" }}>
                        {docsHasEdit ? "check" : "close"}
                      </span>
                      Estimates and/or Invoices: Edit access
                    </span>
                  </div>
                  {(["estimatesOnly", "invoicesOnly", "both"] as PaymentsScope[]).map(scope => (
                    <Radio
                      key={scope}
                      checked={perms.payments.scope === scope}
                      onClick={() => editPerms(p => ({ ...p, payments: { ...p.payments, scope } }))}
                      label={{
                        estimatesOnly: "Collect on estimates only",
                        invoicesOnly: "Collect on invoices only",
                        both: "Collect on both",
                      }[scope]}
                      disabled={scope === "estimatesOnly" ? !docHasEdit(perms.estimates) : scope === "invoicesOnly" ? !docHasEdit(perms.invoices) : !docsHasEdit}
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
              </section>

              {/* ── Communications ────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Communications</h2>

                <div>
                  <h3 className="text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Invitation language</h3>
                  <p className="text-[12px] text-[#6B7280] mb-3">
                    The chosen language <span style={{ fontWeight: 600 }}>only applies to the invitation and cannot be changed once sent.</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    <Radio
                      checked={language === "english"}
                      onClick={() => setLanguage("english")}
                      label="English"
                    />
                    <Radio
                      checked={language === "spanish"}
                      onClick={() => setLanguage("spanish")}
                      label="Spanish"
                      description="The mobile app is available in Spanish only to non-admin users who have their phone language set to Spanish"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#F9FAFB] border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/settings?section=team")}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-10 px-6 text-white"
            >
              Save User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
