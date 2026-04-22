import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

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
  const [resendTimer, setResendTimer] = useState(60);
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
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
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
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || "";
      }
      setCode(newCode);
      const focusIdx = Math.min(pasted.length, 5);
      inputsRef.current[focusIdx]?.focus();
    }
  };

  const codeComplete = code.every((d) => d !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeComplete) return;
    navigate("/reset-password/new-password", { state: { email, code: code.join("") } });
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
                mail
              </span>
            </div>
            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Check your email</h2>
            <p className="text-[#546478] text-[15px]">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-[#1A2332]">{maskEmail(email)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-[#1A2332] mb-3 block">
                Verification code
              </Label>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-full h-14 text-center text-2xl font-bold border-2 border-[#DDE3EE] rounded-xl bg-[#F5F7FA] focus:bg-white focus:border-[#4A6FA5] focus:outline-none transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="mt-3 text-center">
                <span className="text-sm text-[#546478]">
                  Didn't receive it?{" "}
                  <button
                    type="button"
                    onClick={() => setResendTimer(60)}
                    disabled={resendTimer > 0}
                    className="text-[#4A6FA5] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                  </button>
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] text-white transition-colors shadow-sm disabled:opacity-50"
              disabled={!codeComplete}
            >
              Verify code
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
