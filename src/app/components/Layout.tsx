import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import logoImg from "../../assets/vision360-logo.svg";
import wordmarkLogo from "../../assets/vision360-wordmark.png";
import { MessagingCenter } from "./MessagingCenter";
import { AiAssistant } from "./AiAssistant";
import { Dialer } from "./Dialer";
import { ProfileMenu } from "./ProfileMenu";
import { PlusIcon } from "./ui/plus-icon";
import {
  HomeIcon, ScheduleIcon, ClientsIcon, JobsIcon, EstimatesIcon,
  InvoicesIcon, PaymentsIcon, ExpensesIcon, ItemsIcon,
  CollapseIcon, BellIcon, HelpIcon, SettingsGearIcon, SearchIcon,
} from "./ui/nav-icons";
import { applyStoredBrandTheme, BRAND_LOGO_EVENT, getStoredBrandLogo } from "../utils/brandTheme";
import { formatTrialDate, getTrialDaysRemaining, isTrialActive, trialStore } from "../stores/trialStore";
import { clientsStore } from "../stores/clientsStore";
import { setupStore } from "../stores/setupStore";
import { useT } from "../i18n";

const navItems = [
  { to: "/", icon: HomeIcon, key: "nav.home", label: "Home" },
  { to: "/calendar", icon: ScheduleIcon, key: "nav.schedule", label: "Schedule" },
  { to: "/clients", icon: ClientsIcon, key: "nav.clients", label: "Clients" },
  { to: "/jobs", icon: JobsIcon, key: "nav.jobs", label: "Jobs" },
  { to: "/estimates", icon: EstimatesIcon, key: "nav.estimates", label: "Estimates" },
  { to: "/invoices", icon: InvoicesIcon, key: "nav.invoices", label: "Invoices" },
  { to: "/payments", icon: PaymentsIcon, key: "nav.payments", label: "Payments" },
  { to: "/expenses", icon: ExpensesIcon, key: "nav.expenses", label: "Expenses" },
  { to: "/items", icon: ItemsIcon, key: "nav.items", label: "Items" },
];

export function Layout() {
  const navigate = useNavigate();
  const { t, langCode } = useT();
  // Reflect the chosen language on <html lang> for a11y / browser hints.
  useEffect(() => { document.documentElement.lang = langCode; }, [langCode]);
  const [deskCollapsed, setDeskCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  // On desktop the sidebar can be collapsed to icons; on mobile it's a full
  // drawer (never the collapsed mini-rail), so force expanded below lg.
  const collapsed = isDesktop ? deskCollapsed : false;
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [companyLogoSrc, setCompanyLogoSrc] = useState(() => getStoredBrandLogo() || wordmarkLogo);
  const trial = useSyncExternalStore(trialStore.subscribe, trialStore.getSnapshot);
  const setup = useSyncExternalStore(setupStore.subscribe, setupStore.getSnapshot);
  // AUTH-3 — nudge users who skipped Company Setup. Banner can be dismissed
  // ("Don't show again"); the bell item stays until setup is actually finished.
  const showSetupBanner = !setup.complete && !setup.bannerDismissed;
  // Real clients for global search (was a hardcoded mock that didn't match the actual data).
  const allClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const showTrialBanner = isTrialActive(trial);
  const trialDaysRemaining = getTrialDaysRemaining(trial);

  useEffect(() => {
    applyStoredBrandTheme();
    setCompanyLogoSrc(getStoredBrandLogo() || wordmarkLogo);

    const handleLogoChange = (event: Event) => {
      const nextLogo = (event as CustomEvent<string>).detail;
      setCompanyLogoSrc(nextLogo || wordmarkLogo);
    };

    window.addEventListener(BRAND_LOGO_EVENT, handleLogoChange);
    return () => window.removeEventListener(BRAND_LOGO_EVENT, handleLogoChange);
  }, []);

  // Track desktop vs mobile: static rail at lg+, drawer-behind-hamburger below.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (e.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
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
      allClients
        .filter(c => c.name.toLowerCase().includes(query) || (c.email || "").toLowerCase().includes(query) || (c.phone || c.mobilePhone || "").includes(query))
        .slice(0, 8)
        .forEach(c => results.push({ type: "client", data: { id: c.id, name: c.name, email: c.email, phone: c.phone || c.mobilePhone, address: `${c.address}, ${c.city}, ${c.state} ${c.zip}` } }));
    }

    if (searchFilter === "All" || searchFilter === "Jobs") {
      mockSearchData.jobs
        .filter(j => j.title.toLowerCase().includes(query) || j.jobNumber.toLowerCase().includes(query) || j.client.toLowerCase().includes(query))
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
      if (notifMenuOpen && notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node) &&
          notifBtnRef.current && !notifBtnRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (createMenuOpen && createMenuRef.current && !createMenuRef.current.contains(event.target as Node) &&
          createBtnRef.current && !createBtnRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (globalSearchOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setGlobalSearchOpen(false);
        setSearchFilterOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node) &&
          profileBtnRef.current && !profileBtnRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifMenuOpen, createMenuOpen, globalSearchOpen, profileMenuOpen]);

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
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* ── Mobile drawer backdrop ── */}
      {!isDesktop && mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}

      {/* ── Full-height Sidebar (static rail on lg+, drawer below) ── */}
      <aside
        className={`bg-[#1C2B3A] flex flex-col flex-shrink-0 z-50 ${
          isDesktop
            ? `relative transition-all duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? "w-[96px] p-2 gap-4" : "w-[240px] p-4 gap-6"}`
            : `fixed inset-y-0 left-0 w-[240px] p-4 gap-6 shadow-2xl transition-transform duration-200 ease-out ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`
        }`}
        style={{ overflowX: "hidden" }}
      >
        {/* Logo area */}
        <div className={`flex flex-shrink-0 ${collapsed ? "justify-center items-center" : "items-center"}`}>
          <button
            type="button"
            aria-label="Open branding settings"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            onClick={() => navigate("/settings?section=companyProfile")}
          >
            <img
              src={companyLogoSrc}
              alt="Company Logo"
              className="pointer-events-none select-none mix-blend-hard-light"
              style={{
                height: collapsed ? "20px" : "24px",
                width: collapsed ? "44px" : "120px",
                objectFit: companyLogoSrc === wordmarkLogo && !collapsed ? "cover" : "contain",
                objectPosition: collapsed ? "center" : "left center",
              }}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 flex flex-col overflow-y-auto ${
            collapsed ? "gap-0.5" : "gap-2"
          }`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => { if (!isDesktop) setMobileNavOpen(false); }}
              className={({ isActive }) =>
                `rounded-[6px] flex relative transition-all duration-150 ${
                  collapsed
                    ? "flex-col items-center justify-center w-full py-1.5 gap-0.5"
                    : "h-8 flex-row items-center w-full px-3 py-1 gap-2 whitespace-nowrap"
                } ${
                  isActive
                    ? "text-[#81B4F3] bg-[rgba(74,111,165,0.3)]"
                    : "text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                }`
              }
            >
              <item.icon
                className="flex-shrink-0"
                width={collapsed ? 22 : 16}
                height={collapsed ? 22 : 16}
              />
              {collapsed ? (
                <span
                  className="text-[11px] text-center"
                  style={{ fontWeight: 500, lineHeight: "14px" }}
                >
                  {t(item.key, item.label)}
                </span>
              ) : (
                <span className="text-[14px]" style={{ fontWeight: 500, lineHeight: "20px" }}>
                  {t(item.key, item.label)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse button — desktop only (mobile uses the drawer + backdrop) */}
        {isDesktop && (
        <div className="flex-shrink-0 border-t border-[rgba(255,255,255,0.1)] pt-1">
          <button
            onClick={() => setDeskCollapsed(!collapsed)}
            title={collapsed ? t("nav.expand") : t("nav.collapse")}
            className={`rounded-[6px] flex transition-all duration-150 text-white hover:bg-[rgba(255,255,255,0.08)] ${
              collapsed
                ? "flex-col items-center justify-center w-full py-1.5 gap-0.5"
                : "h-8 flex-row items-center w-full px-3 py-1 gap-2"
            }`}
          >
            <CollapseIcon
              className="flex-shrink-0 transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              width={collapsed ? 22 : 16}
              height={collapsed ? 22 : 16}
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {collapsed ? (
              <span className="text-[11px] text-center" style={{ fontWeight: 500, lineHeight: "14px" }}>
                {t("nav.collapse")}
              </span>
            ) : (
              <span className="text-[14px]" style={{ fontWeight: 500, lineHeight: "20px" }}>
                {t("nav.collapse")}
              </span>
            )}
          </button>
        </div>
        )}
      </aside>

      {/* Main area: header + content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[68px] bg-white border-b border-[#E5E7EB] flex items-center gap-3 sm:gap-6 px-4 flex-shrink-0">

        {/* Hamburger — opens the sidebar drawer below lg */}
        {!isDesktop && (
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#F5F7FA] flex-shrink-0 -ml-1"
          >
            <span className="material-icons" style={{ fontSize: "26px" }}>menu</span>
          </button>
        )}

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
              className="w-full h-9 flex items-center gap-2 px-3 border border-[#E5E7EB] rounded-lg bg-white hover:border-[#B0BEC5] transition-all cursor-text shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
            >
              <SearchIcon width={18} height={18} className="text-[#9CA3AF] flex-shrink-0" />
              <span className="text-[13px] text-[#9CA3AF] flex-1 text-left">{t("search.placeholder")}</span>
              <span className="text-[11px] text-[#9CA3AF] border border-[#E5E7EB] rounded px-1.5 py-0.5">⌘K</span>
            </button>
          )}

          {/* Opened Search Dropdown */}
          {globalSearchOpen && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] bg-white border border-[#E5E7EB] rounded-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2)] z-[2000] overflow-hidden">
              {/* Search Input Row */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E5E7EB]">
                <SearchIcon width={20} height={20} className="text-[#9CA3AF] flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("search.placeholder")}
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
                        const typeLabels: Record<string, string> = { client: "Clients", job: "Jobs", invoice: "Invoices", estimate: "Estimates" };
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

        {/* Right side — create + actions + user */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Create button — blue (now first) */}
          <button
            ref={createBtnRef}
            title={t("create.title")}
            onClick={() => {
              setCreateMenuOpen(!createMenuOpen);
              setNotifMenuOpen(false);
              setProfileMenuOpen(false);
            }}
            className="flex h-9 min-h-[36px] w-9 min-w-[36px] flex-none items-center justify-center rounded-lg bg-[#4A6FA5] p-2 text-white transition-colors hover:bg-[#3d5a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6FA5]/30"
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-[#E5E7EB] flex-shrink-0" />

          {/* Icon action buttons (transparent, 36×36 with 8px padding, radius 8) */}
          <div className="flex items-center gap-1">
            <button ref={notifBtnRef} title="Notifications" onClick={() => {
              setNotifMenuOpen(!notifMenuOpen);
              setCreateMenuOpen(false);
              setProfileMenuOpen(false);
            }}
              className="relative w-9 h-9 p-2 rounded-lg flex items-center justify-center text-[#1A2332] hover:bg-[#F5F7FA] transition-colors">
              <BellIcon width={20} height={20} />
              <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[#DC2626] border border-white" />
            </button>
            <button title="Help Center" onClick={() => navigate("/help")}
              className="w-9 h-9 p-2 rounded-lg flex items-center justify-center text-[#1A2332] hover:bg-[#F5F7FA] transition-colors">
              <HelpIcon width={20} height={20} />
            </button>
            <button title="Settings" onClick={() => navigate("/settings")}
              className="w-9 h-9 p-2 rounded-lg flex items-center justify-center text-[#1A2332] hover:bg-[#F5F7FA] transition-colors">
              <SettingsGearIcon width={20} height={20} />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-[#E5E7EB] flex-shrink-0" />

          {/* User section */}
          <button
            ref={profileBtnRef}
            type="button"
            title="Profile"
            onClick={() => {
              setProfileMenuOpen(prev => !prev);
              setCreateMenuOpen(false);
              setNotifMenuOpen(false);
            }}
            className={`flex h-9 items-center justify-center rounded-lg transition-colors hover:bg-[#F5F7FA] ${profileMenuOpen ? "bg-[#F5F7FA]" : ""}`}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
          >
            <div className="w-8 h-8 bg-[#4A6FA5] rounded-full flex items-center justify-center text-white text-[14px] flex-shrink-0" style={{ fontWeight: 600 }}>
              JD
            </div>
          </button>
        </div>
        </header>

        {showSetupBanner && (
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-[#FCE7B5] bg-[#FFF8EB] px-5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5 text-[13px] text-[#1A2332]">
              <span className="material-icons-outlined text-[#D97706]" style={{ fontSize: "18px" }}>business_center</span>
              <span className="truncate">
                {t("setup.banner")}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="h-8 shrink-0 rounded-md bg-[#D97706] px-3 text-[13px] text-white transition-colors hover:bg-[#B45309]"
                style={{ fontWeight: 600 }}
              >
                {t("setup.finish")}
              </button>
              <button
                type="button"
                onClick={() => setupStore.dismissBanner()}
                className="h-8 shrink-0 rounded-md px-2.5 text-[13px] text-[#8A6D3B] transition-colors hover:bg-[#FCEFCF]"
                style={{ fontWeight: 500 }}
              >
                {t("setup.dontShow")}
              </button>
            </div>
          </div>
        )}

        {showTrialBanner && trial && (
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-[#D8E4F2] bg-[#EBF2FC] px-5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5 text-[13px] text-[#1A2332]">
              <span className="material-icons-outlined text-[#4A6FA5]" style={{ fontSize: "18px" }}>schedule</span>
              <span className="truncate">
                Your 7-day free trial ends {formatTrialDate(trial.expiresAt)}
                {trialDaysRemaining > 0 ? ` (${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left).` : "."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/settings?section=billing")}
              className="h-8 shrink-0 rounded-md bg-[#4A6FA5] px-3 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              {t("header.subscribeNow")}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* Create Dropdown */}
      <div
        ref={createMenuRef}
        className={`fixed w-[240px] bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[1100] transition-all duration-[140ms] ease-out ${
          createMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          right: "16px",
          top: "52px",
          transformOrigin: "top right"
        }}
      >
        <div className="py-2">
          <button onClick={() => { setCreateMenuOpen(false); navigate("/estimates/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>description</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.estimate")}</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/invoices/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>receipt</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.invoice")}</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/payments/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>payments</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.payment")}</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/jobs/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>work</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.job")}</span>
          </button>

          <button onClick={() => { setCreateMenuOpen(false); navigate("/clients/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>person_add</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.client")}</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/expenses/new"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>receipt_long</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.expense")}</span>
          </button>
          <button onClick={() => { setCreateMenuOpen(false); navigate("/items"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EBF2FC] flex items-center justify-center group-hover:bg-[#4A6FA5] transition-colors flex-shrink-0">
              <span className="material-icons-outlined text-[#4A6FA5] group-hover:text-white transition-colors" style={{ fontSize: "18px" }}>inventory_2</span>
            </div>
            <span style={{ fontWeight: 500 }}>{t("create.item")}</span>
          </button>
        </div>
      </div>

      {profileMenuOpen && (
        <div ref={profileMenuRef}>
          <ProfileMenu onClose={() => setProfileMenuOpen(false)} />
        </div>
      )}

      {/* Notifications Dropdown */}
      <div
        ref={notifMenuRef}
        className={`fixed w-[340px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] z-[1100] transition-all duration-150 ease-out overflow-hidden ${
          notifMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.98] pointer-events-none"
        }`}
        style={{ right: "16px", top: "68px", transformOrigin: "top right" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
          <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>{t("notif.title")}</span>
          <button onClick={() => setNotifMenuOpen(false)} className="text-[12px] text-[#4A6FA5] hover:underline">{t("notif.markAllRead")}</button>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {!setup.complete && (
            <button
              type="button"
              onClick={() => { setNotifMenuOpen(false); navigate("/settings"); }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left cursor-pointer bg-[#FFF8EB] hover:bg-[#FCEFCF] transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#FEF3C7" }}>
                <span className="material-icons" style={{ fontSize: "16px", color: "#D97706" }}>business_center</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{t("setup.bellTitle")}</span>
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">{t("setup.bellTime")}</span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{t("setup.bellBody")}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 mt-1.5" />
            </button>
          )}
          {[
            { icon: "description", color: "#4A6FA5", bg: "#EBF0F8", title: "Estimate signed", body: "Travis Jones signed Estimate #E-1042", time: "2 min ago", unread: true },
            { icon: "payments", color: "#16A34A", bg: "#DCFCE7", title: "Payment received", body: "Mike Delgado paid Invoice #INV-884 — $450.00", time: "1 hr ago", unread: true },
            { icon: "work", color: "#D97706", bg: "#FEF3C7", title: "Job status changed", body: 'Job #J-2091 moved to "In Progress"', time: "3 hr ago", unread: false },
          ].map((n) => (
            <div key={n.title} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors ${n.unread ? "bg-[#F8FBFF]" : ""}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: n.bg }}>
                <span className="material-icons" style={{ fontSize: "16px", color: n.color }}>{n.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: n.unread ? 700 : 500 }}>{n.title}</span>
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">{n.time}</span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">{n.body}</p>
              </div>
              {n.unread && <div className="w-2 h-2 rounded-full bg-[#4A6FA5] shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-[#F3F4F6]">
          <button className="w-full text-center text-[13px] text-[#4A6FA5] hover:underline" onClick={() => setNotifMenuOpen(false)}>
            {t("notif.viewAll")}
          </button>
        </div>
      </div>

      {/* Messaging Center */}
      <MessagingCenter isOpen={messagingOpen} onClose={() => setMessagingOpen(false)} />

      {/* AI Assistant */}
      <AiAssistant isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />

      {/* Dialer */}
      <Dialer isOpen={dialerOpen} onClose={() => setDialerOpen(false)} />
    </div>
  );
}
