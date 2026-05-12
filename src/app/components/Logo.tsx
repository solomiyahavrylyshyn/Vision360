import * as React from "react";

type LogoProps = {
  height?: number;
  withSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
};

/**
 * Vision360 logo (light version for dark backgrounds).
 *
 * All original black elements (wordmark, subtitle, eye fill) are rendered white;
 * the cyan glow / iris colour of the brand is preserved.
 */
export function Logo({
  height = 56,
  withSubtitle = true,
  iconOnly = false,
  className,
}: LogoProps) {
  const ACCENT = "#5EEAD4";
  const ACCENT_GLOW = "#2DD4BF";

  const viewBox = iconOnly
    ? "0 0 56 56"
    : withSubtitle
      ? "0 0 320 76"
      : "0 0 320 60";

  return (
    <svg
      viewBox={viewBox}
      height={height}
      width="auto"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vision360 Field Service Platform"
    >
      <defs>
        <filter id="v360-glow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="v360-iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="60%" stopColor={ACCENT} />
          <stop offset="100%" stopColor={ACCENT_GLOW} />
        </radialGradient>
      </defs>

      {/* ── Eye icon ── */}
      <g transform={iconOnly ? "translate(2, 2)" : "translate(2, 6)"} filter="url(#v360-glow)">
        {/* outer almond shape — body is white (was black in source) */}
        <path
          d="M2 26 C 12 8, 36 8, 50 26 C 36 44, 12 44, 2 26 Z"
          fill="#FFFFFF"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* iris ring (cyan accent kept) */}
        <circle cx="26" cy="26" r="11" fill="url(#v360-iris)" stroke={ACCENT} strokeWidth="1.5" />
        {/* inner highlight */}
        <circle cx="26" cy="26" r="5" fill="#FFFFFF" opacity="0.95" />
        <circle cx="26" cy="26" r="2.5" fill={ACCENT} />
        {/* specular highlight */}
        <circle cx="23.5" cy="23.5" r="1.4" fill="#FFFFFF" />
      </g>

      {/* ── Wordmark ── */}
      {!iconOnly && <>
      <text
        x="66"
        y="36"
        fill="#FFFFFF"
        fontFamily="Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
        fontSize="26"
        fontWeight="900"
        letterSpacing="1.5"
      >
        VISION360
      </text>

      {/* ── Subtitle ── */}
      {withSubtitle && (
        <text
          x="66"
          y="56"
          fill="#FFFFFF"
          opacity="0.78"
          fontFamily="Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
          fontSize="10"
          fontWeight="600"
          letterSpacing="2.4"
        >
          FIELD SERVICE PLATFORM
        </text>
      )}
      </>}
    </svg>
  );
}
