# Phase 7 — Pro/Enterprise Gating Audit

> Verifies that Pro/Enterprise-only features are not silently functional in the Core build.
> Also checks if Pro features that are visible have the **almond/beige** color indicator (PRD §17.3).

---

## Equipment Tab on Jobs (Pro feature per §7.28)
- **Status**: ✅ Correctly absent from Job detail tabs
- `JobDetail.tsx` tabs: Job Details, Estimate, Invoices, Items, Expenses — no Equipment tab

## Activity Tab on Jobs (Pro feature per §7.28)
- **Status**: ✅ Correctly absent from Job detail tabs

## Service Agreements Tab on Clients (Pro per §6.4)
- **Status**: ⚠️ Partial
  - `ClientDetail.tsx` has `"service-agreements"` in TabKey union
  - NOT in DEFAULT_TABS (hidden from Core users) ✅
  - `/service-agreements` route exists and links to a stub `ServiceAgreements.tsx`
  - The stub says "coming soon" — not functional
  - **Gap**: The route is accessible directly via URL; no gating at route level

## Purchase Orders Tab on Clients (Pro per §6.4)
- **Status**: ✅ Defined in code but hidden from DEFAULT_TABS

## Tags on Jobs (Pro per §7.27)
- **Status**: ✅ Tags field NOT rendered in CreateJob form or JobDetail UI
- Tags exist in mock data structure only — correct

## Tags on Clients (Core per §6.2, §17.2)
- **Status**: ✅ Tags field present in Client header with count indicator

## Customer Type (Residential/Commercial) (Pro per §6.16)
- **Status**: ✅ Not rendered in CreateClient form (defined in interface but not in UI)

## Lead Source field (Pro per §6.16)
- **Status**: ✅ Not rendered in CreateClient form

## Custom Roles (Pro/Enterprise per §15.15)
- **Status**: ✅ Only Admin/Employee roles visible

## Multiple Industries (Pro per §15.15)
- **Status**: ✅ Single industry selection only (per CompanySetup)

## Route Optimization (Pro per §13.10)
- **Status**: ✅ Not present in Calendar

## QuickBooks Integration (Pro per §15.7.2)
- **Status**: ✅ Not in Integrations settings

## SMS / Twilio (Pro per §15.7.2)
- **Status**: ✅ Not present

## Custom Reports (Pro per §14.3)
- **Status**: ✅ Reports are pre-built only, no customization UI

## Inventory Tracking (Pro per §8.25)
- **Status**: ✅ Not present in Items module

## Add Recurring Service (Client kebab) (Enterprise per §6.13)
- **Status**: ✅ Not in Client kebab menu

## Activity Tab on Clients (Pro per §6.4)
- **Status**: ⚠️ Defined in TabKey but hidden from DEFAULT_TABS ✅; route accessible directly

## Appointments (removed from MVP per §3.3)
- **Status**: ⚠️ `/appointments` route exists (`Events.tsx`) — route-level access not gated

---

## Almond/Beige Color Indicators (PRD §17.3)

PRD says Pro features visible in Core should use almond/beige color highlighting.

| Check | Status |
|---|---|
| Pro features use almond/beige color | ❌ Not observed — no almond/beige treatment for Pro indicators in the current build |
| Items tabs for Pro item types | ❌ No Pro indicators visible |

---

## Summary

| Feature | Gated? | In Code? | Concern |
|---|---|---|---|
| Equipment tab (Jobs) | ✅ | No | None |
| Activity tab (Jobs) | ✅ | No | None |
| Service Agreements tab (Clients) | ⚠️ | Stub at direct URL | Route unguarded |
| Tags on Jobs | ✅ | Data only, no UI | None |
| Customer Type | ✅ | Interface only | None |
| Lead Source | ✅ | Not present | None |
| Custom Roles | ✅ | Not present | None |
| Route Optimization | ✅ | Not present | None |
| QuickBooks | ✅ | Not present | None |
| Custom Reports | ✅ | Not present | None |
| Appointments module | ⚠️ | Route exists | Route unguarded |
| Pro feature almond/beige color | ❌ | Not implemented | Visual indicator missing |
