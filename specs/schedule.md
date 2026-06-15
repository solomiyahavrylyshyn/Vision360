# Schedule module — spec (reconstruction in progress)

> Status: DRAFT. This pass captures the **Create Job** flow and the **Pending jobs**
> panel in full; the rest of the board (day/week/month grid, drag/resize, event
> popover) is inventoried at a high level and will be detailed in a later batch.
> Source-of-truth precedence: **product owner > Figma > prototype code**.

## Purpose / users
The Schedule (a.k.a. Calendar / dispatch board) is the dispatcher's workspace for
placing jobs onto technicians' days and keeping the day conflict-free. Primary user:
**dispatcher**; secondary: owner/admin of a small operator.

Route: `/schedule` (alias `/calendar`) → `src/app/pages/Calendar.tsx`.

## Screens (overview)
| Screen | Entry | Detail status |
|---|---|---|
| Board — Day / Week / Month | view toggle | inventory only (this pass) |
| Pending jobs panel | board toolbar toggle | **specified below** |
| Create Job modal | board create actions (`+ New`, `n`, click a slot) | **specified below** |
| Edit / Reschedule quick modal | click an existing job on the board | inventory only |
| Event popover | click a scheduled event | inventory only |

---

## Create Job (modal + `/jobs/new` page)
Same form body renders both as a modal (opened from the board, Figma "Create job")
and as the full page `/jobs/new`. File: `src/app/pages/CreateJob.tsx`.

### Layout (per Figma)
Sections stacked, each as a row with the **section label on the left** and the
**form column on the right**, divided by bottom borders, inside one white card:
1. **Job overview** — Job frequency (radio cards One-off / Recurring); Job title;
   Job type; Client name; Service address; Assigned to.
2. **Job period** — Job duration; "Schedule job" toggle (bordered row); Start date /
   Start time / End time (3-col, shown when scheduling).
3. **Estimates** — search + "Add estimate"; table (Estimate / Created by / Status /
   Amount + remove); Total footer. Supports **multiple** linked estimates.
4. **Line Items** — search + "Add item"; table (Item / Quantity / Unit price /
   Unit cost / Total + remove); Subtotal / Taxable / Tax / Total summary.
5. **Job Notes**, **Field Notes**, **Internal Notes** — each its own section.
6. Footer: **Cancel** + **Save job**.

### Required fields (validation)
- **Job title** *
- **Job type** *
- **Client name** *
- **Service address** * — *(product decision: mandatory)*
- **Job frequency** * (default **One-off**)
- Scheduling fields — required conditionally (see frequency rules).

### Job frequency behavior
**One-off (flexible):**
- "Schedule job" toggle may be **off** → job is created **Unscheduled** (no date/time);
  date/time fields hidden.
- Toggle **on** → Start date / Start time / End time become required.

**Recurring:**
- Selecting Recurring **auto-enables** "Schedule job" and the toggle **cannot** be
  turned off.
- The form **prefills a suggested time slot** into Start/End (next free hour within
  business hours); the user may adjust it.
- Start date / Start time / End time are **mandatory**.
- Requires a **full recurrence pattern**: frequency (daily / weekly / monthly),
  interval, days-of-week (for weekly), and an end condition (end date OR number of
  occurrences). → **NOT present in prototype — GAP.**

### Time-conflict rule (product decision)
- Overlap with another job for the **same technician** is **not allowed → HARD BLOCK**.
- Detection runs **inline at the moment the time is entered** (start/end change), not
  only on Save.
- Feedback: the time field(s) highlight **red** with an inline message; **Save is
  disabled** until the conflict is resolved. **No override.**
- (Out-of-business-hours selection is also blocked — see board business-hours rule.)

### Prefill (when opened from a board slot)
Start date, Start time, End time (from the clicked slot, +default duration) and
Assigned to (the slot's technician); "Schedule job" on. Service address auto-fills
from the chosen client's address.

### Save behavior
- Modal mode: writes the job to the store, closes, and the board re-renders (the new
  job appears on its scheduled slot). Page mode (`/jobs/new`): navigates to the job.
- The **first** linked estimate becomes the job's primary estimate link (MVP keeps a
  single structural link; the rest are listed in the Estimates table).

### States
- **Empty / initial**: required fields blank; Save disabled until at least a client is
  chosen (and conflict-free time when scheduling).
- **Conflict**: red time field, inline warning, Save disabled.
- **Out-of-business-hours**: slot creation blocked with a toast on the board.
- **Saving**: (define) — currently immediate.
- **Recurring without pattern**: invalid → Save disabled *(target; pattern UI is a gap)*.

---

## Board views (Day / Week / Month)
View toggle persisted across sessions (`localStorage` key `vision360.calendar.viewMode`).
Date navigator (prev / today / next) steps by day/week/month per the active view.

**KPI tiles** (4, scoped to the current view's period): **Revenue** ($, period total),
**Jobs** (count), **In progress** (count), **Completion rate** (%). Cancelled jobs are
excluded from KPIs (`dailyKpis`, `scheduleLogic.ts:232`).

- **Day** — per-technician lanes (TEAM) on an hour grid from `GANTT_START_HOUR` to
  `GANTT_END_HOUR` (from `scheduleSettingsStore`). Overlapping jobs in one lane are
  packed into stacked sub-rows so they never paint on top of each other
  (`packOverlaps`, `scheduleLogic.ts:182`).
- **Week** — 7 day columns × technician rows; click a day cell → opens Create Job for
  that slot; click a day number → jump to Day view.
- **Month** — calendar grid; day cell click → Day view; jobs shown as compact chips.

**Keyboard:** `←/→` navigate, `t` today, `d`/`w`/`m` switch view, `n` new job
(opens the full Create Job modal). Disabled while a modal is open.

**Two-flag scheduling model** (Marek; `scheduleLogic.ts:97-116`): a job is NOT a single
status — it has two independent flags: **has a date** (absence = *Unscheduled*) and
**has an assignee** (absence = *Unassigned*). These overlap: a dated job with no
technician is BOTH *Scheduled* and *Unassigned*. A job appears **on the board only when
it has both a date and an assignee** and isn't Cancelled (`belongsOnBoard`); everything
else lives in the Pending panel. Cards render **every** applicable scheduling tag
(`schedulingTags`), never a single badge.

## Drag & drop interactions (board)
| Action | Rule | Source |
|---|---|---|
| Pending → slot | status becomes **Scheduled**; job gets that date + technician | `statusAfterAssignToSlot(prev, fromPending=true)` |
| Slot → slot | status **unchanged**; date/technician updated | `statusAfterAssignToSlot(prev, false)` |
| Drop onto Pending panel | **unschedule**: clear the DATE (`unscheduled=true`), **keep** technician + status | `applyMoveToPending` |
| Unassign on board | **keep** the date, drop the technician → job is "scheduled + unassigned" | `applyUnassign` |
| Drop without duration | duration auto-set by job type | `durationForType` / `DEFAULT_DURATION_BY_TYPE` |
| Completed job | **not draggable** | `isDraggable` |
| Cancelled job | **stays on board** (greyed) and does **NOT block** scheduling another job over its slot | **PO decision — overrides code** (`isShownOnBoard` currently hides Cancelled; conflict check must also ignore Cancelled so you can schedule over it) |
| Drop onto closed business day | blocked with a toast | `isDateOpenForBusiness` |

**Conflict on drop/resize:** a technician can't hold two time-overlapping jobs
(`hasTimeConflict`, same-tech `[start,end)` overlap, ignoring unscheduled/cancelled).
Back-to-back (one ends as the next starts) is NOT a conflict. Seed data is de-conflicted
on load (`deconflict`); user-created jobs are never silently dropped.

> Open: confirm the **drop/resize** conflict UX (block vs. snap-back vs. warn) so it
> matches the Create-Job hard-block decision.

## Job info side panel (board drawer)
Clicking an existing job on the board opens a **right-anchored drawer, 400px** wide, full
height, white, `shadow-lg`, square corners. This is the single board entry point for
viewing **and** editing a job in place (it supersedes the prototype's small reschedule/edit
modal + event popover).

**Header** (16px padding, 59px): back chevron (‹) · **Job title** (Geist 20px/600
`#1A2332`) · **status badge** (dropdown to change status; color per `JOB_STATUS_STYLES`,
e.g. *Paused* = purple `#A856F7`) · close (×).

**Tabs** (segmented, 368px, `#F5F7FA` track, active = `#4A6FA5` white): **Details · Notes · Activity.**

### Details tab
White card (border `#E5E7EB`, radius-12), two parts:

**Summary header:**
- **Property / client name** — 16px/600 (e.g. "Johnson Residence").
- Row: **job title / issue** (14px/500, e.g. "AC Not Cooling") + **frequency badge**
  (`Recurring` / `One-off`, neutral `#F5F7FA`).
- **Recurring** → shows a **recurrence summary** line — "Every 1 week on Mon (up to 1 Jul)"
  (12px `#6B7280`). **One-off** → this line is hidden; only the "One-off" badge shows.
- **Address** line (14px `#6B7280`, e.g. "1250 Oak Dr").
- **Contact actions** (right): call (phone) + email icon buttons (32px, bordered).

**Editable detail rows** (leading icon + label `#6B7280` + control 200px, divider above):
| Field | Leading icon | Control |
|---|---|---|
| Job type | briefcase | select (e.g. Service) |
| Technician | wrench | select ("Select technician" when unassigned) |
| Job duration | calendar-clock | number input (hours) |
| Start date | calendar | date — placeholder `DD-MM-YYYY` |
| Start time | clock | time — placeholder `--:--` |
| End time | clock | time — placeholder `--:--` |
| Amount | dollar-circle | **read-only** ($, e.g. $750) |

> Editing the time here is subject to the **inline conflict rule** (hard block, warn at
> entry — same as Create Job). Recurrence summary reflects the recurrence pattern.

### Notes tab
A **single notes list** (NOT the Job/Field/Internal split used on the Jobs **page** —
see GAP). Header "Notes" + a round **＋** add button (top-right). Each note: muted
"Added <Mon DD, YYYY>" line + body text; rows divided by hairlines.
- **Empty state**: notebook-pen icon in a bordered circle, **"No notes yet"** (14px
  `#1A2332`), **"Anything worth remembering? Add it here"** (12px `#6B7280`), and a primary
  **Add note** button.

### Activity tab
Chronological **audit timeline** (read-only). Each entry: bold action + muted
"<verb> by <user> <when>" — e.g. **"Status: Completed"** / "Marked by Helen Smith today";
**"Assigned to Peter Novak"** / "Assigned by Helen Smith today".
- **Empty state**: history icon in a bordered circle, **"No activity yet"**,
  **"Completed actions will appear here"**.

**Footer** (16px): default is **Edit** (outline) · **Save** (blue `#4A6FA5`). **Reopen job**
(outline) is inserted **only for Completed/closed jobs** (e.g. a Paused job shows just
Edit · Save).
- **Reopen job** appears for closed/Completed jobs → sets status back to an active state
  (which one? → open question) and re-enables editing. *(Marek's "reopen invoice with
  manager/admin permission" rule is invoice-side; confirm whether reopening a JOB is also
  permission-gated.)*
- Edit vs. Save: fields render editable in the design; confirm whether **Edit** toggles
  read-only→editable or is always-editable with **Save** persisting.

**States:** Details (filled / editing / unassigned = "Select technician" / unscheduled =
empty `DD-MM-YYYY` + `--:--`), Notes (filled / empty), Activity (filled / empty), per-status
badge (Scheduled blue, Paused purple, …). A **Recurring** job may still show empty
start date/time (the series template before it's placed — consistent with the Unscheduled
status for future recurring jobs).

### Overlay / scrim level (PO decision)
- **Create Job modal**: **light scrim ~10%** — `rgba(28,43,58,0.10)`. Focus the modal
  without heavily dimming the page.
- **Side drawers (Pending, Job info)**: **also use a scrim** (PO decision — overrides the
  Figma frames, which carried only `box-shadow`). Drawer keeps `shadow-lg` **plus** a scrim
  over the board. Use the same light ~10% level for consistency unless specified otherwise.

## Pending jobs panel
Right-anchored drawer, **400px** wide, full height, white, `shadow-lg`, square corners
(`right: 2px; top: 0`). Sections: Dialog Header → filter dropdown → list / empty-state.

**Layout (Figma tokens):**
- **Header** (16px padding, 59px tall): title **"Pending jobs (N)"** — Geist 20px/600,
  `#1A2332` (H4/semibold) — + a 24px icon close button (×) on the right.
- **Filter**: a Select/Combobox (368px, h-36, 1px `#E5E7EB`, radius-8, shadow-xs),
  placeholder/label "Select an item" → shows the active filter (e.g. "Show all").
- **Empty-state** (centered, gap-16): 40px circular bordered (`#E5E7EB`, radius-100)
  calendar icon; **"No pending jobs"** — 14px/400 `#1A2332`, centered; subtext
  **"Soon as something needs attention, it'll show up here"** — 12px/400 `#6B7280`.

Header **"Pending jobs (N)"** + close (×).

**Filter dropdown** (`scheduleLogic.ts:118`, options confirmed from code):
- **Show all** — every pending job (unassigned OR unscheduled).
- **Show unassigned** — has a date, no technician.
- **Show unscheduled** — no date (technician optional).
- **Show unassigned + unscheduled** — the UNION ("+" = OR), the dispatcher's
  "needs scheduling attention" list.
- (`scheduled` predicate also exists in logic — pending jobs that DO have a date for the
  period — but is not currently a dropdown option; confirm whether it should be exposed.)

- **Empty state** (from design): centered calendar icon, heading **"No pending jobs"**,
  subtext **"Soon as something needs attention, it'll show up here."**
- **Filled state**: draggable pending job cards (drag onto a board slot to schedule).
  Card shows scheduling tags (Unscheduled / Unassigned). *(Card detail: inventory only.)*

> **Prototype currently diverges** (right screenshot): header shows a small blue icon and
> omits the `(N)` count; empty-state uses a **checkmark** circle with **"Nothing pending"**
> and no subtext. Target = Figma (left): **"Pending jobs (N)"** (no header icon),
> **calendar** icon in a bordered circle, **"No pending jobs"** + subtext. → see GAP table.

---

## GAP TABLE
| Area | Design / decision says | Prototype currently does | Severity |
|---|---|---|---|
| Time conflict in Create Job | Hard-block + inline warning **at time entry**, Save disabled | Conflict logic exists for board drag/drop (`hasTimeConflict`, `deconflict`, `statusAfterAssignToSlot` in `scheduleLogic.ts`); **Create Job form has no inline time-conflict check** | High |
| Recurring frequency | Auto-enable Schedule, prefill suggested slot, mandatory time, **full recurrence pattern** fields | Recurring radio exists but **no pattern fields, no auto-prefill/force, no mandatory enforcement** | High |
| Service address | Mandatory field | Not enforced as required in the form | Medium |
| One-off unscheduled | Allowed (toggle off → Unscheduled) | Supported | — (OK) |
| Pending panel empty state | "Pending jobs (N)" header (no icon) + **calendar** icon in bordered circle + "No pending jobs" + subtext | Header has a small blue icon, no `(N)` count; **checkmark** circle + "Nothing pending", no subtext | Medium |
| Cancelled on board | Stays visible (greyed), schedulable over (never blocks a slot) | Hidden (`isShownOnBoard=false`); conflict check would block over it if shown | High |
| Job-info drawer | 400px right drawer with Details / Notes / Activity tabs + Edit / Reopen job / Save | ✅ **Implemented** (`JobInfoDrawer` in Calendar.tsx) for day + week. Note: month view still uses the older `EventPopover`; date/time/duration are read-only in the drawer (deep edits via **Edit** → full form) | Low (was High) |
| Create modal scrim | Light ~10% `rgba(28,43,58,0.10)` | ✅ **Implemented** (was 0.2) | — |
| Drawer scrim | Drawers dim the board (~10% + shadow) | ✅ **Implemented** (`rgba(28,43,58,0.10)`) | — |
| Drawer notes | **Single** notes list in the drawer | Jobs **page** uses Job / Field / Internal split — reconcile which surface uses which | Medium |
| Create Job modal scrim | **Light ~10%** `rgba(28,43,58,0.10)` | `rgba(28,43,58,0.2)` (~20%) | Low |
| Drawer scrim | Drawers **dim the board** behind (scrim + shadow) | Drawers render with shadow only, no scrim | Medium |

---

## Open questions (Schedule)
- **Drop/resize conflict UX**: block + snap back, or warn? (Create Job is hard-block.)
- **Conflict scope**: an **unassigned** job has no technician, so `hasTimeConflict`
  returns false — confirm that's intended (no conflict until a technician is assigned).
- **Recurrence**: how recurring instances are generated/shown on the board; editing one
  occurrence vs. the series; recurrence pattern UI placement.
- **Suggested-slot algorithm** for Recurring prefill (precise "next free hour" definition).
- **`scheduled` pending filter**: expose as a 5th dropdown option, or keep internal?
- **Event popover** + **quick modal** exact field lists (need Figma to confirm vs. code).
- Month view: max chips per day before "+N more"?
- **Reopen job** — which status does it restore, and is it permission-gated (admin/manager)?
- **Notes surface split** — drawer = single list, page = Job/Field/Internal: which is canonical?
