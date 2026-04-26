import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";

interface Expense {
  id: number;
  item: string;
  description: string;
  date: string;
  amount: number;
}

interface Visit {
  id: number;
  dateTime: string;
  title: string;
  status: "Scheduled" | "In Progress" | "Completed";
  assigned: string;
}

const mockJobData: Record<string, any> = {
  "1": {
    id: 1, title: "AC Estimate", client: "Travis Jones", clientInitials: "TJ",
    address: "4405 North Clark Avenue", city: "Tampa", state: "FL", zip: "33614",
    phone: "(813) 612-5487", email: "ccj924@yahoo.com",
    jobNumber: "29899-J01", jobType: "One-off job",
    startedOn: "Mar 30, 2026", endsOn: "Mar 30, 2026",
    startTime: "9:00 AM", endTime: "11:00 AM",
    assignedTo: "Marek Stroz", assignedInitials: "MS",
    status: "Scheduled" as const,
    // Client-level info (inherited from customer record)
    customerSince: "Jul - 2021",
    membership: "Silver - Exp. Dec 2027",
    lastService: "Jun-25",
    tags: ["New Homeowner"],
    notes: [
      { id: 1, text: "Prefers morning appointments.", date: "Mar 28, 2026" },
      { id: 2, text: "Has three properties requiring service.", date: "Feb 14, 2026" },
      { id: 3, text: "Requested annual maintenance plan.", date: "Jan 10, 2026" },
      { id: 4, text: "Gate code: 4821", date: "Dec 03, 2025" },
      { id: 5, text: "Large dog on property, call ahead.", date: "Nov 22, 2025" },
    ],
    lineItems: [{ name: "Tree Removal", description: "Complete removal of a tree, including cutting it down to ground level, hauling away all wood and debris.", quantity: 1, unitCost: 0, unitPrice: 0, total: 0 }],
    totalCost: 0, totalPrice: 0,
    expenses: [{ id: 1, item: "HD Items", description: "Plywood", date: "Mar 31, 2026", amount: 152.00 }] as Expense[],
    expenseTotal: 152.00,
    visits: [{ id: 1, dateTime: "Mar 30, 2026 — Anytime", title: "Travis Jones - AC Estimate", status: "Scheduled", assigned: "Marek Stroz" }] as Visit[],
    profitability: { totalPrice: 0, lineItemCost: 0, labor: 0, expenses: 152.00, profit: -152.00, margin: 0 },
    linkedEstimate: { id: 1, title: "Estimate #1", status: "Draft" },
    linkedInvoice: null,
    photos: { before: [], after: [] },
  },
  "2": {
    id: 2, title: "Tree Removal", client: "Sarah Johnson", clientInitials: "SJ",
    address: "1220 Elm Street", city: "Orlando", state: "FL", zip: "32801",
    phone: "(407) 555-1234", email: "sarah.j@email.com",
    jobNumber: "29900-J01", jobType: "One-off job",
    startedOn: "Apr 10, 2026", endsOn: "Apr 10, 2026",
    startTime: "9:00 AM", endTime: "1:00 PM",
    assignedTo: "Marek Stroz", assignedInitials: "MS",
    status: "In Progress" as const,
    // Client-level info (inherited from customer record)
    customerSince: "Mar - 2023",
    membership: null,
    lastService: "Apr-03",
    tags: ["Landscaping"],
    notes: [],
    lineItems: [{ name: "Tree Removal", description: "Full tree removal service", quantity: 1, unitCost: 200, unitPrice: 450, total: 450 }],
    totalCost: 200, totalPrice: 450,
    expenses: [] as Expense[], expenseTotal: 0,
    visits: [{ id: 1, dateTime: "Apr 10, 2026 — 9:00 AM", title: "Sarah Johnson - Tree Removal", status: "In Progress", assigned: "Marek Stroz" }] as Visit[],
    profitability: { totalPrice: 450, lineItemCost: 200, labor: 0, expenses: 0, profit: 250, margin: 55.6 },
    linkedEstimate: null,
    linkedInvoice: { id: 1, title: "Invoice #1", status: "Draft" },
    photos: { before: [], after: [] },
  },
};

const statusColors: Record<string, string> = {
  Scheduled: "#4A6FA5",
  "In Progress": "#D97706",
  Completed: "#16A34A",
};

type TabKey = "details" | "appointments" | "checklists" | "attachments" | "items" | "labor" | "expenses" | "finance" | "equipment" | "activity";

const TABS: { key: TabKey; label: string; count?: number }[] = [
  { key: "details", label: "Details" },
  { key: "appointments", label: "Appointments" },
  { key: "checklists", label: "Checklists" },
  { key: "attachments", label: "Attachments" },
  { key: "items", label: "Items" },
  { key: "labor", label: "Labor" },
  { key: "expenses", label: "Expenses" },
  { key: "finance", label: "Finance" },
  { key: "equipment", label: "Equipment" },
  { key: "activity", label: "Activity" },
];

export function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const job = mockJobData[id || "1"] || mockJobData["1"];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(job.status);
  const [photoTab, setPhotoTab] = useState<"before" | "after">("before");
  const [editingSection, setEditingSection] = useState<null | "address" | "assigned" | "schedule" | "overview">(null);
  const [editJob, setEditJob] = useState<any>(job);
  const openEdit = (section: "address" | "assigned" | "schedule" | "overview") => {
    setEditJob(job);
    setEditingSection(section);
  };
  const setEditField = (field: string, value: any) => setEditJob((p: any) => ({ ...p, [field]: value }));

  const statusColor = statusColors[currentStatus] || "#6B7280";

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setStatusDropdownOpen(false);
  };

  /* ──────────────────────────────────────────
     CONTENT RENDERERS (per tab)
  ────────────────────────────────────────── */

  const renderDetailsTab = () => (
    <div className="grid grid-cols-3 gap-4">
      {/* ── Row 1: Service Address (col 1) | Assigned To (col 2–3) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service Address</h3>
          <button onClick={() => openEdit("address")} className="text-[#9CA3AF] hover:text-[#6B7280]" aria-label="Edit address" title="Edit address">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="flex items-start gap-2">
          <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "16px" }}>location_on</span>
          <div className="text-[13px] text-[#374151] leading-[20px]">
            {job.address}<br />
            {job.city}, {job.state}, {job.zip}
          </div>
        </div>
      </div>

      <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Assigned To</h3>
          <button onClick={() => openEdit("assigned")} className="text-[#9CA3AF] hover:text-[#6B7280]" aria-label="Edit assigned" title="Edit assigned">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="flex items-center gap-8 flex-wrap flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[13px]" style={{ fontWeight: 600 }}>
              {job.assignedInitials}
            </div>
            <div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{job.assignedTo}</div>
              <div className="text-[12px] text-[#9CA3AF]">Technician</div>
            </div>
          </div>
          <div className="h-10 w-px bg-[#E5E7EB]" />
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Role</div>
            <div className="text-[13px] text-[#374151] leading-[20px]">Lead Technician</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Phone</div>
            <div className="text-[13px] text-[#374151] leading-[20px]">(813) 555-0192</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Email</div>
            <a href="mailto:marek@vision360.com" className="text-[13px] text-[#4A6FA5] leading-[20px] hover:underline">
              marek@vision360.com
            </a>
          </div>
          <button className="ml-auto text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>person_add</span>
            Reassign
          </button>
        </div>
      </div>

      {/* ── Row 2: Job Date & Time (col 1) | Job Overview (col 2) | Finance details (col 3) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Date & Time</h3>
          <button onClick={() => openEdit("schedule")} className="text-[#9CA3AF] hover:text-[#6B7280]" aria-label="Edit schedule" title="Edit schedule">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Job Date</div>
            <div className="text-[13px] text-[#374151] leading-[20px]" style={{ fontWeight: 500 }}>
              {job.startedOn}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">End Date</div>
            <div className="text-[13px] text-[#374151] leading-[20px]" style={{ fontWeight: 500 }}>
              {job.endsOn}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Start Time</div>
            <div className="text-[13px] text-[#374151] leading-[20px]" style={{ fontWeight: 500 }}>
              {job.startTime}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">End Time</div>
            <div className="text-[13px] text-[#374151] leading-[20px]" style={{ fontWeight: 500 }}>
              {job.endTime}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Overview</h3>
          <button onClick={() => openEdit("overview")} className="text-[#9CA3AF] hover:text-[#6B7280]" aria-label="Edit overview" title="Edit overview">
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Job Title</div>
            <div className="text-[13px] text-[#374151] leading-[20px]" style={{ fontWeight: 500 }}>
              {job.title}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Job #</div>
            <div className="text-[13px] text-[#374151] leading-[20px]">
              {job.jobNumber}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Job Type</div>
            <div className="text-[13px] text-[#374151] leading-[20px]">
              {job.jobType}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Customer</div>
            <button
              onClick={() => navigate("/clients/1")}
              className="text-[13px] text-[#4A6FA5] leading-[20px] hover:underline text-left"
              style={{ fontWeight: 500 }}
            >
              {job.client}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Finance details</h3>
          <button
            onClick={() => setActiveTab("finance")}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Total Price</div>
            <div className="text-[15px] text-[#16A34A] leading-[22px]" style={{ fontWeight: 600 }}>
              ${job.profitability.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Line Item Cost</div>
            <div className="text-[15px] text-[#1A2332] leading-[22px]" style={{ fontWeight: 500 }}>
              ${job.profitability.lineItemCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Labor</div>
            <div className="text-[15px] text-[#1A2332] leading-[22px]" style={{ fontWeight: 500 }}>
              ${job.profitability.labor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Expenses</div>
            <div className="text-[15px] text-[#1A2332] leading-[22px]" style={{ fontWeight: 500 }}>
              ${job.profitability.expenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Profit</div>
            <div
              className="text-[15px] leading-[22px]"
              style={{ fontWeight: 600, color: job.profitability.profit < 0 ? "#DC2626" : "#16A34A" }}
            >
              {job.profitability.profit < 0 ? "-" : ""}${Math.abs(job.profitability.profit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Profit Margin</div>
            <div
              className="text-[15px] leading-[22px]"
              style={{ fontWeight: 600, color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A" }}
            >
              {job.profitability.margin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Linked Documents (col 1 only) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h3 className="text-[14px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Linked Documents</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>request_quote</span>
              <span className="text-[13px] text-[#374151]">Estimate</span>
            </div>
            {job.linkedEstimate ? (
              <button
                onClick={() => navigate(`/estimates/${job.linkedEstimate.id}`)}
                className="text-[13px] text-[#4A6FA5] hover:underline flex items-center gap-2"
                style={{ fontWeight: 500 }}
              >
                {job.linkedEstimate.title}
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F3F4F6] text-[#6B7280]" style={{ fontWeight: 500 }}>{job.linkedEstimate.status}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/estimates/create")}
                className="text-[12px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                Create
              </button>
            )}
          </div>
          <div className="h-px bg-[#F3F4F6]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>receipt</span>
              <span className="text-[13px] text-[#374151]">Invoice</span>
            </div>
            {job.linkedInvoice ? (
              <button
                onClick={() => navigate(`/invoices/${job.linkedInvoice.id}`)}
                className="text-[13px] text-[#4A6FA5] hover:underline flex items-center gap-2"
                style={{ fontWeight: 500 }}
              >
                {job.linkedInvoice.title}
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F3F4F6] text-[#6B7280]" style={{ fontWeight: 500 }}>{job.linkedInvoice.status}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/invoices/create")}
                className="text-[12px] text-[#4A6FA5] hover:underline"
                style={{ fontWeight: 500 }}
              >
                Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Scheduled Appointments</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
          Add appointment
        </button>
      </div>
      {job.visits.length > 0 ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Date and time</th>
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Title</th>
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Status</th>
              <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Assigned</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {job.visits.map((v: Visit) => (
              <tr key={v.id} className="border-b border-[#F3F4F6]">
                <td className="py-3 text-[#374151]">{v.dateTime}</td>
                <td className="py-3 text-[#1A2332]">{v.title}</td>
                <td className="py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px]"
                    style={{
                      fontWeight: 600,
                      backgroundColor: `${statusColors[v.status]}20`,
                      color: statusColors[v.status],
                    }}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>MS</div>
                    <span className="text-[#374151]">{v.assigned}</span>
                  </div>
                </td>
                <td className="py-3">
                  <button className="p-1 hover:bg-[#F3F4F6] rounded">
                    <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>check_circle_outline</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-[13px] text-[#9CA3AF] text-center py-8">No appointments scheduled</div>
      )}
    </div>
  );

  const renderItemsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Products & Services</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
          Add line item
        </button>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Line Item</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Qty</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Unit Cost</th>
            <th className="text-center py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Unit Price</th>
            <th className="text-right py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {job.lineItems.map((li: any, idx: number) => (
            <tr key={idx} className="border-b border-[#F3F4F6]">
              <td className="py-3">
                <div className="text-[#1A2332]" style={{ fontWeight: 500 }}>{li.name}</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">{li.description}</div>
              </td>
              <td className="text-center py-3 text-[#374151]">{li.quantity}</td>
              <td className="text-center py-3 text-[#374151]">${li.unitCost.toFixed(2)}</td>
              <td className="text-center py-3 text-[#374151]">${li.unitPrice.toFixed(2)}</td>
              <td className="text-right py-3 text-[#1A2332]" style={{ fontWeight: 500 }}>${li.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-8 pt-4 mt-2 border-t border-[#E5E7EB]">
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total Cost</div>
          <div className="text-[14px] text-[#374151]" style={{ fontWeight: 500 }}>${job.totalCost.toFixed(2)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total Price</div>
          <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>${job.totalPrice.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  const renderLaborTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Time Entries</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
          Add time entry
        </button>
      </div>
      <div className="text-center py-8">
        <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>schedule</span>
        <div className="text-[13px] text-[#9CA3AF]">No time entries yet</div>
        <div className="text-[12px] text-[#9CA3AF] mt-1">Time tracked to this job will show here</div>
      </div>
    </div>
  );

  const renderExpensesTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Expenses</h3>
        <button className="text-[12px] text-[#4A6FA5] hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
          Add expense
        </button>
      </div>
      {job.expenses.length > 0 ? (
        <>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Item</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Description</th>
                <th className="text-left py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Date</th>
                <th className="text-right py-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]" style={{ fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {job.expenses.map((exp: Expense) => (
                <tr key={exp.id} className="border-b border-[#F3F4F6]">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>receipt</span>
                      <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{exp.item}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[#374151]">{exp.description}</td>
                  <td className="py-3 text-[#374151]">{exp.date}</td>
                  <td className="py-3 text-right text-[#1A2332]" style={{ fontWeight: 500 }}>${exp.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end pt-3 mt-2 border-t border-[#E5E7EB]">
            <div className="flex flex-col items-end gap-1">
              <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Total</div>
              <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>${job.expenseTotal.toFixed(2)}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>receipt_long</span>
          <div className="text-[13px] text-[#9CA3AF]">No expenses recorded</div>
        </div>
      )}
    </div>
  );

  const renderFinanceTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <h3 className="text-[14px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Profitability</h3>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Total Price</div>
          <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 600 }}>${job.profitability.totalPrice.toFixed(2)}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Line Item Cost</div>
          <div className="text-[18px] text-[#374151] leading-[28px]" style={{ fontWeight: 500 }}>${job.profitability.lineItemCost.toFixed(2)}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Labor</div>
          <div className="text-[18px] text-[#374151] leading-[28px]" style={{ fontWeight: 500 }}>${job.profitability.labor.toFixed(2)}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Expenses</div>
          <div className="text-[18px] text-[#374151] leading-[28px]" style={{ fontWeight: 500 }}>${job.profitability.expenses.toFixed(2)}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Profit</div>
          <div
            className="text-[18px] leading-[28px]"
            style={{ fontWeight: 600, color: job.profitability.profit < 0 ? "#DC2626" : "#16A34A" }}
          >
            {job.profitability.profit < 0 ? "-" : ""}${Math.abs(job.profitability.profit).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="border-t border-[#F3F4F6] pt-4">
        <div className="flex items-baseline gap-2">
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>Profit margin</div>
          <div
            className="text-[28px] leading-none"
            style={{ fontWeight: 700, color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A" }}
          >
            {job.profitability.margin.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttachmentsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Photos</h3>
        <button className="px-3 py-1.5 border border-[#4A6FA5] text-[#4A6FA5] rounded-md text-[12px] hover:bg-[#EBF0F8] flex items-center gap-1" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>add_a_photo</span>
          Upload
        </button>
      </div>
      <div className="flex gap-4 border-b border-[#E5E7EB] mb-4">
        <button
          onClick={() => setPhotoTab("before")}
          className={`pb-2 text-[13px] border-b-2 ${photoTab === "before" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280]"}`}
          style={{ fontWeight: photoTab === "before" ? 600 : 500 }}
        >
          Before
        </button>
        <button
          onClick={() => setPhotoTab("after")}
          className={`pb-2 text-[13px] border-b-2 ${photoTab === "after" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#6B7280]"}`}
          style={{ fontWeight: photoTab === "after" ? 600 : 500 }}
        >
          After
        </button>
      </div>
      <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
        <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>photo_camera</span>
        <p className="text-[13px] text-[#9CA3AF]">
          No {photoTab} photos yet. Upload photos to document job progress.
        </p>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <h3 className="text-[14px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Activity Log</h3>
      <div className="space-y-4">
        {[
          { icon: "add_circle", color: "#4A6FA5", text: "Job created", user: "Marek Stroz", time: "Mar 30, 2026 at 9:15 AM" },
          { icon: "person_add", color: "#4A6FA5", text: "Assigned to Marek Stroz", user: "Marek Stroz", time: "Mar 30, 2026 at 9:15 AM" },
          { icon: "event", color: "#4A6FA5", text: "Visit scheduled for Mar 30, 2026", user: "Marek Stroz", time: "Mar 30, 2026 at 9:16 AM" },
          { icon: "receipt", color: "#D97706", text: "Expense added: HD Items — $152.00", user: "Marek Stroz", time: "Mar 31, 2026 at 2:30 PM" },
        ].map((entry, idx, arr) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="material-icons" style={{ fontSize: "20px", color: entry.color }}>{entry.icon}</span>
              {idx < arr.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] mt-1" />}
            </div>
            <div className="pb-2">
              <div className="text-[13px] text-[#1A2332]">{entry.text}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{entry.user} · {entry.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComingSoon = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-10 text-center">
      <span className="material-icons text-[#D1D5DB] mb-3 block" style={{ fontSize: "40px" }}>construction</span>
      <p className="text-[14px] text-[#6B7280]" style={{ fontWeight: 500 }}>Coming soon</p>
      <p className="text-[13px] text-[#9CA3AF] mt-1">This feature will be available in a future update.</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "details": return renderDetailsTab();
      case "appointments": return renderAppointmentsTab();
      case "items": return renderItemsTab();
      case "labor": return renderLaborTab();
      case "expenses": return renderExpensesTab();
      case "finance": return renderFinanceTab();
      case "attachments": return renderAttachmentsTab();
      case "activity": return renderActivityTab();
      case "checklists":
      case "equipment":
      default:
        return renderComingSoon();
    }
  };

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── SUMMARY BAR ── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        {/* Back arrow + Actions */}
        <div className="px-8 h-12 flex items-center justify-between gap-1.5 border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
            aria-label="Back to Jobs"
            title="Back to Jobs"
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Jobs</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/jobs/${id}/edit`)}
              className="border border-[#DDE3EE] text-[#546478] hover:bg-[#EDF0F5] h-8 px-2.5 rounded-md flex items-center justify-center"
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            </button>
            <KebabMenu triggerClassName="h-8 w-8 border border-[#DDE3EE] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
              <KebabItem icon="edit" onClick={() => navigate(`/jobs/${id}/edit`)}>Edit Job</KebabItem>
              <KebabItem icon="content_copy">Duplicate Job</KebabItem>
              <KebabItem icon="delete" destructive>Delete Job</KebabItem>
            </KebabMenu>
          </div>
        </div>

        {/* Summary content */}
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-start gap-10">
            {/* Main info section */}
            <div className="flex-1 flex gap-8">
              {/* Left: Name + Address + Icons + Status */}
              <div className="flex flex-col gap-4 min-w-[270px]">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
                    {job.client}
                  </h1>
                  <span className="text-[13px] text-[#9CA3AF]">
                    {job.jobNumber}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5">
                  <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "14px" }}>location_on</span>
                  <div className="text-[13px] text-[#374151] leading-[19px]">
                    {job.address}
                    <br />
                    {job.city}, {job.state}, {job.zip}
                  </div>
                </div>

                {/* Icons row + Status */}
                <div className="flex items-center gap-4">
                  {/* Customer link */}
                  <div className="relative group">
                    <button
                      onClick={() => navigate("/clients/1")}
                      className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors"
                    >
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>person</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{job.client}</div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>phone</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{job.phone}</div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="relative group">
                    <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F3F4F6] transition-colors">
                      <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>email</span>
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-white border border-[#E5E7EB] shadow-lg rounded-lg px-3 py-2 whitespace-nowrap z-50">
                      <div className="text-[13px] text-[#1A2332]">{job.email}</div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors"
                      style={{
                        fontWeight: 600,
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {currentStatus}
                      <span className="material-icons" style={{ fontSize: "14px" }}>arrow_drop_down</span>
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 w-[150px] py-1">
                        {["Scheduled", "In Progress", "Completed"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F3F4F6] flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                            <span style={{ color: statusColors[s], fontWeight: 500 }}>{s}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Three-column data grid — inherited from client */}
              <div className="grid grid-cols-3 gap-6 flex-1 border-l border-[#E5E7EB] pl-10">
                {/* Column 1: Customer since + Tags */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Customer since</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">
                      {job.customerSince}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">
                      Tags ({job.tags.length})
                    </div>
                    {job.tags.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {job.tags.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-[#E0E7FF] text-[11px] text-[#4338CA] leading-[16px] h-[24.5px]" style={{ fontWeight: 500 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#9CA3AF] leading-[20px]">—</div>
                    )}
                  </div>
                </div>

                {/* Column 2: Membership + Last Service */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Membership</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">
                      {job.membership || <span className="text-[#9CA3AF]">—</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Last Service</div>
                    <div className="text-[13px] text-[#374151] leading-[20px]">
                      {job.lastService || <span className="text-[#9CA3AF]">—</span>}
                    </div>
                  </div>
                </div>

                {/* Column 3: Notes */}
                <div className="relative group cursor-pointer flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">
                    Notes ({job.notes.length})
                  </div>
                  {job.notes.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {job.notes.slice(0, 2).map((note: any) => (
                        <div key={note.id} className="text-[12px] text-[#374151] leading-[18px] truncate max-w-[240px]">
                          {note.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#9CA3AF] leading-[20px]">—</div>
                  )}

                  {/* Notes hover tooltip */}
                  {job.notes.length > 0 && (
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 w-[320px] z-[60]">
                      <div className="absolute -top-1.5 left-5 w-3 h-1.5 overflow-hidden">
                        <div className="absolute w-2 h-2 bg-white border-l border-t border-[#E5E7EB] rotate-45 left-1/2 -translate-x-1/2"></div>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-lg p-3.5">
                        <div className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.5px" }}>
                          Notes
                        </div>
                        <div className="h-px bg-[#E5E7EB] mb-3"></div>
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                          {job.notes.map((note: any, index: number) => (
                            <div key={note.id} className="flex flex-col gap-1">
                              <div className="text-[13px] text-[#1A2332] leading-[20px]">
                                {note.text}
                              </div>
                              <div className="text-[11px] text-[#6B7280] leading-[16px]">
                                {note.date}
                              </div>
                              {index < job.notes.length - 1 && <div className="h-px bg-[#E5E7EB] mt-2"></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-l border-[#E5E7EB] pl-8" style={{ width: "280px" }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-[255px]">
                {/* Total Price */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Total Price</div>
                  <div className="text-[18px] text-[#16A34A] leading-[28px]" style={{ fontWeight: 600 }}>
                    ${job.profitability.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Labor */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Labor</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 500 }}>
                    ${job.profitability.labor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* All Expenses */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-[#9CA3AF] leading-[16px]">All Expenses</div>
                  <div className="text-[18px] text-[#1A2332] leading-[28px]" style={{ fontWeight: 500 }}>
                    ${(job.profitability.lineItemCost + job.profitability.expenses).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[11px] text-[#9CA3AF] leading-[16px]">Profit Margin</div>
                    <div className="relative group">
                      <span className="material-icons text-[#9CA3AF] cursor-help" style={{ fontSize: "14px" }}>info</span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white border border-[#E5E7EB] rounded-md shadow-lg px-3 py-2 z-50 whitespace-nowrap">
                        <div className="text-[12px] text-[#1A2332]">(Total Price − Costs) / Total Price</div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-[18px] leading-[28px]"
                    style={{
                      fontWeight: 600,
                      color: job.profitability.margin < 0 ? "#DC2626" : "#16A34A",
                    }}
                  >
                    {job.profitability.margin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL TABS ── */}
      <div className="bg-white sticky top-0 z-30">
        <div className="flex items-center overflow-x-auto scrollbar-hide border-b border-[#E5E7EB]">
          <div className="flex items-center px-6">
            {TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative h-[45px] px-4 shrink-0 text-[13px] transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "text-[#4A6FA5]"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-0.5" style={{ fontWeight: 400 }}>({count})</span>
                )}
                {activeTab === key && (
                  <div className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-[#4A6FA5]" />
                )}
              </button>
            ))}
          </div>
          <button className="ml-auto h-[45px] w-[50px] flex items-center justify-center shrink-0 hover:bg-[#F3F4F6] transition-colors">
            <span className="material-icons text-[#6B7280]" style={{ fontSize: "18px" }}>settings</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 space-y-4 bg-[#F5F7FA]">
        {renderContent()}
      </main>

      {/* ── PER-SECTION EDIT MODAL ── */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditingSection(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[16px] text-[#111827]" style={{ fontWeight: 600 }}>
                {editingSection === "address" && "Edit service address"}
                {editingSection === "assigned" && "Edit assigned technician"}
                {editingSection === "schedule" && "Edit job date & time"}
                {editingSection === "overview" && "Edit job overview"}
              </h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-[#6B7280] hover:text-[#111827] w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {editingSection === "address" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Street address</label>
                    <input
                      value={editJob.address || ""}
                      onChange={(e) => setEditField("address", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>City</label>
                      <input
                        value={editJob.city || ""}
                        onChange={(e) => setEditField("city", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>State</label>
                      <input
                        value={editJob.state || ""}
                        onChange={(e) => setEditField("state", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>ZIP</label>
                      <input
                        value={editJob.zip || ""}
                        onChange={(e) => setEditField("zip", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "assigned" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Technician</label>
                    <select
                      value={editJob.assignedTo || ""}
                      onChange={(e) => setEditField("assignedTo", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="Marek Stroz">Marek Stroz</option>
                      <option value="Travis Jones">Travis Jones</option>
                      <option value="Sarah Miller">Sarah Miller</option>
                      <option value="Anne Blue">Anne Blue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                    <select
                      defaultValue="Lead Technician"
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option>Lead Technician</option>
                      <option>Helper</option>
                      <option>Apprentice</option>
                    </select>
                  </div>
                </>
              )}

              {editingSection === "schedule" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job date</label>
                      <input
                        value={editJob.startedOn || ""}
                        onChange={(e) => setEditField("startedOn", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End date</label>
                      <input
                        value={editJob.endsOn || ""}
                        onChange={(e) => setEditField("endsOn", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Start time</label>
                      <input
                        value={editJob.startTime || ""}
                        onChange={(e) => setEditField("startTime", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>End time</label>
                      <input
                        value={editJob.endTime || ""}
                        onChange={(e) => setEditField("endTime", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingSection === "overview" && (
                <>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job title</label>
                    <input
                      value={editJob.title || ""}
                      onChange={(e) => setEditField("title", e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job #</label>
                      <input
                        value={editJob.jobNumber || ""}
                        readOnly
                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-[#F9FAFB] text-[#6B7280] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Job type</label>
                      <select
                        value={editJob.jobType || ""}
                        onChange={(e) => setEditField("jobType", e.target.value)}
                        className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md text-[14px] bg-white focus:outline-none focus:border-[#4A6FA5]"
                      >
                        <option value="One-off job">One-off job</option>
                        <option value="Recurring job">Recurring job</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Customer</label>
                    <input
                      value={editJob.client || ""}
                      readOnly
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] bg-[#F9FAFB] text-[#6B7280]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingSection(null)}
                className="h-9 px-4 border border-[#DDE3EE] rounded-md text-[13px] text-[#546478] hover:bg-[#EDF0F5] transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingSection(null)}
                className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors"
                style={{ fontWeight: 500 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
