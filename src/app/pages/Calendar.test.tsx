import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Calendar } from "./Calendar";
import { businessHoursStore, DEFAULT_BUSINESS_HOURS } from "../stores/businessHoursStore";

// A minimal DataTransfer stand-in: jsdom doesn't implement drag-and-drop, so we
// back setData/getData with a plain map and pass it through fireEvent.
const makeDataTransfer = () => {
  const store: Record<string, string> = {};
  return { setData: (k: string, v: string) => { store[k] = v; }, getData: (k: string) => store[k] ?? "" };
};
const laneCardFor = (client: string): HTMLElement =>
  screen.getAllByText(client).map((el) => el.closest('[data-job-card="true"]')).find(Boolean) as HTMLElement;

// Integration / render test for the daily Dispatch board. Calendar uses native
// HTML5 drag-and-drop (no DnD provider needed) and reads from in-memory stores,
// so it mounts cleanly under a router in jsdom. Drag gestures themselves aren't
// simulated here (covered by the scheduleLogic unit tests); this verifies the
// board renders the right structure per the backlog.
const renderDayBoard = () =>
  render(
    <MemoryRouter initialEntries={["/calendar"]}>
      <Calendar />
    </MemoryRouter>,
  );

describe("Calendar — daily Dispatch board (integration)", () => {
  beforeEach(() => {
    // Force the Day view (default is Week) via its persistence key.
    localStorage.setItem("vision360.calendar.viewMode", "day");
    // The board only renders technician lanes when the current date is an open
    // business day. Tests run on the real wall-clock date, so force every day
    // open to keep the lane assertions deterministic regardless of weekday.
    businessHoursStore.setRows(DEFAULT_BUSINESS_HOURS.map((r) => ({ ...r, open: true })));
  });

  it("renders the Day/Week/Month view switcher", () => {
    renderDayBoard();
    // Labels are lowercase in the DOM, CSS-capitalized for display.
    expect(screen.getByRole("button", { name: /^day$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^week$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^month$/i })).toBeInTheDocument();
  });

  it("shows technician columns on the day board", () => {
    renderDayBoard();
    expect(screen.getAllByText("Peter Novak").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Travis Brown").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Maria Garcia").length).toBeGreaterThan(0);
  });

  it("renders the Pending jobs panel with its filter", () => {
    renderDayBoard();
    expect(screen.getAllByText(/Pending jobs/).length).toBeGreaterThan(0);
    // Filter dropdown options (Paused removed from the model): all / unassigned /
    // unscheduled / scheduled / unassigned + unscheduled.
    expect(screen.getByRole("option", { name: "Show all" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unassigned" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unscheduled" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show scheduled" })).toBeInTheDocument();   // bare label, no time scope (Figma)
    expect(screen.queryByRole("option", { name: "Show paused" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unassigned + unscheduled" })).toBeInTheDocument();
  });

  it("renders job cards with a client name and an unscheduled job shows a no-date placeholder", () => {
    renderDayBoard();
    // Pending seed jobs include an unscheduled one (Reyes Home) whose time row
    // shows a dashes placeholder (per the mockup) instead of a real time range.
    expect(screen.getAllByText("Reyes Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/--:--/).length).toBeGreaterThan(0);
  });

  it("renders status badges and never shows Cancelled on the board", () => {
    renderDayBoard();
    const body = document.body.textContent || "";
    expect(/Scheduled|In Progress|Completed/.test(body)).toBe(true);
    // No seed job is cancelled, and cancelled jobs must not appear on the board.
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
  });

  it("dragging a board job into Pending clears its date but keeps the technician", () => {
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Miller Residence (seed job 1, Scheduled) starts on Peter's lane — not pending.
    expect(within(aside).queryByText("Miller Residence")).not.toBeInTheDocument();

    const card = laneCardFor("Miller Residence");
    const dt = makeDataTransfer();
    fireEvent.dragStart(card, { dataTransfer: dt });
    fireEvent.drop(aside, { dataTransfer: dt });

    // Now it sits in the Pending column with a no-date placeholder.
    const moved = within(aside).getByText("Miller Residence").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(moved).getByText(/--:--/)).toBeInTheDocument();
  });

  it("an in-progress job dragged to Pending becomes unscheduled (Paused removed from the model)", () => {
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Taylor Home (seed job 2) is In Progress on Peter's lane.
    const card = laneCardFor("Taylor Home");
    const dt = makeDataTransfer();
    fireEvent.dragStart(card, { dataTransfer: dt });
    fireEvent.drop(aside, { dataTransfer: dt });

    // Date cleared (→ unscheduled), technician kept; no "Paused" status anymore.
    const moved = within(aside).getByText("Taylor Home").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(moved).getByText("Unscheduled")).toBeInTheDocument();
    expect(within(moved).queryByText("Paused")).not.toBeInTheDocument();
    expect(within(moved).getByText(/--:--/)).toBeInTheDocument();
  });

  it("shows the job-type legend with the five Figma types", () => {
    renderDayBoard();
    const legend = screen.getByTestId("job-type-legend");
    ["Service", "Maintenance", "Installation", "Estimate", "Emergency"].forEach((label) => {
      expect(within(legend).getByText(label)).toBeInTheDocument();
    });
  });

  it("Pending cards show the derived state badge (Unscheduled / Unassigned)", () => {
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Reyes Home (seed 16) has no date → "Unscheduled".
    const reyes = within(aside).getByText("Reyes Home").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(reyes).getByText("Unscheduled")).toBeInTheDocument();
    // Garcia Residence (seed 12) has a date but no technician → "Unassigned".
    const garcia = within(aside).getByText("Garcia Residence").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(garcia).getByText("Unassigned")).toBeInTheDocument();
  });

  it("locks completed jobs on the board: not draggable; others stay draggable", () => {
    renderDayBoard();
    // Johnson Residence (seed job 4) is Completed in Peter's lane → locked.
    const completedCard = screen
      .getAllByText("Johnson Residence")[0]
      .closest('[data-job-card="true"]') as HTMLElement | null;
    expect(completedCard).not.toBeNull();
    expect(completedCard).toHaveAttribute("draggable", "false");

    // Miller Residence (seed job 1) is Scheduled → still draggable.
    const scheduledCard = screen
      .getAllByText("Miller Residence")[0]
      .closest('[data-job-card="true"]') as HTMLElement | null;
    expect(scheduledCard).not.toBeNull();
    expect(scheduledCard).toHaveAttribute("draggable", "true");
  });

  it("'unassigned' filter excludes a dragged-back job that kept its technician", () => {
    // QA bug: the filter looked like "unassigned OR unscheduled" because every
    // unscheduled seed job was also tech-less. A real dragged-back job (Reyes,
    // seed 16) keeps its tech, so it must NOT appear under "unassigned".
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    const select = within(aside).getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "unassigned" } });
    expect(within(aside).queryByText("Reyes Home")).not.toBeInTheDocument();      // unscheduled but assigned
    expect(within(aside).getByText("Garcia Residence")).toBeInTheDocument();      // dated, no tech
    expect(within(aside).getByText("Clark Residence")).toBeInTheDocument();       // no date, no tech
  });

  it("'unassigned + unscheduled' filter shows the UNION, not the intersection", () => {
    // QA bug: it returned only jobs that were BOTH (the intersection). The "+"
    // is a union — every pending job missing a date OR a technician shows.
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    const select = within(aside).getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "both" } });
    expect(within(aside).getByText("Garcia Residence")).toBeInTheDocument();      // unassigned only
    expect(within(aside).getByText("Reyes Home")).toBeInTheDocument();            // unscheduled only
    expect(within(aside).getByText("Clark Residence")).toBeInTheDocument();       // both
  });

  it("a job that is BOTH unscheduled and unassigned shows BOTH tags on its card", () => {
    // QA root cause: a single priority badge hid the overlap, making the filter
    // look broken. Clark (seed 15: no date, no tech) must show both tags.
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    const clark = within(aside).getByText("Clark Residence").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(clark).getByText("Unscheduled")).toBeInTheDocument();
    expect(within(clark).getByText("Unassigned")).toBeInTheDocument();
  });

  it("panel agrees with the card: an unscheduled job's panel shows 'No date set', not a time", () => {
    // QA bug: the detail panel hardcoded start–end and ignored the unscheduled
    // flag, so it showed a real time + "Scheduled" while the card showed --:--.
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    fireEvent.click(within(aside).getByText("Clark Residence").closest('[data-job-card="true"]') as HTMLElement);
    expect(screen.getByText("No date set")).toBeInTheDocument();
  });

  it("lifecycle lock: a completed job's Reschedule button is disabled (§7.3)", () => {
    // QA bug: Reschedule fired on a Completed job and opened a Create dialog.
    renderDayBoard();
    fireEvent.click(screen.getAllByText("Johnson Residence")[0].closest('[data-job-card="true"]') as HTMLElement);
    expect(screen.getByRole("button", { name: "Reschedule" })).toBeDisabled();
  });

  it("a scheduled job's Reschedule button stays enabled (not over-locked)", () => {
    renderDayBoard();
    fireEvent.click(screen.getAllByText("Miller Residence")[0].closest('[data-job-card="true"]') as HTMLElement);
    expect(screen.getByRole("button", { name: "Reschedule" })).toBeEnabled();
  });

  it("Edit opens an in-place dialog for the SAME job (BUG-002: no nav to a mismatched record)", () => {
    // QA BUG-002: Edit navigated to /jobs/:id, which (for a calendar job not in
    // jobsStore) fell back to an unrelated mock record. Edit now edits in place.
    renderDayBoard();
    fireEvent.click(screen.getAllByText("Miller Residence")[0].closest('[data-job-card="true"]') as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit job #1")).toBeInTheDocument();                  // the clicked job, in place
    expect(screen.getByDisplayValue("Miller Residence")).toBeInTheDocument();     // its real client, editable
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("unification (BUG-006): a week-origin unscheduled job shows in DAY pending (one shared collection)", () => {
    // "Reyes Office" used to live ONLY in the week dataset. With a single
    // date-windowed collection, an unscheduled job is date-agnostic and appears
    // in the pending drawer on every view — proof the views share one source.
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    expect(within(aside).getByText("Reyes Office")).toBeInTheDocument();
  });

  it("lifecycle lock: a completed job's Edit button is disabled (§7.3)", () => {
    renderDayBoard();
    fireEvent.click(screen.getAllByText("Johnson Residence")[0].closest('[data-job-card="true"]') as HTMLElement);
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  });
});

// Week view (Figma node 759:5307): a vertical stack of expandable day sections,
// each with the technician×time grid, plus the job-type legend. This is a smoke
// test that the stacked-day week layout mounts and renders day headers.
describe("Calendar — week view (integration)", () => {
  beforeEach(() => {
    localStorage.setItem("vision360.calendar.viewMode", "week");
    businessHoursStore.setRows(DEFAULT_BUSINESS_HOURS.map((r) => ({ ...r, open: true })));
  });

  it("renders the stacked day-section headers and the job-type legend", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    // One header row per day of the week → at least 5 weekday-prefixed labels.
    const dayHeaders = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/);
    expect(dayHeaders.length).toBeGreaterThanOrEqual(5);
    // Legend is shared across views and must be present in week mode too.
    const legend = screen.getByTestId("job-type-legend");
    ["Service", "Maintenance", "Installation", "Estimate", "Emergency"].forEach((label) => {
      expect(within(legend).getByText(label)).toBeInTheDocument();
    });
  });

  it("collapses every day except today by default (only today shows tech lanes)", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    // Technician lane headers only render inside an EXPANDED day section. With
    // all business days open and the collapse-all-but-today default, exactly
    // one day (today) is expanded → each technician appears exactly once.
    expect(screen.getAllByText("Peter Novak")).toHaveLength(1);
    expect(screen.getAllByText("Travis Brown")).toHaveLength(1);
    expect(screen.getAllByText("Maria Garcia")).toHaveLength(1);
  });

  it("the 'scheduled' filter label is bare — 'Show scheduled', no time-scope suffix (Figma)", () => {
    // Figma: the dropdown reads "Show scheduled" with no "today / this week /
    // this month" suffix on any view. The filter still windows to the active
    // calendar scope via pendingSource; only the LABEL drops the suffix.
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("option", { name: "Show scheduled" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Show scheduled today" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Show scheduled this week" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Show scheduled this month" })).not.toBeInTheDocument();
  });

  it("shows the Pending drawer with week pending jobs", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Seeded week pending jobs (unassigned / unscheduled) show in the week drawer.
    expect(within(aside).getByText("Diaz Home")).toBeInTheDocument();
    expect(within(aside).getByText("Reyes Office")).toBeInTheDocument();
  });

  it("drag a scheduled WEEK job to Pending → unscheduled (off the board, in the drawer)", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Smith Resi… (unified id 17 = old week id 1 + 16) is scheduled+assigned → NOT pending yet.
    expect(within(aside).queryByText("Smith Resi...")).not.toBeInTheDocument();
    // Simulate dropping a week board card onto the drawer (week: payload).
    const dt = makeDataTransfer();
    dt.setData("text/plain", "week:17");
    fireEvent.drop(aside, { dataTransfer: dt });
    // Now it's pending (unscheduled) and appears in the drawer.
    const moved = within(aside).getByText("Smith Resi...").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(moved).getByText(/--:--/)).toBeInTheDocument();
  });
});

// Month view (Figma node 761:17962): a 7-column weekday grid of date cells with
// colour-coded job cards + "+N more" overflow, the job-type legend, and a month
// date nav. Smoke test that the month grid mounts with the weekday header.
describe("Calendar — month view (integration)", () => {
  beforeEach(() => {
    localStorage.setItem("vision360.calendar.viewMode", "month");
    businessHoursStore.setRows(DEFAULT_BUSINESS_HOURS.map((r) => ({ ...r, open: true })));
  });

  it("renders the 7 weekday column headers and the job-type legend", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Calendar />
      </MemoryRouter>,
    );
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
      expect(screen.getAllByText(d).length).toBeGreaterThan(0);
    });
    const legend = screen.getByTestId("job-type-legend");
    expect(within(legend).getByText("Installation")).toBeInTheDocument();
  });
});
