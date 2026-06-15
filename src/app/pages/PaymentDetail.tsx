import { useState, useRef, useSyncExternalStore } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { paymentStatusColors, paymentMethodIcons, type Payment, type PaymentStatus } from "./Payments";
import { paymentsStore } from "../stores/paymentsStore";
import { formatRegionalDate } from "../stores/regionalSettingsStore";

interface PaymentAttachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "pdf" | "file";
  previewUrl?: string;
}

interface PaymentNote {
  id: string;
  text: string;
  date: string;
}

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

type TabKey = "details" | "activity";

const fmtDate = (d: string) => formatRegionalDate(new Date(d + "T12:00:00"));
// "2026-04-03 11:00" → "Apr 3, 2026 11:00" (Figma activity timestamp format).
const fmtDateTime = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec((s || "").trim());
  if (!m) return s || "—";
  const mon = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", { month: "short" });
  return `${mon} ${Number(m[3])}, ${m[1]} ${m[4]}:${m[5]}`;
};

/* Extra fields not in the Payment type — keyed by payment id */
const MOCK_EXTRAS: Record<number, {
  phone: string;
  address: string;
  creditCard: string;
  payoutStatus: "Paid" | "Pending" | "—";
}> = {
  1: { phone: "(813) 612-5487", address: "4405 North Clark Ave, Tampa, FL 33614", creditCard: "", payoutStatus: "Paid" },
  2: { phone: "(813) 612-5487", address: "4405 North Clark Ave, Tampa, FL 33614", creditCard: "", payoutStatus: "Paid" },
  3: { phone: "(407) 555-9988", address: "890 Sunrise Blvd, Orlando, FL 32801", creditCard: "•••• •••• •••• 1234", payoutStatus: "Paid" },
  4: { phone: "(305) 444-7722", address: "780 Coral Way, Miami, FL 33135", creditCard: "", payoutStatus: "Pending" },
  5: { phone: "(407) 555-9988", address: "890 Sunrise Blvd, Orlando, FL 32801", creditCard: "", payoutStatus: "Paid" },
  6: { phone: "(813) 612-5487", address: "4405 North Clark Ave, Tampa, FL 33614", creditCard: "•••• •••• •••• 4242", payoutStatus: "—" },
  7: { phone: "(512) 555-0198", address: "123 Main St, Austin, TX 78701", creditCard: "•••• •••• •••• 4545", payoutStatus: "Paid" },
};

const payoutColors: Record<string, { text: string; bg: string }> = {
  Paid:    { text: "#16A34A", bg: "rgba(22,163,74,0.15)" },
  Pending: { text: "#D97706", bg: "rgba(245,158,11,0.15)" },
  "—":     { text: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_OPTIONS: PaymentStatus[] = ["Completed", "Pending", "Refunded"];

export function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<TabKey>((searchParams.get("tab") as TabKey) || "details");
  const setActiveTab = (key: TabKey) => {
    setActiveTabState(key);
    const next = new URLSearchParams(searchParams);
    if (key === "details") next.delete("tab"); else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  // Subscribe to the store so status changes (dropdown / Refund) re-render live.
  const allPayments = useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getSnapshot);
  const payment: Payment | undefined = allPayments.find(p => p.id === Number(id));

  // Section 6.3 — attachments (proof of payment, photo of check, etc.)
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  // Notes card (Figma detail "Notes"). Seeded from the payment's note; add/edit/delete supported.
  const [notes, setNotes] = useState<PaymentNote[]>(
    payment?.note ? [{ id: "seed-0", text: payment.note, date: fmtDate(payment.date) }] : []
  );
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  // "View payout" modal — payout figures come from the Stripe integration.
  const [payoutOpen, setPayoutOpen] = useState(false);
  // Refund modal (Marek, Jun 11): memo + MANUAL amount (full or partial) + how the
  // money is returned (cash record vs through the system / original method).
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMemo, setRefundMemo] = useState("");
  const [refundMethod, setRefundMethod] = useState<"Cash / manual" | "Original payment method">("Original payment method");

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "svg"];
    const additions: PaymentAttachment[] = [];
    Array.from(files).forEach(f => {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      const isImage = imageExts.includes(ext) || f.type.startsWith("image/");
      const isPdf = ext === "pdf" || f.type === "application/pdf";
      const att: PaymentAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: formatBytes(f.size),
        type: isImage ? "image" : isPdf ? "pdf" : "file",
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, previewUrl: String(reader.result) } : a));
        reader.readAsDataURL(f);
      }
      additions.push(att);
    });
    setAttachments(prev => [...additions, ...prev]);
    toast.success(`${additions.length} file${additions.length > 1 ? "s" : ""} attached`);
  };

  const removeAttachment = (attId: string) => {
    setAttachments(prev => {
      const next = prev.filter(a => a.id !== attId);
      if (previewIdx >= next.length) setPreviewIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  const openAddNote = () => { setEditingNoteId(null); setDraftNote(""); setAddingNote(true); };
  const openEditNote = (n: PaymentNote) => { setEditingNoteId(n.id); setDraftNote(n.text); setAddingNote(true); };
  const cancelNote = () => { setAddingNote(false); setEditingNoteId(null); setDraftNote(""); };
  const saveNote = () => {
    const text = draftNote.trim();
    if (!text) { cancelNote(); return; }
    if (editingNoteId) {
      setNotes(prev => prev.map(n => n.id === editingNoteId ? { ...n, text } : n));
      toast.success("Note updated");
    } else {
      setNotes(prev => [{ id: `${Date.now()}`, text, date: formatRegionalDate(new Date()) }, ...prev]);
      toast.success("Note added");
    }
    cancelNote();
  };
  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success("Note deleted");
  };

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <button
          onClick={() => navigate("/payments")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85]"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Payments
        </button>
        <div className="mt-6 text-[14px] text-[#546478]">Payment not found.</div>
      </div>
    );
  }

  const ss = paymentStatusColors[payment.status];
  const extras = MOCK_EXTRAS[payment.id] ?? {
    phone: "(555) 000-0000",
    address: "—",
    creditCard: "—",
    payoutStatus: "Pending" as const,
  };

  /* Derive a display payment number from the invoice number prefix */
  const paymentNumber =
    payment.invoiceNumber.split("-")[0] + "-P" + String(payment.id).padStart(2, "0");

  const payoutC = payoutColors[extras.payoutStatus] ?? payoutColors["Pending"];

  const changeStatus = (status: PaymentStatus) => {
    if (status === payment.status) return;
    paymentsStore.update(payment.id, { status });
    toast.success(`Status changed to ${status}`);
  };

  // Open the refund modal seeded with the full amount + the sensible return method.
  const openRefund = () => {
    setRefundAmount(String(payment.amount));
    setRefundMemo("");
    setRefundMethod(payment.method === "Cash" ? "Cash / manual" : "Original payment method");
    setRefundOpen(true);
  };
  const submitRefund = () => {
    const amt = Number(refundAmount);
    if (!refundMemo.trim()) { toast.error("Enter a reason for the refund."); return; }
    if (!Number.isFinite(amt) || amt <= 0 || amt > payment.amount) {
      toast.error(`Enter a refund amount between $0 and $${payment.amount.toLocaleString("en-US")}.`);
      return;
    }
    paymentsStore.update(payment.id, {
      status: "Refunded",
      refundAmount: amt,
      refundMemo: refundMemo.trim(),
      refundMethod,
      refundDate: new Date().toISOString().split("T")[0],
    });
    setRefundOpen(false);
    toast.success(`Refunded $${amt.toLocaleString("en-US")} ${amt < payment.amount ? "(partial)" : ""}`.trim());
  };

  const visibleNotes = showAllNotes ? notes : notes.slice(0, 4);

  /* ──────────────────────── Details tab ──────────────────────── */
  const renderDetails = () => (
    <div className="grid grid-cols-3 gap-4 items-start">

      {/* Details card */}
      <div className="border border-[#E5E7EB] rounded-xl p-4">
        <h3 className="text-[16px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Details</h3>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Date" value={fmtDate(payment.date)} />
          <Field
            label="Method"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>
                  {paymentMethodIcons[payment.method]}
                </span>
                {payment.method}
              </span>
            }
          />
          <Field
            label="Invoice"
            value={
              <button
                onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
                className="text-[14px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                {payment.invoiceNumber}
              </button>
            }
          />
          <Field label="Created by" value={payment.createdBy} />
          {/* "Transaction number" per Marek (Jun 11) — Figma's "Reference #" is stale. */}
          <Field
            label="Transaction number"
            value={payment.reference ? payment.reference : <span className="text-[#9CA3AF]">—</span>}
          />
          <Field
            label="Credit card"
            value={
              extras.creditCard ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "15px" }}>credit_card</span>
                  {extras.creditCard}
                </span>
              ) : (
                <span className="text-[#9CA3AF]">—</span>
              )
            }
          />
          <Field
            label="Job"
            value={
              payment.jobId ? (
                <button
                  onClick={() => navigate(`/jobs/${payment.jobId?.replace(/^JOB-/, "")}`)}
                  className="text-[14px] text-[#4A6FA5] hover:underline"
                  style={{ fontWeight: 500 }}
                >
                  {payment.jobId}
                </button>
              ) : (
                <span className="text-[#9CA3AF]">—</span>
              )
            }
          />
          <Field
            label="Status"
            value={
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px]"
                style={{ fontWeight: 600, color: payoutC.text, backgroundColor: payoutC.bg }}
              >
                {extras.payoutStatus === "—" ? "Unpaid" : extras.payoutStatus}
              </span>
            }
          />
        </div>
      </div>

      {/* Attachments card (Section 6.3 — proof of payment, photo of check) */}
      <div className="border border-[#E5E7EB] rounded-xl p-4">
        <h3 className="text-[16px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>
          Attachments
          {attachments.length > 0 && (
            <span className="text-[#9CA3AF] text-[14px] ml-1" style={{ fontWeight: 400 }}>({attachments.length})</span>
          )}
        </h3>
        <input
          ref={attachInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={e => { handleFilesAdded(e.target.files); e.target.value = ""; }}
        />
        {attachments.length === 0 ? (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFilesAdded(e.dataTransfer.files); }}
            onClick={() => attachInputRef.current?.click()}
            className={`mt-4 border-2 border-dashed rounded-xl py-10 px-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
              isDragOver ? "border-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] hover:border-[#C5D5EC] hover:bg-[#F5F7FA]"
            }`}
          >
            <span className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
              <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>upload</span>
            </span>
            <div className="text-[14px] text-[#1A2332] text-center">
              Drop your files here, or <span className="text-[#4A6FA5] underline">click to browse</span>
            </div>
            <div className="text-[12px] text-[#9CA3AF]">SVG, PNG, JPG or GIF (max. 3MB)</div>
          </div>
        ) : (
          <div className="mt-4 border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
            {/* Large preview */}
            <div className="aspect-[4/3] bg-[#F9FAFB] relative flex items-center justify-center">
              {(() => {
                const safeIdx = Math.min(previewIdx, attachments.length - 1);
                const a = attachments[safeIdx];
                if (!a) return null;
                if (a.type === "image" && a.previewUrl) {
                  return <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />;
                }
                return (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <span className="material-icons" style={{ fontSize: "44px", color: a.type === "pdf" ? "#DC2626" : "#6B7280" }}>
                      {a.type === "pdf" ? "picture_as_pdf" : "insert_drive_file"}
                    </span>
                    <div className="text-[12px] text-[#1A2332] truncate w-full" style={{ fontWeight: 500 }}>{a.name}</div>
                  </div>
                );
              })()}
              {attachments.length > 1 && (
                <>
                  <button
                    onClick={() => setPreviewIdx(i => (i - 1 + attachments.length) % attachments.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shadow flex items-center justify-center hover:bg-[#F5F7FA]"
                  >
                    <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>chevron_left</span>
                  </button>
                  <button
                    onClick={() => setPreviewIdx(i => (i + 1) % attachments.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shadow flex items-center justify-center hover:bg-[#F5F7FA]"
                  >
                    <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>chevron_right</span>
                  </button>
                  <span className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded text-[10px] text-white bg-black/60" style={{ fontWeight: 500 }}>
                    {Math.min(previewIdx, attachments.length - 1) + 1}/{attachments.length}
                  </span>
                </>
              )}
            </div>
            {(() => {
              const safeIdx = Math.min(previewIdx, attachments.length - 1);
              const a = attachments[safeIdx];
              if (!a) return null;
              return (
                <div className="flex items-center gap-2 px-3 py-2 border-t border-[#F3F4F6]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[#1A2332] truncate" style={{ fontWeight: 500 }}>{a.name}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{a.size}</div>
                  </div>
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="shrink-0 w-7 h-7 rounded hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] flex items-center justify-center transition-colors"
                    title="Remove"
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                  </button>
                </div>
              );
            })()}
            <button
              onClick={() => attachInputRef.current?.click()}
              className="w-full px-3 py-2 text-[12px] text-[#4A6FA5] hover:bg-[#F5F7FA] border-t border-[#F3F4F6] transition-colors flex items-center justify-center gap-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>add</span>
              Add another
            </button>
          </div>
        )}
      </div>

      {/* Notes card */}
      <div className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Notes</h3>
          <button
            onClick={openAddNote}
            aria-label="Add note"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#546478] hover:bg-[#F5F7FA] transition-colors"
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>add</span>
          </button>
        </div>

        <div className="mt-3 flex flex-col">
          {notes.length === 0 && !addingNote && (
            <div className="text-[13px] text-[#9CA3AF] py-2">No notes yet.</div>
          )}
          {visibleNotes.map(n => (
            <div key={n.id} className="group py-3 border-b border-[#F3F4F6] last:border-0">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-[#9CA3AF]">Added {n.date}</div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button onClick={() => openEditNote(n)} aria-label="Edit note" className="w-6 h-6 rounded flex items-center justify-center text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA]">
                    <span className="material-icons" style={{ fontSize: "15px" }}>edit</span>
                  </button>
                  <button onClick={() => deleteNote(n.id)} aria-label="Delete note" className="w-6 h-6 rounded flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2]">
                    <span className="material-icons" style={{ fontSize: "15px" }}>delete_outline</span>
                  </button>
                </div>
              </div>
              <div className="text-[14px] text-[#1A2332] mt-0.5" style={{ fontWeight: 500 }}>{n.text}</div>
            </div>
          ))}
        </div>

        {notes.length > 4 && (
          <button
            onClick={() => setShowAllNotes(v => !v)}
            className="mt-2 inline-flex items-center justify-center gap-1 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85]"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>{showAllNotes ? "expand_less" : "expand_more"}</span>
            {showAllNotes ? "Show less" : `Show ${notes.length - 4} more`}
          </button>
        )}
      </div>
    </div>
  );

  /* ──────────────────────── Activity tab ──────────────────────── */
  const renderActivity = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
      <ActivityRow
        icon="add_circle" iconBg="#EBF0F8" iconColor="#4A6FA5"
        title="Payment recorded" subtitle={`by ${payment.createdBy}`} time={fmtDateTime(payment.createdAt)}
      />
      {payment.status === "Completed" && (
        <ActivityRow
          icon="check_circle" iconBg="#DCFCE7" iconColor="#22C55E"
          title="Payment completed" subtitle="Invoice balance updated" time={fmtDateTime(payment.createdAt)}
        />
      )}
      {payment.status === "Refunded" && (
        <ActivityRow
          icon="undo" iconBg="#EDE9FE" iconColor="#8B5CF6"
          title={payment.refundAmount != null
            ? `Refunded $${payment.refundAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}${payment.refundAmount < payment.amount ? " (partial)" : ""}`
            : "Payment refunded"}
          subtitle={[payment.refundMethod, payment.refundMemo].filter(Boolean).join(" · ") || "Invoice balance adjusted"}
          time={fmtDateTime(payment.refundDate ? `${payment.refundDate} 00:00` : payment.createdAt)}
        />
      )}
    </div>
  );

  /* ──────────────────────── RENDER ──────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* Page header — back chevron + "Payment details" */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <button
          onClick={() => navigate("/payments")}
          aria-label="Back to Payments"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#1A2332] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 700, lineHeight: "32px" }}>
          Payment details
        </h1>
      </div>

      {/* ── WHITE CARD ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* ── HEADER: title + status + KPI ── */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">

          {/* Left: title + contact row */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">

            {/* Row 1: Payment number + status dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontFamily: "Geist", fontWeight: 600 }}>
                Payment
              </h2>
              <span className="text-[16px] text-[#6B7280] leading-[24px]" style={{ fontWeight: 400 }}>
                ({paymentNumber})
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] focus:outline-none"
                    style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}
                    title="Change status"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ss.text }} />
                    {payment.status}
                    <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[160px] p-1 bg-white border border-[#E5E7EB] rounded-lg"
                  style={{ boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.10), 0px 2px 4px -2px rgba(0,0,0,0.10)" }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <DropdownMenuItem
                      key={s}
                      onSelect={() => changeStatus(s)}
                      className="flex items-center gap-2 rounded-md cursor-pointer text-[14px] text-[#1A2332] focus:bg-[#F5F7FA]"
                      style={{ height: 32, paddingLeft: 8, paddingRight: 8 }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: paymentStatusColors[s].text, opacity: payment.status === s ? 1 : 0.35 }}
                      />
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2: Contact icon row */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <span className="text-[13px] text-[#6B7280] pr-1">Client:</span>
              <button
                onClick={() => navigate(`/clients/${payment.invoiceNumber.split("-")[0]}`)}
                className="flex items-center gap-1.5 pr-2 hover:text-[#4A6FA5] transition-colors"
              >
                <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                  {payment.clientName}
                </span>
              </button>

              <a
                href={`tel:${extras.phone}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F5F7FA] transition-colors"
                title={extras.phone}
              >
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>phone</span>
              </a>
              <a
                href={`mailto:${payment.clientEmail}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F5F7FA] transition-colors"
                title={payment.clientEmail}
              >
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>mail</span>
              </a>

              <div className="w-px h-4 bg-[#E5E7EB] mx-1.5" />
              <div className="flex items-center gap-1 px-1.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>location_on</span>
                <span className="text-[13px] text-[#1A2332]">{extras.address}</span>
              </div>

              {payment.jobId && (
                <>
                  <div className="w-px h-4 bg-[#E5E7EB] mx-1.5" />
                  <button
                    onClick={() => navigate(`/jobs/${payment.jobId?.replace(/^JOB-/, "")}`)}
                    className="flex items-center gap-1 px-1.5 hover:text-[#4A6FA5] transition-colors"
                  >
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>work</span>
                    <span className="text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>{payment.jobId}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: KPI — total price + tinted dollar icon */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <div className="text-[18px] leading-none tabular-nums text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 600 }}>
                {payment.status === "Refunded" ? "−" : ""}${Math.round(payment.amount).toLocaleString("en-US")}
              </div>
              <div className="text-[14px] leading-[20px] text-[#6B7280] mt-1 whitespace-nowrap">Total price</div>
            </div>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: payment.status === "Refunded" ? "rgba(139,92,246,0.15)" : "rgba(22,163,74,0.15)" }}
            >
              <span
                className="material-icons"
                style={{ fontSize: "20px", color: payment.status === "Refunded" ? "#8B5CF6" : "#16A34A" }}
              >
                monetization_on
              </span>
            </div>
          </div>
        </div>

        {/* Divider separating the payment header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        <DetailTabs
          tabs={[
            { key: "details", label: "Details" },
            { key: "activity", label: "Activity" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton />}
          trailing={
            <>
              <button
                onClick={() => navigate(`/payments/new?client=${encodeURIComponent(payment.clientName)}&invoice=${encodeURIComponent(payment.invoiceId || "")}&job=${encodeURIComponent(payment.jobId || "")}`)}
                className="h-9 px-3.5 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>account_balance_wallet</span>
                Collect payment
              </button>
              <KebabMenu
                triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center bg-white"
              >
                {/* No "Make invoice" — invoices are never created from a payment (Jun 11 call). */}
                <KebabItem icon="send" onSelect={() => {
                  const num = `P-${1000 + payment.id}`;
                  const subject = `Receipt ${num} — ${payment.invoiceNumber}`;
                  const body = `Hi ${payment.clientName},\n\nHere is your payment receipt:\n\nReceipt: ${num}\nDate: ${fmtDate(payment.date)}\nMethod: ${payment.method}\nInvoice: ${payment.invoiceNumber}\nAmount: $${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n\nThank you for your business.`;
                  window.location.href = `mailto:${payment.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  toast.success("Opening your email to send the receipt…");
                }}>Send receipt</KebabItem>
                <KebabItem icon="file_download" onSelect={() => {
                  const num = `P-${1000 + payment.id}`;
                  const text = [`RECEIPT ${num}`, ``, `Client:  ${payment.clientName}`, `Date:    ${fmtDate(payment.date)}`, `Method:  ${payment.method}`, `Invoice: ${payment.invoiceNumber}`, `Amount:  $${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, `Status:  ${payment.status}`].join("\n");
                  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
                  const a = document.createElement("a");
                  a.href = url; a.download = `receipt-${num}.txt`;
                  document.body.appendChild(a); a.click(); a.remove();
                  URL.revokeObjectURL(url);
                  toast.success(`Receipt ${num} downloaded`);
                }}>Download receipt</KebabItem>
                <KebabItem icon="account_balance" onSelect={() => setPayoutOpen(true)}>View payout</KebabItem>
                <KebabSeparator />
                {payment.status !== "Refunded" && (
                  <KebabItem icon="undo" onSelect={openRefund}>Refund…</KebabItem>
                )}
              </KebabMenu>
            </>
          }
          className="mt-5"
        />

        {/* ── CONTENT ── */}
        <div className="mt-4">
          {activeTab === "details" ? renderDetails() : renderActivity()}
        </div>
      </div>

      {/* View payout — net amount after the processor fee + payout date,
          provided by the Stripe integration (mocked at 3% here). */}
      {/* Refund modal — memo + manual amount (full/partial) + return method (Marek Jun 11). */}
      {refundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRefundOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[440px] max-w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Issue refund</h3>
              <button onClick={() => setRefundOpen(false)} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="text-[13px] text-[#546478]">
                Original payment: <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> · {payment.method}
              </div>
              <div>
                <label className="block text-[13px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Refund amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8899AA]">$</span>
                  <input
                    type="number" min={0} step="0.01" max={payment.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full h-10 pl-7 pr-3 border border-[#E5E7EB] rounded-lg text-[14px] outline-none focus:border-[#4A6FA5]"
                  />
                </div>
                <p className="mt-1 text-[12px] text-[#8899AA]">Enter manually — full or partial, up to the original amount.</p>
              </div>
              <div>
                <label className="block text-[13px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>How is it returned?</label>
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as typeof refundMethod)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] bg-white outline-none focus:border-[#4A6FA5]">
                  <option value="Original payment method">Refund to original method (through the system)</option>
                  <option value="Cash / manual">Cash / manual (recorded outside the system)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#1A2332] mb-1" style={{ fontWeight: 500 }}>Reason / memo {<span className="text-[#DC2626]">*</span>}</label>
                <textarea
                  value={refundMemo}
                  onChange={(e) => setRefundMemo(e.target.value)}
                  placeholder="Why is this refund being issued?"
                  className="w-full min-h-[72px] resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus:border-[#4A6FA5]"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#E5E7EB] flex justify-end gap-2">
              <button onClick={() => setRefundOpen(false)} className="h-9 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={submitRefund} className="h-9 px-4 rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>Issue refund</button>
            </div>
          </div>
        </div>
      )}

      {payoutOpen && (() => {
        const fee = payment.amount * 0.03;
        const net = payment.amount - fee;
        const payoutDate = (() => {
          const d = new Date(payment.date + "T12:00:00");
          d.setDate(d.getDate() + 2);
          return formatRegionalDate(d);
        })();
        const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPayoutOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[400px] max-w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>Payout · {paymentNumber}</h3>
                <button onClick={() => setPayoutOpen(false)} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                  <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
                </button>
              </div>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Payment amount</span>
                  <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt2(payment.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Processing fee (3%)</span>
                  <span className="text-[#DC2626]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt2(fee)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Payout</span>
                  <span className="text-[18px] text-[#16A34A]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt2(net)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B7280]">Payout date</span>
                  <span className="text-[#1A2332]">{payoutDate}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#9CA3AF]">
                  <span className="material-icons" style={{ fontSize: "13px" }}>info</span>
                  Payout data is provided by the Stripe integration.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / edit note — modal (matches the Change-status / Jobs dialog style) */}
      {addingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cancelNote} />
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[448px] max-w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-[20px] text-[#1A2332]" style={{ fontFamily: "Geist", fontWeight: 600 }}>{editingNoteId ? "Edit note" : "Add note"}</h2>
              <button onClick={cancelNote} aria-label="Close" className="w-6 h-6 rounded flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6]">
                <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
              </button>
            </div>
            <div className="px-4 pb-1">
              <textarea
                value={draftNote}
                onChange={e => setDraftNote(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Add a note…"
                className="w-full border border-[#E5E7EB] rounded-lg p-3 text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] resize-none"
              />
            </div>
            <div className="px-4 py-4 flex items-center justify-end gap-2">
              <button onClick={cancelNote} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] hover:bg-[#F9FAFB] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={saveNote} className="h-9 px-4 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors" style={{ fontWeight: 500 }}>{editingNoteId ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Field ── */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[12px] text-[#546478] mb-1"
        style={{ fontWeight: 600 }}
      >
        {label}
      </div>
      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

/* ── ActivityRow ── */
function ActivityRow({
  icon, iconBg, iconColor, title, subtitle, time,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <span className="material-icons" style={{ fontSize: "16px", color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{title}</div>
          <div className="text-[11px] text-[#B0BEC5] shrink-0 whitespace-nowrap">{time}</div>
        </div>
        <div className="text-[12px] text-[#8899AA]">{subtitle}</div>
      </div>
    </div>
  );
}
