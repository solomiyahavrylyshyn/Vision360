export type BrandTheme = {
  primary: string;
  accent: string;
};

export const BRAND_THEME_STORAGE_KEY = "vision360.brandTheme";
export const BRAND_LOGO_STORAGE_KEY = "vision360.brandLogo";
export const BRAND_LOGO_EVENT = "vision360:brand-logo-change";

export const DEFAULT_BRAND_THEME: BrandTheme = {
  primary: "#4A6FA5",
  accent: "#F97316",
};

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

export function getStoredBrandTheme(): BrandTheme {
  if (typeof window === "undefined") return DEFAULT_BRAND_THEME;

  try {
    const stored = window.localStorage.getItem(BRAND_THEME_STORAGE_KEY);
    if (!stored) return DEFAULT_BRAND_THEME;
    const parsed = JSON.parse(stored) as Partial<BrandTheme>;
    return {
      primary: normalizeHex(parsed.primary ?? "", DEFAULT_BRAND_THEME.primary),
      accent: normalizeHex(parsed.accent ?? "", DEFAULT_BRAND_THEME.accent),
    };
  } catch {
    return DEFAULT_BRAND_THEME;
  }
}

export function applyBrandTheme(theme: BrandTheme, persist = true) {
  if (typeof document === "undefined") return;

  const primary = normalizeHex(theme.primary, DEFAULT_BRAND_THEME.primary);
  const accent = normalizeHex(theme.accent, DEFAULT_BRAND_THEME.accent);
  const primaryHover = mix(primary, "#000000", 0.18);
  const primaryLight = mix(primary, "#FFFFFF", 0.88);
  const primaryBorder = mix(primary, "#FFFFFF", 0.62);
  const pageBg = mix(primary, "#FFFFFF", 0.94);
  const pageBgSoft = mix(primary, "#FFFFFF", 0.91);
  const sidebarBg = mix(primary, "#000000", 0.68);
  const sidebarActiveBg = mix(primary, "#000000", 0.32);
  const sidebarActiveText = mix(primary, "#FFFFFF", 0.72);

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
    .hover\\:bg-\\[\\#EBF0F8\\]:hover, .hover\\:bg-\\[\\#EBF2FC\\]:hover, .hover\\:bg-\\[\\#EEF3FA\\]:hover { background-color: var(--brand-primary-light) !important; }
    .text-\\[\\#4A6FA5\\] { color: var(--brand-primary) !important; }
    .text-\\[\\#81B4F3\\] { color: var(--brand-sidebar-active-text) !important; }
    .bg-\\[rgba\\(74\\2c 111\\2c 165\\2c 0\\.3\\)\\] { background-color: color-mix(in srgb, var(--brand-sidebar-active) 72%, white 0%) !important; }
    .hover\\:text-\\[\\#4A6FA5\\]:hover { color: var(--brand-primary) !important; }
    .hover\\:text-\\[\\#3d5a85\\]:hover, .hover\\:text-\\[\\#3D5F8F\\]:hover { color: var(--brand-primary-hover) !important; }
    .border-\\[\\#4A6FA5\\] { border-color: var(--brand-primary) !important; }
    [class~="border-[#4A6FA5]/40"] { border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important; }
    .hover\\:border-\\[\\#4A6FA5\\]:hover { border-color: var(--brand-primary) !important; }
    [class~="hover:border-[#4A6FA5]/40"]:hover { border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent) !important; }
    .border-\\[\\#C8D5E8\\], .border-\\[\\#BDD4F5\\] { border-color: var(--brand-primary-border) !important; }
    .ring-\\[\\#4A6FA5\\] { --tw-ring-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
    .focus\\:border-\\[\\#4A6FA5\\]:focus { border-color: var(--brand-primary) !important; }
    .focus\\:ring-\\[\\#4A6FA5\\]:focus { --tw-ring-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
    .accent-\\[\\#4A6FA5\\] { accent-color: var(--brand-primary) !important; }
    .bg-\\[\\#F97316\\] { background-color: var(--brand-accent) !important; }
    .text-\\[\\#F97316\\] { color: var(--brand-accent) !important; }
    .border-\\[\\#F97316\\] { border-color: var(--brand-accent) !important; }
    .hover\\:text-white:hover { color: #FFFFFF !important; }
  `;

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(BRAND_THEME_STORAGE_KEY, JSON.stringify({ primary, accent }));
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
