# Module: Jobs (PRD §7)

## ✅ Passing

- Jobs is 4th item in left nav ✅
- Job list page header (entity name, filters, search, create button, kebab) ✅
- Job statuses: Scheduled (blue), In Progress (yellow), Completed (green) ✅ Colors match PRD
- No "Unscheduled" status ✅
- Job row kebab: Edit, Duplicate, Inactivate ✅ (no Delete)
- Inactivate Selected in SelectionBar ✅
- Export in kebab ✅
- Manage Duplicates in kebab ✅
- Job Type dropdown from jobTypesStore ✅
- One-off/Recurring toggle in CreateJob form ✅
- All required Create Job fields present: Customer, Job Title, Job Type, Service Address, Start Date, Start Time, Assigned To ✅
- No Tags field in Create Job form (correctly excluded, Pro only) ✅
- KPI values rounded (no decimals) ✅
- Customer Summary Header persists on Job detail page ✅
- Job KPI blocks: Total Price, Compensation, All Expenses, Profit Margin ✅

## ❌ Failing

**JB-01** — ✅ FIXED: Job detail tabs now match PRD §7.8 with correct 8 tabs: Details, Appointments, Checklist, Documents, Items, Labor, Expense, Finance.  
*File*: `JobDetail.tsx:151–157`

**JB-02** — ✅ FIXED: "Details" label is correct.  
*File*: `JobDetail.tsx:151`

**JB-03** — ✅ FIXED: "Expense" tab label is now singular per PRD §7.8.  
*File*: `JobDetail.tsx`

**JB-04** — ✅ FIXED: Removed extra "Estimate" and "Invoices" tabs.  
*File*: `JobDetail.tsx`

**JB-05** — "Inactivate Selected" is in SelectionBar but NOT in kebab menu. PRD §7.20 requires it in the kebab.

**JB-06** — Count format: "X records" instead of "(N)" e.g. "Jobs (12)". PRD §7.18 example.  
*File*: `Jobs.tsx:171`

**JB-07** — "Private Notes" field label in CreateJob form. PRD §2 (UI refinement task) calls this "Internal Notes".  
*File*: `CreateJob.tsx:262`

## ⚠️ Open Questions

- PRD §7.22 requires "Service Address" from customer's addresses — is this a dropdown of existing client addresses or free text? Verify in CreateJob form.
- PRD §7.5 lists "Job Basic Info" (One-off/Recurring) as Required. Confirm form validation enforces selection.
- Recurring job scheduler: verify "Never ends" checkbox exists in the recurring job section of CreateJob.
- PRD §7.21 Job Profile kebab: should include "Print Job, Create Invoice, Duplicate Job, Convert to Recurring, Inactivate". Verify all 5 exist.
