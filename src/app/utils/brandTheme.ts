export type BrandTheme = {
  primary: string;
  accent: string;
  /**
   * Navigation surface (sidebar). Optional on purpose: when it is left out the
   * sidebar is derived from `primary` exactly the way it always was, so the
   * Vision360 default and every theme saved before this field existed keep the
   * same look. Set it when the brand colour is too warm or too light to be
   * darkened into a navigation bar — an orange brand needs a neutral charcoal
   * sidebar, not a brown one.
   */
  sidebar?: string;
};

export type BrandPreset = {
  id: string;
  name: string;
  description: string;
  theme: BrandTheme;
};

export const BRAND_THEME_STORAGE_KEY = "vision360.brandTheme";
export const BRAND_LOGO_STORAGE_KEY = "vision360.brandLogo";
export const BRAND_LOGO_EVENT = "vision360:brand-logo-change";

export const DEFAULT_BRAND_THEME: BrandTheme = {
  primary: "#4A6FA5",
  accent: "#F97316",
};

/**
 * One-click palettes offered in Settings -> Company profile -> Brand assets.
 * AND Services is taken from andservices.com: the brand orange, a charcoal
 * navigation bar, and the same orange kept as the chart accent.
 */
export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "vision360",
    name: "Vision360",
    description: "Default blue",
    theme: DEFAULT_BRAND_THEME,
  },
  {
    id: "and-services",
    name: "AND Services",
    description: "Brand orange on charcoal",
    theme: { primary: "#E55135", accent: "#25252A", sidebar: "#25252A" },
  },
];

function normalizeHex(value: string, fallback: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function mix(hex: string, target: string, amount: number) {
  const baseRgb = hexToRgb(hex);
  const targetRgb = hexToRgb(target);
  return rgbToHex({
    r: baseRgb.r + (targetRgb.r - baseRgb.r) * amount,
    g: baseRgb.g + (targetRgb.g - baseRgb.g) * amount,
    b: baseRgb.b + (targetRgb.b - baseRgb.b) * amount,
  });
}

function deriveSidebarColor(primary: string) {
  return mix(primary, "#000000", 0.68);
}

/** The colour the navigation bar ends up with — the custom one, or the shade derived from the brand colour. */
export function getSidebarColor(theme: BrandTheme): string {
  const sidebar = theme.sidebar ? normalizeHex(theme.sidebar, "") : "";
  return sidebar || deriveSidebarColor(normalizeHex(theme.primary, DEFAULT_BRAND_THEME.primary));
}

export function getStoredBrandTheme(): BrandTheme {
  if (typeof window === "undefined") return DEFAULT_BRAND_THEME;

  try {
    const stored = window.localStorage.getItem(BRAND_THEME_STORAGE_KEY);
    if (!stored) return DEFAULT_BRAND_THEME;
    const parsed = JSON.parse(stored) as Partial<BrandTheme>;
    const sidebar = parsed.sidebar ? normalizeHex(parsed.sidebar, "") : "";
    return {
      primary: normalizeHex(parsed.primary ?? "", DEFAULT_BRAND_THEME.primary),
      accent: normalizeHex(parsed.accent ?? "", DEFAULT_BRAND_THEME.accent),
      ...(sidebar ? { sidebar } : {}),
    };
  } catch {
    return DEFAULT_BRAND_THEME;
  }
}

export function applyBrandTheme(theme: BrandTheme, persist = true) {
  if (typeof document === "undefined") return;

  const primary = normalizeHex(theme.primary, DEFAULT_BRAND_THEME.primary);
  const accent = normalizeHex(theme.accent, DEFAULT_BRAND_THEME.accent);
  const sidebarOverride = theme.sidebar ? normalizeHex(theme.sidebar, "") : "";
  const primaryHover = mix(primary, "#000000", 0.18);
  const primaryLight = mix(primary, "#FFFFFF", 0.88);
  // Selected rows and the active settings menu item sit on a fainter tint than
  // primaryLight — light enough to read as "current" without becoming a chip.
  const primarySubtle = mix(primary, "#FFFFFF", 0.94);
  const primaryBorder = mix(primary, "#FFFFFF", 0.62);
  const pageBg = mix(primary, "#FFFFFF", 0.94);
  const pageBgSoft = mix(primary, "#FFFFFF", 0.91);
  // With no sidebar colour of its own the navigation keeps the original
  // derived-from-primary shades; with one, the active row is tinted with the
  // brand colour so the selection still reads as branded on a neutral bar.
  const sidebarBg = sidebarOverride || deriveSidebarColor(primary);
  const sidebarActiveBg = sidebarOverride
    ? mix(sidebarOverride, primary, 0.34)
    : mix(primary, "#000000", 0.32);
  const sidebarActiveText = sidebarOverride
    ? mix(primary, "#FFFFFF", 0.55)
    : mix(primary, "#FFFFFF", 0.72);

  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--chart-1", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--sidebar", sidebarBg);
  root.style.setProperty("--sidebar-dark", sidebarBg);
  root.style.setProperty("--primary-light", primaryLight);
  root.style.setProperty("--primary-border", primaryBorder);
  root.style.setProperty("--background", pageBg);
  root.style.setProperty("--bg-grey-light", pageBg);
  root.style.setProperty("--bg-grey", pageBgSoft);
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-primary-hover", primaryHover);
  root.style.setProperty("--brand-primary-light", primaryLight);
  root.style.setProperty("--brand-primary-subtle", primarySubtle);
  root.style.setProperty("--brand-primary-border", primaryBorder);
  root.style.setProperty("--brand-page-bg", pageBg);
  root.style.setProperty("--brand-page-bg-soft", pageBgSoft);
  root.style.setProperty("--brand-accent", accent);
  root.style.setProperty("--brand-sidebar", sidebarBg);
  root.style.setProperty("--brand-sidebar-active", sidebarActiveBg);
  root.style.setProperty("--brand-sidebar-active-text", sidebarActiveText);

  let style = document.getElementById("vision360-brand-theme") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "vision360-brand-theme";
    document.head.appendChild(style);
  }

  style.textContent = `
    .bg-\\[\\#4A6FA5\\] { background-color: var(--brand-primary) !important; }
    [class~="bg-[#4A6FA5]/5"] { background-color: color-mix(in srgb, var(--brand-primary) 5%, transparent) !important; }
    [class~="bg-[#4A6FA5]/10"] { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
    [class~="bg-[#4A6FA5]/15"] { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
    .bg-\\[\\#1C2B3A\\] { background-color: var(--brand-sidebar) !important; }
    .bg-\\[\\#F5F7FA\\], .bg-\\[\\#F2F4F7\\], .bg-\\[\\#F8FAFC\\] { background-color: var(--brand-page-bg) !important; }
    .bg-\\[\\#EDF0F5\\], .bg-\\[\\#F0F2F5\\] { background-color: var(--brand-page-bg-soft) !important; }
    .hover\\:bg-\\[\\#4A6FA5\\]:hover { background-color: var(--brand-primary) !important; }
    .hover\\:bg-\\[\\#3d5a85\\]:hover, .hover\\:bg-\\[\\#3D5F8F\\]:hover { background-color: var(--brand-primary-hover) !important; }
    [class~="hover:bg-[#4A6FA5]/10"]:hover { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
    [class~="hover:bg-[#4A6FA5]/40"]:hover { background-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important; }
    .bg-\\[\\#EBF0F8\\], .bg-\\[\\#EBF2FC\\], .bg-\\[\\#EEF3FA\\] { background-color: var(--brand-primary-light) !important; }
    .bg-\\[\\#F0F4FB\\] { background-color: var(--brand-primary-subtle) !important; }
    [style*="background: rgb(240, 244, 251)"],
    [style*="background-color: rgb(240, 244, 251)"] { background-color: var(--brand-primary-subtle) !important; }
    .hover\\:bg-\\[\\#EBF0F8\\]:hover, .hover\\:bg-\\[\\#EBF2FC\\]:hover, .hover\\:bg-\\[\\#EEF3FA\\]:hover { background-color: var(--brand-primary-light) !important; }
    .text-\\[\\#4A6FA5\\] { color: var(--brand-primary) !important; }
    .text-\\[\\#81B4F3\\] { color: var(--brand-sidebar-active-text) !important; }
    .text-\\[\\#C8D5E8\\] { color: var(--brand-primary-border) !important; }
    .bg-\\[rgba\\(74\\2c 111\\2c 165\\2c 0\\.3\\)\\] { background-color: color-mix(in srgb, var(--brand-sidebar-active) 72%, white 0%) !important; }
    .hover\\:text-\\[\\#4A6FA5\\]:hover { color: var(--brand-primary) !important; }
    .hover\\:text-\\[\\#3d5a85\\]:hover, .hover\\:text-\\[\\#3D5F8F\\]:hover { color: var(--brand-primary-hover) !important; }
    .border-\\[\\#4A6FA5\\] { border-color: var(--brand-primary) !important; }
    [class~="border-[#4A6FA5]/40"] { border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important; }
    .hover\\:border-\\[\\#4A6FA5\\]:hover { border-color: var(--brand-primary) !important; }
    [class~="hover:border-[#4A6FA5]/40"]:hover { border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important; }
    .border-\\[\\#C8D5E8\\], .border-\\[\\#BDD4F5\\], .border-\\[\\#C5D5EC\\] { border-color: var(--brand-primary-border) !important; }
    .hover\\:border-\\[\\#C5D5EC\\]:hover { border-color: var(--brand-primary-border) !important; }
    .ring-\\[\\#4A6FA5\\] { --tw-ring-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
    .focus\\:border-\\[\\#4A6FA5\\]:focus { border-color: var(--brand-primary) !important; }
    .focus\\:ring-\\[\\#4A6FA5\\]:focus { --tw-ring-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
    .accent-\\[\\#4A6FA5\\] { accent-color: var(--brand-primary) !important; }
    .bg-\\[\\#F97316\\] { background-color: var(--brand-accent) !important; }
    .text-\\[\\#F97316\\] { color: var(--brand-accent) !important; }
    .border-\\[\\#F97316\\] { border-color: var(--brand-accent) !important; }
    .hover\\:text-white:hover { color: #FFFFFF !important; }
    /* Charts paint with SVG fill/stroke attributes rather than classes, so the
       class overrides above never reach them — without these the dashboard
       bars keep the old blue while their legend swatches turn brand-coloured. */
    /* Inline styles. Hundreds of elements set the stock blue straight on
       style={{...}} (dashboard tabs, schedule badges, status chips), which no
       class selector can reach. The browser serialises those to rgb(), so the
       attribute itself is the hook — an author !important rule outranks an
       inline declaration that has none. The :not() guards stop "color:" from
       matching inside "background-color:" / "border-color:". */
    [style*="background: rgb(74, 111, 165)"],
    [style*="background-color: rgb(74, 111, 165)"] { background-color: var(--brand-primary) !important; }
    [style*="color: rgb(74, 111, 165)"]:not([style*="background-color: rgb(74, 111, 165)"]):not([style*="border-color: rgb(74, 111, 165)"]) { color: var(--brand-primary) !important; }
    [style*="border-color: rgb(74, 111, 165)"] { border-color: var(--brand-primary) !important; }
    [style*="background: rgb(28, 43, 58)"],
    [style*="background-color: rgb(28, 43, 58)"] { background-color: var(--brand-sidebar) !important; }
    [style*="background: rgb(249, 115, 22)"],
    [style*="background-color: rgb(249, 115, 22)"] { background-color: var(--brand-accent) !important; }
    [style*="color: rgb(249, 115, 22)"]:not([style*="background-color: rgb(249, 115, 22)"]):not([style*="border-color: rgb(249, 115, 22)"]) { color: var(--brand-accent) !important; }
    [style*="background: rgba(74, 111, 165, 0.15)"],
    [style*="background-color: rgba(74, 111, 165, 0.15)"] { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
    [style*="background: rgba(74, 111, 165, 0.12)"],
    [style*="background-color: rgba(74, 111, 165, 0.12)"] { background-color: color-mix(in srgb, var(--brand-primary) 12%, transparent) !important; }
    [style*="background: rgb(235, 240, 248)"],
    [style*="background-color: rgb(235, 240, 248)"] { background-color: var(--brand-primary-light) !important; }
    [fill="#4A6FA5"] { fill: var(--brand-primary) !important; }
    [stroke="#4A6FA5"] { stroke: var(--brand-primary) !important; }
    [fill="#F97316"] { fill: var(--brand-accent) !important; }
    [stroke="#F97316"] { stroke: var(--brand-accent) !important; }
  `;

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(
      BRAND_THEME_STORAGE_KEY,
      JSON.stringify(sidebarOverride ? { primary, accent, sidebar: sidebarOverride } : { primary, accent }),
    );
  }
}

export function applyStoredBrandTheme() {
  applyBrandTheme(getStoredBrandTheme(), false);
}

export function getStoredBrandLogo() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(BRAND_LOGO_STORAGE_KEY) ?? "";
}

export function setBrandLogo(dataUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRAND_LOGO_STORAGE_KEY, dataUrl);
  window.dispatchEvent(new CustomEvent(BRAND_LOGO_EVENT, { detail: dataUrl }));
}

export function resetBrandLogo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BRAND_LOGO_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(BRAND_LOGO_EVENT, { detail: "" }));
}

export function resetBrandTheme() {
  applyBrandTheme(DEFAULT_BRAND_THEME);
}
