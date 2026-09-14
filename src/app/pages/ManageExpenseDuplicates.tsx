import { useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { expensesStore, type Expense } from "../stores/expensesStore";
import { dismissalsStore } from "../stores/dismissalsStore";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";
import { PaginationFooter } from "../components/ui/pagination-footer";
import { expenseCategoryColors } from "./Expenses";

// Manage duplicates for Expenses (Marek, Sep 14 call): the same permit fee
// entered twice on the same job — once before lunch, once after — is a double
// entry, and at 7,000 transactions a month nobody spots it by eye. This page
// groups expenses that look like the same transaction and lets the office
// delete the extra entry or mark the pair as genuinely separate.
//
// Same shell as Clients → Manage duplicates. "Merging" two expenses has no
// meaning — there is nothing to combine — so the resolution is to keep the
// first entry and delete the rest.

type MatchField =
  | "Same job, vendor & amount"
  | "Same vendor & amount"
  | "Same job, category & amount"
  | "Same vendor & date";

const matchOptions: MatchField[] = [
  "Same job, vendor & amount",
  "Same vendor & amount",
  "Same job, category & amount",
  "Same vendor & date",
];

const normalise = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
const cents = (n: number) => Math.round((Number(n) || 0) * 100);

function groupKey(e: Expense, field: MatchField): string {
  switch (field) {
    case "Same job, vendor & amount":
      return `${normalise(e.jobId) || "nojob"}|${normalise(e.merchant)}|${cents(e.amount)}`;
    case "Same vendor & amount":
      return `${normalise(e.merchant)}|${cents(e.amount)}`;
    case "Same job, category & amount":
      return `${normalise(e.jobId) || "nojob"}|${normalise(e.category)}|${cents(e.amount)}`;
    case "Same vendor & date":
      return `${normalise(e.merchant)}|${normalise(e.date)}`;
  }
}

// Expense dismissals share the dismissals store with clients; the prefix keeps
// an expense "8" from colliding with a customer "8".
const dismissId = (id: string) => `exp-${id}`;

function buildGroups(
  expenses: Expense[],
  field: MatchField,
  dismissed: ReturnType<typeof dismissalsStore.getSnapshot>,
): { key: string; expenses: Expense[] }[] {
  const dismissedSet = new Set(dismissed.map((d) => d.id));
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const k = groupKey(e, field);
    if (!k || k.startsWith("|") || k.endsWith("|")) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  return Array.from(map.entries())
    .filter(([, members]) => {
      if (members.length < 2) return false;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [dismissId(members[i].id), dismissId(members[j].id)].sort().join("_");
          if (!dismissedSet.has(key)) return true;
        }
      }
      return false;
    })
    .map(([key, members]) => ({
      key,
      // Oldest entry first — that is the one that stays.
      expenses: [...members].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    }));
}

const expenseNumber = (id: string) => `E-${1233 + Number(id)}`;
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const oldestOf = (records: Expense[]): Expense =>
  records.reduce((oldest, e) => ((Number(e.id) || Infinity) < (Number(oldest.id) || Infinity) ? e : oldest), records[0]);

export function ManageExpenseDuplicates() {
  const navigate = useNavigate();
  const [matchOn, setMatchOn] = useState<MatchField>("Same job, vendor & amount");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dupPage, setDupPage] = useState(1);
  // What "Delete duplicates" is about to remove, shown for confirmation.
  const [pendingDelete, setPendingDelete] = useState<{ keep: Expense[]; remove: Expense[] } | null>(null);

  const expenses = useSyncExternalStore(expensesStore.subscribe, expensesStore.getSnapshot);
  const dismissedAll = useSyncExternalStore(dismissalsStore.subscribe, dismissalsStore.getSnapshot);
  const dismissed = dismissedAll.filter((d) => d.id.startsWith("exp-"));

  const groups = buildGroups(expenses, matchOn, dismissedAll);
  const dupTotalPages = Math.max(1, Math.ceil(groups.length / rowsPerPage));
  const dupPageSafe = Math.min(dupPage, dupTotalPages);
  const pagedGroups = groups.slice((dupPageSafe - 1) * rowsPerPage, dupPageSafe * rowsPerPage);

  // Groups in which at least two selected entries sit — the unit of "delete
  // duplicates": one stays per group, the rest go.
  const selectedGroups = groups
    .map((g) => ({ ...g, picked: g.expenses.filter((e) => selected.has(e.id)) }))
    .filter((g) => g.picked.length >= 2);

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedGroups(next);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  // ── Delete duplicates (keep the first entry in each group) ───────────────
  const openDeleteSelected = () => {
    if (!selectedGroups.length) return;
    const keep: Expense[] = [];
    const remove: Expense[] = [];
    selectedGroups.forEach((g) => {
      const k = oldestOf(g.picked);
      keep.push(k);
      remove.push(...g.picked.filter((e) => e.id !== k.id));
    });
    setPendingDelete({ keep, remove });
  };
  const openDeleteOne = (e: Expense) => {
    const group = groups.find((g) => g.expenses.some((x) => x.id === e.id));
    const keep = group ? group.expenses.filter((x) => x.id !== e.id) : [];
    setPendingDelete({ keep, remove: [e] });
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    expensesStore.removeMany(new Set(pendingDelete.remove.map((e) => e.id)));
    const n = pendingDelete.remove.length;
    toast.success(`Deleted ${n} duplicate entr${n === 1 ? "y" : "ies"} — the first entry stays.`);
    setPendingDelete(null);
    setSelected(new Set());
  };

  // ── Not a duplicate (dismiss the pairs so they do not resurface) ─────────
  const dismissAmong = (ids: string[]) => {
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        dismissalsStore.add(dismissId(ids[i]), dismissId(ids[j]), "not_duplicate");
  };
  const markNotDuplicateSelected = () => {
    const ids = [...selected];
    if (ids.length < 2) return;
    dismissAmong(ids);
    toast.success("Marked as not duplicates — they won't resurface.");
    setSelected(new Set());
  };
  const markRowNotDuplicate = (e: Expense) => {
    const group = groups.find((g) => g.expenses.some((x) => x.id === e.id));
    if (!group) return;
    group.expenses.filter((x) => x.id !== e.id).forEach((o) =>
      dismissalsStore.add(dismissId(e.id), dismissId(o.id), "not_duplicate"));
    toast.success(`${expenseNumber(e.id)} marked as not a duplicate.`);
    setSelected((prev) => { const n = new Set(prev); n.delete(e.id); return n; });
  };

  const toolbarBtnCls = (enabled: boolean) =>
    `h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] bg-white text-[#1A2332] transition-colors ${enabled ? "hover:bg-[#F5F7FA] cursor-pointer" : "opacity-50 cursor-not-allowed"}`;
  const COLS = "grid grid-cols-[52px_110px_120px_130px_1.2fr_1.2fr_110px_1.4fr_52px]";

  const categoryDot = (category: string) => (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: expenseCategoryColors[category] ?? expenseCategoryColors.Other }} />
      {category}
    </span>
  );

  return (
    <div className="bg-[#F5F7FA] min-h-full">
      {/* Page header */}
      <div className="flex items-center gap-2 px-6 py-6">
        <button
          type="button"
          onClick={() => navigate("/expenses")}
          aria-label="Back to expenses"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A2332] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "24px" }}>chevron_left</span>
        </button>
        <div>
          <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600 }}>Manage duplicates</h1>
          <p className="text-[13px] text-[#6B7280]">The same expense entered twice — keep the first entry, delete the rest, or mark them as separate.</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-6 p-3 flex-wrap">
            <div className="relative inline-flex items-center h-9 border border-[#E5E7EB] rounded-lg bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
              <span className="pl-3 pr-2 text-[14px] text-[#6B7280] whitespace-nowrap">Match expenses on:</span>
              <select
                value={matchOn}
                onChange={(e) => { setMatchOn(e.target.value as MatchField); setSelected(new Set()); setExpandedGroups(new Set()); setDupPage(1); }}
                className="h-full pl-0 pr-7 text-[14px] text-[#1A2332] bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {matchOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" style={{ fontSize: "16px" }}>expand_more</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={markNotDuplicateSelected} disabled={selected.size < 2}
                className={toolbarBtnCls(selected.size >= 2)} style={{ fontWeight: 500 }}>
                Mark as not duplicate
              </button>
              <button onClick={openDeleteSelected} disabled={selectedGroups.length < 1}
                className={toolbarBtnCls(selectedGroups.length >= 1)} style={{ fontWeight: 500 }}>
                Delete duplicates
              </button>
              {selected.size > 0 && (
                <>
                  <div className="w-px h-6 bg-[#E5E7EB]" />
                  <button onClick={() => setSelected(new Set())}
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
            <div className="px-4">Number</div>
            <div className="px-4">Date</div>
            <div className="px-4">Category</div>
            <div className="px-4">Vendor</div>
            <div className="px-4">Job</div>
            <div className="px-4 text-right">Amount</div>
            <div className="px-4">Note</div>
            <div className="px-4" />
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
              <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>content_copy</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[14px] text-[#1A2332]">No duplicates found</p>
                <p className="text-[12px] text-[#6B7280]">No two expenses match on {matchOn.toLowerCase()}</p>
              </div>
            </div>
          ) : pagedGroups.map((group) => {
            const first = group.expenses[0];
            const open = expandedGroups.has(group.key);
            return (
              <div key={group.key} className="border-b border-[#E5E7EB] last:border-0">
                {/* Group header */}
                <div className={`${COLS} min-h-[60px] items-center hover:bg-[#F9FAFB] cursor-pointer`} onClick={() => toggleGroup(group.key)}>
                  <div className="px-4 flex items-center justify-center">
                    <span className={`material-icons text-[#9AA3AF] transition-transform ${open ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                  </div>
                  <div className="px-4 col-span-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                    {first.merchant}
                    <span className="ml-2 text-[#9AA3AF]" style={{ fontWeight: 400 }}>{group.expenses.length} possible duplicates</span>
                  </div>
                  <div className="px-4 text-[14px] text-[#546478]">{first.category}</div>
                  <div className="px-4 text-[14px] text-[#546478]">{first.jobId ? `${first.jobId}${first.jobTitle ? ` · ${first.jobTitle}` : ""}` : "No job"}</div>
                  <div className="px-4 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(first.amount)}</div>
                  <div className="px-4 text-[13px] text-[#9AA3AF]">{money(group.expenses.reduce((s, e) => s + e.amount, 0))} booked in total</div>
                  <div className="px-4" />
                </div>

                {/* Member rows */}
                {open && group.expenses.map((e, idx) => (
                  <div
                    key={e.id}
                    className={`${COLS} min-h-[60px] items-center border-t border-[#F0F2F5] transition-colors cursor-pointer ${selected.has(e.id) ? "bg-[#F0F4FB]" : "hover:bg-[#F9FAFB]"}`}
                    onClick={() => toggle(e.id)}
                  >
                    <div className="px-4 flex items-center justify-center" onClick={(ev) => ev.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)}
                        className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer" />
                    </div>
                    <div className="px-4 text-[14px] text-[#4A6FA5]" style={{ fontWeight: 500 }}>
                      {expenseNumber(e.id)}
                      {idx === 0 && <div className="text-[11px] text-[#16A34A]" style={{ fontWeight: 600 }}>First entry</div>}
                    </div>
                    <div className="px-4 text-[14px] text-[#546478] whitespace-nowrap">{e.date}</div>
                    <div className="px-4">{categoryDot(e.category)}</div>
                    <div className="px-4 text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{e.merchant}</div>
                    <div className="px-4 text-[14px] text-[#546478]">
                      {e.jobId ? (<><div className="text-[#4A6FA5]">{e.jobId}</div>{e.jobTitle && <div className="text-[13px]">{e.jobTitle}</div>}</>) : "—"}
                    </div>
                    <div className="px-4 text-right text-[14px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(e.amount)}</div>
                    <div className="px-4 text-[14px] text-[#546478] truncate" title={e.notes}>{e.notes || "—"}</div>
                    <div className="px-4 flex items-center justify-center" onClick={(ev) => ev.stopPropagation()}>
                      <KebabMenu align="end">
                        <KebabItem icon="visibility" onClick={() => navigate(`/expenses/${e.id}`)}>View expense</KebabItem>
                        <KebabItem icon="check" onClick={() => markRowNotDuplicate(e)}>Mark as not duplicate</KebabItem>
                        <KebabItem icon="delete" onClick={() => openDeleteOne(e)}>Delete this entry</KebabItem>
                      </KebabMenu>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {groups.length > 0 && (
            <PaginationFooter page={dupPage} perPage={rowsPerPage} total={groups.length} onPageChange={setDupPage} onPerPageChange={setRowsPerPage} />
          )}
        </div>
      </div>

      {/* Dismissed pairs */}
      {dismissed.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-[14px] text-[#1A2332] mb-2" style={{ fontWeight: 600 }}>Dismissed pairs ({dismissed.length})</h3>
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
            {dismissed.map((d) => {
              const idA = d.clientIdA.replace(/^exp-/, "");
              const idB = d.clientIdB.replace(/^exp-/, "");
              const a = expenses.find((e) => e.id === idA);
              const b = expenses.find((e) => e.id === idB);
              const label = (e: Expense | undefined, id: string) => e ? `${expenseNumber(e.id)} · ${e.merchant} · ${money(e.amount)}` : expenseNumber(id);
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-3">
                  <div className="text-[13px] text-[#1A2332]">
                    <span style={{ fontWeight: 500 }}>{label(a, idA)}</span>
                    <span className="text-[#9CA3AF] mx-2">↔</span>
                    <span style={{ fontWeight: 500 }}>{label(b, idB)}</span>
                    <span className="ml-3 px-2 py-0.5 rounded-md text-[11px] bg-[#FEE2E2] text-[#DC2626]" style={{ fontWeight: 600 }}>Not a duplicate</span>
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

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setPendingDelete(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[520px] max-w-[96vw]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] text-[#1A2332] mb-2" style={{ fontWeight: 700 }}>
              Delete {pendingDelete.remove.length} duplicate entr{pendingDelete.remove.length === 1 ? "y" : "ies"}?
            </h2>
            <p className="text-[13px] text-[#6B7280] mb-4">
              The first entry stays on the books; the later entries of the same expense are removed. This cannot be undone.
            </p>
            <div className="max-h-[220px] overflow-y-auto mb-5 border border-[#E5E7EB] rounded-lg divide-y divide-[#F3F4F6] text-[12px]">
              {pendingDelete.keep.map((e) => (
                <div key={`k-${e.id}`} className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[#1A2332]"><span style={{ fontWeight: 600 }}>{expenseNumber(e.id)}</span> · {e.merchant} · {money(e.amount)}</span>
                  <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A]" style={{ fontWeight: 600 }}>Kept</span>
                </div>
              ))}
              {pendingDelete.remove.map((e) => (
                <div key={`r-${e.id}`} className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[#1A2332]"><span style={{ fontWeight: 600 }}>{expenseNumber(e.id)}</span> · {e.merchant} · {money(e.amount)} · {e.date}</span>
                  <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626]" style={{ fontWeight: 600 }}>Deleted</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingDelete(null)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmDelete} className="h-9 px-5 rounded-lg text-[13px] text-white bg-[#DC2626] hover:bg-[#B91C1C]" style={{ fontWeight: 500 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
