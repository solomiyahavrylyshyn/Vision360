import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { TabSettingsButton } from "../components/ui/detail-tabs";
import { mockPayments, paymentStatusColors, paymentMethodIcons, type Payment } from "./Payments";

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

      {/* Right: Attachment */}
      <div className="w-[200px] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div
            className="text-[11px] uppercase tracking-wider text-[#546478]"
            style={{ fontWeight: 600 }}
          >
            Attachment
          </div>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#546478] transition-colors">
            <span className="material-icons" style={{ fontSize: "14px" }}>edit</span>
          </button>
        </div>
        <div className="border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] h-[170px]" />
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
        <div className="flex items-start justify-between gap-4 pr-10">

          {/* Left: title + contact row */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">

            {/* Row 1: Payment number + status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-[20px] text-[#1A2332] leading-[27px]"
                style={{ fontFamily: "Geist", fontWeight: 700 }}
              >
                Payment #{paymentNumber}
              </h1>
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
            className="flex w-[152px] items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 shrink-0"
            style={{ backgroundColor: "#F9FBFD" }}
          >
            <div className="min-w-0">
              <div
                className="truncate text-[16px] leading-tight tabular-nums"
                style={{ fontWeight: 700, color: payment.status === "Refunded" ? "#8B5CF6" : "#16A34A" }}
              >
                {payment.status === "Refunded" ? "−" : ""}${Math.round(payment.amount).toLocaleString("en-US")}
              </div>
              <div className="text-[11px] text-[#546478]">Total Price</div>
            </div>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: payment.status === "Refunded" ? "#EDE9FE" : "#DCFCE7" }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "18px",
                  color: payment.status === "Refunded" ? "#8B5CF6" : "#16A34A",
                }}
              >
                {payment.status === "Refunded" ? "trending_down" : "trending_up"}
              </span>
            </div>
          </div>
        </div>

        {/* ── KEBAB (absolute top-right) ── */}
        <div className="absolute right-4 top-4">
          <KebabMenu
            triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center bg-white"
          >
            <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${payment.invoiceId}`)}>
              Open Invoice
            </KebabItem>
            <KebabItem icon="content_copy">Duplicate</KebabItem>
            <KebabSeparator />
            <KebabItem icon="undo" destructive>Refund</KebabItem>
            <KebabSeparator />
            <KebabItem icon="block">Void Payment</KebabItem>
            <KebabItem icon="send">Send Receipt</KebabItem>
            <KebabItem icon="file_download">Download Receipt</KebabItem>
            <KebabItem icon="account_balance">View Payout</KebabItem>
          </KebabMenu>
        </div>

        {/* ── PILL TAB BAR ── */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-0.5">
            {(["details", "activity"] as TabKey[]).map(key => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  activeTab === key
                    ? "bg-[#1A2332] text-white"
                    : "text-[#6B7280] hover:text-[#1A2332] hover:bg-[#F5F7FA]"
                }`}
                style={{ fontWeight: activeTab === key ? 500 : 400 }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
            <TabSettingsButton />
          </div>

          {/* Collect Payment */}
          <button
            className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] text-white bg-[#4A6FA5] rounded-lg hover:bg-[#3d5a85] transition-colors"
            style={{ fontWeight: 600 }}
          >
            <span className="w-2 h-2 rounded-full bg-white opacity-80" />
            Collect Payment
          </button>
        </div>

        {/* divider */}
        <div className="h-px bg-[#E5E7EB] mt-3 mb-4" />

        {/* ── CONTENT ── */}
        <div>
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
