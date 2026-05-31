import { Button } from "./button";

// Reusable destructive confirmation dialog — Figma "Delete this?" (489:34912).
export function ConfirmDialog({
  open,
  title = "Delete this?",
  message = "Are you sure you want to delete this item?",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[480px] max-w-[92vw] p-8 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "1.35" }}>{title}</h2>
        <p className="text-[14px] text-[#6B7280] leading-[20px]">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel} className="border-[#E5E7EB] text-[#1A2332] hover:bg-[#F5F7FA] h-9 px-4 text-[14px] rounded-lg">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white h-9 px-4 text-[14px] rounded-lg">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
