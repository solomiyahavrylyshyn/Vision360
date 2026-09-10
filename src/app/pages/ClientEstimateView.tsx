// The page the client opens from the estimate email. Anonymous — no login, no
// app chrome — and identified only by the token in the URL, which is minted
// when the estimate is sent. Three states: the estimate is still open and can
// be answered, it has already been answered, or it has expired.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { estimatesStore, type EstimateLineItem, type EstimateRecord } from "../stores/estimatesStore";
import { getStoredBrandLogo } from "../utils/brandTheme";

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
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
          {logo
            ? <img src={logo} alt={COMPANY.name} className="max-h-[36px] max-w-[150px] object-contain" />
            : <div className="text-[17px]" style={{ fontWeight: 700 }}>{COMPANY.name}</div>}
          <div className="text-[13px] text-[#6B7280]">
            {COMPANY.phone} · <a href={`mailto:${COMPANY.email}`} className="text-[#4A6FA5] hover:underline">{COMPANY.email}</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[860px] px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-[860px] px-4 pb-10 text-[12px] leading-[18px] text-[#9CA3AF] sm:px-6">
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

export function ClientEstimateView() {
  const { token } = useParams();
  const all = useSyncExternalStore(estimatesStore.subscribe, estimatesStore.getSnapshot);
  const record = all.find((e) => e.publicToken === token);

  const options = record ? optionsOf(record) : [];
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [note, setNote] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

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

  const answered = ["Approved", "Changes Requested", "Rejected", "Converted"].includes(record.status);
  const expired = !answered && (record.status === "Expired" || isExpired(record.expirationDate));
  const taxRate = record.taxRate ?? 0;
  const chosen = options.find((o) => o.name === record.selectedOptionName);
  const shownOptions = answered && chosen ? [chosen] : options;

  const accept = () => {
    const option = options[selected];
    estimatesStore.update(record.id, {
      status: "Approved",
      selectedOptionName: option.name,
      amount: Math.round(totalsFor(option.items, taxRate).total * 100) / 100,
      updatedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
    setJustSubmitted(true);
  };

  const requestChanges = () => {
    const text = note.trim();
    if (!text) return;
    estimatesStore.update(record.id, {
      status: "Changes Requested",
      changeRequest: text,
      updatedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
    setJustSubmitted(true);
  };

  return (
    <Shell>
      <div className="mb-5">
        <div className="text-[13px] text-[#6B7280]">Estimate {record.estimateNumber}</div>
        <h1 className="mt-1 text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px]" style={{ fontWeight: 700 }}>
          {record.estimateName || "Your estimate"}
        </h1>
        <div className="mt-2 text-[14px] text-[#6B7280]">
          Prepared for {record.clientName}
          {record.serviceAddress && <> · {record.serviceAddress.replace(/\n/g, ", ")}</>}
          {record.expirationDate && <> · valid until {record.expirationDate}</>}
        </div>
      </div>

      {/* State 2 — already answered. The status never rolls back, so a second
          visit is read-only and points the client at a person instead. */}
      {answered && (
        <div className="mb-5">
          {record.status === "Changes Requested" ? (
            <Notice icon="mark_email_read" tone="amber" title={justSubmitted ? "Thank you — we have your notes" : "You have asked us for changes"}>
              We are working on an updated estimate and will send it over. To add anything, call {COMPANY.phone}.
              {record.changeRequest && (
                <div className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-[13px]">“{record.changeRequest}”</div>
              )}
            </Notice>
          ) : (
            <Notice icon="check_circle" tone="green" title={justSubmitted ? "Thank you — your approval is in" : "This estimate has already been approved"}>
              {chosen ? <>You chose <strong>{chosen.name}</strong>. </> : null}
              We will be in touch to schedule the work. To change anything, contact us on {COMPANY.phone}.
            </Notice>
          )}
        </div>
      )}

      {/* State 3 — past its expiry date and never answered. */}
      {expired && (
        <div className="mb-5">
          <Notice icon="schedule" tone="grey" title="This estimate is expired">
            It was valid until {record.expirationDate}. Call {COMPANY.phone} or email{" "}
            <a href={`mailto:${COMPANY.email}`} className="underline">{COMPANY.email}</a> and we will price it again.
          </Notice>
        </div>
      )}

      {/* State 1 — open: the options, with the choice on the client. */}
      {shownOptions.length > 1 && !answered && !expired && (
        <div className="mb-3 text-[15px]" style={{ fontWeight: 600 }}>Choose the option that suits you best</div>
      )}

      <div className={shownOptions.length > 1 ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4"}>
        {shownOptions.map((option, index) => {
          const t = totalsFor(option.items, taxRate);
          const selectable = !answered && !expired && shownOptions.length > 1;
          const isSelected = selectable && selected === index;
          return (
            <label
              key={option.name}
              className={`flex flex-col rounded-xl border bg-white p-4 transition-colors ${selectable ? "cursor-pointer" : ""} ${isSelected ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/15" : "border-[#E5E7EB]"}`}
            >
              <div className="flex items-start gap-2.5">
                {selectable && (
                  <input
                    type="radio"
                    name="estimate-option"
                    checked={isSelected}
                    onChange={() => setSelected(index)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#4A6FA5]"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-[16px] leading-[22px]" style={{ fontWeight: 600 }}>{option.name}</div>
                  {option.summary && <div className="mt-1 text-[13px] leading-[19px] text-[#6B7280]">{option.summary}</div>}
                </div>
              </div>

              <div className="mt-3 border-t border-[#F3F4F6] pt-3">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>What&rsquo;s included</div>
                <ul className="space-y-1.5 text-[13px] leading-[18px]">
                  {option.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <span className="text-[#374151]">{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
                      <span className="whitespace-nowrap text-[#6B7280]">${fmt(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 border-t border-[#F3F4F6] pt-3">
                {t.tax > 0 && (
                  <div className="flex justify-between text-[13px] text-[#6B7280]"><span>Tax</span><span>${fmt(t.tax)}</span></div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-[#6B7280]">Total</span>
                  <span className="text-[20px]" style={{ fontWeight: 700 }}>${fmt(t.total)}</span>
                </div>
                {record.depositRequired && (
                  <div className="mt-1 text-[12px] text-[#6B7280]">
                    Deposit due ${fmt(record.depositType === "percentage" ? t.total * ((record.depositValue ?? 0) / 100) : record.depositValue ?? 0)}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {record.notes && (
        <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-white p-4 text-[13px] leading-[20px] text-[#374151]">
          <div className="mb-1 text-[#9CA3AF]" style={{ fontWeight: 600 }}>A note from us</div>
          {record.notes}
        </div>
      )}

      {!answered && !expired && (
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
          {mode === "idle" ? (
            <>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={accept}
                  className="h-11 flex-1 rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white transition-colors hover:bg-[#3d5a85]"
                  style={{ fontWeight: 600 }}
                >
                  Accept{options.length > 1 ? ` “${options[selected].name}”` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("changes")}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
                  style={{ fontWeight: 600 }}
                >
                  Request changes
                </button>
              </div>
              <div className="mt-3 text-[12px] leading-[18px] text-[#9CA3AF]">
                Accepting is your approval of this estimate and its terms and conditions.
              </div>
            </>
          ) : (
            <>
              <label className="block text-[14px]" style={{ fontWeight: 600 }} htmlFor="change-note">
                What would you like changed?
              </label>
              <textarea
                id="change-note"
                value={note}
                maxLength={CHANGE_NOTE_LIMIT}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Tell us what to adjust and we will send an updated estimate."
                className="mt-2 w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-[14px] leading-[20px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10"
              />
              <div className="mt-1 text-right text-[12px] text-[#9CA3AF]">{note.length}/{CHANGE_NOTE_LIMIT}</div>
              <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={requestChanges}
                  disabled={!note.trim()}
                  className="h-11 flex-1 rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white transition-colors hover:bg-[#3d5a85] disabled:cursor-not-allowed disabled:bg-[#C7D2E1]"
                  style={{ fontWeight: 600 }}
                >
                  Send request
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("idle"); setNote(""); }}
                  className="h-11 flex-1 rounded-lg border border-[#D8DEE8] px-4 text-[15px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
                  style={{ fontWeight: 600 }}
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
