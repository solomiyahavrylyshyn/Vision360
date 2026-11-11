// The office side of a payment the server refused from the technician app
// (M2-8). Shown on the job and on the invoice it was meant for, and — once it
// is applied there — on the invoice that received it.
//   • open: a red marker with the amount, method, technician and times, and
//     "Resolve payment" — there is no Dismiss, the technician took the money;
//   • handled: a green line with where the money landed and who handled it.
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  syncIssuesStore, OFFICE_USER, money2, timeOf, dayOf, resolutionLine,
  type RefusedPayment, type Resolution,
} from "../stores/syncIssuesStore";

type Where = "job" | "invoice";

export function RefusedPaymentPanel({ where, jobKey, invoiceKey }: { where: Where; jobKey?: string; invoiceKey?: string }) {
  const all = useSyncExternalStore(syncIssuesStore.subscribe, syncIssuesStore.getSnapshot);
  const list = all.filter((p) => (where === "job" ? p.jobKey === jobKey
    : p.invoiceKey === invoiceKey || (p.resolution?.kind === "apply" && p.resolution.invoiceKey === invoiceKey)));
  if (!list.length) return null;
  return <>{list.map((p) => <PaymentCard key={p.id} p={p} where={where} invoiceKey={invoiceKey} />)}</>;
}

function PaymentCard({ p, where, invoiceKey }: { p: RefusedPayment; where: Where; invoiceKey?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const tFirst = p.technician.split(" ")[0];
  const r = p.resolution;

  if (r) {
    const landedHere = r.kind === "apply" && r.invoiceKey === invoiceKey;
    const goTo = r.kind === "apply" && !landedHere ? r.invoiceKey : landedHere ? p.invoiceKey : null;
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#BBF0CC] bg-[#F0FDF4] px-4 py-2.5">
        <span className="material-icons text-[#16A34A]" style={{ fontSize: 20 }}>check_circle</span>
        <div className="min-w-[240px] flex-1">
          <div className="text-[14px] text-[#14532D]" style={{ fontWeight: 600 }}>
            {landedHere
              ? `Includes ${money2(p.amount)} ${p.method.toLowerCase()} ${tFirst} took on ${p.jobNumber} — moved from ${p.invoiceNumber}`
              : `${tFirst}'s ${money2(p.amount)} ${p.method.toLowerCase()} payment · ${resolutionLine(p)}`}
          </div>
          <div className="text-[12px] text-[#3F6B4E]">
            Handled by {r.by} · {dayOf(r.at)} {timeOf(r.at)}{r.note ? ` · ${r.note}` : ""} · {tFirst}&rsquo;s app shows &ldquo;Handled by the office&rdquo;
          </div>
        </div>
        {goTo && (
          <button onClick={() => navigate(`/invoices/${goTo}?tab=payments`)} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
            Open {goTo}
          </button>
        )}
        <button onClick={() => { syncIssuesStore.reset(); toast("Demo started over · the payment is waiting again"); }}
          className="text-[12px] text-[#8A97A8] hover:underline" style={{ fontWeight: 500 }}>
          Demo: start over
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-start gap-3 rounded-lg border border-[#F5C2C2] bg-[#FEF2F2] px-4 py-3">
        <span className="material-icons mt-0.5 text-[#DC2626]" style={{ fontSize: 20 }}>sync_problem</span>
        <div className="min-w-[260px] flex-1">
          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
            Payment from the technician app not accepted · {money2(p.amount)} {p.method.toLowerCase()}
          </div>
          <div className="mt-0.5 text-[13px] text-[#374151]">
            Taken by {p.technician} on {p.jobNumber} · {dayOf(p.takenAt)} {timeOf(p.takenAt)}, offline · reached the office {timeOf(p.refusedAt)} from {tFirst}&rsquo;s phone ({p.device})
          </div>
          <div className="mt-0.5 text-[13px] text-[#B42318]">
            The server didn&rsquo;t take it: {p.invoiceNumber} is already paid in full. The money isn&rsquo;t on any invoice yet.
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-center">
          {where === "job" && (
            <button onClick={() => navigate(`/invoices/${p.invoiceKey}`)} className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
              Open {p.invoiceNumber}
            </button>
          )}
          <button onClick={() => toast(`Calling ${p.technician} — (813) 555-0174`)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: 16 }}>call</span>Call {tFirst}
          </button>
          <button onClick={() => setOpen(true)} className="h-8 rounded-lg bg-[#4A6FA5] px-3 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
            Resolve payment
          </button>
        </div>
      </div>
      {open && <ResolveDialog p={p} onClose={() => setOpen(false)} />}
    </>
  );
}

function ResolveDialog({ p, onClose }: { p: RefusedPayment; onClose: () => void }) {
  const hasOpen = p.openInvoices.length > 0;
  const [kind, setKind] = useState<Resolution["kind"]>(hasOpen ? "apply" : "credit");
  const [target, setTarget] = useState(p.openInvoices[0]?.key ?? "");
  const [note, setNote] = useState("");
  const tFirst = p.technician.split(" ")[0];
  const firstName = p.client.split(" ")[0];

  const save = () => {
    const at = new Date().toISOString();
    const base = { by: OFFICE_USER, at, note: note.trim() };
    const t = p.openInvoices.find((i) => i.key === target);
    const r: Resolution = kind === "apply" && t
      ? { kind: "apply", invoiceKey: t.key, invoiceNumber: t.number, ...base }
      : kind === "refund" ? { kind: "refund", ...base } : { kind: "credit", ...base };
    syncIssuesStore.resolve(p.id, r);
    onClose();
    toast.success(`Payment sorted out · ${tFirst}'s app shows "Handled by the office"`);
  };

  // A render helper, not a component: a component declared here would remount
  // (and drop the select's focus) on every change.
  const option = (value: Resolution["kind"], title: string, sub: string, disabled?: boolean, children?: ReactNode) => (
    <label key={value} className={`block rounded-lg border px-3.5 py-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${kind === value ? "border-[#4A6FA5] bg-[#F5F8FC]" : "border-[#E5E7EB] hover:bg-[#F9FAFB]"}`}>
      <div className="flex items-start gap-2.5">
        <input type="radio" name="rp-kind" className="mt-1 accent-[#4A6FA5]" checked={kind === value} disabled={disabled} onChange={() => setKind(value)} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</div>
          <div className="text-[12.5px] text-[#6B7280]">{sub}</div>
          {children}
        </div>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative max-h-[90vh] w-[520px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Resolve {tFirst}&rsquo;s payment</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F5F7FA]"><span className="material-icons" style={{ fontSize: 20 }}>close</span></button>
        </div>

        <div className="mt-3 rounded-lg bg-[#F5F7FA] px-3.5 py-3 text-[13px] text-[#374151]">
          <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{money2(p.amount)} · {p.method}</div>
          <div className="mt-0.5">Taken by {p.technician} on {p.jobNumber} · {p.client} · {dayOf(p.takenAt)} {timeOf(p.takenAt)}</div>
          <div className="mt-0.5 text-[#B42318]">{p.invoiceNumber} was already paid in full when it reached the office.</div>
        </div>

        <div className="mt-4 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Where does the money go?</div>
        <div className="mt-2 space-y-2">
          {option("apply", `Apply to another open invoice of ${p.client}`,
            hasOpen ? "The payment is recorded on that invoice and lowers its balance." : `${p.client} has no other open invoice.`,
            !hasOpen,
            hasOpen && kind === "apply" && (
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2 h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-[13px] outline-none focus:border-[#4A6FA5]">
                {p.openInvoices.map((i) => <option key={i.key} value={i.key}>{i.number} · {i.title} · balance {money2(i.balance)}</option>)}
              </select>
            ))}
          {option("credit", `Keep as credit for ${p.client}`, `It stays on ${firstName}'s account and comes off the next invoice.`)}
          {option("refund", `Refund to ${p.client}`, `The cash goes back to ${firstName}. Record it once it's returned.`)}
        </div>

        <label className="mt-4 block text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>
          Note <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>(optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "refund" ? `e.g. ${tFirst} returns it on the next visit` : `e.g. Spoke with ${firstName}`}
            className="mt-1.5 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[13px] outline-none focus:border-[#4A6FA5]" style={{ fontWeight: 400 }} />
        </label>

        <p className="mt-3 text-[12px] text-[#6B7280]">
          Recording it on {p.invoiceNumber} would overpay the invoice. If the card payment there was the mistake, refund that payment first.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button onClick={save} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
