import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus =
  | "Unpaid"
  | "Unpaid - Overdue"
  | "Unpaid - Not Due"
  | "Paid"
  | "Paid - Deposited"
  | "Paid - Not Deposited"
  | "Void";

type InvoiceType = "Standard" | "Recurring" | "Progress" | "Final" | "Credit Memo";

interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
  checkNumber?: string;
  note: string;
}

interface ActivityEntry {
  id: number;
  date: string;
  action: string;
  detail: string;
  icon: string;
}

const statusColors: Record<InvoiceStatus, { text: string; bg: string }> = {
  "Unpaid":               { text: "#546478", bg: "#F3F4F6" },
  "Unpaid - Not Due":     { text: "#3B82F6", bg: "#DBEAFE" },
  "Unpaid - Overdue":     { text: "#EF4444", bg: "#FEE2E2" },
  "Paid":                 { text: "#22C55E", bg: "#DCFCE7" },
  "Paid - Deposited":     { text: "#15803D", bg: "#DCFCE7" },
  "Paid - Not Deposited": { text: "#F59E0B", bg: "#FEF3C7" },
  "Void":                 { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = [
  "Unpaid",
  "Unpaid - Not Due",
  "Unpaid - Overdue",
  "Paid",
  "Paid - Deposited",
  "Paid - Not Deposited",
  "Void",
];

const paymentMethods = ["Cash", "Check", "Credit Card", "Debit Card", "Bank Transfer", "Other"];

const TODAY = "2026-04-27";
function daysBetween(a: string, b: string) {
  const da = new Date(a + "T12:00:00").getTime();
  const db = new Date(b + "T12:00:00").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

// ─── Mock Invoice Data ───────────────────────────────────────────────────────
const mockInvoices: Record<string, any> = {
  "1": {
    number: "10245-I01",
    type: "Standard" as InvoiceType,
    status: "Paid - Deposited" as InvoiceStatus,
    date: "2026-03-02",
    dueDate: "2026-04-01",
    dateSent: "2026-03-02",
    dateCreated: "2026-03-02",
    createdBy: "Marek Stroz",
    stage: "Closed",
    department: "Field Service",
    toBePrinted: false,

    client: { name: "Travis Jones", email: "travis.j@email.com", phone: "(512) 555-0142" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "123 Main St", city: "Austin", county: "Travis", state: "TX", zip: "78701" },
    serviceAddress: { line: "123 Main St", city: "Austin", county: "Travis", state: "TX", zip: "78701" },

    jobNumber: "10245",
    jobName: "Kitchen Renovation",
    linkedEstimate: "EST-001",
    estimateStatus: "Approved",
    poNumber: "PO-77821",
    memo: "Final billing for kitchen reno",

    leadSource: "Referral",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 30",
    paymentMethod: "Check",
    checkNumber: "4582",

    customField1: "",
    customField2: "",
    noteToCustomer: "Thank you for your business!",

    items: [
      { name: "Heat Pump Repair or Service", description: "Heat pump diagnostic, repair and service", qty: 1, unitPrice: 285, taxable: false },
      { name: "SEER Heat Pump Condenser Unit", description: "SEER Heat Pump Condenser — high efficiency outdoor unit", qty: 2, unitPrice: 3200, taxable: true },
      { name: "Copper Piping Installation", description: "Professional copper piping installation (per ft)", qty: 40, unitPrice: 18.50, taxable: true },
      { name: "General Labor - Technician", description: "Technician labor (hourly)", qty: 16, unitPrice: 95, taxable: false },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [
      { id: 1, date: "2026-03-10", amount: 5000, method: "Bank Transfer", note: "First installment" },
      { id: 2, date: "2026-03-25", amount: 5502, method: "Check", checkNumber: "4582", note: "Final payment" },
    ],
    activity: [
      { id: 1, date: "2026-03-02 09:15", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-02 09:30", action: "Invoice sent", detail: "Sent to travis.j@email.com", icon: "send" },
      { id: 3, date: "2026-03-10 14:22", action: "Payment recorded", detail: "$5,000.00 via Bank Transfer", icon: "payments" },
      { id: 4, date: "2026-03-25 11:45", action: "Payment recorded", detail: "$5,502.00 via Check", icon: "payments" },
      { id: 5, date: "2026-03-25 11:45", action: "Status changed", detail: "Marked as Paid - Deposited", icon: "check_circle" },
    ],
  },
  "2": {
    number: "10246-I01",
    type: "Standard" as InvoiceType,
    status: "Unpaid - Overdue" as InvoiceStatus,
    date: "2026-03-02",
    dueDate: "2026-03-17",
    dateSent: "2026-03-02",
    dateCreated: "2026-03-02",
    createdBy: "Marek Stroz",
    stage: "Awaiting Payment",
    department: "Field Service",
    toBePrinted: true,

    client: { name: "John Doe", email: "john.d@email.com", phone: "(214) 555-0188" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },
    serviceAddress: { line: "789 Oak Ave", city: "Dallas", county: "Dallas", state: "TX", zip: "75201" },

    jobNumber: "10246",
    jobName: "Bathroom Remodel",
    linkedEstimate: "",
    estimateStatus: "Approved",
    poNumber: "",
    memo: "Client requested extended payment terms",

    leadSource: "Google Ads",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 15",
    paymentMethod: "",
    checkNumber: "",

    customField1: "",
    customField2: "",
    noteToCustomer: "Please remit payment promptly.",

    items: [
      { name: "SEER Heat Pump Condenser Premium", description: "SEER Premium Heat Pump Condenser — ultra high efficiency", qty: 1, unitPrice: 4800, taxable: true },
      { name: "General Labor - Technician", description: "Technician labor (hourly)", qty: 12, unitPrice: 95, taxable: false },
    ],
    taxRate: 7.5,
    notes: "Client requested extended payment terms",
    terms: "Payment is due within 15 days of invoice date.",
    payments: [],
    activity: [
      { id: 1, date: "2026-03-02 10:00", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-02 10:05", action: "Invoice sent", detail: "Sent to john.d@email.com", icon: "send" },
      { id: 3, date: "2026-03-18 00:00", action: "Status changed", detail: "Automatically marked Unpaid - Overdue", icon: "warning" },
    ],
  },
  "4": {
    number: "10248-I02",
    type: "Progress" as InvoiceType,
    status: "Paid - Not Deposited" as InvoiceStatus,
    date: "2026-02-28",
    dueDate: "2026-03-30",
    dateSent: "2026-03-01",
    dateCreated: "2026-02-28",
    createdBy: "Marek Stroz",
    stage: "Awaiting Deposit",
    department: "Field Service",
    toBePrinted: false,

    client: { name: "Sarah Williams", email: "sarah.w@email.com", phone: "(713) 555-0301" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },

    billingAddress: { line: "321 Elm St", city: "Houston", county: "Harris", state: "TX", zip: "77001" },
    serviceAddress: { line: "321 Elm St", city: "Houston", county: "Harris", state: "TX", zip: "77001" },

    jobNumber: "10248",
    jobName: "Electrical Work",
    linkedEstimate: "EST-005",
    estimateStatus: "Approved",
    poNumber: "PO-66104",
    memo: "Progress invoice — phase 1",

    leadSource: "Yelp",
    salesRep: "Marek Stroz",

    paymentTerms: "Net 30",
    paymentMethod: "Check",
    checkNumber: "9912",

    customField1: "",
    customField2: "",
    noteToCustomer: "Phase 2 invoice to follow.",

    items: [
      { name: "Electrical Panel Upgrade 200A", description: "200A electrical panel upgrade — parts and labor", qty: 1, unitPrice: 2200, taxable: true },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [
      { id: 1, date: "2026-03-15", amount: 1000, method: "Check", checkNumber: "9912", note: "Partial payment" },
    ],
    activity: [
      { id: 1, date: "2026-02-28 15:00", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-01 09:00", action: "Invoice sent", detail: "Sent to sarah.w@email.com", icon: "send" },
      { id: 3, date: "2026-03-15 13:30", action: "Payment recorded", detail: "$1,000.00 via Check #9912", icon: "payments" },
      { id: 4, date: "2026-03-15 13:30", action: "Status changed", detail: "Marked as Paid - Not Deposited", icon: "info" },
    ],
  },
};

// ─── Shared UI helpers (mirror ItemDetail) ───────────────────────────────────
function Field({ label, value, link, accent }: { label: string; value?: React.ReactNode; link?: string; accent?: string }) {
  const empty = value === null || value === undefined || value === "" || value === false;
  const display = empty
    ? <span className="text-[#9CA3AF]">—</span>
    : link
      ? <a href={link} className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>{value}</a>
      : value;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] text-[#9CA3AF] leading-[16px]">{label}</div>
      <div className="text-[13px] leading-[20px]" style={accent ? { color: accent, fontWeight: 500 } : { color: "#374151" }}>{display}</div>
    </div>
  );
}

function Card({ title, children, onEdit, action }: { title: string; children: React.ReactNode; onEdit?: () => void; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</h3>
        <div className="flex items-center gap-2">
          {action}
          {onEdit && (
            <button onClick={onEdit} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

type TabKey = "details" | "activity";
type NotesTabKey = "customer" | "internal";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "activity", label: "Activity" },
];

// ═══════════════════════════════════════════════════════════════════════════════
export function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = mockInvoices[id || "1"] || mockInvoices["1"];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [status, setStatus] = useState<InvoiceStatus>(data.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>(data.payments);
  const [activity, setActivity] = useState<ActivityEntry[]>(data.activity);

  // Record payment modal
  const [notesTab, setNotesTab] = useState<NotesTabKey>("customer");

  // Record payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(TODAY);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payCheckNumber, setPayCheckNumber] = useState("");
  const [payNote, setPayNote] = useState("");

  // Void confirm
  const [voidConfirm, setVoidConfirm] = useState(false);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Calculations
  const subtotal = data.items.reduce((s: number, i: any) => s + i.qty * i.unitPrice, 0);
  const taxableAmount = data.items.filter((i: any) => i.taxable).reduce((s: number, i: any) => s + i.qty * i.unitPrice, 0);
  const taxAmount = taxableAmount * (data.taxRate / 100);
  const total = subtotal + taxAmount;
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const balance = total - totalPayments;
  const overdueDays = status === "Unpaid - Overdue" ? daysBetween(data.dueDate, TODAY) : 0;
  const isPaid = status === "Paid" || status === "Paid - Deposited" || status === "Paid - Not Deposited";

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    if (newStatus === "Void") {
      setVoidConfirm(true);
      setStatusDropdownOpen(false);
      return;
    }
    setStatus(newStatus);
    setStatusDropdownOpen(false);
    setActivity(prev => [{
      id: prev.length + 1,
      date: TODAY + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      action: "Status changed",
      detail: `Manually set to ${newStatus}`,
      icon: "edit",
    }, ...prev]);
  };

  const confirmVoid = () => {
    setStatus("Void");
    setVoidConfirm(false);
    setActivity(prev => [{
      id: prev.length + 1,
      date: TODAY + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      action: "Invoice voided",
      detail: "Invoice marked as Void",
      icon: "block",
    }, ...prev]);
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;

    const newPayment: Payment = {
      id: payments.length + 1,
      date: payDate,
      amount,
      method: payMethod,
      checkNumber: payMethod === "Check" ? payCheckNumber : undefined,
      note: payNote,
    };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);

    const newTotalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
    const newBalance = total - newTotalPaid;
    const newStatus: InvoiceStatus = newBalance <= 0 ? "Paid - Not Deposited" : "Unpaid";
    setStatus(newStatus);

    const detail = payMethod === "Check" && payCheckNumber
      ? `$${fmt(amount)} via Check #${payCheckNumber}`
      : `$${fmt(amount)} via ${payMethod}`;
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    setActivity(prev => [
      {
        id: prev.length + 2,
        date: `${payDate} ${time}`,
        action: "Status changed",
        detail: `Marked as ${newStatus}`,
        icon: newStatus.startsWith("Paid") ? "check_circle" : "info",
      },
      {
        id: prev.length + 1,
        date: `${payDate} ${time}`,
        action: "Payment recorded",
        detail,
        icon: "payments",
      },
      ...prev,
    ]);

    setPaymentModalOpen(false);
    setPayAmount("");
    setPayCheckNumber("");
    setPayNote("");
  };

  const renderDetailsTab = () => (
    <div className="flex gap-4 items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Row 1: Bill To + Service Address */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Bill To" onEdit={() => {}}>
            <div className="flex flex-col gap-3">
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{data.client.name}</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Customer Email" value={data.client.email} />
                <Field label="Phone" value={data.client.phone} />
              </div>
              <div className="pt-1">
                <div className="text-[11px] text-[#9CA3AF] leading-[16px] mb-1">Billing Address</div>
                <div className="text-[13px] text-[#374151] leading-[20px]">
                  {data.billingAddress.line}<br />
                  {data.billingAddress.city}, {data.billingAddress.state} {data.billingAddress.zip}
                  {data.billingAddress.county && <span className="text-[#9CA3AF]"> · {data.billingAddress.county} County</span>}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Service Address" onEdit={() => {}}>
            <div className="flex flex-col gap-3">
              <div className="text-[13px] text-[#374151] leading-[20px]">
                {data.serviceAddress.line}<br />
                {data.serviceAddress.city}, {data.serviceAddress.state} {data.serviceAddress.zip}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="County" value={data.serviceAddress.county} />
                <Field label="State" value={data.serviceAddress.state} />
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2: Invoice Details */}
        <Card title="Invoice Details" onEdit={() => {}}>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <Field label="Invoice #" value={data.number} />
            <Field label="Type" value={data.type} />
            <Field label="Date" value={fmtDate(data.date)} />
            <Field label="Due Date" value={fmtDate(data.dueDate)} accent={overdueDays > 0 ? "#DC2626" : undefined} />
            <Field label="Date Sent" value={fmtDate(data.dateSent)} />
            <Field label="Date Created" value={fmtDate(data.dateCreated)} />
            <Field label="Created By" value={data.createdBy} />
            <Field label="Stage" value={data.stage} />
            <Field label="Department" value={data.department} />
            <Field label="To Be Printed" value={data.toBePrinted ? "Yes" : "No"} />
            <Field label="PO #" value={data.poNumber} />
            <Field label="Memo" value={data.memo} />
          </div>
        </Card>

        {/* Row 3: Job & References + Sales & Payment */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Job & References" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field
                label="Job Number"
                value={data.jobNumber ? `${data.jobNumber}: ${data.jobName}` : null}
                link={data.jobNumber ? `/jobs/${data.jobNumber}` : undefined}
              />
              <Field label="Job Name" value={data.jobName} />
              <Field
                label="Linked Estimate #"
                value={data.linkedEstimate}
                link={data.linkedEstimate ? `/estimates/${data.linkedEstimate.replace("EST-", "")}` : undefined}
              />
              <Field label="Estimate Status" value={data.estimateStatus} />
            </div>
          </Card>

          <Card title="Sales & Payment" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Lead Source" value={data.leadSource} />
              <Field label="Sales Rep" value={data.salesRep} />
              <Field label="Payment Terms" value={data.paymentTerms} />
              <Field label="Payment Method" value={data.paymentMethod} />
              <Field label="Check #" value={data.checkNumber} />
            </div>
          </Card>
        </div>

        {/* Row 4: Custom Fields (only if any) */}
        {(data.customField1 || data.customField2) && (
          <Card title="Custom Fields" onEdit={() => {}}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Custom Field 1" value={data.customField1} />
              <Field label="Custom Field 2" value={data.customField2} />
            </div>
          </Card>
        )}

        {/* Row 5: Line Items + Totals */}
        <Card title="Line Items">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {["Item", "Qty", "Unit Price", "Amount"].map(h => (
                  <th key={h} className={`pb-2.5 text-[11px] uppercase tracking-wider text-[#9CA3AF] ${h === "Item" ? "text-left" : "text-right"}`} style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#F3F4F6] last:border-b-0">
                  <td className="py-3">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                    <div className="text-[12px] text-[#9CA3AF]">{item.description}</div>
                    {item.taxable && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#16A34A] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>}
                  </td>
                  <td className="py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{item.qty}</td>
                  <td className="py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                  <td className="py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.qty * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-[320px]">
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-[#6B7280]">Subtotal</span>
                <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-[#6B7280]">Taxable amount</span>
                <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px] border-b border-[#E5E7EB]">
                <span className="text-[#6B7280]">Tax ({data.taxRate}%)</span>
                <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-[14px]">
                <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
              </div>
              {totalPayments > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] border-b border-[#E5E7EB]">
                  <span className="text-[#16A34A]">Payments received</span>
                  <span className="text-[#16A34A]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt(totalPayments)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5">
                <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Balance Due</span>
                <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  ${fmt(Math.max(0, balance))}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Row 6: Payments */}
        <Card
          title={`Payments (${payments.length})`}
          action={
            !isPaid && status !== "Void" ? (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] bg-[#4A6FA5] text-white hover:bg-[#3d5a85]"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "14px" }}>add</span>
                Record
              </button>
            ) : null
          }
        >
          {payments.length === 0 ? (
            <div className="py-6 text-center">
              <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "32px" }}>account_balance_wallet</span>
              <div className="text-[13px] text-[#9CA3AF] mt-1">No payments recorded</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {["Date", "Method", "Check #", "Note", "Amount"].map(h => (
                    <th key={h} className={`pb-2.5 text-[11px] uppercase tracking-wider text-[#9CA3AF] ${h === "Amount" ? "text-right" : "text-left"}`} style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-[#F3F4F6] last:border-b-0">
                    <td className="py-3 text-[13px] text-[#374151]">{fmtDate(p.date)}</td>
                    <td className="py-3"><span className="text-[12px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#374151]" style={{ fontWeight: 500 }}>{p.method}</span></td>
                    <td className="py-3 text-[13px] text-[#374151]">{p.checkNumber || <span className="text-[#9CA3AF]">—</span>}</td>
                    <td className="py-3 text-[13px] text-[#9CA3AF]">{p.note || "—"}</td>
                    <td className="py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(p.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="pt-3 text-[13px] text-[#374151] text-right" style={{ fontWeight: 500 }}>Total paid</td>
                  <td className="pt-3 text-[14px] text-[#16A34A] text-right" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(totalPayments)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── Notes rail (right) ── */}
      <div className="w-[260px] shrink-0 flex flex-col gap-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex border-b border-[#E5E7EB]">
          {([
            { key: "customer" as NotesTabKey, label: "Note to Client" },
            { key: "internal" as NotesTabKey, label: "Internal" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setNotesTab(key)}
              className={`flex-1 py-2.5 text-[11px] transition-colors ${
                notesTab === key ? "text-[#4A6FA5] border-b-2 border-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: notesTab === key ? 600 : 500 }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col gap-2">
          {notesTab === "customer" && (
            <>
              {data.noteToCustomer ? (
                <div className="p-2.5 bg-[#F9FAFB] rounded-md">
                  <div className="text-[12px] text-[#1A2332] leading-[18px]">{data.noteToCustomer}</div>
                </div>
              ) : (
                <div className="text-[12px] text-[#9CA3AF] text-center py-6">No note yet</div>
              )}
              <button className="mt-auto flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "14px" }}>{data.noteToCustomer ? "edit" : "add"}</span>
                {data.noteToCustomer ? "Edit note" : "Add note"}
              </button>
            </>
          )}
          {notesTab === "internal" && (
            <>
              {data.notes ? (
                <div className="p-2.5 bg-[#F9FAFB] rounded-md">
                  <div className="text-[12px] text-[#1A2332] leading-[18px]">{data.notes}</div>
                </div>
              ) : (
                <div className="text-[12px] text-[#9CA3AF] text-center py-6">No notes yet</div>
              )}
              <button className="mt-auto flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "14px" }}>add</span>
                Add note
              </button>
            </>
          )}
        </div>
      </div>

      {/* Terms & Conditions card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Terms & Conditions</h3>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {data.terms ? (
            <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[12px] text-[#6B7280] leading-[18px]">{data.terms}</div>
          ) : (
            <div className="text-[12px] text-[#9CA3AF] text-center py-6">No terms set</div>
          )}
          <button className="mt-1 flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>{data.terms ? "edit" : "add"}</span>
            {data.terms ? "Edit terms" : "Add terms"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <h3 className="text-[14px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Activity Log</h3>
      <div className="px-1">
        {activity.map((entry, idx) => (
          <div key={entry.id} className="flex gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>{entry.icon}</span>
              </div>
              {idx < activity.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] mt-1" />}
            </div>
            <div className="pb-4">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{entry.action}</div>
              <div className="text-[12px] text-[#6B7280]">{entry.detail}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{entry.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Back arrow + Actions */}
        <div className="px-8 h-12 flex items-center justify-between border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/invoices")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Invoices
          </button>
          <div className="flex items-center gap-2">
            <button className="border border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5 rounded-md flex items-center justify-center" title="Edit">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <KebabMenu triggerClassName="h-8 w-8 border border-[#DDE3EE] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
              <KebabItem icon="picture_as_pdf">Download PDF</KebabItem>
              <KebabItem icon="send">Send to Customer</KebabItem>
              {!isPaid && status !== "Void" && (
                <KebabItem icon="payments" onClick={() => setPaymentModalOpen(true)}>Record Payment</KebabItem>
              )}
              <KebabSeparator />
              <KebabItem icon="content_copy">Duplicate Invoice</KebabItem>
              <KebabItem icon="block" destructive onClick={() => setVoidConfirm(true)}>Void Invoice</KebabItem>
            </KebabMenu>
          </div>
        </div>

        {/* Summary content */}
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-start gap-10">
            {/* Left: Identity + status */}
            <div className="flex flex-col gap-4 min-w-[270px]">
              <div className="flex items-baseline gap-2">
                <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
                  {data.number}
                </h1>
                <span className="text-[13px] text-[#9CA3AF]">{data.type}</span>
              </div>

              {/* Client */}
              <div className="flex items-start gap-1.5">
                <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "14px" }}>person</span>
                <div className="text-[13px] text-[#374151] leading-[19px]">
                  {data.client.name}
                  <br />
                  <span className="text-[#6B7280]">{data.client.email}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer"
                    style={{ fontWeight: 600, backgroundColor: statusColors[status].bg, color: statusColors[status].text }}
                  >
                    {status}
                    <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[200px] py-1">
                      {allStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F4F6] flex items-center gap-2 ${s === status ? "bg-[#F3F4F6]" : ""}`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s].text }} />
                          <span style={{ color: statusColors[s].text, fontWeight: 500 }}>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {overdueDays > 0 && (
                  <span className="text-[12px] text-[#DC2626]" style={{ fontWeight: 500 }}>Past due {overdueDays} days</span>
                )}
              </div>
            </div>

            {/* Middle: Job + Dates */}
            <div className="grid grid-cols-3 gap-6 flex-1 border-l border-[#E5E7EB] pl-10">
              <div className="flex flex-col gap-4">
                <Field
                  label="Job"
                  value={data.jobNumber ? `${data.jobNumber}: ${data.jobName}` : null}
                  link={data.jobNumber ? `/jobs/${data.jobNumber}` : undefined}
                />
                <Field label="Sales Rep" value={data.salesRep} />
              </div>
              <div className="flex flex-col gap-4">
                <Field label="Invoice Date" value={fmtDate(data.date)} />
                <Field label="Due Date" value={fmtDate(data.dueDate)} accent={overdueDays > 0 ? "#DC2626" : undefined} />
              </div>
              <div className="flex flex-col gap-4">
                <Field label="Date Sent" value={fmtDate(data.dateSent)} />
                <Field label="Payment Terms" value={data.paymentTerms} />
              </div>
            </div>

            {/* Right: Financial summary */}
            <div className="border-l border-[#E5E7EB] pl-8" style={{ width: "280px" }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-[255px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Total</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    ${fmt(total)}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Balance Due</div>
                  <div className="text-[18px] leading-[28px]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: balance > 0 ? "#DC2626" : "#16A34A" }}>
                    ${fmt(Math.max(0, balance))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Paid</div>
                  <div className="text-[18px] text-[#16A34A] leading-[28px]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    ${fmt(totalPayments)}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">PO #</div>
                  <div className="text-[14px] text-[#374151] leading-[28px]" style={{ fontWeight: 500 }}>
                    {data.poNumber || <span className="text-[#9CA3AF]">—</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white sticky top-0 z-30 border-b border-[#E5E7EB]">
        <div className="flex items-center px-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap ${
                activeTab === key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: 500 }}
            >
              {label}
              {activeTab === key && (
                <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 bg-[#F5F7FA]">
        {activeTab === "details" ? renderDetailsTab() : renderActivityTab()}
      </main>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPaymentModalOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Record Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "22px" }}>close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-[#EBF0F8] rounded-lg p-4 flex items-center justify-between">
                <span className="text-[13px] text-[#6B7280]">Balance due</span>
                <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(Math.max(0, balance))}</span>
              </div>

              <div>
                <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-[14px]">$</span>
                  <input
                    type="number" min="0" step="0.01" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={fmt(Math.max(0, balance))}
                    className="w-full h-11 pl-7 pr-4 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Date</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5] bg-white">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {payMethod === "Check" && (
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Check #</label>
                  <input type="text" value={payCheckNumber} onChange={(e) => setPayCheckNumber(e.target.value)}
                    placeholder="e.g. 4582"
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              )}

              <div>
                <label className="block text-[12px] uppercase tracking-wider text-[#6B7280] mb-1.5" style={{ fontWeight: 600 }}>Note (optional)</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFBFC] flex items-center justify-end gap-3">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] hover:bg-[#F3F4F6]" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                className="px-5 py-2.5 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] disabled:opacity-40"
                style={{ fontWeight: 600 }}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirm */}
      {voidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setVoidConfirm(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <span className="material-icons text-[#DC2626]" style={{ fontSize: "22px" }}>block</span>
              </div>
              <h3 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Void Invoice?</h3>
            </div>
            <p className="text-[14px] text-[#6B7280] mb-6">
              This will mark the invoice as void. It will no longer be counted in reports or balances. This action cannot be easily reversed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setVoidConfirm(false)} className="px-4 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[13px] hover:bg-[#F3F4F6]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmVoid} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Void Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
