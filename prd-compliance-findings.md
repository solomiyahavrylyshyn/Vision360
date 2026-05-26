# PRD Compliance Findings — Vision360 MVP
**Audit Date**: 2026-05-26  
**PRD Version**: 1.9 (2026-05-25)  
**Auditor**: Claude (automated static analysis + code grep)  
**Scope**: All 18 PRD sections, cross-cutting rules, 12 modules

---

## 1. Executive Summary

| Category | Checks Run | Pass | Fail | Partial / Unverified |
|---|---|---|---|---|
| Cross-cutting (terminology, nav, counts, kebabs) | 51 | 30 | 14 | 7 |
| Tab structure (7 page types) | 31 | 9 | 16 | 6 |
| Status & color system | 20 | 11 | 7 | 2 |
| Form field validation | 28 | 16 | 5 | 7 |
| Module-specific requirements | ~80 | ~50 | ~20 | ~10 |
| Pro/Enterprise gating | 15 | 12 | 1 | 2 |
| NFR (user-visible) | 18 | 14 | 2 | 2 |
| **TOTAL** | **~243** | **~142** | **~65** | **~36** |

**Rough compliance**: ~58–65% of checked requirements pass. Core issues cluster in: left nav, tab completeness (Jobs), terminology consistency (Archive/Delete), client status system, count format, and form logic.

**Modules with highest compliance**: Settings, Calendar, Auth flows, Payments (list page)  
**Modules with most gaps**: Job Detail tabs, Client status system, Homepage tabs, Item tab labels

---

## 2. Critical Failures

> Issues that violate PRD-level invariants and likely appear across many screens at once.

### CRIT-01 — Left Navigation has 9 items instead of 5
**Severity**: critical  
**PRD §3.1**  
**Module**: Global / Layout  
**Repro**: Open any page, observe left sidebar  
**Expected**: Exactly 5 items — Home, Schedule, Clients, Jobs, Items  
**Actual**: 9 items — Home, Schedule, Clients, Jobs, Estimates, Invoices, Payments, Expenses, Items  
**Proposed fix**: Remove Estimates, Invoices, Payments, Expenses from `navItems` array in `Layout.tsx:12–21`. These are accessible via their own routes; access them from the "+" create button or client/job sub-tabs.  
**Touch points**: `src/app/components/Layout.tsx:12–21`

---

### CRIT-02 — "Archive" used in bulk-action confirmation modals (should be "Inactivate")
**Severity**: critical  
**PRD §1.4**  
**Module**: Estimates, Invoices  
**Repro**: Estimates list → select rows → click Inactivate → see modal. Same for Invoices.  
**Expected**: Modal title "Inactivate estimates?" / button "Inactivate"  
**Actual**: Modal title "Archive estimates?" / button "Archive" (Estimates.tsx:688, 695); "Archive invoices?" / "Archive" (Invoices.tsx:590, 600)  
**Proposed fix**: Replace "Archive" string with "Inactivate" in both modal components.  
**Touch points**: `src/app/pages/Estimates.tsx:688, 695` | `src/app/pages/Invoices.tsx:590, 600`

---

### CRIT-03 — "Delete" used as user-facing action label (should be "Inactivate") — non-Expense entities
**Severity**: critical  
**PRD §1.4, §1.5**  
**Module**: Estimates (row kebab), Items (categories modal), Settings, ClientDetail, DocumentPreview  
**Repro**: Estimates list → row kebab → "Delete". Items → category kebab → modal button "Delete".  
**Expected**: "Inactivate" for estimates. Settings-level items: "Inactivate" or "Remove".  
**Actual**: "Delete" at `EstimateDetail.tsx:1078`, `Items.tsx:1373`, `Settings.tsx:123, 1798`, `ClientDetail.tsx:914`, `DocumentPreview.tsx:233`  
**Note**: `Expenses.tsx:343` "Delete Expense" is **CORRECT** per PRD §12.9 — do not change.  
**Proposed fix**: Replace each "Delete" label with "Inactivate" (or appropriate term per context).  
**Touch points**: 5 files listed above

---

### CRIT-04 — Client status system missing 3 of 4 required statuses
**Severity**: critical  
**PRD §6.3**  
**Module**: Clients  
**Repro**: Clients list → observe Quick Filter "Status" dropdown (only Active / Inactive / All)  
**Expected**: 4 statuses: Prospect (blue/neutral), Active (green), On Hold (red), Archived (dark gray)  
**Actual**: Only Active / Inactive — no Prospect, no On Hold, no Archived  
**Proposed fix**: Add Prospect, On Hold, Archived as status values with appropriate badge colors; add automatic Prospect→Active transition trigger on first paid invoice.  
**Touch points**: `src/app/pages/Clients.tsx:40, 75, 580–582` | `src/app/pages/ClientDetail.tsx`

---

### CRIT-05 — Job detail tabs: 4 of 8 PRD-required tabs missing
**Severity**: critical  
**PRD §7.8**  
**Module**: Jobs  
**Repro**: Open any Job detail page, observe tabs  
**Expected**: Details, Appointments, Checklist, Documents, Items, Labor, Expense, Finance (8 tabs)  
**Actual**: Job Details, Estimate, Invoices, Items, Expenses (5 tabs; 4 missing, 2 extra)  
**Proposed fix**: Add Appointments, Checklist, Documents, Labor, Finance tabs; rename "Job Details"→"Details" and "Expenses"→"Expense"; remove or merge "Estimate" and "Invoices" tabs (their content belongs in Finance tab per PRD).  
**Touch points**: `src/app/pages/JobDetail.tsx:151–157`

---

## 3. High-Severity Gaps

### HIGH-01 — Count indicator format incorrect
**Severity**: high  
**PRD §1.2**  
**Module**: All list pages  
**Repro**: Visit Clients, Jobs, Estimates, etc. — observe header count  
**Expected**: "Clients (6)" — entity name + count in parentheses  
**Actual**: "Clients (6 records)" — extra word "records"  
**Proposed fix**: Change `countSuffix` default from `"records"` to `""` in `page-header.tsx:18`, or pass an empty suffix from each list page call.  
**Touch points**: `src/app/components/ui/page-header.tsx:18` + all pages that don't override `countSuffix`

---

### HIGH-02 — Create Client: "First Name OR Company Name" OR logic not enforced
**Severity**: high  
**PRD §6.5**  
**Module**: Client Create Form  
**Repro**: CreateClient form → attempt to fill only Company Name + Email + Phone → submit → fails because First Name is required  
**Expected**: At least one of (First Name, Company Name) is required  
**Actual**: Both First Name AND Last Name unconditionally required  
**Proposed fix**: Change validation so that either First Name OR Company Name satisfies the requirement; make Last Name truly optional.  
**Touch points**: `src/app/pages/CreateClient.tsx:201–207, 203`

---

### HIGH-03 — Homepage tab structure doesn't match PRD
**Severity**: high  
**PRD §5.2**  
**Module**: Homepage  
**Repro**: Navigate to Home — observe tabs  
**Expected**: 2 tabs — "Dashboards" and "Reports"  
**Actual**: 4 tabs — "All Business", "Sales Performance", "Financial Performance", "Reports"  
**Proposed fix**: Consolidate the 3 dashboard tabs into a single "Dashboards" tab; keep "Reports" tab.  
**Touch points**: `src/app/pages/Home.tsx:83`

---

### HIGH-04 — Estimate and Invoice detail pages missing "Notes" tab
**Severity**: high  
**PRD §9.3, §10.4**  
**Module**: Estimates, Invoices  
**Repro**: Open any Estimate → observe tabs; Open any Invoice → observe tabs  
**Expected**: Estimate tabs: Details, Deposit (conditional), Notes, Activity; Invoice tabs: Details, Payments, Notes, Activity  
**Actual**: Both missing "Notes" tab  
**Proposed fix**: Add "Notes" tab to both EstimateDetail and InvoiceDetail with content for Terms/Conditions, Footer Notes, Legal text.  
**Touch points**: `src/app/pages/EstimateDetail.tsx` | `src/app/pages/InvoiceDetail.tsx`

---

### HIGH-05 — Expense vendor field is free text + mislabeled "Merchant"
**Severity**: high  
**PRD §12.2**  
**Module**: Expenses  
**Repro**: Create Expense → observe "Merchant" field (free text input)  
**Expected**: "Vendor" dropdown selection from configured vendor list  
**Actual**: Free text `<input>` labeled "Merchant"  
**Proposed fix**: Replace `merchant` text input with a `<select>` or combobox fed from the vendors store (similar to counties dropdown); rename label from "Merchant" to "Vendor".  
**Touch points**: `src/app/pages/CreateExpense.tsx:62, 315–328`

---

### HIGH-06 — Invoice "Unpaid" status color is gray instead of red
**Severity**: high  
**PRD §10.3**  
**Module**: Invoices  
**Repro**: Create an invoice, leave it Unpaid — see gray/neutral badge  
**Expected**: Red badge for Unpaid  
**Actual**: `#546478` text / `#F3F4F6` bg (neutral gray)  
**Proposed fix**: Change `statusColors["Unpaid"]` to a red color scheme (e.g. `{ text: "#DC2626", bg: "#FEE2E2" }`).  
**Touch points**: `src/app/pages/InvoiceDetail.tsx:35`

---

### HIGH-07 — Items tabs: 3 of 6 labels wrong + 1 extra tab
**Severity**: high  
**PRD §8.3**  
**Module**: Items  
**Repro**: Navigate to Items — observe tabs  
**Expected**: Price Book, Service, Material, Equipment, Assets, Fees  
**Actual**: All Items (extra), Price Book, Services (wrong), Materials (wrong), Equipment, Asset (wrong), Fees  
**Proposed fix**: Rename "Services"→"Service", "Materials"→"Material", "Asset"→"Assets"; remove "All Items" tab or gate it behind a non-PRD label.  
**Touch points**: `src/app/pages/Items.tsx:506–513`

---

## 4. Medium-Severity Gaps

### MED-01 — "Inactivate Selected" missing from list-level kebab (is in SelectionBar only)
**Severity**: medium  
**PRD §2.1**  
**Applies to**: Clients, Jobs, Estimates, Invoices, Items  
**Expected**: "Inactivate Selected" in the kebab dropdown at list page level  
**Actual**: Present in SelectionBar (appears after rows are selected) but not pre-listed in kebab  
**Proposed fix**: Add "Inactivate Selected" to the kebab items array on each affected list page.

---

### MED-02 — Clients kebab uses "Merge Duplicates" instead of "Manage Duplicates"
**Severity**: medium  
**PRD §2.1**  
**Module**: Clients  
**Repro**: Clients list → kebab → "Merge Duplicates"  
**Expected**: "Manage Duplicates"  
**Actual**: "Merge Duplicates" (`Clients.tsx:655`)  
**Proposed fix**: Rename label to "Manage Duplicates".  
**Touch points**: `src/app/pages/Clients.tsx:655`

---

### MED-03 — Estimate "Draft" status color is purple, not gray
**Severity**: medium  
**PRD §9.5**  
**Module**: Estimates  
**Expected**: Gray badge for Draft status  
**Actual**: Purple text (#7C3AED) on light purple bg (#EDE9FE)  
**Proposed fix**: Change Draft color to gray e.g. `{ text: "#6B7280", bg: "#F3F4F6" }`.  
**Touch points**: `src/app/pages/EstimateDetail.tsx:46, 50`

---

### MED-04 — "Private Notes" label in CreateJob (should be "Internal Notes")
**Severity**: medium  
**PRD §2 / UI refinement task**  
**Module**: Jobs  
**Repro**: CreateJob → observe "Private Notes" section  
**Expected**: "Internal Notes"  
**Actual**: "Private Notes" (`CreateJob.tsx:262`)  
**Proposed fix**: Rename string "Private Notes" → "Internal Notes".  
**Touch points**: `src/app/pages/CreateJob.tsx:262`

---

### MED-05 — Invoice "Overdue" status named "Unpaid-Overdue" in code
**Severity**: medium  
**PRD §10.3**  
**Module**: Invoices  
**Expected**: Status value = "Overdue"  
**Actual**: `"Unpaid-Overdue"` used as enum value (`InvoiceDetail.tsx:10`)  
**Proposed fix**: Rename status to "Overdue" throughout.  
**Touch points**: `src/app/pages/InvoiceDetail.tsx:9–10, 36, 43, 122, 167`

---

### MED-06 — Create Client: Last Name required (PRD-optional)
**Severity**: medium  
**PRD §6.5**  
**Module**: Client Create Form  
**Expected**: Last Name is optional  
**Actual**: Last Name required unconditionally  
**Touch points**: `src/app/pages/CreateClient.tsx:203`

---

### MED-07 — Estimate "Deposit" tab always visible (should be conditional)
**Severity**: medium  
**PRD §9.3, §9.7**  
**Module**: Estimates  
**Expected**: Deposit tab only visible when "Deposit Required" toggle = ON  
**Actual**: Deposit tab always visible  
**Touch points**: `src/app/pages/EstimateDetail.tsx`

---

### MED-08 — "Schedule Board" label in Settings (should be "Calendar")
**Severity**: medium  
**PRD §1.4**  
**Module**: Settings  
**Expected**: "Calendar" settings section  
**Actual**: SectionCard title "Schedule Board" (`Settings.tsx:3481`)  
**Proposed fix**: Rename to "Calendar" or "Calendar Settings".  
**Touch points**: `src/app/pages/Settings.tsx:3481`

---

### MED-09 — Job detail tab "Expenses" should be "Expense" (singular)
**Severity**: medium  
**PRD §7.8**  
**Module**: Jobs  
**Proposed fix**: Rename "Expenses" → "Expense" in JobDetail tab list.

---

### MED-10 — Job detail tab "Job Details" should be "Details"
**Severity**: medium  
**PRD §7.8**  
**Module**: Jobs  
**Proposed fix**: Rename "Job Details" → "Details".  
**Touch points**: `src/app/pages/JobDetail.tsx:151`

---

## 5. Polish / a11y Items

### POL-01 — Back navigation uses "Back to Jobs" instead of "← Jobs"
**Severity**: low  
**PRD §2.5**  
Pattern says arrow + entity name. "Back to Jobs" has an extra preposition. Low visual impact, but diverges from spec.

---

### POL-02 — Estimate "Archived" status badge uses dark background / white text (very dark)
**Severity**: low  
**PRD §9.5**  
Archived = gray per PRD. Implementation uses `#1F2937` bg / white text — high-contrast dark treatment that doesn't match a "gray" badge.

---

### POL-03 — "Others" in Home.tsx chart series data
**Severity**: low  
**PRD §1.5**  
`Home.tsx:25` has a chart series named "Others". PRD bans "Others" as a category. This is chart series data, but should use a specific category name.

---

### POL-04 — Estimate "Details" tab labeled "Estimate Details"; Invoice "Details" labeled "Invoice Details"
**Severity**: low  
**PRD §9.3, §10.4**  
Both should simply read "Details".

---

## 6. Pro Features Not Visually Indicated

**PRD §17.3**: Pro-tier features visible in Core should use almond/beige color highlighting.

| Feature | Status |
|---|---|
| Pro tabs (Activity, Equipment, Service Agreements) hidden in DefaultTabs | ✅ Hidden — no visual indicator needed |
| Route to `/service-agreements` accessible directly | ⚠️ No gate |
| Route to `/appointments` accessible directly | ⚠️ No gate |
| Pro feature almond/beige color treatment | ❌ No almond/beige treatment anywhere in the build |

---

## 7. Open Questions / PRD Ambiguities

| ID | Question | PRD Reference |
|---|---|---|
| OQ-01 | PRD §6.11 QF Status lists "Active, Prospect, On Hold, Archived" — does "Inactive" in the code map to "Archived"? Need confirmation before renaming. | §6.3, §6.11 |
| OQ-02 | PRD §7.8 includes "Appointments" tab in Core. But §3.3 says "Appointments module — Moved to Pro/Enterprise." These contradict each other. Which is correct? | §7.8 vs §3.3 |
| OQ-03 | PRD §14.2 lists only 3 reports; §5.5 lists 13. Which is the definitive list? | §5.5 vs §14.2 |
| OQ-04 | PRD §17.2 Feature Matrix shows "Tags ✅ Core" but §7.27 says "Tags — Pro" for Jobs. Are Tags in Core for Clients only, and Pro for Jobs? | §6.2 vs §7.27 vs §17.2 |
| OQ-05 | Payments/Expenses kebab: PRD §11.9 and §12.9 list only Edit Columns, Import, Export. Implementation adds Manage Duplicates, Change Status. Is this intentional extension? | §11.9, §12.9 |
| OQ-06 | PRD §7.8 lists Appointments as a Job tab. Is this the Appointments module (removed in §3.3) or a sub-list of job appointments? | §7.8, §3.3, §7.9 |
| OQ-07 | `vision360-ui-refinement-task.md` not found in the repo — cannot check for conflicts with PRD. | Per audit instructions |
| OQ-08 | No `vision360-tab-audit-task.md` found — cannot cross-reference with prior tab QA work. | Per audit instructions |

---

## Appendix: Issue Index

| ID | Severity | Module | Short Description |
|---|---|---|---|
| CRIT-01 | critical | Global / Nav | Left nav has 9 items; PRD requires 5 |
| CRIT-02 | critical | Estimates, Invoices | "Archive" in bulk-action modals (should be "Inactivate") |
| CRIT-03 | critical | Estimates, Items, Settings, ClientDetail | "Delete" used as action label (non-Expense) |
| CRIT-04 | critical | Clients | Client status system: only Active/Inactive; missing Prospect, On Hold, Archived; no auto-transition |
| CRIT-05 | critical | Jobs | Job detail tabs: 4 of 8 missing; 2 extra; wrong labels |
| HIGH-01 | high | All lists | Count format "(N records)" instead of "(N)" |
| HIGH-02 | high | Client Create | First/Last Name OR logic missing; Last Name wrongly required |
| HIGH-03 | high | Homepage | 4 tabs instead of 2; "Dashboards" tab absent |
| HIGH-04 | high | Estimates, Invoices | "Notes" tab missing from both detail pages |
| HIGH-05 | high | Expenses | Vendor is free text + mislabeled "Merchant" |
| HIGH-06 | high | Invoices | "Unpaid" status color is gray (should be red) |
| HIGH-07 | high | Items | 3 tab labels wrong + extra "All Items" tab |
| MED-01 | medium | All lists | "Inactivate Selected" not in kebab (only in SelectionBar) |
| MED-02 | medium | Clients | "Merge Duplicates" should be "Manage Duplicates" |
| MED-03 | medium | Estimates | "Draft" status is purple (should be gray) |
| MED-04 | medium | Jobs | "Private Notes" label (should be "Internal Notes") |
| MED-05 | medium | Invoices | Status "Unpaid-Overdue" should be "Overdue" |
| MED-06 | medium | Clients | Last Name required (PRD-optional) |
| MED-07 | medium | Estimates | Deposit tab always visible (should be conditional) |
| MED-08 | medium | Settings | "Schedule Board" section (should be "Calendar") |
| MED-09 | medium | Jobs | Tab "Expenses" should be "Expense" |
| MED-10 | medium | Jobs | Tab "Job Details" should be "Details" |
| POL-01 | low | Global | Back nav "Back to Jobs" vs "← Jobs" |
| POL-02 | low | Estimates | "Archived" badge dark-bg treatment |
| POL-03 | low | Homepage | "Others" in chart series |
| POL-04 | low | Estimates, Invoices | Tab "Estimate Details" / "Invoice Details" should be "Details" |
| GATE-01 | low | Global | Pro almond/beige indicator not implemented |
| GATE-02 | low | Global | `/service-agreements` and `/appointments` routes ungated |
| NFR-01 | medium | Auth | "Skip on this Device" 2FA option unconfirmed |
| NFR-02 | medium | Onboarding | Sample Company / company switcher absent |
| NFR-03 | medium | i18n | No English/Spanish toggle; no i18n framework |

---

**STOP HERE. Do not fix anything until issues are reviewed and approved per Phase 10 protocol.**
