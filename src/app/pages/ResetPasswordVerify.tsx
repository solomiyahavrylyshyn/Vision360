import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { AuthLayout } from "../components/AuthLayout";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function ResetPasswordVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || "peter@email.com";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const newCode = [...code];
      for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
      setCode(newCode);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const codeComplete = code.every((d) => d !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeComplete) return;
    navigate("/reset-password/new-password", { state: { email, code: code.join("") } });
  };

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
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Check your email</h1>
            <p className="text-[18px] text-[#374151]">We sent a 6-digit code to {maskEmail(email)}</p>
          </div>

          {/* Verification code */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#1A2332]">Verification code</label>
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  placeholder="•"
                  value={digit}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-10 text-center rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Verify code */}
        <button
          type="submit"
          disabled={!codeComplete}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Verify code
        </button>

        {/* Divider */}
        <div className="h-px w-full bg-[#E5E7EB]" />

        {/* Resend */}
        <div className="flex items-center justify-center gap-2 text-[14px]">
          <span className="text-[#1A2332]">Didn&rsquo;t receive it?</span>
          <button
            type="button"
            onClick={() => setResendTimer(60)}
            disabled={resendTimer > 0}
            className="font-medium text-[#4A6FA5] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
