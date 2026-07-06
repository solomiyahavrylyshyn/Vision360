import { useNavigate, useSearchParams } from "react-router";
import { AuthLayout } from "../components/AuthLayout";

/** Shown when a team member opens an expired invite link (Figma "expired"). */
export function InviteExpired() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "your email address";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col gap-6">
        {/* copy */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">This invite has expired</h1>
          <p className="text-[18px] text-[#374151]">
            The invite link sent to {email} is no longer valid. Ask your team admin to send a new one.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-[#4A6FA5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d5a85]"
        >
          Back to log in
        </button>
      </div>
    </AuthLayout>
  );
}
