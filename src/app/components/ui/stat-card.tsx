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
  const trend = change ? (changeUp ? "up" : "down") : "";
  const description = `${label}: ${value}${sub ? ` (${sub})` : ""}${change ? `, ${trend} ${change} ${period}` : ""}`;

  return (
    <div
      className="flex h-[80px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
      style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
      aria-label={description}
      title={description}
    >
      <div className="flex min-w-0 flex-col justify-center">
        <div className="truncate text-[20px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "27px" }}>
          {value}
        </div>
        <div className="mt-0.5 truncate text-[14px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "20px" }}>
          {label}
        </div>
      </div>
      {data && data.length > 0 ? (
        <div className="shrink-0 opacity-90">
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
