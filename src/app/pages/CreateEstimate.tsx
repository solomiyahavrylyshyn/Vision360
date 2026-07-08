import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { clientsStore } from "../stores/clientsStore";
import { estimatesStore, type EstimateStatus } from "../stores/estimatesStore";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import { estimateSettingsStore } from "../stores/estimateSettingsStore";
import { ItemPicker, catalogItemToLineItem, type CatalogItem, type SelectedLineItem } from "../components/ItemPicker";
import { PlusIcon } from "../components/ui/plus-icon";
import { itemsStore } from "../stores/itemsStore";
import { termsStore, termsSummary, hasTerms } from "../stores/termsStore";

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

export function CreateEstimate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [client, setClient] = useState(searchParams.get("client") || "");
  // Catalog = live Items module items + legacy options not already present.
  const catalogStoreItems = useSyncExternalStore(itemsStore.subscribe, itemsStore.getSnapshot);
  const catalogItems: CatalogItem[] = (() => {
    const names = new Set(catalogStoreItems.map((i) => i.name.toLowerCase()));
    return [...catalogStoreItems, ...legacyCatalogItems.filter((i) => !names.has(i.name.toLowerCase()))];
  })();

  const liveClients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const clientNames = liveClients.map((c) => c.name);
  const clientOptions = client && !clientNames.includes(client) ? [client, ...clientNames] : clientNames;
  const selectedClient = liveClients.find((c) => c.name === client);
  const selectedClientEmail = selectedClient?.email ?? "";
  const selectedClientId = searchParams.get("clientId") || selectedClient?.id || "";
  const [serviceAddress, setServiceAddress] = useState("");

  // Service-address options come from the SELECTED CLIENT'S record (every client
  // carries at least one address), so any client — incl. newly created ones —
  // shows their real address(es) here.
  const clientAddresses = useMemo(() => {
    if (!selectedClient) return [] as string[];
    const fmtAddr = (street?: string, city?: string, state?: string, zip?: string) =>
      [street, city, [state, zip].filter(Boolean).join(" ").trim()].filter(Boolean).join(", ");
    const list: string[] = [];
    (selectedClient.serviceAddresses || []).forEach((sa) => {
      const s = fmtAddr(sa.street, sa.city, sa.state, sa.zip);
      if (s && !list.includes(s)) list.push(s);
    });
    if (!list.length && selectedClient.address) {
      const s = fmtAddr(selectedClient.address, selectedClient.city, selectedClient.state, selectedClient.zip);
      if (s) list.push(s);
    }
    // Last-resort fallback to the billing address so the dropdown is never empty
    // for a client that has any address on file at all.
    if (!list.length && (selectedClient as any).billingAddress) {
      const s = fmtAddr((selectedClient as any).billingAddress, (selectedClient as any).billingCity, (selectedClient as any).billingState, (selectedClient as any).billingZip);
      if (s) list.push(s);
    }
    return list;
  }, [selectedClient]);

  // Every client must carry an address — pre-select the first (primary) one so
  // the field is never left blank. With several addresses the user can change it.
  useEffect(() => {
    setServiceAddress((prev) => (clientAddresses.includes(prev) ? prev : (clientAddresses[0] ?? "")));
  }, [clientAddresses]);

  const [estimateName, setEstimateName] = useState("");
  const [createdBy] = useState("Marek Stroz");
  // Expiration defaults to today + the company's default validity window
  // (Settings → Estimates, default 30 days; Marek Jun 11). Still editable.
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + estimateSettingsStore.getSnapshot().defaultValidityDays);
    return d.toISOString().split("T")[0];
  });
  // A job is never picked by hand: it arrives (locked) when the estimate is
  // created from a job visit, otherwise the estimate has no job.
  const linkedJob = searchParams.get("job") || "";

  // Good/Better/Best options (Figma 2509:12598) — each option carries its own
  // line items; the client picks one when accepting. Up to 4, renamable.
  type EstimateOption = { id: number; name: string; items: SelectedLineItem[] };
  const OPTION_NAME_DEFAULTS = ["Good", "Better", "Best", "Premium"];
  const MAX_OPTIONS = 4;
  const [options, setOptions] = useState<EstimateOption[]>([{ id: 1, name: "Good", items: [] }]);
  const [activeOptionId, setActiveOptionId] = useState(1);
  const [renamingOption, setRenamingOption] = useState<{ id: number; name: string } | null>(null);
  const activeOption = options.find((o) => o.id === activeOptionId) ?? options[0];
  const lineItems = activeOption.items;
  const setLineItems = (updater: React.SetStateAction<SelectedLineItem[]>) =>
    setOptions((opts) => opts.map((o) => o.id === activeOption.id
      ? { ...o, items: typeof updater === "function" ? (updater as (i: SelectedLineItem[]) => SelectedLineItem[])(o.items) : updater }
      : o));
  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    const name = OPTION_NAME_DEFAULTS.find((n) => !options.some((o) => o.name === n)) || `Option ${options.length + 1}`;
    const id = Math.max(...options.map((o) => o.id)) + 1;
    setOptions((opts) => [...opts, { id, name, items: [] }]);
    setActiveOptionId(id);
  };
  const removeOption = (id: number) => {
    if (options.length <= 1) return;
    const removed = options.find((o) => o.id === id);
    const rest = options.filter((o) => o.id !== id);
    setOptions(rest);
    if (activeOptionId === id) setActiveOptionId(rest[0].id);
    toast.info(`Option "${removed?.name}" removed`);
  };
  const confirmRename = () => {
    if (!renamingOption) return;
    const name = renamingOption.name.trim();
    if (name) setOptions((opts) => opts.map((o) => (o.id === renamingOption.id ? { ...o, name } : o)));
    setRenamingOption(null);
  };
  const [internalNote, setInternalNote] = useState("");
  const [taxRate] = useState(7.5);
  // Default Terms & Conditions from Settings → General (termsStore); shown as a
  // banner on the estimate, with "View" opening the full terms in a modal.
  const legalDocs = useSyncExternalStore(termsStore.subscribe, termsStore.getSnapshot);
  const terms = legalDocs.terms;
  const [viewTermsOpen, setViewTermsOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const updateLineItem = (id: number, field: keyof SelectedLineItem, value: any) => {
    setLineItems((items) => items.map((li) => {
      if (li.id === id) {
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unitPrice") updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return li;
    }));
  };
  const removeLineItem = (id: number) => setLineItems((items) => items.filter((li) => li.id !== id));
  const handleSelectItem = (catalogItem: CatalogItem) => {
    setLineItems((items) => {
      const newId = items.length > 0 ? Math.max(...items.map((li) => li.id)) + 1 : 1;
      return [...items, catalogItemToLineItem(catalogItem, newId, 1)];
    });
    setItemPickerOpen(false);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxableAmount = lineItems.filter((li) => li.taxable).reduce((sum, li) => sum + li.total, 0);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = subtotal + taxAmount;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const persistEstimate = (status: EstimateStatus, successMessage: string) => {
    const todayLabel = formatRegionalDate(new Date());
    const computedTotal = subtotal + taxableAmount * (taxRate / 100);
    // Number off the linked job's base when present; otherwise scope the series
    // to the client id so estimates never collide on a shared "10000-EXX" series.
    const numberBase = linkedJob.includes("-") ? linkedJob.split("-")[0] : (selectedClientId || undefined);
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
      teamMember: createdBy,
      source: linkedJob || "Manual",
      depositDue: 0,
      items: lineItems.map((li) => ({
        id: li.id, name: li.name, description: li.description, quantity: li.quantity,
        price: li.unitPrice, cost: li.unitCost, amount: li.total, taxable: li.taxable,
      })),
      taxRate,
      notes: internalNote,
      // Good/Better/Best — persist every option's line items so the client can
      // pick one when accepting (Figma 2509:12598). Single-option estimates
      // keep the flat items list above as the canonical shape.
      ...(options.length > 1 ? {
        options: options.map((o) => ({
          name: o.name,
          items: o.items.map((li) => ({
            id: li.id, name: li.name, description: li.description, quantity: li.quantity,
            price: li.unitPrice, cost: li.unitCost, amount: li.total, taxable: li.taxable,
          })),
        })),
      } : {}),
    } as any);
    toast.success(successMessage);
    navigate(returnTo || "/estimates");
  };

  // Every option needs at least one line item — its items are what flow into a
  // job/invoice when the estimate is attached / the client picks that option.
  const emptyOptionError = (): string | null => {
    const empty = options.find((o) => o.items.length === 0);
    if (!empty) return null;
    return options.length === 1
      ? "Add at least one line item before saving."
      : `Option "${empty.name}" has no line items — add items or remove the option.`;
  };

  const handleSaveEstimate = () => {
    if (!client.trim()) { toast.error("Select a client before saving the estimate."); return; }
    if (!serviceAddress.trim()) { toast.error("Select a service address."); return; }
    const err = emptyOptionError();
    if (err) { toast.error(err); return; }
    persistEstimate("Draft", "Estimate created");
  };
  const handleSaveDraft = () => {
    if (!client.trim()) { toast.error("Select a client before saving the draft."); return; }
    const err = emptyOptionError();
    if (err) { toast.error(err); return; }
    persistEstimate("Draft", "Draft saved");
  };

  const displayedItems = itemSearch
    ? lineItems.filter((li) => li.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : lineItems;

  const reqStar = <span className="text-[#DC2626]">*</span>;
  const fieldClass = "w-full h-11 px-3.5 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] bg-white";
  const labelClass = "block text-[13px] text-[#374151] mb-1.5" + "";

  // One section row: label on the left, fields on the right (per Figma).
  const Section = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 px-6 py-6">
      <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => navigate(returnTo || "/estimates")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#546478] transition-colors hover:bg-[#EDF0F5]"
            aria-label="Back to Estimates"
          >
            <span className="material-icons" style={{ fontSize: "22px" }}>chevron_left</span>
          </button>
          <span className="material-icons text-[#1A2332]" style={{ fontSize: "22px" }}>description</span>
          <h1 className="text-[24px] leading-8 text-[#1A2332]" style={{ fontWeight: 700 }}>Create estimate</h1>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          {/* Client */}
          <Section label="Client">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Client name {reqStar}</label>
                <select value={client} onChange={(e) => setClient(e.target.value)} className={fieldClass}>
                  <option value="">Select client</option>
                  {clientOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Service address</label>
                <select
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  disabled={!client}
                  className={`${fieldClass} ${!client ? "cursor-not-allowed bg-[#F9FAFB] text-[#9CA3AF]" : ""}`}
                >
                  <option value="">{client ? "Select address" : "Select a client first"}</option>
                  {clientAddresses.map((addr) => <option key={addr} value={addr}>{addr}</option>)}
                </select>
                {clientAddresses.length > 1 && (
                  <div className="mt-1.5 text-[12px] text-[#9CA3AF]">{client} has {clientAddresses.length} properties</div>
                )}
              </div>
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Estimate details */}
          <Section label="Estimate details">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Estimate name {reqStar}</label>
                <input
                  type="text"
                  value={estimateName}
                  onChange={(e) => setEstimateName(e.target.value)}
                  placeholder="e.g. fix the plumbing, cut the trees, install the fence"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Expiration date {reqStar}</label>
                <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Line Items */}
          <Section label={<>Line Items {reqStar}</>}>
            {/* Good/Better/Best option tabs (Figma 2509:12598) */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {options.map((o) => {
                const active = o.id === activeOption.id;
                const renaming = renamingOption?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => { if (!renaming) setActiveOptionId(o.id); }}
                    className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 transition-colors ${active ? "border-[#4A6FA5]" : "border-[#E5E7EB] hover:border-[#C5CEDD]"}`}
                  >
                    {renaming ? (
                      <>
                        <input
                          value={renamingOption.name}
                          onChange={(e) => setRenamingOption({ ...renamingOption, name: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamingOption(null); }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-[72px] bg-transparent text-[13px] text-[#1A2332] outline-none"
                          style={{ fontWeight: 500 }}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); confirmRename(); }}
                          aria-label="Confirm rename"
                          className="flex h-5 w-5 items-center justify-center rounded bg-[#DCFCE7] text-[#16A34A]"
                        >
                          <span className="material-icons" style={{ fontSize: "13px" }}>check</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRenamingOption(null); }}
                          aria-label="Cancel rename"
                          className="flex h-5 w-5 items-center justify-center rounded text-[#9CA3AF] hover:text-[#DC2626]"
                        >
                          <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`text-[13px] ${active ? "text-[#1A2332]" : "text-[#546478]"}`} style={{ fontWeight: 500 }}>{o.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setRenamingOption({ id: o.id, name: o.name }); }}
                          aria-label={`Rename ${o.name}`}
                          className="flex h-5 w-5 items-center justify-center rounded text-[#9CA3AF] hover:text-[#4A6FA5]"
                        >
                          <span className="material-icons" style={{ fontSize: "13px" }}>edit</span>
                        </button>
                        {active && options.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeOption(o.id); }}
                            aria-label={`Remove ${o.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded text-[#9CA3AF] hover:text-[#DC2626]"
                          >
                            <span className="material-icons" style={{ fontSize: "14px" }}>close</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex h-9 items-center gap-1 rounded-lg border border-dashed border-[#C5CEDD] px-3 text-[13px] text-[#546478] transition-colors hover:border-[#4A6FA5] hover:text-[#4A6FA5]"
                  style={{ fontWeight: 500 }}
                >
                  + Add option
                </button>
              )}
            </div>
            <p className="mb-3 text-[12px] text-[#8899AA]">
              Each option has its own line items — the client picks one when accepting. Rename via the pencil; up to 4 options.
            </p>
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
              {/* card header: search + add item */}
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
                <div className="relative w-[280px] max-w-full">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items..."
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setItemPickerOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4A6FA5] px-3.5 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
                  style={{ fontWeight: 600 }}
                >
                  <PlusIcon className="h-4 w-4" /> Add item
                  <span className="material-icons" style={{ fontSize: "16px" }}>expand_more</span>
                </button>
              </div>

              {lineItems.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F7FA]">
                    <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "32px" }}>receipt_long</span>
                  </div>
                  <div className="text-[14px] text-[#546478]" style={{ fontWeight: 500 }}>No items in this estimate yet</div>
                  <div className="mt-1 text-[12px] text-[#8899AA]">Click "Add item" to choose from your pricebook</div>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Item</th>
                        <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Quantity</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Unit price</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Unit cost</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Tax</th>
                        <th className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontWeight: 500 }}>Total</th>
                        <th className="w-[44px] px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {displayedItems.map((item) => (
                        <tr key={item.id} className="border-b border-[#EDF0F5] last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{item.name}</div>
                            {item.description && <div className="text-[13px] text-[#8899AA]">{item.description}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min="0" step="1" value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value) || 0)}
                              className="h-9 w-16 rounded-md border border-[#E5E7EB] px-2 text-center text-[13px] focus:border-[#4A6FA5] focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(item.unitCost)}</td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{item.taxable ? `$${fmt(item.total * (taxRate / 100))}` : "—"}</td>
                          <td className="px-4 py-3 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>${fmt(item.total)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeLineItem(item.id)} className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#DC2626]" aria-label="Remove item">
                              <span className="material-icons" style={{ fontSize: "18px" }}>delete_outline</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total — single right-aligned row (Figma 2509:12598) */}
                  <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3.5">
                    <span className="text-[14px] text-[#546478]">Total:</span>
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</span>
                  </div>
                </>
              )}
            </div>
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Internal Notes */}
          <Section label="Internal Notes">
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="min-h-[96px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]"
              placeholder={`Notes for your team - e.g. "Do not walk on right side, dog in yard"...`}
            />
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
              <div className="min-w-0">
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Terms &amp; Conditions apply to this estimate</div>
                <div className="truncate text-[12px] text-[#8899AA]">{termsSummary(terms)}</div>
              </div>
              {hasTerms(terms) ? (
                <button type="button" onClick={() => setViewTermsOpen(true)} className="shrink-0 text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 600 }}>View terms and conditions</button>
              ) : (
                <button type="button" onClick={() => navigate("/settings?section=general")} className="shrink-0 text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 600 }}>Add in Settings</button>
              )}
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between pb-8">
          <button
            onClick={() => navigate(returnTo || "/estimates")}
            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-[13px] text-[#546478] transition-colors hover:bg-[#F5F7FA]"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-5 text-[13px] text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
              style={{ fontWeight: 600 }}
            >
              Save as draft
            </button>
            <button
              onClick={handleSaveEstimate}
              className="h-10 rounded-lg bg-[#4A6FA5] px-5 text-[13px] text-white transition-colors hover:bg-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              Save estimate
            </button>
          </div>
        </div>
      </div>

      {itemPickerOpen && (
        <ItemPicker
          catalogItems={catalogItems}
          onSelect={handleSelectItem}
          onClose={() => setItemPickerOpen(false)}
        />
      )}

      {viewTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setViewTermsOpen(false)}>
          <div className="flex max-h-[85vh] w-[640px] max-w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Terms &amp; Conditions</h2>
              <button onClick={() => setViewTermsOpen(false)} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6]"><span className="material-icons" style={{ fontSize: "20px" }}>close</span></button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              {terms.mode === "file" ? (
                <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                  <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "20px" }}>description</span>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{terms.fileName}</div>
                    <div className="text-[12px] text-[#8899AA]">Attached document — clients receive this with the estimate.</div>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-[20px] text-[#374151]">{terms.text}</pre>
              )}
            </div>
            <div className="flex justify-end border-t border-[#E5E7EB] px-5 py-4">
              <button onClick={() => setViewTermsOpen(false)} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
