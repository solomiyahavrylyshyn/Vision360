import { useState } from "react";
import { Input } from "../components/ui/input";
// Profile page — aligned to Figma node 1122-7158.

type SidebarPreference = "Expanded sidebar" | "Collapsed sidebar";

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
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [phone, setPhone] = useState("(813) 555-0142");
  const [jobTitle, setJobTitle] = useState("Operations manager");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [enabledNotifications, setEnabledNotifications] = useState<Set<string>>(
    () => new Set([...jobNotifications, ...estimateNotifications, ...invoiceNotifications])
  );
  const [sidebar, setSidebar] = useState<SidebarPreference>("Expanded sidebar");

  const toggleNotification = (label: string) => {
    setEnabledNotifications(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-[16px] leading-6 text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] leading-4 text-[#8A97A8]">{subtitle}</p>}
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

  const PasswordField = ({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) => (
    <Field label={label}>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 border-[#D8DEE8] pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A97A8] transition-colors hover:text-[#546478]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>{show ? "visibility_off" : "visibility"}</span>
        </button>
      </div>
    </Field>
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

  const Choice = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
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
        <h1 className="mb-6 text-[26px] leading-8 text-[#1A2332]" style={{ fontWeight: 750 }}>User profile</h1>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(360px,1fr)] gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <Section title="Profile">
              <div className="grid grid-cols-3 gap-4">
                <Field label="First name"><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Last name"><Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Phone"><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
                <Field label="Job title"><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="h-9 border-[#D8DEE8]" /></Field>
              </div>
            </Section>

            <Section title="Change password" subtitle="Minimum 8 characters, with uppercase, number, and special character recommended.">
              <div className="grid grid-cols-1 gap-4">
                <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
                <PasswordField label="New password" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(v => !v)} />
                <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
            </Section>

            <Section title="Appearance">
              <span className="mb-2 block text-[13px] text-[#374151]" style={{ fontWeight: 600 }}>Navigation</span>
              <div className="grid grid-cols-2 gap-2">
                {(["Expanded sidebar", "Collapsed sidebar"] as SidebarPreference[]).map(option => (
                  <Choice key={option} label={option} selected={sidebar === option} onClick={() => setSidebar(option)} />
                ))}
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Section title="Notifications">
              <div className="space-y-3">
                <NotificationGroup title="Job notifications" rows={jobNotifications} />
                <NotificationGroup title="Estimate Notifications" rows={estimateNotifications} />
                <NotificationGroup title="Invoice & Payment Notifications" rows={invoiceNotifications} />
              </div>
            </Section>

            <div className="flex justify-end">
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
