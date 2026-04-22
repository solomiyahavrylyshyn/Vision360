import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function ResetPasswordForm() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const calculatePasswordStrength = () => {
    if (!password) return { width: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    if (strength <= 25) return { width: 25, label: "Weak", color: "#DC2626" };
    if (strength <= 50) return { width: 50, label: "Fair", color: "#D97706" };
    if (strength <= 75) return { width: 75, label: "Good", color: "#D97706" };
    return { width: 100, label: "Strong", color: "#16A34A" };
  };

  const passwordStrength = calculatePasswordStrength();
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const isValid = passwordsMatch && passwordLongEnough;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setTimeout(() => {
      navigate("/login", { state: { toast: "Password updated. Please sign in." } });
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Column */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224155-169641357599?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMGNvbmNlcHR8ZW58MHx8fHwxNzc1MjIyNTE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/80 to-transparent" />
        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full">
          <div className="mt-auto mb-16">
            <div className="mb-8" style={{ marginTop: "-1px", paddingRight: "3px", marginBottom: "-1px", paddingLeft: "3px" }}>
              <img src={logoImg} alt="Vision360 Logo" className="h-[96px] w-auto object-contain brightness-0 invert mb-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Transform your <br />
              <span className="text-[#4A6FA5]">field operations.</span>
            </h1>
            <p className="text-[#A0B0C4] text-lg max-w-md mb-8">
              Join thousands of professionals scaling their service businesses with Vision360 FSM Platform.
            </p>
          </div>
          <div className="text-[#546478] text-sm">
            © 2026 Vision360 Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-5">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <div className="w-16 h-16 bg-[#F5F7FA] rounded-2xl flex items-center justify-center mb-6">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "32px" }}>
                lock_open
              </span>
            </div>
            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Set new password</h2>
            <p className="text-[#546478] text-[15px]">
              Your identity has been verified. Choose a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">New password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] hover:text-[#546478]"
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#EDF0F5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength.width}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold min-w-[45px] text-right"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {[
                      { test: password.length >= 8, label: "8+ characters" },
                      { test: /[A-Z]/.test(password), label: "Uppercase" },
                      { test: /[0-9]/.test(password), label: "Number" },
                      { test: /[^A-Za-z0-9]/.test(password), label: "Special char" },
                    ].map((rule) => (
                      <span
                        key={rule.label}
                        className={`flex items-center gap-1 text-xs ${rule.test ? "text-[#16A34A]" : "text-[#9CA3AF]"}`}
                      >
                        <span className="material-icons" style={{ fontSize: "14px" }}>
                          {rule.test ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        {rule.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1A2332]">Confirm new password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 pr-11 border-[#DDE3EE] focus-visible:ring-[#4A6FA5] bg-[#F5F7FA] focus:bg-white transition-colors ${
                    confirmPassword && !passwordsMatch ? "border-[#DC2626] focus-visible:ring-[#DC2626]" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] hover:text-[#546478]"
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-[#DC2626] flex items-center gap-1">
                  <span className="material-icons" style={{ fontSize: "14px" }}>error</span>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-[#16A34A] flex items-center gap-1">
                  <span className="material-icons" style={{ fontSize: "14px" }}>check_circle</span>
                  Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] text-white transition-colors shadow-sm disabled:opacity-50"
              disabled={!isValid || saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="material-icons animate-spin" style={{ fontSize: "18px" }}>refresh</span>
                  Saving...
                </span>
              ) : (
                "Save password"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-[#A0B0C4] font-medium hover:text-[#546478] transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <span className="material-icons text-sm">arrow_back</span>
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
