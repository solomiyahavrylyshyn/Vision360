// Shared list-pagination footer — one source of truth so every list page shows
// the identical bar (Figma node 1139-93242): "Rows per page: N   X-Y of Z   ‹ ›".
// Controlled: pass page / perPage / total + change handlers; the displayed range
// and the prev/next disabled state are derived here so no list drifts.

type PaginationFooterProps = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
};

export function PaginationFooter({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50],
  className = "",
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const end = Math.min(safePage * perPage, total);

  return (
    <div className={`flex items-center justify-between bg-white px-4 py-3 border-t border-[#E5E7EB] ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-[14px] text-[#6B7280]">Rows per page:</span>
        <select
          value={perPage}
          onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="h-9 rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-7 text-[14px] text-[#1A2332] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] cursor-pointer"
        >
          {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-[14px] text-[#6B7280]" style={{ fontVariantNumeric: "tabular-nums" }}>
          {total === 0 ? "0-0" : `${start}-${end}`} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
        </button>
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="w-9 h-9 flex items-center justify-center text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}
