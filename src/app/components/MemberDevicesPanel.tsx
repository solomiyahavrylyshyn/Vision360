// Manage team → row menu → Devices: the phones/tablets a member is signed in on.
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { devicesStore, fmtDay, fmtWhen, type Device } from "../stores/devicesStore";

export function MemberDevicesPanel({ member, onClose }: { member: { name: string; email: string }; onClose: () => void }) {
  const all = useSyncExternalStore(devicesStore.subscribe, devicesStore.getSnapshot);
  const devices = all.filter((d) => d.memberEmail === member.email);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [wipeTarget, setWipeTarget] = useState<Device | null>(null);

  const saveName = (d: Device) => {
    const v = draft.trim();
    if (v && v !== d.name) devicesStore.rename(d.id, v);
    setEditing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${member.name} — devices`}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Devices</div>
            <div className="text-[13px] text-[#6B7280]">{member.name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F5F7FA]">
            <span className="material-icons text-[#6B7280]" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {devices.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#D8DEE8] px-4 py-8 text-center text-[13px] text-[#6B7280]">
              {member.name} isn't signed in to the technician app on any device.
            </div>
          )}
          {devices.map((d) => (
            <div key={d.id} className="rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#6B7280]" style={{ fontSize: 18 }}>smartphone</span>
                {editing === d.id ? (
                  <input
                    autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => saveName(d)} onKeyDown={(e) => { if (e.key === "Enter") saveName(d); if (e.key === "Escape") setEditing(null); }}
                    className="h-8 flex-1 rounded-lg border border-[#D8DEE8] px-2 text-[14px] outline-none focus:border-[#4A6FA5]"
                    style={{ fontWeight: 600 }} aria-label="Device name"
                  />
                ) : (
                  <>
                    <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{d.name}</span>
                    {d.status !== "wiped" && (
                      <button type="button" onClick={() => { setEditing(d.id); setDraft(d.name); }} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>(edit)</button>
                    )}
                  </>
                )}
              </div>
              <div className="mt-1 text-[13px] text-[#374151]">{d.model} · {d.os} · app {d.appVersion}</div>
              <div className="mt-0.5 text-[12px] text-[#6B7280]">
                Signed in {fmtDay(d.signedInAt)} · Last seen {fmtWhen(d.lastSeenAt)} · Last sync {fmtWhen(d.lastSyncAt)}
                {d.offlineSince && d.status === "active" && <> · <span className="text-[#B45309]">Offline since {fmtWhen(d.offlineSince)}</span></>}
              </div>

              {d.status === "active" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { devicesStore.revoke(d.id); toast.success(`${d.name} revoked`, { description: "It sends its last work, then signs out." }); }}
                    className="h-9 rounded-lg border border-[#D8DEE8] px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
                    Revoke — send first
                  </button>
                  <button type="button" onClick={() => setWipeTarget(d)}
                    className="h-9 rounded-lg border border-[#FECACA] px-3 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]" style={{ fontWeight: 500 }}>
                    Wipe now
                  </button>
                </div>
              )}
              {d.status === "revoked" && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF7E6] px-3 py-2">
                  <span className="text-[13px] text-[#92400E]" style={{ fontWeight: 500 }}>Revoked — sending its last work</span>
                  <button type="button" onClick={() => { devicesStore.allow(d.id); toast.success(`${d.name} allowed again`); }}
                    className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>
                    Allow this device again
                  </button>
                </div>
              )}
              {d.status === "wiped" && (
                <div className="mt-3 rounded-lg bg-[#F3F4F6] px-3 py-2 text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>
                  Wiped{d.changedAt ? ` ${fmtWhen(d.changedAt)}` : ""} — signed out and cleared
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {wipeTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setWipeTarget(null); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label="Wipe now">
            <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Wipe {wipeTarget.name} now?</div>
            <p className="mt-2 text-[14px] leading-[21px] text-[#374151]">
              Anything not sent from this device is lost.
              {wipeTarget.offlineSince && <> This device has been offline since {fmtWhen(wipeTarget.offlineSince)} — it may hold work the office hasn't received.</>}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setWipeTarget(null)} className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
              <button type="button" onClick={() => { devicesStore.wipe(wipeTarget.id); toast.success(`${wipeTarget.name} wiped`); setWipeTarget(null); }}
                className="h-10 rounded-lg bg-[#DC2626] px-4 text-[14px] text-white hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Wipe now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
