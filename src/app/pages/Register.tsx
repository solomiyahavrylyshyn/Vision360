import { useState } from "react";
import { useNavigate } from "react-router";
import { Checkbox } from "../components/ui/checkbox";
import { AuthLayout } from "../components/AuthLayout";
import { AuthStepper } from "../components/AuthStepper";
import { trialStore } from "../stores/trialStore";

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const canSubmit =
    email.trim() !== "" &&
    password.length >= 8 &&
    confirmPassword !== "" &&
    password === confirmPassword &&
    acceptTerms;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    trialStore.startTrial();
    navigate("/verify-2fa");
  };

  const inputCls =
    "w-full h-10 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";
  const eyeBtnCls = "absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#374151]";

  return (
    <AuthLayout>
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-6">
        <AuthStepper current={1} />

        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Create your account</h1>
            <p className="text-[18px] text-[#374151]">Start managing your field operations efficiently.</p>
          </div>

          {/* form-inner */}
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[14px] font-medium leading-5 text-[#1A2332]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} px-4`}
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[14px] font-medium leading-5 text-[#1A2332]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pl-4 pr-11`}
                  required
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
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="text-[14px] font-medium leading-5 text-[#1A2332]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputCls} pl-4 pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className={eyeBtnCls}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showConfirmPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="size-4 shrink-0 data-[state=checked]:bg-[#4A6FA5] data-[state=checked]:border-[#4A6FA5]"
              />
              <label htmlFor="terms" className="text-[14px] text-[#1A2332] cursor-pointer select-none">
                I agree to the{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-[#4A6FA5] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-[#4A6FA5] hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
        </div>

        {/* Continue */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Continue
        </button>

        {/* Divider */}
        <div className="h-px w-full bg-[#E5E7EB]" />

        {/* Sign in */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[14px] text-[#1A2332]">Already have an account?</span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[14px] font-medium text-[#4A6FA5] hover:underline"
          >
            Sign in!
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
