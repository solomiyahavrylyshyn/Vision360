# Module: Homepage / Business Insight (PRD §5)

## ✅ Passing

- Homepage is the default landing page after login ✅
- Reports tab present ✅
- KPI values rounded (no decimals) ✅
- Date/period selector: Today, Yesterday, This Week, Last Week, Custom Date ✅
- KPI blocks compact/smaller style ✅
- Reports tab contains pre-built reports list ✅
- No custom report builder ✅ (pre-built only)

## ❌ Failing

**HM-01** — Homepage has **4 tabs** instead of the 2 specified in PRD §5.2. Implementation tabs: "All Business", "Sales Performance", "Financial Performance", "Reports". PRD requires exactly: **Dashboards, Reports**.  
*File*: `Home.tsx:83`

**HM-02** — "Dashboards" tab name absent. The combined dashboard content is split across 3 tabs with different names; the PRD-specified "Dashboards" label doesn't exist.  
*File*: `Home.tsx:83`

**HM-03** — "Others" category in chart data (`Home.tsx:25`). PRD §1.5 bans "Others" as a category.  
*File*: `Home.tsx:25`

## ⚠️ Open Questions

- PRD §5.3 KPI Metrics: Jobs Today, Revenue, In Progress, Completed. Are all 4 present on the Home dashboard?
- PRD §5.5 Report categories (13 reports listed). Does the Reports tab include all 13? (Revenue, Expense, Gross Profit, Job, Invoice Summary, Account Receivable, Client, Team, Sales Tax, Item Usage, Payment, Estimate, Estimate Conversion)
- PRD §5.6 Sample Company: "Premium Services" — no evidence of this in the codebase. No company switcher found.
- PRD §5.4 Date selector position: "Top of the page, above KPI blocks". Verify positioning.
