import * as React from "react";

type LogoProps = {
  height?: number;
  withSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
};

/**
 * Vision360 logo — simplified white-text version for the dark sidebar.
 * Eye keeps the brand's cyan/teal accent; wordmark and subtitle render in white.
 */
export function Logo({
  height = 56,
  withSubtitle = true,
  iconOnly = false,
  className,
}: LogoProps) {
  const CYAN = "#5EEAD4";
  const DARK = "#1C2B3A";

  const viewBox = iconOnly
    ? "0 0 60 60"
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
      {/* ── Eye icon ── */}
      <g transform={iconOnly ? "translate(4, 12)" : "translate(0, 10)"}>
        {/* Outer cyan almond */}
        <path
          d="M2 26 C 12 8, 40 8, 50 26 C 40 44, 12 44, 2 26 Z"
          fill={CYAN}
        />
        {/* Inner pupil — darker almond echoing the outer shape */}
        <ellipse cx="26" cy="26" rx="7" ry="13" fill={DARK} />
      </g>

      {/* ── Wordmark + subtitle (skip when icon-only) ── */}
      {!iconOnly && (
        <>
          <text
            x="64"
            y="36"
            fill="#FFFFFF"
            fontFamily="Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
            fontSize="26"
            fontWeight="900"
            letterSpacing="1.5"
          >
            VISION360
          </text>
          {withSubtitle && (
            <text
              x="64"
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
        </>
      )}
    </svg>
  );
}
