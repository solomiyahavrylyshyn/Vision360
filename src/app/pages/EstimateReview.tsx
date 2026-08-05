import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { estimatesStore, type EstimateRecord, type EstimateLineItem } from "../stores/estimatesStore";
import { getStoredBrandLogo } from "../utils/brandTheme";

// Client-facing estimate review (FR-6, Figma 2918:61155 "Form") — the
// unauthenticated page the customer opens from the emailed link after Send.
// Shows every pricing option as a radio card with its line items; the customer
// picks one and sends their decision back. Customer rules apply: no Unit cost
// column (internal-only, FR-7.22) and items flagged "Do not show on customer
// documents" are excluded without changing totals (FR-4.8).

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function EstimateReview() {
  const { id } = useParams();
  const record: EstimateRecord | undefined = useMemo(() => {
    const all = estimatesStore.getSnapshot();
    return all.find((e) => String(e.id) === id) ?? all.find((e) => e.estimateNumber === id);
  }, [id]);

  // Opening the link marks a Sent estimate as Viewed (FR-5.13).
  useMemo(() => {
    if (record && record.status === "Sent") estimatesStore.update(record.id, { status: "Viewed" });
  }, [record?.id]);

  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!record) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
        <div className="text-center">
          <span className="material-icons text-[#C8D5E8]" style={{ fontSize: "44px" }}>search_off</span>
          <div className="mt-3 text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Estimate not found</div>
          <div className="mt-1 text-[13px] text-[#8899AA]">This link may have expired — please contact your service provider.</div>
        </div>
      </div>
    );
  }

  const taxRate = record.taxRate ?? 0;
  const lineTax = (i: EstimateLineItem) => (i.taxable ? i.amount * (taxRate / 100) : 0);
  // Single-option estimates render as one card built from the flat items list.
  const options = (record.options?.length ?? 0) > 1
    ? record.options!
    : [{ name: record.estimateName || "Estimate", items: record.items ?? [] }];
  const customerItems = (items: EstimateLineItem[]) => items.filter((i) => !(i as any).hideOnCustomerDocs);
  // Totals include every item — hidden items change what's listed, never the price (FR-4.8).
  const optionTotal = (items: EstimateLineItem[]) => items.reduce((a, i) => a + i.amount + lineTax(i), 0);
  const brandLogo = getStoredBrandLogo();

  const handleSend = () => {
    const opt = options[selected];
    estimatesStore.update(record.id, {
      status: "Approved",
      option: opt.name,
      amount: Math.round(optionTotal(opt.items) * 100) / 100,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-10 py-12 text-center max-w-[440px]">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#DCFCE7] flex items-center justify-center">
            <span className="material-icons text-[#16A34A]" style={{ fontSize: "28px" }}>check_circle</span>
          </div>
          <div className="mt-4 text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Thank you!</div>
          <div className="mt-2 text-[14px] leading-5 text-[#546478]">
            You approved <span style={{ fontWeight: 600 }}>{options[selected].name}</span> for
            {" "}<span style={{ fontWeight: 600 }}>${fmt(optionTotal(options[selected].items))}</span>.
            A confirmation email is on its way.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-4 py-8">
      <div className="mx-auto max-w-[1286px]">
        {/* Slim customer header — company + estimate identity (FR-6.1) */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {brandLogo
              ? <img src={brandLogo} alt="Company logo" className="max-h-[36px] max-w-[140px] object-contain" />
              : <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 700 }}>Omega Home Services</div>}
          </div>
          <div className="text-right">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
              {record.estimateName || "Estimate"} <span className="text-[#6B7280]" style={{ fontWeight: 400 }}>({record.estimateNumber})</span>
            </div>
            <div className="text-[12px] text-[#6B7280]">Prepared for {record.clientName}</div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 flex flex-col gap-6">
          {options.map((o, idx) => {
            const active = idx === selected;
            const items = customerItems(o.items);
            return (
              <div key={idx} className="flex flex-col gap-3">
                {/* Radio header card */}
                <button
                  type="button"
                  onClick={() => setSelected(idx)}
                  className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${active ? "border-[#4A6FA5]" : "border-[#E5E7EB] hover:border-[#C5CEDD]"}`}
                >
                  <span className={`inline-block w-[18px] h-[18px] rounded-full border-2 shrink-0 ${active ? "border-[#4A6FA5]" : "border-[#D1D5DB]"}`}>
                    {active && <span className="block w-2.5 h-2.5 m-[2px] rounded-full bg-[#4A6FA5]" />}
                  </span>
                  <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{o.name}</span>
                </button>

                {/* Items table — customer view: no Unit cost (FR-7.22) */}
                <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                          <th className="px-4 py-3 text-left text-[13px] text-[#546478]" style={{ fontWeight: 600 }}>Item</th>
                          <th className="px-4 py-3 text-right text-[13px] text-[#546478] w-[100px]" style={{ fontWeight: 600 }}>Quantity</th>
                          <th className="px-4 py-3 text-right text-[13px] text-[#546478] w-[110px]" style={{ fontWeight: 600 }}>Unit price</th>
                          <th className="px-4 py-3 text-right text-[13px] text-[#546478] w-[90px]" style={{ fontWeight: 600 }}>Tax</th>
                          <th className="px-4 py-3 text-right text-[13px] text-[#546478] w-[110px]" style={{ fontWeight: 600 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i) => (
                          <tr key={i.id} className="border-b border-[#F1F3F7] last:border-0">
                            <td className="px-4 py-3">
                              <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{i.name}</div>
                              {i.description && <div className="text-[12px] text-[#8899AA]">{i.description}</div>}
                            </td>
                            <td className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>{i.quantity}</td>
                            <td className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(i.price)}</td>
                            <td className="px-4 py-3 text-right text-[13px] text-[#546478]" style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(lineTax(i))}</td>
                            <td className="px-4 py-3 text-right text-[13px] text-[#1A2332]" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmt(i.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F9FAFB] border-t border-[#E5E7EB]">
                          <td colSpan={5} className="px-4 py-3.5 text-right">
                            <span className="text-[14px] text-[#546478]" style={{ fontWeight: 600 }}>Total:&nbsp;&nbsp;</span>
                            <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(optionTotal(o.items))}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Send — bottom right (Figma 2918:61155) */}
          <div className="flex justify-end border-t border-[#E5E7EB] pt-4">
            <button
              type="button"
              onClick={handleSend}
              className="h-10 px-6 rounded-lg bg-[#4A6FA5] hover:bg-[#3d5a85] text-white text-[14px] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
