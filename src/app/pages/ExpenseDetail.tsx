import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { CategoryPill } from "../components/ui/category-pill";
import { mockExpenses, type Expense } from "./Expenses";
import installWaterHeaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import tanklessWaterHeaterPhoto from "../../assets/documents/34689-install-water-heater-tankless.jpg";

const expenseOverrides: Record<
  string,
  Partial<Expense> & { documentNumber?: string; tax?: number; description?: string }
> = {
  "1": {
    merchant: "Home Depot",
    date: "Apr 5, 2026",
    category: "Materials",
    amount: 45.23,
    tax: 2.4,
    jobId: "J-1234",
    jobTitle: "HVAC Installation",
    description: "Supplies for commercial HVAC project",
    notes: "Returned 2 unused fittings — credit expected on next statement.",
    documentNumber: "Rcp-72545786",
  },
};

// Documents are scoped per expense id (no cross-entity sharing). Only the demo
// expense "1" has attached documents; every other expense starts empty.
const expenseDocsById: Record<string, { label: string; src: string }[]> = {
  "1": [
    { label: "Receipt", src: installWaterHeaterPhoto },
    { label: "Photo", src: tanklessWaterHeaterPhoto },
  ],
};

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

type Note = { id: number; date: string; text: string };

export function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const baseExpense: Expense | undefined = mockExpenses.find(e => e.id === id);
  const override = id ? expenseOverrides[id] : undefined;
  const expense = baseExpense ? { ...baseExpense, ...override } : undefined;

  const documentNumber = override?.documentNumber ?? (expense ? `Rcp-${expense.id.padStart(6, "0")}` : "");
  const tax = override?.tax ?? (expense ? Number((expense.amount * 0.075).toFixed(2)) : 0);
  const description = override?.description ?? baseExpense?.notes ?? "";
  const internalNotes = override?.description ? override?.notes : undefined;

  // Documents browser — scoped to THIS expense id only (Figma 1141:107173).
  const documents = (id && expenseDocsById[id]) || [];
  const [selectedDoc, setSelectedDoc] = useState(0);

  // Notes timeline (Figma 1141:106522) — add / edit / delete + "Show N more".
  const [notes, setNotes] = useState<Note[]>(() => {
    const seed: string[] = [];
    if (internalNotes) seed.push(internalNotes);
    seed.push("Partial payment on overdue invoice", "Awaiting receipt confirmation from vendor", "Logged against the HVAC install job");
    return seed.map((text, i) => ({ id: i + 1, date: "Mar 10, 2026", text }));
  });
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  // Details card is editable via the pencil → modal (Marek: edit in a modal).
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    documentNumber,
    vendor: expense?.merchant ?? "",
    description,
  });

  if (!expense) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8">
        <button
          onClick={() => navigate("/expenses")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85]"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Expenses
        </button>
        <div className="mt-6 text-[14px] text-[#546478]">Expense not found.</div>
      </div>
    );
  }

  const currentDoc = documents[selectedDoc] ?? documents[0];
  const visibleNotes = showAll ? notes : notes.slice(0, 3);

  const saveNote = () => {
    if (!editing || !editing.text.trim()) { setEditing(null); return; }
    setNotes(prev => editing.id === 0
      ? [{ id: (prev.at(-1)?.id ?? 0) + 1, date: "Today", text: editing.text.trim() }, ...prev]
      : prev.map(n => (n.id === editing.id ? { ...n, text: editing.text.trim() } : n)));
    setEditing(null);
    toast.success("Note saved");
  };

  const duplicate = () => {
    const params = new URLSearchParams({ dup: "1" });
    if (expense.merchant) params.set("vendor", expense.merchant);
    if (expense.category) params.set("category", expense.category);
    if (description) params.set("description", description);
    if (internalNotes) params.set("notes", internalNotes);
    if (expense.jobId) params.set("fromJob", expense.jobId);
    navigate(`/expenses/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Page header — back arrow + title (Figma 1141:106450) */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <button
          onClick={() => navigate("/expenses")}
          aria-label="Back to Expenses"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#546478] hover:bg-[#EDF0F5] transition-colors"
        >
          <span className="material-icons" style={{ fontSize: "20px" }}>arrow_back</span>
        </button>
        <h1 className="text-[24px] text-[#1A2332] leading-[32px]" style={{ fontWeight: 600 }}>Expense details</h1>
      </div>

      <section className="mx-6 mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4">
        {/* Header row: merchant + date + category badge | Total/Tax KPIs (Figma 1141:106456) */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[20px] leading-[27px] text-[#1A2332]" style={{ fontWeight: 600 }}>{expense.merchant}</h2>
            <span className="shrink-0 text-[16px] leading-[24px] text-[#6B7280]">{expense.date}</span>
            <CategoryPill category={expense.category} className="shrink-0 rounded-lg px-2 py-0.5 text-[12px]" />
          </div>

          <div className="flex shrink-0 items-center">
            {[
              { val: money(expense.amount), label: "Total", icon: "monetization_on", color: "#16A34A", bg: "rgba(22,163,74,0.15)" },
              { val: money(tax), label: "Tax", icon: "payments", color: "#4A6FA5", bg: "rgba(74,111,165,0.15)" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div className="mx-4 h-6 w-px bg-[#E5E7EB]" />}
                <div className="flex flex-col">
                  <div className="text-[18px] leading-none text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                  <div className="text-[14px] leading-[20px] text-[#6B7280]">{s.label}</div>
                </div>
              </div>
            ))}
            <div className="ml-4">
              <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#F5F7FA] bg-white">
                <KebabItem icon="content_copy" onSelect={duplicate}>Duplicate</KebabItem>
                <KebabSeparator />
                <KebabItem icon="archive" destructive>Archive</KebabItem>
              </KebabMenu>
            </div>
          </div>
        </div>

        {/* 3-column body: Details / Documents / Notes (Figma 1141:106489).
            items-stretch → all three cards share the tallest card's height,
            regardless of how much content each holds. */}
        <div className="mt-4 grid grid-cols-[176px_minmax(0,1fr)_360px] gap-4 items-stretch">
          {/* Col 1 — Details */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details</h3>
              <button onClick={() => setEditDetailsOpen(true)} aria-label="Edit details" title="Edit details" className="text-[#9CA3AF] hover:text-[#4A6FA5]">
                <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <DetailBlock label="Document number" value={detailsForm.documentNumber} />
              <DetailBlock label="Vendor" value={detailsForm.vendor || "—"} />
              {expense.jobId ? (
                <div>
                  <div className="mb-1 text-[14px] text-[#6B7280] leading-[20px]">Job</div>
                  <button
                    onClick={() => navigate(`/jobs/${expense.jobId!.replace("J-", "")}`)}
                    className="block text-left text-[14px] text-[#4A6FA5] hover:underline leading-[16px]"
                  >
                    #{expense.jobId}
                  </button>
                  <div className="text-[14px] text-[#1A2332] leading-[20px]">{expense.jobTitle || "—"}</div>
                </div>
              ) : (
                <DetailBlock label="Job" value="—" />
              )}
              <DetailBlock label="Expense description" value={detailsForm.description || "—"} />
            </div>
          </div>

          {/* Col 2 — Documents browser */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            {/* search + view toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-9 w-[294px] items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3">
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                <input type="text" placeholder="Search documents" className="w-full bg-transparent text-[14px] text-[#1A2332] placeholder:text-[#6B7280] focus:outline-none" />
              </div>
              <button aria-label="Grid view" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#546478] hover:bg-[#F5F7FA]">
                <span className="material-icons" style={{ fontSize: "16px" }}>grid_view</span>
              </button>
            </div>
            {/* filter row */}
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-3">
              {[{ k: "Date", v: "All time" }, { k: "Categories", v: "All" }, { k: "Uploaders", v: "All" }].map(f => (
                <button key={f.k} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-2 text-[14px] hover:bg-[#F5F7FA]">
                  <span className="text-[#6B7280]">{f.k}:</span>
                  <span className="text-[#1A2332]">{f.v}</span>
                  <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>expand_more</span>
                </button>
              ))}
              <button aria-label="Filter" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#546478] hover:bg-[#F5F7FA]">
                <span className="material-icons" style={{ fontSize: "16px" }}>tune</span>
              </button>
            </div>
            {/* thumbnail grid + preview — only this expense's own documents */}
            {documents.length > 0 ? (
            <div className="mt-3 flex gap-4">
              <div className="grid max-h-[400px] w-[160px] shrink-0 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDoc(idx)}
                    className={`h-[60px] overflow-hidden rounded-md border ${selectedDoc === idx ? "border-[#4A6FA5] ring-1 ring-[#4A6FA5]" : "border-[#E5E7EB]"}`}
                  >
                    <img src={doc.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-[#F5F7FA]">
                <img src={currentDoc.src} alt="Expense document" className="h-[400px] w-full object-cover" />
                <button aria-label="Expand" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-[#1A2332] shadow-sm hover:bg-white">
                  <span className="material-icons" style={{ fontSize: "18px" }}>open_in_full</span>
                </button>
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setSelectedDoc((selectedDoc - 1 + documents.length) % documents.length)}
                    aria-label="Previous"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1A2332] shadow-sm hover:bg-white"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
                  </button>
                  <span className="rounded bg-black/70 px-2 py-0.5 text-[12px] leading-5 text-white" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {selectedDoc + 1}/{documents.length}
                  </span>
                  <button
                    onClick={() => setSelectedDoc((selectedDoc + 1) % documents.length)}
                    aria-label="Next"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1A2332] shadow-sm hover:bg-white"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFBFC] py-16 text-center">
                <div className="w-10 h-10 mb-3 bg-[#F5F7FA] rounded-full flex items-center justify-center">
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "20px" }}>upload</span>
                </div>
                <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>No documents yet</div>
                <div className="mt-1 text-[12px] text-[#8899AA]">Upload files to keep everything in one place</div>
                <button className="mt-4 h-8 px-3 rounded-md bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[13px] inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>upload</span> Upload
                </button>
              </div>
            )}
          </div>

          {/* Col 3 — Notes */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</h3>
              <button onClick={() => setEditing({ id: 0, text: "" })} className="text-[#9CA3AF] hover:text-[#4A6FA5]" aria-label="Add note">
                <span className="material-icons" style={{ fontSize: "18px" }}>add_circle_outline</span>
              </button>
            </div>

            {editing?.id === 0 && (
              <NoteEditor editing={editing} setEditing={setEditing} onSave={saveNote} />
            )}

            {notes.length === 0 && editing?.id !== 0 ? (
              <div className="py-4 text-center text-[12px] text-[#9CA3AF]">No notes yet</div>
            ) : (
              <div className="flex flex-col">
                {visibleNotes.map(n => (
                  editing?.id === n.id ? (
                    <NoteEditor key={n.id} editing={editing} setEditing={setEditing} onSave={saveNote} />
                  ) : (
                    <div key={n.id} className="group border-b border-[#EDF0F5] py-2.5 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[14px] text-[#6B7280] leading-[20px]">Added {n.date}</div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => setEditing({ id: n.id, text: n.text })} className="text-[#9CA3AF] hover:text-[#4A6FA5]" aria-label="Edit note"><span className="material-icons" style={{ fontSize: "15px" }}>edit</span></button>
                          <button onClick={() => setNotes(p => p.filter(x => x.id !== n.id))} className="text-[#9CA3AF] hover:text-[#DC2626]" aria-label="Delete note"><span className="material-icons" style={{ fontSize: "15px" }}>delete_outline</span></button>
                        </div>
                      </div>
                      <div className="mt-0.5 text-[14px] text-[#1A2332] leading-[20px]">{n.text}</div>
                    </div>
                  )
                ))}
                {notes.length > 3 && (
                  <button onClick={() => setShowAll(v => !v)} className="mt-3 text-center text-[12px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                    {showAll ? "Show less" : `Show ${notes.length - 3} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {editDetailsOpen && (
        <EditDetailsModal
          form={detailsForm}
          onClose={() => setEditDetailsOpen(false)}
          onSave={(next) => { setDetailsForm(next); setEditDetailsOpen(false); toast.success("Details updated"); }}
        />
      )}
    </div>
  );
}

function EditDetailsModal({ form, onClose, onSave }: {
  form: { documentNumber: string; vendor: string; description: string };
  onClose: () => void;
  onSave: (f: { documentNumber: string; vendor: string; description: string }) => void;
}) {
  const [documentNumber, setDocumentNumber] = useState(form.documentNumber);
  const [vendor, setVendor] = useState(form.vendor);
  const [description, setDescription] = useState(form.description);
  const labelCls = "mb-1 block text-[13px] text-[#374151]";
  const inputCls = "w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2332]/40 p-4" onClick={onClose}>
      <div className="w-[420px] max-w-full rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Edit details</h3>
          <button onClick={onClose} aria-label="Close" className="text-[#9CA3AF] hover:text-[#1A2332]"><span className="material-icons" style={{ fontSize: "20px" }}>close</span></button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div><label className={labelCls}>Document number</label><input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Vendor</label><input value={vendor} onChange={(e) => setVendor(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Expense description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px] w-full resize-y rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]" /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4">
          <button onClick={onClose} className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
          <button onClick={() => onSave({ documentNumber, vendor, description })} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ editing, setEditing, onSave }: { editing: { id: number; text: string }; setEditing: (n: { id: number; text: string } | null) => void; onSave: () => void }) {
  return (
    <div className="mb-3 rounded-lg border border-[#E5E7EB] p-2">
      <textarea
        value={editing.text}
        onChange={(e) => setEditing({ ...editing, text: e.target.value })}
        placeholder="Add a note…"
        autoFocus
        className="min-h-[60px] w-full resize-y rounded-md border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-[#1A2332] outline-none focus:border-[#4A6FA5]"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={() => setEditing(null)} className="h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-[12px] text-[#546478] hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>Cancel</button>
        <button onClick={onSave} className="h-8 rounded-md bg-[#4A6FA5] px-3 text-[12px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 600 }}>Save</button>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[14px] text-[#6B7280] leading-[20px]">{label}</div>
      <div className="text-[14px] leading-[20px] text-[#1A2332]">{value}</div>
    </div>
  );
}
