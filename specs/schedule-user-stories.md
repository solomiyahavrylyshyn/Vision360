# Schedule / Calendar — User Stories (Azure DevOps-ready)

> Source: product owner (Marek call) — highest precedence. Feature: **Schedule / Calendar board**.
> Acceptance criteria are the target behavior; "Current status" notes the prototype as of 2026-06-14.

---

## US-1 — Switch calendar views & configure slot granularity
**As a** dispatcher **I want** to switch between Daily / Week / Month views **so that** I can see
scheduled jobs at different levels of detail.

**Acceptance criteria**
- Three views are available — Daily, Week, Month — and the active view is visually indicated.
- Job cards render on the board in every view.
- Slot granularity is **fixed at 15 min** — a job can always be shifted by a quarter hour (no per-board
  granularity switcher; arbitrary minute entry stays in the Create/Edit form).
- The time axis **defaults to working hours** (e.g. 7:00–17:00) but, if a job is scheduled outside them
  (e.g. 3 AM), the board **expands and stays horizontally scrollable** so the out-of-range job is reachable;
  the default scroll position still opens on the working-hours start.

**Current status:** ✅ Implemented. Three views + board cards; job-info drawer on click; create-job modal.
Slot/drag/drop snapping fixed at 15 min (`SLOT_HOURS = 0.25`); empty-slot clicks and drag previews resolve
to quarter hours. *(PO decision: dropped the 15/30/60 switcher — always 15 min.)*

---

## US-2 — Jump to today by clicking the date
**As a** dispatcher, after navigating to other days, **I want** to quickly return to today **so that**
I don't lose my place.

**Acceptance criteria**
- Clicking the current **date label** returns the board to today ("jump to today").
- No separate "Today" button — the legacy button design is deprecated and not built.
- Works in all three views (returns to the day / week / month containing today).

**Current status:** ✅ Implemented. The date label is the affordance (`goToday` → real `new Date()`); no
separate Today button. (Fixed a bug where it jumped to a hard-coded demo date.)

---

## US-3 — Read-only dispatch map under the board (Daily only)
**As a** dispatcher **I want** to see where the selected day's jobs are geographically **so that** I can
reason about technician routes and avoid scheduling visits on opposite ends of town.

**Acceptance criteria**
- The map renders **only in Daily view**, below the board.
- Pin markers for the selected day's jobs; coordinates derived from the job address (= client address).
- Markers are **colored by technician** and **numbered by visit order** (1st, 2nd, 3rd…).
- Read-only: **no drag-and-drop, no route building/optimization** in MVP — zoom in/out only.
- Stays in sync with the board: changing date / status / filters recomputes the markers.
- Jobs **outside working hours** and **unscheduled** jobs are not shown (neither on board nor map).
- On init, **auto-fit zoom** so all of the day's jobs fit in view.

**Current status:** ✅ Implemented (`DispatchMap` in `Calendar.tsx`). Daily-only; SVG canvas with pins
placed from deterministic per-address coordinates (geocoding stub), coloured by technician, numbered by
visit order, dashed route polylines per technician, zoom in/out controls, bbox auto-fit (zoom resets when
the day's job set changes), and an empty state. Consumes the same `filteredDayJobs` as the board, excluding
unscheduled / unassigned / out-of-range. *(Replaced the old static route-map image + hard-coded pins.)*
Pending: real geocoding (coords are a deterministic stub, not the actual street position).

---

## US-4 — Create a job from an empty slot
**As a** dispatcher **I want** to click an empty slot, pick a technician, and create a job immediately
(e.g. during a client call) **so that** I don't have to hunt for a separate full form.

**Acceptance criteria**
- Clicking an **empty slot** opens the Create Job form, prefilled.
- Prefilled: **Start date + Start time** (from the slot), **Assigned To** (the slot's technician),
  **Schedule toggle = ON**.
- Mandatory: **Client** (dropdown), **Service / Job Type**, **Job Frequency** (One-off / Recurring).
- **Job Duration** defaults from Job Type (2h default; **Installation → 8h**); configurable per client.
- **End time** auto-fills from duration and is **bidirectional**: change duration → end time updates,
  and change end time → duration updates.
- **Arbitrary time entry** allowed — not just :00/:30 (e.g. 10:25).
- **Out-of-range warning:** if the job falls outside working hours (default **7:00–17:00**, configurable
  in Settings) a warning modal appears — it **does not block**, only confirms.
- **Overlap check:** while setting start/end, dynamically check the technician's other jobs and show an
  **inline error at the bottom** on conflict.
- On save: status = **Scheduled** and the job renders immediately on the chosen slot.
- **At least one line item is required** to create/schedule a job — Save is blocked (and the button
  disabled) with zero items. Edit mode is exempt (it doesn't manage line items). *Note: the board's
  drag-to-schedule and status-change paths can't enforce this — `JobRecord` stores no line items, only a
  `totalPrice` — so enforcement lives at creation.*

**Current status:** ✅ Implemented (except per-client duration override). Slot click prefills date/time +
technician with Schedule = ON; duration defaults from job type (Installation 8h, else 2h) and is
**bidirectional** with End time; arbitrary minute entry allowed; an **out-of-range confirm modal** warns
without blocking; a live **overlap inline error** checks the technician's other board jobs (via the
`checkConflict` prop wired from `Calendar.tsx` → `boardCheckConflict`); Service address is mandatory; on
save status = Scheduled.
Pending: per-client duration override (currently per job-type only).

---

## Backlog — technical / backend (NOT product behavior, tracked separately)
- Job Type as its own entity/table with custom types (MVP data model).
- Storing geocoordinates + full address (for US-3 map).
- Start/end date as one column vs two.
- Address autocomplete on Client Create.
