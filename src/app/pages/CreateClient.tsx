import { useState } from "react";
import { useNavigate } from "react-router";
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
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { countiesStore } from "../stores/countiesStore";
import { useSyncExternalStore } from "react";

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
  notes: string;
  marketingSource: string;
  additionalContacts: AdditionalContact[];
}

const initialFormData: ClientFormData = {
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
  notes: "",
  marketingSource: "",
  additionalContacts: [],
};

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

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

export function CreateClient() {
  const navigate = useNavigate();
  const [formData, setFormData] =
    useState<ClientFormData>(initialFormData);
  const marketingSources = useSyncExternalStore(
    marketingSourcesStore.subscribe,
    marketingSourcesStore.getSources,
  );
  const counties = useSyncExternalStore(
    countiesStore.subscribe,
    countiesStore.getCounties,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClientId = Math.random().toString(36).substr(2, 9);
    console.log("Saving client:", formData);
    navigate(`/clients/${newClientId}`);
  };

  const handleSaveAndCreateAnother = () => {
    console.log("Saving client:", formData);
    toast.success("Saved");
    setFormData(initialFormData);
  };

  const handleChange = (
    field: keyof ClientFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    navigate("/clients");
  };

  const addAdditionalContact = () => {
    setFormData((prev) => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        {
          id: Math.random().toString(36).substr(2, 9),
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          relationship: "",
        },
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

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-6">
          <h1
            className="text-[28px] text-[#1A2332]"
            style={{ fontWeight: 700 }}
          >
            Create Client
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white">
          <div className="px-8 py-8">
            <div className="space-y-12">
              {/* Contact info */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Contact info
                  </h2>
                </div>
                <div className="space-y-5 max-w-[600px]">
                  {/* Name row: Title + First + M.I. + Last */}
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Name
                    </Label>
                    <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
                      <Select
                        value={formData.title || "none"}
                        onValueChange={(value) =>
                          handleChange(
                            "title",
                            value === "none" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Title
                          </SelectItem>
                          <SelectItem value="Mr.">
                            Mr.
                          </SelectItem>
                          <SelectItem value="Mrs.">
                            Mrs.
                          </SelectItem>
                          <SelectItem value="Ms.">
                            Ms.
                          </SelectItem>
                          <SelectItem value="Dr.">
                            Dr.
                          </SelectItem>
                          <SelectItem value="Prof.">
                            Prof.
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange(
                            "firstName",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                      <Input
                        type="text"
                        placeholder="M.I."
                        value={formData.middleInitial}
                        onChange={(e) =>
                          handleChange(
                            "middleInitial",
                            e.target.value
                              .slice(0, 1)
                              .toUpperCase(),
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        maxLength={1}
                      />
                      <Input
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleChange(
                            "lastName",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Preferred name */}
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Preferred name (Goes by)
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Mia, Bobby, TJ"
                      value={formData.preferredName}
                      onChange={(e) =>
                        handleChange(
                          "preferredName",
                          e.target.value,
                        )
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>

                  {/* Company + Role */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="text-[13px] text-[#374151] mb-2 block"
                        style={{ fontWeight: 500 }}
                      >
                        Company name
                      </Label>
                      <Input
                        type="text"
                        placeholder="Company name"
                        value={formData.company}
                        onChange={(e) =>
                          handleChange(
                            "company",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label
                        className="text-[13px] text-[#374151] mb-2 block"
                        style={{ fontWeight: 500 }}
                      >
                        Role
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Owner, Manager"
                        value={formData.role}
                        onChange={(e) =>
                          handleChange("role", e.target.value)
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Customer Type */}
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-3 block"
                      style={{ fontWeight: 500 }}
                    >
                      Customer type
                    </Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          checked={
                            formData.customerType ===
                            "homeowner"
                          }
                          onChange={() =>
                            handleChange(
                              "customerType",
                              "homeowner",
                            )
                          }
                          className="w-4 h-4 accent-[#4A6FA5] cursor-pointer"
                        />
                        <span className="text-[14px] text-[#374151]">
                          Residential
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          checked={
                            formData.customerType === "business"
                          }
                          onChange={() =>
                            handleChange(
                              "customerType",
                              "business",
                            )
                          }
                          className="w-4 h-4 accent-[#4A6FA5] cursor-pointer"
                        />
                        <span className="text-[14px] text-[#374151]">
                          Commercial
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Communication */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Communication
                  </h2>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed"></p>
                </div>
                <div className="space-y-4 max-w-[600px]">
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Primary phone number
                    </Label>
                    <div className="flex gap-[19px]">
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.mobilePhone}
                        onChange={(e) =>
                          handleChange(
                            "mobilePhone",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="EXT"
                        value={formData.mobilePhoneExt}
                        onChange={(e) =>
                          handleChange(
                            "mobilePhoneExt",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Secondary phone number
                    </Label>
                    <div className="flex gap-[19px]">
                      <Input
                        type="tel"
                        placeholder="(555) 456-7890"
                        value={formData.workPhone}
                        onChange={(e) =>
                          handleChange(
                            "workPhone",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="EXT"
                        value={formData.workPhoneExt}
                        onChange={(e) =>
                          handleChange(
                            "workPhoneExt",
                            e.target.value,
                          )
                        }
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleChange("email", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                  <div>
                    <Label
                      className="text-[13px] text-[#374151] mb-2 block"
                      style={{ fontWeight: 500 }}
                    >
                      Website
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) =>
                        handleChange("website", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Marketing source */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Lead source
                  </h2>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed"></p>
                </div>
                <div className="max-w-[600px]">
                  <Select
                    value={formData.marketingSource || "none"}
                    onValueChange={(value) =>
                      handleChange(
                        "marketingSource",
                        value === "none" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        — Select —
                      </SelectItem>
                      {marketingSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Notes */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Notes
                  </h2>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed"></p>
                </div>
                <div className="max-w-[600px]">
                  <Textarea
                    placeholder="Add any relevant notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      handleChange("notes", e.target.value)
                    }
                    className="border-[#D1D5DB] bg-white text-[14px] min-h-[100px]"
                    rows={4}
                  />
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Service address */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Service address
                  </h2>
                </div>
                <div className="space-y-4 max-w-[600px]">
                  <div className="flex gap-[19px] w-[600px] h-10 flex-none order-0 self-stretch">
                    <Input
                      type="text"
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) =>
                        handleChange("address", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1"
                    />
                    <Input
                      type="text"
                      placeholder="Unit"
                      value={formData.unit}
                      onChange={(e) =>
                        handleChange("unit", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) =>
                        handleChange("city", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                    <Select
                      value={formData.state || undefined}
                      onValueChange={(value) =>
                        handleChange(
                          "state",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATE_NAMES[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      placeholder="ZIP Code"
                      value={formData.zip}
                      onChange={(e) =>
                        handleChange("zip", e.target.value)
                      }
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                    <Select
                      value={formData.county}
                      onValueChange={(value) =>
                        handleChange("county", value)
                      }
                    >
                      <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county} value={county}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      handleChange("country", value)
                    }
                  >
                    <SelectTrigger className="border-[#D1D5DB] bg-white h-10">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">
                        United States
                      </SelectItem>
                      <SelectItem value="Canada">
                        Canada
                      </SelectItem>
                      <SelectItem value="Mexico">
                        Mexico
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[12px] text-[#6B7280]">
                    Manage counties in <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=counties")}>Settings → Counties</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Additional Contacts */}
              <div className="grid grid-cols-[280px_1fr] gap-12">
                <div>
                  <h2
                    className="text-[16px] text-[#1A2332] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Additional contacts
                  </h2>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    External contacts related to this client
                    (e.g. legal guardian, relative, property
                    manager).
                  </p>
                </div>
                <div className="space-y-4 max-w-[600px]">
                  {formData.additionalContacts.map(
                    (contact) => (
                      <div
                        key={contact.id}
                        className="border border-[#E5E7EB] rounded-lg p-4 space-y-3 relative"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            removeAdditionalContact(contact.id)
                          }
                          className="absolute top-3 right-3 text-[#9AA3AF] hover:text-[#DC2626] transition-colors"
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: "18px" }}
                          >
                            close
                          </span>
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="text"
                            placeholder="First name"
                            value={contact.firstName}
                            onChange={(e) =>
                              updateAdditionalContact(
                                contact.id,
                                "firstName",
                                e.target.value,
                              )
                            }
                            className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                          />
                          <Input
                            type="text"
                            placeholder="Last name"
                            value={contact.lastName}
                            onChange={(e) =>
                              updateAdditionalContact(
                                contact.id,
                                "lastName",
                                e.target.value,
                              )
                            }
                            className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="tel"
                            placeholder="Phone"
                            value={contact.phone}
                            onChange={(e) =>
                              updateAdditionalContact(
                                contact.id,
                                "phone",
                                e.target.value,
                              )
                            }
                            className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                          />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={contact.email}
                            onChange={(e) =>
                              updateAdditionalContact(
                                contact.id,
                                "email",
                                e.target.value,
                              )
                            }
                            className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                          />
                        </div>
                        <Input
                          type="text"
                          placeholder="Relationship (e.g. Legal guardian, Spouse, Property manager)"
                          value={contact.relationship}
                          onChange={(e) =>
                            updateAdditionalContact(
                              contact.id,
                              "relationship",
                              e.target.value,
                            )
                          }
                          className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        />
                      </div>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={addAdditionalContact}
                    className="text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors flex items-center gap-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    <span
                      className="material-icons"
                      style={{ fontSize: "18px" }}
                    >
                      add
                    </span>
                    Add additional contact
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#F9FAFB] border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAndCreateAnother}
                className="border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
              >
                Save and Create Another
              </Button>
              <Button
                type="submit"
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-10 px-6 text-white"
              >
                Save Client
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}