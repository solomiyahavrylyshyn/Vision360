# Module: Invoices (PRD §10)

## ✅ Passing

- Invoices list page header layout ✅
- Quick filters: Status, Invoice Date, Balance ✅
- Invoice Partially Paid = Yellow ✅
- Invoice Paid = Green ✅
- Invoice Void = Gray ✅
- "Void" action available (PRD §10.11 record-level) ✅
- Payments tab present ✅
- Activity tab present ✅
- List kebab: Edit Columns, Manage Duplicates, Import, Export ✅
- Inactivate Selected in SelectionBar ✅
- No Delete on invoices ✅ (only Void)

## ❌ Failing

**IN-01** — "Notes" tab missing from Invoice detail. PRD §10.4 specifies: Details, Payments, Notes, Activity. Implementation has 3: Invoice Details, Payments, Activity.  
*File*: `InvoiceDetail.tsx:260–266`

**IN-02** — "Details" tab labeled "Invoice Details" — should be "Details" per PRD §10.4.  
*File*: `InvoiceDetail.tsx`

**IN-03** — Invoice "Unpaid" status color is **neutral gray** (#546478 text, #F3F4F6 bg) — PRD §10.3 says "Unpaid = Red".  
*File*: `InvoiceDetail.tsx:35`

**IN-04** — Invoice "Overdue" status is named "**Unpaid-Overdue**" in code. PRD §10.3 calls it simply "Overdue".  
*File*: `InvoiceDetail.tsx:10, 36`

**IN-05** — No automatic flip from Unpaid → Overdue after due date. PRD §10.16 requires automatic status change.

**IN-06** — Bulk confirm modal says "**Archive** invoices?" and button says "**Archive**" (`Invoices.tsx:590, 600`). Should say "Inactivate".

**IN-07** — "Inactivate Selected" is in SelectionBar but NOT in the kebab menu. PRD §10.11 requires it in the kebab.

**IN-08** — Count format: "X records" instead of "(N)" e.g. "Invoices (45)".

## ⚠️ Open Questions

- PRD §10.8 specifies invoice numbering format: "Customer Number + Slash + Sequential" e.g. "10245/I-001". Is this format enforced in mock data / template?
- PRD §10.18 bulk actions include "Send Reminders" and "Void Selected" — are these in the SelectionBar?
- Invoice total visible in top-right at all times (even when items overflow) — manual verification needed.
