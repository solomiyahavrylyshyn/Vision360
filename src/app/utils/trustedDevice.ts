// FR-1.3 — 2FA "Trust this device for 30 days": a trusted browser skips the
// login code screen until the flag expires. Prototype-local (localStorage);
// real impl would pair a server-issued device token.
const KEY = "vision360.trustedDevice";
const TRUST_DAYS = 30;

export function isDeviceTrusted(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const expires = new Date(raw).getTime();
    if (Number.isNaN(expires) || expires < Date.now()) {
      localStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function trustDevice() {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + TRUST_DAYS);
    localStorage.setItem(KEY, expires.toISOString());
  } catch {
    /* storage unavailable (private mode) — 2FA will simply re-ask */
  }
}
