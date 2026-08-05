import { useState } from "react";
import { toast } from "sonner";

// Send payment reminder (Figma 2493:19011 on Clients, 2866:72710 on Invoices) —
// one modal serving both entry points: the client row kebab and the invoice row
// kebab. TO card, the outstanding invoice, an editable prefilled message and the
// "reminders are sent by email" footnote.

export interface ReminderRecipient {
  name: string;
  email: string;
  initials: string;
  avatarColor?: string;
}

export interface ReminderInvoice {
  number: string;
  amount: number;
  /** Days past due; 0/undefined renders the non-overdue copy. */
  daysOverdue?: number;
  /** Small line under the invoice number, e.g. "due May 20". */
  detail?: string;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SendReminderModal({
  recipient,
  invoice,
  companyName = "Omega Home Services",
  onClose,
}: {
  recipient: ReminderRecipient;
  invoice: ReminderInvoice;
  companyName?: string;
  onClose: () => void;
}) {
  const days = invoice.daysOverdue ?? 0;
  const overdue = days > 0;
  const firstName = recipient.name.split(" ")[0];
  const [message, setMessage] = useState(
    overdue
      ? `Hi ${firstName}, this is a friendly reminder that invoice ${invoice.number} for $${fmt(invoice.amount)} is now ${days} day${days === 1 ? "" : "s"} overdue. You can pay securely using the link below. Thank you! — ${companyName}`
      : `Hi ${firstName}, this is a friendly reminder about your outstanding balance of $${fmt(invoice.amount)} on invoice ${invoice.number}. You can pay securely using the link below. Thank you! — ${companyName}`
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex w-[640px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>Send payment reminder</h2>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">Email the client a reminder for their outstanding balance.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#1A2332]">
            <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* TO */}
        <div className="border-y border-[#EDF0F5] bg-[#F8FAFC] px-6 py-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[#6B7280]" style={{ fontWeight: 600 }}>To</p>
          <div className="inline-flex items-center gap-3 rounded-xl border border-[#4A6FA5] bg-[#EEF3FA] px-3.5 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] text-white" style={{ backgroundColor: recipient.avatarColor || "#1A2332", fontWeight: 600 }}>
              {recipient.initials}
            </div>
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{recipient.name}</div>
              <div className="text-[12px] text-[#6B7280]">{recipient.email}</div>
            </div>
          </div>
        </div>

        {/* Outstanding invoice + message */}
        <div className="px-6 py-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[#6B7280]" style={{ fontWeight: 600 }}>Outstanding invoices</p>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>{invoice.number}</span>
                {overdue && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]" style={{ fontWeight: 600 }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                    Overdue {days} day{days === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {invoice.detail && <div className="mt-0.5 truncate text-[12px] text-[#6B7280]">{invoice.detail}</div>}
            </div>
            <span className="shrink-0 text-[15px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(invoice.amount)}</span>
          </div>

          <p className="mb-1.5 mt-4 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Message</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="min-h-[96px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[13px] leading-5 text-[#1A2332] outline-none focus:border-[#4A6FA5]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#EDF0F5] bg-[#F8FAFC] px-6 py-4">
          <span className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <span className="material-icons" style={{ fontSize: "16px" }}>mail_outline</span>
            Reminders are sent by email.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#374151] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button
              onClick={() => { toast.success(`Payment reminder sent to ${recipient.name}`); onClose(); }}
              className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              Send reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
