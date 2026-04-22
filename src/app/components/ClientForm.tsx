import { useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";

interface AdditionalContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
}

interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  phoneExt?: string;
  secondaryPhone?: string;
  secondaryPhoneExt?: string;
  preferredName?: string;
  displayName?: string;
  mobilePhone?: string;
  mobilePhoneExt?: string;
  homePhone?: string;
  workPhone?: string;
  workPhoneExt?: string;
  website?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  county?: string;
  company?: string;
  role?: string;
  customerType?: "homeowner" | "business";
  title?: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  notes?: string;
  marketingSource?: string;
  unit?: string;
  billingAddressSame?: boolean;
  additionalContacts?: AdditionalContact[];
}

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSave: (client: Client) => void;
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const marketingSources = useSyncExternalStore(
    marketingSourcesStore.subscribe,
    marketingSourcesStore.getSources
  );
  const [formData, setFormData] = useState<Client>({
    id: client?.id || "",
    title: client?.title || "",
    firstName: client?.firstName || "",
    middleInitial: client?.middleInitial || "",
    lastName: client?.lastName || "",
    preferredName: client?.preferredName || "",
    displayName: client?.displayName || "",
    name: client?.name || "",
    company: client?.company || "",
    role: client?.role || "",
    customerType: client?.customerType || "homeowner",
    email: client?.email || "",
    phone: client?.phone || "",
    phoneExt: client?.phoneExt || "",
    secondaryPhone: client?.secondaryPhone || "",
    secondaryPhoneExt: client?.secondaryPhoneExt || "",
    mobilePhone: client?.mobilePhone || "",
    mobilePhoneExt: client?.mobilePhoneExt || "",
    homePhone: client?.homePhone || "",
    workPhone: client?.workPhone || "",
    workPhoneExt: client?.workPhoneExt || "",
    website: client?.website || "",
    address: client?.address || "",
    address2: client?.address2 || "",
    city: client?.city || "",
    state: client?.state || "none",
    zip: client?.zip || "",
    country: client?.country || "United States",
    county: client?.county || "",
    notes: client?.notes || "",
    marketingSource: client?.marketingSource || "",
    unit: client?.unit || "",
    billingAddressSame: client?.billingAddressSame !== undefined ? client.billingAddressSame : true,
    additionalContacts: client?.additionalContacts || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.firstName} ${formData.middleInitial ? formData.middleInitial + ". " : ""}${formData.lastName}`.trim();
    onSave({
      ...formData,
      name: fullName,
    });
    onOpenChange(false);
  };

  const handleChange = (field: keyof Client, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAdditionalContact = () => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: [
        ...(prev.additionalContacts || []),
        { id: Math.random().toString(36).substr(2, 9), firstName: "", lastName: "", phone: "", email: "", relationship: "" }
      ]
    }));
  };

  const updateAdditionalContact = (id: string, field: keyof AdditionalContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: (prev.additionalContacts || []).map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeAdditionalContact = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: (prev.additionalContacts || []).filter(c => c.id !== id)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{client ? "Edit Client" : "Create Client"}</DialogTitle>
        <DialogDescription className="sr-only">
          Fill out the form below to {client ? "edit" : "create"} client
        </DialogDescription>
        <div className="bg-white">
          <div className="border-b border-[#E5E7EB] px-8 py-6">
            <h1 className="text-[28px] text-[#1A2332]" style={{ fontWeight: 700 }}>
              {client ? "Edit Client" : "Create Client"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="space-y-10">
              {/* Primary contact details */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Contact info
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Title
                    </Label>
                    <Input
                      type="text"
                      placeholder="Mr., Mrs., Ms., Dr., etc."
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_70px_1fr] gap-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                        First name <span className="text-[#DC2626]">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                        M.I.
                      </Label>
                      <Input
                        type="text"
                        placeholder="M.I."
                        value={formData.middleInitial}
                        onChange={(e) => handleChange("middleInitial", e.target.value.slice(0, 1).toUpperCase())}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        maxLength={1}
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                        Last name <span className="text-[#DC2626]">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                        Preferred name (Goes by)
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Mia, Bobby"
                        value={formData.preferredName}
                        onChange={(e) => handleChange("preferredName", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Company name
                    </Label>
                    <Input
                      type="text"
                      placeholder="Company name (optional)"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Role
                    </Label>
                    <Input
                      type="text"
                      placeholder="Role"
                      value={formData.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-3 block" style={{ fontWeight: 500 }}>
                      Customer type
                    </Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customerTypeModal"
                          checked={formData.customerType === "homeowner"}
                          onChange={() => handleChange("customerType", "homeowner")}
                          className="w-4 h-4 accent-[#4A6FA5] cursor-pointer"
                        />
                        <span className="text-[14px] text-[#374151]">Homeowner</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customerTypeModal"
                          checked={formData.customerType === "business"}
                          onChange={() => handleChange("customerType", "business")}
                          className="w-4 h-4 accent-[#4A6FA5] cursor-pointer"
                        />
                        <span className="text-[14px] text-[#374151]">Business</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Communication */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Communication
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Mobile phone
                    </Label>
                    <div className="flex gap-[19px]">
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.mobilePhone || formData.phone}
                        onChange={(e) => handleChange("mobilePhone", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="EXT"
                        value={formData.mobilePhoneExt || formData.phoneExt}
                        onChange={(e) => handleChange("mobilePhoneExt", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Work phone
                    </Label>
                    <div className="flex gap-[19px]">
                      <Input
                        type="tel"
                        placeholder="(555) 456-7890"
                        value={formData.workPhone || formData.secondaryPhone}
                        onChange={(e) => handleChange("workPhone", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="EXT"
                        value={formData.workPhoneExt || formData.secondaryPhoneExt}
                        onChange={(e) => handleChange("workPhoneExt", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Email <span className="text-[#DC2626]">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>
                      Website
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Marketing Source */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Marketing source
                  </h2>
                </div>
                <div>
                  <Select value={formData.marketingSource || "none"} onValueChange={(value) => handleChange("marketingSource", value === "none" ? "" : value)}>
                    <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select —</SelectItem>
                      {marketingSources.map((source) => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Notes */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Notes
                  </h2>
                </div>
                <div>
                  <Textarea
                    placeholder="Add any relevant notes..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="border-[#D1D5DB] bg-white text-[14px] min-h-[100px]"
                    rows={4}
                  />
                  <p className="text-xs text-[#6B7280] mt-2">These notes are only visible to your team</p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Service address */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Service address
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Address</Label>
                    <div className="flex gap-0">
                      <Input
                        type="text"
                        placeholder="123 Main St"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] rounded-r-none border-r-0 flex-1"
                      />
                      <Input
                        type="text"
                        placeholder="Unit"
                        value={formData.unit}
                        onChange={(e) => handleChange("unit", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px] rounded-l-none w-[100px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input
                        type="text"
                        placeholder="Austin"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Region</Label>
                      <Select value={formData.state || "none"} onValueChange={(value) => handleChange("state", value === "none" ? "" : value)}>
                        <SelectTrigger className="border-[#D1D5DB] bg-white h-10">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>ZIP Code</Label>
                      <Input
                        type="text"
                        placeholder="78701"
                        value={formData.zip}
                        onChange={(e) => handleChange("zip", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>County</Label>
                      <Input
                        type="text"
                        placeholder="County"
                        value={formData.county}
                        onChange={(e) => handleChange("county", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Country</Label>
                    <Select value={formData.country || "United States"} onValueChange={(value) => handleChange("country", value)}>
                      <SelectTrigger className="border-[#D1D5DB] bg-white h-10">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Mexico">Mexico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]"></div>

              {/* Additional Contacts */}
              <div className="grid grid-cols-[240px_1fr] gap-8">
                <div>
                  <h2 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                    Additional contacts
                  </h2>
                </div>
                <div className="space-y-4">
                  {(formData.additionalContacts || []).map((contact) => (
                    <div key={contact.id} className="border border-[#E5E7EB] rounded-lg p-4 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeAdditionalContact(contact.id)}
                        className="absolute top-3 right-3 text-[#9AA3AF] hover:text-[#DC2626] transition-colors"
                      >
                        <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="First name"
                          value={contact.firstName}
                          onChange={(e) => updateAdditionalContact(contact.id, "firstName", e.target.value)}
                          className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        />
                        <Input
                          type="text"
                          placeholder="Last name"
                          value={contact.lastName}
                          onChange={(e) => updateAdditionalContact(contact.id, "lastName", e.target.value)}
                          className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="tel"
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={(e) => updateAdditionalContact(contact.id, "phone", e.target.value)}
                          className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={contact.email}
                          onChange={(e) => updateAdditionalContact(contact.id, "email", e.target.value)}
                          className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                        />
                      </div>
                      <Input
                        type="text"
                        placeholder="Relationship (e.g. Legal guardian, Spouse)"
                        value={contact.relationship}
                        onChange={(e) => updateAdditionalContact(contact.id, "relationship", e.target.value)}
                        className="border-[#D1D5DB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAdditionalContact}
                    className="text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors flex items-center gap-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
                    Add additional contact
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#D1D5DB] text-[#546478] hover:bg-[#F5F7FA] h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-10 px-6"
              >
                Save Client
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}