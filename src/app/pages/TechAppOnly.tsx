import { useNavigate, useSearchParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { AuthLayout } from "../components/AuthLayout";
import { appOnlyMember } from "../stores/teamRolesStore";

/** Where the technician app is downloaded from. One link for both stores — the page
 *  behind it sends the phone to the App Store or Google Play. */
export const TECH_APP_URL = "https://vision360.app/get";

/**
 * Shown after sign-in when the person's role has "Can use the web app" turned off
 * (Manage team → Roles → Mobile app). They use the phone app instead: scan the code
 * on a computer screen, or tap the store buttons when already on the phone.
 */
export function TechAppOnly() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const member = email ? appOnlyMember(email) : null;
  const first = member?.name.split(" ")[0];
  const role = member?.role ?? "Technician";

  return (
    <AuthLayout>
      <div className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-medium leading-[1.2] text-[#1A2332]">Your role uses the Vision360 technician app</h1>
          <p className="text-[18px] text-[#374151]">
            {first ? `Hi ${first}, the` : "The"} {role} role works in the phone app, not on the web. Scan the code with your phone's camera to get the app, then sign in with {email || "the same email"}.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 sm:flex-row sm:items-center sm:gap-6">
          <div className="rounded-lg bg-white p-3 shadow-sm" aria-label="QR code to get the Vision360 technician app">
            <QRCodeSVG value={TECH_APP_URL} size={152} level="M" fgColor="#1A2332" />
          </div>
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <div className="text-[14px] text-[#374151]">
              <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>Scan with your phone</span>
              <br />Works on iPhone and Android.
            </div>
            <div className="text-[13px] text-[#6B7280]">Already on your phone?</div>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <a href={TECH_APP_URL} target="_blank" rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1A2332] px-3 text-[13px] text-white hover:bg-black" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: 18 }}>phone_iphone</span>App Store
              </a>
              <a href={TECH_APP_URL} target="_blank" rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1A2332] px-3 text-[13px] text-white hover:bg-black" style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: 18 }}>shop</span>Google Play
              </a>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-[#6B7280]">
          Need the web app too? Ask your admin to turn on “Can use the web app” for your role.
        </p>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full h-10 flex items-center justify-center rounded-lg border border-[#D8DEE8] bg-white px-6 text-[14px] font-medium text-[#1A2332] transition-colors hover:bg-[#F5F7FA]"
        >
          Back to log in
        </button>
      </div>
    </AuthLayout>
  );
}
