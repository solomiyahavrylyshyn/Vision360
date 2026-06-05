import { useState, useMemo, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { KebabMenu, KebabItem } from "../components/ui/kebab-menu";
import { toast } from "sonner";
import { paymentsStore } from "../stores/paymentsStore";
import { jobsStore } from "../stores/jobsStore";
import type { PaymentMethod, PaymentStatus } from "./Payments";
import { PAYMENT_METHODS } from "../constants/paymentMethods";

const paymentMethods = PAYMENT_METHODS;

// Payment date is shown as DD.MM.YYYY (Figma) but stored/saved as ISO.
const dmyToISO = (s: string) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
const isoToDMY = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim()); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; };

// Long-form date for the Jobs picker (Figma: "March 30, 2026"); guards bad data.
function fmtJobDate(d: string) {
  const dt = new Date((d || "") + "T12:00:00");
  if (!d || isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Status badge colour (same semantic tokens as the Jobs board).
function jobStatusStyle(status: string): { color: string; backgroundColor: string } {
  const m: Record<string, [string, string]> = {
    Completed: ["#16A34A", "rgba(22,163,74,0.15)"],
    "In Progress": ["#4A6FA5", "rgba(74,111,165,0.15)"],
    Dispatched: ["#4A6FA5", "rgba(74,111,165,0.15)"],
    Scheduled: ["#F59E0B", "rgba(245,158,11,0.15)"],
    Cancelled: ["#DC2626", "rgba(220,38,38,0.15)"],
  };
  const [color, backgroundColor] = m[status] || ["#6B7280", "rgba(107,114,128,0.15)"];
  return { color, backgroundColor };
}

type JobSortField = "jobNumber" | "startDate" | "status" | "totalPrice";

export function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClient = searchParams.get("client") || "";
  const prefilledAmount = searchParams.get("amount") || "";
  const returnTo = searchParams.get("returnTo");
  const goBack = () => navigate(returnTo || "/payments");

  // Client comes from the launch context (or, standalone, from the chosen job).
  const [client] = useState(prefilledClient);
  const [amount, setAmount] = useState(prefilledAmount);
  const [method, setMethod] = useState(searchParams.get("method") || "Credit card on file");
  const [dateText, setDateText] = useState(() => isoToDMY(new Date().toISOString().slice(0, 10)));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  // Jobs picker — select the job(s) this payment covers; the Total auto-fills
  // from the selected jobs' prices (still manually overridable).
  const [jobSearch, setJobSearch] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [jobSortField, setJobSortField] = useState<JobSortField>("startDate");
  const [jobSortDir, setJobSortDir] = useState<"asc" | "desc">("desc");
  const [jobPage, setJobPage] = useState(1);
  const [jobPerPage, setJobPerPage] = useState(10);
  const allJobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);

  const candidateJobs = useMemo(() => {
    const c = client.trim().toLowerCase();
    const byClient = c ? allJobs.filter((j) => j.client.toLowerCase().includes(c)) : [];
    const base = byClient.length > 0 ? byClient : allJobs;
    const q = jobSearch.trim().toLowerCase();
    const filtered = q ? base.filter((j) => j.jobNumber.toLowerCase().includes(q) || j.title.toLowerCase().includes(q)) : base;
    const dir = jobSortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (jobSortField) {
        case "totalPrice": return (a.totalPrice - b.totalPrice) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        case "jobNumber": return a.jobNumber.localeCompare(b.jobNumber) * dir;
        default: return a.startDate.localeCompare(b.startDate) * dir;
      }
    });
  }, [allJobs, client, jobSearch, jobSortField, jobSortDir]);

  const jobTotalPages = Math.max(1, Math.ceil(candidateJobs.length / jobPerPage));
  const jobsPage = candidateJobs.slice((jobPage - 1) * jobPerPage, jobPage * jobPerPage);

  const toggleJob = (id: number) => {
    const next = new Set(selectedJobIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedJobIds(next);
    if (next.size > 0) setAmount(String(allJobs.filter((j) => next.has(j.id)).reduce((s, j) => s + j.totalPrice, 0)));
  };
  const toggleJobSort = (f: JobSortField) => {
    if (jobSortField === f) setJobSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setJobSortField(f); setJobSortDir("asc"); }
  };
  const JobSortIcon = ({ field }: { field: JobSortField }) => (
    <span className="material-icons ml-0.5 align-middle text-[#9AA3AF]" style={{ fontSize: "14px" }}>
      {jobSortField === field ? (jobSortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
    </span>
  );

  // Manual card-entry fields (US): only used when method = "Type card manually".
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");

  // Card-on-file mock (in a real build this comes from the saved payment profile).
  const cardOnFile = "Visa •••• •••• •••• 4242";

  const isCardOnFile = method === "Credit card on file";
  const isManualCard = method === "Type card manually";
  const isCharge = isCardOnFile || isManualCard;          // integrated charge vs external record
  // Card number minus formatting, for a light length check.
  const cardDigits = cardNumber.replace(/\D/g, "");

  const handleSave = () => {
    const isoDate = dmyToISO(dateText);
    if (!isoDate) { toast.error("Enter the payment date (DD.MM.YYYY)"); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }

    if (isManualCard) {
      if (cardDigits.length < 13) { toast.error("Enter a valid card number"); return; }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry)) { toast.error("Enter expiry as MM / YY"); return; }
      if (cardCvc.replace(/\D/g, "").length < 3) { toast.error("Enter the card's CVC"); return; }
      if (!cardName.trim()) { toast.error("Enter the cardholder name"); return; }
      if (!/^\d{5}(-\d{4})?$/.test(cardZip.trim())) { toast.error("Enter the billing ZIP"); return; }
    }

    // For a card charge the "reference" stores a masked last-4 / card-on-file
    // label, never the full PAN. External methods keep the user's reference #.
    const ref = isManualCard
      ? `Card ···· ${cardDigits.slice(-4)}`
      : isCardOnFile
        ? cardOnFile
        : reference.trim();

    // Client / job context: from the launch params, else from the selected job(s).
    const selJobs = allJobs.filter((j) => selectedJobIds.has(j.id));
    const effectiveClient = client.trim() || selJobs[0]?.client || "—";

    const record = paymentsStore.add({
      date: isoDate,
      amount: parsedAmount,
      method: method as PaymentMethod,
      status: "Completed" as PaymentStatus,
      clientName: effectiveClient,
      clientEmail: searchParams.get("clientEmail") || "",
      invoiceId: Number(searchParams.get("invoiceId")) || 0,
      invoiceNumber: searchParams.get("invoice") || "—",
      jobId: searchParams.get("job") || selJobs[0]?.jobNumber || "",
      reference: ref,
      note: note.trim(),
      createdBy: "You",
    });
    toast.success(isCharge ? `Charged $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Payment recorded");
    navigate(returnTo || `/payments/${record.id}`);
  };

  const inputCls = "w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]";
  const reqStar = <span className="text-[#DC2626]">*</span>;
  const labelCls = "text-[13px] text-[#374151] mb-1.5 block";

  // Disable the submit button until the form is minimally valid (Figma: muted by default).
  const amountValid = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const referenceValid = isCharge || reference.trim().length > 0; // external methods require a reference
  const canSubmit = amountValid && !!dmyToISO(dateText) && referenceValid;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Accent bar to match the other create pages */}
      <div className="h-1 bg-[#4A6FA5]" />
      <div className="max-w-[860px] mx-auto py-6 px-6">
        {/* Compact header — back chevron + title + "for <client>" inline */}
        <div className="flex items-center gap-2 mb-5">
          <button onClick={goBack} aria-label="Back" className="w-7 h-7 flex items-center justify-center rounded-md text-[#546478] hover:bg-[#EDF0F5]">
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
          </button>
          <h1 className="text-[20px] text-[#1A2332] leading-7" style={{ fontWeight: 700 }}>
            {isCharge ? "Collect payment" : "Record payment"}
          </h1>
          {prefilledClient && (
            <span className="text-[15px] text-[#6B7280]">for {client}</span>
          )}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* Details section — label on the left, fields on the right */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Details</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment date {reqStar}</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={10} value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="DD.MM.YYYY" className={`${inputCls} pr-9`} />
                  <input type="date" aria-label="Payment date" value={dmyToISO(dateText)} onChange={(e) => setDateText(isoToDMY(e.target.value))} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer opacity-0" />
                  <span className="material-icons pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" style={{ fontSize: "18px" }}>calendar_today</span>
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ fontWeight: 500 }}>Payment method {reqStar}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                  {paymentMethods.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              {/* Method-dependent block */}
              {isCardOnFile ? (
                <div className="col-span-2">
                  <div className="flex items-center gap-2.5 h-10 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 max-w-[280px]">
                    <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "18px" }}>credit_card</span>
                    <span className="text-[14px] text-[#1A2332] tracking-wide" style={{ fontWeight: 600 }}>{cardOnFile}</span>
                    <span className="material-icons text-[#16A34A] ml-auto" style={{ fontSize: "16px" }}>verified</span>
                  </div>
                </div>
              ) : isManualCard ? null : (
                <div>
                  <label className={labelCls} style={{ fontWeight: 500 }}>Reference {reqStar}</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. check #, transaction ID…" className={inputCls} />
                </div>
              )}

              {/* Manual card entry spans full width below the method row */}
              {isManualCard && (
                <div className="col-span-2 grid grid-cols-2 gap-4 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div className="col-span-2">
                    <label className={labelCls} style={{ fontWeight: 500 }}>Card number {reqStar}</label>
                    <input value={cardNumber} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                      placeholder="1234 5678 9012 3456" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Expiry (MM / YY) {reqStar}</label>
                    <input value={cardExpiry} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d /]/g, "").slice(0, 7))}
                      placeholder="08 / 27" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>CVC {reqStar}</label>
                    <input value={cardCvc} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123" className={`${inputCls} tabular-nums`} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Cardholder name {reqStar}</label>
                    <input value={cardName} autoComplete="off" onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ fontWeight: 500 }}>Billing ZIP {reqStar}</label>
                    <input value={cardZip} inputMode="numeric" autoComplete="off"
                      onChange={(e) => setCardZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                      placeholder="33606" className={`${inputCls} tabular-nums`} />
                  </div>
                  <p className="col-span-2 text-[12px] text-[#9CA3AF]">Card details process this charge only — they are not stored on the client record.</p>
                </div>
              )}
            </div>
          </div>

          {/* Jobs section — pick the job(s) this payment covers */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Jobs</div>
            <div>
              <div className="relative mb-3">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "18px" }}>search</span>
                <input value={jobSearch} onChange={(e) => { setJobSearch(e.target.value); setJobPage(1); }} placeholder="Search jobs…" className={`${inputCls} pl-10`} />
              </div>
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-left text-[13px] text-[#6B7280]">
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleJobSort("jobNumber")}><span className="inline-flex items-center">Number<JobSortIcon field="jobNumber" /></span></th>
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleJobSort("startDate")}><span className="inline-flex items-center">Scheduled<JobSortIcon field="startDate" /></span></th>
                      <th className="px-3 py-2 cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleJobSort("status")}><span className="inline-flex items-center">Status<JobSortIcon field="status" /></span></th>
                      <th className="px-3 py-2 text-right cursor-pointer select-none" style={{ fontWeight: 500 }} onClick={() => toggleJobSort("totalPrice")}><span className="inline-flex items-center justify-end">Total<JobSortIcon field="totalPrice" /></span></th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {jobsPage.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-[13px] text-[#9CA3AF]">No jobs found</td></tr>
                    ) : jobsPage.map((j) => (
                      <tr key={j.id} onClick={() => toggleJob(j.id)}
                        className="border-b border-[#EDF0F5] last:border-0 hover:bg-[#F9FBFD] cursor-pointer">
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selectedJobIds.has(j.id)} onChange={() => toggleJob(j.id)} onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-[#E5E7EB] accent-[#4A6FA5] cursor-pointer" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-[#4A6FA5]" style={{ fontWeight: 500 }}>{j.jobNumber}</div>
                          <div className="text-[12px] text-[#6B7280]">{j.title}</div>
                        </td>
                        <td className="px-3 py-2.5 text-[#546478]">{fmtJobDate(j.startDate)}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[12px]" style={{ fontWeight: 600, ...jobStatusStyle(j.status) }}>{j.status}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#1A2332]" style={{ fontWeight: 600 }}>${j.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <KebabMenu>
                            <KebabItem icon="visibility" onSelect={() => navigate(`/jobs/${j.id}`)}>View job</KebabItem>
                            <KebabItem icon="open_in_new" onSelect={() => window.open(`/jobs/${j.id}`, "_blank", "noopener,noreferrer")}>Open in new tab</KebabItem>
                          </KebabMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select value={jobPerPage} onChange={(e) => { setJobPerPage(Number(e.target.value)); setJobPage(1); }} className="h-8 px-2 border border-[#E5E7EB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5]">
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>
                    {candidateJobs.length === 0 ? "0-0" : `${(jobPage - 1) * jobPerPage + 1}-${Math.min(jobPage * jobPerPage, candidateJobs.length)}`} of {candidateJobs.length}
                    {selectedJobIds.size > 0 ? ` · ${selectedJobIds.size} selected` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={jobPage === 1} onClick={() => setJobPage((p) => Math.max(1, p - 1))} className="w-7 h-7 flex items-center justify-center rounded-md text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
                  </button>
                  <button type="button" disabled={jobPage >= jobTotalPages} onClick={() => setJobPage((p) => Math.min(jobTotalPages, p + 1))} className="w-7 h-7 flex items-center justify-center rounded-md text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Total section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6 border-b border-[#E5E7EB]">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Total {reqStar}</div>
            <div className="max-w-[240px]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]">$</span>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
          </div>

          {/* Notes section */}
          <div className="px-6 py-6 grid grid-cols-[120px_1fr] gap-6">
            <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Notes</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any relevant notes…"
              className="w-full min-h-[80px] px-3 py-2 border border-[#E5E7EB] rounded-md text-[14px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] resize-y" />
          </div>

          <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={goBack}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSubmit}
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] text-white h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]">
              {isCharge ? "Collect payment" : "Record payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
