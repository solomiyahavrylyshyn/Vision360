import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";
import { MessagingCenter } from "./MessagingCenter";
import { AiAssistant } from "./AiAssistant";
import { Dialer } from "./Dialer";
import { HelpCenter } from "./HelpCenter";

const navItems = [
  { to: "/", icon: "visibility", label: "Dashboard" },
  { to: "/calendar", icon: "calendar_today", label: "Calendar" },
  { to: "/clients", icon: "people", label: "Clients" },
  { to: "/appointments", icon: "event", label: "Appointments" },
  { to: "/jobs", icon: "work", label: "Jobs" },
  { to: "/estimates", icon: "description", label: "Estimates" },
  { to: "/invoices", icon: "receipt", label: "Invoices" },
  { to: "/payments", icon: "credit_card", label: "Payments" },
  { to: "/expenses", icon: "attach_money", label: "Expenses" },
  { to: "/items", icon: "inventory_2", label: "Items" },
  { to: "/accounting", icon: "account_balance", label: "Accounting" },
  { to: "/marketing", icon: "campaign", label: "Marketing" },
  { to: "/reports", icon: "bar_chart", label: "Reports" },
];

export function Layout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchFilterOpen, setSearchFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("All");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userAvatarRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock search data
  const mockSearchData = {
    clients: [
      { id: 1, name: "John Smith", email: "john@example.com", phone: "(555) 123-4567", address: "123 Main St, Boston, MA" },
      { id: 2, name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 234-5678", address: "456 Oak Ave, Cambridge, MA" },
      { id: 3, name: "Mike Wilson", email: "mike@example.com", phone: "(555) 345-6789", address: "789 Elm St, Newton, MA" },
    ],
    jobs: [
      { id: 1, title: "Plumbing Repair", client: "John Smith", status: "Scheduled", date: "Apr 5, 2026", jobNumber: "#J-1234" },
      { id: 2, title: "HVAC Installation", client: "Sarah Johnson", status: "In Progress", date: "Apr 3, 2026", jobNumber: "#J-1235" },
      { id: 3, title: "Electrical Inspection", client: "Mike Wilson", status: "Completed", date: "Apr 1, 2026", jobNumber: "#J-1236" },
    ],
    invoices: [
      { id: 1, number: "#INV-1001", client: "John Smith", amount: "$450.00", status: "Paid", date: "Mar 28, 2026" },
      { id: 2, number: "#INV-1002", client: "Sarah Johnson", amount: "$1,250.00", status: "Pending", date: "Apr 1, 2026" },
    ],
    estimates: [
      { id: 1, number: "#EST-2001", client: "Mike Wilson", amount: "$3,200.00", status: "Sent", date: "Apr 2, 2026" },
    ],
  };

  const getFilteredResults = () => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    if (searchFilter === "All" || searchFilter === "Clients") {
      mockSearchData.clients
        .filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
        .forEach(c => results.push({ type: "client", data: c }));
    }

    if (searchFilter === "All" || searchFilter === "Jobs") {
      mockSearchData.jobs
        .filter(j => j.title.toLowerCase().includes(query) || j.jobNumber.toLowerCase().includes(query))
        .forEach(j => results.push({ type: "job", data: j }));
    }

    if (searchFilter === "All" || searchFilter === "Invoices") {
      mockSearchData.invoices
        .filter(i => i.number.toLowerCase().includes(query) || i.client.toLowerCase().includes(query))
        .forEach(i => results.push({ type: "invoice", data: i }));
    }

    if (searchFilter === "All" || searchFilter === "Estimates") {
      mockSearchData.estimates
        .filter(e => e.number.toLowerCase().includes(query) || e.client.toLowerCase().includes(query))
        .forEach(e => results.push({ type: "estimate", data: e }));
    }

    return results;
  };

  const filteredResults = getFilteredResults();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
          userAvatarRef.current && !userAvatarRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (createMenuOpen && createMenuRef.current && !createMenuRef.current.contains(event.target as Node) &&
          createBtnRef.current && !createBtnRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (globalSearchOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setGlobalSearchOpen(false);
        setSearchFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, createMenuOpen, globalSearchOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ctrl + / to open search
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        setGlobalSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Also support Cmd/Ctrl + K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setGlobalSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // ESC to close search
      if (event.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
        setSearchQuery("");
        setSelectedSearchIndex(0);
      }

      // Arrow navigation in search results
      if (globalSearchOpen && filteredResults.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedSearchIndex(prev => (prev + 1) % filteredResults.length);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedSearchIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
        } else if (event.key === 'Enter' && selectedSearchIndex >= 0) {
          event.preventDefault();
          handleResultClick(filteredResults[selectedSearchIndex]);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, filteredResults, selectedSearchIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [searchQuery, searchFilter]);

  const handleResultClick = (result: any) => {
    setGlobalSearchOpen(false);
    setSearchQuery("");
    setSelectedSearchIndex(0);

    switch (result.type) {
      case "client":
        navigate(`/clients/${result.data.id}`);
        break;
      case "job":
        navigate(`/jobs/${result.data.id}`);
        break;
      case "invoice":
        navigate(`/invoices/${result.data.id}`);
        break;
      case "estimate":
        navigate(`/estimates/${result.data.id}`);
        break;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FA]">
      {/* Full Width Header */}
      <div className="h-16 bg-white border-b border-[#DDE3EE] flex items-center gap-6 px-6 flex-shrink-0">
        {/* Logo - Left Side */}
        <div className="flex items-center gap-2.5 flex-shrink-0 -ml-10">
          <img
            src={logoImg}
            alt="Vision360 Logo"
            className="h-40 w-[234px] object-contain"
          />
        </div>

        {/* Global Search - Center (Flex-1 for expansion) */}
        <div className="flex-1 flex items-center justify-center">
          <div ref={searchRef} className="w-full max-w-[600px] relative">
          {/* Search Trigger Button */}
          {!globalSearchOpen && (
            <button
              onClick={() => {
                setGlobalSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-full h-9 flex items-center gap-2.5 px-3.5 border border-[#E5E7EB] rounded-lg bg-white hover:border-[#B0BEC5] transition-all cursor-text"
            >
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
              <span className="text-[13px] text-[#9CA3AF] flex-1 text-left">Search customers, jobs, invoices...</span>
              <span className="text-[11px] text-[#9CA3AF] border border-[#E5E7EB] rounded px-1.5 py-0.5">⌘K</span>
            </button>
          )}

          {/* Opened Search Dropdown */}
          {globalSearchOpen && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] bg-white border border-[#DDE3EE] rounded-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2)] z-[2000] overflow-hidden">
              {/* Search Input Row */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E5E7EB]">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search customers, jobs, invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setGlobalSearchOpen(false);
                    setSearchQuery("");
                    setSearchFilterOpen(false);
                  }}
                  className="text-[11px] text-[#9CA3AF] border border-[#E5E7EB] rounded px-1.5 py-0.5 hover:bg-[#F3F4F6] transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Two-column body: Results (left) + Filter (right) */}
              <div className="flex" style={{ maxHeight: "460px" }}>
                {/* LEFT — Results */}
                <div className="flex-1 overflow-y-auto border-r border-[#E5E7EB]">
                  {/* Default state: show recent/all grouped */}
                  {!searchQuery && (
                    <div>
                      <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#F3F4F6]">
                        <span className="text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>Recent</span>
                      </div>
                      {/* Show some default recent items */}
                      {mockSearchData.clients.slice(0, 2).map((c) => (
                        <button
                          key={`c-${c.id}`}
                          onClick={() => { handleResultClick({ type: "client", data: c }); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F7FA] transition-colors text-left"
                        >
                          <span className="material-icons text-[#3B82F6]" style={{ fontSize: "18px" }}>person</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[#1F2937]" style={{ fontWeight: 500 }}>{c.name}</div>
                            <div className="text-[11px] text-[#6B7280]">{c.email}</div>
                          </div>
                        </button>
                      ))}
                      {mockSearchData.jobs.slice(0, 2).map((j) => (
                        <button
                          key={`j-${j.id}`}
                          onClick={() => { handleResultClick({ type: "job", data: j }); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F7FA] transition-colors text-left"
                        >
                          <span className="material-icons text-[#F59E0B]" style={{ fontSize: "18px" }}>work</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[#1F2937]" style={{ fontWeight: 500 }}>{j.title}</div>
                            <div className="text-[11px] text-[#6B7280]">{j.jobNumber} · {j.client} · {j.status}</div>
                          </div>
                        </button>
                      ))}
                      {mockSearchData.invoices.slice(0, 2).map((i) => (
                        <button
                          key={`i-${i.id}`}
                          onClick={() => { handleResultClick({ type: "invoice", data: i }); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F7FA] transition-colors text-left"
                        >
                          <span className="material-icons text-[#10B981]" style={{ fontSize: "18px" }}>receipt</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[#1F2937]" style={{ fontWeight: 500 }}>{i.number}</div>
                            <div className="text-[11px] text-[#6B7280]">{i.client} · {i.amount} · {i.status}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search results */}
                  {searchQuery && filteredResults.length > 0 && (
                    <div>
                      {["client", "job", "invoice", "estimate"].map((type) => {
                        const typeResults = filteredResults.filter(r => r.type === type);
                        if (typeResults.length === 0) return null;
                        const typeLabels: Record<string, string> = { client: "Customers", job: "Jobs", invoice: "Invoices", estimate: "Estimates" };
                        const typeIcons: Record<string, { icon: string; color: string }> = {
                          client: { icon: "person", color: "#3B82F6" },
                          job: { icon: "work", color: "#F59E0B" },
                          invoice: { icon: "receipt", color: "#10B981" },
                          estimate: { icon: "description", color: "#6366F1" },
                        };

                        return (
                          <div key={type}>
                            <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#F3F4F6]">
                              <span className="text-[11px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>
                                {typeLabels[type]}
                              </span>
                            </div>
                            {typeResults.map((result) => {
                              const globalIndex = filteredResults.findIndex(r => r === result);
                              const isSelected = globalIndex === selectedSearchIndex;
                              const { icon, color } = typeIcons[type];

                              return (
                                <button
                                  key={`${result.type}-${result.data.id}`}
                                  onClick={() => handleResultClick(result)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                                    isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#F5F7FA]"
                                  }`}
                                >
                                  <span className="material-icons" style={{ fontSize: "18px", color }}>{icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[13px] text-[#1F2937]" style={{ fontWeight: 500 }}>
                                      {result.data.name || result.data.title || result.data.number}
                                    </div>
                                    <div className="text-[11px] text-[#6B7280] truncate">
                                      {result.data.address || (result.data.jobNumber ? `${result.data.jobNumber} · ${result.data.client}` : `${result.data.client} · ${result.data.amount}`)}
                                    </div>
                                  </div>
                                  {(result.data.status) && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      result.data.status === "Paid" || result.data.status === "Completed" ? "bg-[#DCFCE7] text-[#16A34A]"
                                      : result.data.status === "Pending" || result.data.status === "Scheduled" ? "bg-[#FEF3C7] text-[#D97706]"
                                      : "bg-[#EFF6FF] text-[#3B82F6]"
                                    }`} style={{ fontWeight: 600 }}>
                                      {result.data.status}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {searchQuery && filteredResults.length === 0 && (
                    <div className="px-4 py-12 text-center">
                      <span className="material-icons text-[#D1D5DB] mb-2" style={{ fontSize: "40px" }}>search_off</span>
                      <div className="text-[14px] text-[#111827] mb-0.5" style={{ fontWeight: 600 }}>No results found</div>
                      <div className="text-[12px] text-[#6B7280]">Try a different search term or filter</div>
                    </div>
                  )}
                </div>

                {/* RIGHT — Filter Panel */}
                <div className="w-[200px] flex-shrink-0 overflow-y-auto p-4 bg-[#FAFBFC]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-[#8899AA] uppercase tracking-wider" style={{ fontWeight: 600 }}>Filter by</span>
                    {searchFilter !== "All" && (
                      <button
                        onClick={() => setSearchFilter("All")}
                        className="text-[11px] text-[#DC2626] hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {["All", "Clients", "Jobs", "Invoices", "Estimates"].map((filter) => {
                      const filterIcons: Record<string, string> = {
                        All: "apps",
                        Clients: "person",
                        Jobs: "work",
                        Invoices: "receipt",
                        Estimates: "description",
                      };
                      return (
                        <button
                          key={filter}
                          onClick={() => setSearchFilter(filter)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors ${
                            searchFilter === filter
                              ? "bg-[#4A6FA5]/10 text-[#4A6FA5]"
                              : "text-[#374151] hover:bg-white"
                          }`}
                          style={{ fontWeight: searchFilter === filter ? 600 : 400 }}
                        >
                          <span className="material-icons" style={{ fontSize: "16px" }}>{filterIcons[filter]}</span>
                          {filter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Keyboard hints */}
                  <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9CA3AF] border border-[#E5E7EB] bg-white rounded px-1.5 py-0.5">↑↓</span>
                        <span className="text-[11px] text-[#8899AA]">Navigate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9CA3AF] border border-[#E5E7EB] bg-white rounded px-1.5 py-0.5">↵</span>
                        <span className="text-[11px] text-[#8899AA]">Open</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9CA3AF] border border-[#E5E7EB] bg-white rounded px-1.5 py-0.5">esc</span>
                        <span className="text-[11px] text-[#8899AA]">Close</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            title="AI Assistant"
            onClick={() => setAiAssistantOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "19px" }}>auto_awesome</span>
          </button>
          <button
            title="Phone / Dialer"
            onClick={() => setDialerOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "19px" }}>phone</span>
          </button>
          <button
            title="Messages"
            onClick={() => setMessagingOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "19px" }}>chat</span>
          </button>
          <button
            title="Help Center"
            onClick={() => setHelpCenterOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "19px" }}>help_outline</span>
          </button>
          <button
            title="Settings"
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "19px" }}>settings</span>
          </button>
          <button
            ref={userAvatarRef}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title="Marek Stroz"
            className="w-8 h-8 bg-[#4A6FA5] rounded-full flex items-center justify-center text-white text-[12px] font-semibold ml-2 hover:shadow-[0_0_0_2px_rgba(74,111,165,0.2)] transition-shadow cursor-pointer"
          >
            M
          </button>
        </div>
      </div>

      {/* Sidebar + Content Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Expandable Sidebar */}
        <aside
          className={`bg-[#1C2B3A] border-r border-[rgba(255,255,255,0.06)] flex flex-col pb-2 transition-all duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarCollapsed ? "w-[72px]" : "w-[200px]"
          }`}
          style={{ flexShrink: 0, overflowX: "hidden", overflowY: "visible" }}
        >
        {/* Navigation */}
        <div className="pt-2"></div>
        <nav className={`flex-1 flex flex-col gap-0 ${sidebarCollapsed ? "px-0 items-center" : "px-2"}`}>
          {/* Create Button */}
          <button
            ref={createBtnRef}
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className={`rounded-[7px] flex relative whitespace-nowrap transition-all duration-150 mb-0.5 ${
              sidebarCollapsed
                ? "w-[60px] h-[44px] flex-col items-center justify-center px-1 py-1 gap-0.5"
                : "h-[38px] flex-row items-center w-full justify-start px-2.5 gap-2.5"
            } text-[rgba(255,255,255,0.82)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(255,255,255,0.95)]`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons flex-shrink-0 text-[rgba(255,255,255,0.55)]" style={{ fontSize: "20px" }}>add_circle_outline</span>
            <span
              className={`transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                sidebarCollapsed ? "text-[9px] leading-tight text-center max-w-[58px]" : "text-[13px] max-w-[130px]"
              }`}
            >
              Create
            </span>
          </button>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-[7px] flex relative whitespace-nowrap transition-all duration-150 ${
                  sidebarCollapsed
                    ? "w-[60px] h-[44px] flex-col items-center justify-center px-1 py-1 gap-0.5"
                    : "h-[38px] flex-row items-center w-full justify-start px-2.5 gap-2.5"
                } ${
                  isActive
                    ? "text-[#82B4F4] bg-[rgba(74,111,165,0.22)]"
                    : "text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(255,255,255,0.9)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#4A6FA5] rounded-r"></div>
                  )}
                  <span className="material-icons flex-shrink-0" style={{ fontSize: "20px" }}>{item.icon}</span>
                  <span
                    className={`transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      sidebarCollapsed ? "text-[9px] leading-tight text-center max-w-[58px]" : "text-[13px] max-w-[130px]"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`rounded-[7px] flex border-t border-[rgba(255,255,255,0.07)] pt-1.5 mt-auto flex-shrink-0 whitespace-nowrap transition-all duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(255,255,255,0.85)] ${
            sidebarCollapsed
              ? "w-[60px] h-[44px] flex-col items-center justify-center px-1 py-1 gap-0.5 mx-auto my-1"
              : "h-9 flex-row items-center w-[calc(100%-16px)] justify-start px-2.5 gap-2.5 mx-2 my-1.5"
          }`}
        >
          <span
            className="material-icons flex-shrink-0 transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              fontSize: "18px",
              transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)"
            }}
          >
            chevron_left
          </span>
          <span
            className={`transition-all duration-100 ${
              sidebarCollapsed ? "text-[9px] leading-tight text-center max-w-[58px]" : "text-xs max-w-[130px]"
            }`}
            style={{ fontWeight: 500 }}
          >
            Collapse
          </span>
        </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Create Dropdown */}
      <div
        ref={createMenuRef}
        className={`fixed w-[240px] bg-white border border-[#DDE3EE] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[1100] transition-all duration-[140ms] ease-out ${
          createMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          left: sidebarCollapsed ? "72px" : "216px",
          top: "80px",
          transformOrigin: "top left"
        }}
      >
        <div className="py-2">
          <button onClick={() => { setCreateMenuOpen(false); navigate("/estimates/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>description</span>
            </div>
            <span style={{ fontWeight: 500 }}>Estimate</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/invoices/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>receipt</span>
            </div>
            <span style={{ fontWeight: 500 }}>Invoice</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/jobs/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>work</span>
            </div>
            <span style={{ fontWeight: 500 }}>Job</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/appointments/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>event</span>
            </div>
            <span style={{ fontWeight: 500 }}>Appointment</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/clients/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>person_add</span>
            </div>
            <span style={{ fontWeight: 500 }}>Client</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/items"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>inventory_2</span>
            </div>
            <span style={{ fontWeight: 500 }}>Item</span>
          </button>
        </div>
      </div>

      {/* User Menu Dropdown */}
      <div
        ref={userMenuRef}
        className={`fixed w-[252px] bg-white border border-[#DDE3EE] rounded-xl shadow-[0_8px_24px_rgba(26,35,50,0.13),0_2px_6px_rgba(26,35,50,0.07)] z-[1100] transition-all duration-150 ease-out overflow-hidden ${
          userMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.98] pointer-events-none"
        }`}
        style={{
          right: "16px",
          top: "60px",
          transformOrigin: "top right",
          transform: userMenuOpen ? "translateY(0)" : "translateY(-6px)"
        }}
      >
        {/* Profile header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <div className="w-[38px] h-[38px] bg-[#4A6FA5] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            M
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-[13px] font-semibold text-[#1A2332]" style={{ lineHeight: 1.3 }}>Marek Stroz</div>
            <div className="text-[11.5px] text-[#546478] whitespace-nowrap overflow-hidden text-ellipsis" style={{ lineHeight: 1.3 }}>marek@abcplumbing.com</div>
          </div>
        </div>

        <div className="h-px bg-[#DDE3EE] my-[3px]"></div>

        {/* Notifications toggle */}
        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors"
        >
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>notifications</span>
          <span className="flex-1 text-[13px] text-[#1A2332] text-left">On-screen notifications</span>
          <div className={`w-8 h-[18px] rounded-full flex items-center transition-colors ${notificationsEnabled ? "bg-[#4A6FA5]" : "bg-[#DDE3EE]"}`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform ${notificationsEnabled ? "translate-x-[14px]" : "translate-x-0.5"}`}></div>
          </div>
        </button>

        <div className="h-px bg-[#DDE3EE] my-[3px]"></div>

        <button onClick={() => { setUserMenuOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>manage_accounts</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">Account</span>
        </button>
        <button onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>group</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">Manage team</span>
        </button>
        <button onClick={() => { setUserMenuOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>credit_card</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">Billing</span>
          <span className="text-[10.5px] font-semibold text-white bg-[#4A6FA5] px-[7px] py-0.5 rounded-[10px] whitespace-nowrap">PRO</span>
        </button>

        <div className="h-px bg-[#DDE3EE] my-[3px]"></div>

        <button onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>new_releases</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">What's New?</span>
          <span className="text-[10.5px] font-bold text-white bg-[#DC2626] px-1.5 py-[1px] rounded-[10px] min-w-[18px] text-center">3</span>
        </button>

        <div className="h-px bg-[#DDE3EE] my-[3px]"></div>

        <button onClick={() => { setUserMenuOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>settings</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">Settings</span>
        </button>
        <button onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F7FA] transition-colors text-left">
          <span className="material-icons text-[#546478] flex-shrink-0" style={{ fontSize: "18px" }}>lock</span>
          <span className="flex-1 text-[13px] text-[#1A2332]">Change password</span>
        </button>

        <div className="h-px bg-[#DDE3EE] my-[3px]"></div>

        <div className="pb-1.5">
          <button onClick={() => { setUserMenuOpen(false); navigate("/login"); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#FEF2F2] transition-colors text-left text-[#DC2626]">
            <span className="material-icons flex-shrink-0" style={{ fontSize: "18px", color: "#DC2626" }}>logout</span>
            <span className="flex-1 text-[13px]">Log out</span>
          </button>
        </div>
      </div>

      {/* Messaging Center */}
      <MessagingCenter isOpen={messagingOpen} onClose={() => setMessagingOpen(false)} />

      {/* AI Assistant */}
      <AiAssistant isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />

      {/* Dialer */}
      <Dialer isOpen={dialerOpen} onClose={() => setDialerOpen(false)} />

      {/* Help Center */}
      <HelpCenter isOpen={helpCenterOpen} onClose={() => setHelpCenterOpen(false)} />
    </div>
  );
}