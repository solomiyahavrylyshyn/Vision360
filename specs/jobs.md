# Jobs module — spec (reconstruction in progress)

> Status: DRAFT (inventory + confirmed rules). Precedence: **product owner > Figma > prototype**.
> Create Job is specified in [schedule.md](schedule.md#create-job-modal--jobsnew-page)
> (shared modal/page) — not repeated here.

## Purpose / users
Manage the lifecycle of work orders ("jobs") — list, detail, status, and the documents
/ money artifacts attached to a job. Users: dispatcher, technician (field notes),
owner/admin. Jobs and appointments are **unified** in MVP (one status set).

Routes (`src/app/routes.tsx`): `/jobs` (list), `/jobs/:id` (detail), `/jobs/new` (create).
Files: `Jobs.tsx`, `JobDetail.tsx`, `CreateJob.tsx`, `stores/jobsStore.ts`,
`constants/jobStatuses.ts`.

## Statuses (single source of truth — `jobStatuses.ts`)
SEVEN workflow statuses (2026-06 client spec, Part 2 "final list — 7"):
**Unscheduled, Scheduled, Dispatched, In Progress, Paused, Completed, Cancelled.**
- Status is **separate** from the derived chips: a job's DATE and ASSIGNEE are independent,
  so *unscheduled* (no date) and *unassigned* (no technician) remain derived predicates
  shown as chips (see schedule.md). The **Unscheduled status** and the **unscheduled chip**
  can coexist (a no-date recurring job carries both).
- `Paused` keeps date + assignee (time-clock state) → stays ON the board, never Pending.
- `Completed` is not draggable (board rule).
- **Cancelled (PO decision):** a cancelled job **stays visible on the board** and you can
  **schedule another job over its slot** — i.e. a cancelled job never blocks a time slot.
  No hard delete; cancel is the terminal removal. *(Overrides the current code, which hides
  Cancelled from the board — see schedule.md GAP.)*
- Each status has a color/bg token (`JOB_STATUS_STYLES`).
- **Allowed transitions (PO decision): ANY → ANY.** Status is changed manually with no
  matrix/guard; any of the 7 can be set from the list or detail dropdown.

## Screen: Jobs list (`/jobs`)
- **KPI stat cards** (4): Scheduled (count), In progress (count), Completed (count), Revenue ($).
- **Columns** (draggable order, toggleable via "Edit columns"): Number, Client, Address,
  Scheduled (date), Status, Total. Sortable: Number, Client, Scheduled, Status, Total.
- **Quick filters**: Status (All + 7), Type (All / One-off / Recurring), Date range
  (all_time + presets).
- **Search**, **pagination**.
- **Row click** → Job detail.
- **Selection / bulk bar**: Cancel, Change status, Export selected.
- **List kebab**: Edit columns, Import, Export.
- **States**: empty (no jobs), filled, selection-active. (Loading/error: define — mock store
  is synchronous.)

## Screen: Job detail (`/jobs/:id`)
Header: job title + `(jobNumber)` + **status pill** (dropdown to change status). Back link.

**Tabs** (`DetailTabs`, hideable/reorderable via the tab settings button — `visibleTabs`):
**Details · Estimates · Invoices · Items · Expenses.**

- **Details tab**
  - **Job overview** card (editable): client, address, type/category, assignee, etc.
  - **Schedule** card (editable): date/time.
  - **Notes panel** — segmented sub-tabs **Job / Field / Internal**, each with a count and
    an add-note action; empty state per sub-tab ("No <type> notes yet"). **Visibility (PO):**
    *Job* = general (all), *Field* = technicians, *Internal* = office/admin only.
  - **Documents / attachments** — upload; list columns Name / Date / Type / Size / Uploaded by;
    preview with prev/next navigation; delete; select.
- **Cross-module create** (actions on the job — **all three confirmed in MVP**):
  **Create estimate**, **Create invoice**, **Add expense** (+ Add line item) — spawn the
  related record **linked to this job**, prefilled with client, address, and line items.
- **Estimates / Invoices / Items / Expenses tabs**: lists of the linked records.

## Data shape (`JobRecord`, `jobsStore.ts`)
`id, jobNumber, title, client, clientId, address, city, state, zip, gateCode, assignedTo,
jobType, jobCategory, startDate, endDate, startTime, endTime, status, totalPrice, notes,
fieldNotes, privateNotes, taxRate, estimateId?, estimateNumber?, createdAt`.
- localStorage-backed (`vision360.jobs.v1`); seeded for client 10245 (John Smith).
- Single estimate link (`estimateId` / `estimateNumber`).
- `status` typed as **`string`**, not the `JobStatus` union → drift risk.

## GAP TABLE
| Area | Design / decision says | Prototype currently does | Severity |
|---|---|---|---|
| Cancelled on board | Cancelled job **stays on board** and is schedulable over (never blocks a slot) | ✅ **Resolved.** `isShownOnBoard` now true for all statuses (cancelled renders greyed + struck-through); a new `occupiesSlot()` (false for Cancelled) drives `hasTimeConflict` / `weekHasConflict` / `boardCheckConflict`, so you can schedule over it. Cancelled is also kept off the dispatch map. | — (done) |
| Status transitions | ANY → ANY, manual, no matrix | Same (free dropdown) | — (OK) |
| Notes field naming | "Internal" notes (office/admin only) | Detail reads `job.internalNotes` but `JobRecord` stores `privateNotes` — likely mismatch / detail uses its own mock | Medium (verify) |
| `status` typing | One canonical `JobStatus` set | `JobRecord.status` is a free `string` | Low |
| Loading/error states | (TBD) | None (synchronous mock store) | Low |

## Recurring jobs & job-type durations (Jun 2026 regression)
- **Recurring job creation** (CreateJob → frequency = Recurring) opens a wizard: repeat
  daily/weekly/monthly/yearly, every N, weekly weekday picker, **ends after N occurrences** OR
  **on a date**. On save it generates a **series of unscheduled + unassigned jobs** (status
  Unscheduled, no date, no technician), titled `<name> (i/N)` — the dispatcher schedules each on
  the board later. Pure expansion in `utils/recurrence.ts` (capped at 100). *(Marek Jun 8 wizard +
  Jun 5 "unscheduled + unassigned" — supersedes the earlier "recurring auto-schedules" note.)*
- **Per-job-type default duration** is configurable in Settings → Jobs → Job Types
  (Installation 8h, others 2h) via `jobTypesStore.getDuration/setDuration`; selecting a job type
  on CreateJob pre-fills the duration (and end time). Follow-up: per-**client** duration override.

## Open questions (Jobs)
1. **Documents** — allowed file types, size limits, who can upload/delete.
2. **Tabs configurability** — should users really hide/reorder detail tabs, or is that
   prototype-only?
3. **Notes RBAC enforcement** — is Field/Internal visibility enforced now, or visual-only
   until RBAC lands? (ties into the RBAC module)
4. **Status-change RBAC** — any role can change status, or restricted?
