import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";

// Mock catalog items
const mockCatalogItems: CatalogItem[] = [
  { id: 1000, name: "Heat Pump Repair or Service", itemDescription: "Standard heat pump repair service call", salesDescription: "Heat pump diagnostic, repair and service", brand: "Carrier", modelNumber: "HP-2500", rate: 285, cost: 120, taxable: false, category: "HVAC", type: "Service" },
  { id: 1001, name: "SEER Heat Pump Condenser Unit", itemDescription: "SEER 16 heat pump condenser outdoor unit", salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit", brand: "Trane", modelNumber: "XR16-048", rate: 3200, cost: 1800, taxable: true, category: "HVAC", type: "Product" },
  { id: 1003, name: "Copper Piping Installation", itemDescription: "Install copper piping per linear foot", salesDescription: "Professional copper piping installation (per ft)", brand: "", modelNumber: "", rate: 18.50, cost: 6.75, taxable: true, category: "Plumbing", type: "Service" },
  { id: 1005, name: "General Labor - Technician", itemDescription: "Standard technician labor rate per hour", salesDescription: "Technician labor (hourly)", brand: "", modelNumber: "", rate: 95, cost: 45, taxable: false, category: "Labor", type: "Labor" },
];

const categories = [
  "Materials",
  "Fuel",
  "Tools",
  "Software",
  "Meals",
  "Travel",
  "Subcontractor",
  "Office Supplies",
  "Equipment Rental",
  "Other",
];

const categoryIcons: Record<string, string> = {
  Materials: "hardware",
  Fuel: "local_gas_station",
  Tools: "build",
  Software: "terminal",
  Meals: "restaurant",
  Travel: "flight",
  Subcontractor: "engineering",
  "Office Supplies": "print",
  "Equipment Rental": "forklift",
  Other: "more_horiz",
};

const mockJobs = [
  { id: "J-1234", title: "HVAC Installation — 123 Main St" },
  { id: "J-1235", title: "Plumbing Repair — 456 Oak Ave" },
  { id: "J-1236", title: "Equipment Repair — 789 Pine Rd" },
  { id: "J-1237", title: "Electrical Work — 101 Elm St" },
  { id: "J-1238", title: "Roof Inspection — 202 Birch Ln" },
];

const mockInvoices = [
  { id: "INV-0042", jobId: "J-1234", client: "Acme Corp" },
  { id: "INV-0043", jobId: "J-1235", client: "Wayne Industries" },
  { id: "INV-0044", jobId: "J-1236", client: "Stark LLC" },
  { id: "INV-0045", jobId: "J-1237", client: "Daily Planet" },
];

interface ReceiptFile {
  name: string;
  size: string;
  type: "image" | "pdf";
  preview?: string;
}

export function CreateExpense() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [total, setTotal] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [jobId, setJobId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate] = useState(7.5);

  // Job search
  const [jobSearch, setJobSearch] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceDropdownOpen, setInvoiceDropdownOpen] = useState(false);

  const filteredInvoices = jobId
    ? mockInvoices.filter((inv) => inv.jobId === jobId)
    : mockInvoices;

  const filteredJobs = mockJobs.filter(
    (j) =>
      !jobSearch ||
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.id.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredInvSearch = filteredInvoices.filter(
    (i) =>
      !invoiceSearch ||
      i.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      i.client.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const processFiles = useCallback((files: FileList | File[]) => {
    const newReceipts: ReceiptFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024
        ? (f.size / 1024).toFixed(1) + " KB"
        : (f.size / (1024 * 1024)).toFixed(1) + " MB",
      type: f.type.startsWith("image/") ? "image" : "pdf",
      preview: f.type.startsWith("image/")
        ? URL.createObjectURL(f)
        : undefined,
    }));
    setReceipts((prev) => [...prev, ...newReceipts]);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeReceipt = (idx: number) => {
    setReceipts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    const newLineItem = catalogItemToLineItem(catalogItem, newId, 1);
    setLineItems([...lineItems, newLineItem]);
    setItemPickerOpen(false);
  };

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setLineItems(lineItems.map((li) => {
      if (li.id === id) {
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return li;
    }));
  };

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter((li) => li.id !== id));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const calculatedTotal = subtotal + taxAmount;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => navigate("/expenses"), 600);
  };

  const isValid = merchant.trim() && category && expenseDate && (total || lineItems.length > 0);

  const selectedJob = mockJobs.find((j) => j.id === jobId);
  const selectedInvoice = mockInvoices.find((i) => i.id === invoiceId);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-full bg-[#F5F7FA]">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-[#DDE3EE]">
        <div className="max-w-[1120px] mx-auto px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <button
                onClick={() => navigate("/expenses")}
                className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-lg border border-[#DDE3EE] bg-white hover:bg-[#F5F7FA] transition-colors flex-shrink-0"
              >
                <span
                  className="material-icons text-[#546478]"
                  style={{ fontSize: "20px" }}
                >
                  arrow_back
                </span>
              </button>
              <div>
                <h1
                  className="text-[26px] text-[#1A2332]"
                  style={{ fontWeight: 700 }}
                >Create Expense</h1>
                <p className="text-[13px] text-[#8899AA] mt-0.5"></p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => navigate("/expenses")}
                className="h-10 px-5 rounded-lg border border-[#DDE3EE] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="h-10 px-6 rounded-lg bg-[#4A6FA5] text-white text-[13px] hover:bg-[#3D5F8F] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {saving ? (
                  <>
                    <span
                      className="material-icons animate-spin"
                      style={{ fontSize: "16px" }}
                    >
                      refresh
                    </span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span
                      className="material-icons"
                      style={{ fontSize: "16px" }}
                    >
                      check
                    </span>
                    Save Expense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1120px] mx-auto px-6 py-6">
        <div className="flex gap-6 items-start flex-col lg:flex-row">
          {/* ════════════════════════════════════════════════════════════════
              LEFT COLUMN — Expense Form
             ════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 w-full">
            {/* ── Basic Info ── */}
            <div className="bg-white border border-[#DDE3EE] rounded-xl p-6 mb-5">
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="material-icons text-[#4A6FA5]"
                  style={{ fontSize: "20px" }}
                >
                  receipt_long
                </span>
                <h2
                  className="text-[15px] text-[#1A2332]"
                  style={{ fontWeight: 600 }}
                >
                  Basic Info
                </h2>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  className="block text-[12px] text-[#546478] mb-1.5"
                  style={{ fontWeight: 500 }}
                >
                  Expense description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Supplies for commercial HVAC project"
                  className="w-full h-10 px-3.5 border border-[#DDE3EE] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all"
                />
              </div>

              {/* Merchant + Category row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Merchant <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Home Depot"
                    className="w-full h-10 px-3.5 border border-[#DDE3EE] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all"
                  />
                </div>
                <div>
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Category <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full h-10 px-3.5 pr-9 border border-[#DDE3EE] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all appearance-none ${category ? "text-[#1A2332]" : "text-[#B0BEC5]"}`}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span
                      className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
                      style={{ fontSize: "18px" }}
                    >
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Date + Amount row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Expense date <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full h-10 px-3.5 border border-[#DDE3EE] rounded-lg text-[13px] bg-white text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all"
                  />
                </div>
                <div>
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Total amount <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8899AA]" style={{ fontWeight: 500 }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 pl-8 pr-3.5 border border-[#DDE3EE] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Link to Job / Invoice ── */}
            <div className="bg-white border border-[#DDE3EE] rounded-xl p-6 mb-5">
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="material-icons text-[#4A6FA5]"
                  style={{ fontSize: "20px" }}
                >
                  link
                </span>
                <h2
                  className="text-[15px] text-[#1A2332]"
                  style={{ fontWeight: 600 }}
                >
                  Link to Job or Invoice
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job searchable select */}
                <div className="relative">
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Job
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setJobDropdownOpen(!jobDropdownOpen);
                        setInvoiceDropdownOpen(false);
                      }}
                      className="w-full h-10 px-3.5 pr-9 border border-[#DDE3EE] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all text-left flex items-center"
                    >
                      {selectedJob ? (
                        <span className="text-[#1A2332] truncate">
                          <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                            #{selectedJob.id}
                          </span>{" "}
                          — {selectedJob.title}
                        </span>
                      ) : (
                        <span className="text-[#B0BEC5]">Select a job</span>
                      )}
                    </button>
                    <span
                      className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
                      style={{ fontSize: "18px" }}
                    >
                      {jobDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>

                  {jobDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-20 overflow-hidden">
                      <div className="p-2 border-b border-[#EDF0F5]">
                        <div className="relative">
                          <span
                            className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                            style={{ fontSize: "16px" }}
                          >
                            search
                          </span>
                          <input
                            type="text"
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                            placeholder="Search jobs..."
                            autoFocus
                            className="w-full h-8 pl-8 pr-3 border border-[#DDE3EE] rounded-md text-[12px] bg-[#F9FAFB] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5]"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        <button
                          onClick={() => {
                            setJobId("");
                            setInvoiceId("");
                            setJobDropdownOpen(false);
                            setJobSearch("");
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-[#F5F7FA] transition-colors ${!jobId ? "text-[#4A6FA5]" : "text-[#546478]"}`}
                          style={{ fontWeight: !jobId ? 500 : 400 }}
                        >
                          None
                        </button>
                        {filteredJobs.map((j) => (
                          <button
                            key={j.id}
                            onClick={() => {
                              setJobId(j.id);
                              setInvoiceId("");
                              setJobDropdownOpen(false);
                              setJobSearch("");
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-[#F5F7FA] transition-colors ${jobId === j.id ? "bg-[#EBF2FC]" : ""}`}
                          >
                            <span
                              className="text-[#4A6FA5]"
                              style={{ fontWeight: 500 }}
                            >
                              #{j.id}
                            </span>{" "}
                            <span className="text-[#1A2332]">{j.title}</span>
                          </button>
                        ))}
                        {filteredJobs.length === 0 && (
                          <div className="px-3.5 py-4 text-[12px] text-[#8899AA] text-center">
                            No jobs match your search
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoice searchable select */}
                <div className="relative">
                  <label
                    className="block text-[12px] text-[#546478] mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    Invoice
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceDropdownOpen(!invoiceDropdownOpen);
                        setJobDropdownOpen(false);
                      }}
                      className="w-full h-10 px-3.5 pr-9 border border-[#DDE3EE] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all text-left flex items-center"
                    >
                      {selectedInvoice ? (
                        <span className="text-[#1A2332] truncate">
                          <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                            #{selectedInvoice.id}
                          </span>{" "}
                          — {selectedInvoice.client}
                        </span>
                      ) : (
                        <span className="text-[#B0BEC5]">Select an invoice</span>
                      )}
                    </button>
                    <span
                      className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
                      style={{ fontSize: "18px" }}
                    >
                      {invoiceDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>

                  {invoiceDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-20 overflow-hidden">
                      <div className="p-2 border-b border-[#EDF0F5]">
                        <div className="relative">
                          <span
                            className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                            style={{ fontSize: "16px" }}
                          >
                            search
                          </span>
                          <input
                            type="text"
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                            placeholder="Search invoices..."
                            autoFocus
                            className="w-full h-8 pl-8 pr-3 border border-[#DDE3EE] rounded-md text-[12px] bg-[#F9FAFB] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5]"
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        <button
                          onClick={() => {
                            setInvoiceId("");
                            setInvoiceDropdownOpen(false);
                            setInvoiceSearch("");
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-[#F5F7FA] transition-colors ${!invoiceId ? "text-[#4A6FA5]" : "text-[#546478]"}`}
                          style={{ fontWeight: !invoiceId ? 500 : 400 }}
                        >
                          None
                        </button>
                        {filteredInvSearch.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              setInvoiceId(inv.id);
                              setInvoiceDropdownOpen(false);
                              setInvoiceSearch("");
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-[#F5F7FA] transition-colors ${invoiceId === inv.id ? "bg-[#EBF2FC]" : ""}`}
                          >
                            <span
                              className="text-[#4A6FA5]"
                              style={{ fontWeight: 500 }}
                            >
                              #{inv.id}
                            </span>{" "}
                            <span className="text-[#1A2332]">{inv.client}</span>
                          </button>
                        ))}
                        {filteredInvSearch.length === 0 && (
                          <div className="px-3.5 py-4 text-[12px] text-[#8899AA] text-center">
                            No invoices match your search
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {jobId && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-[#EBF2FC] rounded-lg">
                  <span
                    className="material-icons text-[#4A6FA5] flex-shrink-0 mt-0.5"
                    style={{ fontSize: "16px" }}
                  >
                    info
                  </span>
                  <span className="text-[12px] text-[#3D5F8F] leading-relaxed">
                    This expense will be linked to{" "}
                    <span style={{ fontWeight: 600 }}>#{jobId}</span> and will
                    appear in job cost reports.
                  </span>
                </div>
              )}
            </div>

            {/* ── Line Items ── */}
            <div className="bg-white border border-[#DDE3EE] rounded-xl p-6 mb-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span
                    className="material-icons text-[#4A6FA5]"
                    style={{ fontSize: "20px" }}
                  >
                    shopping_cart
                  </span>
                  <h2
                    className="text-[15px] text-[#1A2332]"
                    style={{ fontWeight: 600 }}
                  >
                    Line Items
                  </h2>
                  <span className="text-[12px] text-[#8899AA]">Optional</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setItemPickerOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A6FA5] hover:bg-[#3D5F8F] text-white rounded-lg text-[12px] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
                  Add Item
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="border-2 border-dashed border-[#DDE3EE] rounded-lg py-8 text-center">
                  <span className="material-icons text-[#D1D5DB] mb-2" style={{ fontSize: "32px" }}>inventory_2</span>
                  <p className="text-[13px] text-[#8899AA]">No items added yet</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setItemPickerOpen(true);
                    }}
                    className="mt-3 text-[12px] text-[#4A6FA5] hover:text-[#3D5F8F] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    + Add your first item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((li) => (
                    <div key={li.id} className="border border-[#DDE3EE] rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-[13px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>{li.name}</div>
                          {li.description && (
                            <div className="text-[12px] text-[#8899AA] mb-2">{li.description}</div>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[11px] text-[#8899AA] mb-1 block">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={li.quantity}
                                onChange={(e) => updateLineItem(li.id, "quantity", Number(e.target.value))}
                                className="w-full h-8 px-2 border border-[#DDE3EE] rounded text-[12px] outline-none focus:border-[#4A6FA5]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#8899AA] mb-1 block">Unit Price</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={li.unitPrice}
                                onChange={(e) => updateLineItem(li.id, "unitPrice", Number(e.target.value))}
                                className="w-full h-8 px-2 border border-[#DDE3EE] rounded text-[12px] outline-none focus:border-[#4A6FA5]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#8899AA] mb-1 block">Total</label>
                              <div className="h-8 px-2 bg-[#F5F7FA] border border-[#DDE3EE] rounded text-[12px] flex items-center" style={{ fontWeight: 500 }}>
                                ${li.total.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeLineItem(li.id)}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#8899AA] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                        >
                          <span className="material-icons" style={{ fontSize: "18px" }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lineItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#DDE3EE]">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#8899AA]">Subtotal</span>
                      <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#8899AA]">Tax ({taxRate}%)</span>
                      <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[15px] pt-2 border-t border-[#DDE3EE]">
                      <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
                      <span className="text-[#1A2332]" style={{ fontWeight: 700 }}>${calculatedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Notes ── */}
            <div className="bg-white border border-[#DDE3EE] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="material-icons text-[#4A6FA5]"
                  style={{ fontSize: "20px" }}
                >
                  edit_note
                </span>
                <h2
                  className="text-[15px] text-[#1A2332]"
                  style={{ fontWeight: 600 }}
                >
                  Notes
                </h2>
                <span className="text-[12px] text-[#8899AA]">Optional</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any internal notes about this expense..."
                rows={4}
                className="w-full px-3.5 py-3 border border-[#DDE3EE] rounded-lg text-[13px] bg-white text-[#1A2332] placeholder:text-[#B0BEC5] outline-none resize-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Receipt Panel
             ════════════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[360px] lg:flex-shrink-0">
            <div className="bg-white border border-[#DDE3EE] rounded-xl overflow-hidden lg:sticky lg:top-6">
              {/* Panel header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#DDE3EE]">
                <span
                  className="material-icons text-[#4A6FA5]"
                  style={{ fontSize: "20px" }}
                >
                  receipt
                </span>
                <h2
                  className="text-[15px] text-[#1A2332]"
                  style={{ fontWeight: 600 }}
                >
                  Receipt
                </h2>
                {receipts.length > 0 && (
                  <span
                    className="ml-auto text-[11px] px-2 py-0.5 bg-[#4A6FA5]/10 text-[#4A6FA5] rounded-full"
                    style={{ fontWeight: 600 }}
                  >
                    {receipts.length} file{receipts.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="p-5">
                {/* Drop zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
                    dragOver
                      ? "border-[#4A6FA5] bg-[#4A6FA5]/5"
                      : "border-[#DDE3EE] hover:border-[#4A6FA5]/40 hover:bg-[#F9FAFB]"
                  } ${receipts.length === 0 ? "py-10" : "py-6"}`}
                >
                  <div className="flex flex-col items-center text-center px-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                        dragOver
                          ? "bg-[#4A6FA5]/15"
                          : "bg-[#F0F4FA] group-hover:bg-[#4A6FA5]/10"
                      }`}
                    >
                      <span
                        className={`material-icons transition-colors ${
                          dragOver
                            ? "text-[#4A6FA5]"
                            : "text-[#8899AA] group-hover:text-[#4A6FA5]"
                        }`}
                        style={{ fontSize: "28px" }}
                      >
                        cloud_upload
                      </span>
                    </div>
                    <p
                      className="text-[13px] text-[#1A2332] mb-1"
                      style={{ fontWeight: 500 }}
                    >
                      {dragOver
                        ? "Drop files here"
                        : "Drag & drop receipt here"}
                    </p>
                    <p className="text-[11px] text-[#8899AA]">
                      or click to browse • JPG, PNG, PDF
                    </p>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 h-10 border border-[#DDE3EE] rounded-lg text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <span
                      className="material-icons text-[#4A6FA5]"
                      style={{ fontSize: "18px" }}
                    >
                      upload_file
                    </span>
                    Upload
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 h-10 border border-[#DDE3EE] rounded-lg text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <span
                      className="material-icons text-[#4A6FA5]"
                      style={{ fontSize: "18px" }}
                    >
                      photo_camera
                    </span>
                    Take Photo
                  </button>
                </div>

                {/* Scan receipt hint */}
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-[#F9FAFB] rounded-lg">
                  <span
                    className="material-icons text-[#8899AA]"
                    style={{ fontSize: "18px" }}
                  >
                    document_scanner
                  </span>
                  <div>
                    <span
                      className="text-[12px] text-[#546478]"
                      style={{ fontWeight: 500 }}
                    >
                      Auto-scan coming soon
                    </span>
                    <p className="text-[11px] text-[#8899AA] leading-snug">
                      Upload a receipt and we'll extract details automatically.
                    </p>
                  </div>
                </div>

                {/* Uploaded receipts list */}
                {receipts.length > 0 && (
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] text-[#8899AA] uppercase tracking-wider"
                        style={{ fontWeight: 600 }}
                      >
                        Uploaded files
                      </span>
                    </div>
                    {receipts.map((r, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-3 p-2.5 bg-[#F9FAFB] rounded-lg border border-[#EDF0F5] hover:border-[#DDE3EE] transition-colors"
                      >
                        {/* Thumbnail / icon */}
                        {r.preview ? (
                          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-[#DDE3EE]">
                            <img
                              src={r.preview}
                              alt={r.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-[#EBF2FC] flex items-center justify-center flex-shrink-0">
                            <span
                              className="material-icons text-[#4A6FA5]"
                              style={{ fontSize: "20px" }}
                            >
                              picture_as_pdf
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[12px] text-[#1A2332] truncate"
                            style={{ fontWeight: 500 }}
                          >
                            {r.name}
                          </p>
                          <p className="text-[11px] text-[#8899AA]">{r.size}</p>
                        </div>
                        <button
                          onClick={() => removeReceipt(idx)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#8899AA] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: "16px" }}
                          >
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick summary card - only on desktop */}
            {(merchant || category || total || lineItems.length > 0) && (
              <div className="hidden lg:block bg-white border border-[#DDE3EE] rounded-xl mt-5 p-5">
                <h3
                  className="text-[12px] text-[#8899AA] uppercase tracking-wider mb-3"
                  style={{ fontWeight: 600 }}
                >
                  Summary
                </h3>
                <div className="space-y-2.5">
                  {merchant && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#546478]">
                        Merchant
                      </span>
                      <span
                        className="text-[13px] text-[#1A2332]"
                        style={{ fontWeight: 500 }}
                      >
                        {merchant}
                      </span>
                    </div>
                  )}
                  {category && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#546478]">
                        Category
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="material-icons text-[#4A6FA5]"
                          style={{ fontSize: "14px" }}
                        >
                          {categoryIcons[category] || "label"}
                        </span>
                        <span
                          className="text-[13px] text-[#1A2332]"
                          style={{ fontWeight: 500 }}
                        >
                          {category}
                        </span>
                      </span>
                    </div>
                  )}
                  {lineItems.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#546478]">Line items</span>
                      <span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                        {lineItems.length} item{lineItems.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {(total || lineItems.length > 0) && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-[#EDF0F5]">
                      <span
                        className="text-[13px] text-[#546478]"
                        style={{ fontWeight: 500 }}
                      >
                        Total
                      </span>
                      <span
                        className="text-[18px] text-[#1A2332]"
                        style={{
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        $
                        {lineItems.length > 0
                          ? calculatedTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : parseFloat(total || "0").toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </span>
                    </div>
                  )}
                  {selectedJob && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#546478]">Job</span>
                      <span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                        #{selectedJob.id}
                      </span>
                    </div>
                  )}
                  {selectedInvoice && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#546478]">
                        Invoice
                      </span>
                      <span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                        #{selectedInvoice.id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky save bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDE3EE] px-4 py-3 z-30 flex gap-3">
        <button
          onClick={() => navigate("/expenses")}
          className="flex-1 h-11 rounded-lg border border-[#DDE3EE] text-[14px] text-[#546478] hover:bg-[#F5F7FA] transition-colors"
          style={{ fontWeight: 500 }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="flex-[2] h-11 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3D5F8F] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ fontWeight: 600 }}
        >
          {saving ? (
            <>
              <span
                className="material-icons animate-spin"
                style={{ fontSize: "18px" }}
              >
                refresh
              </span>
              Saving...
            </>
          ) : (
            <>
              <span
                className="material-icons"
                style={{ fontSize: "18px" }}
              >
                check
              </span>
              Save Expense
            </>
          )}
        </button>
      </div>

      {/* ItemPicker Modal */}
      {itemPickerOpen && (
        <ItemPicker
          open={itemPickerOpen}
          onClose={() => setItemPickerOpen(false)}
          catalogItems={mockCatalogItems}
          onSelectItem={handleSelectItem}
        />
      )}
    </div>
  );
}
