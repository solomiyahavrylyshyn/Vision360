import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { ColumnSettingsIcon } from "../components/ui/column-settings-icon";
import { companyStore } from "../stores/companyStore";
import { countiesStore } from "../stores/countiesStore";
import { relationshipsStore } from "../stores/relationshipsStore";
import { customFieldsStore, type CfEntity, type CfFieldType } from "../stores/customFieldsStore";
import { jobTypesStore } from "../stores/jobTypesStore";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { formatScheduleHour, parseScheduleHour, scheduleSettingsStore } from "../stores/scheduleSettingsStore";
import { tagsStore } from "../stores/tagsStore";
import { applyBrandTheme, DEFAULT_BRAND_THEME, getStoredBrandLogo, getStoredBrandTheme, resetBrandLogo, resetBrandTheme, setBrandLogo } from "../utils/brandTheme";
import { businessHoursStore, type BusinessHourRow } from "../stores/businessHoursStore";
import { regionalSettingsStore, type RegionalSettings } from "../stores/regionalSettingsStore";

type SettingsSection =
  | "home"
  | "companyInfo"
  | "companyProfile"
  | "team"
  | "billing"
  | "general"
  | "jobs"
  | "estimates"
  | "invoices"
  | "items"
  | "finance"
  | "integrations"
  | "customFields"
  | "profile"
  | "business"
  | "security"
  | "taxes"
  | "localization"
  | "relationships";

const sectionAliases: Partial<Record<SettingsSection, SettingsSection>> = {
  profile: "companyProfile",
  business: "companyInfo",
  security: "team",
  taxes: "general",
  home: "companyInfo",
};

const navGroups: Array<{
  title: string;
  icon: string;
  items: Array<{ id: SettingsSection; label: string; description?: string }>;
}> = [
  {
    title: "Business management",
    icon: "business",
    items: [
      { id: "companyInfo", label: "Company info", description: "Company name, address, contact details" },
      { id: "companyProfile", label: "Company profile", description: "About, branding, taxes, regional" },
      { id: "team", label: "Manage team", description: "Users, roles, employee access" },
      { id: "billing", label: "Billing & plan", description: "Core plan, users, subscription payments" },
    ],
  },
  {
    title: "System preferences",
    icon: "settings",
    items: [
      { id: "general", label: "General", description: "Industry, custom fields, legal texts" },
      { id: "localization", label: "Localization", description: "Language, date / time format, time zone, week start" },
      { id: "jobs", label: "Jobs", description: "Job types, schedule, signatures, notes" },
      { id: "estimates", label: "Estimates", description: "Templates, deposits, terms" },
      { id: "invoices", label: "Invoices", description: "Templates, signatures, receipt notes" },
      { id: "items", label: "Items", description: "Catalog and item settings" },
      { id: "relationships", label: "Relationships", description: "Relationship types for additional client contacts" },
    ],
  },
  {
    title: "Finance center",
    icon: "account_balance",
    items: [
      { id: "finance", label: "Payments", description: "Payment gateway, payout bank, methods" },
    ],
  },
  {
    title: "Integrations",
    icon: "extension",
    items: [
      { id: "integrations", label: "Connected apps", description: "QuickBooks, Zapier, Mailchimp, GoHighLevel" },
    ],
  },
];

const taxRates = [
  { name: "Lviv Sales Tax", rate: "23%", jurisdiction: "Lviv Oblast" },
  { name: "Lviv Airport Fee", rate: "0.5%", jurisdiction: "Lviv Airport" },
  { name: "Florida State Tax", rate: "6%", jurisdiction: "Florida" },
];

const taxProfiles = [
  { name: "Lviv Airport Tax Profile", rates: "Lviv Sales Tax, Lviv Airport Fee", total: "23.5%", default: true },
  { name: "Florida Standard", rates: "Florida State Tax", total: "6%", default: false },
];

type AppRole = string;
type PermissionAction = "view" | "create" | "edit" | "delete";
type PermissionRole = { id: string; label: AppRole; locked?: boolean };
type RbacPermission = { area: string; module: string; access: Record<string, PermissionAction[]> };

const teamMembers: Array<{ name: string; username: string; phone: string; email: string; role: AppRole; rate: string; status: string }> = [
  { name: "Peter Novak", username: "novak.peter", phone: "+1-813-555-0184", email: "peter@omega-home.com", role: "Admin", rate: "$0/hr", status: "Active" },
  { name: "Emily Parker", username: "parker.emily", phone: "+1-234-234-5555", email: "parker.emily@email.com", role: "Employee", rate: "$28/hr", status: "Active" },
  { name: "Elliot Harper", username: "harper.elliot", phone: "+1-813-555-0198", email: "elliot@omega-home.com", role: "Dispatcher", rate: "$32/hr", status: "Active" },
];

const defaultPermissionRoles: PermissionRole[] = [
  { id: "admin", label: "Admin", locked: true },
  { id: "employee", label: "Employee", locked: true },
  { id: "dispatcher", label: "Dispatcher" },
];

const permissionActionDefinitions: Record<PermissionAction, { label: string; icon: string; description: string }> = {
  view: { label: "View", icon: "visibility", description: "Open the module and see records." },
  create: { label: "Create", icon: "add_circle_outline", description: "Create new records in the module." },
  edit: { label: "Edit", icon: "edit", description: "Update existing module records." },
  delete: { label: "Delete", icon: "delete_outline", description: "Archive or delete module records." },
};

const permissionActionOptions = Object.keys(permissionActionDefinitions) as PermissionAction[];
const fullAccess: PermissionAction[] = ["view", "create", "edit", "delete"];
const readAccess: PermissionAction[] = ["view"];
const writeAccess: PermissionAction[] = ["view", "create", "edit"];

const createAccess = (admin: PermissionAction[], employee: PermissionAction[], dispatcher: PermissionAction[] = []): Record<string, PermissionAction[]> => ({
  Admin: admin,
  Employee: employee,
  Dispatcher: dispatcher,
});

const defaultRbacPermissions: RbacPermission[] = [
  { area: "Business", module: "Company info", access: createAccess(fullAccess, [], readAccess) },
  { area: "Business", module: "Manage team", access: createAccess(fullAccess, [], readAccess) },
  { area: "Business", module: "Billing & plan", access: createAccess(fullAccess, [], []) },
  { area: "Operations", module: "Clients", access: createAccess(fullAccess, writeAccess, writeAccess) },
  { area: "Operations", module: "Jobs", access: createAccess(fullAccess, writeAccess, writeAccess) },
  { area: "Operations", module: "Schedule", access: createAccess(fullAccess, writeAccess, writeAccess) },
  { area: "Sales", module: "Estimates", access: createAccess(fullAccess, writeAccess, readAccess) },
  { area: "Sales", module: "Invoices", access: createAccess(fullAccess, writeAccess, readAccess) },
  { area: "Sales", module: "Payments", access: createAccess(fullAccess, writeAccess, []) },
  { area: "Finance", module: "Expenses", access: createAccess(fullAccess, ["view", "create", "edit"], readAccess) },
  { area: "Finance", module: "Finance settings", access: createAccess(fullAccess, [], []) },
  { area: "System", module: "Settings", access: createAccess(fullAccess, [], []) },
  { area: "System", module: "Reports", access: createAccess(fullAccess, [], readAccess) },
  { area: "System", module: "Integrations", access: createAccess(fullAccess, [], []) },
];

const templateCards = [
  { title: "Classic", description: "Simple layout with logo, totals, and notes." },
  { title: "Modern", description: "More whitespace and a stronger header." },
  { title: "Compact", description: "Good for short estimates and invoices." },
  { title: "Detailed", description: "Best for item-heavy proposals." },
];

const generalIndustryOptions = [
  "Home services",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Landscaping",
  "Cleaning",
  "General contracting",
  "Other",
];

const COMPANY_ABOUT_STORAGE_KEY = "vision360.companyAbout";
const SOCIAL_LINKS_STORAGE_KEY = "vision360.socialLinks";
const DEFAULT_COMPANY_ABOUT = "Omega Home Services is a full-service home maintenance company based in Tampa, FL. We specialize in HVAC, plumbing, and general repairs.";
const DEFAULT_SOCIAL_LINKS = {
  facebook: "",
  instagram: "https://instagram.com/omega-home",
  linkedin: "",
  website: "https://omega-home.com",
};

const readStoredText = (key: string, fallback: string) => {
  if (typeof localStorage === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
};

const readStoredSocialLinks = () => {
  if (typeof localStorage === "undefined") return DEFAULT_SOCIAL_LINKS;
  try {
    return { ...DEFAULT_SOCIAL_LINKS, ...JSON.parse(localStorage.getItem(SOCIAL_LINKS_STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULT_SOCIAL_LINKS;
  }
};

const customFieldEntities: CfEntity[] = ["clients", "jobs", "estimates", "invoices", "items", "team"];
const customFieldEntityLabels: Record<CfEntity, string> = {
  clients: "Clients",
  jobs: "Jobs",
  estimates: "Estimates",
  invoices: "Invoices",
  items: "Items",
  team: "Team",
};

function normalizeSection(section: SettingsSection): SettingsSection {
  return sectionAliases[section] ?? section;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>{title}</h1>
        <p className="mt-1.5 max-w-[740px] text-[14px] leading-5 text-[#546478]">{description}</p>
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({ id, title, description, children, headerAction, className = "" }: { id?: string; title: string; description?: string; children: React.ReactNode; headerAction?: React.ReactNode; className?: string }) {
  return (
    <Card id={id} className={`scroll-mt-4 border border-[#E5E7EB] bg-white p-4 shadow-none ${className}`}>
      <div className="mb-0 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">{description}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      {children}
    </Card>
  );
}

function DocSection({ label, defaultValue }: { label: string; defaultValue: string }) {
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{label}</label>
      <textarea defaultValue={defaultValue} className="min-h-[80px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[13px] text-[#374151] leading-relaxed outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />

      {/* Attachment row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-[12px] text-[#546478] hover:text-[#1A2332] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "15px" }}>upload_file</span>
          {fileName ? "Replace file" : "Upload file"}
        </button>
        <div className="w-px h-3.5 bg-[#E5E7EB]" />
        <button
          type="button"
          onClick={() => { setShowLink(v => !v); if (showLink) setLink(""); }}
          className="flex items-center gap-1.5 text-[12px] text-[#546478] hover:text-[#1A2332] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "15px" }}>link</span>
          {showLink ? "Remove link" : "Add link"}
        </button>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }} />
      </div>

      {/* Uploaded file chip */}
      {fileName && (
        <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>description</span>
          <span className="flex-1 text-[13px] text-[#374151] truncate">{fileName}</span>
          <button type="button" onClick={() => setFileName("")} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
          </button>
        </div>
      )}

      {/* Link input */}
      {showLink && (
        <div className="flex items-center gap-2 rounded-lg border border-[#D8DEE8] px-3 py-2 focus-within:border-[#4A6FA5] focus-within:ring-2 focus-within:ring-[#4A6FA5]/20 transition-all">
          <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>link</span>
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://yourdomain.com/terms"
            className="flex-1 text-[13px] text-[#374151] outline-none bg-transparent placeholder:text-[#9CA3AF]"
          />
          {link && (
            <button type="button" onClick={() => setLink("")} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
              <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type TaxRateRow = { id: string; name: string; rate: string; description: string };
type TaxProfileRow = { id: string; name: string; description: string; rateIds: string[] };

function TaxSettingsCard() {
  const [taxIdName, setTaxIdName] = useState("GST");
  const [taxIdNumber, setTaxIdNumber] = useState("123456789");
  const [rates, setRates] = useState<TaxRateRow[]>([
    { id: "r1", name: "Florida State Tax", rate: "6.0", description: "Sales Tax" },
    { id: "r3", name: "Tampa Tax",         rate: "0.5", description: "Sales Tax" },
  ]);
  const [profiles, setProfiles] = useState<TaxProfileRow[]>([
    { id: "g1", name: "Hillsborough County", description: "Combined Florida + Tampa", rateIds: ["r1", "r3"] },
  ]);
  const [defaultId, setDefaultId] = useState<string>("r1");
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string[]>([]);

  const sumProfileRate = (rateIds: string[]) =>
    rateIds.reduce((acc, rid) => acc + (parseFloat(rates.find(r => r.id === rid)?.rate || "0") || 0), 0);

  const addRate = () => {
    const id = `r${Date.now()}`;
    setRates(prev => [...prev, { id, name: "", rate: "", description: "" }]);
  };
  const addProfile = () => {
    const id = `g${Date.now()}`;
    setProfiles(prev => [...prev, { id, name: "", description: "", rateIds: [] }]);
  };
  const removeRate = (id: string) => {
    setRates(prev => prev.filter(r => r.id !== id));
    setProfiles(prev => prev.map(profile => ({ ...profile, rateIds: profile.rateIds.filter(x => x !== id) })));
    if (defaultId === id) setDefaultId(rates.find(r => r.id !== id)?.id ?? profiles[0]?.id ?? "");
  };
  const removeProfile = (id: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== id));
    if (defaultId === id) setDefaultId(rates[0]?.id ?? "");
  };
  const updateRate = (id: string, patch: Partial<TaxRateRow>) =>
    setRates(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  // Validation: rate must be 0-100, and rate names must be unique across rows.
  const rateErrors: Record<string, string | null> = {};
  const lowerNames = rates.map(r => r.name.trim().toLowerCase()).filter(Boolean);
  rates.forEach(r => {
    const raw = r.rate.trim();
    if (!raw) { rateErrors[r.id] = null; return; }
    const n = Number(raw);
    if (!Number.isFinite(n)) rateErrors[r.id] = "Enter a number";
    else if (n < 0) rateErrors[r.id] = "Cannot be negative";
    else if (n > 100) rateErrors[r.id] = "Cannot exceed 100%";
    else rateErrors[r.id] = null;
  });
  const nameErrors: Record<string, string | null> = {};
  rates.forEach(r => {
    const key = r.name.trim().toLowerCase();
    if (!key) { nameErrors[r.id] = null; return; }
    if (lowerNames.filter(n => n === key).length > 1) nameErrors[r.id] = "Duplicate name";
    else nameErrors[r.id] = null;
  });
  const updateProfile = (id: string, patch: Partial<TaxProfileRow>) =>
    setProfiles(prev => prev.map(profile => profile.id === id ? { ...profile, ...patch } : profile));

  const openEditModal = (profile: TaxProfileRow) => {
    setEditingProfile(profile.id);
    setEditDraft([...profile.rateIds]);
  };
  const saveEditModal = () => {
    if (editingProfile) updateProfile(editingProfile, { rateIds: editDraft });
    setEditingProfile(null);
  };

  const inputCls = "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]";

  return (
    <Card className="border border-[#E1E6EF] bg-white shadow-[0_8px_22px_rgba(26,35,50,0.035)]" style={{ padding: 16 }}>
      <div className="flex flex-col gap-4">

        {/* Title */}
        <div className="flex items-center gap-1">
          <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tax settings</span>
        </div>

        {/* Tax ID inputs */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Tax ID name (ex: GST)</label>
              <input value={taxIdName} onChange={e => setTaxIdName(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Tax ID number</label>
              <input value={taxIdNumber} onChange={e => setTaxIdNumber(e.target.value)} className={inputCls} />
            </div>
          </div>
          <span className="text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Tax ID name and number will appear on invoices</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Default + ? */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[#1A2332]">Default</span>
          <span className="relative group inline-flex">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#9CA3AF] text-[10px] text-[#9CA3AF] cursor-help">?</span>
            <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-[260px] rounded-lg bg-[#1A2332] text-white text-[12px] leading-snug px-3 py-2 shadow-lg">
              Select the radio button next to a tax rate or tax profile to make it the default applied to new invoices and jobs.
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A2332] rotate-45" />
            </span>
          </span>
        </div>

        {/* Tax rates sub-section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tax rates</span>
            <button
              type="button"
              onClick={addRate}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
              Create Tax Rate
            </button>
          </div>
          {rates.map(rate => (
            <TaxRow
              key={rate.id}
              kind="rate"
              checked={defaultId === rate.id}
              onCheck={() => setDefaultId(rate.id)}
              onRemove={() => removeRate(rate.id)}
              nameLabel="Tax name"
              rateLabel="Tax rate (%)"
              name={rate.name}
              rateValue={rate.rate}
              description={rate.description}
              rateError={rateErrors[rate.id] ?? null}
              nameError={nameErrors[rate.id] ?? null}
              onNameChange={v => updateRate(rate.id, { name: v })}
              onRateChange={v => updateRate(rate.id, { rate: v })}
              onDescriptionChange={v => updateRate(rate.id, { description: v })}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Tax profiles sub-section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tax profiles</span>
            <button
              type="button"
              onClick={addProfile}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
              Create Tax Profile
            </button>
          </div>
          {profiles.map(profile => {
            const computed = sumProfileRate(profile.rateIds).toFixed(1);
            const rateItems = profile.rateIds.map(rid => rates.find(r => r.id === rid)).filter(Boolean) as TaxRateRow[];
            return (
              <div key={profile.id} className="flex flex-col gap-0">
                <TaxRow
                  kind="profile"
                  checked={defaultId === profile.id}
                  onCheck={() => setDefaultId(profile.id)}
                  onRemove={() => removeProfile(profile.id)}
                  nameLabel="Tax profile name"
                  rateLabel="Tax profile rate (%)"
                  name={profile.name}
                  rateValue={computed}
                  rateLocked
                  description={profile.description}
                  onNameChange={v => updateProfile(profile.id, { name: v })}
                  onDescriptionChange={v => updateProfile(profile.id, { description: v })}
                />
                <div className="flex items-center gap-2 pl-8 min-h-[36px]">
                  <span className="text-[14px] text-[#6B7280]">Tax rates:</span>
                  {rateItems.length === 0
                    ? <span className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-[13px] text-[#64748B]">No tax rates selected yet. Add rates to calculate this profile.</span>
                    : rateItems.map((r, i) => (
                        <span key={r.id} className="flex items-center gap-2">
                          {i > 0 && <span className="w-px self-stretch bg-[#E5E7EB]" />}
                          <span className="text-[14px] text-[#1A2332]">{r.name} ({r.rate}%)</span>
                        </span>
                      ))
                  }
                  <button
                    type="button"
                    onClick={() => openEditModal(profile)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                    title="Edit tax profile rates"
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit tax profile rates modal */}
      {editingProfile && (() => {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingProfile(null)}>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl w-[380px] p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit tax profile rates</span>
                <button onClick={() => setEditingProfile(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {rates.map(rate => {
                  const checked = editDraft.includes(rate.id);
                  return (
                    <label
                      key={rate.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? "border-[#4A6FA5] bg-[#F0F5FF]" : "border-[#E5E7EB] hover:border-[#C8D5E8]"}`}
                      onClick={() => setEditDraft(checked ? editDraft.filter(id => id !== rate.id) : [...editDraft, rate.id])}
                    >
                      <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? "border-[#4A6FA5] bg-[#4A6FA5]" : "border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"}`}>
                        {checked && <span className="material-icons text-white" style={{ fontSize: "11px" }}>check</span>}
                      </div>
                      <div>
                        <div className="text-[14px] text-[#1A2332]">{rate.name || "(unnamed)"}</div>
                        <div className="text-[14px] text-[#6B7280]">{rate.rate}%</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" className="h-9 border-[#E5E7EB] px-4 text-[14px] text-[#1A2332]" onClick={() => setEditingProfile(null)}>Cancel</Button>
                <Button className="h-9 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white px-4 text-[14px]" onClick={saveEditModal}>Save</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </Card>
  );
}

function TaxRow({
  kind, checked, onCheck, onRemove,
  nameLabel, rateLabel, name, rateValue, description, rateLocked,
  rateError, nameError,
  onNameChange, onRateChange, onDescriptionChange,
}: {
  kind: "rate" | "profile";
  checked: boolean;
  onCheck: () => void;
  onRemove: () => void;
  nameLabel: string;
  rateLabel: string;
  name: string;
  rateValue: string;
  description: string;
  rateLocked?: boolean;
  rateError?: string | null;
  nameError?: string | null;
  onNameChange: (v: string) => void;
  onRateChange?: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}) {
  const inputCls = "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]";
  return (
    <div className="flex items-start gap-4 rounded-lg border border-[#E5E7EB] p-4">
      {/* Square radio */}
      <button
        type="button"
        onClick={onCheck}
        aria-pressed={checked}
        className={`mt-[22px] h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? "border-[#4A6FA5] bg-white" : "border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"}`}
      >
        {checked && <span className="h-2 w-2 rounded-[2px] bg-[#4A6FA5]" />}
      </button>

      {/* Fields */}
      <div className="flex flex-1 items-end gap-4">
        <div className="flex flex-col gap-1" style={{ width: 246 }}>
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{nameLabel}</span>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className={`${inputCls} ${nameError ? "border-[#DC2626] focus:border-[#DC2626]" : ""}`}
          />
          {nameError && <span className="text-[12px] text-[#DC2626] mt-0.5">{nameError}</span>}
        </div>
        <div className="flex flex-col gap-1" style={{ width: 118 }}>
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{rateLabel}</span>
          <input
            value={rateValue}
            readOnly={rateLocked}
            onChange={e => onRateChange?.(e.target.value)}
            inputMode="decimal"
            min={0}
            max={100}
            className={`${inputCls} ${rateLocked ? "bg-[#F9FAFB]" : ""} ${rateError ? "border-[#DC2626] focus:border-[#DC2626]" : ""}`}
          />
          {rateError && <span className="text-[12px] text-[#DC2626] mt-0.5">{rateError}</span>}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Internal tax description</span>
          <input value={description} onChange={e => onDescriptionChange(e.target.value)} className={inputCls} />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
          style={{ opacity: checked ? 0.5 : 1 }}
          title="Remove"
        >
          <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
        </button>
      </div>
    </div>
  );
}

// Regional settings dropdowns: Country / Language / Timezone / Date format / Time format / First day
function RegionalSettingsCard() {
  const regionalSettings = useSyncExternalStore(regionalSettingsStore.subscribe, regionalSettingsStore.getSnapshot);
  const selectCls =
    "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] appearance-none cursor-pointer";
  const labelCls = "block text-[14px] text-[#1A2332] mb-1" as const;

  function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-1">
        <span className={labelCls} style={{ fontWeight: 500 }}>{label}</span>
        <div className="relative">
          <select className={selectCls} value={value} onChange={e => onChange(e.target.value)}>{children}</select>
          <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Regional settings</span>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <SelectField label="Country" value={regionalSettings.country} onChange={value => regionalSettingsStore.setSettings({ country: value })}>
              <option>United States</option>
              <option>Ukraine</option>
              <option>Canada</option>
              <option>Cyprus</option>
            </SelectField>
          </div>
          <div className="flex-1">
            <SelectField label="Language" value={regionalSettings.language} onChange={value => regionalSettingsStore.setSettings({ language: value })}>
              <option>English</option>
              <option>Spanish</option>
            </SelectField>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SelectField label="Time zone" value={regionalSettings.timeZone} onChange={value => regionalSettingsStore.setSettings({ timeZone: value })}>
              <option value="America/New_York">EST - America/New_York</option>
              <option value="America/Chicago">CST - America/Chicago</option>
              <option value="America/Denver">MST - America/Denver</option>
              <option value="America/Los_Angeles">PST - America/Los_Angeles</option>
              <option value="Europe/Kyiv">EET - Europe/Kyiv</option>
            </SelectField>
          </div>
          <div className="flex-1">
            <SelectField label="Date format" value={regionalSettings.dateFormat} onChange={value => regionalSettingsStore.setSettings({ dateFormat: value as RegionalSettings["dateFormat"] })}>
              <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MMM D, YYYY">MMM D, YYYY</option>
            </SelectField>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SelectField label="Time format" value={regionalSettings.timeFormat} onChange={value => regionalSettingsStore.setSettings({ timeFormat: value as RegionalSettings["timeFormat"] })}>
              <option value="12h">12h</option>
              <option value="24h">24h</option>
            </SelectField>
          </div>
          <div className="flex-1">
            <SelectField label="First day of week" value={regionalSettings.firstDayOfWeek} onChange={value => regionalSettingsStore.setSettings({ firstDayOfWeek: value as RegionalSettings["firstDayOfWeek"] })}>
              <option>Sunday</option>
              <option>Monday</option>
            </SelectField>
          </div>
        </div>
      </div>
    </div>
  );
}

// Business hours — day rows with checkbox + time inputs
function BusinessHoursCard({ footer }: { footer?: React.ReactNode }) {
  const rows = useSyncExternalStore(businessHoursStore.subscribe, businessHoursStore.getSnapshot);
  const updateRow = (i: number, patch: Partial<BusinessHourRow>) =>
    businessHoursStore.setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const inputCls = "h-9 w-[90px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Business hours</span>
        <p className="text-[14px] leading-5 text-[#6B7280]">
          Business hours set your default availability for{" "}
          <a className="text-[#4A6FA5] hover:underline" href="#online-booking">online booking</a>, team members, and{" "}
          <a className="text-[#4A6FA5] hover:underline" href="#request">request forms</a>.
        </p>
      </div>

      {/* Day rows */}
      {rows.map((r, i) => (
        <div key={r.day} className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
          {/* Day name */}
          <span className="shrink-0 text-[14px] text-[#1A2332]" style={{ width: 80, fontWeight: 600 }}>{r.day}</span>
          {/* Divider */}
          <div className="shrink-0 w-px h-6 bg-[#E5E7EB]" />
          {/* Checkbox + label */}
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => updateRow(i, { open: !r.open })}
              className="shrink-0 h-4 w-4 rounded flex items-center justify-center transition-colors"
              style={{
                background: r.open ? "#4A6FA5" : "#FFFFFF",
                border: `1px solid ${r.open ? "#4A6FA5" : "#E5E7EB"}`,
                boxShadow: r.open ? "none" : "0px 1px 2px rgba(0,0,0,0.05)",
                borderRadius: 4,
              }}
              aria-pressed={r.open}
            >
              {r.open && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="text-[14px] text-[#1A2332]">Open</span>
          </div>
          {/* Time inputs */}
          <div className="flex items-center gap-3" style={{ opacity: r.open ? 1 : 0.5 }}>
            <input
              value={r.from}
              onChange={e => updateRow(i, { from: e.target.value })}
              disabled={!r.open}
              className={inputCls}
            />
            <span className="text-[14px] text-[#1A2332]">-</span>
            <input
              value={r.to}
              onChange={e => updateRow(i, { to: e.target.value })}
              disabled={!r.open}
              className={inputCls}
            />
          </div>
        </div>
      ))}

      {/* Footer */}
      {footer && (
        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function BillingAndPlanSection() {
  const BASE_PRICE = 49;
  const PER_USER = 15;
  const userCount = 3;
  const monthly = BASE_PRICE + PER_USER * userCount;

  const [card, setCard] = useState({
    brand: "Visa",
    last4: "4242",
    expiry: "12/2026",
    holder: "Peter Novak",
    billingEmail: "billing@omega-home.com",
    billingZip: "33606",
    country: "United States",
  });
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [draftCard, setDraftCard] = useState(card);

  const history = [
    { id: "INV-2026-05", label: "May 2026",      amount: 94, status: "Paid", date: "May 1, 2026"  },
    { id: "INV-2026-04", label: "April 2026",    amount: 94, status: "Paid", date: "Apr 1, 2026"  },
    { id: "INV-2026-03", label: "March 2026",    amount: 94, status: "Paid", date: "Mar 1, 2026"  },
    { id: "INV-2026-02", label: "February 2026", amount: 94, status: "Paid", date: "Feb 1, 2026"  },
    { id: "INV-2026-01", label: "January 2026",  amount: 94, status: "Paid", date: "Jan 1, 2026"  },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Page header */}
      <div className="flex h-[60px] items-start justify-between">
        <h2 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 600 }}>Billing &amp; plan</h2>
      </div>

      <div className="flex flex-col gap-4">

      {/* 2-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Plan card */}
          <div className="flex h-[389px] flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex h-[112px] items-start justify-between gap-6">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Vision360 Core</span>
                  <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] leading-4 text-[#16A34A]" style={{ fontWeight: 500, background: "rgba(22,163,74,0.15)" }}>Active</span>
                </div>
                <span className="text-[14px] leading-5 text-[#6B7280]">Core module — schedule, clients, jobs, estimates, invoices, payments, expenses, items.</span>
                <span className="text-[14px] leading-5 text-[#6B7280]">MVP ships with one plan only. Plan switching opens up when Pro and Enterprise launch.</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 shrink-0">
                <span className="text-[28px] leading-[120%] text-[#1A2332]" style={{ fontWeight: 600 }}>${monthly}</span>
                <span className="text-[12px] leading-4 text-[#6B7280]">per month</span>
              </div>
            </div>
            {/* What's included inner card */}
            <div className="flex flex-col gap-2 rounded-lg border border-[#E5E7EB] p-4">
              <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>What's included</span>
              <div className="flex items-center justify-between">
                <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>Base subscription</span>
                <span className="text-[12px] leading-4 text-[#1A2332]" style={{ fontWeight: 600 }}>${BASE_PRICE}.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>{userCount} users × ${PER_USER} / user</span>
                <span className="text-[12px] leading-4 text-[#1A2332]" style={{ fontWeight: 600 }}>${PER_USER * userCount}.00</span>
              </div>
              <div className="h-px bg-[#E5E7EB]" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Total monthly</span>
                <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 600 }}>${monthly}.00</span>
              </div>
              <p className="text-[12px] leading-4 text-[#6B7280]">Adding or removing users in Manage Team prorates this total on the next billing cycle.</p>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Subscription changes are handled by your account manager")}
              className="flex h-9 min-h-9 w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-4 text-[14px] leading-5 text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
              style={{ fontWeight: 500 }}
            >
              Cancel subscription
            </button>
          </div>

          {/* Payment method card */}
          <div className="flex min-h-[246px] flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Subscription payment method</span>
              <span className="text-[14px] leading-5 text-[#6B7280]">Stripe-hosted card fields used for monthly Vision360 subscription charges.</span>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 80, height: 48, background: "#1C2B3A" }}>
                <span className="text-white text-[13px]" style={{ fontWeight: 800, letterSpacing: "0.08em" }}>VISA</span>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>•••• •••• •••• {card.last4}</span>
                <span className="text-[14px] leading-5 text-[#6B7280]">{card.holder} · Expires {card.expiry}</span>
                <span className="text-[12px] leading-4 text-[#6B7280]">{card.billingEmail} · ZIP {card.billingZip}</span>
              </div>
              <button
                type="button"
                onClick={() => { setDraftCard(card); setEditCardOpen(true); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors shrink-0"
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <p className="text-[12px] leading-4 text-[#6B7280]">Card number, expiration, CVC, billing ZIP, country, and billing email map to Stripe. Vision360 stores only Stripe IDs and safe card metadata.</p>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Account manager card */}
          <div className="flex h-[228px] flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Your account manager</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4A6FA5] text-white flex items-center justify-center text-[14px] shrink-0" style={{ fontWeight: 600 }}>SH</div>
              <div className="flex flex-col gap-1">
                <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Solomiia Havrylyshyn</span>
                <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>solomiia@vision360.com</span>
              </div>
            </div>
            <p className="text-[14px] leading-5 text-[#6B7280]">Direct email support for MVP customers — Solomiia answers personally. A full support center launches with Pro.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info("Schedule-a-call coming soon")}
                className="h-9 flex-1 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Schedule a call
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "mailto:solomiia@vision360.com?subject=Vision360%20support"; }}
                className="h-9 flex-1 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Email Solomiia
              </button>
            </div>
          </div>

          {/* Payment history card */}
          <div className="flex h-[369px] flex-col gap-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Payment history</span>
              <span className="text-[14px] leading-5 text-[#6B7280]">Last invoices for your subscription.</span>
            </div>
            <div className="relative min-h-0 flex-1">
              <div className="flex h-full flex-col gap-2 overflow-y-auto rounded-lg border border-[#E5E7EB] p-3 pr-2 isolate [scrollbar-gutter:stable]">
                {history.map(row => (
                  <div key={row.id} className="flex h-[76px] shrink-0 items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>{row.label}</span>
                        <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] leading-4 text-[#16A34A]" style={{ fontWeight: 500, background: "rgba(22,163,74,0.15)" }}>{row.status}</span>
                      </div>
                      <span className="text-[14px] leading-5 text-[#6B7280]">{row.date} · {row.id}</span>
                    </div>
                    <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 600 }}>${row.amount}.00</span>
                    <button
                      type="button"
                      onClick={() => toast.success(`Receipt ${row.id} downloaded`)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors shrink-0"
                      title="Download receipt"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 2V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.7 6.7L8 10L11.3 6.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 11.5V14H14V11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {/* Gradient fade overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-lg"
                style={{ height: 93, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 100%)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced plans coming soon — full width */}
      <div className="flex h-[264px] flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Advanced plans coming soon</span>
          <span className="text-[14px] leading-5 text-[#6B7280]">Vision360 Pro and Enterprise are on the roadmap. They add route optimization, dispatching, advanced reporting, multi-location and white-label.</span>
        </div>
        <div className="grid h-[96px] grid-cols-2 gap-4">
          {/* Enterprise card */}
          <div className="flex h-[96px] items-start gap-4 rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[14px] leading-5 text-[#4A6FA5]" style={{ fontWeight: 500 }}>Vision360 Enterprise</span>
              <p className="text-[14px] leading-5 text-[#1A2332]">Multi-location, custom permissions, white-label, dedicated success manager.</p>
            </div>
            <span className="inline-flex items-center shrink-0 rounded-lg px-2 py-0.5 text-[12px] leading-4 text-[#BD800E]" style={{ fontWeight: 500, background: "rgba(189,128,14,0.15)" }}>Coming soon</span>
          </div>
          {/* Pro card */}
          <div className="flex h-[96px] items-start gap-4 rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[14px] leading-5 text-[#4A6FA5]" style={{ fontWeight: 500 }}>Vision360 Pro</span>
              <p className="text-[14px] leading-5 text-[#1A2332]">Route optimization, dispatch board, call tracking, conversion analytics.</p>
            </div>
            <span className="inline-flex items-center shrink-0 rounded-lg px-2 py-0.5 text-[12px] leading-4 text-[#BD800E]" style={{ fontWeight: 500, background: "rgba(189,128,14,0.15)" }}>Coming soon</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => toast.success("You'll be notified when Pro launches")}
            className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Notify me about Pro
          </button>
        </div>
      </div>

      </div>

      {/* Edit card modal */}
      {editCardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-[#1C2B3A]/20 pr-[86px] backdrop-blur-[2px]"
          onClick={() => setEditCardOpen(false)}
        >
          <div
            className="w-[440px] bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit payment method</span>
              <button type="button" onClick={() => setEditCardOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#1A2332] transition-colors">
                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Cardholder name</label>
                <Input value={draftCard.holder} onChange={e => setDraftCard({ ...draftCard, holder: e.target.value })} className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Card number</label>
                <Input value={draftCard.last4} onChange={e => setDraftCard({ ...draftCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="4242" className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                <span className="text-[11px] leading-4 text-[#6B7280]">Prototype shows last 4 only; production uses Stripe Elements.</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Brand</label>
                  <div className="relative">
                    <select value={draftCard.brand} onChange={e => setDraftCard({ ...draftCard, brand: e.target.value })} className="h-9 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]">
                      {["Visa", "Mastercard", "Amex", "Discover"].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Expiry (MM/YYYY)</label>
                  <Input value={draftCard.expiry} onChange={e => setDraftCard({ ...draftCard, expiry: e.target.value })} placeholder="12/2026" className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>CVC</label>
                  <Input value="•••" readOnly className="h-9 border-[#E5E7EB] bg-[#F9FAFB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Billing ZIP</label>
                  <Input value={draftCard.billingZip} onChange={e => setDraftCard({ ...draftCard, billingZip: e.target.value })} placeholder="33606" className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Country</label>
                  <select value={draftCard.country} onChange={e => setDraftCard({ ...draftCard, country: e.target.value })} className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5]">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Spain</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Billing email</label>
                  <Input value={draftCard.billingEmail} onChange={e => setDraftCard({ ...draftCard, billingEmail: e.target.value })} placeholder="billing@company.com" className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button type="button" onClick={() => setEditCardOpen(false)} className="h-9 px-4 rounded-lg border border-[#D8DEE8] text-[#546478] hover:bg-[#F5F7FA] text-[14px] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={() => { setCard(draftCard); setEditCardOpen(false); toast.success("Payment method updated"); }} className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors" style={{ fontWeight: 500 }}>Save card</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny SVG-ish preview of a template — used inside the card thumb
function TemplatePreview({ kind, className }: { kind: string; className?: string }) {
  // Each template has a slightly different mini-layout
  const variants: Record<string, React.ReactNode> = {
    Classic: (
      <>
        <div className="h-3 w-12 rounded bg-[#1A2332]" />
        <div className="mt-1.5 h-2 w-20 rounded bg-[#9CA3AF]/40" />
        <div className="mt-2 space-y-1">
          {[1,2,3].map(i => <div key={i} className="h-1.5 w-full rounded bg-[#E5E7EB]" />)}
        </div>
        <div className="mt-2 ml-auto h-2 w-10 rounded bg-[#4A6FA5]" />
      </>
    ),
    Modern: (
      <>
        <div className="h-4 w-14 rounded bg-[#4A6FA5]" />
        <div className="mt-2 h-1.5 w-24 rounded bg-[#9CA3AF]/30" />
        <div className="mt-3 space-y-1.5">
          {[1,2].map(i => <div key={i} className="h-2 w-full rounded bg-[#E5E7EB]" />)}
        </div>
        <div className="mt-auto pt-2 flex justify-between">
          <div className="h-2 w-8 rounded bg-[#9CA3AF]/40" />
          <div className="h-2 w-10 rounded bg-[#4A6FA5]" />
        </div>
      </>
    ),
    Compact: (
      <>
        <div className="flex items-center justify-between">
          <div className="h-2 w-10 rounded bg-[#1A2332]" />
          <div className="h-2 w-6 rounded bg-[#9CA3AF]/40" />
        </div>
        <div className="mt-1.5 space-y-1">
          {[1,2,3,4].map(i => <div key={i} className="h-1 w-full rounded bg-[#E5E7EB]" />)}
        </div>
        <div className="mt-1.5 ml-auto h-1.5 w-8 rounded bg-[#4A6FA5]" />
      </>
    ),
    Detailed: (
      <>
        <div className="h-3 w-10 rounded bg-[#1A2332]" />
        <div className="mt-1 h-1.5 w-full rounded bg-[#9CA3AF]/30" />
        <div className="mt-2 space-y-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-1">
              <div className="h-1.5 w-8 rounded bg-[#E5E7EB]" />
              <div className="h-1.5 flex-1 rounded bg-[#E5E7EB]" />
              <div className="h-1.5 w-6 rounded bg-[#9CA3AF]/40" />
            </div>
          ))}
        </div>
      </>
    ),
  };
  return (
    <div className={className ?? "mb-2 h-24 rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] p-2 flex flex-col overflow-hidden"}>
      {variants[kind] ?? variants.Classic}
    </div>
  );
}

// Larger preview used inside the modal
function TemplatePreviewLarge({ kind }: { kind: string }) {
  // Reuses the mini variant but at "letter paper" proportions
  const lines = (count: number, w = "100%") => (
    Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-2 rounded bg-[#E5E7EB]" style={{ width: w }} />
    ))
  );
  const headerVariants: Record<string, React.ReactNode> = {
    Classic: (
      <>
        <div className="flex items-start justify-between">
          <div>
            <div className="h-5 w-32 rounded bg-[#1A2332]" />
            <div className="mt-2 h-2 w-40 rounded bg-[#9CA3AF]/40" />
            <div className="mt-1 h-2 w-28 rounded bg-[#9CA3AF]/40" />
          </div>
          <div className="text-right">
            <div className="h-4 w-20 rounded bg-[#4A6FA5] ml-auto" />
            <div className="mt-2 h-2 w-16 rounded bg-[#9CA3AF]/40 ml-auto" />
            <div className="mt-1 h-2 w-12 rounded bg-[#9CA3AF]/40 ml-auto" />
          </div>
        </div>
      </>
    ),
    Modern: (
      <div className="bg-[#4A6FA5] -mx-8 -mt-8 px-8 py-6 mb-6">
        <div className="h-5 w-32 rounded bg-white/80" />
        <div className="mt-2 h-2 w-40 rounded bg-white/40" />
      </div>
    ),
    Compact: (
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="h-4 w-24 rounded bg-[#1A2332]" />
        <div className="h-3 w-20 rounded bg-[#9CA3AF]/40" />
      </div>
    ),
    Detailed: (
      <>
        <div className="h-5 w-40 rounded bg-[#1A2332]" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="h-2 rounded bg-[#9CA3AF]/40" />
          <div className="h-2 rounded bg-[#9CA3AF]/40" />
          <div className="h-2 rounded bg-[#9CA3AF]/40" />
        </div>
        <div className="mt-3 h-px bg-[#E5E7EB]" />
      </>
    ),
  };
  return (
    <div className="w-[440px] bg-white border border-[#E5E7EB] shadow-sm rounded-md p-8" style={{ aspectRatio: "8.5 / 11" }}>
      {headerVariants[kind] ?? headerVariants.Classic}
      <div className="mt-6 space-y-1.5">
        {lines(4)}
      </div>
      <div className="mt-6 grid grid-cols-[1fr_60px_60px_60px] gap-2 pb-1 border-b border-[#E5E7EB]">
        <div className="h-2 rounded bg-[#1A2332]" />
        <div className="h-2 rounded bg-[#1A2332]" />
        <div className="h-2 rounded bg-[#1A2332]" />
        <div className="h-2 rounded bg-[#1A2332]" />
      </div>
      <div className="mt-2 space-y-2">
        {Array.from({ length: kind === "Detailed" ? 7 : kind === "Compact" ? 3 : 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_60px_60px] gap-2">
            <div className="h-2 rounded bg-[#E5E7EB]" />
            <div className="h-2 rounded bg-[#E5E7EB]" />
            <div className="h-2 rounded bg-[#E5E7EB]" />
            <div className="h-2 rounded bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
      <div className="mt-6 ml-auto w-40 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-2 w-16 rounded bg-[#9CA3AF]/40" />
          <div className="h-2 w-12 rounded bg-[#9CA3AF]/40" />
        </div>
        <div className="flex justify-between">
          <div className="h-2 w-16 rounded bg-[#9CA3AF]/40" />
          <div className="h-2 w-12 rounded bg-[#9CA3AF]/40" />
        </div>
        <div className="flex justify-between border-t border-[#E5E7EB] pt-1.5">
          <div className="h-3 w-20 rounded bg-[#1A2332]" />
          <div className="h-3 w-16 rounded bg-[#4A6FA5]" />
        </div>
      </div>
    </div>
  );
}

// Items Preferences — Marek's spec
function ItemsPreferences() {
  type ItemType = { id: string; label: string; color: string; bg: string; core?: boolean };
  const [itemTypes, setItemTypes] = useState<ItemType[]>([
    { id: "service",   label: "Service",   color: "#16A34A", bg: "#DCFCE7", core: true },
    { id: "material",  label: "Material",  color: "#4A6FA5", bg: "#EBF0F8", core: true },
    { id: "equipment", label: "Equipment", color: "#7C3AED", bg: "#EDE9FE", core: true },
    { id: "asset",     label: "Asset",     color: "#0891B2", bg: "#CFFAFE", core: true },
    { id: "fee",       label: "Fee",       color: "#EA580C", bg: "#FFEDD5", core: true },
  ]);
  const [newItemType, setNewItemType] = useState("");
  const [categories, setCategories] = useState<string[]>([
    "Plumbing", "Electrical", "HVAC", "Maintenance", "Parts",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [vendors, setVendors] = useState([
    { id: "v1", name: "HVAC Supply Co.",   code: "HVS",  contact: "orders@hvac-supply.com" },
    { id: "v2", name: "Equipment Depot",   code: "EQD",  contact: "sales@equipdepot.com"  },
    { id: "v3", name: "Square D",          code: "SQD",  contact: "support@squared.com"   },
  ]);
  const [pricebookActive, setPricebookActive] = useState(true);
  const [trackInventory, setTrackInventory] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [defaultMarkup, setDefaultMarkup] = useState("20");

  return (
    <>
      {/* Item Types */}
      <SectionCard title="Item Types" description="Categorize everything you sell. Five core types ship with MVP; add your own as needed.">
        <div className="space-y-2">
          {itemTypes.map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                <span className="text-[12px]" style={{ color: t.color, fontWeight: 800 }}>{t.label[0]}</span>
              </div>
              <label className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 flex-1 max-w-[320px]">
                <span className="text-[11px] text-[#6B7280]">Item type</span>
                <input
                  value={t.label}
                  onChange={e => setItemTypes(itemTypes.map(x => x.id === t.id ? { ...x, label: e.target.value } : x))}
                  className="bg-transparent text-[13px] outline-none mt-0.5"
                  style={{ color: t.color, fontWeight: 600 }}
                />
              </label>
              {t.core ? (
                <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 700 }}>Core</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setItemTypes(itemTypes.filter(x => x.id !== t.id))}
                  className="shrink-0 h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] flex items-center justify-center"
                  title="Remove type"
                >
                  <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={newItemType}
            onChange={e => setNewItemType(e.target.value)}
            placeholder="Add item type (e.g. Bundle, Membership)"
            className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const v = newItemType.trim();
                if (!v) return;
                setItemTypes([...itemTypes, { id: `it${Date.now()}`, label: v, color: "#4A6FA5", bg: "#EBF0F8" }]);
                setNewItemType("");
              }
            }}
          />
          <Button
            className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
            onClick={() => {
              const v = newItemType.trim();
              if (!v) return;
              setItemTypes([...itemTypes, { id: `it${Date.now()}`, label: v, color: "#4A6FA5", bg: "#EBF0F8" }]);
              setNewItemType("");
            }}
          >+ Add type</Button>
        </div>
      </SectionCard>

      {/* Categories */}
      <SectionCard title="Categories" description="Free-form labels used to group items in the catalog (e.g. by trade, by storage location).">
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#1A2332]">
              {c}
              <button onClick={() => setCategories(categories.filter(x => x !== c))} className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]">×</button>
            </span>
          ))}
          {categories.length === 0 && <span className="text-[13px] text-[#9CA3AF]">No categories yet.</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Add category"
            className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const v = newCategory.trim();
                if (!v || categories.includes(v)) return;
                setCategories([...categories, v]); setNewCategory("");
              }
            }}
          />
          <Button
            className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
            onClick={() => { const v = newCategory.trim(); if (!v || categories.includes(v)) return; setCategories([...categories, v]); setNewCategory(""); }}
          >Add</Button>
        </div>
      </SectionCard>

      {/* Pricebook */}
      <SectionCard title="Pricebook" description="Flat-rate items grouped into a service price guide for the field tech.">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Use Pricebook for jobs and estimates</div>
              <div className="text-[13px] text-[#546478]">When enabled, techs pick from pre-priced items instead of typing prices manually.</div>
            </div>
            <Switch checked={pricebookActive} onCheckedChange={setPricebookActive} />
          </div>
          <div className="pt-2 border-t border-[#E5E7EB] grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Default markup on materials</label>
              <div className="flex items-center gap-2">
                <Input value={defaultMarkup} onChange={e => setDefaultMarkup(e.target.value.replace(/\D/g, "").slice(0, 3))} className="h-9 w-24 border-[#D8DEE8] text-[14px]" />
                <span className="text-[14px] text-[#6B7280]">% over cost</span>
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Price display on customer-facing docs</label>
              <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]">
                <option>Show line-item prices</option>
                <option>Show total only</option>
              </select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Equipment Settings */}
      <SectionCard title="Equipment Settings" description="Inventory and equipment-specific behavior.">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Track inventory quantities</div>
              <div className="text-[13px] text-[#546478]">Decrement quantity-on-hand each time an item is added to a job or invoice.</div>
            </div>
            <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Low-stock alerts</div>
              <div className="text-[13px] text-[#546478]">Notify Admin when a tracked item drops below its reorder threshold.</div>
            </div>
            <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
          </div>
        </div>
      </SectionCard>

      {/* Vendors */}
      <SectionCard title="Vendors" description="Suppliers attached to items for cost tracking and reorder.">
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F5F7FA] text-[11px] uppercase tracking-wide text-[#546478]">
              <tr>
                <th className="px-3 py-2 text-left" style={{ fontWeight: 800 }}>Vendor</th>
                <th className="px-3 py-2 text-left w-[100px]" style={{ fontWeight: 800 }}>Code</th>
                <th className="px-3 py-2 text-left" style={{ fontWeight: 800 }}>Contact</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-t border-[#E5E7EB]">
                  <td className="px-3 py-2 text-[#1A2332]" style={{ fontWeight: 600 }}>{v.name}</td>
                  <td className="px-3 py-2 text-[#546478]">{v.code}</td>
                  <td className="px-3 py-2 text-[#546478]">{v.contact}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setVendors(vendors.filter(x => x.id !== v.id))} className="text-[#9CA3AF] hover:text-[#DC2626]" title="Remove">
                      <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8]"
            onClick={() => setVendors([...vendors, { id: `v${Date.now()}`, name: "New vendor", code: "", contact: "" }])}
          >+ Add vendor</Button>

          {/* CSV upload — accepts: name, code, contact (header row optional). */}
          <input
            id="vendor-csv-input"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              // Lightweight CSV parser: split lines, skip blanks, support optional header row,
              // tolerate quoted fields (basic). Columns: name, code, contact.
              const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
              if (rows.length === 0) { toast.error("CSV is empty"); return; }
              const splitCsv = (line: string) => {
                const out: string[] = [];
                let cur = ""; let inQuote = false;
                for (let i = 0; i < line.length; i++) {
                  const c = line[i];
                  if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
                  if (c === '"') { inQuote = !inQuote; continue; }
                  if (c === "," && !inQuote) { out.push(cur); cur = ""; continue; }
                  cur += c;
                }
                out.push(cur);
                return out.map(s => s.trim());
              };
              const first = splitCsv(rows[0]).map(s => s.toLowerCase());
              const hasHeader = first.some(s => ["name", "vendor", "vendor name", "code", "contact"].includes(s));
              const dataRows = hasHeader ? rows.slice(1) : rows;
              const idx = hasHeader
                ? {
                    name: first.findIndex(s => s === "vendor" || s === "name" || s === "vendor name"),
                    code: first.findIndex(s => s === "code"),
                    contact: first.findIndex(s => s === "contact" || s === "email"),
                  }
                : { name: 0, code: 1, contact: 2 };
              const added = dataRows.map((line, i) => {
                const cells = splitCsv(line);
                return {
                  id: `v${Date.now()}-${i}`,
                  name: (cells[idx.name] || "").trim() || "Unnamed vendor",
                  code: (cells[idx.code] || "").trim(),
                  contact: (cells[idx.contact] || "").trim(),
                };
              }).filter(v => v.name && v.name !== "Unnamed vendor");
              if (added.length === 0) { toast.error("No valid vendor rows found"); }
              else {
                setVendors([...vendors, ...added]);
                toast.success(`Imported ${added.length} vendor${added.length === 1 ? "" : "s"}`);
              }
              // reset so the same file can be re-uploaded
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            className="h-9 border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8] inline-flex items-center gap-1.5"
            onClick={() => document.getElementById("vendor-csv-input")?.click()}
            title="Upload a CSV with columns: vendor name, code, contact"
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>upload_file</span>
            Upload CSV
          </Button>
          <span className="text-[12px] text-[#9CA3AF]">CSV columns: vendor name, code, contact</span>
        </div>

        {/* Footer — Save / Cancel attached */}
        <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
          <Button type="button" variant="outline" onClick={() => toast.info("Changes discarded")} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Cancel</Button>
          <Button type="button" onClick={() => toast.success("Item preferences saved")} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Save changes</Button>
        </div>
      </SectionCard>
    </>
  );
}

// Invoices Preferences — Marek's spec
function InvoicesPreferences({ templateCards }: { templateCards: { title: string; description: string }[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Classic");
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [numberingPrefix, setNumberingPrefix] = useState("INV-");
  const [nextNumber, setNextNumber] = useState("1003");
  const [zeroPad, setZeroPad] = useState("4");
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositPercent, setDepositPercent] = useState("25");
  const [paymentTerms, setPaymentTerms] = useState(["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"]);
  const [newPaymentTerm, setNewPaymentTerm] = useState("");
  const [discountTypes, setDiscountTypes] = useState(["Senior", "Veteran", "Promo Code", "Loyalty"]);
  const [newDiscount, setNewDiscount] = useState("");
  const [requireSig, setRequireSig] = useState(true);
  const [requireSigInvoice, setRequireSigInvoice] = useState(false);

  return (
    <>
      {/* Templates */}
      <SectionCard title="Invoice Templates" description="Pick the layout used on every invoice and receipt PDF.">
        <div className="grid grid-cols-4 gap-3">
          {templateCards.map(card => {
            const selected = selectedTemplate === card.title;
            return (
              <div
                key={card.title}
                onClick={() => { setSelectedTemplate(card.title); toast.success(`${card.title} template selected`); }}
                className={`rounded-xl border p-3 flex flex-col transition-all cursor-pointer ${
                  selected
                    ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30 bg-white"
                    : "border-[#E5E7EB] hover:border-[#C8D5E8] bg-white"
                }`}
              >
                <TemplatePreview kind={card.title} className="h-[120px] rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] p-2.5 flex flex-col overflow-hidden" />
                <div className="mt-2 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{card.title}</div>
                <p className="mt-0.5 text-[12px] leading-4 text-[#546478]">{card.description}</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setPreviewTemplate(card.title); }}
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] py-2 text-[13px] text-[#1A2332] bg-white hover:bg-[#F9FAFB] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Preview
                </button>
              </div>
            );
          })}
        </div>

        {/* Preview modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)}>
            <div className="w-[640px] max-h-[80vh] bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{previewTemplate} template</h3>
                  <p className="text-[12px] text-[#6B7280]">{templateCards.find(c => c.title === previewTemplate)?.description}</p>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="text-[#9CA3AF] hover:text-[#1A2332]">
                  <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-[#F5F7FA] p-6 flex items-start justify-center">
                <TemplatePreviewLarge kind={previewTemplate} />
              </div>
              <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-white">
                <Button type="button" variant="outline" onClick={() => setPreviewTemplate(null)} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Close</Button>
                <Button type="button" onClick={() => { setSelectedTemplate(previewTemplate); setPreviewTemplate(null); toast.success(`${previewTemplate} template selected`); }} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Use this template</Button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Deposits */}
      <SectionCard title="Deposits" description="Collect a deposit when the customer accepts an estimate or signs an invoice.">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
          <div className="flex-1">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Require deposit before scheduling</div>
            <div className="text-[12px] text-[#6B7280] mt-0.5">Customer pays a percentage upfront; rest is invoiced when the job is done.</div>
          </div>
          <Switch checked={requireDeposit} onCheckedChange={setRequireDeposit} />
        </div>
        {requireDeposit && (
          <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center gap-3">
            <span className="text-[13px] text-[#1A2332]">Default deposit:</span>
            <Input value={depositPercent} onChange={e => setDepositPercent(e.target.value.replace(/\D/g, "").slice(0, 3))} className="h-9 w-20 border-[#D8DEE8]" />
            <span className="text-[13px] text-[#6B7280]">% of total</span>
          </div>
        )}
      </SectionCard>

      {/* Financing */}
      <SectionCard title="Financing" description="Offer the customer a financing plan instead of paying in full.">
        <div className="rounded-lg border border-dashed border-[#D8E3F4] bg-[#F8FBFF] px-4 py-5 text-center">
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "28px" }}>credit_score</span>
          <div className="text-[13px] text-[#1A2332] mt-1" style={{ fontWeight: 600 }}>Lender integration coming soon</div>
          <div className="text-[12px] text-[#6B7280] mt-1">Wells Fargo, GreenSky and Synchrony brochures will plug in here.</div>
        </div>
      </SectionCard>

      {/* Payment Terms */}
      <SectionCard title="Payment Terms" description="Selectable terms shown on invoice creation.">
        <div className="flex flex-wrap gap-2">
          {paymentTerms.map(t => (
            <span key={t} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#1A2332]">
              {t}
              <button onClick={() => setPaymentTerms(paymentTerms.filter(x => x !== t))} className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]">×</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={newPaymentTerm} onChange={e => setNewPaymentTerm(e.target.value)} placeholder="Add term (e.g. Net 45)" className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
            onKeyDown={e => { if (e.key === "Enter") { const v = newPaymentTerm.trim(); if (!v || paymentTerms.includes(v)) return; setPaymentTerms([...paymentTerms, v]); setNewPaymentTerm(""); }}}
          />
          <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
            onClick={() => { const v = newPaymentTerm.trim(); if (!v || paymentTerms.includes(v)) return; setPaymentTerms([...paymentTerms, v]); setNewPaymentTerm(""); }}>Add</Button>
        </div>
      </SectionCard>

      {/* Signature Settings */}
      <SectionCard title="Signature Settings" description="Capture customer authorization on invoices.">
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
            <div className="flex-1">
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Require client signature on estimates</div>
              <div className="text-[12px] text-[#6B7280] mt-0.5">Customer signs the estimate before work begins.</div>
            </div>
            <Switch checked={requireSig} onCheckedChange={setRequireSig} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
            <div className="flex-1">
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Require client signature on invoices</div>
              <div className="text-[12px] text-[#6B7280] mt-0.5">Signature captured at delivery confirms receipt of services rendered.</div>
            </div>
            <Switch checked={requireSigInvoice} onCheckedChange={setRequireSigInvoice} />
          </div>
        </div>
      </SectionCard>

      {/* Notes on invoice */}
      <SectionCard title="Notes on invoice" description="Default fine print printed at the bottom of every invoice and receipt.">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Invoice fine print</label>
            <textarea defaultValue="Equipment remains property of Omega Home Services until invoice is paid in full." className="min-h-[76px] w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
          </div>
          <div>
            <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Receipt note</label>
            <textarea defaultValue="Paid in full. Thank you for your business." className="min-h-[76px] w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
          </div>
        </div>

        {/* Footer — Save / Cancel attached */}
        <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
          <Button type="button" variant="outline" onClick={() => toast.info("Changes discarded")} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Cancel</Button>
          <Button type="button" onClick={() => toast.success("Invoice preferences saved")} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Save changes</Button>
        </div>
      </SectionCard>
    </>
  );
}

// Finance Center — Marek's spec
function FinanceCenterSection() {
  const [stripeConnected, setStripeConnected] = useState(true);
  const [methods, setMethods] = useState({
    creditCard: true,
    ach: false,
    cash: true,
    check: true,
    financing: false,
  });
  const [bankName, setBankName] = useState("Bank of America");
  const [bankAcct, setBankAcct] = useState("8821");
  const [routing, setRouting] = useState("026009593");
  const [routingVisible, setRoutingVisible] = useState(false);
  const maskedRouting = routing.length > 4
    ? `${"•".repeat(Math.max(0, routing.length - 4))}${routing.slice(-4)}`
    : routing;

  return (
    <>
      <SectionHeader title="Finance Center" description="Payment gateways, payout bank, customer payment methods, and expense tracking." />

      <div className="space-y-4">
        {/* Payments / Gateways */}
        <SectionCard title="Payments" description="Connect a payment processor so customers can pay invoices online.">
          <div>
            {/* Stripe */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#635BFF] text-white" style={{ fontWeight: 800 }}>S</div>
                <div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Stripe</div>
                  <div className="text-[12px] text-[#6B7280]">Cards · ACH · Apple Pay · Google Pay</div>
                </div>
              </div>
              {stripeConnected ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>Connected</span>
                  <Button variant="outline" className="h-9 border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5]" onClick={() => { setStripeConnected(false); toast.info("Stripe disconnected"); }}>Disconnect</Button>
                </div>
              ) : (
                <Button className="h-9 bg-[#635BFF] hover:bg-[#5048d8] text-white" onClick={() => { setStripeConnected(true); toast.success("Stripe connected"); }}>Connect Stripe</Button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Bank Information */}
        <SectionCard title="Bank Information" description="Where payouts from your payment processor are deposited.">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Bank name</label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} className="h-9 border-[#D8DEE8]" />
            </div>
            <div>
              <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Account (last 4)</label>
              <Input value={bankAcct} onChange={e => setBankAcct(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-9 border-[#D8DEE8]" />
            </div>
            <div>
              <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Routing</label>
              <div className="relative">
                <Input
                  value={routingVisible ? routing : maskedRouting}
                  onChange={e => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  readOnly={!routingVisible}
                  className="h-9 border-[#D8DEE8] pr-9"
                />
                <button
                  type="button"
                  onClick={() => setRoutingVisible(v => !v)}
                  aria-label={routingVisible ? "Hide routing number" : "Show routing number"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded text-[#546478] hover:bg-[#F5F7FA]"
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>{routingVisible ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-[#6B7280]">
            Plaid-verified bank connection coming with Pro. For MVP we capture the last-4 and routing for reporting only.
          </p>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="Payment Methods" description="Which methods appear when an invoice is sent to a customer.">
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { id: "creditCard", label: "Credit / Debit cards", desc: "Stripe required."                },
              { id: "ach",        label: "ACH bank transfer",    desc: "Lower fees, slower clearing."   },
              { id: "cash",       label: "Cash",                 desc: "Mark paid manually in the app." },
              { id: "check",      label: "Check",                desc: "Track check number on payment." },
              { id: "financing",  label: "Financing",            desc: "Send customer to a lender plan (coming soon)." },
            ].map(m => (
              <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
                <div className="flex-1">
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{m.label}</div>
                  <div className="text-[12px] text-[#6B7280] mt-0.5">{m.desc}</div>
                </div>
                <Switch checked={(methods as any)[m.id]} onCheckedChange={v => setMethods({ ...methods, [m.id]: v })} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Notes on receipt */}
        <SectionCard title="Notes on receipt" description="Printed at the bottom of every payment receipt.">
          <textarea defaultValue="Thank you for your payment. Keep this receipt for your records." className="mt-2 min-h-[76px] w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
        </SectionCard>

        {/* Expense Tracking */}
        <SectionCard title="Expense Tracking" description="How expenses move from the Expenses module into your books.">
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
              <div className="flex-1">
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Auto-categorize by vendor</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">Apply the last category used for that vendor on new expenses.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
              <div className="flex-1">
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Require receipt photo</div>
                <div className="text-[12px] text-[#6B7280] mt-0.5">Field tech must attach a photo before saving an expense.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="rounded-lg border border-dashed border-[#D8E3F4] bg-[#F8FBFF] px-4 py-3 text-[13px] text-[#546478]">
              QuickBooks export of expenses opens up once the QuickBooks integration is enabled in Integrations.
            </div>
          </div>

          {/* Footer — Save / Cancel attached */}
          <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
            <Button type="button" variant="outline" onClick={() => toast.info("Changes discarded")} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Cancel</Button>
            <Button type="button" onClick={() => toast.success("Finance settings saved")} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Save changes</Button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function EmptyModuleNote({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-[#D8E3F4] bg-[#F8FBFF] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF0F8] text-[#4A6FA5]">
          <span className="material-icons" style={{ fontSize: "20px" }}>pending_actions</span>
        </div>
        <div>
          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</div>
          <p className="mt-1 text-[13px] leading-5 text-[#546478]">{copy}</p>
        </div>
      </div>
    </div>
  );
}

function AddListSection({
  title,
  description,
  placeholder,
  value,
  onValueChange,
  onAdd,
  rows,
  editing,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  rows: string[];
  editing: string | null;
  editValue: string;
  onStartEdit: (row: string) => void;
  onEditValueChange: (value: string) => void;
  onSaveEdit: (row: string) => void;
  onCancelEdit: () => void;
  onDelete: (row: string) => void;
}) {
  return (
    <>
      <SectionHeader title={title} description={description} />
      <SectionCard title={title}>
        <div className="mb-5 flex max-w-[620px] gap-3">
          <Input
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 border-[#D8DEE8] text-[14px]"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <Button className="h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]" onClick={onAdd}>Add</Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
          <table className="w-full bg-white">
            <thead className="bg-[#F5F7FA]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 700 }}>Name</th>
                <th className="w-[170px] px-4 py-3 text-right text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row} className="border-t border-[#E5E7EB]">
                  <td className="px-4 py-3 text-[14px] text-[#1A2332]">
                    {editing === row ? (
                      <Input
                        value={editValue}
                        onChange={e => onEditValueChange(e.target.value)}
                        className="h-8 max-w-[360px] border-[#D8DEE8] text-[14px]"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") onSaveEdit(row);
                          if (e.key === "Escape") onCancelEdit();
                        }}
                      />
                    ) : row}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === row ? (
                      <div className="flex justify-end gap-2">
                        <Button className="h-8 bg-[#4A6FA5] px-3 text-[12px] hover:bg-[#3d5a85]" onClick={() => onSaveEdit(row)}>Save</Button>
                        <Button variant="outline" className="h-8 px-3 text-[12px]" onClick={onCancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="h-8 px-3 text-[12px]" onClick={() => onStartEdit(row)}>Edit</Button>
                        <Button variant="outline" className="h-8 border-[#FECACA] px-3 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => onDelete(row)}>Delete</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Land straight on Company Info when /settings opens.
  const [activeSection, setActiveSection] = useState<SettingsSection>("companyInfo");
  const [searchQuery, setSearchQuery] = useState("");
  // Settings nav groups are collapsible accordions. Business Management is opened
  // by default because Company Info is the landing destination.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Business management"]));
  const toggleGroupExpanded = (title: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const companyName = useSyncExternalStore(companyStore.subscribe, companyStore.getCompanyName);
  const marketingSources = useSyncExternalStore(marketingSourcesStore.subscribe, marketingSourcesStore.getSources);
  const customerTags = useSyncExternalStore(tagsStore.subscribe, tagsStore.getTags);
  const counties = useSyncExternalStore(countiesStore.subscribe, countiesStore.getCounties);
  const relationships = useSyncExternalStore(relationshipsStore.subscribe, relationshipsStore.getRelationships);
  const [newRelationshipName, setNewRelationshipName] = useState("");
  const jobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  const customFields = useSyncExternalStore(customFieldsStore.subscribe, customFieldsStore.getFields);
  const scheduleSettings = useSyncExternalStore(scheduleSettingsStore.subscribe, scheduleSettingsStore.getSnapshot);

  const [newSourceName, setNewSourceName] = useState("");
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [newCountyName, setNewCountyName] = useState("");
  const [editingCounty, setEditingCounty] = useState<string | null>(null);
  const [editingCountyValue, setEditingCountyValue] = useState("");
  const [newJobTypeName, setNewJobTypeName] = useState("");
  const [editingJobType, setEditingJobType] = useState<string | null>(null);
  const [editingJobTypeValue, setEditingJobTypeValue] = useState("");

  // ── Team / Invite user ──
  const [team, setTeam] = useState(teamMembers);
  const [teamSearch, setTeamSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamRowMenu, setTeamRowMenu] = useState<string | null>(null);
  const [permissionRoles, setPermissionRoles] = useState<PermissionRole[]>(defaultPermissionRoles);
  const [newPermissionRole, setNewPermissionRole] = useState("");
  const [rbacRows, setRbacRows] = useState<RbacPermission[]>(defaultRbacPermissions);
  const emptyInvite = { name: "", email: "", role: "Employee" as AppRole, rate: "" };
  const [invite, setInvite] = useState(emptyInvite);
  // ── Estimate templates ──
  const [selectedEstimateTemplate, setSelectedEstimateTemplate] = useState<string>("Classic");
  const [previewEstimateTemplate, setPreviewEstimateTemplate] = useState<string | null>(null);
  // ── Login security & 2FA ──
  const [tempPasswordLink, setTempPasswordLink] = useState(true);
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "phone" | "either">("either");
  // ── Pay rate type per company default ──
  const [defaultPayType, setDefaultPayType] = useState<"hourly" | "daily" | "salary">("hourly");
  const [payRatesOpen, setPayRatesOpen] = useState(false);
  // ── User custom fields ──
  type UserCF = { id: string; label: string; type: "Text" | "Dropdown"; options?: string };
  const [userCustomFields, setUserCustomFields] = useState<UserCF[]>([
    { id: "ucf1", label: "Office / Field user", type: "Dropdown", options: "Office, Field" },
    { id: "ucf2", label: "Reports to",           type: "Text" },
  ]);
  const [newUserCfLabel, setNewUserCfLabel] = useState("");

  // ── Jobs Preferences ──
  const [requireSigBeforeStart, setRequireSigBeforeStart] = useState(true);
  const [requireSigOnComplete, setRequireSigOnComplete] = useState(true);
  const [requireParentSig, setRequireParentSig] = useState(false);
  type JobNote = { id: string; title: string; body: string };
  const [jobNotes, setJobNotes] = useState<JobNote[]>([
    { id: "jn1", title: "Authorization to Proceed",
      body: "I authorize Omega Home Services to perform the work described above and accept full responsibility for the agreed amount." },
    { id: "jn2", title: "New note", body: "" },
  ]);
  const scheduleStartHour = formatScheduleHour(scheduleSettings.startHour);
  const scheduleEndHour = formatScheduleHour(scheduleSettings.endHour);
  const scheduleSlot = String(scheduleSettings.slotMinutes);
  // Job statuses — MVP starts with three core; additional ones can be added
  type JobStatus = { id: string; label: string; color: string; bg: string; icon: string; core?: boolean };
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([
    { id: "scheduled",  label: "Scheduled",   color: "#4A6FA5", bg: "#EBF0F8", icon: "event_note",   core: true },
    { id: "inProgress", label: "In Progress", color: "#B45309", bg: "#FEF3C7", icon: "play_circle",  core: true },
    { id: "completed",  label: "Completed",   color: "#15803D", bg: "#DCFCE7", icon: "check_circle", core: true },
    { id: "cancelled",  label: "Cancelled",   color: "#DC2626", bg: "#FEE2E2", icon: "edit" },
    { id: "paused",     label: "Paused",      color: "#A856F7", bg: "#F3E8FF", icon: "edit" },
  ]);
  // Palette for custom statuses
  const STATUS_PALETTE: { color: string; bg: string; icon: string }[] = [
    { color: "#7C3AED", bg: "#EDE9FE", icon: "schedule"          },
    { color: "#DC2626", bg: "#FEE2E2", icon: "cancel"            },
    { color: "#0891B2", bg: "#CFFAFE", icon: "local_shipping"    },
    { color: "#EA580C", bg: "#FFEDD5", icon: "pause_circle"      },
    { color: "#6B7280", bg: "#F3F4F6", icon: "hourglass_empty"   },
    { color: "#0D9488", bg: "#CCFBF1", icon: "near_me"           },
  ];
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const JOB_TYPE_COLORS = [
    { fg: "#DC2626", bg: "rgba(220,38,38,0.12)",  icon: "edit" },
    { fg: "#A856F7", bg: "rgba(168,86,247,0.12)", icon: "edit" },
    { fg: "#4A6FA5", bg: "rgba(74,111,165,0.12)", icon: "edit" },
    { fg: "#16A34A", bg: "rgba(22,163,74,0.12)",  icon: "edit" },
    { fg: "#D97706", bg: "rgba(217,119,6,0.12)",  icon: "edit" },
    { fg: "#0891B2", bg: "rgba(8,145,178,0.12)",  icon: "edit" },
  ];
  const togglePermissionAction = (rowIndex: number, roleLabel: string, action: PermissionAction) => {
    setRbacRows(prev => prev.map((row, i) => (
      i === rowIndex
        ? {
            ...row,
            access: {
              ...row.access,
              [roleLabel]: row.access[roleLabel]?.includes(action)
                ? row.access[roleLabel].filter(item => item !== action)
                : [...(row.access[roleLabel] ?? []), action],
            },
          }
        : row
    )));
  };
  const clearPermissionAccess = (rowIndex: number, roleLabel: string) => {
    setRbacRows(prev => prev.map((row, i) => (
      i === rowIndex ? { ...row, access: { ...row.access, [roleLabel]: [] } } : row
    )));
  };
  const addPermissionRole = () => {
    const label = newPermissionRole.trim();
    if (!label) return;
    if (permissionRoles.some(role => role.label.toLowerCase() === label.toLowerCase())) {
      toast.error("That role already exists");
      return;
    }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "role";
    const id = `${slug}-${Date.now()}`;
    setPermissionRoles(prev => [...prev, { id, label }]);
    setRbacRows(prev => prev.map(row => ({ ...row, access: { ...row.access, [label]: [] } })));
    setNewPermissionRole("");
  };
  const removePermissionRole = (roleLabel: string) => {
    const role = permissionRoles.find(item => item.label === roleLabel);
    if (!role || role.locked) return;
    setPermissionRoles(prev => prev.filter(item => item.label !== roleLabel));
    setRbacRows(prev => prev.map(row => {
      const { [roleLabel]: _removed, ...access } = row.access;
      return { ...row, access };
    }));
    setTeam(prev => prev.map(member => member.role === roleLabel ? { ...member, role: "Employee" } : member));
    setInvite(prev => prev.role === roleLabel ? { ...prev, role: "Employee" } : prev);
  };
  const filteredTeam = team.filter(m => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });
  const permissionGroups = rbacRows.reduce<Record<string, Array<{ row: RbacPermission; index: number }>>>((groups, row, index) => {
    groups[row.area] = [...(groups[row.area] ?? []), { row, index }];
    return groups;
  }, {});
  const submitInvite = () => {
    if (!invite.name.trim() || !invite.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setTeam(prev => [
      ...prev,
      {
        name: invite.name.trim(),
        username: invite.email.trim().split("@")[0] || invite.name.trim().toLowerCase().replace(/\s+/g, "."),
        phone: "",
        email: invite.email.trim(),
        role: invite.role,
        rate: invite.rate.trim() ? (invite.rate.includes("/") ? invite.rate : `$${invite.rate}/hr`) : "$0/hr",
        status: "Invited",
      },
    ]);
    toast.success(`Invitation sent to ${invite.email}`);
    setInvite(emptyInvite);
    setInviteOpen(false);
  };
  const [cfEntity, setCfEntity] = useState<CfEntity>("clients");
  const [companyInfoTab, setCompanyInfoTab] = useState<"profile" | "branding">("profile");
  // ── Company info: validation + dirty-state ──
  const [companyNameDraft, setCompanyNameDraft] = useState(companyName);
  const [companyEmailDraft, setCompanyEmailDraft] = useState("office@omega-home.com");
  const [companyEmailSaved, setCompanyEmailSaved] = useState("office@omega-home.com");
  const [companyInfoErrors, setCompanyInfoErrors] = useState<{ name?: string; email?: string }>({});
  // Keep the draft in sync if the store changes from another tab/page.
  useEffect(() => { setCompanyNameDraft(companyName); }, [companyName]);
  const companyInfoDirty =
    companyNameDraft.trim() !== companyName.trim() ||
    companyEmailDraft.trim() !== companyEmailSaved.trim();
  const handleCompanyInfoSave = () => {
    const errs: { name?: string; email?: string } = {};
    const trimmedName = companyNameDraft.trim();
    const trimmedEmail = companyEmailDraft.trim();
    if (!trimmedName) errs.name = "Company name is required";
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Enter a valid email address";
    }
    setCompanyInfoErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!companyInfoDirty) {
      toast.message("No changes to save");
      return;
    }
    companyStore.setCompanyName(trimmedName);
    setCompanyEmailSaved(trimmedEmail);
    toast.success("Company info saved");
  };
  const [brandPrimary, setBrandPrimary] = useState(() => getStoredBrandTheme().primary);
  const [brandAccent, setBrandAccent] = useState(() => getStoredBrandTheme().accent);
  const [brandLogoPreview, setBrandLogoPreview] = useState(() => getStoredBrandLogo());
  const [resetBrandDialogOpen, setResetBrandDialogOpen] = useState(false);
  const [companyAbout, setCompanyAbout] = useState(() => readStoredText(COMPANY_ABOUT_STORAGE_KEY, DEFAULT_COMPANY_ABOUT));
  const [socialLinks, setSocialLinks] = useState(() => readStoredSocialLinks());
  const [tcFile, setTcFile] = useState<string | null>(null);
  const [policiesFile, setPoliciesFile] = useState<string | null>(null);
  const [privacyFile, setPrivacyFile] = useState<string | null>(null);
  type LegalDocId = "terms" | "policies" | "privacy";
  type LegalMode = "file" | "text";
  const [industry, setIndustry] = useState("Other");
  const [legalModes, setLegalModes] = useState<Record<LegalDocId, LegalMode>>({
    terms: "file",
    policies: "text",
    privacy: "file",
  });
  const [legalText, setLegalText] = useState<Record<LegalDocId, string>>({
    terms: "",
    policies: "",
    privacy: "",
  });
  const [pendingLegalMode, setPendingLegalMode] = useState<{ id: LegalDocId; mode: LegalMode } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const legalFiles: Record<LegalDocId, string | null> = {
    terms: tcFile,
    policies: policiesFile,
    privacy: privacyFile,
  };
  const legalFileSetters: Record<LegalDocId, (value: string | null) => void> = {
    terms: setTcFile,
    policies: setPoliciesFile,
    privacy: setPrivacyFile,
  };

  const requestLegalMode = (id: LegalDocId, mode: LegalMode) => {
    if (legalModes[id] === mode) return;
    const hasFile = Boolean(legalFiles[id]);
    const hasText = legalText[id].trim().length > 0;
    if ((legalModes[id] === "file" && hasFile) || (legalModes[id] === "text" && hasText)) {
      setPendingLegalMode({ id, mode });
      return;
    }
    setLegalModes(prev => ({ ...prev, [id]: mode }));
  };

  const confirmLegalMode = () => {
    if (!pendingLegalMode) return;
    const { id, mode } = pendingLegalMode;
    if (mode === "text") legalFileSetters[id](null);
    else setLegalText(prev => ({ ...prev, [id]: "" }));
    setLegalModes(prev => ({ ...prev, [id]: mode }));
    setPendingLegalMode(null);
  };

  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection | null;
    setActiveSection(section ? normalizeSection(section) : "companyInfo");
  }, [searchParams]);

  // Auto-expand the nav group that contains the currently active section so the
  // user can see where they are after navigating in (otherwise the active item
  // would be hidden inside a collapsed accordion).
  useEffect(() => {
    if (activeSection === "home") return;
    const owning = navGroups.find(g => g.items.some(i => i.id === activeSection));
    if (owning) {
      setExpandedGroups(prev => (prev.has(owning.title) ? prev : new Set(prev).add(owning.title)));
    }
  }, [activeSection]);

  useEffect(() => {
    if (!location.hash) return;

    window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [activeSection, location.hash]);

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return `${group.title} ${item.label} ${item.description ?? ""}`.toLowerCase().includes(q);
    }),
  })).filter(group => group.items.length > 0);

  const navItemClass = (section: SettingsSection) => (
    `w-full rounded-lg px-6 py-2 text-left transition-colors ${
      activeSection === section
        ? "bg-[#F0F4FB] text-[#4A6FA5]"
        : "text-[#546478] hover:bg-[#F5F7FA] hover:text-[#1A2332]"
    }`
  );

  const addSource = () => {
    if (!newSourceName.trim()) return;
    marketingSourcesStore.addSource(newSourceName);
    setNewSourceName("");
    toast.success("Source added");
  };

  const addTag = () => {
    if (!newTagName.trim()) return;
    tagsStore.addTag(newTagName);
    setNewTagName("");
    toast.success("Tag added");
  };

  const addCounty = () => {
    if (!newCountyName.trim()) return;
    countiesStore.addCounty(newCountyName);
    setNewCountyName("");
    toast.success("County added");
  };

  const addRelationship = () => {
    const trimmed = newRelationshipName.trim();
    if (!trimmed) return;
    if (relationships.includes(trimmed)) {
      toast.error("Relationship already exists");
      return;
    }
    relationshipsStore.addRelationship(trimmed);
    setNewRelationshipName("");
    toast.success("Relationship added");
  };

  const addJobType = () => {
    if (!newJobTypeName.trim()) return;
    jobTypesStore.addJobType(newJobTypeName);
    setNewJobTypeName("");
    toast.success("Job type added");
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;

    const supportedTypes = ["image/png", "image/jpeg"];
    if (!supportedTypes.includes(file.type)) {
      toast.error("Upload a PNG or JPG logo");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setBrandLogo(dataUrl);
      setBrandLogoPreview(dataUrl);
      toast.success("Logo applied");
    };
    reader.onerror = () => toast.error("Logo upload failed");
    reader.readAsDataURL(file);
  };

  const updateSocialLink = (key: keyof typeof DEFAULT_SOCIAL_LINKS, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const isValidSocialUrl = (value: string) => {
    if (!value.trim()) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleCompanyProfileSave = () => {
    const invalid = Object.entries(socialLinks).find(([, value]) => !isValidSocialUrl(value));
    if (invalid) {
      toast.error(`${invalid[0][0].toUpperCase()}${invalid[0].slice(1)} must be a valid URL`);
      return;
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(COMPANY_ABOUT_STORAGE_KEY, companyAbout);
      localStorage.setItem(SOCIAL_LINKS_STORAGE_KEY, JSON.stringify(socialLinks));
    }
    toast.success("Changes saved");
  };

  return (
    <div className="flex h-full bg-[#F5F7FA]" style={{ height: "calc(100vh - 64px)" }}>
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="pb-4">
          <div className="relative">
            <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 border-[#E5E7EB] bg-white pl-8 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {filteredNavGroups.map(group => {
            // When the user is searching, force-expand so matches are visible.
            const isSearching = searchQuery.trim().length > 0;
            const expanded = isSearching || expandedGroups.has(group.title);
            return (
              <div key={group.title} className="mb-3">
                <button
                  type="button"
                  onClick={() => toggleGroupExpanded(group.title)}
                  className="mb-1 flex h-8 w-full items-center gap-2 px-0 text-[14px] text-[#1A2332] hover:text-[#4A6FA5] transition-colors"
                  style={{ fontWeight: 600 }}
                  aria-expanded={expanded}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>{group.icon}</span>
                  <span className="flex-1 text-left">{group.title}</span>
                  <span
                    className="material-icons text-[#9CA3AF] transition-transform"
                    style={{ fontSize: "16px", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                  >
                    expand_more
                  </span>
                </button>
                {expanded && (
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <button key={item.id} onClick={() => setActiveSection(item.id)} className={navItemClass(item.id)}>
                        <div className="text-[14px]" style={{ fontWeight: activeSection === item.id ? 500 : 500 }}>{item.label}</div>
                        {item.description && <div className="mt-1 truncate text-[12px] leading-4 text-[#6B7280]">{item.description}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[900px] px-4 py-6">
          {activeSection === "companyInfo" && (
            <>
              <SectionHeader title="Company info" />
              <div className="space-y-4">
                <SectionCard title="Company info" description="Core business information shown on documents, emails, and customer-facing records.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company name">
                      <Input
                        value={companyNameDraft}
                        onChange={e => { setCompanyNameDraft(e.target.value); if (companyInfoErrors.name) setCompanyInfoErrors({ ...companyInfoErrors, name: undefined }); }}
                        className={`h-9 ${companyInfoErrors.name ? "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/30" : "border-[#D8DEE8]"}`}
                        aria-invalid={!!companyInfoErrors.name}
                      />
                      {companyInfoErrors.name && (
                        <span className="mt-1 block text-[12px] text-[#DC2626]">{companyInfoErrors.name}</span>
                      )}
                    </Field>
                    <Field label="Legal entity name"><Input defaultValue="Omega Home Services" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Business owner name"><Input defaultValue="Peter Novak" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Address"><Input defaultValue="123 Main Street, Suite 100, Tampa, FL 33606" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Phone number"><Input defaultValue="(813) 286-7572" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={companyEmailDraft}
                        onChange={e => { setCompanyEmailDraft(e.target.value); if (companyInfoErrors.email) setCompanyInfoErrors({ ...companyInfoErrors, email: undefined }); }}
                        className={`h-9 ${companyInfoErrors.email ? "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/30" : "border-[#D8DEE8]"}`}
                        aria-invalid={!!companyInfoErrors.email}
                      />
                      {companyInfoErrors.email && (
                        <span className="mt-1 block text-[12px] text-[#DC2626]">{companyInfoErrors.email}</span>
                      )}
                    </Field>
                    <Field label="EIN / tax ID"><Input defaultValue="12-3456789" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="License number"><Input defaultValue="LIC-2486-FL" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                </SectionCard>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={!companyInfoDirty}
                    className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500 }}
                    onClick={handleCompanyInfoSave}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeSection === "companyProfile" && (
            <>
              <SectionHeader
                title="Company Profile"
                description="About your business, branding, social links, taxes, and regional settings."
                action={
                  <Button
                    className="h-9 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white px-4 text-[13px]"
                    style={{ fontWeight: 600 }}
                    onClick={handleCompanyProfileSave}
                  >
                    Save changes
                  </Button>
                }
              />
              <div className="space-y-4">

                <SectionCard
                  id="branding"
                  title="Brand assets"
                  description="Your company branding is shown in Client Hub, email messages, and on all PDFs."
                  headerAction={
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg border-[#D8DEE8] px-3 text-[12px] text-[#546478] hover:bg-[#F5F7FA]"
                      style={{ fontWeight: 600 }}
                      onClick={() => setResetBrandDialogOpen(true)}
                    >
                      Reset to default
                    </Button>
                  }
                >
                  <div className="grid grid-cols-2 divide-x divide-[#E1E6EF]">

                    {/* Brand Colors */}
                    <div className="pr-6">
                      <div className="mb-3 text-[13px] text-[#7A8799]" style={{ fontWeight: 600 }}>Brand colors</div>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2.5 hover:border-[#C8D5E8]">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: brandPrimary }}>
                            <input
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(brandPrimary) ? brandPrimary : "#4A6FA5"}
                              onChange={e => { setBrandPrimary(e.target.value); applyBrandTheme({ primary: e.target.value, accent: brandAccent }); }}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-[#9AA3AF]" style={{ fontWeight: 600 }}>Main brand color</div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{brandPrimary.toUpperCase()}</div>
                          </div>
                          <span className="material-icons ml-auto text-[#C8D5E8] hover:text-[#546478]" style={{ fontSize: "16px" }}>edit</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2.5 hover:border-[#C8D5E8]">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: brandAccent }}>
                            <input
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(brandAccent) ? brandAccent : "#F97316"}
                              onChange={e => { setBrandAccent(e.target.value); applyBrandTheme({ primary: brandPrimary, accent: e.target.value }); }}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-[#9AA3AF]" style={{ fontWeight: 600 }}>Accent color</div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{brandAccent.toUpperCase()}</div>
                          </div>
                          <span className="material-icons ml-auto text-[#C8D5E8] hover:text-[#546478]" style={{ fontSize: "16px" }}>edit</span>
                        </label>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="pl-6">
                      <div className="mb-3 text-[13px] text-[#7A8799]" style={{ fontWeight: 600 }}>Logo</div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={e => handleLogoUpload(e.target.files?.[0])}
                      />
                      <div
                        className="group flex h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-white transition-colors hover:border-[#C8D5E8]"
                        onClick={() => logoInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          handleLogoUpload(e.dataTransfer.files?.[0]);
                        }}
                      >
                        {brandLogoPreview ? (
                          <img src={brandLogoPreview} alt="Company logo" className="max-h-[110px] max-w-full object-contain p-3" />
                        ) : (
                          <>
                            <span className="material-icons text-[#9AA3AF] group-hover:text-[#4A6FA5]" style={{ fontSize: "24px" }}>upload</span>
                            <p className="mt-1.5 text-[12px] text-[#546478] text-center leading-[18px]">
                              Drop your files here, or{" "}
                              <span className="text-[#4A6FA5] underline underline-offset-2" style={{ fontWeight: 600 }}>click to browse</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#9AA3AF]">PNG or JPG (max. 2MB)</p>
                          </>
                        )}
                      </div>
                      {brandLogoPreview && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg border-[#C8D5E8] px-4 text-[12px] text-[#4A6FA5] hover:bg-[#EBF3FF]"
                            style={{ fontWeight: 700 }}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Change logo
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg border-[#FECACA] px-3 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]"
                            style={{ fontWeight: 600 }}
                            onClick={() => {
                              resetBrandLogo();
                              setBrandLogoPreview("");
                              if (logoInputRef.current) logoInputRef.current.value = "";
                              toast.success("Logo removed");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                </SectionCard>

                <SectionCard title="About" description="A short note about your business, visible to your team.">
                  <textarea
                    value={companyAbout}
                    onChange={e => setCompanyAbout(e.target.value)}
                    className="min-h-[90px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                </SectionCard>

                <SectionCard title="Social network links" description="Links shown on your Client Hub and customer-facing pages.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Facebook"><Input value={socialLinks.facebook} onChange={e => updateSocialLink("facebook", e.target.value)} placeholder="https://facebook.com/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Instagram"><Input value={socialLinks.instagram} onChange={e => updateSocialLink("instagram", e.target.value)} placeholder="https://instagram.com/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="LinkedIn"><Input value={socialLinks.linkedin} onChange={e => updateSocialLink("linkedin", e.target.value)} placeholder="https://linkedin.com/company/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input value={socialLinks.website} onChange={e => updateSocialLink("website", e.target.value)} placeholder="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                </SectionCard>

                <SectionCard title="Notifications" description="Control when the app notifies you about client activity.">
                  <div className="space-y-3">
                    {[
                      { label: "Estimate signed", sub: "Notify when a client signs an estimate" },
                      { label: "Estimate viewed", sub: "Notify when a client views an estimate" },
                      { label: "Customer requested change", sub: "Notify when a client requests a change" },
                      { label: "Invoice signed", sub: "Notify when a client signs an invoice" },
                      { label: "Payment received", sub: "Notify when a customer payment is received" },
                      { label: "Invoice overdue", sub: "Notify when an invoice passes its due date" },
                    ].map(n => (
                      <div key={n.label} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-4 py-3">
                        <div>
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{n.label}</div>
                          <div className="text-[12px] text-[#7A8799]">{n.sub}</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <TaxSettingsCard />


                <RegionalSettingsCard />
                <BusinessHoursCard
                  footer={
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast.info("Changes discarded")}
                        className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCompanyProfileSave}
                        className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                        style={{ fontWeight: 600 }}
                      >
                        Save changes
                      </Button>
                    </>
                  }
                />

              </div>
            </>
          )}

          {activeSection === "team" && (
            <div className="flex flex-col gap-4" onClick={() => setTeamRowMenu(null)}>

              {/* Page header */}
              <div className="flex items-center justify-between gap-3 py-2">
                <h2 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 600 }}>Manage team</h2>
                <button
                  type="button"
                  disabled
                  className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] opacity-50 cursor-not-allowed"
                  style={{ fontWeight: 500 }}
                >
                  Save changes
                </button>
              </div>

              {/* Users table card */}
              <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-3 py-3 bg-white">
                  <div className="relative w-[300px]">
                    <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "16px" }}>search</span>
                    <input
                      placeholder="Search users"
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-3 text-[14px] text-[#1A2332] placeholder:text-[#6B7280] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPayRatesOpen(true); }}
                      className="h-9 px-4 flex items-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[14px] text-[#1A2332] transition-colors shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      Pay rates settings
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate("/settings/team/new"); }}
                      className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.67" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M5.33 8h5.34M8 5.33v5.34" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Invite user
                    </button>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                      {["Full Name", "User Name", "Phone", "Email", "Role"].map((h, i) => (
                        <th
                          key={i}
                          className="px-2 text-left text-[14px] text-[#1A2332]"
                          style={{ fontWeight: 500, height: 40, whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-2" style={{ height: 40, width: 52 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                          No users match "{teamSearch}".
                        </td>
                      </tr>
                    ) : filteredTeam.map((member, idx) => {
                      const rowKey = `${member.email}-${idx}`;
                      return (
                        <tr key={rowKey} className="border-b border-[#E5E7EB] last:border-b-0">
                          <td className="px-2 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.name}</td>
                          <td className="px-2 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.username}</td>
                          <td className="px-2 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.phone}</td>
                          <td className="px-2 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.email}</td>
                          <td className="px-2 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.role}</td>
                          <td className="px-2 relative" style={{ height: 36, width: 52 }}>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setTeamRowMenu(teamRowMenu === rowKey ? null : rowKey); }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                            >
                              <span className="material-icons" style={{ fontSize: "16px" }}>more_vert</span>
                            </button>
                            {teamRowMenu === rowKey && (
                              <div
                                className="absolute right-0 top-9 z-20 w-[140px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => { setTeamRowMenu(null); toast.info(`Edit ${member.name}`); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F5F7FA] transition-colors"
                                  style={{ fontWeight: 500 }}
                                >
                                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>edit</span>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setTeamRowMenu(null); toast.error(`${member.name} removed`); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                                  style={{ fontWeight: 500 }}
                                >
                                  <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between gap-3 px-4 py-4 border-t border-[#E5E7EB] bg-white">
                  <div className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                    <span>Rows per page:</span>
                    <div className="relative">
                      <select className="h-9 rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none appearance-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <option>5</option>
                        <option>10</option>
                        <option>25</option>
                      </select>
                      <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
                    </div>
                    <span>1-{filteredTeam.length} of 50</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] opacity-50">
                      <span className="material-icons" style={{ fontSize: "16px" }}>chevron_left</span>
                    </button>
                    <button type="button" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors">
                      <span className="material-icons" style={{ fontSize: "16px" }}>chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Manage Custom Fields inline card */}
                <div className="px-3 pb-3 pt-0 bg-white">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Manage Custom Fields in General &gt; Custom Fields</span>
                      <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>All custom fields are configured in one place across Clients, Jobs, Estimates, Invoices, Items.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection("general")}
                      className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[14px] text-[#1A2332] transition-colors shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      Manage Custom Fields
                    </button>
                  </div>
                </div>
              </div>

              {/* Invite user modal */}
              {inviteOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                  onClick={() => setInviteOpen(false)}
                >
                  <div
                    className="w-[460px] bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                      <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invite user</h3>
                      <button
                        onClick={() => setInviteOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#374151] transition-colors"
                      >
                        <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                      </button>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <div>
                        <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Name</label>
                        <input
                          value={invite.name}
                          onChange={e => setInvite({ ...invite, name: e.target.value })}
                          placeholder="Full name"
                          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Email</label>
                        <input
                          type="email"
                          value={invite.email}
                          onChange={e => setInvite({ ...invite, email: e.target.value })}
                          placeholder="name@company.com"
                          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Role</label>
                          <div className="relative">
                            <select
                              value={invite.role}
                              onChange={e => setInvite({ ...invite, role: e.target.value as AppRole })}
                              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] appearance-none cursor-pointer"
                            >
                              {permissionRoles.map(role => (
                                <option key={role.id} value={role.label}>{role.label}</option>
                              ))}
                            </select>
                            <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Pay rate</label>
                          <input
                            value={invite.rate}
                            onChange={e => setInvite({ ...invite, rate: e.target.value })}
                            placeholder="25"
                            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setInvite(emptyInvite); setInviteOpen(false); }}
                        className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[14px] text-[#374151] transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitInvite}
                        className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Send invite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Security & Password */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Login Security &amp; Password</span>
                  <span className="text-[14px] leading-5 text-[#6B7280]">How invitations and password resets work for users you add.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Send temporary password link on invite</span>
                      <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>Owner receives a one-time link by email instead of typing a password manually.</span>
                    </div>
                    <Switch checked={tempPasswordLink} onCheckedChange={setTempPasswordLink} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Require password change on first login</span>
                      <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>User must set their own password after using the temporary link.</span>
                    </div>
                    <Switch checked={forceChangeOnLogin} onCheckedChange={setForceChangeOnLogin} />
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                {/* Title + description */}
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Two-Factor Authentication</span>
                  <span className="text-[14px] leading-5 text-[#6B7280]">Add a second step to login using email or phone code.</span>
                </div>

                {/* Inner bordered item */}
                <div className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] p-4">
                  {/* Toggle row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Enable 2FA for the workspace</span>
                      <span className="text-[12px] leading-4 text-[#6B7280]" style={{ fontWeight: 500 }}>When on, all users must complete a second step on every new device.</span>
                    </div>
                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  </div>

                  {/* Horizontal radio options */}
                  {twoFactorEnabled && (
                    <div className="flex gap-4">
                      {([
                        { id: "email",   label: "Email",        desc: "Send 6-digit code to user's email." },
                        { id: "phone",   label: "Phone (SMS)",   desc: "Send code via SMS." },
                        { id: "either",  label: "Either",        desc: "Let the user choose at login." },
                      ] as const).map(opt => {
                        const selected = twoFactorMethod === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTwoFactorMethod(opt.id)}
                            className="flex flex-1 items-start gap-3 rounded-[10px] border p-3 text-left transition-colors"
                            style={{ borderColor: selected ? "#4A6FA5" : "#E5E7EB", background: "#FFFFFF" }}
                          >
                            {/* Square radio */}
                            <span className="mt-[2.5px] shrink-0 relative flex items-center justify-center" style={{ width: 16, height: 16 }}>
                              <span
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                  border: `1px solid ${selected ? "#4A6FA5" : "#E5E7EB"}`,
                                  borderRadius: 3,
                                  background: "#FFFFFF",
                                  boxShadow: selected ? "none" : "0px 1px 2px rgba(0,0,0,0.05)",
                                }}
                              >
                                {selected && (
                                  <span style={{ width: 8, height: 8, background: "#4A6FA5", borderRadius: 2, display: "block" }} />
                                )}
                              </span>
                            </span>
                            <span className="flex flex-col gap-1.5">
                              <span className="text-[14px] leading-5 text-[#1A2332]">{opt.label}</span>
                              <span className="text-[12px] leading-4 text-[#6B7280]">{opt.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Save changes */}
              <div className="flex items-center justify-end pb-2">
                <button
                  type="button"
                  disabled
                  className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] opacity-50 cursor-not-allowed"
                  style={{ fontWeight: 500 }}
                >
                  Save changes
                </button>
              </div>

              {/* Pay rates settings modal */}
              {payRatesOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                  onClick={() => setPayRatesOpen(false)}
                >
                  <div
                    className="w-[560px] bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Pay rates</h3>
                        <span className="text-[14px] leading-5 text-[#6B7280]">How the company tracks compensation. Affects commission and reporting later.</span>
                      </div>
                      <button
                        onClick={() => setPayRatesOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#374151] transition-colors shrink-0"
                      >
                        <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                      </button>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex gap-4">
                        {([
                          { id: "hourly", label: "Hourly"  },
                          { id: "daily",  label: "Per day" },
                          { id: "salary", label: "Salary"  },
                        ] as const).map(opt => {
                          const selected = defaultPayType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setDefaultPayType(opt.id)}
                              className="flex flex-1 items-center gap-3 rounded-[10px] border p-3 text-left transition-colors"
                              style={{ borderColor: selected ? "#4A6FA5" : "#E5E7EB", background: "#FFFFFF" }}
                            >
                              <span className="shrink-0 relative flex items-center justify-center" style={{ width: 16, height: 16 }}>
                                <span
                                  className="absolute inset-0 flex items-center justify-center"
                                  style={{
                                    border: `1px solid ${selected ? "#4A6FA5" : "#E5E7EB"}`,
                                    borderRadius: 3,
                                    background: "#FFFFFF",
                                    boxShadow: selected ? "none" : "0px 1px 2px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  {selected && (
                                    <span style={{ width: 8, height: 8, background: "#4A6FA5", borderRadius: 2, display: "block" }} />
                                  )}
                                </span>
                              </span>
                              <span className="text-[14px] leading-5 text-[#1A2332]">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[12px] leading-4 text-[#6B7280]">
                        Individual users can override this default from their profile (e.g., Lead Installer paid hourly while Salesperson is on commission).
                      </p>
                    </div>
                    <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPayRatesOpen(false)}
                        className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[14px] text-[#374151] transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPayRatesOpen(false); toast.success("Pay rates settings saved"); }}
                        className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeSection === "billing" && (
            <BillingAndPlanSection />
          )}

          {activeSection === "general" && (
            <>
              <div className="mb-4 flex h-[52px] items-center justify-between">
                <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 600 }}>General</h1>
                <Button type="button" disabled className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white opacity-50" style={{ fontWeight: 500 }}>
                  Save changes
                </Button>
              </div>

              <div className="space-y-4 pb-6">
                <SectionCard title="Industry" description="Helps Vision360 tailor defaults for your type of business." className="min-h-[200px]">
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {generalIndustryOptions.map(option => {
                      const selected = industry === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setIndustry(option)}
                          className={`flex h-11 items-center gap-3 rounded-[10px] border px-3 text-left transition-colors ${selected ? "border-[#4A6FA5] bg-white" : "border-[#E5E7EB] bg-white hover:border-[#B8C3D5]"}`}
                        >
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-[#4A6FA5]" : "border-[#E5E7EB]"}`}>
                            {selected && <span className="h-2 w-2 rounded-full bg-[#4A6FA5]" />}
                          </span>
                          <span className="truncate text-[14px] leading-5 text-[#1A2332]">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard title="Custom Fields" description="Configure 2 custom fields per entity - clients, jobs, estimates, invoices, items, and team. Team custom fields show up as extra columns on the Users table." className="min-h-[367px]">
                  <div className="mt-4 flex w-fit items-center rounded-[10px] p-[3px]">
                    {customFieldEntities.map(entity => (
                      <button
                        key={entity}
                        type="button"
                        onClick={() => setCfEntity(entity)}
                        className={`h-[29px] rounded-lg px-2 text-[14px] leading-5 transition-colors ${cfEntity === entity ? "bg-[#4A6FA5] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#1A2332]"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {customFieldEntityLabels[entity]}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 space-y-3">
                    {customFields[cfEntity].map((field, idx) => (
                      <div key={idx} className="rounded-lg border border-[#E5E7EB] p-4">
                        <div className="grid grid-cols-[1fr_237px] items-end gap-4">
                          <Field label="Field 1">
                            <Input
                              value={field.label}
                              onChange={e => customFieldsStore.updateField(cfEntity, idx, { label: e.target.value })}
                              placeholder="Field label"
                              className="h-9 border-[#E5E7EB] text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                            />
                          </Field>
                          <Field label="Type">
                            <select
                              value={field.type}
                              onChange={e => customFieldsStore.updateField(cfEntity, idx, { type: e.target.value as CfFieldType })}
                              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                            >
                              <option value="checkbox">Checkbox</option>
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {([
                  { id: "terms" as LegalDocId, title: "Terms & Conditions", description: "Default terms attached to estimates and invoices sent to clients.", placeholder: "Paste or type your terms and conditions here..." },
                  { id: "policies" as LegalDocId, title: "Policies", description: "Internal company policies visible to team members.", placeholder: "Paste or type your company policies here..." },
                  { id: "privacy" as LegalDocId, title: "Privacy Policy", description: "Your company's privacy policy shown on the Client Hub and customer-facing pages.", placeholder: "Paste or type your privacy policy here..." },
                ]).map(({ id, title, description, placeholder }) => {
                  const mode = legalModes[id];
                  const file = legalFiles[id];
                  const setFile = legalFileSetters[id];
                  return (
                    <SectionCard key={id} title={title} description={description} className={id === "policies" ? "min-h-[223px]" : "min-h-[291px]"}>
                      <div className="mt-2 flex items-center gap-2">
                        {(["file", "text"] as LegalMode[]).map(modeOption => (
                          <button
                            key={modeOption}
                            type="button"
                            onClick={() => requestLegalMode(id, modeOption)}
                            className={`h-[29px] rounded-lg px-2 text-[14px] leading-5 transition-colors ${mode === modeOption ? "bg-[#4A6FA5] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-[#6B7280] hover:bg-[#F5F7FA]"}`}
                            style={{ fontWeight: 500 }}
                          >
                            {modeOption === "file" ? "File upload" : "Free text"}
                          </button>
                        ))}
                      </div>

                      {mode === "file" ? (
                        <div className="mt-3">
                          {file ? (
                            <div className="flex h-14 items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F5F7FA] px-4">
                              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>description</span>
                              <span className="flex-1 truncate text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{file}</span>
                              <button type="button" onClick={() => setFile(null)} className="text-[#9CA3AF] hover:text-[#DC2626]">
                                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                              </button>
                            </div>
                          ) : (
                            <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E5E7EB] bg-white hover:border-[#B8C3D5]">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB]">
                                <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>upload</span>
                              </span>
                              <span className="text-center text-[14px] leading-5 text-[#1A2332]">
                                Drop your file here, or <span className="text-[#4A6FA5] underline">click to browse</span>
                              </span>
                              <span className="text-[12px] leading-4 text-[#6B7280]">PDF or DOCX</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={e => {
                                  const uploaded = e.target.files?.[0];
                                  if (uploaded) setFile(uploaded.name);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={legalText[id]}
                          onChange={e => setLegalText(prev => ({ ...prev, [id]: e.target.value }))}
                          placeholder={placeholder}
                          className="mt-3 h-[76px] w-full resize-y rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#6B7280] focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                        />
                      )}
                    </SectionCard>
                  );
                })}

                <div className="flex h-9 justify-end">
                  <Button type="button" disabled className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white opacity-50" style={{ fontWeight: 500 }}>
                    Save changes
                  </Button>
                </div>
              </div>

              {pendingLegalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#D3DEE8]/90">
                  <div className="w-[360px] rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_22px_rgba(26,35,50,0.18)]">
                    <h3 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>
                      {pendingLegalMode.mode === "text" ? "Replace file with text?" : "Replace text with a file?"}
                    </h3>
                    <p className="mt-3 max-w-[285px] text-[12px] leading-4 text-[#6B7280]">
                      {pendingLegalMode.mode === "text"
                        ? "Your uploaded file will be removed. You can upload a new one at any time."
                        : "Your typed terms will be removed. You can type them again at any time."}
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setPendingLegalMode(null)} className="h-8 rounded-md border-[#E5E7EB] px-4 text-[12px] text-[#1A2332]">
                        Cancel
                      </Button>
                      <Button type="button" onClick={confirmLegalMode} className="h-8 rounded-md bg-[#4A6FA5] px-4 text-[12px] text-white hover:bg-[#3d5a85]">
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {false && activeSection === "general" && (
            <>
              <SectionHeader
                title="General"
                description="Industry type, custom fields, terms & conditions, and company policies."
              />
              <div className="space-y-4">
                <SectionCard title="Industry" description="Helps Vision360 tailor defaults for your type of business.">
                  <Field label="Industry type">
                    <select className="h-9 w-full max-w-[380px] rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]">
                      <option>Home Services</option>
                      <option>HVAC</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Landscaping</option>
                      <option>Cleaning</option>
                      <option>General Contracting</option>
                      <option>Other</option>
                    </select>
                  </Field>
                </SectionCard>

                <SectionCard title="Custom Fields" description="Configure 2 custom fields per entity — clients, jobs, estimates, invoices, items, and team. Team custom fields show up as extra columns on the Users table.">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(["clients", "jobs", "estimates", "invoices", "items", "team"] as CfEntity[]).map(entity => (
                      <button
                        key={entity}
                        onClick={() => setCfEntity(entity)}
                        className={`h-8 rounded-lg px-3 text-[13px] capitalize ${cfEntity === entity ? "bg-[#4A6FA5] text-white" : "border border-[#E5E7EB] bg-white text-[#546478] hover:bg-[#F5F7FA]"}`}
                        style={{ fontWeight: 700 }}
                      >
                        {entity}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {customFields[cfEntity].map((field, idx) => (
                      <div key={idx} className="rounded-xl border border-[#E5E7EB] p-4">
                        <div className="grid grid-cols-[1fr_180px] items-center gap-3">
                          <Field label={`Field ${idx + 1} label`}>
                            <Input
                              value={field.label}
                              onChange={e => customFieldsStore.updateField(cfEntity, idx, { label: e.target.value })}
                              placeholder="Enter field label..."
                              className="h-9 border-[#D8DEE8] text-[14px]"
                            />
                          </Field>
                          <Field label="Type">
                            <select
                              value={field.type}
                              onChange={e => customFieldsStore.updateField(cfEntity, idx, { type: e.target.value as CfFieldType })}
                              className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer — Save / Cancel attached to the card */}
                  <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toast.info("Changes discarded")}
                      className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => toast.success(`Custom fields for ${cfEntity} saved`)}
                      className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                      style={{ fontWeight: 600 }}
                    >
                      Save changes
                    </Button>
                  </div>
                </SectionCard>

                {/* ── Reusable legal-text card helper ── */}
                {([
                  { title: "Terms & Conditions", description: "Default terms attached to estimates and invoices sent to clients.", file: tcFile, setFile: setTcFile, placeholder: "Paste or type your terms and conditions here…" },
                  { title: "Policies", description: "Internal company policies visible to team members.", file: policiesFile, setFile: setPoliciesFile, placeholder: "Paste or type your company policies here…" },
                  { title: "Privacy Policy", description: "Your company's privacy policy shown on the Client Hub and customer-facing pages.", file: privacyFile, setFile: setPrivacyFile, placeholder: "Paste or type your privacy policy here…" },
                ] as { title: string; description: string; file: string | null; setFile: (v: string | null) => void; placeholder: string }[]).map(({ title, description, file, setFile, placeholder }) => (
                  <SectionCard key={title} title={title} description={description}>
                    {/* Upload zone */}
                    {file ? (
                      <div className="flex items-center gap-3 rounded-lg border border-[#D8DEE8] bg-[#F5F7FA] px-4 py-3">
                        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>description</span>
                        <span className="flex-1 text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{file}</span>
                        <button onClick={() => setFile(null)} className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors">
                          <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D8DEE8] bg-[#F9FAFB] px-4 py-5 cursor-pointer hover:border-[#4A6FA5] hover:bg-[#F0F4FB] transition-colors">
                        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "28px" }}>upload_file</span>
                        <span className="text-[13px] text-[#6B7280]">
                          <span className="text-[#4A6FA5] font-medium">Upload a file</span> — PDF or DOCX
                        </span>
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f.name); }} />
                      </label>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-[#E5E7EB]" />
                      <span className="text-[12px] text-[#9CA3AF]">or type directly below</span>
                      <div className="flex-1 h-px bg-[#E5E7EB]" />
                    </div>

                    {/* Text area */}
                    <textarea
                      rows={5}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y"
                    />
                    <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
                  </SectionCard>
                ))}
              </div>
            </>
          )}

          {activeSection === "localization" && (
            <>
              <SectionHeader
                title="Localization"
                description="Country, language, time zone, date / time format, and week start. These apply across the app — calendar, documents, and any timestamp the user sees."
              />
              <div className="space-y-4 pb-6">
                <RegionalSettingsCard />
              </div>
            </>
          )}

          {activeSection === "relationships" && (
            <>
              <div className="mb-4 flex h-[52px] items-center justify-between">
                <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 600 }}>Relationships</h1>
              </div>
              <div className="space-y-4 pb-6">
                <SectionCard
                  title="Relationship types"
                  description="Used in Additional Contacts on the client intake form. Add custom types if your team uses different terminology."
                >
                  <div className="mt-2 flex w-[422px] gap-3">
                    <Input
                      value={newRelationshipName}
                      onChange={e => setNewRelationshipName(e.target.value)}
                      placeholder="Add relationship (e.g. Spouse, Trustee)"
                      className="h-9 flex-1 border-[#E5E7EB] text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRelationship(); } }}
                    />
                    <Button
                      disabled={!newRelationshipName.trim()}
                      className="h-9 w-[59px] rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]"
                      onClick={addRelationship}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {relationships.map(r => (
                      <div key={r} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FA]">
                          <span className="material-icons" style={{ fontSize: 16, color: "#4A6FA5" }}>person</span>
                        </div>
                        <input
                          value={r}
                          onChange={e => relationshipsStore.renameRelationship(r, e.target.value)}
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1A2332] outline-none"
                          style={{ fontWeight: 500 }}
                        />
                        <button
                          onClick={() => { relationshipsStore.removeRelationship(r); toast.success("Relationship removed"); }}
                          className="shrink-0 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                          title="Remove"
                        >
                          <span className="material-icons" style={{ fontSize: 18 }}>delete_outline</span>
                        </button>
                      </div>
                    ))}
                    {relationships.length === 0 && (
                      <div className="col-span-3 text-[13px] text-[#9CA3AF]">No relationships yet.</div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </>
          )}

          {(activeSection === "jobs" || activeSection === "estimates" || activeSection === "invoices" || activeSection === "items") && (
            <>
              {activeSection === "jobs" ? (
                <div className="mb-4 flex h-[52px] items-center justify-between">
                  <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs</h1>
                  <Button type="button" disabled className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white opacity-50" style={{ fontWeight: 500 }}>
                    Save changes
                  </Button>
                </div>
              ) : (
                <SectionHeader
                  title={{
                    estimates: "Estimate Preferences",
                    invoices: "Invoice Preferences",
                    items: "Item Preferences",
                  }[activeSection as "estimates" | "invoices" | "items"]}
                  description="System preference areas are intentionally simple and module-specific. Clients do not get a separate settings area in MVP."
                />
              )}
              <div className="space-y-4 pb-6">
                {activeSection === "jobs" && (
                  <>
                    {/* Job Types */}
                    <SectionCard title="Job Types" description="Types used when creating jobs. Helps categorize and filter work orders.">
                      <div className="mt-2 flex w-[422px] gap-3">
                        <Input
                          value={newJobTypeName}
                          onChange={e => setNewJobTypeName(e.target.value)}
                          placeholder="Add status (e.g. Dispatched, On Route, Cancelled)"
                          className="h-9 flex-1 border-[#E5E7EB] text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addJobType(); } }}
                        />
                        <Button disabled={!newJobTypeName.trim()} className="h-9 w-[59px] rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" onClick={addJobType}>Add</Button>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {jobTypes.map((jt, idx) => {
                          const clr = JOB_TYPE_COLORS[idx % JOB_TYPE_COLORS.length];
                          return (
                            <div key={jt} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: clr.bg }}>
                                <span className="material-icons" style={{ fontSize: 16, color: clr.fg }}>{clr.icon}</span>
                              </div>
                              <input
                                value={jt}
                                onChange={e => jobTypesStore.renameJobType(jt, e.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1A2332] outline-none"
                                style={{ fontWeight: 500 }}
                              />
                              <button
                                onClick={() => { jobTypesStore.removeJobType(jt); toast.success("Job type removed"); }}
                                className="shrink-0 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                                title="Remove"
                              >
                                <span className="material-icons" style={{ fontSize: 18 }}>delete_outline</span>
                              </button>
                            </div>
                          );
                        })}
                        {jobTypes.length === 0 && (
                          <div className="col-span-3 text-[13px] text-[#9CA3AF]">No job types yet.</div>
                        )}
                      </div>
                    </SectionCard>

                    {/* Job Statuses */}
                    <SectionCard title="Job Statuses" description="MVP ships three core statuses. Rename them or add your own (Dispatched, On Route, Paused, Cancelled…).">
                      {/* System statuses */}
                      <div className="mt-2">
                        <div className="text-[13px] text-[#1A2332] mb-0.5" style={{ fontWeight: 500 }}>System statuses</div>
                        <div className="text-[12px] text-[#6B7280] mb-2">The three core statuses (Scheduled / In Progress / Completed) stay in the system but you can rename them.</div>
                        <div className="grid grid-cols-3 gap-3">
                          {jobStatuses.filter(s => s.core).map(s => (
                            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: s.bg }}>
                                <span className="material-icons" style={{ fontSize: 16, color: s.color }}>{s.icon}</span>
                              </div>
                              <input
                                value={s.label}
                                onChange={e => setJobStatuses(jobStatuses.map(x => x.id === s.id ? { ...x, label: e.target.value } : x))}
                                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1A2332] outline-none"
                                style={{ fontWeight: 500 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="my-2 h-px bg-[#E5E7EB]" />

                      {/* Custom statuses */}
                      <div>
                        <div className="text-[13px] text-[#1A2332] mb-2" style={{ fontWeight: 500 }}>Custom statuses</div>
                        <div className="flex w-[422px] gap-3 mb-3">
                          <Input
                            value={newStatusLabel}
                            onChange={e => setNewStatusLabel(e.target.value)}
                            placeholder="Add status (e.g. Dispatched, On Route, Cancelled)"
                            className="h-9 flex-1 border-[#E5E7EB] text-[13px]"
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const v = newStatusLabel.trim();
                                if (!v) return;
                                const palette = STATUS_PALETTE[jobStatuses.filter(x => !x.core).length % STATUS_PALETTE.length];
                                setJobStatuses([...jobStatuses, { id: `st${Date.now()}`, label: v, ...palette }]);
                                setNewStatusLabel("");
                              }
                            }}
                          />
                          <Button
                            className="h-9 w-[59px] rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]"
                            onClick={() => {
                              const v = newStatusLabel.trim();
                              if (!v) return;
                              const palette = STATUS_PALETTE[jobStatuses.filter(x => !x.core).length % STATUS_PALETTE.length];
                              setJobStatuses([...jobStatuses, { id: `st${Date.now()}`, label: v, ...palette }]);
                              setNewStatusLabel("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {jobStatuses.filter(s => !s.core).map(s => (
                            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: s.bg }}>
                                <span className="material-icons" style={{ fontSize: 16, color: s.color }}>{s.icon}</span>
                              </div>
                              <input
                                value={s.label}
                                onChange={e => setJobStatuses(jobStatuses.map(x => x.id === s.id ? { ...x, label: e.target.value } : x))}
                                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1A2332] outline-none"
                                style={{ fontWeight: 500 }}
                              />
                              <button
                                type="button"
                                onClick={() => setJobStatuses(jobStatuses.filter(x => x.id !== s.id))}
                                className="shrink-0 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                                title="Remove status"
                              >
                                <span className="material-icons" style={{ fontSize: 18 }}>delete_outline</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    {/* Signature Settings */}
                    <SectionCard title="Signature Settings" description="Require the customer's signature at key moments. Captured signatures attach to the job PDF for legal protection.">
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
                          <div className="flex-1">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require signature before starting work</div>
                            <div className="text-[12px] text-[#6B7280] mt-0.5">Field tech can't mark a job In Progress until the customer signs the Authorization to Proceed.</div>
                          </div>
                          <Switch checked={requireSigBeforeStart} onCheckedChange={setRequireSigBeforeStart} />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
                          <div className="flex-1">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require signature on completion</div>
                            <div className="text-[12px] text-[#6B7280] mt-0.5">Customer signs off when the work is done; locks the job into the Completed state.</div>
                          </div>
                          <Switch checked={requireSigOnComplete} onCheckedChange={setRequireSigOnComplete} />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-4">
                          <div className="flex-1">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Capture parent / guardian signature when minor present</div>
                            <div className="text-[12px] text-[#6B7280] mt-0.5">Optional second signature line shown on the customer-facing form.</div>
                          </div>
                          <Switch checked={requireParentSig} onCheckedChange={setRequireParentSig} />
                        </div>
                      </div>
                    </SectionCard>

                    {/* Notes on Jobs */}
                    <SectionCard
                      title="Notes on Jobs"
                      description="Reusable legal / operational text printed on the job sheet (service agreements, authorization, disclaimers)."
                      headerAction={
                        <Button
                          className="h-8 bg-[#4A6FA5] px-3 text-[13px] hover:bg-[#3d5a85]"
                          onClick={() => setJobNotes([...jobNotes, { id: `jn${Date.now()}`, title: "New note", body: "" }])}
                        >
                          + Add note
                        </Button>
                      }
                    >
                      <div className="space-y-3 mt-2">
                        {jobNotes.map(note => (
                          <div key={note.id} className="rounded-xl border border-[#E5E7EB] p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={note.title}
                                onChange={e => setJobNotes(jobNotes.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                                placeholder="Note title"
                                className="flex-1 h-8 px-2 text-[13px] text-[#1A2332] border-0 outline-none bg-transparent"
                                style={{ fontWeight: 600 }}
                              />
                              <button
                                type="button"
                                onClick={() => setJobNotes(jobNotes.filter(n => n.id !== note.id))}
                                className="shrink-0 h-8 w-8 rounded-lg border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] flex items-center justify-center transition-colors"
                                title="Remove note"
                              >
                                <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                              </button>
                            </div>
                            <textarea
                              value={note.body}
                              onChange={e => setJobNotes(jobNotes.map(n => n.id === note.id ? { ...n, body: e.target.value } : n))}
                              rows={3}
                              placeholder="Note text shown on the job sheet…"
                              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2 text-[13px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y"
                            />
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    {/* Schedule Board */}
                    <SectionCard title="Schedule Board" description="Working hours and slot size used across the Schedule view.">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Day starts at</label>
                          <select
                            value={scheduleStartHour}
                            onChange={e => scheduleSettingsStore.setStartHour(parseScheduleHour(e.target.value))}
                            className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            {["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"].map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Day ends at</label>
                          <select
                            value={scheduleEndHour}
                            onChange={e => scheduleSettingsStore.setEndHour(parseScheduleHour(e.target.value))}
                            className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            {["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"].map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Slot duration</label>
                          <select
                            value={scheduleSlot}
                            onChange={e => scheduleSettingsStore.setSlotMinutes(Number(e.target.value))}
                            className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                          </select>
                        </div>
                      </div>
                      <p className="mt-3 text-[12px] text-[#6B7280]">
                        Time zone follows Company Profile → Regional settings. Advanced scheduling (route optimization, dispatch board) ships with Pro.
                      </p>
                    </SectionCard>

                    {/* Custom Fields shortcut + Save footer */}
                    <SectionCard title="Job Custom Fields" description="Each job form supports 2 custom fields (e.g. job category, materials, reporting tag).">
                      <div className="flex items-center justify-between rounded-lg border border-[#D8E3F4] bg-[#F8FBFF] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ColumnSettingsIcon className="h-5 w-5 text-[#1A2332]" />
                          <div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Manage in General → Custom Fields</div>
                            <div className="text-[12px] text-[#6B7280]">All custom fields are configured in one place across Clients, Jobs, Estimates, Invoices, Items.</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="h-9 shrink-0 border-[#E5E7EB] text-[#1A2332] hover:bg-[#F3F4F6] shadow-[0_0_0_3px_#E5E7EB]"
                          onClick={() => { setActiveSection("general"); setCfEntity("jobs"); }}
                        >
                          Manage Custom Fields
                        </Button>
                      </div>

                      {/* Footer — Save / Cancel attached to the last card */}
                      <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => toast.info("Changes discarded")}
                          className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => toast.success("Jobs preferences saved")}
                          className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                          style={{ fontWeight: 600 }}
                        >
                          Save changes
                        </Button>
                      </div>
                    </SectionCard>
                  </>
                )}
                {activeSection === "estimates" && (
                  <>
                    <SectionCard title="Estimate templates" description="Offer four pre-built templates instead of advanced document customization.">
                      <div className="grid grid-cols-4 gap-3">
                        {templateCards.map(card => {
                          const selected = selectedEstimateTemplate === card.title;
                          return (
                            <div
                              key={card.title}
                              onClick={() => { setSelectedEstimateTemplate(card.title); toast.success(`${card.title} template selected`); }}
                              className={`rounded-xl border p-3 flex flex-col transition-all cursor-pointer ${
                                selected
                                  ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30 bg-white"
                                  : "border-[#E5E7EB] hover:border-[#C8D5E8] bg-white"
                              }`}
                            >
                              <TemplatePreview kind={card.title} className="h-[120px] rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] p-2.5 flex flex-col overflow-hidden" />
                              <div className="mt-2 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{card.title}</div>
                              <p className="mt-0.5 text-[12px] leading-4 text-[#546478]">{card.description}</p>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setPreviewEstimateTemplate(card.title); }}
                                className="mt-2 w-full rounded-lg border border-[#E5E7EB] py-2 text-[13px] text-[#1A2332] bg-white hover:bg-[#F9FAFB] transition-colors"
                                style={{ fontWeight: 600 }}
                              >
                                Preview
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Preview modal */}
                      {previewEstimateTemplate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewEstimateTemplate(null)}>
                          <div className="w-[640px] max-h-[80vh] bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                              <div>
                                <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{previewEstimateTemplate} template</h3>
                                <p className="text-[12px] text-[#6B7280]">{templateCards.find(c => c.title === previewEstimateTemplate)?.description}</p>
                              </div>
                              <button onClick={() => setPreviewEstimateTemplate(null)} className="text-[#9CA3AF] hover:text-[#1A2332]">
                                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                              </button>
                            </div>
                            <div className="flex-1 overflow-auto bg-[#F5F7FA] p-6 flex items-start justify-center">
                              <TemplatePreviewLarge kind={previewEstimateTemplate} />
                            </div>
                            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-white">
                              <Button type="button" variant="outline" onClick={() => setPreviewEstimateTemplate(null)} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Close</Button>
                              <Button type="button" onClick={() => { setSelectedEstimateTemplate(previewEstimateTemplate); setPreviewEstimateTemplate(null); toast.success(`${previewEstimateTemplate} template selected`); }} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Use this template</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </SectionCard>
                    <SectionCard title="Estimate rules">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Signature</div>
                          <div className="flex items-center gap-2 py-2">
                            <Switch defaultChecked />
                            <span className="text-[14px] text-[#1A2332]">Require client signature before proceeding</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Payment terms</div>
                          <Input defaultValue="Payment is due within 15 days of approval." className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                        </div>
                      </div>
                      <div className="mt-5 -mx-5 -mb-5 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
                        <Button type="button" variant="outline" onClick={() => toast.info("Changes discarded")} className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">Cancel</Button>
                        <Button type="button" onClick={() => toast.success("Estimate preferences saved")} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6" style={{ fontWeight: 600 }}>Save changes</Button>
                      </div>
                    </SectionCard>
                  </>
                )}
                {activeSection === "invoices" && <InvoicesPreferences templateCards={templateCards} />}
                {activeSection === "items" && <ItemsPreferences />}
              </div>
            </>
          )}

          {activeSection === "finance" && <FinanceCenterSection />}

          {activeSection === "integrations" && (
            <>
              <SectionHeader title="Integrations" description="Connected apps visible as coming-soon cards for MVP planning." />
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["QuickBooks", "Sync clients, invoices, payments, and accounting data.", "account_balance"],
                  ["Zapier", "Connect Vision360 events to outside automation.", "bolt"],
                  ["Mailchimp", "Send customer segments into marketing lists.", "campaign"],
                  ["GoHighLevel", "Future CRM and communication workflow connection.", "hub"],
                ].map(([name, copy, icon]) => (
                  <Card key={name} className="border border-[#E1E6EF] bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF0F8] text-[#4A6FA5]"><span className="material-icons">{icon}</span></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 800 }}>{name}</div>
                          <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] text-[#64748B]" style={{ fontWeight: 700 }}>Coming soon</span>
                        </div>
                        <p className="mt-1 text-[13px] leading-5 text-[#546478]">{copy}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

        </div>
      </main>

      {/* Reset brand assets confirmation dialog */}
      {resetBrandDialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reset-brand-title"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setResetBrandDialogOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[440px] max-w-[90vw] p-6">
            <h3 id="reset-brand-title" className="text-[16px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>
              Reset brand assets?
            </h3>
            <p className="text-[13px] text-[#6B7280] leading-[18px] mb-5">
              This will restore the default Vision360 brand colors and logo. Your custom brand colors and uploaded logo will be removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-9 border-[#D8DEE8] px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]"
                style={{ fontWeight: 500 }}
                onClick={() => setResetBrandDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white px-4 text-[13px]"
                style={{ fontWeight: 600 }}
                onClick={() => {
                  resetBrandTheme();
                  resetBrandLogo();
                  setBrandPrimary(DEFAULT_BRAND_THEME.primary);
                  setBrandAccent(DEFAULT_BRAND_THEME.accent);
                  setBrandLogoPreview("");
                  if (logoInputRef.current) logoInputRef.current.value = "";
                  setResetBrandDialogOpen(false);
                  toast.success("Brand assets restored to default");
                }}
              >
                Reset to default
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
