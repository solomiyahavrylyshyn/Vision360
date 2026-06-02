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
  const [method, setMethod] = useState("Credit card on file");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    const trimmedClient = client.trim();
    if (!trimmedClient) { toast.error("Select a customer"); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }

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
      reference: reference.trim(),
      note: note.trim(),
      createdBy: "You",
    });
    toast.success("Payment recorded");
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
                Record Payment
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

            <div>
              <label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Check #, transaction ID..."
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]"
              />
            </div>

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
              Record Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
