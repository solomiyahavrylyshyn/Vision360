import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Calendar } from "./Calendar";

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
});
