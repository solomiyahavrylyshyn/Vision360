// The page the client opens from the estimate email. Anonymous — no login, no
// app chrome — and identified only by the token in the URL, which is minted
// when the estimate is sent. It follows the estimate document: two to four
// options side by side to choose from, or one option as a single sheet; then
// approve & sign, request changes, or decline. Once answered (or expired) the
// page is read-only and, after approval, shows only the chosen option.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { estimatesStore, type EstimateLineItem, type EstimateRecord } from "../stores/estimatesStore";
import { getStoredBrandLogo } from "../utils/brandTheme";
import { termsStore } from "../stores/termsStore";
import { estimateSettingsStore, monthlyPayment } from "../stores/estimateSettingsStore";

const COMPANY = {
  name: "Service Vision",
  address: "8377 Standish Bend Dr, Tampa FL 33615",
  email: "jaamsflying@gmail.com",
  phone: "(813) 263-0691",
};

const CHANGE_NOTE_LIMIT = 500;

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Dates are stored as display strings ("Oct 07, 2026"). An unparseable or empty
// date means the estimate simply has no expiry.
const isExpired = (dateLabel: string | undefined): boolean => {
  if (!dateLabel) return false;
  const parsed = new Date(dateLabel);
  if (Number.isNaN(parsed.getTime())) return false;
  const endOfDay = new Date(parsed);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < Date.now();
};

const optionsOf = (record: EstimateRecord) =>
  record.options?.length
    ? record.options
    : [{ name: record.estimateName || "Estimate", summary: undefined, items: record.items ?? [] }];

const totalsFor = (items: EstimateLineItem[], taxRate: number) => {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const tax = items.filter((i) => i.taxable).reduce((sum, i) => sum + i.amount, 0) * (taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
};

function Shell({ children }: { children: React.ReactNode }) {
  const logo = getStoredBrandLogo();
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1A2332]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
          {logo
            ? <img src={logo} alt={COMPANY.name} className="max-h-[36px] max-w-[150px] object-contain" />
            : <div className="text-[17px]" style={{ fontWeight: 700 }}>{COMPANY.name}</div>}
          <div className="text-[13px] text-[#6B7280]">
            {COMPANY.phone} · <a href={`mailto:${COMPANY.email}`} className="text-[#4A6FA5] hover:underline">{COMPANY.email}</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-[1120px] px-4 pb-10 text-[12px] leading-[18px] text-[#9CA3AF] sm:px-6">
        {COMPANY.name} · {COMPANY.address}
        <div className="mt-1">
          If you were not expecting this estimate, do not act on it — call us on {COMPANY.phone} first.
        </div>
      </footer>
    </div>
  );
}

function Notice({ icon, tone, title, children }: {
  icon: string; tone: "green" | "amber" | "grey"; title: string; children?: React.ReactNode;
}) {
  const palette = {
    green: { bg: "#F0FDF4", border: "#BBF7D0", fg: "#166534" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", fg: "#92400E" },
    grey: { bg: "#F9FAFB", border: "#E5E7EB", fg: "#374151" },
  }[tone];
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: palette.bg, borderColor: palette.border }}>
      <div className="flex items-start gap-3">
        <span className="material-icons" style={{ fontSize: "22px", color: palette.fg }}>{icon}</span>
        <div className="min-w-0">
          <div className="text-[16px]" style={{ fontWeight: 600, color: palette.fg }}>{title}</div>
          {children && <div className="mt-1 text-[14px] leading-[21px]" style={{ color: palette.fg }}>{children}</div>}
        </div>
      </div>
    </div>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// What the client sees of an option: the lines kept off customer documents
// still count in the total but aren't listed.
const visibleItems = (items: EstimateLineItem[]) => items.filter((i) => !i.hideOnCustomerDocs);

// The full price, folded under the monthly payment. Closed it's only a small
// round arrow; it opens like an accordion to show the price, the tax inside it
// and the deposit due on approval. On a picked (blue) column it reads light.
function FullPrice({ total, tax, deposit, open, onToggle, onBlue }: {
  total: number; tax: number; deposit: number | null; open: boolean; onToggle: () => void; onBlue?: boolean;
}) {
  const arrow = onBlue ? "text-white/90 hover:bg-white/15" : "text-[#4A6FA5] hover:bg-[#DCE6F5]";
  const muted = onBlue ? "text-white/75" : "text-[#6B7280]";
  return (
    <div className="mt-1 text-[12px]">
      <button
        type="button" onClick={onToggle} aria-expanded={open}
        aria-label={open ? "Hide full price" : "Show full price"} title={open ? "Hide full price" : "Show full price"}
        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full transition-colors ${arrow}`}
      >
        <span className="material-icons transition-transform" style={{ fontSize: "20px", transform: open ? "rotate(180deg)" : undefined }}>expand_more</span>
      </button>
      {open && (
        <div className={`mx-auto mt-1 max-w-[220px] space-y-0.5 ${muted}`}>
          <div className="flex justify-between gap-3"><span>Full price</span><span className={`tabular-nums ${onBlue ? "text-white" : "text-[#1A2332]"}`} style={{ fontWeight: 600 }}>${fmt(total)}</span></div>
          <div className="flex justify-between gap-3"><span>Includes tax</span><span className="tabular-nums">{tax > 0 ? `$${fmt(tax)}` : "no tax"}</span></div>
          {deposit !== null && <div className="flex justify-between gap-3"><span>Deposit on approval</span><span className="tabular-nums">${fmt(deposit)}</span></div>}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.08em] text-[#6B7280]" style={{ fontWeight: 600 }}>{children}</div>;
}

export function ClientEstimateView() {
  const { token } = useParams();
  const all = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const legal = useSyncExternalStore(termsStore.subscribe, termsStore.getSnapshot);
  const record = all.find((e) => e.publicToken === token);

  const options = record ? optionsOf(record) : [];
  // Nothing is chosen until the client picks — a one-option estimate is chosen already.
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<"idle" | "sign" | "changes" | "decline">("idle");
  const [note, setNote] = useState("");
  const [signName, setSignName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  // Which options have their Full price accordion open.
  const [openPrice, setOpenPrice] = useState<Set<number>>(new Set());
  const togglePrice = (i: number) => setOpenPrice((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  // Financing offered by the company → the monthly payment leads (Marek).
  const estimateSettings = useSyncExternalStore(estimateSettingsStore.subscribe, estimateSettingsStore.getSnapshot);
  const financing = estimateSettings.financing?.enabled ? estimateSettings.financing : null;
  const monthlyFor = (total: number) => (financing ? monthlyPayment(total, financing.apr, financing.months) : 0);
  // Financing is offered from the lender's minimum up; a cheaper option leads with its full price.
  const financed = (total: number) => !!financing && total >= (financing.minAmount ?? 0);
  const financingLine = financing ? `through ${financing.lender} · ${financing.apr}% APR · ${financing.months} mo` : "";

  // First open marks the estimate as Viewed. Opening the email itself is not
  // tracked — mail clients prefetch images, so it would not mean anything.
  const marked = useRef(false);
  useEffect(() => {
    if (!record || marked.current) return;
    marked.current = true;
    if (record.status === "Sent") estimatesStore.update(record.id, { status: "Viewed" });
  }, [record]);

  if (!record) {
    return (
      <Shell>
        <Notice icon="link_off" tone="grey" title="This link is not valid">
          Check the link in your email, or contact us on {COMPANY.phone} and we will resend the estimate.
        </Notice>
      </Shell>
    );
  }

  const answered = ["Approved", "Changes Requested", "Declined", "Converted"].includes(record.status);
  const expired = !answered && (record.status === "Expired" || isExpired(record.expirationDate));
  const open = !answered && !expired;
  const taxRate = record.taxRate ?? 0;
  const chosen = options.find((o) => o.name === record.selectedOptionName);
  // Once answered with a choice, the page — like the document — shows only that option.
  const shownOptions = answered && chosen ? [chosen] : options;
  const comparison = shownOptions.length > 1;
  const pickIndex = comparison ? selected : 0;
  const picked = pickIndex !== null ? shownOptions[pickIndex] : undefined;
  const pickedTotals = picked ? totalsFor(picked.items, taxRate) : null;
  const depositFor = (total: number) =>
    record.depositType === "percentage" ? total * ((record.depositValue ?? 0) / 100) : record.depositValue ?? 0;
  const optionLabel = (i: number) => (comparison ? `Option ${ROMAN[i] ?? i + 1}` : "Your estimate");
  const address = (record.serviceAddress || record.clientAddress || "").replace(/\n/g, ", ");

  const approve = () => {
    if (!picked || !pickedTotals || !signName.trim() || !agreed) return;
    estimatesStore.update(record.id, {
      status: "Approved",
      selectedOptionName: picked.name,
      amount: Math.round(pickedTotals.total * 100) / 100,
      clientSignature: { name: signName.trim(), at: new Date().toISOString() },
      updatedDate: today(),
    });
    setJustSubmitted(true);
    setMode("idle");
  };
  const requestChanges = () => {
    const text = note.trim();
    if (!text) return;
    estimatesStore.update(record.id, { status: "Changes Requested", changeRequest: text, updatedDate: today() });
    setJustSubmitted(true);
    setMode("idle");
  };
  const decline = () => {
    estimatesStore.update(record.id, { status: "Declined", declineReason: declineNote.trim() || undefined, updatedDate: today() });
    setJustSubmitted(true);
    setMode("idle");
  };

  const termsBlocks = legal.terms.mode === "text" && legal.terms.text.trim()
    ? legal.terms.text.trim().split(/\n\s*\n/).map((b) => { const [h, ...rest] = b.split("\n"); return { heading: h.replace(/^\d+\.\s*/, ""), body: rest.join(" ").trim() }; })
    : [];

  return (
    <Shell>
      {/* ── Title — the document's masthead, in the app's palette ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#4A6FA5]" style={{ fontWeight: 600 }}>Estimate {record.estimateNumber}</div>
          <h1 className="mt-1 text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px]" style={{ fontWeight: 700 }}>
            {record.estimateName || "Your estimate"}
          </h1>
        </div>
        <div className="text-[13px] leading-[19px] text-[#6B7280] sm:text-right">
          {record.sentDate && <div>Issued {record.sentDate}</div>}
          {record.expirationDate && <div>Valid until {record.expirationDate}</div>}
        </div>
      </div>

      {/* ── Who and where — the grey strip at the top of the sheet ── */}
      <div className="mb-6 grid gap-4 rounded-xl bg-[#EDF0F5] px-5 py-4 sm:grid-cols-3">
        <div><Label>Customer</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{record.clientName}</div>{address && <div className="text-[13px] text-[#374151]">{address}</div>}</div>
        <div><Label>Technician</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{record.teamMember || "—"}</div></div>
        <div><Label>Questions</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{COMPANY.phone}</div><div className="text-[13px] text-[#374151]">{COMPANY.email}</div></div>
      </div>

      {/* ── State notices ── */}
      {answered && (
        <div className="mb-6">
          {record.status === "Changes Requested" ? (
            <Notice icon="mark_email_read" tone="amber" title={justSubmitted ? "Thank you — we have your notes" : "You have asked us for changes"}>
              We are working on an updated estimate and will send it to this same link. To add anything, call {COMPANY.phone}.
              {record.changeRequest && <div className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-[13px]">“{record.changeRequest}”</div>}
            </Notice>
          ) : record.status === "Declined" ? (
            <Notice icon="do_not_disturb_on" tone="grey" title={justSubmitted ? "You declined this estimate" : "This estimate was declined"}>
              Thank you for letting us know. If you change your mind, call {COMPANY.phone} and we will price it again.
            </Notice>
          ) : (
            <Notice icon="check_circle" tone="green" title={justSubmitted ? "Thank you — your approval is in" : "This estimate has been approved"}>
              {chosen && comparison === false && options.length > 1 ? <>You chose <strong>{chosen.name}</strong>. </> : null}
              {record.clientSignature && <>Signed by {record.clientSignature.name} on {new Date(record.clientSignature.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. </>}
              We will be in touch to schedule the work.
            </Notice>
          )}
        </div>
      )}
      {expired && (
        <div className="mb-6">
          <Notice icon="schedule" tone="grey" title="This estimate is expired">
            It was valid until {record.expirationDate}. Call {COMPANY.phone} or email{" "}
            <a href={`mailto:${COMPANY.email}`} className="underline">{COMPANY.email}</a> and we will price it again.
          </Notice>
        </div>
      )}

      {/* ── Two to four options — side by side, like the comparison sheet ── */}
      {comparison && (
        <>
          {open && (
            <div className="mb-3">
              <div className="text-[17px]" style={{ fontWeight: 600 }}>Choose the option that suits you</div>
              <div className="text-[13px] text-[#6B7280]">All {shownOptions.length} options were prepared for you. Pick one, then approve and sign it below.</div>
            </div>
          )}
          <div className={`grid items-stretch gap-4 sm:grid-cols-2 ${shownOptions.length >= 4 ? "xl:grid-cols-4" : shownOptions.length === 3 ? "lg:grid-cols-3" : ""}`}>
            {shownOptions.map((option, index) => {
              const t = totalsFor(option.items, taxRate);
              const isPicked = selected === index;
              return (
                <div key={option.name} className={`flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${isPicked ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/20" : "border-[#E5E7EB]"}`}>
                  <div className={`px-4 py-4 text-center ${isPicked ? "bg-[#4A6FA5] text-white" : "bg-[#EEF3FA]"}`}>
                    <div className={`text-[11px] uppercase tracking-[0.12em] ${isPicked ? "text-white/85" : "text-[#4A6FA5]"}`} style={{ fontWeight: 700 }}>{optionLabel(index)}</div>
                    {financed(t.total) ? (
                      <>
                        <div className="mt-1 text-[14px]" style={{ fontWeight: 500 }}>{option.name}</div>
                        <div className="mt-1 tabular-nums"><span className="text-[30px] leading-[36px]" style={{ fontWeight: 700 }}>${fmt(monthlyFor(t.total))}</span><span className={`ml-1 text-[14px] ${isPicked ? "text-white/80" : "text-[#6B7280]"}`} style={{ fontWeight: 500 }}>/mo</span></div>
                        <div className={`text-[11px] ${isPicked ? "text-white/80" : "text-[#6B7280]"}`}>{financingLine}</div>
                        <FullPrice total={t.total} tax={t.tax} deposit={record.depositRequired ? depositFor(t.total) : null} open={openPrice.has(index)} onToggle={() => togglePrice(index)} onBlue={isPicked} />
                      </>
                    ) : (
                      <>
                        <div className="mt-1 text-[28px] leading-[34px] tabular-nums" style={{ fontWeight: 700 }}>${fmt(t.total)}</div>
                        <div className="mt-1 text-[14px]" style={{ fontWeight: 500 }}>{option.name}</div>
                        <div className={`text-[12px] ${isPicked ? "text-white/80" : "text-[#6B7280]"}`}>{t.tax > 0 ? `includes $${fmt(t.tax)} tax` : "no tax"}</div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 px-4 py-4">
                    {option.summary && <p className="mb-3 text-[13px] leading-[19px] text-[#374151]">{option.summary}</p>}
                    <ul className="space-y-2.5">
                      {visibleItems(option.items).map((item) => (
                        <li key={item.id} className="flex gap-2 text-[14px] leading-[19px]">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4A6FA5]" />
                          <span className="min-w-0">
                            {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                            {item.description && <span className="block text-[12px] text-[#6B7280]">{item.description}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {record.depositRequired && !financed(t.total) && (
                    <div className="border-t border-[#EDF0F5] px-4 py-2.5 text-center text-[13px] text-[#374151]">
                      Deposit on approval <span style={{ fontWeight: 600 }}>${fmt(depositFor(t.total))}</span>
                    </div>
                  )}
                  {open && (
                    <div className="border-t border-[#EDF0F5] p-3">
                      <button
                        type="button"
                        onClick={() => setSelected(index)}
                        className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg text-[14px] transition-colors ${isPicked ? "bg-[#4A6FA5] text-white" : "border border-[#4A6FA5] text-[#4A6FA5] hover:bg-[#EEF3FA]"}`}
                        style={{ fontWeight: 600 }}
                      >
                        {isPicked && <span className="material-icons" style={{ fontSize: "18px" }}>check</span>}
                        {isPicked ? "Chosen" : "Choose this option"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── One option — the single sheet: what we'll do, the lines, your price ── */}
      {!comparison && shownOptions[0] && (() => {
        const option = shownOptions[0];
        const t = totalsFor(option.items, taxRate);
        const lineTax = (i: EstimateLineItem) => (i.taxable ? i.amount * (taxRate / 100) : 0);
        const scope = record.notes || option.summary;
        return (
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
            <div className="grid sm:grid-cols-[300px_1fr]">
              <div className="bg-[#EEF3FA] px-5 py-5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#4A6FA5]" style={{ fontWeight: 700 }}>{options.length > 1 ? "Your choice" : "Your estimate"}</div>
                {financed(t.total) ? (
                  <>
                    <div className="mt-1 tabular-nums"><span className="text-[30px] leading-[36px]" style={{ fontWeight: 700 }}>${fmt(monthlyFor(t.total))}</span><span className="ml-1 text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>/mo</span></div>
                    <div className="text-[11px] text-[#6B7280]">{financingLine}</div>
                    <div className="mt-1 text-[14px]" style={{ fontWeight: 500 }}>{option.name}</div>
                    <FullPrice total={t.total} tax={t.tax} deposit={record.depositRequired ? depositFor(t.total) : null} open={openPrice.has(-1)} onToggle={() => togglePrice(-1)} />
                  </>
                ) : (
                  <>
                    <div className="mt-1 text-[30px] leading-[36px] tabular-nums" style={{ fontWeight: 700 }}>${fmt(t.total)}</div>
                    <div className="mt-1 text-[14px]" style={{ fontWeight: 500 }}>{option.name}</div>
                    <div className="text-[12px] text-[#6B7280]">{t.tax > 0 ? `tax included ($${fmt(t.tax)})` : "no tax"}</div>
                  </>
                )}
              </div>
              <div className="border-t border-[#EDF0F5] px-5 py-5 sm:border-l sm:border-t-0">
                <Label>What we will do</Label>
                <p className="mt-1.5 text-[14px] leading-[21px] text-[#374151]">{scope || "The work listed below."}</p>
              </div>
            </div>
            <div className="overflow-x-auto border-t border-[#E5E7EB]">
              <table className="w-full min-w-[560px] text-[14px]">
                <thead>
                  <tr className="bg-[#F5F7FA] text-[11px] uppercase tracking-[0.08em] text-[#6B7280]">
                    <th className="px-5 py-2.5 text-left" style={{ fontWeight: 600 }}>Item</th>
                    <th className="px-3 py-2.5 text-center" style={{ fontWeight: 600 }}>Qty</th>
                    <th className="px-3 py-2.5 text-right" style={{ fontWeight: 600 }}>Unit price</th>
                    <th className="px-3 py-2.5 text-right" style={{ fontWeight: 600 }}>Tax</th>
                    <th className="px-5 py-2.5 text-right" style={{ fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems(option.items).map((i) => (
                    <tr key={i.id} className="border-t border-[#EDF0F5]">
                      <td className="px-5 py-3"><div style={{ fontWeight: 500 }}>{i.name}</div>{i.description && <div className="text-[12px] text-[#6B7280]">{i.description}</div>}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{i.quantity}</td>
                      <td className="px-3 py-3 text-right tabular-nums">${fmt(i.price)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[#6B7280]">{i.taxable ? `$${fmt(lineTax(i))}` : "—"}</td>
                      <td className="px-5 py-3 text-right tabular-nums" style={{ fontWeight: 500 }}>${fmt(i.amount + lineTax(i))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#EEF3FA] px-5 py-4">
              <div>
                <div className="text-[16px]" style={{ fontWeight: 600 }}>Your price</div>
                <div className="text-[12px] text-[#6B7280]">
                  Tax included{financed(t.total) ? ` · or $${fmt(monthlyFor(t.total))} per month ${financingLine}` : ""}{record.depositRequired ? ` · deposit on approval $${fmt(depositFor(t.total))}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[26px] tabular-nums" style={{ fontWeight: 700 }}>${fmt(t.total)}</div>
                {record.expirationDate && <div className="text-[12px] text-[#6B7280]">Valid until {record.expirationDate}</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── The answer: approve & sign, ask for changes, or decline ── */}
      {open && (
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
          {mode === "idle" && (
            <>
              <div className="mb-3 text-[14px] text-[#374151]">
                {!comparison && pickedTotals
                  ? <>Ready to go ahead? Approve and sign to accept <strong className="tabular-nums">${fmt(pickedTotals.total)}</strong>.</>
                  : picked && pickedTotals
                    ? <>You chose <strong>{`${optionLabel(pickIndex!)} · ${picked.name}`}</strong> — <strong className="tabular-nums">${fmt(pickedTotals.total)}</strong>.</>
                    : <>Choose an option above to approve it.</>}
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={() => setMode("sign")} disabled={!picked}
                  className="h-11 flex-1 rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white transition-colors hover:bg-[#3d5a85] disabled:pointer-events-none disabled:bg-[#C7D2E1]" style={{ fontWeight: 600 }}>
                  Approve &amp; sign
                </button>
                <button type="button" onClick={() => setMode("changes")}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                  Request changes
                </button>
                <button type="button" onClick={() => setMode("decline")}
                  className="h-11 rounded-lg px-4 text-[15px] text-[#6B7280] transition-colors hover:bg-[#F5F7FA] sm:flex-none" style={{ fontWeight: 600 }}>
                  Decline
                </button>
              </div>
            </>
          )}

          {mode === "sign" && picked && pickedTotals && (
            <>
              <div className="text-[17px]" style={{ fontWeight: 600 }}>Approve and sign</div>
              <div className="mt-1 text-[14px] text-[#374151]">
                {comparison ? `${optionLabel(pickIndex!)} · ${picked.name}` : picked.name} — <strong className="tabular-nums">${fmt(pickedTotals.total)}</strong>, tax included.
                {record.depositRequired && <> A deposit of <strong>${fmt(depositFor(pickedTotals.total))}</strong> is due on approval; the balance is invoiced when the work is done.</>}
              </div>
              <label className="mt-4 block text-[14px]" style={{ fontWeight: 600 }} htmlFor="sign-name">Type your full name to sign</label>
              <input id="sign-name" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder={record.clientName}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-[18px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10"
                style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }} />
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-[13px] leading-[19px] text-[#374151]">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4A6FA5]" />
                <span>I approve this estimate and accept the terms and conditions below.{comparison ? ` All ${shownOptions.length} options were explained to me.` : ""}</span>
              </label>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={approve} disabled={!signName.trim() || !agreed}
                  className="h-11 flex-1 rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white transition-colors hover:bg-[#3d5a85] disabled:pointer-events-none disabled:bg-[#C7D2E1]" style={{ fontWeight: 600 }}>
                  Approve ${fmt(pickedTotals.total)}
                </button>
                <button type="button" onClick={() => setMode("idle")}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                  Back
                </button>
              </div>
            </>
          )}

          {mode === "changes" && (
            <>
              <label className="block text-[14px]" style={{ fontWeight: 600 }} htmlFor="change-note">What would you like changed?</label>
              <textarea id="change-note" value={note} maxLength={CHANGE_NOTE_LIMIT} onChange={(e) => setNote(e.target.value)} rows={4}
                placeholder="Tell us what to adjust and we will send an updated estimate to this same link."
                className="mt-2 w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[14px] leading-[20px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10" />
              <div className="mt-1 text-right text-[12px] text-[#9CA3AF]">{note.length}/{CHANGE_NOTE_LIMIT}</div>
              <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={requestChanges} disabled={!note.trim()}
                  className="h-11 flex-1 rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white hover:bg-[#3d5a85] disabled:pointer-events-none disabled:bg-[#C7D2E1]" style={{ fontWeight: 600 }}>
                  Send request
                </button>
                <button type="button" onClick={() => { setMode("idle"); setNote(""); }}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                  Back
                </button>
              </div>
            </>
          )}

          {mode === "decline" && (
            <>
              <div className="text-[17px]" style={{ fontWeight: 600 }}>Decline this estimate?</div>
              <div className="mt-1 text-[14px] text-[#6B7280]">We won't do the work. You can tell us why — it helps us price better next time.</div>
              <textarea value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} rows={3} maxLength={CHANGE_NOTE_LIMIT}
                placeholder="Reason (optional)"
                className="mt-3 w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[14px] leading-[20px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10" />
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={decline}
                  className="h-11 flex-1 rounded-lg bg-[#DC2626] px-4 text-[15px] text-white hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>
                  Decline estimate
                </button>
                <button type="button" onClick={() => setMode("idle")}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Page 2 of the document: payment and the terms ── */}
      <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
        {record.depositRequired && (
          <div className="mb-5 grid gap-4 border-b border-[#EDF0F5] pb-5 sm:grid-cols-3">
            <div className="sm:col-span-3"><Label>Payment</Label></div>
            <div><div className="text-[12px] text-[#6B7280]">Deposit on approval</div><div className="text-[14px]" style={{ fontWeight: 600 }}>{record.depositType === "percentage" ? `${record.depositValue ?? 0}%` : `$${fmt(record.depositValue ?? 0)}`}</div></div>
            <div><div className="text-[12px] text-[#6B7280]">Balance</div><div className="text-[14px]" style={{ fontWeight: 600 }}>on completion</div></div>
            <div><div className="text-[12px] text-[#6B7280]">We accept</div><div className="text-[14px]" style={{ fontWeight: 600 }}>card, check and cash</div></div>
          </div>
        )}
        <details open={termsBlocks.length <= 4}>
          <summary className="cursor-pointer list-none"><Label>Terms and conditions</Label></summary>
          <div className="mt-3 space-y-2.5 text-[13px] leading-[20px] text-[#374151]">
            {termsBlocks.length
              ? termsBlocks.map((b, i) => <p key={i}>{b.heading && <strong>{b.heading}. </strong>}{b.body}</p>)
              : <p>This estimate is valid until {record.expirationDate || "the date shown"}. Nothing is added to your price without your approval.</p>}
          </div>
        </details>
      </div>
    </Shell>
  );
}
