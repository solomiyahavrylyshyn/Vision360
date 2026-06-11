# Jobs module — pixel-perfect implementation plan (Figma ⇄ prototype)

Source: Figma page **"jobs"** (`node 358-28656`), audited frame-by-frame against the prototype on 2026-06-11.
Figma frames covered: main page (+ bulk / filter / edit columns / change status / row action / actions / empty state), inner page (details / estimates / invoices / items / expenses / empty states), create job (×3 recurrence variants), duplicate job.

**Already matching (no work):** list columns set & order (Number · Client · Address · Scheduled · Status · Total, sortable), quick filters (Status / Type / Date), Filter button with count badge, blue "Create job" + kebab placement, status badge colors (15% tint pills), stats card row (Scheduled / In progress / Completed / Revenue + sparklines), **inner page Details tab** (aligned to Figma earlier today), CreateJob's overall section structure.

---

## Phase 1 — Jobs list, quick wins (`src/app/pages/Jobs.tsx`)

1. **Number cell**: Figma shows the job number as a BLUE link-style first line (`10234-J01`, 14px/500) with the job title in dark below (14px/400). Prototype has the number grey/12px on top. Swap styles.
2. **Bulk bar**: Figma = `N selected` + **Change status** + **Download** + **X icon** to clear. Prototype has Cancel (destructive status change) + Change status + "Export selected" + text Cancel. → actions `[Change status, Download]`, `dismissAsIcon` (SelectionBar already supports it; same pattern shipped for Payments). Remove bulk "Cancel" action.
3. **Page kebab**: rename to Figma wording — `Edit columns / — / Upload / Download` (currently Import/Export). Keep existing handlers.
4. **Row kebab**: Figma order/casing — `Duplicate, Change status, — , Inactivate, Open in new tab` (separator ABOVE Inactivate; "Open in new tab" lowercase; Inactivate icon = circle-x → material `cancel`).
5. **Stats cards**: Figma card = value + label + area sparkline only (280×79). Drop the `sub="current"` line.
6. **Search field**: width ≈294px; placeholder per Figma is literally **"Search clients"** ⚠️ (see Open questions).
7. **Pagination row**: match Figma "Rows per page: 10 ⌄ · 1-10 of 50 · ‹ ›" format (verify current footer matches).

## Phase 2 — Jobs list, bigger pieces

8. **Edit columns modal**: Figma = 2-column grid of checkbox cards; **Number checked + locked**; optional extra columns **Job type, Job frequency, Assigned to**; footer **Cancel / Save** (currently single "Done").
   - Add the 3 optional columns to `JOBS_COLS` (hidden by default), plumb `jobType` / `jobFrequency` / `assignedTo` into the list row model (jobsStore has them; seed rows need the fields added).
9. **Advanced filter panel**: Figma field list (top→bottom): **Job type, Client, Job frequency, Assigned to, Country, State, City, Statuses** (all selects defaulting to "All"), divider, **Schedule date** (two date inputs), divider, **Total amount** (min/max), footer **Clear All / Apply**. Prototype panel today: jobType, client, city, schedule range, total range → add **Job frequency, Assigned to, Country, State, Statuses** selects and reorder to match.
10. **Change status modal**: Figma = radio CARDS list + Cancel/Save footer. Restyle the existing modal to radio cards. ⚠️ Status list conflict — see Open questions (implement with the current 5-status model, not the Figma 7).
11. **Empty state (0 records)**: Figma = circle icon + "No jobs yet" + "Create your first job to get started" + bordered "Create job" button. Show it when `allJobs.length === 0`; keep "No jobs found" for filtered-empty.

## Phase 3 — Inner page tabs (`src/app/pages/JobDetail.tsx`) — the largest block

The Details tab is done. The other four tabs are currently simplified cards; Figma specifies full toolbars + tables, visually identical to the corresponding list pages.

12. **Estimates tab**: toolbar (search, `Status: All`, `Date: All time`, Filter, blue **"Add estimate ▾"** split-button right) · table `[checkbox] Estimate (blue number + name) · Created by · Status badge · Amount · kebab` · pagination "Rows per page: 10 · 1-4 of 4" · bulk "N selected" state · row kebab: `Preview estimate, Send to client, Make invoice, Convert to job, Print, Change status, —, Duplicate, —, Archive, Open in new tab` · empty: "No estimates yet / Add an estimate to outline the scope and cost of this job".
13. **Invoices tab**: toolbar (search invoices, Status, Date, `Invoices: All`, Filter, blue **"Create invoice"**) · table `Number · Status · Date · Due date · Total · Balance (green $0 / red amount) · Note · kebab` · kebab: `Send to client, Change status, —, Duplicate, —, Void, Archive` · empty: "No invoices yet / Create an invoice to bill for this job". Needs per-job mock invoices (job 5 → several rows like Figma's 4).
14. **Items tab**: card "Products & Services" + blue **"Add Item"** top-right · table `Item (name+desc) · Quantity (editable input) · Unit price · Unit cost · Total · trash` · grey totals block `Subtotal / Taxable amount / Tax (7.5%) / Total`. Prototype column order differs (Qty→Cost→Price) and has no inputs/trash/totals block → rebuild to match.
15. **Expenses tab**: card "Expenses" + blue **"Create expense"** · table `Item · Description · Date · Total · trash` · table-footer row `Total: $551.70`. Prototype is close; add blue button, trash column, footer-row total.
16. **Shared tab empty-state component** (circle icon + title + subtitle + optional CTA) reused by all four tabs + documents.

## Phase 4 — Create job & Duplicate job (`src/app/pages/CreateJob.tsx`)

Structure already matches (sections exist). Pixel pass against Figma:

17. **Layout**: section label in a left rail ("Job overview", "Job period", "Estimates", "Line Items", "Job Notes", "Field Notes", "Internal Notes"), fields right; dividers between sections; page title "Create job" with back chevron.
18. **Job frequency**: two full-width RADIO CARDS (One-off / Recurring). Recurring reveals `Repeat every [1] [Month ⌄]` + `Day of month [5th ⌄]` (Month variant) / week-day variant per the second Figma frame.
19. **Fields & placeholders**: Job title* "e.g. AC Estimate" · Job type* "Select job type" · Client* "Select client" · Service address (disabled until client picked, "Service address") · Assigned to "Select assignee".
20. **Job period**: Job duration "e.g. 1" · **Schedule job toggle**; when ON show Start/End date* (date inputs with calendar icon) and Start/End time* (time inputs with clock icon).
21. **Estimates picker section**: search "Search estimates…" + blue "Add estimate"; table Estimate / Created by / Status / Amount + trash; footer "Total: $1140"; empty "No estimates added yet / Click "Add estimate" to select from catalog".
22. **Line Items\***: same pattern + totals block; empty "No items added yet / Click "Add Item" to select from catalog".
23. **Notes**: three textareas with placeholders "Notes visible on the job…", "Technician notes…", "Internal private notes…".
24. **Footer**: Cancel + **"Save job"** (disabled until required fields valid).
25. **Duplicate job**: Figma's frame is the SAME create form pre-filled (title still "Create job"). Change `Duplicate` in the list row kebab and JobDetail kebab to navigate to `/jobs/new?duplicateFrom=<id>` with all fields pre-filled, instead of cloning in place.

---

## ⚠️ Open questions (confirm with Valeria / Marek before building)

1. **Change-status options**: Figma modal lists *Unscheduled, Scheduled, Dispatched, In Progress, Completed, Cancelled, **Paused*** — but per the June decision the model has **5 workflow statuses**, "Paused" was removed and "Unscheduled" is a DERIVED state (no date), not a selectable status. The Figma frame predates that decision → Figma should be updated; implement with the current 5.
2. **"Search clients" placeholder** on the Jobs list (and the inner Estimates tab) — likely copy slip for "Search jobs…" / "Search estimates…"; confirm before changing.
3. **"Convert to job"** in the inner-page Estimates tab kebab — converting an estimate that already lives on a job into another job needs flow confirmation.

## Suggested order & size

| Phase | Scope | Size |
|---|---|---|
| 1 | List quick wins (items 1-7) | S — one pass over Jobs.tsx |
| 2 | Edit columns, filter panel, status modal, empty state (8-11) | M |
| 3 | Inner tabs rebuild (12-16) | L — the bulk of the work |
| 4 | Create/Duplicate job pixel pass (17-25) | M |

Phases are independent and can ship in any order; 1+2 give the most visible parity for Thursday's call.
