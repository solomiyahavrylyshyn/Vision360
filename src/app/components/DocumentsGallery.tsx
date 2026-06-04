import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentPreview, type PreviewableDoc } from "./DocumentPreview";
import { formatRegionalDate } from "../stores/regionalSettingsStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

// Self-contained documents/media gallery. Same UX as the Clients Documents tab:
// - top toolbar: search · date · category · uploader · sort · upload
// - split-view: dense thumbnail grid on the left + inline preview pane on the right
// - hover three-dots kebab per tile (Rename / Delete)
// - batch select with confirm-delete
// - full-screen DocumentPreview slide-over via expand button
// Controlled externally via `documents` + `onChange` so any host (ClientDetail
// Documents tab, JobDetail Overview > Documents column, JobDetail Documents tab)
// gets the exact same experience.

type SortField = "name" | "date" | "type" | "size" | "uploadedBy";
type SortDir = "asc" | "desc";

const DOCS_PER_PAGE = 24;

export function DocumentsGallery({
  documents,
  onChange,
  hideToolbarUpload = false,
  uploadTriggerRef,
}: {
  documents: PreviewableDoc[];
  onChange: (next: PreviewableDoc[]) => void;
  /** Hide the Upload button inside the toolbar (when the host renders its own trigger). */
  hideToolbarUpload?: boolean;
  /** Host can store a callback here and invoke it to open the file picker. */
  uploadTriggerRef?: React.MutableRefObject<(() => void) | null>;
}) {
  // Filters
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [uploader, setUploader] = useState("all");
  // Sort
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Selection / preview state
  const [previewIdx, setPreviewIdx] = useState(0);
  const [paneOpen, setPaneOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  // Rename / full preview
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose the file-picker trigger to the host so a header icon can drive uploads.
  useEffect(() => {
    if (uploadTriggerRef) {
      uploadTriggerRef.current = () => fileInputRef.current?.click();
      return () => { if (uploadTriggerRef) uploadTriggerRef.current = null; };
    }
  }, [uploadTriggerRef]);

  const uploaderOptions = useMemo(
    () => Array.from(new Set(documents.map((d) => d.uploadedBy).filter(Boolean) as string[])),
    [documents],
  );

  // Filter
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "all" && d.category !== category) return false;
      if (uploader !== "all" && d.uploadedBy !== uploader) return false;
      if (dateFilter !== "all") {
        const docTs = new Date(d.date).getTime();
        const days = dateFilter === "7" ? 7 : dateFilter === "30" ? 30 : 90;
        if (Number.isFinite(docTs) && Date.now() - docTs > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [documents, search, dateFilter, category, uploader]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortField) {
        case "name": av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case "date": av = new Date(a.date).getTime() || 0; bv = new Date(b.date).getTime() || 0; break;
        case "type": av = a.isImage ? "img" : (a.icon || ""); bv = b.isImage ? "img" : (b.icon || ""); break;
        case "size": av = parseFloat(a.size) || 0; bv = parseFloat(b.size) || 0; break;
        case "uploadedBy": av = (a.uploadedBy ?? "").toLowerCase(); bv = (b.uploadedBy ?? "").toLowerCase(); break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / DOCS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = sorted.slice(safePage * DOCS_PER_PAGE, safePage * DOCS_PER_PAGE + DOCS_PER_PAGE);

  // Preview safety
  const safeIdx = Math.min(previewIdx, Math.max(0, sorted.length - 1));
  const current = sorted[safeIdx];

  // Reset preview index when the list shrinks past it
  useEffect(() => {
    if (previewIdx > sorted.length - 1) setPreviewIdx(Math.max(0, sorted.length - 1));
  }, [sorted.length, previewIdx]);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const rename = (id: string, name: string) => onChange(documents.map((d) => (d.id === id ? { ...d, name } : d)));
  const remove = (id: string) => onChange(documents.filter((d) => d.id !== id));
  const removeMany = (ids: Set<string>) => onChange(documents.filter((d) => !ids.has(d.id)));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string): { icon: string; iconColor: string } => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { icon: "picture_as_pdf", iconColor: "#DC2626" };
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return { icon: "image", iconColor: "#2563EB" };
    if (["doc", "docx"].includes(ext || "")) return { icon: "description", iconColor: "#2563EB" };
    if (["xls", "xlsx"].includes(ext || "")) return { icon: "table_chart", iconColor: "#059669" };
    return { icon: "insert_drive_file", iconColor: "#6B7280" };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const today = formatRegionalDate(new Date());
    const additions: PreviewableDoc[] = [];
    Array.from(files).forEach((f) => {
      const docId = String(Date.now() + Math.random());
      const isImage = f.type.startsWith("image/");
      const doc: PreviewableDoc = { id: docId, name: f.name, size: formatSize(f.size), date: today, ...getFileIcon(f.name), isImage };
      additions.push(doc);
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          onChange([...documents, ...additions].map((d) => d.id === docId ? { ...d, previewUrl: String(reader.result) } : d));
        };
        reader.readAsDataURL(f);
      }
    });
    onChange([...additions, ...documents]);
  };

  const previewFile = documents.find((d) => d.id === fullPreviewId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "15px" }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search files…"
            className="h-8 pl-8 pr-3 w-[140px] rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#1A2332] placeholder:text-[#9CA3AF] outline-none focus:border-[#4A6FA5] focus:bg-white"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px] text-[#374151] outline-none focus:border-[#4A6FA5]"
        >
          <option value="all">Date: All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px] text-[#374151] outline-none focus:border-[#4A6FA5]"
        >
          <option value="all">All Categories</option>
          <option value="Photos">Photos</option>
          <option value="Documents">Documents</option>
          <option value="Agreements">Agreements</option>
        </select>
        <select
          value={uploader}
          onChange={(e) => { setUploader(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px] text-[#374151] outline-none focus:border-[#4A6FA5]"
        >
          <option value="all">All uploaders</option>
          {uploaderOptions.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[12px] text-[#374151] hover:bg-[#F5F7FA] flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "14px" }}>swap_vert</span>
              Sort
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "14px" }}>expand_more</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] p-1">
            {([
              { key: "name", label: "Name" },
              { key: "date", label: "Date" },
              { key: "type", label: "Type" },
              { key: "size", label: "Size" },
              { key: "uploadedBy", label: "Uploaded by" },
            ] as { key: SortField; label: string }[]).map((item) => (
              <DropdownMenuItem
                key={item.key}
                className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                onClick={() => setSortField(item.key)}
              >
                <span className="w-4 text-[#4A6FA5]">{sortField === item.key ? "•" : ""}</span>
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
            <div className="h-px bg-[#E5E7EB] my-1" />
            <DropdownMenuItem className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer" onClick={() => setSortDir("asc")}>
              <span className="w-4 text-[#4A6FA5]">{sortDir === "asc" ? "•" : ""}</span>
              <span>Ascending</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer" onClick={() => setSortDir("desc")}>
              <span className="w-4 text-[#4A6FA5]">{sortDir === "desc" ? "•" : ""}</span>
              <span>Descending</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        {!hideToolbarUpload && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3 gap-1.5 text-[13px] bg-[#4A6FA5] hover:bg-[#3d5a85] text-white rounded-md inline-flex items-center justify-center transition-colors shrink-0"
            style={{ fontWeight: 600 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
            Upload
          </button>
        )}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* ── Batch selection bar ───────────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-[#EEF3FA] border border-[#C5D5EC] rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>
            {selected.size} selected
          </span>
          <button
            onClick={() => setSelected(new Set(sorted.map((f) => f.id)))}
            className="text-[12px] text-[#4A6FA5] hover:underline"
            style={{ fontWeight: 500 }}
          >Select all</button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[12px] text-[#6B7280] hover:underline"
            style={{ fontWeight: 500 }}
          >Clear</button>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="h-8 px-3 flex items-center gap-1.5 border border-[#FCA5A5] bg-white hover:bg-[#FEF2F2] rounded-md text-[13px] text-[#DC2626] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
            Delete selected
          </button>
        </div>
      )}

      {/* ── Empty / Split-view ────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-12 text-center">
          <span className="material-icons text-[#D1D5DB] mb-2 block" style={{ fontSize: "40px" }}>folder_open</span>
          <div className="text-[13px] text-[#9CA3AF]">
            {search || dateFilter !== "all" || category !== "all" || uploader !== "all"
              ? "No documents match your filters"
              : "No documents yet"}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex" style={{ minHeight: 460 }}>
          {/* Left: thumbnail rail (3 cols when preview pane open, denser when closed) */}
          <div className={`${paneOpen ? "w-[230px] shrink-0 border-r border-[#F3F4F6]" : "flex-1"} flex flex-col`}>
            <div className="p-2 flex-1 overflow-y-auto">
              {!paneOpen && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>
                    Preview hidden — click any file to reopen
                  </span>
                  <button
                    onClick={() => setPaneOpen(true)}
                    className="h-7 px-2.5 inline-flex items-center gap-1 text-[12px] text-[#4A6FA5] border border-[#E5E7EB] rounded-md hover:bg-[#F5F7FA]"
                    style={{ fontWeight: 500 }}
                  >
                    <span className="material-icons" style={{ fontSize: "14px" }}>visibility</span>
                    Show preview
                  </button>
                </div>
              )}
              <div className={`grid gap-1.5 ${paneOpen ? "grid-cols-3" : "grid-cols-6 md:grid-cols-8 lg:grid-cols-10"}`}>
                {pageSlice.map((file) => {
                  const globalIdx = sorted.indexOf(file);
                  const isActive = globalIdx === safeIdx;
                  const isSelected = selected.has(file.id);
                  return (
                    <div
                      key={file.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPreviewIdx(globalIdx);
                          if (!paneOpen) setPaneOpen(true);
                        }
                      }}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || selected.size > 0) {
                          toggleSelected(file.id);
                        } else {
                          setPreviewIdx(globalIdx);
                          if (!paneOpen) setPaneOpen(true);
                        }
                      }}
                      className={`group relative aspect-[4/3] rounded overflow-hidden border transition-all cursor-pointer ${
                        isActive
                          ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/40"
                          : isSelected
                            ? "border-[#4A6FA5] ring-2 ring-[#4A6FA5]/30"
                            : "border-[#E5E7EB] hover:border-[#C5D5EC]"
                      }`}
                      title={`${file.name}\n${file.size} · ${file.date}${file.uploadedBy ? ` · ${file.uploadedBy}` : ""}`}
                    >
                      {file.isImage && file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                      ) : file.isImage ? (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
                        >
                          <span className="material-icons text-white/70" style={{ fontSize: "14px" }}>image</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: file.iconColor + "12" }}>
                          <span className="material-icons" style={{ fontSize: "14px", color: file.iconColor }}>{file.icon}</span>
                        </div>
                      )}
                      {file.category && (
                        <span className="absolute left-0.5 bottom-0.5 px-1 rounded text-[8px] text-white bg-[#16A34A]/85" style={{ fontWeight: 600 }}>
                          {file.category.charAt(0)}
                        </span>
                      )}
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleSelected(file.id); }}
                        className={`absolute top-0.5 left-0.5 ${isSelected || selected.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(file.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3 h-3 accent-[#4A6FA5] cursor-pointer"
                          aria-label={`Select ${file.name}`}
                        />
                      </span>
                      {selected.size === 0 && (
                        <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Options for ${file.name}`}
                                className="h-5 w-5 flex items-center justify-center rounded bg-white/95 hover:bg-white border border-[#E5E7EB] text-[#546478] shadow-sm"
                              >
                                <span className="material-icons" style={{ fontSize: "14px" }}>more_vert</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] p-1">
                              <DropdownMenuItem
                                className="h-9 px-3 text-[13px] text-[#374151] flex items-center gap-2.5 cursor-pointer"
                                onClick={() => { setRenameId(file.id); setRenameDraft(file.name); }}
                              >
                                <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>edit</span>
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="h-9 px-3 text-[13px] text-[#DC2626] flex items-center gap-2.5 cursor-pointer"
                                onClick={() => remove(file.id)}
                              >
                                <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="px-2.5 py-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]"
                >Prev</button>
                <span className="tabular-nums">{safePage + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="px-1.5 py-0.5 disabled:opacity-40 hover:text-[#374151]"
                >Next</button>
              </div>
            )}
          </div>

          {/* Right: preview pane (collapsible) */}
          {paneOpen && (
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="bg-[#FAFBFC] p-4 flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-[680px] aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#E5E7EB] flex items-center justify-center">
                  {current?.isImage && current.previewUrl ? (
                    <img src={current.previewUrl} alt={current.name} className="w-full h-full object-cover" />
                  ) : current?.isImage ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: current.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}>
                      <span className="material-icons text-white/70" style={{ fontSize: "64px" }}>image</span>
                    </div>
                  ) : current ? (
                    <div className="flex flex-col items-center gap-2 text-center px-6">
                      <span className="material-icons" style={{ fontSize: "64px", color: current.iconColor, opacity: 0.85 }}>{current.icon}</span>
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{current.name}</div>
                      <div className="text-[12px] text-[#9CA3AF]">{current.size} · {current.date}</div>
                    </div>
                  ) : null}
                  {/* Close + expand are anchored to the IMAGE corners (not the pane)
                      so they stay pinned to the photo even when it shrinks. */}
                  <button
                    onClick={() => setPaneOpen(false)}
                    className="absolute top-2 left-2 z-10 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors"
                    title="Close preview"
                    aria-label="Close preview"
                  >
                    <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
                  </button>
                  {current && (
                    <button
                      onClick={() => setFullPreviewId(current.id)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors"
                      title="Open full preview"
                    >
                      <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>open_in_full</span>
                    </button>
                  )}
                  {current?.category && (
                    <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md text-[11px] text-white bg-[#16A34A]" style={{ fontWeight: 600 }}>
                      {current.category}
                    </span>
                  )}
                </div>
              </div>
              {/* Navigation row below the image — dark pills so they stay
                  visible against the light gallery background, and they no
                  longer overlap the photo. */}
              {sorted.length > 1 && (
                <div className="flex items-center justify-center gap-3 px-4 pt-3 pb-1">
                  <button
                    onClick={() => setPreviewIdx((i) => (i - 1 + sorted.length) % sorted.length)}
                    className="h-9 w-9 rounded-full bg-[#4A6FA5] hover:bg-[#3d5a85] text-white flex items-center justify-center transition-colors shadow-sm"
                    title="Previous"
                    aria-label="Previous"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
                  </button>
                  <span className="text-[12px] tabular-nums text-[#6B7280]" style={{ fontWeight: 500 }}>
                    {safeIdx + 1} / {sorted.length}
                  </span>
                  <button
                    onClick={() => setPreviewIdx((i) => (i + 1) % sorted.length)}
                    className="h-9 w-9 rounded-full bg-[#4A6FA5] hover:bg-[#3d5a85] text-white flex items-center justify-center transition-colors shadow-sm"
                    title="Next"
                    aria-label="Next"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
                  </button>
                </div>
              )}
              {current && (
                <div className="px-4 py-2 border-t border-[#F3F4F6] text-[12px] text-[#6B7280] truncate" title={current.name}>
                  {current.name}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full DocumentPreview slide-over (for "open in full" + rename / download / delete) */}
      <DocumentPreview
        file={previewFile}
        onClose={() => setFullPreviewId(null)}
        onRename={(id, name) => rename(id, name)}
        onDelete={(id) => { remove(id); setFullPreviewId(null); }}
      />

      {/* Rename modal */}
      {renameId != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setRenameId(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          <div className="relative bg-white rounded-xl shadow-2xl w-[440px] max-w-[92vw] p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] text-[#1A2332] mb-3" style={{ fontWeight: 600 }}>Rename document</h2>
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && renameDraft.trim()) { rename(renameId, renameDraft.trim()); setRenameId(null); } }}
              className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] outline-none focus:border-[#4A6FA5]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRenameId(null)} className="h-9 px-4 border border-[#E5E7EB] rounded-lg text-[14px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                disabled={!renameDraft.trim()}
                onClick={() => { rename(renameId, renameDraft.trim()); setRenameId(null); }}
                className="h-9 px-4 bg-[#4A6FA5] text-white rounded-lg text-[14px] hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 500 }}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch delete confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmBulkDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <span className="material-icons" style={{ fontSize: "20px", color: "#DC2626" }}>delete_outline</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                  Delete {selected.size} {selected.size === 1 ? "file" : "files"}?
                </h3>
                <p className="text-[13px] text-[#6B7280] leading-[18px]">
                  The selected {selected.size === 1 ? "file" : "files"} will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmBulkDelete(false)} className="h-9 px-4 border border-[#D8DEE8] hover:bg-[#F5F7FA] text-[#546478] text-[13px] rounded-md transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => {
                  removeMany(selected);
                  setSelected(new Set());
                  setConfirmBulkDelete(false);
                }}
                className="h-9 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
