# Phase 1 — Setup Notes

## PRD Location
- Source: `~/Downloads/MVP-Product-Requirements.docx` (v1.9, 2026-05-25, 6,442 lines)
- Extracted to: `mvp-product-requirements.md` (via pandoc)
- No adjacent `vision360-ui-refinement-task.md` or `vision360-tab-audit-task.md` found in the repo.

## Codebase Map

### Framework & Tooling
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS
- **Router**: react-router-dom (browser router)
- **State**: Zustand stores + local useState
- **UI primitives**: shadcn/ui (Radix) + custom components
- **Icons**: Google Material Icons font
- **String source**: Hardcoded (no i18n library in use)

### Routes (src/app/routes.tsx)
All pages live under a single `/` Layout shell. Key routes:
- `/` → Home
- `/calendar` → Calendar
- `/clients`, `/clients/:id`, `/clients/new` → Client list/detail/create
- `/jobs`, `/jobs/:id`, `/jobs/new` → Job list/detail/create
- `/estimates`, `/estimates/:id`, `/estimates/new`
- `/invoices`, `/invoices/:id`, `/invoices/new`
- `/payments`, `/payments/new`, `/payments/:id`
- `/expenses`, `/expenses/new`, `/expenses/:id`
- `/items`, `/items/:id`
- `/reports`
- `/settings`, `/settings/team/new`
- `/service-agreements`, `/service-agreements/new` ← live route (should be Pro/Enterprise)
- `/login`, `/register`, `/verify-2fa`, `/reset-password/*`, `/welcome`, `/setup`

### Key Source Files
| File | Purpose |
|---|---|
| `src/app/components/Layout.tsx` | Shell: left nav + top nav |
| `src/app/components/ui/page-header.tsx` | Standard record list header |
| `src/app/components/ui/kebab-menu.tsx` | Reusable kebab/dropdown |
| `src/app/pages/Clients.tsx` | Client list |
| `src/app/pages/ClientDetail.tsx` | Client detail with tabs |
| `src/app/pages/Jobs.tsx` / `JobDetail.tsx` | Job list + detail |
| `src/app/pages/Items.tsx` / `ItemDetail.tsx` | Items module |
| `src/app/pages/Estimates.tsx` / `EstimateDetail.tsx` | Estimates |
| `src/app/pages/Invoices.tsx` / `InvoiceDetail.tsx` | Invoices |
| `src/app/pages/Payments.tsx` | Payments |
| `src/app/pages/Expenses.tsx` / `CreateExpense.tsx` | Expenses |
| `src/app/pages/Home.tsx` | Homepage / Business Insight |
| `src/app/pages/Calendar.tsx` | Schedule/Calendar |
| `src/app/pages/Settings.tsx` | All settings |
| `src/app/pages/CreateClient.tsx` | Create client form |
| `src/app/pages/CreateJob.tsx` | Create job form |

### No Backend / All Data is Mock
All data is hardcoded in-component (useState + mock arrays). No API calls in scope for this audit.

## Dev Server
- `npm run dev` / `vite` — runs at `http://localhost:5173`
- No test runner configured (no jest/vitest config found at project root)

## Blockers
None. PRD read completely. Codebase mapped.
