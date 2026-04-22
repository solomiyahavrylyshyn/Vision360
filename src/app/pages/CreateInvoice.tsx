import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PageHeader } from "../components/ui/page-header";

// Mock catalog (same as CreateEstimate)
const mockCatalogItems: CatalogItem[] = [
  { id: 1000, name: "Heat Pump Repair or Service", itemDescription: "Standard heat pump repair service call", salesDescription: "Heat pump diagnostic, repair and service", brand: "Carrier", modelNumber: "HP-2500", rate: 285, cost: 120, taxable: false, category: "HVAC", type: "Service" },
  { id: 1001, name: "SEER Heat Pump Condenser Unit", itemDescription: "SEER 16 heat pump condenser outdoor unit", salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit", brand: "Trane", modelNumber: "XR16-048", rate: 3200, cost: 1800, taxable: true, category: "HVAC", type: "Product" },
  { id: 1002, name: "SEER Heat Pump Condenser Premium", itemDescription: "SEER 20 premium heat pump condenser", salesDescription: "SEER Premium Heat Pump Condenser — ultra high efficiency", brand: "Lennox", modelNumber: "XP25-048", rate: 4800, cost: 2900, taxable: true, category: "HVAC", type: "Product" },
  { id: 1003, name: "Copper Piping Installation", itemDescription: "Install copper piping per linear foot", salesDescription: "Professional copper piping installation (per ft)", brand: "", modelNumber: "", rate: 18.50, cost: 6.75, taxable: true, category: "Plumbing", type: "Service" },
  { id: 1004, name: "Electrical Panel Upgrade 200A", itemDescription: "Upgrade existing panel to 200 amp service", salesDescription: "200A electrical panel upgrade — parts and labor", brand: "Square D", modelNumber: "HOM2040M200PC", rate: 2800, cost: 1100, taxable: true, category: "Electrical", type: "Equipment" },
  { id: 1005, name: "General Labor - Technician", itemDescription: "Standard technician labor rate per hour", salesDescription: "Technician labor (hourly)", brand: "", modelNumber: "", rate: 95, cost: 45, taxable: false, category: "Labor", type: "Labor" },
  { id: 1006, name: "Drain Cleaning Service", itemDescription: "Standard drain cleaning and snaking", salesDescription: "Professional drain cleaning service", brand: "", modelNumber: "", rate: 175, cost: 40, taxable: false, category: "Plumbing", type: "Service" },
  { id: 1007, name: "Thermostat - Smart WiFi", itemDescription: "Smart thermostat with WiFi connectivity", salesDescription: "Smart WiFi Thermostat — professional installation included", brand: "Ecobee", modelNumber: "EB-STATE5-01", rate: 450, cost: 180, taxable: true, category: "HVAC", type: "Product" },
];

const mockClients = ["John Doe", "Travis Jones", "Sarah Williams", "Mike Rodriguez", "Alex Turner"];
const mockJobs = ["JOB-003: Kitchen Renovation", "JOB-004: Bathroom Remodel", "JOB-005: Plumbing Fix", "JOB-006: Electrical Work", "JOB-008: HVAC Install"];
const mockEstimates = ["EST-001: HVAC System Quote", "EST-003: Kitchen Quote", "EST-005: Electrical Quote"];

export function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [client, setClient] = useState(searchParams.get("client") || "");
  const [invoiceNumber] = useState("INV-008");
  const [invoiceDate, setInvoiceDate] = useState("2026-04-07");
  const [dueDate, setDueDate] = useState("2026-05-07");
  const [linkedJob, setLinkedJob] = useState(searchParams.get("job") || "");
  const [linkedEstimate, setLinkedEstimate] = useState(searchParams.get("estimate") || "");
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days of invoice date.");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate] = useState(7.5);

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setLineItems(lineItems.map((li) => {
      if (li.id === id) {
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return li;
    }));
  };

  const removeLineItem = (id: number) => setLineItems(lineItems.filter(li => li.id !== id));

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    setLineItems([...lineItems, catalogItemToLineItem(catalogItem, newId, 1)]);
    setItemPickerOpen(false);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-full bg-white">
      <div className="h-1 bg-[#4A6FA5]" />

      <div className="max-w-[800px] mx-auto py-8 px-6">
        {/* Header */}
        <PageHeader
          title="Create Invoice"
          icon="receipt"
          className="mb-6"
          actions={<span className="text-[14px] text-[#546478]">{invoiceNumber}</span>}
        />

        {/* Client */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Client</label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full px-4 py-3 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white"
            >
              <option value="">Select a client</option>
              {mockClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5]" />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5]" />
            </div>
          </div>

          {/* Linked Job / Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Linked Job</label>
              <select value={linkedJob} onChange={(e) => setLinkedJob(e.target.value)}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white">
                <option value="">None</option>
                {mockJobs.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Linked Estimate</label>
              <select value={linkedEstimate} onChange={(e) => setLinkedEstimate(e.target.value)}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] bg-white">
                <option value="">None</option>
                {mockEstimates.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-[#DDE3EE] rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-[#DDE3EE] flex items-center justify-between">
            <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Line Items</h3>
            <button
              onClick={() => setItemPickerOpen(true)}
              className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
              Add Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
              </div>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items added yet</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Click "Add Item" to select from catalog</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#DDE3EE] bg-[#FAFBFC]">
                      {["Item", "Qty", "Unit Price", "Unit Cost", "Total", ""].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[50px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.id} className="border-b border-[#EDF0F5] hover:bg-[#FAFBFC]">
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          {item.taxable && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="1" value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-[#DDE3EE] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                            className="w-28 px-2 py-1 border border-[#DDE3EE] rounded text-[13px] text-right focus:outline-none focus:border-[#4A6FA5]"
                            style={{ fontVariantNumeric: "tabular-nums" }} />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
                        <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeLineItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FEE2E2]">
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
                  <div className="space-y-2 min-w-[300px]">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">Subtotal:</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">Taxable amount:</span>
                      <span className="text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(taxableAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#546478]">Tax ({taxRate}%):</span>
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

        {/* Notes & Terms */}
        <div className="mb-8">
          <h3 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Notes & Terms</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Internal Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] min-h-[100px] resize-y"
                placeholder="Notes visible only to your team..." />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5" style={{ fontWeight: 600 }}>Terms & Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EE] rounded-md text-sm focus:outline-none focus:border-[#4A6FA5] min-h-[100px] resize-y"
                placeholder="Terms visible to client..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => navigate("/invoices")} className="px-6 py-2.5 text-sm text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={() => navigate("/invoices")}
            className="px-6 py-2.5 border border-[#DDE3EE] rounded-md text-sm text-[#1A2332] hover:bg-[#F5F7FA]"
            style={{ fontWeight: 500 }}
          >
            Save as Draft
          </button>
          <button
            onClick={() => navigate("/invoices")}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-sm hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Invoice
          </button>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker catalogItems={mockCatalogItems} onSelect={handleSelectItem} onClose={() => setItemPickerOpen(false)} />
      )}
    </div>
  );
}
