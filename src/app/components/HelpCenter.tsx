import { useState } from "react";

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = "home" | "article" | "contact";

const categories = [
  { icon: "rocket_launch", label: "Getting Started", count: 8, color: "#4A6FA5" },
  { icon: "people", label: "Clients & Contacts", count: 12, color: "#3B82F6" },
  { icon: "work", label: "Jobs & Scheduling", count: 15, color: "#F59E0B" },
  { icon: "description", label: "Estimates & Invoices", count: 18, color: "#10B981" },
  { icon: "payments", label: "Payments & Billing", count: 10, color: "#8B5CF6" },
  { icon: "inventory_2", label: "Items & Catalog", count: 6, color: "#EC4899" },
  { icon: "bar_chart", label: "Reports & Analytics", count: 9, color: "#EF4444" },
  { icon: "settings", label: "Settings & Account", count: 7, color: "#546478" },
];

const popularArticles = [
  { id: 1, title: "How to create your first invoice", category: "Estimates & Invoices", readTime: "3 min" },
  { id: 2, title: "Setting up your company profile", category: "Getting Started", readTime: "2 min" },
  { id: 3, title: "Adding and managing clients", category: "Clients & Contacts", readTime: "4 min" },
  { id: 4, title: "Recording payments on invoices", category: "Payments & Billing", readTime: "3 min" },
  { id: 5, title: "Using the item catalog for line items", category: "Items & Catalog", readTime: "5 min" },
  { id: 6, title: "Scheduling jobs on the calendar", category: "Jobs & Scheduling", readTime: "4 min" },
];

const articleContent: Record<number, { title: string; category: string; body: string[] }> = {
  1: {
    title: "How to create your first invoice",
    category: "Estimates & Invoices",
    body: [
      "Creating an invoice in Vision360 is straightforward. Navigate to Invoices from the sidebar and click the \"Add New\" button in the top right.",
      "Start by selecting the client from the dropdown. The invoice number will be auto-generated. Set the invoice date and due date according to your payment terms.",
      "If the invoice is related to a specific job or estimate, link it using the respective dropdowns. This helps maintain a clear audit trail across your workflow.",
      "Add line items by clicking \"Add Item\" to open the Item Picker. Search and select items from your catalog — the price, cost, and tax settings will auto-populate. Adjust quantities as needed.",
      "The totals section will automatically calculate subtotal, taxable amount, tax, and grand total. Add any notes or terms, then click \"Save Invoice\" to create it or \"Save as Draft\" to finish later.",
    ],
  },
  2: {
    title: "Setting up your company profile",
    category: "Getting Started",
    body: [
      "Go to Settings from the sidebar or the user menu. Under the Company tab, you can update your business name, address, phone, and email.",
      "Upload your company logo — it will appear on invoices, estimates, and other client-facing documents.",
      "Set your default tax rate, payment terms, and currency preferences. These defaults will auto-apply when creating new documents.",
    ],
  },
  3: {
    title: "Adding and managing clients",
    category: "Clients & Contacts",
    body: [
      "Navigate to Clients from the sidebar. Click \"Create Client\" to add a new contact. Fill in their name, email, phone, and address details.",
      "Each client profile shows their complete history — jobs, estimates, invoices, and payments all linked in one place.",
      "Use the search and filter options on the Clients list to quickly find existing clients by name, email, or phone number.",
    ],
  },
  4: {
    title: "Recording payments on invoices",
    category: "Payments & Billing",
    body: [
      "Open the invoice you want to record a payment for. Click the \"Record Payment\" button in the top toolbar.",
      "Enter the payment amount, date, and method (Cash, Check, Credit Card, Bank Transfer, etc.). Add an optional note for reference.",
      "The invoice balance will automatically recalculate. If the full amount is paid, the status changes to \"Paid\". Partial payments update the status to \"Partially Paid\".",
      "All payment activity is logged in the Activity section on the right, providing a complete audit trail.",
    ],
  },
  5: {
    title: "Using the item catalog for line items",
    category: "Items & Catalog",
    body: [
      "The Items module lets you maintain a catalog of products, services, labor, and equipment with preset pricing.",
      "When creating estimates, invoices, or jobs, use the \"Add Item\" button to open the Item Picker. Search by name, brand, or category.",
      "Selecting an item auto-fills the price, cost, and tax settings. You can adjust the quantity and, in some cases, override the unit price.",
      "Taxable items are automatically included in tax calculations based on your configured tax rate.",
    ],
  },
  6: {
    title: "Scheduling jobs on the calendar",
    category: "Jobs & Scheduling",
    body: [
      "Navigate to Calendar from the sidebar. You can view your schedule in Day, Week, or Month view.",
      "Create a new job directly from the calendar or go to Jobs → Create Job. Assign a client, set the date/time, and add relevant details.",
      "Jobs appear color-coded on the calendar based on their status. Drag and drop to reschedule (coming soon).",
    ],
  },
};

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [view, setView] = useState<View>("home");
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [contactForm, setContactForm] = useState({ name: "Marek Stroz", email: "marek@abcplumbing.com", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const openArticle = (id: number) => {
    setSelectedArticle(id);
    setView("article");
  };

  const goHome = () => {
    setView("home");
    setSelectedArticle(null);
    setSubmitted(false);
  };

  const filteredArticles = search
    ? popularArticles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
    : popularArticles;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[3000]" onClick={onClose} />
      <div className="fixed right-6 top-16 bottom-6 w-[420px] bg-white border border-[#DDE3EE] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[3002] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DDE3EE] flex items-center gap-3 flex-shrink-0">
          {view !== "home" && (
            <button onClick={goHome} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>arrow_back</span>
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-[17px] text-[#1A2332]" style={{ fontWeight: 700 }}>
              {view === "home" ? "Help Center" : view === "article" ? "Article" : "Contact Support"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Home View */}
        {view === "home" && (
          <div className="flex-1 overflow-y-auto">
            {/* Search */}
            <div className="p-5 border-b border-[#EDF0F5] bg-[#F9FAFB]">
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input
                  type="text" placeholder="Search help articles..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] bg-white"
                />
              </div>
            </div>

            {!search && (
              <>
                {/* Categories */}
                <div className="p-5">
                  <h3 className="text-[12px] uppercase tracking-wider text-[#546478] mb-3" style={{ fontWeight: 600 }}>Browse by Topic</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button key={cat.label} className="flex items-center gap-2.5 px-3 py-2.5 border border-[#EDF0F5] rounded-lg hover:bg-[#F9FAFB] hover:border-[#DDE3EE] transition-all text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "15" }}>
                          <span className="material-icons" style={{ fontSize: "16px", color: cat.color }}>{cat.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{cat.label}</div>
                          <div className="text-[11px] text-[#8899AA]">{cat.count} articles</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#EDF0F5]" />
              </>
            )}

            {/* Popular Articles */}
            <div className="p-5">
              <h3 className="text-[12px] uppercase tracking-wider text-[#546478] mb-3" style={{ fontWeight: 600 }}>
                {search ? `Results for "${search}"` : "Popular Articles"}
              </h3>
              {filteredArticles.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "36px" }}>search_off</span>
                  <div className="text-[13px] text-[#8899AA] mt-2">No articles found</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => openArticle(article.id)}
                      className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-[#F5F7FA] transition-colors text-left"
                    >
                      <span className="material-icons text-[#4A6FA5] mt-0.5 flex-shrink-0" style={{ fontSize: "18px" }}>article</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{article.title}</div>
                        <div className="text-[12px] text-[#8899AA] mt-0.5">{article.category} · {article.readTime} read</div>
                      </div>
                      <span className="material-icons text-[#C8D5E8] flex-shrink-0" style={{ fontSize: "16px" }}>chevron_right</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Article View */}
        {view === "article" && selectedArticle && articleContent[selectedArticle] && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] px-2 py-0.5 rounded bg-[#EBF0F8] text-[#4A6FA5]" style={{ fontWeight: 600 }}>{articleContent[selectedArticle].category}</span>
              </div>
              <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>{articleContent[selectedArticle].title}</h2>
              <div className="space-y-4">
                {articleContent[selectedArticle].body.map((p, idx) => (
                  <p key={idx} className="text-[14px] text-[#546478]" style={{ lineHeight: "1.7" }}>{p}</p>
                ))}
              </div>

              {/* Helpful? */}
              <div className="mt-8 pt-5 border-t border-[#EDF0F5]">
                <div className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 500 }}>Was this article helpful?</div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#DCFCE7] hover:border-[#86EFAC] hover:text-[#16A34A] transition-all">
                    <span className="material-icons" style={{ fontSize: "16px" }}>thumb_up</span>Yes
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#DC2626] transition-all">
                    <span className="material-icons" style={{ fontSize: "16px" }}>thumb_down</span>No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact View */}
        {view === "contact" && (
          <div className="flex-1 overflow-y-auto p-5">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#DCFCE7] rounded-full flex items-center justify-center">
                  <span className="material-icons text-[#16A34A]" style={{ fontSize: "32px" }}>check_circle</span>
                </div>
                <h3 className="text-[18px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>Message Sent</h3>
                <p className="text-[14px] text-[#546478] mb-6">We'll get back to you within 24 hours.</p>
                <button onClick={goHome} className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
                  Back to Help Center
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-[#EBF0F8] rounded-lg mb-5">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>support_agent</span>
                  <div>
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Need help?</div>
                    <div className="text-[12px] text-[#546478]">Our support team typically responds within 24 hours.</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Name</label>
                      <input type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                    </div>
                    <div>
                      <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Email</label>
                      <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Subject</label>
                    <input type="text" value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Message</label>
                    <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your issue in detail..."
                      className="w-full px-3 py-2.5 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5] min-h-[120px] resize-y" />
                  </div>
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={!contactForm.subject || !contactForm.message}
                    className="w-full py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] disabled:opacity-40 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Send Message
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-[#EDF0F5]">
                  <h4 className="text-[13px] text-[#1A2332] mb-3" style={{ fontWeight: 600 }}>Other ways to reach us</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#EDF0F5]">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>email</span>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Email</div>
                        <div className="text-[12px] text-[#4A6FA5]">support@vision360.app</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#EDF0F5]">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>phone</span>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Phone</div>
                        <div className="text-[12px] text-[#4A6FA5]">(800) 360-0360</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#EDF0F5]">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>schedule</span>
                      <div>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>Business Hours</div>
                        <div className="text-[12px] text-[#546478]">Mon–Fri, 8:00 AM – 6:00 PM EST</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC] flex items-center justify-between flex-shrink-0">
          <button
            onClick={goHome}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors ${view === "home" ? "bg-[#EBF0F8] text-[#4A6FA5]" : "text-[#546478] hover:bg-[#F5F7FA]"}`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "15px" }}>menu_book</span>Docs
          </button>
          <button
            onClick={() => { setView("contact"); setSubmitted(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors ${view === "contact" ? "bg-[#EBF0F8] text-[#4A6FA5]" : "text-[#546478] hover:bg-[#F5F7FA]"}`}
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "15px" }}>chat_bubble_outline</span>Contact Us
          </button>
        </div>
      </div>
    </>
  );
}
