// The page the client opens from a "Send payment link" email or SMS. Anonymous —
// no login, no app chrome — identified only by the token in the URL. The client
// pays the amount the office set; ticking "save this card" makes it their card
// on file. In production the card fields are Stripe Elements and a Stripe
// webhook records the payment; here it is recorded when Pay is pressed.

import { useState, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { paymentLinksStore } from "../stores/paymentLinksStore";
import { invoicesStore } from "../stores/invoicesStore";
import { paymentsStore } from "../stores/paymentsStore";
import { clientsStore } from "../stores/clientsStore";
import { useDocCompany } from "../components/DocumentSheets";
import { saveCardOnFile } from "../utils/savedCard";
import { cardBrand, cardCvcOk, cardDigitsOk, cardExpOk } from "./CreatePayment";
import type { PaymentMethod, PaymentStatus } from "./Payments";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const todayISO = () => new Date().toISOString().slice(0, 10);

const inputCls = "w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]";
const labelCls = "block text-[14px] text-[#1A2332] mb-1";

function Card({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-[#1A2332] sm:py-16">
      <div className={`mx-auto flex w-full max-w-[480px] flex-col gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8 ${center ? "items-center text-center" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export function PayLink() {
  const { token } = useParams();
  const company = useDocCompany();
  const links = useSyncExternalStore(paymentLinksStore.subscribe, paymentLinksStore.getSnapshot);
  const invoices = useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot);
  const link = links.find((l) => l.token === token);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [paidNow, setPaidNow] = useState(false);

  const brandLine = <div className="text-[12px] tracking-wide text-[#4A6FA5]" style={{ fontWeight: 600 }}>{company.name.toUpperCase()}</div>;

  // Paid here a moment ago → the receipt state, even though the link is now closed.
  if (link && paidNow) {
    return (
      <Card center>
        <span className="material-icons text-[#16A34A]" style={{ fontSize: "40px" }}>check_circle_outline</span>
        {brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>Payment received</h1>
        {link.paidWith && <div className="rounded-lg bg-[#F5F7FA] px-3 py-2 text-[14px]">Paid with {link.paidWith}</div>}
        <p className="text-[14px] text-[#6B7280]">
          {money(link.amount)} for {link.invoiceIds.length} invoice{link.invoiceIds.length === 1 ? "" : "s"}. A receipt is on its way to {link.sentTo}. You can close this page.
        </p>
      </Card>
    );
  }

  if (!link || link.status !== "open") {
    return (
      <Card center>
        {brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>This payment link is no longer active</h1>
        <p className="text-[14px] text-[#6B7280]">It was already paid or cancelled. Contact {company.name} if you have a question.</p>
      </Card>
    );
  }

  const linked = link.invoiceIds.map((id) => invoices.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i);
  // One invoice may be paid in part (the amount the office set); several are paid in full.
  const plan = linked.map((inv) => {
    const pay = round2(linked.length === 1 ? Math.min(link.amount, inv.balance) : inv.balance);
    return { inv, pay, after: round2(Math.max(0, inv.balance - pay)) };
  });
  const total = round2(plan.reduce((s, p) => s + p.pay, 0));
  const ready = total > 0 && cardDigitsOk(cardNumber) && cardExpOk(cardExp) && cardCvcOk(cardCvc) && !!cardName.trim() && !!cardZip.trim();

  const pay = () => {
    if (!ready) return;
    const brand = cardBrand(cardNumber);
    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    const paidWith = `${brand} •••• ${last4}`;
    plan.forEach(({ inv, pay: amt, after }) => {
      if (amt <= 0) return;
      invoicesStore.update(inv.id, { balance: after, status: after <= 0 ? "Paid" : "Partially Paid", paymentMethod: "Credit Card" });
      paymentsStore.add({
        date: todayISO(),
        amount: amt,
        balance: after,
        method: "Credit Card" as PaymentMethod,
        status: "Completed" as PaymentStatus,
        clientName: link.clientName,
        clientEmail: link.sentTo,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        jobId: inv.jobNumber || "",
        estimateNumbers: inv.linkedEstimate ? [inv.linkedEstimate] : [],
        jobIds: inv.jobNumber ? [inv.jobNumber] : [],
        reference: `Paid online · ${paidWith}`,
        note: "Paid from a payment link",
        createdBy: "Online payment",
      });
    });
    if (saveCard) {
      const client = clientsStore.getSnapshot().find((c) => c.name === link.clientName);
      if (client) saveCardOnFile(client.id, { brand, last4, exp: cardExp.replace(/\s/g, "") }, "the client (payment link)");
    }
    paymentLinksStore.markPaid(link.token, paidWith);
    setPaidNow(true);
  };

  return (
    <Card>
      <div className="flex flex-col gap-1.5">
        {brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>Pay {money(total)}</h1>
        <p className="text-[14px] text-[#6B7280]">{plan.length} invoice{plan.length === 1 ? "" : "s"} from {company.name}.</p>
      </div>

      <div className="rounded-lg bg-[#F5F7FA] px-3 py-1">
        {plan.map(({ inv, pay: amt }) => (
          <div key={inv.id} className="flex justify-between gap-3 py-2 text-[14px]">
            <span>{inv.number}{inv.jobName ? ` · ${inv.jobName}` : ""}</span>
            <span className="tabular-nums" style={{ fontWeight: 500 }}>{money(amt)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls} style={{ fontWeight: 500 }}>Card number</label>
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" placeholder="1234 1234 1234 1234" className={`${inputCls} tabular-nums`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ fontWeight: 500 }}>Expiry</label>
            <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM / YY" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ fontWeight: 500 }}>CVC</label>
            <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} inputMode="numeric" placeholder="123" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} style={{ fontWeight: 500 }}>Name on card</label>
          <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} style={{ fontWeight: 500 }}>Billing ZIP</label>
          <input value={cardZip} onChange={(e) => setCardZip(e.target.value)} placeholder="33606" className={inputCls} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-[18px]">
        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#4A6FA5]" />
        <span>Save this card for future payments to {company.name}. They can charge it for work I approve, and I can ask them to remove it.</span>
      </label>

      <button
        type="button" onClick={pay} disabled={!ready}
        className="h-10 w-full rounded-lg bg-[#4A6FA5] text-[14px] text-white hover:bg-[#3d5a85] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ fontWeight: 500 }}
      >
        Pay {money(total)}
      </button>
      <p className="text-[12px] text-[#6B7280]">Secured by Stripe. {company.name} never sees your full card number. A receipt is emailed after payment.</p>
    </Card>
  );
}
