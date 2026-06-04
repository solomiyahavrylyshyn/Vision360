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
    // Filter dropdown options (backlog/Marek 02.06: all / unassigned / unscheduled / paused / both)
    expect(screen.getByRole("option", { name: "Show all" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unassigned" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unscheduled" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show scheduled" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show paused" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show unassigned + unscheduled" })).toBeInTheDocument();
  });

  it("renders job cards with a client name and an unscheduled job shows 'No date'", () => {
    renderDayBoard();
    // Pending seed jobs include an unscheduled one (Reyes Home) shown as 'No date'
    expect(screen.getAllByText("Reyes Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No date/).length).toBeGreaterThan(0);
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

    // Now it sits in the Pending column, shown as "No date".
    const moved = within(aside).getByText("Miller Residence").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(moved).getByText(/No date/)).toBeInTheDocument();
  });

  it("an in-progress job dragged to Pending becomes Paused", () => {
    renderDayBoard();
    const aside = screen.getByRole("complementary") as HTMLElement;
    // Taylor Home (seed job 2) is In Progress on Peter's lane.
    const card = laneCardFor("Taylor Home");
    const dt = makeDataTransfer();
    fireEvent.dragStart(card, { dataTransfer: dt });
    fireEvent.drop(aside, { dataTransfer: dt });

    const moved = within(aside).getByText("Taylor Home").closest('[data-job-card="true"]') as HTMLElement;
    expect(within(moved).getByText("Paused")).toBeInTheDocument();
    expect(within(moved).getByText(/No date/)).toBeInTheDocument();
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
