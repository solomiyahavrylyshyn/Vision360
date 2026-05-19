import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { KebabMenu, KebabItem, KebabSeparator } from "../components/ui/kebab-menu";
import { DetailTabs } from "../components/ui/detail-tabs";
import { mockExpenses, expenseCategoryColors, type Expense } from "./Expenses";

type TabKey = "details" | "receipts" | "activity";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "receipts", label: "Receipts" },
  { key: "activity", label: "Activity" },
];

export function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const expense: Expense | undefined = mockExpenses.find(e => e.id === id);

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

  const categoryColor = expenseCategoryColors[expense.category] || "#8899AA";

  const tabs = TABS.map(t => ({
    ...t,
    count: t.key === "receipts" ? expense.receipts : undefined,
  }));

  const renderDetails = () => (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <Field label="Date" value={expense.date} />
          <Field
            label="Category"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: categoryColor }} />
                {expense.category}
              </span>
            }
          />
          <Field label="Merchant" value={expense.merchant} />
          <Field label="Amount" value={`$${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          {expense.jobId && (
            <Field
              label="Job"
              value={
                <button
                  onClick={() => navigate(`/jobs/${expense.jobId!.replace("J-", "")}`)}
                  className="text-[14px] text-[#4A6FA5] hover:underline"
                  style={{ fontWeight: 500 }}
                >
                  #{expense.jobId} {expense.jobTitle ? `— ${expense.jobTitle}` : ""}
                </button>
              }
            />
          )}
          {expense.invoiceId && (
            <Field
              label="Invoice"
              value={
                <button
                  onClick={() => navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`)}
                  className="text-[14px] text-[#4A6FA5] hover:underline"
                  style={{ fontWeight: 500 }}
                >
                  #{expense.invoiceId}
                </button>
              }
            />
          )}
        </div>
        {expense.notes && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>Notes</div>
            <div className="text-[13px] text-[#374151] bg-[#F9FAFB] border border-[#EDF0F5] rounded-lg px-3 py-2">{expense.notes}</div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center">
        <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-2" style={{ fontWeight: 600 }}>Total</div>
        <div className="text-[32px] text-[#1A2332] leading-none" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-[13px] text-[#546478]">
          <span className="w-2 h-2 rounded-full" style={{ background: categoryColor }} />
          {expense.category}
        </div>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
      {expense.receipts > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: expense.receipts }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-[#F5F7FA] rounded-lg">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>description</span>
              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>receipt_{i + 1}.jpg</span>
              <span className="text-[11px] text-[#8899AA] ml-auto">View</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[#8899AA]">No receipts attached</p>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
      <ActivityItem icon="add_circle_outline" text="Expense created" time={`${expense.date} at 10:30 AM`} user="John Smith" />
      {expense.receipts > 0 && (
        <ActivityItem icon="attach_file" text={`${expense.receipts} receipt(s) attached`} time={`${expense.date} at 10:32 AM`} user="John Smith" />
      )}
      {expense.jobId && (
        <ActivityItem icon="link" text={`Linked to Job #${expense.jobId}`} time={`${expense.date} at 10:33 AM`} user="John Smith" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header / summary bar */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="px-8 h-12 flex items-center justify-between border-b border-[#F3F4F6]">
          <button
            onClick={() => navigate("/expenses")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Expenses
          </button>
          <KebabMenu triggerClassName="h-8 w-8 border border-[#E5E7EB] rounded-md hover:bg-[#EDF0F5] flex items-center justify-center">
            {expense.invoiceId && (
              <KebabItem icon="receipt" onSelect={() => navigate(`/invoices/${expense.invoiceId!.replace("INV-", "")}`)}>Open Invoice</KebabItem>
            )}
            <KebabItem icon="edit">Edit</KebabItem>
            <KebabSeparator />
            <KebabItem icon="delete_outline" destructive>Delete</KebabItem>
          </KebabMenu>
        </div>
        <div className="px-8 py-5 flex items-baseline gap-3">
          <h1 className="text-[22px] text-[#1A2332] leading-none" style={{ fontWeight: 600 }}>
            {expense.merchant}
          </h1>
          <span className="text-[13px] text-[#9CA3AF]">{expense.date} · {expense.category}</span>
        </div>
      </div>

      {/* Unified tab bar */}
      <div className="bg-white px-6 py-3">
        <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <main className="min-h-[calc(100vh-200px)] p-6 pb-12 bg-[#F5F7FA]">
        {activeTab === "details" && renderDetails()}
        {activeTab === "receipts" && renderReceipts()}
        {activeTab === "activity" && renderActivity()}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[#546478] mb-1" style={{ fontWeight: 600 }}>{label}</div>
      <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ActivityItem({ icon, text, time, user }: { icon: string; text: string; time: string; user: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="material-icons text-[#8899AA] mt-0.5" style={{ fontSize: "16px" }}>{icon}</span>
      <div>
        <p className="text-[13px] text-[#1A2332]">{text}</p>
        <p className="text-[11px] text-[#8899AA]">{user} · {time}</p>
      </div>
    </div>
  );
}
