import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { countiesStore } from "../stores/countiesStore";
import { relationshipsStore } from "../stores/relationshipsStore";
import { clientsStore } from "../stores/clientsStore";
import { useSyncExternalStore } from "react";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { PAYMENT_METHODS } from "../constants/paymentMethods";

interface AdditionalContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
}

interface ClientFormData {
  title: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  preferredName: string;
  company: string;
  role: string;
  customerType: "homeowner" | "business";
  email: string;
  mobilePhone: string;
  mobilePhoneExt: string;
  workPhone: string;
  workPhoneExt: string;
  website: string;
  address: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  county: string;
  addressNotes: string;
  notes: string;
  marketingSource: string;
  paymentTerms: string;
  preferredPaymentMethod: string;
  isTaxable: boolean;
  additionalContacts: AdditionalContact[];
}

// Figma shows the Additional-contacts section with one contact form already
// visible, so we seed a single blank contact; fully-empty ones are dropped on save.
const emptyContact = (id: string): AdditionalContact => ({
  id,
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  relationship: "",
});

// Factory (not a shared constant) so every reset gets fresh array/object instances
// — no risk of state leaking across "Save and Create Another".
const makeInitialFormData = (): ClientFormData => ({
  title: "",
  firstName: "",
  middleInitial: "",
  lastName: "",
  preferredName: "",
  company: "",
  role: "",
  customerType: "homeowner",
  email: "",
  mobilePhone: "",
  mobilePhoneExt: "",
  workPhone: "",
  workPhoneExt: "",
  website: "",
  address: "",
  unit: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  county: "",
  addressNotes: "",
  notes: "",
  marketingSource: "",
  paymentTerms: "Due on receipt",
  preferredPaymentMethod: "",
  isTaxable: true,
  additionalContacts: [emptyContact("c0")],
});

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export function CreateClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  // CSR sandbox only (Help Center → Roles → Dispatcher): live duplicate
  // detection + ZIP→county auto-fill. Gated behind this flag so every other
  // entry point into client creation is untouched.
  const csrMode = searchParams.get("csr") === "1";
  const [formData, setFormData] =
    useState<ClientFormData>(makeInitialFormData);
  const [dupeMatch, setDupeMatch] = useState<ReturnType<typeof clientsStore.getSnapshot>[number] | null>(null);
  const [dupeDismissed, setDupeDismissed] = useState(false);
  const [countyAutoFilled, setCountyAutoFilled] = useState(false);
  const counties = useSyncExternalStore(
    countiesStore.subscribe,
    countiesStore.getCounties,
  );
  const relationships = useSyncExternalStore(
    relationshipsStore.subscribe,
    relationshipsStore.getRelationships,
  );

  const validate = (): string | null => {
    const digitCount = (s: string) => (s.match(/\d/g) || []).length;

    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";

    // Primary phone — required + must look like a real phone number.
    if (!formData.mobilePhone.trim()) return "Primary phone is required";
    if (digitCount(formData.mobilePhone) < 10) return "Enter a valid primary phone number (at least 10 digits)";
    // Secondary phone — optional, but validated when present.
    if (formData.workPhone.trim() && digitCount(formData.workPhone) < 10) return "Enter a valid secondary phone number (at least 10 digits)";

    // Email — required + format.
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return "Enter a valid email address";

    // Website — optional, but must be an http(s) URL when present (rejects e.g. ftp://…).
    if (formData.website.trim() && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(formData.website.trim())) return "Website must be a valid URL (e.g. https://example.com)";

    // Service address — State, City, Address, County and ZIP all carry a required
    // marker in the form, so each must be filled. (County is cleared when the
    // state changes, which is why it must be re-validated here.)
    if (!formData.state.trim()) return "State is required";
    if (!formData.city.trim()) return "City is required";
    if (!formData.address.trim()) return "Billing address is required";
    if (!formData.county.trim()) return "County is required";
    if (!formData.zip.trim()) return "ZIP code is required";
    if (!/^\d{5}(-\d{4})?$/.test(formData.zip.trim())) return "Enter a valid ZIP code (e.g. 78701)";
    // Billing — payment terms are mandatory (defaults to "Due on receipt").
    if (!formData.paymentTerms.trim()) return "Payment terms are required";
    return null;
  };

  const persistClient = (): string => {
    const existing = clientsStore.getSnapshot();
    const id = String(Math.max(10250, ...existing.map((c) => Number(c.id) || 0)) + 1);
    const initials = ((formData.firstName[0] || "") + (formData.lastName[0] || "")).toUpperCase() || "C";
    const palette = ["#4A6FA5", "#3B82F6", "#8B5CF6", "#D97706", "#10B981", "#DC2626"];
    const today = formatRegionalDate(new Date());
    // Drop the seeded blank contact (and any other fully-empty rows).
    const filledContacts = formData.additionalContacts.filter(
      (c) => c.firstName.trim() || c.lastName.trim() || c.phone.trim() || c.email.trim(),
    );
    clientsStore.addClient(
      clientsStore.makeRecord({
        id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        initials,
        avatarColor: palette[Number(id) % palette.length],
        email: formData.email,
        mobilePhone: formData.mobilePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        title: formData.title,
        middleInitial: formData.middleInitial,
        preferredName: formData.preferredName,
        company: formData.company,
        role: formData.role,
        customerType: formData.customerType,
        type: formData.customerType === "business" ? "Commercial" : "Residential",
        mobilePhoneExt: formData.mobilePhoneExt,
        workPhone: formData.workPhone,
        workPhoneExt: formData.workPhoneExt,
        website: formData.website,
        unit: formData.unit,
        county: formData.county,
        country: formData.country,
        addressNotes: formData.addressNotes,
        marketingSource: formData.marketingSource,
        paymentTerms: formData.paymentTerms,
        paymentMethod: formData.preferredPaymentMethod,
        isTaxable: formData.isTaxable,
        notes: formData.notes,
        notesArray: formData.notes.trim() ? [{ id: 1, text: formData.notes.trim(), date: `Added ${today}` }] : [],
        additionalContacts: filledContacts.map((a, i) => ({ id: i + 1, firstName: a.firstName, lastName: a.lastName, phone: a.phone, email: a.email, relationship: a.relationship })),
        status: "Prospect",
        customerSince: today,
        lastActivity: "Created • today",
        billingAddress: formData.address,
        billingCity: formData.city,
        billingState: formData.state,
        billingZip: formData.zip,
        billingCounty: formData.county,
      }),
    );
    return id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    const newClientId = persistClient();
    toast.success("Client created");
    // CSR sandbox: continue the call flow straight into job creation (with
    // the symptom questionnaire) for the client just created, instead of
    // dropping onto their detail page.
    if (csrMode && !returnTo) {
      const clientName = `${formData.firstName} ${formData.lastName}`.trim();
      navigate(`/jobs/new?client=${encodeURIComponent(clientName)}&csr=1&sandbox=sample`);
      return;
    }
    navigate(returnTo || `/clients/${newClientId}`);
  };

  const handleSaveAndCreateAnother = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    persistClient();
    toast.success("Client created");
    setFormData(makeInitialFormData());
  };

  // CSR sandbox: a handful of FL ZIPs seen in the demo data, mapped to their
  // real county — stand-in for a county property-appraiser lookup.
  const ZIP_TO_COUNTY: Record<string, string> = {
    "33614": "Hillsborough", "33615": "Hillsborough", "33613": "Hillsborough",
    "33594": "Hillsborough", "33602": "Hillsborough",
    "34205": "Manatee", "34201": "Manatee",
    "33701": "Pinellas", "33755": "Pinellas",
    "34236": "Sarasota", "34231": "Sarasota",
  };

  const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  const checkDuplicate = (nextLastName: string, nextAddress: string) => {
    if (!csrMode || dupeDismissed) return;
    const lastName = normalize(nextLastName);
    const address = normalize(nextAddress);
    if (lastName.length < 3 && address.length < 5) { setDupeMatch(null); return; }
    const candidates = clientsStore.getSnapshot();
    const hit = candidates.find((c) => {
      const cLast = normalize(c.lastName || c.name.split(" ").slice(-1).join(""));
      const cAddr = normalize(c.address || "");
      return (lastName.length >= 3 && cLast === lastName) || (address.length >= 5 && cAddr.includes(address));
    });
    setDupeMatch(hit || null);
  };

  const handleChange = (
    field: keyof ClientFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (csrMode && field === "zip" && typeof value === "string") {
        const county = ZIP_TO_COUNTY[value.trim()];
        if (county && (!prev.county || countyAutoFilled)) {
          next.county = county;
          setCountyAutoFilled(true);
        }
      }
      if (csrMode && field === "county") setCountyAutoFilled(false);
      return next;
    });
    if (csrMode && (field === "lastName" || field === "address") && typeof value === "string") {
      const nextLastName = field === "lastName" ? value : formData.lastName;
      const nextAddress = field === "address" ? value : formData.address;
      checkDuplicate(nextLastName, nextAddress);
    }
  };

  const handleCancel = () => {
    navigate(returnTo || "/clients");
  };

  const addAdditionalContact = () => {
    setFormData((prev) => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        emptyContact(Math.random().toString(36).substr(2, 9)),
      ],
    }));
  };

  const updateAdditionalContact = (
    id: string,
    field: keyof AdditionalContact,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const removeAdditionalContact = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter(
        (c) => c.id !== id,
      ),
    }));
  };

  // Shared field styles — Figma: label 14px medium #1A2332; inputs 8px radius, #E5E7EB border.
  const labelCls = "block text-[14px] text-[#1A2332] mb-1.5";
  const inputCls = "border-[#E5E7EB] bg-white h-10 text-[14px]";
  const req = <span className="text-[#DC2626]">*</span>;

  return (
    <div className="bg-[#F5F7FA] min-h-full">
      {/* Page header — back chevron + title (Figma "‹ Create client") */}
      <div className="flex items-center gap-2 px-6 py-5">
        <button
          type="button"
          onClick={() => navigate(returnTo || "/clients")}
          aria-label="Back to clients"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "24px" }}>chevron_left</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600 }}>
          Create client
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6">
          {/* ── Contact info ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Contact info</h2>
            </div>
            <div className="space-y-4 max-w-[780px]">
              {/* Name: Title + First + M.I. + Last */}
              <div>
                <Label className={labelCls} style={{ fontWeight: 500 }}>Name {req}</Label>
                <div className="grid grid-cols-[120px_1fr_64px_1fr] gap-3">
                  <Select
                    value={formData.title || "none"}
                    onValueChange={(value) => handleChange("title", value === "none" ? "" : value)}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Title</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={inputCls}
                  />
                  <Input
                    type="text"
                    placeholder="M.I."
                    value={formData.middleInitial}
                    onChange={(e) => handleChange("middleInitial", e.target.value.slice(0, 1).toUpperCase())}
                    className={inputCls}
                    maxLength={1}
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Preferred name + Company + Role */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Preferred name (Goes by)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Mia, Bobby, TJ"
                    value={formData.preferredName}
                    onChange={(e) => handleChange("preferredName", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Company name</Label>
                  <Input
                    type="text"
                    placeholder="Company name"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Role</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Owner, Manager"
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Communication ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Communication</h2>
            </div>
            <div className="space-y-4 max-w-[780px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Primary phone number {req}</Label>
                  <div className="flex gap-3">
                    <Input
                      type="tel"
                      placeholder="e.g. (555) 456-7890"
                      required
                      value={formData.mobilePhone}
                      onChange={(e) => handleChange("mobilePhone", e.target.value)}
                      className={`${inputCls} flex-1`}
                    />
                    <Input
                      type="text"
                      placeholder="EXT"
                      value={formData.mobilePhoneExt}
                      onChange={(e) => handleChange("mobilePhoneExt", e.target.value)}
                      className={`${inputCls} w-16`}
                    />
                  </div>
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Secondary phone number</Label>
                  <div className="flex gap-3">
                    <Input
                      type="tel"
                      placeholder="e.g. (555) 456-7890"
                      value={formData.workPhone}
                      onChange={(e) => handleChange("workPhone", e.target.value)}
                      className={`${inputCls} flex-1`}
                    />
                    <Input
                      type="text"
                      placeholder="EXT"
                      value={formData.workPhoneExt}
                      onChange={(e) => handleChange("workPhoneExt", e.target.value)}
                      className={`${inputCls} w-16`}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Email {req}</Label>
                  <Input
                    type="email"
                    placeholder="e.g. john@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Website</Label>
                  <Input
                    type="url"
                    placeholder="e.g. https://example.com"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Billing address ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Billing address {req}</h2>
              <p className="text-[14px] text-[#6B7280] leading-[20px] mt-1">
                Billing address can also serve as the client's address
              </p>
            </div>
            <div className="space-y-4 max-w-[780px]">
              {/* Country + State + City */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Country {req}</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>State {req}</Label>
                  <Select
                    value={formData.state || undefined}
                    onValueChange={(value) => {
                      const next = value === "none" ? "" : value;
                      handleChange("state", next);
                      if (next !== formData.state) handleChange("county", "");
                    }}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>City {req}</Label>
                  <Input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Address + Unit */}
              <div>
                <Label className={labelCls} style={{ fontWeight: 500 }}>Address {req}</Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Address"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <Input
                    type="text"
                    placeholder="Unit"
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    className={`${inputCls} w-16`}
                  />
                </div>
              </div>

              {/* CSR sandbox: live duplicate warning — fires while typing,
                  before anything is saved. */}
              {csrMode && dupeMatch && (
                <div className="flex items-start gap-3 rounded-lg border border-[#E3C77C] bg-[#FCF0D9] px-4 py-3">
                  <span style={{ fontSize: "18px" }}>⚠️</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Possible match: {dupeMatch.name}</div>
                    <div className="text-[12px] text-[#8899AA]">{dupeMatch.address}{dupeMatch.mobilePhone ? ` · ${dupeMatch.mobilePhone}` : ""}</div>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => navigate(`/clients/${dupeMatch.id}`)} className="rounded-md bg-[#4A6FA5] px-3 py-1.5 text-[12px] text-white" style={{ fontWeight: 600 }}>
                        View existing client
                      </button>
                      <button type="button" onClick={() => { setDupeDismissed(true); setDupeMatch(null); }} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                        Not the same — continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* County + ZIP Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>
                    County {req}
                    {csrMode && countyAutoFilled && formData.county && (
                      <span className="ml-2 text-[11px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>filled from ZIP</span>
                    )}
                  </Label>
                  {/* Florida gets a dropdown of known counties; every other state
                      gets a free-text input so the field is usable regardless. */}
                  {formData.state === "FL" ? (
                    <Select value={formData.county} onValueChange={(value) => handleChange("county", value)}>
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="County" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      placeholder="County"
                      value={formData.county}
                      onChange={(e) => handleChange("county", e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>ZIP Code {req}</Label>
                  <Input
                    type="text"
                    placeholder="ZIP Code"
                    required
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Address notes */}
              <div>
                <Label className={labelCls} style={{ fontWeight: 500 }}>Address notes</Label>
                <Textarea
                  placeholder="Add any relevant notes..."
                  value={formData.addressNotes}
                  onChange={(e) => handleChange("addressNotes", e.target.value)}
                  className="border-[#E5E7EB] bg-white text-[14px] min-h-[76px]"
                  rows={3}
                />
              </div>

              <p className="text-[12px] text-[#6B7280]">
                Manage counties in <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=counties")}>Settings → Counties</span>
              </p>
            </div>
          </section>

          {/* ── Billing details ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Billing details</h2>
            </div>
            <div className="space-y-4 max-w-[780px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Payment terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(v) => handleChange("paymentTerms", v)}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelCls} style={{ fontWeight: 500 }}>Payment method</Label>
                  <Select
                    value={formData.preferredPaymentMethod || "__none__"}
                    onValueChange={(v) => handleChange("preferredPaymentMethod", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Taxable toggle */}
              <div className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] p-4">
                <input
                  id="isTaxable"
                  type="checkbox"
                  checked={formData.isTaxable}
                  onChange={(e) => handleChange("isTaxable", e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer accent-[#4A6FA5]"
                />
                <div className="flex-1">
                  <label htmlFor="isTaxable" className="block text-[14px] text-[#1A2332] cursor-pointer" style={{ fontWeight: 500 }}>
                    Taxable client
                  </label>
                  <p className="text-[12px] text-[#6B7280] mt-1">
                    When checked, applicable taxes are added to this client's invoices by default.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Notes ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h2>
            </div>
            <div className="max-w-[780px]">
              <Textarea
                placeholder="Add any relevant notes..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="border-[#E5E7EB] bg-white text-[14px] min-h-[76px]"
                rows={3}
              />
            </div>
          </section>

          {/* ── Additional contacts ── */}
          <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Additional contacts</h2>
              <p className="text-[14px] text-[#6B7280] leading-[20px] mt-1">
                External contacts related to this client (e.g. legal guardian, relative, property manager).
              </p>
            </div>
            <div className="space-y-4 max-w-[780px]">
              {formData.additionalContacts.map((contact, idx) => {
                const isLast = idx === formData.additionalContacts.length - 1;
                return (
                  <div
                    key={contact.id}
                    className={`relative space-y-4 ${isLast ? "" : "pb-4 border-b border-[#E5E7EB]"}`}
                  >
                    {formData.additionalContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdditionalContact(contact.id)}
                        aria-label="Remove contact"
                        className="absolute top-0 right-0 text-[#9AA3AF] hover:text-[#DC2626] transition-colors"
                      >
                        <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelCls} style={{ fontWeight: 500 }}>First name</Label>
                        <Input
                          type="text"
                          placeholder="First name"
                          value={contact.firstName}
                          onChange={(e) => updateAdditionalContact(contact.id, "firstName", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <Label className={labelCls} style={{ fontWeight: 500 }}>Last name</Label>
                        <Input
                          type="text"
                          placeholder="Last name"
                          value={contact.lastName}
                          onChange={(e) => updateAdditionalContact(contact.id, "lastName", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={labelCls} style={{ fontWeight: 500 }}>Phone</Label>
                        <Input
                          type="tel"
                          placeholder="e.g. (555) 456-7890"
                          value={contact.phone}
                          onChange={(e) => updateAdditionalContact(contact.id, "phone", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <Label className={labelCls} style={{ fontWeight: 500 }}>Email</Label>
                        <Input
                          type="email"
                          placeholder="e.g. john@example.com"
                          value={contact.email}
                          onChange={(e) => updateAdditionalContact(contact.id, "email", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className={labelCls} style={{ fontWeight: 500 }}>Relationship</Label>
                      <Select
                        value={contact.relationship || undefined}
                        onValueChange={(value) => updateAdditionalContact(contact.id, "relationship", value)}
                      >
                        <SelectTrigger className={inputCls}>
                          <SelectValue placeholder="e.g. Legal guardian, Spouse, Property manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationships.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addAdditionalContact}
                className="text-[14px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors flex items-center gap-1.5"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
                Add additional contact
              </button>
            </div>
          </section>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#EDF0F5] h-10 px-4"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAndCreateAnother}
                className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#EDF0F5] h-10 px-4"
              >
                Save and Create Another
              </Button>
              <Button
                type="submit"
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-10 px-4 text-white"
              >
                Save client
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
