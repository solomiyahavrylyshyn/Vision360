# Phase 4 — Field-Level Form Audit

> For each form: PRD-required fields vs form-required in code; PRD-optional vs form-optional.
> **Flags**: ❌ PRD-required but optional/missing in form | ⚠️ PRD-optional but required in form | ➕ Extra field not in PRD

---

## Create Client (PRD §6.5)

**File**: `CreateClient.tsx`

| Field | PRD Required | Form Required | Notes |
|---|---|---|---|
| First Name OR Company Name | ✅ Required (OR logic) | ❌ First Name AND Last Name both unconditionally required | OR logic not enforced — cannot create client with Company Name alone |
| Email | ✅ Required | ✅ Required (line 559) | ✅ |
| Phone (Primary) | ✅ Required | ✅ Required (line 490) | ✅ |
| Last Name | Optional | ❌ Required (line 203) | PRD-optional, form makes it mandatory |
| Company Name | Optional | Optional | ✅ |
| Phone (Secondary) | Optional | Optional | ✅ |
| Website | Optional | Optional | ✅ |
| Billing Address | Optional | Optional | ✅ |
| Notes | Optional | Optional | ✅ |
| Tags | Optional | Optional | ✅ |
| Custom Fields 1 & 2 | Optional | Optional | ✅ |

**Critical violations**:
1. "First Name OR Company Name" OR logic not implemented — both First + Last names are required fields
2. Last Name is PRD-optional but form-required

**Pro-only fields present in form**: None detected in rendered form (customerType defined in interface but not rendered) ✅

---

## Create Job (PRD §7.22)

**File**: `CreateJob.tsx`

| Field | PRD Required | Form Required | Notes |
|---|---|---|---|
| Customer | ✅ Required | ✅ Required | ✅ |
| Job Title | ✅ Required | ✅ Required | ✅ |
| Job Type | ✅ Required | ✅ Required (from jobTypesStore) | ✅ |
| Service Address | ✅ Required | ✅ Required | ✅ |
| Start Date | ✅ Required | ✅ Required | ✅ |
| Start Time | ✅ Required | ✅ Required | ✅ |
| Assigned To | ✅ Required | ✅ Required | ✅ |
| End Date | Optional | Optional | ✅ |
| End Time | Optional | Optional | ✅ |
| One-off/Recurring toggle | Optional | Optional | ✅ (present as toggle) |
| Notes | Optional | Optional | ✅ |
| Items | Optional | Optional | ✅ |

**Extra fields not in PRD**:
- "Field Notes" (➕) — acceptable additional field
- "**Private Notes**" (➕ AND terminology violation) — PRD §2 calls this "Internal Notes"; `CreateJob.tsx:262` renders label as "Private Notes"

**PRD-removed fields absent**: Tags ✅ (not in form — correctly excluded per §7.27)

---

## Create Item (PRD §8.16)

**File**: `ItemDetail.tsx` (create mode)

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| Item Type | ✅ Required | Not verified (form code not retrieved) | ❓ |
| Name | ✅ Required | Not verified | ❓ |
| Status | ✅ Required (defaults Active) | Not verified | ❓ |
| Retail Price | ✅ Required | Not verified | ❓ |
| Description | Optional | Not verified | ❓ |
| Sales Description | Optional | Not verified | ❓ |
| Additional Information | Optional | Not verified | ❓ |
| Cost | Optional | Not verified | ❓ |
| Category | Optional (dropdown) | Not verified | ❓ |
| Manufacturer | Optional (dropdown) | Not verified | ❓ |
| Tax Profile | Optional (dropdown) | Not verified | ❓ |
| Taxable | Optional | Not verified | ❓ |
| Vendor | Optional (dropdown) | Not verified (likely string field) | ❓ |
| Pictures | Optional | Not verified | ❓ |
| Notes | Optional | Not verified | ❓ |
| Custom Fields 1 & 2 | Optional | Not verified | ❓ |

> ItemDetail create-mode form code was not fully retrieved. Flag for manual review.

---

## Create Estimate (PRD §9.16)

**File**: `CreateEstimate.tsx`

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| Customer | ✅ Required | Not deeply verified | ❓ |
| Service Address | ✅ Required | Not deeply verified | ❓ |
| At Least One Item | ✅ Required | Not deeply verified | ❓ |
| Estimate Date | Optional (defaults today) | Not verified | ❓ |
| Expiration Date | Optional (defaults 30 days) | Not verified | ❓ |
| Estimate Notes | Optional | Not verified | ❓ |
| Deposit Required toggle | Optional | Not verified | ❓ |
| Template Selection | Optional | Not verified | ❓ |
| Pictures/Documents | Optional | Not verified | ❓ |

> `CreateEstimate.tsx` not deeply audited in this pass. Flag for manual review.

---

## Create Invoice (PRD §10.12)

**File**: `CreateInvoice.tsx`

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| Customer | ✅ Required | Not deeply verified | ❓ |
| At Least One Item | ✅ Required | Not deeply verified | ❓ |
| Invoice Date | ✅ Required (defaults today) | Not deeply verified | ❓ |
| Job | Optional | Not verified | ❓ |
| Estimate | Optional | Not verified | ❓ |
| Due Date | Optional | Not verified | ❓ |
| Invoice Notes | Optional | Not verified | ❓ |
| Service Address | Optional | Not verified | ❓ |

> `CreateInvoice.tsx` not deeply audited. Flag for manual review.

---

## Collect Payment (PRD §11.5)

**File**: `CreatePayment.tsx`

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| Payment Date | ✅ Required | Not deeply verified | ❓ |
| Customer | ✅ Required | Not deeply verified | ❓ |
| Invoice | ✅ Required | Not deeply verified | ❓ |
| Amount | ✅ Required | Not deeply verified | ❓ |
| Payment Method | ✅ Required (dropdown) | Not deeply verified | ❓ |
| Reference Number | Optional | Not verified | ❓ |
| Notes | Optional | Not verified | ❓ |

> `CreatePayment.tsx` not deeply audited. Flag for manual review.

---

## Create Expense (PRD §12.10)

**File**: `CreateExpense.tsx`

| Field | PRD Required | Form Required | Notes |
|---|---|---|---|
| Date | ✅ Required | ✅ Required | ✅ |
| Vendor | ✅ Required, **dropdown** | ❌ Free text, labeled **"Merchant"** (wrong name) | Double violation: wrong type + wrong label |
| Amount | ✅ Required | ✅ Required | ✅ |
| Category | ✅ Required, **dropdown** | ✅ `<select>` dropdown | ✅ |
| Assigned To (Job/Invoice) | Optional | Optional | ✅ |
| Invoice Number | Optional | Optional (line 415) | ✅ |
| Receipt | Optional | Optional | ✅ |
| Notes | Optional | Optional | ✅ |

**Violations**:
1. Vendor field is free text `<input>` (PRD requires dropdown)
2. Vendor field is labeled "Merchant" in the form (PRD uses "Vendor")

---

## User Invitation / Manage Team (PRD §16.10)

**File**: `NewUser.tsx` (accessible via `/settings/team/new`)

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| First Name | ✅ Required | Not verified | ❓ |
| Last Name | ✅ Required | Not verified | ❓ |
| Email | ✅ Required | Not verified | ❓ |
| Role (Admin/Employee) | ✅ Required | Not verified | ❓ |
| Pay Rate | Optional | Not verified | ❓ |

> `NewUser.tsx` not deeply audited. Flag for manual review.

---

## Company Setup / Onboarding (PRD §16.4)

**File**: `CompanySetup.tsx`

| Field | PRD Required | Form Status | Notes |
|---|---|---|---|
| Company Name | ✅ Required | Not deeply verified | ❓ |
| Team Size | ✅ (selection field) | Not verified | ❓ |
| Industry | ✅ Single selection, dropdown | Not verified | ❓ |

> `CompanySetup.tsx` not deeply audited. Flag for manual review.

---

## Summary of Confirmed Violations

| Form | Issue | Severity |
|---|---|---|
| Create Client | First Name AND Last Name both required; OR logic missing | Critical |
| Create Client | Last Name is PRD-optional but form-required | Medium |
| Create Job | "Private Notes" label (should be "Internal Notes") | Medium |
| Create Expense | Vendor is free-text `<input>` (should be dropdown) | High |
| Create Expense | Vendor labeled "Merchant" (should be "Vendor") | Medium |
