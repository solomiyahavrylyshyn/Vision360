import { useState } from "react";
import { DocumentPreview, type PreviewableDoc } from "./DocumentPreview";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

// Reusable documents/media gallery — the same experience as the client Documents tab:
// a thumbnail grid, a hover three-dots kebab (Rename / Delete) per item, and a
// centered preview modal (DocumentPreview). Controlled via `documents` + `onChange`.
export function DocumentsGallery({
  documents,
  onChange,
}: {
  documents: PreviewableDoc[];
  onChange: (next: PreviewableDoc[]) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const previewFile = documents.find((d) => d.id === previewId) ?? null;
  const rename = (id: string, name: string) => onChange(documents.map((d) => (d.id === id ? { ...d, name } : d)));
  const remove = (id: string) => onChange(documents.filter((d) => d.id !== id));

  return (
    <div className="p-3">
      {documents.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[#9CA3AF]">No documents yet</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {documents.map((file) => (
            <div
              key={file.id}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewId(file.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(file.id); } }}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E5E7EB] hover:border-[#C5D5EC] cursor-pointer transition-all"
              title={file.name}
            >
              {file.isImage && file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: file.iconColor + "12" }}>
                  <span className="material-icons" style={{ fontSize: "22px", color: file.iconColor }}>{file.icon}</span>
                </div>
              )}
              {file.category && (
                <span className="absolute left-1 bottom-1 px-1.5 py-0.5 rounded text-[9px] text-white bg-[#16A34A]/85" style={{ fontWeight: 600 }}>
                  {file.category}
                </span>
              )}
              {/* Hover kebab → rename / delete (same as the client Documents tab) */}
              <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Options for ${file.name}`}
                      className="h-6 w-6 flex items-center justify-center rounded bg-white/95 hover:bg-white border border-[#E5E7EB] text-[#546478] shadow-sm"
                    >
                      <span className="material-icons" style={{ fontSize: "15px" }}>more_vert</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px] p-1">
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
            </div>
          ))}
        </div>
      )}

      {/* Centered preview modal (reused from the client Documents tab) */}
      <DocumentPreview
        file={previewFile}
        onClose={() => setPreviewId(null)}
        onRename={(id, name) => rename(id, name)}
        onDelete={(id) => { remove(id); setPreviewId(null); }}
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
    </div>
  );
}
