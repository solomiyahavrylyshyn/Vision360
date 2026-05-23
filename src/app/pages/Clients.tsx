import { useState, useRef, useEffect, useSyncExternalStore, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { PageHeader } from "../components/ui/page-header";
import { SelectionBar } from "../components/ui/selection-bar";
import { QuickFilterSelect } from "../components/ui/quick-filter-select";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDraggableColumns, DraggableTh } from "../components/ui/draggable-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { marketingSourcesStore } from "../stores/marketingSourcesStore";
import { tagsStore } from "../stores/tagsStore";
import { countiesStore } from "../stores/countiesStore";
import { PlusIcon } from "../components/ui/plus-icon";
import { CreateActionButton } from "../components/ui/create-action-button";
import { StatCard } from "../components/ui/stat-card";

interface Client {
  id: string;
  initials: string;
  avatarColor: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  lastActivity: string;
  totalJobs: number;
  totalBilled: number;
  status?: "Active" | "Inactive";
  pastDue?: number;
  daysOverdue?: number;
}

const initialClients: Client[] = [
  { id: "10245", initials: "JS", avatarColor: "#4A6FA5", name: "John Smith", company: null, email: "john.smith@email.com", phone: "(555) 123-4567", address: "123 Main St, Austin, TX 78701", tags: ["Residential", "VIP"], lastActivity: "Invoice sent · 2 days ago", totalJobs: 5, totalBilled: 12450.00 },
  { id: "10246", initials: "SJ", avatarColor: "#3B82F6", name: "Sarah Johnson", company: null, email: "sarah.j@email.com", phone: "(555) 234-5678", address: "456 Oak Ave, Dallas, TX 75201", tags: ["Commercial"], lastActivity: "Estimate sent · 5 days ago", totalJobs: 0, totalBilled: 0 },
  { id: "10247", initials: "MD", avatarColor: "#8B5CF6", name: "Mike Davis", company: "Davis Construction", email: "mike@davis.com", phone: "(555) 345-6789", address: "789 Pine Rd, Houston, TX 77001", tags: ["Residential", "Repeat"], lastActivity: "Invoice overdue · 18 days", totalJobs: 3, totalBilled: 8750.50, pastDue: 1250.00, daysOverdue: 18 },
  { id: "10248", initials: "RL", avatarColor: "#D97706", name: "Robert Lee", company: "Lee & Associates", email: "robert.l@email.com", phone: "(555) 456-7890", address: "321 Elm St, San Antonio, TX 78201", tags: ["Commercial", "New"], lastActivity: "Contacted · 3 days ago", totalJobs: 0, totalBilled: 0 },
  { id: "10249", initials: "EP", avatarColor: "#10B981", name: "Emily Parker", company: null, email: "e.parker@email.com", phone: "(555) 567-8901", address: "654 Maple Dr, Fort Worth, TX 76101", tags: ["Residential"], lastActivity: "Payment received · 4 days ago", totalJobs: 2, totalBilled: 5320.00 },
  { id: "10250", initials: "TC", avatarColor: "#DC2626", name: "Tom Carter", company: null, email: "tom.c@email.com", phone: "(555) 678-9012", address: "987 Cedar Ln, Plano, TX 75023", tags: ["Commercial", "Priority"], lastActivity: "Quote requested · today", totalJobs: 0, totalBilled: 0 },
];


const CLIENTS_COLS = [
  { key: "name",         label: "Name",         sortable: true  },
  { key: "address",      label: "Address",       sortable: false },
  { key: "totalBilled",  label: "Total billed",  sortable: true  },
  { key: "lastActivity", label: "Last activity", sortable: true  },
];

export function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showEmptyStatePreview, setShowEmptyStatePreview] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientCols, moveClientCol] = useDraggableColumns(CLIENTS_COLS);

  // Quick filters
  const [qfDate, setQfDate] = useState("all_time");
  const [qfBalance, setQfBalance] = useState("all");
  const [qfStatus, setQfStatus] = useState<"Active" | "Inactive" | "All">("Active");

  const marketingSources = useSyncExternalStore(marketingSourcesStore.subscribe, marketingSourcesStore.getSources);
  const availableTags = useSyncExternalStore(tagsStore.subscribe, tagsStore.getTags);
  const availableCounties = useSyncExternalStore(countiesStore.subscribe, countiesStore.getCounties);

  type ColKey = "company" | "address" | "mobile" | "email" | "totalBilled" | "lastActivity" | "tags"
    | "first" | "last" | "role" | "home" | "work" | "notificationsEnabled" | "isContractor"
    | "customerType" | "leadSource" | "dateCreated" | "dateAcquired" | "lastServiceDate" | "lifetimeValue" | "notes";

  const [visibleColumns, setVisibleColumns] = useState<Set<ColKey>>(new Set<ColKey>(["address", "totalBilled", "lastActivity"]));
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
  const [pendingColumns, setPendingColumns] = useState<Set<ColKey>>(new Set<ColKey>(["address", "totalBilled", "lastActivity"]));

  const columnDefs: { key: ColKey; label: string }[] = [
    { key: "first", label: "First" }, { key: "last", label: "Last" }, { key: "role", label: "Role" },
    { key: "company", label: "Company" }, { key: "address", label: "Address" }, { key: "mobile", label: "Mobile" },
    { key: "home", label: "Home" }, { key: "work", label: "Work" }, { key: "email", label: "Email" },
    { key: "notificationsEnabled", label: "Notifications enabled" }, { key: "isContractor", label: "Customer is contractor" },
    { key: "customerType", label: "Customer type" }, { key: "leadSource", label: "Lead source" },
    { key: "dateCreated", label: "Date created at" }, { key: "dateAcquired", label: "Date acquired" },
    { key: "lastServiceDate", label: "Last service date" }, { key: "totalBilled", label: "Total Billed" },
    { key: "lifetimeValue", label: "Lifetime value" }, { key: "tags", label: "Tags" },
    { key: "notes", label: "Notes" }, { key: "lastActivity", label: "Last Activity" },
  ];
  const leftCols = columnDefs.slice(0, 11);
  const rightCols = columnDefs.slice(11);

  // Sorting
  type SortField = "name" | "phone" | "city" | "zip" | "lastActivity" | "totalBilled";
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };

  // Advanced filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterState, setFilterState] = useState({
    dateAcquiredFrom: "", dateAcquiredTo: "",
    lastServiceFrom: "", lastServiceTo: "",
    lifetimeMin: "", lifetimeMax: "",
    leadSource: "", customerType: "",
    city: "", county: "",
    tags: [] as string[],
    paymentTerms: "", paymentMethod: "",
    taxable: "", hasCompany: "",
  });
  const [pendingFilters, setPendingFilters] = useState({ ...filterState });

  const activeFilterCount = Object.entries(filterState).filter(([k, v]) => {
    if (k === "tags") return Array.isArray(v) && v.length > 0;
    return v !== "";
  }).length;

  const handleApplyFilters = () => { setFilterState({ ...pendingFilters }); setFilterPanelOpen(false); setCurrentPage(1); };
  const handleClearFilters = () => {
    const empty = { dateAcquiredFrom: "", dateAcquiredTo: "", lastServiceFrom: "", lastServiceTo: "", lifetimeMin: "", lifetimeMax: "", leadSource: "", customerType: "", city: "", county: "", tags: [] as string[], paymentTerms: "", paymentMethod: "", taxable: "", hasCompany: "" };
    setPendingFilters(empty); setFilterState(empty); setFilterPanelOpen(false); setCurrentPage(1);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) || client.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesQfBalance =
      qfBalance === "with_balance" ? client.totalBilled > 0 :
      qfBalance === "without_balance" ? client.totalBilled === 0 :
      true;
    const clientStatus = client.status ?? "Active";
    const matchesStatus = qfStatus === "All" || clientStatus === qfStatus;

    // Advanced filters
    const matchesCustomerType = !filterState.customerType || (filterState.customerType === "residential" ? client.tags.includes("Residential") : client.tags.includes("Commercial"));
    const matchesTags = filterState.tags.length === 0 || filterState.tags.some(t => client.tags.includes(t));
    const matchesLeadSource = !filterState.leadSource || client.tags.includes(filterState.leadSource);
    const matchesHasCompany = !filterState.hasCompany || (filterState.hasCompany === "yes" ? !!client.company : !client.company);
    let matchesLifetime = true;
    if (filterState.lifetimeMin !== "") matchesLifetime = client.totalBilled >= Number(filterState.lifetimeMin);
    if (filterState.lifetimeMax !== "") matchesLifetime = matchesLifetime && client.totalBilled <= Number(filterState.lifetimeMax);
    const matchesCity = !filterState.city || client.address.toLowerCase().includes(filterState.city.toLowerCase());

    return matchesSearch && matchesQfBalance && matchesStatus && matchesCustomerType && matchesTags && matchesLeadSource && matchesHasCompany && matchesLifetime && matchesCity;
  });

  // Sort
  const sortedClients = [...filteredClients].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "totalBilled") return (a.totalBilled - b.totalBilled) * dir;
    if (sortField === "lastActivity") return a.lastActivity.localeCompare(b.lastActivity) * dir;
    return 0;
  });

  const displayedClients = showEmptyStatePreview ? [] : sortedClients;
  const totalItems = displayedClients.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedClients = displayedClients.slice(startIndex, endIndex);

  const allSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedClients.has(c.id));
  const someSelected = selectedClients.size > 0 && !allSelected;
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedClients(new Set(displayedClients.map(c => c.id)));
    else setSelectedClients(new Set());
  };
  const handleSelectClient = (id: string, checked: boolean) => {
    const s = new Set(selectedClients);
    checked ? s.add(id) : s.delete(id);
    setSelectedClients(s);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="material-icons text-[#9AA3AF] ml-0.5" style={{ fontSize: "14px" }}>
      {sortField === field ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  const summaryCards = showEmptyStatePreview
    ? [
        { icon: "groups", value: "0", label: "Clients", detail: "Add your first client", color: "#4A6FA5", bg: "#EEF3FA" },
        { icon: "business_center", value: "0", label: "Active jobs", detail: "No jobs yet", color: "#16A34A", bg: "#E9F8F0" },
        { icon: "request_quote", value: "0", label: "Outstanding invoices", detail: "Nothing outstanding", color: "#EA580C", bg: "#FFF0E7" },
        { icon: "account_balance_wallet", value: "$0.00", label: "Collected revenue", detail: "All time", color: "#7C3AED", bg: "#F1EAFE" },
      ]
    : [
        { icon: "groups", value: String(totalItems), label: "Clients", detail: "All contacts", color: "#4A6FA5", bg: "#EEF3FA" },
        { icon: "business_center", value: "3", label: "Active jobs", detail: "Across current clients", color: "#16A34A", bg: "#E9F8F0" },
        { icon: "request_quote", value: "$2.45k", label: "Outstanding invoices", detail: "Open balance", color: "#EA580C", bg: "#FFF0E7" },
        { icon: "account_balance_wallet", value: "$17.77k", label: "Collected revenue", detail: "All time", color: "#7C3AED", bg: "#F1EAFE" },
      ];

  const EmptyStateIllustration = () => (
    <div className="relative h-[190px] w-full min-w-[260px]">
      <div className="absolute inset-x-8 bottom-4 h-24 rounded-[50%] bg-[#EEF3FA]" />
      <div className="absolute left-10 top-3 h-36 w-24 rotate-[-8deg] rounded-2xl border border-[#D8E0EC] bg-white shadow-[0_18px_45px_rgba(26,35,50,0.13)]">
        <div className="mx-4 mt-4 h-8 w-8 rounded-full bg-[#3B82F6]" />
        <div className="mx-4 mt-4 h-2 rounded-full bg-[#D8E3F4]" />
        <div className="mx-4 mt-3 h-2 w-16 rounded-full bg-[#D8E3F4]" />
        <div className="mx-4 mt-3 h-2 w-12 rounded-full bg-[#D8E3F4]" />
        <div className="absolute -right-3 top-24 flex h-8 w-8 items-center justify-center rounded-full bg-[#34C77B] text-white shadow-sm">
          <span className="material-icons" style={{ fontSize: "18px" }}>check</span>
        </div>
      </div>
      <div className="absolute bottom-10 left-[150px] h-20 w-24 rounded-lg border border-[#D4DEEA] bg-[#F6FAFF] shadow-sm">
        <div className="absolute -top-5 left-6 h-8 w-16 rounded-t-lg bg-[#D5E0EF]" />
        <div className="absolute bottom-0 left-0 h-12 w-full rounded-b-lg bg-[#EAF1F8]" />
        <div className="absolute right-4 top-8 h-16 w-9 rounded-sm bg-[#CFE0F2]" />
      </div>
      <div className="absolute bottom-6 left-[82px] h-11 w-28 rotate-[-7deg] rounded-xl border border-[#B7C7DD] bg-white shadow-md">
        <div className="mx-4 mt-3 h-2 w-20 rounded-full bg-[#D8E3F4]" />
        <div className="mx-4 mt-3 h-2 w-16 rounded-full bg-[#D8E3F4]" />
      </div>
      <div className="absolute bottom-6 right-10 h-8 w-14 rounded-md bg-[#DCE7F4] shadow-sm">
        <div className="absolute -bottom-1 left-2 h-3 w-3 rounded-full bg-[#8194AD]" />
        <div className="absolute -bottom-1 right-2 h-3 w-3 rounded-full bg-[#8194AD]" />
      </div>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
    <>
      <div className={showEmptyStatePreview ? "p-6" : "p-8"}>
        {/* ── Page Header ── */}
        {showEmptyStatePreview ? (
          <div className="mb-5 flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>Clients</h1>
                <span className="rounded-full bg-[#EDF1F6] px-3 py-1 text-[13px] text-[#6B7280]" style={{ fontWeight: 600 }}>
                  {totalItems} clients
                </span>
              </div>
              <p className="mt-1.5 text-[14px] text-[#546478]">
                Store contact details, properties, jobs, invoices, and notes in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateActionButton onClick={() => navigate("/clients/new")}>
                Create Client
              </CreateActionButton>
            </div>
          </div>
        ) : (
          <PageHeader
            title="Clients"
            count={selectedClients.size > 0 ? `${filteredClients.length} records · ${selectedClients.size} selected` : `${filteredClients.length} records`}
            actions={
              <>
                <CreateActionButton onClick={() => navigate("/clients/new")}>
                  Create Client
                </CreateActionButton>
              </>
            }
          />
        )}

        {/* ── Stats Cards ── */}
        {showEmptyStatePreview ? (
          <div className="mb-4 grid grid-cols-4 gap-3">
            {summaryCards.map(card => (
              <div
                key={card.label}
                className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                title={`${card.label}: ${card.value}. ${card.detail}`}
              >
                <div className="flex min-w-0 flex-col justify-center">
                  <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700 }}>{card.value}</div>
                  <div className="mt-0.5 truncate text-[11px] text-[#546478]">{card.label}</div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: card.bg, color: card.color }}>
                  <span className="material-icons" style={{ fontSize: "18px" }}>{card.icon}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { value: "4", label: "New prospects",  sub: "last 30 days", change: "+100%", changeUp: true, period: "vs prev. period", data: [2, 3, 2, 4, 3, 5, 4] },
              { value: "1", label: "New contacts",   sub: "last 30 days", change: "+25%",  changeUp: true, period: "vs prev. period", data: [0, 1, 0, 1, 1, 0, 1] },
              { value: "6", label: "Total contacts", sub: "year to date", change: "+50%",  changeUp: true, period: "vs prev. year",   data: [3, 4, 4, 5, 5, 6, 6] },
            ].map(c => <StatCard key={c.label} {...c} />)}

            {/* What's New — QuickBooks integration tile */}
            <div
              className="group relative flex min-h-[56px] min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-[#E5E7EB] px-4 py-3"
              style={{ background: "#1C2B3A", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
            >
              {/* Blur glow ellipses */}
              <div
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  width: 100, height: 100,
                  left: -18, bottom: -56,
                  background: "rgba(129,180,243,0.8)",
                  filter: "blur(57px)",
                }}
              />
              <div
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  width: 100, height: 100,
                  left: 229, bottom: 94,
                  background: "rgba(129,180,243,0.8)",
                  filter: "blur(57px)",
                }}
              />

              <div className="relative flex min-w-0 flex-col justify-center">
                {/* What's New header */}
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-[#81B4F3]" style={{ fontSize: "14px" }}>auto_awesome</span>
                  <span className="truncate text-[18px] leading-tight text-white" style={{ fontWeight: 700 }}>QuickBooks</span>
                </div>

                {/* Title + description */}
                <div className="mt-0.5 truncate text-[11px] text-[#ADB7C7]">Integration available</div>

                {/* Learn more button — right-aligned per Figma (align-items: flex-end on column) */}
              </div>
              <div className="relative shrink-0">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-[#4A6FA5] text-white transition-colors hover:bg-[#3d5a85]"
                  style={{ width: 80, height: 24, minHeight: 24, padding: "3px 8px", fontSize: 12, fontWeight: 500, lineHeight: "16px" }}
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmptyStatePreview && (
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_330px] gap-4">
            <Card className="min-h-[250px] border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
              <div className="grid h-full grid-cols-[minmax(260px,1fr)_310px] items-center gap-6">
                <EmptyStateIllustration />
                <div>
                  <h2 className="text-[25px] leading-8 text-[#111827]" style={{ fontWeight: 760 }}>No clients yet</h2>
                  <p className="mt-2 max-w-[320px] text-[14px] leading-6 text-[#546478]">
                    Add your first client to start tracking contact details, properties, jobs, invoices, and notes.
                  </p>
                  <div className="mt-4 flex flex-col items-start gap-2.5">
                    <CreateActionButton onClick={() => navigate("/clients/new")} className="w-[142px]">
                      Create Client
                    </CreateActionButton>
                    <Button variant="outline" className="h-9 w-[160px] border-[#D8DEE8] bg-white text-[#374151] hover:bg-[#F5F7FA]">
                      <span className="material-icons mr-1.5" style={{ fontSize: "17px" }}>file_upload</span>
                      Import Contacts
                    </Button>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-[12px] text-[#7A8799]">
                    <span className="material-icons" style={{ fontSize: "15px" }}>lock</span>
                    Your data is secure and only visible to your team.
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
                <h3 className="text-[16px] text-[#111827]" style={{ fontWeight: 750 }}>Get started in 4 simple steps</h3>
                <div className="mt-4 space-y-3.5">
                  {[
                    { icon: "group_add", title: "Add your first client", copy: "Create a client profile with contact info." },
                    { icon: "business_center", title: "Create a job", copy: "Schedule and assign work." },
                    { icon: "description", title: "Send an estimate", copy: "Create and send professional estimates." },
                    { icon: "paid", title: "Get paid with an invoice", copy: "Convert jobs to invoices and get paid." },
                  ].map((step, index) => (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FA] text-[#4A6FA5]">
                        <span className="material-icons" style={{ fontSize: "16px" }}>{step.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDF1F6] text-[11px] text-[#6B7280]" style={{ fontWeight: 700 }}>{index + 1}</span>
                          <div className="text-[13px] text-[#111827]" style={{ fontWeight: 700 }}>{step.title}</div>
                        </div>
                        <div className="mt-0.5 text-[12px] leading-4 text-[#6B7280]">{step.copy}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-1.5 text-[13px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>
                  View all guides
                  <span className="material-icons" style={{ fontSize: "15px" }}>arrow_forward</span>
                </button>
              </Card>

              <Card className="border border-[#E1E6EF] bg-white p-5 shadow-[0_8px_22px_rgba(26,35,50,0.035)]">
                <h3 className="text-[16px] text-[#111827]" style={{ fontWeight: 750 }}>Manage clients with ease</h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Centralize all client information",
                    "Track job history and communications",
                    "View billing and payment details",
                    "Stay organized and save time",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 text-[13px] text-[#546478]">
                      <span className="material-icons text-[#16A34A]" style={{ fontSize: "18px" }}>check_circle</span>
                      {item}
                    </div>
                  ))}
                </div>
                <button className="mt-5 flex items-center gap-1.5 text-[13px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>
                  Learn more about clients
                  <span className="material-icons" style={{ fontSize: "15px" }}>arrow_forward</span>
                </button>
              </Card>
            </div>
          </div>
        )}


        {/* ── Advanced Filter Slide-over ── */}
        {filterPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setFilterPanelOpen(false)} />
            <div className="relative bg-white w-[340px] h-full shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
                <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Advanced Filters</h2>
                <button onClick={() => setFilterPanelOpen(false)} className="text-[#546478] hover:text-[#1A2332]">
                  <span className="material-icons" style={{ fontSize: "22px" }}>close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Payment terms */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Payment terms</label>
                  <select value={pendingFilters.paymentTerms} onChange={e => setPendingFilters(p => ({ ...p, paymentTerms: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    {["Due on receipt", "Net 15", "Net 30", "Net 60", "Net 90"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Payment method</label>
                  <select value={pendingFilters.paymentMethod} onChange={e => setPendingFilters(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    {["Cash", "Check", "Credit Card", "ACH", "Wire Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Taxable */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Taxable</label>
                  <select value={pendingFilters.taxable} onChange={e => setPendingFilters(p => ({ ...p, taxable: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Has company */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Has company</label>
                  <select value={pendingFilters.hasCompany} onChange={e => setPendingFilters(p => ({ ...p, hasCompany: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="border-t border-[#E5E7EB] pt-5">
                  <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Date Filters</h3>
                </div>

                {/* Date acquired */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Date acquired</label>
                  <div className="flex gap-2">
                    <input type="date" value={pendingFilters.dateAcquiredFrom} onChange={e => setPendingFilters(p => ({ ...p, dateAcquiredFrom: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <input type="date" value={pendingFilters.dateAcquiredTo} onChange={e => setPendingFilters(p => ({ ...p, dateAcquiredTo: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>

                {/* Last service date */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Last service date</label>
                  <div className="flex gap-2">
                    <input type="date" value={pendingFilters.lastServiceFrom} onChange={e => setPendingFilters(p => ({ ...p, lastServiceFrom: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <input type="date" value={pendingFilters.lastServiceTo} onChange={e => setPendingFilters(p => ({ ...p, lastServiceTo: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] pt-5">
                  <h3 className="text-[13px] text-[#374151] mb-4" style={{ fontWeight: 600 }}>Financial & Location</h3>
                </div>

                {/* Lifetime value */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Lifetime value</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={pendingFilters.lifetimeMin} onChange={e => setPendingFilters(p => ({ ...p, lifetimeMin: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <span className="text-[#546478] text-[13px]">—</span>
                    <input type="number" placeholder="Max" value={pendingFilters.lifetimeMax} onChange={e => setPendingFilters(p => ({ ...p, lifetimeMax: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
                  <input type="text" placeholder="e.g. Tampa, Orlando" value={pendingFilters.city} onChange={e => setPendingFilters(p => ({ ...p, city: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                </div>

                {/* County (dropdown from store) */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>County</label>
                  <select value={pendingFilters.county} onChange={e => setPendingFilters(p => ({ ...p, county: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All counties</option>
                    {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
                <button onClick={handleClearFilters} className="flex-1 h-10 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors" style={{ fontWeight: 500 }}>Clear all</button>
                <button onClick={handleApplyFilters} className="flex-1 h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-lg text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className={showEmptyStatePreview ? "bg-white border border-[#E1E6EF] rounded-xl overflow-hidden shadow-[0_8px_22px_rgba(26,35,50,0.035)]" : "bg-white border border-[#E5E7EB] rounded-xl overflow-hidden"}>
          {/* Filter Bar — hidden when the selection bar is active so it takes its place per Figma */}
          <div className={`${selectedClients.size > 0 ? "hidden " : ""}${showEmptyStatePreview ? "flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#E5E7EB]" : "flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E7EB]"}`}>
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
              <Input type="text" placeholder="Search clients..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 h-8 w-[220px] border-[#E5E7EB] text-[13px] bg-white focus:bg-white" />
            </div>
            <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <div className="flex items-center gap-2">
              <QuickFilterSelect
                prefix="Status:"
                value={qfStatus}
                onChange={v => { setQfStatus(v as "Active" | "Inactive" | "All"); setSelectedClients(new Set()); setCurrentPage(1); }}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "All", label: "All" },
                ]}
              />
              <QuickFilterSelect
                prefix="Date:"
                value={qfDate}
                onChange={v => { setQfDate(v); setCurrentPage(1); }}
                options={[
                  { value: "all_time", label: "All time" },
                  { value: "today",    label: "Today" },
                  { value: "yesterday",label: "Yesterday" },
                  { value: "last_14",  label: "Last 14 days" },
                  { value: "this_month",label: "This month" },
                ]}
              />
              <QuickFilterSelect
                prefix="Balance:"
                value={qfBalance}
                onChange={v => { setQfBalance(v); setCurrentPage(1); }}
                options={[
                  { value: "all",          label: "All" },
                  { value: "with_balance", label: "With balance" },
                  { value: "without_balance", label: "Without balance" },
                ]}
              />
              <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
              <button
                onClick={() => { setPendingFilters({ ...filterState }); setFilterPanelOpen(true); }}
                className={`h-8 px-3 rounded-lg border text-[13px] flex items-center gap-1.5 transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
                    : "border-[#E5E7EB] text-[#546478] hover:bg-[#F5F7FA] hover:border-[#C5CEDD]"
                }`}
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>filter_alt</span>
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-[#4A6FA5] text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            <div className="ml-auto">
              <KebabMenu triggerClassName="w-10 h-10 border border-[#D8DEE8] rounded-xl bg-white">
                {showEmptyStatePreview ? (
                  <KebabItem
                    icon="visibility"
                    onSelect={e => {
                      e.preventDefault();
                      setShowEmptyStatePreview(false);
                      setSelectedClients(new Set());
                      setCurrentPage(1);
                    }}
                  >
                    View contacts
                  </KebabItem>
                ) : (
                  <KebabItem
                    icon="visibility_off"
                    onSelect={e => {
                      e.preventDefault();
                      setShowEmptyStatePreview(true);
                      setSelectedClients(new Set());
                      setCurrentPage(1);
                    }}
                  >
                    Preview empty state
                  </KebabItem>
                )}
                <KebabItem icon="view_column" onSelect={e => { e.preventDefault(); setPendingColumns(new Set(visibleColumns)); setEditColumnsOpen(true); }}>Edit Columns</KebabItem>
                <KebabItem icon="content_copy" onSelect={() => navigate("/clients/duplicates")}>Merge Duplicates</KebabItem>
                <KebabSeparator />
                <KebabItem icon="file_upload">{showEmptyStatePreview ? "Import Contacts" : "Import"}</KebabItem>
                <KebabItem icon="file_download">Export</KebabItem>
              </KebabMenu>
            </div>
          </div>
          <SelectionBar
            count={selectedClients.size}
            onDeselect={() => setSelectedClients(new Set())}
            actions={[
              {
                label: qfStatus === "Inactive" ? "Activate" : "Inactivate",
                icon: qfStatus === "Inactive" ? "check_circle" : "block",
                onClick: () => {
                  const nextStatus = qfStatus === "Inactive" ? "Active" : "Inactive";
                  setClients(prev => prev.map(c => selectedClients.has(c.id) ? { ...c, status: nextStatus } : c));
                  setSelectedClients(new Set());
                },
              },
              { label: "Export selected", icon: "file_download", onClick: () => {} },
            ]}
          />
          <table className="w-full">
            <thead className="bg-[#F5F7FA]">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input ref={headerCheckboxRef} type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)} className="cursor-pointer w-4 h-4 rounded accent-[#4A6FA5]" />
                </th>
                {clientCols.map(col => (
                  <DraggableTh
                    key={col.key}
                    colKey={col.key}
                    onMove={moveClientCol}
                    className={`px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] select-none${col.sortable ? " cursor-pointer" : ""}`}
                    style={{ fontWeight: 600 }}
                    onClick={col.sortable ? () => toggleSort(col.key as SortField) : undefined}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.sortable && <SortIcon field={col.key as SortField} />}
                    </div>
                  </DraggableTh>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={clientCols.length + 2} className={showEmptyStatePreview ? "px-6 py-9" : "px-6 py-14"}>
                    <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
                      <div className={showEmptyStatePreview ? "mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FA] text-[#4A6FA5]" : "mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF3FA] text-[#4A6FA5]"}>
                        <span className="material-icons" style={{ fontSize: showEmptyStatePreview ? "24px" : "28px" }}>person_add</span>
                      </div>
                      <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 750 }}>
                        No clients to display
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-[#6B7280]">
                        Create a client or import your contacts to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedClients.map(client => (
                <tr key={client.id}
                  className={`border-t border-[#E5E7EB] hover:bg-[#F5F7FA] cursor-pointer ${selectedClients.has(client.id) ? "bg-[#EDF5FF]" : ""}`}
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedClients.has(client.id)}
                      onChange={e => handleSelectClient(client.id, e.target.checked)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer w-4 h-4 rounded accent-[#4A6FA5]" />
                  </td>
                  {clientCols.map(col => {
                    switch (col.key) {
                      case "name":
                        return (
                          <td key="name" className="px-4 py-4">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontFamily: "Geist", fontStyle: "normal", fontWeight: 400, lineHeight: "20px" }}>{client.name}</div>
                            {client.company && <div className="text-[12px] text-[#8899AA]">{client.company}</div>}
                          </td>
                        );
                      case "address":
                        return <td key="address" className="px-4 py-4 text-[14px] text-[#546478]">{client.address}</td>;
                      case "totalBilled":
                        return (
                          <td key="totalBilled" className="px-4 py-4">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 400 }}>
                              ${client.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                          </td>
                        );
                      case "lastActivity":
                        return <td key="lastActivity" className="px-4 py-4 text-[14px] text-[#546478]">{client.lastActivity}</td>;
                      default:
                        return null;
                    }
                  })}
                  <td className="px-4 py-4">
                    <KebabMenu>
                      {(client.status ?? "Active") === "Inactive" ? (
                        <KebabItem icon="check_circle" onSelect={e => { e.preventDefault(); setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: "Active" } : c)); }}>Activate</KebabItem>
                      ) : (
                        <KebabItem icon="block" onSelect={e => { e.preventDefault(); setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: "Inactive" } : c)); }}>Inactivate</KebabItem>
                      )}
                      <KebabItem icon="open_in_new" onSelect={e => { e.preventDefault(); window.open(`/clients/${client.id}`, "_blank"); }}>Open in New Tab</KebabItem>
                    </KebabMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Pagination (inside table card, white bg, top divider per Figma) ── */}
          <div className="flex items-center justify-between bg-white px-4 py-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>Rows per page:</span>
              <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-[59px] border-[#E5E7EB] text-[14px] text-[#1A2332]" style={{ fontWeight: 400, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-[14px] text-[#6B7280]" style={{ fontWeight: 400 }}>
                {totalItems === 0 ? "0-0" : `${startIndex + 1}-${endIndex}`} of {totalItems}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>chevron_left</span>
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 transition-colors"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                aria-label="Next page"
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Edit Columns Modal ── */}
        {editColumnsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditColumnsOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-[#E5E7EB]">
                <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>Select columns to view</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  <div className="col-span-2 mb-1">
                    <label className="flex items-center gap-3 py-2 cursor-not-allowed opacity-70">
                      <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-[#4A6FA5] cursor-not-allowed" />
                      <span className="text-[14px] text-[#374151]">Display name</span>
                    </label>
                  </div>
                  <div>{leftCols.map(col => (
                    <label key={col.key} className="flex items-center gap-3 py-2 cursor-pointer hover:text-[#1A2332]">
                      <input type="checkbox" checked={pendingColumns.has(col.key)} onChange={() => { const n = new Set(pendingColumns); n.has(col.key) ? n.delete(col.key) : n.add(col.key); setPendingColumns(n); }} className="w-4 h-4 rounded accent-[#4A6FA5] cursor-pointer" />
                      <span className="text-[14px] text-[#374151]">{col.label}</span>
                    </label>
                  ))}</div>
                  <div>{rightCols.map(col => (
                    <label key={col.key} className="flex items-center gap-3 py-2 cursor-pointer hover:text-[#1A2332]">
                      <input type="checkbox" checked={pendingColumns.has(col.key)} onChange={() => { const n = new Set(pendingColumns); n.has(col.key) ? n.delete(col.key) : n.add(col.key); setPendingColumns(n); }} className="w-4 h-4 rounded accent-[#4A6FA5] cursor-pointer" />
                      <span className="text-[14px] text-[#374151]">{col.label}</span>
                    </label>
                  ))}</div>
                </div>
              </div>
              <div className="px-8 py-5 border-t border-[#E5E7EB] flex justify-end">
                <button onClick={() => { setVisibleColumns(new Set(pendingColumns)); setEditColumnsOpen(false); }} className="px-6 py-2 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[14px] transition-colors" style={{ fontWeight: 500 }}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
    </DndProvider>
  );
}
