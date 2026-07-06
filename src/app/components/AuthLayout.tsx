import logoImg from "../../assets/vision360-logo-horizontal.png";
import clientsMockup from "../../assets/auth/clients-mockup.png";
import jobInfoCard from "../../assets/auth/job-info-card.png";

/**
 * Shared chrome for every authorization screen (Figma page "authorization").
 * Left: Vision360 wordmark top-left + a centered 552px-wide form slot (`children`).
 * Right: the identical marketing panel (blue #4A6FA5 card, app mockup, floating
 * job card, decorative glow circles), hidden below the lg breakpoint.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-white relative">
      {/* Left column — form */}
      <div className="relative flex-1 flex items-center justify-center px-6 py-10">
        {/* Logo — top-left corner (cropped to the horizontal wordmark) */}
        <div className="absolute top-6 left-6 w-[150px] h-[29px] overflow-hidden">
          <img
            src={logoImg}
            alt="Vision360"
            className="absolute max-w-none h-[299.29%] w-[117.59%] left-[-10.55%] top-[-106.23%]"
          />
        </div>

        <div className="w-full max-w-[552px]">{children}</div>
      </div>

      {/* Right column — marketing panel, hidden below lg */}
      <div className="hidden lg:block basis-[48.33%] shrink-0 py-6 pr-6">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#4A6FA5] text-white">
          {/* Decorative glow circles (white @ 10%) */}
          <div className="absolute rounded-full bg-white/10 blur-[4px]" style={{ left: "-17.3%", top: "-7.6%", width: "57.3%", aspectRatio: "1" }} />
          <div className="absolute rounded-full bg-white/10 blur-[4px]" style={{ left: "51.9%", top: "65.8%", width: "71.4%", aspectRatio: "1" }} />
          <div className="absolute rounded-full bg-white/10 blur-[4px]" style={{ left: "38.5%", top: "69%", width: "28.4%", aspectRatio: "1" }} />

          {/* App screenshot mockup (bleeds off the left edge) */}
          <img
            src={clientsMockup}
            alt=""
            aria-hidden
            className="absolute max-w-none rounded-xl object-cover"
            style={{ left: "-15.18%", top: "28.07%", width: "107.44%", aspectRatio: "722 / 525" }}
          />

          {/* Floating job-info card */}
          <img
            src={jobInfoCard}
            alt=""
            aria-hidden
            className="absolute max-w-none rounded-[10px] object-cover shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
            style={{ left: "66.96%", top: "23.36%", width: "29.76%", aspectRatio: "2 / 3" }}
          />

          {/* Copy */}
          <div className="absolute flex flex-col gap-2" style={{ left: "5.2%", top: "9.5%", width: "82.1%" }}>
            <h2 className="text-[32px] font-medium leading-[1.2]">Transform your field operations.</h2>
            <p className="text-[18px] leading-normal">
              Join thousands of professionals scaling their service businesses with Vision360.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
