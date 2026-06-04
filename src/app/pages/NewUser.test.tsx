import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { NewUser } from "./NewUser";

// Integration test for the RBAC change "Replace Show pricing with Items":
// the New User form must expose an Items permission (role-based capability
// ladder per Marek's matrix) in place of the old simple "Show pricing" toggle.
const renderForm = () =>
  render(
    <MemoryRouter>
      <NewUser />
    </MemoryRouter>,
  );

describe("NewUser — Items permission replaces Show pricing", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an Items section and removes the old Show pricing section", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: "Items" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Show pricing" })).not.toBeInTheDocument();
    // Show job profit is intentionally kept.
    expect(screen.getByRole("heading", { name: "Show job profit" })).toBeInTheDocument();
  });

  it("exposes the 5 role tiers when Items is enabled (Admin preset)", async () => {
    const user = userEvent.setup();
    renderForm();
    // Employee preset (default) has Items off, so the tiers are hidden.
    expect(screen.queryByText("View sell price")).not.toBeInTheDocument();

    // The Admin preset enables Items (fullControl) → all five tiers render.
    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(screen.getByText("View sell price")).toBeInTheDocument();                       // CSR / Dispatch
    expect(screen.getByText(/discount within limit/)).toBeInTheDocument();                 // Sales / Technician
    expect(screen.getByText(/approve lower-price overrides/)).toBeInTheDocument();         // Manager
    expect(screen.getByText(/cost, and taxes; create items/)).toBeInTheDocument();         // Accounting / Purchasing
    expect(screen.getByText(/delete \/ deactivate items/)).toBeInTheDocument();            // Admin (Item Master)
  });
});
