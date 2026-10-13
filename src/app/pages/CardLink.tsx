// The page the client opens from a "Send card link" email (client profile →
// Billing details). Anonymous, like /pay/:token. Saving here is the only way a
// card lands on file. In production the fields are Stripe Elements (SetupIntent).

import { useState, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { cardLinksStore } from "../stores/cardLinksStore";
import { useDocCompany } from "../components/DocumentSheets";
import { saveCardOnFile } from "../utils/savedCard";
import { cardBrand, cardCvcOk, cardDigitsOk, cardExpOk } from "./CreatePayment";

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

export function CardLink() {
  const { token } = useParams();
  const company = useDocCompany();
  const links = useSyncExternalStore(cardLinksStore.subscribe, cardLinksStore.getSnapshot);
  const link = links.find((l) => l.token === token);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");
  const [agree, setAgree] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const brandLine = <div className="text-[12px] tracking-wide text-[#4A6FA5]" style={{ fontWeight: 600 }}>{company.name.toUpperCase()}</div>;

  if (link && saved) {
    return (
      <Card center>
        <span className="material-icons text-[#16A34A]" style={{ fontSize: "40px" }}>check_circle_outline</span>
        {brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>Card saved</h1>
        <div className="rounded-lg bg-[#F5F7FA] px-3 py-2 text-[14px]">{saved}</div>
        <p className="text-[14px] text-[#6B7280]">{company.name} can now charge this card for work you approve. You'll get a receipt each time. You can close this page.</p>
      </Card>
    );
  }

  if (!link || link.status !== "open") {
    return (
      <Card center>
        {link && brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>This link has expired</h1>
        <p className="text-[14px] text-[#6B7280]">Ask {link ? company.name : "the company that sent it"} to send you a new one.</p>
      </Card>
    );
  }

  const ready = cardDigitsOk(cardNumber) && cardExpOk(cardExp) && cardCvcOk(cardCvc) && !!cardName.trim() && !!cardZip.trim() && agree;

  const save = () => {
    if (!ready) return;
    const brand = cardBrand(cardNumber);
    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    const exp = cardExp.replace(/\s/g, "");
    saveCardOnFile(link.clientId, { brand, last4, exp }, "the client (card link)");
    cardLinksStore.markUsed(link.token);
    setSaved(`${brand} •••• ${last4} · expires ${exp}`);
  };

  return (
    <Card>
      <div className="flex flex-col gap-1.5">
        {brandLine}
        <h1 className="text-[22px]" style={{ fontWeight: 600 }}>Add a card for future payments</h1>
        <p className="text-[14px] text-[#6B7280]">{company.name} asked you to save a card so they can charge it for work you approve. You'll get a receipt every time it's charged.</p>
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
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#4A6FA5]" />
        <span>I authorise {company.name} to charge this card for services I approve. I can ask them to remove it at any time.</span>
      </label>

      <button
        type="button" onClick={save} disabled={!ready}
        className="h-10 w-full rounded-lg bg-[#4A6FA5] text-[14px] text-white hover:bg-[#3d5a85] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ fontWeight: 500 }}
      >
        Save card
      </button>
      <p className="text-[12px] text-[#6B7280]">Secured by Stripe. {company.name} never sees your full card number.</p>
    </Card>
  );
}
