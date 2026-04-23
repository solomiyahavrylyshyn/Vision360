import { useState, useSyncExternalStore } from "react";
import { useNavigate, useParams } from "react-router";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../components/ui/dropdown-menu";
import { KebabMenu as KebabMenuShared, KebabItem } from "../components/ui/kebab-menu";
import { toast } from "sonner";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { tagsStore } from "../stores/tagsStore";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

type TabKey =
  | "details" | "appointments" | "jobs" | "estimates"
  | "invoices" | "payments" | "pos" | "addresses"
  | "service-agreements" | "attachments" | "notes"
  | "equipment" | "activity" | "marketing";

const TABS: { key: TabKey; label: string; count?: number }[] = [
  { key: "details",            label: "Details" },
  { key: "appointments",       label: "Appointments",       count: 0 },
  { key: "jobs",               label: "Jobs",               count: 1 },
  { key: "estimates",          label: "Estimates",          count: 0 },
  { key: "invoices",           label: "Invoices",           count: 0 },
  { key: "payments",           label: "Payments",           count: 0 },
  { key: "pos",                label: "POs",                count: 0 },
  { key: "addresses",          label: "Addresses",          count: 2 },
  { key: "service-agreements", label: "Service Agreements", count: 0 },
  { key: "attachments",        label: "Attachments",        count: 43 },
  { key: "notes",              label: "Notes",              count: 2 },
  { key: "equipment",          label: "Equipment",          count: 0 },
  { key: "activity",           label: "Activity" },
  { key: "marketing",          label: "Marketing" },
];

export function ClientDetail() {
  const navigate = useNavigate();
  useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [clientStatus, setClientStatus] = useState<"active" | "on-hold" | "archived">("active");
  const marketingSources = useSyncExternalStore(
    marketingSourcesStore.subscribe,
    marketingSourcesStore.getSources
  );
  const availableTags = useSyncExternalStore(
    tagsStore.subscribe,
    tagsStore.getTags
  );

  const client = {
    name: "Mike Delgado",
    customerId: "C-10245",
    title: "Mr.",
    firstName: "Mike",
    middleInitial: "J",
    lastName: "Delgado",
    preferredName: "Michael",
    company: "Delgado Property Solutions",
    role: "Property Owner",
    customerType: "homeowner" as const,
    customerSince: "Jul - 2021",
    lastService: "Jun-25",
    isBillingSameAsService: true,
    isTaxable: true,
    paymentTerms: "Net 30",
    paymentMethod: "ACH",
    creditLimit: 10000,
    department: "Sarasota Branch",
    salesRep: "Travis Jones",
    accManager: "Anne Blue",
    type: "Residential",
    customField1: "",
    customField2: "",
    mobilePhone: "813-286-7572",
    mobilePhoneExt: "457",
    workPhone: "(833) 555-9999",
    workPhoneExt: "456",
    website: "https://smithplumbing.com",
    email: "mjdelgado84@yahoo.com",
    address: "2105 West Hills Avenue",
    unit: "Suite 201",
    city: "Tampa",
    state: "FL",
    zip: "33606",
    country: "United States",
    county: "Hillsborough",
    billingAddress: "2105 West Hills Avenue",
    billingUnit: "Suite 201",
    billingCity: "Tampa",
    billingState: "FL",
    billingZip: "33606",
    billingCounty: "Hillsborough",
    marketingSource: "Google",
    notes: "Prefers morning appointments. Has three properties requiring service.",
    notesArray: [
      { id: 1, text: "Prefers morning appointments.", date: "Added Mar 10, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Added Jan 15, 2024" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Added Dec 5, 2023" },
      { id: 4, text: "Prefers email communication over phone.", date: "Added Oct 20, 2023" },
      { id: 5, text: "Has two dogs, please close gates.", date: "Added Jul 15, 2021" },
    ],
    tags: ["New Homeowner", "Self-Generated Lead", "VIP Customer"],
    membership: "Silver",
    membershipExpiry: "Dec-27",
    totalRevenue: 45230.0,
    estimatesTotal: 12300.0,
    openBalance: 2450.0,
    pastDueBalance: 850.0,
    balance: 1214.0,
  };

  const [editedClient, setEditedClient] = useState(client);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedClient(client);
    if (activeTab !== "details") setActiveTab("details");
  };

  const handleSaveClick = () => {
    toast.success("Client updated successfully");
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedClient((prev) => ({ ...prev, [field]: value }));
  };

  /* ── work data ── */
  const jobItems = [
    { id: 2, type: "job", title: "Job #1", subtitle: "AC Estimate", date: "Scheduled for Mar 30, 2026", status: "Scheduled", statusColor: "#4A6FA5", amount: "$0.00" },
  ];
  const estimateItems = [
    { id: 3, type: "estimate", title: "Estimate #1", subtitle: "AC Unit Replacement", date: "Created Mar 28, 2026", status: "Draft", statusColor: "#6B7280", amount: "$2,450.00" },
  ];

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  /* ──────────────────────────────────────────
     CREATE DROPDOWN (reusable)
  ────────────────────────────────────────── */
  const CreateDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-9 px-4 text-white text-[13px]">
          <span className="material-icons mr-1.5" style={{ fontSize: "18px" }}>add</span>
          Create
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {[
          { label: "Appointment",       icon: "event",       path: "/appointments/new" },
          { label: "Estimate",          icon: "description", path: "/estimates/new" },
          { label: "Job",               icon: "work",        path: "/jobs/new" },
          { label: "Invoice",           icon: "receipt",     path: "/invoices/new" },
          { label: "Payment",           icon: "credit_card", path: "/payments/new" },
          { label: "Message",           icon: "message",     path: null },
          { label: "Property",          icon: "home",        path: "/properties/new" },
          { label: "Service Agreement", icon: "assignment",  path: "/service-agreements/new" },
          { label: "Contact",           icon: "person_add",  path: "/clients/new" },
        ].map(({ label, icon, path }) => (
          <DropdownMenuItem
            key={label}
            className="flex items-center gap-3 py-2.5"
            onClick={() => path ? navigate(path) : undefined}
          >
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>{icon}</span>
            <span className="text-[14px] text-[#1A2332]">{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ──────────────────────────────────────────
     KEBAB MENU
  ────────────────────────────────────────── */
  const KebabMenu = () => (
    <KebabMenuShared triggerClassName="w-9 h-9 border border-[#DDE3EE] rounded-md bg-white" contentClassName="min-w-[220px]">
      <KebabItem icon="print" onClick={() => toast.info("Print functionality coming soon")}>Print</KebabItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }}>
          <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>receipt_long</span>
          <span className="flex-1 leading-none">Statement Actions</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[200px]">
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("Email Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>email</span>
            <span className="flex-1 leading-none">Email Statement</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("Print Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>print</span>
            <span className="flex-1 leading-none">Print Statement</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[#374151] cursor-pointer rounded-none" style={{ fontWeight: 500 }} onClick={() => toast.info("View Statement coming soon")}>
            <span className="material-icons flex-shrink-0 text-[#6B7280]" style={{ fontSize: "18px" }}>visibility</span>
            <span className="flex-1 leading-none">View Statement</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <KebabItem icon="payments" onClick={() => toast.info("Collect Payment coming soon")}>Collect Payment</KebabItem>
      <KebabItem icon="event_repeat" onClick={() => toast.info("Add Recurring Service coming soon")}>Add Recurring Service</KebabItem>
    </KebabMenuShared>
  );

  /* ──────────────────────────────────────────
     WORK TABLE (jobs / estimates / invoices)
  ────────────────────────────────────────── */
  const WorkTable = ({ items, emptyIcon, emptyLabel }: {
    items: typeof jobItems;
    emptyIcon: string;
    emptyLabel: string;
  }) => (
    items.length > 0 ? (
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            <th className="text-left pb-3 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Item</th>
            <th className="text-left pb-3 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Date</th>
            <th className="text-left pb-3 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Status</th>
            <th className="text-right pb-3 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>
                    {item.type === "estimate" ? "request_quote" : item.type === "invoice" ? "receipt" : "work"}
                  </span>
                  <div>
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.title}</div>
                    <div className="text-[12px] text-[#6B7280]">{item.subtitle}</div>
                  </div>
                </div>
              </td>
              <td className="py-4"><div className="text-[13px] text-[#6B7280]">{item.date}</div></td>
              <td className="py-4">
                <span
                  className="px-2 py-1 rounded text-[11px] text-white"
                  style={{ fontWeight: 500, backgroundColor: item.statusColor }}
                >
                  {item.status}
                </span>
              </td>
              <td className="py-4 text-right">
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.amount || "—"}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="py-12 text-center">
        <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "36px" }}>{emptyIcon}</span>
        <p className="text-[13px] text-[#9CA3AF]">{emptyLabel}</p>
      </div>
    )
  );

  /* ──────────────────────────────────────────
     DETAILS READ-ONLY
  ────────────────────────────────────────── */
  const DetailsView = () => (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-4 items-start">

      {/* LEFT COLUMN */}
      <div className="space-y-4">
        {/* Identity Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="p-5 relative">
            <button
              onClick={handleEditClick}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md"
            >
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <div className="flex items-baseline gap-1.5 mb-4 pr-8">
              <span className="text-[13px] text-[#6B7280]">{client.title}</span>
              <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                {client.firstName} {client.middleInitial} {client.lastName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-0.5">Preferred name</div>
                <div className="text-[13px] text-[#374151]">{client.preferredName}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-0.5">Role</div>
                <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{client.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Address & Contact Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="p-5 relative">
            <button
              onClick={handleEditClick}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md"
            >
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <div className="space-y-4 pr-8">
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-1">Service address</div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{client.address}</div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                  {client.city}, {client.state}, {client.zip}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-1">Primary phone number</div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                  {client.mobilePhone}{client.mobilePhoneExt ? ` x ${client.mobilePhoneExt}` : ""}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#9CA3AF] mb-1">Email</div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{client.email}</div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientData.isBillingSameAsService}
                  onChange={(e) => handleCheckboxChange("isBillingSameAsService", e.target.checked)}
                  className="w-4 h-4 accent-[#4A6FA5]"
                />
                <span className="text-[13px] text-[#374151]">Billing address is the same as service address</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Tags */}
          <div className="flex items-start gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0 pt-1">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {client.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#E0E7FF] text-[12px] text-[#4338CA]"
                  style={{ fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Lead Source */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Lead Source</span>
            <div className="flex-1">
              <Select
                value={clientData.marketingSource || "none"}
                onValueChange={(v) => {
                  setClientData((prev) => ({ ...prev, marketingSource: v === "none" ? "" : v }));
                  toast.success("Lead source updated");
                }}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue placeholder="Select" />
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

          {/* Type */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Type</span>
            <div className="flex-1">
              <Select
                value={clientData.type || "Residential"}
                onValueChange={(v) => setClientData((prev) => ({ ...prev, type: v }))}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sales Rep */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Sales Rep</span>
            <div className="flex-1">
              <Select
                value={clientData.salesRep || "none"}
                onValueChange={(v) => setClientData((prev) => ({ ...prev, salesRep: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue placeholder="Select rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Travis Jones">Travis Jones</SelectItem>
                  <SelectItem value="Sarah Miller">Sarah Miller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Acc. Manager */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Acc. Manager</span>
            <div className="flex-1">
              <Select
                value={clientData.accManager || "none"}
                onValueChange={(v) => setClientData((prev) => ({ ...prev, accManager: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Anne Blue">Anne Blue</SelectItem>
                  <SelectItem value="John Smith">John Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Field 1 */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Custom Field 1</span>
            <div className="flex-1">
              <Select
                value={clientData.customField1 || "none"}
                onValueChange={(v) => setClientData((prev) => ({ ...prev, customField1: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue placeholder="Custom Field 1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Field 2 */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#6B7280] w-[110px] shrink-0">Custom Field 2</span>
            <div className="flex-1">
              <Select
                value={clientData.customField2 || "none"}
                onValueChange={(v) => setClientData((prev) => ({ ...prev, customField2: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]">
                  <SelectValue placeholder="Custom Field 2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Finance details</h3>
            <button
              onClick={handleEditClick}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F7FA] rounded-md"
            >
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>edit</span>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-[#9CA3AF] mb-0.5">Payment terms</div>
              <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{client.paymentTerms}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#9CA3AF] mb-0.5">Credit limit</div>
              <div className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>${client.creditLimit.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#9CA3AF] mb-0.5">Payment method</div>
              <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{client.paymentMethod}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#9CA3AF] mb-0.5">Department</div>
              <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{client.department}</div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={clientData.isTaxable}
                onChange={(e) => handleCheckboxChange("isTaxable", e.target.checked)}
                className="w-4 h-4 accent-[#4A6FA5]"
              />
              <span className="text-[14px] text-[#374151]">Taxable</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const InfoField = ({ label, value, isLink = false }: { label: string; value?: string | string[]; isLink?: boolean }) => (
    <div>
      <div className="text-[12px] text-[#9CA3AF] mb-1">{label}</div>
      <div className={`text-[14px] ${isLink ? "text-[#4A6FA5]" : "text-[#1A2332]"}`} style={{ fontWeight: 500 }}>
        {Array.isArray(value) ? value.join(", ") : value || <span className="text-[#D1D5DB]">—</span>}
      </div>
    </div>
  );

  /* ──────────────────────────────────────────
     DETAILS EDIT FORM
  ────────────────────────────────────────── */
  const EditForm = () => (
    <div className="space-y-6">
      {/* 1. Details */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Customer number */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Customer number</Label>
            <Input placeholder="e.g. C-10245" value={editedClient.customerId} onChange={(e) => handleFieldChange("customerId", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
          </div>
          {/* Name row */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Name</Label>
            <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-3">
              <Select value={editedClient.title || "none"} onValueChange={(v) => handleFieldChange("title", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]"><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Title</SelectItem>
                  {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="First name" value={editedClient.firstName} onChange={(e) => handleFieldChange("firstName", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
              <Input placeholder="M.I." value={editedClient.middleInitial} onChange={(e) => handleFieldChange("middleInitial", e.target.value.slice(0,1).toUpperCase())} className="border-[#D1D5DB] bg-white h-10 text-[14px]" maxLength={1} />
              <Input placeholder="Last name" value={editedClient.lastName} onChange={(e) => handleFieldChange("lastName", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
            </div>
          </div>
          {/* Preferred name */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Preferred name (Goes by)</Label>
            <Input placeholder="e.g. Mia, Bobby, TJ" value={editedClient.preferredName} onChange={(e) => handleFieldChange("preferredName", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
          </div>
          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Company name</Label>
              <Input placeholder="Company name" value={editedClient.company} onChange={(e) => handleFieldChange("company", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
            </div>
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Role</Label>
              <Input placeholder="e.g. Owner, Manager" value={editedClient.role} onChange={(e) => handleFieldChange("role", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
            </div>
          </div>
          {/* Customer type */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-3 block" style={{ fontWeight: 500 }}>Customer type</Label>
            <div className="flex items-center gap-6">
              {[{ value: "homeowner", label: "Residential" }, { value: "business", label: "Commercial" }].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="customerType" checked={editedClient.customerType === value} onChange={() => handleFieldChange("customerType", value)} className="w-4 h-4 accent-[#4A6FA5]" />
                  <span className="text-[14px] text-[#374151]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Billing vs Service Address */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editedClient.isBillingSameAsService}
              onChange={(e) => handleFieldChange("isBillingSameAsService", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[14px] text-[#374151]">Billing address is the same as service address</span>
          </label>
        </div>
      </div>

      {/* 3. Tags */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Tags</h3>
        </div>
        <div className="px-6 py-5 space-y-3">
          {/* Selected tags */}
          {editedClient.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b border-[#E5E7EB]">
              {editedClient.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                  {tag}
                  <button
                    onClick={() => handleFieldChange("tags", editedClient.tags.filter(t => t !== tag))}
                    className="hover:bg-[#C7D2FE] rounded-full w-3.5 h-3.5 flex items-center justify-center"
                  >
                    <span className="material-icons" style={{ fontSize: "12px" }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Available tags */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Select tags</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-2 border border-[#E5E7EB] rounded-md">
              {availableTags.map((tag) => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F7FA] p-2 rounded">
                  <input
                    type="checkbox"
                    checked={editedClient.tags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange("tags", [...editedClient.tags, tag]);
                      } else {
                        handleFieldChange("tags", editedClient.tags.filter(t => t !== tag));
                      }
                    }}
                    className="w-4 h-4 accent-[#4A6FA5]"
                  />
                  <span className="text-[13px] text-[#374151]">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-[#6B7280]">
            Manage tags in <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=customerTags")}>Settings → Customer Tags</span>
          </p>
        </div>
      </div>

      {/* 4. Taxable */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editedClient.isTaxable}
              onChange={(e) => handleFieldChange("isTaxable", e.target.checked)}
              className="w-4 h-4 accent-[#4A6FA5]"
            />
            <span className="text-[14px] text-[#374151]">Taxable</span>
          </label>
        </div>
      </div>

      {/* 5. Additional Contact Information */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Additional Contact Information</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Primary phone */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Primary phone number</Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 123-4567" value={editedClient.mobilePhone} onChange={(e) => handleFieldChange("mobilePhone", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.mobilePhoneExt} onChange={(e) => handleFieldChange("mobilePhoneExt", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Secondary phone */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Secondary phone number</Label>
            <div className="flex gap-[19px]">
              <Input type="tel" placeholder="(555) 456-7890" value={editedClient.workPhone} onChange={(e) => handleFieldChange("workPhone", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px] flex-1" />
              <Input type="text" placeholder="EXT" value={editedClient.workPhoneExt} onChange={(e) => handleFieldChange("workPhoneExt", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px] w-[80px]" />
            </div>
          </div>
          {/* Email */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Email</Label>
            <Input type="email" placeholder="john@example.com" value={editedClient.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
          </div>
          {/* Website */}
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Website</Label>
            <Input type="url" placeholder="https://example.com" value={editedClient.website} onChange={(e) => handleFieldChange("website", e.target.value)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
          </div>
        </div>
      </div>

      {/* 6. Payment Details */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Payment Details</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment terms</Label>
              <Select value={editedClient.paymentTerms || "none"} onValueChange={(v) => handleFieldChange("paymentTerms", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Payment method</Label>
              <Select value={editedClient.paymentMethod || "none"} onValueChange={(v) => handleFieldChange("paymentMethod", v === "none" ? "" : v)}>
                <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[13px] text-[#374151] mb-2 block" style={{ fontWeight: 500 }}>Credit limit</Label>
            <Input type="number" placeholder="0" value={editedClient.creditLimit} onChange={(e) => handleFieldChange("creditLimit", parseFloat(e.target.value) || 0)} className="border-[#D1D5DB] bg-white h-10 text-[14px]" />
          </div>
        </div>
      </div>

      {/* 7. Lead Source */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Lead Source</h3>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <Select value={editedClient.marketingSource || "none"} onValueChange={(v) => handleFieldChange("marketingSource", v === "none" ? "" : v)}>
              <SelectTrigger className="border-[#D1D5DB] bg-white h-10 text-[14px]"><SelectValue placeholder="Select marketing source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select —</SelectItem>
                {marketingSources.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[12px] text-[#6B7280]">
            Manage sources in <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=marketingSources")}>Settings → Lead Sources</span>
          </p>
        </div>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────
     EMPTY STATE PANEL
  ────────────────────────────────────────── */
  const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
      <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>{icon}</span>
      <p className="text-[13px] text-[#9CA3AF]">{message}</p>
    </div>
  );

  /* ──────────────────────────────────────────
     HANDLE CHECKBOX CHANGES IN VIEW MODE
  ────────────────────────────────────────── */
  const [clientData, setClientData] = useState(client);

  const handleCheckboxChange = (field: string, value: boolean) => {
    setClientData((prev) => ({ ...prev, [field]: value }));
    toast.success("Setting updated");
  };

  /* ──────────────────────────────────────────
     TAB CONTENT ROUTER
  ────────────────────────────────────────── */
  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return isEditing ? <EditForm /> : <DetailsView />;

      case "appointments":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
            <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
            <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
          </div>
        );

      case "jobs":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/jobs/new")}>
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
              </Button>
            </div>
            <div className="p-6">
              <WorkTable items={jobItems} emptyIcon="work" emptyLabel="No jobs yet for this client." />
            </div>
          </div>
        );

      case "estimates":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimates</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/estimates/new")}>
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
              </Button>
            </div>
            <div className="p-6">
              <WorkTable items={estimateItems} emptyIcon="request_quote" emptyLabel="No estimates yet for this client." />
            </div>
          </div>
        );

      case "invoices":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => navigate("/invoices/new")}>
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
              </Button>
            </div>
            <div className="p-6">
              <WorkTable items={[]} emptyIcon="receipt" emptyLabel="No invoices yet for this client." />
            </div>
          </div>
        );

      case "payments":
        return <EmptyState icon="credit_card" message="No payments recorded for this client." />;

      case "addresses":
        return (
          <div className="space-y-6">
            {/* Billing Address */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Billing Address</h3>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => toast.info("Edit address coming soon")}>
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit</span>
                </Button>
              </div>
              <div className="p-6">
                <div className="border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-3 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                  <span className="material-icons text-[#4A6FA5] mt-0.5" style={{ fontSize: "20px" }}>receipt_long</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                        {client.billingAddress}{client.billingUnit ? `, ${client.billingUnit}` : ""}
                      </div>
                    </div>
                    <div className="text-[13px] text-[#6B7280]">
                      {client.billingCity}, {client.billingState} {client.billingZip}
                    </div>
                    <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                      {client.billingCounty} County
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Address */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service Address</h3>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => toast.info("Add address coming soon")}>
                  <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
                </Button>
              </div>
              <div className="p-6 space-y-3">
                <div className="border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-3 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                  <span className="material-icons text-[#4A6FA5] mt-0.5" style={{ fontSize: "20px" }}>location_on</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
                        {client.address}{client.unit ? `, ${client.unit}` : ""}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#D1FAE5] text-[#16A34A] text-[11px]" style={{ fontWeight: 500 }}>Primary</span>
                    </div>
                    <div className="text-[13px] text-[#6B7280]">
                      {client.city}, {client.state} {client.zip}
                    </div>
                    <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                      {client.county} County
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Attachments</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => toast.info("Upload attachment coming soon")}>
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Service Agreement - 2026.pdf", date: "Mar 28, 2026", size: "245 KB", icon: "picture_as_pdf", color: "#DC2626" },
                  { name: "HVAC System Photo.jpg", date: "Mar 15, 2026", size: "1.2 MB", icon: "image", color: "#F59E0B" },
                  { name: "Property Blueprint.pdf", date: "Feb 10, 2026", size: "3.8 MB", icon: "picture_as_pdf", color: "#DC2626" },
                  { name: "Before Service.jpg", date: "Jan 20, 2026", size: "980 KB", icon: "image", color: "#F59E0B" },
                ].map((file, i) => (
                  <div key={i} className="border border-[#E5E7EB] rounded-lg p-3 hover:bg-[#F9FAFB] cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0">
                        <span className="material-icons" style={{ fontSize: "20px", color: file.color }}>{file.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>
                          {file.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#9CA3AF]">{file.size}</span>
                          <span className="text-[#D1D5DB]">•</span>
                          <span className="text-[11px] text-[#9CA3AF]">{file.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[#F5F7FA]" onClick={() => toast.info("Add note coming soon")}>
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>add</span>
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {client.notesArray.map((note) => (
                <div key={note.id} className="border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>MS</div>
                    <span className="text-[12px] text-[#6B7280]">Marek Stroz · {note.date}</span>
                  </div>
                  <p className="text-[14px] text-[#374151] leading-[21px]">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "pos":
      case "service-agreements":
      case "equipment":
      case "activity":
      case "marketing":
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-lg py-16 text-center">
            <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
            <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
          </div>
        );

      default:
        return <EmptyState icon="help_outline" message="Select a tab from the left panel." />;
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Breadcrumb + Actions */}
        <div className="px-8 h-12 flex items-center justify-between gap-1.5 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/clients")}
              className="text-[13px] text-[#4A6FA5] hover:underline"
              style={{ fontWeight: 500 }}
            >
              Clients
            </button>
            <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "16px" }}>chevron_right</span>
            <span className="text-[13px] text-[#374151]">{client.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <CreateDropdown />
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  className="border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5"
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                </Button>
                <KebabMenu />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelClick}
                  className="border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-3 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveClick}
                  className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-8 px-3 text-white text-[13px]"
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary content */}
        <div className="px-8 pt-5 pb-[14px]">
          <div className="flex items-start gap-8">
            {/* Main info section */}
            <div className="flex-1 flex gap-8">
              {/* Left: Name + Address */}
              <div className="flex flex-col gap-3 min-w-[260px]">
                <div className="flex items-center gap-2">
                  <h1 className="text-[28px] text-[#1A2332] leading-[42px]" style={{ fontWeight: 700 }}>
                    {client.name}
                  </h1>
                  <span className="text-[16px] text-[#6B7280] leading-[42px]" style={{ fontWeight: 500 }}>
                    ({client.customerId.replace(/^C-/, "")})
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5">
                  <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "14px" }}>location_on</span>
                  <div className="text-[13px] text-[#374151] leading-[19px]">
                    {client.address}
                    <br />
                    {client.city}, {client.state}, {client.zip}
                  </div>
                </div>

                {/* Icons row + Status */}
                <div className="flex items-center gap-4">
                  {/* Customer type icon with tooltip */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>
                        {client.customerType === "business" ? "business" : "home"}
                      </span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">
                        {client.customerType === "business" ? "Commercial" : "Residential"}
                      </div>
                    </div>
                  </div>

                  {/* Phone icon with tooltip */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>phone</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{client.mobilePhone}</div>
                    </div>
                  </div>

                  {/* Email icon with tooltip */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>email</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{client.email}</div>
                    </div>
                  </div>

                  {/* Status badge (only active one, clickable) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] transition-colors ${
                          clientStatus === "active"
                            ? "bg-[#D1FAE5] text-[#16A34A] hover:bg-[#BBF7D0]"
                            : clientStatus === "on-hold"
                            ? "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
                            : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {clientStatus === "active" && "Active"}
                        {clientStatus === "on-hold" && "On Hold"}
                        {clientStatus === "archived" && "Archived"}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[140px]">
                      <DropdownMenuItem onClick={() => setClientStatus("active")} className="text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] mr-2" />
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setClientStatus("on-hold")} className="text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] mr-2" />
                        On Hold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setClientStatus("archived")} className="text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-[#6B7280] mr-2" />
                        Archived
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Three-column data grid */}
              <div className="grid grid-cols-3 gap-[12px] flex-1 border-l border-[#E5E7EB] pl-8">
                {/* Column 1: Customer since + Tags */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[12px] text-[#6B7280] leading-[18px]">Customer since</div>
                    <div className="text-[14px] text-[#1A2332] leading-[21px]">
                      {client.customerSince}
                    </div>
                  </div>
                  <div className="relative group cursor-pointer flex flex-col gap-1">
                    <div className="text-[12px] text-[#6B7280] leading-[18px]">
                      Tags ({client.tags.length})
                    </div>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                        {client.tags[0]}
                      </span>
                    </div>
                    {/* Tags tooltip */}
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-[180px] z-[60]">
                      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3.5 pt-3 pb-0">
                        {/* Header */}
                        <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.5px" }}>
                          Tags
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#E5E7EB] mb-2"></div>

                        {/* Tags list */}
                        <div className="flex flex-col gap-1.5 pb-3">
                          {client.tags.map((tag, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#6B7280] flex-shrink-0"></div>
                              <div className="text-[13px] text-[#1A2332] leading-[20px]">
                                {tag}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Membership + Last Service */}
                <div className="flex flex-col gap-4">
                  {client.membership && (
                    <div className="flex flex-col gap-1">
                      <div className="text-[12px] text-[#6B7280] leading-[18px]">Membership</div>
                      <div className="text-[14px] text-[#1A2332] leading-[21px]">
                        Silver - Exp. Dec 2027
                      </div>
                    </div>
                  )}
                  {!client.membership && (
                    <div className="relative group cursor-pointer">
                      <div className="text-[12px] text-[#6B7280] leading-[18px]">Membership</div>
                      <div className="text-[14px] text-[#4A6FA5] leading-[21px] mt-1">
                        Click to sell
                      </div>
                      {/* No membership tooltip */}
                      <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3.5 py-2 z-[60] whitespace-nowrap">
                        <div className="text-[13px] text-[#1A2332] leading-[20px]">
                          Click to sell membership
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="text-[12px] text-[#6B7280] leading-[18px]">Last Service</div>
                    <div className="text-[14px] text-[#1A2332] leading-[21px]">
                      {client.lastService}
                    </div>
                  </div>
                </div>

                {/* Column 3: Notes */}
                <div className="relative group cursor-pointer flex flex-col gap-1">
                  {/* Notes label */}
                  <div className="text-[12px] text-[#6B7280] leading-[18px]">
                    Notes ({client.notesArray.length})
                  </div>

                  {/* Preview of notes - up to 3 */}
                  <div className="flex flex-col gap-1">
                    {client.notesArray.slice(0, 3).map((note) => (
                      <div key={note.id} className="text-[12px] text-[#374151] leading-[18px] truncate max-w-[200px]">
                        {note.text}
                      </div>
                    ))}
                  </div>

                  {/* Notes hover tooltip */}
                  <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 w-[320px] z-[60]">
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1.5 left-5 w-3 h-1.5 overflow-hidden">
                      <div className="absolute w-2 h-2 bg-white border-l border-t border-[#E5E7EB] rotate-45 left-1/2 -translate-x-1/2"></div>
                    </div>

                    {/* Tooltip content */}
                    <div className="bg-white border border-[#E5E7EB] rounded-md shadow-lg p-3.5">
                      {/* Header */}
                      <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.5px" }}>
                        Notes
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#E5E7EB] mb-3"></div>

                      {/* Notes list */}
                      <div className="flex flex-col gap-3">
                        {client.notesArray.slice(0, 3).map((note, index) => (
                          <div key={note.id} className="flex flex-col gap-1">
                            <div className="text-[13px] text-[#1A2332] leading-[20px]">
                              {note.text}
                            </div>
                            <div className="text-[11px] text-[#6B7280] leading-[16px]">
                              {note.date}
                            </div>
                            {index < 2 && <div className="h-px bg-[#E5E7EB] mt-2"></div>}
                          </div>
                        ))}
                      </div>

                      {/* Bottom divider */}
                      <div className="h-px bg-[#E5E7EB] my-4"></div>

                      {/* View all link */}
                      <button
                        onClick={() => setActiveTab("notes")}
                        className="text-[12px] text-[#4A6FA5] leading-[18px] hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        View all {client.notesArray.length} notes →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-l border-[#E5E7EB] pl-[25px]" style={{ width: "280px" }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-[13px] w-[255px]">
                {/* Total Revenue */}
                <div className="flex flex-col gap-1">
                  <div className="text-[12px] text-[#6B7280] leading-[18px]">
                    Total Revenue
                  </div>
                  <div className="text-[20px] text-[#16A34A] leading-[30px]" style={{ fontWeight: 700 }}>
                    ${client.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Balance */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[12px] text-[#6B7280] leading-[18px]">
                      Balance
                    </div>
                    <div className="relative group">
                      <span className="material-icons text-[#9CA3AF] cursor-help" style={{ fontSize: "14px" }}>info</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3 py-2 z-50 whitespace-nowrap">
                        <div className="text-[12px] text-[#1A2332]">Total outstanding balance including all unpaid invoices</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[20px] text-[#1A2332] leading-[30px]" style={{ fontWeight: 600 }}>
                    ${client.openBalance.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                </div>

                {/* Estimates */}
                <div className="flex flex-col gap-1">
                  <div className="text-[12px] text-[#6B7280] leading-[18px]">
                    Estimates
                  </div>
                  <div className="text-[20px] text-[#1A2332] leading-[30px]" style={{ fontWeight: 700 }}>
                    ${client.estimatesTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Past Due */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[12px] text-[#6B7280] leading-[18px]">
                      Past Due
                    </div>
                    <div className="relative group">
                      <span className="material-icons text-[#9CA3AF] cursor-help" style={{ fontSize: "14px" }}>info</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3 py-2 z-50 whitespace-nowrap">
                        <div className="text-[12px] text-[#1A2332]">Overdue invoices requiring immediate attention</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[20px] text-[#DC2626] leading-[30px]" style={{ fontWeight: 600 }}>
                    ${client.pastDueBalance.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL TABS ── */}
      <div className="bg-white sticky top-0 z-30">
        <div className="flex items-center overflow-x-auto scrollbar-hide border-b border-[#E5E7EB]">
          <div className="flex items-center px-6">
            {TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  if (isEditing) setIsEditing(false);
                }}
                className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "text-[#4A6FA5]"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-0.5" style={{ fontWeight: 400 }}>({count})</span>
                )}
                {/* Active tab indicator */}
                {activeTab === key && (
                  <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />
                )}
              </button>
            ))}
          </div>

          {/* Settings button */}
          <button
            className="ml-auto h-[45px] w-[50px] flex items-center justify-center shrink-0 hover:bg-[#F3F4F6] transition-colors"
            onClick={() => toast.info("Settings coming soon")}
          >
            <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>settings</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 space-y-4 bg-[#F5F7FA]">
        {renderContent()}
      </main>
    </div>
  );
}
