import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus = "Unsent" | "Pending" | "Approved" | "Declined" | "Won" | "Archived" | "Drafted" | "Accepted" | "Sent";

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
  serviceAddress: string;
  dateCreated: string;
  expirationDate: string;
  sentDate: string;
  status: EstimateStatus;
  source: string;
  teamMember: string;
  job: string;
  jobId: number | null;
  items: LineItem[];
  noteToClient: string;
  internalNote: string;
  terms: string;
  taxRate: number;
  depositAmount?: number;
  activity: { id: number; date: string; action: string; detail: string; icon: string }[];
}

const statusColors: Record<EstimateStatus, string> = {
  Unsent: "#A855F7", Pending: "#F59E0B", Approved: "#3B82F6",
  Declined: "#EF4444", Won: "#22C55E", Archived: "#9CA3AF",
  Drafted: "#D97706", Accepted: "#15803D", Sent: "#1E40AF",
};
const statusBg: Record<EstimateStatus, string> = {
  Unsent: "#F3E8FF", Pending: "#FEF3C7", Approved: "#DBEAFE",
  Declined: "#FEE2E2", Won: "#DCFCE7", Archived: "#F3F4F6",
  Drafted: "#FEF9C3", Accepted: "#D1FAE5", Sent: "#EFF6FF",
};

const primaryStatuses: EstimateStatus[] = ["Unsent", "Pending", "Approved", "Declined", "Won", "Archived"];
const otherStatuses: EstimateStatus[] = ["Drafted", "Accepted", "Sent"];

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockEstimates: Record<string, EstimateData> = {
  "1": {
    id: 1, estimateNumber: "1", estimateName: "", clientName: "Travis Jones",
    clientEmail: "cerb04@yahoo.com", clientPhone: "(863) 225-3254",
    clientAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    serviceAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    dateCreated: "Mar 30, 2026", expirationDate: "Apr 30, 2026", sentDate: "—",
    status: "Unsent", source: "Google Ads", teamMember: "Marek Stroz",
    job: "Job-1: AC Estimate", jobId: 1,
    items: [],
    noteToClient: "Standard terms and conditions apply. Work will commence within 5 business days of estimate approval.",
    internalNote: "", terms: "Payment is due upon completion unless otherwise agreed.",
    taxRate: 0, depositAmount: 0,
    activity: [
      { id: 1, date: "Mar 30, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
    ],
  },
  "5": {
    id: 5, estimateNumber: "4-1", estimateName: "Option A", clientName: "John Doe",
    clientEmail: "john.doe@email.com", clientPhone: "(555) 123-4567",
    clientAddress: "1250 NW 24th St\nMiami, FL 33142",
    serviceAddress: "1250 NW 24th St\nMiami, FL 33142",
    dateCreated: "Mar 02, 2026", expirationDate: "Apr 02, 2026", sentDate: "Mar 03, 2026",
    status: "Won", source: "Referral", teamMember: "Marek Stroz",
    job: "Job-4: Bathroom Remodel", jobId: 4,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Unit", description: "High efficiency outdoor unit", quantity: 1, price: 3200, cost: 1800, amount: 3200, taxable: true },
      { id: 2, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 2, price: 95, cost: 45, amount: 190, taxable: false },
      { id: 3, name: "Thermostat - Smart WiFi", description: "Smart WiFi Thermostat", quantity: 1, price: 110, cost: 65, amount: 110, taxable: true },
    ],
    noteToClient: "Option A includes standard SEER unit with installation.",
    internalNote: "Client prefers morning installation window.",
    terms: "Payment is due within 15 days of approval.", taxRate: 7.5, depositAmount: 850,
    activity: [
      { id: 1, date: "Mar 02, 2026 08:30", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 03, 2026 10:15", action: "Estimate sent", detail: "Sent to john.doe@email.com", icon: "send" },
      { id: 3, date: "Mar 10, 2026 14:00", action: "Status changed", detail: "Marked as Won", icon: "check_circle" },
    ],
  },
  "6": {
    id: 6, estimateNumber: "3-1", estimateName: "HVAC Replacement", clientName: "Sarah Williams",
    clientEmail: "sarah.w@gmail.com", clientPhone: "(407) 555-0198",
    clientAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    serviceAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    dateCreated: "Feb 28, 2026", expirationDate: "Mar 28, 2026", sentDate: "Mar 01, 2026",
    status: "Won", source: "Website", teamMember: "Marek Stroz",
    job: "Job-3: HVAC Replacement", jobId: 3,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Premium", description: "Ultra high efficiency", quantity: 1, price: 4800, cost: 2900, amount: 4800, taxable: true },
      { id: 2, name: "Copper Piping Installation", description: "Per linear foot", quantity: 50, price: 18.50, cost: 6.75, amount: 925, taxable: true },
      { id: 3, name: "General Labor - Technician", description: "Hourly", quantity: 16, price: 95, cost: 45, amount: 1520, taxable: false },
      { id: 4, name: "Thermostat - Smart WiFi", description: "Ecobee smart thermostat", quantity: 1, price: 450, cost: 180, amount: 450, taxable: true },
      { id: 5, name: "Electrical Panel Upgrade 200A", description: "Panel upgrade", quantity: 1, price: 2800, cost: 1100, amount: 2800, taxable: true },
    ],
    noteToClient: "Full HVAC replacement with premium unit. Includes electrical panel upgrade for compatibility.",
    internalNote: "Coordinate with electrical team for panel upgrade timing.",
    terms: "50% deposit required upon approval. Remainder due on completion.", taxRate: 7.5, depositAmount: 5247.50,
    activity: [
      { id: 1, date: "Feb 28, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 01, 2026 11:30", action: "Estimate sent", detail: "Sent to sarah.w@gmail.com", icon: "send" },
      { id: 3, date: "Mar 15, 2026 16:00", action: "Status changed", detail: "Marked as Won", icon: "check_circle" },
    ],
  },
};

type TabKey = "details" | "items" | "deposits" | "activity";
type NotesTabKey = "client" | "internal";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "items", label: "Items" },
  { key: "deposits", label: "Deposits" },
  { key: "activity", label: "Activity" },
];

// ═══════════════════════════════════════════════════════════════════════════════
export function EstimateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const initial = mockEstimates[id || ""] || mockEstimates["1"];
  const [estimate, setEstimate] = useState<EstimateData>({ ...initial });
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [notesTab, setNotesTab] = useState<NotesTabKey>("client");
  const [statusOpen, setStatusOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const subtotal = estimate.items.reduce((s, i) => s + i.amount, 0);
  const taxableAmount = estimate.items.filter(i => i.taxable).reduce((s, i) => s + i.amount, 0);
  const taxAmount = taxableAmount * (estimate.taxRate / 100);
  const total = subtotal + taxAmount;

  const removeItem = (itemId: number) => setEstimate(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));

  const catalogItems = [
    { id: 101, name: "Heat Pump Repair or Service", price: 285, cost: 120 },
    { id: 102, name: "SEER Heat Pump Condenser Unit", price: 3200, cost: 1800 },
    { id: 103, name: "Copper Piping Installation", price: 18.50, cost: 6.75 },
    { id: 104, name: "General Labor - Technician", price: 95, cost: 45 },
    { id: 105, name: "Thermostat - Smart WiFi", price: 450, cost: 180 },
    { id: 106, name: "Drain Cleaning Service", price: 175, cost: 40 },
    { id: 107, name: "Electrical Panel Upgrade 200A", price: 2800, cost: 1100 },
  ];

  // ── Renderers ────────────────────────────────────────────────────────────────

  const renderDetailsTab = () => (
    <div className="flex gap-4 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Row 1: Client Info | Estimate Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* Client Info */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Client</h3>
              <button className="text-[#9CA3AF] hover:text-[#6B7280]">
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <div className="space-y-2">
              <button onClick={() => navigate("/clients/1")} className="text-[14px] text-[#4A6FA5] hover:underline text-left" style={{ fontWeight: 600 }}>
                {estimate.clientName}
              </button>
              <div className="flex flex-col gap-1.5 text-[13px] text-[#374151]">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>mail</span>
                  <a href={`mailto:${estimate.clientEmail}`} className="text-[#4A6FA5] hover:underline">{estimate.clientEmail}</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "15px" }}>phone</span>
                  <span>{estimate.clientPhone}</span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <span className="material-icons text-[#9CA3AF] mt-0.5" style={{ fontSize: "15px" }}>location_on</span>
                  <span className="whitespace-pre-line leading-relaxed">{estimate.clientAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estimate Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimate Details</h3>
              <button className="text-[#9CA3AF] hover:text-[#6B7280]">
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Estimate #", value: estimate.estimateNumber },
                { label: "Name", value: estimate.estimateName || "—" },
                { label: "Date Created", value: estimate.dateCreated },
                { label: "Expiration", value: estimate.expirationDate },
                { label: "Sent Date", value: estimate.sentDate },
                { label: "Team Member", value: estimate.teamMember || "—" },
                { label: "Source", value: estimate.source || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <div className="text-[11px] text-[#9CA3AF]">{label}</div>
                  <div className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Service Address | Linked Job */}
        <div className="grid grid-cols-2 gap-4">
          {/* Service Address */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Service Address</h3>
              <button className="text-[#9CA3AF] hover:text-[#6B7280]">
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <div className="flex items-start gap-2 text-[13px] text-[#374151]">
              <span className="material-icons text-[#6B7280] mt-0.5" style={{ fontSize: "16px" }}>location_on</span>
              <span className="whitespace-pre-line leading-relaxed">{estimate.serviceAddress}</span>
            </div>
          </div>

          {/* Linked Job */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Linked Job</h3>
              <button className="text-[#9CA3AF] hover:text-[#6B7280]">
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            {estimate.job ? (
              <button
                onClick={() => estimate.jobId && navigate(`/jobs/${estimate.jobId}`)}
                className="flex items-center gap-2 text-[13px] text-[#4A6FA5] hover:underline text-left"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
                {estimate.job}
              </button>
            ) : (
              <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                + Link to job
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Notes rail ── */}
      <div className="w-[260px] shrink-0 flex flex-col gap-4">
        {/* Notes panel with sub-tabs */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden">
          <div className="flex border-b border-[#E5E7EB]">
            {([["client", "Note to Client"], ["internal", "Internal"]] as [NotesTabKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setNotesTab(key)}
                className={`flex-1 px-3 py-3 text-[12px] transition-colors ${
                  notesTab === key
                    ? "text-[#4A6FA5] border-b-2 border-[#4A6FA5] bg-white"
                    : "text-[#546478] hover:text-[#1A2332] hover:bg-[#F9FAFB]"
                }`}
                style={{ fontWeight: notesTab === key ? 600 : 500 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-4 flex-1">
            {notesTab === "client" ? (
              <>
                <textarea
                  value={estimate.noteToClient}
                  onChange={(e) => setEstimate(prev => ({ ...prev, noteToClient: e.target.value }))}
                  className="w-full text-[13px] text-[#374151] leading-relaxed resize-none border-none focus:outline-none min-h-[100px]"
                  placeholder="Note visible to client..."
                />
                <button className="text-[12px] text-[#4A6FA5] hover:underline mt-1" style={{ fontWeight: 500 }}>+ Add note</button>
              </>
            ) : (
              <>
                <textarea
                  value={estimate.internalNote}
                  onChange={(e) => setEstimate(prev => ({ ...prev, internalNote: e.target.value }))}
                  className="w-full text-[13px] text-[#374151] leading-relaxed resize-none border-none focus:outline-none min-h-[100px]"
                  placeholder="Internal note (not visible to client)..."
                />
                <button className="text-[12px] text-[#4A6FA5] hover:underline mt-1" style={{ fontWeight: 500 }}>+ Add note</button>
              </>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Terms & Conditions</span>
          </div>
          <div className="p-4">
            <textarea
              value={estimate.terms}
              onChange={(e) => setEstimate(prev => ({ ...prev, terms: e.target.value }))}
              className="w-full text-[13px] text-[#374151] leading-relaxed resize-none border-none focus:outline-none min-h-[80px]"
              placeholder="Terms and conditions..."
            />
            <button className="text-[12px] text-[#4A6FA5] hover:underline mt-1" style={{ fontWeight: 500 }}>Edit terms</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderItemsTab = () => (
    <div className="flex flex-col gap-4">
      {/* Line Items */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Line Items</h3>
          <button
            onClick={() => setAddItemOpen(true)}
            className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
            Add Item
          </button>
        </div>

        {estimate.items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>receipt_long</span>
            </div>
            <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
            <button onClick={() => setAddItemOpen(true)} className="text-[13px] text-[#4A6FA5] hover:underline mt-1 block mx-auto" style={{ fontWeight: 500 }}>
              + Add item
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    {["Item", "Qty", "Unit Price", "Cost", "Amount", "Taxable", ""].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[50px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item) => (
                    <tr key={item.id} className="border-b border-[#DDE3EE] hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3">
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{item.quantity}</td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#9CA3AF]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.cost)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.amount)}</td>
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

            {/* Totals */}
            <div className="border-t border-[#DDE3EE] px-5 py-4 bg-[#FAFBFC]">
              <div className="flex justify-end">
                <div className="space-y-2 min-w-[280px]">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#546478]">Subtotal:</span>
                    <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#546478]">Taxable:</span>
                    <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#546478]">Tax ({estimate.taxRate}%):</span>
                    <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#DDE3EE]">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span>
                    <span className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Attachments + Signatures */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>attach_file</span>
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Attachments</h3>
            </div>
            <button className="px-3 py-1.5 bg-[#4A6FA5] text-white text-[13px] rounded-lg hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>cloud_upload</span>
              Upload
            </button>
          </div>
          <div className="px-5 py-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-2">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "24px" }}>cloud_upload</span>
            </div>
            <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>+ Upload files</button>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>draw</span>
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Signatures</h3>
            </div>
            <button className="px-3 py-1.5 bg-[#4A6FA5] text-white text-[13px] rounded-lg hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
              <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              Sign
            </button>
          </div>
          <div className="px-5 py-8 flex items-center justify-center">
            <div className="text-[13px] text-[#9CA3AF]">No signatures found</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepositsTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>account_balance_wallet</span>
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposits</h3>
        </div>
        <button className="px-3 py-1.5 border border-[#DDE3EE] text-[13px] text-[#1A2332] rounded-lg hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
          Add payment
        </button>
      </div>
      <div className="px-5 py-10 flex flex-col items-center justify-center">
        {(estimate.depositAmount ?? 0) > 0 ? (
          <div className="text-center">
            <div className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(estimate.depositAmount ?? 0)}</div>
            <div className="text-[13px] text-[#546478]">Deposit received</div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>payments</span>
            </div>
            <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>+ Add payment</button>
          </>
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Activity</h3>
      </div>
      <div className="divide-y divide-[#F3F4F6]">
        {estimate.activity.map(entry => (
          <div key={entry.id} className="flex items-start gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-full bg-[#EEF3FA] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>{entry.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{entry.action}</div>
              <div className="text-[12px] text-[#8899AA]">{entry.detail}</div>
            </div>
            <div className="text-[12px] text-[#9CA3AF] whitespace-nowrap">{entry.date}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F5F7FA] min-h-full">
      {/* Top nav bar */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="px-6 h-11 flex items-center gap-3">
          <button
            onClick={() => navigate("/estimates")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#546478] hover:text-[#1A2332] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Estimates
          </button>
          <span className="text-[#DDE3EE]">/</span>
          <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>
            #{estimate.estimateNumber}{estimate.estimateName ? ` · ${estimate.estimateName}` : ""}
          </span>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status pill with dropdown */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-opacity hover:opacity-80"
              style={{ fontWeight: 600, color: statusColors[estimate.status], backgroundColor: statusBg[estimate.status] }}
            >
              {estimate.status}
              <span className="material-icons" style={{ fontSize: "14px" }}>expand_more</span>
            </button>
            {statusOpen && (
              <div className="absolute left-0 top-[calc(100%+4px)] w-[190px] bg-white border border-[#DDE3EE] rounded-xl shadow-lg z-40 py-1.5">
                {primaryStatuses.map(s => (
                  <button key={s} onClick={() => { setEstimate(prev => ({ ...prev, status: s })); setStatusOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === estimate.status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                    style={{ fontWeight: s === estimate.status ? 600 : 400, color: s === estimate.status ? "#4A6FA5" : "#1A2332" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s] }} />
                    {s}
                    {s === estimate.status && <span className="material-icons ml-auto" style={{ fontSize: "16px", color: "#4A6FA5" }}>check</span>}
                  </button>
                ))}
                <div className="mx-3 my-1 border-t border-[#F3F4F6]" />
                <div className="px-3.5 pb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontWeight: 600 }}>Other</span>
                </div>
                {otherStatuses.map(s => (
                  <button key={s} onClick={() => { setEstimate(prev => ({ ...prev, status: s })); setStatusOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors ${s === estimate.status ? "bg-[#EEF3FA]" : "hover:bg-[#F5F7FA]"}`}
                    style={{ fontWeight: s === estimate.status ? 600 : 400, color: s === estimate.status ? "#4A6FA5" : "#1A2332" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[s] }} />
                    {s}
                    {s === estimate.status && <span className="material-icons ml-auto" style={{ fontSize: "16px", color: "#4A6FA5" }}>check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[#DDE3EE]">·</span>
          <span className="text-[13px] text-[#546478]">{estimate.clientName}</span>
          {estimate.job && (
            <>
              <span className="text-[#DDE3EE]">·</span>
              <button onClick={() => estimate.jobId && navigate(`/jobs/${estimate.jobId}`)} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                {estimate.job}
              </button>
            </>
          )}
        </div>

        {/* Actions kebab */}
        <KebabMenu triggerClassName="w-9 h-9 border border-[#DDE3EE] rounded-lg bg-white flex items-center justify-center hover:bg-[#F5F7FA]">
          <KebabItem icon="send">Send</KebabItem>
          <KebabItem icon="visibility">Preview</KebabItem>
          <KebabItem icon="download">Download PDF</KebabItem>
          <KebabSeparator />
          <KebabItem icon="content_copy">Duplicate</KebabItem>
          <KebabItem icon="receipt">Copy to Invoice</KebabItem>
          <KebabItem icon="work">Copy to Job</KebabItem>
          <KebabSeparator />
          <KebabItem icon="archive">Archive</KebabItem>
          <KebabItem icon="print">Print</KebabItem>
          <KebabSeparator />
          <KebabItem icon="delete" destructive>Delete</KebabItem>
        </KebabMenu>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3.5 text-[13px] border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#4A6FA5] text-[#4A6FA5]"
                  : "border-transparent text-[#546478] hover:text-[#1A2332]"
              }`}
              style={{ fontWeight: activeTab === tab.key ? 600 : 500 }}
            >
              {tab.label}
              {tab.key === "items" && estimate.items.length > 0 && (
                <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-[#EEF3FA] text-[#4A6FA5]" style={{ fontWeight: 600 }}>
                  {estimate.items.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "items" && renderItemsTab()}
        {activeTab === "deposits" && renderDepositsTab()}
        {activeTab === "activity" && renderActivityTab()}
      </div>

      {/* Add Item Modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddItemOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDE3EE]">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Add Item</h2>
              <button onClick={() => setAddItemOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
              {catalogItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    const newItem: LineItem = {
                      id: Math.max(...estimate.items.map(i => i.id), 0) + 1,
                      name: item.name, description: "", quantity: 1,
                      price: item.price, cost: item.cost, amount: item.price, taxable: true,
                    };
                    setEstimate(prev => ({ ...prev, items: [...prev.items, newItem] }));
                    setAddItemOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] text-left"
                >
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
