import { Fragment } from "react";

/**
 * 3-step progress indicator for the sign-up flow (Figma "Stepper" component).
 * Account → Verify → Business. `current` is the 1-based active step; earlier
 * steps render as completed (blue circle + check), later steps as upcoming.
 */
export function AuthStepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: "Verify" },
    { n: 3, label: "Business" },
  ] as const;

  return (
    <div className="flex items-center gap-2 w-[388px] max-w-full">
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <Fragment key={s.n}>
            <div
              className={`flex items-center justify-center size-10 rounded-full shrink-0 ${
                done || active ? "bg-[#4A6FA5]" : "bg-[#F0F4FB]"
              }`}
            >
              {done ? (
                <span className="material-icons text-white" style={{ fontSize: "20px" }}>check</span>
              ) : (
                <span className={`text-[18px] ${active ? "text-white" : "text-[#6B7280]"}`}>{s.n}</span>
              )}
            </div>
            <span
              className={`text-[16px] font-medium leading-6 shrink-0 ${
                done || active ? "text-[#1A2332]" : "text-[#6B7280]"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px min-w-px bg-[#E5E7EB]" />}
          </Fragment>
        );
      })}
    </div>
  );
}
