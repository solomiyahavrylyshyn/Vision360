import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = [
    { ok: password.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(password), label: "Uppercase" },
    { ok: /[0-9]/.test(password), label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Special character" },
  ];
  const allRulesPass = rules.every((r) => r.ok);
  const passwordsMatch = password !== "" && confirmPassword !== "" && password === confirmPassword;
  const isValid = allRulesPass && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    navigate("/", { state: { toast: "Password updated." } });
  };

  const inputCls =
    "w-full h-10 pl-4 pr-11 rounded-lg border bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:ring-2";
  const eyeBtnCls =
    "absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#374151]";

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-1 text-[14px] font-medium text-[#4A6FA5] hover:underline w-fit"
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
              Back
            </button>
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Set new password</h1>
            <p className="text-[18px] text-[#374151]">
              Your identity has been verified. Choose a new password for your account.
            </p>
          </div>

          {/* form-inner */}
          <div className="flex flex-col gap-4">
            {/* New password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="new-password" className="text-[14px] font-medium leading-5 text-[#1A2332]">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} border-[#E5E7EB] focus:border-[#4A6FA5] focus:ring-[#4A6FA5]/20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={eyeBtnCls}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {password !== "" && (
                <div className="flex flex-wrap gap-2 text-[13px] leading-4">
                  {rules.map((rule) => (
                    <span
                      key={rule.label}
                      className="flex items-center gap-2"
                      style={{ color: rule.ok ? "#16A34A" : "#6B7280" }}
                    >
                      <span className="material-icons" style={{ fontSize: "14px" }}>
                        {rule.ok ? "check_circle" : "cancel"}
                      </span>
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="text-[14px] font-medium leading-5 text-[#1A2332]">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputCls} ${
                    confirmPassword !== "" && !passwordsMatch
                      ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20"
                      : "border-[#E5E7EB] focus:border-[#4A6FA5] focus:ring-[#4A6FA5]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className={eyeBtnCls}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showConfirm ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {confirmPassword !== "" && (
                <p
                  className="text-[13px] leading-4"
                  style={{ color: passwordsMatch ? "#16A34A" : "#DC2626" }}
                >
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Log in */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Log in
        </button>
      </form>
    </AuthLayout>
  );
}
