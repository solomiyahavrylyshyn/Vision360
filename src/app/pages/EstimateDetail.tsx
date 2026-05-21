import { useState, useRef, useEffect, useCallback } from "react";
import { getStoredBrandLogo, BRAND_LOGO_EVENT } from "../utils/brandTheme";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs, TabSettingsButton } from "../components/ui/detail-tabs";
import { PlusIcon } from "../components/ui/plus-icon";
import { DocumentPreview } from "../components/DocumentPreview";
import installHeatingSystem1Photo from "../../assets/documents/33702-install-heating-system-1.jpg";
import installHeatingSystemPhoto from "../../assets/documents/33702-install-heating-system.jpg";
import installDuctsVentsPhoto from "../../assets/documents/33805-install-ducts-vents.jpg";
import installAc33841Photo from "../../assets/documents/33841-install-ac.jpg";
import cuPhoto from "../../assets/documents/33897-cu.jpg";
import installWaterHeaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import outdoorElectricalPanelPhoto from "../../assets/documents/34610-install-outlet-outdoor-electrical-panel.jpg";
import installAcPhoto from "../../assets/documents/34689-install-ac.jpg";
import installWaterHeaterTanklessPhoto from "../../assets/documents/34689-install-water-heater-tankless.jpg";
import job87970Photo from "../../assets/documents/87970-20241208-113711.png";
import job44644Photo from "../../assets/documents/44644-img-20241210-123749.png";

// ─── Types ───────────────────────────────────────────────────────────────────
type EstimateStatus =
  | "Draft" | "Sent" | "Viewed" | "Approved" | "Rejected" | "Expired" | "Archived";

interface LineItem {
  id: number; name: string; description: string;
  quantity: number; price: number; cost: number; amount: number;
  taxable: boolean; optional?: boolean;
}

interface MockPhoto { id: number; tag: "Before" | "After"; group: "A" | "B"; color: string; }

interface EstimateData {
  id: number; estimateNumber: string; estimateName: string;
  clientName: string; clientEmail: string; clientPhone: string;
  clientAddress: string; serviceAddress: string;
  dateCreated: string; expirationDate: string; sentDate: string;
  status: EstimateStatus; teamMember: string; job: string; jobId: number | null;
  items: LineItem[]; notes: string; internalNotes: string; taxRate: number;
  depositRequired: boolean; depositType: "amount" | "percentage"; depositValue: number;
  photos?: MockPhoto[];
  activity: { id: number; date: string; action: string; detail: string; icon: string }[];
}

// ─── Status colours ───────────────────────────────────────────────────────────
const statusColors: Record<EstimateStatus, string> = {
  Draft: "#7C3AED", Sent: "#1E40AF", Viewed: "#92400E",
  Approved: "#166534", Rejected: "#DC2626", Expired: "#6B7280", Archived: "#FFFFFF",
};
const statusBg: Record<EstimateStatus, string> = {
  Draft: "#EDE9FE", Sent: "#DBEAFE", Viewed: "#FEF3C7",
  Approved: "#DCFCE7", Rejected: "#FEE2E2", Expired: "#F3F4F6", Archived: "#1F2937",
};
const primaryStatuses: EstimateStatus[] = [
  "Draft", "Sent", "Viewed", "Approved", "Rejected", "Expired",
];
const otherStatuses: EstimateStatus[] = ["Archived"];

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockEstimates: Record<string, EstimateData> = {
  "1": {
    id: 1, estimateNumber: "10245-E02", estimateName: "", clientName: "Travis Jones",
    clientEmail: "cerb04@yahoo.com", clientPhone: "(863) 225-3254",
    clientAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    serviceAddress: "8377 Standish Bend Dr Unit 1\nTampa, FL 33615",
    dateCreated: "Mar 30, 2026", expirationDate: "Apr 30, 2026", sentDate: "Not Sent",
    status: "Draft", teamMember: "Marek Stroz", job: "10245-J01: AC Estimate", jobId: 1,
    items: [], notes: "", internalNotes: "",
    taxRate: 0, depositRequired: false, depositType: "amount", depositValue: 0,
    activity: [
      { id: 1, date: "Mar 30, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
    ],
  },
  "5": {
    id: 5, estimateNumber: "10246-E01", estimateName: "Option A", clientName: "John Doe",
    clientEmail: "john.doe@email.com", clientPhone: "(555) 123-4567",
    clientAddress: "1250 NW 24th St\nMiami, FL 33142",
    serviceAddress: "1250 NW 24th St\nMiami, FL 33142",
    dateCreated: "Mar 02, 2026", expirationDate: "Apr 02, 2026", sentDate: "Mar 03, 2026",
    status: "Approved", teamMember: "Marek Stroz", job: "10246-J01: Bathroom Remodel", jobId: 4,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Unit", description: "High efficiency outdoor unit", quantity: 1, price: 3200, cost: 1800, amount: 3200, taxable: true },
      { id: 2, name: "General Labor - Technician", description: "Technician labor (hourly)", quantity: 2, price: 95, cost: 45, amount: 190, taxable: false },
      { id: 3, name: "Thermostat - Smart WiFi", description: "Smart WiFi Thermostat", quantity: 1, price: 110, cost: 65, amount: 110, taxable: true },
    ],
    notes: "Client prefers morning installation window.", internalNotes: "",
    taxRate: 7.5, depositRequired: true, depositType: "amount", depositValue: 850,
    activity: [
      { id: 1, date: "Mar 02, 2026 08:30", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 03, 2026 10:15", action: "Estimate sent", detail: "Sent to john.doe@email.com", icon: "send" },
      { id: 3, date: "Mar 10, 2026 14:00", action: "Estimate approved", detail: "Customer approved the estimate", icon: "check_circle" },
    ],
  },
  "6": {
    id: 6, estimateNumber: "10248-E01", estimateName: "HVAC Replacement", clientName: "Sarah Williams",
    clientEmail: "sarah.w@gmail.com", clientPhone: "(407) 555-0198",
    clientAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    serviceAddress: "4521 Pine Grove Ln\nOrlando, FL 32801",
    dateCreated: "Feb 28, 2026", expirationDate: "Mar 28, 2026", sentDate: "Mar 01, 2026",
    status: "Approved", teamMember: "Marek Stroz", job: "10248-J01: HVAC Replacement", jobId: 3,
    items: [
      { id: 1, name: "SEER Heat Pump Condenser Premium", description: "Ultra high efficiency", quantity: 1, price: 4800, cost: 2900, amount: 4800, taxable: true },
      { id: 2, name: "Copper Piping Installation", description: "Per linear foot", quantity: 50, price: 18.50, cost: 6.75, amount: 925, taxable: true },
      { id: 3, name: "General Labor - Technician", description: "Hourly", quantity: 16, price: 95, cost: 45, amount: 1520, taxable: false },
      { id: 4, name: "Thermostat - Smart WiFi", description: "Ecobee smart thermostat", quantity: 1, price: 450, cost: 180, amount: 450, taxable: true },
      { id: 5, name: "Electrical Panel Upgrade 200A", description: "Panel upgrade", quantity: 1, price: 2800, cost: 1100, amount: 2800, taxable: true },
    ],
    notes: "Coordinate with electrical team for panel upgrade timing.", internalNotes: "",
    taxRate: 7.5, depositRequired: true, depositType: "percentage", depositValue: 50,
    photos: [
      { id: 1, tag: "Before", group: "A", color: "#CBD5E1" },
      { id: 2, tag: "Before", group: "A", color: "#94A3B8" },
      { id: 3, tag: "Before", group: "A", color: "#CBD5E1" },
      { id: 4, tag: "Before", group: "A", color: "#94A3B8" },
      { id: 5, tag: "After",  group: "B", color: "#86EFAC" },
      { id: 6, tag: "After",  group: "B", color: "#4ADE80" },
      { id: 7, tag: "After",  group: "B", color: "#86EFAC" },
      { id: 8, tag: "After",  group: "B", color: "#4ADE80" },
    ],
    activity: [
      { id: 1, date: "Feb 28, 2026 09:00", action: "Estimate created", detail: "Created by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Mar 01, 2026 11:30", action: "Estimate sent", detail: "Sent to sarah.w@gmail.com", icon: "send" },
      { id: 3, date: "Mar 15, 2026 16:00", action: "Estimate approved", detail: "Customer approved the estimate", icon: "check_circle" },
    ],
  },
  "7": {
    id: 7, estimateNumber: "10247-E01", estimateName: "Plumbing Repair", clientName: "Mike Rodriguez",
    clientEmail: "mike.r@outlook.com", clientPhone: "(813) 555-0142",
    clientAddress: "1804 W North B St\nTampa, FL 33606",
    serviceAddress: "1804 W North B St\nTampa, FL 33606",
    dateCreated: "Feb 25, 2026", expirationDate: "Mar 27, 2026", sentDate: "Feb 26, 2026",
    status: "Viewed", teamMember: "Marek Stroz", job: "10247-J01: Plumbing Repair", jobId: 5,
    items: [
      { id: 1, name: "Drain Cleaning Service", description: "Clear main drain line", quantity: 1, price: 175, cost: 40, amount: 175, taxable: false },
      { id: 2, name: "Pipe Repair Labor", description: "Technician labor", quantity: 3, price: 95, cost: 45, amount: 285, taxable: false },
      { id: 3, name: "PVC Repair Materials", description: "Pipe, fittings, primer, cement", quantity: 1, price: 390, cost: 140, amount: 390, taxable: true },
    ],
    notes: "Do not walk on the right side — citrus tree planted. Dog on the right side.", internalNotes: "",
    taxRate: 7.5, depositRequired: false, depositType: "amount", depositValue: 0,
    activity: [
      { id: 1, date: "Feb 25, 2026 09:18", action: "Estimate created", detail: "Created from Job-5 by Marek Stroz", icon: "add_circle" },
      { id: 2, date: "Feb 25, 2026 09:18", action: "Technician assigned", detail: "Marek Stroz assigned as estimate technician", icon: "engineering" },
      { id: 3, date: "Feb 26, 2026 10:04", action: "Estimate sent", detail: "Sent to mike.r@outlook.com", icon: "send" },
      { id: 4, date: "Feb 26, 2026 18:42", action: "Customer viewed estimate", detail: "Mike Rodriguez opened the estimate from email link", icon: "visibility" },
      { id: 5, date: "Mar 04, 2026 08:11", action: "Customer viewed estimate again", detail: "Estimate viewed 7 days after it was sent", icon: "visibility" },
      { id: 6, date: "Mar 06, 2026 14:22", action: "Changes requested", detail: "Mike Rodriguez: \"Please add pipe insulation for the main line\"", icon: "edit_note" },
    ],
  },
};

type TabKey = "details" | "deposit" | "activity";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "deposit", label: "Deposit" },
  { key: "activity", label: "Activity" },
];

const catalogItems = [
  { id: 101, name: "Heat Pump Repair or Service", price: 285, cost: 120 },
  { id: 102, name: "SEER Heat Pump Condenser Unit", price: 3200, cost: 1800 },
  { id: 103, name: "Copper Piping Installation", price: 18.50, cost: 6.75 },
  { id: 104, name: "General Labor - Technician", price: 95, cost: 45 },
  { id: 105, name: "Thermostat - Smart WiFi", price: 450, cost: 180 },
  { id: 106, name: "Drain Cleaning Service", price: 175, cost: 40 },
  { id: 107, name: "Electrical Panel Upgrade 200A", price: 2800, cost: 1100 },
];

// ═══════════════════════════════════════════════════════════════════════════════
export function EstimateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const initial = mockEstimates[id || ""] || mockEstimates["1"];
  const [estimate, setEstimate] = useState<EstimateData>({ ...initial });
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [statusOpen, setStatusOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [customerPreviewOpen, setCustomerPreviewOpen] = useState(false);
  const [brandLogo, setBrandLogoState] = useState(() => getStoredBrandLogo());
  const handleBrandLogoChange = useCallback((e: Event) => {
    setBrandLogoState((e as CustomEvent<string>).detail ?? "");
  }, []);
  useEffect(() => {
    window.addEventListener(BRAND_LOGO_EVENT, handleBrandLogoChange);
    return () => window.removeEventListener(BRAND_LOGO_EVENT, handleBrandLogoChange);
  }, [handleBrandLogoChange]);
  interface DocFile { id: string; name: string; size: string; date: string; icon: string; iconColor: string; isImage?: boolean; previewUrl?: string; previewGradient?: string; uploadedBy?: string; category?: string; }
  const [documents, setDocuments] = useState<DocFile[]>([
    { id: "photo-34610", name: "Copy of 34610 Install outlet outdoor electrical panel.jpg", size: "3.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: outdoorElectricalPanelPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33841", name: "Copy of 33841 Install AC.jpg", size: "2.4 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAc33841Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34689-tankless", name: "Copy of 34689 Install Water Heater Tankless.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterTanklessPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34689-ac", name: "Copy of 34689 Install AC.jpg", size: "2.7 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installAcPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-34285", name: "Copy of 34285 Install Water Heater.jpg", size: "1.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installWaterHeaterPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33897", name: "Copy of 33897 cu.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: cuPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33805", name: "Copy of 33805 Install ducts & vents.jpg", size: "2.8 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installDuctsVentsPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33702-1", name: "Copy of 33702 Install heating system (1).jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystem1Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-33702", name: "Copy of 33702 Install heating system.jpg", size: "1.6 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: installHeatingSystemPhoto, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-87970", name: "87970_20241208_113711.png", size: "10.0 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job87970Photo, uploadedBy: "Field Crew", category: "Photos" },
    { id: "photo-44644", name: "44644_IMG_20241210_123749.png", size: "9.5 MB", date: "May 19, 2026", icon: "image", iconColor: "#F59E0B", isImage: true, previewUrl: job44644Photo, uploadedBy: "Field Crew", category: "Photos" },
  ]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [docsPage, setDocsPage] = useState(0);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [docPreviewIdx, setDocPreviewIdx] = useState(0);
  const [docKind, setDocKind] = useState<"photos" | "files">("photos");
  const [noteTab, setNoteTab] = useState<"client" | "internal">("client");
  const DOCS_PER_PAGE = 10; // 5 columns x 2 rows
  const previewFile = documents.find(d => d.id === previewFileId) ?? null;
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toggleDocSelected = (docId: string) => setSelectedDocs(prev => { const n = new Set(prev); n.has(docId) ? n.delete(docId) : n.add(docId); return n; });
  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith("image/");
      const newDoc: DocFile = { id: `upload-${Date.now()}-${file.name}`, name: file.name, size: file.size > 1048576 ? `${(file.size/1048576).toFixed(1)} MB` : `${Math.round(file.size/1024)} KB`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: isImg ? "image" : "insert_drive_file", iconColor: isImg ? "#F59E0B" : "#6B7280", isImage: isImg, uploadedBy: "You", category: isImg ? "Photos" : "Documents" };
      if (isImg) { const reader = new FileReader(); reader.onload = e => setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, previewUrl: e.target?.result as string } : d)); reader.readAsDataURL(file); }
      setDocuments(prev => [newDoc, ...prev]);
    });
  };

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
  const depositAmount = estimate.depositRequired
    ? estimate.depositType === "percentage" ? total * (estimate.depositValue / 100) : estimate.depositValue
    : 0;

  const removeItem = (itemId: number) => setEstimate(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  const photos = estimate.photos || [];
  const totalDocCount = photos.length;

  // ── Customer preview ─────────────────────────────────────────────────────────
  const renderCustomerPreview = () => (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-start justify-center overflow-y-auto px-6 py-8" onClick={() => setCustomerPreviewOpen(false)}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => window.print()}
            className="h-9 px-3 rounded-md bg-white border border-[#D8DEE8] text-[13px] text-[#1A2332] hover:bg-[#F5F7FA] inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>print</span> Print
          </button>
          <button type="button" onClick={() => setCustomerPreviewOpen(false)}
            className="h-9 w-9 rounded-md bg-white border border-[#D8DEE8] text-[#546478] hover:bg-[#F5F7FA] inline-flex items-center justify-center">
            <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
        <div className="bg-white text-[#5F6670] shadow-2xl border border-[#D7DCE3]" style={{ width: 760, minHeight: 980, padding: "32px 28px 44px", fontFamily: "Arial, sans-serif" }}>
          <div className="flex items-start justify-between mb-9">
            <div className="text-[12px] leading-[18px]">
              {brandLogo
                ? <img src={brandLogo} alt="Company logo" className="max-h-[48px] max-w-[160px] object-contain mb-1" />
                : <div style={{ fontWeight: 700 }}>Service Vision</div>
              }
              <div>8377 Standish Bend Dr Tampa FL 33615</div>
              <div style={{ color: "var(--brand-primary, #4A6FA5)" }}>jaamsflying@gmail.com</div>
              <div>(813) 263-0691</div>
            </div>
            <div className="text-right">
              <div className="text-[31px] leading-none tracking-wide text-[#4F5660]" style={{ fontWeight: 800 }}>ESTIMATE</div>
              <div className="grid grid-cols-[100px_120px] gap-x-6 gap-y-1 text-[12px] mt-11">
                <div className="text-right" style={{ fontWeight: 700 }}>Estimate #</div>
                <div className="text-right text-[#7C6A9D]">{estimate.estimateNumber}</div>
                <div className="text-right" style={{ fontWeight: 700 }}>Date</div>
                <div className="text-right text-[#7C6A9D]">{estimate.dateCreated}</div>
                <div className="text-right" style={{ fontWeight: 700 }}>Total</div>
                <div className="text-right text-[#7C6A9D]">${fmt(total)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-14 text-[12px] leading-[18px] mb-6">
            <div>
              <div className="mb-1" style={{ fontWeight: 700 }}>Prepared For:</div>
              <div>{estimate.clientName}</div>
              <div className="whitespace-pre-line">{estimate.clientAddress}</div>
              <div>{estimate.clientPhone}</div>
              <div style={{ color: "var(--brand-primary, #4A6FA5)" }}>{estimate.clientEmail}</div>
            </div>
            <div>
              <div className="mb-1" style={{ fontWeight: 700 }}>Service Location:</div>
              <div className="whitespace-pre-line">{estimate.serviceAddress}</div>
            </div>
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-y-[3px] border-[#4F5660]">
                <th className="text-left py-3 px-2" style={{ fontWeight: 700 }}>Description</th>
                <th className="text-left py-3 px-2 w-[84px]" style={{ fontWeight: 700 }}>QTY</th>
                <th className="text-left py-3 px-2 w-[102px]" style={{ fontWeight: 700 }}>Price</th>
                <th className="text-left py-3 px-2 w-[102px]" style={{ fontWeight: 700 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map(item => (
                <tr key={item.id} className="border-b border-[#E0E3E7]">
                  <td className="py-3 px-2"><div style={{ fontWeight: 700 }}>{item.name}</div>{item.description && <div>{item.description}</div>}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">{item.quantity}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">${fmt(item.price)}</td>
                  <td className="py-3 px-2 text-[#6F6A93]">${fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-[#E0E3E7] mb-16">
            <div className="grid grid-cols-[90px_110px] text-[12px]">
              <div className="py-2 px-2" style={{ fontWeight: 700 }}>Subtotal</div><div className="py-2 px-2 text-right text-[#6F6A93]">${fmt(subtotal)}</div>
              {taxAmount > 0 && <><div className="py-1 px-2" style={{ fontWeight: 700 }}>Tax</div><div className="py-1 px-2 text-right text-[#6F6A93]">${fmt(taxAmount)}</div></>}
              <div className="py-2 px-2" style={{ fontWeight: 700 }}>Total</div><div className="py-2 px-2 text-right text-[#6F6A93]">${fmt(total)}</div>
            </div>
          </div>
          {estimate.notes && <div className="text-[12px]"><div style={{ fontWeight: 700 }}>Notes:</div><div>{estimate.notes}</div></div>}
          <div className="mt-4 text-[11px] text-[#9CA3AF]">Terms &amp; Conditions apply.</div>
          <div className="mt-12 text-center text-[23px] text-[#111827]" style={{ fontWeight: 800 }}>Thank you for your business</div>
        </div>
      </div>
    </div>
  );

  // ── Details tab ──────────────────────────────────────────────────────────────
  const renderDetailsTab = () => (
    <div className="flex gap-4 items-start">

      {/* ── Col 1: Line Items (flex-1) ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-0 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Line Items</h3>
          <button onClick={() => setAddItemOpen(true)}
            className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <PlusIcon className="h-4 w-4" /> Add Item
          </button>
        </div>

        {estimate.items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
              <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "28px" }}>receipt_long</span>
            </div>
            <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
            <button onClick={() => setAddItemOpen(true)} className="text-[13px] text-[#4A6FA5] hover:underline mt-1 block mx-auto" style={{ fontWeight: 500 }}>+ Add item</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    {["Item", "Unit Price", "QTY", "Amount", "Taxable", ""].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[44px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item) => (
                    <tr key={item.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-[#F0F4FA] flex items-center justify-center shrink-0">
                            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "16px" }}>build</span>
                          </div>
                          <div>
                            <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                            {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.price)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]">{item.quantity}</td>
                      <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.amount)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#546478]">{item.taxable ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
                          <span className="material-icons text-[#DC2626]" style={{ fontSize: "16px" }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="border-t border-[#E5E7EB] px-5 py-4 bg-[#FAFBFC]">
              <div className="flex justify-end">
                <div className="space-y-1.5 min-w-[260px]">
                  {[
                    { label: "Subtotal:", value: fmt(subtotal) },
                    { label: "Taxable:", value: fmt(taxableAmount) },
                    { label: `Tax (${estimate.taxRate}%):`, value: fmt(taxAmount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">{label}</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span>
                    <span className="text-[18px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Deposit Required toggle (quick view) */}
            <div className="border-t border-[#E5E7EB] px-5 py-3 flex items-center gap-3 bg-white">
              <button
                type="button"
                onClick={() => { setEstimate(prev => ({ ...prev, depositRequired: !prev.depositRequired })); setActiveTab("deposit"); }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${estimate.depositRequired ? "bg-[#22C55E]" : "bg-[#D1D5DB]"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${estimate.depositRequired ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <span className="text-[13px] text-[#546478]">
                Deposit Required
                {estimate.depositRequired && <span className="ml-2 text-[#22C55E]" style={{ fontWeight: 500 }}>— ${fmt(depositAmount)}</span>}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Col 2: Documents (Photos / Files) with inline preview ── */}
      {(() => {
        const photoDocs = documents.filter(d => d.isImage);
        const fileDocs = documents.filter(d => !d.isImage);
        const list = docKind === "photos" ? photoDocs : fileDocs;
        const safeIdx = Math.min(docPreviewIdx, Math.max(0, list.length - 1));
        const current = list[safeIdx];
        return (
          <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center gap-2">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                Documents <span className="text-[#9CA3AF]" style={{ fontWeight: 500 }}>({documents.length})</span>
              </h3>
              <div className="flex-1" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 flex items-center gap-1.5 border border-[#E5E7EB] bg-white hover:bg-[#F5F7FA] text-[#546478] rounded-md text-[13px] transition-colors"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                Upload
              </button>
            </div>

            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFilesAdded(e.target.files)} />

            {/* Sub-tabs: Photos / Files */}
            <div className="flex border-b border-[#E5E7EB] px-5">
              {[
                { key: "photos" as const, label: `Photos (${photoDocs.length})` },
                { key: "files" as const,  label: `Files (${fileDocs.length})` },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setDocKind(t.key); setDocPreviewIdx(0); }}
                  className={`relative py-2.5 px-1 mr-5 text-[13px] transition-colors ${docKind === t.key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"}`}
                  style={{ fontWeight: docKind === t.key ? 600 : 500 }}
                >
                  {t.label}
                  {docKind === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#4A6FA5] rounded-full" />}
                </button>
              ))}
            </div>

            {/* Inline preview */}
            {list.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <span className="material-icons text-[#D1D5DB] mb-2" style={{ fontSize: "40px" }}>folder_open</span>
                <div className="text-[13px] text-[#9CA3AF]">No {docKind} yet</div>
                <button onClick={() => fileInputRef.current?.click()} className="text-[13px] text-[#4A6FA5] hover:underline mt-1" style={{ fontWeight: 500 }}>+ Upload</button>
              </div>
            ) : (
              <>
                <div className="relative bg-[#FAFBFC] p-4 flex items-center justify-center" style={{ minHeight: "300px" }}>
                  {/* prev arrow */}
                  <button
                    onClick={() => setDocPreviewIdx(i => (i - 1 + list.length) % list.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors"
                    title="Previous"
                  >
                    <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_left</span>
                  </button>

                  {/* main image / file */}
                  <div className="relative w-full max-w-[520px] aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#E5E7EB] flex items-center justify-center">
                    {current?.isImage && current.previewUrl ? (
                      <img src={current.previewUrl} alt={current.name} className="w-full h-full object-cover" />
                    ) : current ? (
                      <div className="flex flex-col items-center gap-2 text-center px-6">
                        <span className="material-icons" style={{ fontSize: "64px", color: current.iconColor, opacity: 0.85 }}>{current.icon}</span>
                        <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{current.name}</div>
                        <div className="text-[12px] text-[#9CA3AF]">{current.size} · {current.date}</div>
                      </div>
                    ) : null}

                    {/* expand button */}
                    {current && (
                      <button
                        onClick={() => setPreviewFileId(current.id)}
                        className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors"
                        title="Open full preview"
                      >
                        <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>open_in_full</span>
                      </button>
                    )}

                    {/* "After" / category tag overlay */}
                    {current?.category && (
                      <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-[#16A34A]" style={{ fontWeight: 600 }}>
                        {current.category === "Photos" ? "After" : current.category}
                      </span>
                    )}
                    {/* page counter */}
                    <span className="absolute right-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-black/60" style={{ fontWeight: 500 }}>
                      {safeIdx + 1} / {list.length}
                    </span>
                  </div>

                  {/* next arrow */}
                  <button
                    onClick={() => setDocPreviewIdx(i => (i + 1) % list.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F5F7FA] flex items-center justify-center transition-colors"
                    title="Next"
                  >
                    <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>chevron_right</span>
                  </button>
                </div>

                {/* Caption */}
                {current && (
                  <div className="px-4 py-2 border-t border-[#F3F4F6] text-[12px] text-[#6B7280] truncate" title={current.name}>
                    {current.name}
                  </div>
                )}

                {/* Thumbnails strip (2 rows) */}
                <div className="p-3 border-t border-[#F3F4F6]">
                  <div className="grid grid-cols-5 gap-1.5">
                    {list.slice(docsPage * DOCS_PER_PAGE, docsPage * DOCS_PER_PAGE + DOCS_PER_PAGE).map((file) => {
                      const globalIdx = list.indexOf(file);
                      const isActive = globalIdx === safeIdx;
                      return (
                        <button
                          key={file.id}
                          onClick={() => setDocPreviewIdx(globalIdx)}
                          className={`relative aspect-[4/3] rounded-md overflow-hidden border transition-all ${isActive ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/40" : "border-[#E5E7EB] hover:border-[#C5D5EC]"}`}
                          title={file.name}
                        >
                          {file.isImage && file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: file.iconColor + "12" }}>
                              <span className="material-icons" style={{ fontSize: "22px", color: file.iconColor }}>{file.icon}</span>
                            </div>
                          )}
                          {file.category && (
                            <span className="absolute left-1 bottom-1 px-1 rounded text-[9px] text-white bg-[#16A34A]/80" style={{ fontWeight: 600 }}>
                              {file.category === "Photos" ? "A" : file.category.charAt(0)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {list.length > DOCS_PER_PAGE && (
                    <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#6B7280]">
                      <button
                        onClick={() => setDocsPage(p => Math.max(0, p - 1))}
                        disabled={docsPage === 0}
                        className="px-2 py-1 disabled:opacity-40 hover:text-[#374151]"
                      >
                        Prev
                      </button>
                      <span className="tabular-nums">{docsPage + 1} / {Math.ceil(list.length / DOCS_PER_PAGE)}</span>
                      <button
                        onClick={() => setDocsPage(p => Math.min(Math.ceil(list.length / DOCS_PER_PAGE) - 1, p + 1))}
                        disabled={docsPage >= Math.ceil(list.length / DOCS_PER_PAGE) - 1}
                        className="px-2 py-1 disabled:opacity-40 hover:text-[#374151]"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Col 3: Notes (narrow, sticky-style above the fold) ── */}
      <div className="w-[280px] shrink-0 flex flex-col gap-4">

        {/* Notes card with Client/Internal sub-tabs */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex border-b border-[#E5E7EB] px-4">
            {[
              { key: "client" as const, label: "Note to Client" },
              { key: "internal" as const, label: "Internal" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setNoteTab(t.key)}
                className={`relative py-3 px-1 mr-4 text-[13px] transition-colors ${noteTab === t.key ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#374151]"}`}
                style={{ fontWeight: noteTab === t.key ? 600 : 500 }}
              >
                {t.label}
                {noteTab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#4A6FA5] rounded-full" />}
              </button>
            ))}
          </div>
          {noteTab === "client" ? (
            <div className="p-4 flex flex-col gap-2.5">
              {estimate.notes ? (
                <div className="text-[13px] text-[#374151] leading-relaxed">{estimate.notes}</div>
              ) : (
                <div className="text-[12px] text-[#9CA3AF]">No note for this estimate.</div>
              )}
              <button className="self-start inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "14px" }}>edit</span>
                Edit note
              </button>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Per-estimate notes only. Defaults like "Thank you" live in{" "}
                <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=estimates")}>Settings</span>.
              </p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2.5">
              <textarea
                value={estimate.internalNotes}
                onChange={(e) => setEstimate(prev => ({ ...prev, internalNotes: e.target.value }))}
                className="w-full text-[13px] text-[#374151] leading-relaxed resize-none border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#4A6FA5] p-2.5 min-h-[100px]"
                placeholder="Private notes — e.g. 'Dog on right side'..."
              />
              <p className="text-[11px] text-[#9CA3AF]">
                Manage defaults in{" "}
                <span className="text-[#4A6FA5] cursor-pointer hover:underline" onClick={() => navigate("/settings?section=estimates")}>Settings → Estimate Preferences</span>
              </p>
            </div>
          )}
        </div>

        {/* Signature */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB]">
            <h3 className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Customer Signature</h3>
            <span className="text-[11px] text-[#9CA3AF]">Display only</span>
          </div>
          {estimate.status === "Approved" ? (
            <div className="px-4 py-3 flex flex-col items-center gap-1.5">
              <div className="w-full h-[60px] rounded-md border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center">
                <span className="text-[20px] text-[#4A6FA5] italic" style={{ fontFamily: "cursive", opacity: 0.7 }}>
                  {estimate.clientName.split(" ")[0]}
                </span>
              </div>
              <div className="text-[10px] text-[#9CA3AF]">Signed by {estimate.clientName}</div>
            </div>
          ) : (
            <div className="px-4 py-4 flex flex-col items-center gap-1.5">
              <div className="w-full h-[60px] rounded-md border border-dashed border-[#D1D5DB] bg-[#FAFAFA] flex items-center justify-center gap-1.5">
                <span className="material-icons text-[#D1D5DB]" style={{ fontSize: "18px" }}>draw</span>
                <span className="text-[12px] text-[#9CA3AF]">Awaiting signature</span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] text-center">Customer signs from their estimate link</div>
            </div>
          )}
        </div>
      </div>

      <DocumentPreview
        file={previewFile}
        onClose={() => setPreviewFileId(null)}
        onRename={(id, newName) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d))}
        onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
      />
    </div>
  );

  // ── Deposit tab ───────────────────────────────────────────────────────────────
  const renderDepositTab = () => (
    <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposit Settings</h3>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-[#546478]">Deposit Required</span>
              <button type="button"
                onClick={() => setEstimate(prev => ({ ...prev, depositRequired: !prev.depositRequired }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${estimate.depositRequired ? "bg-[#22C55E]" : "bg-[#D1D5DB]"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${estimate.depositRequired ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          {estimate.depositRequired ? (
            <>
              <p className="text-[13px] text-[#546478] mb-5">A deposit is required to secure your project and schedule the work.</p>
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Type</label>
                <select value={estimate.depositType}
                  onChange={(e) => setEstimate(prev => ({ ...prev, depositType: e.target.value as "amount" | "percentage" }))}
                  className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white">
                  <option value="percentage">Percentage of Total</option>
                  <option value="amount">Fixed Dollar Amount</option>
                </select>
              </div>
              {estimate.depositType === "percentage" ? (
                <div className="grid grid-cols-2 gap-4 mb-1">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Percentage</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.01" value={estimate.depositValue}
                        onChange={(e) => setEstimate(prev => ({ ...prev, depositValue: Number(e.target.value) || 0 }))}
                        className="w-full pl-4 pr-8 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">$</span>
                      <input type="text" readOnly value={fmt(depositAmount)}
                        className="w-full pl-7 pr-4 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-[#F9FAFB] cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-1">
                  <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Deposit Amount</label>
                  <div className="relative w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[13px]">$</span>
                    <input type="number" min="0" step="0.01" value={estimate.depositValue}
                      onChange={(e) => setEstimate(prev => ({ ...prev, depositValue: Number(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-4 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5]" />
                  </div>
                </div>
              )}
              {estimate.depositType === "percentage" && total > 0 && (
                <div className="text-[12px] text-[#9CA3AF] mb-5">{estimate.depositValue}% of Total (${fmt(total)})</div>
              )}
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Due Upon</label>
                <select className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white">
                  <option>Approval</option>
                  <option>Scheduling</option>
                  <option>Start of Work</option>
                </select>
              </div>
              <div className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 flex gap-3">
                <span className="material-icons text-[#3B82F6] mt-0.5 shrink-0" style={{ fontSize: "18px" }}>info</span>
                <div>
                  <div className="text-[13px] text-[#1E40AF] mb-1" style={{ fontWeight: 600 }}>How it works</div>
                  <div className="text-[12px] text-[#1E40AF] leading-relaxed">
                    When this estimate is approved, the deposit will be recorded and applied to your total balance.
                    The remaining balance will be due upon completion unless otherwise agreed.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#9CA3AF] mt-3">Enable "Deposit Required" to request a deposit before work begins.</p>
          )}
        </div>
      </div>

      <div className="w-[280px] shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Deposit Summary</h3>
          </div>
          {estimate.depositRequired ? (
            <>
              <div className="mx-4 mt-4 mb-4 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
                <div className="text-[12px] text-[#15803D] mb-0.5" style={{ fontWeight: 600 }}>Deposit Due Now</div>
                <div className="text-[12px] text-[#15803D] mb-1">({estimate.depositType === "percentage" ? `${estimate.depositValue}%` : "Fixed"} of Total)</div>
                <div className="text-[22px] text-[#15803D]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(depositAmount)}</div>
              </div>
              <div className="px-5 pb-4 space-y-2 border-b border-[#E5E7EB]">
                {[
                  { label: "Subtotal", value: `$${fmt(subtotal)}` },
                  { label: "Taxable", value: `$${fmt(taxableAmount)}` },
                  { label: `Tax (${estimate.taxRate}%)`, value: `$${fmt(taxAmount)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[13px]">
                    <span className="text-[#546478]">{label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total</span>
                  <span className="text-[15px] text-[#4A6FA5]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
                {[
                  { icon: "task_alt", color: "#22C55E", title: "Secure Your Project", desc: "Your project is scheduled once the deposit is received." },
                  { icon: "account_balance_wallet", color: "#3B82F6", title: "Applied to Balance", desc: "Your deposit will be applied to your total balance." },
                  { icon: "tune", color: "#A855F7", title: "Flexible Terms", desc: "Final payment due upon completion unless otherwise agreed." },
                ].map(({ icon, color, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <span className="material-icons mt-0.5 shrink-0" style={{ fontSize: "16px", color }}>{icon}</span>
                    <div>
                      <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>{title}</div>
                      <div className="text-[11px] text-[#9CA3AF] leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4">
                <button className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-md text-[14px] transition-colors" style={{ fontWeight: 600 }}>
                  Record Deposit
                </button>
                <div className="text-center text-[11px] text-[#9CA3AF] mt-2">This deposit will be applied to your total balance.</div>
              </div>
            </>
          ) : (
            <div className="px-5 py-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "24px" }}>account_balance_wallet</span>
              </div>
              <div className="text-[13px] text-[#9CA3AF]">Enable deposit to see summary</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Activity tab ──────────────────────────────────────────────────────────────
  const renderActivityTab = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Activity</h3>
        {estimate.status === "Approved" && (
          <button
            onClick={() => { navigate(`/invoices/new?fromEstimate=${estimate.id}`); }}
            className="h-8 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-lg text-[13px] inline-flex items-center gap-1.5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "15px" }}>receipt</span>
            Create Invoice
          </button>
        )}
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
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2 text-[13px] text-[#546478]">
        <button onClick={() => navigate("/estimates")}
          className="inline-flex items-center gap-1 text-[#4A6FA5] hover:text-[#3d5a85] transition-colors" style={{ fontWeight: 500 }}>
          <span className="material-icons" style={{ fontSize: "16px" }}>arrow_back</span>
          Back to Estimates
        </button>
        <span className="text-[#D1D5DB]">/</span>
        <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>#{estimate.estimateNumber}</span>
      </div>

      {/* White card */}
      <div className="mx-6 mb-6 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-6">
            {/* Left: name + contact info */}
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-[20px] text-[#1A2332] leading-[27px]" style={{ fontWeight: 700 }}>
                {estimate.estimateName || `Estimate #${estimate.estimateNumber}`}
              </h1>
              {/* Client + phone + email + address + job inline row */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button onClick={() => navigate("/clients/1")} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>person</span>
                  {estimate.clientName}
                </button>
                {estimate.clientPhone && (
                  <a href={`tel:${estimate.clientPhone}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors ml-0.5" title={estimate.clientPhone}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>phone</span>
                  </a>
                )}
                {estimate.clientEmail && (
                  <a href={`mailto:${estimate.clientEmail}`} className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#4A6FA5] transition-colors" title={estimate.clientEmail}>
                    <span className="material-icons" style={{ fontSize: "15px" }}>mail</span>
                  </a>
                )}
                <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                <span className="flex items-center gap-1 text-[14px] text-[#374151]">
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>location_on</span>
                  {estimate.serviceAddress.replace("\n", ", ")}
                </span>
                {estimate.job && (
                  <>
                    <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                    <button onClick={() => estimate.jobId && navigate(`/jobs/${estimate.jobId}`)} className="flex items-center gap-1.5 text-[14px] text-[#4A6FA5] hover:underline transition-colors" style={{ fontWeight: 500 }}>
                      <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
                      {estimate.job}
                    </button>
                  </>
                )}
              </div>
              {/* Metadata strip — all estimate metadata + edit pencil at the end */}
              <div className="flex items-center gap-0.5 flex-wrap pt-2 mt-1 border-t border-[#F3F4F6]">
                <div className="flex items-center gap-1.5 pr-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>calendar_today</span>
                  Created {estimate.dateCreated}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>schedule</span>
                  Expires {estimate.expirationDate || "—"}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]" title="Estimate number">
                  <span className="material-icons" style={{ fontSize: "14px" }}>description</span>
                  #{estimate.estimateNumber}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>person</span>
                  {estimate.teamMember}
                </div>
                <div className="w-px h-4 bg-[#E5E7EB]" />
                <div className="flex items-center gap-1.5 px-3 text-[13px] text-[#6B7280]">
                  <span className="material-icons" style={{ fontSize: "14px" }}>mail</span>
                  Sent {estimate.sentDate}
                </div>
                <button
                  onClick={() => navigate(`/estimates/${id}/edit`)}
                  className="ml-1.5 inline-flex items-center justify-center w-6 h-6 rounded text-[#6B7280] hover:text-[#4A6FA5] hover:bg-[#F5F7FA] transition-colors"
                  title="Edit estimate details"
                >
                  <span className="material-icons" style={{ fontSize: "15px" }}>edit</span>
                </button>
              </div>
            </div>

            {/* Right: Total + Status + kebab */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-0.5" style={{ fontWeight: 600 }}>Total (USD)</div>
                <div className="text-[28px] text-[#1A2332] leading-tight" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</div>
              </div>
              <div className="flex items-center gap-2">
                <div ref={statusRef} className="relative">
                  <button onClick={() => setStatusOpen(!statusOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] hover:opacity-80 transition-opacity"
                    style={{ fontWeight: 600, color: statusColors[estimate.status], backgroundColor: statusBg[estimate.status] }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[estimate.status] }} />
                    {estimate.status}
                    <span className="material-icons" style={{ fontSize: "15px" }}>expand_more</span>
                  </button>
                  {statusOpen && (
                    <div className="absolute right-0 top-[calc(100%+4px)] w-[200px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
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
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <KebabMenu triggerClassName="w-8 h-8 border border-[#E5E7EB] rounded-md bg-white flex items-center justify-center hover:bg-[#F5F7FA]">
                  <KebabItem icon="send">Send to Client</KebabItem>
                  <KebabItem icon="receipt">Make Invoice</KebabItem>
                  <KebabItem icon="link">Get Link</KebabItem>
                  <KebabItem icon="print" onClick={() => setCustomerPreviewOpen(true)}>Print</KebabItem>
                  <KebabSeparator />
                  <KebabItem icon="content_copy">Duplicate</KebabItem>
                  <KebabSeparator />
                  <KebabItem icon="delete" destructive>Delete</KebabItem>
                </KebabMenu>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs + action buttons ── */}
        <div className="flex items-center justify-between px-4 border-b border-[#E5E7EB]">
          <DetailTabs
            tabs={TABS.map(t => ({
              ...t,
              count: t.key === "deposit"
                ? (estimate.depositRequired ? 1 : undefined)
                : t.key === "activity"
                ? estimate.activity.length
                : undefined,
            }))}
            activeTab={activeTab}
            onChange={setActiveTab}
            trailing={<TabSettingsButton />}
          />
          <div className="flex items-center gap-2 py-2 shrink-0">
            <button
              onClick={() => setCustomerPreviewOpen(true)}
              className="h-9 px-3.5 rounded-md border border-[#E5E7EB] bg-white text-[13px] text-[#546478] hover:bg-[#F5F7FA] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>visibility</span>
              Preview
            </button>
            <button
              className="h-9 px-3.5 rounded-md border border-[#C8D5E8] bg-white hover:bg-[#F5F7FA] text-[#4A6FA5] text-[13px] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>send</span>
              Send
            </button>
            <div className="relative">
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="h-9 px-3.5 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
                Create
                <span className="material-icons" style={{ fontSize: "16px" }}>expand_more</span>
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+4px)] w-[200px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 py-1.5">
                  <button
                    onClick={() => { setCreateMenuOpen(false); navigate(`/jobs/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}`); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-[#F5F7FA] transition-colors text-left"
                    style={{ fontWeight: 500, color: "#1A2332" }}
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>work</span>
                    Create Job
                  </button>
                  <button
                    onClick={() => { setCreateMenuOpen(false); navigate(`/invoices/new?fromEstimate=${estimate.id}&client=${encodeURIComponent(estimate.clientName)}`); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-[#F5F7FA] transition-colors text-left"
                    style={{ fontWeight: 500, color: "#1A2332" }}
                  >
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>receipt</span>
                    Create Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "deposit" && renderDepositTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>
      </div>

      {customerPreviewOpen && renderCustomerPreview()}

      {/* Add Item Modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddItemOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Add Item</h2>
              <button onClick={() => setAddItemOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5F7FA] flex items-center justify-center">
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
              {catalogItems.map(item => (
                <button key={item.id}
                  onClick={() => {
                    const newItem: LineItem = { id: Math.max(...estimate.items.map(i => i.id), 0) + 1, name: item.name, description: "", quantity: 1, price: item.price, cost: item.cost, amount: item.price, taxable: true };
                    setEstimate(prev => ({ ...prev, items: [...prev.items, newItem] }));
                    setAddItemOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] text-left">
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
