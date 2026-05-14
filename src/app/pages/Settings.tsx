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
function BusinessHoursCard() {
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
    </Card>
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
          {filteredNavGroups.map(group => (
            <div key={group.title} className="mt-4">
              <div className="mb-1 flex items-center gap-2 px-3 text-[12px] tracking-wide text-[#7A8799]" style={{ fontWeight: 800 }}>
                <span className="material-icons" style={{ fontSize: "15px" }}>{group.icon}</span>
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button key={item.id} onClick={() => setActiveSection(item.id)} className={navItemClass(item.id)}>
                    <div className="text-[13px]" style={{ fontWeight: activeSection === item.id ? 700 : 600 }}>{item.label}</div>
                    {item.description && <div className="mt-0.5 truncate text-[11px] text-[#8899AA]">{item.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
                <BusinessHoursCard />

                {/* Footer — Save / Cancel for Company Profile */}
                <div className="flex items-center justify-end gap-3 rounded-xl border border-[#E1E6EF] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
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
                </div>

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
              <div className="mt-4 grid grid-cols-2 gap-4">
                <SectionCard title="Invite security">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><div><div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Send temporary password link</div><div className="text-[13px] text-[#546478]">Require user to change password on first login.</div></div><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between"><div><div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Two-factor authorization</div><div className="text-[13px] text-[#546478]">Use email or phone when available.</div></div><Switch defaultChecked /></div>
                  </div>
                </SectionCard>
                <SectionCard title="Roles placeholder">
                  <p className="text-[13px] leading-5 text-[#546478]">Custom permission matrices stay out of MVP. Keep Owner and Employee, with optional user role title like Technician, Office Staff, Installer, or Laborer.</p>
                </SectionCard>
              </div>
            </>
          )}

          {activeSection === "billing" && (
            <>
              <SectionHeader
                title="Billing & Plan"
                description="MVP shows a Core plan placeholder, payment method, payment history, and direct account manager contact."
              />
              <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
                <SectionCard title="Plan details">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[20px] text-[#1A2332]" style={{ fontWeight: 800 }}>Vision360 Core</div>
                      <p className="mt-1 text-[13px] text-[#546478]">Core module with 3 users: owner plus two employees.</p>
                      <div className="mt-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#546478]">Advanced versions are coming soon. Change plan is hidden for MVP.</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[28px] leading-8 text-[#1A2332]" style={{ fontWeight: 800 }}>$99</div>
                      <div className="text-[13px] text-[#546478]">monthly</div>
                    </div>
                  </div>
                </SectionCard>
                <SectionCard title="Account manager">
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Solomiia Havrylyshyn</div>
                  <p className="mt-1 text-[13px] leading-5 text-[#546478]">Quick email support for MVP customers before a full support center exists.</p>
                  <Button variant="outline" className="mt-3 h-9 border-[#C8D5E8] text-[#4A6FA5]">Email account manager</Button>
                </SectionCard>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <SectionCard title="Subscription payment method">
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF0F8] text-[#4A6FA5]"><span className="material-icons">credit_card</span></div>
                      <div><div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>•••• •••• •••• 4242</div><div className="text-[13px] text-[#546478]">Expires 12/2026</div></div>
                    </div>
                    <Button variant="outline" className="h-8">Edit</Button>
                  </div>
                </SectionCard>
                <SectionCard title="Payment history">
                  <div className="space-y-2">
                    {["May 2026", "April 2026", "March 2026"].map(month => (
                      <div key={month} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px]">
                        <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{month}</span>
                        <span className="text-[#546478]">$99.00 paid</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </>
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

                <SectionCard title="Custom Fields" description="Configure 2 custom fields per entity — clients, jobs, estimates, invoices, and items.">
                  <div className="mb-4 flex gap-2">
                    {(["clients", "jobs", "estimates", "invoices", "items"] as CfEntity[]).map(entity => (
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
                    <EmptyModuleNote title="Schedule board" copy="Keep schedule behavior mostly pre-coded for MVP. Minor preferences can be added after Marek's next review." />
                    <SectionCard title="Job notes"><textarea defaultValue="Default job note visible to employees in the field." className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px]" /></SectionCard>
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
                {activeSection === "invoices" && (
                  <>
                    <SectionCard title="Invoice templates"><div className="grid grid-cols-4 gap-3">{templateCards.map(card => <div key={card.title} className="rounded-xl border border-[#E5E7EB] p-3"><div className="mb-2 h-24 rounded-lg bg-[#F5F7FA]" /><div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{card.title}</div><p className="mt-1 text-[12px] leading-4 text-[#546478]">{card.description}</p></div>)}</div></SectionCard>
                    <SectionCard title="Invoice and receipt notes"><div className="grid grid-cols-2 gap-4"><Field label="Invoice fine print"><textarea defaultValue="Equipment remains property of Omega Home Services until invoice is paid in full." className="min-h-[100px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px]" /></Field><Field label="Receipt note"><textarea defaultValue="Paid in full. Thank you for your business." className="min-h-[100px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px]" /></Field></div></SectionCard>
                  </>
                )}
                {activeSection === "items" && <EmptyModuleNote title="Item settings to review" copy="Marek has not finalized item settings yet. Keep catalog behavior simple until the next pass." />}
              </div>
            </>
          )}

          {activeSection === "finance" && (
            <>
              <SectionHeader
                title="Finance Center"
                description="Money setup gets its own category: payment gateway, payout bank, payment methods, financing, and expense tracking."
              />
              <div className="grid grid-cols-2 gap-4">
                <SectionCard title="Payment gateway"><p className="text-[13px] leading-5 text-[#546478]">Connect Stripe or another processor and define where credit card payments are deposited.</p><Button className="mt-4 h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]">Configure payments</Button></SectionCard>
                <SectionCard title="Bank deposit account"><div className="rounded-xl border border-[#E5E7EB] p-4"><div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Operating account</div><div className="mt-1 text-[13px] text-[#546478]">Bank of America •••• 8821</div></div></SectionCard>
                <SectionCard title="Customer payment methods"><div className="space-y-3">{["Credit cards", "ACH bank transfer", "Cash", "Check"].map(method => <div key={method} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2"><span className="text-[14px] text-[#1A2332]">{method}</span><Switch defaultChecked={method !== "ACH bank transfer"} /></div>)}</div></SectionCard>
                <SectionCard title="Financing"><p className="text-[13px] leading-5 text-[#546478]">Placeholder for future home-improvement lenders and financing brochures.</p><div className="mt-3 rounded-lg bg-[#FEF3C7] px-3 py-2 text-[13px] text-[#92400E]">Coming after MVP review.</div></SectionCard>
                <SectionCard title="Expense tracking"><p className="text-[13px] leading-5 text-[#546478]">Needs Marek's next pass because expenses exist in the app and require a settings area.</p></SectionCard>
              </div>
            </>
          )}

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
