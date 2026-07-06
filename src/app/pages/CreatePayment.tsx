import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { paymentsStore } from "../stores/paymentsStore";
import type { PaymentMethod, PaymentStatus } from "./Payments";
import { invoicesStore, type Invoice } from "../stores/invoicesStore";
import { clientsStore } from "../stores/clientsStore";

// ── Money / date helpers ─────────────────────────────────────────────────────
const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

function fmtLongDate(d: string) {
  const dt = new Date((d || "") + "T12:00:00");
  if (!d || isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Invoice status chip colour (same semantic tokens as the Invoices list).
function invoiceStatusStyle(status: string): { color: string; backgroundColor: string } {
  const m: Record<string, [string, string]> = {
    Paid: ["#16A34A", "rgba(22,163,74,0.15)"],
    Unpaid: ["#6B7280", "rgba(107,114,128,0.15)"],
    Overdue: ["#EF4444", "rgba(239,68,68,0.15)"],
    "Partially Paid": ["#D97706", "rgba(217,119,6,0.15)"],
    Void: ["#9CA3AF", "rgba(156,163,175,0.15)"],
  };
  const [color, backgroundColor] = m[status] || ["#6B7280", "rgba(107,114,128,0.15)"];
  return { color, backgroundColor };
}

// ── Payment methods (form-local; the spec's set — see collect-payment-ui.md §4).
// Stored on the record as a canonical value so the Payments list / icons keep working.
const METHOD_OPTIONS = [
  "Credit card — reader",
  "Credit card — manually",
  "Credit card — on file",
  "Cash",
  "Check",
  "Zelle",
  "CashApp",
  "Venmo",
  "Wire transfer",
  "Consumer financing",
] as const;
type Method = (typeof METHOD_OPTIONS)[number];

const isCardMethod = (m: string) => m.startsWith("Credit card");
// Methods whose money moved outside the app → recorded with a reference # + date.
const REF_METHODS: string[] = ["Zelle", "CashApp", "Venmo", "Wire transfer", "Consumer financing"];

// Canonical value stored on the payment record (keeps list filters / icons happy).
function canonicalMethod(m: string): string {
  if (isCardMethod(m)) return "Credit Card";
  if (m === "Consumer financing") return "Consumer Financing";
  if (m === "CashApp") return "Cash App";        // match ICON_MAP key
  if (m === "Wire transfer") return "Wire Transfer"; // match ICON_MAP key
  return m;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const isoToDMY = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim()); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; };
const dmyToISO = (s: string) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };

export function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const goBack = () => navigate(returnTo || "/payments");

  // Live stores.
  const invoices = useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot);
  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);

  // ── Customer resolution from launch context ────────────────────────────────
  const paramClientId = searchParams.get("clientId") || "";
  const paramClientName = searchParams.get("client") || "";
  const paramInvoice = searchParams.get("invoice") || "";
  const paramJob = searchParams.get("job") || "";

  // Resolve an initial customer NAME from the launch context (clientId → client
  // param → the launch invoice's client).
  const initialClientName = useMemo(() => {
    if (paramClientId) { const c = clientsStore.getClient(paramClientId); if (c) return c.name; }
    if (paramClientName) return paramClientName;
    if (paramInvoice) { const inv = invoicesStore.getSnapshot().find((i) => i.number === paramInvoice); if (inv) return inv.clientName; }
    return "";
  }, [paramClientId, paramClientName, paramInvoice]);

  const [customerName, setCustomerName] = useState(initialClientName);
  const [searching, setSearching] = useState(!initialClientName); // show the search UI when no client yet
  const [clientQuery, setClientQuery] = useState("");

  // The chosen client's contact info (from the store when known, else the invoice).
  const customer = useMemo(() => clients.find((c) => c.name === customerName), [clients, customerName]);
  const customerEmail = customer?.email || invoices.find((i) => i.clientName === customerName)?.customerEmail || "";
  const customerPhone = customer?.mobilePhone || customer?.phone || "";

  const clientMatches = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    const list = q
      ? clients.filter((c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.mobilePhone || c.phone || "").toLowerCase().includes(q))
      : clients;
    return list.slice(0, 8);
  }, [clients, clientQuery]);

  // ── Open invoices for the chosen customer (spec §3: only Unpaid / Overdue /
  // Partially Paid with a balance; Paid & Void never appear). ────────────────
  const openInvoices = useMemo(
    () => invoices.filter((i) => i.clientName === customerName && i.balance > 0 && i.status !== "Paid" && i.status !== "Void"),
    [invoices, customerName]
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // Preselect the launch invoice once (if it's one of the customer's open ones).
  useEffect(() => {
    if (!paramInvoice) return;
    const inv = openInvoices.find((i) => i.number === paramInvoice);
    if (inv) setSelectedIds(new Set([inv.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramInvoice, customerName]);

  const toggleInvoice = (id: number) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectedInvoices = useMemo(() => openInvoices.filter((i) => selectedIds.has(i.id)), [openInvoices, selectedIds]);
  const selectedCount = selectedInvoices.length;
  const balanceSum = round2(selectedInvoices.reduce((s, i) => s + i.balance, 0));
  const singleInvoice = selectedCount === 1 ? selectedInvoices[0] : null;

  // ── Amount (spec §5 — the core rule) ───────────────────────────────────────
  // 0 selected → disabled. 1 → editable, default & max = balance (partial ok).
  // 2+ → read-only sum of balances (full payment of all only).
  const [amountInput, setAmountInput] = useState("");
  // Default the amount to the invoice's balance only when a *different* single
  // invoice becomes selected — this preserves the user's edit if they deselect
  // and re-select the same invoice.
  const lastDefaultedId = useRef<number | null>(null);
  useEffect(() => {
    if (singleInvoice && singleInvoice.id !== lastDefaultedId.current) {
      setAmountInput(String(singleInvoice.balance));
      lastDefaultedId.current = singleInvoice.id;
    }
  }, [singleInvoice?.id]);

  const parsedAmount = round2(parseFloat(amountInput) || 0);
  const amount = selectedCount === 0 ? 0 : selectedCount === 1 ? parsedAmount : balanceSum;
  const amountMax = selectedCount === 1 ? (singleInvoice?.balance ?? 0) : balanceSum;
  const amountValid = amount > 0 && amount <= amountMax + 0.001;
  const singleRemaining = singleInvoice ? round2(singleInvoice.balance - amount) : 0;

  // ── Payment method ─────────────────────────────────────────────────────────
  const paramMethod = searchParams.get("method") || "";
  const [method, setMethod] = useState<Method>(
    (METHOD_OPTIONS as readonly string[]).includes(paramMethod) ? (paramMethod as Method) : "Cash"
  );
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [refDateISO, setRefDateISO] = useState(todayISO());
  const [cardLinkSent, setCardLinkSent] = useState(false);
  useEffect(() => { setCardLinkSent(false); }, [method]); // reset the on-file link when method changes

  const onFile = method === "Credit card — on file";
  // Prototype: no cards are ever stored → the on-file path always routes through
  // "Send link to collect card" and can't complete a charge here (spec §4).
  const needsCheck = method === "Check";
  const needsRef = REF_METHODS.includes(method);

  const methodComplete =
    onFile ? false // never collectable in-form (waiting on the customer's card)
    : needsCheck ? checkNumber.trim().length > 0
    : needsRef ? refNumber.trim().length > 0 && !!refDateISO
    : true; // card reader / manually / cash

  const canCollect = !!customerName && selectedCount > 0 && amountValid && methodComplete;

  // ── Per-invoice payment plan (invariant: one payment ↔ one invoice) ─────────
  const plan = useMemo(
    () => selectedInvoices.map((inv) => {
      const pay = selectedCount === 1 ? amount : inv.balance;
      return { inv, pay: round2(pay), after: round2(inv.balance - pay) };
    }),
    [selectedInvoices, selectedCount, amount]
  );

  const handleCollect = () => {
    if (!canCollect) return;
    if (plan.some((p) => p.after < -0.001)) { toast.error("Payment exceeds the invoice balance."); return; }
    const stored = canonicalMethod(method);
    const isoDate = needsRef ? refDateISO : todayISO();
    const ref = needsCheck ? `Check #${checkNumber.trim()}` : needsRef ? refNumber.trim() : isCardMethod(method) ? "Card charge" : "";

    plan.forEach(({ inv, pay, after }) => {
      const newBalance = Math.max(0, after);
      invoicesStore.update(inv.id, {
        balance: newBalance,
        status: newBalance <= 0 ? "Paid" : "Partially Paid",
        paymentMethod: stored,
        ...(needsCheck ? { checkNumber: checkNumber.trim() } : {}),
      });
      paymentsStore.add({
        date: isoDate,
        amount: pay,
        balance: newBalance, // outstanding balance on the invoice AFTER this payment
        method: stored as PaymentMethod,
        status: "Completed" as PaymentStatus,
        clientName: customerName,
        clientEmail: customerEmail,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        jobId: inv.jobNumber || paramJob || "",
        estimateNumbers: inv.linkedEstimate ? [inv.linkedEstimate] : [],
        jobIds: inv.jobNumber ? [inv.jobNumber] : [],
        reference: ref,
        note: "",
        createdBy: "You",
      });
    });

    toast.success(`Payment collected — ${money(amount)}`);
    navigate(returnTo || "/payments");
  };

  // ── shared field styles (universal form spec: 36px, 8px radius, shadow-xs) ──
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const labelCls = "block text-[14px] text-[#1A2332] mb-1";
  const inputCls = "w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]";

  const Chip = ({ status }: { status: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[12px] whitespace-nowrap" style={{ fontWeight: 500, ...invoiceStatusStyle(status) }}>{status}</span>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="shrink-0 w-[180px] text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>{children}</h2>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* page_header */}
        <div className="flex items-center justify-between py-6 px-4">
          <div className="flex items-center gap-2">
            <button onClick={goBack} aria-label="Back" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5]">
              <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
            </button>
            <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>Collect payment</h1>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-6">

            {/* ── Customer ── */}
            <section className="flex justify-between gap-8 pb-6 border-b border-[#E5E7EB]">
              <SectionTitle>Customer {reqStar}</SectionTitle>
              <div className="flex-1 max-w-[777px]">
                {customerName && !searching ? (
                  <div className="flex items-center justify-between gap-3 border border-[#E5E7EB] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] shrink-0" style={{ fontWeight: 600, backgroundColor: customer?.avatarColor || "#4A6FA5" }}>
                        {customer?.initials || customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{customerName}</div>
                        <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
                          {customerEmail && <span className="inline-flex items-center gap-1 truncate"><span className="material-icons" style={{ fontSize: "14px" }}>mail</span>{customerEmail}</span>}
                          {customerPhone && <span className="inline-flex items-center gap-1 whitespace-nowrap"><span className="material-icons" style={{ fontSize: "14px" }}>call</span>{customerPhone}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setSearching(true); setClientQuery(""); }} className="text-[13px] text-[#4A6FA5] hover:underline shrink-0" style={{ fontWeight: 500 }}>Change</button>
                  </div>
                ) : (
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Search customer</label>
                    <div className="relative">
                      <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>search</span>
                      <input autoFocus value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Search by name, email or phone…" className={`${inputCls} pl-8`} />
                    </div>
                    <div className="mt-2 border border-[#E5E7EB] rounded-lg divide-y divide-[#EDF0F5] max-h-[240px] overflow-y-auto">
                      {clientMatches.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[13px] text-[#9CA3AF]">No customers found</div>
                      ) : clientMatches.map((c) => (
                        <button key={c.id} onClick={() => { setCustomerName(c.name); setSearching(false); setSelectedIds(new Set()); }} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#F9FBFD]">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] shrink-0" style={{ fontWeight: 600, backgroundColor: c.avatarColor || "#4A6FA5" }}>{c.initials || c.name.slice(0, 2).toUpperCase()}</div>
                          <div className="min-w-0">
                            <div className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{c.name}</div>
                            <div className="text-[12px] text-[#6B7280] truncate">{c.email || c.mobilePhone || c.phone}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Invoices to pay ── */}
            <section className="flex justify-between gap-8 pb-6 border-b border-[#E5E7EB]">
              <SectionTitle>Invoices to pay {reqStar}</SectionTitle>
              <div className="flex-1 max-w-[777px]">
                {!customerName ? (
                  <div className="border border-[#E5E7EB] rounded-lg py-10 text-center text-[13px] text-[#6B7280]">Select a customer to see their open invoices</div>
                ) : openInvoices.length === 0 ? (
                  <div className="border border-[#E5E7EB] rounded-lg flex flex-col items-center gap-3 py-10">
                    <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                      <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>receipt_long</span>
                    </div>
                    <div className="text-[14px] text-[#1A2332]">No open invoices for this customer</div>
                    <Button type="button" onClick={() => navigate(`/invoices/new?client=${encodeURIComponent(customerName)}`)} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-8 px-3 rounded-lg text-[14px]" style={{ fontWeight: 500 }}>Create invoice</Button>
                  </div>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                    <table className="w-full text-[14px]">
                      <thead>
                        <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-left text-[#1A2332]">
                          <th className="w-10 px-3 py-2" />
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Invoice</th>
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Date</th>
                          <th className="px-3 py-2 text-right" style={{ fontWeight: 500 }}>Total</th>
                          <th className="px-3 py-2 text-right" style={{ fontWeight: 500 }}>Balance</th>
                          <th className="px-3 py-2" style={{ fontWeight: 500 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openInvoices.map((i) => (
                          <tr key={i.id} className="border-b border-[#E5E7EB] last:border-0 cursor-pointer hover:bg-[#F9FBFD]" onClick={() => toggleInvoice(i.id)}>
                            <td className="px-3 py-2.5 align-middle">
                              <input type="checkbox" checked={selectedIds.has(i.id)} onChange={() => toggleInvoice(i.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded accent-[#4A6FA5] cursor-pointer" />
                            </td>
                            <td className="px-3 py-2.5 align-middle text-[#4A6FA5]" style={{ fontWeight: 500 }}>{i.number}</td>
                            <td className="px-3 py-2.5 align-middle text-[#1A2332] whitespace-nowrap">{fmtLongDate(i.date)}</td>
                            <td className="px-3 py-2.5 align-middle text-right text-[#1A2332]">{money(i.total)}</td>
                            <td className="px-3 py-2.5 align-middle text-right text-[#1A2332]" style={{ fontWeight: 600 }}>{money(i.balance)}</td>
                            <td className="px-3 py-2.5 align-middle"><Chip status={i.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ── Payment method ── */}
            <section className="flex justify-between gap-8 pb-6 border-b border-[#E5E7EB]">
              <SectionTitle>Payment method {reqStar}</SectionTitle>
              <div className="flex-1 max-w-[777px] flex flex-col gap-4">
                <div>
                  <label className={labelCls} style={{ fontWeight: 500 }}>Method {reqStar}</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value as Method)} className={inputCls}>
                    {METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Card reader / manually — fee hint, mock processing on submit. */}
                {isCardMethod(method) && !onFile && (
                  <div className="flex items-start gap-2 rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] px-3 py-2.5 text-[13px] text-[#6B7280]">
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>{method.includes("reader") ? "point_of_sale" : "keyboard"}</span>
                    <span>{method.includes("reader") ? "Card reader — lower processing fee. The card will be charged on submit." : "Keyed entry — higher processing fee. The card will be charged on submit."}</span>
                  </div>
                )}

                {/* Card on file — no stored card in the prototype → send a link. */}
                {onFile && (
                  <div className="rounded-lg bg-[#F5F7FA] border border-[#E5E7EB] px-3 py-3 flex flex-col gap-2">
                    {!cardLinkSent ? (
                      <>
                        <div className="text-[13px] text-[#1A2332]">No card on file for this customer.</div>
                        <div className="flex items-center gap-2">
                          <Button type="button" onClick={() => setCardLinkSent(true)} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-8 px-3 rounded-lg text-[13px] inline-flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                            <span className="material-icons" style={{ fontSize: "16px" }}>send</span>
                            Send link to collect card
                          </Button>
                          <span className="text-[12px] text-[#6B7280]">via SMS / email</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-[13px] text-[#6B7280]">
                        <span className="material-icons text-[#D97706]" style={{ fontSize: "18px" }}>schedule</span>
                        <span>Link sent — waiting for {customerName || "the customer"} to add their card. You can collect once it's on file.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Check number */}
                {needsCheck && (
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Check number {reqStar}</label>
                    <input value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} placeholder="e.g. 4582" className={inputCls} />
                  </div>
                )}

                {/* External methods — reference number + date (money moved outside the app). */}
                {needsRef && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className={labelCls} style={{ fontWeight: 500 }}>Reference number {reqStar}</label>
                      <input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="e.g. confirmation #" className={inputCls} />
                    </div>
                    <div className="flex-1">
                      <label className={labelCls} style={{ fontWeight: 500 }}>Date {reqStar}</label>
                      <div className="relative">
                        <input type="text" inputMode="numeric" value={isoToDMY(refDateISO)} onChange={(e) => setRefDateISO(dmyToISO(e.target.value))} placeholder="DD.MM.YYYY" className={`${inputCls} pr-9`} />
                        <input type="date" aria-label="Date" value={refDateISO} onChange={(e) => setRefDateISO(e.target.value)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer opacity-0" />
                        <span className="material-icons pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "18px" }}>calendar_today</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Amount ── */}
            <section className="flex justify-between gap-8 pb-6 border-b border-[#E5E7EB]">
              <SectionTitle>Amount {reqStar}</SectionTitle>
              <div className="flex-1 max-w-[777px]">
                <div className="max-w-[280px]">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                    {selectedCount === 1 ? (
                      <input
                        type="number" min={0} max={amountMax} step="0.01" value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className={`${inputCls} pl-6 tabular-nums`} />
                    ) : (
                      <input
                        readOnly disabled={selectedCount === 0}
                        value={selectedCount === 0 ? "" : balanceSum.toFixed(2)}
                        placeholder={selectedCount === 0 ? "0.00" : undefined}
                        className={`${inputCls} pl-6 tabular-nums bg-[#F5F7FA] text-[#6B7280]`} />
                    )}
                  </div>
                </div>
                {selectedCount === 0 && (
                  <p className="mt-1.5 text-[12px] text-[#9CA3AF]">Select an invoice to set the amount.</p>
                )}
                {selectedCount === 1 && amount > 0 && singleRemaining > 0 && (
                  <p className="mt-1.5 text-[12px] text-[#6B7280]">Balance after payment: <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{money(singleRemaining)}</span></p>
                )}
                {selectedCount >= 2 && (
                  <p className="mt-1.5 text-[12px] text-[#6B7280]">Sum of {selectedCount} balances. To pay partially, select a single invoice.</p>
                )}
              </div>
            </section>

            {/* ── Summary ── */}
            {canCollect && (
              <section className="flex justify-between gap-8 pb-6 border-b border-[#E5E7EB]">
                <SectionTitle>Summary</SectionTitle>
                <div className="flex-1 max-w-[777px] border border-[#E5E7EB] rounded-lg divide-y divide-[#EDF0F5]">
                  {plan.map(({ inv, after }) => (
                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 text-[14px]">
                      <span className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{inv.number}</span>
                      <span className="flex items-center gap-2 text-[#1A2332]">
                        <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>arrow_forward</span>
                        {after <= 0
                          ? <span className="inline-flex items-center gap-1"><Chip status="Paid" /><span className="text-[12px] text-[#6B7280]">removed from open invoices</span></span>
                          : <span>Partially paid — balance <span style={{ fontWeight: 600 }}>{money(after)}</span></span>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Actions ── */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={goBack} className="border-[#E5E7EB] bg-white text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">Cancel</Button>
              <Button type="button" onClick={handleCollect} disabled={!canCollect} className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-9 px-4 text-[14px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]">Collect payment</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
