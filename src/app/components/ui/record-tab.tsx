import { useMemo, useState } from "react";
import { Button } from "./button";
import { PlusIcon } from "./plus-icon";
import { KebabMenu, KebabItem, KebabSeparator } from "./kebab-menu";

// A Figma-grade data grid for the Client-detail inner tabs (Invoices, Jobs,
// Estimates, Payments). Self-contained: it owns the search box, the filter
// dropdowns, and pagination; the parent supplies the rows, the column
// renderers, the filter definitions, and the per-row kebab actions.

export type RecordColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
};

export type RecordFilter<T> = {
  key: string;
  label: string;                              // e.g. "Status"
  options: { value: string; label: string }[]; // first option = "All" (value "")
  match: (row: T, value: string) => boolean;  // only called when value !== ""
};

export type RecordAction<T> = {
  label: string;
  icon: string;
  destructive?: boolean;
  separatorBefore?: boolean;
  onClick: (row: T) => void;
};

// A bulk action runs against the currently-selected rows. Rendered in the
// selection bar that replaces the toolbar once one or more rows are checked.
export type RecordBulkAction<T> = {
  label: string;
  icon: string;
  onClick: (selected: T[]) => void;
};

export function RecordTab<T extends { id: string | number }>({
  rows,
  columns,
  searchPlaceholder = "Search…",
  searchMatch,
  filters = [],
  createLabel,
  onCreate,
  rowActions,
  onRowClick,
  bulkActions,
  emptyText = "No matches",
  emptyIcon = "inbox",
  emptyTitle = "Nothing here yet",
  emptySubtitle = "",
}: {
  rows: T[];
  columns: RecordColumn<T>[];
  searchPlaceholder?: string;
  searchMatch: (row: T, query: string) => boolean;
  filters?: RecordFilter<T>[];
  createLabel?: string;
  onCreate?: () => void;
  rowActions?: (row: T) => RecordAction<T>[];
  onRowClick?: (row: T) => void;
  bulkActions?: RecordBulkAction<T>[];
  emptyText?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim();
    return rows.filter((r) => {
      if (q && !searchMatch(r, q)) return false;
      for (const f of filters) {
        const v = filterValues[f.key] || "";
        if (v && !f.match(r, v)) return false;
      }
      return true;
    });
  }, [rows, search, filterValues, filters, searchMatch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);
  const setFilter = (key: string, value: string) => { setFilterValues((p) => ({ ...p, [key]: value })); setPage(1); };

  // Bulk selection (only active when the parent supplies bulkActions).
  const selectable = !!bulkActions && bulkActions.length > 0;
  const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(r.id)), [rows, selectedIds]);
  const selectedCount = selectedRows.length;
  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));
  const pageSomeSelected = pageRows.some((r) => selectedIds.has(r.id));
  const toggleRow = (id: string | number) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const togglePage = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (pageAllSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  const selectCls = "h-9 pl-3 pr-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]";

  return (
    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
      {selectable && selectedCount > 0 ? (
        /* Selection bar — replaces the toolbar once rows are checked */
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 flex-wrap">
          <span className="text-[14px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>{selectedCount} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            {bulkActions!.map((a) => (
              <Button key={a.label} type="button" variant="outline" onClick={() => a.onClick(selectedRows)}
                className="bg-white border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg inline-flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>{a.icon}</span>
                {a.label}
              </Button>
            ))}
            <button type="button" onClick={clearSelection} className="h-9 px-3 text-[14px] text-[#1A2332] hover:underline" style={{ fontWeight: 500 }}>Unselect</button>
          </div>
        </div>
      ) : (
        /* Toolbar — search + filters (left), Create (right) */
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-[300px] max-w-full">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "16px" }}>search</span>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#4A6FA5]" />
            </div>
            {filters.map((f) => (
              <select key={f.key} value={filterValues[f.key] || ""} onChange={(e) => setFilter(f.key, e.target.value)} className={selectCls} aria-label={f.label}>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.value === "" ? `${f.label}: ${o.label}` : o.label}</option>)}
              </select>
            ))}
          </div>
          {/* Per-card create is a blue circular + at the right end of the toolbar
              (Marek Jun 16) — the big text button is reserved for the global Create. */}
          {createLabel && onCreate && (
            <button type="button" onClick={onCreate} title={createLabel} aria-label={createLabel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4A6FA5] transition-colors hover:bg-[#EEF3FA]">
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <table className="w-full text-[14px] border-t border-[#E5E7EB]">
        <thead>
          <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-left">
            {selectable && (
              <th className="w-10 px-3 py-2">
                <input type="checkbox" aria-label="Select all on page" checked={pageAllSelected}
                  ref={(el) => { if (el) el.indeterminate = !pageAllSelected && pageSomeSelected; }}
                  onChange={togglePage}
                  className="w-4 h-4 align-middle accent-[#4A6FA5] cursor-pointer" />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 text-[14px] text-[#1A2332] whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`} style={{ fontWeight: 500 }}>{c.label}</th>
            ))}
            {rowActions && <th className="w-12 px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-3">
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                  <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>{emptyIcon}</span>
                </div>
                <div className="text-center">
                  <div className="text-[14px] text-[#1A2332]">{emptyTitle}</div>
                  {emptySubtitle && <div className="text-[12px] text-[#6B7280] mt-1">{emptySubtitle}</div>}
                </div>
                {/* No empty-state create button — use the + at the toolbar right (Marek Jun 16). */}
              </div>
            </td></tr>
          ) : pageRows.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-3 py-8 text-center text-[13px] text-[#9CA3AF]">{emptyText}</td></tr>
          ) : pageRows.map((row) => {
            const isSelected = selectedIds.has(row.id);
            return (
            <tr key={row.id} className={`border-b border-[#E5E7EB] last:border-0 ${isSelected ? "bg-[#F0F4FB]" : onRowClick ? "hover:bg-[#F9FAFB]" : ""} ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {selectable && (
                <td className="w-10 px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label="Select row" checked={isSelected} onChange={() => toggleRow(row.id)}
                    className="w-4 h-4 align-middle accent-[#4A6FA5] cursor-pointer" />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 align-middle whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`}>{c.render(row)}</td>
              ))}
              {rowActions && (
                <td className="px-3 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                  <KebabMenu>
                    {rowActions(row).map((a, i) => (
                      <div key={a.label}>
                        {a.separatorBefore && i > 0 && <KebabSeparator />}
                        <KebabItem icon={a.icon} destructive={a.destructive} onClick={() => a.onClick(row)}>{a.label}</KebabItem>
                      </div>
                    ))}
                  </KebabMenu>
                </td>
              )}
            </tr>
          );})}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F5F7FA] border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 text-[14px] text-[#6B7280]">
          <span>Rows per page:</span>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-8 pl-2 pr-1 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none">
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>{filtered.length === 0 ? "0-0" : `${(pageSafe - 1) * perPage + 1}-${Math.min(pageSafe * perPage, filtered.length)}`} of {filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1} aria-label="Previous page"
            className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages} aria-label="Next page"
            className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
