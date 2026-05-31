import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { mockPayments, paymentStatusColors, paymentMethodIcons, type Payment } from "./Payments";

interface PaymentAttachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "pdf" | "file";
  previewUrl?: string;
}

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

type TabKey = "details" | "activity";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  3: { phone: "(407) 555-9988", address: "890 Sunrise Blvd, Orlando, FL 32801", creditCard: "Visa ···· 1234", payoutStatus: "Paid" },
  4: { phone: "(305) 444-7722", address: "780 Coral Way, Miami, FL 33135", creditCard: "", payoutStatus: "Pending" },
  5: { phone: "(407) 555-9988", address: "890 Sunrise Blvd, Orlando, FL 32801", creditCard: "", payoutStatus: "Paid" },
  6: { phone: "(813) 612-5487", address: "4405 North Clark Ave, Tampa, FL 33614", creditCard: "Visa ···· 4242", payoutStatus: "—" },
  7: { phone: "(512) 555-0198", address: "123 Main St, Austin, TX 78701", creditCard: "Visa ···· 4242", payoutStatus: "Paid" },
};

const payoutColors: Record<string, { text: string; bg: string }> = {
  Paid:    { text: "#16A34A", bg: "#DCFCE7" },
  Pending: { text: "#D97706", bg: "#FEF9C3" },
  "—":     { text: "#9CA3AF", bg: "#F3F4F6" },
};

export function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  // Section 6.3 — attachments (proof of payment, photo of check, etc.)
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
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

  const payment: Payment | undefined = mockPayments.find(p => String(p.id) === id);

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

  /* ──────────────────────── Details tab ──────────────────────── */
  const renderDetails = () => (
    <div className="flex gap-10">

      {/* Left: 3-column field grid */}
      <div className="flex-1 grid grid-cols-3 gap-x-10 gap-y-5 content-start">

        {/* Row 1 */}
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

        {/* Row 2 */}
        <Field label="Created By" value={payment.createdBy} />
        <Field
          label="Credit Card"
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
        {payment.jobId ? (
          <Field
            label="Job"
            value={
              <button
                onClick={() => navigate(`/jobs/${payment.jobId?.replace(/^JOB-/, "")}`)}
                className="text-[14px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                {payment.jobId}
              </button>
            }
          />
        ) : (
          <Field label="Job" value={<span className="text-[#9CA3AF]">—</span>} />
        )}

        {/* Row 3: Payout Status in col 3 only */}
        <div />
        <div />
        <Field
          label="Payout Status"
          value={
            <span className="text-[14px]" style={{ fontWeight: 700, color: payoutC.text }}>
              {extras.payoutStatus.toUpperCase()}
            </span>
          }
        />

        {/* Row 4: Note spans all 3 cols */}
        {payment.note && (
          <div className="col-span-3 pt-4 border-t border-[#F3F4F6]">
            <div
              className="text-[11px] uppercase tracking-wider text-[#546478] mb-1.5"
              style={{ fontWeight: 600 }}
            >
              Note
            </div>
            <div className="text-[13px] text-[#374151]">{payment.note}</div>
          </div>
        )}
      </div>

      {/* Right: Attachments (Section 6.3 — proof of payment, photo of check) */}
      <div className="w-[260px] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div
            className="text-[11px] uppercase tracking-wider text-[#546478]"
            style={{ fontWeight: 600 }}
          >
            Attachments {attachments.length > 0 && <span className="text-[#9CA3AF] normal-case tracking-normal" style={{ fontWeight: 500 }}>({attachments.length})</span>}
          </div>
          <button
            onClick={() => attachInputRef.current?.click()}
            className="inline-flex items-center gap-1 h-6 px-1.5 rounded hover:bg-[#F3F4F6] text-[#4A6FA5] transition-colors"
            title="Upload proof of payment"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "14px" }}>upload</span>
            <span className="text-[11px]">Upload</span>
          </button>
        </div>
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
            className={`border-2 border-dashed rounded-xl h-[170px] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              isDragOver ? "border-[#4A6FA5] bg-[#EEF3FA]" : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#C5D5EC] hover:bg-[#F5F7FA]"
            }`}
          >
            <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "28px" }}>cloud_upload</span>
            <div className="text-[12px] text-[#546478] text-center px-3" style={{ fontWeight: 500 }}>Drop a photo of the check<br/>or receipt</div>
            <div className="text-[11px] text-[#9CA3AF]">PNG, JPG, PDF · up to 10 MB</div>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
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
            {/* Filename + size + remove */}
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
            {/* + Add more */}
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
    </div>
  );

  /* ──────────────────────── Activity tab ──────────────────────── */
  const renderActivity = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
      <ActivityRow
        icon="add_circle" iconBg="#EBF0F8" iconColor="#4A6FA5"
        title="Payment recorded" subtitle={`by ${payment.createdBy}`} time={payment.createdAt}
      />
      {payment.status === "Completed" && (
        <ActivityRow
          icon="check_circle" iconBg="#DCFCE7" iconColor="#22C55E"
          title="Payment completed" subtitle="Invoice balance updated" time={payment.createdAt}
        />
      )}
      {payment.status === "Refunded" && (
        <ActivityRow
          icon="undo" iconBg="#EDE9FE" iconColor="#8B5CF6"
          title="Payment refunded" subtitle="Invoice balance adjusted" time={payment.createdAt}
        />
      )}
    </div>
  );

  /* ──────────────────────── RENDER ──────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* Back arrow */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/payments")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Payments
        </button>
      </div>

      {/* ── WHITE CARD ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* ── HEADER: title + status + KPI ── */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">

          {/* Left: title + contact row */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">

            {/* Row 1: Payment number + status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="text-[20px] text-[#1A2332] leading-[27px]"
                style={{ fontFamily: "Geist", fontWeight: 600 }}
              >
                Payment #{paymentNumber}
              </h2>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px]"
                style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ss.text }} />
                {payment.status}
              </span>
            </div>

            {/* Row 2: Contact icon row */}
            <div className="flex items-center gap-0.5 flex-wrap">
              <button
                onClick={() => navigate(`/clients/${payment.clientId || 1}`)}
                className="flex items-center gap-1.5 pr-2 hover:text-[#4A6FA5] transition-colors"
              >
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>person</span>
                <span className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>
                  {payment.clientName}
                </span>
              </button>

              <div className="w-px h-4 bg-[#E5E7EB]" />
              <a
                href={`tel:${extras.phone}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F5F7FA] transition-colors"
                title={extras.phone}
              >
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>phone</span>
              </a>

              <div className="w-px h-4 bg-[#E5E7EB]" />
              <a
                href={`mailto:${payment.clientEmail}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F5F7FA] transition-colors"
                title={payment.clientEmail}
              >
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>mail</span>
              </a>

              <div className="w-px h-4 bg-[#E5E7EB]" />
              <div className="flex items-center gap-1 px-1.5">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>location_on</span>
                <span className="text-[13px] text-[#546478]">{extras.address}</span>
              </div>

              {payment.jobId && (
                <>
                  <div className="w-px h-4 bg-[#E5E7EB]" />
                  <div className="flex items-center gap-1 px-1.5">
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>work</span>
                    <span className="text-[13px] text-[#546478]">{payment.jobId}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Total Price KPI */}
          <div
            className="flex w-[128px] items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 shrink-0"
            style={{ minHeight: 44 }}
          >
            <div className="min-w-0">
              <div
                className="truncate text-[15px] leading-tight tabular-nums"
                style={{ fontWeight: 700, color: payment.status === "Refunded" ? "#8B5CF6" : "#16A34A" }}
              >
                {payment.status === "Refunded" ? "−" : ""}${Math.round(payment.amount).toLocaleString("en-US")}
              </div>
              <div className="truncate text-[10px] text-[#546478]">Total Price</div>
            </div>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: payment.status === "Refunded" ? "#EDE9FE" : "#DCFCE7" }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "16px",
                  color: payment.status === "Refunded" ? "#8B5CF6" : "#16A34A",
                }}
              >
                {payment.status === "Refunded" ? "trending_down" : "trending_up"}
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
                <span className="material-icons" style={{ fontSize: "16px" }}>payments</span>
                Collect Payment
              </button>
              <KebabMenu
                triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center bg-white"
              >
                <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${payment.invoiceId}`)}>
                  Open Invoice
                </KebabItem>
                <KebabItem icon="send">Send Receipt</KebabItem>
                <KebabItem icon="file_download">Download Receipt</KebabItem>
                <KebabItem icon="account_balance">View Payout</KebabItem>
                <KebabSeparator />
                <KebabItem icon="undo" destructive>Refund</KebabItem>
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
    </div>
  );
}

/* ── Field ── */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[11px] uppercase tracking-wider text-[#546478] mb-1"
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
      <div>
        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{title}</div>
        <div className="text-[12px] text-[#8899AA]">{subtitle}</div>
        <div className="text-[11px] text-[#B0BEC5] mt-0.5">{time}</div>
      </div>
    </div>
  );
}
