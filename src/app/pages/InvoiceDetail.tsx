import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { PlusIcon } from "../components/ui/plus-icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus =
  | "Unpaid"
  | "Overdue"
  | "Paid"
  | "Partially Paid"
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
  "Unpaid":         { text: "#DC2626", bg: "#FEE2E2" },
  "Overdue": { text: "#EF4444", bg: "#FEE2E2" },
  "Paid":           { text: "#16A34A", bg: "#DCFCE7" },
  "Partially Paid": { text: "#D97706", bg: "#FEF3C7" },
  "Void":           { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = [
  "Unpaid",
  "Overdue",
  "Paid",
  "Partially Paid",
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
    status: "Paid" as InvoiceStatus,
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

    jobNumber: "10245-J01",
    jobName: "Kitchen Renovation",
    linkedEstimate: "10245-E01",
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
      { id: 5, date: "2026-03-25 11:45", action: "Status changed", detail: "Marked as Paid", icon: "check_circle" },
    ],
  },
  "2": {
    number: "10246-I01",
    type: "Standard" as InvoiceType,
    status: "Overdue" as InvoiceStatus,
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

    jobNumber: "10246-J01",
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
      { id: 3, date: "2026-03-18 00:00", action: "Status changed", detail: "Automatically marked Overdue", icon: "warning" },
    ],
  },
  "4": {
    number: "10248-I02",
    type: "Progress" as InvoiceType,
    status: "Partially Paid" as InvoiceStatus,
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

    jobNumber: "10248-J01",
    jobName: "Electrical Work",
    linkedEstimate: "10248-E01",
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
      { id: 4, date: "2026-03-15 13:30", action: "Status changed", detail: "Marked as Partially Paid", icon: "info" },
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

type TabKey = "details" | "payments" | "activity";
type NotesTabKey = "customer" | "internal";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "payments", label: "Payments" },
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

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
  const overdueDays = status === "Overdue" ? daysBetween(data.dueDate, TODAY) : 0;
  const isPaid = status === "Paid";

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
    const newStatus: InvoiceStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
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
        icon: newStatus === "Paid" ? "check_circle" : "info",
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

  const renderPaymentsTab = () => (
    <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <Card
          title={`Payments (${payments.length})`}
          action={
            !isPaid && status !== "Void" ? (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] bg-[#4A6FA5] text-white hover:bg-[#3d5a85]"
                style={{ fontWeight: 500 }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Record
              </button>
            ) : null
          }
        >
          {/* Payment terms strip */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-3 pb-4 mb-4 border-b border-[#F3F4F6]">
            <Field label="Payment Terms" value={data.paymentTerms} />
            <Field label="Payment Method" value={data.paymentMethod} />
            <Field label="Check #" value={data.checkNumber} />
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#D1D5DB] text-[#4A6FA5] focus:ring-[#4A6FA5]" />
                Accept partial payments
              </label>
            </div>
          </div>

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
                <tr>
                  <td colSpan={4} className="pt-1 text-[13px] text-[#374151] text-right" style={{ fontWeight: 500 }}>Balance remaining</td>
                  <td className="pt-1 text-[14px] text-right" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: balance > 0 ? "#DC2626" : "#16A34A" }}>
                    ${fmt(Math.max(0, balance))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="pt-1 text-[12px] text-[#6B7280] text-right">Invoice total</td>
                  <td className="pt-1 text-[12px] text-[#6B7280] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="flex flex-col lg:flex-row gap-4 items-start">

      {/* ── Left/main: Items list with totals ── */}
      <div className="flex-1 min-w-0 w-full bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Items list</h3>
          <button
            onClick={() => {}}
            className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md inline-flex items-center justify-center transition-colors"
            style={{ fontWeight: 600 }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Item</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[80px]" style={{ fontWeight: 600 }}>Qty</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[120px]" style={{ fontWeight: 600 }}>Unit Price</th>
                <th className="px-3 py-2.5 text-right text-[11px] uppercase tracking-wider text-[#9CA3AF] w-[120px]" style={{ fontWeight: 600 }}>Amount</th>
                <th className="px-3 py-2.5 w-[48px]" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#FAFBFC]">
                  <td className="px-5 py-3">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                    <div className="text-[12px] text-[#9CA3AF] mt-0.5">{item.description}</div>
                    {item.taxable && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#16A34A] mt-1 inline-block" style={{ fontWeight: 600 }}>
                        Taxable
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{item.qty}</td>
                  <td className="px-3 py-3 text-[13px] text-[#374151] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(item.qty * item.unitPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    <button className="w-7 h-7 rounded text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center transition-colors" title="Remove item">
                      <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4 flex justify-end">
          <div className="w-full max-w-[360px]">
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Taxable amount</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13px]">
              <span className="text-[#6B7280]">Tax ({data.taxRate}%)</span>
              <span className="text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
            </div>
            <div className="flex justify-between py-2 mt-1 border-t border-[#E5E7EB] text-[14px]">
              <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
              <span className="text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
            </div>
            {totalPayments > 0 && (
              <div className="flex justify-between py-1 text-[13px]">
                <span className="text-[#16A34A]">Payments received</span>
                <span className="text-[#16A34A]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt(totalPayments)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-[#E5E7EB]">
              <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Balance Due</span>
              <span className="text-[20px]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: balance > 0 ? "#DC2626" : "#16A34A" }}>
                ${fmt(Math.max(0, balance))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right side: Job Details + Notes (side by side) ── */}
      {/* Job Details */}
      <div className="w-full lg:w-[300px] shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Details</h3>
            <button onClick={() => navigate(`/invoices/${id}/edit`)} className="w-7 h-7 rounded text-[#9CA3AF] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] flex items-center justify-center transition-colors" title="Edit job details">
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-[#9CA3AF]">Job Number</div>
              {data.jobNumber ? (
                <button onClick={() => navigate(`/jobs/${data.jobNumber}`)} className="text-[13px] text-[#4A6FA5] hover:underline text-left" style={{ fontWeight: 500 }}>
                  {data.jobNumber}
                </button>
              ) : (
                <span className="text-[13px] text-[#9CA3AF]">—</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-[#9CA3AF]">Job Name</div>
              <span className="text-[13px] text-[#374151]">{data.jobName || <span className="text-[#9CA3AF]">—</span>}</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <div className="text-[11px] text-[#9CA3AF]">Service Address</div>
              <span className="text-[13px] text-[#374151] leading-[19px]">
                {data.serviceAddress.line}<br />
                {data.serviceAddress.city}, {data.serviceAddress.state} {data.serviceAddress.zip}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-[#9CA3AF]">Linked Estimate #</div>
              {data.linkedEstimate ? (
                <button onClick={() => navigate(`/estimates/${data.linkedEstimate}`)} className="text-[13px] text-[#4A6FA5] hover:underline text-left" style={{ fontWeight: 500 }}>
                  {data.linkedEstimate}
                </button>
              ) : (
                <span className="text-[13px] text-[#9CA3AF]">—</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[11px] text-[#9CA3AF]">Estimate Status</div>
              <span className="text-[13px] text-[#374151]">{data.estimateStatus || <span className="text-[#9CA3AF]">—</span>}</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <div className="text-[11px] text-[#9CA3AF]">Memo</div>
              <span className="text-[13px] text-[#374151] leading-[19px]">{data.memo || <span className="text-[#9CA3AF]">—</span>}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes (Note to Client / Internal) */}
      <div className="w-full lg:w-[300px] shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex border-b border-[#E5E7EB] px-4">
            {([
              { key: "customer" as NotesTabKey, label: "Note to Client" },
              { key: "internal" as NotesTabKey, label: "Internal" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setNotesTab(key)}
                className={`relative py-3 px-1 mr-4 text-[13px] transition-colors ${
                  notesTab === key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"
                }`}
                style={{ fontWeight: notesTab === key ? 600 : 500 }}
              >
                {label}
                {notesTab === key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#4A6FA5] rounded-full" />}
              </button>
            ))}
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            {notesTab === "customer" ? (
              <>
                {data.noteToCustomer ? (
                  <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[13px] text-[#1A2332] leading-[19px]">
                    {data.noteToCustomer}
                  </div>
                ) : (
                  <div className="text-[12px] text-[#9CA3AF] py-2">No note yet.</div>
                )}
                <button className="self-start inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "14px" }}>{data.noteToCustomer ? "edit" : "add"}</span>
                  {data.noteToCustomer ? "Edit note" : "Add note"}
                </button>
              </>
            ) : (
              <>
                {data.notes ? (
                  <div className="p-2.5 bg-[#F9FAFB] rounded-md text-[13px] text-[#1A2332] leading-[19px]">
                    {data.notes}
                  </div>
                ) : (
                  <div className="text-[12px] text-[#9CA3AF] py-2">No internal note yet.</div>
                )}
                <button className="self-start inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add note
                </button>
              </>
            )}
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
      {/* ── PAGE HEADER (back arrow + actions on gray, outside the white card) ── */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/invoices")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Invoices
        </button>
      </div>

      {/* ── White card containing header + tabs + content ── */}
      <div className="relative mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
            {/* Left: name + contact info */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontWeight: 600 }}>
                  Invoice #{data.number}
                </h2>
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] hover:opacity-80 transition-opacity"
                    style={{ fontWeight: 600, backgroundColor: statusColors[status].bg, color: statusColors[status].text }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[status].text }} />
                    {status}
                    <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
                      {allStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                          style={{ fontWeight: s === status ? 600 : 400, color: s === status ? "#4A6FA5" : "#1A2332" }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s].text }} />
                          {s}
                          {s === status && <span className="material-icons ml-auto" style={{ fontSize: "16px", color: "#4A6FA5" }}>check</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Client + address + job inline row */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button onClick={() => navigate("/clients/1")} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>person</span>
                  {data.client.name}
                </button>
                {data.client.phone && (
                  <a href={`tel:${data.client.phone}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors ml-0.5" title={data.client.phone}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                  </a>
                )}
                {data.client.email && (
                  <a href={`mailto:${data.client.email}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors" title={data.client.email}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>mail</span>
                  </a>
                )}
                <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                <span className="flex items-center gap-1 text-[14px] text-[#374151]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>location_on</span>
                  {data.billingAddress.line}, {data.billingAddress.city}, {data.billingAddress.state} {data.billingAddress.zip}
                </span>
                {data.jobNumber && (
                  <>
                    <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                    <button onClick={() => navigate(`/jobs/${data.jobNumber}`)} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                      <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
                      {data.jobName}
                    </button>
                  </>
                )}
              </div>

              {/* Metadata strip */}
              <div className="flex items-center gap-0.5 flex-wrap pt-2 mt-1 border-t border-[#F3F4F6]">
                <div className="flex items-center gap-1.5 pr-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>calendar_today</span>
                  Created {fmtDate(data.dateCreated)}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px]" style={{ color: overdueDays > 0 ? "#DC2626" : "#6B7280", fontWeight: overdueDays > 0 ? 500 : 400 }}>
                  <span className="material-icons" style={{ fontSize: "14px" }}>schedule</span>
                  Due {fmtDate(data.dueDate)}{overdueDays > 0 ? ` · ${overdueDays}d past` : ""}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>person</span>
                  {data.createdBy}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>mail</span>
                  Sent {fmtDate(data.dateSent)}
                </div>
              </div>
            </div>

            {/* Right: KPI strip — Client-style (borderless, dark value, tinted icon) */}
            <div className="flex items-center gap-4 shrink-0">
              {[
                { label: "Total (USD)",  value: `$${fmt(total)}`,                    icon: "receipt", iconColor: "#4A6FA5" },
                { label: "Balance Due",  value: `$${fmt(Math.max(0, balance))}`,     icon: "paid",    iconColor: balance > 0 ? "#DC2626" : "#16A34A" },
              ].map(({ label, value, icon, iconColor }, i) => (
                <div key={label} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-6 bg-[#E5E7EB] shrink-0" />}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="text-[18px] leading-none tabular-nums text-[#1A2332] whitespace-nowrap" style={{ fontWeight: 600 }}>{value}</div>
                      <div className="text-[14px] leading-[20px] text-[#6B7280] mt-1 whitespace-nowrap">{label}</div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}26` }}>
                      <span className="material-icons" style={{ fontSize: "20px", color: iconColor }}>{icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Divider separating the invoice header from the tab bar */}
        <div className="-mx-4 mt-4 border-t border-[#E5E7EB]" />

        <DetailTabs
          tabs={TABS.map(t => ({
            ...t,
            count: t.key === "activity" ? activity.length : t.key === "payments" ? payments.length : undefined,
          }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          tabSuffix={<TabSettingsButton />}
          trailing={
            <>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="h-9 px-3.5 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontWeight: 600 }}
              title="Record a payment for this invoice"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>payments</span>
              Collect Payment
            </button>
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md bg-white flex items-center justify-center hover:bg-[#F5F7FA]">
              <KebabItem icon="visibility">Preview</KebabItem>
              <KebabItem icon="send">Send</KebabItem>
              <KebabItem icon="file_download">Download</KebabItem>
              <KebabSeparator />
              <KebabItem icon="block" onClick={() => setVoidConfirm(true)}>Void Invoice</KebabItem>
              <KebabItem icon="archive" destructive>Archive Invoice</KebabItem>
            </KebabMenu>
            </>
          }
          className="mt-5"
        />

        {/* ── CONTENT ── */}
        <div className="mt-4">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "payments" && renderPaymentsTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>
      </div>

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] uppercase tracking-wider text-[#6B7280]" style={{ fontWeight: 600 }}>Amount</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount((balance / 2).toFixed(2))}
                      className="text-[11px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      50%
                    </button>
                    <span className="text-[#D1D5DB]">·</span>
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.max(0, balance).toFixed(2))}
                      className="text-[11px] text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      Full balance
                    </button>
                  </div>
                </div>
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
                {(() => {
                  const entered = parseFloat(payAmount);
                  if (!entered || entered <= 0) return null;
                  const remaining = balance - entered;
                  if (remaining > 0) {
                    return (
                      <div className="mt-1.5 text-[11px] text-[#D97706] flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: "13px" }}>info</span>
                        Partial payment — ${fmt(remaining)} will remain
                      </div>
                    );
                  }
                  if (remaining < 0) {
                    return (
                      <div className="mt-1.5 text-[11px] text-[#DC2626] flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: "13px" }}>warning</span>
                        Exceeds balance by ${fmt(-remaining)}
                      </div>
                    );
                  }
                  return (
                    <div className="mt-1.5 text-[11px] text-[#16A34A] flex items-center gap-1">
                      <span className="material-icons" style={{ fontSize: "13px" }}>check_circle</span>
                      Pays the invoice in full
                    </div>
                  );
                })()}
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
