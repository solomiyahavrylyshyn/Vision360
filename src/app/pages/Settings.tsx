import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useSearchParams } from "react-router";
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
  const [companyInfoTab, setCompanyInfoTab] = useState<"profile" | "branding">("profile");
  const [brandPrimary, setBrandPrimary] = useState(() => getStoredBrandTheme().primary);
  const [brandAccent, setBrandAccent] = useState(() => getStoredBrandTheme().accent);
  const [brandLogoPreview, setBrandLogoPreview] = useState(() => getStoredBrandLogo());
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
          <button onClick={() => setActiveSection("home")} className={navItemClass("home")}>
            <div className="flex items-center gap-2">
              <span className="material-icons" style={{ fontSize: "17px" }}>dashboard</span>
              <span className="text-[13px]" style={{ fontWeight: activeSection === "home" ? 700 : 600 }}>Overview</span>
            </div>
          </button>

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

          {activeSection === "companyInfo" && (
            <>
              <SectionHeader
                title="Company Info"
                description="Manage the basic company information used across client-facing documents and system defaults."
              />
              <div className="space-y-4">
                <SectionCard title="Company Info" description="Core business information shown on documents, emails, and customer-facing records.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company Name"><Input defaultValue="Omega Home Services" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Legal entity name"><Input defaultValue="Omega Home Services LLC" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Business Owner Name"><Input defaultValue="Peter Novak" className="h-9 border-[#D8DEE8]" /></Field>
                    <div className="col-span-2">
                      <Field label="Address"><Input defaultValue="123 Main Street, Suite 100, Tampa, FL 33606" className="h-9 border-[#D8DEE8]" /></Field>
                    </div>
                    <Field label="Phone number"><Input defaultValue="(813) 286-7572" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Website"><Input defaultValue="https://omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Email address"><Input defaultValue="office@omega-home.com" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="License number"><Input defaultValue="LIC-2486-FL" className="h-9 border-[#D8DEE8]" /></Field>
                    <div className="col-span-2">
                      <Field label="Business hours">
                        <textarea
                          defaultValue={"Mon-Fri 8:00 AM - 6:00 PM\nSat 9:00 AM - 2:00 PM"}
                          className="min-h-[76px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                        />
                      </Field>
                    </div>
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
                      { label: "New client message", sub: "Notify when a client replies via Client Hub" },
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

                <SectionCard title="Taxes & Rates" description="Create tax rates, combine them into profiles, and set a default for invoices and jobs.">
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <Field label="Tax ID / EIN"><Input defaultValue="47-1234567" className="h-9 border-[#D8DEE8]" /></Field>
                    <Field label="Tax ID display name (e.g. GST, VAT)"><Input defaultValue="Sales Tax" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Tax profiles</div>
                        <Button className="h-7 bg-[#4A6FA5] px-3 text-[12px] hover:bg-[#3d5a85]">+ Create tax profile</Button>
                      </div>
                      <div className="space-y-2">
                        {taxProfiles.map(profile => (
                          <div key={profile.name} className="rounded-xl border border-[#E5E7EB] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{profile.name}</div>
                                <div className="text-[12px] text-[#546478]">{profile.rates}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 800 }}>{profile.total}</div>
                                {profile.default && <span className="inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] text-[#15803D]" style={{ fontWeight: 700 }}>Default</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Tax rates</div>
                        <Button className="h-7 bg-[#4A6FA5] px-3 text-[12px] hover:bg-[#3d5a85]">+ Create tax rate</Button>
                      </div>
                      <div className="space-y-2">
                        {taxRates.map(rate => (
                          <div key={rate.name} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2">
                            <div>
                              <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{rate.name}</div>
                              <div className="text-[11px] text-[#7A8799]">{rate.jurisdiction}</div>
                            </div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 800 }}>{rate.rate}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Regional" description="Country, counties, timezone, currency, date format, and first day of the week.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Country">
                      <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>United States</option><option>Ukraine</option><option>Cyprus</option></select>
                    </Field>
                    <Field label="Time zone">
                      <select className="h-9 w-full rounded-lg border border-[#D8DEE8] bg-white px-3 text-[14px]"><option>Eastern Time (ET)</option><option>Central Time (CT)</option><option>Europe/Kyiv</option></select>
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
                    <Field label="Region / state / oblast"><Input defaultValue="Florida" className="h-9 border-[#D8DEE8]" /></Field>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Counties / regions used in client addresses</div>
                    <div className="flex gap-2">
                      <Input placeholder="Add county or oblast..." className="h-9 max-w-[320px] border-[#D8DEE8] text-[13px]" />
                      <Button className="h-9 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Add</Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Hillsborough County", "Pinellas County", "Pasco County"].map(c => (
                        <span key={c} className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-[12px] text-[#546478]">
                          {c}
                          <button className="ml-1 text-[#9AA3AF] hover:text-[#DC2626]">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button className="mt-4 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
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

                <SectionCard title="Custom Fields" description="Add up to 2 custom fields per entity for clients, estimates, jobs, invoices, and team members.">
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
                    {customFields.filter(field => field.entity === cfEntity).map(field => (
                      <div key={field.id} className="rounded-xl border border-[#E5E7EB] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 800 }}>{field.label}</div>
                            <div className="mt-1 text-[13px] text-[#546478]">Type: {field.type}{field.required ? " • Required" : ""}</div>
                            {field.options && field.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {field.options.map(option => <span key={option} className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#546478]">{option}</span>)}
                              </div>
                            )}
                          </div>
                          <Button variant="outline" className="h-8 px-3 text-[12px]" onClick={() => customFieldsStore.removeField(field.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                    {customFields.filter(field => field.entity === cfEntity).length === 0 && (
                      <div className="rounded-xl border border-dashed border-[#C8D5E8] p-6 text-center text-[13px] text-[#546478]">No custom fields for this area yet.</div>
                    )}
                  </div>
                  {customFields.filter(field => field.entity === cfEntity).length < 2 && (
                    <Button
                      className="mt-4 h-9 bg-[#4A6FA5] px-4 text-[14px] hover:bg-[#3d5a85]"
                      onClick={() => {
                        customFieldsStore.addField({ entity: cfEntity, label: "New custom field", type: "text", required: false });
                        toast.success("Custom field added");
                      }}
                    >
                      Add custom field
                    </Button>
                  )}
                </SectionCard>

                <SectionCard title="Terms & Conditions" description="Default terms attached to estimates and invoices sent to clients.">
                  <textarea
                    defaultValue="Standard terms and conditions attached to estimates and invoices. Payment is due within 15 days of approval. Equipment remains property of Omega Home Services until invoice is paid in full."
                    className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                  <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
                </SectionCard>

                <SectionCard title="Policies" description="Internal company policies visible to team members.">
                  <textarea
                    defaultValue="Employee policy text that can be referenced by team members. Covers conduct, schedule, and equipment use."
                    className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                  <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
                </SectionCard>

                <SectionCard title="Privacy Policy" description="Your company's privacy policy shown on the Client Hub and customer-facing pages.">
                  <textarea
                    defaultValue="Omega Home Services respects your privacy. We collect only the information necessary to provide our services and will never share your data with third parties without your consent."
                    className="min-h-[120px] w-full rounded-lg border border-[#D8DEE8] bg-white px-3 py-2 text-[14px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                  <Button className="mt-3 h-8 bg-[#4A6FA5] px-4 text-[13px] hover:bg-[#3d5a85]">Save</Button>
                </SectionCard>
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
