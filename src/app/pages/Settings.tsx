import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { ColumnSettingsIcon } from "../components/ui/column-settings-icon";
import { companyStore } from "../stores/companyStore";
import { countiesStore } from "../stores/countiesStore";
import { customFieldsStore, type CfEntity } from "../stores/customFieldsStore";
import { jobTypesStore } from "../stores/jobTypesStore";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { tagsStore } from "../stores/tagsStore";
import { applyBrandTheme, DEFAULT_BRAND_THEME, getStoredBrandLogo, getStoredBrandTheme, resetBrandLogo, resetBrandTheme, setBrandLogo } from "../utils/brandTheme";

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
  | "taxes";

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
    title: "Business Management",
    icon: "business",
    items: [
      { id: "companyInfo", label: "Company Info", description: "Company name, address, contact details" },
      { id: "companyProfile", label: "Company Profile", description: "About, branding, taxes, regional" },
      { id: "team", label: "Manage Team", description: "Users, roles, employee access" },
      { id: "billing", label: "Billing & Plan", description: "Core plan, users, subscription payments" },
    ],
  },
  {
    title: "System Preferences",
    icon: "settings",
    items: [
      { id: "general", label: "General", description: "Industry, custom fields, legal texts" },
      { id: "jobs", label: "Jobs", description: "Job types, schedule, signatures, notes" },
      { id: "estimates", label: "Estimates", description: "Templates, deposits, terms" },
      { id: "invoices", label: "Invoices", description: "Templates, signatures, receipt notes" },
      { id: "items", label: "Items", description: "Catalog and item settings" },
    ],
  },
  {
    title: "Finance Center",
    icon: "account_balance",
    items: [
      { id: "finance", label: "Payments", description: "Payment gateway, payout bank, methods" },
    ],
  },
  {
    title: "Integrations",
    icon: "extension",
    items: [
      { id: "integrations", label: "Connected Apps", description: "QuickBooks, Zapier, Mailchimp, GoHighLevel" },
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

const teamMembers = [
  { name: "Peter Novak", email: "peter@omega-home.com", role: "Owner", title: "Business Owner", rate: "$0/hr", status: "Active" },
  { name: "Ivan Petrenko", email: "ivan@omega-home.com", role: "Employee", title: "Technician", rate: "$32/hr", status: "Invited" },
  { name: "Sarah Lee", email: "sarah@omega-home.com", role: "Employee", title: "Office Staff", rate: "$28/hr", status: "Active" },
];

const templateCards = [
  { title: "Classic", description: "Simple layout with logo, totals, and notes." },
  { title: "Modern", description: "More whitespace and a stronger header." },
  { title: "Compact", description: "Good for short estimates and invoices." },
  { title: "Detailed", description: "Best for item-heavy proposals." },
];

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

function SectionCard({ id, title, description, children, headerAction }: { id?: string; title: string; description?: string; children: React.ReactNode; headerAction?: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-4 border border-[#E1E6EF] bg-white px-5 pb-5 pt-4 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
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
type TaxGroupRow = { id: string; name: string; description: string; rateIds: string[] };

function TaxSettingsCard() {
  const [taxIdName, setTaxIdName] = useState("GST");
  const [taxIdNumber, setTaxIdNumber] = useState("123456789");
  const [rates, setRates] = useState<TaxRateRow[]>([
    { id: "r1", name: "Flor",      rate: "6.0", description: "Sales Tax" },
    { id: "r2", name: "Flor",      rate: "6.0", description: "Sales Tax" },
    { id: "r3", name: "Tampa Tax", rate: "0.5", description: "Sales Tax" },
  ]);
  const [groups, setGroups] = useState<TaxGroupRow[]>([
    { id: "g1", name: "Hillsborough County", description: "Tpa+G=Hilld", rateIds: ["r1", "r3"] },
    { id: "g2", name: "Hillsborough County", description: "Tpa+G=Hilld", rateIds: ["r1", "r3"] },
  ]);
  const [defaultId, setDefaultId] = useState<string>("r1");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string[]>([]);

  const sumGroupRate = (rateIds: string[]) =>
    rateIds.reduce((acc, rid) => acc + (parseFloat(rates.find(r => r.id === rid)?.rate || "0") || 0), 0);

  const addRate = () => {
    const id = `r${Date.now()}`;
    setRates(prev => [...prev, { id, name: "", rate: "", description: "" }]);
  };
  const addGroup = () => {
    const id = `g${Date.now()}`;
    setGroups(prev => [...prev, { id, name: "", description: "", rateIds: [] }]);
  };
  const removeRate = (id: string) => {
    setRates(prev => prev.filter(r => r.id !== id));
    setGroups(prev => prev.map(g => ({ ...g, rateIds: g.rateIds.filter(x => x !== id) })));
    if (defaultId === id) setDefaultId(rates.find(r => r.id !== id)?.id ?? groups[0]?.id ?? "");
  };
  const removeGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    if (defaultId === id) setDefaultId(rates[0]?.id ?? "");
  };
  const updateRate = (id: string, patch: Partial<TaxRateRow>) =>
    setRates(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const updateGroup = (id: string, patch: Partial<TaxGroupRow>) =>
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));

  const openEditModal = (group: TaxGroupRow) => {
    setEditingGroup(group.id);
    setEditDraft([...group.rateIds]);
  };
  const saveEditModal = () => {
    if (editingGroup) updateGroup(editingGroup, { rateIds: editDraft });
    setEditingGroup(null);
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
              Select the radio button next to a tax rate or group to make it the default applied to new invoices and jobs.
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
              onNameChange={v => updateRate(rate.id, { name: v })}
              onRateChange={v => updateRate(rate.id, { rate: v })}
              onDescriptionChange={v => updateRate(rate.id, { description: v })}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Tax groups sub-section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tax groups</span>
            <button
              type="button"
              onClick={addGroup}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
              Create Tax Group
            </button>
          </div>
          {groups.map(group => {
            const computed = sumGroupRate(group.rateIds).toFixed(1);
            const rateItems = group.rateIds.map(rid => rates.find(r => r.id === rid)).filter(Boolean) as TaxRateRow[];
            return (
              <div key={group.id} className="flex flex-col gap-0">
                <TaxRow
                  kind="group"
                  checked={defaultId === group.id}
                  onCheck={() => setDefaultId(group.id)}
                  onRemove={() => removeGroup(group.id)}
                  nameLabel="Tax group name"
                  rateLabel="Tax group rate (%)"
                  name={group.name}
                  rateValue={computed}
                  rateLocked
                  description={group.description}
                  onNameChange={v => updateGroup(group.id, { name: v })}
                  onDescriptionChange={v => updateGroup(group.id, { description: v })}
                />
                <div className="flex items-center gap-2 pl-8 min-h-[36px]">
                  <span className="text-[14px] text-[#6B7280]">Tax rates:</span>
                  {rateItems.length === 0
                    ? <span className="text-[14px] text-[#9CA3AF]">None selected</span>
                    : rateItems.map((r, i) => (
                        <span key={r.id} className="flex items-center gap-2">
                          {i > 0 && <span className="w-px self-stretch bg-[#E5E7EB]" />}
                          <span className="text-[14px] text-[#1A2332]">{r.name} ({r.rate}%)</span>
                        </span>
                      ))
                  }
                  <button
                    type="button"
                    onClick={() => openEditModal(group)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                    title="Edit tax rates"
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit tax rates modal */}
      {editingGroup && (() => {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingGroup(null)}>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl w-[380px] p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit tax rates</span>
                <button onClick={() => setEditingGroup(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#6B7280]">
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
                <Button variant="outline" className="h-9 border-[#E5E7EB] px-4 text-[14px] text-[#1A2332]" onClick={() => setEditingGroup(null)}>Cancel</Button>
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
  onNameChange, onRateChange, onDescriptionChange,
}: {
  kind: "rate" | "group";
  checked: boolean;
  onCheck: () => void;
  onRemove: () => void;
  nameLabel: string;
  rateLabel: string;
  name: string;
  rateValue: string;
  description: string;
  rateLocked?: boolean;
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
          <input value={name} onChange={e => onNameChange(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1" style={{ width: 118 }}>
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{rateLabel}</span>
          <input
            value={rateValue}
            readOnly={rateLocked}
            onChange={e => onRateChange?.(e.target.value)}
            className={`${inputCls} ${rateLocked ? "bg-[#F9FAFB]" : ""}`}
          />
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

// Regional settings dropdowns: Country / Timezone / Date format / Time format / First day
function RegionalSettingsCard() {
  const selectCls =
    "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] appearance-none cursor-pointer";
  const labelCls = "block text-[14px] text-[#1A2332] mb-1" as const;

  function SelectField({ label, defaultValue, children }: { label: string; defaultValue: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-1">
        <span className={labelCls} style={{ fontWeight: 500 }}>{label}</span>
        <div className="relative">
          <select className={selectCls} defaultValue={defaultValue}>{children}</select>
          <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Regional settings</span>
      <div className="flex flex-col gap-4">
        <SelectField label="Country" defaultValue="United States">
          <option>United States</option>
          <option>Ukraine</option>
          <option>Canada</option>
          <option>Cyprus</option>
        </SelectField>

        <div className="flex gap-4">
          <div className="flex-1">
            <SelectField label="Timezone" defaultValue="(GMT-05:00) America/New_York">
              <option>(GMT-05:00) America/New_York</option>
              <option>(GMT-06:00) America/Chicago</option>
              <option>(GMT-07:00) America/Denver</option>
              <option>(GMT-08:00) America/Los_Angeles</option>
              <option>(GMT+02:00) Europe/Kyiv</option>
            </SelectField>
          </div>
          <div className="flex-1">
            <SelectField label="Date format" defaultValue="Jan 31, 2026">
              <option>Jan 31, 2026</option>
              <option>31 Jan 2026</option>
              <option>01/31/2026</option>
              <option>31/01/2026</option>
              <option>2026-01-31</option>
            </SelectField>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SelectField label="Time format" defaultValue="12 Hour (1:30 PM)">
              <option>12 Hour (1:30 PM)</option>
              <option>24 Hour (13:30)</option>
            </SelectField>
          </div>
          <div className="flex-1">
            <SelectField label="First day of the week" defaultValue="Sunday">
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
  type Row = { day: string; open: boolean; from: string; to: string };
  const [rows, setRows] = useState<Row[]>([
    { day: "Sunday",    open: false, from: "9:00 am", to: "5:00 pm" },
    { day: "Monday",    open: true,  from: "9:00 am", to: "5:00 pm" },
    { day: "Tuesday",   open: true,  from: "9:00 am", to: "5:00 pm" },
    { day: "Wednesday", open: true,  from: "9:00 am", to: "5:00 pm" },
    { day: "Thursday",  open: true,  from: "9:00 am", to: "5:00 pm" },
    { day: "Friday",    open: true,  from: "9:00 am", to: "5:00 pm" },
    { day: "Saturday",  open: false, from: "9:00 am", to: "5:00 pm" },
  ]);
  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));

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

  const [card, setCard] = useState({ brand: "Visa", last4: "4242", expiry: "12/2026", holder: "Peter Novak" });
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [draftCard, setDraftCard] = useState(card);

  const history = [
    { id: "INV-2026-05", label: "May 2026",      amount: 94, status: "Paid", date: "May 1, 2026"  },
    { id: "INV-2026-04", label: "April 2026",    amount: 94, status: "Paid", date: "Apr 1, 2026"  },
    { id: "INV-2026-03", label: "March 2026",    amount: 94, status: "Paid", date: "Mar 1, 2026"  },
    { id: "INV-2026-02", label: "February 2026", amount: 79, status: "Paid", date: "Feb 1, 2026"  },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <h2 className="text-[24px] leading-[135%] text-[#1A2332]" style={{ fontWeight: 600 }}>Billing & plan</h2>

      {/* 2-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Plan card */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-6">
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
          </div>

          {/* Payment method card */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Subscription payment method</span>
              <span className="text-[14px] leading-5 text-[#6B7280]">Card we charge each month for Vision360.</span>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 80, height: 48, background: "#1C2B3A" }}>
                <span className="text-white text-[13px]" style={{ fontWeight: 800, letterSpacing: "0.08em" }}>VISA</span>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>•••• •••• •••• {card.last4}</span>
                <span className="text-[14px] leading-5 text-[#6B7280]">{card.holder} · Expires {card.expiry}</span>
              </div>
              <button
                type="button"
                onClick={() => { setDraftCard(card); setEditCardOpen(true); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] transition-colors shrink-0"
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <p className="text-[12px] leading-4 text-[#6B7280]">All charges appear on your statement as "Vision360 FSM".</p>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Account manager card */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
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
          <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Payment history</span>
              <span className="text-[14px] leading-5 text-[#6B7280]">Last invoices for your subscription.</span>
            </div>
            <div className="relative">
              <div className="flex flex-col gap-2 rounded-lg border border-[#E5E7EB] p-3">
                {history.map(row => (
                  <div key={row.id} className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
                    <div className="flex flex-col gap-1 flex-1">
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
                      <span className="material-icons" style={{ fontSize: "16px" }}>file_download</span>
                    </button>
                  </div>
                ))}
              </div>
              {/* Gradient fade overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-lg"
                style={{ height: 65, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 100%)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced plans coming soon — full width */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Advanced plans coming soon</span>
          <span className="text-[14px] leading-5 text-[#6B7280]">Vision360 Pro and Enterprise are on the roadmap. They add route optimization, dispatching, advanced reporting, multi-location and white-label.</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Enterprise card */}
          <div className="flex items-start gap-4 rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[14px] leading-5 text-[#4A6FA5]" style={{ fontWeight: 500 }}>Vision360 Enterprise</span>
              <p className="text-[14px] leading-5 text-[#1A2332]">Multi-location, custom permissions, white-label, dedicated success manager.</p>
            </div>
            <span className="inline-flex items-center shrink-0 rounded-lg px-2 py-0.5 text-[12px] leading-4 text-[#BD800E]" style={{ fontWeight: 500, background: "rgba(189,128,14,0.15)" }}>Coming soon</span>
          </div>
          {/* Pro card */}
          <div className="flex items-start gap-4 rounded-lg border border-[#E5E7EB] p-4">
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

      {/* Edit card modal */}
      {editCardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
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
                <label className="text-[13px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>Card number (last 4)</label>
                <Input value={draftCard.last4} onChange={e => setDraftCard({ ...draftCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="4242" className="h-9 border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
function TemplatePreview({ kind }: { kind: string }) {
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
    <div className="mb-2 h-24 rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] p-2 flex flex-col overflow-hidden">
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
              <div className="text-[13px] text-[#546478]">Notify Owner / Admin when a tracked item drops below its reorder threshold.</div>
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
        <Button
          variant="outline"
          className="mt-3 h-9 border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8]"
          onClick={() => setVendors([...vendors, { id: `v${Date.now()}`, name: "New vendor", code: "", contact: "" }])}
        >+ Add vendor</Button>

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
  const [paymentTerms, setPaymentTerms] = useState(["Due on receipt", "Net 15", "Net 30", "Net 60"]);
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
              <button
                key={card.title}
                type="button"
                onClick={() => { setSelectedTemplate(card.title); toast.success(`${card.title} template selected`); }}
                className={`text-left rounded-xl border p-3 transition-all relative cursor-pointer ${
                  selected
                    ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30 bg-[#F8FBFF]"
                    : "border-[#E5E7EB] hover:border-[#C8D5E8] hover:bg-[#FAFBFC]"
                }`}
              >
                {selected && (
                  <span className="absolute top-2 right-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#4A6FA5] text-white">
                    <span className="material-icons" style={{ fontSize: "14px" }}>check</span>
                  </span>
                )}
                <TemplatePreview kind={card.title} />
                <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{card.title}</div>
                <p className="mt-1 text-[12px] leading-4 text-[#546478]">{card.description}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setPreviewTemplate(card.title); }}
                    className="text-[#4A6FA5] hover:underline"
                    style={{ fontWeight: 600 }}
                  >
                    Preview
                  </button>
                  {selected
                    ? <span className="text-[#16A34A]" style={{ fontWeight: 700 }}>In use</span>
                    : <span className="text-[#9CA3AF]">Click to use</span>}
                </div>
              </button>
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

      {/* Numbering */}
      <SectionCard title="Numbering" description="How invoice numbers are generated.">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Prefix</label>
            <Input value={numberingPrefix} onChange={e => setNumberingPrefix(e.target.value)} className="h-9 border-[#D8DEE8]" />
          </div>
          <div>
            <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Next number</label>
            <Input value={nextNumber} onChange={e => setNextNumber(e.target.value.replace(/\D/g, ""))} className="h-9 border-[#D8DEE8]" />
          </div>
          <div>
            <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Zero-pad to</label>
            <select value={zeroPad} onChange={e => setZeroPad(e.target.value)} className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]">
              {["3", "4", "5", "6"].map(n => <option key={n} value={n}>{n} digits</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-[#6B7280]">
          Preview: <span className="font-mono text-[#1A2332]" style={{ fontWeight: 600 }}>{numberingPrefix}{nextNumber.padStart(parseInt(zeroPad), "0")}</span>
        </p>
      </SectionCard>

      {/* Deposits */}
      <SectionCard title="Deposits" description="Collect a deposit when the customer accepts an estimate or signs an invoice.">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require deposit before scheduling</div>
            <div className="text-[13px] text-[#546478]">Customer pays a percentage upfront; rest is invoiced when the job is done.</div>
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

      {/* Discounts */}
      <SectionCard title="Discounts" description="Predefined discount labels available on estimates and invoices.">
        <div className="flex flex-wrap gap-2">
          {discountTypes.map(d => (
            <span key={d} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#1A2332]">
              {d}
              <button onClick={() => setDiscountTypes(discountTypes.filter(x => x !== d))} className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]">×</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder="Add discount label" className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
            onKeyDown={e => { if (e.key === "Enter") { const v = newDiscount.trim(); if (!v || discountTypes.includes(v)) return; setDiscountTypes([...discountTypes, v]); setNewDiscount(""); }}}
          />
          <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
            onClick={() => { const v = newDiscount.trim(); if (!v || discountTypes.includes(v)) return; setDiscountTypes([...discountTypes, v]); setNewDiscount(""); }}>Add</Button>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require client signature on estimates</div>
              <div className="text-[13px] text-[#546478]">Customer signs the estimate before work begins.</div>
            </div>
            <Switch checked={requireSig} onCheckedChange={setRequireSig} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require client signature on invoices</div>
              <div className="text-[13px] text-[#546478]">Signature captured at delivery confirms receipt of services rendered.</div>
            </div>
            <Switch checked={requireSigInvoice} onCheckedChange={setRequireSigInvoice} />
          </div>
        </div>
      </SectionCard>

      {/* Notes on invoice */}
      <SectionCard title="Notes on invoice" description="Default fine print printed at the bottom of every invoice and receipt.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Invoice fine print</label>
            <textarea defaultValue="Equipment remains property of Omega Home Services until invoice is paid in full." className="min-h-[100px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
          </div>
          <div>
            <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Receipt note</label>
            <textarea defaultValue="Paid in full. Thank you for your business." className="min-h-[100px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
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
  const [paypalConnected, setPaypalConnected] = useState(false);
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

  return (
    <>
      <SectionHeader title="Finance Center" description="Payment gateways, payout bank, customer payment methods, and expense tracking." />

      <div className="space-y-4">
        {/* Payments / Gateways */}
        <SectionCard title="Payments" description="Connect a payment processor so customers can pay invoices online.">
          <div className="space-y-3">
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

            {/* PayPal */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#003087] text-white" style={{ fontWeight: 800 }}>P</div>
                <div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>PayPal</div>
                  <div className="text-[12px] text-[#6B7280]">Customers pay with PayPal or Venmo.</div>
                </div>
              </div>
              {paypalConnected ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>Connected</span>
                  <Button variant="outline" className="h-9 border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5]" onClick={() => { setPaypalConnected(false); toast.info("PayPal disconnected"); }}>Disconnect</Button>
                </div>
              ) : (
                <Button className="h-9 bg-[#003087] hover:bg-[#001a52] text-white" onClick={() => { setPaypalConnected(true); toast.success("PayPal connected"); }}>Connect PayPal</Button>
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
              <Input value={routing} onChange={e => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))} className="h-9 border-[#D8DEE8]" />
            </div>
          </div>
          <p className="mt-3 text-[12px] text-[#6B7280]">
            Plaid-verified bank connection coming with Pro. For MVP we capture the last-4 and routing for reporting only.
          </p>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="Payment Methods" description="Which methods appear when an invoice is sent to a customer.">
          <div className="space-y-2">
            {[
              { id: "creditCard", label: "Credit / Debit cards", desc: "Stripe required."                },
              { id: "ach",        label: "ACH bank transfer",    desc: "Lower fees, slower clearing."   },
              { id: "cash",       label: "Cash",                 desc: "Mark paid manually in the app." },
              { id: "check",      label: "Check",                desc: "Track check number on payment." },
              { id: "financing",  label: "Financing",            desc: "Send customer to a lender plan (coming soon)." },
            ].map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2">
                <div>
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{m.label}</div>
                  <div className="text-[12px] text-[#6B7280]">{m.desc}</div>
                </div>
                <Switch checked={(methods as any)[m.id]} onCheckedChange={v => setMethods({ ...methods, [m.id]: v })} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Notes on receipt */}
        <SectionCard title="Notes on receipt" description="Printed at the bottom of every payment receipt.">
          <textarea defaultValue="Thank you for your payment. Keep this receipt for your records." className="min-h-[90px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 resize-y" />
        </SectionCard>

        {/* Expense Tracking */}
        <SectionCard title="Expense Tracking" description="How expenses move from the Expenses module into your books.">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Auto-categorize by vendor</div>
                <div className="text-[13px] text-[#546478]">Apply the last category used for that vendor on new expenses.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require receipt photo</div>
                <div className="text-[13px] text-[#546478]">Field tech must attach a photo before saving an expense.</div>
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Land straight on Company Info — no more 4-tile home landing.
  const [activeSection, setActiveSection] = useState<SettingsSection>("companyInfo");
  const [searchQuery, setSearchQuery] = useState("");
  // Settings nav groups are collapsible accordions. Business Management is opened
  // by default (it contains Company Info, the landing destination); the other
  // groups stay collapsed until the user clicks to expand. While searching,
  // every group is force-expanded so matches stay visible.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Business Management"]));
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
  const jobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  const customFields = useSyncExternalStore(customFieldsStore.subscribe, customFieldsStore.getFields);

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
  const emptyInvite = { name: "", email: "", role: "Employee" as "Owner" | "Employee", title: "", rate: "" };
  const [invite, setInvite] = useState(emptyInvite);
  // ── Login security & 2FA ──
  const [tempPasswordLink, setTempPasswordLink] = useState(true);
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "phone" | "either">("either");
  // ── User role titles (Technician, Installer, etc.) ──
  const [userRoleTitles, setUserRoleTitles] = useState<string[]>([
    "Salesperson", "Office Staff", "Technician", "Installer", "Lead Installer", "Laborer",
  ]);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  // ── Pay rate type per company default ──
  const [defaultPayType, setDefaultPayType] = useState<"hourly" | "daily" | "salary">("hourly");
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
    { id: "jn1", title: "Service Agreement",
      body: "By signing below, the customer agrees to the scope of work described in this job and to the terms of service published at vision360.com/terms." },
    { id: "jn2", title: "Authorization to Proceed",
      body: "I authorize Omega Home Services to perform the work described above and accept full responsibility for the agreed amount." },
    { id: "jn3", title: "Unforeseen Parts Disclaimer",
      body: "Additional parts or labor discovered during the job may be billed separately at standard hourly rates after written approval from the customer." },
  ]);
  const [scheduleStartHour, setScheduleStartHour] = useState("7:00 AM");
  const [scheduleEndHour, setScheduleEndHour] = useState("7:00 PM");
  const [scheduleSlot, setScheduleSlot] = useState("30");
  // Job statuses — MVP starts with three core; additional ones can be added
  type JobStatus = { id: string; label: string; color: string; bg: string; icon: string; core?: boolean };
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([
    { id: "scheduled",  label: "Scheduled",   color: "#4A6FA5", bg: "#EBF0F8", icon: "event_note",   core: true },
    { id: "inProgress", label: "In Progress", color: "#B45309", bg: "#FEF3C7", icon: "play_circle",  core: true },
    { id: "completed",  label: "Completed",   color: "#15803D", bg: "#DCFCE7", icon: "check_circle", core: true },
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
  const filteredTeam = team.filter(m => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.title.toLowerCase().includes(q);
  });
  const submitInvite = () => {
    if (!invite.name.trim() || !invite.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setTeam(prev => [
      ...prev,
      {
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
        title: invite.title.trim() || "—",
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
  const [brandPrimary, setBrandPrimary] = useState(() => getStoredBrandTheme().primary);
  const [brandAccent, setBrandAccent] = useState(() => getStoredBrandTheme().accent);
  const [brandLogoPreview, setBrandLogoPreview] = useState(() => getStoredBrandLogo());
  const [resetBrandDialogOpen, setResetBrandDialogOpen] = useState(false);
  const [tcFile, setTcFile] = useState<string | null>(null);
  const [policiesFile, setPoliciesFile] = useState<string | null>(null);
  const [privacyFile, setPrivacyFile] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section) setActiveSection(normalizeSection(section));
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
    `w-full rounded-lg px-3 py-2 text-left transition-colors ${
      activeSection === section
        ? "bg-[#EBF0F8] text-[#4A6FA5]"
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

  const addJobType = () => {
    if (!newJobTypeName.trim()) return;
    jobTypesStore.addJobType(newJobTypeName);
    setNewJobTypeName("");
    toast.success("Job type added");
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;

    const supportedTypes = ["image/png", "image/svg+xml", "image/jpeg", "image/gif"];
    if (!supportedTypes.includes(file.type)) {
      toast.error("Upload a PNG, SVG, JPG, or GIF logo");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Logo must be under 3 MB");
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

  return (
    <div className="flex h-full bg-[#F2F4F7]" style={{ height: "calc(100vh - 64px)" }}>
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#E1E6EF] bg-white">
        <div className="border-b border-[#E5E7EB] px-4 py-4">
          <div className="text-[12px] uppercase tracking-[0.12em] text-[#546478]" style={{ fontWeight: 800 }}>Settings</div>
          <div className="relative mt-3">
            <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="h-9 border-[#D8DEE8] bg-[#F8FAFC] pl-8 text-[13px]"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {filteredNavGroups.map(group => {
            // When the user is searching, force-expand so matches are visible.
            const isSearching = searchQuery.trim().length > 0;
            const expanded = isSearching || expandedGroups.has(group.title);
            return (
              <div key={group.title} className="mt-4">
                <button
                  type="button"
                  onClick={() => toggleGroupExpanded(group.title)}
                  className="mb-1 flex w-full items-center gap-2 px-3 text-[12px] tracking-wide text-[#7A8799] hover:text-[#1A2332] transition-colors"
                  style={{ fontWeight: 800 }}
                  aria-expanded={expanded}
                >
                  <span className="material-icons" style={{ fontSize: "15px" }}>{group.icon}</span>
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
                        <div className="text-[13px]" style={{ fontWeight: activeSection === item.id ? 700 : 600 }}>{item.label}</div>
                        {item.description && <div className="mt-0.5 truncate text-[11px] text-[#8899AA]">{item.description}</div>}
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
        <div className="max-w-[1120px] px-8 py-7">
          {activeSection === "companyInfo" && (
            <>
              <SectionHeader title="Company info" />
              <div className="space-y-4">
                <SectionCard title="Company info" description="Core business information shown on documents, emails, and customer-facing records.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company name"><Input value={companyName} onChange={e => companyStore.setCompanyName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Legal entity name"><Input defaultValue="Omega Home Services" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Business owner name"><Input defaultValue="Peter Novak" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Address"><Input defaultValue="123 Main Street, Suite 100, Tampa, FL 33606" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Phone number"><Input defaultValue="(813) 286-7572" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Email"><Input defaultValue="office@omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="License number"><Input defaultValue="LIC-2486-FL" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                </SectionCard>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled
                    className="bg-[#4A6FA5] text-white h-9 px-4 opacity-50"
                    style={{ fontWeight: 500 }}
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
                    onClick={() => toast.success("Changes saved")}
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
                        accept="image/png,image/svg+xml,image/jpeg,image/gif"
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
                            <p className="mt-0.5 text-[11px] text-[#9AA3AF]">SVG, PNG, JPG or GIF (max. 3MB)</p>
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
                    defaultValue="Omega Home Services is a full-service home maintenance company based in Tampa, FL. We specialize in HVAC, plumbing, and general repairs."
                    className="min-h-[90px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                </SectionCard>

                <SectionCard title="Social network links" description="Links shown on your Client Hub and customer-facing pages.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Facebook"><Input placeholder="https://facebook.com/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Instagram"><Input defaultValue="https://instagram.com/omega-home" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="LinkedIn"><Input placeholder="https://linkedin.com/company/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                </SectionCard>

                <SectionCard title="Notifications" description="Control when the app notifies you about client activity.">
                  <div className="space-y-3">
                    {[
                      { label: "Client signs an estimate", sub: "In-app and email notification when a client signs" },
                      { label: "Client signs an invoice", sub: "In-app and email notification when a client pays" },
                      { label: "Job status changes", sub: "Notify when a job moves to In Progress or Completed" },
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
                        onClick={() => toast.success("Company profile saved")}
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600 }}>Manage team</h2>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toast.success("Team settings saved"); }}
                  className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Save changes
                </button>
              </div>

              {/* Users table card */}
              <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB]">
                  <div className="relative w-[300px]">
                    <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" style={{ fontSize: "16px" }}>search</span>
                    <input
                      placeholder="Search users"
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setInviteOpen(true); }}
                    className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors shrink-0"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>person_add</span>
                    Invite User
                  </button>
                </div>

                {/* Table */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F7FA]">
                      {["Name", "Email", "Role", "User role title", "Pay rate", "Status", ""].map((h, i) => (
                        <th
                          key={i}
                          className="px-4 text-left text-[12px] text-[#6B7280] border-b border-[#E5E7EB]"
                          style={{ fontWeight: 500, height: 36, whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                          No users match "{teamSearch}".
                        </td>
                      </tr>
                    ) : filteredTeam.map((member, idx) => (
                      <tr key={member.email} className={idx > 0 ? "border-t border-[#E5E7EB]" : ""}>
                        <td className="px-4 text-[14px] text-[#1A2332]" style={{ height: 36, fontWeight: 500 }}>{member.name}</td>
                        <td className="px-4 text-[14px] text-[#6B7280]" style={{ height: 36 }}>{member.email}</td>
                        <td className="px-4 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{member.role}</td>
                        <td className="px-4 text-[14px] text-[#6B7280]" style={{ height: 36 }}>{member.title}</td>
                        <td className="px-4 text-[14px] text-[#6B7280]" style={{ height: 36 }}>{member.rate}</td>
                        <td className="px-4" style={{ height: 36 }}>
                          {member.status === "Active" ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px]" style={{ fontWeight: 500, background: "rgba(22,163,74,0.15)", color: "#16A34A" }}>Active</span>
                          ) : member.status === "Pending" || member.status === "Invited" ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px]" style={{ fontWeight: 500, background: "rgba(189,128,14,0.15)", color: "#BD800E" }}>{member.status}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px]" style={{ fontWeight: 500, background: "rgba(107,114,128,0.15)", color: "#6B7280" }}>{member.status}</span>
                          )}
                        </td>
                        <td className="px-2 relative" style={{ height: 36, width: 40 }}>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setTeamRowMenu(teamRowMenu === member.email ? null : member.email); }}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#374151] transition-colors"
                          >
                            <span className="material-icons" style={{ fontSize: "18px" }}>more_vert</span>
                          </button>
                          {teamRowMenu === member.email && (
                            <div
                              className="absolute right-0 top-8 z-20 w-[120px] rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden"
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
                    ))}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2 text-[14px] text-[#6B7280]">
                    <span>Rows per page:</span>
                    <div className="relative">
                      <select className="h-8 rounded-md border border-[#E5E7EB] bg-white pl-2 pr-6 text-[14px] text-[#1A2332] outline-none appearance-none cursor-pointer">
                        <option>5</option>
                        <option>10</option>
                        <option>25</option>
                      </select>
                      <span className="material-icons pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "14px" }}>expand_more</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                    <span>1–{filteredTeam.length} of {filteredTeam.length}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] disabled:opacity-40" disabled>
                        <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
                      </button>
                      <button type="button" className="w-8 h-8 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F5F7FA] disabled:opacity-40" disabled>
                        <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
                      </button>
                    </div>
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
                              onChange={e => setInvite({ ...invite, role: e.target.value as "Owner" | "Employee" })}
                              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] appearance-none cursor-pointer"
                            >
                              <option value="Employee">Employee</option>
                              <option value="Owner">Owner / Admin</option>
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
                      <div>
                        <label className="block text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>User role title</label>
                        <input
                          value={invite.title}
                          onChange={e => setInvite({ ...invite, title: e.target.value })}
                          placeholder="Technician, Office Staff, Installer…"
                          className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        />
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
                <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Login Security &amp; Password</span>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Send temporary password link on invite</span>
                    <span className="text-[14px] text-[#6B7280]">Owner receives a one-time link by email instead of typing a password manually.</span>
                  </div>
                  <Switch checked={tempPasswordLink} onCheckedChange={setTempPasswordLink} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Require password change on first login</span>
                    <span className="text-[14px] text-[#6B7280]">User must set their own password after using the temporary link.</span>
                  </div>
                  <Switch checked={forceChangeOnLogin} onCheckedChange={setForceChangeOnLogin} />
                </div>
                <div className="pt-1 border-t border-[#E5E7EB]" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Send password reset link</span>
                    <span className="text-[14px] text-[#6B7280]">Trigger a manual reset email for a chosen user.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success("Password reset link sent")}
                    className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[14px] text-[#374151] transition-colors shrink-0"
                    style={{ fontWeight: 500 }}
                  >
                    Send reset link
                  </button>
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

              {/* User Profile defaults */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>User Profile defaults</span>
                  <span className="text-[14px] leading-5 text-[#6B7280]">Fields every user record carries. Marek's MVP set: username, full name, and a pay rate.</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { label: "Username",   desc: "Auto-derived from email, editable." },
                    { label: "Full name",  desc: "Display name across the app." },
                    { label: "Phone",      desc: "Required when 2FA uses SMS." },
                    { label: "User role",  desc: "Owner / Admin or Employee." },
                    { label: "Role title", desc: "Free-form: Technician, Office Staff, …" },
                    { label: "Pay rate",   desc: "Hourly, daily, or salary — set per user." },
                  ]).map(f => (
                    <div key={f.label} className="flex flex-col gap-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5">
                      <span className="text-[13px] leading-5 text-[#1A2332]" style={{ fontWeight: 600 }}>{f.label}</span>
                      <span className="text-[12px] leading-4 text-[#6B7280]">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pay rates */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Pay rates</span>
                  <span className="text-[14px] leading-5 text-[#6B7280]">How the company tracks compensation. Affects commission and reporting later.</span>
                </div>
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
                        {/* Square radio */}
                        <span className="shrink-0 mt-[2.5px] relative flex items-center justify-center" style={{ width: 16, height: 16 }}>
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

              {/* Roles & permissions */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>Roles &amp; permissions</span>
                <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F5F7FA]">
                        <th className="px-4 text-left text-[12px] text-[#6B7280] border-b border-[#E5E7EB]" style={{ fontWeight: 500, height: 36 }}>Feature</th>
                        <th className="px-4 text-right text-[12px] text-[#6B7280] border-b border-[#E5E7EB] w-[100px]" style={{ fontWeight: 500, height: 36 }}>Owner / Admin</th>
                        <th className="px-4 text-right text-[12px] text-[#6B7280] border-b border-[#E5E7EB] w-[100px]" style={{ fontWeight: 500, height: 36 }}>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ["Create / edit clients, jobs, estimates, invoices",     true,  true],
                        ["Add notes, photos, signatures to jobs",                 true,  true],
                        ["View own schedule and assigned jobs",                   true,  true],
                        ["Mark job In Progress / Completed",                      true,  true],
                        ["Send invoices to customers",                            true,  true],
                        ["View company-wide reports and revenue",                 true,  false],
                        ["Manage team (invite / deactivate users)",               true,  false],
                        ["Change billing & subscription plan",                    true,  false],
                        ["Change company info, branding, tax settings",           true,  false],
                        ["Change system preferences (custom fields, job types)",  true,  false],
                        ["Edit bank / payout details",                            true,  false],
                      ] as [string, boolean, boolean][]).map(([label, admin, emp], i) => (
                        <tr key={i} className={i > 0 ? "border-t border-[#E5E7EB]" : ""}>
                          <td className="px-4 text-[14px] text-[#1A2332]" style={{ height: 36 }}>{label}</td>
                          <td className="px-4 text-right" style={{ height: 36, width: 100 }}>
                            {admin ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(22,163,74,0.15)" }}>
                                <span className="material-icons" style={{ fontSize: "13px", color: "#16A34A" }}>check</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(107,114,128,0.15)" }}>
                                <span className="material-icons" style={{ fontSize: "13px", color: "#6B7280" }}>block</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 text-right" style={{ height: 36, width: 100 }}>
                            {emp ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(22,163,74,0.15)" }}>
                                <span className="material-icons" style={{ fontSize: "13px", color: "#16A34A" }}>check</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(107,114,128,0.15)" }}>
                                <span className="material-icons" style={{ fontSize: "13px", color: "#6B7280" }}>block</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User role titles */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>User role titles</span>
                  <span className="text-[14px] leading-5 text-[#6B7280]">Free-form titles used on user profiles. Affect display and commission rules later, not permissions.</span>
                </div>
                <div className="flex gap-3" style={{ width: 422 }}>
                  <input
                    placeholder="Add role title (e.g. Lead Technician)"
                    value={newRoleTitle}
                    onChange={e => setNewRoleTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const v = newRoleTitle.trim();
                        if (!v) return;
                        if (userRoleTitles.some(t => t.toLowerCase() === v.toLowerCase())) { toast.error("That title already exists"); return; }
                        setUserRoleTitles([...userRoleTitles, v]);
                        setNewRoleTitle("");
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#6B7280] outline-none focus:border-[#4A6FA5] focus:text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = newRoleTitle.trim();
                      if (!v) return;
                      if (userRoleTitles.some(t => t.toLowerCase() === v.toLowerCase())) { toast.error("That title already exists"); return; }
                      setUserRoleTitles([...userRoleTitles, v]);
                      setNewRoleTitle("");
                    }}
                    className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] transition-colors shrink-0"
                    style={{ fontWeight: 500, opacity: newRoleTitle.trim() ? 1 : 0.5 }}
                  >
                    Add
                  </button>
                </div>
                {userRoleTitles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {userRoleTitles.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1"
                        style={{ height: 24 }}
                      >
                        <span className="text-[12px] leading-4 text-[#1A2332]" style={{ fontWeight: 500 }}>{t}</span>
                        <button
                          type="button"
                          onClick={() => setUserRoleTitles(userRoleTitles.filter(x => x !== t))}
                          className="flex items-center justify-center shrink-0 transition-opacity hover:opacity-60"
                          style={{ width: 12, height: 12 }}
                          title={`Remove ${t}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M9 3L3 9M3 3l6 6" stroke="#1A2332" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* User Custom Fields */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 600 }}>User Custom Fields</span>
                    <span className="text-[14px] leading-5 text-[#6B7280]">Extra fields you want on every user (e.g., Office / Field flag, who they report to).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserCustomFields([...userCustomFields, { id: `ucf${Date.now()}`, label: "", type: "Text" }])}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors shrink-0"
                    style={{ fontWeight: 500 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Add field
                  </button>
                </div>

                {userCustomFields.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E5E7EB] px-3 py-6 text-center text-[14px] text-[#9CA3AF]">
                    No custom fields yet. Click "Add field" to create one.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {userCustomFields.map(cf => {
                      const update = (patch: Partial<UserCF>) =>
                        setUserCustomFields(userCustomFields.map(x => x.id === cf.id ? { ...x, ...patch } : x));
                      const isDropdown = cf.type === "Dropdown";
                      return (
                        <div key={cf.id} className="rounded-lg border border-[#E5E7EB] p-4">
                          <div className="flex items-end gap-4">
                            {/* Field label column */}
                            <div className="flex flex-col gap-1" style={{ flex: "0 0 246px" }}>
                              <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Field label</span>
                              <input
                                value={cf.label}
                                onChange={e => update({ label: e.target.value })}
                                placeholder="e.g. Office / Field user"
                                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              />
                            </div>
                            {/* Type column */}
                            <div className="flex flex-col gap-1 flex-1">
                              <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Type</span>
                              <div className="relative">
                                <select
                                  value={cf.type}
                                  onChange={e => {
                                    const newType = e.target.value as "Text" | "Dropdown";
                                    update({ type: newType, options: newType === "Dropdown" ? (cf.options ?? "") : undefined });
                                  }}
                                  className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] appearance-none cursor-pointer"
                                >
                                  <option value="Text">Text</option>
                                  <option value="Dropdown">Dropdown</option>
                                </select>
                                <span className="material-icons pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
                              </div>
                            </div>
                            {/* Options column — always rendered, invisible when Text */}
                            <div className="flex flex-col gap-1 flex-1" style={{ opacity: isDropdown ? 1 : 0, pointerEvents: isDropdown ? "auto" : "none" }}>
                              <span className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>Options (comma-separated)</span>
                              <input
                                value={cf.options ?? ""}
                                onChange={e => update({ options: e.target.value })}
                                placeholder="Office, Field"
                                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              />
                            </div>
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setUserCustomFields(userCustomFields.filter(x => x.id !== cf.id))}
                              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
                              title="Remove field"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2.5 4h11M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3.5 4l.5 9.5h8l.5-9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success("Team settings saved")}
                    className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Save changes
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeSection === "billing" && (
            <BillingAndPlanSection />
          )}

          {activeSection === "general" && (
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

          {(activeSection === "jobs" || activeSection === "estimates" || activeSection === "invoices" || activeSection === "items") && (
            <>
              <SectionHeader
                title={{
                  jobs: "Jobs Preferences",
                  estimates: "Estimate Preferences",
                  invoices: "Invoice Preferences",
                  items: "Item Preferences",
                }[activeSection as "jobs" | "estimates" | "invoices" | "items"]}
                description="System preference areas are intentionally simple and module-specific. Clients do not get a separate settings area in MVP."
              />
              <div className="space-y-4">
                {activeSection === "jobs" && (
                  <>
                    {/* Job Types */}
                    <SectionCard title="Job Types" description="Types used when creating jobs. Helps categorize and filter work orders.">
                      <div className="mb-3 flex gap-2">
                        <Input
                          value={newJobTypeName}
                          onChange={e => setNewJobTypeName(e.target.value)}
                          placeholder="New job type..."
                          className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addJobType(); } }}
                        />
                        <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]" onClick={addJobType}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {jobTypes.map(jt => (
                          <span key={jt} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#1A2332]">
                            {jt}
                            <button className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]" onClick={() => { jobTypesStore.removeJobType(jt); toast.success("Job type removed"); }}>×</button>
                          </span>
                        ))}
                        {jobTypes.length === 0 && <span className="text-[13px] text-[#9AA3AF]">No job types yet.</span>}
                      </div>
                    </SectionCard>

                    {/* Job Statuses — editable labels + add custom */}
                    <SectionCard title="Job Statuses" description="MVP ships three core statuses. Rename them or add your own (Dispatched, On Route, Paused, Cancelled…).">
                      <div className="space-y-2">
                        {jobStatuses.map(s => {
                          const defaultLabel: Record<string, string> = {
                            scheduled: "Scheduled",
                            inProgress: "In Progress",
                            completed: "Completed",
                          };
                          const isCore = !!s.core;
                          // Cycle through palette on chip click for custom statuses
                          const cycleColor = () => {
                            if (isCore) return;
                            const palette = STATUS_PALETTE;
                            const idx = palette.findIndex(p => p.color === s.color);
                            const next = palette[(idx + 1) % palette.length];
                            setJobStatuses(jobStatuses.map(x => x.id === s.id ? { ...x, ...next } : x));
                          };
                          return (
                            <div key={s.id} className="flex items-center gap-3">
                              {/* Color/icon chip */}
                              <button
                                type="button"
                                onClick={cycleColor}
                                className={`shrink-0 flex items-center justify-center h-9 w-9 rounded-lg border ${isCore ? "cursor-default" : "hover:ring-2 hover:ring-[#4A6FA5]/30 cursor-pointer"}`}
                                style={{ backgroundColor: s.bg, borderColor: s.bg }}
                                title={isCore ? "Core status — color locked" : "Click to change color"}
                              >
                                <span className="material-icons" style={{ fontSize: "18px", color: s.color }}>{s.icon}</span>
                              </button>
                              {/* Editable label */}
                              <label className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 flex-1 max-w-[320px]">
                                <span className="text-[11px] text-[#6B7280]">Status label</span>
                                <input
                                  value={s.label}
                                  onChange={e => setJobStatuses(jobStatuses.map(x => x.id === s.id ? { ...x, label: e.target.value } : x))}
                                  className="bg-transparent text-[13px] outline-none mt-0.5"
                                  style={{ color: s.color, fontWeight: 600 }}
                                />
                              </label>
                              {isCore ? (
                                <button
                                  type="button"
                                  onClick={() => setJobStatuses(jobStatuses.map(x => x.id === s.id ? { ...x, label: defaultLabel[s.id] ?? x.label } : x))}
                                  className="text-[12px] text-[#4A6FA5] hover:underline"
                                  title="Reset label to default"
                                >
                                  Reset
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setJobStatuses(jobStatuses.filter(x => x.id !== s.id))}
                                  className="shrink-0 h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] flex items-center justify-center transition-colors"
                                  title="Remove status"
                                >
                                  <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add new status */}
                      <div className="mt-4 flex items-center gap-2">
                        <Input
                          value={newStatusLabel}
                          onChange={e => setNewStatusLabel(e.target.value)}
                          placeholder="Add status (e.g. Dispatched, On Route, Cancelled)"
                          className="h-9 max-w-[360px] border-[#D8DEE8] text-[13px]"
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
                          className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
                          onClick={() => {
                            const v = newStatusLabel.trim();
                            if (!v) return;
                            const palette = STATUS_PALETTE[jobStatuses.filter(x => !x.core).length % STATUS_PALETTE.length];
                            setJobStatuses([...jobStatuses, { id: `st${Date.now()}`, label: v, ...palette }]);
                            setNewStatusLabel("");
                          }}
                        >
                          + Add status
                        </Button>
                      </div>

                      <p className="mt-3 text-[12px] text-[#6B7280]">
                        The three core statuses (Scheduled / In Progress / Completed) stay in the system but you can rename them. Click any custom status chip to cycle through colors; trash icon removes it.
                      </p>
                    </SectionCard>

                    {/* Signature Settings */}
                    <SectionCard title="Signature Settings" description="Require the customer's signature at key moments. Captured signatures attach to the job PDF for legal protection.">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require signature before starting work</div>
                            <div className="text-[13px] text-[#546478]">Field tech can't mark a job In Progress until the customer signs the Authorization to Proceed.</div>
                          </div>
                          <Switch checked={requireSigBeforeStart} onCheckedChange={setRequireSigBeforeStart} />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require signature on completion</div>
                            <div className="text-[13px] text-[#546478]">Customer signs off when the work is done; locks the job into the Completed state.</div>
                          </div>
                          <Switch checked={requireSigOnComplete} onCheckedChange={setRequireSigOnComplete} />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Capture parent / guardian signature when minor present</div>
                            <div className="text-[13px] text-[#546478]">Optional second signature line shown on the customer-facing form.</div>
                          </div>
                          <Switch checked={requireParentSig} onCheckedChange={setRequireParentSig} />
                        </div>
                      </div>
                    </SectionCard>

                    {/* Notes on Jobs */}
                    <SectionCard title="Notes on Jobs" description="Reusable legal / operational text printed on the job sheet (service agreements, authorization, disclaimers).">
                      <div className="space-y-3">
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
                      <Button
                        className="mt-3 h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
                        onClick={() => setJobNotes([...jobNotes, { id: `jn${Date.now()}`, title: "New note", body: "" }])}
                      >
                        + Add note
                      </Button>
                    </SectionCard>

                    {/* Schedule Board */}
                    <SectionCard title="Schedule Board" description="Working hours and slot size used across the Schedule view.">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Day starts at</label>
                          <select
                            value={scheduleStartHour}
                            onChange={e => setScheduleStartHour(e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            {["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"].map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Day ends at</label>
                          <select
                            value={scheduleEndHour}
                            onChange={e => setScheduleEndHour(e.target.value)}
                            className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            {["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"].map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Slot duration</label>
                          <select
                            value={scheduleSlot}
                            onChange={e => setScheduleSlot(e.target.value)}
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
                          className="h-9 border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8]"
                          onClick={() => { setActiveSection("general"); setCfEntity("jobs"); }}
                        >
                          Open
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
                      <div className="grid grid-cols-4 gap-3">{templateCards.map(card => <div key={card.title} className="rounded-xl border border-[#E5E7EB] p-3"><div className="mb-2 h-24 rounded-lg bg-[#F5F7FA]" /><div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{card.title}</div><p className="mt-1 text-[12px] leading-4 text-[#546478]">{card.description}</p></div>)}</div>
                    </SectionCard>
                    <SectionCard title="Estimate rules"><div className="grid grid-cols-2 gap-4"><div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"><span className="text-[14px] text-[#1A2332]">Require client signature before proceeding</span><Switch defaultChecked /></div><Field label="Payment terms"><Input defaultValue="Payment is due within 15 days of approval." className="h-9 border-[#D8DEE8]" /></Field></div></SectionCard>
                    <SectionCard title="Document sections" description="Default text shown on every estimate. Edit to match your company's language.">
                      <div className="flex flex-col gap-6">
                        <DocSection label="Terms and Conditions" defaultValue={"This estimate is valid for 30 days from the date above. Work will commence within 5 business days of estimate approval and receipt of the required deposit.\n\nPayment is due upon completion unless otherwise agreed in writing. A finance charge of 1.5% per month (18% APR) will be applied to all past due balances.\n\nAll materials are guaranteed to be as specified. All work is completed in a workmanlike manner according to standard industry practices."} />
                        <DocSection label="Disclaimer" defaultValue="This estimate is based on accessible areas at the time of inspection. Additional charges may apply if unforeseen conditions are discovered once work begins." />
                        <DocSection label="Customer Acknowledgement" defaultValue="By signing below, you acknowledge that you have read, understand, and agree to the terms and conditions, disclaimer, and privacy policy outlined in this estimate." />
                        <DocSection label="Privacy Policy" defaultValue="We respect your privacy. Your information will be used only for the purpose of completing this project and providing you with exceptional service." />
                        <DocSection label="Exclusions" defaultValue="This estimate does not include: patching or painting, permit fees, structural work, or any items not specifically listed in the line items." />
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
