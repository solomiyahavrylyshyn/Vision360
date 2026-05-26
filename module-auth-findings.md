# Module: Authorization (PRD §16)

## ✅ Passing

- Registration page: "Create Account" title ✅
- Registration: Work Email field ✅
- Registration: Password field with eye toggle ✅
- Registration: Terms & Conditions checkbox ✅
- Registration: "Create Account" primary button ✅
- Registration: "Already have an account? Log in" secondary link ✅
- Login: Email + password ✅
- Login: Eye icon on password ✅
- Login: "Forgot Password" link ✅
- Login: "Remember Me" checkbox ✅
- Login: No Google/Apple social login buttons ✅
- Password reset: 3-step flow (Request → Verify → New Password) ✅
- 2FA: Code entry screen (`Verify2FA.tsx`) ✅
- Onboarding: Company Name (required), Team Size, Industry (single) ✅
- Two roles only: Admin / Employee ✅
- No custom role creation ✅
- Profile page and Logout in Account menu ✅

## ❌ Failing

**AU-01** — "Skip on this Device" trusted-device option: not confirmed present in `Verify2FA.tsx`. PRD §18 security section requires this option.  
*File*: `Verify2FA.tsx` — needs manual verification

**AU-02** — Sample Company / Company Switcher: PRD §16.7 requires a toggle between "Your Company" and "Sample Company" ("Premium Services"). No company switcher found in Layout.tsx or HelpCenter.  
*File*: Layout.tsx — feature absent

**AU-03** — "Premium Services" sample company name: string not found anywhere in codebase. PRD §16.7 and §5.6 specify this exact name.

## ⚠️ Open Questions

- PRD §16.6 Quick Start Guidance: after onboarding, show guided prompts for "Add First Customer" and "Create First Job". Present in Welcome.tsx or Home.tsx?
- PRD §16.4 Step 1: Email Verification screen with 6-digit code + "Resend" option. Does `Verify2FA.tsx` cover this or is it separate from 2FA?
- PRD §16.10 Team invitation form: First Name, Last Name, Email, Role, Pay Rate. Verify `NewUser.tsx` has all these.
