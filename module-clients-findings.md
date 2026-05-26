# Module: Clients (PRD §6)

## ✅ Passing

- Client list page header layout (entity name, filters, search, create button, kebab) ✅
- Client quick filters: Status, Date Created, Balance ✅
- County filter is a dropdown (not free text) ✅
- 7 detail tabs present in correct order (Details, Properties, Jobs, Estimates, Invoices, Payments, Documents) ✅
- Tags with count indicator in client header ✅
- Notes section with count indicator ✅
- Financial summary cards (Total Revenue green, Past Due red, Balance neutral) ✅
- Back navigation with arrow icon ✅
- KPI values rounded (no decimals) ✅
- Kebab row actions: Activate/Inactivate ✅
- Bulk Select All / individual select ✅
- Inactivate Selected (in SelectionBar) ✅
- Import / Export in kebab ✅
- No "Delete" action on clients ✅
- Pro-only tabs (Activity, Equipment, Service Agreements) hidden from default tabs ✅
- Pro-only fields (Customer Type, Lead Source) not in Create Client form ✅

## ❌ Failing

**CC-01** — Client status system only has "Active"/"Inactive". PRD §6.3 requires 4 statuses: Prospect (blue), Active (green), On Hold (red), Archived (dark gray). Missing: Prospect, On Hold, Archived.  
*File*: `Clients.tsx:40`, `ClientDetail.tsx`

**CC-02** — No automatic Prospect → Active transition. PRD §6.3 says this must be automatic when invoice > $0 is created and payment collected. Currently only manual toggle exists.  
*File*: `Clients.tsx:667–670`

**CC-03** — Create Client form: "First Name OR Company Name" OR logic not enforced. Both First Name AND Last Name are unconditionally required. A business-only client (Company Name only) cannot be created.  
*File*: `CreateClient.tsx:201–207`

**CC-04** — Create Client form: Last Name is PRD-optional but form-required. PRD §6.5 lists Last Name as optional.  
*File*: `CreateClient.tsx:203`

**CC-05** — Kebab menu label: "Merge Duplicates" (PRD specifies "Manage Duplicates").  
*File*: `Clients.tsx:655`

**CC-06** — "Inactivate Selected" is in the SelectionBar bulk action area but NOT in the kebab menu itself. PRD §2.1 requires it in the kebab.  
*File*: `Clients.tsx` kebab vs SelectionBar

**CC-07** — Count format: "6 records" instead of "(6)". PRD §1.2 specifies "Clients (6)".  
*File*: `page-header.tsx:29` with `countSuffix="records"`

**CC-08** — Status badge colors: no color-coded badges for the 4 statuses because Prospect/On Hold/Archived don't exist. No color mapping present in Clients list.

## ⚠️ Open Questions

- PRD §6.11 Quick Filter for Status lists "Active, Prospect, On Hold, Archived" as options — but implementation has "Active, Inactive, All". Should "Inactive" map to "Archived"? Needs clarification.
- The Details tab in ClientDetail has 3 equal-height blocks (PRD §6.6: Contact Information, Addresses, Notes). Verify layout matches spec visually.
