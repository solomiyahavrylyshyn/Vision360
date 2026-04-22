import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";

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
    address: "4405 North Clark Avenue, Tampa, Florida, 33614",
    phone: "8136125487", email: "ccj924@yahoo.com",
    jobNumber: 1, jobType: "One-off job", startedOn: "Mar 30, 2026", endsOn: "Mar 30, 2026",
    salesperson: "Marek Stroz",
    status: "Scheduled" as const,
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
    address: "1220 Elm Street, Orlando, Florida 32801",
    phone: "4075551234", email: "sarah.j@email.com",
    jobNumber: 2, jobType: "One-off job", startedOn: "Apr 10, 2026", endsOn: "Apr 10, 2026",
    salesperson: "Marek Stroz",
    status: "In Progress" as const,
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

export function JobDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const job = mockJobData[id || "1"] || mockJobData["1"];

  const [showProfitability, setShowProfitability] = useState(true);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<"before" | "after">("before");
  const [notes, setNotes] = useState("");
  const [profitTooltip, setProfitTooltip] = useState(false);

  const statusColor = statusColors[job.status] || "#6B7280";

  const handleStatusChange = (newStatus: string) => {
    // In real app this would update backend
    setStatusDropdownOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FA]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="px-8 h-10 flex items-center gap-1.5 border-b border-[#F3F4F6]">
          <button onClick={() => navigate("/jobs")} className="text-[13px] text-[#4A6FA5] hover:underline">Jobs</button>
          <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "16px" }}>chevron_right</span>
          <span className="text-[13px] text-[#374151]">{job.jobNumber}</span>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>work</span>
              {/* Status with manual change dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-white transition-colors"
                  style={{ borderColor: statusColor }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                  <span className="text-sm" style={{ color: statusColor, fontWeight: 500 }}>{job.status}</span>
                  <span className="material-icons" style={{ fontSize: "16px", color: statusColor }}>arrow_drop_down</span>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-50 w-48 py-1">
                    {["Scheduled", "In Progress", "Completed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F7FA] flex items-center gap-2.5"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                        <span style={{ color: statusColors[s], fontWeight: 500 }}>{s}</span>
                        {job.status === s && (
                          <span className="material-icons ml-auto text-[#1A2332]" style={{ fontSize: "16px" }}>check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KebabMenu triggerClassName="p-2 w-auto h-auto border border-[#DDE3EE] rounded-md hover:bg-white">
                <KebabItem icon="edit" onClick={() => navigate(`/jobs/${id}/edit`)}>Edit Job</KebabItem>
                <KebabItem icon="content_copy">Duplicate Job</KebabItem>
                <KebabItem icon="delete" destructive>Delete Job</KebabItem>
              </KebabMenu>
              <button
                onClick={() => navigate(`/jobs/${id}/edit`)}
                className="px-4 py-2 bg-[#4A6FA5] text-white rounded-md text-sm hover:bg-[#3d5a85] flex items-center gap-1.5"
                style={{ fontWeight: 600 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
                Edit Job
              </button>
            </div>
          </div>

          {/* Job Title */}
          <h1 className="text-[28px] text-[#1A2332] mb-6" style={{ fontWeight: 700 }}>{job.title}</h1>

          {/* Client + Job Info Card */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg mb-6">
            <div className="grid grid-cols-[1fr_1fr] divide-x divide-[#DDE3EE]">
              {/* Client */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-sm text-[#4A6FA5] cursor-pointer hover:underline"
                    style={{ fontWeight: 600 }}
                    onClick={() => navigate("/clients/1")}
                  >
                    {job.client}
                  </span>
                  <span className="material-icons text-[#8899AA]" style={{ fontSize: "14px" }}>open_in_new</span>
                </div>
                <div className="space-y-1 text-sm text-[#546478]">
                  <div className="flex items-center gap-1">
                    <span className="material-icons" style={{ fontSize: "14px" }}>location_on</span>
                    Service Address:
                  </div>
                  <div className="text-sm text-[#546478] pl-5">{job.address}</div>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="material-icons" style={{ fontSize: "14px" }}>phone</span>
                    {job.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-icons" style={{ fontSize: "14px" }}>email</span>
                    <a href={`mailto:${job.email}`} className="text-[#4A6FA5] hover:underline">{job.email}</a>
                  </div>
                </div>
              </div>

              {/* Job details */}
              <div className="p-5">
                <div className="space-y-2.5 text-sm">
                  <div className="grid grid-cols-[120px_1fr]">
                    <span className="text-[#546478]">Job #</span>
                    <span className="text-[#1A2332]">{job.jobNumber}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span className="text-[#546478]">Job type</span>
                    <span className="text-[#1A2332]">{job.jobType}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span className="text-[#546478]">Started on</span>
                    <span className="text-[#1A2332]">{job.startedOn}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span className="text-[#546478]">Ends on</span>
                    <span className="text-[#1A2332]">{job.endsOn}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span className="text-[#546478]">Assigned to</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[9px]">MS</div>
                      <span className="text-[#1A2332]">{job.salesperson}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Documents */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <h3 className="text-[16px] text-[#1A2332] mb-4" style={{ fontWeight: 700 }}>Linked Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#DDE3EE] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>request_quote</span>
                  <span className="text-sm text-[#546478]" style={{ fontWeight: 500 }}>Estimate</span>
                </div>
                {job.linkedEstimate ? (
                  <button
                    onClick={() => navigate(`/estimates/${job.linkedEstimate.id}`)}
                    className="text-sm text-[#4A6FA5] hover:underline flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    {job.linkedEstimate.title}
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F0F2F5] text-[#546478]" style={{ fontWeight: 500 }}>{job.linkedEstimate.status}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8899AA]">No linked estimate</span>
                    <button
                      onClick={() => navigate("/estimates/create")}
                      className="text-xs text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
              <div className="border border-[#DDE3EE] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>receipt</span>
                  <span className="text-sm text-[#546478]" style={{ fontWeight: 500 }}>Invoice</span>
                </div>
                {job.linkedInvoice ? (
                  <button
                    onClick={() => navigate(`/invoices/${job.linkedInvoice.id}`)}
                    className="text-sm text-[#4A6FA5] hover:underline flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    {job.linkedInvoice.title}
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#F0F2F5] text-[#546478]" style={{ fontWeight: 500 }}>{job.linkedInvoice.status}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8899AA]">No linked invoice</span>
                    <button
                      onClick={() => navigate("/invoices/create")}
                      className="text-xs text-[#4A6FA5] hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profitability */}
          <div className="mb-6">
            <button
              onClick={() => setShowProfitability(!showProfitability)}
              className="text-sm text-[#4A6FA5] hover:underline flex items-center gap-1 mb-3"
            >
              {showProfitability ? "Hide" : "Show"} Profitability
              <span className="material-icons" style={{ fontSize: "16px" }}>{showProfitability ? "expand_less" : "expand_more"}</span>
            </button>
            {showProfitability && (
              <div className="bg-white border border-[#DDE3EE] rounded-lg p-5">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-[32px] text-[#1A2332]" style={{ fontWeight: 700 }}>{job.profitability.margin}%</div>
                    <div className="text-xs text-[#8899AA]">Profit margin</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-[#546478] mb-1">Total price</div>
                      <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>${job.profitability.totalPrice.toFixed(2)}</div>
                    </div>
                    <span className="text-[#8899AA]">−</span>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-[#546478] mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#4A6FA5]" /> Line Item Cost
                      </div>
                      <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>${job.profitability.lineItemCost.toFixed(2)}</div>
                    </div>
                    <span className="text-[#8899AA]">−</span>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-[#546478] mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#1A2332]" /> Labor
                      </div>
                      <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>${job.profitability.labor.toFixed(2)}</div>
                    </div>
                    <span className="text-[#8899AA]">−</span>
                    <div className="text-center">
                      <div className="text-xs text-[#546478] mb-1">Expenses</div>
                      <div className="text-[#1A2332]" style={{ fontWeight: 600 }}>${job.profitability.expenses.toFixed(2)}</div>
                    </div>
                    <span className="text-[#8899AA]">=</span>
                    <div className="text-center relative">
                      <div className="text-xs text-[#546478] mb-1">Profit</div>
                      <div className={job.profitability.profit < 0 ? "text-[#DC2626]" : "text-[#16A34A]"} style={{ fontWeight: 600 }}>
                        ${job.profitability.profit < 0 ? "-" : ""}${Math.abs(job.profitability.profit).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="relative ml-auto">
                    <button onClick={() => setProfitTooltip(!profitTooltip)} className="text-[#8899AA] hover:text-[#546478]">
                      <span className="material-icons" style={{ fontSize: "18px" }}>info_outline</span>
                    </button>
                    {profitTooltip && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-50 w-64 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ fontWeight: 600 }}>Calculate job profit</span>
                          <button onClick={() => setProfitTooltip(false)}><span className="material-icons" style={{ fontSize: "18px" }}>close</span></button>
                        </div>
                        <p className="text-xs text-[#546478]">Include cost on line items, labor, and expenses to get an accurate reading on job profitability.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product / Service */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Product / Service</h3>
              <button className="text-[#8899AA] hover:text-[#546478]">
                <span className="material-icons" style={{ fontSize: "18px" }}>edit</span>
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDE3EE]">
                  <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Line Item</th>
                  <th className="text-center py-2 text-[#546478]" style={{ fontWeight: 500 }}>Quantity</th>
                  <th className="text-center py-2 text-[#546478]" style={{ fontWeight: 500 }}>Unit Cost</th>
                  <th className="text-center py-2 text-[#546478]" style={{ fontWeight: 500 }}>Unit Price</th>
                  <th className="text-right py-2 text-[#546478]" style={{ fontWeight: 500 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {job.lineItems.map((li: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#DDE3EE]">
                    <td className="py-3">
                      <div className="text-[#1A2332]" style={{ fontWeight: 500 }}>{li.name}</div>
                      <div className="text-xs text-[#8899AA] mt-0.5">{li.description}</div>
                    </td>
                    <td className="text-center py-3 text-[#546478]">{li.quantity}</td>
                    <td className="text-center py-3 text-[#546478]">${li.unitCost.toFixed(2)}</td>
                    <td className="text-center py-3 text-[#546478]">${li.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 text-[#1A2332]">${li.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-[#DDE3EE] pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#546478]">Total cost</span>
                <span>${job.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ fontWeight: 600 }}>
                <span className="text-[#1A2332]">Total price</span>
                <span className="text-[#1A2332]">${job.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Photos (Before / After) — FR-9.2 */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Photos</h3>
              <button className="px-3 py-1.5 border border-[#4A6FA5] text-[#4A6FA5] rounded-md text-sm hover:bg-[#EBF0F8]" style={{ fontWeight: 500 }}>
                <span className="material-icons mr-1" style={{ fontSize: "16px", verticalAlign: "middle" }}>add_a_photo</span>
                Upload
              </button>
            </div>
            <div className="flex gap-4 border-b border-[#DDE3EE] mb-4">
              <button
                onClick={() => setPhotoTab("before")}
                className={`pb-2 text-sm border-b-2 ${photoTab === "before" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#546478]"}`}
                style={{ fontWeight: photoTab === "before" ? 600 : 400 }}
              >
                Before
              </button>
              <button
                onClick={() => setPhotoTab("after")}
                className={`pb-2 text-sm border-b-2 ${photoTab === "after" ? "border-[#4A6FA5] text-[#4A6FA5]" : "border-transparent text-[#546478]"}`}
                style={{ fontWeight: photoTab === "after" ? 600 : 400 }}
              >
                After
              </button>
            </div>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
              <span className="material-icons text-[#D1D5DB] mb-2" style={{ fontSize: "32px" }}>photo_camera</span>
              <p className="text-sm text-[#8899AA]">
                No {photoTab} photos yet. Upload photos to document job progress.
              </p>
            </div>
          </div>

          {/* Labor */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <h3 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Labor</h3>
            <div className="flex items-center justify-between text-sm text-[#8899AA]">
              <div className="flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: "18px" }}>schedule</span>
                Time tracked to this job will show here
              </div>
              <a href="#" className="text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>Add Time Entry</a>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Expenses</h3>
              <button className="w-8 h-8 border border-[#DDE3EE] rounded-full flex items-center justify-center hover:bg-[#F5F7FA]">
                <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>add</span>
              </button>
            </div>
            {job.expenses.length > 0 ? (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#DDE3EE]">
                      <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Item</th>
                      <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Description</th>
                      <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Date</th>
                      <th className="text-right py-2 text-[#546478]" style={{ fontWeight: 500 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.expenses.map((exp: Expense) => (
                      <tr key={exp.id} className="border-b border-[#DDE3EE]">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-[#8899AA]" style={{ fontSize: "18px" }}>receipt</span>
                            {exp.item}
                          </div>
                        </td>
                        <td className="py-3 text-[#546478]">{exp.description}</td>
                        <td className="py-3 text-[#546478]">{exp.date}</td>
                        <td className="py-3 text-right">${exp.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between text-sm pt-3" style={{ fontWeight: 600 }}>
                  <span>Total</span>
                  <span>${job.expenseTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-[#8899AA] text-center py-4">No expenses recorded</div>
            )}
          </div>

          {/* Scheduled Visits */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Scheduled Visits</h3>
              <button className="w-7 h-7 border border-[#DDE3EE] rounded-full flex items-center justify-center hover:bg-[#F5F7FA]">
                <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>add</span>
              </button>
            </div>
            {job.visits.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DDE3EE]">
                    <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Date and time</th>
                    <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Title</th>
                    <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Status</th>
                    <th className="text-left py-2 text-[#546478]" style={{ fontWeight: 500 }}>Assigned</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {job.visits.map((v: Visit) => (
                    <tr key={v.id} className="border-b border-[#DDE3EE]">
                      <td className="py-3 text-[#546478]">{v.dateTime}</td>
                      <td className="py-3 text-[#1A2332]">{v.title}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[v.status] || "#6B7280" }} />
                          <span style={{ color: statusColors[v.status] || "#6B7280" }}>{v.status}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[9px]">MS</div>
                          {v.assigned}
                        </div>
                      </td>
                      <td className="py-3">
                        <button className="p-1 hover:bg-[#F5F7FA] rounded">
                          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>check_circle_outline</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-[#8899AA] text-center py-4">No visits scheduled</div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-6">
            <h3 className="text-[16px] text-[#1A2332] mb-4" style={{ fontWeight: 700 }}>Activity Log</h3>
            <div className="space-y-4">
              {[
                { icon: "add_circle", color: "#4A6FA5", text: "Job created", user: "Marek Stroz", time: "Mar 30, 2026 at 9:15 AM" },
                { icon: "person_add", color: "#4A6FA5", text: "Assigned to Marek Stroz", user: "Marek Stroz", time: "Mar 30, 2026 at 9:15 AM" },
                { icon: "event", color: "#4A6FA5", text: "Visit scheduled for Mar 30, 2026", user: "Marek Stroz", time: "Mar 30, 2026 at 9:16 AM" },
                { icon: "receipt", color: "#D97706", text: "Expense added: HD Items — $152.00", user: "Marek Stroz", time: "Mar 31, 2026 at 2:30 PM" },
              ].map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="material-icons" style={{ fontSize: "20px", color: entry.color }}>{entry.icon}</span>
                    {idx < 3 && <div className="w-px flex-1 bg-[#E5E7EB] mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm text-[#1A2332]">{entry.text}</div>
                    <div className="text-xs text-[#8899AA]">{entry.user} · {entry.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Notes */}
      <div className="w-[300px] border-l border-[#DDE3EE] bg-white overflow-auto">
        <div className="p-5">
          <h3 className="text-[16px] text-[#1A2332] mb-4" style={{ fontWeight: 700 }}>Notes</h3>
          <div className="border border-[#DDE3EE] rounded-lg p-4 min-h-[200px] flex flex-col items-center justify-center">
            {!notes && (
              <>
                <span className="material-icons text-[#C8D5E8] mb-2" style={{ fontSize: "28px" }}>content_copy</span>
                <p className="text-sm text-[#8899AA] text-center mb-3">Leave an internal note for yourself or a team member</p>
              </>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type a note..."
              className="w-full text-sm border-0 focus:outline-none resize-none min-h-[80px]"
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}