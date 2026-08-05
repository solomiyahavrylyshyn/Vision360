import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { allReportNames } from "../components/ReportAccessPanel";
// Full RBAC editor (FR-2b) — shared with the Edit-user modal on Settings →
// Manage team so both forms present identical permissions + report access.
import {
  PermissionsEditor, Radio,
  employeePreset, adminPreset, ensureItemsPerm, loadCustomPresets, saveCustomPresets,
  type PermissionsState, type CustomPreset, type PresetId,
} from "../components/PermissionsEditor";

// ─── Component ───────────────────────────────────────────────────────────────
export function NewUser() {
  const navigate = useNavigate();

  // Personal info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [laborCost, setLaborCost] = useState("0.00");

  // Permissions
  const [preset, setPreset] = useState<PresetId>("employee");
  const [perms, setPerms] = useState<PermissionsState>(employeePreset);
  // Per-report access (RPT-2) — revealed when the Reports permission is on.
  const [reportAccess, setReportAccess] = useState<Record<string, boolean>>(
    () => Object.fromEntries(allReportNames.map((n) => [n, true])),
  );
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() =>
    loadCustomPresets().map(cp => ({ ...cp, permissions: ensureItemsPerm(cp.permissions) })),
  );

  // Persist custom presets
  useEffect(() => {
    saveCustomPresets(customPresets);
  }, [customPresets]);

  // Communications
  const [language, setLanguage] = useState<"english" | "spanish">("english");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    toast.success(`Invitation sent to ${email}`);
    navigate("/settings?section=team");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-6">
          <button
            type="button"
            onClick={() => navigate("/settings?section=team")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#4A6FA5] hover:text-[#3d5a85] transition-colors mb-4"
            style={{ fontWeight: 500 }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>arrow_back</span>
            <span>Back to Manage Team</span>
          </button>
          <h1 className="text-[26px] text-[#1A2332]" style={{ fontWeight: 700 }}>New User</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white">
          <div className="px-8 py-8">
            <div className="space-y-10">

              {/* ── Personal Info ─────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Personal info</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left column: contact */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Full name *</Label>
                      <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Full name"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Email address *</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Mobile phone number (if applicable)</Label>
                      <Input
                        value={mobile}
                        onChange={e => setMobile(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Right column: address */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Street address</Label>
                      <Input
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="123 Main St"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>City</Label>
                      <Input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>State / Province</Label>
                      <Input
                        value={state}
                        onChange={e => setState(e.target.value)}
                        placeholder="State"
                        className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Postal code</Label>
                        <Input
                          value={postalCode}
                          onChange={e => setPostalCode(e.target.value)}
                          placeholder="12345"
                          className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[13px] text-[#374151] mb-1.5 block" style={{ fontWeight: 500 }}>Country</Label>
                        <Input
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="border-[#E5E7EB] bg-white h-10 text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labor cost */}
                <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>Labor cost</h3>
                    <span
                      className="material-icons text-[#9CA3AF]"
                      style={{ fontSize: "16px" }}
                      title="Used for job costing calculations"
                    >
                      help_outline
                    </span>
                  </div>
                  <div className="max-w-[260px]">
                    <Label className="text-[11px] text-[#6B7280] mb-1 block">Employee cost</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546478] text-[14px]">$</span>
                      <Input
                        type="text"
                        value={laborCost}
                        onChange={e => setLaborCost(e.target.value)}
                        className="border-[#E5E7EB] bg-white h-10 text-[14px] pl-7 pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-[12px]">per hour</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Permissions ───────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Permissions</h2>

                <PermissionsEditor
                  preset={preset}
                  setPreset={setPreset}
                  perms={perms}
                  setPerms={setPerms}
                  reportAccess={reportAccess}
                  setReportAccess={setReportAccess}
                  customPresets={customPresets}
                  setCustomPresets={setCustomPresets}
                />
              </section>

              {/* ── Communications ────────────────────────────────── */}
              <section className="border border-[#E5E7EB] rounded-xl p-6">
                <h2 className="text-[18px] text-[#1A2332] mb-5" style={{ fontWeight: 700 }}>Communications</h2>

                <div>
                  <h3 className="text-[14px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>Invitation language</h3>
                  <p className="text-[12px] text-[#6B7280] mb-3">
                    The chosen language <span style={{ fontWeight: 600 }}>only applies to the invitation and cannot be changed once sent.</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    <Radio
                      checked={language === "english"}
                      onClick={() => setLanguage("english")}
                      label="English"
                    />
                    <Radio
                      checked={language === "spanish"}
                      onClick={() => setLanguage("spanish")}
                      label="Spanish"
                      description="The mobile app is available in Spanish only to non-admin users who have their phone language set to Spanish"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#F9FAFB] border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/settings?section=team")}
              className="border-[#E5E7EB] text-[#546478] hover:bg-[#EDF0F5] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4A6FA5] hover:bg-[#3d5a85] h-10 px-6 text-white"
            >
              Save User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
