// Manage team → Devices: the phones/tablets team members are signed in on.
// Revoke lets the device send what it still holds, then signs it out; Wipe signs
// it out and clears it now. The server can't know what a device hasn't sent, so
// there are no "not sent" counts — only "Offline since" and the Wipe warning.
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { devicesStore, fmtDay, fmtWhen, type Device } from "../stores/devicesStore";

function DeviceCard({ d, onWipe }: { d: Device; onWipe: (d: Device) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(d.name);
  const saveName = () => {
    const v = draft.trim();
    if (v && v !== d.name) devicesStore.rename(d.id, v);
    setEditing(false);
  };
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="material-icons text-[#6B7280]" style={{ fontSize: 18 }}>smartphone</span>
        {editing ? (
          <input
            autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
            className="h-8 flex-1 rounded-lg border border-[#D8DEE8] px-2 text-[14px] outline-none focus:border-[#4A6FA5]"
            style={{ fontWeight: 600 }} aria-label="Device name"
          />
        ) : (
          <>
            <span className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>{d.name}</span>
            {d.status !== "wiped" && (
              <button type="button" onClick={() => { setEditing(true); setDraft(d.name); }} className="text-[13px] text-[#4A6FA5] hover:underline" style={{ fontWeight: 500 }}>(edit)</button>
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
          <button type="button" onClick={() => onWipe(d)}
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
  );
}

function WipeDialog({ d, onClose }: { d: Device; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label="Wipe now">
        <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>Wipe {d.name} now?</div>
        <p className="mt-2 text-[14px] leading-[21px] text-[#374151]">
          Anything not sent from this device is lost.
          {d.offlineSince && <> This device has been offline since {fmtWhen(d.offlineSince)} — it may hold work the office hasn't received.</>}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
          <button type="button" onClick={() => { devicesStore.wipe(d.id); toast.success(`${d.name} wiped`); onClose(); }}
            className="h-10 rounded-lg bg-[#DC2626] px-4 text-[14px] text-white hover:bg-[#B91C1C]" style={{ fontWeight: 600 }}>Wipe now</button>
        </div>
      </div>
    </div>
  );
}

/** Manage team → Devices tab. `member` pre-filters to one person (from the users table row menu). */
export function TeamDevicesPage({ team, member, onMemberChange }: {
  team: { name: string; email: string }[];
  member: string;
  onMemberChange: (email: string) => void;
}) {
  const all = useSyncExternalStore(devicesStore.subscribe, devicesStore.getSnapshot);
  const [wipeTarget, setWipeTarget] = useState<Device | null>(null);
  const nameOf = (email: string) => team.find((m) => m.email === email)?.name ?? email;
  const people = team.filter((m) => member === "all" || m.email === member);
  useEffect(() => { if (member !== "all" && !team.some((m) => m.email === member)) onMemberChange("all"); }, [member, team, onMemberChange]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600 }}>Devices</div>
          <div className="text-[13px] text-[#6B7280]">Phones and tablets signed in to the technician app.</div>
        </div>
        <select value={member} onChange={(e) => onMemberChange(e.target.value)} aria-label="Team member"
          className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5]">
          <option value="all">All team members</option>
          {team.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
        </select>
      </div>

      {people.map((m) => {
        const devices = all.filter((d) => d.memberEmail === m.email);
        if (member === "all" && devices.length === 0) return null;
        return (
          <div key={m.email}>
            <div className="mb-2 text-[13px] text-[#6B7280]" style={{ fontWeight: 600 }}>{nameOf(m.email)}</div>
            {devices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D8DEE8] px-4 py-6 text-center text-[13px] text-[#6B7280]">
                {m.name} isn't signed in to the technician app on any device.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {devices.map((d) => <DeviceCard key={d.id} d={d} onWipe={setWipeTarget} />)}
              </div>
            )}
          </div>
        );
      })}
      {member === "all" && !team.some((m) => all.some((d) => d.memberEmail === m.email)) && (
        <div className="rounded-xl border border-dashed border-[#D8DEE8] px-4 py-8 text-center text-[13px] text-[#6B7280]">No one is signed in to the technician app yet.</div>
      )}

      {wipeTarget && <WipeDialog d={wipeTarget} onClose={() => setWipeTarget(null)} />}
    </div>
  );
}
