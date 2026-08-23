import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TechnicianMobileDemo } from "../components/TechnicianMobileDemo";
import { DispatcherCallConsole } from "../components/DispatcherCallConsole";

// Help Center — full page, aligned to Figma node 1195-79448:
// 300px category rail (search + topics) + 900px main area with an accordion
// article list, a "Contact us" button, and a centered Contact-us modal.

type CatKey =
  | "all" | "getting-started" | "clients" | "jobs"
  | "estimates" | "payments" | "items" | "reports" | "settings";

const categories: { key: CatKey; label: string; icon: string; count: number }[] = [
  { key: "getting-started", label: "Getting started", icon: "rocket_launch", count: 8 },
  { key: "clients", label: "Clients & contacts", icon: "people", count: 12 },
  { key: "jobs", label: "Jobs & scheduling", icon: "work", count: 15 },
  { key: "estimates", label: "Estimates & invoices", icon: "description", count: 18 },
  { key: "payments", label: "Payments & billing", icon: "payments", count: 10 },
  { key: "items", label: "Items & catalog", icon: "inventory_2", count: 6 },
  { key: "reports", label: "Reports & analytics", icon: "bar_chart", count: 9 },
  { key: "settings", label: "Settings & account", icon: "settings", count: 7 },
];

interface Article {
  id: number;
  title: string;
  categoryKey: CatKey;
  category: string;
  readTime: string;
  body: string[];
}

const articles: Article[] = [
  {
    id: 1,
    title: "How to create your first invoice?",
    categoryKey: "estimates",
    category: "Estimates & invoices",
    readTime: "3 min read",
    body: [
      "Creating an invoice in Vision360 is straightforward. Navigate to Invoices from the sidebar and click the \"Add New\" button in the top right.",
      "Start by selecting the client from the dropdown. The invoice number will be auto-generated. Set the invoice date and due date according to your payment terms.",
      "If the invoice is related to a specific job or estimate, link it using the respective dropdowns. This helps maintain a clear audit trail across your workflow.",
      "Add line items by clicking \"Add Item\" to open the Item Picker. Search and select items from your catalog — the price, cost, and tax settings will auto-populate. Adjust quantities as needed.",
      "The totals section will automatically calculate subtotal, taxable amount, tax, and grand total. Add any notes or terms, then click \"Save Invoice\" to create it.",
    ],
  },
  {
    id: 7,
    title: "Setting up Terms & Conditions",
    categoryKey: "estimates",
    category: "Estimates & invoices",
    readTime: "2 min read",
    body: [
      "Your default Terms & Conditions travel with every estimate and invoice you send to clients. You configure them once and they apply everywhere — there is no separate publish step.",
      "Open Settings from the sidebar or user menu, then go to System preferences → General. The \"Terms & Conditions\" card is where you set the content.",
      "Use the Free text / File upload toggle to choose the format. \"Free text\" lets you type or paste your terms directly into the editor. \"File upload\" lets you attach a PDF or DOCX document — drop it on the upload area or click to browse. Need something to try the upload with? Download the sample at /sample-terms-and-conditions.txt and use it as an example vendor document.",
      "Whatever you enter is saved automatically and becomes your company default. The next estimate or invoice you create picks it up immediately — no need to re-attach it each time.",
      "On a new estimate, look for the \"Terms & Conditions apply to this estimate\" banner near the bottom of the form. It shows a one-line summary of your configured terms; click \"View terms and conditions\" to read the full text or see the attached document's name before sending.",
      "If you have not set any terms yet, that banner shows an \"Add in Settings\" link instead — clicking it jumps you straight to the Terms & Conditions card. Always replace the seeded sample copy with your own attorney-reviewed terms before sending documents to real clients.",
    ],
  },
  {
    id: 2,
    title: "Setting up your company profile",
    categoryKey: "getting-started",
    category: "Getting started",
    readTime: "3 min read",
    body: [
      "Go to Settings from the sidebar or the user menu. Under the Company tab, you can update your business name, address, phone, and email.",
      "Upload your company logo — it will appear on invoices, estimates, and other client-facing documents.",
      "Set your default tax rate, payment terms, and currency preferences. These defaults will auto-apply when creating new documents.",
    ],
  },
  {
    id: 3,
    title: "Adding and managing clients",
    categoryKey: "clients",
    category: "Clients & contacts",
    readTime: "3 min read",
    body: [
      "Navigate to Clients from the sidebar. Click \"Create Client\" to add a new contact. Fill in their name, phone, and address details.",
      "Each client profile shows their complete history — jobs, estimates, invoices, and payments all linked in one place.",
      "Use the search and filter options on the Clients list to quickly find existing clients by name, email, or phone number.",
    ],
  },
  {
    id: 4,
    title: "Recording payments on invoices",
    categoryKey: "payments",
    category: "Payments & billing",
    readTime: "5 min read",
    body: [
      "Open the invoice you want to record a payment for. Click the \"Collect Payment\" button in the top toolbar.",
      "Enter the payment amount, date, and method (Cash, Check, Credit Card, Bank Transfer, etc.). Add an optional note for reference.",
      "The invoice balance will automatically recalculate. If the full amount is paid, the status changes to \"Paid\". Partial payments update the status to \"Partially Paid\".",
      "All payment activity is logged in the Activity section, providing a complete audit trail.",
    ],
  },
  {
    id: 5,
    title: "Using the item catalog for line items",
    categoryKey: "items",
    category: "Items & catalog",
    readTime: "5 min read",
    body: [
      "The Items module lets you maintain a catalog of products, services, labor, and equipment with preset pricing.",
      "When creating estimates, invoices, or jobs, use the \"Add Item\" button to open the Item Picker. Search by name, brand, or category.",
      "Selecting an item auto-fills the price, cost, and tax settings. You can adjust the quantity and, in some cases, override the unit price.",
    ],
  },
  {
    id: 6,
    title: "Scheduling jobs on calendar",
    categoryKey: "jobs",
    category: "Jobs & scheduling",
    readTime: "5 min read",
    body: [
      "Navigate to Schedule from the sidebar. You can view your schedule in Day, Week, or Month view.",
      "Create a new job directly from the calendar or go to Jobs → Create Job. Assign a client, set the date/time, and add relevant details.",
      "Jobs appear color-coded on the calendar based on their status. Drag and drop to reschedule.",
    ],
  },
];

const sandboxPhases: { key: string; label: string; description: string; from: string; to: string }[] = [
  { key: "core", label: "Phase I — Core", description: "Clients, Jobs, Items, Estimates, Invoicing, Payments & basic reports.", from: "from-[#4A6FA5]", to: "to-[#3d5a85] hover:from-[#3d5a85] hover:to-[#2f4670]" },
  { key: "pro", label: "Phase II — Pro", description: "Adds bookkeeping, dashboards, employee management & service agreements.", from: "from-[#16A34A]", to: "to-[#0F7A38] hover:from-[#0F7A38] hover:to-[#0a5c2a]" },
  { key: "max", label: "Phase III — Max", description: "Adds advanced reporting, payroll-ready time tracking & inventory.", from: "from-[#DB2777]", to: "to-[#9D174D] hover:from-[#9D174D] hover:to-[#7a1139]" },
  { key: "enterprise", label: "Phase IV — Enterprise", description: "Everything, plus an advanced schedule board built for large teams.", from: "from-[#D97706]", to: "to-[#92400E] hover:from-[#92400E] hover:to-[#78350F]" },
];

// Role-based sandbox tabs — mirrors real field access profiles so anyone can
// preview what a given role would see. Cosmetic only for now: every tab opens
// the same full sandbox (?sandbox=sample), there is no per-role gating yet.
const sandboxRoles: { key: string; label: string; description: string }[] = [
  { key: "technician", label: "Technician", description: "Sees only their own jobs, with enroute / working / done statuses. Can't close out a job themselves (R5, R6)." },
  { key: "field-sales", label: "Field Salesperson", description: "Same as Technician, plus estimates, option sheets, and the price catalog." },
  { key: "installer", label: "Installer", description: "Reads job scope, the parts list, and photos. No pricing is visible." },
  { key: "dispatcher", label: "Dispatcher", description: "Books the schedule board, adds notes, and records card payments." },
  { key: "dispatch-manager", label: "Dispatch Manager", description: "Everything a Dispatcher has, plus branch-to-branch transfers, overrides, and reports." },
  { key: "ssa", label: "SSA", description: "Read-only across all boards — no write access. Sends transfer requests (handled via Google Chat today)." },
  { key: "coordinator", label: "Coordinator", description: "Warranty / service / compliance / production queues, document verification, job closeout, and client communication." },
  { key: "permits", label: "Permits", description: "The permits module plus documents, and read access to the install and sales boards." },
  { key: "warehouse", label: "Warehouse", description: "Parts list, inventory, transfers, and dispatch on its own board." },
  { key: "accounting", label: "Accounting", description: "Payments, invoices, balances, and refunds. No schedule board visibility." },
  { key: "branch-manager", label: "Branch Manager", description: "Everything within their branch, plus KPI dashboards." },
];

export function HelpCenter() {
  const [activeCat, setActiveCat] = useState<CatKey>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(sandboxRoles[0].key);
  const [technicianDemoOpen, setTechnicianDemoOpen] = useState(false);
  const [dispatcherDemoOpen, setDispatcherDemoOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", subject: "", message: "" });

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter(a =>
      (activeCat === "all" || a.categoryKey === activeCat) &&
      (!q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    );
  }, [activeCat, search]);

  const sendMessage = () => {
    toast.success("Message sent — we'll get back to you within 24 hours.");
    setContactOpen(false);
    setContact({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="flex h-full bg-[#F5F7FA]">
      {/* Category rail */}
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
        <div className="border-b border-[#EDF0F5] p-4">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5]"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <button
            onClick={() => setActiveCat("all")}
            className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
              activeCat === "all" ? "bg-[#EBF0F8]" : "hover:bg-[#F5F7FA]"
            }`}
          >
            <span className="material-icons" style={{ fontSize: "18px", color: activeCat === "all" ? "#4A6FA5" : "#8899AA" }}>menu_book</span>
            <span className="flex-1 text-[13px] text-[#1A2332]" style={{ fontWeight: activeCat === "all" ? 600 : 500 }}>All articles</span>
            <span className="text-[12px] text-[#8899AA]">{totalCount}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                activeCat === cat.key ? "bg-[#EBF0F8]" : "hover:bg-[#F5F7FA]"
              }`}
            >
              <span className="material-icons" style={{ fontSize: "18px", color: activeCat === cat.key ? "#4A6FA5" : "#8899AA" }}>{cat.icon}</span>
              <span className="flex-1 text-[13px] text-[#1A2332]" style={{ fontWeight: activeCat === cat.key ? 600 : 500 }}>{cat.label}</span>
              <span className="text-[12px] text-[#8899AA]">{cat.count}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-5">
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>Help center</h1>
          <button
            onClick={() => setContactOpen(true)}
            className="h-9 rounded-md bg-[#4A6FA5] px-4 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Contact us
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Sample Company sandbox (spec §8.7) — try every feature with mock
              data. Hidden while searching so it never competes with results.
              One card per pricing phase; all currently open the same full
              sandbox (cosmetic only — no per-tier feature gating yet). */}
          {!search && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sandboxPhases.map((phase) => (
                <button
                  key={phase.key}
                  onClick={() => { window.location.href = "/?sandbox=sample"; }}
                  className={`flex w-full items-center gap-3 rounded-xl bg-gradient-to-br ${phase.from} ${phase.to} p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all group`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/20">
                    <span className="material-icons text-white" style={{ fontSize: "22px" }}>play_circle</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-white" style={{ fontWeight: 600 }}>Play with {phase.label}</div>
                    <div className="mt-0.5 text-[12px] text-white/80">{phase.description}</div>
                  </div>
                  <span className="material-icons shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" style={{ fontSize: "20px" }}>arrow_forward</span>
                </button>
              ))}
            </div>
          )}

          {/* Role-based sandbox — separate section, tabs mirroring real field
              access profiles. Cosmetic only, same as the phase cards above:
              every role opens the same full sandbox, no gating yet. */}
          {!search && (
            <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="mb-3">
                <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Roles</div>
                <div className="mt-0.5 text-[12px] text-[#8899AA]">Preview the sandbox as one of these field access profiles.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {sandboxRoles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setActiveRole(role.key)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                      activeRole === role.key
                        ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#4A6FA5]"
                        : "border-[#E5E7EB] bg-white text-[#546478] hover:bg-[#F5F7FA]"
                    }`}
                    style={{ fontWeight: activeRole === role.key ? 600 : 500 }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
              {(() => {
                const role = sandboxRoles.find((r) => r.key === activeRole) ?? sandboxRoles[0];
                return (
                  <div className="mt-4 flex flex-col items-start gap-3 rounded-lg bg-[#F5F7FA] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{role.label}</div>
                      <div className="mt-0.5 text-[13px] leading-[1.6] text-[#546478]">{role.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (role.key === "technician") { setTechnicianDemoOpen(true); return; }
                        if (role.key === "dispatcher") { setDispatcherDemoOpen(true); return; }
                        window.location.href = "/?sandbox=sample";
                      }}
                      className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#4A6FA5] px-4 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
                      style={{ fontWeight: 600 }}
                    >
                      <span className="material-icons" style={{ fontSize: "16px" }}>play_circle</span>
                      Play as {role.label}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white py-16 text-center">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "40px" }}>search_off</span>
              <div className="mt-2 text-[14px] text-[#8899AA]">No articles found</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((article) => {
                const open = expanded === article.id;
                return (
                  <div key={article.id} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                    <button
                      onClick={() => setExpanded(open ? null : article.id)}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{article.title}</span>
                        <span className="ml-2 text-[13px] text-[#8899AA]">{article.category} • {article.readTime}</span>
                      </div>
                      <span className="material-icons shrink-0 text-[#8899AA] transition-transform" style={{ fontSize: "22px", transform: open ? "rotate(180deg)" : "none" }}>expand_more</span>
                    </button>
                    {open && (
                      <div className="space-y-3 px-4 pb-5 pt-0">
                        {article.body.map((p, idx) => (
                          <p key={idx} className="text-[14px] leading-[1.7] text-[#546478]">{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Contact us modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 p-4" onClick={() => setContactOpen(false)}>
          <div className="w-[650px] max-w-full overflow-hidden rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Contact us</h2>
              <button onClick={() => setContactOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6]" aria-label="Close">
                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-4 py-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Name</span>
                  <input value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} className="h-9 rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" placeholder="Your name" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Email</span>
                  <input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} className="h-9 rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" placeholder="name@example.com" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Subject</span>
                <input value={contact.subject} onChange={e => setContact({ ...contact, subject: e.target.value })} className="h-9 rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" placeholder="Brief description of your issue" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>Message</span>
                <textarea value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} className="min-h-[76px] rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5] resize-y" placeholder="Describe your issue in detail..." />
              </label>

              <div className="border-t border-[#EDF0F5] pt-4">
                <h3 className="mb-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Other ways to reach us</h3>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#546478]">
                  <span className="inline-flex items-center gap-2"><span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>mail</span>support@vision360.app</span>
                  <span className="h-4 w-px bg-[#E5E7EB]" />
                  <span className="inline-flex items-center gap-2"><span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>phone</span>(800) 360-0360</span>
                  <span className="h-4 w-px bg-[#E5E7EB]" />
                  <span className="inline-flex items-center gap-2"><span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>schedule</span>Mon–Fri, 8:00 AM – 6:00 PM EST</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-4 py-4">
              <button onClick={() => setContactOpen(false)} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!contact.subject.trim() || !contact.message.trim()}
                className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-40"
                style={{ fontWeight: 600 }}
              >
                Send message
              </button>
            </div>
          </div>
        </div>
      )}

      {technicianDemoOpen && <TechnicianMobileDemo onClose={() => setTechnicianDemoOpen(false)} />}
      {dispatcherDemoOpen && <DispatcherCallConsole onClose={() => setDispatcherDemoOpen(false)} />}
    </div>
  );
}
