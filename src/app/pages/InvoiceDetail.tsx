import { useState } from "react";
import { useNavigate, useParams } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus = "Unsent" | "Sent" | "Partially Paid" | "Paid" | "Overdue" | "Void";

interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
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
  Unsent: { text: "#546478", bg: "#F3F4F6" },
  Sent: { text: "#3B82F6", bg: "#DBEAFE" },
  "Partially Paid": { text: "#F59E0B", bg: "#FEF3C7" },
  Paid: { text: "#22C55E", bg: "#DCFCE7" },
  Overdue: { text: "#EF4444", bg: "#FEE2E2" },
  Void: { text: "#9CA3AF", bg: "#F3F4F6" },
};

const allStatuses: InvoiceStatus[] = ["Unsent", "Sent", "Partially Paid", "Paid", "Overdue", "Void"];
const paymentMethods = ["Cash", "Check", "Credit Card", "Debit Card", "Bank Transfer", "Other"];

// ─── Mock Invoice Data ───────────────────────────────────────────────────────
const mockInvoices: Record<string, any> = {
  "1": {
    invoiceNumber: "INV-001", status: "Paid" as InvoiceStatus,
    client: { name: "Travis Jones", email: "travis.j@email.com", address: "123 Main St", city: "Austin, TX 78701" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },
    invoiceDate: "2026-03-02", dueDate: "2026-04-01",
    linkedJob: "JOB-003", linkedJobName: "Kitchen Renovation",
    linkedEstimate: "",
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
      { id: 2, date: "2026-03-25", amount: 5502, method: "Check", note: "Final payment" },
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
    invoiceNumber: "INV-002", status: "Overdue" as InvoiceStatus,
    client: { name: "John Doe", email: "john.d@email.com", address: "789 Oak Ave", city: "Dallas, TX 75201" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },
    invoiceDate: "2026-03-02", dueDate: "2026-03-17",
    linkedJob: "JOB-004", linkedJobName: "Bathroom Remodel",
    linkedEstimate: "",
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
    invoiceNumber: "INV-004", status: "Partially Paid" as InvoiceStatus,
    client: { name: "Sarah Williams", email: "sarah.w@email.com", address: "321 Elm St", city: "Houston, TX 77001" },
    from: { company: "Vision360 Services", name: "Marek Stroz", address: "456 Business Blvd", city: "Austin, TX 78702" },
    invoiceDate: "2026-02-28", dueDate: "2026-03-30",
    linkedJob: "JOB-006", linkedJobName: "Electrical Work",
    linkedEstimate: "EST-005",
    items: [
      { name: "Electrical Panel Upgrade 200A", description: "200A electrical panel upgrade — parts and labor", qty: 1, unitPrice: 2200, taxable: true },
    ],
    taxRate: 7.5,
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    payments: [
      { id: 1, date: "2026-03-15", amount: 1000, method: "Credit Card", note: "Partial payment" },
    ],
    activity: [
      { id: 1, date: "2026-02-28 15:00", action: "Invoice created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "2026-03-01 09:00", action: "Invoice sent", detail: "Sent to sarah.w@email.com", icon: "send" },
      { id: 3, date: "2026-03-15 13:30", action: "Payment recorded", detail: "$1,000.00 via Credit Card", icon: "payments" },
      { id: 4, date: "2026-03-15 13:30", action: "Status changed", detail: "Marked as Partially Paid", icon: "info" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
export function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = mockInvoices[id || "1"] || mockInvoices["1"];

  const [status, setStatus] = useState<InvoiceStatus>(data.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>(data.payments);
  const [activity, setActivity] = useState<ActivityEntry[]>(data.activity);

  // Record payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("2026-04-07");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNote, setPayNote] = useState("");

  // Void confirm
  const [voidConfirm, setVoidConfirm] = useState(false);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
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
      date: "2026-04-07 " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
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
      date: "2026-04-07 " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
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
      note: payNote,
    };
    const newPayments = [...payments, newPayment];
    setPayments(newPayments);

    const newTotalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
    const newBalance = total - newTotalPaid;
    const newStatus: InvoiceStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
    setStatus(newStatus);

    setActivity(prev => [
      {
        id: prev.length + 2,
        date: `${payDate} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
        action: "Status changed",
        detail: `Marked as ${newStatus}`,
        icon: newStatus === "Paid" ? "check_circle" : "info",
      },
      {
        id: prev.length + 1,
        date: `${payDate} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
        action: "Payment recorded",
        detail: `$${fmt(amount)} via ${payMethod}`,
        icon: "payments",
      },
      ...prev,
    ]);

    setPaymentModalOpen(false);
    setPayAmount("");
    setPayNote("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#DDE3EE] px-8 h-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate("/invoices")} className="text-[13px] text-[#4A6FA5] hover:underline">Invoices</button>
          <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "16px" }}>chevron_right</span>
          <span className="text-[13px] text-[#374151]">{data.invoiceNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>picture_as_pdf</span>Download PDF
          </button>
          <button className="px-4 py-2 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>send</span>Send
          </button>
          <button className="px-4 py-2 border border-[#DDE3EE] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>Edit
          </button>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
            style={{ fontWeight: 600 }}
            disabled={status === "Paid" || status === "Void"}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>payments</span>Record Payment
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#F5F7FA] p-6">
        <div className="max-w-[960px] mx-auto grid grid-cols-[1fr_320px] gap-6">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Invoice Card */}
            <div className="bg-white border border-[#DDE3EE] rounded-lg p-6">
              {/* Header with status */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>{data.invoiceNumber}</h1>
                    {/* Status dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        className="px-3 py-1 rounded-full text-[12px] flex items-center gap-1 cursor-pointer"
                        style={{ fontWeight: 600, color: statusColors[status].text, backgroundColor: statusColors[status].bg }}
                      >
                        {status}
                        <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                      </button>
                      {statusDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-50 w-[180px] py-1">
                          {allStatuses.map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#F5F7FA] flex items-center gap-2 ${s === status ? "bg-[#EBF0F8]" : ""}`}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s].text }} />
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[13px] text-[#546478]">Created {fmtDate(data.invoiceDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Balance Due</div>
                  <div className="text-[24px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${fmt(Math.max(0, balance))}
                  </div>
                </div>
              </div>

              {/* From / Bill To */}
              <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-[#EDF0F5]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>From</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{data.from.company}</div>
                  <div className="text-[13px] text-[#546478]">{data.from.name}</div>
                  <div className="text-[13px] text-[#546478]">{data.from.address}</div>
                  <div className="text-[13px] text-[#546478]">{data.from.city}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>Bill To</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{data.client.name}</div>
                  <div className="text-[13px] text-[#546478]">{data.client.email}</div>
                  <div className="text-[13px] text-[#546478]">{data.client.address}</div>
                  <div className="text-[13px] text-[#546478]">{data.client.city}</div>
                </div>
              </div>

              {/* Dates & Links */}
              <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-[#EDF0F5]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Invoice Date</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{fmtDate(data.invoiceDate)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Due Date</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{fmtDate(data.dueDate)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Job</div>
                  {data.linkedJob ? (
                    <a href={`/jobs/${data.linkedJob.replace("JOB-", "")}`} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                      {data.linkedJob}: {data.linkedJobName}
                    </a>
                  ) : <span className="text-[13px] text-[#8899AA]">—</span>}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Estimate</div>
                  {data.linkedEstimate ? (
                    <a href={`/estimates/${data.linkedEstimate.replace("EST-", "")}`} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                      {data.linkedEstimate}
                    </a>
                  ) : <span className="text-[13px] text-[#8899AA]">—</span>}
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-[#DDE3EE]">
                    {["Item", "Qty", "Unit Price", "Amount"].map(h => (
                      <th key={h} className={`py-3 text-[11px] uppercase tracking-wider text-[#546478] ${h === "Item" ? "text-left" : "text-right"}`} style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-[#EDF0F5]">
                      <td className="py-3">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                        <div className="text-[12px] text-[#8899AA]">{item.description}</div>
                        {item.taxable && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>}
                      </td>
                      <td className="py-3 text-[13px] text-[#546478] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{item.qty}</td>
                      <td className="py-3 text-[13px] text-[#546478] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                      <td className="py-3 text-[13px] text-[#1A2332] text-right" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="bg-[#F5F7FA] rounded-lg p-5 ml-auto max-w-[380px]">
                <div className="flex justify-between mb-2 text-[13px]">
                  <span className="text-[#546478]">Subtotal</span>
                  <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2 text-[13px]">
                  <span className="text-[#546478]">Taxable amount</span>
                  <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
                </div>
                <div className="flex justify-between mb-3 pb-3 border-b border-[#DDE3EE] text-[13px]">
                  <span className="text-[#546478]">Tax ({data.taxRate}%)</span>
                  <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between mb-2 text-[14px]">
                  <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
                  <span className="text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                </div>
                {totalPayments > 0 && (
                  <div className="flex justify-between mb-3 pb-3 border-b border-[#DDE3EE] text-[13px]">
                    <span className="text-[#16A34A]">Payments received</span>
                    <span className="text-[#16A34A]" style={{ fontVariantNumeric: "tabular-nums" }}>−${fmt(totalPayments)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Balance Due</span>
                  <span className="text-[20px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${fmt(Math.max(0, balance))}
                  </span>
                </div>
              </div>

              {/* Terms */}
              {data.terms && (
                <div className="mt-6 pt-6 border-t border-[#EDF0F5]">
                  <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>Terms & Conditions</div>
                  <div className="text-[13px] text-[#546478]">{data.terms}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Payments */}
            <div className="bg-white border border-[#DDE3EE] rounded-lg">
              <div className="px-5 py-4 border-b border-[#DDE3EE] flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Payments</h3>
                <span className="text-[12px] text-[#546478]">{payments.length} recorded</span>
              </div>
              {payments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>account_balance_wallet</span>
                  <div className="text-[13px] text-[#8899AA] mt-2">No payments recorded</div>
                </div>
              ) : (
                <div className="divide-y divide-[#EDF0F5]">
                  {payments.map(p => (
                    <div key={p.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(p.amount)}</span>
                        <span className="text-[12px] text-[#546478]">{fmtDate(p.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#546478]" style={{ fontWeight: 500 }}>{p.method}</span>
                        {p.note && <span className="text-[12px] text-[#8899AA]">{p.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-5 py-3 border-t border-[#DDE3EE] bg-[#FAFBFC] rounded-b-lg">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#546478]" style={{ fontWeight: 500 }}>Total paid</span>
                  <span className="text-[#22C55E]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(totalPayments)}</span>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white border border-[#DDE3EE] rounded-lg">
              <div className="px-5 py-4 border-b border-[#DDE3EE]">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Activity</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="px-5 py-3">
                  {activity.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3 mb-4 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>{entry.icon}</span>
                        </div>
                        {idx < activity.length - 1 && <div className="w-px flex-1 bg-[#DDE3EE] mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{entry.action}</div>
                        <div className="text-[12px] text-[#8899AA]">{entry.detail}</div>
                        <div className="text-[11px] text-[#B0BEC5] mt-0.5">{entry.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="bg-white border border-[#DDE3EE] rounded-lg p-5">
                <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>Internal Notes</div>
                <div className="text-[13px] text-[#546478]">{data.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPaymentModalOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#DDE3EE] flex items-center justify-between">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Record Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-[#EBF0F8] rounded-lg p-4 flex items-center justify-between">
                <span className="text-[13px] text-[#546478]">Balance due</span>
                <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(Math.max(0, balance))}</span>
              </div>

              <div>
                <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[14px]">$</span>
                  <input
                    type="number" min="0" step="0.01" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={fmt(Math.max(0, balance))}
                    className="w-full h-11 pl-7 pr-4 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Date</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5] bg-white">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Note (optional)</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full h-11 px-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DDE3EE] bg-[#FAFBFC] flex items-center justify-end gap-3">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
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
            <p className="text-[14px] text-[#546478] mb-6">
              This will mark the invoice as void. It will no longer be counted in reports or balances. This action cannot be easily reversed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setVoidConfirm(false)} className="px-4 py-2.5 border border-[#DDE3EE] text-[#546478] rounded-lg text-[13px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmVoid} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-[13px] hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Void Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
