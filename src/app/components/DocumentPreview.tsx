import { useEffect, useState } from "react";

// Right-side preview panel for a document/photo.
// Supports: open preview (image inline / icon for non-image),
// rename, download, and delete-with-confirmation.

export interface PreviewableDoc {
  id: string;
  name: string;
  size: string;
  date: string;
  icon: string;
  iconColor: string;
  isImage?: boolean;
  previewUrl?: string;
  previewGradient?: string;
  uploadedBy?: string;
  category?: string;
}

interface Props {
  file: PreviewableDoc | null;
  onClose: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDownload?: (file: PreviewableDoc) => void;
}

export function DocumentPreview({ file, onClose, onRename, onDelete, onDownload }: Props) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset internal state whenever the selected file changes / closes.
  useEffect(() => {
    setRenaming(false);
    setNameDraft(file?.name ?? "");
    setConfirmDelete(false);
  }, [file?.id]);

  // Close on Escape
  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(false);
        else if (renaming) setRenaming(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, renaming, confirmDelete, onClose]);

  if (!file) return null;

  const handleSaveRename = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === file.name) {
      setRenaming(false);
      return;
    }
    onRename(file.id, trimmed);
    setRenaming(false);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
      return;
    }
    // Default: trigger a download from the preview URL if it exists.
    if (file.previewUrl) {
      const a = document.createElement("a");
      a.href = file.previewUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Right-side panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-[480px] max-w-[100vw] bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col"
        role="dialog"
        aria-label={`Preview: ${file.name}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-5 h-14 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="material-icons shrink-0"
              style={{ fontSize: "20px", color: file.iconColor }}
            >
              {file.icon}
            </span>
            <h2 className="text-[14px] text-[#1A2332] truncate" style={{ fontWeight: 600 }} title={file.name}>
              {file.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F7FA] text-[#6B7280] transition-colors shrink-0"
            aria-label="Close"
            title="Close"
          >
            <span className="material-icons" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-[#F5F7FA] flex items-center justify-center p-5">
          {file.isImage ? (
            file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-md shadow-sm"
              />
            ) : (
              <div
                className="w-full max-w-[340px] aspect-[4/3] rounded-md flex items-center justify-center"
                style={{ background: file.previewGradient ?? "linear-gradient(135deg,#fde68a,#f59e0b)" }}
              >
                <span className="material-icons text-white/80" style={{ fontSize: "80px" }}>image</span>
              </div>
            )
          ) : (
            <div
              className="w-full max-w-[340px] aspect-[4/3] rounded-md flex flex-col items-center justify-center gap-3"
              style={{ backgroundColor: file.iconColor + "12" }}
            >
              <span className="material-icons" style={{ fontSize: "96px", color: file.iconColor, opacity: 0.85 }}>{file.icon}</span>
              <div className="text-[12px] text-[#6B7280]" style={{ fontWeight: 500 }}>No inline preview available</div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="px-5 py-4 border-t border-[#E5E7EB] shrink-0">
          {renaming ? (
            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-[#9CA3AF] mb-1" style={{ fontWeight: 600 }}>
                Rename
              </label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") setRenaming(false);
                  }}
                  className="flex-1 h-9 px-3 border border-[#4A6FA5] rounded-md text-[13px] text-[#1A2332] outline-none focus:ring-2 focus:ring-[#4A6FA5]/20"
                />
                <button
                  onClick={handleSaveRename}
                  disabled={!nameDraft.trim()}
                  className="h-9 px-3 bg-[#4A6FA5] hover:bg-[#3d5a85] disabled:opacity-50 text-white text-[13px] rounded-md transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setRenaming(false); setNameDraft(file.name); }}
                  className="h-9 px-3 border border-[#D8DEE8] hover:bg-[#F5F7FA] text-[#546478] text-[13px] rounded-md transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-[88px_1fr] gap-y-2 text-[12px]">
            <dt className="text-[#9CA3AF]">Name</dt>
            <dd className="text-[#1A2332] truncate" title={file.name}>{file.name}</dd>
            <dt className="text-[#9CA3AF]">Size</dt>
            <dd className="text-[#1A2332]">{file.size}</dd>
            <dt className="text-[#9CA3AF]">Date</dt>
            <dd className="text-[#1A2332]">{file.date}</dd>
            {file.uploadedBy && (
              <>
                <dt className="text-[#9CA3AF]">Uploaded by</dt>
                <dd className="text-[#1A2332]">{file.uploadedBy}</dd>
              </>
            )}
            {file.category && (
              <>
                <dt className="text-[#9CA3AF]">Category</dt>
                <dd className="text-[#1A2332]">{file.category}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] shrink-0 flex items-center gap-2">
          <button
            onClick={() => setRenaming(true)}
            className="h-9 px-3 flex items-center gap-1.5 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
            Rename
          </button>
          <button
            onClick={handleDownload}
            className="h-9 px-3 flex items-center gap-1.5 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>file_download</span>
            Download
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmDelete(true)}
            className="h-9 px-3 flex items-center gap-1.5 border border-[#FCA5A5] bg-white hover:bg-[#FEF2F2] rounded-md text-[13px] text-[#DC2626] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
            Delete
          </button>
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-doc-title"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <span className="material-icons" style={{ fontSize: "20px", color: "#DC2626" }}>delete_outline</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="delete-doc-title" className="text-[16px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
                  Delete this file?
                </h3>
                <p className="text-[13px] text-[#6B7280] leading-[18px]">
                  <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>{file.name}</span> will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-9 px-4 border border-[#D8DEE8] hover:bg-[#F5F7FA] text-[#546478] text-[13px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(file.id);
                  setConfirmDelete(false);
                  onClose();
                }}
                className="h-9 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] rounded-md transition-colors"
                style={{ fontWeight: 500 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
