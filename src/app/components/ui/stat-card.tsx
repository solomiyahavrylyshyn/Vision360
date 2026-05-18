import { useId } from "react";

// Clients-style stat card used across list pages (Clients, Jobs, Estimates,
// Invoices, Payments). One consistent shape so the whole app reads the same.

export interface StatCardProps {
  value: string;
  label: string;
  sub: string;
  change?: string;       // e.g. "+12%" or "-3%"
  changeUp?: boolean;    // direction of the arrow + color
  period?: string;       // e.g. "vs prev. period"
  data?: number[];       // sparkline series; pass [] to hide the sparkline
  sparklineColor?: string;
}

export function StatCard({
  value,
  label,
  sub,
  change,
  changeUp = true,
  period = "vs prev. period",
  data,
  sparklineColor = "#4A6FA5",
}: StatCardProps) {
  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-2"
      style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)", height: 130 }}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>
          {value}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-[16px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "24px" }}>
            {label}
          </div>
          <div className="text-[12px] text-[#6B7280]" style={{ fontWeight: 400, lineHeight: "16px" }}>
            {sub}
          </div>
        </div>
        {change ? (
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`flex items-center gap-1 text-[12px] ${changeUp ? "text-[#16A34A]" : "text-[#DC2626]"}`}
              style={{ fontWeight: 400, lineHeight: "16px" }}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>
                {changeUp ? "trending_up" : "trending_down"}
              </span>
              {change}
            </span>
            <span className="text-[12px] text-[#6B7280]" style={{ fontWeight: 400, lineHeight: "16px" }}>
              {period}
            </span>
          </div>
        ) : null}
      </div>
      {data && data.length > 0 ? (
        <div className="shrink-0">
          <Sparkline data={data} color={sparklineColor} />
        </div>
      ) : null}
    </div>
  );
}

// Inline sparkline (64x32) matching the one used on the Clients page.
function Sparkline({ data, color = "#4A6FA5" }: { data: number[]; color?: string }) {
  const gradientId = useId();
  const w = 64, h = 32, pad = 1.28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`)
    .join(" ");
  const area = `M${pts.split(" ")[0]} L${pts} L${w - pad},${h} L${pad},${h} Z`;
  return (
    <svg width={w} height={h} viewBox="0 0 64 32" fill="none" aria-hidden="true">
      <g clipPath={`url(#${gradientId}-clip)`}>
        <path d={area} fill={`url(#${gradientId}-gradient)`} />
        <path d={`M${pts}`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <defs>
        <linearGradient id={`${gradientId}-gradient`} x1="32" y1="1.33334" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${gradientId}-clip`}>
          <rect width="64" height="32" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
