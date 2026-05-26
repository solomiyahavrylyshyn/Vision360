# Module: Payments (PRD §11)

## ✅ Passing

- Payments list page header layout ✅
- Quick filters: Status, Date, Method ✅
- List kebab: Edit Columns, Import, Export (matches PRD §11.9 exactly) ✅
- "Create Payment" button ✅
- No Delete action (row kebab uses "Refund" — context-appropriate) ✅

## ❌ Failing

**PY-01** — Count format: "X records" instead of "(N)" e.g. "Payments (28)".

**PY-02** — Payment status colors not verified. PRD §11.4: Completed (Green), Pending (Yellow), Failed (Red), Refunded (Gray). Manual check required.  
*File*: `Payments.tsx`, `PaymentDetail.tsx`

## ⚠️ Open Questions

- PRD §11.9 does NOT list "Manage Duplicates" or "Inactivate Selected" in Payments kebab. The implementation adds "Manage Duplicates" and a "Change Status" item — these are extras not in PRD. Is this intentional?
- PRD §11.5 Collect Payment form: verify pre-population when entering from Invoice page vs. Client kebab vs. standalone.
- Verify payment method dropdown includes: Stripe, Zelle, Cash App, Cash, Check (all 5 per PRD §11.2).
