import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Checkbox } from "../components/ui/checkbox";
import { AuthLayout } from "../components/AuthLayout";
import { isDeviceTrusted } from "../utils/trustedDevice";

// ── Demo triggers (prototype only — no real auth) ────────────────────────────
// Any submit signs in, EXCEPT these documented demo credentials that surface the
// Figma error states for design review:
//   • password "wrong"  → "Incorrect password. N attempts remaining" (3→2→1),
//                          then "blocked" (locked form + countdown) after 3 tries
//   • password "error"  → "Incorrect email or password." (email + password red)
const PW_WRONG = "wrong";
const PW_BAD_CREDS = "error";
const MAX_ATTEMPTS = 3;
const BLOCK_SECONDS = 15 * 60; // 15:00 lockout

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState("");

  const [error, setError] = useState<null | "password" | "credentials">(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [blockSeconds, setBlockSeconds] = useState(0);
  const blocked = blockSeconds > 0;

  useEffect(() => {
    const msg = (location.state as any)?.toast;
    if (msg) {
      setToast(msg);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Lockout countdown
  useEffect(() => {
    if (blockSeconds <= 0) return;
    const t = setTimeout(() => setBlockSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [blockSeconds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;

    if (password === PW_WRONG) {
      const used = wrongCount + 1;
      setWrongCount(used);
      if (MAX_ATTEMPTS - used <= 0) {
        setError(null);
        setBlockSeconds(BLOCK_SECONDS);
      } else {
        setError("password");
      }
      return;
    }
    if (password === PW_BAD_CREDS) {
      setError("credentials");
      return;
    }
    // FR-1.3 — credentials accepted → 2FA code screen, unless this browser was
    // marked trusted ("Trust this device for 30 days") on a previous login.
    if (isDeviceTrusted()) {
      navigate("/");
    } else {
      navigate("/login/verify", { state: { email } });
    }
  };

  const attemptsLeft = MAX_ATTEMPTS - wrongCount;
  const canSubmit = email.trim() !== "" && password.trim() !== "" && !blocked;
  const emailErr = error === "credentials";
  const pwErr = error === "password" || error === "credentials";
  const mmss = `${String(Math.floor(blockSeconds / 60)).padStart(2, "0")}:${String(blockSeconds % 60).padStart(2, "0")}`;

  const baseInput =
    "w-full h-10 rounded-lg border bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF] disabled:cursor-not-allowed";
  const okBorder = "border-[#E5E7EB] focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20";
  const errBorder = "border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20";

  return (
    <AuthLayout>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#1A2332] text-white rounded-xl shadow-2xl">
            <span className="material-icons text-[#22C55E]" style={{ fontSize: "20px" }}>check_circle</span>
            <span className="text-[14px] font-medium">{toast}</span>
            <button onClick={() => setToast("")} className="ml-2 text-white/60 hover:text-white">
              <span className="material-icons" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Welcome back!</h1>
            <p className="text-[18px] text-[#374151]">Sign in to your Vision360 account.</p>
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
                disabled={blocked}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className={`${baseInput} px-4 ${emailErr ? errBorder : okBorder}`}
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
                  disabled={blocked}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className={`${baseInput} pl-4 pr-11 ${pwErr ? errBorder : okBorder}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#374151] disabled:text-[#9CA3AF]"
                  disabled={blocked}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {error === "password" && (
                <p className="text-[13px] leading-4 text-[#DC2626]">
                  Incorrect password. {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
                </p>
              )}
              {error === "credentials" && (
                <p className="text-[13px] leading-4 text-[#DC2626]">Incorrect email or password.</p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={remember}
                  disabled={blocked}
                  onCheckedChange={(checked) => setRemember(checked as boolean)}
                  className="size-4 data-[state=checked]:bg-[#4A6FA5] data-[state=checked]:border-[#4A6FA5]"
                />
                <label htmlFor="remember" className={`text-[14px] cursor-pointer select-none ${blocked ? "text-[#9CA3AF]" : "text-[#1A2332]"}`}>
                  Keep me signed in
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-[14px] font-medium text-[#4A6FA5] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>

        {/* Sign in */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Sign in
        </button>

        {/* Lockout alert */}
        {blocked && (
          <div className="flex gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
            <span className="material-icons text-[#DC2626] shrink-0" style={{ fontSize: "16px", marginTop: "2px" }}>lock</span>
            <div className="flex flex-col gap-0.5 text-[14px] leading-5">
              <p className="font-medium text-[#DC2626]">Access temporarily restricted</p>
              <p className="text-[#DC2626]">Too many failed login attempts. Try again in {mmss}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-[#E5E7EB]" />

        {/* Sign up */}
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[#1A2332]">Don&rsquo;t have an account yet?</span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-[14px] font-medium text-[#4A6FA5] hover:underline"
          >
            Sign up!
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
