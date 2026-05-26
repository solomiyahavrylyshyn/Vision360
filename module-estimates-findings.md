# Module: Estimates (PRD §9)

## ✅ Passing

- Estimates list page header layout ✅
- Quick filters: Status, Date Created, Amount Range ✅
- Estimate statuses: Sent (blue), Viewed (yellow), Approved (green), Rejected (red), Expired (gray) — colors match PRD for these 5 ✅
- Estimate total visible in top-right area of detail page ✅
- Status badge visible next to total ✅
- Deposit tab present ✅
- Activity tab present ✅
- List kebab: Edit Columns, Manage Duplicates, Import, Export ✅
- Inactivate Selected in SelectionBar ✅
- "Inactivate" in row kebab for estimates — wait, see failures

## ❌ Failing

**ES-01** — "Notes" tab missing from Estimate detail. PRD §9.3 specifies 4 tabs: Details, Deposit (conditional), Notes, Activity. Implementation has 3 (Details, Deposit, Activity).  
*File*: `EstimateDetail.tsx:150–155`

**ES-02** — "Deposit" tab should only be visible when "Deposit Required" toggle = ON (PRD §9.7). Current implementation shows Deposit tab always.  
*File*: `EstimateDetail.tsx`

**ES-03** — "Details" tab labeled "Estimate Details" — should be "Details" per PRD §9.3.  
*File*: `EstimateDetail.tsx`

**ES-04** — Estimate status "Draft" is **purple** (#7C3AED) — PRD §9.5 says Draft = Gray.  
*File*: `EstimateDetail.tsx:46, 50`

**ES-05** — Estimate row kebab uses "**Delete**" (`Estimates.tsx:537`) instead of "Inactivate". PRD §9.15 record-level kebab says "Inactivate ✅".

**ES-06** — Bulk confirm modal says "**Archive** estimates?" and button says "**Archive**" (`Estimates.tsx:688, 695`). Should say "Inactivate".

**ES-07** — "Inactivate Selected" is in SelectionBar but NOT in the kebab menu. PRD §9.15 requires it in the kebab.

**ES-08** — Count format: "X records" instead of "(N)" e.g. "Estimates (15)".

**ES-09** — No auto-expire after 30 days. PRD §9.5 says "Expired: Automatic after 30 days (configurable)". No timer logic in frontend.

## ⚠️ Open Questions

- PRD §9.9 specifies 3–4 pre-built estimate templates with a dropdown during creation. Does CreateEstimate have a template selector?
- PRD §9.2 says "Estimate total always visible in top right, even when items overflow/scroll." Verify this on long estimates.
- PRD §9.10 specifies a Pictures/Documents gallery section in the Details tab. Is this present?
