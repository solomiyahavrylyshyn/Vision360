import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordRequest() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    navigate("/reset-password/verify", { state: { email } });
  };

  const canSubmit = email.trim() !== "";

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex items-center gap-1 text-[14px] font-medium text-[#4A6FA5] hover:underline w-fit"
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
          Back
        </button>

        {/* form-top */}
        <div className="flex flex-col gap-8">
          {/* copy */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Reset your password</h1>
            <p className="text-[18px] text-[#374151]">
              Enter your email and we&rsquo;ll send you a verification code.
            </p>
          </div>

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
              className="w-full h-10 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[14px] text-[#1A2332] placeholder:text-[#6B7280] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20"
              required
            />
          </div>
        </div>

        {/* Send code */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4A6FA5]"
        >
          Send code
        </button>
      </form>
    </AuthLayout>
  );
}
