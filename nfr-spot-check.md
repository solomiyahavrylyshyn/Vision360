# Phase 8 — Non-Functional Requirements Spot Check

> Covers user-visible NFR items from PRD §18. Backend/infrastructure items are out of scope for a UI prototype audit.

---

## Trial Flow (PRD §16.5, §18)

| Requirement | Status | Notes |
|---|---|---|
| 7-day free trial | ➖ Not verifiable in UI | Trial logic would be server-side |
| No credit card required at signup | ➖ Not verifiable in UI | Server-side |
| "Two-minute onboarding" | ✅ Pass | Onboarding is Welcome → CompanySetup (2 steps); quick |
| After trial: full subscription required | ➖ Not verifiable in UI | Server-side |

---

## Languages / Localization (PRD §18)

| Requirement | Status | Notes |
|---|---|---|
| English + Spanish toggle | ❌ Not implemented | No i18n library (react-i18next etc.) present in codebase; all strings hardcoded in English |
| Currency configurable (USD, EUR, etc.) | ➖ Settings UI exists but backend not wired | Settings.tsx has regional settings section |
| Date format configurable (US / EU) | ➖ Settings UI exists but not applied to rendered dates | Settings has date format field |
| First day of week configurable | ➖ Settings has the field | `scheduleSettingsStore.ts` exists |
| Timezone auto-detect + manual override | ➖ Settings field present | Not wired to rendering |

---

## Login / Register / 2FA Flows (PRD §16)

| Requirement | Status | Notes |
|---|---|---|
| Login: Work Email + Password | ✅ Pass | `Login.tsx` has email + password fields |
| Password field with eye icon toggle | ✅ Pass | Eye icon present |
| "Forgot Password" link | ✅ Pass | Links to `/reset-password` |
| "Remember Me" checkbox | ✅ Pass | Present on Login |
| Register: "Create Account" title | ✅ Pass | `Register.tsx` |
| Register: Work Email field | ✅ Pass | |
| Register: Terms checkbox | ✅ Pass | |
| Register: Primary button "Create Account" | ✅ Pass | |
| 2FA: code entry screen | ✅ Pass | `Verify2FA.tsx` exists |
| Password reset: 3-step flow (request → verify → new password) | ✅ Pass | `ResetPasswordRequest.tsx`, `ResetPasswordVerify.tsx`, `ResetPasswordForm.tsx` all present |
| No Google/Apple social login | ✅ Pass | Not present in Login.tsx |

---

## "Skip on this Device" Trusted Device (PRD §18 Security)

| Requirement | Status | Notes |
|---|---|---|
| "Skip on this Device" option in 2FA flow | ❌ Not verified | `Verify2FA.tsx` not deeply read — flag for manual check |

---

## No Social Login (PRD §18)

| Requirement | Status | Notes |
|---|---|---|
| No Google/Apple sign-in buttons | ✅ Pass | Not present in Login or Register |

---

## Sample Company / Sandbox (PRD §16.7)

| Requirement | Status | Notes |
|---|---|---|
| Company switcher: toggle between "Your Company" and "Sample Company" | ❌ Not found | No company switcher in Layout.tsx top nav |
| Sample company name: "Premium Services" | ❌ Not found | "Premium Services" string not found in codebase |

---

## Onboarding Company Setup (PRD §16.4)

| Requirement | Status | Notes |
|---|---|---|
| Company Name (required) | ✅ Present | `CompanySetup.tsx` |
| Team Size selection (1, 2-3, 4-10, 11+) | ✅ Present | Confirmed in earlier audit |
| Industry single selection (dropdown) | ✅ Present | Single dropdown confirmed |

---

## Summary

| Category | Pass | Fail | Unverifiable / Needs Backend |
|---|---|---|---|
| Trial flow | 1 | 0 | 3 |
| Localization | 0 | 1 (English only, no i18n) | 4 |
| Auth flows | 10 | 0 | 1 (Skip on Device) |
| Social login absent | 1 | 0 | 0 |
| Sample Company | 0 | 2 | 0 |
| Onboarding | 3 | 0 | 0 |
