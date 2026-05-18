import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
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

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>{title}</h1>
      <p className="mt-1.5 max-w-[740px] text-[14px] leading-5 text-[#546478]">{description}</p>
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

function SectionCard({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-4 border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
      <div className="mb-4">
        <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
        {description && <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

// Marek-style Tax settings: Tax ID inputs at top, "Default" group of tax rates,
// then tax groups that combine rates. Radio selects the default rate/group.
type TaxRateRow = { id: string; name: string; rate: string; description: string };
type TaxGroupRow = { id: string; name: string; description: string; rateIds: string[] };

function TaxSettingsCard() {
  const [taxIdName, setTaxIdName] = useState("");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [rates, setRates] = useState<TaxRateRow[]>([
    { id: "r1", name: "Flor",           rate: "6.0",  description: "Sales Tax" },
    { id: "r2", name: "Lviw Airport Tax", rate: "0.5",  description: "" },
    { id: "r3", name: "Lviw Sales Tax",   rate: "23.0", description: "" },
    { id: "r4", name: "Tampa Tax",        rate: "0.5",  description: "City of Tampa" },
  ]);
  const [groups, setGroups] = useState<TaxGroupRow[]>([
    { id: "g1", name: "Hillsborough County",      description: "Tpa+G=Hilld", rateIds: ["r1", "r4"] },
    { id: "g2", name: "Lviv Airport Tax Profile", description: "",            rateIds: ["r2", "r3"] },
  ]);
  const [defaultId, setDefaultId] = useState<string>("g1");
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);

  const sumGroupRate = (rateIds: string[]) =>
    rateIds.reduce((acc, rid) => acc + (parseFloat(rates.find(r => r.id === rid)?.rate || "0") || 0), 0);

  const addRate = () => {
    const id = `r${Date.now()}`;
    setRates([...rates, { id, name: "", rate: "", description: "" }]);
  };
  const addGroup = () => {
    const id = `g${Date.now()}`;
    setGroups([...groups, { id, name: "", description: "", rateIds: [] }]);
  };
  const removeRate = (id: string) => {
    setRates(rates.filter(r => r.id !== id));
    setGroups(groups.map(g => ({ ...g, rateIds: g.rateIds.filter(x => x !== id) })));
    if (defaultId === id) setDefaultId(rates.find(r => r.id !== id)?.id ?? groups[0]?.id ?? "");
  };
  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    if (defaultId === id) setDefaultId(rates[0]?.id ?? "");
  };
  const updateRate = (id: string, patch: Partial<TaxRateRow>) =>
    setRates(rates.map(r => r.id === id ? { ...r, ...patch } : r));
  const updateGroup = (id: string, patch: Partial<TaxGroupRow>) =>
    setGroups(groups.map(g => g.id === id ? { ...g, ...patch } : g));
  const toggleRateInGroup = (groupId: string, rateId: string) => {
    setGroups(groups.map(g => g.id === groupId
      ? { ...g, rateIds: g.rateIds.includes(rateId) ? g.rateIds.filter(x => x !== rateId) : [...g.rateIds, rateId] }
      : g));
  };

  return (
    <Card className="border border-[#E1E6EF] bg-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>Tax settings</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addGroup}
            className="h-8 border-[#C8D5E8] bg-white px-3 text-[12px] text-[#4A6FA5] hover:bg-[#EBF0F8]"
            style={{ fontWeight: 600 }}
          >
            + Create Tax Group
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={addRate}
            className="h-8 border-[#C8D5E8] bg-white px-3 text-[12px] text-[#4A6FA5] hover:bg-[#EBF0F8]"
            style={{ fontWeight: 600 }}
          >
            + Create Tax Rate
          </Button>
        </div>
      </div>

      {/* Tax ID block */}
      <div>
        <div className="grid grid-cols-2 gap-0 rounded-xl border border-[#E5E7EB] overflow-hidden">
          <label className="flex flex-col px-3 py-2 border-r border-[#E5E7EB]">
            <span className="text-[11px] text-[#6B7280]">Tax ID name (ex: GST)</span>
            <input
              value={taxIdName}
              onChange={e => setTaxIdName(e.target.value)}
              className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
            />
          </label>
          <label className="flex flex-col px-3 py-2">
            <span className="text-[11px] text-[#6B7280]">Tax ID number</span>
            <input
              value={taxIdNumber}
              onChange={e => setTaxIdNumber(e.target.value)}
              className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
            />
          </label>
        </div>
        <div className="text-[12px] text-[#6B7280] leading-tight pt-0.5 pl-3">Tax ID name and number will appear on invoices</div>
      </div>

      {/* Divider + Default label */}
      <div className="mt-0.5 border-t border-[#E5E7EB] pt-1.5 flex items-center gap-1.5 pl-3">
        <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Default</span>
        <span className="relative group">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#9CA3AF] text-[10px] text-[#9CA3AF] cursor-help">
            ?
          </span>
          <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-[260px] rounded-lg bg-[#1A2332] text-white text-[12px] leading-snug px-3 py-2 shadow-lg">
            Select the radio button next to a tax rate or group to make it the default applied to new invoices and jobs.
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A2332] rotate-45" />
          </span>
        </span>
      </div>

      {/* Rate rows */}
      <div className="mt-0 space-y-2">
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

      {/* Divider before groups */}
      {groups.length > 0 && <div className="mt-0 border-t border-[#E5E7EB] pt-0" />}

      {/* Group rows */}
      <div className="space-y-3">
        {groups.map(group => {
          const computed = sumGroupRate(group.rateIds).toFixed(1);
          const composition = group.rateIds
            .map(rid => {
              const r = rates.find(x => x.id === rid);
              return r ? `${r.name} (${r.rate}%)` : null;
            })
            .filter(Boolean)
            .join(" + ");
          return (
            <div key={group.id}>
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
              <div className="mt-1.5 ml-10 flex items-center gap-3 relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpenFor(pickerOpenFor === group.id ? null : group.id)}
                  className="h-7 border-[#C8D5E8] bg-white px-3 text-[12px] text-[#4A6FA5] hover:bg-[#EBF0F8]"
                  style={{ fontWeight: 600 }}
                >
                  Select Tax Rates
                </Button>
                <span className="text-[12px] text-[#6B7280]">{composition || "No rates selected"}</span>
                {pickerOpenFor === group.id && (
                  <div
                    className="absolute top-9 left-0 z-10 w-[260px] rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-lg"
                  >
                    {rates.map(r => (
                      <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F5F7FA] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.rateIds.includes(r.id)}
                          onChange={() => toggleRateInGroup(group.id, r.id)}
                          className="h-4 w-4 accent-[#4A6FA5]"
                        />
                        <span className="flex-1 text-[13px] text-[#1A2332]">{r.name || "(unnamed)"}</span>
                        <span className="text-[12px] text-[#6B7280]">{r.rate}%</span>
                      </label>
                    ))}
                    <button
                      onClick={() => setPickerOpenFor(null)}
                      className="mt-1 w-full text-[12px] text-[#4A6FA5] hover:underline"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={onCheck}
        aria-pressed={checked}
        className={`mt-3 h-4 w-4 shrink-0 rounded-full border ${checked ? "border-[#4A6FA5] bg-[#4A6FA5]" : "border-[#9CA3AF] bg-white"} flex items-center justify-center`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </button>

      {/* Name */}
      <label className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 w-[170px]">
        <span className="text-[11px] text-[#6B7280]">{nameLabel}</span>
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
        />
      </label>

      {/* Rate */}
      <label className={`flex flex-col rounded-xl border border-[#E5E7EB] px-3 py-1.5 w-[115px] ${rateLocked ? "bg-[#F3F4F6]" : "bg-white"}`}>
        <span className="text-[11px] text-[#6B7280]">{rateLabel}</span>
        <input
          value={rateValue}
          readOnly={rateLocked}
          onChange={e => onRateChange?.(e.target.value)}
          className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
        />
      </label>

      {/* Description */}
      <label className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 flex-1">
        <span className="text-[11px] text-[#6B7280]">Internal tax description</span>
        <input
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
        />
      </label>

      <button
        type="button"
        onClick={onRemove}
        className={`shrink-0 mt-1 self-start h-9 px-4 rounded-lg text-[13px] ${kind === "group" ? "bg-white border border-[#FEE2E2] text-[#DC2626] hover:bg-[#FEF2F2]" : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"}`}
        style={{ fontWeight: 600 }}
        disabled={kind === "rate"}
      >
        Remove
      </button>
    </div>
  );
}

// Big-row regional dropdowns: Country / Timezone / Date format / Time format / First day
function RegionalSettingsCard() {
  const wrapper =
    "h-12 w-full rounded-xl border border-[#D8DEE8] bg-white px-4 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20 appearance-none cursor-pointer";
  const labelClass = "block text-[13px] text-[#1A2332] mb-1.5";
  return (
    <Card className="border border-[#E1E6EF] bg-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
      <h2 className="text-[18px] leading-6 text-[#1A2332] mb-4" style={{ fontWeight: 700 }}>Regional settings</h2>
      <div className="space-y-4">
        <label className="block">
          <span className={labelClass} style={{ fontWeight: 600 }}>Country</span>
          <div className="relative">
            <select className={wrapper} defaultValue="United States">
              <option>United States</option>
              <option>Ukraine</option>
              <option>Canada</option>
              <option>Cyprus</option>
            </select>
            <span className="material-icons pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>expand_more</span>
          </div>
        </label>

        <label className="block">
          <span className={labelClass} style={{ fontWeight: 600 }}>Timezone</span>
          <div className="relative">
            <select className={wrapper} defaultValue="(GMT-05:00) America/New_York">
              <option>(GMT-05:00) America/New_York</option>
              <option>(GMT-06:00) America/Chicago</option>
              <option>(GMT-07:00) America/Denver</option>
              <option>(GMT-08:00) America/Los_Angeles</option>
              <option>(GMT+02:00) Europe/Kyiv</option>
            </select>
            <span className="material-icons pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>expand_more</span>
          </div>
        </label>

        <label className="block">
          <span className={labelClass} style={{ fontWeight: 600 }}>Date format</span>
          <div className="relative">
            <select className={wrapper} defaultValue="Jan 31, 2026">
              <option>Jan 31, 2026</option>
              <option>31 Jan 2026</option>
              <option>01/31/2026</option>
              <option>31/01/2026</option>
              <option>2026-01-31</option>
            </select>
            <span className="material-icons pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>expand_more</span>
          </div>
        </label>

        <label className="block">
          <span className={labelClass} style={{ fontWeight: 600 }}>Time format</span>
          <div className="relative">
            <select className={wrapper} defaultValue="12 Hour (1:30PM)">
              <option>12 Hour (1:30PM)</option>
              <option>24 Hour (13:30)</option>
            </select>
            <span className="material-icons pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>expand_more</span>
          </div>
        </label>

        <label className="block">
          <span className={labelClass} style={{ fontWeight: 600 }}>First day of the week</span>
          <div className="relative">
            <select className={wrapper} defaultValue="Sunday">
              <option>Sunday</option>
              <option>Monday</option>
            </select>
            <span className="material-icons pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "20px" }}>expand_more</span>
          </div>
        </label>
      </div>
    </Card>
  );
}

// Business hours — day list (Sunday Closed, Mon-Fri 9-5, etc.) with inline Edit
function BusinessHoursCard({ footer }: { footer?: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
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

  return (
    <Card className="border border-[#E1E6EF] bg-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] leading-6 text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>Business hours</h2>
          <p className="text-[13px] text-[#6B7280]">
            Business hours set your default availability for{" "}
            <a className="text-[#4A6FA5] hover:underline" href="#online-booking">online booking</a>, team members, and{" "}
            <a className="text-[#4A6FA5] hover:underline" href="#request">request</a> forms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="shrink-0 text-[13px] text-[#4A6FA5] hover:underline"
          style={{ fontWeight: 600 }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="mt-4 divide-y divide-[#E5E7EB]">
        {rows.map((r, i) => (
          <div key={r.day} className="grid grid-cols-[140px_1fr] items-center py-3">
            <div className="text-[14px] text-[#1A2332]">{r.day}</div>
            {editing ? (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-[13px] text-[#1A2332]">
                  <input
                    type="checkbox"
                    checked={r.open}
                    onChange={e => updateRow(i, { open: e.target.checked })}
                    className="h-4 w-4 accent-[#4A6FA5]"
                  />
                  Open
                </label>
                {r.open && (
                  <>
                    <input
                      value={r.from}
                      onChange={e => updateRow(i, { from: e.target.value })}
                      className="h-8 w-24 rounded-lg border border-[#D8DEE8] bg-white px-2 text-[13px] text-[#1A2332]"
                    />
                    <span className="text-[13px] text-[#6B7280]">–</span>
                    <input
                      value={r.to}
                      onChange={e => updateRow(i, { to: e.target.value })}
                      className="h-8 w-24 rounded-lg border border-[#D8DEE8] bg-white px-2 text-[13px] text-[#1A2332]"
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="text-[14px] text-[#1A2332]">
                {r.open ? `${r.from} – ${r.to}` : <span className="text-[#6B7280]">Closed</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      {footer && (
        <div className="mt-5 -mx-6 -mb-6 px-5 py-4 border-t border-[#E1E6EF] flex items-center justify-end gap-3 bg-white rounded-b-xl">
          {footer}
        </div>
      )}
    </Card>
  );
}

// Billing & Plan — Marek's MVP spec
function BillingAndPlanSection() {
  const BASE_PRICE = 49;
  const PER_USER = 15;
  const userCount = 3; // owner + 2 employees for MVP example
  const monthly = BASE_PRICE + PER_USER * userCount;

  // Payment method (edit modal)
  const [card, setCard] = useState({ brand: "Visa", last4: "4242", expiry: "12/2026", holder: "Peter Novak" });
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [draftCard, setDraftCard] = useState(card);

  const history = [
    { id: "INV-2026-05", label: "May 2026",   amount: 94, status: "Paid", date: "May 1, 2026"   },
    { id: "INV-2026-04", label: "April 2026", amount: 94, status: "Paid", date: "Apr 1, 2026"   },
    { id: "INV-2026-03", label: "March 2026", amount: 94, status: "Paid", date: "Mar 1, 2026"   },
    { id: "INV-2026-02", label: "February 2026", amount: 79, status: "Paid", date: "Feb 1, 2026" },
  ];

  return (
    <>
      <SectionHeader
        title="Billing & Plan"
        description="Your subscription, payment method, history, and direct line to your account manager."
      />

      {/* Plan details + price breakdown */}
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
        <Card className="border border-[#E1E6EF] bg-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[20px] leading-7 text-[#1A2332]" style={{ fontWeight: 800 }}>Vision360 Core</h2>
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>Active</span>
              </div>
              <p className="text-[13px] text-[#546478]">
                Core module — schedule, clients, jobs, estimates, invoices, payments, expenses, items.
              </p>
              <p className="mt-2 text-[12px] text-[#6B7280]">
                MVP ships with one plan only. Plan switching opens up when Pro and Enterprise launch.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[32px] leading-9 text-[#1A2332]" style={{ fontWeight: 800 }}>${monthly}</div>
              <div className="text-[13px] text-[#546478]">per month</div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
            <div className="text-[13px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>What's included</div>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#546478]">Base subscription</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>${BASE_PRICE}.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#546478]">{userCount} users × ${PER_USER} / user</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>${PER_USER * userCount}.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-1.5 mt-1">
                <span className="text-[#1A2332]" style={{ fontWeight: 700 }}>Total monthly</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 800 }}>${monthly}.00</span>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-[#6B7280]">
              Adding or removing users in Manage Team prorates this total on the next billing cycle.
            </p>
          </div>
        </Card>

        {/* Account manager */}
        <Card className="border border-[#E1E6EF] bg-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
          <h2 className="text-[16px] leading-6 text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Your account manager</h2>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#4A6FA5] text-white flex items-center justify-center text-[16px]" style={{ fontWeight: 700 }}>SH</div>
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Solomiia Havrylyshyn</div>
              <div className="text-[12px] text-[#6B7280]">solomiia@vision360.com</div>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[#546478]">
            Direct email support for MVP customers — Solomiia answers personally. A full support center launches with Pro.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={() => window.location.href = "mailto:solomiia@vision360.com?subject=Vision360%20support"}
              className="h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons mr-1.5" style={{ fontSize: "16px" }}>mail</span>
              Email Solomiia
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("Schedule-a-call coming soon")}
              className="h-9 border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5]"
            >
              Schedule a call
            </Button>
          </div>
        </Card>
      </div>

      {/* Payment method + Payment history */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <SectionCard title="Subscription payment method" description="Card we charge each month for Vision360.">
          <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[#1A2332] text-white text-[11px]" style={{ fontWeight: 800 }}>{card.brand.toUpperCase()}</div>
              <div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>•••• •••• •••• {card.last4}</div>
                <div className="text-[13px] text-[#546478]">{card.holder} · Expires {card.expiry}</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="h-9 border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5]"
              onClick={() => { setDraftCard(card); setEditCardOpen(true); }}
            >
              Edit
            </Button>
          </div>
          <p className="mt-2 text-[12px] text-[#6B7280]">All charges appear on your statement as "Vision360 FSM".</p>
        </SectionCard>

        <SectionCard title="Payment history" description="Last invoices for your subscription.">
          <div className="space-y-2">
            {history.map(row => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px]">
                <div>
                  <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>{row.label}</div>
                  <div className="text-[11px] text-[#6B7280]">{row.date} · {row.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>${row.amount}.00</span>
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>{row.status}</span>
                  <button
                    onClick={() => toast.success(`Receipt ${row.id} downloaded`)}
                    className="text-[#4A6FA5] hover:text-[#3d5a85]"
                    title="Download receipt"
                  >
                    <span className="material-icons" style={{ fontSize: "18px" }}>file_download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Coming soon plans */}
      <div className="mt-4">
        <Card className="border border-[#D8E3F4] bg-gradient-to-br from-[#F8FBFF] to-white p-6 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>rocket_launch</span>
            <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>Advanced plans coming soon</h2>
          </div>
          <p className="text-[13px] leading-5 text-[#546478] mb-4">
            Vision360 Pro and Enterprise are on the roadmap. They add route optimization, dispatching, advanced reporting, multi-location and white-label.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Vision360 Pro</div>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] text-[#B45309]" style={{ fontWeight: 700 }}>Coming soon</span>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-snug">Route optimization, dispatch board, call tracking, conversion analytics.</p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Vision360 Enterprise</div>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] text-[#B45309]" style={{ fontWeight: 700 }}>Coming soon</span>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-snug">Multi-location, custom permissions, white-label, dedicated success manager.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => toast.success("You'll be notified when Pro launches")}
              className="h-9 border-[#C8D5E8] text-[#4A6FA5] hover:bg-[#EBF0F8]"
              style={{ fontWeight: 600 }}
            >
              Notify me about Pro
            </Button>
          </div>
        </Card>
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
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Edit payment method</h3>
              <button onClick={() => setEditCardOpen(false)} className="text-[#9CA3AF] hover:text-[#1A2332]">
                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Cardholder name</label>
                <Input
                  value={draftCard.holder}
                  onChange={e => setDraftCard({ ...draftCard, holder: e.target.value })}
                  className="h-10 border-[#D8DEE8]"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Card number (last 4)</label>
                <Input
                  value={draftCard.last4}
                  onChange={e => setDraftCard({ ...draftCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="4242"
                  className="h-10 border-[#D8DEE8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Brand</label>
                  <select
                    value={draftCard.brand}
                    onChange={e => setDraftCard({ ...draftCard, brand: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                  >
                    {["Visa", "Mastercard", "Amex", "Discover"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Expiry (MM/YYYY)</label>
                  <Input
                    value={draftCard.expiry}
                    onChange={e => setDraftCard({ ...draftCard, expiry: e.target.value })}
                    placeholder="12/2026"
                    className="h-10 border-[#D8DEE8]"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-[#FAFBFC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCardOpen(false)}
                className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCard(draftCard);
                  setEditCardOpen(false);
                  toast.success("Payment method updated");
                }}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                style={{ fontWeight: 600 }}
              >
                Save card
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const [activeSection, setActiveSection] = useState<SettingsSection>("home");
  const [searchQuery, setSearchQuery] = useState("");
  // Per Marek: settings nav groups are collapsible accordions, all collapsed by default
  // so the user sees only the top-level group titles (Business Management, System
  // Preferences, Finance Center, Integrations) until they click to expand.
  // While searching, every group is force-expanded so matches stay visible.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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

    const supportedTypes = ["image/png", "image/svg+xml"];
    if (!supportedTypes.includes(file.type)) {
      toast.error("Upload a PNG or SVG logo");
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
          {activeSection === "home" && (
            <>
              <SectionHeader
                title="Settings"
                description="Manage your business details, system preferences, payments, and connected apps."
              />
              <div className="grid grid-cols-2 gap-4">
                {navGroups.map(group => (
                  <Card key={group.title} className="border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF0F8] text-[#4A6FA5]">
                        <span className="material-icons" style={{ fontSize: "22px" }}>{group.icon}</span>
                      </div>
                      <h2 className="text-[17px] text-[#1A2332]" style={{ fontWeight: 750 }}>{group.title}</h2>
                    </div>
                    <div className="space-y-2">
                      {group.items.slice(0, 4).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-left hover:bg-[#F8FAFC]"
                        >
                          <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{item.label}</span>
                          <span className="material-icons text-[#9AA3AF]" style={{ fontSize: "16px" }}>chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {activeSection === "companyInfo" && (
            <>
              <SectionHeader
                title="Company Info"
                description="Manage the basic company information used across client-facing documents and system defaults."
              />
              <div className="space-y-4">
                <SectionCard title="Company Info" description="Core business information shown on documents, emails, and customer-facing records.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company Name"><Input value={companyName} onChange={e => companyStore.setCompanyName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Legal entity name"><Input defaultValue="Omega Home Services LLC" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Business Owner Name"><Input defaultValue="Peter Novak" className="h-9 border-[#D8DEE8]" /></Field>
                    <div className="col-span-2">
                      <Field label="Address"><Input defaultValue="123 Main Street, Suite 100, Tampa, FL 33606" className="h-9 border-[#D8DEE8]" /></Field>
                    </div>
                    <Field label="Phone number"><Input defaultValue="(813) 286-7572" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Email address"><Input defaultValue="office@omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="License number"><Input defaultValue="LIC-2486-FL" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>

                  {/* Footer — Save / Cancel (matches CreateClient pattern) */}
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
                      onClick={() => toast.success("Company info saved")}
                      className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                      style={{ fontWeight: 600 }}
                    >
                      Save changes
                    </Button>
                  </div>
                </SectionCard>
              </div>
            </>
          )}

          {activeSection === "companyProfile" && (
            <>
              <SectionHeader
                title="Company Profile"
                description="About your business, branding, social links, taxes, and regional settings."
              />
              <div className="space-y-4">

                <SectionCard id="branding" title="Brand assets" description="Your company branding is shown in Client Hub, email messages, and on all PDFs.">
                  <div className="grid grid-cols-3 divide-x divide-[#E1E6EF]">

                    {/* Brand Colors */}
                    <div className="pr-6">
                      <div className="mb-3 text-[13px] text-[#7A8799]" style={{ fontWeight: 600 }}>Brand Colors</div>
                      <div className="space-y-2.5">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 transition-colors hover:border-[#C8D5E8] hover:bg-[#EBF3FF]">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: brandPrimary }}>
                            <input
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(brandPrimary) ? brandPrimary : "#4A6FA5"}
                              onChange={e => setBrandPrimary(e.target.value)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-[#9AA3AF]" style={{ fontWeight: 600 }}>Main brand color</div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{brandPrimary.toUpperCase()}</div>
                          </div>
                          <span className="material-icons ml-auto text-[#C8D5E8]" style={{ fontSize: "16px" }}>colorize</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 transition-colors hover:border-[#C8D5E8] hover:bg-[#EBF3FF]">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: brandAccent }}>
                            <input
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(brandAccent) ? brandAccent : "#F97316"}
                              onChange={e => setBrandAccent(e.target.value)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-[#9AA3AF]" style={{ fontWeight: 600 }}>Accent color</div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{brandAccent.toUpperCase()}</div>
                          </div>
                          <span className="material-icons ml-auto text-[#C8D5E8]" style={{ fontSize: "16px" }}>colorize</span>
                        </label>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          className="h-8 rounded-lg bg-[#4A6FA5] px-4 text-[12px] hover:bg-[#3d5a85]"
                          style={{ fontWeight: 700 }}
                          onClick={() => {
                            applyBrandTheme({ primary: brandPrimary, accent: brandAccent });
                            toast.success("Brand colors updated successfully");
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg border-[#D8DEE8] px-3 text-[12px] text-[#546478] hover:bg-[#F5F7FA]"
                          style={{ fontWeight: 600 }}
                          onClick={() => {
                            resetBrandTheme();
                            setBrandPrimary(DEFAULT_BRAND_THEME.primary);
                            setBrandAccent(DEFAULT_BRAND_THEME.accent);
                            toast.success("Default theme restored");
                          }}
                        >
                          Get back to default
                        </Button>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="px-6">
                      <div className="mb-3 text-[13px] text-[#7A8799]" style={{ fontWeight: 600 }}>Logo</div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/svg+xml"
                        className="hidden"
                        onChange={e => handleLogoUpload(e.target.files?.[0])}
                      />
                      <div
                        className="group flex h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C8D5E8] bg-[#F8FAFC] transition-colors hover:border-[#4A6FA5] hover:bg-[#EBF3FF]"
                        onClick={() => !brandLogoPreview && logoInputRef.current?.click()}
                      >
                        {brandLogoPreview ? (
                          <img src={brandLogoPreview} alt="Company logo" className="max-h-[110px] max-w-full object-contain p-3" />
                        ) : (
                          <>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E1E6EF] group-hover:ring-[#4A6FA5]">
                              <span className="material-icons text-[#9AA3AF] group-hover:text-[#4A6FA5]" style={{ fontSize: "20px" }}>upload</span>
                            </div>
                            <span className="mt-2 text-[12px] text-[#9AA3AF] group-hover:text-[#4A6FA5]">No logo</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg border-[#C8D5E8] px-4 text-[12px] text-[#4A6FA5] hover:bg-[#EBF3FF]"
                          style={{ fontWeight: 700 }}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          {brandLogoPreview ? "Change logo" : "Add logo"}
                        </Button>
                        {brandLogoPreview && (
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
                        )}
                      </div>
                    </div>

                    {/* Client Document Settings */}
                    <div className="pl-6">
                      <div className="mb-3 text-[13px] text-[#7A8799]" style={{ fontWeight: 600 }}>Client Document Settings</div>
                      <div className="flex h-[130px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F7]">
                        <div className="rounded-lg border border-[#E1E6EF] bg-white p-2.5 shadow-md" style={{ width: 88, transform: "rotate(-1deg)" }}>
                          <div className="mb-1 flex items-center justify-between">
                            <div className="h-1.5 w-12 rounded-full bg-[#1A2332]" />
                            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: brandPrimary }} />
                          </div>
                          <div className="mb-2 h-1 w-8 rounded-full bg-[#C8D5E8]" />
                          <div className="space-y-1 mb-2">
                            {[14, 20, 10, 18].map((w, i) => (
                              <div key={i} className="h-0.5 rounded-full bg-[#E5E7EB]" style={{ width: w * 3 }} />
                            ))}
                          </div>
                          <div className="flex justify-between text-[5px] text-[#9AA3AF]">
                            <div className="h-4 w-10 rounded bg-[#F5F7FA]" />
                            <div className="h-4 w-10 rounded bg-[#F5F7FA]" />
                          </div>
                          <div className="mt-2 flex justify-end">
                            <div className="h-2 w-10 rounded-full" style={{ backgroundColor: brandPrimary, opacity: 0.8 }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg border-[#C8D5E8] px-4 text-[12px] text-[#4A6FA5] hover:bg-[#EBF3FF]"
                          style={{ fontWeight: 700 }}
                        >
                          Edit Settings
                        </Button>
                      </div>
                    </div>

                  </div>
                </SectionCard>

                <SectionCard title="About" description="A short note about your business, visible to your team.">
                  <textarea
                    defaultValue="Omega Home Services is a full-service home maintenance company based in Tampa, FL. We specialize in HVAC, plumbing, and general repairs."
                    className="min-h-[90px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                  <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
                </SectionCard>

                <SectionCard title="Social network links" description="Links shown on your Client Hub and customer-facing pages.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Facebook"><Input placeholder="https://facebook.com/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Instagram"><Input defaultValue="https://instagram.com/omega-home" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="LinkedIn"><Input placeholder="https://linkedin.com/company/your-page" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                  <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
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
            <>
              <SectionHeader
                title="Manage Team"
                description="MVP keeps permissions simple: Owner/Admin and Employee. Employees should not access billing or system preference changes."
              />
              <div className="mb-4 flex items-center justify-between">
                <Input
                  placeholder="Search users..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                  className="h-9 max-w-[360px] border-[#D8DEE8]"
                />
                <Button
                  className="h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]"
                  onClick={() => setInviteOpen(true)}
                >
                  <span className="material-icons mr-1.5" style={{ fontSize: "16px" }}>person_add</span>
                  Invite user
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                <table className="w-full">
                  <thead className="bg-[#F5F7FA]">
                    <tr>
                      {["Name", "Email", "Role", "User role title", "Pay rate", "Status"].map(label => (
                        <th key={label} className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 800 }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                          No users match "{teamSearch}".
                        </td>
                      </tr>
                    ) : filteredTeam.map(member => (
                      <tr key={member.email} className="border-t border-[#E5E7EB]">
                        <td className="px-4 py-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{member.name}</td>
                        <td className="px-4 py-3 text-[14px] text-[#546478]">{member.email}</td>
                        <td className="px-4 py-3 text-[14px] text-[#1A2332]">{member.role}</td>
                        <td className="px-4 py-3 text-[14px] text-[#546478]">{member.title}</td>
                        <td className="px-4 py-3 text-[14px] text-[#546478]">{member.rate}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[12px] ${member.status === "Active" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]"}`} style={{ fontWeight: 700 }}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Invite user</h3>
                      <button
                        onClick={() => setInviteOpen(false)}
                        className="text-[#9CA3AF] hover:text-[#1A2332]"
                      >
                        <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Name</label>
                        <Input
                          value={invite.name}
                          onChange={e => setInvite({ ...invite, name: e.target.value })}
                          placeholder="Full name"
                          className="h-10 border-[#D8DEE8]"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Email</label>
                        <Input
                          type="email"
                          value={invite.email}
                          onChange={e => setInvite({ ...invite, email: e.target.value })}
                          placeholder="name@company.com"
                          className="h-10 border-[#D8DEE8]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Role</label>
                          <select
                            value={invite.role}
                            onChange={e => setInvite({ ...invite, role: e.target.value as "Owner" | "Employee" })}
                            className="h-10 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332]"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Owner">Owner / Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>Pay rate</label>
                          <Input
                            value={invite.rate}
                            onChange={e => setInvite({ ...invite, rate: e.target.value })}
                            placeholder="25"
                            className="h-10 border-[#D8DEE8]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#1A2332] mb-1.5" style={{ fontWeight: 600 }}>User role title</label>
                        <Input
                          value={invite.title}
                          onChange={e => setInvite({ ...invite, title: e.target.value })}
                          placeholder="Technician, Office Staff, Installer…"
                          className="h-10 border-[#D8DEE8]"
                        />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-[#FAFBFC]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setInvite(emptyInvite); setInviteOpen(false); }}
                        className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={submitInvite}
                        className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                        style={{ fontWeight: 600 }}
                      >
                        Send invite
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-4">

                {/* Login Security & Password */}
                <SectionCard title="Login Security & Password" description="How invitations and password resets work for users you add.">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Send temporary password link on invite</div>
                        <div className="text-[13px] text-[#546478]">Owner receives a one-time link by email instead of typing a password manually.</div>
                      </div>
                      <Switch checked={tempPasswordLink} onCheckedChange={setTempPasswordLink} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Require password change on first login</div>
                        <div className="text-[13px] text-[#546478]">User must set their own password after using the temporary link.</div>
                      </div>
                      <Switch checked={forceChangeOnLogin} onCheckedChange={setForceChangeOnLogin} />
                    </div>
                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Send password reset link</div>
                        <div className="text-[13px] text-[#546478]">Trigger a manual reset email for a chosen user.</div>
                      </div>
                      <Button variant="outline" className="h-9 border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] px-4"
                        onClick={() => toast.success("Password reset link sent")}>
                        Send reset link
                      </Button>
                    </div>
                  </div>
                </SectionCard>

                {/* Two-Factor Authentication */}
                <SectionCard title="Two-Factor Authentication" description="Add a second step to login using email or phone code.">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Enable 2FA for the workspace</div>
                        <div className="text-[13px] text-[#546478]">When on, all users must complete a second step on every new device.</div>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>
                    {twoFactorEnabled && (
                      <div>
                        <div className="text-[13px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Delivery method</div>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { id: "email",  label: "Email",          desc: "Send 6-digit code to user's email." },
                            { id: "phone",  label: "Phone (SMS)",    desc: "Send code via SMS, requires phone on user profile." },
                            { id: "either", label: "Either",         desc: "Let the user choose at login." },
                          ] as const).map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setTwoFactorMethod(opt.id)}
                              className={`text-left rounded-lg border p-3 transition-colors ${
                                twoFactorMethod === opt.id
                                  ? "border-[#4A6FA5] bg-[#EBF0F8]"
                                  : "border-[#E5E7EB] hover:bg-[#F5F7FA]"
                              }`}
                            >
                              <div className="text-[13px] text-[#1A2332] mb-0.5" style={{ fontWeight: 600 }}>{opt.label}</div>
                              <div className="text-[11px] text-[#6B7280] leading-snug">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* User Profile defaults */}
                <SectionCard title="User Profile defaults" description="Fields every user record carries. Marek's MVP set: username, full name, and a pay rate.">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Username", hint: "Auto-derived from email, editable." },
                      { label: "Full name", hint: "Display name across the app." },
                      { label: "Phone",     hint: "Required when 2FA uses SMS." },
                      { label: "User role", hint: "Owner / Admin or Employee." },
                      { label: "Role title", hint: "Free-form: Technician, Office Staff, …" },
                      { label: "Pay rate",  hint: "Hourly, daily, or salary — set per user." },
                    ].map(f => (
                      <div key={f.label} className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{f.label}</div>
                        <div className="text-[11px] text-[#6B7280] leading-snug">{f.hint}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Pay Rates */}
                <SectionCard title="Pay Rates" description="How the company tracks compensation. Affects commission and reporting later.">
                  <div className="flex items-center gap-2">
                    {([
                      { id: "hourly", label: "Hourly" },
                      { id: "daily",  label: "Per day" },
                      { id: "salary", label: "Salary" },
                    ] as const).map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDefaultPayType(opt.id)}
                        className={`h-9 px-4 rounded-lg text-[13px] border transition-colors ${
                          defaultPayType === opt.id
                            ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#4A6FA5]"
                            : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA]"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-[#6B7280]">
                    Individual users can override this default from their profile (e.g., Lead Installer paid hourly while Salesperson is on commission).
                  </p>
                </SectionCard>

                {/* Roles & Permissions matrix */}
                <SectionCard title="Roles & Permissions" description="MVP ships with two roles only — Owner / Admin and Employee. Owner has the full key; Employee is restricted from billing, system preferences, and sensitive fields.">
                  <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#F5F7FA] text-[11px] uppercase tracking-wide text-[#546478]">
                        <tr>
                          <th className="px-4 py-2 text-left" style={{ fontWeight: 800 }}>Capability</th>
                          <th className="px-4 py-2 text-center w-[120px]" style={{ fontWeight: 800 }}>Owner / Admin</th>
                          <th className="px-4 py-2 text-center w-[120px]" style={{ fontWeight: 800 }}>Employee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Create / edit clients, jobs, estimates, invoices",      true, true],
                          ["Add notes, photos, signatures to jobs",                  true, true],
                          ["View own schedule and assigned jobs",                    true, true],
                          ["Mark job In Progress / Completed",                       true, true],
                          ["Send invoices to customers",                             true, true],
                          ["View company-wide reports and revenue",                  true, false],
                          ["Manage team (invite / deactivate users)",                true, false],
                          ["Change billing & subscription plan",                     true, false],
                          ["Change company info, branding, tax settings",            true, false],
                          ["Change system preferences (custom fields, job types)",   true, false],
                          ["Edit bank / payout details",                             true, false],
                        ].map(([label, admin, emp], i) => (
                          <tr key={i} className="border-t border-[#E5E7EB]">
                            <td className="px-4 py-2 text-[#1A2332]">{label as string}</td>
                            <td className="px-4 py-2 text-center">
                              {admin ? (
                                <span className="material-icons text-[#16A34A]" style={{ fontSize: "18px" }}>check_circle</span>
                              ) : (
                                <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "18px" }}>remove_circle_outline</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {emp ? (
                                <span className="material-icons text-[#16A34A]" style={{ fontSize: "18px" }}>check_circle</span>
                              ) : (
                                <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "18px" }}>remove_circle_outline</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12px] text-[#6B7280]">
                    A free-form <em>Role title</em> (Technician, Installer, Office Staff, …) can be added per user without creating a new permission set. Custom permission matrices stay out of MVP.
                  </p>
                </SectionCard>

                {/* User Role Titles */}
                <SectionCard title="User Role Titles" description="Free-form titles used on user profiles. Affect display and commission rules later, not permissions.">
                  <div className="flex flex-wrap gap-2">
                    {userRoleTitles.map(t => (
                      <span key={t} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[12px] text-[#546478]">
                        {t}
                        <button
                          onClick={() => setUserRoleTitles(userRoleTitles.filter(x => x !== t))}
                          className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]"
                          title={`Remove ${t}`}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Add role title (e.g. Lead Technician)"
                      value={newRoleTitle}
                      onChange={e => setNewRoleTitle(e.target.value)}
                      className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
                    />
                    <Button
                      className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
                      onClick={() => {
                        const v = newRoleTitle.trim();
                        if (!v) return;
                        if (userRoleTitles.some(t => t.toLowerCase() === v.toLowerCase())) {
                          toast.error("That title already exists");
                          return;
                        }
                        setUserRoleTitles([...userRoleTitles, v]);
                        setNewRoleTitle("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </SectionCard>

                {/* User Custom Fields */}
                <SectionCard title="User Custom Fields" description="Extra fields you want on every user (e.g., Office / Field flag, who they report to).">
                  <div className="space-y-2">
                    {userCustomFields.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#E5E7EB] px-3 py-6 text-center text-[13px] text-[#9CA3AF]">
                        No custom fields yet. Add one below.
                      </div>
                    )}
                    {userCustomFields.map(cf => {
                      const update = (patch: Partial<UserCF>) =>
                        setUserCustomFields(userCustomFields.map(x => x.id === cf.id ? { ...x, ...patch } : x));
                      return (
                        <div key={cf.id} className="flex items-stretch gap-2">
                          {/* Label */}
                          <label className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 flex-1 min-w-0">
                            <span className="text-[11px] text-[#6B7280]">Field label</span>
                            <input
                              value={cf.label}
                              onChange={e => update({ label: e.target.value })}
                              placeholder="e.g. Reports to"
                              className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
                            />
                          </label>
                          {/* Type */}
                          <label className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 w-[140px]">
                            <span className="text-[11px] text-[#6B7280]">Type</span>
                            <select
                              value={cf.type}
                              onChange={e => {
                                const newType = e.target.value as "Text" | "Dropdown";
                                update({ type: newType, options: newType === "Dropdown" ? (cf.options ?? "") : undefined });
                              }}
                              className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5 -ml-0.5"
                            >
                              <option value="Text">Text</option>
                              <option value="Dropdown">Dropdown</option>
                            </select>
                          </label>
                          {/* Options (Dropdown only) */}
                          {cf.type === "Dropdown" ? (
                            <label className="flex flex-col rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 flex-1 min-w-0">
                              <span className="text-[11px] text-[#6B7280]">Options (comma-separated)</span>
                              <input
                                value={cf.options ?? ""}
                                onChange={e => update({ options: e.target.value })}
                                placeholder="Office, Field"
                                className="bg-transparent text-[13px] text-[#1A2332] outline-none mt-0.5"
                              />
                            </label>
                          ) : (
                            <div className="flex flex-1 min-w-0 items-center px-3 text-[12px] text-[#9CA3AF]">Free-form text input</div>
                          )}
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => setUserCustomFields(userCustomFields.filter(x => x.id !== cf.id))}
                            className="shrink-0 self-start mt-1 h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626] flex items-center justify-center transition-colors"
                            title="Remove field"
                          >
                            <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Add field label (e.g. Reports to)"
                      value={newUserCfLabel}
                      onChange={e => setNewUserCfLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const v = newUserCfLabel.trim();
                          if (!v) return;
                          setUserCustomFields([...userCustomFields, { id: `ucf${Date.now()}`, label: v, type: "Text" }]);
                          setNewUserCfLabel("");
                        }
                      }}
                      className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]"
                    />
                    <Button
                      className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]"
                      onClick={() => {
                        const v = newUserCfLabel.trim();
                        if (!v) return;
                        setUserCustomFields([...userCustomFields, { id: `ucf${Date.now()}`, label: v, type: "Text" }]);
                        setNewUserCfLabel("");
                      }}
                    >
                      + Add field
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
                      onClick={() => toast.success("Team settings saved")}
                      className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
                      style={{ fontWeight: 600 }}
                    >
                      Save changes
                    </Button>
                  </div>
                </SectionCard>
              </div>
            </>
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
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>tune</span>
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
    </div>
  );
}
