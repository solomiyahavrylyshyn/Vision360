import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Estimates } from "./Estimates";

// Walkthrough-13: the estimate list shows the estimate number (E01…E12) as a
// small sub-line in the Estimate column (same pattern as the job number),
// rather than a separate column. Estimates provides its own DnD context, so a
// router wrapper is all that's needed to mount it.
describe("Estimates — estimate number sub-line", () => {
  it("renders estimate numbers (NNNNN-E0N) in the list", () => {
    render(
      <MemoryRouter initialEntries={["/estimates"]}>
        <Estimates />
      </MemoryRouter>,
    );
    const numbers = screen.getAllByText(/^\d{4,6}-E\d{2}$/);
    expect(numbers.length).toBeGreaterThan(0);
  });

  it("renders columns in Figma order: Estimate · Client · Job · Technician · Status · Amount", () => {
    render(
      <MemoryRouter initialEntries={["/estimates"]}>
        <Estimates />
      </MemoryRouter>,
    );
    const wanted = ["Estimate", "Client", "Job", "Technician", "Status", "Amount"];
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent?.trim() || "");
    const seq = headers
      .map((t) => wanted.find((w) => t.startsWith(w)))
      .filter((w): w is string => Boolean(w));
    expect(seq).toEqual(wanted);
  });
});
