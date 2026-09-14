import { useMemo, useState } from "react";
import { toast } from "sonner";

// Help Center — full page, aligned to Figma node 1195-79448:
// 300px category rail (search + topics) + 900px main area with an accordion
// article list, a "Contact us" button, and a centered Contact-us modal.
//
// Content rules (PRD v2.0 §Help Center, FR-1.10, FR-15.7; tasks 8905/8906):
// - category counts are derived from the article list, never typed in;
// - read time is derived from the article length;
// - one sample company, one CTA (no per-phase / per-role sandboxes).

type CatKey =
  | "all" | "getting-started" | "clients" | "jobs"
  | "estimates" | "payments" | "items" | "reports" | "settings";

const categories: { key: CatKey; label: string; icon: string }[] = [
  { key: "getting-started", label: "Getting started", icon: "rocket_launch" },
  { key: "clients", label: "Clients & contacts", icon: "people" },
  { key: "jobs", label: "Jobs & scheduling", icon: "work" },
  { key: "estimates", label: "Estimates & invoices", icon: "description" },
  { key: "payments", label: "Payments & billing", icon: "payments" },
  { key: "items", label: "Items catalog", icon: "inventory_2" },
  // Reports & analytics has no articles until the module ships — shows 0.
  { key: "reports", label: "Reports & analytics", icon: "bar_chart" },
  { key: "settings", label: "Settings & account", icon: "settings" },
];

const categoryLabel = (key: CatKey) => categories.find(c => c.key === key)?.label ?? "";

interface Article {
  id: number;
  title: string;
  categoryKey: CatKey;
  body: string[];
}

// Article copy is written against the real screens and labels (en locale).
// Articles 7 and 8 follow the PRD because the Invoices and Payments modules
// are not built yet — re-check them against the screens once they exist.
const articles: Article[] = [
  {
    id: 1,
    title: "Setting up your company profile",
    categoryKey: "getting-started",
    body: [
      "Open Settings from the gear icon in the top bar. Under Business management there are two screens for your company. Company info holds the business name, address, phone and email that appear on your documents. Company profile holds the About text, branding, taxes and regional settings, and Business hours — set the days and hours you are open, they become your default availability across the app. Click Save changes when you are done. Your logo, uploaded under branding, prints on every estimate and invoice you send.",
    ],
  },
  {
    id: 2,
    title: "Adding and managing clients",
    categoryKey: "clients",
    body: [
      "Open Clients in the left menu and click Create Client. Fill in the contact information and the billing address; if the work happens somewhere else, add a separate service address. Additional contacts — a spouse, a property manager — can be added to the same client. Click Save client, or Save and Create Another to keep going. Each client profile has tabs for Details, Properties, Jobs, Estimates, Invoices, Payments and Documents, so the whole history lives in one place. Use search and the filters on the Clients list to find people quickly.",
    ],
  },
  {
    id: 3,
    title: "Scheduling jobs on the calendar",
    categoryKey: "jobs",
    body: [
      "Open Schedule in the left menu and switch between Day, Week and Month. Click Create job: give it a title and a job type, pick the client and the service address, choose who it is assigned to, and set the start date and time — the job duration fills in the end time. A job with a date and a technician sits on the board; a job missing one or the other waits in Pending jobs on the right, where you can drag it onto a time slot. Cards are colour-coded by status. Drag a card to reschedule it, or open it to change the status, add notes or attach files.",
    ],
  },
  {
    id: 4,
    title: "Using the items catalog for line items",
    categoryKey: "items",
    body: [
      "Items in the left menu is your catalog. The tabs split it by type: Price book for what customers see on documents, then Services, Materials, Equipment, Asset and Admin for internal items. Create item asks for basic info, type, classification — category, manufacturer, department — pricing and tax, vendor, images and notes. When you build an estimate or a job, add line items by searching the catalog: the description and price fill in and you adjust the quantity. Items that carry a cost feed the job's profit figures; the customer never sees cost.",
    ],
  },
  {
    id: 5,
    title: "Creating and sending an estimate",
    categoryKey: "estimates",
    body: [
      "Open Estimates and click Create estimate, or start from a client profile or a job. Pick the client and the address, then add line items from the catalog. To offer choices, click Add option: each option is a tab with its own items and total, and the customer picks one. Your Terms & Conditions from Settings apply automatically — View terms and conditions shows what the customer will read. Save as draft to keep working, or Send estimate to email the customer a link where they can accept the estimate or request changes. The status on the list follows along: Draft, Sent, Viewed, Approved, Changes requested, Expired.",
    ],
  },
  {
    id: 6,
    title: "Setting up Terms & Conditions",
    categoryKey: "estimates",
    body: [
      "Open Settings, then System preferences, then Estimates. The terms you enter there travel with every estimate you send; there is no separate publish step. Type or paste your text and click Save changes. The next estimate you create picks it up: the banner \"Terms & Conditions apply to this estimate\" near the bottom of the form confirms it, and View terms and conditions opens the full text. Replace any sample wording with your own reviewed terms before you send documents to real customers.",
    ],
  },
  {
    // Written from the PRD — verify against the Invoices module when it ships.
    id: 7,
    title: "How to create your first invoice",
    categoryKey: "estimates",
    body: [
      "An invoice starts from a completed job or an approved estimate, or from the Invoices list. The client, the service address and the line items come across; the invoice number is assigned for you — the customer's number plus a sequence, for example 10247-I01. Check the due date and payment terms, add a note if you need one, and send. The customer receives the invoice by email with a link to pay by card. Tax is shown on each line and the total is simply the sum of the lines. The status follows the balance: Unpaid, Partially paid, Paid.",
    ],
  },
  {
    // Written from the PRD — verify against the Payments module when it ships.
    id: 8,
    title: "Recording payments on invoices",
    categoryKey: "payments",
    body: [
      "A payment always belongs to an invoice. Open the invoice, or the client's Payments tab, and choose New payment. Enter the amount, the date and the method — card, check, cash or bank transfer — and a note if you like. The invoice balance updates at once: a partial payment sets the invoice to Partially paid, a full one to Paid. Card payments the customer makes through the link in their email are recorded for you.",
    ],
  },
  {
    id: 9,
    title: "Inviting your team",
    categoryKey: "settings",
    body: [
      "Open Settings, then Business management, then Manage team. Invite user asks for the person's name, email and role; the invitation arrives by email as a one-time link, and the person sets their own password. The role decides what they see and do — a technician sees their own jobs, an owner sees everything. From the same screen you can change a role, deactivate someone who left, and see who has not accepted their invitation yet.",
    ],
  },
];

// Read time from the text itself: ~200 words per minute, never below 1 min.
const WORDS_PER_MINUTE = 200;
const readTime = (body: string[]) => {
  const words = body.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} min read`;
};

const articleCount = (key: CatKey) => articles.filter(a => a.categoryKey === key).length;

export function HelpCenter() {
  const [activeCat, setActiveCat] = useState<CatKey>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", subject: "", message: "" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter(a =>
      (activeCat === "all" || a.categoryKey === activeCat) &&
      (!q ||
        a.title.toLowerCase().includes(q) ||
        categoryLabel(a.categoryKey).toLowerCase().includes(q) ||
        a.body.some(p => p.toLowerCase().includes(q)))
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
            <span className="text-[12px] text-[#8899AA]">{articles.length}</span>
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
              <span className="text-[12px] text-[#8899AA]">{articleCount(cat.key)}</span>
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
          {/* Sample company (PRD FR-1.10, FR-15.7): one demo company per
              account, shared by all its users. Hidden while searching so it
              never competes with results. */}
          {!search && (
            <button
              onClick={() => { window.location.href = "/?sandbox=sample"; }}
              className="group mb-6 flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-[#4A6FA5] to-[#3d5a85] p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all hover:from-[#3d5a85] hover:to-[#2f4670]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-white/20">
                <span className="material-icons text-white" style={{ fontSize: "22px" }}>science</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-white" style={{ fontWeight: 600 }}>Explore the sample company</div>
                <div className="mt-0.5 text-[12px] text-white/80">A demo company with realistic data. Nothing you do there touches your real records.</div>
              </div>
              <span className="material-icons shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" style={{ fontSize: "20px" }}>arrow_forward</span>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white py-16 text-center">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "40px" }}>search_off</span>
              <div className="mt-2 text-[14px] text-[#8899AA]">
                {search.trim()
                  ? <>No articles found for &lsquo;{search.trim()}&rsquo;</>
                  : <>No articles in {activeCat === "all" ? "the help center" : categoryLabel(activeCat)} yet</>}
              </div>
              <div className="mt-1 text-[13px] text-[#8899AA]">
                Can&rsquo;t find what you need?{" "}
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="text-[#4A6FA5] underline-offset-2 hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  Contact us
                </button>
              </div>
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
                        <span className="ml-2 text-[13px] text-[#8899AA]">{categoryLabel(article.categoryKey)} • {readTime(article.body)}</span>
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

              {/* PLACEHOLDER contacts — real values and the decision whose
                  support this is are pending (task 8906). */}
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
    </div>
  );
}
