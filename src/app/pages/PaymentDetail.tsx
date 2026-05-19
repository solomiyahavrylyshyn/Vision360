import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs } from "../components/ui/detail-tabs";
import { mockPayments, paymentStatusColors, paymentMethodIcons, type Payment } from "./Payments";

type TabKey = "details" | "activity";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "activity", label: "Activity" },
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  const renderDetails = () => (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
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
          <Field label="Client" value={
            <>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{payment.clientName}</div>
              <div className="text-[12px] text-[#8899AA]">{payment.clientEmail}</div>
            </>
          } />
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
          {payment.jobId && (
            <Field
              label="Job"
              value={
                <button
                  onClick={() => navigate(`/jobs/${payment.jobId?.replace("JOB-", "")}`)}
                  className="text-[14px] text-[#4A6FA5] hover:underline"
                  style={{ fontWeight: 500 }}
                >
                  {payment.jobId}
                </button>
              }
            />
          )}
          <Field label="Created by" value={payment.createdBy} />
        </div>
        {payment.note && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Note</div>
            <div className="text-[13px] text-[#374151] bg-[#F9FAFB] border border-[#EDF0F5] rounded-lg px-3 py-2">{payment.note}</div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center">
        <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>Amount</div>
        <div
          className={`text-[32px] leading-none ${payment.status === "Refunded" ? "text-[#8B5CF6]" : "text-[#1A2332]"}`}
          style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {payment.status === "Refunded" ? "−" : ""}${fmt(payment.amount)}
        </div>
        <span
          className="inline-block mt-3 px-3 py-1 rounded-full text-[12px]"
          style={{ fontWeight: 600, color: ss.text, backgroundColor: ss.bg }}
        >
          {payment.status}
        </span>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
      <ActivityRow icon="add_circle" iconBg="#EBF0F8" iconColor="#4A6FA5"
        title="Payment recorded" subtitle={`by ${payment.createdBy}`} time={payment.createdAt} />
      {payment.status === "Completed" && (
        <ActivityRow icon="check_circle" iconBg="#DCFCE7" iconColor="#22C55E"
          title="Payment completed" subtitle="Invoice balance updated" time={payment.createdAt} />
      )}
      {payment.status === "Refunded" && (
        <ActivityRow icon="undo" iconBg="#EDE9FE" iconColor="#8B5CF6"
          title="Payment refunded" subtitle="Invoice balance adjusted" time={payment.createdAt} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header / summary bar */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="px-8 h-12 flex items-center justify-between border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/payments")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Payments
          </button>
          <KebabMenu triggerClassName="h-8 w-8 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
            <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${payment.invoiceId}`)}>Open Invoice</KebabItem>
            <KebabItem icon="content_copy">Duplicate</KebabItem>
            <KebabSeparator />
            <KebabItem icon="block" destructive>Refund</KebabItem>
          </KebabMenu>
        </div>
        <div className="px-8 py-5 flex items-baseline gap-3">
          <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
            Payment #{payment.id}
          </h1>
          <span className="text-[13px] text-[#9CA3AF]">{fmtDate(payment.date)} · {payment.clientName}</span>
        </div>
      </div>

      {/* Unified tab bar */}
      <div className="bg-white px-6 py-3">
        <DetailTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 bg-[#F5F7FA]">
        {activeTab === "details" ? renderDetails() : renderActivity()}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>{label}</div>
      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ActivityRow({ icon, iconBg, iconColor, title, subtitle, time }:
  { icon: string; iconBg: string; iconColor: string; title: string; subtitle: string; time: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
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
