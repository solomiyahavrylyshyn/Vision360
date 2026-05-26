# Module: Expenses (PRD §12)

## ✅ Passing

- Expenses list page header layout ✅
- Quick filters: Category, Date, Vendor ✅
- Category field is `<select>` dropdown ✅
- Date defaults to today ✅
- List kebab: Edit Columns, Import, Export (matches PRD §12.9) ✅
- "Delete Expense" allowed per PRD §12.9 ✅
- Receipt upload section present ✅
- "Add Another Expense" batch entry feature referenced in codebase (`?fromJob` query param pattern) ✅
- Inactivate Selected in SelectionBar ✅

## ❌ Failing

**EX-01** — Vendor field is a **free text `<input>`** (`merchant` variable, line 62). PRD §12.2 says "Vendor: Must be dropdown, not free text!".  
*File*: `CreateExpense.tsx:62, 326–328`

**EX-02** — Vendor field is **labeled "Merchant"** in the UI (`CreateExpense.tsx:322, 1025`). PRD uses the term "Vendor" throughout.

**EX-03** — Count format: "X records" instead of "(N)" e.g. "Expenses (47)".

## ⚠️ Open Questions

- PRD §12.9 does NOT include "Manage Duplicates" or "Inactivate Selected" in the Expenses list kebab. Implementation adds "Change Status" and "Manage Duplicates" — extras not in PRD.
- PRD §12.5 "Add Another Expense" copies vendor/job/category from previous entry. Verify this pre-population actually works when clicking "Add Another Expense" from an expense record.
- Verify that Invoice Number (vendor's invoice # for reference) field is present in the form.
