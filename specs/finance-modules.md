# Estimates / Invoices / Payments / Expenses — spec (from Marek's Jun 1–11 calls)

> Precedence: **Marek (transcripts) > Figma > prototype**. This file records the
> confirmed rules and what the prototype now does after the Jun-2026 regression pass.

## Estimates
- **Header fields:** Client, Service address (from client), Estimate name, **two dates**:
  *Estimate creation date* (read-only, today) + *Expiration date* (editable). **No "assigned
  technician"** field — the creator IS the technician.
- **Expiration default = creation date + N days**, where N is the company **default validity**
  (Settings → Estimates → *Estimate validity*, default **30**; salespeople drop it to 2–3).
  *(Jun 11 supersedes the Jun 9 "expiry = creation date" note.)* Store: `estimateSettingsStore`.
- **Job link** = a single **job appointment** (created-from-job, not selectable) or blank when
  the estimate was made standalone (phone-in). One estimate ⇄ multiple jobs created from it.
- **List:** columns Estimate# / **Jobs (IDs only)** / Created / Status / **Amount (no decimals)**;
  bulk actions Send to client / Change status / Duplicate / Download / **Archive** (just "Archive").
- **Pickable in job/invoice estimate dropdowns:** Sent / Viewed / Approved / Expired ONLY —
  hide Draft / Rejected / Archived (`ESTIMATE_PICKABLE` in CreateJob; `INVOICE_ESTIMATE_PICKABLE`
  in CreateInvoice).
- **Convert to job** copies the estimate's line items into the new job; convert again → another job.

## Invoices
- Created from an estimate or job; **linked-jobs dropdown has a "Create new job" shortcut**;
  copy line items from the estimate (then editable); **multiple jobs** selectable; **single**
  estimate link only.
- **Single job → Job Details box** (job#, title, service address, linked estimate, due date editable).
  **More than one job → the Job Details box disappears** and the jobs move to a dedicated **Jobs
  tab** (accordion). Only the invoice-level **Memo** stays in the sidebar. *(Jun 9.)*
- **Paid invoice = locked financial document** — no editing line items, no adding/creating jobs
  (also Void). Add jobs/edit only in Unpaid / Partially Paid / Overdue. *(Jun 11.)*
- Collect-payment button hidden once Paid.

## Payments
- **Collect payment from the client** (kebab) → select **one or multiple INVOICES** (not jobs),
  totals sum, then collect. Table is invoices (invoice# / job# / status / total).
- **MVP charges ONE invoice per payment** from the invoice side; the multi-invoice convenience is
  "one invoice for many jobs". (Multi-invoice-per-payment is Pro.)
- **Refund** (`PaymentDetail` → kebab → "Refund…") opens a form: **memo/purpose (required)** +
  **manual amount** (full or partial, ≤ original) + **return method** (cash/manual vs original
  method / Stripe). Records status = Refunded with `refundAmount` / `refundMemo` / `refundMethod` /
  `refundDate`. Credit memo ≈ negative invoice. *(Jun 11.)*

## Expenses (job costing)
- Expenses link to a **JOB**, never an invoice (job costing happens at the job level).
- **Advanced filter "Link to job":** All / Linked to job / Unlinked. Plus a **specific-job** quick
  filter (type a job number). Create/Detail link target is the job only (no invoice picker).
- Fields: Description, Vendor, Category, Expense date, Total, **Document reference # (= receipt #)**,
  one job, line items. KPI tiles are **dynamic** (recompute from the active filters). *(Jun 11.)*
- **List has no "Invoice #" column** (expenses don't link to invoices): Date / Category / Vendor /
  Amount / Job # / Notes. *(EXP-1.)*
- **Duplicate** (`ExpenseDetail` kebab) copies vendor / category / description / notes / linked job
  but **leaves Amount blank** — Create Expense opens with the amount field highlighted (amber) +
  focused + helper "Enter the amount for this duplicated expense" (via `?dup=1&vendor=…&category=…`
  query params). *(EXP-3.)*
- **Dashboard** (Home → All Business) carries the **Revenue vs Expenses** grouped bar chart. *(EXP-6.)*

## Onboarding / Company setup (AUTH)
- **Company Setup (`/setup`) is non-blocking:** a **"Skip for now"** button drops the user straight
  into the app (`/welcome`) without filling the form. *(AUTH-2.)*
- Skipping flips `setupStore` to **incomplete**, which surfaces two reminders to finish (AUTH-3):
  a **bell notification** ("Finish setting up your company" → Settings) and a **dismissible amber
  banner** (Finish setup → Settings; **"Don't show again"** hides the banner but keeps the bell item).
  Saving **Company info** in Settings (or completing setup) clears both. Default state = complete, so
  the seeded demo is never nagged. Store: `setupStore` (localStorage flags).

## Reports access (RPT)
- Report permissions are **per-report, not all-or-nothing**: Settings → **Manage team → Report access**
  is a **category accordion** (Financial/Business, Estimates, Jobs, Clients/Team/Items) with a
  checkbox per report (14 total), **all enabled by default**, per-category "Select category" +
  global Select all / Clear all. *(RPT-2; the old single Reports toggle is replaced.)*

## Status (post-regression)
All items above are **implemented & browser-verified** in the Jun-2026 pass (incl. the Jun-15 quick
MVP-gap bucket: CL-6, INV-1, ITM-3, EST-2, EXP-1/3/6, AUTH-2/3, RPT-2). Known follow-ups:
per-client duration override (only per-type today); real geocoding for the dispatch map; the
orphaned demo estimates (seed `clientName`s like "John Doe" don't match any client record, so they
only show in the global Estimates list, not on a client page); Report-access grants are in-component
state (not persisted) — wire to a roles store when RBAC is finalized.
