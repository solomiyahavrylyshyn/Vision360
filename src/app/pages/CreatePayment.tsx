import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";
import { toast } from "sonner";
import { paymentsStore } from "../stores/paymentsStore";
import type { PaymentMethod, PaymentStatus } from "./Payments";
import { PAYMENT_METHODS } from "../constants/paymentMethods";
import { initialInvoices } from "./Invoices";

const paymentMethods = PAYMENT_METHODS;

// Payment date is shown as DD.MM.YYYY (Figma) but stored/saved as ISO.
const dmyToISO = (s: string) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
const isoToDMY = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim()); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; };

// Upload files (Figma): accepted formats + size cap. UI only — files are held
// in local state for display; nothing is uploaded anywhere (no backend).
const UPLOAD_ACCEPT = ["image/svg+xml", "image/png", "image/jpeg", "image/gif"];
const UPLOAD_MAX = 3 * 1024 * 1024; // 3 MB

// Long-form date for the Invoices picker (Figma: "April 30, 2026"); guards bad data.
function fmtLongDate(d: string) {
  const dt = new Date((d || "") + "T12:00:00");
  if (!d || isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Invoice status badge colour (same semantic tokens as the Invoices list).
function invoiceStatusStyle(status: string): { color: string; backgroundColor: string } {
  const m: Record<string, [string, string]> = {
    Paid: ["#16A34A", "rgba(22,163,74,0.15)"],
    Unpaid: ["#DC2626", "rgba(220,38,38,0.15)"],
    Overdue: ["#EF4444", "rgba(239,68,68,0.15)"],
    "Partially Paid": ["#F59E0B", "rgba(245,158,11,0.15)"],
    Void: ["#9CA3AF", "rgba(156,163,175,0.15)"],
  };
  const [color, backgroundColor] = m[status] || ["#6B7280", "rgba(107,114,128,0.15)"];
  return { color, backgroundColor };
}

type InvSortField = "number" | "dueDate" | "status" | "total";

export function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClient = searchParams.get("client") || "";
  const prefilledAmount = searchParams.get("amount") || "";
  const returnTo = searchParams.get("returnTo");
  const goBack = () => navigate(returnTo || "/payments");

  // Client comes from the launch context (or, standalone, from the chosen job).
  const [client] = useState(prefilledClient);
  const [amount, setAmount] = useState(prefilledAmount);
  const [method, setMethod] = useState(searchParams.get("method") || "Credit card on file");
  const [dateText, setDateText] = useState(() => isoToDMY(new Date().toISOString().slice(0, 10)));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Invoices picker — payments are collected against INVOICES only (never jobs
  // or estimates, per Marek Jun 11 + Figma collect frame). The Total auto-fills
  // from the selected invoices' balances (still manually overridable, so a
  // partial payment is just an edited amount).
  const [invSearch, setInvSearch] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());
  const [invSortField, setInvSortField] = useState<InvSortField>("dueDate");
  const [invSortDir, setInvSortDir] = useState<"asc" | "desc">("desc");
  const [invPage, setInvPage] = useState(1);
  const [invPerPage, setInvPerPage] = useState(10);
  const allInvoices = initialInvoices;

  const candidateInvoices = useMemo(() => {
    const c = client.trim().toLowerCase();
    const byClient = c ? allInvoices.filter((i) => i.clientName.toLowerCase().includes(c)) : [];
    const base = byClient.length > 0 ? byClient : allInvoices;
    const q = invSearch.trim().toLowerCase();
    const filtered = q ? base.filter((i) => i.number.toLowerCase().includes(q) || i.jobNumber.toLowerCase().includes(q) || i.jobName.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q)) : base;
    const dir = invSortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (invSortField) {
        case "total": return (a.total - b.total) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        case "number": return a.number.localeCompare(b.number) * dir;
        default: return a.dueDate.localeCompare(b.dueDate) * dir;
      }
    });
  }, [allInvoices, client, invSearch, invSortField, invSortDir]);

  const invTotalPages = Math.max(1, Math.ceil(candidateInvoices.length / invPerPage));
  const invoicesPage = candidateInvoices.slice((invPage - 1) * invPerPage, invPage * invPerPage);

  const toggleInvoice = (id: number) => {
    const next = new Set(selectedInvoiceIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedInvoiceIds(next);
    if (next.size > 0) {
      // Collect what's actually owed: balance when there is one, else the total.
      setAmount(String(allInvoices.filter((i) => next.has(i.id)).reduce((s, i) => s + (i.balance > 0 ? i.balance : i.total), 0)));
    }
  };
  const toggleInvSort = (f: InvSortField) => {
    if (invSortField === f) setInvSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setInvSortField(f); setInvSortDir("asc"); }
  };
  const InvSortIcon = ({ field }: { field: InvSortField }) => (
    <span className="material-icons ml-0.5 align-middle text-[#9AA3AF]" style={{ fontSize: "14px" }}>
      {invSortField === field ? (invSortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  // Manual card-entry fields (US): only used when method = "Type card manually".
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");

  // Card-on-file mock (in a real build this comes from the saved payment profile).
  const cardOnFile = "Visa •••• •••• •••• 4242";

  const isCardOnFile = method === "Credit card on file";
  const isManualCard = method === "Type card manually";
  const isCharge = isCardOnFile || isManualCard;          // integrated charge vs external record
  // Card number minus formatting, for a light length check.
  const cardDigits = cardNumber.replace(/\D/g, "");

  const handleSave = () => {
    const isoDate = dmyToISO(dateText);
    if (!isoDate) { toast.error("Enter the payment date (DD.MM.YYYY)"); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }

    if (isManualCard) {
      if (cardDigits.length < 13) { toast.error("Enter a valid card number"); return; }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry)) { toast.error("Enter expiry as MM / YY"); return; }
      if (cardCvc.replace(/\D/g, "").length < 3) { toast.error("Enter the card's CVC"); return; }
      if (!cardName.trim()) { toast.error("Enter the cardholder name"); return; }
      if (!/^\d{5}(-\d{4})?$/.test(cardZip.trim())) { toast.error("Enter the billing ZIP"); return; }
    }

    // For a card charge the "reference" stores a masked last-4 / card-on-file
    // label, never the full PAN. External methods keep the user's reference #.
    const ref = isManualCard
      ? `Card ···· ${cardDigits.slice(-4)}`
      : isCardOnFile
        ? cardOnFile
        : reference.trim();

    // Client / invoice context: from the launch params, else from the selection.
    const selInvoices = allInvoices.filter((i) => selectedInvoiceIds.has(i.id));
    const effectiveClient = client.trim() || selInvoices[0]?.clientName || "—";

    const record = paymentsStore.add({
      date: isoDate,
      amount: parsedAmount,
      method: method as PaymentMethod,
      status: "Completed" as PaymentStatus,
      clientName: effectiveClient,
      clientEmail: searchParams.get("clientEmail") || selInvoices[0]?.customerEmail || "",
      invoiceId: selInvoices[0]?.id ?? (Number(searchParams.get("invoiceId")) || 0),
      invoiceNumber: selInvoices[0]?.number || searchParams.get("invoice") || "—",
      jobId: searchParams.get("job") || selInvoices[0]?.jobNumber || "",
      // Estimates / jobs trace back through the selected invoices (list columns).
      estimateNumbers: selInvoices.map((i) => i.linkedEstimate).filter(Boolean),
      jobIds: selInvoices.map((i) => i.jobNumber).filter(Boolean),
      reference: ref,
      note: note.trim(),
      createdBy: "You",
    });
    toast.success(isCharge ? `Charged $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Payment recorded");
    navigate(returnTo || `/payments/${record.id}`);
  };

  // Add picked/dropped files to local state (validates format + size). No upload.
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted: File[] = [];
    Array.from(list).forEach((f) => {
      if (!UPLOAD_ACCEPT.includes(f.type)) { toast.error(`${f.name}: unsupported format`); return; }
      if (f.size > UPLOAD_MAX) { toast.error(`${f.name}: exceeds 3MB`); return; }
      accepted.push(f);
    });
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const inputCls = "w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]";
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const labelCls = "text-[13px] text-[#374151] mb-1.5 block";

  // Disable the submit button until the form is minimally valid (Figma: muted by default).
  const amountValid = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const referenceValid = isCharge || reference.trim().length > 0; // external methods require a reference
  const canSubmit = amountValid && !!dmyToISO(dateText) && referenceValid;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Accent bar to match the other create pages */}
      <div className="h-1 bg-[#4A6FA5]" />
      <div className="max-w-[860px] mx-auto py-6 px-6">
        {/* Compact header — back chevron + title + "for <client>" inline */}
        <div className="flex items-center gap-2 mb-5">
          <button onClick={goBack} aria-label="Back" className="w-7 h-7 flex items-center justify-center rounded-md text-[#546478] hover:bg-[#EDF0F5]">
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
          </button>
          <h1 className="text-[20px] text-[#1A2332] leading-7" style={{ fontWeight: 700 }}>
            {isCharge ? "Collect payment" : "Record payment"}
          </h1>
          {prefilledClient && (
            <span className="text-[15px] text-[#6B7280]">for {client}</span>
          )}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* Details section — label on the left, fields on the right */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment date {reqStar}</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={10} value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="DD.MM.YYYY" className={`${inputCls} pr-9`} />
                  <input type="date" aria-label="Payment date" value={dmyToISO(dateText)} onChange={(e) => setDateText(isoToDMY(e.target.value))} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer opacity-0" />
                  <span className="material-icons pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "18px" }}>calendar_today</span>
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment method {reqStar}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                  {paymentMethods.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              {/* Method-dependent block */}
              {isCardOnFile ? (
                <div className="col-span-2">
                  <div className="flex items-center gap-2.5 h-10 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 max-w-[280px]">
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>credit_card</span>
                    <span className="text-[14px] text-[#1A2332] tracking-wide" style={{ fontWeight: 600 }}>{cardOnFile}</span>
                    <span className="material-icons text-[#16A34A] ml-auto" style={{ fontSize: "16px" }}>verified</span>
                  </div>
                </div>
              ) : isManualCard ? null : (
                <div>
                  {/* "Transaction number" per Marek (Jun 11) — Figma's "Reference" label is stale. */}
                  <label className={labelCls} style={{ fontWeight: 500 }}>Transaction number {reqStar}</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. check #, Venmo confirmation…" className={inputCls} />
                </div>
              )}

              {/* Manual card entry — flat fields below the method row (Figma: 3-in-a-row) */}
              {isManualCard && (
                <div className="col-span-2 grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Card number {reqStar}</label>
                    <input value={cardNumber} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                      placeholder="1234 1234 1234 1234" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Expiry {reqStar}</label>
                    <input value={cardExpiry} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d /]/g, "").slice(0, 7))}
                      placeholder="MM / YY" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} style={{ fontWeight: 500 }}>CVC {reqStar}</label>
                    <input value={cardCvc} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Cardholder name {reqStar}</label>
                    <input value={cardName} autoComplete="off" onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className={inputCls} />
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Billing ZIP {reqStar}</label>
                    <input value={cardZip} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                      placeholder="33606" className={`${inputCls} tabular-nums`} />
                  </div>
                  <p className="col-span-6 text-[12px] text-[#9CA3AF]">Card details process this charge only — they are not stored on the client record.</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoices section — payments are collected against invoices ONLY
              (never jobs or estimates). Columns per the Figma collect frame:
              Number · Job · Status · Due date · Total. */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices {reqStar}</div>
            <div>
              <div className="relative mb-3">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input value={invSearch} onChange={(e) => { setInvSearch(e.target.value); setInvPage(1); }} placeholder="Search invoices…" className={`${inputCls} pl-10`} />
              </div>
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-left text-[13px] text-[#6B7280]">
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleInvSort("number")}><span className="inline-flex items-center">Number<InvSortIcon field="number" /></span></th>
                      <th className="px-3 py-2" style={{ fontWeight: 500 }}>Job</th>
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleInvSort("status")}><span className="inline-flex items-center">Status<InvSortIcon field="status" /></span></th>
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleInvSort("dueDate")}><span className="inline-flex items-center">Due date<InvSortIcon field="dueDate" /></span></th>
                      <th className="px-3 py-2 text-right cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleInvSort("total")}><span className="inline-flex items-center justify-end">Total<InvSortIcon field="total" /></span></th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesPage.length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-[13px] text-[#9CA3AF]">No invoices found</td></tr>
                    ) : invoicesPage.map((i) => (
                      <tr key={i.id} onClick={() => toggleInvoice(i.id)}
                        className="border-b border-[#EDF0F5] last:border-0 hover:bg-[#F9FBFD] cursor-pointer">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selectedInvoiceIds.has(i.id)} onChange={() => toggleInvoice(i.id)} onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{i.number}</div>
                          <div className="text-[12px] text-[#6B7280]">{i.clientName}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          {i.jobNumber ? (
                            <>
                              <div className="text-[#4A6FA5] text-[13px]" style={{ fontWeight: 500 }}>{i.jobNumber}</div>
                              <div className="text-[12px] text-[#6B7280]">{i.jobName}</div>
                            </>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[12px] whitespace-nowrap" style={{ fontWeight: 600, ...invoiceStatusStyle(i.status) }}>{i.status}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[#546478] whitespace-nowrap">{fmtLongDate(i.dueDate)}</td>
                        <td className="px-3 py-2.5 text-right text-[#1A2332]" style={{ fontWeight: 600 }}>${i.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <KebabMenu>
                            <KebabItem icon="visibility" onSelect={() => navigate(`/invoices/${i.id}`)}>View invoice</KebabItem>
                            <KebabItem icon="open_in_new" onSelect={() => window.open(`/invoices/${i.id}`, "_blank", "noopener,noreferrer")}>Open in new tab</KebabItem>
                          </KebabMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select value={invPerPage} onChange={(e) => { setInvPerPage(Number(e.target.value)); setInvPage(1); }} className="h-8 px-2 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>
                    {candidateInvoices.length === 0 ? "0-0" : `${(invPage - 1) * invPerPage + 1}-${Math.min(invPage * invPerPage, candidateInvoices.length)}`} of {candidateInvoices.length}
                    {selectedInvoiceIds.size > 0 ? ` · ${selectedInvoiceIds.size} selected` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={invPage === 1} onClick={() => setInvPage((p) => Math.max(1, p - 1))} className="w-7 h-7 flex items-center justify-center rounded-md text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
                  </button>
                  <button type="button" disabled={invPage >= invTotalPages} onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))} className="w-7 h-7 flex items-center justify-center rounded-md text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Total section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total {reqStar}</div>
            <div className="max-w-[240px]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
          </div>

          {/* Upload files section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Upload files</div>
            <div>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${dragOver ? "border-[#4A6FA5] bg-[#EEF3FA]" : "border-[#D8DEE8] hover:bg-[#F9FBFD]"}`}
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] bg-white">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>file_upload</span>
                </span>
                <div className="text-[14px] text-[#546478]">Drop your files here, or <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>click to browse</span></div>
                <div className="text-[12px] text-[#9CA3AF]">SVG, PNG, JPG or GIF (max. 3MB)</div>
                <input type="file" accept="image/svg+xml,image/png,image/jpeg,image/gif" multiple className="hidden"
                  onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                      <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>insert_drive_file</span>
                      <span className="text-[13px] text-[#1A2332] truncate flex-1">{f.name}</span>
                      <span className="text-[12px] text-[#9CA3AF] flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-[#9CA3AF] hover:text-[#DC2626] flex-shrink-0">
                        <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any relevant notes…"
              className="w-full min-h-[80px] px-3 py-2 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] resize-y" />
          </div>

          <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={goBack}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSubmit}
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]">
              {isCharge ? "Collect payment" : "Record payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
