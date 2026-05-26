# Tab Inventory — Vision360 FSM

Generated: 2026-05-26
Scope: every place tabs appear in the React app under `src/app/`.

## Tab primitives present in the codebase

| Primitive | File | Used by |
|---|---|---|
| Radix `Tabs` wrapper (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) | `src/app/components/ui/tabs.tsx` | **Not used anywhere** in pages (grep returns 0 imports). Imported only by `calendar.tsx` design system file. |
| Custom `DetailTabs` (button-based, no ARIA roles) | `src/app/components/ui/detail-tabs.tsx` | Client / Estimate / Invoice / Item / Expense detail pages |
| Custom inline tab buttons (no shared component) | inline | Job detail, Payment detail, Items list, Home, Reports, Calendar viewMode, Dialer, Notes/Documents sub-tabs |
| URL search-param navigation | `useSearchParams("section")` | Settings (sidebar, not really tabs but uses the same pattern) |

**Observation worth flagging:** the design-system Radix `Tabs` exists but is unused; every page builds its own.

---

## Primary tab groups

| # | Module | File | Route | Tab labels (in order, current) | Default | State location | Panel rendering | Permission / visibility gating |
|---|---|---|---|---|---|---|---|---|
| T1 | Clients detail | `pages/ClientDetail.tsx` | `/clients/:id` | Details · Properties (3) · Jobs (11) · Estimates · Invoices · Payments · Documents | `details` | `useState<TabKey>` + `hiddenTabs: Set<TabKey>` (local) | `renderContent()` switch | TabSettingsButton lets user hide tabs (local only) |
| T2 | Jobs detail | `pages/JobDetail.tsx` | `/jobs/:id` | Job Details · Estimate (n) · Invoices · Items · Expenses (n) | `details` | `useState<TabKey>` + `hiddenTabs: Set<TabKey>` (local) | `renderContent()` switch — switch still has `documents` and `notes` cases even though they're no longer in `BASE_TABS` | TabSettingsButton |
| T3 | Estimates detail | `pages/EstimateDetail.tsx` | `/estimates/:id` | Estimate Details · Deposit (n) · Activity (n) | `details` | `useState<TabKey>` (local) | `renderDetailsTab` / `renderDepositTab` / `renderActivityTab` | TabSettingsButton (no-op? — appears, no handler wired) |
| T4 | Invoices detail | `pages/InvoiceDetail.tsx` | `/invoices/:id` | Invoice Details · Payments (n) · Activity (n) | `details` | `useState<TabKey>` (local) | `renderDetailsTab` / `renderPaymentsTab` / `renderActivityTab` | TabSettingsButton (no-op?) |
| T5 | Payments detail | `pages/PaymentDetail.tsx` | `/payments/:id` | Payment Details · Activity | `details` | `useState<TabKey>` (local) | `renderDetails` / `renderActivity` | TabSettingsButton |
| T6 | Expense detail | `pages/ExpenseDetail.tsx` | `/expenses/:id` | **Details** · Receipts · Activity | `details` | `useState<TabKey>` (local) | `renderDetails` / `renderReceipts` / `renderActivity` | TabSettingsButton (no-op?) |
| T7 | Item detail | `pages/ItemDetail.tsx` | `/items/:id` | **Details** · Activity | `details` | `useState<TabKey>` (local) | `renderDetailsTab` / `renderActivityTab` | TabSettingsButton (no-op?) |
| T8 | Items list | `pages/Items.tsx` | `/items` | All Items · Price Book · Services · Materials · Equipment · Asset · Fees | `all` | `useState<TabKey>` (local) | Single filtered table — `tabCatMap[activeTab]` selects category filter | none |
| T9 | Home dashboard | `pages/Home.tsx` | `/` | All Business · Sales Performance · Financial Performance · Reports | `All Business` | `useState<DashTab>` + `visibleTabs` + `tabOrder` (local) | `AllBusinessTab` / `SalesPerformanceTab` / `FinancialPerformanceTab` / `ReportsTab` | Tabs can be hidden + reordered via drag |
| T10 | Reports | `pages/Reports.tsx` | `/reports` | All Business · Sales Performance · Financial Performance · Reports | `reports` | `useState` (local) | **Content does not change** — same KPI cards + report tables regardless of tab | none |
| T11 | Calendar viewMode | `pages/Calendar.tsx` | `/schedule` | Day · Week · Month | persisted from localStorage; default `week` | `useState<ViewMode>` + `localStorage` persistence | renders one of 3 calendar views | none |
| T12 | Settings sidebar | `pages/Settings.tsx` | `/settings?section=…` | Many: Company info, Company profile, Manage team, Billing & plan, General, Jobs, Estimates, Invoices, Items, **Relationships**, Payments (finance), Connected apps | `companyInfo` | `useState<SettingsSection>` + URL `?section=` synced via `useSearchParams` | Per-section conditional render block | section aliases handle legacy URLs |
| T13 | Dialer | `components/Dialer.tsx` | overlay | Recents · Contacts · Keypad | `Keypad` | `useState<Tab>` (local) | One panel rendered conditionally | none |

---

## Sub-tab groups (inside a parent tab panel)

| # | Parent | Sub-tab labels | Default | State | Notes |
|---|---|---|---|---|---|
| S1 | JobDetail → Notes panel | **Office · Internal · Field** | `office` | `useState<"office"|"internal"|"field">` | This is the three-tab Notes structure. Labels are Office/Internal/Field (per 2026-05-25 wireframe; spec-doc proposed names `Job Notes / Field Notes / Internal Notes` are explicitly out of scope per the rules of this audit) |
| S2 | JobDetail → Attachments panel | Media · Files | `media` | `useState<"media"|"files">` | `Media (11)` count is hardcoded mock (`MOCK_PHOTOS.length`) |
| S3 | EstimateDetail → Documents | Photos · Files | `photos` | `useState<"photos"|"files">` (`docKind`) | counts dynamic from `documents.filter(isImage)` |
| S4 | EstimateDetail → Notes | Note to Client · Internal | `client` | `useState<"client"|"internal">` (`noteTab`) | |
| S5 | InvoiceDetail → Notes | Note to Client · Internal | `customer` | `useState<NotesTabKey>` (`notesTab`) | Key is `customer` here, `client` on Estimate — inconsistent (cosmetic) |
| S6 | HelpCenter | (view router, not tabs) Home / Article / Contact | `home` | `useState<View>` | Bottom footer "Docs / Contact Us" pill buttons act like tabs |

---

## State-management summary

| Property | Detail pages (T1–T7) | Items (T8) | Home (T9) | Reports (T10) | Settings (T12) | Calendar (T11) |
|---|---|---|---|---|---|---|
| URL sync | ❌ local only | ❌ | ❌ | ❌ | ✅ `?section=` | ❌ (localStorage persistence) |
| Survive reload | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Deep-linkable | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Back/forward history | Inactive — clicking tab does not push history | same | same | same | ✅ via search params | same |

**Pattern inconsistency:** Settings is the only place tabs are URL-synced. Every detail page uses local state. The audit's stretch-goal question — "should this be a single consistent pattern, e.g. `?tab=…` everywhere?" — applies.

---

## Accessibility quick scan

- `DetailTabs` and every inline tab bar uses raw `<button>` elements.
- **None of them set `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, or `aria-controls`.**
- The Radix `Tabs` primitive (which would handle ARIA for free) is imported and styled but never used in pages.
- Keyboard `Tab` reaches every trigger (default button focus), but arrow-key roving focus is not implemented — the Radix component would have given it for free.
- The `TabSettingsButton` does set `aria-label`. The tab triggers themselves do not.

---

## Notes / oddities

- **JobDetail.tsx still types `TabKey` as `"details" | "estimate" | "invoices" | "items" | "expenses" | "documents" | "notes"`** — but `BASE_TABS` only exposes the first five. The `renderContent` switch still handles `documents` and `notes` cases (dead code paths now). Not a behavioral bug, but worth flagging.
- **ExpenseDetail (T6) and ItemDetail (T7) labels are still just `"Details"`**, not `"Expense Details"` / `"Item Details"`. Per the separate UI-refinement spec §4.5, every detail page should use the explicit `{Module} Details` label. This one was overlooked when the rename was applied to Estimate / Invoice / Job / Payment.
- **Reports (T10) renders the same content regardless of which tab is active.** The tab bar is visual only — switching tabs has no observable effect besides the underline moving.
- **EstimateDetail TabSettingsButton, ItemDetail TabSettingsButton, ExpenseDetail TabSettingsButton, InvoiceDetail TabSettingsButton** are rendered without an `onClick` handler. They appear interactive but do nothing. Only ClientDetail and JobDetail have a wired-up `showTabSettings` modal.
- **Items (T8)** has a special-case branch: `activeTab === "pricebook"` renders a different table layout. Other tabs share one layout filtered by category. This is intentional but worth knowing.
- **Home (T9)** lets users drag-reorder tabs and toggle visibility. `safeTab` fallback gracefully handles the case where the active tab gets hidden.
- No tab anywhere appears to be permission-gated (no role checks before showing/hiding a tab). Roles & permissions UI is out of scope per the parent UI refinement spec §10, so this is expected.

---

End of Phase 1.
