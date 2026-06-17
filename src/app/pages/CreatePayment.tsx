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

// Long-form date for the Invoices table/picker (Figma: "April 30, 2026"); guards bad data.
function fmtLongDate(d: string) {
  const dt = new Date((d || "") + "T12:00:00");
  if (!d || isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

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

export function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClient = searchParams.get("client") || "";
  const returnTo = searchParams.get("returnTo");
  const goBack = () => navigate(returnTo || "/payments");

  // Client comes from the launch context (or, standalone, from the chosen invoices).
  const [client] = useState(prefilledClient);
  // Guard the method param: ignore anything not in the known list (URL tampering).
  const rawMethod = searchParams.get("method") || "Credit Card";
  const [method, setMethod] = useState((paymentMethods as readonly string[]).includes(rawMethod) ? rawMethod : "Credit Card");
  const [dateText, setDateText] = useState(() => isoToDMY(new Date().toISOString().slice(0, 10)));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  // Card-entry fields (US): shown for card-type methods (Card / Credit Card / Debit Card).
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");

  // Card-type methods (Card / Credit Card / Debit Card) capture card details and
  // count as a live charge; every other method (Cash, Check, Bank Transfer,
  // Consumer Financing, Venmo, Zelle, Other) is recorded with a transaction #.
  const isCard = ["Card", "Credit Card", "Debit Card"].includes(method);
  const isCharge = isCard;
  const cardDigits = cardNumber.replace(/\D/g, "");

  // Invoices — payments are collected against INVOICES only (never jobs or
  // estimates, per Marek Jun 11 + Figma collect frame). The amount auto-sums
  // from the added invoices' balances. Invoices are chosen via the "Add invoice"
  // modal (catalog picker); the main table shows only what's been added.
  const allInvoices = initialInvoices;
  // Preselect the invoice when arriving from an invoice's "Collect payment".
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(() => {
    const inv = searchParams.get("invoice");
    const match = inv ? allInvoices.find((i) => i.number === inv) : null;
    return match ? new Set([match.id]) : new Set();
  });
  const [tableSearch, setTableSearch] = useState("");   // filters the added rows
  const [addOpen, setAddOpen] = useState(false);        // Add-invoice modal
  const [modalSearch, setModalSearch] = useState("");
  const [modalChecked, setModalChecked] = useState<Set<number>>(new Set());

  const selectedInvoices = useMemo(
    () => allInvoices.filter((i) => selectedInvoiceIds.has(i.id)),
    [allInvoices, selectedInvoiceIds]
  );
  // Collect what's actually owed: balance when there is one, else the total.
  const owed = (i: { balance: number; total: number }) => (i.balance > 0 ? i.balance : i.total);
  const total = selectedInvoices.reduce((s, i) => s + owed(i), 0);

  const visibleRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return selectedInvoices;
    return selectedInvoices.filter(
      (i) => i.number.toLowerCase().includes(q) || i.jobNumber.toLowerCase().includes(q) || i.jobName.toLowerCase().includes(q)
    );
  }, [selectedInvoices, tableSearch]);

  // Candidate invoices for the Add-invoice modal — scoped to the client when we
  // have one, else the whole catalog; further narrowed by the modal search.
  const candidateInvoices = useMemo(() => {
    const c = client.trim().toLowerCase();
    // Exact client match (not substring) so e.g. "Apple" doesn't pull "Pineapple".
    const byClient = c ? allInvoices.filter((i) => i.clientName.trim().toLowerCase() === c) : [];
    const base = byClient.length > 0 ? byClient : allInvoices;
    const q = modalSearch.trim().toLowerCase();
    return q
      ? base.filter((i) => i.number.toLowerCase().includes(q) || i.jobNumber.toLowerCase().includes(q) || i.jobName.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q))
      : base;
  }, [allInvoices, client, modalSearch]);

  const openAddModal = () => { setModalChecked(new Set(selectedInvoiceIds)); setModalSearch(""); setAddOpen(true); };
  const toggleModal = (id: number) => setModalChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirmAdd = () => { setSelectedInvoiceIds(new Set(modalChecked)); setAddOpen(false); };
  const removeInvoice = (id: number) => setSelectedInvoiceIds((prev) => { const n = new Set(prev); n.delete(id); return n; });

  const handleSave = () => {
    const isoDate = dmyToISO(dateText);
    if (!isoDate) { toast.error("Enter the payment date (DD.MM.YYYY)"); return; }
    if (selectedInvoices.length === 0) { toast.error("Add at least one invoice"); return; }
    if (total <= 0) { toast.error("The selected invoices have nothing due"); return; }

    if (isCard) {
      if (cardDigits.length < 13) { toast.error("Enter a valid card number"); return; }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry)) { toast.error("Enter expiry as MM / YY"); return; }
      if (cardCvc.replace(/\D/g, "").length < 3) { toast.error("Enter the card's CVC"); return; }
      if (!cardName.trim()) { toast.error("Enter the cardholder name"); return; }
      if (!/^\d{5}(-\d{4})?$/.test(cardZip.trim())) { toast.error("Enter the billing ZIP"); return; }
    } else if (!reference.trim()) {
      toast.error("Enter the transaction number"); return;
    }

    // For a card charge the "reference" stores a masked last-4, never the full
    // PAN. External methods keep the user's transaction / reference number.
    const ref = isCard ? `Card ···· ${cardDigits.slice(-4)}` : reference.trim();

    const effectiveClient = client.trim() || selectedInvoices[0]?.clientName || "—";

    const record = paymentsStore.add({
      date: isoDate,
      amount: total,
      method: method as PaymentMethod,
      status: "Completed" as PaymentStatus,
      clientName: effectiveClient,
      clientEmail: searchParams.get("clientEmail") || selectedInvoices[0]?.customerEmail || "",
      invoiceId: selectedInvoices[0]?.id ?? 0,
      invoiceNumber: selectedInvoices[0]?.number || "—",
      jobId: searchParams.get("job") || selectedInvoices[0]?.jobNumber || "",
      // Estimates / jobs trace back through the selected invoices (list columns).
      estimateNumbers: selectedInvoices.map((i) => i.linkedEstimate).filter(Boolean),
      jobIds: selectedInvoices.map((i) => i.jobNumber).filter(Boolean),
      reference: ref,
      note: note.trim(),
      createdBy: "You",
    });
    toast.success(isCharge ? `Charged ${money(total)}` : "Payment recorded");
    navigate(returnTo || `/payments/${record.id}`);
  };

  // ── shared field styles (universal form spec: 36px, 8px radius, shadow-xs) ──
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const labelCls = "block text-[14px] text-[#1A2332] mb-1";
  const inputCls = "w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]";

  // Disable the submit button until the form is minimally valid (Figma: muted by default).
  const dateValid = !!dmyToISO(dateText);
  const cardValid = cardDigits.length >= 13 && /^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry) && cardCvc.replace(/\D/g, "").length >= 3 && !!cardName.trim() && /^\d{5}(-\d{4})?$/.test(cardZip.trim());
  const methodValid = isCard ? cardValid : reference.trim().length > 0;
  const canSubmit = dateValid && selectedInvoices.length > 0 && total > 0 && methodValid;

  const Badge = ({ status }: { status: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px] whitespace-nowrap" style={{ fontWeight: 500, ...invoiceStatusStyle(status) }}>{status}</span>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* page_header — back chevron + title + "for <client>" inline */}
        <div className="flex items-center justify-between py-6 px-4">
          <div className="flex items-center gap-2">
            <button onClick={goBack} aria-label="Back" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5]">
              <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
            </button>
            <div className="flex items-end gap-2">
              <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>
                {isCharge ? "Collect payment" : "Record payment"}
              </h1>
              {client && <span className="text-[16px] text-[#6B7280] pb-0.5 leading-6">for {client}</span>}
            </div>
          </div>
        </div>

        {/* table_container */}
        <div className="px-4 pb-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-6">
            {/* ── Details ── */}
            <section className="flex justify-between gap-16 pb-6 border-b border-[#E5E7EB]">
              <h2 className="shrink-0 text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details {reqStar}</h2>
              <div className="w-[777px] max-w-full flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Payment date {reqStar}</label>
                    <div className="relative">
                      <input type="text" inputMode="numeric" maxLength={10} value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="DD.MM.YYYY" className={`${inputCls} pr-9`} />
                      <input type="date" aria-label="Payment date" value={dmyToISO(dateText)} onChange={(e) => setDateText(isoToDMY(e.target.value))} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer opacity-0" />
                      <span className="material-icons pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "18px" }}>calendar_today</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Payment method {reqStar}</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                      {paymentMethods.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                {/* Card-entry fields show for card-type methods (live charge). */}
                {isCard && (
                  <>
                    <div>
                      <label className={labelCls} style={{ fontWeight: 500 }}>Card number {reqStar}</label>
                      <input value={cardNumber} inputMode="numeric" autoComplete="off"
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                        placeholder="1234 1234 1234 1234" className={`${inputCls} tabular-nums`} />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={labelCls} style={{ fontWeight: 500 }}>Expiry {reqStar}</label>
                        <input value={cardExpiry} inputMode="numeric" autoComplete="off"
                          onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d /]/g, "").slice(0, 7))}
                          placeholder="08 / 27" className={`${inputCls} tabular-nums`} />
                      </div>
                      <div className="flex-1">
                        <label className={labelCls} style={{ fontWeight: 500 }}>CVC {reqStar}</label>
                        <input value={cardCvc} inputMode="numeric" autoComplete="off"
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123" className={`${inputCls} tabular-nums`} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={labelCls} style={{ fontWeight: 500 }}>Cardholder name {reqStar}</label>
                        <input value={cardName} autoComplete="off" onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className={inputCls} />
                      </div>
                      <div className="flex-1">
                        <label className={labelCls} style={{ fontWeight: 500 }}>Billing ZIP {reqStar}</label>
                        <input value={cardZip} inputMode="numeric" autoComplete="off"
                          onChange={(e) => setCardZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                          placeholder="33606" className={`${inputCls} tabular-nums`} />
                      </div>
                    </div>
                  </>
                )}

                {/* External methods (cash/check/etc.) — Transaction number per Marek (Jun 11). */}
                {!isCharge && (
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Transaction number {reqStar}</label>
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. check #, Venmo confirmation…" className={inputCls} />
                  </div>
                )}
              </div>
            </section>

            {/* ── Invoices ── */}
            <section className="flex justify-between gap-16 pb-6 border-b border-[#E5E7EB]">
              <h2 className="shrink-0 text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Invoices {reqStar}</h2>
              <div className="w-[777px] max-w-full">
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  {/* header: search + Add invoice */}
                  <div className="flex items-center justify-between gap-2 px-4 h-[60px]">
                    <div className="relative w-[300px] max-w-[60%]">
                      <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>search</span>
                      <input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search invoices…" className="w-full h-8 pl-8 pr-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]" />
                    </div>
                    <Button type="button" onClick={openAddModal} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-8 px-3 rounded-lg text-[14px] inline-flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                      <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
                      Add invoice
                    </Button>
                  </div>

                  {selectedInvoices.length === 0 ? (
                    /* empty-state */
                    <div className="border-t border-[#E5E7EB] flex flex-col items-center gap-4 py-[45px]">
                      <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                        <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>description</span>
                      </div>
                      <div className="text-center">
                        <div className="text-[14px] text-[#1A2332]">No invoices added yet</div>
                        <div className="text-[12px] text-[#6B7280] mt-1">Click "Add invoice" to select from catalog</div>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-[14px] border-t border-[#E5E7EB]">
                      <thead>
                        <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-left text-[14px] text-[#1A2332]">
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Number</th>
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Job</th>
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Status</th>
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Due date</th>
                          <th className="px-3 py-2 text-right" style={{ fontWeight: 500 }}>Total</th>
                          <th className="w-12 px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-6 text-center text-[13px] text-[#9CA3AF]">No matches</td></tr>
                        ) : visibleRows.map((i) => (
                          <tr key={i.id} className="border-b border-[#E5E7EB] last:border-0">
                            <td className="px-3 py-2.5 align-middle">
                              <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{i.number}</span>
                            </td>
                            <td className="px-3 py-2.5 align-middle">
                              {i.jobNumber ? (
                                <>
                                  <div className="text-[#4A6FA5] text-[14px]" style={{ fontWeight: 500 }}>{i.jobNumber}</div>
                                  <div className="text-[14px] text-[#1A2332]">{i.jobName}</div>
                                </>
                              ) : <span className="text-[#9CA3AF]">—</span>}
                            </td>
                            <td className="px-3 py-2.5 align-middle"><Badge status={i.status} /></td>
                            <td className="px-3 py-2.5 align-middle text-[#1A2332] whitespace-nowrap">{fmtLongDate(i.dueDate)}</td>
                            <td className="px-3 py-2.5 align-middle text-right text-[#1A2332]" style={{ fontWeight: 600 }}>{money(i.total)}</td>
                            <td className="px-3 py-2.5 align-middle text-right">
                              <KebabMenu>
                                <KebabItem icon="visibility" onSelect={() => navigate(`/invoices/${i.id}`)}>View invoice</KebabItem>
                                <KebabItem icon="open_in_new" onSelect={() => window.open(`/invoices/${i.id}`, "_blank", "noopener,noreferrer")}>Open in new tab</KebabItem>
                                <KebabItem icon="close" destructive onSelect={() => removeInvoice(i.id)}>Remove</KebabItem>
                              </KebabMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F5F7FA]">
                          <td colSpan={6} className="px-4 py-3 text-right text-[14px] text-[#1A2332]">
                            Total: <span style={{ fontWeight: 600 }}>{money(total)}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            </section>

            {/* ── Notes ── */}
            <section className="flex justify-between gap-16 pb-6 border-b border-[#E5E7EB]">
              <h2 className="shrink-0 text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any relevant notes…"
                className="w-[777px] max-w-full h-[76px] px-3 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5] resize-y" />
            </section>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={goBack}
                className="border-[#E5E7EB] bg-white text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!canSubmit}
                className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]">
                {isCharge ? "Collect payment" : "Record payment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add invoice modal (576px) ── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] w-[576px] max-w-[92vw] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Add invoice</h2>
              <button onClick={() => setAddOpen(false)} aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded text-[#1A2332] hover:bg-[#F3F4F6]">
                <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
              </button>
            </div>
            <div className="px-4 pb-1 flex flex-col gap-4 overflow-y-auto">
              <div className="relative">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>search</span>
                <input value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} placeholder="Search invoices…" className="w-full h-9 pl-8 pr-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
              {candidateInvoices.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#9CA3AF]">No invoices found</div>
              ) : candidateInvoices.map((i) => (
                <label key={i.id} className="flex items-start gap-3 p-3 border border-[#E5E7EB] rounded-[10px] cursor-pointer hover:bg-[#F9FBFD]">
                  <input type="checkbox" checked={modalChecked.has(i.id)} onChange={() => toggleModal(i.id)} className="mt-0.5 w-4 h-4 rounded accent-[#4A6FA5] cursor-pointer" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A6FA5] text-[12px]" style={{ fontWeight: 500 }}>{i.number}</span>
                      <Badge status={i.status} />
                    </div>
                    {i.jobNumber && <div className="text-[#4A6FA5] text-[12px]" style={{ fontWeight: 500 }}>{i.jobNumber}</div>}
                    <div className="text-[14px] text-[#1A2332]">{i.jobName || i.clientName}</div>
                    <div className="text-[12px] text-[#6B7280]">Due date: {fmtLongDate(i.dueDate)}</div>
                  </div>
                  <div className="text-[14px] text-[#1A2332] flex-shrink-0" style={{ fontWeight: 600 }}>{money(i.total)}</div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-[#E5E7EB] bg-white text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button type="button" onClick={confirmAdd} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
