import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
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
  status: "Active" | "Archived" | "Prospect";
  lastActivity: string;
  totalJobs: number;
  totalBilled: number;
}

const initialClients: Client[] = [
  { id: "1", initials: "JS", avatarColor: "#4A6FA5", name: "John Smith", company: null, email: "john.smith@email.com", phone: "(555) 123-4567", address: "123 Main St, Austin, TX 78701", tags: ["Residential", "VIP"], status: "Active", lastActivity: "Invoice sent · 2 days ago", totalJobs: 5, totalBilled: 12450.00 },
  { id: "2", initials: "SJ", avatarColor: "#3B82F6", name: "Sarah Johnson", company: null, email: "sarah.j@email.com", phone: "(555) 234-5678", address: "456 Oak Ave, Dallas, TX 75201", tags: ["Commercial"], status: "Prospect", lastActivity: "Estimate sent · 5 days ago", totalJobs: 0, totalBilled: 0 },
  { id: "3", initials: "MD", avatarColor: "#8B5CF6", name: "Mike Davis", company: "Davis Construction", email: "mike@davis.com", phone: "(555) 345-6789", address: "789 Pine Rd, Houston, TX 77001", tags: ["Residential", "Repeat"], status: "Active", lastActivity: "Job completed · 1 week ago", totalJobs: 3, totalBilled: 8750.50 },
  { id: "4", initials: "RL", avatarColor: "#D97706", name: "Robert Lee", company: "Lee & Associates", email: "robert.l@email.com", phone: "(555) 456-7890", address: "321 Elm St, San Antonio, TX 78201", tags: ["Commercial", "New"], status: "Prospect", lastActivity: "Contacted · 3 days ago", totalJobs: 0, totalBilled: 0 },
  { id: "5", initials: "EP", avatarColor: "#10B981", name: "Emily Parker", company: null, email: "e.parker@email.com", phone: "(555) 567-8901", address: "654 Maple Dr, Fort Worth, TX 76101", tags: ["Residential"], status: "Active", lastActivity: "Payment received · 4 days ago", totalJobs: 2, totalBilled: 5320.00 },
  { id: "6", initials: "TC", avatarColor: "#DC2626", name: "Tom Carter", company: null, email: "tom.c@email.com", phone: "(555) 678-9012", address: "987 Cedar Ln, Plano, TX 75023", tags: ["Commercial", "Priority"], status: "Archived", lastActivity: "Quote requested · today", totalJobs: 0, totalBilled: 0 },
];

// Elegant quick-filter select class helper
function qfClass(active: boolean) {
  return `h-8 pl-3 pr-6 border rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none transition-colors ${
    active
      ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
      : "border-[#DDE3EE] text-[#546478] hover:border-[#C5CEDD]"
  }`;
}

export function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Quick filters
  const [qfStatus, setQfStatus] = useState("all");
  const [qfDate, setQfDate] = useState("all_time");
  const [qfBalance, setQfBalance] = useState("all");

  const marketingSources = useSyncExternalStore(marketingSourcesStore.subscribe, marketingSourcesStore.getSources);
  const availableTags = useSyncExternalStore(tagsStore.subscribe, tagsStore.getTags);
  const availableCounties = useSyncExternalStore(countiesStore.subscribe, countiesStore.getCounties);

  type ColKey = "company" | "address" | "mobile" | "email" | "totalBilled" | "status" | "lastActivity" | "tags"
    | "first" | "last" | "role" | "home" | "work" | "notificationsEnabled" | "isContractor"
    | "customerType" | "leadSource" | "dateCreated" | "dateAcquired" | "lastServiceDate" | "lifetimeValue" | "notes";

  const [visibleColumns, setVisibleColumns] = useState<Set<ColKey>>(new Set<ColKey>(["address", "totalBilled", "status", "lastActivity"]));
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
  const [pendingColumns, setPendingColumns] = useState<Set<ColKey>>(new Set<ColKey>(["address", "totalBilled", "status", "lastActivity"]));
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState<"Active" | "Prospect" | "Archived">("Active");

  const handleApplyChangeStatus = () => {
    if (selectedClients.size === 0) { setChangeStatusOpen(false); return; }
    setClients(clients.map(c => selectedClients.has(c.id) ? { ...c, status: newBulkStatus } : c));
    setSelectedClients(new Set());
    setChangeStatusOpen(false);
  };

  const columnDefs: { key: ColKey; label: string }[] = [
    { key: "first", label: "First" }, { key: "last", label: "Last" }, { key: "role", label: "Role" },
    { key: "company", label: "Company" }, { key: "address", label: "Address" }, { key: "mobile", label: "Mobile" },
    { key: "home", label: "Home" }, { key: "work", label: "Work" }, { key: "email", label: "Email" },
    { key: "notificationsEnabled", label: "Notifications enabled" }, { key: "isContractor", label: "Customer is contractor" },
    { key: "customerType", label: "Customer type" }, { key: "leadSource", label: "Lead source" },
    { key: "dateCreated", label: "Date created at" }, { key: "dateAcquired", label: "Date acquired" },
    { key: "lastServiceDate", label: "Last service date" }, { key: "totalBilled", label: "Total Billed" },
    { key: "lifetimeValue", label: "Lifetime value" }, { key: "tags", label: "Tags" },
    { key: "notes", label: "Notes" }, { key: "status", label: "Status" }, { key: "lastActivity", label: "Last Activity" },
  ];
  const leftCols = columnDefs.slice(0, 11);
  const rightCols = columnDefs.slice(11);

  // Sorting
  type SortField = "name" | "phone" | "city" | "zip" | "status" | "lastActivity" | "totalBilled";
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
    membership: "", taxable: "", hasCompany: "",
  });
  const [pendingFilters, setPendingFilters] = useState({ ...filterState });

  const activeFilterCount = Object.entries(filterState).filter(([k, v]) => {
    if (k === "tags") return Array.isArray(v) && v.length > 0;
    return v !== "";
  }).length;

  const handleApplyFilters = () => { setFilterState({ ...pendingFilters }); setFilterPanelOpen(false); setCurrentPage(1); };
  const handleClearFilters = () => {
    const empty = { dateAcquiredFrom: "", dateAcquiredTo: "", lastServiceFrom: "", lastServiceTo: "", lifetimeMin: "", lifetimeMax: "", leadSource: "", customerType: "", city: "", county: "", tags: [] as string[], paymentTerms: "", paymentMethod: "", membership: "", taxable: "", hasCompany: "" };
    setPendingFilters(empty); setFilterState(empty); setFilterPanelOpen(false); setCurrentPage(1);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) || client.address.toLowerCase().includes(searchQuery.toLowerCase());

    // Quick filters
    let matchesQfStatus = true;
    if (qfStatus === "active") matchesQfStatus = client.status === "Active";
    else if (qfStatus === "prospect") matchesQfStatus = client.status === "Prospect";
    else if (qfStatus === "archived") matchesQfStatus = client.status === "Archived";

    const matchesQfBalance = qfBalance === "with_balance" ? client.totalBilled > 0 : true;

    // Advanced filters
    const matchesCustomerType = !filterState.customerType || (filterState.customerType === "residential" ? client.tags.includes("Residential") : client.tags.includes("Commercial"));
    const matchesTags = filterState.tags.length === 0 || filterState.tags.some(t => client.tags.includes(t));
    const matchesLeadSource = !filterState.leadSource || client.tags.includes(filterState.leadSource);
    const matchesMembership = !filterState.membership || (filterState.membership === "has-membership" ? !!client.company : !client.company);
    const matchesHasCompany = !filterState.hasCompany || (filterState.hasCompany === "yes" ? !!client.company : !client.company);
    let matchesLifetime = true;
    if (filterState.lifetimeMin !== "") matchesLifetime = client.totalBilled >= Number(filterState.lifetimeMin);
    if (filterState.lifetimeMax !== "") matchesLifetime = matchesLifetime && client.totalBilled <= Number(filterState.lifetimeMax);
    const matchesCity = !filterState.city || client.address.toLowerCase().includes(filterState.city.toLowerCase());

    return matchesSearch && matchesQfStatus && matchesQfBalance && matchesCustomerType && matchesTags && matchesLeadSource && matchesMembership && matchesHasCompany && matchesLifetime && matchesCity;
  });

  // Sort
  const sortedClients = [...filteredClients].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    if (sortField === "totalBilled") return (a.totalBilled - b.totalBilled) * dir;
    if (sortField === "lastActivity") return a.lastActivity.localeCompare(b.lastActivity) * dir;
    return 0;
  });

  const totalItems = sortedClients.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  const allSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedClients.has(c.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedClients(new Set(filteredClients.map(c => c.id)));
    else setSelectedClients(new Set());
  };
  const handleSelectClient = (id: string, checked: boolean) => {
    const s = new Set(selectedClients);
    checked ? s.add(id) : s.delete(id);
    setSelectedClients(s);
  };

  const handleArchiveClient = (client: Client) => setClients(clients.map(c => c.id === client.id ? { ...c, status: "Archived" as const } : c));
  const handleUnarchiveClient = (client: Client) => setClients(clients.map(c => c.id === client.id ? { ...c, status: "Active" as const } : c));
  const handleDeleteClient = (client: Client) => {
    if (window.confirm(`Delete client "${client.name}"?`)) setClients(clients.filter(c => c.id !== client.id));
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="material-icons text-[#9AA3AF] ml-0.5" style={{ fontSize: "14px" }}>
      {sortField === field ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  const Sparkline = ({ data, color = "#4A6FA5" }: { data: number[]; color?: string }) => {
    const w = 72, h = 24, pad = 2;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(" ");
    const area = `M${pts.split(" ")[0]} L${pts} L${w - pad},${h} L${pad},${h} Z`;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <path d={`M${pts}`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={area} fill={color} fillOpacity="0.08" />
      </svg>
    );
  };

  return (
    <>
      <div className="p-8">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[26px] text-[#1A2332] flex items-center gap-2" style={{ fontWeight: 700 }}>
            Clients
            <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
              ({selectedClients.size > 0 ? `${filteredClients.length} records · ${selectedClients.size} selected` : `${filteredClients.length} records`})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/clients/new")} className="bg-[#4A6FA5] hover:bg-[#3d5a85]">
              <span className="material-icons mr-1.5" style={{ fontSize: "18px" }}>add</span>
              Create Client
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 flex items-center justify-center border border-[#DDE3EE] rounded-lg bg-white text-[#546478] hover:bg-[#EDF0F5] transition-colors">
                  <span className="material-icons" style={{ fontSize: "20px" }}>more_vert</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[210px]">
                <DropdownMenuItem className="cursor-pointer" onSelect={e => { e.preventDefault(); setPendingColumns(new Set(visibleColumns)); setEditColumnsOpen(true); }}>
                  <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>view_column</span>Edit Columns
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={e => { e.preventDefault(); setChangeStatusOpen(true); }}>
                  <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>swap_horiz</span>Change Status
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate("/clients/duplicates")}>
                  <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>content_copy</span>Manage Duplicates
                </DropdownMenuItem>
                {selectedClients.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => {
                      setClients(clients.map(c => selectedClients.has(c.id) ? { ...c, status: "Archived" as const } : c));
                      setSelectedClients(new Set());
                    }}>
                      <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>archive</span>Archive Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => setSelectedClients(new Set())}>
                      <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>deselect</span>Deselect All
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>file_upload</span>Import
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>file_download</span>Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>4</div>
                <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>New prospects</div>
                <div className="text-[11px] text-[#546478]">last 30 days</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                    <span className="material-icons leading-none" style={{ fontSize: "14px" }}>trending_up</span>+100%
                  </span>
                  <span className="text-[11px] text-[#546478]">vs prev. period</span>
                </div>
              </div>
              <Sparkline data={[2, 3, 2, 4, 3, 5, 4]} color="#4A6FA5" />
            </div>
          </Card>
          <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>1</div>
                <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>New contacts</div>
                <div className="text-[11px] text-[#546478]">last 30 days</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                    <span className="material-icons leading-none" style={{ fontSize: "14px" }}>trending_up</span>+25%
                  </span>
                  <span className="text-[11px] text-[#546478]">vs prev. period</span>
                </div>
              </div>
              <Sparkline data={[0, 1, 0, 1, 1, 0, 1]} color="#4A6FA5" />
            </div>
          </Card>
          <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>6</div>
                <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>Total contacts</div>
                <div className="text-[11px] text-[#546478]">year to date</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                    <span className="material-icons leading-none" style={{ fontSize: "14px" }}>trending_up</span>+50%
                  </span>
                  <span className="text-[11px] text-[#546478]">vs prev. year</span>
                </div>
              </div>
              <Sparkline data={[3, 4, 4, 5, 5, 6, 6]} color="#4A6FA5" />
            </div>
          </Card>
          <Card className="px-4 py-3 border border-[#DDE3EE] bg-gradient-to-br from-[#1A2332] to-[#2a3a50] hover:shadow-sm transition-shadow cursor-pointer group overflow-hidden h-[110.5px]">
            <div className="flex flex-col h-full justify-center items-start text-left gap-0.5">
              <div className="flex items-center gap-1">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "12px" }}>auto_awesome</span>
                <span className="text-[9px] text-[#4A6FA5] uppercase tracking-wide" style={{ fontWeight: 600 }}>What's New</span>
              </div>
              <div className="text-[12px] text-white leading-tight" style={{ fontWeight: 600 }}>Integration with QuickBooks Online</div>
              <p className="text-[11px] text-[#8899AA] leading-snug">Sync your clients, invoices, and payments automatically.</p>
              <div className="flex items-center gap-0.5 text-[#4A6FA5] group-hover:text-[#6b8fc0] transition-colors mt-0.5">
                <span className="text-[10px]" style={{ fontWeight: 600 }}>Learn more</span>
                <span className="material-icons" style={{ fontSize: "12px" }}>arrow_forward</span>
              </div>
            </div>
          </Card>
        </div>


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
                {/* Customer type */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Customer type</label>
                  <select value={pendingFilters.customerType} onChange={e => setPendingFilters(p => ({ ...p, customerType: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                {/* Tags (checkboxes — multi-select) */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Tags</label>
                  <div className="border border-[#D1D5DB] rounded-md p-2 max-h-[180px] overflow-y-auto bg-white">
                    {availableTags.length === 0 ? (
                      <div className="text-[13px] text-[#9CA3AF] text-center py-2">No tags</div>
                    ) : availableTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F7FA] p-2 rounded">
                        <input type="checkbox" checked={pendingFilters.tags.includes(tag)}
                          onChange={e => setPendingFilters(p => ({ ...p, tags: e.target.checked ? [...p.tags, tag] : p.tags.filter(t => t !== tag) }))}
                          className="w-4 h-4 accent-[#4A6FA5]" />
                        <span className="text-[13px] text-[#374151]">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Lead source */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Lead source</label>
                  <select value={pendingFilters.leadSource} onChange={e => setPendingFilters(p => ({ ...p, leadSource: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    {marketingSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Payment terms */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Payment terms</label>
                  <select value={pendingFilters.paymentTerms} onChange={e => setPendingFilters(p => ({ ...p, paymentTerms: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    {["Due on receipt", "Net 15", "Net 30", "Net 60", "Net 90"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Payment method</label>
                  <select value={pendingFilters.paymentMethod} onChange={e => setPendingFilters(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    {["Cash", "Check", "Credit Card", "ACH", "Wire Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Membership */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Membership</label>
                  <select value={pendingFilters.membership} onChange={e => setPendingFilters(p => ({ ...p, membership: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    <option value="has-membership">Has Membership</option>
                    <option value="no-membership">No Membership</option>
                    {["Bronze", "Silver", "Gold", "Platinum"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Taxable */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Taxable</label>
                  <select value={pendingFilters.taxable} onChange={e => setPendingFilters(p => ({ ...p, taxable: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Has company */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Has company</label>
                  <select value={pendingFilters.hasCompany} onChange={e => setPendingFilters(p => ({ ...p, hasCompany: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
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
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <input type="date" value={pendingFilters.dateAcquiredTo} onChange={e => setPendingFilters(p => ({ ...p, dateAcquiredTo: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>

                {/* Last service date */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Last service date</label>
                  <div className="flex gap-2">
                    <input type="date" value={pendingFilters.lastServiceFrom} onChange={e => setPendingFilters(p => ({ ...p, lastServiceFrom: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <input type="date" value={pendingFilters.lastServiceTo} onChange={e => setPendingFilters(p => ({ ...p, lastServiceTo: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
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
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                    <span className="text-[#546478] text-[13px]">—</span>
                    <input type="number" placeholder="Max" value={pendingFilters.lifetimeMax} onChange={e => setPendingFilters(p => ({ ...p, lifetimeMax: e.target.value }))}
                      className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
                  <input type="text" placeholder="e.g. Tampa, Orlando" value={pendingFilters.city} onChange={e => setPendingFilters(p => ({ ...p, city: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]" />
                </div>

                {/* County (dropdown from store) */}
                <div>
                  <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>County</label>
                  <select value={pendingFilters.county} onChange={e => setPendingFilters(p => ({ ...p, county: e.target.value }))}
                    className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">All counties</option>
                    {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
                <button onClick={handleClearFilters} className="flex-1 h-10 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors" style={{ fontWeight: 500 }}>Clear all</button>
                <button onClick={handleApplyFilters} className="flex-1 h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-lg text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
          {/* Filter Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#DDE3EE]">
            <div className="flex items-center gap-2">
              <select
                value={qfStatus}
                onChange={e => { setQfStatus(e.target.value); setCurrentPage(1); }}
                className={qfClass(qfStatus !== "all")}
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={qfDate}
                onChange={e => { setQfDate(e.target.value); setCurrentPage(1); }}
                className={qfClass(qfDate !== "all_time")}
              >
                <option value="all_time">Date: All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_14">Last 14 days</option>
                <option value="this_month">This month</option>
              </select>
              <select
                value={qfBalance}
                onChange={e => { setQfBalance(e.target.value); setCurrentPage(1); }}
                className={qfClass(qfBalance !== "all")}
              >
                <option value="all">Balance: All</option>
                <option value="with_balance">With balance</option>
              </select>
              <div className="w-px h-5 bg-[#DDE3EE] mx-1" />
              <button
                onClick={() => { setPendingFilters({ ...filterState }); setFilterPanelOpen(true); }}
                className={`h-8 px-3 rounded-lg border text-[13px] flex items-center gap-1.5 transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#4A6FA5] text-[#4A6FA5] bg-[#EEF3FA]"
                    : "border-[#DDE3EE] text-[#546478] hover:bg-[#F5F7FA] hover:border-[#C5CEDD]"
                }`}
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>tune</span>
                Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-[#4A6FA5] text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" style={{ fontSize: "16px" }}>search</span>
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 h-8 w-[220px] border-[#DDE3EE] text-[13px] bg-white focus:bg-white"
              />
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-[#F5F7FA]">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)} className="cursor-pointer w-4 h-4 rounded border-[#DDE3EE]" />
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("name")}>
                  <div className="flex items-center">Name <SortIcon field="name" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Address</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("totalBilled")}>
                  <div className="flex items-center">Total Billed <SortIcon field="totalBilled" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("status")}>
                  <div className="flex items-center">Status <SortIcon field="status" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-[#546478] cursor-pointer select-none" style={{ fontWeight: 600 }} onClick={() => toggleSort("lastActivity")}>
                  <div className="flex items-center">Last Activity <SortIcon field="lastActivity" /></div>
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map(client => (
                <tr key={client.id}
                  className={`border-t border-[#DDE3EE] hover:bg-[#F5F7FA] cursor-pointer ${selectedClients.has(client.id) ? "bg-[#EDF5FF]" : ""}`}
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedClients.has(client.id)}
                      onChange={e => handleSelectClient(client.id, e.target.checked)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer w-4 h-4 rounded border-[#DDE3EE]" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{client.name}</div>
                    {client.company && <div className="text-[12px] text-[#8899AA]">{client.company}</div>}
                  </td>
                  <td className="px-4 py-4 text-[14px] text-[#546478]">{client.address}</td>
                  <td className="px-4 py-4">
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                      ${client.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] inline-flex items-center ${
                      client.status === "Active" ? "bg-[#DCFCE7] text-[#16A34A]" :
                      client.status === "Prospect" ? "bg-[#DBEAFE] text-[#2563EB]" :
                      "bg-[#F3F4F6] text-[#6B7280]"
                    }`} style={{ fontWeight: 500 }}>{client.status}</span>
                  </td>
                  <td className="px-4 py-4 text-[14px] text-[#546478]">{client.lastActivity}</td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-[#EDF0F5] rounded transition-colors" onClick={e => e.stopPropagation()}>
                          <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>more_vert</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        {client.status === "Active" ? (
                          <DropdownMenuItem className="cursor-pointer" onSelect={e => { e.preventDefault(); handleArchiveClient(client); }}>
                            <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>archive</span>Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="cursor-pointer" onSelect={e => { e.preventDefault(); handleUnarchiveClient(client); }}>
                            <span className="material-icons mr-2 text-[#546478]" style={{ fontSize: "18px" }}>unarchive</span>Unarchive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onSelect={e => { e.preventDefault(); window.open(`/clients/${client.id}`, "_blank"); }}>
                          <span className="text-[#1F2937]">Open in New Tab</span>
                          <span className="material-icons ml-auto text-[#6B7280]" style={{ fontSize: "18px" }}>open_in_new</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-[#DC2626]" onSelect={e => { e.preventDefault(); handleDeleteClient(client); }}>
                          <span className="material-icons mr-2" style={{ fontSize: "18px" }}>delete_outline</span>Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#546478]">Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-[70px] border-[#DDE3EE] text-[13px]" style={{ fontWeight: 500 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[13px] text-[#546478] ml-4">
              {totalItems === 0 ? "0-0" : `${startIndex + 1}-${endIndex}`} of {totalItems}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
            </button>
            <button className="p-1.5 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>
              <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
            </button>
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

        {/* ── Change Status Modal ── */}
        {changeStatusOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setChangeStatusOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[400px]">
              <div className="px-7 pt-7 pb-5 border-b border-[#E5E7EB]">
                <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Change Status</h2>
                <p className="text-[13px] text-[#546478] mt-1">
                  {selectedClients.size > 0 ? `Apply new status to ${selectedClients.size} selected client${selectedClients.size > 1 ? "s" : ""}.` : "Select clients in the table first, then use this to bulk-update their status."}
                </p>
              </div>
              <div className="px-7 py-6 space-y-3">
                {(["Active", "Prospect", "Archived"] as const).map(s => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-transparent hover:border-[#DDE3EE] hover:bg-[#F9FAFB] transition-colors">
                    <input type="radio" name="bulkStatus" value={s} checked={newBulkStatus === s} onChange={() => setNewBulkStatus(s)} className="w-4 h-4 accent-[#4A6FA5] cursor-pointer" />
                    <span className="text-[14px] text-[#1A2332]">{s}</span>
                    <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] ${s === "Active" ? "bg-[#DCFCE7] text-[#16A34A]" : s === "Prospect" ? "bg-[#DBEAFE] text-[#2563EB]" : "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>{s}</span>
                  </label>
                ))}
              </div>
              <div className="px-7 pb-7 flex items-center gap-3">
                <button onClick={() => setChangeStatusOpen(false)} className="flex-1 h-10 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
                <button onClick={handleApplyChangeStatus} disabled={selectedClients.size === 0} className="flex-1 h-10 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
