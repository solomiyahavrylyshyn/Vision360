import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clientsStore, type ClientRecord } from "../stores/clientsStore";
import { dismissalsStore } from "../stores/dismissalsStore";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";

// ─── Grouping helpers ────────────────────────────────────────────────────────
type MatchField =
  | "Name"
  | "Email"
  | "Phone number"
  | "Property address"
  | "Company name";

const normalise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

const phoneDigits = (s: string) => (s || "").replace(/\D/g, "").slice(-7);

const anyPhone = (c: ClientRecord) =>
  phoneDigits(c.mobilePhone || c.phone || c.workPhone || "");

function groupKey(client: ClientRecord, field: MatchField): string {
  switch (field) {
    case "Phone number":
      // Match on the last 7 digits of any phone field (mobile, home, work).
      return anyPhone(client);
    case "Email":
      return normalise(client.email);
    case "Name":
      // Exact display-name match (normalised) — per the walkthrough.
      return normalise(client.name);
    case "Property address":
      // Normalise street + zip (ignores unit/apt differences).
      return normalise(client.address + client.zip);
    case "Company name":
      return normalise(client.company || "");
  }
}

function buildGroups(
  clients: ClientRecord[],
  field: MatchField,
  dismissed: ReturnType<typeof dismissalsStore.getSnapshot>
): { key: string; clients: ClientRecord[] }[] {
  const dismissedSet = new Set(dismissed.map(d => d.id));
  const active = clients.filter(c => !c.mergedIntoId && !c.archivedAt);

  const map = new Map<string, ClientRecord[]>();
  for (const c of active) {
    const k = groupKey(c, field);
    if (!k) continue;
    const arr = map.get(k) ?? [];
    arr.push(c);
    map.set(k, arr);
  }

  return Array.from(map.entries())
    .filter(([, members]) => {
      if (members.length < 2) return false;
      // Exclude groups where every possible pair is dismissed.
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [members[i].id, members[j].id].sort().join("_");
          if (!dismissedSet.has(key)) return true; // at least one active pair
        }
      }
      return false;
    })
    .map(([key, members]) => ({ key, clients: members }));
}

// ─── Merge review modal ──────────────────────────────────────────────────────
const MERGE_FIELDS: { key: keyof ClientRecord; label: string }[] = [
  { key: "name",          label: "Name"        },
  { key: "company",       label: "Company"     },
  { key: "email",         label: "Email"       },
  { key: "mobilePhone",   label: "Mobile"      },
  { key: "address",       label: "Address"     },
  { key: "city",          label: "City"        },
  { key: "state",         label: "State"       },
  { key: "zip",           label: "ZIP"         },
];

type MergeChoices = Partial<Record<keyof ClientRecord, string>>;

function MergeModal({
  candidates,
  onConfirm,
  onCancel,
}: {
  candidates: ClientRecord[];
  onConfirm: (primaryId: string, choices: MergeChoices) => void;
  onCancel: () => void;
}) {
  // The surviving record is always the oldest (lowest customer ID) — its ID is
  // retained per the walkthrough decision. The user still resolves field values.
  const primary = candidates.reduce((oldest, c) =>
    (Number(c.id) || Infinity) < (Number(oldest.id) || Infinity) ? c : oldest, candidates[0]);
  const primaryId = primary.id;
  const [choices, setChoices] = useState<MergeChoices>({});
  const others = candidates.filter(c => c.id !== primaryId);

  const getChoice = (field: keyof ClientRecord) => {
    if (field in choices) return choices[field];
    return String(primary[field] ?? "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-[760px] max-w-[96vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Review &amp; Merge</h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5">The oldest record is kept; resolve any conflicting field values below.</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#9CA3AF]">
            <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Surviving record (oldest ID is retained — not user-selectable) */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] shrink-0">
          <p className="text-[12px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Surviving record (oldest customer ID kept)</p>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#4A6FA5] bg-[#EBF0F8] w-fit">
            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>verified</span>
            <div>
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{primary.name} <span className="text-[#6B7280]" style={{ fontWeight: 400 }}>· ID {primary.id}</span></div>
              <div className="text-[11px] text-[#6B7280]">{primary.email || primary.mobilePhone || "—"}</div>
            </div>
          </div>
        </div>

        {/* Field comparison */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="pb-2 text-left text-[11px] text-[#6B7280] uppercase tracking-wider w-[100px]" style={{ fontWeight: 600 }}>Field</th>
                {candidates.map(c => (
                  <th key={c.id} className={`pb-2 text-left text-[11px] uppercase tracking-wider ${c.id === primaryId ? "text-[#4A6FA5]" : "text-[#6B7280]"}`} style={{ fontWeight: 600 }}>
                    {c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name}
                    {c.id === primaryId && <span className="ml-1 text-[#4A6FA5]">★</span>}
                  </th>
                ))}
                <th className="pb-2 text-left text-[11px] text-[#1A2332] uppercase tracking-wider" style={{ fontWeight: 600 }}>Keep</th>
              </tr>
            </thead>
            <tbody>
              {MERGE_FIELDS.map(({ key, label }) => {
                const values = candidates.map(c => String(c[key] ?? ""));
                const allSame = values.every(v => v === values[0]);
                const chosen = getChoice(key);
                return (
                  <tr key={key} className={`border-b border-[#F3F4F6] ${!allSame ? "bg-[#FFFBEB]" : ""}`}>
                    <td className="py-2.5 pr-4 text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>{label}</td>
                    {candidates.map(c => (
                      <td key={c.id} className="py-2.5 pr-4 text-[13px] text-[#1A2332]">
                        {String(c[key] ?? "") || <span className="text-[#D1D5DB]">—</span>}
                      </td>
                    ))}
                    <td className="py-2.5">
                      {allSame ? (
                        <span className="text-[12px] text-[#6B7280] italic">same</span>
                      ) : (
                        <select
                          value={chosen}
                          onChange={e => setChoices(prev => ({ ...prev, [key]: e.target.value }))}
                          className="h-7 px-2 border border-[#E5E7EB] rounded text-[12px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] max-w-[180px]"
                        >
                          {[...new Set(values)].filter(Boolean).map(v => (
                            <option key={v} value={v}>{v.length > 30 ? v.slice(0, 30) + "…" : v}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between shrink-0">
          <p className="text-[12px] text-[#6B7280]">
            <span className="material-icons text-[#D97706] align-middle mr-1" style={{ fontSize: "15px" }}>warning</span>
            {others.length} record{others.length > 1 ? "s" : ""} will be marked Merged and hidden from the active client list.
          </p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="h-9 px-5 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button
              onClick={() => onConfirm(primaryId, choices)}
              className="h-9 px-5 rounded-lg text-[13px] text-white bg-[#1A2332] hover:bg-[#0f1620]"
              style={{ fontWeight: 500 }}
            >
              Confirm Merge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const matchOptions: MatchField[] = [
  "Name",
  "Email",
  "Phone number",
  "Property address",
  "Company name",
];

export function ManageDuplicates() {
  const navigate = useNavigate();
  const [matchOn, setMatchOn] = useState<MatchField>("Name");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dupPage, setDupPage] = useState(1);
  const [mergeModalCandidates, setMergeModalCandidates] = useState<ClientRecord[] | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const dismissed = useSyncExternalStore(dismissalsStore.subscribe, dismissalsStore.getSnapshot);

  const groups = buildGroups(clients, matchOn, dismissed);
  // Paginate the duplicate groups (the rows-per-page control drives this).
  const dupTotalPages = Math.max(1, Math.ceil(groups.length / rowsPerPage));
  const dupPageSafe = Math.min(dupPage, dupTotalPages);
  const pagedGroups = groups.slice((dupPageSafe - 1) * rowsPerPage, dupPageSafe * rowsPerPage);

  // Show archived records panel
  const [showArchived, setShowArchived] = useState(false);
  const archivedClients = clients.filter(c => c.archivedAt);

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedGroups(next);
  };

  const toggleClient = (id: string) => {
    const next = new Set(selectedClients);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedClients(next);
  };

  // Older customer ID survives a merge (lower numeric id = created earlier).
  const oldestOf = (records: ClientRecord[]): ClientRecord =>
    records.reduce((oldest, c) =>
      (Number(c.id) || Infinity) < (Number(oldest.id) || Infinity) ? c : oldest, records[0]);

  // How many distinct groups the current selection spans.
  const selectedGroups = groups.filter(g => g.clients.some(c => selectedClients.has(c.id)) &&
    g.clients.filter(c => selectedClients.has(c.id)).length >= 2);

  // ── Merge ────────────────────────────────────────────────────────────────
  const openMergeModal = () => {
    const selected = clients.filter(c => selectedClients.has(c.id));
    if (selected.length < 2) return;
    // Spanning multiple groups → bulk auto-merge with a confirmation.
    if (selectedGroups.length > 1) { setBulkConfirmOpen(true); return; }
    setMergeModalCandidates(selected);
  };

  // Merge a set of records into the oldest, filling the oldest's blank fields
  // from the newer records (no data loss). Returns the surviving record's id.
  const mergeIntoOldest = (records: ClientRecord[], overrides: MergeChoices = {}): string => {
    const primary = oldestOf(records);
    const fillable: (keyof ClientRecord)[] = ["company", "email", "mobilePhone", "workPhone", "website", "address", "city", "state", "zip", "county", "notes"];
    const patch: Partial<ClientRecord> = { ...overrides };
    fillable.forEach(f => {
      if (!String(primary[f] ?? "").trim()) {
        const donor = records.find(r => r.id !== primary.id && String(r[f] ?? "").trim());
        if (donor) (patch as any)[f] = donor[f];
      }
    });
    // Roll up financial totals onto the survivor.
    patch.totalRevenue = records.reduce((s, r) => s + (r.totalRevenue || 0), 0);
    patch.totalBilled = records.reduce((s, r) => s + (r.totalBilled || 0), 0);
    patch.openBalance = records.reduce((s, r) => s + (r.openBalance || 0), 0);
    patch.totalJobs = records.reduce((s, r) => s + (r.totalJobs || 0), 0);
    clientsStore.updateClient(primary.id, patch);
    records.filter(r => r.id !== primary.id).forEach(loser =>
      clientsStore.updateClient(loser.id, { mergedIntoId: primary.id, status: "Inactive" as any }));
    return primary.id;
  };

  const confirmMerge = (_primaryId: string, choices: MergeChoices) => {
    const selected = clients.filter(c => selectedClients.has(c.id));
    const survivor = clients.find(c => c.id === mergeIntoOldest(selected, choices));
    toast.success(`Merged into ${survivor?.name ?? "record"} (kept ID ${survivor?.id}).`);
    setMergeModalCandidates(null);
    setSelectedClients(new Set());
  };

  const confirmBulkMerge = () => {
    let groupsMerged = 0;
    selectedGroups.forEach(g => {
      const sel = g.clients.filter(c => selectedClients.has(c.id));
      if (sel.length >= 2) { mergeIntoOldest(sel); groupsMerged++; }
    });
    toast.success(`Merged ${groupsMerged} group${groupsMerged !== 1 ? "s" : ""} — oldest record kept in each.`);
    setBulkConfirmOpen(false);
    setSelectedClients(new Set());
  };

  // ── Mark as not duplicate (dismiss pairs so they won't resurface) ─────────
  const dismissAmong = (ids: string[]) => {
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        dismissalsStore.add(ids[i], ids[j], "not_duplicate");
  };
  const markNotDuplicateSelected = () => {
    const ids = [...selectedClients];
    if (ids.length < 2) return;
    dismissAmong(ids);
    toast.success("Marked as not a duplicate — won't resurface.");
    setSelectedClients(new Set());
  };
  // Per-row: this record is not a duplicate of the others in its group.
  const markRowNotDuplicate = (client: ClientRecord) => {
    const group = groups.find(g => g.clients.some(c => c.id === client.id));
    if (!group) return;
    group.clients.filter(c => c.id !== client.id).forEach(o =>
      dismissalsStore.add(client.id, o.id, "not_duplicate"));
    toast.success(`${client.name} marked as not a duplicate.`);
    setSelectedClients(prev => { const n = new Set(prev); n.delete(client.id); return n; });
  };

  // ── Deactivate (soft-hides from the active list + duplicate scan) ─────────
  const deactivateClient = (id: string) => {
    clientsStore.updateClient(id, { archivedAt: new Date().toISOString(), status: "Inactive" as ClientRecord["status"] });
    const c = clients.find(x => x.id === id);
    toast.success(`${c?.name ?? "Client"} deactivated. Restore from the panel below.`);
    setSelectedClients(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const deactivateSelected = () => {
    const ids = [...selectedClients];
    if (!ids.length) return;
    ids.forEach(id => clientsStore.updateClient(id, { archivedAt: new Date().toISOString(), status: "Inactive" as ClientRecord["status"] }));
    toast.success(`${ids.length} record${ids.length !== 1 ? "s" : ""} deactivated.`);
    setSelectedClients(new Set());
  };

  const restoreClient = (id: string) => {
    clientsStore.updateClient(id, { archivedAt: undefined, status: "Active" as ClientRecord["status"] });
    toast.success("Client restored to active.");
  };

  const toolbarBtnCls = (enabled: boolean) =>
    `h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] bg-white text-[#1A2332] transition-colors ${enabled ? "hover:bg-[#F5F7FA] cursor-pointer" : "opacity-50 cursor-not-allowed"}`;
  const COLS = "grid grid-cols-[52px_1fr_1fr_1.35fr_1fr_1fr_52px]";

  return (
    <div className="bg-[#F5F7FA] min-h-full">
      {/* Page header */}
      <div className="flex items-center gap-2 px-6 py-6">
        <button
          type="button"
          onClick={() => navigate("/clients")}
          aria-label="Back to clients"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "24px" }}>chevron_left</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600 }}>Manage duplicates</h1>
      </div>

      {/* Single card: action bar + column headers + rows + pagination */}
      <div className="px-6 pb-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-6 p-3 flex-wrap">
            {/* Match-on dropdown */}
            <div className="relative inline-flex items-center h-9 border border-[#E5E7EB] rounded-lg bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
              <span className="pl-3 pr-2 text-[14px] text-[#6B7280] whitespace-nowrap">Match customers on:</span>
              <select value={matchOn} onChange={e => { setMatchOn(e.target.value as MatchField); setSelectedClients(new Set()); setExpandedGroups(new Set()); }}
                className="h-full pl-0 pr-7 text-[14px] text-[#1A2332] bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
                style={{ fontWeight: 500 }}>
                {matchOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "16px" }}>expand_more</span>
            </div>

            {/* Action buttons — always visible; disabled (opacity-50) until a valid selection */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={deactivateSelected} disabled={selectedClients.size < 1}
                className={toolbarBtnCls(selectedClients.size >= 1)} style={{ fontWeight: 500 }}>
                Deactivate
              </button>
              <button onClick={markNotDuplicateSelected} disabled={selectedClients.size < 2}
                className={toolbarBtnCls(selectedClients.size >= 2)} style={{ fontWeight: 500 }}>
                Mark as not duplicate
              </button>
              <button onClick={openMergeModal} disabled={selectedClients.size < 2}
                className={toolbarBtnCls(selectedClients.size >= 2)} style={{ fontWeight: 500 }}>
                Merge
              </button>
              {selectedClients.size > 0 && (
                <>
                  <div className="w-px h-6 bg-[#E5E7EB]" />
                  <button onClick={() => setSelectedClients(new Set())}
                    className="h-9 px-4 rounded-lg text-[14px] text-[#1A2332] hover:bg-[#F5F7FA] transition-colors" style={{ fontWeight: 500 }}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className={`${COLS} min-h-[40px] items-center bg-[#F5F7FA] border-b border-[#E5E7EB] text-[14px] text-[#1A2332]`} style={{ fontWeight: 500 }}>
            <div className="px-4" />
            <div className="px-4">Customer</div>
            <div className="px-4">Company</div>
            <div className="px-4">Address</div>
            <div className="px-4">Email</div>
            <div className="px-4">Phone</div>
            <div className="px-4" />
          </div>

          {groups.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
              <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>content_copy</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[14px] text-[#1A2332]">No duplicates found</p>
                <p className="text-[12px] text-[#6B7280]">Your customer list looks clean</p>
              </div>
            </div>
          ) : pagedGroups.map(group => (
            <div key={group.key} className="border-b border-[#E5E7EB] last:border-0">
              {/* Group header — chevron + name + count (no checkbox) */}
              <div className={`${COLS} min-h-[60px] items-center hover:bg-[#F9FAFB] cursor-pointer`}
                onClick={() => toggleGroup(group.key)}>
                <div className="px-4 flex items-center justify-center">
                  <span className={`material-icons text-[#9AA3AF] transition-transform ${expandedGroups.has(group.key) ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                </div>
                <div className="px-4 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{group.clients[0].name}</div>
                <div className="px-4 col-span-4 text-[14px] text-[#9AA3AF]">{group.clients.length} possible duplicate{group.clients.length !== 1 ? "s" : ""}</div>
              </div>

              {/* Member rows */}
              {expandedGroups.has(group.key) && group.clients.map(client => (
                <div key={client.id}
                  className={`${COLS} min-h-[60px] items-center border-t border-[#F0F2F5] transition-colors cursor-pointer ${selectedClients.has(client.id) ? "bg-[#F0F4FB]" : "hover:bg-[#F9FAFB]"}`}
                  onClick={() => toggleClient(client.id)}>
                  <div className="px-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedClients.has(client.id)}
                      onChange={() => toggleClient(client.id)}
                      className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer" />
                  </div>
                  <div className="px-4 text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{client.name}</div>
                  <div className="px-4 text-[14px] text-[#546478]">{client.company || "—"}</div>
                  <div className="px-4 text-[14px] text-[#546478]">{[client.address, [client.city, client.state].filter(Boolean).join(", "), client.zip].filter(Boolean).join(" ") || "—"}</div>
                  <div className="px-4 text-[14px] text-[#546478] truncate">{client.email || "—"}</div>
                  <div className="px-4 text-[14px] text-[#546478] whitespace-nowrap">{client.mobilePhone || "—"}</div>
                  <div className="px-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <KebabMenu align="end">
                      <KebabItem icon="visibility" onClick={() => window.open(`/clients/${client.id}`, "_blank")}>View existing record</KebabItem>
                      <KebabItem icon="check" onClick={() => markRowNotDuplicate(client)}>Mark as not duplicate</KebabItem>
                      <KebabItem icon="block" onClick={() => deactivateClient(client.id)}>Deactivate</KebabItem>
                    </KebabMenu>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Pagination — inside the card (hidden on empty state) */}
          {groups.length > 0 && (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                <span>Rows per page:</span>
                <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setDupPage(1); }}
                  className="h-9 pl-3 pr-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none">
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>{(dupPageSafe - 1) * rowsPerPage + 1}-{Math.min(dupPageSafe * rowsPerPage, groups.length)} of {groups.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDupPage(p => Math.max(1, p - 1))} disabled={dupPageSafe <= 1}
                  className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F5F7FA] rounded-lg disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                  <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
                </button>
                <button onClick={() => setDupPage(p => Math.min(dupTotalPages, p + 1))} disabled={dupPageSafe >= dupTotalPages}
                  className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F5F7FA] rounded-lg disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                  <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dismissed pairs section */}
      {dismissed.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-[14px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Dismissed pairs ({dismissed.length})</h3>
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
            {dismissed.map(d => {
              const a = clients.find(c => c.id === d.clientIdA);
              const b = clients.find(c => c.id === d.clientIdB);
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-3">
                  <div className="text-[13px] text-[#1A2332]">
                    <span style={{ fontWeight: 500 }}>{a?.name ?? d.clientIdA}</span>
                    <span className="text-[#9CA3AF] mx-2">↔</span>
                    <span style={{ fontWeight: 500 }}>{b?.name ?? d.clientIdB}</span>
                    <span className="ml-3 px-2 py-0.5 rounded-md text-[11px] bg-[#FEE2E2] text-[#DC2626]" style={{ fontWeight: 600 }}>
                      Not a duplicate
                    </span>
                  </div>
                  <button onClick={() => dismissalsStore.remove(d.clientIdA, d.clientIdB)}
                    className="text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                    Restore
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deactivated records section */}
      {archivedClients.length > 0 && (
        <div className="px-6 pb-6">
          <button onClick={() => setShowArchived(v => !v)}
            className="text-[13px] text-[#4A6FA5] hover:underline inline-flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>{showArchived ? "expand_less" : "expand_more"}</span>
            {showArchived ? "Hide" : "Show"} deactivated records ({archivedClients.length})
          </button>
          {showArchived && (
            <div className="mt-2 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
              {archivedClients.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div className="text-[13px] text-[#1A2332]">
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.email && <span className="text-[#6B7280] ml-2">{c.email}</span>}
                    <span className="ml-3 px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] text-[11px]" style={{ fontWeight: 600 }}>Deactivated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => window.open(`/clients/${c.id}`, "_blank")}
                      className="text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                      View
                    </button>
                    <button onClick={() => restoreClient(c.id)}
                      className="text-[12px] text-[#16A34A] hover:underline" style={{ fontWeight: 500 }}>
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Merge review modal */}
      {mergeModalCandidates && (
        <MergeModal
          candidates={mergeModalCandidates}
          onConfirm={confirmMerge}
          onCancel={() => setMergeModalCandidates(null)}
        />
      )}

      {/* Bulk merge confirmation */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setBulkConfirmOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[460px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-[17px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>Merge {selectedGroups.length} groups?</h2>
            <p className="text-[13px] text-[#6B7280] mb-4">
              In each group the <strong>oldest record</strong> (lowest customer ID) is kept and the others are merged into it. Empty fields on the surviving record are filled from the newer ones — no data is lost.
            </p>
            <div className="max-h-[180px] overflow-y-auto mb-5 border border-[#E5E7EB] rounded-lg divide-y divide-[#F3F4F6]">
              {selectedGroups.map(g => {
                const sel = g.clients.filter(c => selectedClients.has(c.id));
                const keep = oldestOf(sel);
                return (
                  <div key={g.key} className="px-3 py-2 text-[12px] text-[#1A2332]">
                    <span style={{ fontWeight: 600 }}>{keep.name}</span> <span className="text-[#9CA3AF]">(keeps ID {keep.id})</span>
                    <span className="text-[#6B7280]"> ← merges {sel.length - 1} record{sel.length - 1 !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkConfirmOpen(false)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmBulkMerge} className="h-9 px-5 rounded-lg text-[13px] text-white bg-[#1A2332] hover:bg-[#0f1620]" style={{ fontWeight: 500 }}>Merge groups</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
