// Manage team → Roles (M1-19): the list of roles and the role editor — every
// module with its level plus the Mobile app section, Save, and the role's
// Activity underneath. Your own role is read-only. No Home tiles here: they're
// fixed per role (A12, Nov 2).
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { PermissionsEditor, type PermissionsState, type PresetId, type CustomPreset } from "./PermissionsEditor";
import { teamRolesStore, CURRENT_USER, fmtActivityAt, type TeamRole } from "../stores/teamRolesStore";
import { teamStore } from "../stores/teamStore";

export function TeamRolesPanel() {
  const { roles } = useSyncExternalStore(teamRolesStore.subscribe, teamRolesStore.getSnapshot);
  const team = useSyncExternalStore(teamStore.subscribe, teamStore.getSnapshot);
  const [editing, setEditing] = useState<TeamRole | null>(null);

  if (editing) return <RoleEditor role={editing} onBack={() => setEditing(null)} />;

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
          {["Role", "Users", ""].map((h, i) => (
            <th key={i} className="px-3 text-left text-[14px] text-[#1A2332]" style={{ fontWeight: 500, height: 40 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {roles.map((r) => {
          const count = team.filter((m) => m.role.toLowerCase() === r.name.toLowerCase()).length;
          const mine = r.name === CURRENT_USER.role;
          return (
            <tr key={r.id} className="border-b border-[#E5E7EB] last:border-b-0">
              <td className="px-3 text-[14px] text-[#1A2332]" style={{ height: 44, fontWeight: 500 }}>
                {r.name}
                {mine && <span className="ml-2 rounded-md bg-[#EEF3FA] px-1.5 py-px text-[11px] text-[#3B5B8A]" style={{ fontWeight: 500 }}>Your role</span>}
              </td>
              <td className="px-3 text-[14px] text-[#6B7280]">{count} {count === 1 ? "user" : "users"}</td>
              <td className="px-3 text-right">
                <button type="button" onClick={() => setEditing(r)} className="h-8 rounded-lg border border-[#E5E7EB] px-3 text-[13px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>
                  {mine ? "View" : "Edit"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RoleEditor({ role, onBack }: { role: TeamRole; onBack: () => void }) {
  const { activity } = useSyncExternalStore(teamRolesStore.subscribe, teamRolesStore.getSnapshot);
  const [perms, setPerms] = useState<PermissionsState>(role.perms);
  const [preset, setPreset] = useState<PresetId>("custom");
  const [reportAccess, setReportAccess] = useState<Record<string, boolean>>({});
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const readOnly = role.name === CURRENT_USER.role;
  const log = activity.filter((a) => a.roleId === role.id).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const save = () => {
    const n = teamRolesStore.save(role.id, perms);
    toast.success(n ? `${role.name} saved` : "Nothing changed");
    onBack();
  };

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} aria-label="Back to roles" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F5F7FA]">
            <span className="material-icons text-[#1A2332]" style={{ fontSize: 18 }}>arrow_back</span>
          </button>
          <div className="text-[18px] text-[#1A2332]" style={{ fontWeight: 600 }}>{role.name}</div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button type="button" onClick={onBack} className="h-9 rounded-lg border border-[#E5E7EB] px-4 text-[14px] text-[#1A2332] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Cancel</button>
            <button type="button" onClick={save} className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[14px] text-white hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>Save</button>
          </div>
        )}
      </div>

      {readOnly && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] text-[#374151]">
          <span className="material-icons text-[#6B7280]" style={{ fontSize: 18 }}>lock</span>
          You can't change your own role — ask the Owner or another admin.
        </div>
      )}

      <fieldset disabled={readOnly} className={readOnly ? "pointer-events-none opacity-70" : ""}>
        <PermissionsEditor
          hidePresets
          preset={preset} setPreset={setPreset}
          perms={perms} setPerms={setPerms}
          reportAccess={reportAccess} setReportAccess={setReportAccess}
          customPresets={customPresets} setCustomPresets={setCustomPresets}
        />
      </fieldset>

      <div className="mt-6 border-t border-[#E5E7EB] pt-5">
        <h4 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Activity</h4>
        {log.length === 0 ? (
          <div className="mt-2 text-[13px] text-[#6B7280]">No changes to this role yet.</div>
        ) : (
          <ul className="mt-2 divide-y divide-[#F1F3F7]">
            {log.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-[13px]">
                <span className="text-[#1A2332]"><span style={{ fontWeight: 600 }}>{a.actor}</span> {a.text}</span>
                <span className="text-[12px] text-[#6B7280]">{fmtActivityAt(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
