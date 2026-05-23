# Calendar — Complete User Story Set

**Module:** Schedule / Calendar
**Route:** `/calendar`
**Related routes:** `/appointments/new` (create event), `/appointments` (events list)

---

## Personas

| Code | Role | Description |
|------|------|-------------|
| **D**  | Dispatcher | Plans daily/weekly schedule, assigns jobs to technicians, resolves conflicts. |
| **T**  | Technician | Field worker who executes jobs; views own schedule, updates status. |
| **M**  | Operations Manager | Oversees KPIs, revenue, completion rates, team utilization. |
| **A**  | Admin | Configures working hours, slot durations, defaults. |
| **CS** | Customer Service Rep | Books appointments, notifies clients. |

---

## Epic 1 — Calendar Navigation & Views

### US-CAL-001 — Switch between Day / Week / Month views
**As a** Dispatcher
**I want** to toggle between Day, Week, and Month calendar views
**So that** I can plan at the right level of detail for the task at hand

**Acceptance Criteria**
- Toolbar exposes three toggle buttons: Day, Week, Month.
- Active view is visually highlighted.
- Switching views preserves the currently selected reference date.
- Default view on first load is **Week**.

**Priority:** Must

---

### US-CAL-002 — Navigate forward / backward in time
**As a** Dispatcher
**I want** Previous/Next navigation buttons
**So that** I can move through dates without leaving the calendar

**Acceptance Criteria**
- Prev/Next step matches the active view: ±1 day, ±1 week, or ±1 month.
- Header label updates to reflect the current range (e.g. "May 2026", "May 18 – 24, 2026", "Mon, May 18").
- No page reload on navigation.

**Priority:** Must

---

### US-CAL-003 — Jump to today
**As a** Dispatcher
**I want** a "Today" button
**So that** I can return to the current date instantly after browsing

**Acceptance Criteria**
- "Today" button is always visible in the toolbar.
- Clicking it resets the reference date to the current date in the active view.
- Today's cell/row is visually distinct (highlight, badge, or border).

**Priority:** Must

---

### US-CAL-004 — Persist user view preferences
**As a** Dispatcher
**I want** my last-used view to be remembered
**So that** I don't have to reset it every time I open the calendar

**Acceptance Criteria**
- Active view (Day/Week/Month) persists across sessions (localStorage).
- Last viewed date is **not** persisted (always defaults to today on return).

**Priority:** Should

---

## Epic 2 — KPI Header

### US-CAL-010 — View revenue for the active period
**As an** Operations Manager
**I want** a Revenue KPI card on the calendar header
**So that** I can monitor daily/weekly/monthly financial performance at a glance

**Acceptance Criteria**
- Card shows total revenue for the visible range.
- Value updates when the view or date range changes.
- Currency is formatted with thousands separator and currency symbol.

**Priority:** Must

---

### US-CAL-011 — View job counts and completion rate
**As an** Operations Manager
**I want** KPI cards for total jobs, in-progress jobs, and completion rate
**So that** I can track operational throughput

**Acceptance Criteria**
- Three additional cards: **Jobs (total)**, **In Progress**, **Completion %**.
- Completion % = (Completed ÷ Total) × 100, rounded to 0 decimals.
- KPIs recalculate live when statuses change inside the calendar.

**Priority:** Must

---

## Epic 3 — Month View

### US-CAL-020 — See all jobs/events in a month grid
**As a** Dispatcher
**I want** a 7-column month grid (Sun–Sat)
**So that** I can scan an entire month at once

**Acceptance Criteria**
- Grid shows the current month with leading/trailing days from adjacent months in muted color.
- Each day cell lists scheduled events with color-coded left border.
- Today's cell is visually highlighted.
- Empty cells remain clickable.

**Priority:** Must

---

### US-CAL-021 — Overflow indicator for busy days
**As a** Dispatcher
**I want** a "+N more" indicator when a day has more events than fit
**So that** I know more events exist without breaking the grid layout

**Acceptance Criteria**
- If events exceed cell capacity, only the first N fit; "+N more" appears below.
- Clicking "+N more" opens a popover listing all events for that day.

**Priority:** Should

---

### US-CAL-022 — Quick actions on a month event
**As a** Dispatcher
**I want** to click an event in the month grid to see quick actions
**So that** I can view or edit it without switching views

**Acceptance Criteria**
- Clicking an event opens a popover with **View Job** and **Edit** actions.
- "View Job" navigates to the job's detail page.
- "Edit" opens the event edit modal/page.

**Priority:** Must

---

### US-CAL-023 — Open day from month grid
**As a** Dispatcher
**I want** to click a day cell to drill into Day view for that date
**So that** I can switch from monthly overview to hourly planning quickly

**Acceptance Criteria**
- Clicking an empty area of a day cell switches the calendar to Day view focused on that date.
- Clicking an event opens the event popover (does NOT drill in).

**Priority:** Should

---

## Epic 4 — Week View

### US-CAL-030 — Horizontal Gantt-style week timeline
**As a** Dispatcher
**I want** a week view showing 7 days × technicians as horizontal swimlanes
**So that** I can visualize the whole team's load for the week

**Acceptance Criteria**
- Left column (sticky) shows day + technician row labels with daily revenue subtotal.
- Hour header runs across the top with the configured start/end hours.
- A red vertical line marks the current time (visible only on today's row).
- Job cards render as horizontal blocks spanning their start–end times.

**Priority:** Must

---

### US-CAL-031 — Job card information density
**As a** Technician
**I want** each job card to show essential info inline
**So that** I can read it without opening details

**Acceptance Criteria**
- Card shows: time range, client name, service type, route number, status badge.
- Card color reflects status (Scheduled = blue, In Progress = amber, Completed = green).
- Long content is truncated with ellipsis; full info available on hover/click.

**Priority:** Must

---

### US-CAL-032 — Daily revenue totals per technician row
**As an** Operations Manager
**I want** each technician's daily row to show a revenue subtotal
**So that** I can spot under- or over-utilized resources

**Acceptance Criteria**
- Subtotal appears in the sticky left column for each technician/day.
- Updates live as jobs are added, removed, or rescheduled.

**Priority:** Should

---

## Epic 5 — Day View

### US-CAL-040 — Single-day Gantt with technician swimlanes
**As a** Dispatcher
**I want** a single-day Gantt with one row per technician
**So that** I can plan an individual day in fine detail

**Acceptance Criteria**
- Hour grid is configurable (default 7 AM – 7 PM).
- Each technician row shows their job cards with status badges.
- Current time indicator (red line) appears at the present hour/minute on today's view.

**Priority:** Must

---

### US-CAL-041 — Route map for the day
**As a** Dispatcher
**I want** a Route Map panel on the Day view
**So that** I can visualize the geographic order of the day's stops

**Acceptance Criteria**
- Map area is ~240px tall, below or beside the Gantt.
- Each job appears as a numbered pin matching its route order.
- Clicking a pin highlights the corresponding job card.
- Clicking a pin opens a popup with client, service, address, time, amount, status.

**Priority:** Should

---

## Epic 6 — Job Status Management

### US-CAL-050 — Toggle job status from the calendar
**As a** Technician
**I want** a one-click status toggle on each job card
**So that** I can update progress without leaving the calendar

**Acceptance Criteria**
- Click cycles status: Scheduled → In Progress → Completed → Scheduled.
- Color and label update immediately.
- KPIs and revenue subtotals refresh in real time.

**Priority:** Must

---

### US-CAL-051 — Status badge visible everywhere a job is shown
**As a** Dispatcher
**I want** consistent status badges across Month, Week, and Day views
**So that** I can read status at a glance regardless of zoom level

**Acceptance Criteria**
- Same color codes and labels everywhere: Scheduled (blue), In Progress (amber), Completed (green).
- Badge is keyboard-accessible (focusable, ARIA label).

**Priority:** Must

---

### US-CAL-052 — Action buttons in the details sidebar
**As a** Technician
**I want** Start Job / Complete Job / Reopen Job buttons in the right sidebar
**So that** I can perform the next logical action with a clear CTA

**Acceptance Criteria**
- Button label adapts to current status: "Start Job" (Scheduled), "Complete Job" (In Progress), "Reopen Job" (Completed).
- Additional buttons: **Edit**, **Reschedule**.
- Quick-action icons: phone, chat.

**Priority:** Must

---

## Epic 7 — Drag & Drop Scheduling

### US-CAL-060 — Drag a job to a new time slot
**As a** Dispatcher
**I want** to drag job cards between time slots within the same technician
**So that** I can reschedule without opening a form

**Acceptance Criteria**
- Drag works in Day and Week views.
- Ghost/placeholder shows the target slot during drag.
- Drop snaps to the configured slot duration (15/30/60 min).
- A toast confirms the new time on successful drop.

**Priority:** Must

---

### US-CAL-061 — Drag a job to a different technician
**As a** Dispatcher
**I want** to drag jobs between technician swimlanes
**So that** I can reassign work without manual edits

**Acceptance Criteria**
- Cross-row drag is supported in both Day and Week views.
- The assigned technician updates immediately.
- Daily revenue subtotals for both source and destination technicians refresh.

**Priority:** Must

---

### US-CAL-062 — Conflict detection on drop
**As a** Dispatcher
**I want** the system to reject drops that would create overlapping jobs for one technician
**So that** I don't accidentally double-book

**Acceptance Criteria**
- If the drop would overlap an existing assigned job, the drop is rejected.
- An inline error/toast explains the conflict (e.g. "Conflicts with Job #J-2091, 2:00–3:30 PM").
- The card returns to its original position.

**Priority:** Must

---

## Epic 8 — Quick Job Creation

### US-CAL-070 — Create a job by double-clicking an empty slot
**As a** Dispatcher
**I want** to double-click an empty time slot to open a quick-create modal
**So that** I can schedule jobs in seconds

**Acceptance Criteria**
- Double-click on empty cell (Day or Week) opens Quick Job modal.
- Modal pre-fills date, time, and technician based on the clicked cell.
- Cursor focus is on the first field (Customer Name).

**Priority:** Must

---

### US-CAL-071 — Quick Job modal fields
**As a** Dispatcher
**I want** a minimal field set in the quick-create modal
**So that** I can capture the essentials without distractions

**Acceptance Criteria**
- Fields: Customer (required), Service Type, Technician, Start time, End time, Revenue, Address.
- Customer field autofocuses and supports type-ahead from existing clients.
- Time inputs step by the configured slot duration.

**Priority:** Must

---

### US-CAL-072 — Validation in Quick Job modal
**As a** Dispatcher
**I want** clear validation messages
**So that** I know what to fix before saving

**Acceptance Criteria**
- Required fields: Customer.
- End time must be after Start time → inline error.
- Time range must not conflict with another job for the same technician → inline error.
- Save button is disabled until validation passes.

**Priority:** Must

---

### US-CAL-073 — "Create Job" header button
**As a** Dispatcher
**I want** a primary "Create Job" button in the page header
**So that** I can open the Quick Job modal even without clicking on a slot

**Acceptance Criteria**
- Button always visible in the header.
- Opens the same Quick Job modal; pre-fills today's date and the current/next slot.

**Priority:** Must

---

## Epic 9 — Full Appointment Creation (Create Event Page)

### US-CAL-080 — Create an appointment with full details
**As a** Customer Service Rep
**I want** a full appointment creation page at `/appointments/new`
**So that** I can capture richer information than the quick modal allows

**Acceptance Criteria**
- Form sections: Date & Time, Event Type, Title & Description, Client Notification.
- Save options: **Save Draft**, **Cancel**, **Save & Notify Client**.
- After successful save, navigate to calendar or appointment detail (per save action).

**Priority:** Must

---

### US-CAL-081 — Date & Time block
**As a** CS Rep
**I want** date picker, time picker, duration dropdown, and auto-computed end time
**So that** I can set timing without arithmetic errors

**Acceptance Criteria**
- Date picker uses the app's standard date control.
- Duration options: 15, 30, 45, 60, 90, 120 minutes (or custom).
- End time auto-updates when start time or duration changes.

**Priority:** Must

---

### US-CAL-082 — Event type selection
**As a** CS Rep
**I want** preset event types
**So that** I can categorize the appointment consistently

**Acceptance Criteria**
- Dropdown options: Initial Consultation, Service Call, Installation, Follow-up Visit, Inspection.
- Selected type is required before "Save & Notify".

**Priority:** Must

---

### US-CAL-083 — Custom title & description
**As a** CS Rep
**I want** optional title and description fields
**So that** I can add context beyond the preset type

**Acceptance Criteria**
- Both fields are optional.
- Title max 80 chars; description max 500 chars with live counter.

**Priority:** Should

---

### US-CAL-084 — Client notification toggle
**As a** CS Rep
**I want** to optionally notify the client by email when saving
**So that** I don't have to compose a separate message

**Acceptance Criteria**
- Toggle reveals: client email (read-only), customizable message body, "Send 24-hour reminder" checkbox.
- When toggle is OFF, "Save & Notify" still saves but skips the email.
- When email is missing, the toggle is disabled with a tooltip explaining why.

**Priority:** Must

---

### US-CAL-085 — Live preview card
**As a** CS Rep
**I want** a right-side preview that reflects current form values
**So that** I can see how the appointment will look before saving

**Acceptance Criteria**
- Preview updates in real time as fields change.
- Mirrors the calendar card style (color, status badge, time range, client).

**Priority:** Should

---

## Epic 10 — Schedule Settings

### US-CAL-090 — Configure working hours
**As an** Admin
**I want** to set start and end hours for the calendar grid
**So that** the view shows only relevant business hours

**Acceptance Criteria**
- Settings panel exposes Start Hour (default 7 AM) and End Hour (default 7 PM).
- End must be greater than Start.
- Changes apply immediately to Day and Week views.

**Priority:** Must

---

### US-CAL-091 — Configure slot duration
**As an** Admin
**I want** to set the slot granularity to 15, 30, or 60 minutes
**So that** scheduling matches our typical job length

**Acceptance Criteria**
- Options: 15 min, 30 min, 60 min.
- Grid lines and time-input steppers reflect the selected duration.
- Drag-and-drop snapping uses this value.

**Priority:** Must

---

### US-CAL-092 — Settings persistence
**As an** Admin
**I want** schedule settings to persist
**So that** the team doesn't have to re-configure them each session

**Acceptance Criteria**
- Settings persist via localStorage (and ideally backend for cross-device sync).
- Reload restores the saved values.

**Priority:** Must

---

## Epic 11 — Right Sidebar (Job Details)

### US-CAL-100 — Open job details on card click
**As a** Dispatcher
**I want** clicking a job card to open a 300px right sidebar with details
**So that** I can inspect the job without leaving the calendar

**Acceptance Criteria**
- Sidebar shows: client, address, time, amount, status, assigned technician.
- Selected card is visually highlighted (blue glow/border).
- Sidebar can be closed via X or by clicking outside.

**Priority:** Must

---

### US-CAL-101 — Tabbed details: Details / Notes / History
**As a** Dispatcher
**I want** three tabs in the sidebar
**So that** I can switch between current info, notes, and audit trail

**Acceptance Criteria**
- Tabs: **Details**, **Notes**, **History**.
- Notes tab allows adding new note (textarea + Save).
- History tab lists status changes, reassignments, and edits with timestamp + actor.

**Priority:** Should

---

### US-CAL-102 — Quick contact actions
**As a** Technician
**I want** phone and chat icons in the sidebar
**So that** I can contact the client without leaving the schedule

**Acceptance Criteria**
- Phone icon opens dialer (or `tel:` link).
- Chat icon opens the in-app messaging center with the client preselected.
- Icons are disabled (with tooltip) if no phone/chat available.

**Priority:** Should

---

## Epic 12 — Performance, Accessibility & Edge Cases

### US-CAL-110 — Empty state on a day with no jobs
**As a** Dispatcher
**I want** a helpful empty state when a day/week has no jobs
**So that** I'm prompted to schedule something instead of staring at a blank grid

**Acceptance Criteria**
- Empty cell area shows a subtle "No jobs scheduled — Create Job" CTA.
- CTA opens the Quick Job modal pre-filled with the current date.

**Priority:** Should

---

### US-CAL-111 — Keyboard navigation
**As a** power user
**I want** keyboard shortcuts for common actions
**So that** I can plan faster without the mouse

**Acceptance Criteria**
- `←` / `→` navigate previous/next.
- `T` jumps to today.
- `D` / `W` / `M` switch view.
- `N` opens Quick Job modal.
- `Esc` closes any open modal/sidebar.

**Priority:** Should

---

### US-CAL-112 — Screen reader & ARIA support
**As a** user with assistive tech
**I want** semantic roles and labels on calendar elements
**So that** I can use the calendar with a screen reader

**Acceptance Criteria**
- Grid uses `role="grid"`, cells `role="gridcell"`.
- Job cards expose ARIA labels: "Job for {client}, {service}, {start}–{end}, status {status}".
- Drag-and-drop has keyboard fallback (move with arrow keys after focusing a card).

**Priority:** Should

---

### US-CAL-113 — Loading & error states
**As a** Dispatcher
**I want** clear loading skeletons and error messages
**So that** I know whether the view is empty, loading, or broken

**Acceptance Criteria**
- Skeleton grid renders while jobs are loading.
- Network errors show a non-blocking banner with a "Retry" action.
- Optimistic UI updates roll back gracefully on save failure.

**Priority:** Must

---

### US-CAL-114 — Large data handling
**As an** Operations Manager
**I want** the calendar to remain responsive with hundreds of jobs per week
**So that** large teams aren't penalized

**Acceptance Criteria**
- Initial render under 500 ms for up to 500 jobs in the visible range.
- Drag interactions remain at 60 fps on a standard laptop.
- Jobs outside the visible range are virtualized or lazy-loaded.

**Priority:** Should

---

## Epic 13 — Integrations

### US-CAL-120 — Link from Client profile to calendar
**As a** Dispatcher
**I want** to jump from a client profile to the calendar filtered by that client
**So that** I can see their schedule context quickly

**Acceptance Criteria**
- Client profile has a "View on calendar" action.
- Calendar opens with a client filter applied and highlighted.

**Priority:** Should

---

### US-CAL-121 — Link from Job detail to calendar slot
**As a** Dispatcher
**I want** a "Show on calendar" link on every job
**So that** I can locate the job in context with one click

**Acceptance Criteria**
- Link from job detail opens calendar in Day view focused on that job's date and scrolls to/selects the card.

**Priority:** Should

---

### US-CAL-122 — Reflect job status changes made elsewhere
**As a** Dispatcher
**I want** status changes made on the Job detail page to reflect on the calendar without reload
**So that** the calendar is always trustworthy

**Acceptance Criteria**
- Status changes propagate to the calendar within 2 s (via store/event bus or polling).
- KPI cards and revenue subtotals stay in sync.

**Priority:** Must

---

## Definition of Done (applies to every story)

- [ ] Implements all acceptance criteria.
- [ ] Responsive: works at ≥1024 px (desktop) — graceful degradation below.
- [ ] No console errors or warnings.
- [ ] Covered by unit tests for logic and at least one happy-path UI test.
- [ ] Accessible: keyboard reachable, focus visible, ARIA where appropriate.
- [ ] Reviewed in code review and QA-tested against the criteria.
- [ ] Telemetry: key user actions emit analytics events (view switch, create, drag, status change).

---

## Story Summary

| Epic | Stories | Must | Should |
|------|---------|------|--------|
| 1. Navigation & Views | 4 | 3 | 1 |
| 2. KPI Header | 2 | 2 | 0 |
| 3. Month View | 4 | 2 | 2 |
| 4. Week View | 3 | 2 | 1 |
| 5. Day View | 2 | 1 | 1 |
| 6. Job Status | 3 | 3 | 0 |
| 7. Drag & Drop | 3 | 3 | 0 |
| 8. Quick Job Create | 4 | 4 | 0 |
| 9. Full Appointment | 6 | 4 | 2 |
| 10. Settings | 3 | 3 | 0 |
| 11. Right Sidebar | 3 | 1 | 2 |
| 12. Perf / A11y / Edge | 5 | 2 | 3 |
| 13. Integrations | 3 | 1 | 2 |
| **Total** | **45** | **31** | **14** |
