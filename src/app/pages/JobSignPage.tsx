// The page the client opens from the "sign for your job" email (9355, Figma
// "client - job - …"). Anonymous, identified only by the token. Two moments:
// before work starts (Authorization to Proceed) and on completion (Completion
// sign-off) — the heading and the text come from the note picked for that moment
// in Settings → Jobs → Notes on Jobs. The client types the full name, as on the
// estimate; the date is set by itself and the device location is saved with it.
// States: sign, just signed, already signed, link expired, job canceled.
import { useState, useSyncExternalStore } from "react";
import { useParams } from "react-router";
import { COMPANY, Label, Notice, Shell } from "./ClientEstimateView";
import { jobsStore } from "../stores/jobsStore";
import { fmtSignedAt, jobSignLinksStore, jobSignSettingsStore, notesFor, type JobSignLink } from "../stores/jobSignaturesStore";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SCRIPT = { fontFamily: "'Brush Script MT', 'Segoe Script', cursive" } as const;

// Device location, asked for when the client signs. Refused or slow → "not shared".
const getLocation = () =>
  new Promise<string>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { resolve("not shared"); return; }
    const timer = setTimeout(() => resolve("not shared"), 6000);
    navigator.geolocation.getCurrentPosition(
      (p) => { clearTimeout(timer); resolve(`${p.coords.latitude.toFixed(2)}, ${p.coords.longitude.toFixed(2)}`); },
      () => { clearTimeout(timer); resolve("not shared"); },
      { timeout: 5000, maximumAge: 600000 },
    );
  });

const whereLabel = (loc?: string) => (!loc || loc === "not shared" ? "location not shared" : `signed near ${loc}`);

export function JobSignPage() {
  const { token = "" } = useParams();
  useSyncExternalStore(jobSignLinksStore.subscribe, jobSignLinksStore.getSnapshot);
  const settings = useSyncExternalStore(jobSignSettingsStore.subscribe, jobSignSettingsStore.getSnapshot);
  useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const link = jobSignLinksStore.byToken(token);
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justSigned, setJustSigned] = useState(false);

  if (!link) {
    return (
      <Shell about="link">
        <Notice icon="link_off" tone="grey" title="This link has expired">
          Call {COMPANY.phone} or email {COMPANY.email} and we will send you a new link.
        </Notice>
      </Shell>
    );
  }

  const job = link.job;
  const storeJob = /^\d+$/.test(link.jobKey) ? jobsStore.getById(Number(link.jobKey)) : undefined;
  const canceled = storeJob?.status === "Cancelled";
  const start = link.moment === "start";
  const notes = notesFor(settings, link.moment, COMPANY.name);

  const sign = async () => {
    setBusy(true);
    const loc = await getLocation();
    jobSignLinksStore.sign(link.token, name.trim(), loc);
    setBusy(false);
    setJustSigned(true);
  };

  const header = (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#4A6FA5]" style={{ fontWeight: 600 }}>Job #{job.jobNumber}</div>
          <h1 className="mt-1 text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px]" style={{ fontWeight: 700 }}>{job.title}</h1>
        </div>
        <div className="text-[13px] leading-[19px] text-[#6B7280] sm:text-right">
          {canceled ? <div>Canceled</div> : (
            <>
              {job.dateLabel && <div>{start ? "Scheduled" : "Done"} {job.dateLabel}</div>}
              {job.timeLabel && <div>{job.timeLabel}</div>}
            </>
          )}
        </div>
      </div>
      <div className="mb-6 grid gap-4 rounded-xl bg-[#EDF0F5] px-5 py-4 sm:grid-cols-3">
        <div><Label>Customer and service address</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{job.clientName}</div>{job.address && <div className="text-[13px] text-[#374151]">{job.address}</div>}</div>
        <div><Label>Technician</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{job.technician || "—"}</div></div>
        <div><Label>Questions</Label><div className="mt-1 text-[14px]" style={{ fontWeight: 600 }}>{COMPANY.phone}</div><div className="text-[13px] text-[#374151]">{COMPANY.email}</div></div>
      </div>
    </>
  );

  if (canceled) {
    return (
      <Shell about="job">
        {header}
        <Notice icon="cancel" tone="grey" title="This job was canceled">
          {COMPANY.name} canceled this job, so there is nothing to sign. Questions? Call {COMPANY.phone}.
        </Notice>
      </Shell>
    );
  }

  const signedLink: JobSignLink | undefined = link.status === "signed" ? link : undefined;
  const expired = link.status === "cancelled";

  return (
    <Shell about="job">
      {header}

      {signedLink && justSigned && (
        <div className="mb-6">
          <Notice icon="check_circle" tone="green" title={start ? "Thank you — the work is authorized" : "Thank you — the work is signed off"}>
            Signed by {signedLink.signedBy} on {fmtSignedAt(signedLink.signedAt!)}.{start && job.technician ? ` ${job.technician} can start the work.` : ""}
          </Notice>
        </div>
      )}
      {signedLink && !justSigned && (
        <div className="mb-6">
          <Notice icon="check_circle" tone="green" title={start ? "This work is already authorized" : "This work is already signed off"}>
            {signedLink.signedBy} signed it on {fmtSignedAt(signedLink.signedAt!)}. Nothing else is needed from you.
          </Notice>
        </div>
      )}
      {expired && (
        <div className="mb-6">
          <Notice icon="schedule" tone="grey" title="This link has expired">
            Call {COMPANY.phone} or email {COMPANY.email} and we will send you a new link.
          </Notice>
        </div>
      )}

      {/* The job: what we will do / what we did, the items and the total */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="grid sm:grid-cols-[300px_1fr]">
          <div className="bg-[#EEF3FA] px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#4A6FA5]" style={{ fontWeight: 700 }}>Job total</div>
            <div className="mt-1 text-[30px] leading-[36px] tabular-nums" style={{ fontWeight: 700 }}>${fmt(job.total)}</div>
            <div className="text-[12px] text-[#6B7280]">Tax included</div>
          </div>
          <div className="border-t border-[#EDF0F5] px-5 py-5 sm:border-l sm:border-t-0">
            <Label>{start ? "What we will do" : "What we did"}</Label>
            <p className="mt-1.5 text-[14px] leading-[21px] text-[#374151]">{job.description || "The work listed below."}</p>
          </div>
        </div>
        {job.items.length > 0 && (
          <div className="overflow-x-auto border-t border-[#E5E7EB]">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead>
                <tr className="bg-[#F5F7FA] text-[11px] uppercase tracking-[0.08em] text-[#6B7280]">
                  <th className="px-5 py-2.5 text-left" style={{ fontWeight: 600 }}>Item</th>
                  <th className="px-3 py-2.5 text-center" style={{ fontWeight: 600 }}>Qty</th>
                  <th className="px-3 py-2.5 text-right" style={{ fontWeight: 600 }}>Unit price</th>
                  <th className="px-3 py-2.5 text-right" style={{ fontWeight: 600 }}>Tax</th>
                  <th className="px-5 py-2.5 text-right" style={{ fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {job.items.map((i, idx) => (
                  <tr key={idx} className="border-t border-[#EDF0F5]">
                    <td className="px-5 py-3"><div style={{ fontWeight: 500 }}>{i.name}</div>{i.description && <div className="text-[12px] text-[#6B7280]">{i.description}</div>}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{i.quantity}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{i.unitPrice < 0 ? "− " : ""}${fmt(Math.abs(i.unitPrice))}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#6B7280]">{i.tax ? `$${fmt(i.tax)}` : "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums" style={{ fontWeight: 500 }}>{i.amount < 0 ? "− " : ""}${fmt(Math.abs(i.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#EEF3FA] px-5 py-4">
          <div><div className="text-[16px]" style={{ fontWeight: 600 }}>Job total</div><div className="text-[12px] text-[#6B7280]">Tax included</div></div>
          <div className="text-[26px] tabular-nums" style={{ fontWeight: 700 }}>${fmt(job.total)}</div>
        </div>
      </div>

      {/* What the client agrees to + the signature */}
      {!expired && (
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6">
          {notes.map((n, i) => (
            <div key={i} className={i ? "mt-4" : ""}>
              <div className="text-[17px]" style={{ fontWeight: 600 }}>{n.title}</div>
              <p className="mt-1 whitespace-pre-line text-[14px] leading-[21px] text-[#374151]">{n.body}</p>
            </div>
          ))}
          {signedLink ? (
            <>
              <div className="mt-4 text-[14px]" style={{ fontWeight: 600 }}>Signed</div>
              <div className="mt-1 text-[24px] text-[#1A2332]" style={SCRIPT}>{signedLink.signedBy}</div>
              <div className="mt-1 text-[12px] text-[#6B7280]">{signedLink.signedBy} · {fmtSignedAt(signedLink.signedAt!)} · {whereLabel(signedLink.location)}</div>
            </>
          ) : (
            <>
              <label className="mt-4 block text-[14px]" style={{ fontWeight: 600 }} htmlFor="sign-name">Type your full name to sign</label>
              <input id="sign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={job.clientName}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-[18px] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/10"
                style={SCRIPT} />
              <div className="mt-1.5 text-[12px] text-[#6B7280]">
                Date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Your location is saved with your signature.
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-[13px] leading-[19px] text-[#374151]">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4A6FA5]" />
                <span>{start ? "I have read the authorization above and agree to it." : "I have checked the work and agree to the sign-off above."}</span>
              </label>
              <button type="button" onClick={sign} disabled={!name.trim() || !agreed || busy}
                className="mt-4 h-11 w-full rounded-lg bg-[#4A6FA5] px-4 text-[15px] text-white transition-colors hover:bg-[#3d5a85] disabled:pointer-events-none disabled:bg-[#C7D2E1]" style={{ fontWeight: 600 }}>
                {busy ? "Signing…" : start ? "Authorize & sign" : "Sign off the work"}
              </button>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
