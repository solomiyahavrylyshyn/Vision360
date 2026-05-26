# Module: Settings (PRD §15)

## ✅ Passing

- 4 main accordion categories present: Business Management, System Preferences, Finance Center, Integrations ✅
- Accordion navigation (collapsible) ✅
- Company Info section present ✅
- Company Profile: Industry dropdown, branding colors, logo upload ✅
- Manage Team section present ✅
- Billing & Plan section present ✅
- Custom Fields configuration present ✅
- Regional Settings present (currency, date format, first day of week) ✅
- Tax Rates configuration section present ✅
- Tax Profiles configuration section present ✅
- Bank Information section present ✅
- Payment Methods section present ✅
- Integrations section: Stripe connection ✅
- No QuickBooks integration (correctly absent, Pro only) ✅
- Settings access: Admin vs Employee distinction in code ✅
- No custom roles (only Admin/Employee) ✅
- No terminology customization ("Rename Estimate to Quote" absent) ✅
- Vendors configuration section ✅
- Manufacturers configuration section ✅
- Item Categories configuration ✅

## ❌ Failing

**ST-01** — SectionCard title "Schedule Board" (`Settings.tsx:3481`). PRD §1.4 says use "Calendar", not "Schedule Board".

**ST-02** — "Delete" button/label present in Settings (`Settings.tsx:123, 1798`). Should use "Inactivate" per PRD §1.4.

## ⚠️ Open Questions

- PRD §15.5.2: Custom fields for 6 entities (Clients, Properties, Jobs, Estimates, Invoices, Team). Are all 6 present in Settings → System Preferences → Custom Fields?
- PRD §15.4.3: Manage Team — verify "Invite User" sends email with temporary password.
- PRD §15.6.5: Bank information fields (Bank Name, Account Number masked, Routing Number masked, Account Type dropdown). Verify masking of sensitive fields.
- PRD §15.8: Employee access restrictions — verify Settings is inaccessible for Employee role in UI.
