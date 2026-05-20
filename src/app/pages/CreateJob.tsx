import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { jobTypesStore } from "../stores/jobTypesStore";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";

// Mock catalog items (same as CreateEstimate)
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

const mockClients = [
  { id: "1", name: "John Smith", address: "123 Main St, Austin, TX 78701" },
  { id: "2", name: "Sarah Johnson", address: "456 Oak Ave, Dallas, TX 75201" },
  { id: "3", name: "Mike Davis", address: "789 Pine Rd, Houston, TX 77001" },
  { id: "4", name: "Robert Lee", address: "321 Elm St, San Antonio, TX 78201" },
  { id: "5", name: "Emily Parker", address: "654 Maple Dr, Fort Worth, TX 76101" },
  { id: "6", name: "Tom Carter", address: "987 Cedar Ln, Plano, TX 75023" },
];

export function CreateJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [jobNumber, setJobNumber] = useState("2");
  const [jobType, setJobType] = useState<"one-off" | "recurring">("one-off");
  const [jobCategory, setJobCategory] = useState("");
  const availableJobTypes = useSyncExternalStore(jobTypesStore.subscribe, jobTypesStore.getJobTypes);
  const fieldEmployees = ["Peter Novak", "Travis Webb", "Ernesto Reyes", "Alex Kim"];
  const [serviceStreet, setServiceStreet] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceState, setServiceState] = useState("");
  const [serviceZip, setServiceZip] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [startDate, setStartDate] = useState("2026-04-06");
  const [endDate, setEndDate] = useState("2026-04-06");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), name: "", description: "", quantity: 1, unitCost: 0, unitPrice: 0 }]);
  };

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

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter((li) => li.id !== id));
  };

  const handleSelectItem = (catalogItem: CatalogItem) => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map(li => li.id)) + 1 : 1;
    const newLineItem = catalogItemToLineItem(catalogItem, newId, 1);
    setLineItems([...lineItems, newLineItem]);
    setItemPickerOpen(false);
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSave = () => {
    navigate("/jobs");
  };

  return (
    <div className="min-h-full bg-white">
      <div className="h-1 bg-[#4A6FA5]" />

      <div className="max-w-[1180px] mx-auto py-8 px-6">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-6"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          <span>Back to Jobs</span>
        </button>
        {/* Header */}
        <PageHeader title="Create Job" icon="work" className="mb-6" />

        {/* Job details layout mirrors the Job Details page */}
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-4 mb-6">
          <div className="border border-[#E5E7EB] rounded-lg p-5 flex flex-col gap-5">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Overview</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setJobType("one-off")} className={`h-8 px-3 rounded-md text-[12px] border ${jobType === "one-off" ? "border-[#1A2332] text-[#1A2332]" : "border-[#E5E7EB] text-[#546478]"}`} style={{ fontWeight: jobType === "one-off" ? 600 : 500 }}>One-off</button>
                  <button onClick={() => setJobType("recurring")} className={`h-8 px-3 rounded-md text-[12px] border ${jobType === "recurring" ? "border-[#1A2332] text-[#1A2332]" : "border-[#E5E7EB] text-[#546478]"}`} style={{ fontWeight: jobType === "recurring" ? 600 : 500 }}>Recurring</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job Title</label>
                  <input type="text" placeholder="AC Estimate" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job Type</label>
                  <select value={jobCategory} onChange={e => setJobCategory(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">Select job type</option>
                    {availableJobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Customer</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setClientPickerOpen(open => !open)}
                      className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] text-left focus:outline-none focus:border-[#4A6FA5] flex items-center justify-between bg-white"
                    >
                      <span className={client ? "text-[#1A2332]" : "text-[#9CA3AF]"}>{client || "Select a client"}</span>
                      <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "18px" }}>expand_more</span>
                    </button>
                    {clientPickerOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                        <div className="max-h-[220px] overflow-y-auto py-1">
                          {mockClients.map((mockClient) => (
                            <button
                              key={mockClient.id}
                              type="button"
                              onClick={() => {
                                setClient(mockClient.name);
                                setClientPickerOpen(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-[#F5F7FA]"
                            >
                              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{mockClient.name}</div>
                              <div className="text-[11px] text-[#8899AA]">{mockClient.address}</div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-[#E5E7EB] p-1">
                          <button
                            type="button"
                            onClick={() => navigate("/clients/new")}
                            className="w-full px-3 py-2 text-left text-[13px] text-[#4A6FA5] hover:bg-[#EEF3FA] rounded-md flex items-center gap-2"
                            style={{ fontWeight: 600 }}
                          >
                            <PlusIcon className="h-4 w-4" />
                            Create new client
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Job #</label>
                  <input type="text" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9CA3AF] mb-1 block">Service Address</label>
                <input type="text" placeholder="Street address" value={serviceStreet} onChange={(e) => setServiceStreet(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5] mb-2" />
                <div className="grid grid-cols-[1fr_90px_110px_120px] gap-2">
                  <input type="text" placeholder="City" value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="State" value={serviceState} onChange={(e) => setServiceState(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="Zip" value={serviceZip} onChange={(e) => setServiceZip(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                  <input type="text" placeholder="Gate code" value={gateCode} onChange={(e) => setGateCode(e.target.value)} className="h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              </div>
            </section>

            <div className="h-px bg-[#E5E7EB]" />

            <section className="flex flex-col gap-4">
              <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Job Date & Time</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Assigned To</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    <option value="">Unassigned</option>
                    {fieldEmployees.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] mb-1 block">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#4A6FA5]" />
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { title: "Job Notes", value: notes, setValue: setNotes, placeholder: "Notes visible on the job..." },
              { title: "Field Notes", value: fieldNotes, setValue: setFieldNotes, placeholder: "Technician notes..." },
              { title: "Private Notes", value: privateNotes, setValue: setPrivateNotes, placeholder: "Internal private notes..." },
            ].map((note) => (
              <div key={note.title} className="border border-[#E5E7EB] rounded-lg bg-white">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  <h3 className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{note.title}</h3>
                </div>
                <div className="p-4">
                  <textarea value={note.value} onChange={(e) => note.setValue(e.target.value)} placeholder={note.placeholder} className="w-full min-h-[84px] resize-y border-none p-0 text-[13px] leading-[20px] text-[#374151] focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
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
                      <tr key={item.id} className="border-b border-[#EDF0F5] hover:bg-[#FAFBFC]">
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.description && <div className="text-[12px] text-[#8899AA]">{item.description}</div>}
                          {item.taxable && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] mt-1 inline-block" style={{ fontWeight: 600 }}>Taxable</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-[#E5E7EB] rounded text-[13px] text-center focus:outline-none focus:border-[#4A6FA5]"
                          />
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => navigate("/jobs")} className="px-6 py-2.5 text-sm text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-sm hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Job
          </button>
        </div>
      </div>

      {/* Item Picker Modal */}
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
