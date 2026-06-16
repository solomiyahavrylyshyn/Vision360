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

// Broader RBAC coverage: presets, the edit→custom flip, cross-feature gating,
// and the custom-preset lifecycle.
describe("NewUser — RBAC presets, gating & custom presets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Admin unlocks Estimates/Invoices/Payments levels that the Employee preset hides", async () => {
    const user = userEvent.setup();
    renderForm();
    // Employee (default): those module sections are off, so their level rows are hidden.
    expect(screen.queryByText(/create, edit, and archive estimates/)).not.toBeInTheDocument();
    expect(screen.queryByText(/void, and archive/)).not.toBeInTheDocument();
    expect(screen.queryByText(/collect, edit, and refund/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(screen.getByText(/create, edit, and archive estimates/)).toBeInTheDocument();   // Estimates top tier
    expect(screen.getByText(/void, and archive/)).toBeInTheDocument();                     // Invoices top tier
    expect(screen.getByText(/collect, edit, and refund/)).toBeInTheDocument();             // Payments top tier
  });

  it("editing any permission flips the preset to Custom (offers save-as-preset)", async () => {
    const user = userEvent.setup();
    renderForm();
    // Not custom initially → the save-as-preset affordance is absent.
    expect(screen.queryByText("Save current settings as preset")).not.toBeInTheDocument();
    // Employee has Schedule enabled; choosing a different level flips to Custom.
    await user.click(screen.getByRole("button", { name: "View everyone's schedule" }));
    expect(screen.getByText("Save current settings as preset")).toBeInTheDocument();
  });

  it("Jobs create/edit is gated by an edit-level Schedule permission", async () => {
    const user = userEvent.setup();
    renderForm();
    // Employee: Schedule is view/complete-own → the Jobs "View, create, and edit" tier is locked.
    expect(screen.getByRole("button", { name: "View, create, and edit" })).toBeDisabled();
    // Admin: Schedule is edit-and-delete-all → the same tier unlocks.
    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(screen.getByRole("button", { name: "View, create, and edit" })).toBeEnabled();
  });

  it("saves a custom preset, lists it, and deletes it again", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: /Save current settings as preset/ }));
    await user.type(screen.getByPlaceholderText(/Field Tech, Dispatcher/), "Dispatcher");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // The new preset appears as a selectable radio…
    expect(screen.getByRole("button", { name: "Dispatcher" })).toBeInTheDocument();
    // …and can be deleted again (the delete control is an icon button with a title).
    await user.click(screen.getByTitle('Delete "Dispatcher"'));
    expect(screen.queryByRole("button", { name: "Dispatcher" })).not.toBeInTheDocument();
  });
});
