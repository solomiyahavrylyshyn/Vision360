# Phase 6 — Status & Color Audit

> **Legend**: ✅ Match | ❌ Mismatch | ⚠️ Partial

---

## Client Statuses (PRD §6.3)

| Status | PRD Color | PRD Trigger | Actual Status | Actual Color | Trigger in Code | Match? |
|---|---|---|---|---|---|---|
| Prospect | Blue/Neutral | Initial record creation | **NOT IMPLEMENTED** | — | — | ❌ |
| Active | Green | Auto: invoice > $0 + payment collected | Active | "Active" label only, no color badge in list | Manual toggle (kebab) | ❌ |
| On Hold | Red | Manual or rule-based when balance > threshold | **NOT IMPLEMENTED** | — | — | ❌ |
| Archived | Dark Gray | Manual | **"Inactive"** (different name) | No dedicated badge color | Manual toggle | ❌ |

**Critical**: Client status system only has "Active" / "Inactive". Missing: Prospect, On Hold, Archived.  
**Critical**: No automatic Prospect → Active transition on first paid invoice.  
**File**: `Clients.tsx:40` — `status?: "Active" | "Inactive"`

---

## Job Statuses (PRD §7.17)

| Status | PRD Color | PRD Trigger | Actual Color | Trigger in Code | Match? |
|---|---|---|---|---|---|
| Scheduled | Blue | Default on creation | `#EBF0F8` bg / `#4A6FA5` text | Default | ✅ |
| In Progress | Yellow/Orange | Manual status change | `#FEF3C7` bg / `#D97706` text | Manual | ✅ |
| Completed | Green | Manual status change | `#DCFCE7` bg / `#16A34A` text | Manual | ✅ |

**File**: `Jobs.tsx:38–47`  
**Verdict: ✅ Pass** — all 3 statuses match PRD colors and triggers.

**Note**: PRD §7.17 says "Unscheduled" is NOT in MVP — confirmed absent. ✅

---

## Estimate Statuses (PRD §9.5)

| Status | PRD Color | PRD Trigger | Actual Color | Trigger in Code | Match? |
|---|---|---|---|---|---|
| Draft | **Gray** | Initial creation | `#EDE9FE` bg / `#7C3AED` text (**Purple!**) | Initial | ❌ |
| Sent | Blue | User clicks "Send" | `#DBEAFE` bg / `#1E40AF` text (blue) | — | ✅ |
| Viewed | Yellow | Customer opens email | `#FEF3C7` bg / `#92400E` text (yellow) | — | ✅ |
| Approved | Green | Customer signs | `#DCFCE7` bg / `#166534` text (green) | — | ✅ |
| Rejected | Red | Customer clicks reject | `#FEE2E2` bg / `#DC2626` text (red) | — | ✅ |
| Expired | Dark Gray | Auto after 30 days | `#F3F4F6` bg / `#6B7280` text (gray) | Manual (no auto-expire logic) | ⚠️ |
| Archived | Gray | Manual | `#1F2937` bg / `#FFFFFF` text (**inverted, very dark!**) | Manual | ⚠️ |

**File**: `EstimateDetail.tsx:45–52`  
**Critical**: Draft uses Purple (#7C3AED) — PRD says Gray.  
**Medium**: Auto-expiry after 30 days not implemented (mock data only).  
**Low**: "Archived" badge uses dark bg/white text instead of gray.

---

## Invoice Statuses (PRD §10.3)

| Status | PRD Color | PRD Trigger | Actual Status Name | Actual Color | Trigger in Code | Match? |
|---|---|---|---|---|---|---|
| Unpaid | **Red** | Invoice sent, no payment | Unpaid | `#F3F4F6` bg / `#546478` text (**Neutral/Gray!**) | Default | ❌ |
| Overdue | Dark Red | Auto past due date | **"Unpaid-Overdue"** (wrong name) | `#FEE2E2` bg / `#EF4444` text (red) | Manual in mock data | ⚠️ |
| Partially Paid | Yellow | Some payment received | Partially Paid | `#FEF3C7` bg / `#D97706` text | — | ✅ |
| Paid | Green | Full payment | Paid | `#DCFCE7` bg / `#16A34A` text | — | ✅ |
| Void | Gray | Invoice cancelled | Void | `#F3F4F6` bg / `#9CA3AF` text | — | ✅ |

**File**: `InvoiceDetail.tsx:34–40`  
**Critical**: "Unpaid" should be Red per PRD — is currently gray/neutral.  
**Medium**: Status is named "Unpaid-Overdue" in code; PRD calls it "Overdue".  
**Medium**: No automatic flip to Overdue on due date (PRD §10.16 requires auto-flip).

---

## Payment Statuses (PRD §11.4)

| Status | PRD Color | Actual Color | Match? |
|---|---|---|---|
| Completed | Green | Not verified in detail | ❓ |
| Pending | Yellow | Not verified in detail | ❓ |
| Failed | Red | Not verified in detail | ❓ |
| Refunded | Gray | Not verified in detail | ❓ |

> PaymentDetail.tsx not deeply audited; colors were not retrieved. Flag for manual verification.

---

## Item Statuses

| Status | PRD | Actual | Match? |
|---|---|---|---|
| Active | ✅ | Active | ✅ |
| Inactive | ✅ | Inactive | ✅ |

---

## Special Status Transition Checks

| Rule | Status | Details |
|---|---|---|
| Client Prospect → Active: **automatic** on first paid invoice | ❌ Fail | No such logic exists; only manual Active/Inactive toggle |
| Jobs auto-schedule on creation (no "Unscheduled" workflow) | ✅ Pass | No "Unscheduled" status in Jobs |
| Estimate auto-expires after 30 days | ❌ Fail | No timer/auto-expire logic in frontend mock |
| Invoice auto-flips to Overdue past due date | ❌ Fail | No auto-flip logic; status is manually set in mock data |

---

## Summary

| Module | Pass | Fail | Partial |
|---|---|---|---|
| Client | 0 | 4 | 0 |
| Job | 3 | 0 | 0 |
| Estimate | 4 | 1 | 2 |
| Invoice | 2 | 2 | 1 |
| Payment | 0 | 0 | 4 (unverified) |
| Items | 2 | 0 | 0 |
| **Auto-transitions** | 1 | 3 | 0 |
