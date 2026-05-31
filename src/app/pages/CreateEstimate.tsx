import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { clientsStore } from "../stores/clientsStore";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";

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
const mockJobs = ["Job-3: HVAC Replacement", "Job-4: Bathroom Remodel", "Job-5: Plumbing Fix", "Job-6: Electrical Work", "Job-8: HVAC Install"];
const mockTeamMembers = ["Marek Stroz", "John Smith", "Sarah Johnson", "Alex Turner"];

const mockClientProperties: Record<string, string[]> = {
  "John Doe": ["1250 NW 24th St, Miami, FL 33142"],
  "Travis Jones": ["8377 Standish Bend Dr Unit 1, Tampa, FL 33615", "4200 Bay Shore Blvd, Tampa, FL 33611"],
  "Sarah Williams": ["4521 Pine Grove Ln, Orlando, FL 32801"],
  "Mike Rodriguez": ["1804 W North B St, Tampa, FL 33606", "3210 Cypress Way, Tampa, FL 33629", "910 E Sligh Ave, Tampa, FL 33604"],
  "Alex Turner": ["220 S Dale Mabry Hwy, Tampa, FL 33609"],
};

export function CreateEstimate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [client, setClient] = useState(searchParams.get("client") || "");
  // Real client names from the shared store so the pre-selected client matches an option.
  const clientNames = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot).map((c) => c.name);
  const clientOptions = client && !clientNames.includes(client) ? [client, ...clientNames] : clientNames;
  const [serviceAddress, setServiceAddress] = useState("");
  const [estimateName, setEstimateName] = useState("");
  const [estimateNumber] = useState("10245-E03");
  const [dateCreated] = useState(() => new Date().toISOString().split("T")[0]);
  const [createdBy] = useState("Marek Stroz");
  const [expirationDate, setExpirationDate] = useState("");
  const [linkedJob, setLinkedJob] = useState(searchParams.get("job") || "");
  const [teamMember, setTeamMember] = useState("");
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [internalNote, setInternalNote] = useState("");
  const [taxRate] = useState(7.5);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

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

  const fieldClass = "w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[12px] uppercase tracking-wider text-[#546478] mb-1.5";

  return (
    <div className="min-h-full bg-white">
      <div className="h-1 bg-[#4A6FA5]" />

      <div className="max-w-[800px] mx-auto py-8 px-6">
        <button
          onClick={() => navigate(returnTo || "/estimates")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-6"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          <span>Back to Estimates</span>
        </button>
        <PageHeader
          title="Create Estimate"
          icon="description"
          className="mb-6"
          actions={
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[13px] text-[#6B7280]" title="Auto-assigned — not editable">
              <span className="material-icons" style={{ fontSize: "14px" }}>lock</span>
              {estimateNumber}
            </div>
          }
        />

        {/* Client */}
        <div className="mb-5">
          <label className={labelClass}>Client</label>
          <select value={client} onChange={(e) => { setClient(e.target.value); setServiceAddress(""); }} className={fieldClass}>
            {/* options below come from the real client store */}
            <option value="">Select a client</option>
            {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Service Address — shown after client selected */}
        {client && (
          <div className="mb-5">
            <label className={labelClass}>Service Address</label>
            <select value={serviceAddress} onChange={(e) => setServiceAddress(e.target.value)} className={fieldClass}>
              <option value="">Select address</option>
              {(mockClientProperties[client] || []).map(addr => (
                <option key={addr} value={addr}>{addr}</option>
              ))}
            </select>
            {(mockClientProperties[client] || []).length > 1 && (
              <div className="mt-1.5 text-[12px] text-[#9CA3AF]">
                {client} has {(mockClientProperties[client] || []).length} properties
              </div>
            )}
          </div>
        )}

        {/* Estimate Name */}
        <div className="mb-5">
          <label className={labelClass}>Estimate Name</label>
          <input
            type="text"
            value={estimateName}
            onChange={(e) => setEstimateName(e.target.value)}
            placeholder="e.g. fix the plumbing, cut the trees, install the fence"
            className={fieldClass}
          />
        </div>

        {/* Dates + Created By */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelClass}>
              Created
              <span className="ml-1.5 text-[#9CA3AF]" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(auto)</span>
            </label>
            <input
              type="date"
              value={dateCreated}
              readOnly
              className={`${fieldClass} bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed`}
              title="Auto-assigned — not editable"
            />
          </div>
          <div>
            <label className={labelClass}>
              Created By
              <span className="ml-1.5 text-[#9CA3AF]" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(auto)</span>
            </label>
            <input
              type="text"
              value={createdBy}
              readOnly
              className={`${fieldClass} bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed`}
              title="Auto-assigned — not editable"
            />
          </div>
          <div>
            <label className={labelClass}>Expiration Date <span className="text-[#9CA3AF]" style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={fieldClass} />
          </div>
        </div>

        {/* Linked Job */}
        <div className="mb-5">
          <label className={labelClass}>Job</label>
          <select value={linkedJob} onChange={(e) => setLinkedJob(e.target.value)} className={fieldClass}>
            <option value="">None</option>
            {mockJobs.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        {/* Assigned Technician */}
        <div className="mb-6">
          <label className={labelClass}>Assigned Technician</label>
          <select value={teamMember} onChange={(e) => setTeamMember(e.target.value)} className={fieldClass}>
            <option value="">Assign technician</option>
            {mockTeamMembers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Line Items */}
        <div className="border border-[#E5E7EB] rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>Line Items</h3>
            <button
              onClick={() => setItemPickerOpen(true)}
              className="px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85] flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <PlusIcon className="h-4 w-4" />
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
                    <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC]">
                      {["Item", "Qty", "Unit Price", "Unit Cost", "Total", ""].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#546478] ${h === "" ? "w-[50px]" : ""}`} style={{ fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC]">
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
                            className="w-20 px-2 py-1 border border-[#E5E7EB] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]" />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#1A2332]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
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
              <div className="border-t border-[#E5E7EB] px-5 py-4 bg-[#FAFBFC]">
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
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total:</span>
                      <span className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <h3 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Notes</h3>
          <div>
            <label className={labelClass}>
              Internal Notes
              <span className="ml-1.5 text-[11px] text-[#9CA3AF] normal-case tracking-normal" style={{ fontWeight: 400 }}>(not visible to client)</span>
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] min-h-[90px] resize-y"
              placeholder="Notes for your team — e.g. 'Do not walk on right side, dog in yard'..."
            />
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#546478]">
            <span className="material-icons" style={{ fontSize: "16px" }}>gavel</span>
            Terms &amp; Conditions apply to this estimate
          </div>
          <button className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
            See all terms and conditions →
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => navigate(returnTo || "/estimates")} className="px-6 py-2.5 text-[13px] text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={() => navigate(returnTo || "/estimates")}
            className="px-6 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]"
            style={{ fontWeight: 500 }}
          >
            Save as Draft
          </button>
          <button
            onClick={() => navigate(returnTo || "/estimates")}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-[13px] hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Estimate
          </button>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker
          catalogItems={mockCatalogItems}
          onSelect={handleSelectItem}
          onClose={() => setItemPickerOpen(false)}
        />
      )}
    </div>
  );
}
