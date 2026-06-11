import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { paymentsStore } from "../stores/paymentsStore";
import type { PaymentMethod, PaymentStatus } from "./Payments";
import { PAYMENT_METHODS } from "../constants/paymentMethods";
import { initialInvoices } from "./Invoices";

const paymentMethods = PAYMENT_METHODS;

export function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClient = searchParams.get("client") || "";
  const prefilledClientId = searchParams.get("clientId") || "";
  const prefilledAmount = searchParams.get("amount") || "";
  const returnTo = searchParams.get("returnTo");
  const goBack = () => navigate(returnTo || "/payments");

  const [client, setClient] = useState(prefilledClient);
  const [amount, setAmount] = useState(prefilledAmount);
  const [method, setMethod] = useState(searchParams.get("method") || "Credit card on file");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  // The form's selector offers INVOICES ONLY — payments are never collected
  // against a job or an estimate directly. The ?invoice param may carry either
  // an invoice number or a numeric id; normalize to the number.
  const [invoiceNumberSel, setInvoiceNumberSel] = useState(() => {
    const param = searchParams.get("invoice") || "";
    if (!param) return "";
    const match = initialInvoices.find(i => i.number === param || String(i.id) === param);
    return match ? match.number : param;
  });
  const selectedInvoice = initialInvoices.find(i => i.number === invoiceNumberSel);
  const applyInvoiceSelection = (num: string) => {
    setInvoiceNumberSel(num);
    const inv = initialInvoices.find(i => i.number === num);
    if (inv) {
      if (!client.trim()) setClient(inv.clientName);
      if (!amount) setAmount(String(inv.balance));
    }
  };

  // Manual card-entry fields (US): only used when method = "Type card manually".
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");

  // Card-on-file mock (in a real build this comes from the saved payment profile).
  const cardOnFile = "Visa ···· 4242";

  const isCardOnFile = method === "Credit card on file";
  const isManualCard = method === "Type card manually";
  const isCharge = isCardOnFile || isManualCard;          // integrated charge vs external record
  // Card number minus formatting, for a light length check.
  const cardDigits = cardNumber.replace(/\D/g, "");

  const handleSave = () => {
    const trimmedClient = client.trim();
    if (!trimmedClient) { toast.error("Select a customer"); return; }
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

    const jobFromParam = searchParams.get("job") || "";
    const record = paymentsStore.add({
      date: paymentDate,
      amount: parsedAmount,
      method: method as PaymentMethod,
      status: "Completed" as PaymentStatus,
      clientName: trimmedClient,
      clientEmail: searchParams.get("clientEmail") || selectedInvoice?.customerEmail || "",
      invoiceId: selectedInvoice?.id ?? (Number(searchParams.get("invoiceId")) || 0),
      invoiceNumber: invoiceNumberSel || "—",
      jobId: jobFromParam || selectedInvoice?.jobNumber || "",
      // Estimates/jobs trace back through the selected invoice (list columns).
      estimateNumbers: selectedInvoice?.linkedEstimate ? [selectedInvoice.linkedEstimate] : undefined,
      jobIds: selectedInvoice?.jobNumber
        ? [selectedInvoice.jobNumber]
        : jobFromParam ? [jobFromParam] : undefined,
      reference: ref,
      note: note.trim(),
      createdBy: "You",
    });
    toast.success(isCharge ? `Charged $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Payment recorded");
    navigate(returnTo || `/payments/${record.id}`);
  };

  const inputCls = "w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]";
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const labelCls = "text-[13px] text-[#374151] mb-1.5 block";

  // Disable the submit button until the form is minimally valid.
  const amountValid = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const referenceValid = isCharge || reference.trim().length > 0; // external methods require a reference
  const canSubmit = !!client.trim() && amountValid && !!paymentDate && referenceValid;

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
              {/* Invoice selector — invoices ONLY (never jobs or estimates). */}
              <div className="col-span-2">
                <label className={labelCls} style={{ fontWeight: 500 }}>Invoice</label>
                <select value={invoiceNumberSel} onChange={(e) => applyInvoiceSelection(e.target.value)} className={inputCls}>
                  <option value="">Select an invoice</option>
                  {initialInvoices.map(i => (
                    <option key={i.id} value={i.number}>{i.number} — {i.clientName}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[12px] text-[#9CA3AF]">Payments are collected against invoices only.</p>
              </div>

              {/* Customer field only when standalone (no client passed in) */}
              {!prefilledClient && (
                <div className="col-span-2">
                  <label className={labelCls} style={{ fontWeight: 500 }}>Customer {reqStar}</label>
                  <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Select or type a customer" className={inputCls} />
                </div>
              )}

              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Amount {reqStar}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                  <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                    className={`${inputCls} pl-7`} />
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment date {reqStar}</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment method {reqStar}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                  {paymentMethods.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              {/* Method-dependent block */}
              {isCardOnFile ? (
                <div>
                  <label className={labelCls} style={{ fontWeight: 500 }}>Card on file</label>
                  <div className="flex items-center gap-2.5 h-10 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3">
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>credit_card</span>
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{cardOnFile}</span>
                    <span className="material-icons text-[#16A34A] ml-auto" style={{ fontSize: "16px" }}>verified</span>
                  </div>
                </div>
              ) : isManualCard ? null : (
                /* Money already received outside the system — the transaction
                   number + amount effectively record it. */
                <div>
                  <label className={labelCls} style={{ fontWeight: 500 }}>Transaction number {reqStar}</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. check #, Venmo confirmation…" className={inputCls} />
                </div>
              )}

              {/* Manual card entry spans full width below the method row */}
              {isManualCard && (
                <div className="col-span-2 grid grid-cols-2 gap-4 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div className="col-span-2">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Card number {reqStar}</label>
                    <input value={cardNumber} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                      placeholder="1234 5678 9012 3456" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Expiry (MM / YY) {reqStar}</label>
                    <input value={cardExpiry} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d /]/g, "").slice(0, 7))}
                      placeholder="08 / 27" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>CVC {reqStar}</label>
                    <input value={cardCvc} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Cardholder name {reqStar}</label>
                    <input value={cardName} autoComplete="off" onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Billing ZIP {reqStar}</label>
                    <input value={cardZip} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                      placeholder="33606" className={`${inputCls} tabular-nums`} />
                  </div>
                  <p className="col-span-2 text-[12px] text-[#9CA3AF]">Card details process this charge only — they are not stored on the client record.</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any relevant note…"
              className="w-full min-h-[80px] px-3 py-2 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] resize-y" />
          </div>

          <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={goBack}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSubmit}
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]">
              {isCharge
                ? (amount ? `Charge $${(parseFloat(amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Charge card")
                : "Record payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
