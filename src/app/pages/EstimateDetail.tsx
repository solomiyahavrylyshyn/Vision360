import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus = "Unsent" | "Pending" | "Approved" | "Declined" | "Won" | "Archived";

interface LineItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  cost: number;
  amount: number;
  taxable: boolean;
  optional?: boolean;
}

interface EstimateData {
  id: number;
  estimateNumber: string;
  estimateName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string;
  status: EstimateStatus;
  items: LineItem[];
  notes: string;
  taxRate: number;
  laborCost?: number;
  depositAmount?: number;
}

const statusColors: Record<EstimateStatus, string> = {
  Unsent: "#A855F7", Pending: "#F59E0B", Approved: "#3B82F6",
  Declined: "#EF4444", Won: "#22C55E", Archived: "#9CA3AF",
};

// ─── Mock ────────────────────────────────────────────────────────────────────
const mockEstimates: Record<string, EstimateData> = {
  "1": { id: 1, estimateNumber: "1", estimateName: "", clientName: "Travis Jones", clientEmail: "cerb04@yahoo.com", clientPhone: "(863) 225-3254", clientAddress: "8377 Standish Bend Dr Unit 1, Tampa, Florida 33615\nTampa, Florida 33615", date: "Mon Mar 30 2026", status: "Unsent", items: [], notes: "Standard terms and conditions apply. Work will commence within 5 business days of estimate approval. Payment is due upon completion unless otherwise agreed.\n\nAll materials and labor are covered under our 1-year warranty.", taxRate: 0 },
  "5": { id: 5, estimateNumber: "4-1", estimateName: "Option A", clientName: "John Doe", clientEmail: "cerb04@yahoo.com", clientPhone: "(555) 123-4567", clientAddress: "1250 NW 24th St, Miami, Florida 33142", date: "Mon Mar 02 2026", status: "Won", items: [
    { id: 1, name: "SEER Heat Pump Condenser Unit", description: "High efficiency outdoor unit", quantity: 1, price: 3200, cost: 1800, amount: 3200, taxable: true },
    { id: 2, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 2, price: 95, cost: 45, amount: 190, taxable: false },
    { id: 3, name: "Thermostat - Smart WiFi", description: "Smart WiFi Thermostat", quantity: 1, price: 110, cost: 65, amount: 110, taxable: true },
  ], notes: "Option A includes standard SEER unit with installation.", taxRate: 7.5 },
  "6": { id: 6, estimateNumber: "3-1", estimateName: "HVAC Replacement", clientName: "Sarah Williams", clientEmail: "sarah.w@gmail.com", clientPhone: "(407) 555-0198", clientAddress: "4521 Pine Grove Ln, Orlando, Florida 32801", date: "Sat Feb 28 2026", status: "Won", items: [
    { id: 1, name: "SEER Heat Pump Condenser Premium", description: "Ultra high efficiency", quantity: 1, price: 4800, cost: 2900, amount: 4800, taxable: true },
    { id: 2, name: "Copper Piping Installation", description: "Per linear foot", quantity: 50, price: 18.50, cost: 6.75, amount: 925, taxable: true },
    { id: 3, name: "General Labor - Technician", description: "Hourly", quantity: 16, price: 95, cost: 45, amount: 1520, taxable: false },
    { id: 4, name: "Thermostat - Smart WiFi", description: "Ecobee smart thermostat", quantity: 1, price: 450, cost: 180, amount: 450, taxable: true },
    { id: 5, name: "Electrical Panel Upgrade 200A", description: "Panel upgrade", quantity: 1, price: 2800, cost: 1100, amount: 2800, taxable: true },
  ], notes: "Full HVAC replacement with premium unit. Includes electrical panel upgrade for compatibility.", taxRate: 7.5 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ESTIMATE DETAIL ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export function EstimateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Load data
  const initial = mockEstimates[id || ""] || mockEstimates["1"];
  const [estimate, setEstimate] = useState<EstimateData>({ ...initial });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(estimate.estimateName);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allStatuses: EstimateStatus[] = ["Unsent", "Pending", "Approved", "Declined", "Won", "Archived"];
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculations
  const subtotal = estimate.items.reduce((s, i) => s + i.amount, 0);
  const taxableAmount = estimate.items.filter(i => i.taxable).reduce((s, i) => s + i.amount, 0);
  const taxAmount = taxableAmount * (estimate.taxRate / 100);
  const total = subtotal + taxAmount;
  const optionalItems = estimate.items.filter(i => (i as any).optional);
  const withOptional = total + optionalItems.reduce((s, i) => s + i.amount, 0);

  const removeItem = (itemId: number) => {
    setEstimate(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  };

  // Mock catalog items for add item
  const catalogItems = [
    { id: 101, name: "Heat Pump Repair or Service", price: 285, cost: 120 },
    { id: 102, name: "SEER Heat Pump Condenser Unit", price: 3200, cost: 1800 },
    { id: 103, name: "Copper Piping Installation", price: 18.50, cost: 6.75 },
    { id: 104, name: "General Labor - Technician", price: 95, cost: 45 },
    { id: 105, name: "Thermostat - Smart WiFi", price: 450, cost: 180 },
    { id: 106, name: "Drain Cleaning Service", price: 175, cost: 40 },
    { id: 107, name: "Electrical Panel Upgrade 200A", price: 2800, cost: 1100 },
  ];

  return (
    <div className="bg-[#F5F7FA] min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="px-8 h-10 flex items-center gap-1.5 border-b border-[#F3F4F6]">
          <button onClick={() => navigate("/estimates")} className="text-[13px] text-[#4A6FA5] hover:underline">Estimates</button>
          <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "16px" }}>chevron_right</span>
          <span className="text-[13px] text-[#374151]">{estimate.estimateNumber}</span>
        </div>
      </div>
      <div className="p-6">

      {/* Top bar */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 mb-5">
        <div className="flex items-start justify-between">
          {/* Left: Client info */}
          <div>
            <div className="text-[13px] text-[#546478] mb-1">Client: <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{estimate.clientName}</span></div>
            <div className="mt-3">
              <div className="text-[14px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Bill to:</div>
              <div className="text-[13px] text-[#546478] leading-relaxed whitespace-pre-line">
                {estimate.clientAddress}
              </div>
              <div className="text-[13px] text-[#546478] mt-1">{estimate.clientPhone}</div>
              <div className="text-[13px] text-[#546478]">{estimate.clientEmail}</div>
            </div>
          </div>

          {/* Right: Estimate info + actions */}
          <div className="text-right">
            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end mb-4">
              <div ref={actionsRef} className="relative">
                <button
                  onClick={() => setActionsOpen(!actionsOpen)}
                  className="px-4 py-2 border border-[#DDE3EE] rounded-full text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] flex items-center gap-1.5"
                  style={{ fontWeight: 500 }}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>expand_more</span>
                  Actions
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-[calc(100%+4px)] w-[200px] bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-40 py-1">
                    {[
                      { icon: "visibility", label: "Preview" },
                      { icon: "download", label: "Download" },
                      { icon: "edit", label: "Sign" },
                      { icon: "content_copy", label: "Copy to invoice" },
                      { icon: "content_copy", label: "Copy to job" },
                      { icon: "delete", label: "Delete", danger: true },
                    ].map(action => (
                      <button
                        key={action.label}
                        onClick={() => { setActionsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] hover:bg-[#F5F7FA] transition-colors ${
                          action.danger ? "text-[#DC2626]" : "text-[#1A2332]"
                        }`}
                      >
                        <span className="material-icons" style={{ fontSize: "20px", color: action.danger ? "#DC2626" : "#546478" }}>{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="px-5 py-2 bg-[#4A6FA5] text-white rounded-full text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                <span className="material-icons" style={{ fontSize: "16px" }}>send</span>
                Send
              </button>
            </div>

            {/* Estimate details */}
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Estimate:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{estimate.estimateNumber}</span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Estimate name:</span>
                {editingName ? (
                  <input
                    type="text" value={nameInput} autoFocus
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={() => { setEstimate(prev => ({ ...prev, estimateName: nameInput })); setEditingName(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setEstimate(prev => ({ ...prev, estimateName: nameInput })); setEditingName(false); } }}
                    className="w-[160px] h-8 px-2 border border-[#4A6FA5] rounded text-[14px] focus:outline-none"
                  />
                ) : (
                  <button onClick={() => { setNameInput(estimate.estimateName); setEditingName(true); }} className="flex items-center gap-1 hover:bg-[#F5F7FA] rounded px-1.5 py-0.5">
                    <span className="text-[14px] text-[#1A2332]">{estimate.estimateName || "—"}</span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>edit</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Date:</span>
                <span className="text-[14px] text-[#4A6FA5] underline cursor-pointer">{estimate.date}</span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Status:</span>
                <div ref={statusRef} className="relative">
                  <button onClick={() => setStatusOpen(!statusOpen)} className="flex items-center gap-1.5 hover:bg-[#F5F7FA] rounded px-2 py-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[estimate.status] }} />
                    <span className="text-[14px]" style={{ fontWeight: 500 }}>{estimate.status}</span>
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>{statusOpen ? "expand_less" : "expand_more"}</span>
                  </button>
                  {statusOpen && (
                    <div className="absolute right-0 top-[calc(100%+2px)] w-[180px] bg-white border border-[#DDE3EE] rounded-lg shadow-lg z-40 py-1">
                      {allStatuses.map(s => (
                        <button key={s} onClick={() => { setEstimate(prev => ({ ...prev, status: s })); setStatusOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors ${s === estimate.status ? "bg-[#4A6FA5] text-white" : "text-[#1A2332] hover:bg-[#F5F7FA]"}`}
                          style={{ fontWeight: s === estimate.status ? 600 : 400 }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s === estimate.status ? "#fff" : statusColors[s] }} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg mb-5">
        <div className="px-5 py-4 border-b border-[#DDE3EE]">
          <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Items</h3>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#DDE3EE]">
                {["Item", "Quantity", "Price", "Cost", "Amount", "Taxable", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-[12px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[50px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estimate.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                      <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
                    </div>
                    <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>Add items</div>
                  </td>
                </tr>
              ) : estimate.items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-[#EDF0F5] ${idx % 2 === 1 ? "bg-[#FAFBFC]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                    {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>{item.quantity}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</td>
                  <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.cost)}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.amount)}</td>
                  <td className="px-4 py-3 text-[13px] text-[#546478]">{item.taxable ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
                      <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>close</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add item buttons */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#DDE3EE]">
          <button
            onClick={() => setAddItemOpen(true)}
            className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
            Add item
          </button>
          <button className="px-4 py-2 border border-[#DDE3EE] text-[#1A2332] rounded-lg text-[13px] hover:bg-[#F5F7FA] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>menu_book</span>
            Price book
          </button>
        </div>

        {/* Totals */}
        <div className="border-t border-[#DDE3EE] px-5 py-5">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-6">
                <span className="text-[13px] text-[#546478] w-[120px]">Total:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
              </div>
              {optionalItems.length > 0 && (
                <div className="flex items-center gap-6">
                  <span className="text-[13px] text-[#546478] w-[120px]">With optional:</span>
                  <span className="text-[14px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(withOptional)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 text-right min-w-[260px]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#546478]">Subtotal:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#546478]">Taxable:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#546478]">Tax rate%:</span>
                <span className="text-[14px] text-[#4A6FA5] cursor-pointer hover:underline">{estimate.taxRate > 0 ? `${estimate.taxRate}%` : "+ Add new"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#546478]">Tax:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#DDE3EE]">
                <span className="text-[13px] text-[#546478]">Labor cost:</span>
                <span className="text-[14px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(estimate.laborCost ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes + Deposits row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Notes */}
        <div className="bg-white border border-[#DDE3EE] rounded-lg">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DDE3EE]">
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>edit_note</span>
            <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
          </div>
          <div className="p-5">
            <textarea
              value={estimate.notes}
              onChange={(e) => setEstimate(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full min-h-[120px] text-[13px] text-[#546478] leading-relaxed resize-y border-none focus:outline-none"
              placeholder="Add notes..."
            />
            <button className="text-[13px] text-[#4A6FA5] hover:underline mt-2" style={{ fontWeight: 500 }}>(+Add)</button>
          </div>
        </div>

        {/* Deposits */}
        <div className="bg-white border border-[#DDE3EE] rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EE]">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>account_balance_wallet</span>
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposits</h3>
            </div>
            <button className="px-3 py-1.5 border border-[#DDE3EE] text-[13px] text-[#1A2332] rounded-lg hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Add payment</button>
          </div>
          <div className="p-5 flex flex-col items-center justify-center min-h-[140px]">
            {(estimate.depositAmount ?? 0) > 0 ? (
              <div className="text-center">
                <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(estimate.depositAmount ?? 0)}</div>
                <div className="text-[13px] text-[#546478] mt-1">Deposit received</div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
                  <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>payments</span>
                </div>
                <button className="text-[13px] text-[#546478] hover:text-[#1A2332]">+ Add payments</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Attachments + Signatures row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Attachments */}
        <div className="bg-white border border-[#DDE3EE] rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EE]">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>attach_file</span>
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Attachments</h3>
            </div>
            <button className="px-3 py-1.5 bg-[#4A6FA5] text-white text-[13px] rounded-lg hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>cloud_upload</span>
              Upload
            </button>
          </div>
          <div className="p-5 flex flex-col items-center justify-center min-h-[120px]">
            <div className="w-14 h-14 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>cloud_upload</span>
            </div>
            <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>+ Upload files</button>
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-white border border-[#DDE3EE] rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE3EE]">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>draw</span>
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Signatures</h3>
            </div>
            <button className="px-3 py-1.5 bg-[#4A6FA5] text-white text-[13px] rounded-lg hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              Sign
            </button>
          </div>
          <div className="p-5 flex flex-col items-center justify-center min-h-[120px]">
            <div className="text-[13px] text-[#546478]">No signatures found</div>
          </div>
        </div>
      </div>

      {/* ═══ Add Item Modal ═══ */}
      {addItemOpen && (
        <AddItemModal
          catalogItems={catalogItems}
          onClose={() => setAddItemOpen(false)}
          onAdd={(item) => {
            const newItem: LineItem = {
              id: Math.max(...estimate.items.map(i => i.id), 0) + 1,
              name: item.name,
              description: "",
              quantity: 1,
              price: item.price,
              cost: item.cost,
              amount: item.price,
              taxable: true,
              optional: false,
            };
            setEstimate(prev => ({ ...prev, items: [...prev.items, newItem] }));
            setAddItemOpen(false);
          }}
        />
      )}
      </div>
    </div>
  );
}

// ─── Add Item Modal ──────────────────────────────────────────────────────────
function AddItemModal({ catalogItems, onClose, onAdd }: {
  catalogItems: { id: number; name: string; price: number; cost: number }[];
  onClose: () => void;
  onAdd: (item: { name: string; price: number; cost: number }) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = catalogItems.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
          <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 700 }}>Add Item from Catalog</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "22px" }}>close</span>
          </button>
        </div>
        <div className="p-5">
          <div className="relative mb-4">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
            <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full h-10 pl-10 pr-3 border border-[#DDE3EE] rounded-lg text-[14px] focus:outline-none focus:border-[#4A6FA5]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#546478]">No items found</div>
          ) : filtered.map(item => (
            <button
              key={item.id}
              onClick={() => onAdd(item)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F7FA] rounded-lg border-b border-[#EDF0F5] last:border-b-0"
            >
              <div className="text-left">
                <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                <div className="text-[12px] text-[#8899AA]">Cost: ${fmt(item.cost)}</div>
              </div>
              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</div>
            </button>
          ))}
        </div>
      </div>
    </ModalBackdrop>
  );
}