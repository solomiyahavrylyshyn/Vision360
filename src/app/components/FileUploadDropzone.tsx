// The one file field of the web app: a dashed "Drop your files here, or click to
// browse" box, as FileUploadDropzone in the web-app (develop). It is used for
// payment attachments, expense receipts, item images (create and edit), the
// company logo, Terms / Policies / Privacy files and the items CSV import.
// The whole box opens the file picker, and a file dragged onto it is taken.
// What the field does with the files is up to the page; the box only picks them.
import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

type Props = {
  accept?: string;
  /** "click to browse" (CSV import: "browse"). */
  browseLabel?: string;
  /** "Drop your files here, or" — the text before the link. */
  descriptionPrefix?: string;
  disabled?: boolean;
  /** Formats and size, e.g. "SVG, PNG, JPG or GIF (max. 3MB)". */
  hint: string;
  multiple?: boolean;
  onFilesSelected?: (files: FileList) => void;
  className?: string;
};

export function FileUploadDropzone({
  accept,
  browseLabel = "click to browse",
  descriptionPrefix = "Drop your files here, or",
  disabled = false,
  hint,
  multiple = false,
  onFilesSelected,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (files: FileList | null) => { if (files && files.length > 0) onFilesSelected?.(files); };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    if (!disabled) take(e.dataTransfer.files);
  };

  return (
    <div
      aria-disabled={disabled}
      className={`relative rounded-xl px-6 py-6 transition-colors duration-200 ${
        disabled ? "pointer-events-none bg-white opacity-50" : `cursor-pointer hover:bg-[#F5F7FA] ${over ? "bg-[#F5F7FA]" : "bg-white"}`
      } ${className}`}
      onClick={() => inputRef.current?.click()}
      onDragLeave={() => setOver(false)}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDrop={onDrop}
    >
      {/* The dashed edge is drawn, not a CSS border, so the dashes are short and even. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
        <rect x="0.5" y="0.5" style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }} rx="12" stroke={over ? "#4A6FA5" : "#E5E7EB"} strokeDasharray="4 4" strokeWidth="1" />
      </svg>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white">
          <Upload className="h-4 w-4 text-[#1A2332]" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-1 text-[14px] leading-[18px] text-[#1A2332]">
            <span>{descriptionPrefix}</span>
            <button
              type="button"
              disabled={disabled}
              className="text-[#4A6FA5] underline"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              {browseLabel}
            </button>
          </div>
          <span className="mt-1 text-[12px] leading-4 text-[#6B7280]">{hint}</span>
        </div>
      </div>
    </div>
  );
}
