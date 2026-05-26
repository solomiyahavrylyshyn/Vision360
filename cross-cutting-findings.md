# Phase 2 — Cross-Cutting Compliance Findings

> **Legend**: ✅ Pass | ❌ Fail | ⚠️ Partial | ➖ N/A

---

## Terminology (PRD §1.4)

| Rule | Status | Locations |
|---|---|---|
| No "Archive" in user-facing strings | ❌ **Fail** | `Estimates.tsx:688` ("Archive estimates?"), `Estimates.tsx:695` ("Archive"), `Invoices.tsx:590` ("Archive invoices?"), `Invoices.tsx:600` ("Archive") |
| No "Deactivate" in user-facing strings | ✅ Pass | Not found |
| No "Delete" in user-facing strings (except Expenses — PRD §12.9 explicitly allows) | ❌ **Fail** | `EstimateDetail.tsx:1078` (kebab "Delete"), `DocumentPreview.tsx:233` (button "Delete"), `Items.tsx:1373` (modal "Delete" for categories/brands/catalogs), `Settings.tsx:123` ("Delete"), `Settings.tsx:1798` (button "Delete"), `ClientDetail.tsx:914` (button "Delete") |
| No "Files" / "Attachments" as section labels | ✅ Pass | Not found in user-facing strings |
| No "Dispatch Board" | ✅ Pass | Only in a code comment (`Calendar.tsx:80`), not user-facing |
| No "Schedule Board" | ❌ **Fail** | `Settings.tsx:3481` — SectionCard title: "Schedule Board" (should be "Calendar" settings) |
| No "Others" category | ⚠️ Partial | `Home.tsx:25` — chart series named "Others" (data series, not an item type tab — low severity). Items tabs do NOT have an "Others" tab ✅ |
| "Private Notes" → "Internal Notes" | ❌ **Fail** | `CreateJob.tsx:262` — UI label renders "Private Notes" as visible field title |

---

## No-Delete Rule (PRD §1.5, §6.15, §7.25, §8.22)

| Check | Status | Details |
|---|---|---|
| Clients: no permanent Delete | ✅ Pass | Clients only have Activate/Inactivate kebab actions |
| Jobs: no permanent Delete | ✅ Pass | Jobs row kebab uses "Inactivate" |
| Items: no permanent Delete | ⚠️ Partial | Items themselves use "Inactivate" ✅; but **categories/brands/catalogs** modal uses "Delete" (`Items.tsx:1373`) ❌ |
| Estimates: no permanent Delete | ❌ **Fail** | Row kebab uses "Delete" (`Estimates.tsx:537`) instead of "Inactivate" |
| Invoices: no permanent Delete | ✅ Pass | Row kebab uses "Void" (correct for invoices) |
| Payments: no permanent Delete | ✅ Pass | Row kebab uses "Refund" (context-appropriate) |
| Expenses: Delete OK | ✅ Pass | PRD §12.9 explicitly lists "Delete Expense ✅" |
| Bulk-action toolbar has no "Delete Selected" | ✅ Pass | All pages use "Inactivate selected" in SelectionBar |

---

## Dropdowns Where Required (PRD §2.6, §6.12, §8.10, §12.2)

| Field | Status | Details |
|---|---|---|
| County → always dropdown | ✅ Pass | `Clients.tsx:548–552` uses `<select>` fed from `countiesStore` |
| Vendor → always dropdown | ❌ **Fail** | `CreateExpense.tsx:62,326` — "Merchant" (misnamed "Vendor") is a plain `<input type="text">`. **Also mislabeled "Merchant" not "Vendor"** |
| Manufacturer → dropdown | ❓ | Not verified in `ItemDetail.tsx` form (form section not accessible in available code) |
| Item Category → dropdown | ✅ Pass | `CreateExpense.tsx:340` `<select>` for category; Items form appears to use select |
| Job Type → dropdown | ✅ Pass | `CreateJob.tsx` uses dropdown from `jobTypesStore` |
| Tax Profile → dropdown | ✅ Pass | Implemented via dropdown selection in Items |
| Relationship → dropdown | ➖ | Additional Contact relationship field not verified |

---

## Count Indicators (PRD §1.2)

| Check | Status | Details |
|---|---|---|
| Format "Entity (N)" e.g. "Clients (6)" | ❌ **Fail** | `page-header.tsx:29` renders `(${count} ${countSuffix})` with `countSuffix="records"` → outputs "Clients (6 records)" not "Clients (6)" |
| Count reflects actual visible/filtered records | ✅ Pass | Counts use `filtered.length` |

---

## No "Others" Category (PRD §1.5, §8.2)

| Check | Status | Details |
|---|---|---|
| Items tabs exclude "Others" | ✅ Pass | Items.tsx tabs: Price Book, Services, Materials, Equipment, Asset, Fees — no "Others" |
| "Other" (singular, expense category) is allowed | ✅ Pass | `CreateExpense.tsx` expense categories include "Other" (singular) — PRD §12.3 permits this |

---

## Standard Record List Page Header (PRD §2.1)

| Page | Entity+Count | 3 Quick Filters | Adv. Filter | Search | Create Button | Kebab | Status |
|---|---|---|---|---|---|---|---|
| Clients | ✅ | ✅ (Status, Date, Balance) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Jobs | ✅ | ⚠️ (Status + Adv. filter, only 2 visible QFs not 3) | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Estimates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invoices | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Items | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Standard Kebab Menu Actions (PRD §2.1)

Required actions per list-level kebab: **Edit Columns, Import, Export, Manage Duplicates, Inactivate Selected**

| Page | Edit Columns | Import | Export | Manage Duplicates | Inactivate Selected | Notes |
|---|---|---|---|---|---|---|
| Clients | ✅ | ✅ | ✅ | ❌ "Merge Duplicates" | ❌ (in SelectionBar only, not kebab) | Two violations |
| Jobs | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | Missing in kebab |
| Estimates | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | Missing in kebab |
| Invoices | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | Missing in kebab |
| Payments | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | PRD §11.9 omits Inactivate Selected — may be intentional |
| Expenses | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | PRD §12.9 omits Inactivate Selected — may be intentional |
| Items | ✅ | ✅ | ✅ | ✅ | ❌ (in SelectionBar only) | Missing in kebab |

> **Note on Payments/Expenses**: PRD §11.9 and §12.9 only list Edit Columns, Import, Export in the kebab — "Manage Duplicates" and "Inactivate Selected" are NOT listed. The implementation adding them is extra, not required. The missing "Inactivate Selected" from the kebab itself affects Clients, Jobs, Estimates, Invoices, Items.

---

## Financial Display Colors (PRD §2.4)

| Metric | PRD Color | Actual | Status |
|---|---|---|---|
| Total Revenue | Green | `#16A34A` green ✅ | ✅ Pass |
| Past Due | Red when > 0 | `#EF4444` red ✅ | ✅ Pass |
| Balance | Neutral | Neutral ✅ | ✅ Pass |

---

## Address Standards (PRD §2.6)

| Check | Status | Details |
|---|---|---|
| State as 2-letter abbreviation | ✅ Pass | USPS abbrev used throughout |
| Auto-populate city/state/zip | ➖ | Google Places API not wired (mock data) |

---

## Navigation Structure (PRD §3.1, §3.2)

| Check | Status | Details |
|---|---|---|
| Left nav exactly 5 items: Home, Schedule, Clients, Jobs, Items | ❌ **CRITICAL** | `Layout.tsx:12–21` has **9 items**: Home, Schedule, Clients, Jobs, **Estimates, Invoices, Payments, Expenses**, Items |
| Reports NOT in left nav | ✅ Pass | Reports only accessible via `/reports` route, not in sidebar |
| Top nav order: Logo → Search → "+" Create → Bell → Help → Settings → Account | ✅ Pass | Confirmed in `Layout.tsx` |
| "+" Create button comes before Bell | ✅ Pass | Confirmed |

---

## Section-Specific Edit Pencils (PRD §2.7)

| Check | Status | Details |
|---|---|---|
| Each editable section has its own pencil icon | ✅ Pass | Detail pages use section-level edit pencils (observed in ClientDetail, JobDetail) |

---

## Back Navigation (PRD §2.5)

| Check | Status | Details |
|---|---|---|
| Pattern: `← Jobs` (arrow + entity name only) | ⚠️ Partial | Code uses "Back to Jobs" with `arrow_back` icon — includes "Back to" prefix not in PRD pattern. Functionally correct but label differs. |

---

## KPI Block Styling (PRD §1.3, §5.3, §7.4)

| Check | Status | Details |
|---|---|---|
| No decimal numbers in KPI values | ✅ Pass | `Math.round()` + `maximumFractionDigits: 0` used throughout |
| Compact height (not oversized) | ✅ Pass | Compact KPI styling observed |
| Consistent height across pages | ✅ Pass | Same compact style used across Home, Client, Job pages |

---

## Summary

| Category | Pass | Fail | Partial/Unclear |
|---|---|---|---|
| Terminology | 4 | 4 | 1 |
| No-Delete Rule | 5 | 2 | 1 |
| Required Dropdowns | 3 | 1 | 2 |
| Count Indicators | 1 | 1 | 0 |
| List Page Header | 6 | 0 | 1 |
| Kebab Menu Actions | 3 | 5 | 2 |
| Financial Colors | 3 | 0 | 0 |
| Navigation Structure | 2 | 1 | 0 |
| KPI Styling | 3 | 0 | 0 |
| **TOTAL** | **30** | **14** | **7** |
