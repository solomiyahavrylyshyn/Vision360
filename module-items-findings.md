# Module: Items (PRD §8)

## ✅ Passing

- Items module is 5th item in left nav ✅
- Item type tabs shown as tabs (not dropdown) ✅
- No "Others" tab ✅
- Price Book, Equipment, Fees tabs correctly named ✅
- Item list kebab: Edit Columns, Manage Duplicates, Import, Export ✅
- Item row kebab: Edit, Duplicate, Inactivate ✅
- Inactivate Selected in SelectionBar ✅
- Active/Inactive item statuses ✅
- No Delete on items ✅ (items only; categories/brands do use Delete modal — see failure below)
- Pagination controls present ✅
- "Search Items" local search ✅
- Column customization (Edit Columns) ✅

## ❌ Failing

**IT-01** — Tab labels for 3 of 6 item types don't match PRD §8.2:
- "Services" → should be "Service"
- "Materials" → should be "Material"  
- "Asset" → should be "Assets"  
*File*: `Items.tsx:507–512`

**IT-02** — Extra "All Items" tab not in PRD §8.3. PRD lists exactly: Price Book, Service, Material, Equipment, Assets, Fees.  
*File*: `Items.tsx:506`

**IT-03** — "Delete" used in modal for item categories, brands, catalogs, groups (`Items.tsx:1373`). PRD §1.4 says all destructive actions should use "Inactivate". Categories/settings items should use "Inactivate" (or at minimum this is a terminology violation).

**IT-04** — "Inactivate Selected" is in SelectionBar but NOT in the list-level kebab menu. PRD §8.15 requires it in the kebab.

**IT-05** — Count format: "X records" shown in header instead of "(N)". PRD §8.12 example: "Items (43)".  
*File*: `Items.tsx:539`

## ⚠️ Open Questions

- Vendor field type in ItemDetail form: PRD §8.10 says dropdown. Not verified in form rendering code — needs manual check.
- Manufacturer field: PRD says dropdown — not verified.
- Tax Profile: PRD says dropdown selection (not manual %) — not verified in form.
- Help/Education bar (PRD §8.18): present below items table? Not confirmed.
- Count per tab: PRD §8.14 says show count in each tab e.g. "Price Book (12)". Need to verify if tab labels show counts.
