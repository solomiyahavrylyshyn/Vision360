import { NOTE_LIMIT, NOTE_WARN_AT } from "../stores/noteDefaultsStore";

// Custom-note fields (behaviour spec "Vision360 Custom Notes").
//
// NoteCounter       "123 / 500", amber from 450, red at the limit.
// DefaultNoteField  the Settings textarea that holds a company default.
// DocumentNoteField the note on one document: it starts as a copy of the
//                   default and says where its text came from —
//                     From Settings           unchanged copy
//                     Edited for this <doc>   changed here; Reset to default
//                     Empty                   nothing prints
//                     Locked · Paid / Void    read-only

export function NoteCounter({ length }: { length: number }) {
  const color = length >= NOTE_LIMIT ? "#DC2626" : length >= NOTE_WARN_AT ? "#B45309" : "#8899AA";
  return (
    <span className="text-[12px]" style={{ color, fontVariantNumeric: "tabular-nums" }}>
      {length} / {NOTE_LIMIT}
    </span>
  );
}

const fieldCls =
  "w-full resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] leading-5 text-[#1A2332] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";

export function DefaultNoteField({
  id, label, help, value, onChange, rows = 3,
}: { id: string; label: string; help?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{label}</label>
        <NoteCounter length={value.length} />
      </div>
      <textarea
        id={id}
        rows={rows}
        maxLength={NOTE_LIMIT}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, NOTE_LIMIT))}
        className={`min-h-[76px] ${fieldCls}`}
      />
      {help && <p className="text-[12px] leading-4 text-[#6B7280]">{help}</p>}
    </div>
  );
}

type Origin = { label: string; color: string; bg: string };

export function noteOrigin(text: string, copiedFrom: string | undefined, locked: string | false, docLabel: string): Origin {
  if (locked) return { label: `Locked · ${locked}`, color: "#DC2626", bg: "#FEE2E2" };
  if (!text.trim()) return { label: "Empty", color: "#546478", bg: "#EDF0F5" };
  if (copiedFrom !== undefined && text === copiedFrom) return { label: "From Settings", color: "#16A34A", bg: "#DCFCE7" };
  return { label: `Edited for this ${docLabel}`, color: "#4A6FA5", bg: "#EBF0F8" };
}

export function DocumentNoteField({
  id, value, copiedFrom, currentDefault, onChange, onReset, locked = false, docLabel, placeholder, rows = 4,
}: {
  id: string;
  value: string;
  /** The default text this document was created with. */
  copiedFrom?: string;
  /** The default as it is in Settings now — what Reset brings back. */
  currentDefault: string;
  onChange: (v: string) => void;
  onReset: () => void;
  /** Status name when the document is closed (e.g. "Paid"), otherwise false. */
  locked?: string | false;
  docLabel: string;
  placeholder?: string;
  rows?: number;
}) {
  const origin = noteOrigin(value, copiedFrom, locked, docLabel);
  // Reset is offered only once the text differs from what the document started with.
  const edited = !locked && value !== (copiedFrom ?? currentDefault);
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        id={id}
        rows={rows}
        maxLength={NOTE_LIMIT}
        value={value}
        readOnly={!!locked}
        onChange={(e) => onChange(e.target.value.slice(0, NOTE_LIMIT))}
        placeholder={placeholder ?? `Add a note for this ${docLabel}…`}
        className={`${fieldCls} ${locked ? "cursor-not-allowed bg-[#F9FAFB] text-[#546478]" : "bg-white"}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[12px] whitespace-nowrap"
          style={{ fontWeight: 600, color: origin.color, backgroundColor: origin.bg }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: origin.color }} />
          {origin.label}
        </span>
        <span className="flex items-center gap-3">
          {edited && (
            <button
              type="button"
              onClick={onReset}
              title={currentDefault ? `Replace with: ${currentDefault}` : "The default in Settings is empty"}
              className="text-[12px] text-[#4A6FA5] hover:underline"
              style={{ fontWeight: 600 }}
            >
              Reset to default
            </button>
          )}
          <NoteCounter length={value.length} />
        </span>
      </div>
    </div>
  );
}
