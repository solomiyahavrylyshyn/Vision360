import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clientsStore, type ClientRecord } from "../stores/clientsStore";
import { dismissalsStore, type DismissalReason } from "../stores/dismissalsStore";
import { formatRegionalDate } from "../stores/regionalSettingsStore";

// ─── Grouping helpers ────────────────────────────────────────────────────────
type MatchField = "Name" | "Mobile" | "Email" | "Phone" | "Address";

const normalise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

const phoneDigits = (s: string) => (s || "").replace(/\D/g, "").slice(-7);

function groupKey(client: ClientRecord, field: MatchField): string {
  switch (field) {
    case "Mobile":  return phoneDigits(client.mobilePhone);
    case "Email":   return normalise(client.email);
    case "Phone":   return phoneDigits(client.phone || client.mobilePhone);
    case "Address": return normalise(client.address + client.zip);
    default:        return normalise(client.name);
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
  const [primaryId, setPrimaryId] = useState(candidates[0]?.id ?? "");
  const [choices, setChoices] = useState<MergeChoices>({});

  const primary = candidates.find(c => c.id === primaryId) ?? candidates[0];
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
            <p className="text-[13px] text-[#6B7280] mt-0.5">Choose the primary record and resolve any conflicting fields.</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F7FA] text-[#9CA3AF]">
            <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Primary selector */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] shrink-0">
          <p className="text-[12px] text-[#6B7280] uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Surviving (primary) record</p>
          <div className="flex gap-3 flex-wrap">
            {candidates.map(c => (
              <label key={c.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${c.id === primaryId ? "border-[#4A6FA5] bg-[#EBF0F8]" : "border-[#E5E7EB] bg-white hover:border-[#C5D5EC]"}`}>
                <input type="radio" name="primary" value={c.id} checked={c.id === primaryId} onChange={() => { setPrimaryId(c.id); setChoices({}); }} className="accent-[#4A6FA5]" />
                <div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="text-[11px] text-[#6B7280]">{c.email || c.mobilePhone || c.id}</div>
                </div>
              </label>
            ))}
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
const matchOptions: MatchField[] = ["Name", "Mobile", "Email", "Phone", "Address"];

export function ManageDuplicates() {
  const navigate = useNavigate();
  const [matchOn, setMatchOn] = useState<MatchField>("Name");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [mergeModalCandidates, setMergeModalCandidates] = useState<ClientRecord[] | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getSnapshot);
  const dismissed = useSyncExternalStore(dismissalsStore.subscribe, dismissalsStore.getSnapshot);

  const groups = buildGroups(clients, matchOn, dismissed);

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

  // ── Merge ────────────────────────────────────────────────────────────────
  const openMergeModal = () => {
    const selected = clients.filter(c => selectedClients.has(c.id));
    if (selected.length < 2) return;
    setMergeModalCandidates(selected);
  };

  const confirmMerge = (primaryId: string, choices: MergeChoices) => {
    const primary = clients.find(c => c.id === primaryId);
    if (!primary) return;
    const patch: Partial<ClientRecord> = { ...choices };
    clientsStore.updateClient(primaryId, patch);
    const now = formatRegionalDate(new Date());
    clients
      .filter(c => selectedClients.has(c.id) && c.id !== primaryId)
      .forEach(loser => {
        clientsStore.updateClient(loser.id, {
          mergedIntoId: primaryId,
          status: "Inactive" as any,
        });
      });
    toast.success(`Merged into ${primary.name}. Losing records are now hidden.`);
    setMergeModalCandidates(null);
    setSelectedClients(new Set());
  };

  // ── Keep Both / Not Duplicate ────────────────────────────────────────────
  const dismissPair = (reason: DismissalReason) => {
    const ids = [...selectedClients];
    if (ids.length !== 2) return;
    dismissalsStore.add(ids[0], ids[1], reason);
    toast.success(reason === "keep_both" ? "Pair marked as intentionally separate." : "Pair marked as not a duplicate — won't resurface.");
    setSelectedClients(new Set());
  };

  // ── Archive ──────────────────────────────────────────────────────────────
  const archiveClient = (id: string) => {
    clientsStore.updateClient(id, { archivedAt: new Date().toISOString() });
    toast.success("Client archived. Restore from the archived records panel below.");
    setArchiveConfirmId(null);
    setSelectedClients(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const restoreClient = (id: string) => {
    clientsStore.updateClient(id, { archivedAt: undefined });
    toast.success("Client restored to active.");
  };

  // ── Selection state ──────────────────────────────────────────────────────
  const exactly2 = selectedClients.size === 2;
  const twoOrMore = selectedClients.size >= 2;
  const selectedRecords = clients.filter(c => selectedClients.has(c.id));
  const allSameGroup = twoOrMore && groups.some(g => selectedRecords.every(c => g.clients.some(gc => gc.id === c.id)));

  return (
    <div className="p-8">
      <button onClick={() => navigate("/clients")}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-5"
        style={{ fontWeight: 500 }}>
        <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
        Back to Clients
      </button>

      <div className="mb-6">
        <h1 className="text-[26px] text-[#1A2332]" style={{ fontWeight: 700 }}>Manage duplicates</h1>
        <p className="text-[14px] text-[#546478] mt-1">
          We've grouped possible duplicate client profiles. Select rows to merge, dismiss, or archive.
          Clients you want to keep separate can be dismissed so they won't resurface.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Match-on pill */}
        <div className="relative inline-flex items-center h-9 border border-[#E5E7EB] rounded-lg bg-white overflow-hidden">
          <span className="pl-3 pr-2 text-[13px] text-[#6B7280] whitespace-nowrap" style={{ fontWeight: 500 }}>Match customers on:</span>
          <select value={matchOn} onChange={e => { setMatchOn(e.target.value as MatchField); setSelectedClients(new Set()); setExpandedGroups(new Set()); }}
            className="h-full pl-0 pr-7 text-[13px] text-[#1A2332] bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
            style={{ fontWeight: 600 }}>
            {matchOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#9AA3AF] pointer-events-none" style={{ fontSize: "16px" }}>expand_more</span>
        </div>

        {/* Action buttons — shown when rows are selected */}
        {twoOrMore && (
          <div className="flex items-center gap-2 flex-wrap">
            {exactly2 && (
              <>
                <button onClick={() => dismissPair("keep_both")}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] bg-white hover:bg-[#F5F7FA] transition-colors inline-flex items-center gap-1.5"
                  style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "15px" }}>call_split</span>
                  Keep both
                </button>
                <button onClick={() => dismissPair("not_duplicate")}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] bg-white hover:bg-[#F5F7FA] transition-colors inline-flex items-center gap-1.5"
                  style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "15px" }}>do_not_disturb</span>
                  Not a duplicate
                </button>
              </>
            )}
            <button onClick={() => setSelectedClients(new Set())}
              className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] bg-white hover:bg-[#F5F7FA] transition-colors"
              style={{ fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={openMergeModal}
              className="h-9 px-5 rounded-lg text-[13px] text-white bg-[#1A2332] hover:bg-[#0f1620] transition-colors inline-flex items-center gap-1.5"
              style={{ fontWeight: 500 }}>
              <span className="material-icons" style={{ fontSize: "15px" }}>merge</span>
              Merge ({selectedClients.size})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_120px] bg-[#F5F7FA] border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>
          <div className="px-4 py-3" />
          <div className="px-4 py-3">Customer</div>
          <div className="px-4 py-3">Company</div>
          <div className="px-4 py-3">Address</div>
          <div className="px-4 py-3">Email</div>
          <div className="px-4 py-3">Phone</div>
          <div className="px-4 py-3">Actions</div>
        </div>

        {groups.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-icons text-[#D1FAE5] mb-3 block" style={{ fontSize: "48px" }}>check_circle</span>
            <p className="text-[15px] text-[#546478]" style={{ fontWeight: 500 }}>No duplicates found</p>
            <p className="text-[13px] text-[#9AA3AF] mt-1">All client profiles are unique for the selected match field.</p>
          </div>
        ) : groups.map(group => (
          <div key={group.key} className="border-b border-[#E5E7EB] last:border-0">
            {/* Group header */}
            <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_120px] items-center hover:bg-[#F9FAFB] cursor-pointer"
              onClick={() => toggleGroup(group.key)}>
              <div className="px-4 py-3.5 flex items-center justify-center">
                <span className={`material-icons text-[#546478] transition-transform ${expandedGroups.has(group.key) ? "rotate-180" : ""}`} style={{ fontSize: "18px" }}>expand_more</span>
              </div>
              <div className="px-4 py-3.5 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{group.clients[0].name}</div>
              <div className="px-4 py-3.5 col-span-5 text-[12px] text-[#9AA3AF]">{group.clients.length} possible duplicate{group.clients.length !== 1 ? "s" : ""}</div>
            </div>

            {/* Client rows */}
            {expandedGroups.has(group.key) && group.clients.map(client => (
              <div key={client.id}
                className={`grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_120px] items-start border-t border-[#F0F2F5] transition-colors ${selectedClients.has(client.id) ? "bg-[#EDF5FF]" : "hover:bg-[#F9FAFB]"}`}
                onClick={() => toggleClient(client.id)}>
                <div className="px-4 py-3.5 flex items-center justify-center pt-4">
                  <input type="checkbox" checked={selectedClients.has(client.id)}
                    onChange={e => { e.stopPropagation(); toggleClient(client.id); }}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer" />
                </div>
                {/* ① View record — name is a link */}
                <div className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => window.open(`/clients/${client.id}`, "_blank")}
                    className="text-[14px] text-[#4A6FA5] hover:underline text-left"
                    style={{ fontWeight: 500 }}
                    title="Open client profile in new tab"
                  >
                    {client.name}
                  </button>
                </div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.company || "—"}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478] whitespace-pre-line">{[client.address, `${client.city}, ${client.state} ${client.zip}`].filter(Boolean).join("\n") || "—"}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.email || "—"}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.mobilePhone || "—"}</div>
                {/* ⑤ Archive per-row */}
                <div className="px-4 py-3.5 flex items-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setArchiveConfirmId(client.id)}
                    className="h-7 px-2.5 text-[12px] text-[#546478] border border-[#E5E7EB] rounded-md hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-colors inline-flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                    title="Archive this record"
                  >
                    <span className="material-icons" style={{ fontSize: "13px" }}>archive</span>
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[#546478]">
          Rows per page:
          <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}
            className="h-8 px-2 border border-[#E5E7EB] rounded text-[13px] bg-white focus:outline-none">
            {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <span className="text-[13px] text-[#546478]">1–{Math.min(rowsPerPage, groups.length)} of {groups.length}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled>
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
          </button>
          <button className="p-1 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled>
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Dismissed pairs section */}
      {dismissed.length > 0 && (
        <div className="mt-8">
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
                    <span className={`ml-3 px-2 py-0.5 rounded-md text-[11px] ${d.reason === "not_duplicate" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#DBEAFE] text-[#1E40AF]"}`} style={{ fontWeight: 600 }}>
                      {d.reason === "not_duplicate" ? "Not a duplicate" : "Keep both"}
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

      {/* Archived records section */}
      {archivedClients.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowArchived(v => !v)}
            className="text-[13px] text-[#4A6FA5] hover:underline inline-flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>{showArchived ? "expand_less" : "expand_more"}</span>
            {showArchived ? "Hide" : "Show"} archived records ({archivedClients.length})
          </button>
          {showArchived && (
            <div className="mt-2 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
              {archivedClients.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div className="text-[13px] text-[#1A2332]">
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.email && <span className="text-[#6B7280] ml-2">{c.email}</span>}
                    <span className="ml-3 px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] text-[11px]" style={{ fontWeight: 600 }}>Archived</span>
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

      {/* Archive confirmation */}
      {archiveConfirmId && (() => {
        const target = clients.find(c => c.id === archiveConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setArchiveConfirmId(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[420px]" onClick={e => e.stopPropagation()}>
              <h2 className="text-[17px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>Archive client?</h2>
              <p className="text-[13px] text-[#6B7280] mb-5">
                <strong>{target?.name}</strong> will be soft-archived and hidden from the active client list and future duplicate scans. You can restore them at any time.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setArchiveConfirmId(null)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
                <button onClick={() => archiveClient(archiveConfirmId)} className="h-9 px-4 rounded-lg text-[13px] text-white bg-[#DC2626] hover:bg-[#B91C1C]" style={{ fontWeight: 500 }}>Archive</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
