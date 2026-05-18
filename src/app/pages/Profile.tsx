import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";

// Personal user details — what the logged-in person can edit about themselves.
// Per Marek's walkthrough #3: "that should be for the user [himself]".

export function Profile() {
  const navigate = useNavigate();

  // Personal info
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@omegahomeservices.com");
  const [phone, setPhone] = useState("(813) 555-0142");
  const [role] = useState("Admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  const initials = (firstName[0] || "") + (lastName[0] || "");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "24px" }}>{title}</h2>
        {description && <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-[#374151]" style={{ fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#4A6FA5]" : "bg-[#E5E7EB]"}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[860px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-3"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            Back
          </button>
          <h1 className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>Profile</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Your personal account details. These are visible to your team.</p>
        </div>

        <div className="space-y-4">
          {/* Personal info */}
          <Section title="Personal info" description="Name, contact details, and avatar.">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#4A6FA5] text-white flex items-center justify-center text-[26px]" style={{ fontWeight: 600 }}>
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 h-9 px-4 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#374151] cursor-pointer transition-colors" style={{ fontWeight: 500 }}>
                  <span className="material-icons" style={{ fontSize: "16px" }}>upload</span>
                  Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl(null)}
                    className="text-[12px] text-[#DC2626] hover:underline text-left"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First name">
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="Last name">
                <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="Role">
                <Input value={role} readOnly className="h-9 border-[#D8DEE8] bg-[#F9FAFB] text-[#6B7280]" />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="h-9 px-4 border border-[#D8DEE8] bg-white hover:bg-[#F5F7FA] rounded-md text-[13px] text-[#546478] transition-colors" style={{ fontWeight: 500 }}>
                Cancel
              </button>
              <button className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>
                Save changes
              </button>
            </div>
          </Section>

          {/* Change password */}
          <Section title="Change password" description="Use a strong, unique password to protect your account.">
            <div className="grid grid-cols-1 gap-4 max-w-[420px]">
              <Field label="Current password">
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="New password">
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
              <Field label="Confirm new password">
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-9 border-[#D8DEE8]" />
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="h-9 px-4 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-md text-[13px] text-white transition-colors" style={{ fontWeight: 500 }}>
                Update password
              </button>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" description="Choose how you want to be notified.">
            <div className="space-y-4">
              {[
                { label: "Email notifications",   desc: "Job assignments, status updates, and mentions.",  value: emailNotifications, set: setEmailNotifications },
                { label: "Push notifications",    desc: "Real-time alerts on the mobile app.",              value: pushNotifications,  set: setPushNotifications  },
                { label: "SMS notifications",     desc: "Critical alerts via text message.",                value: smsNotifications,   set: setSmsNotifications   },
                { label: "Weekly summary email",  desc: "A digest of last week's activity every Monday.",  value: weeklySummary,      set: setWeeklySummary      },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>{row.label}</div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">{row.desc}</div>
                  </div>
                  <Toggle checked={row.value} onChange={row.set} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
