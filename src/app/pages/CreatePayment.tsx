import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { paymentsStore } from "../stores/paymentsStore";
import type { PaymentMethod, PaymentStatus } from "./Payments";
import { PAYMENT_METHODS } from "../constants/paymentMethods";

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

    const record = paymentsStore.add({
      date: paymentDate,
      amount: parsedAmount,
      method: method as PaymentMethod,
      status: "Completed" as PaymentStatus,
      clientName: trimmedClient,
      clientEmail: searchParams.get("clientEmail") || "",
      invoiceId: Number(searchParams.get("invoiceId")) || 0,
      invoiceNumber: searchParams.get("invoice") || "—",
      jobId: searchParams.get("job") || "",
      reference: ref,
      note: note.trim(),
      createdBy: "You",
    });
    toast.success(isCharge ? `Charged $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Payment recorded");
    navigate(returnTo || `/payments/${record.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-[960px] mx-auto py-8 px-6">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-6"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          <span>{returnTo ? "Back to client" : "Back"}</span>
        </button>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h1 className="text-[24px] text-[#1A2332] leading-8" style={{ fontWeight: 700 }}>
                {isCharge ? "Collect Payment" : "Record Payment"}
              </h1>
              <p className="text-[13px] text-[#6B7280] mt-1">
                {prefilledClientId ? `For ${prefilledClientId}` : "Create a new customer payment"}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#EEF3FA] flex items-center justify-center">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>payments</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Customer</label>
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Select or type a customer"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]"
              />
            </div>

            <div>
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 pl-7 pr-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Payment date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]"
              />
            </div>

            <div>
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Payment method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]"
              >
                {paymentMethods.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Method-dependent block:
                · Credit card on file → charge the saved card (no entry)
                · Type card manually  → manual US card-entry form
                · everything else     → reference number (external/record) */}
            {isCardOnFile ? (
              <div className="col-span-2">
                <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Card on file</label>
                <div className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "22px" }}>credit_card</span>
                  <div className="flex-1">
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{cardOnFile}</div>
                    <div className="text-[12px] text-[#6B7280]">This card will be charged when you click Charge.</div>
                  </div>
                  <span className="material-icons text-[#16A34A]" style={{ fontSize: "18px" }}>verified</span>
                </div>
              </div>
            ) : isManualCard ? (
              <div className="col-span-2 grid grid-cols-2 gap-4 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="col-span-2">
                  <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Card number</label>
                  <input value={cardNumber} inputMode="numeric" autoComplete="off"
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] tabular-nums" />
                </div>
                <div>
                  <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Expiry (MM / YY)</label>
                  <input value={cardExpiry} inputMode="numeric" autoComplete="off"
                    onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d /]/g, "").slice(0, 7))}
                    placeholder="08 / 27"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] tabular-nums" />
                </div>
                <div>
                  <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>CVC</label>
                  <input value={cardCvc} inputMode="numeric" autoComplete="off"
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] tabular-nums" />
                </div>
                <div>
                  <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Cardholder name</label>
                  <input value={cardName} autoComplete="off"
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Billing ZIP</label>
                  <input value={cardZip} inputMode="numeric" autoComplete="off"
                    onChange={(e) => setCardZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                    placeholder="33606"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-white text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] tabular-nums" />
                </div>
                <p className="col-span-2 text-[12px] text-[#9CA3AF]">Card details are used to process this charge only — they are not stored on the client record.</p>
              </div>
            ) : (
              <div>
                <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Reference</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Check #, transaction ID, confirmation #..."
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional payment note..."
                className="w-full min-h-[96px] px-3 py-2 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] resize-y"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6"
            >
              {isCharge
                ? (amount ? `Charge $${(parseFloat(amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Charge card")
                : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
