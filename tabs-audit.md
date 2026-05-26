# Phase 5 — Tab Structure Audit

> PRD is the source of truth. Each table compares PRD-specified tabs against actual implementation.
> **Legend**: ✅ Match | ❌ Missing | ➕ Extra (not in PRD) | ⚠️ Wrong label

---

## Client Detail (PRD §6.4)
**PRD tabs (in order):** Details, Properties, Jobs, Estimates, Invoices, Payments, Documents

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| 1 | Details | Details | ✅ |
| 2 | Properties | Properties | ✅ |
| 3 | Jobs | Jobs | ✅ |
| 4 | Estimates | Estimates | ✅ |
| 5 | Invoices | Invoices | ✅ |
| 6 | Payments | Payments | ✅ |
| 7 | Documents | Documents | ✅ |

**Extra tabs (defined in TabKey but hidden by default):** activity, equipment, service-agreements, appointments, purchase-orders — these are correctly hidden from Core users.

**Verdict: ✅ PASS** — all 7 PRD tabs present in correct order.

---

## Job Detail (PRD §7.8)
**PRD tabs (in order):** Details, Appointments, Checklist, Documents, Items, Labor, Expense, Finance

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| 1 | Details | Job Details | ⚠️ Label differs ("Job Details" vs "Details") |
| 2 | Appointments | — | ❌ Missing |
| 3 | Checklist | — | ❌ Missing |
| 4 | Documents | — | ❌ Missing |
| 5 | Items | Items | ✅ |
| 6 | Labor | — | ❌ Missing |
| 7 | Expense | Expenses | ⚠️ Label "Expenses" (plural) vs PRD "Expense" |
| 8 | Finance | — | ❌ Missing |
| — | — | Estimate | ➕ Extra |
| — | — | Invoices | ➕ Extra |

**Verdict: ❌ CRITICAL FAIL** — Only 2 of 8 PRD tabs implemented; 4 missing; 2 extra; 1 wrong label.

---

## Estimate Detail (PRD §9.3)
**PRD tabs (in order):** Details, Deposit (conditional on "Deposit Required" toggle), Notes, Activity

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| 1 | Details | Estimate Details | ⚠️ Label "Estimate Details" vs "Details" |
| 2 | Deposit (conditional) | Deposit | ✅ |
| 3 | Notes | — | ❌ Missing |
| 4 | Activity | Activity | ✅ |

**Deposit conditionality**: Deposit tab is always visible in implementation, not toggled by "Deposit Required" switch. ❌

**Verdict: ❌ FAIL** — Missing "Notes" tab; "Details" label differs; Deposit conditionality not enforced.

---

## Invoice Detail (PRD §10.4)
**PRD tabs (in order):** Details, Payments, Notes, Activity

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| 1 | Details | Invoice Details | ⚠️ Label "Invoice Details" vs "Details" |
| 2 | Payments | Payments | ✅ |
| 3 | Notes | — | ❌ Missing |
| 4 | Activity | Activity | ✅ |

**Verdict: ❌ FAIL** — Missing "Notes" tab; "Details" label differs.

---

## Homepage (PRD §5.2)
**PRD tabs (in order):** Dashboards, Reports

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| 1 | Dashboards | — | ❌ Missing (replaced by 3 different tabs) |
| 2 | Reports | Reports | ✅ |
| — | — | All Business | ➕ Extra |
| — | — | Sales Performance | ➕ Extra |
| — | — | Financial Performance | ➕ Extra |

**Verdict: ❌ FAIL** — The single "Dashboards" tab is split into 3 tabs; PRD-specified name "Dashboards" is absent.

---

## Items Module (PRD §8.3)
**PRD tabs (in order):** Price Book, Service, Material, Equipment, Assets, Fees

| # | PRD Tab | Impl. Tab | Status |
|---|---|---|---|
| — | — | All Items | ➕ Extra (not in PRD) |
| 1 | Price Book | Price Book | ✅ |
| 2 | Service | Services | ⚠️ Plural "Services" vs "Service" |
| 3 | Material | Materials | ⚠️ Plural "Materials" vs "Material" |
| 4 | Equipment | Equipment | ✅ |
| 5 | Assets | Asset | ⚠️ Singular "Asset" vs "Assets" |
| 6 | Fees | Fees | ✅ |

**Verdict: ❌ FAIL** — 3 tab labels differ from PRD spec; extra "All Items" tab; 3 labels need renaming.

---

## Settings (PRD §15.2)
**PRD accordion sections:** Business Management, System Preferences, Finance Center, Integrations

| # | PRD Section | Impl. Section | Status |
|---|---|---|---|
| 1 | Business Management | Business management | ✅ (case difference only) |
| 2 | System Preferences | System preferences | ✅ (case difference only) |
| 3 | Finance Center | Finance center | ✅ (case difference only) |
| 4 | Integrations | Integrations | ✅ |

**Additional finding**: Settings.tsx:3481 has a sub-section titled **"Schedule Board"** — should be **"Calendar"** per PRD §1.4.

**Verdict: ✅ PASS** (overall structure) with one inner label violation ("Schedule Board").

---

## Summary

| Module | PRD Tab Count | Impl. Tab Count | Missing | Extra | Wrong Labels | Verdict |
|---|---|---|---|---|---|---|
| Client Detail | 7 | 7 | 0 | 0 | 0 | ✅ Pass |
| Job Detail | 8 | 5 | 4 | 2 | 1 | ❌ Critical |
| Estimate Detail | 4 | 3 | 1 | 0 | 1 | ❌ Fail |
| Invoice Detail | 4 | 3 | 1 | 0 | 1 | ❌ Fail |
| Homepage | 2 | 4 | 1 | 3 | 1 | ❌ Fail |
| Items | 6 | 7 | 0 | 1 | 3 | ❌ Fail |
| Settings | 4 | 4 | 0 | 0 | 0 | ✅ Pass |
