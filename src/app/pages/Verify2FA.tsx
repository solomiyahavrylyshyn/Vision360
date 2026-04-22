import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import logoImg from "figma:asset/58956be46c544ae8676a6fc4c67137e1d450e75f.png";

export function Verify2FA() {
  const navigate = useNavigate();
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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.every(digit => digit !== "")) {
      navigate("/setup");
    }
  };

  const handleResendCode = () => {
    setResendTimer(60);
    alert("Verification code resent");
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Column: Visual/Marketing */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1A2332] flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659353586512-bcc4c7182d01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbmdpbmVlciUyMHRhYmxldHxlbnwxfHx8fDE3NzUyMjIzODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/80 to-transparent" />

        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full">
          <div className="mt-auto mb-16">
            <div className="mb-8" style={{ marginTop: "-1px", paddingRight: "3px", marginBottom: "-1px", paddingLeft: "3px" }}>
              <img src={logoImg} alt="Vision360 Logo" className="h-[96px] w-auto object-contain brightness-0 invert mb-6" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Transform your <br/>
              <span className="text-[#4A6FA5]">field operations.</span>
            </h1>
            <p className="text-[#A0B0C4] text-lg max-w-md mb-8">
              Join thousands of professionals scaling their service businesses with Vision360 FSM Platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Smart job scheduling & dispatch</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Automated quotes and invoicing</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <span className="material-icons text-[#4A6FA5]">check_circle</span>
                <span className="font-medium">Real-time team tracking</span>
              </div>
            </div>
          </div>

          <div className="text-[#546478] text-sm">
            © 2026 Vision360 Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: 2FA Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-5">
            <img src={logoImg} alt="Vision360 Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            {/* Step indicator */}
            <div className="mb-8 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center">
                  <span className="material-icons text-white" style={{ fontSize: "16px" }}>check</span>
                </div>
                <span className="text-xs font-semibold text-[#4A6FA5]">Account</span>
              </div>
              <div className="w-8 h-px bg-[#DDE3EE]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-semibold text-[#1A2332]">Verify</span>
              </div>
              <div className="w-8 h-px bg-[#DDE3EE]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EDF0F5] flex items-center justify-center text-[#546478] text-xs font-bold">
                  3
                </div>
                <span className="text-xs font-semibold text-[#546478]">Business</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#1A2332] mb-3">Verify your identity</h2>
            <p className="text-[#546478] text-[15px]">
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2 sm:gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-full h-14 text-center text-2xl font-bold border-2 border-[#DDE3EE] rounded-xl bg-[#F5F7FA] focus:bg-white focus:border-[#4A6FA5] focus:outline-none transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#4A6FA5] hover:bg-[#3d5a85] text-white transition-colors shadow-sm"
              disabled={code.some(digit => digit === "")}
            >
              Verify Code
            </Button>

            <div className="text-center space-y-4">
              <p className="text-sm text-[#546478]">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0}
                  className="text-[#4A6FA5] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-[#A0B0C4] font-medium hover:text-[#546478] transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <span className="material-icons text-sm">arrow_back</span>
                Back to Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}