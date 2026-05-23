import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";

type ThemePreference = "Light" | "Dark" | "System default";
type SidebarPreference = "Expanded sidebar" | "Collapsed sidebar by default";

const jobNotifications = [
  "New job assigned",
  "Job rescheduled",
  "Technician dispatched",
  "Job completed",
];

const estimateNotifications = [
  "Estimate approved",
  "Estimate declined",
  "Customer viewed estimate",
];

const invoiceNotifications = [
  "Payment received",
  "Invoice overdue",
  "Failed payment",
];

export function Profile() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@omegahomeservices.com");
  const [phone, setPhone] = useState("(813) 555-0142");
  const [jobTitle, setJobTitle] = useState("Operations Manager");
  const [employeeId, setEmployeeId] = useState("EMP-1007");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState("John Doe");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [enabledNotifications, setEnabledNotifications] = useState<Set<string>>(
    () => new Set([...jobNotifications, ...estimateNotifications, ...invoiceNotifications])
  );
  const [theme, setTheme] = useState<ThemePreference>("System default");
  const [sidebar, setSidebar] = useState<SidebarPreference>("Expanded sidebar");

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const toggleNotification = (label: string) => {
    setEnabledNotifications(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const Section = ({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) => (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow && <div className="mb-1 text-[11px] uppercase tracking-wide text-[#8A97A8]" style={{ fontWeight: 700 }}>{eyebrow}</div>}
          <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[#374151]" style={{ fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#4A6FA5]" : "bg-[#D8DEE8]"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
    </button>
  );

  const NotificationGroup = ({ title, rows }: { title: string; rows: string[] }) => (
    <div className="rounded-lg border border-[#E5E7EB]">
      <div className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
        <h3 className="text-[14px] leading-5 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h3>
      </div>
      <div className="divide-y divide-[#EEF1F5]">
        {rows.map(row => (
          <div key={row} className="flex min-h-[48px] items-center justify-between gap-4 px-4 py-2.5">
            <span className="text-[13px] leading-5 text-[#374151]">{row}</span>
            <Toggle checked={enabledNotifications.has(row)} onChange={() => toggleNotification(row)} />
          </div>
        ))}
      </div>
    </div>
  );

  const Choice = <T extends string>({ label, selected, onClick }: { label: T; selected: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-left text-[13px] transition-colors ${
        selected ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#1A2332]" : "border-[#E5E7EB] bg-white text-[#546478] hover:border-[#B8C3D5]"
      }`}
      style={{ fontWeight: 600 }}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-[#4A6FA5]" : "border-[#C8D5E8]"}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-[#4A6FA5]" />}
      </span>
      {label}
    </button>
  );

  return (
    <div className="min-h-full bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] transition-colors hover:text-[#3d5a85]"
              style={{ fontWeight: 600 }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
              Back
            </button>
            <h1 className="text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>User Account Profile</h1>
            <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">Personal information, notifications, appearance, and account access.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-4 text-[13px] text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
            style={{ fontWeight: 700 }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>logout</span>
            Logout
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] gap-4">
          <div className="space-y-4">
            <Section title="Profile" eyebrow="1">
              <div className="mb-6 flex items-center gap-5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile avatar" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4A6FA5] text-[26px] text-white" style={{ fontWeight: 700 }}>
                    {initials}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#D8DEE8] bg-white px-4 text-[13px] text-[#374151] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                    <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                    Upload avatar/photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-4 text-[13px] text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
                    style={{ fontWeight: 600 }}
                  >
                    <span className="material-icons" style={{ fontSize: "16px" }}>delete_outline</span>
                    Remove photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name"><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Last Name"><Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Mobile Phone"><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Job Title"><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Employee ID"><Input value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
              </div>

              <div className="mt-5">
                <Field label="Signature">
                  <textarea
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    className="min-h-[74px] w-full resize-y rounded-lg border border-[#D8DEE8] px-3 py-2 text-[14px] text-[#1A2332] outline-none focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Password">
              <div className="grid grid-cols-1 gap-4">
                <Field label="Current password"><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Change password"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Password requirements"><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="h-9 border-[#D8DEE8]" /></Field>
              </div>
              <div className="mt-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-[12px] leading-5 text-[#546478]">
                Minimum 8 characters, with uppercase, number, and special character recommended.
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Notifications" eyebrow="2">
              <div className="space-y-3">
                <NotificationGroup title="Job Notifications" rows={jobNotifications} />
                <NotificationGroup title="Estimate Notifications" rows={estimateNotifications} />
                <NotificationGroup title="Invoice & Payment Notifications" rows={invoiceNotifications} />
              </div>
            </Section>

            <Section title="Appearance" eyebrow="3">
              <div className="space-y-5">
                <div>
                  <h3 className="mb-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Theme</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Light", "Dark", "System default"] as ThemePreference[]).map(option => (
                      <Choice key={option} label={option} selected={theme === option} onClick={() => setTheme(option)} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-[14px] text-[#1A2332]" style={{ fontWeight: 700 }}>Navigation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Expanded sidebar", "Collapsed sidebar by default"] as SidebarPreference[]).map(option => (
                      <Choice key={option} label={option} selected={sidebar === option} onClick={() => setSidebar(option)} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Logout" eyebrow="4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3">
                <div>
                  <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>End this session</div>
                  <div className="mt-0.5 text-[12px] leading-4 text-[#6B7280]">Return to the login screen for this prototype.</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#B91C1C] px-4 text-[13px] text-white transition-colors hover:bg-[#991B1B]"
                  style={{ fontWeight: 700 }}
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>logout</span>
                  Logout
                </button>
              </div>
            </Section>

            <div className="flex justify-end gap-2">
              <button className="h-9 rounded-lg border border-[#D8DEE8] bg-white px-4 text-[13px] text-[#546478] transition-colors hover:bg-[#F5F7FA]" style={{ fontWeight: 600 }}>
                Cancel
              </button>
              <button className="h-9 rounded-lg bg-[#4A6FA5] px-4 text-[13px] text-white transition-colors hover:bg-[#3d5a85]" style={{ fontWeight: 700 }}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
