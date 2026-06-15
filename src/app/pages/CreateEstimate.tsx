import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { clientsStore } from "../stores/clientsStore";
import { estimatesStore, type EstimateStatus } from "../stores/estimatesStore";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { estimateSettingsStore } from "../stores/estimateSettingsStore";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PageHeader } from "../components/ui/page-header";
import { PlusIcon } from "../components/ui/plus-icon";
import { itemsStore } from "../stores/itemsStore";

// Legacy HVAC/plumbing options kept available alongside the live Items catalog.
const legacyCatalogItems: CatalogItem[] = [
  { id: 1000, name: "Heat Pump Repair or Service", itemDescription: "Standard heat pump repair service call", salesDescription: "Heat pump diagnostic, repair and service", brand: "Carrier", modelNumber: "HP-2500", rate: 285, cost: 120, taxable: false, category: "HVAC", type: "Service" },
  { id: 1001, name: "SEER Heat Pump Condenser Unit", itemDescription: "SEER 16 heat pump condenser outdoor unit", salesDescription: "SEER Heat Pump Condenser — high efficiency outdoor unit", brand: "Trane", modelNumber: "XR16-048", rate: 3200, cost: 1800, taxable: true, category: "HVAC", type: "Product" },
  { id: 1002, name: "SEER Heat Pump Condenser Premium", itemDescription: "SEER 20 premium heat pump condenser", salesDescription: "SEER Premium Heat Pump Condenser — ultra high efficiency", brand: "Lennox", modelNumber: "XP25-048", rate: 4800, cost: 2900, taxable: true, category: "HVAC", type: "Product" },
  { id: 1003, name: "Copper Piping Installation", itemDescription: "Install copper piping per linear foot", salesDescription: "Professional copper piping installation (per ft)", brand: "", modelNumber: "", rate: 18.50, cost: 6.75, taxable: true, category: "Plumbing", type: "Service" },
  { id: 1004, name: "Electrical Panel Upgrade 200A", itemDescription: "Upgrade existing panel to 200 amp service", salesDescription: "200A electrical panel upgrade — parts and labor", brand: "Square D", modelNumber: "HOM2040M200PC", rate: 2800, cost: 1100, taxable: true, category: "Electrical", type: "Equipment" },
  { id: 1005, name: "General Labor - Technician", itemDescription: "Standard technician labor rate per hour", salesDescription: "Technician labor (hourly)", brand: "", modelNumber: "", rate: 95, cost: 45, taxable: false, category: "Labor", type: "Labor" },
  { id: 1006, name: "Drain Cleaning Service", itemDescription: "Standard drain cleaning and snaking", salesDescription: "Professional drain cleaning service", brand: "", modelNumber: "", rate: 175, cost: 40, taxable: false, category: "Plumbing", type: "Service" },
  { id: 1007, name: "Thermostat - Smart WiFi", itemDescription: "Smart thermostat with WiFi connectivity", salesDescription: "Smart WiFi Thermostat — professional installation included", brand: "Ecobee", modelNumber: "EB-STATE5-01", rate: 450, cost: 180, taxable: true, category: "HVAC", type: "Product" },
];
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
  // Catalog = live Items module items + legacy options not already present
  // (so items created in the Items module appear here immediately).
  const catalogStoreItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const catalogItems: CatalogItem[] = (() => {
    const names = new Set(catalogStoreItems.map((i) => i.name.toLowerCase()));
    return [...catalogStoreItems, ...legacyCatalogItems.filter((i) => !names.has(i.name.toLowerCase()))];
  })();
  // Real client list from the shared store so the pre-selected client matches an option.
  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const clientNames = liveClients.map((c) => c.name);
  const clientOptions = client && !clientNames.includes(client) ? [client, ...clientNames] : clientNames;
  // Resolve the selected client's record so the saved estimate carries the
  // exact clientId + email (clientId prevents same-name data bleed).
  const selectedClient = liveClients.find((c) => c.name === client);
  const selectedClientEmail = selectedClient?.email ?? "";
  const selectedClientId = searchParams.get("clientId") || selectedClient?.id || "";
  const [serviceAddress, setServiceAddress] = useState("");
  const [estimateName, setEstimateName] = useState("");
  // The estimate number does not exist until the record is saved — the store
  // assigns it on create, so the form intentionally shows none.
  const [dateCreated] = useState(() => new Date().toISOString().split("T")[0]);
  const [createdBy] = useState("Marek Stroz");
  // Expiration defaults to creation date + the company's default validity window
  // (Settings → Estimates, default 30 days; Marek Jun 11). Still editable.
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + estimateSettingsStore.getSnapshot().defaultValidityDays);
    return d.toISOString().split("T")[0];
  });
  // A job is never picked for an estimate manually. Either the estimate is
  // created from a job visit (the job appointment number arrives via the URL
  // and is locked), or there was no visit and the estimate has no job at all.
  const linkedJob = searchParams.get("job") || "";
  // ── Good/Better/Best option tiers ──────────────────────────────────────────
  // One estimate holds several priced tiers, each with its OWN line items; the
  // customer picks one. The line-items table + totals below all operate on the
  // ACTIVE tier via `lineItems` = activeOption.lineItems.
  interface EstimateOption { id: number; name: string; lineItems: SelectedLineItem[]; }
  const [options, setOptions] = useState<EstimateOption[]>([
    { id: 1, name: "Good", lineItems: [] },
    { id: 2, name: "Better", lineItems: [] },
    { id: 3, name: "Best", lineItems: [] },
  ]);
  const [activeOptionId, setActiveOptionId] = useState(1);
  const activeOption = options.find((o) => o.id === activeOptionId) ?? options[0];
  const lineItems = activeOption.lineItems;
  const setActiveLineItems = (updater: (items: SelectedLineItem[]) => SelectedLineItem[]) =>
    setOptions((opts) => opts.map((o) => (o.id === activeOptionId ? { ...o, lineItems: updater(o.lineItems) } : o)));
  const addOption = () => {
    const nextId = Math.max(0, ...options.map((o) => o.id)) + 1;
    setOptions([...options, { id: nextId, name: `Option ${options.length + 1}`, lineItems: [] }]);
    setActiveOptionId(nextId);
  };
  const updateOptionName = (id: number, name: string) =>
    setOptions((opts) => opts.map((o) => (o.id === id ? { ...o, name } : o)));
  const removeOption = (id: number) => {
    if (options.length <= 1) return;
    const remaining = options.filter((o) => o.id !== id);
    setOptions(remaining);
    if (activeOptionId === id) setActiveOptionId(remaining[0].id);
  };
  const optionTotal = (o: EstimateOption) => {
    const sub = o.lineItems.reduce((s, li) => s + li.total, 0);
    const tax = o.lineItems.filter((li) => li.taxable).reduce((s, li) => s + li.total, 0) * (taxRate / 100);
    return sub + tax;
  };
  const [internalNote, setInternalNote] = useState("");
  const [taxRate, setTaxRate] = useState(7.5);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setActiveLineItems((items) => items.map((li) => {
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

  // Seed the active tier from the option before it (the Good→Better→Best flow):
  // copy the previous option's line items in, then add more on top.
  const copyFromPrevious = () => {
    const idx = options.findIndex((o) => o.id === activeOptionId);
    if (idx <= 0) return;
    const prev = options[idx - 1];
    if (!prev.lineItems.length) { toast(`${prev.name} has no items to copy`); return; }
    let nextId = Math.max(0, ...activeOption.lineItems.map((li) => li.id), ...prev.lineItems.map((li) => li.id));
    const copies = prev.lineItems.map((li) => ({ ...li, id: ++nextId }));
    setActiveLineItems((items) => [...items, ...copies]);
    toast(`Copied ${copies.length} item${copies.length === 1 ? "" : "s"} from ${prev.name}`);
  };

  const removeLineItem = (id: number) => setActiveLineItems((items) => items.filter((li) => li.id !== id));

  const handleSelectItem = (catalogItem: CatalogItem) => {
    setActiveLineItems((items) => {
      const newId = items.length > 0 ? Math.max(...items.map((li) => li.id)) + 1 : 1;
      return [...items, catalogItemToLineItem(catalogItem, newId, 1)];
    });
    setItemPickerOpen(false);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter(li => li.taxable).reduce((sum, li) => sum + li.total, 0);

  // Total used in the persisted record (kept above the save handlers so they
  // can grab it without depending on declaration order below).
  const persistEstimate = (status: EstimateStatus, successMessage: string) => {
    const todayLabel = formatRegionalDate(new Date());
    const computedSubtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
    const computedTaxable = lineItems.filter((li) => li.taxable).reduce((sum, li) => sum + li.total, 0);
    const computedTotal = computedSubtotal + computedTaxable * (taxRate / 100);
    // Number is assigned at save time, based on the job appointment's base
    // when the estimate was created from a visit.
    const numberBase = linkedJob.includes("-") ? linkedJob.split("-")[0] : undefined;
    estimatesStore.add({
      estimateNumber: estimatesStore.nextEstimateNumber(numberBase),
      estimateName,
      clientName: client.trim(),
      clientId: selectedClientId,
      clientEmail: selectedClientEmail,
      serviceAddress,
      createdDate: todayLabel,
      addedBy: createdBy,
      amount: Math.round(computedTotal * 100) / 100,
      status,
      job: linkedJob,
      jobTitle: "",
      sentDate: status === "Sent" ? todayLabel : "",
      expirationDate: expirationDate ? formatRegionalDate(new Date(expirationDate + "T12:00:00")) : "",
      // The creator is the technician — no separate assignment field.
      teamMember: createdBy,
      source: linkedJob || "Manual",
      depositDue: 0,
      // Snapshot line items + tax so the EstimateDetail page can rebuild the
      // exact document the user just created (DEF-M01-05).
      items: lineItems.map((li) => ({
        id: li.id,
        name: li.name,
        description: li.description,
        quantity: li.quantity,
        price: li.unitPrice,
        cost: li.unitCost,
        amount: li.total,
        taxable: li.taxable,
      })),
      taxRate,
      notes: internalNote,
    });
    toast.success(successMessage);
    navigate(returnTo || "/estimates");
  };

  const handleSaveEstimate = () => {
    if (!client.trim()) { toast.error("Select a client before saving the estimate."); return; }
    if (lineItems.length === 0) { toast.error("Add at least one line item before saving."); return; }
    // Save as Draft — the user sends it explicitly from EstimateDetail (DEF-M01-06).
    // The previous "Sent" default meant Draft→Sent could never be tested separately.
    persistEstimate("Draft", "Estimate created");
  };
  const handleSaveDraft = () => {
    if (!client.trim() && lineItems.length === 0) { toast.error("Add a client or a line item before saving a draft."); return; }
    if (!client.trim()) { toast.error("Select a client before saving the draft."); return; }
    persistEstimate("Draft", "Draft saved");
  };
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fieldClass = "w-full px-4 py-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[13px] font-medium text-[#374151] mb-1.5";
  const reqStar = <span className="text-[#DC2626]">*</span>;

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
        {/* No estimate number here on purpose — it doesn't exist until the
            record is saved, so the form shows none. */}
        <PageHeader
          title="Create estimate"
          icon="description"
          className="mb-6"
        />

        {/* Client */}
        <div className="mb-5">
          <label className={labelClass}>Client {reqStar}</label>
          <select value={client} onChange={(e) => { setClient(e.target.value); setServiceAddress(""); }} className={fieldClass}>
            {/* options below come from the real client store */}
            <option value="">Select a client</option>
            {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Service Address — shown after client selected */}
        {client && (
          <div className="mb-5">
            <label className={labelClass}>Service address {reqStar}</label>
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
          <label className={labelClass}>Estimate name {reqStar}</label>
          <input
            type="text"
            value={estimateName}
            onChange={(e) => setEstimateName(e.target.value)}
            placeholder="e.g. fix the plumbing, cut the trees, install the fence"
            className={fieldClass}
          />
        </div>

        {/* Dates + Created By. Creation date is a system fact (never editable);
            expiration defaults to it and stays editable. */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className={labelClass}>
              Creation Date
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
              Created by
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
            <label className={labelClass}>Expiration date {reqStar}</label>
            <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={fieldClass} />
          </div>
        </div>

        {/* Job select + Assigned technician intentionally absent (Jun 11 call):
            the creator IS the technician, and a job is never picked by hand —
            the auto-linked Job appointment chip below covers the from-job case. */}
        {/* ── Options (Good / Better / Best price tiers) ── */}
        <div className="mb-3">
          <h3 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 700 }}>Options</h3>
          <div className="flex items-center gap-1 flex-wrap border-b border-[#E5E7EB]">
            {options.map((o) => {
              const active = o.id === activeOptionId;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setActiveOptionId(o.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[13px] border-b-2 -mb-px transition-colors ${active ? "border-[#4A6FA5] text-[#1A2332]" : "border-transparent text-[#6B7280] hover:text-[#1A2332]"}`}
                  style={{ fontWeight: active ? 600 : 500 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? "#4A6FA5" : "#D1D5DB" }} />
                  {o.name}
                  {optionTotal(o) > 0 && <span className="text-[11px] text-[#9CA3AF] tabular-nums">${fmt(optionTotal(o))}</span>}
                </button>
              );
            })}
            <button type="button" onClick={addOption} className="flex items-center gap-1 px-3 py-2 text-[13px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
              <PlusIcon className="h-3.5 w-3.5" /> Add option
            </button>
          </div>
          {(() => {
            const idx = options.findIndex((o) => o.id === activeOptionId);
            const hasPrev = idx > 0;
            return (
              <button
                type="button"
                onClick={copyFromPrevious}
                disabled={!hasPrev}
                title={hasPrev ? `Copy ${options[idx - 1].name}'s items into ${activeOption.name}` : "No previous option to copy from"}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{ fontWeight: 500 }}
              >
                <span className="material-icons" style={{ fontSize: "16px" }}>content_copy</span>
                Copy from previous
              </button>
            );
          })()}
        </div>

        {/* Active option card — its own line items + totals */}
        <div className="border border-[#E5E7EB] rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#4A6FA5" }} />
              <input
                type="text"
                value={activeOption.name}
                onChange={(e) => updateOptionName(activeOption.id, e.target.value)}
                aria-label="Option name"
                className="text-[18px] text-[#1A2332] bg-transparent border-b border-transparent hover:border-[#E5E7EB] focus:border-[#4A6FA5] focus:outline-none min-w-0"
                style={{ fontWeight: 700 }}
              />
            </div>
            {options.length > 1 && (
              <button type="button" onClick={() => removeOption(activeOption.id)} className="text-[12px] text-[#9CA3AF] hover:text-[#DC2626] shrink-0" style={{ fontWeight: 500 }}>
                Remove option
              </button>
            )}
          </div>

          {lineItems.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
              </div>
              <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items in this option yet</div>
              <div className="text-[12px] text-[#8899AA] mt-1">Click "Add item" to choose from your pricebook</div>
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
                        <td className="px-4 py-3">
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-[#9CA3AF]">$</span>
                            <input type="number" min="0" step="0.01" value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                              className="w-28 pl-5 pr-2 py-1 border border-[#E5E7EB] rounded text-[13px] tabular-nums focus:outline-none focus:border-[#4A6FA5]" />
                          </div>
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
                      <span className="text-[#546478] flex items-center gap-1.5">
                        Tax
                        <span className="relative inline-flex items-center">
                          <input
                            type="number" min="0" max="100" step="0.1" value={taxRate}
                            onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                            className="w-16 pl-2 pr-4 py-0.5 border border-[#E5E7EB] rounded text-[13px] tabular-nums text-right focus:outline-none focus:border-[#4A6FA5]"
                            aria-label="Tax rate percent"
                          />
                          <span className="absolute right-1.5 text-[#9CA3AF] pointer-events-none">%</span>
                        </span>
                      </span>
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

          {/* Add items to this option — always from the pricebook. */}
          <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center gap-2">
            <button type="button" onClick={() => setItemPickerOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4A6FA5] text-white rounded-lg text-[13px] hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>
              <PlusIcon className="h-4 w-4" /> Add item
            </button>
          </div>
        </div>

        {/* Job appointment — shown only when the estimate is created from a job
            visit. The link is automatic and locked: a job is never picked for an
            estimate by hand, and estimates created from the Estimates page (no
            visit) simply have no job. Sits below line items — it's a reference,
            not part of the document. */}
        {linkedJob && (
          <div className="mb-6 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center gap-2 text-[13px] text-[#546478]">
            <span className="material-icons" style={{ fontSize: "16px" }}>work</span>
            <span>Job appointment:</span>
            <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>{linkedJob}</span>
            <span
              className="ml-auto inline-flex items-center gap-1 text-[12px] text-[#9CA3AF]"
              title="Linked automatically — this estimate was created on this job visit"
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>lock</span>
              Linked automatically
            </span>
          </div>
        )}

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
            View terms and conditions
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button onClick={() => navigate(returnTo || "/estimates")} className="px-6 py-2.5 text-[13px] text-[#546478] hover:text-[#1A2332]" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-6 py-2.5 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]"
            style={{ fontWeight: 500 }}
          >
            Save as Draft
          </button>
          <button
            onClick={handleSaveEstimate}
            className="px-6 py-2.5 bg-[#4A6FA5] text-white rounded-md text-[13px] hover:bg-[#3d5a85]"
            style={{ fontWeight: 600 }}
          >
            Save Estimate
          </button>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker
          catalogItems={catalogItems}
          onSelect={handleSelectItem}
          onClose={() => setItemPickerOpen(false)}
        />
      )}
    </div>
  );
}
