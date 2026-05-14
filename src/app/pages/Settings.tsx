import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { countiesStore } from "../stores/countiesStore";
import { customFieldsStore, type CfEntity } from "../stores/customFieldsStore";
import { jobTypesStore } from "../stores/jobTypesStore";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { tagsStore } from "../stores/tagsStore";

type SettingsSection =
  | "home"
  | "companyProfile"
  | "team"
  | "billing"
  | "regional"
  | "taxProfiles"
  | "jobs"
  | "estimates"
  | "invoices"
  | "items"
  | "legalTexts"
  | "finance"
  | "integrations"
  | "marketingSources"
  | "customerTags"
  | "counties"
  | "jobTypes"
  | "customFields"
  | "profile"
  | "business"
  | "notifications"
  | "security"
  | "taxes"
  | "templates";

const sectionAliases: Partial<Record<SettingsSection, SettingsSection>> = {
  profile: "companyProfile",
  business: "companyProfile",
  notifications: "jobs",
  security: "team",
  taxes: "taxProfiles",
  templates: "legalTexts",
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
      { id: "companyProfile", label: "Company Profile", description: "Company info, branding, regional defaults" },
      { id: "team", label: "Manage Team", description: "Users, roles, employee access" },
      { id: "billing", label: "Billing & Plan", description: "Core plan, users, subscription payments" },
    ],
  },
  {
    title: "System Preferences",
    icon: "settings",
    items: [
      { id: "regional", label: "Regional", description: "Country, currency, date format, week start" },
      { id: "taxProfiles", label: "Tax Profiles", description: "Rates, tax profiles, defaults" },
      { id: "jobs", label: "Jobs", description: "Schedule board, signatures, notes" },
      { id: "estimates", label: "Estimates", description: "Templates, deposits, terms" },
      { id: "invoices", label: "Invoices", description: "Templates, signatures, receipt notes" },
      { id: "items", label: "Items", description: "Catalog and item settings" },
      { id: "legalTexts", label: "Legal Texts", description: "Terms, policies, form notes" },
      { id: "marketingSources", label: "Lead Sources" },
      { id: "customerTags", label: "Customer Tags" },
      { id: "counties", label: "Counties" },
      { id: "jobTypes", label: "Job Types" },
      { id: "customFields", label: "Custom Fields" },
    ],
  },
  {
    title: "Finance Center",
    icon: "account_balance",
    items: [
      { id: "finance", label: "Money Setup", description: "Payment gateway, payout bank, financing" },
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

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
      <div className="mb-4">
        <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
        {description && <p className="mt-0.5 text-[13px] leading-5 text-[#6B7280]">{description}</p>}
      </div>
      {children}
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
  const [activeSection, setActiveSection] = useState<SettingsSection>("home");
  const [searchQuery, setSearchQuery] = useState("");

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
  const [cfEntity, setCfEntity] = useState<CfEntity>("clients");
  const [cfNewOption, setCfNewOption] = useState<Record<string, string>>({});

  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section) setActiveSection(normalizeSection(section));
  }, [searchParams]);

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
          <button onClick={() => setActiveSection("home")} className={navItemClass("home")}>
            <div className="flex items-center gap-2">
              <span className="material-icons" style={{ fontSize: "17px" }}>dashboard</span>
              <span className="text-[13px]" style={{ fontWeight: activeSection === "home" ? 700 : 600 }}>Overview</span>
            </div>
          </button>

          {filteredNavGroups.map(group => (
            <div key={group.title} className="mt-4">
              <div className="mb-1 flex items-center gap-2 px-3 text-[12px] uppercase tracking-wide text-[#7A8799]" style={{ fontWeight: 800 }}>
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
                description="Manage Vision360 around four MVP areas: business management, system preferences, finance center, and integrations."
              />
              <div className="mb-5 rounded-xl border border-[#BDD4F5] bg-[#EBF3FF] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>info</span>
                  <div>
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>MVP scope note</div>
                    <p className="mt-1 text-[13px] leading-5 text-[#546478]">
                      Keep settings simple for Peter: owner/admin plus employee access, defaults from onboarding, editable tax profiles, and money setup separated into Finance Center.
                    </p>
                  </div>
                </div>
              </div>
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

          {activeSection === "companyProfile" && (
            <>
              <SectionHeader
                title="Company Profile"
                description="One scrolling profile page for company identity, industry, branding, social links, and defaults used across forms."
              />
              <div className="space-y-4">
                <SectionCard title="Company identity" description="Core business information shown on client-facing documents.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company name"><Input defaultValue="Omega Home Services" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Legal entity"><Input defaultValue="Omega Home Services LLC" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Business owner name"><Input defaultValue="Peter Novak" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Tax ID / EIN"><Input defaultValue="12-3456789" className="h-9 border-[#D8DEE8]" /></Field>
                    <div className="col-span-2">
                      <Field label="Business address"><Input defaultValue="123 Main Street, Suite 100" className="h-9 border-[#D8DEE8]" /></Field>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="About and industry" description="Used later for onboarding defaults and form customization.">
                  <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4">
                    <Field label="About company">
                      <textarea
                        defaultValue="Family-owned home services company focused on plumbing, repairs, and installation work."
                        className="min-h-[96px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                      />
                    </Field>
                    <Field label="Industry">
                      <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]">
                        <option>Plumbing</option>
                        <option>HVAC</option>
                        <option>Roofing</option>
                        <option>Cleaning</option>
                        <option>Power washing</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard title="Branding" description="White-label controls for logo, app name, document colors, and social links.">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-dashed border-[#C8D5E8] bg-[#F8FAFC] p-4">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-white text-[#4A6FA5] shadow-sm">
                        <span className="material-icons" style={{ fontSize: "28px" }}>image</span>
                      </div>
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Company logo</div>
                      <p className="mt-1 text-[13px] leading-5 text-[#546478]">Upload logo for sidebar, invoices, estimates, and receipts.</p>
                      <Button variant="outline" className="mt-3 h-9 border-[#C8D5E8] text-[#4A6FA5]">Upload logo</Button>
                    </div>
                    <div className="grid gap-4">
                      <Field label="Primary brand color">
                        <div className="flex gap-2">
                          <Input defaultValue="#4A6FA5" className="h-9 border-[#D8DEE8]" />
                          <input type="color" defaultValue="#4A6FA5" className="h-9 w-12 rounded-lg border border-[#D8DEE8] bg-white p-1" />
                        </div>
                      </Field>
                      <Field label="Accent color">
                        <div className="flex gap-2">
                          <Input defaultValue="#F97316" className="h-9 border-[#D8DEE8]" />
                          <input type="color" defaultValue="#f97316" className="h-9 w-12 rounded-lg border border-[#D8DEE8] bg-white p-1" />
                        </div>
                      </Field>
                      <Field label="Website / social links"><Input placeholder="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </>
          )}

          {activeSection === "regional" && (
            <>
              <SectionHeader
                title="Regional"
                description="Defaults should usually come from onboarding, but owners can adjust country, time zone, currency, date format, and week start."
              />
              <SectionCard title="Regional defaults">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Country">
                    <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>United States</option><option>Ukraine</option><option>Cyprus</option></select>
                  </Field>
                  <Field label="Region / state / oblast"><Input defaultValue="Florida" className="h-9 border-[#D8DEE8]" /></Field>
                  <Field label="Time zone">
                    <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>Eastern Time</option><option>Central Time</option><option>Europe/Kyiv</option></select>
                  </Field>
                  <Field label="Currency">
                    <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>USD - US Dollar</option><option>UAH - Ukrainian Hryvnia</option><option>EUR - Euro</option></select>
                  </Field>
                  <Field label="Date format">
                    <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>May 7, 2026</option><option>7 May 2026</option><option>07/05/2026</option></select>
                  </Field>
                  <Field label="First day of week">
                    <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>Sunday</option><option>Monday</option></select>
                  </Field>
                </div>
              </SectionCard>
            </>
          )}

          {activeSection === "taxProfiles" && (
            <>
              <SectionHeader
                title="Tax Profiles"
                description="Create individual tax rates, combine them into tax profiles, and set one default profile for invoices and jobs."
              />
              <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <SectionCard title="Tax profiles" description="Profiles can include one or more tax rates.">
                  <div className="space-y-3">
                    {taxProfiles.map(profile => (
                      <div key={profile.name} className="rounded-xl border border-[#E5E7EB] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{profile.name}</div>
                            <div className="mt-1 text-[13px] text-[#546478]">{profile.rates}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 800 }}>{profile.total}</div>
                            {profile.default && <span className="mt-1 inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>Default</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]">Add tax profile</Button>
                </SectionCard>
                <SectionCard title="Tax rates">
                  <div className="space-y-2">
                    {taxRates.map(rate => (
                      <div key={rate.name} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2">
                        <div>
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{rate.name}</div>
                          <div className="text-[12px] text-[#7A8799]">{rate.jurisdiction}</div>
                        </div>
                        <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 800 }}>{rate.rate}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
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
                <Input placeholder="Search users..." className="h-9 max-w-[360px] border-[#D8DEE8]" />
                <Button className="h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]">Invite user</Button>
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
                    {teamMembers.map(member => (
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

          {(activeSection === "jobs" || activeSection === "estimates" || activeSection === "invoices" || activeSection === "items" || activeSection === "legalTexts") && (
            <>
              <SectionHeader
                title={{
                  jobs: "Jobs Preferences",
                  estimates: "Estimate Preferences",
                  invoices: "Invoice Preferences",
                  items: "Item Preferences",
                  legalTexts: "Legal Texts",
                }[activeSection]}
                description="System preference areas are intentionally simple and module-specific. Clients do not get a separate settings area in MVP."
              />
              <div className="space-y-4">
                {activeSection === "jobs" && (
                  <>
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
                {activeSection === "legalTexts" && (
                  <SectionCard title="Reusable legal text">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Terms and conditions"><textarea defaultValue="Standard terms and conditions attached to estimates and invoices." className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px]" /></Field>
                      <Field label="Employee policy"><textarea defaultValue="Policy text that can be attached to employee users." className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px]" /></Field>
                    </div>
                  </SectionCard>
                )}
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

          {activeSection === "marketingSources" && (
            <AddListSection
              title="Lead Sources"
              description="Manage lead sources used when creating or editing clients."
              placeholder="New source name..."
              value={newSourceName}
              onValueChange={setNewSourceName}
              onAdd={addSource}
              rows={marketingSources}
              editing={editingSource}
              editValue={editingValue}
              onStartEdit={row => { setEditingSource(row); setEditingValue(row); }}
              onEditValueChange={setEditingValue}
              onSaveEdit={row => { marketingSourcesStore.renameSource(row, editingValue); setEditingSource(null); toast.success("Source renamed"); }}
              onCancelEdit={() => setEditingSource(null)}
              onDelete={row => { marketingSourcesStore.removeSource(row); toast.success("Source removed"); }}
            />
          )}

          {activeSection === "customerTags" && (
            <AddListSection
              title="Customer Tags"
              description="Manage tags for organizing clients."
              placeholder="New tag name..."
              value={newTagName}
              onValueChange={setNewTagName}
              onAdd={addTag}
              rows={customerTags}
              editing={editingTag}
              editValue={editingTagValue}
              onStartEdit={row => { setEditingTag(row); setEditingTagValue(row); }}
              onEditValueChange={setEditingTagValue}
              onSaveEdit={row => { tagsStore.renameTag(row, editingTagValue); setEditingTag(null); toast.success("Tag renamed"); }}
              onCancelEdit={() => setEditingTag(null)}
              onDelete={row => { tagsStore.removeTag(row); toast.success("Tag removed"); }}
            />
          )}

          {activeSection === "counties" && (
            <AddListSection
              title="Counties"
              description="Manage county/oblast options available on client addresses."
              placeholder="New county name..."
              value={newCountyName}
              onValueChange={setNewCountyName}
              onAdd={addCounty}
              rows={counties}
              editing={editingCounty}
              editValue={editingCountyValue}
              onStartEdit={row => { setEditingCounty(row); setEditingCountyValue(row); }}
              onEditValueChange={setEditingCountyValue}
              onSaveEdit={row => { countiesStore.renameCounty(row, editingCountyValue); setEditingCounty(null); toast.success("County renamed"); }}
              onCancelEdit={() => setEditingCounty(null)}
              onDelete={row => { countiesStore.removeCounty(row); toast.success("County removed"); }}
            />
          )}

          {activeSection === "jobTypes" && (
            <AddListSection
              title="Job Types"
              description="Manage job type options used in job creation."
              placeholder="New job type..."
              value={newJobTypeName}
              onValueChange={setNewJobTypeName}
              onAdd={addJobType}
              rows={jobTypes}
              editing={editingJobType}
              editValue={editingJobTypeValue}
              onStartEdit={row => { setEditingJobType(row); setEditingJobTypeValue(row); }}
              onEditValueChange={setEditingJobTypeValue}
              onSaveEdit={row => { jobTypesStore.renameJobType(row, editingJobTypeValue); setEditingJobType(null); toast.success("Job type renamed"); }}
              onCancelEdit={() => setEditingJobType(null)}
              onDelete={row => { jobTypesStore.removeJobType(row); toast.success("Job type removed"); }}
            />
          )}

          {activeSection === "customFields" && (
            <>
              <SectionHeader title="Custom Fields" description="Create lightweight custom fields for clients, jobs, estimates, invoices, and items." />
              <SectionCard title="Custom field library">
                <div className="mb-5 flex gap-2">
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
                  {customFields.filter(field => field.entity === cfEntity).map(field => (
                    <div key={field.id} className="rounded-xl border border-[#E5E7EB] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 800 }}>{field.label}</div>
                          <div className="mt-1 text-[13px] text-[#546478]">Type: {field.type} {field.required ? "• Required" : ""}</div>
                          {field.options && field.options.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{field.options.map(option => <span key={option} className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#546478]">{option}</span>)}</div>}
                        </div>
                        <Button variant="outline" className="h-8 px-3 text-[12px]" onClick={() => customFieldsStore.removeField(field.id)}>Delete</Button>
                      </div>
                      {field.type === "select" && (
                        <div className="mt-3 flex max-w-[460px] gap-2">
                          <Input
                            value={cfNewOption[field.id] ?? ""}
                            onChange={e => setCfNewOption(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder="Add option..."
                            className="h-8 border-[#D8DEE8] text-[13px]"
                          />
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-[12px]"
                            onClick={() => {
                              const option = (cfNewOption[field.id] ?? "").trim();
                              if (!option) return;
                              customFieldsStore.addOption(field.id, option);
                              setCfNewOption(prev => ({ ...prev, [field.id]: "" }));
                            }}
                          >
                            Add option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {customFields.filter(field => field.entity === cfEntity).length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#C8D5E8] p-6 text-center text-[13px] text-[#546478]">No custom fields for this area yet.</div>
                  )}
                </div>
                <Button
                  className="mt-4 h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]"
                  onClick={() => {
                    customFieldsStore.addField({ entity: cfEntity, label: "New custom field", type: "text", required: false });
                    toast.success("Custom field added");
                  }}
                >
                  Add custom field
                </Button>
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
