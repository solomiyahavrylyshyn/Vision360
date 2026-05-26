# Module: Schedule/Calendar (PRD §13)

## ✅ Passing

- Calendar is 2nd item in left nav, labeled "Schedule" ✅
- Month, Week, Day views implemented ✅
- Jobs displayed on calendar ✅
- Drag-and-drop rescheduling implemented ✅
- Job status colors: Scheduled (blue), In Progress (yellow), Completed (green) ✅
- No "Unscheduled" bar/workflow ✅ (correctly absent from MVP)
- "Schedule Board" terminology replaced by "Calendar" in nav label ✅ (though "Schedule Board" appears in Settings page — see cross-cutting findings)

## ❌ Failing

**SC-01** — KPI blocks on Calendar page: not confirmed present. PRD §13.7 requires 4 KPI blocks above the calendar: Jobs Today, Revenue, In Progress, Completed. Need manual verification.

## ⚠️ Open Questions

- PRD §13.3 Day View: requires technician rows on left side (up to 3 for MVP). Does the day view show technician rows?
- PRD §13.3 Week View: requires technician names column + weekly revenue totals. Present?
- PRD §13.2: "Double-click empty time slot → job creation form opens with date/time pre-filled". Verify this interaction.
- PRD §13.10 Map View: "Show job locations on map" is ✅ in MVP. Is a map view accessible from Calendar?
- Revenue display on calendar: PRD §13.5 says show daily revenue next to date in header. Present?
