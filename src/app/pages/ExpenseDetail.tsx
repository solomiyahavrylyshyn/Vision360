import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { CategoryPill } from "../components/ui/category-pill";
import { mockExpenses, type Expense } from "./Expenses";
import installWaterHeaterPhoto from "../../assets/documents/34285-install-water-heater.jpg";
import tanklessWaterHeaterPhoto from "../../assets/documents/34689-install-water-heater-tankless.jpg";

type AttachmentTab = "media" | "files";

const expenseOverrides: Record<string, Partial<Expense> & { documentNumber?: string; tax?: number }> = {
  "1": {
    merchant: "Home Depot",
    date: "Apr 5, 2026",
    category: "Materials",
    amount: 45.23,
    tax: 2.4,
    jobId: "J-1234",
    jobTitle: "HVAC Installation",
    invoiceId: "INV-0042",
    notes: "Supplies for commercial HVAC project",
    documentNumber: "Rcp-72545786",
  },
};

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

export function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [attachmentTab, setAttachmentTab] = useState<AttachmentTab>("media");
  const [selectedMedia, setSelectedMedia] = useState(0);

  const baseExpense: Expense | undefined = mockExpenses.find(e => e.id === id);
  const override = id ? expenseOverrides[id] : undefined;
  const expense = baseExpense ? { ...baseExpense, ...override } : undefined;

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

  const documentNumber = override?.documentNumber ?? `Rcp-${expense.id.padStart(6, "0")}`;
  const tax = override?.tax ?? Number((expense.amount * 0.075).toFixed(2));
  const media = [
    { label: "Photo", src: installWaterHeaterPhoto },
    { label: "Photo", src: tanklessWaterHeaterPhoto },
  ];
  const currentMedia = media[selectedMedia] ?? media[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="px-6 pt-6 pb-3">
        <button
          onClick={() => navigate("/expenses")}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
          style={{ fontWeight: 500 }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Expenses
        </button>
      </div>

      <section className="mx-6 mb-6 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex min-h-[64px] items-center justify-between gap-4 border-b border-[#E5E7EB] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1
              className="truncate text-[20px] leading-[27px] text-[#1A2332]"
              style={{ fontWeight: 600 }}
            >
              {expense.merchant}
            </h1>
            <span className="shrink-0 text-[14px] leading-5 text-[#9CA3AF]">{expense.date}</span>
            <CategoryPill category={expense.category} className="shrink-0 px-2.5 py-1 text-[12px]" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <KpiTile
              value={money(expense.amount)}
              label="Total"
              icon="trending_up"
              iconBg="#DCFCE7"
              iconColor="#16A34A"
            />
            <KpiTile
              value={money(tax)}
              label="Tax"
              icon="paid"
              iconBg="#EBF0F8"
              iconColor="#4A6FA5"
            />
            <button
              onClick={() => navigate("/expenses/new")}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#4A6FA5] px-3.5 text-[13px] leading-5 text-white transition-colors hover:bg-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "16px" }}>add</span>
              Create Expense
            </button>
            <KebabMenu triggerClassName="h-9 w-9 border border-[#E5E7EB] rounded-md hover:bg-[#F5F7FA] bg-white">
              <KebabItem icon="edit">Edit expense</KebabItem>
              {expense.invoiceId && (
                <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`)}>
                  Open invoice
                </KebabItem>
              )}
              <KebabItem icon="content_copy">Duplicate</KebabItem>
              <KebabSeparator />
              <KebabItem icon="archive" destructive>Archive</KebabItem>
            </KebabMenu>
          </div>
        </div>

        <div className="grid grid-cols-[432px_minmax(0,1fr)] gap-8 px-5 py-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-8">
            <button
              className="float-right -mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#1A2332]"
              aria-label="Edit expense details"
              title="Edit expense details"
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>edit</span>
            </button>

            <div className="space-y-6">
              <DetailBlock label="Document Number" value={documentNumber} />
              {expense.jobId && (
                <DetailBlock
                  label="Job"
                  value={
                    <button
                      onClick={() => navigate(`/jobs/${expense.jobId!.replace("J-", "")}`)}
                      className="text-left text-[#4A6FA5] hover:underline"
                    >
                      #{expense.jobId} - {expense.jobTitle}
                    </button>
                  }
                />
              )}
              {expense.invoiceId && (
                <DetailBlock
                  label="Invoice"
                  value={
                    <button
                      onClick={() => navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`)}
                      className="text-left text-[#4A6FA5] hover:underline"
                    >
                      #{expense.invoiceId}
                    </button>
                  }
                />
              )}
              <div>
                <div
                  className="mb-1.5 text-[11px] uppercase tracking-wider text-[#546478]"
                  style={{ fontWeight: 600 }}
                >
                  Notes
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[13px] leading-5 text-[#374151]">
                  {expense.notes || "No notes"}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex h-9 items-center border-b border-[#E5E7EB]">
              <div className="w-[190px] text-[13px] text-[#9CA3AF]" style={{ fontWeight: 600 }}>
                Attachments
              </div>
              <div className="flex items-center gap-8">
                {(["media", "files"] as AttachmentTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAttachmentTab(tab)}
                    className={`relative h-9 text-[13px] transition-colors ${
                      attachmentTab === tab ? "text-[#4A6FA5]" : "text-[#6B7280] hover:text-[#1A2332]"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {tab === "media" ? `Media (${media.length - 1})` : "Files (0)"}
                    {attachmentTab === tab && (
                      <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-[#4A6FA5]" />
                    )}
                  </button>
                ))}
              </div>
              <button className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#1A2332]">
                <span className="material-icons" style={{ fontSize: "16px" }}>add_circle_outline</span>
              </button>
            </div>

            {attachmentTab === "media" ? (
              <div className="flex gap-4">
                <div className="flex w-[54px] flex-col gap-2 pt-3">
                  {media.map((item, idx) => (
                    <button
                      key={item.src}
                      onClick={() => setSelectedMedia(idx)}
                      className={`h-[54px] overflow-hidden rounded-md border ${
                        selectedMedia === idx ? "border-[#4A6FA5]" : "border-[#E5E7EB]"
                      }`}
                    >
                      <img src={item.src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="relative h-[320px] max-w-[620px] flex-1 overflow-hidden rounded-sm bg-[#F5F7FA]">
                  <img
                    src={currentMedia.src}
                    alt="Expense attachment"
                    className="h-full w-full object-cover"
                  />
                  <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded bg-white/90 text-[#1A2332] shadow-sm hover:bg-white">
                    <span className="material-icons" style={{ fontSize: "18px" }}>open_in_full</span>
                  </button>
                  <button
                    onClick={() => setSelectedMedia((selectedMedia - 1 + media.length) % media.length)}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1A2332] shadow-sm hover:bg-white"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
                  </button>
                  <button
                    onClick={() => setSelectedMedia((selectedMedia + 1) % media.length)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1A2332] shadow-sm hover:bg-white"
                  >
                    <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
                  </button>
                  <div className="absolute bottom-3 left-3 rounded bg-[#16A34A] px-2 py-0.5 text-[11px] leading-4 text-white" style={{ fontWeight: 600 }}>
                    {currentMedia.label}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-[11px] leading-4 text-white" style={{ fontWeight: 600 }}>
                    {selectedMedia + 1}/{media.length}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#9CA3AF]">
                No files attached
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiTile({
  value,
  label,
  icon,
  iconBg,
  iconColor,
}: {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex h-10 min-w-[108px] items-center justify-between gap-2.5 rounded-md border border-[#E5E7EB] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="min-w-0">
        <div className="truncate text-[14px] leading-4 text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        <div className="truncate text-[10px] leading-4 text-[#6B7280]">{label}</div>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: iconBg }}>
        <span className="material-icons" style={{ fontSize: "16px", color: iconColor }}>{icon}</span>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        className="mb-1 text-[11px] uppercase tracking-wider text-[#546478]"
        style={{ fontWeight: 600 }}
      >
        {label}
      </div>
      <div className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
