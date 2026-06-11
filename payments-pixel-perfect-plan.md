# Payments module — pixel-perfect implementation plan (Figma ⇄ prototype)

Source: Figma page **"payments"** (`node 1038-62628`), audited frame-by-frame on 2026-06-11 — main page (+ edit columns / filters / change statuses / row actions / actions / bulk actions), inner page (details / activity), collect payment ×3 variants, "Add invoice" modal.

**Already matching** (today's implementation from Marek's call notes is largely CONFIRMED by this Figma):
quick filters (Status / Date / Methods) · Filter button · search "Search payments" · stats row (Collected / Pending / Total / Refunded) · **bulk bar = Change status + Download + X** (exact match) · advanced-filter set and order (Total min/max → Client → Invoice → Method(s) → Statuses, Clear All/Apply) · row-kebab item set (Send receipt / Download receipt / View payout / Refund / Open in new tab) · Collect vs Record naming + card-on-file plate + manual-card fields · upload allowed only on the external/record flow.

Places where the **prototype is AHEAD of the Figma** (Figma frames predate the June 11 call — flag for Valeria to update, do NOT regress):
- "Transaction number" (Figma still says "Reference #" / "Reference *").
- "New payment" button label (Figma still "Record payment").
- Estimates / Jobs / Payment date list columns (Figma main table lacks them, but its own Edit-columns modal already offers Estimate / Job / Payment date — singular).
- Refund hidden from the row kebab while multiple rows are selected (Marek's rule; not expressible in a static frame).

---

## Phase 1 — List page polish (`src/app/pages/Payments.tsx`) — S

1. **Method column**: plain text, no leading icon (Figma rows show "Check" text only).
2. **Row kebab order/grouping** per Figma: `Send receipt, Download receipt, View payout, — , Refund, Open in new tab`; Refund is regular weight (not red) and keeps the hide-when-multi-selected rule.
3. **Page kebab**: `Edit columns / — / Upload / Download` (currently 5 items incl. Change Status / Manage Duplicates / Import / Export).
4. **Edit columns modal** (new — current menu item has no handler): 2-column checkbox cards, **Number locked**; column list per Figma: Number, Client, Invoice, Method, **Estimate, Job, Payment date**, Status, Total, Note; footer Cancel / Save. Wire to column visibility (useDraggableColumns already in place).
   - Includes renaming the new columns to Figma's singular **"Estimate" / "Job"** (currently "Estimates"/"Jobs") — pending Q2.
5. **Change status modal**: restyle to Figma radio-cards + Cancel/Save (currently a select + Apply). Keep options **Completed / Pending only** (see Q3).
6. Search input width/paddings pass (≈294px, shadow-xs, 8px radius).

## Phase 2 — Payment inner page rebuild (`src/app/pages/PaymentDetail.tsx`) — M

7. **Header**: `Payment (10246-P07)` + status badge dropdown; right side = single KPI **Total price** with round green $ icon; client row = `Client: <name>` (blue) + phone/mail icons · address · **job chip `12064-J01: Plumbing repair`** (blue link, number+title format).
8. **Trailing controls**: Figma shows ONLY the kebab next to the tabs (no "Collect Payment" button) — remove the button, keep kebab (Open Invoice / Send Receipt / Download Receipt / View Payout / Refund). Pending Q7.
9. **Details tab → three cards**:
   - **Details** card — single-column stacked fields: Date, Method, Invoice (blue link), Created by, **Transaction number**, Credit card (`•••• •••• •••• 4545`). Drop the "Payout Status" field (payout lives in the kebab modal).
   - **Attachments** card — dashed dropzone: upload icon in circle, "Drop your files here, or click to browse", "SVG, PNG, JPG or GIF (max. 3MB)" (restyle of the current panel).
   - **Notes** card — header "Notes" + bordered "+" button; entries `Added Mar 10, 2026` + text with hover edit/delete; **"Show 2 more"** expander (same pattern as JobDetail notes).
10. **Activity tab**: "Activity" card; rows = circle icon + bold title ("Payment recorded", "Payment completed") + sub ("by Marek Stroz", "Invoice balance updated") + right-aligned timestamp `Feb 25, 2026 09:18`.

## Phase 3 — Collect / Record payment form rebuild (`src/app/pages/CreatePayment.tsx`) — L

11. **Layout**: left section-label rail (**Details\*, Invoices\*, Upload files, Notes**) with dividers, like Create job; back chevron + "Collect payment"/"Record payment" title.
12. **Details section**: Payment date* (calendar input) + Payment method* select; method-dependent block below:
    - Credit card on file → black VISA plate `•••• •••• •••• 4242` + green check (restyle of current row);
    - external → **Transaction number*** (Figma's stale "Reference *" — keep our newer name);
    - Type card manually → card grid (already exists; align to 2-col layout).
    - **No standalone Amount field** in Figma — amount derives from selected invoices (see Q5 before removing ours).
13. **Invoices\* section — multi-select table** (replaces the single select):
    search "Search invoices…" + blue **"Add invoice"** button → **"Add invoice" modal**: checkbox cards (`INV-1234` + status badge, job link `12356-J01`, job title, "Due date: April 30, 2026", amount right), Cancel/Save.
    Selected table: `Number · Job (number+title, blue) · Status (Partially paid amber) · Due date · Total · row kebab`; footer `Total: $5464`.
14. **Upload files section** — dashed dropzone, rendered ONLY on the record/external flow (matches Marek's "no uploads at card charge").
15. **Notes** section + footer **Cancel / Collect payment | Record payment** (primary disabled until valid) — exists, align spacing.
16. Payment model: support multiple invoice links per payment (`invoiceNumbers[]`) so the list "Invoice(s)" column and detail page reflect multi-invoice payments.

---

## ⚠️ Open questions (Valeria / Marek)

1. **Figma is stale vs June 11 decisions** — update frames: "Reference #/Reference" → *Transaction number*; "Record payment" list button → *New payment*; main-table columns to include Estimate/Job/Payment date.
2. **Column naming**: Figma edit-columns uses singular **Estimate / Job**; Marek's notes said "Estimates, Jobs". Pick one (suggest Figma's singular).
3. **Change-status modal includes "Refunded"** — that's bulk refund through the back door, which Marek explicitly forbade. Suggest removing Refunded from the modal in Figma; prototype keeps Completed/Pending.
4. **No Amount field on collect/record form** — full-balance collection of selected invoices is implied. How is a PARTIAL payment entered (Marek explicitly supports partials)? Per-invoice amount via the row kebab? Needs a decision before we drop the Amount field.
5. **Refunded rows in the list**: prototype shows signed `−$200` total; Figma shows plain `$850`. Keep the minus?
6. **PaymentDetail has no "Collect Payment" button** in Figma (kebab only) — confirm removal.

## Suggested order & size

| Phase | Scope | Size |
|---|---|---|
| 1 | List polish: method text, kebab order, page kebab, edit-columns modal, change-status modal | S/M |
| 2 | Inner page: header, 3 cards, activity | M |
| 3 | Collect/Record form: section rail, invoice multi-select + Add invoice modal, upload section | L (gate items 12-13 on Q4) |

Phases independent; 1 → 2 → 3 recommended. Q4 (partial payments) is the only blocker, and only for phase 3's amount handling.
