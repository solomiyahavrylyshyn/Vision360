# Vision360 MVP Product Requirements Document

**Version:** 1.9\
**Date:** May 25, 2026\
**Target Release:** Core Version\
**Target User:** Solo operators and small service businesses (1-3 users)

------------------------------------------------------------------------

## Table of Contents

1.  [General Principles & Design
    Philosophy](#X187d68b54b5e7a082e00d32b29ec545e09c30bb)
2.  [UI Consistency
    Requirements](#Xf245cb3150640a1adec3e6edb4118a5abd5e456)
3.  [Navigation Structure](#Xbf1afc63ef0088d9bbd45c08934fec186c9d21e)
4.  [Modules Overview](#X460cfbcd58366c0433ae0fe5ece771b5288ffb8)
5.  [Homepage / Business Insight
    Module](#X75a942de64cb5ae9ce6fca358ef01f65721d787)
6.  [Client Module](#X376286d02ccb0b2c3a3f767336a464d45583f46)
7.  [Jobs Module](#X86f485d97a6a66e354c7a2aa12ed6a9d4c67a57)
8.  [Items Module](#Xec45b3961aa008d8a92eefa6f1ab561e7f7351e)
9.  [Estimates Module](#X3795852d043ee77164bf65bb6f45ae2566e8027)
10. [Invoices Module](#X818a03b64a61fdf8643ac2eca5499c158dc741d)
11. [Payments Module](#Xd0477cbfe05583fd1187bcd03166be02fd3cfd5)
12. [Expenses Module](#X9caf9c83b29423774a00fd6f0c1eaaa5e854efc)
13. [Schedule/Calendar
    Module](#Xf5b4035298932f4b8556f025a376732aeb04666)
14. [Reports Module](#X54333d7461b9eb8afbb3525e74ff5cf225dda3f)
15. [Settings Module](#X327d8e69dbe68907c03d13e2e1946712db98bf7)
16. [Authorization Module](#X202611941c4b1244b461ff06bfe2f7bdb51629d)
17. [Version Feature Matrix](#X76cf0ae412188f45052dda50b7a811dbc9dd43e)
18. [Non-Functional
    Requirements](#Xd6707ef600ac9dacc7e67e873deed0b9bd431d5)

------------------------------------------------------------------------

## 1. General Principles & Design Philosophy

### 1.1 Target User Profile

  ------------------------------------------------------------
  Attribute                   Description
  --------------------------- --------------------------------
  **Persona**                 "Peter" - solo operator/small
                              service business owner

  **Team Size**               1-3 people maximum

  **Work Style**              "Peter's office is in his
                              pocket" - mobile-first usage

  **Technical Level**         Non-technical, needs simple
                              intuitive interface
  ------------------------------------------------------------

### 1.2 Core Design Philosophy

  ------------------------------------------------------------
  Principle                Implementation
  ------------------------ -----------------------------------
  **"Zero Clicking"        Maximize information visibility
  Principle**              with minimal user interaction

  **Above the Fold**       Critical information visible
                           without scrolling

  **Count Indicators**     Use numbers in brackets (e.g.,
                           "Jobs (4)", "Notes (27)") to show
                           volume at a glance

  **Hover States**         Show details on hover without
                           requiring clicks

  **Mobile-First**         Design for mobile usage first,
                           responsive web interface
  ------------------------------------------------------------

### 1.3 Simplicity Requirements

  -------------------------------------------------------------
  Requirement                Client Position
  -------------------------- ----------------------------------
  **Responsiveness**         Critical priority - must work
                             perfectly on mobile

  **Simplicity**             Must match/exceed Invoice Simple's
                             simplicity

  **Settings Consolidation** ALL settings in ONE place

  **Collapsible Menu**       Required - with clear "Collapse
                             Menu" label

  **Planning Approach**      "80% planning, 20% working" -
                             thorough upfront design
  -------------------------------------------------------------

### 1.4 Terminology Standards

  -------------------------------------------------------------
  ❌ Do NOT Use                  ✅ Use Instead
  ------------------------------ ------------------------------
  Archive                        **Inactivate**

  Deactivate                     **Inactivate**

  Delete                         **Inactivate** (no permanent
                                 deletion)

  Files/Attachments              **Documents**

  Dispatch Board                 **Calendar**

  Schedule Board                 **Calendar**
  -------------------------------------------------------------

### 1.5 Design Anti-Patterns (What NOT to Do)

  ------------------------------------------------------------
  Anti-Pattern                           Reason
  -------------------------------------- ---------------------
  Scattered Settings                     Settings must be in
                                         ONE consolidated
                                         location

  Excessive customization                Pre-built templates
                                         only, no custom
                                         reports in MVP

  Delete functionality                   Records cannot be
                                         permanently deleted
                                         (data integrity)

  "Others" category                      Prevents
                                         uncategorized
                                         dumping - all items
                                         must fit defined
                                         types
  ------------------------------------------------------------

------------------------------------------------------------------------

## 2. UI Consistency Requirements

### 2.1 Standard Record List Page Layout

All record list pages must share identical layout patterns across:
Clients, Jobs, Estimates, Invoices, Payments, Expenses, Items.

#### Page Header Layout (Left to Right)

  ------------------------------------------------------------
  Position           Element          Description
  ------------------ ---------------- ------------------------
  Left               **Entity Name    e.g., "Clients (6)" -
                     with Count**     shows total/filtered
                                      count in brackets

  Left               **Three Quick    Dropdown/date picker
                     Filters**        filters specific to
                                      entity

  Left               **Advanced       Icon/tab to open
                     Filter Tab**     advanced filter panel on
                                      right side

  Right              **Local Search** "Search \[Entity\]" -
                                      searches within current
                                      entity only

  Right              **Create         "+ Create \[Entity\]"
                     Button**         button with plus icon

  Right              **Kebab Menu**   Three-dot menu for more
                                      actions
  ------------------------------------------------------------

#### Create Button Requirements

- Must include "+" icon before text
- Consistent styling: "+ Create Client", "+ Create Job", "+ Create
  Invoice"
- Plus symbol represents "adding something new" - universally understood

#### Kebab Menu Standard Actions (All Entities)

  -------------------------------------------------------------
  Action                         All Entities
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅
  -------------------------------------------------------------

### 2.2 Quick Filters Specification

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Quantity                       Three quick filters per page

  Position                       Left side of header, after
                                 entity name

  Style                          Elegant style (no gray
                                 background)
  -------------------------------------------------------------

#### Date Picker Standard (All Entities)

- All time
- Custom (calendar selection)
- Today
- Yesterday
- Last 14 days
- Last 30 days
- This month
- Last month

### 2.3 Advanced Filters Panel

  -------------------------------------------------------------
  Control Type                             Usage
  ---------------------------------------- --------------------
  **Dropdown**                             Preferred for
                                           single-select
                                           filters (Status,
                                           Customer Type)

  **Checkboxes**                           Required for
                                           multi-select filters
                                           (Tags only)
  -------------------------------------------------------------

### 2.4 Financial Display Styling

  -------------------------------------------------------------
  Metric             Color            Rationale
  ------------------ ---------------- -------------------------
  Total Revenue      Green            "Money is green in the
                                      US" - positive
                                      association

  Balance            Neutral          Not inherently good or
                     (default)        bad

  Past Due           **Red**          Indicates problem
                                      requiring attention
  -------------------------------------------------------------

### 2.5 Navigation Pattern

  -------------------------------------------------------------
  Pattern                        Implementation
  ------------------------------ ------------------------------
  Back Navigation                Arrow pointing left + entity
                                 name ("← Jobs")

  Behavior                       Click returns to previous list
                                 view
  -------------------------------------------------------------

### 2.6 Address Standards

  ------------------------------------------------------------
  Requirement                Implementation
  -------------------------- ---------------------------------
  State Abbreviations        Always use 2-letter USPS
                             abbreviations (FL, GA, TX)

  Standard Format            `Address, City, State ZIP`

  Address API                Auto-populate city/state/zip when
                             user starts typing

  Counties                   Dropdown selection only (never
                             free text) to prevent
                             misspellings
  ------------------------------------------------------------

### 2.7 Section-Specific Edit

  ------------------------------------------------------------
  Feature                  Requirement
  ------------------------ -----------------------------------
  Edit Pencils             Each section should have its own
                           edit pencil icon

  Granular Editing         Allow editing just a portion
                           without opening entire record
  ------------------------------------------------------------

------------------------------------------------------------------------

## 3. Navigation Structure

### 3.1 Left Navigation Bar (Final - May 11, 2026)

  ---------------------------------------------------------------
  \#              Item            MVP Status      Notes
  --------------- --------------- --------------- ---------------
  1               **Home**        ✅              Business
                                                  Insight
                                                  dashboard

  2               **Schedule**    ✅              Calendar with
                                                  jobs

  3               **Clients**     ✅              Client
                                                  management

  4               **Jobs**        ✅              Job management

  5               **Items**       ✅              Price book and
                                                  items
  ---------------------------------------------------------------

**Design Decision:** "Very simple, very clean" - minimal navigation
items.

### 3.2 Top Navigation Bar (Left to Right)

  -------------------------------------------------------------
  Position                Element              Notes
  ----------------------- -------------------- ----------------
  Left                    **Company            Display company
                          Logo/Name**          name from
                                               registration

  Center                  **Search Bar**       Global search
                                               with filter
                                               options by
                                               entity

  Right 1                 **Plus/Create        Most frequently
                          Button**             used - first
                                               position
                                               prevents
                                               accidental
                                               settings click

  Right 2                 **Notification       Placeholder for
                          Bell**               future
                                               notifications

  Right 3                 **Help Center**      Question mark
                                               icon

  Right 4                 **Settings**         Gear icon

  Right 5                 **Account**          User initials
                                               icon
  -------------------------------------------------------------

### 3.3 Modules Removed from MVP

  --------------------------------------------------------------
  Module               Moved To             Reason
  -------------------- -------------------- --------------------
  Dashboard            Pro/Enterprise       Not essential for
                                            MVP

  Appointments         Pro/Enterprise       Jobs cover basic
                                            scheduling

  Schedule Board       Pro/Enterprise       Simple calendar is
                                            sufficient

  Marketing            Pro/Enterprise       Advanced feature

  Accounting           Pro/Enterprise       Simple reports are
                                            sufficient
  --------------------------------------------------------------

------------------------------------------------------------------------

## 4. Modules Overview

### 4.1 MVP Module List

  ---------------------------------------------------------------
  \#              Module          Description     Complexity
  --------------- --------------- --------------- ---------------
  1               Calendar        Simple          Medium
                                  calendar, jobs  
                                  only            

  2               Clients         Simplified      High
                                  client profile  

  3               Jobs            Core job        High
                                  functionality   

  4               Estimates       Form with price Medium
                                  book items      

  5               Invoices        Basic invoice   Medium
                                  functionality   

  6               Payments        Stripe + manual Medium
                                  methods         

  7               Expenses        Very simple     Low
                                  expense         
                                  tracking        

  8               Items           Powerful module High
                                  with item types 

  9               Reports         Basic pre-built Low
                                  reports only    
  ---------------------------------------------------------------

### 4.2 Development Priority Order

  --------------------------------------------------------------
  Priority             Module               Notes
  -------------------- -------------------- --------------------
  1                    Clients              Core business module

  2                    Items                Required for
                                            Estimates

  3                    Jobs                 Core workflow

  4                    Estimates            Form-based, depends
                                            on Items

  5                    Invoices             Simple design

  6                    Payments             Simple design

  7                    Expenses             Very simple

  8                    Calendar             Pre-built components

  9                    Reports              Pre-built reports

  10                   Settings             Many configurations

  11                   Onboarding           Simple flow
  --------------------------------------------------------------

------------------------------------------------------------------------

## 5. Homepage / Business Insight Module

### 5.1 Homepage Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Name**             Business Insight (internal), Home
                       (navigation label)

  **Default Landing**  User lands here directly after login -
                       no extra click required

  **Purpose**          At-a-glance business overview with
                       quick access to reports

  **Design             Simple, clean, powerful KPI visibility
  Philosophy**         
  ------------------------------------------------------------

**Decision (May 11, 2026):** "You go to Business Insight when you log
in. You don't have to click the tab dashboards."

### 5.2 Homepage Tab Structure

  --------------------------------------------------------------
  Tab                  Description          MVP Status
  -------------------- -------------------- --------------------
  **Dashboards**       KPI blocks and       ✅ (simplified)
                       business metrics     

  **Reports**          Pre-built reports    ✅
                       list                 
  --------------------------------------------------------------

**Note:** Reports tab was moved from left navigation to homepage tabs to
simplify navigation.

### 5.3 KPI Blocks (Dashboard Tab)

#### Layout Requirements

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Position                       Top of the page, above main
                                 content

  Height                         Consistent height across all
                                 pages (smaller, compact style)

  Style                          Clean, compact blocks - not
                                 oversized

  Decimal Numbers                ❌ Eliminated - cleaner
                                 without decimals

  Responsiveness                 Must be responsive across
                                 screen sizes
  -------------------------------------------------------------

#### MVP KPI Metrics

  --------------------------------------------------------------
  KPI                  Description          MVP Status
  -------------------- -------------------- --------------------
  **Jobs Today**       Count of scheduled   ✅
                       jobs for selected    
                       date                 

  **Revenue**          Total revenue for    ✅
                       selected period      

  **In Progress**      Jobs currently in    ✅
                       progress             

  **Completed**        Jobs completed for   ✅
                       selected period      
  --------------------------------------------------------------

#### KPIs Moved to Pro/Enterprise

  --------------------------------------------------------------
  KPI            Moved To                    Notes
  -------------- --------------------------- -------------------
  Success Rate / Pro                         "Customer retention
  Conversion                                 success rate" -
  Ratio                                      closing percentage

  Route          Pro                         Important for pool
  Optimization                               service, etc.

  Cost Quantity  Pro                         Advanced metric
  --------------------------------------------------------------

### 5.4 Date/Period Selector

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  Position               Top of the page, above KPI blocks

  Default View           Today

  Available Views        Today, Yesterday, This Week, Last
                         Week, Custom Date

  Behavior               KPIs update based on selected period
  ------------------------------------------------------------

**Use Case (May 11, 2026):** "Peter is looking at today in the
evening... he can go on top of the page and click to yesterday and see
how much revenue yesterday was... or when you switch to weekly, the KPI
blogs are extremely powerful because you see how much revenue you
brought per week."

### 5.5 Reports Tab (Pre-Built Reports)

#### Report Categories (May 22, 2026)

  --------------------------------------------------------------
  \#   Report Name         Description         MVP Status
  ---- ------------------- ------------------- -----------------
  1    **Revenue Report**  Revenue summary by  ✅
                           period              

  2    **Expense Report**  Expense summary by  ✅
                           category            

  3    **Gross Profit**    Revenue vs Expenses ✅
                           comparison (NOT P&L 
                           statement)          

  4    **Job Report**      Job costing summary ✅

  5    **Invoice Summary** Invoice totals and  ✅
                           status              

  6    **Account           Outstanding money   ✅
       Receivable**        coming in           

  7    **Client Report**   Client data summary ✅

  8    **Team Report**     Employee            ✅
                           performance (jobs   
                           done, pay)          

  9    **Sales Tax         Tax collected for   ✅
       Report**            government payment  

  10   **Item Usage        Parts, services,    ✅
       Report**            discounts used      

  11   **Payment Report**  Outstanding,        ✅
                           overdue, partial    
                           payments            

  12   **Estimate Report** Total estimates,    ✅
                           open estimates,     
                           values              

  13   **Estimate          Estimate approval   ✅
       Conversion**        rate                
  --------------------------------------------------------------

#### Report Design Requirements

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Type                           Pre-built only, NOT
                                 customizable

  Reference Style                Invoice Simple (simple, clean)

  Custom Reports                 ❌ Not in MVP - Pro/Enterprise
                                 only

  Custom Data Fields             ❌ Not in MVP

  Development Timing             Later in development (reports
                                 come from data)
  -------------------------------------------------------------

**Decision (April 1, 2026):** "I will create the list of basic reports.
They will be pre-built, like Invoice Simple has those pre-built
invoices, so they will be pre-built, not customizable, not custom data
fields."

### 5.6 Sample Company Display

  -------------------------------------------------------------
  Element                        Specification
  ------------------------------ ------------------------------
  Sample Company Name            "Premium Services"

  Purpose                        Training tool, shows full
                                 capability

  Company Name Display           Shows in top navigation from
                                 registration
  -------------------------------------------------------------

### 5.7 Features NOT in MVP Homepage

  -------------------------------------------------------------
  Feature              Moved To               Reason
  -------------------- ---------------------- -----------------
  Complex Dashboards   Pro/Enterprise         "Dashboard is a
                                              nice feature, but
                                              not essential for
                                              MVP"

  Route Optimization   Pro                    Advanced
  Map                                         scheduling
                                              feature

  Custom Reports       Pro/Enterprise         MVP uses
                                              pre-built only

  Real-time KPI        Pro                    Performance
  Updates                                     consideration
  -------------------------------------------------------------

------------------------------------------------------------------------

## 6. Client Module

### 6.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Position**         Third item in left navigation (after
                       Home, Schedule)

  **Purpose**          Core business module - "The customer
                       profile is where all business starts"

  **Design             Full visibility on one screen with
  Philosophy**         minimal clicks

  **Benchmark          QuickBooks Online customer page layout
  Reference**          
  ------------------------------------------------------------

**Design Decision (April 14, 2026):** "The customers, that's where all
the business starts with. And then other customers, you have
appointments, jobs, payments, invoices. But a lot of info you should
have when you look at the customer profile."

### 6.2 Client Profile Page Layout

#### Customer Summary Header

  -------------------------------------------------------------
  Element         Requirement             MVP Status
  --------------- ----------------------- ---------------------
  **Customer      First/Last Name OR      ✅
  Name**          Company Name            

  **Email Icon**  Envelope icon; shows    ✅
                  email on hover          

  **Phone Icon**  Phone icon; shows       ✅
                  primary phone on hover  

  **Status        Active (green), On Hold ✅
  Badge**         (red), Archived (gray)  

  **Address**     Billing address with    ✅
                  location icon           

  **Customer      Date field (e.g.,       ✅
  Since**         "Customer since July    
                  2021")                  

  **Tags**        Tags with count in      ✅
                  bracket (e.g., "Tags    
                  (3)"); hover to see all 

  **Last          Date of last service -  ✅
  Service**       critical for CSRs when  
                  customer calls          

  **Notes**       Notes with count (e.g., ✅
                  "Notes (27)"); hover to 
                  see recent notes        
  -------------------------------------------------------------

**Design Decision (May 22, 2026):** "Connect the header with the tabs.
Those KPIs are nice to have feature but not the most important
functionality. The header and tabs should feel together, not
disconnected."

#### Financial Summary Section (Right Side Cards)

  --------------------------------------------------------------
  Metric               Description          Styling
  -------------------- -------------------- --------------------
  Total Revenue        Lifetime revenue     Green
                       from customer        

  Balance              Current outstanding  Standard
                       balance              

  Past Due             Overdue amount       Red if \> 0
  --------------------------------------------------------------

#### KPI Block Styling (May 22, 2026)

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Height                         Same smaller height as
                                 Schedule KPIs

  Position                       Connect with header, not
                                 disconnected

  Style                          Clean, compact - not oversized
                                 blocks
  -------------------------------------------------------------

### 6.3 Client Status System

  ---------------------------------------------------------------------
  Status         Color          Description           Trigger
  -------------- -------------- --------------------- -----------------
  **Prospect**   Blue/Neutral   New lead - hasn't     Initial record
                                spent money           creation (from
                                                      Facebook ads,
                                                      calls, home
                                                      shows, etc.)

  **Active**     Green          Paying customer       **Automatic** -
                                                      when invoice with
                                                      amount \> \$0 is
                                                      created AND
                                                      payment collected

  **On Hold**    Red            Past due balance -    Manual or
                                "Do not service this  rule-based when
                                customer till they    balance exceeds
                                pay us"               threshold

  **Archived**   Dark Gray      Inactive customer     Manual archival
  ---------------------------------------------------------------------

**Critical (April 23, 2026):** Status change from Prospect to Active
should be **automatic** - CSRs should NOT manually change status.
Software triggers transition when invoice is created with dollar amount
\> \$0 and payment is collected.

**Business Value:** "Show me prospects only" enables targeted marketing
to leads who haven't converted yet.

### 6.4 Client Tabs (Horizontal Navigation)

**Layout:** Horizontal tabs (like QuickBooks Online, not vertical)

  --------------------------------------------------------------
  Tab                  Description          MVP Status
  -------------------- -------------------- --------------------
  Details              All customer details ✅
                       and fields           

  Properties           Billing + Service    ✅
                       addresses,           
                       additional           
                       properties           

  Jobs                 List/table of jobs   ✅
                       with count indicator 

  Estimates            List/table of        ✅
                       estimates            

  Invoices             List/table of        ✅
                       invoices             

  Payments             List/table of        ✅
                       payments             

  Documents            Pictures, PDFs,      ✅
                       documents            
  --------------------------------------------------------------

**Terminology (May 7, 2026):** Use "Documents" not "Files" or
"Attachments" - more professional.

#### Tabs Moved to Pro/Enterprise

  --------------------------------------------------------------
  Tab                  Description          Version
  -------------------- -------------------- --------------------
  Appointments         List of appointments Pro

  Purchase Orders      PO management        Pro

  Service Agreements   Recurring service    Pro
                       contracts            

  Equipment            Equipment tracking   Pro

  Activity             Communication        Pro
                       history, audit log   

  Marketing            Marketing campaigns, Enterprise
                       sources              
  --------------------------------------------------------------

### 6.5 Client Fields (MVP)

#### Required Fields (for Client Creation)

  -------------------------------------------------------------
  Field             Required                  Notes
  ----------------- ------------------------- -----------------
  First Name OR     ✅ Required               At least one must
  Company Name                                be provided

  Email             ✅ Required               Primary
                                              identifier

  Phone (Primary)   ✅ Required               Main contact
                                              number
  -------------------------------------------------------------

**Decision (May 22, 2026):** "The important thing for MVP is the
required fields when adding a new client. Email is mandatory, website is
optional."

#### Optional Fields (MVP)

  ------------------------------------------------------------
  Field                      Details
  -------------------------- ---------------------------------
  Last Name                  Basic identification

  Company Name               Optional if first/last name
                             provided

  Phone (Secondary)          Additional contact number

  Website                    Company website (optional)

  Billing Address            Primary address with "Use as
                             service address" checkbox

  Service Addresses          Multiple properties support

  Notes                      Small notes section

  Additional Contacts        For property managers with
                             supervisors/contacts

  Custom Fields 1 & 2        Limited customization (configured
                             in Settings)

  Tags                       Pre-defined labels (e.g., "New
                             homeowner", "Self-generated
                             lead")
  ------------------------------------------------------------

#### Fields Removed from MVP

  -----------------------------------------------------------------------
  Field                      Reason              Moved To
  -------------------------- ------------------- ------------------------
  Customer Type              Not needed for      Pro
  (Residential/Commercial)   one-man operators   

  Lead Source                Marketing feature   Pro
                             for later           

  Account Manager            Requires employee   Pro
                             module              

  Custom Fields (unlimited)  Keep MVP simple - 2 Enterprise
                             per entity          
  -----------------------------------------------------------------------

**Decision (May 7, 2026):** "Residential/Commercial is going bye-bye
because we don't have it. Lead Source disappears."

### 6.6 Details Tab Content

#### Three Equal-Height Blocks

  ------------------------------------------------------------
  Block                      Content
  -------------------------- ---------------------------------
  **Contact Information**    Name, phone numbers
                             (primary/secondary), email

  **Addresses**              Billing address, service
                             address(es) with small notes

  **Notes**                  Up to 4 visible, count indicator
                             (e.g., "Notes (8)")
  ------------------------------------------------------------

### 6.7 Properties/Addresses Tab

  ------------------------------------------------------------
  Feature                      Behavior
  ---------------------------- -------------------------------
  Billing Address              Primary address entered first,
                               displayed by default in header

  Use as Service Address       Checkbox - copies billing to
                               service address by default

  Multiple Properties          Support for property management
                               companies with many locations

  Address Notes                Small notes field per address
                               (gate code, special
                               instructions)

  Last Serviced Logic          Display most recently serviced
                               property by default

  Property Contact             Contact person for each
                               property/location
  ------------------------------------------------------------

**Use Case:** Property management company managing 25+ homes - billing
address is company HQ, service addresses are individual properties with
their own contacts.

### 6.8 Notes Tab

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Multiple Notes                 Ability to add multiple notes
                                 per client

  Note Count                     Display count indicator (e.g.,
                                 "(27 notes)")

  Hover Preview                  Hover to see last 2-3 notes
                                 without clicking

  Chronological Order            Latest note displayed on top

  Timestamp                      Date/time when note was added

  One-Line Display               Notes show one line, hover to
                                 see full content
  -------------------------------------------------------------

**UX Decision (May 22, 2026):** "I eliminated to one line. And then if
we hover over, we will see all notes."

**Business Value:** Seeing "27 notes" vs "1 note" immediately indicates
customer history depth - helps CSRs understand customer relationship.

### 6.9 Documents Tab

  --------------------------------------------------------------
  Feature              Description          MVP Status
  -------------------- -------------------- --------------------
  File Types           Pictures, PDFs,      ✅
                       invoices, estimates  

  Document Count       Display count        ✅
                       indicator            

  Miniature Icons      Small thumbnail      ✅
                       previews             

  Preview Panel        Like File Explorer   ✅
                       preview pane         

  Filter by Type       Show only PDFs or    ✅
                       only pictures        

  Filter by Date       Filter by date range ✅

  Filter by User       Filter by who added  Pro
  --------------------------------------------------------------

**Design Decision (May 22, 2026):** "Documents section same miniature
pictures icons like in estimates and preview panel like File Explorer."

### 6.10 Client List Page

#### Standard Page Header (Left to Right)

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Clients (6)"
                       Count                

  Left                 Three Quick Filters  Status, Date
                                            Created, Balance

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Clients"

  Right                Create Button        "+ Create Client"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 6.11 Clients Quick Filters

  ---------------------------------------------------------------
  Filter \#       Type            Name            Options
  --------------- --------------- --------------- ---------------
  1               Dropdown        Status          Active,
                                                  Prospect, On
                                                  Hold, Archived

  2               Date Picker     Date Created    Standard date
                                                  picker options

  3               Dropdown        Balance         All, With
                                                  Balance (\>
                                                  \$0), No
                                                  Balance
  ---------------------------------------------------------------

### 6.12 Advanced Filters Panel

  -------------------------------------------------------------
  Filter                 Type              Notes
  ---------------------- ----------------- --------------------
  City                   Text input        Free text search

  County                 **Dropdown only** CRITICAL: Must be
                                           dropdown to prevent
                                           misspellings

  Tags                   Checkboxes        Multi-select

  Date Range             Date picker       Standard options
  -------------------------------------------------------------

**Decision (April 21, 2026):** "County must be dropdown, not typed.
Prevents data quality issues like 'Hillsborough' vs 'Hilsboro' vs
'Hilsborough'."

### 6.13 Client Kebab Menu Actions

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Print                          ✅

  Email Statement                ✅

  Print Statement                ✅

  View Statement                 ✅

  Collect Payment                ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅

  Add Recurring Service          ❌ Enterprise only
  -------------------------------------------------------------

### 6.14 Client Data Hierarchy

  ------------------------------------------------------------
  Concept                  Description
  ------------------------ -----------------------------------
  One-Way Street           Client → Jobs → Invoices (not the
                           other way)

  Parent Record            Client is the parent; jobs,
                           invoices, properties are children

  Cannot Change Client on  Once job is created, client cannot
  Job                      be changed
  ------------------------------------------------------------

**Decision (May 22, 2026):** "The first folder is the client folder. We
go deeper, select one client. The client has jobs, invoices, properties.
We don't go the other way. It's one way street."

### 6.15 Bulk Actions

  -------------------------------------------------------------
  Action                         Available
  ------------------------------ ------------------------------
  Select All                     ✅ Checkbox in table header

  Individual Select              ✅ Checkbox per row

  Selection Count                ✅ Display "X selected"

  Export                         ✅ Export selected records

  Inactivate                     ✅ Archive selected

  Delete                         ❌ Cannot delete clients (data
                                 integrity)
  -------------------------------------------------------------

**Decision (April 23, 2026):** "Cannot delete client records - data
integrity. Use Inactivate instead."

### 6.16 Features NOT in MVP Client Module

  -----------------------------------------------------------------
  Feature                  Moved To               Reason
  ------------------------ ---------------------- -----------------
  Tab Customization        Pro                    Not needed for
  (on/off)                                        solo operator

  Residential/Commercial   Pro                    99.9% of solo
  Icon                                            operator clients
                                                  are residential

  Lead Source Field        Pro                    Marketing feature

  Custom Fields (\>2)      Enterprise             Keep MVP simple

  Account Manager          Pro                    Requires employee
                                                  module

  Filter Attachments by    Pro                    Advanced feature
  User                                            
  -----------------------------------------------------------------

------------------------------------------------------------------------

## 7. Jobs Module

### 7.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Position**         Fourth item in left navigation (after
                       Home, Schedule, Clients)

  **Purpose**          Core workflow module for tracking work
                       performed for customers

  **Complexity**       Second most complex module after
                       Clients

  **Design             Same structure as Client profile -
  Philosophy**         consistent, familiar
  ------------------------------------------------------------

**Design Decision (April 23, 2026):** "Clients and Jobs are the most
important, like the biggest. With Clients being the biggest."

### 7.2 Job Page Layout

  -------------------------------------------------------------
  Section               Content               Notes
  --------------------- --------------------- -----------------
  **Customer Summary    Customer info         Same header from
  Header**              persists              Client Profile -
                                              maintains context

  **Job KPI Blocks**    Total Price,          Same compact
                        Compensation, All     style as
                        Expenses, Profit      Client/Schedule
                        Margin                KPIs

  **Job Overview        Job-specific details  See fields below
  Section**                                   

  **Job Tabs**          Horizontal navigation See tab list
                                              below
  -------------------------------------------------------------

**Critical Decision (April 23, 2026):** "The customer summary header
stays. I'm on this job and I want to know that this customer has service
agreement, this customer we got in 2021. I don't want this information
to disappear."

### 7.3 Customer Summary Header (Persistent)

  -------------------------------------------------------------
  Element           Description               Purpose
  ----------------- ------------------------- -----------------
  Customer Name     First/Last or Company     Quick
                                              identification

  Email Icon        Shows email on hover      Quick contact

  Phone Icon        Shows phone on hover      Quick contact

  Status Badge      Active/On Hold/Archived   Prevent servicing
                                              delinquent
                                              customers

  Tags              Customer tags             Context

  Customer Since    Date                      Relationship
                                              history

  Past Due Amount   Red if \> \$0             **Critical:**
                                              Prevent costly
                                              errors
  -------------------------------------------------------------

**Business Value:** "We don't want to service a customer that has \$850
past due. That information needs to be visible on the job page."

### 7.4 Job KPI Blocks (Profitability Display)

  -------------------------------------------------------------------
  Metric             Calculation           Example        Color
  ------------------ --------------------- -------------- -----------
  **Total Price**    Job sold price        "\$45,000"     Green

  **Compensation**   Labor fee +           "\$1,500"      Neutral
                     Commission fee                       

  **All Expenses**   Equipment +           "\$2,100"      Neutral
                     Material +                           
                     Compensation                         

  **Profit Margin**  (Total Price - All    "96.7%"        Green if
                     Expenses) / Total                    positive
                     Price × 100                          
  -------------------------------------------------------------------

**Decision (May 15, 2026):** "Instead of calling them labor or
commission, I changed the name to Compensation so we can add all
employee-related expenses to the job."

#### KPI Block Styling

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Height                         Same compact height as
                                 Schedule/Client KPIs

  Decimals                       ❌ No decimal numbers -
                                 cleaner

  Position                       Below customer header, above
                                 tabs
  -------------------------------------------------------------

### 7.5 Job Overview Section

  -------------------------------------------------------------
  Field         Description              MVP Status
  ------------- ------------------------ ----------------------
  **Job Title** Name/description of the  ✅ Required
                job                      

  **Job Type**  Dropdown (Estimate,      ✅ Required
                Install, Service,        
                Maintenance)             

  **Service     Property location for    ✅ Required
  Address**     the job (from client's   
                addresses)               

  **Start       Job start date           ✅ Required
  Date**                                 

  **End Date**  Job end date             ✅ Optional

  **Start       Scheduled start time     ✅ Required
  Time**                                 

  **End Time**  Scheduled end time       ✅ Optional

  **Assigned    Employee dropdown with   ✅ Required
  To**          quick-change capability  

  **Job Basic   One-off Job OR Recurring ✅ Required
  Info**        Job toggle               
  -------------------------------------------------------------

**Quick Change Feature (May 15, 2026):** "Sometimes we want to quickly
change, assign the job to somebody else. If we can have the same
dropdown here to assign, we just change the person we are assigning
without opening everything."

### 7.6 Job Types (MVP)

  -------------------------------------------------------------
  Job Type           Description             Use Case
  ------------------ ----------------------- ------------------
  **Estimate**       Sales visit / quote     Sales person
                     appointment             selling job

  **Install**        Installation work (may  Equipment
                     span multiple days)     installation

  **Service**        Repair or service call  One-time service
                                             visit

  **Maintenance**    Routine maintenance     Pool cleaning,
                     work                    HVAC checkup
  -------------------------------------------------------------

**Configuration:** Job types are configurable in Settings \> System
Preferences.

### 7.7 One-Off vs Recurring Jobs

#### One-Off Jobs

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Default                        Standard single job

  Schedule                       Single date/time

  Use Case                       Individual service calls,
                                 installations
  -------------------------------------------------------------

#### Recurring Jobs

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  Toggle                 "One-off Job" or "Recurring Job"
                         selection

  Frequency Options      Daily, Weekly (select days),
                         Bi-weekly, Monthly, Custom

  Days Selection         Monday, Tuesday, Wednesday, Thursday,
                         Friday, Saturday, Sunday

  End Options            Never ends (checkbox), After X
                         occurrences, On specific date

  "Never Ends"           ✅ Checkbox to avoid "100 years"
                         workaround
  ------------------------------------------------------------

**Decision (May 22, 2026):** "The recurring job is very powerful feature
for small operators... If you capture one customer and then you have
this recurring job feature and you pre-populate it forever."

#### Recurring Job Scheduler Fields

  -------------------------------------------------------------
  Field                          Options
  ------------------------------ ------------------------------
  Starts On                      Date picker

  Start Time                     Time picker

  Frequency                      Daily, Weekly, Bi-weekly,
                                 Monthly, Custom

  Weekly Days                    Mon, Tue, Wed, Thu, Fri, Sat,
                                 Sun checkboxes

  Ends                           Never / After X occurrences /
                                 On date
  -------------------------------------------------------------

**Use Case:** Pool cleaning company visits every Friday at 2pm - create
one recurring job instead of 52 separate jobs per year. "Nobody will use
the software if they have to create a simple job record every week 52
times per year."

### 7.8 Job Page Tabs (MVP)

  ----------------------------------------------------------------------
  Tab                Description                MVP Status
  ------------------ -------------------------- ------------------------
  **Details**        Job information and fields ✅

  **Appointments**   List of appointments tied  ✅ (moved to Core)
                     to job                     

  **Checklist**      Job completion checklist   ✅

  **Documents**      Photos, PDFs, documents    ✅
                     (renamed from Attachments) 

  **Items**          Materials/items used from  ✅
                     price book                 

  **Labor**          Installer hours and        ✅
                     timesheets                 

  **Expense**        Equipment, materials,      ✅
                     sales commission           

  **Finance**        Invoice, payment summary   ✅

  Equipment          Equipment assigned to job  ⏸️ Pro

  Activity           Activity log for the job   ⏸️ Pro
  ----------------------------------------------------------------------

**Decision (April 23, 2026):** "I'm leaning toward adding Appointments
to the Core module because it will be much easier to put everything
together for job costing."

### 7.9 Appointments Tab (Job Costing Workflow)

#### Appointment Types for a Typical Job

  -------------------------------------------------------------------
  \#   Appointment        Expenses Tracked          Example
  ---- ------------------ ------------------------- -----------------
  1    **Estimate         Sales commission          Sales person
       Appointment**                                sells job for
                                                    \$45,230

  2    **Install          Equipment pickup, labor   2 guys × 8 hours
       Appointment Day    hours                     = 16 hours
       1**                                          

  3    **Install          Labor hours               2 guys × 8 hours
       Appointment Day                              = 16 hours
       2**                                          

  4    **Install          Labor hours               2 guys × 8 hours
       Appointment Day                              = 16 hours
       3**                                          

  5    **Startup          Senior tech labor         4 hours for
       Appointment**                                startup/testing
  -------------------------------------------------------------------

**Business Value (April 23, 2026):** "So we're going to have four or
five appointments. They will be assigned to one job. Job costing is done
beautifully. And everything is working beautifully."

### 7.10 Details Tab Content

  -------------------------------------------------------------
  Section                        Content
  ------------------------------ ------------------------------
  Job Information                Title, Type, Status,
                                 Dates/Times

  Service Address                Full address with notes

  Assignment                     Assigned technician/employee

  Notes                          Job-specific notes

  Custom Fields                  2 custom fields (configured in
                                 Settings)
  -------------------------------------------------------------

### 7.11 Checklist Tab

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Purpose                        Track job completion steps

  Items                          Checkbox items for job tasks

  Pre-built                      Can use checklist templates
                                 (configured in Settings)

  Custom                         Add ad-hoc items per job
  -------------------------------------------------------------

### 7.12 Documents Tab

  --------------------------------------------------------------
  Feature              Description          MVP Status
  -------------------- -------------------- --------------------
  File Types           Pictures, PDFs,      ✅
                       documents            

  Upload Source        Desktop upload or    ✅
                       mobile camera        

  Document Count       Display count        ✅
                       indicator            

  Miniature Icons      Small thumbnail      ✅
                       previews             

  Preview Panel        Like File Explorer   ✅
                       preview pane         

  Quick Filter         Filter by type       ✅
                       (pictures, PDFs)     

  Filter by User       Filter by who added  Pro
  --------------------------------------------------------------

**Use Case:** "Travis the employee can attach the picture to the job
from every visit."

### 7.13 Items Tab

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Purpose                        Track materials/items used on
                                 job

  Source                         Select from Items module
                                 (price book)

  Fields                         Item name, quantity, price,
                                 total

  Cost Tracking                  Records cost vs price for
                                 profitability
  -------------------------------------------------------------

### 7.14 Labor Tab

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Purpose                        Track installer/technician
                                 hours

  Fields                         Employee, date, hours worked,
                                 hourly rate

  Calculation                    Hours × Rate = Labor expense

  Roll-up                        Total labor rolls up to job
                                 profitability
  -------------------------------------------------------------

**Example:** "Two guys at 8 hours per day, 16 hours on the appointment.
16 hours times the hourly rate, that's the expense."

### 7.15 Expense Tab

  -------------------------------------------------------------
  Expense Type                   Description
  ------------------------------ ------------------------------
  Equipment                      Equipment purchased/used for
                                 job

  Material                       Materials purchased for job

  Sales Commission               Commission paid to salesperson

  Other                          Miscellaneous job expenses
  -------------------------------------------------------------

**Roll-up:** All expenses roll up to Job KPI blocks for profitability
calculation.

### 7.16 Finance Tab

  -------------------------------------------------------------
  Element                        Description
  ------------------------------ ------------------------------
  Invoice Summary                Invoice(s) tied to job

  Payment Summary                Payments collected

  Balance                        Outstanding amount

  Status                         Paid/Partial/Unpaid
  -------------------------------------------------------------

### 7.17 Job Status in MVP

  --------------------------------------------------------------------
  Status          Color           Description           Trigger
  --------------- --------------- --------------------- --------------
  **Scheduled**   Blue            Job created, not yet  Default when
                                  started               job created

  **In Progress** Yellow/Orange   Work has begun        Manual status
                                                        change

  **Completed**   Green           Work finished         Manual status
                                                        change
  --------------------------------------------------------------------

**Status Change (May 13, 2026):** "Job statuses, we have scheduled, in
progress, and completed. That's pre-coded."

#### Statuses NOT in MVP

  --------------------------------------------------------------
  Status               Reason               Moved To
  -------------------- -------------------- --------------------
  Unscheduled          Jobs auto-scheduled  Pro
                       when created in MVP  

  Cancelled            Job removed entirely Pro

  On Hold              Advanced workflow    Pro
  --------------------------------------------------------------

**Decision (May 11, 2026):** "In MVP, when a job is created it is
automatically scheduled. No 'unscheduled' workflow."

### 7.18 Job List Page

#### Standard Page Header (Left to Right)

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Jobs (12)"
                       Count                

  Left                 Three Quick Filters  Status, Job Type,
                                            Date

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Jobs"

  Right                Create Button        "+ Create Job"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 7.19 Jobs Quick Filters

  ---------------------------------------------------------------
  Filter \#       Type            Name            Options
  --------------- --------------- --------------- ---------------
  1               Dropdown        Status          Scheduled, In
                                                  Progress,
                                                  Completed

  2               Dropdown        Job Type        Estimate,
                                                  Install,
                                                  Service,
                                                  Maintenance

  3               Date Picker     Date            Standard date
                                                  picker options
  ---------------------------------------------------------------

### 7.20 Jobs Kebab Menu Actions (Page Level)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅
  -------------------------------------------------------------

### 7.21 Job Profile Kebab Menu (Record Level)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Print Job                      ✅

  Create Invoice                 ✅

  Duplicate Job                  ✅

  Convert to Recurring           ✅

  Inactivate                     ✅
  -------------------------------------------------------------

**Note (May 22, 2026):** "I'm going to have the homework to go
everywhere to all kebab menus, verify against other alternative
solutions."

### 7.22 Create Job Form

#### Required Fields

  ---------------------------------------------------------------
  Field                Required             Notes
  -------------------- -------------------- ---------------------
  Customer             ✅ Required          Select from existing
                                            clients

  Job Title            ✅ Required          Description of work

  Job Type             ✅ Required          Dropdown selection

  Service Address      ✅ Required          From customer's
                                            addresses

  Start Date           ✅ Required          When job starts

  Start Time           ✅ Required          Scheduled start time

  Assigned To          ✅ Required          Employee/technician
  ---------------------------------------------------------------

#### Optional Fields

  -------------------------------------------------------------
  Field                          Notes
  ------------------------------ ------------------------------
  End Date                       For multi-day jobs

  End Time                       Estimated completion

  Job Basic Info                 One-off or Recurring

  Notes                          Job-specific notes

  Items                          Add items from price book
  -------------------------------------------------------------

### 7.23 Job Data Hierarchy

  ------------------------------------------------------------
  Concept                  Description
  ------------------------ -----------------------------------
  **One-Way Street**       Client → Job (not reversible)

  **Parent Record**        Client is parent; Job is child

  **Cannot Change Client** Once job is created, client cannot
                           be changed
  ------------------------------------------------------------

**Decision (May 22, 2026):** "The first folder is the client folder. We
go deeper, select one client. The client has jobs, invoices, properties.
We don't go the other way. It's one way street. From client we create
the jobs. We're not going back to change the client to the job."

### 7.24 Calendar Integration

  -------------------------------------------------------------
  Feature                        Behavior
  ------------------------------ ------------------------------
  Auto-Schedule                  Jobs appear on calendar
                                 immediately when created

  Drag-and-Drop                  Reschedule by dragging on
                                 calendar

  Color Coding                   Status-based coloring

  Revenue Display                Job revenue visible on
                                 calendar
  -------------------------------------------------------------

### 7.25 Bulk Actions

  -------------------------------------------------------------
  Action                         Available
  ------------------------------ ------------------------------
  Select All                     ✅ Checkbox in table header

  Individual Select              ✅ Checkbox per row

  Selection Count                ✅ Display "X selected"

  Export                         ✅ Export selected records

  Inactivate                     ✅ Archive selected

  Delete                         ❌ Cannot delete jobs (data
                                 integrity)
  -------------------------------------------------------------

### 7.26 Job Fields (MVP)

  ---------------------------------------------------------------
  Field                Type                  MVP Status
  -------------------- --------------------- --------------------
  Job ID               Auto-generated        ✅

  Job Title            Text                  ✅

  Job Type             Dropdown              ✅

  Status               Dropdown (pre-coded)  ✅

  Customer             Lookup                ✅

  Service Address      Dropdown (from        ✅
                       customer)             

  Start Date           Date                  ✅

  End Date             Date                  ✅

  Start Time           Time                  ✅

  End Time             Time                  ✅

  Assigned To          Dropdown (employees)  ✅

  Job Basic Info       Toggle                ✅
                       (One-off/Recurring)   

  Notes                Text                  ✅

  Custom Field 1       Configurable          ✅

  Custom Field 2       Configurable          ✅
  ---------------------------------------------------------------

### 7.27 Fields Removed from MVP

  --------------------------------------------------------------
  Field                Reason               Moved To
  -------------------- -------------------- --------------------
  Tags                 Simplified for MVP   Pro

  Priority             Advanced workflow    Pro

  Source               Marketing feature    Pro

  Equipment Assignment Requires equipment   Pro
                       module               

  Crew Assignment      Enterprise           Enterprise
                       scheduling           
  --------------------------------------------------------------

**Decision (May 15, 2026):** "No tags in MVP. No tags in MVP. That's
clear."

### 7.28 Features NOT in MVP Jobs Module

  --------------------------------------------------------------
  Feature              Moved To             Reason
  -------------------- -------------------- --------------------
  Tags on Jobs         Pro                  Simplified for MVP

  Unscheduled Jobs     Pro                  Jobs auto-schedule
  Panel                                     in MVP

  Equipment Tab        Pro                  Requires equipment
                                            module

  Activity Tab         Pro                  Audit trail feature

  Multiple Crew        Enterprise           Advanced scheduling
  Assignment                                

  Route Optimization   Pro                  Advanced feature

  Real-time GPS        Enterprise           Mobile feature
  Tracking                                  
  --------------------------------------------------------------

------------------------------------------------------------------------

## 8. Items Module

### 8.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Purpose**          Central repository for all items,
                       services, and assets used in business
                       operations

  **Importance**       Foundation of entire system - populates
                       estimates, invoices, jobs

  **Complexity**       High - powerful module with multiple
                       item types

  **Design             "Extremely powerful items module, and
  Philosophy**         it's very simple at the same time"
  ------------------------------------------------------------

**Design Decision (May 7, 2026):** "We have price book, service items,
material items, equipment items, asset items, and fees. Extremely
powerful item module."

### 8.2 Item Types (Predefined - No "Others" Category)

  -------------------------------------------------------------------
  \#    Type            Description             MVP Status
  ----- --------------- ----------------------- ---------------------
  1     **Price Book**  Customer-facing service ✅ First priority
                        items with pricing      

  2     **Service**     Internal service        ✅
                        definitions             

  3     **Material**    Physical materials used ✅
                        in services             

  4     **Equipment**   Tools and equipment     ✅

  5     **Assets**      Company assets          ✅
                        (vehicles, etc.)        

  6     **Fees**        Additional fees and     ✅
                        charges                 

  7     ~~Others~~      ❌ **REMOVED**          N/A
  -------------------------------------------------------------------

**Decision (May 7, 2026):** "Remove 'Others' category - it becomes a
dumping ground for uncategorized items. All items must fit defined
types."

### 8.3 Item Types Display

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Display Method                 **Tabs** (not dropdown)

  Visibility                     Tabs visible immediately upon
                                 entering Items module

  Position                       Horizontal tabs at top of item
                                 list

  Rationale                      Helps non-software-savvy users
                                 find what they need
  -------------------------------------------------------------

**Decision (May 7, 2026):** "The one man, one van. Sometimes they don't
have mental capacity to find those things. But if it's in front of them,
they see, they go to items and I see price book. Oh, I know it's price
book here."

#### Item Type Use Cases

  -------------------------------------------------------------
  Item Type                      Example Use Case
  ------------------------------ ------------------------------
  Price Book                     Services shown on estimates
                                 and invoices to customers

  Service                        Internal tracking of service
                                 labor

  Material                       Cleaning supplies, replacement
                                 parts, consumables

  Equipment                      Tools, machinery, portable
                                 equipment

  Assets                         Company vehicles, trailers,
                                 large equipment

  Fees                           Dispatch fees, emergency fees,
                                 travel fees
  -------------------------------------------------------------

### 8.4 Item Fields (MVP)

  -------------------------------------------------------------------
  Field           Type              MVP Status      Notes
  --------------- ----------------- --------------- -----------------
  Item ID         Auto-generated    ✅              System-assigned
                  number                            

  Status          Active/Inactive   ✅              Toggle field

  Name            Text              ✅              Item name
                                                    (internal)

  Description     Text              ✅              Internal
                                                    description

  Sales           Text              ✅              Customer-facing
  Description                                       description

  Additional      Text              ✅              Extended details
  Information                                       

  Retail Price    Currency          ✅              What customer
                                                    pays

  Cost            Currency          ✅              What company pays

  Category        Dropdown          ✅              Customizable in
                                                    Settings

  Manufacturer    Dropdown          ✅              Dropdown
                                                    selection

  Tax Profile     Dropdown          ✅              Configured in
                                                    Settings

  Taxable         Yes/No            ✅              Toggle for tax
                                                    application

  Vendor          Dropdown          ✅              **Must be
                                                    dropdown, not
                                                    free text**

  Pictures        Image upload      ✅              Visual reference

  Notes           Small text field  ✅              Additional notes

  Custom Field 1  Configurable      ✅              User-defined in
                                                    Settings

  Custom Field 2  Configurable      ✅              User-defined in
                                                    Settings
  -------------------------------------------------------------------

**Vendor Field Decision (May 7, 2026):** "I would like to have vendor
dropdown window so you are not typing."

**Decision (May 22, 2026):** "So that needs to be vendor. And then we
need to select the vendor. Name the vendor from the list. Like we are
doing this with clients and we select the county."

### 8.5 Description Fields Explained

  ---------------------------------------------------------------
  Field             Purpose             Visible To
  ----------------- ------------------- -------------------------
  **Name**          Short item          Internal use, list view
                    identifier          

  **Description**   Detailed internal   Internal only
                    description         

  **Sales           Customer-facing     Estimates, Invoices
  Description**     text                

  **Additional      Extended details    Both internal and
  Information**                         customer
  ---------------------------------------------------------------

**Example:** - Name: "AC Diagnostic" - Description: "Standard 1-hour
diagnostic including system check" - Sales Description: "Complete A/C
System Diagnostic and Performance Check"

### 8.6 Pricing Structure

  --------------------------------------------------------------
  Field                Description          Example
  -------------------- -------------------- --------------------
  **Retail Price**     Price charged to     \$150.00
                       customer             

  **Cost**             Price company pays   \$50.00

  **Profit Margin**    Difference           \$100.00 / 66.7%
                       (calculated)         
  --------------------------------------------------------------

**Use Case:** Material item costs company \$50 (vendor price), sold to
customer for \$150. Profit margin automatically calculated.

### 8.7 Category Configuration

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Customization                  Fully customizable in Settings

  Industry-Specific              Different industries have
                                 different categories

  Item Type-Specific             Categories change based on
                                 item type

  Management                     Settings → System Preferences
                                 → Item Categories
  -------------------------------------------------------------

#### Category Examples by Industry

  -------------------------------------------------------------
  Industry                       Sample Categories
  ------------------------------ ------------------------------
  HVAC                           Refrigerant, Copper,
                                 Electrical, Filters

  Roofing                        Shingles, Flashing,
                                 Underlayment, Fasteners

  Cleaning                       Chemicals, Equipment,
                                 Supplies, Protective Gear

  Plumbing                       Pipes, Fittings, Fixtures,
                                 Tools
  -------------------------------------------------------------

**Decision (May 7, 2026):** "Categories are fully customizable in
Settings. Different industries have different categories."

### 8.8 Tax Profile System

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  Configuration Location Settings → Finance Center → Tax
                         Rates/Profiles

  Selection Method       Dropdown selection (not manual
                         percentage entry)

  Profile Structure      Can include multiple tax rates

  Default Profile        One profile can be set as default
  ------------------------------------------------------------

#### Tax Profile Structure

  --------------------------------------------------------------
  Component            Description          Example
  -------------------- -------------------- --------------------
  Profile Name         Label for tax        "NY State + County
                       combination          Tax"

  Tax Rate 1           First tax rate       NY State: 7%

  Tax Rate 2           Second tax rate      NY County: 0.25%

  Tax Rate 3           Third tax rate       Local: 0.5%

  Total                Combined percentage  7.75%
  --------------------------------------------------------------

**Decision (May 7, 2026):** "Tax profile will be Polish sales tax, 23%,
okay? But not selecting 23%, just select the tax profile."

### 8.9 Taxable Field

  -------------------------------------------------------------
  Setting                        Behavior
  ------------------------------ ------------------------------
  Taxable = Yes                  Tax profile applied to item on
                                 invoices/estimates

  Taxable = No                   No tax applied regardless of
                                 profile
  -------------------------------------------------------------

**Use Case:** Some items (like labor in certain states) are not
taxable - toggle to No.

### 8.10 Vendor Management

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Field Type                     Dropdown (NOT free text)

  Vendor List                    Configurable in Settings

  Selection                      Select vendor from predefined
                                 list

  Purpose                        Prevents misspellings and
                                 inconsistent data
  -------------------------------------------------------------

**Decision (May 7, 2026):** "Not vendor name. I would like to have
vendor dropdown window so you are not typing."

**Rationale (May 22, 2026):** "In all reality, nobody is using unlimited
amount of vendors. Everybody is using typically the same vendors. And if
you let people type something in the field, they will type one vendor 20
different ways."

### 8.11 Item Fields Removed from MVP

  -----------------------------------------------------------------
  Field            Moved To                 Reason
  ---------------- ------------------------ -----------------------
  Subcategory      Pro/Enterprise           Simplified for MVP

  Department       Pro/Enterprise           Enterprise feature

  Group            Pro/Enterprise           Advanced organization

  Inventory        Pro/Enterprise           Requires inventory
  Tracking                                  module

  Vendor Code      Enterprise               Advanced vendor
                                            management

  Accounting Codes Enterprise               QuickBooks/accounting
  (9 codes)                                 integration

  Warranty         Pro                      Advanced feature
  Information                               

  Monthly Payment  Enterprise               Financing scenarios
  Fields                                    

  Additional       Enterprise               MVP limited to 2
  Custom Fields                             
  (3+)                                      
  -----------------------------------------------------------------

**Decision (May 7, 2026):** "Group, group we are removing from MVP.
Inventory is not in the MVP. Vendor code, I moved the vendor code to
enterprise."

### 8.12 Item List Page

#### Standard Page Header (Left to Right)

  -------------------------------------------------------------
  Position              Element             Example
  --------------------- ------------------- -------------------
  Left                  Entity Name with    "Items (43)"
                        Count               

  Left                  Item Type Tabs      Price Book,
                                            Service, Material,
                                            Equipment, Assets,
                                            Fees

  Left                  Three Quick Filters Status, Category,
                                            Price Range

  Left                  Advanced Filter     Opens right-side
                        Icon                panel

  Right                 Local Search        "Search Items"

  Right                 Create Button       "+ Create Item"

  Right                 Kebab Menu          More actions
  -------------------------------------------------------------

### 8.13 Items Quick Filters

  ---------------------------------------------------------------
  Filter \#       Type            Name            Options
  --------------- --------------- --------------- ---------------
  1               Dropdown        Status          Active,
                                                  Inactive, All

  2               Dropdown        Category        (Configured
                                                  categories from
                                                  Settings)

  3               Dropdown        Price Range     All, Under
                                                  \$50,
                                                  \$50-\$200,
                                                  Over \$200
  ---------------------------------------------------------------

### 8.14 Item Type Tab Behavior

  -------------------------------------------------------------
  Feature                        Behavior
  ------------------------------ ------------------------------
  Default Tab                    Price Book (most commonly
                                 used)

  Tab Click                      Filters list to show only that
                                 item type

  Count Display                  Show count per tab (e.g.,
                                 "Price Book (12)")

  Quick Switch                   One click to switch between
                                 types
  -------------------------------------------------------------

### 8.15 Items Kebab Menu Actions

#### Page Level (List View)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅
  -------------------------------------------------------------

#### Record Level (Item Profile)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Item                      ✅

  Duplicate Item                 ✅

  Inactivate                     ✅

  Print Item Details             ✅
  -------------------------------------------------------------

### 8.16 Create Item Form

#### Required Fields

  --------------------------------------------------------------
  Field                Required             Notes
  -------------------- -------------------- --------------------
  Item Type            ✅ Required          Select from tabs or
                                            dropdown

  Name                 ✅ Required          Internal item name

  Status               ✅ Required          Defaults to Active

  Retail Price         ✅ Required          Customer price
  --------------------------------------------------------------

#### Optional Fields

  -------------------------------------------------------------
  Field                          Notes
  ------------------------------ ------------------------------
  Description                    Internal description

  Sales Description              Customer-facing description

  Additional Information         Extended details

  Cost                           Company cost

  Category                       From configured categories

  Manufacturer                   From dropdown

  Tax Profile                    From configured profiles

  Taxable                        Yes/No toggle

  Vendor                         From dropdown

  Pictures                       Image upload

  Notes                          Additional notes

  Custom Field 1 & 2             As configured
  -------------------------------------------------------------

### 8.17 Item Details Page Layout

  -------------------------------------------------------------
  Section                        Content
  ------------------------------ ------------------------------
  Header                         Item name, status badge, item
                                 type indicator

  Basic Information              Name, description, sales
                                 description, additional info

  Pricing                        Retail price, cost, profit
                                 margin (calculated)

  Classification                 Category, manufacturer, vendor

  Tax Settings                   Tax profile, taxable toggle

  Media                          Pictures gallery

  Notes                          Notes field

  Custom Fields                  Custom Field 1 & 2
  -------------------------------------------------------------

### 8.18 Help/Education Bar

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Location                       Below items table

  Purpose                        Brief explanation of item
                                 types for new users

  Content                        Description of each item type
                                 and when to use it

  Dismissible                    X button to close

  Permanent Hide                 "Don't show again" option

  Visibility                     Appears every time user enters
                                 Items until dismissed
  -------------------------------------------------------------

**Decision (May 7, 2026):** "This thing, this bottom bar, about items,
will be also below the list."

### 8.19 Column Customization

  -------------------------------------------------------------
  Feature                        MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅ Via kebab menu

  Drag-and-Drop Columns          ✅ Reorder columns by dragging

  Column Visibility              ✅ Show/hide specific columns
  -------------------------------------------------------------

**Decision (May 11, 2026):** "Column drag & drop working. Reorder
columns by dragging."

### 8.20 Pagination

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Records per Page               Default 10, options: 10, 25,
                                 50, 100

  Display                        "Showing 1 to 10 of 43
                                 results"

  Navigation                     Page numbers with
                                 next/previous

  Location                       Below items table
  -------------------------------------------------------------

### 8.21 Search Functionality

  -------------------------------------------------------------
  Search Type                    Scope
  ------------------------------ ------------------------------
  Local Search                   Searches within Items module
                                 only

  Search Fields                  Name, description, sales
                                 description

  Placeholder                    "Search Items"
  -------------------------------------------------------------

**Decision (May 7, 2026):** "I really like if we go to items. I really
like the search. The search on the left side."

### 8.22 Bulk Actions

  -------------------------------------------------------------
  Action                         Available
  ------------------------------ ------------------------------
  Select All                     ✅ Checkbox in table header

  Individual Select              ✅ Checkbox per row

  Selection Count                ✅ Display "X selected"

  Export                         ✅ Export selected records

  Inactivate                     ✅ Archive selected

  Delete                         ❌ Cannot delete items (data
                                 integrity)
  -------------------------------------------------------------

### 8.23 Import/Export

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Import Format                  CSV, Excel

  Export Format                  CSV, Excel, PDF

  Field Mapping                  Map import columns to item
                                 fields

  Validation                     Check for duplicates, required
                                 fields
  -------------------------------------------------------------

### 8.24 Item Relationships

  -------------------------------------------------------------
  Relationship                   Description
  ------------------------------ ------------------------------
  Estimates                      Items selected from Price Book
                                 for estimates

  Invoices                       Items appear on invoice line
                                 items

  Jobs                           Items tab on jobs tracks
                                 materials used

  Expenses                       Material items linked to
                                 expense records
  -------------------------------------------------------------

**Decision (May 11, 2026):** "Estimate will be easy, just one form,
because it comes from items."

### 8.25 Features NOT in MVP Items Module

  -----------------------------------------------------------------------
  Feature                        Moved To               Reason
  ------------------------------ ---------------------- -----------------
  Inventory Tracking             Pro/Enterprise         Requires
                                                        inventory module

  Subcategory/Department/Group   Pro/Enterprise         Simplified
                                                        organization

  Vendor Code                    Enterprise             Advanced vendor
                                                        management

  Accounting Codes               Enterprise             QuickBooks
                                                        integration

  Warranty Information           Pro                    Advanced feature

  Monthly Payment Fields         Enterprise             Financing
                                                        scenarios

  Custom Item Types              Pro/Enterprise         MVP uses
                                                        predefined types

  Additional Custom Fields (3+)  Enterprise             MVP limited to 2

  Barcode/SKU Scanning           Pro/Enterprise         Advanced feature

  Low Stock Alerts               Pro/Enterprise         Requires
                                                        inventory
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 9. Estimates Module

### 9.1 Module Overview

  -------------------------------------------------------------
  Aspect                         Specification
  ------------------------------ ------------------------------
  **Purpose**                    Create and send professional
                                 quotes to customers

  **Benchmark**                  Invoice Simple estimate
                                 functionality

  **Complexity**                 Medium - form-based with price
                                 book integration

  **Relationship**               Can convert to Invoice once
                                 approved
  -------------------------------------------------------------

**Design Decision (May 19, 2026):** "The top right corner is the most
important. How much is this estimate for? And the status of this
estimate."

### 9.2 Estimate Page Layout

#### Header Section (Top Right Corner - Most Important Area)

  ------------------------------------------------------------
  Element          Position           Description
  ---------------- ------------------ ------------------------
  **Estimate       Top right,         Dollar amount (e.g.,
  Total**          prominent          "\$6,735.00") - always
                                      visible

  **Estimate       Top right, next to Status badge with color
  Status**         total              coding
  ------------------------------------------------------------

**Business Value (May 19, 2026):** "If somebody enters multiple items,
you might go very low on the screen. So I also enter the total amount in
here. You will see estimate for \$6,735."

#### Customer Information Section

  -------------------------------------------------------------
  Element                        Description
  ------------------------------ ------------------------------
  Customer Name                  Who the estimate is for

  Billing Address                Customer's billing address

  Service Location               Where work will be performed

  Company Name/Logo              Service provider's branding

  Estimate Number                Auto-generated unique
                                 identifier

  Estimate Date                  Date created
  -------------------------------------------------------------

### 9.3 Estimate Tab Structure

  --------------------------------------------------------------------------
  Tab Name        Purpose           Content               Visibility
  --------------- ----------------- --------------------- ------------------
  **Details**     Primary tab -     Items,                Always visible
                  daily use         pictures/documents,   
                                    estimate-specific     
                                    notes                 

  **Deposit**     Conditional       Deposit calculation   Only when "Deposit
                                    and payment settings  Required" = ON

  **Notes**       Secondary -       Legal terms &         Always visible
                  rarely edited     conditions,           
                                    disclaimers, footer   
                                    notes                 

  **Activity**    Reference/audit   Complete history of   Always visible
                                    estimate lifecycle    
  --------------------------------------------------------------------------

### 9.4 Details Tab Content

  ------------------------------------------------------------
  Section                  Description
  ------------------------ -----------------------------------
  **Items Table**          List of items from price book
                           (name, description, quantity,
                           price, total)

  **Pictures/Documents     Miniature thumbnails with preview
  Gallery**                panel (like File Explorer)

  **Estimate Notes**       Job-specific special instructions -
                           prominently displayed

  **Subtotal**             Sum before tax

  **Tax**                  Calculated from tax profile

  **Discount**             Optional discount amount

  **Total**                Final estimate amount
  ------------------------------------------------------------

**Decision (May 19, 2026):** "These are the most important things that
everybody will look at all the time. What kind of items we selected from
the price book? What is the total amount?"

### 9.5 Estimate Statuses

  -----------------------------------------------------------------
  Status         Color     Description        Trigger Event
  -------------- --------- ------------------ ---------------------
  **Draft**      Gray      Estimate created   Initial creation
                           but not finalized  

  **Sent**       Blue      Estimate sent to   User clicks "Send"
                           customer           

  **Viewed**     Yellow    Customer opened    System tracks when
                           the estimate       customer opens email

  **Approved**   Green     Customer accepted  Customer completes
                           and signed         signature

  **Rejected**   Red       Customer declined  Customer clicks
                                              reject

  **Expired**    Dark Gray No action within   Automatic after 30
                           validity period    days (configurable)

  **Archived**   Gray      Manually closed    User changes status
  -----------------------------------------------------------------

**Decision (May 19, 2026):** "Draft, Sent, Viewed by customer, Approved
or Rejected, Expired after 30 days. Those statuses give us everything -
tell us all life of this estimate."

#### Status Tracking

  ------------------------------------------------------------
  Feature                  Description
  ------------------------ -----------------------------------
  Instant Notification     Push notification when customer
                           views estimate (like Invoice
                           Simple)

  Activity Log             Complete history: created, sent,
                           viewed, approved/rejected

  Expiration Timer         Automatic countdown to expiration
  ------------------------------------------------------------

### 9.6 Estimate Notes Types

  ----------------------------------------------------------------
  Note Type      Location      Purpose        Edit Frequency
  -------------- ------------- -------------- --------------------
  **Estimate     Details tab   Job-specific   Every estimate
  Notes**        (prominent)   special        
                               instructions   

  **Footer       Bottom of PDF Thank you      Optional
  Notes**                      message,       
                               customizable   
                               per estimate   

  **Legal        Notes tab     Terms,         Rarely - once per
  Notes**        (hidden)      conditions,    company
                               disclaimers    
                               (pages 3-4 of  
                               PDF)           
  ----------------------------------------------------------------

**Decision (May 19, 2026):** "999 estimates out of 1000, nobody cares
about those legal notes, so they don't have to be in front of you all
the time. They're on the sideline in the Notes tab."

#### Estimate Notes Examples

  -------------------------------------------------------------
  Note Type                         Example
  --------------------------------- ---------------------------
  Estimate Notes                    "Customer wants trees cut
                                    in back but DO NOT walk on
                                    right side - new citrus
                                    tree planted"

  Footer Notes                      "Thank you for your
                                    business!" (pre-populated,
                                    editable per estimate)

  Legal Notes                       Warranties, disclaimers,
                                    terms & conditions (static,
                                    rarely changed)
  -------------------------------------------------------------

### 9.7 Deposit Configuration

  ------------------------------------------------------------
  Setting                      Behavior
  ---------------------------- -------------------------------
  "Deposit Required" Switch =  Deposit tab visible, deposit
  ON                           info appears on PDF

  "Deposit Required" Switch =  Deposit tab hidden
  OFF                          
  ------------------------------------------------------------

**Decision (May 19, 2026):** "It goes company by company. One company
requires deposits all the time. My company does not require deposits at
all."

#### Deposit Calculation Methods

  --------------------------------------------------------------
  Method               Example              Use Case
  -------------------- -------------------- --------------------
  Fixed Dollar Amount  "\$1,500 deposit"    Standard deposit
                                            amount

  Percentage of Total  "15% = \$1,010.25"   Scales with estimate
                                            size
  --------------------------------------------------------------

#### Deposit Tab Content

  -------------------------------------------------------------
  Element                        Description
  ------------------------------ ------------------------------
  Deposit Amount                 Calculated based on method

  Payment Collection             Credit card payment
                                 integration

  Deposit Status                 Collected / Not Collected
  -------------------------------------------------------------

### 9.8 Pictures/Documents Section

  -------------------------------------------------------------
  Feature         Description             MVP Status
  --------------- ----------------------- ---------------------
  Miniature       Small thumbnail icons   ✅
  Gallery                                 

  Preview Panel   Like File Explorer -    ✅
                  click to see larger     
                  view                    

  Quick           Click through pictures  ✅
  Navigation      (next, next, next)      

  Include in PDF  Pictures appear in      ✅
                  estimate PDF sent to    
                  customer                
  -------------------------------------------------------------

**Decision (May 19, 2026):** "The pictures are extremely important. You
click on one and you see on the right side. You can click, click, click,
next, next, next - see what the estimate is about."

### 9.9 Estimate Templates (MVP)

  ------------------------------------------------------------
  Requirement                 Specification
  --------------------------- --------------------------------
  Template Count              3-4 pre-built templates

  Selection Method            Dropdown during estimate
                              creation

  Customization               ❌ No custom templates in MVP -
                              select from pre-built only

  Template Styles             Different visual layouts (same
                              fields, different look)
  ------------------------------------------------------------

#### PDF Sizes

  --------------------------------------------------------------
  Size                 Dimensions           Use Case
  -------------------- -------------------- --------------------
  Letter               8.5" × 11"           Standard US paper

  Legal                8.5" × 14"           Longer documents
                                            with more terms
  --------------------------------------------------------------

### 9.10 Estimate PDF Content

  -------------------------------------------------------------
  Section                        Content
  ------------------------------ ------------------------------
  Header                         Company logo, company name,
                                 estimate number, date

  Recipient                      Customer name, billing address

  Service Location               Service address

  Items Table                    Item name, description,
                                 quantity, price, amount

  Financials                     Subtotal, Tax, Discount, Total

  Deposit                        Deposit amount (if required)

  Pictures                       Attached photos

  Footer Notes                   Thank you message

  Terms & Conditions             Legal notes (additional pages)

  Signature Area                 Digital signature capture
  -------------------------------------------------------------

### 9.11 Estimate Actions

#### Send Estimate

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Email                          Send PDF via email to customer

  Preview                        View what customer will see
                                 before sending

  Resend                         Resend estimate if needed
  -------------------------------------------------------------

#### Customer Actions

  ------------------------------------------------------------
  Action              System Response
  ------------------- ----------------------------------------
  Open Email          Status changes to "Viewed", notification
                      sent to company

  Request Changes     Company notified, can update and resend

  Approve & Sign      Digital signature captured, status
                      changes to "Approved"

  Reject              Status changes to "Rejected", company
                      notified
  ------------------------------------------------------------

### 9.12 Activity Tab

  -------------------------------------------------------------
  Event                          Logged Information
  ------------------------------ ------------------------------
  Estimate Created               Date, time, created by

  Estimate Sent                  Date, time, sent to (email)

  Estimate Viewed                Date, time customer opened

  Changes Requested              Customer comments

  Estimate Updated               Date, time, updated by

  Estimate Approved              Date, time, customer signature

  Estimate Rejected              Date, time
  -------------------------------------------------------------

**Decision (May 19, 2026):** "Estimate created today by this guy.
Estimate sent three minutes later. Estimate viewed - means somebody
opened. Invoice Simple gives you this notification on your cell phone
instantly."

### 9.13 Estimate List Page

#### Standard Page Header

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Estimates (15)"
                       Count                

  Left                 Three Quick Filters  Status, Date, Amount
                                            Range

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Estimates"

  Right                Create Button        "+ Create Estimate"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 9.14 Estimates Quick Filters

  --------------------------------------------------------------
  Filter \#           Type        Name        Options
  ------------------- ----------- ----------- ------------------
  1                   Dropdown    Status      Draft, Sent,
                                              Viewed, Approved,
                                              Rejected, Expired,
                                              Archived

  2                   Date Picker Date        Standard date
                                  Created     picker options

  3                   Dropdown    Amount      All, Under
                                  Range       \$1,000,
                                              \$1,000-\$5,000,
                                              Over \$5,000
  --------------------------------------------------------------

### 9.15 Estimates Kebab Menu Actions

#### Page Level (List View)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅
  -------------------------------------------------------------

#### Record Level (Estimate Profile)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Send Estimate                  ✅

  Resend Estimate                ✅

  Preview PDF                    ✅

  Print Estimate                 ✅

  Duplicate Estimate             ✅

  Create Invoice                 ✅ (converts approved estimate
                                 to invoice)

  Inactivate                     ✅
  -------------------------------------------------------------

### 9.16 Create Estimate Form

#### Required Fields

  --------------------------------------------------------------
  Field                Required             Notes
  -------------------- -------------------- --------------------
  Customer             ✅ Required          Select from existing
                                            clients

  Service Address      ✅ Required          From customer's
                                            addresses

  At Least One Item    ✅ Required          From price book
  --------------------------------------------------------------

#### Optional Fields

  -------------------------------------------------------------
  Field                          Notes
  ------------------------------ ------------------------------
  Estimate Date                  Defaults to today

  Expiration Date                Defaults to 30 days

  Estimate Notes                 Job-specific instructions

  Deposit Required               Toggle switch

  Template Selection             Dropdown of pre-built
                                 templates

  Pictures/Documents             Upload attachments
  -------------------------------------------------------------

### 9.17 Estimate to Invoice Conversion

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Trigger                        "Create Invoice" action from
                                 approved estimate

  Data Transfer                  All items, amounts, customer
                                 info copied to invoice

  Relationship                   Invoice linked to original
                                 estimate
  -------------------------------------------------------------

**Decision (May 19, 2026):** "There has to be create the invoice from
this estimate."

### 9.18 Features NOT in MVP Estimates Module

  --------------------------------------------------------------
  Feature              Moved To             Reason
  -------------------- -------------------- --------------------
  Custom Templates     Pro/Enterprise       MVP uses pre-built
                                            only

  Multi-Option         Pro                  Multiple pricing
  Estimates                                 options

  Estimate Packages    Pro                  Bundle options

  Advanced Signature   Pro                  Beyond basic digital
  Settings                                  signature

  Custom PDF Fields    Enterprise           MVP uses standard
                                            fields
  --------------------------------------------------------------

------------------------------------------------------------------------

## 10. Invoices Module

### 10.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Purpose**          Generate and send invoices for
                       completed work

  **Benchmark**        Invoice Simple invoice functionality

  **Complexity**       Medium - similar structure to Estimates

  **Relationship**     Can be created from Estimate or Job, or
                       standalone
  ------------------------------------------------------------

### 10.2 Invoice Page Layout

#### Header Section (Top Right Corner)

  ------------------------------------------------------------
  Element          Position           Description
  ---------------- ------------------ ------------------------
  **Invoice        Top right,         Dollar amount
  Total**          prominent          

  **Invoice        Top right, next to Status badge with color
  Status**         total              

  **Balance Due**  Top right, below   Outstanding amount
                   total              
  ------------------------------------------------------------

#### Customer Information Section

  -------------------------------------------------------------
  Element                        Description
  ------------------------------ ------------------------------
  Customer Name                  Bill to customer

  Billing Address                Customer's billing address

  Invoice Number                 Auto-generated (Customer
                                 Number + Sequential)

  Invoice Date                   Date created

  Due Date                       Payment due date
  -------------------------------------------------------------

### 10.3 Invoice Statuses (MVP)

  -------------------------------------------------------------
  Status            Color           Description
  ----------------- --------------- ---------------------------
  **Unpaid**        Red             Invoice sent, no payment
                                    received

  **Overdue**       Dark Red        Past due date, no payment

  **Partially       Yellow          Some payment received,
  Paid**                            balance remaining

  **Paid**          Green           Full payment received

  **Void**          Gray            Invoice cancelled
  -------------------------------------------------------------

**Decision (May 22, 2026):** "For MVP, we need unpaid, overdue, paid,
partially paid and void. We don't have deposited/not deposited - that's
the next level of accounting requiring bank connection."

#### Statuses NOT in MVP

  --------------------------------------------------------------
  Status               Reason               Moved To
  -------------------- -------------------- --------------------
  Deposited            Requires bank        Pro
                       account connection   

  Draft                Simplified workflow  Pro
                       for MVP              

  Pending Approval     Advanced workflow    Pro
  --------------------------------------------------------------

### 10.4 Invoice Tab Structure

  -------------------------------------------------------------
  Tab Name              Purpose             Content
  --------------------- ------------------- -------------------
  **Details**           Primary tab         Items, amounts,
                                            invoice notes

  **Payments**          Payment tracking    Payments received
                                            against this
                                            invoice

  **Notes**             Terms & conditions  Footer notes, legal
                                            text

  **Activity**          Audit trail         Invoice lifecycle
                                            history
  -------------------------------------------------------------

### 10.5 Details Tab Content

  -------------------------------------------------------------
  Section                        Description
  ------------------------------ ------------------------------
  Items Table                    Line items with description,
                                 quantity, rate, amount

  Subtotal                       Sum before tax

  Tax                            Calculated from tax profile

  Discount                       Optional discount

  Total                          Invoice total

  Payments                       Amount paid

  Balance Due                    Remaining amount
  -------------------------------------------------------------

### 10.6 Invoice List Page

#### Standard Page Header

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Invoices (45)"
                       Count                

  Left                 Three Quick Filters  Status, Date,
                                            Balance

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Invoices"

  Right                Create Button        "+ Create Invoice"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 10.7 Invoices Quick Filters

  ---------------------------------------------------------------
  Filter \#       Type            Name            Options
  --------------- --------------- --------------- ---------------
  1               Dropdown        Status          Unpaid,
                                                  Overdue,
                                                  Partially Paid,
                                                  Paid, Void

  2               Date Picker     Invoice Date    Standard date
                                                  picker options

  3               Dropdown        Balance         All, With
                                                  Balance, No
                                                  Balance
  ---------------------------------------------------------------

### 10.8 Invoice Numbering (MVP)

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Format                         Customer Number + Slash +
                                 Sequential (e.g.,
                                 "10245/I-001")

  Auto-Generation                System generates automatically

  Customization                  ❌ No custom format in MVP
  -------------------------------------------------------------

**Benefit:** Looking at "10245/I-003" immediately tells you: this is the
3rd invoice for customer 10245.

### 10.9 Invoice Templates

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Type                           Pre-built template selection
                                 only

  Template Count                 3-4 pre-built templates (same
                                 as Estimates)

  Customization                  Color theme changes only, no
                                 drag-drop customization

  Reference                      Invoice Simple style
  -------------------------------------------------------------

### 10.10 Invoice Actions

#### Send Invoice

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Email                          Send PDF via email to customer

  Preview                        View what customer will see

  Resend                         Resend if needed
  -------------------------------------------------------------

#### Payment Actions

  -------------------------------------------------------------
  Action                         Description
  ------------------------------ ------------------------------
  Collect Payment                Open payment collection flow

  Record Payment                 Manually record payment
                                 received

  Apply Deposit                  Apply existing deposit to
                                 invoice
  -------------------------------------------------------------

### 10.11 Invoices Kebab Menu Actions

#### Page Level (List View)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅

  Manage Duplicates              ✅

  Inactivate Selected            ✅
  -------------------------------------------------------------

#### Record Level (Invoice Profile)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Send Invoice                   ✅

  Email Invoice                  ✅

  Print Invoice                  ✅

  Collect Payment                ✅

  Record Payment                 ✅

  Duplicate Invoice              ✅

  Void Invoice                   ✅
  -------------------------------------------------------------

### 10.12 Create Invoice Form

#### Required Fields

  --------------------------------------------------------------
  Field                Required             Notes
  -------------------- -------------------- --------------------
  Customer             ✅ Required          Select from existing
                                            clients

  At Least One Item    ✅ Required          From price book or
                                            manual entry

  Invoice Date         ✅ Required          Defaults to today
  --------------------------------------------------------------

#### Optional Fields

  -------------------------------------------------------------
  Field                          Notes
  ------------------------------ ------------------------------
  Job                            Link to existing job

  Estimate                       Link to approved estimate

  Due Date                       Payment due date

  Invoice Notes                  Additional information

  Service Address                From customer's addresses
  -------------------------------------------------------------

### 10.13 Invoice Creation Sources

  -------------------------------------------------------------
  Source                         Description
  ------------------------------ ------------------------------
  Standalone                     Create new invoice from
                                 scratch

  From Estimate                  Convert approved estimate to
                                 invoice

  From Job                       Create invoice from completed
                                 job

  From Client Profile            Create invoice for specific
                                 client
  -------------------------------------------------------------

### 10.14 Payment Integration

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Stripe Integration             Accept credit card payments
                                 online

  Payment Link                   Send customer link to pay
                                 online

  Manual Recording               Record Zelle, Cash App, Cash,
                                 Check payments
  -------------------------------------------------------------

### 10.15 Invoice PDF Content

  -------------------------------------------------------------
  Section                        Content
  ------------------------------ ------------------------------
  Header                         Company logo, company name,
                                 invoice number, date

  Bill To                        Customer name, billing address

  Invoice Details                Invoice date, due date, terms

  Items Table                    Item name, description,
                                 quantity, rate, amount

  Financials                     Subtotal, Tax, Discount,
                                 Total, Payments, Balance Due

  Payment Instructions           How to pay (online link, check
                                 address)

  Footer Notes                   Thank you message, terms
  -------------------------------------------------------------

### 10.16 Overdue Invoice Handling

  ------------------------------------------------------------
  Feature                  Description
  ------------------------ -----------------------------------
  Automatic Status Change  Invoice changes to "Overdue" after
                           due date

  Visual Indicator         Red highlighting for overdue
                           invoices

  Filter                   Quick filter to see all overdue
                           invoices

  Collection Priority      Sort by days overdue for collection
                           calls
  ------------------------------------------------------------

### 10.17 Recurring Invoices

  --------------------------------------------------------------
  Feature              MVP Status           Notes
  -------------------- -------------------- --------------------
  Recurring Invoice    ✅                   Like recurring jobs
  Creation                                  

  Frequency Options    ✅                   Weekly, Monthly,
                                            Custom

  Auto-Send            ✅                   Automatically send
                                            on schedule
  --------------------------------------------------------------

**Decision (May 22, 2026):** "Invoice Simple handles recurring from the
invoice level. Jobber handles it from the job level. We handle it from
the job level with recurring jobs, but also support recurring invoices
for simple services."

### 10.18 Bulk Actions

  -------------------------------------------------------------
  Action                         Available
  ------------------------------ ------------------------------
  Select All                     ✅ Checkbox in table header

  Individual Select              ✅ Checkbox per row

  Selection Count                ✅ Display "X selected"

  Export                         ✅ Export selected records

  Send Reminders                 ✅ Send payment reminders to
                                 selected

  Void Selected                  ✅ Void multiple invoices
  -------------------------------------------------------------

### 10.19 Features NOT in MVP Invoices Module

  -------------------------------------------------------------
  Feature              Moved To               Reason
  -------------------- ---------------------- -----------------
  Custom Invoice       Pro                    MVP uses standard
  Numbering                                   format

  Custom Templates     Pro/Enterprise         MVP uses
  (drag-drop)                                 pre-built only

  Deposited/Not        Pro                    Requires bank
  Deposited Status                            connection

  Automated Collection Pro                    Advanced feature
  Workflows                                   

  Payment Plans        Pro                    Advanced feature

  Late Fees            Pro                    Advanced feature
  -------------------------------------------------------------

------------------------------------------------------------------------

## 11. Payments Module

### 11.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Purpose**          Track all payments received from
                       customers

  **Complexity**       Simple - straightforward payment
                       recording

  **Position**         Below Invoices in left navigation

  **Relationship**     Payments are linked to invoices (and
                       indirectly to jobs/clients)
  ------------------------------------------------------------

**Design Decision (May 7, 2026):** "Payment for specific invoice,
payment is dollar amount, method of the payment, status."

### 11.2 Payment Methods (MVP)

  ---------------------------------------------------------------
  Method          Integration     MVP Status      Notes
                  Type                            
  --------------- --------------- --------------- ---------------
  **Stripe**      Full            ✅              Primary payment
                  integration                     gateway

  **Zelle**       Manual          ✅              Reference
                  recording                       number entry

  **Cash App**    Manual          ✅              Reference
                  recording                       number entry

  **Cash**        Manual          ✅              Simple amount
                  recording                       entry

  **Check**       Manual          ✅              Check number
                  recording                       entry
  ---------------------------------------------------------------

**Decision (May 21, 2026):** "Most likely will be Stripe. Everybody's
using Stripe. I'm sure that they are using Stripe for a reason. It is
very flexible, very customizable, very convenient."

### 11.3 Payment Fields

  -------------------------------------------------------------
  Field       Type       Required         Description
  ----------- ---------- ---------------- ---------------------
  Payment     Date       ✅               When payment was
  Date                                    received

  Customer    Lookup     ✅               Who made the payment

  Invoice     Lookup     ✅               Which invoice payment
                                          applies to

  Amount      Currency   ✅               Dollar amount
                                          received

  Payment     Dropdown   ✅               Stripe, Zelle, Cash
  Method                                  App, Cash, Check

  Reference   Text       Optional         Transaction ID, check
  Number                                  number, etc.

  Status      Dropdown   ✅               System-managed

  Notes       Text       Optional         Additional
                                          information
  -------------------------------------------------------------

### 11.4 Payment Statuses

  --------------------------------------------------------------
  Status               Color                Description
  -------------------- -------------------- --------------------
  **Completed**        Green                Payment successfully
                                            processed

  **Pending**          Yellow               Payment initiated
                                            but not confirmed

  **Failed**           Red                  Payment attempt
                                            failed

  **Refunded**         Gray                 Payment was refunded
  --------------------------------------------------------------

### 11.5 Collect Payment Flow

#### Entry Points (Multiple Locations)

  -------------------------------------------------------------
  Location        Context        Pre-populated Data
  --------------- -------------- ------------------------------
  Client Profile  General        Customer only
  → Kebab Menu    payment for    
                  customer       

  Invoice Page →  Specific       Customer + Invoice
  Collect Payment invoice        

  Payments Module Generic entry  None
  → Create                       
  Payment                        
  -------------------------------------------------------------

**Decision (May 20, 2026):** "If you want to go general way and create
the payment, then you need to find the customer, then find the job,
which payment is for. But if you're on the invoice, collect the payment
for specific invoice - there is good logic behind this."

#### Collect Payment Form

  -------------------------------------------------------------
  Field                          Behavior
  ------------------------------ ------------------------------
  Customer                       Pre-filled if coming from
                                 client/invoice

  Invoice                        Pre-filled if coming from
                                 invoice; dropdown if from
                                 client

  Amount                         Defaults to balance due

  Method                         Dropdown selection

  Reference                      Optional text field
  -------------------------------------------------------------

### 11.6 Payment List Page

#### Standard Page Header

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Payments (28)"
                       Count                

  Left                 Three Quick Filters  Status, Date, Method

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Payments"

  Right                Create Button        "+ Create Payment"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 11.7 Payments Quick Filters

  ---------------------------------------------------------------
  Filter \#       Type            Name            Options
  --------------- --------------- --------------- ---------------
  1               Dropdown        Status          Completed,
                                                  Pending,
                                                  Failed,
                                                  Refunded

  2               Date Picker     Date            Standard date
                                                  picker options

  3               Dropdown        Method          Stripe, Zelle,
                                                  Cash App, Cash,
                                                  Check
  ---------------------------------------------------------------

### 11.8 Payments List Columns

  -------------------------------------------------------------
  Column                         Description
  ------------------------------ ------------------------------
  Date                           Payment date

  Customer                       Who paid

  Invoice                        Which invoice (with link)

  Amount                         Dollar amount

  Method                         Payment method

  Status                         Payment status with color
                                 badge
  -------------------------------------------------------------

**Decision (May 7, 2026):** "Date, client - we're skipping the client
because we know it's for this client. Payment for specific invoice,
payment is dollar amount, method of the payment, status."

### 11.9 Payments Kebab Menu Actions

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅
  -------------------------------------------------------------

### 11.10 Payment Record View

  -------------------------------------------------------------
  Section                        Content
  ------------------------------ ------------------------------
  Header                         Payment ID, Date, Amount,
                                 Status badge

  Details                        Customer, Invoice link,
                                 Method, Reference

  Related                        Link to invoice, link to job
                                 (if applicable)

  Notes                          Payment notes
  -------------------------------------------------------------

### 11.11 Stripe Integration

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Connection                     Settings → Integrations →
                                 Connect Stripe

  Accept Cards                   Credit/debit card payments

  Payment Links                  Send customer link to pay
                                 online

  Auto-Recording                 Stripe payments automatically
                                 recorded

  Notifications                  Real-time payment confirmation
  -------------------------------------------------------------

### 11.12 Manual Payment Recording

  -------------------------------------------------------------
  Method                         Required Information
  ------------------------------ ------------------------------
  Zelle                          Reference/confirmation number

  Cash App                       Transaction ID or Cashtag

  Cash                           Amount only (no reference
                                 needed)

  Check                          Check number
  -------------------------------------------------------------

### 11.13 Payment-Invoice Relationship

  -------------------------------------------------------------
  Scenario                       Result
  ------------------------------ ------------------------------
  Payment = Invoice Balance      Invoice status → "Paid"

  Payment \< Invoice Balance     Invoice status → "Partially
                                 Paid"

  Payment \> Invoice Balance     Overpayment (apply to future
                                 invoices)
  -------------------------------------------------------------

### 11.14 Features NOT in MVP Payments Module

  --------------------------------------------------------------
  Feature              Moved To             Reason
  -------------------- -------------------- --------------------
  Payment Plans        Pro                  Advanced feature

  Recurring Payments   Pro                  Requires
                                            subscription billing

  Auto-deposit         Pro                  Requires bank
  Tracking                                  connection

  Refund Processing    Pro                  MVP: manual refunds
                                            only

  Multiple Payment     Pro                  Simplified for MVP
  Methods per Invoice                       
  --------------------------------------------------------------

------------------------------------------------------------------------

## 12. Expenses Module

### 12.1 Module Overview

  -------------------------------------------------------------
  Aspect                         Specification
  ------------------------------ ------------------------------
  **Purpose**                    Track all business expenses
                                 and receipts

  **Complexity**                 Simple - "just a form"

  **Position**                   At bottom of left navigation
                                 order

  **Value**                      Revenue vs Expenses comparison
                                 for profitability
  -------------------------------------------------------------

**Design Decision (May 11, 2026):** "Expenses is just a form. What I
like about the homepage - you have revenue and expenses. So this is
priceless for Peter. He doesn't understand financials. But he
understands the column. The revenue is higher than expenses. Boom!"

### 12.2 Expense Fields (MVP)

  -----------------------------------------------------------------
  Field       Type           Required         Description
  ----------- -------------- ---------------- ---------------------
  Date        Date           ✅               When expense occurred

  Vendor      **Dropdown**   ✅               Must be dropdown, not
                                              free text!

  Amount      Currency       ✅               Total expense amount

  Category    Dropdown       ✅               Equipment, Material,
                                              Labor, etc.

  Assigned To Lookup         Optional         Job or Invoice this
                                              expense relates to

  Invoice     Text           Optional         Vendor's invoice
  Number                                      number (for
                                              reference)

  Receipt     Image upload   Optional         Photo of receipt

  Notes       Text           Optional         Additional
                                              information
  -----------------------------------------------------------------

**Vendor Dropdown Decision (May 22, 2026):** "Vendor needs to be
dropdown, not typed. Select the vendor from the list. Like we do with
clients and counties. In all reality, nobody is using unlimited amount
of vendors. If you let people type something in the field, they will
type one vendor 20 different ways."

### 12.3 Expense Categories (MVP)

  -------------------------------------------------------------
  Category           Description             Use Case
  ------------------ ----------------------- ------------------
  **Equipment**      Tools, machinery        Equipment pickup
                     purchased               for job

  **Material**       Physical                Parts, supplies
                     materials/supplies      for service

  **Labor**          Labor costs paid        Subcontractor
                                             payments

  **Commission**     Sales commission        Payment to sales
                                             person

  **Travel**         Transportation expenses Mileage, gas,
                                             travel costs

  **Other**          Miscellaneous expenses  Permits, licenses,
                                             other
  -------------------------------------------------------------

**Decision (April 23, 2026):** "All expenses - equipment, material,
sales commission - was 1200 and 300 and we pay for installers under the
labor tab."

### 12.4 Expense-Job Relationship

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Link to Job                    Expenses can be assigned to
                                 specific jobs

  Link to Invoice                Alternative: assign to invoice

  Roll-up                        Expenses roll up to job
                                 profitability KPIs
  -------------------------------------------------------------

**Decision (May 22, 2026):** "Let's say we created this expense here and
then the expense is assigned to the job. Or let's say material. This one
is assigned to the job."

### 12.5 "Add Another Expense" Feature

  -------------------------------------------------------------
  Feature                        Description
  ------------------------------ ------------------------------
  Purpose                        Quickly add multiple receipts
                                 to same job

  Behavior                       Copies previous selections
                                 (vendor, job, category)

  Location                       Button on expense detail page
  -------------------------------------------------------------

**Decision (May 22, 2026):** "Imagine I'm running one job and on the
weekend I have the stack of receipts. If you create one expense and then
you add another expense from this level, it will copy the previous job
selection into the new expense. So 22 expenses without searching for
this specific job 22 times. Extremely simple, powerful feature."

#### Add Another Expense Workflow

  -------------------------------------------------------------
  Step                           Pre-populated Data
  ------------------------------ ------------------------------
  1\. Create first expense       Select vendor, job, category
                                 manually

  2\. Click "Add Another         Vendor, Job, Category
  Expense"                       auto-filled

  3\. Enter new amount           Only amount and receipt change

  4\. Repeat                     Continue adding receipts to
                                 same job
  -------------------------------------------------------------

### 12.6 Expense List Page

#### Standard Page Header

  --------------------------------------------------------------
  Position             Element              Example
  -------------------- -------------------- --------------------
  Left                 Entity Name with     "Expenses (47)"
                       Count                

  Left                 Three Quick Filters  Category, Date,
                                            Vendor

  Left                 Advanced Filter Icon Opens right-side
                                            panel

  Right                Local Search         "Search Expenses"

  Right                Create Button        "+ Create Expense"

  Right                Kebab Menu           More actions
  --------------------------------------------------------------

### 12.7 Expenses Quick Filters

  -------------------------------------------------------------
  Filter \#           Type        Name        Options
  ------------------- ----------- ----------- -----------------
  1                   Dropdown    Category    Equipment,
                                              Material, Labor,
                                              Commission,
                                              Travel, Other

  2                   Date Picker Date        Standard date
                                              picker options

  3                   Dropdown    Vendor      (From vendor list
                                              in Settings)
  -------------------------------------------------------------

### 12.8 Expense List Columns

  -------------------------------------------------------------
  Column                         Description
  ------------------------------ ------------------------------
  Date                           Expense date

  Vendor                         Who was paid

  Amount                         Dollar amount

  Category                       Expense category

  Assigned To                    Job/Invoice (with link)

  Receipt                        Icon if receipt attached
  -------------------------------------------------------------

### 12.9 Expenses Kebab Menu Actions

#### Page Level (List View)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Columns                   ✅

  Import                         ✅

  Export                         ✅
  -------------------------------------------------------------

#### Record Level (Expense Detail)

  -------------------------------------------------------------
  Action                         MVP Status
  ------------------------------ ------------------------------
  Edit Expense                   ✅

  Duplicate Expense              ✅

  Add Another Expense            ✅

  Delete Expense                 ✅
  -------------------------------------------------------------

### 12.10 Create Expense Form

#### Required Fields

  --------------------------------------------------------------
  Field                Required             Notes
  -------------------- -------------------- --------------------
  Date                 ✅ Required          Defaults to today

  Vendor               ✅ Required          Dropdown selection

  Amount               ✅ Required          Dollar amount

  Category             ✅ Required          Dropdown selection
  --------------------------------------------------------------

#### Optional Fields

  -------------------------------------------------------------
  Field                          Notes
  ------------------------------ ------------------------------
  Assigned To (Job/Invoice)      Link expense to specific job

  Invoice Number                 Vendor's invoice number for
                                 reference

  Receipt                        Upload photo or scan

  Notes                          Additional details
  -------------------------------------------------------------

### 12.11 Receipt Upload

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Upload Source                  Desktop file upload or mobile
                                 camera

  File Types                     JPG, PNG, PDF

  Preview                        Thumbnail in expense record

  Storage                        Attached to expense record
  -------------------------------------------------------------

**Decision (May 22, 2026):** "Upload, take photo. Perfect."

### 12.12 Vendor Invoice Number Field

  -------------------------------------------------------------
  Feature                        Purpose
  ------------------------------ ------------------------------
  Field                          Text input for vendor's
                                 invoice number

  Use Case                       Reference when calling vendor
                                 about expense
  -------------------------------------------------------------

**Decision (May 22, 2026):** "If I have the invoice from the vendor and
top right corner is the invoice number. I like to have field to enter
the invoice number. So you can call the vendor and say, hey, I have this
invoice here from you. The invoice number is this and this."

### 12.13 Expense Entry Locations

  --------------------------------------------------------------
  Location             Context              Pre-populated Data
  -------------------- -------------------- --------------------
  Expenses Module →    General entry        None
  Create                                    

  Job Page → Expense   Job-specific expense Job assignment
  Tab                                       

  Expense Record → Add Batch entry          Vendor, Job,
  Another                                   Category
  --------------------------------------------------------------

**Decision (May 22, 2026):** "If we go here, we can have create the
expense, but they will be generic from the highest level. We don't know
which customer, we don't know which job. But if we were in specific
expense, then we selected the job."

### 12.14 Expense Reporting Integration

  -------------------------------------------------------------
  Report                         Expense Data Included
  ------------------------------ ------------------------------
  Expense Report                 All expenses by category/date

  Job Report                     Expenses assigned to jobs

  Gross Profit                   Expenses vs Revenue
  -------------------------------------------------------------

**Decision (May 11, 2026):** "You have revenue and expenses. The revenue
is higher than expenses. Boom! He doesn't need to become an accountant
and know what profit and loss statement is."

### 12.15 Features NOT in MVP Expenses Module

  --------------------------------------------------------------
  Feature              Moved To             Reason
  -------------------- -------------------- --------------------
  Receipt OCR          Pro                  AI-powered feature
  (Auto-extraction)                         

  Mileage Tracking     Pro                  GPS integration
                                            needed

  Recurring Expenses   Pro                  Advanced feature

  Bank Feed            Pro                  Requires bank
  Integration                               connection

  Expense Approval     Enterprise           Multi-user feature
  Workflow                                  

  Credit Card Import   Pro                  Bank integration
  --------------------------------------------------------------

------------------------------------------------------------------------

## 13. Schedule/Calendar Module

### 13.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Name**             Schedule (navigation label), Calendar
                       (internal)

  **Position**         Second item in left navigation (after
                       Home)

  **Purpose**          Visual job management and daily
                       planning

  **Design             Simple calendar like Google Calendar -
  Philosophy**         universally understood
  ------------------------------------------------------------

**Terminology Decision (May 7, 2026):** Use "Calendar" not "Dispatch
Board" - "Mr. Customer, let me put you on the calendar" sounds natural
vs "let me put you on the dispatch board" which sounds like
logistics/delivery tracking.

### 13.2 Calendar Core Features

  ----------------------------------------------------------------
  Feature             MVP Status                Notes
  ------------------- ------------------------- ------------------
  Display Jobs        ✅                        Only jobs shown on
                                                calendar (no
                                                appointments,
                                                reminders, tasks)

  Drag-and-Drop       ✅                        Like Google
  Rescheduling                                  Calendar/Teams -
                                                drag job to new
                                                time slot

  Double-Click to     ✅                        Double-click empty
  Schedule                                      time slot → job
                                                creation form
                                                opens

  View Options        ✅                        Day, Week, Month
                                                views

  Color Coding        ✅                        Status-based
                                                coloring
                                                (Scheduled, In
                                                Progress,
                                                Completed)

  Revenue Display     ✅                        Show daily revenue
                                                in header next to
                                                date

  Dollar Icon         ✅                        Appears on jobs
                                                with invoice
                                                amount \> \$0

  Map View            ✅                        Show job locations
                                                on map
  ----------------------------------------------------------------

### 13.3 Calendar Views

#### Day View

  -------------------------------------------------------------
  Element                        Specification
  ------------------------------ ------------------------------
  Time Slots                     Hourly increments,
                                 configurable start/end times

  Technician Rows                Show employee names on left
                                 side (up to 3 in MVP)

  Job Blocks                     Display in appropriate time
                                 slot with status color

  Revenue                        Show daily total in header
  -------------------------------------------------------------

#### Week View

  ------------------------------------------------------------
  Element                Specification
  ---------------------- -------------------------------------
  Layout                 Days as columns (Mon-Sun or Sun-Sat
                         based on settings)

  Names Column           Add column next to day columns
                         showing technician names

  Jobs                   Display in appropriate day/time with
                         status color

  Revenue                Show weekly totals visible at glance
  ------------------------------------------------------------

**Use Case (May 11, 2026):** "When you switch to weekly, the KPI blocks
are extremely powerful because you see how much revenue you brought per
week. Phenomenal."

#### Month View

  -------------------------------------------------------------
  Element                        Specification
  ------------------------------ ------------------------------
  Layout                         Standard calendar grid

  Job Indicators                 Show job count per day

  Click Behavior                 Click date to see day's jobs
  -------------------------------------------------------------

### 13.4 Team/Technician Display (MVP)

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Maximum Users                  1-3 people (solo operator + up
                                 to 2 employees)

  Display Location               Left side of schedule, as rows

  Name Display                   Show full name or initials

  Revenue per Person             Show next to technician name

  Single User                    If solo operator, just show
                                 "Peter" (owner name)

  Multiple Users                 Show Peter, Travis, Maria (up
                                 to 3 rows)
  -------------------------------------------------------------

**Decision (May 11, 2026):** "In core version, we are allowing one to
three people... So just showing one solo operator or one operator Peter
plus his helper, just another row with technician name on the left
side."

### 13.5 Job Display on Calendar

#### Job Block Elements

  -------------------------------------------------------------
  Element                        Description
  ------------------------------ ------------------------------
  Job Title                      Job name/description

  Customer Name                  Client the job is for

  Service Address                Location of job (abbreviated)

  Time                           Start time - End time

  Status Color                   Background color based on job
                                 status

  Dollar Icon                    Shows if invoice \> \$0
  -------------------------------------------------------------

#### Job Status Colors

  --------------------------------------------------------------
  Status               Color                Description
  -------------------- -------------------- --------------------
  **Scheduled**        Blue/Neutral         Job created and
                                            scheduled

  **In Progress**      Yellow/Orange        Work has begun

  **Completed**        Green                Work finished
  --------------------------------------------------------------

### 13.6 Recurring Jobs Feature

  ------------------------------------------------------------
  Requirement                 Specification
  --------------------------- --------------------------------
  Job Types                   One-off jobs OR Recurring jobs

  Frequency Options           Daily, Weekly (specific days),
                              Bi-weekly, Monthly, Custom

  End Options                 Never ends, Ends after X
                              occurrences, Ends on specific
                              date

  "Never Ends" Checkbox       ✅ Include checkbox to avoid
                              "100 years" workaround

  Conversion                  Can convert one-off job to
                              recurring job
  ------------------------------------------------------------

**Decision (May 22, 2026):** "The recurring job is very powerful feature
for small operators... If you pre-populate, if you capture one customer
and then you see this customer on Friday at 3pm and then you have this
recurring job feature and you pre-populate it forever."

#### Recurring Job Scheduler

  -------------------------------------------------------------
  Field                          Options
  ------------------------------ ------------------------------
  Starts On                      Date picker

  Start Time                     Time picker

  Frequency                      Daily, Weekly, Bi-weekly,
                                 Monthly, Custom

  Days of Week                   Monday, Tuesday, Wednesday,
                                 etc. (for weekly)

  Ends                           Never / After X occurrences /
                                 On specific date
  -------------------------------------------------------------

**Use Case:** Pool cleaning company visits every Friday at 2pm - create
one recurring job instead of 52 separate jobs per year.

### 13.7 KPI Blocks on Schedule

  --------------------------------------------------------------
  KPI                  Description          MVP Status
  -------------------- -------------------- --------------------
  **Jobs Today**       Count of scheduled   ✅
                       jobs for selected    
                       date                 

  **Revenue**          Total revenue for    ✅
                       selected period      

  **In Progress**      Count of jobs        ✅
                       currently in         
                       progress             

  **Completed**        Count of completed   ✅
                       jobs                 
  --------------------------------------------------------------

#### KPI Block Styling

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Height                         Smaller, compact style (same
                                 as Schedule KPIs)

  Decimal Numbers                ❌ Eliminated - cleaner
                                 without decimals

  Position                       Top of page, above calendar
  -------------------------------------------------------------

**Decision (May 22, 2026):** "KPI blocks same height as on the
schedule... I eliminated decimal numbers. The less is better, cleaner.
Those decimal numbers do not bring any value."

### 13.8 Schedule Interaction

#### Creating a Job

  ------------------------------------------------------------
  Method                     Behavior
  -------------------------- ---------------------------------
  Double-click time slot     Job creation form opens with
                             date/time pre-filled

  Click "+" button           Job creation form opens
                             (date/time must be selected)

  From Jobs module           Create job and assign to schedule
  ------------------------------------------------------------

#### Rescheduling a Job

  ------------------------------------------------------------
  Method                     Behavior
  -------------------------- ---------------------------------
  Drag-and-drop              Drag job block to new time slot
                             (like Google Calendar)

  Edit job                   Open job details, change
                             date/time/assigned to
  ------------------------------------------------------------

**Reference (May 11, 2026):** "On the Google Calendar, you go to Google
Calendar on the 1pm, you double click and schedule appointment window,
form pops."

### 13.9 Job Assignment

  -------------------------------------------------------------
  Field               Specification
  ------------------- -----------------------------------------
  **Assigned To**     Dropdown with employee names

  Quick Change        Can quickly change assigned employee from
                      schedule view

  Default             Can default to owner (Peter) for solo
                      operator
  -------------------------------------------------------------

**Decision (May 15, 2026):** "Assigned to technician or employee...
start time, end time, and assigned to, which is Peter or Travis."

### 13.10 Map View

  -------------------------------------------------------------
  Feature             MVP Status                Notes
  ------------------- ------------------------- ---------------
  Show Job Locations  ✅                        Display pins
                                                for job service
                                                addresses

  Route Numbers       ❌ Pro                    Show stop
                                                sequence for
                                                route
                                                optimization

  Route Optimization  ❌ Pro                    Important for
                                                pool service,
                                                12+ stops/day
  -------------------------------------------------------------

**Decision (May 11, 2026):** "Route optimization is very important for
pool services... showing on the map, my first stop is here, my second
stop is on the other side of town... but showing everything will not be
MVP."

### 13.11 Schedule Settings

  --------------------------------------------------------------
  Setting              Default              Options
  -------------------- -------------------- --------------------
  Day Start Time       7:00 AM              Configurable (4:00
                                            AM - 12:00 PM)

  Day End Time         5:00 PM              Configurable

  Work Days            Mon-Fri              Select which days
                                            appear on schedule

  First Day of Week    Sunday (US)          Sunday or Monday
                                            (Regional)

  Time Zone            Auto-detect          Standard timezone
                                            picker
  --------------------------------------------------------------

### 13.12 Features Excluded from MVP

  -------------------------------------------------------------
  Feature              Moved To               Reason
  -------------------- ---------------------- -----------------
  Appointments Module  Pro/Enterprise         Jobs cover basic
                                              scheduling in MVP

  Reminders            Pro/Enterprise         Advanced feature

  Tasks                Pro/Enterprise         Advanced feature

  Multiple Technicians Enterprise             MVP supports 1-3
  (\>3)                                       users only

  Unscheduled          Pro                    Jobs
  Bar/Panel                                   auto-scheduled
                                              when created in
                                              MVP

  Route Optimization   Pro                    Advanced
                                              scheduling
                                              feature

  Success Rate /       Pro                    "Customer
  Conversion Ratio                            retention success
                                              rate" - advanced
                                              metric

  Real-time GPS        Pro/Enterprise         Advanced mobile
  Tracking                                    feature
  -------------------------------------------------------------

### 13.13 Unscheduled Jobs (Pro Feature)

  --------------------------------------------------------------
  Feature              MVP Status           Pro Status
  -------------------- -------------------- --------------------
  Unscheduled Bar      ❌                   ✅ Shows jobs
                                            awaiting scheduling

  Filter Unscheduled   ❌                   ✅ Filter by date
                                            range, city, etc.

  Drag to Schedule     ❌                   ✅ Drag from
                                            unscheduled bar to
                                            calendar
  --------------------------------------------------------------

**Decision (May 11, 2026):** "In MVP, when a job is created it is
automatically scheduled. No 'unscheduled' workflow."

### 13.14 Mobile Calendar Experience

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  **Responsive**                 Must work on mobile screens

  **Swipe Navigation**           Swipe left/right for day
                                 navigation

  **Tap to View**                Tap job block to see details

  **Quick Actions**              Change status directly from
                                 calendar
  -------------------------------------------------------------

**Use Case:** "Peter wakes up, opens app, sees today highlighted with 3
jobs. Taps today → sees job list."

------------------------------------------------------------------------

## 14. Reports Module

### 14.1 Reports Design (MVP)

  -------------------------------------------------------------
  Requirement                    Specification
  ------------------------------ ------------------------------
  Report Type                    Pre-built only, NOT
                                 customizable

  Reference                      Invoice Simple style
  -------------------------------------------------------------

### 14.2 Available Reports

  -------------------------------------------------------------
  Report                         Description
  ------------------------------ ------------------------------
  Revenue Report                 Pre-built revenue summary

  Expense Report                 Pre-built expense summary

  Gross Profit                   Comparison of revenue vs
                                 expenses (NOT P&L statement)
  -------------------------------------------------------------

### 14.3 Reports Excluded from MVP

  -------------------------------------------------------------
  Report Type                    Moved To
  ------------------------------ ------------------------------
  Custom Reports                 Pro/Enterprise

  Customizable Data Fields       Pro/Enterprise
  -------------------------------------------------------------

------------------------------------------------------------------------

## 15. Settings Module

### 15.1 Module Overview

  ------------------------------------------------------------
  Aspect               Specification
  -------------------- ---------------------------------------
  **Purpose**          Central configuration for all system
                       and business settings

  **Philosophy**       "All settings in ONE place" -
                       consolidated, not scattered

  **Complexity**       High - "Gives me anxieties" due to many
                       configurations

  **Design Reference** Invoice Simple style - all settings on
                       scrolling page
  ------------------------------------------------------------

**Decision (May 13, 2026):** "We have 4 categories in settings: business
management, system preferences, finance center, integrations."

### 15.2 Settings Architecture (4 Main Categories)

  ---------------------------------------------------------------
  \#    Category           Purpose         Description
  ----- ------------------ --------------- ----------------------
  1     **Business         About the       Company info, team,
        Management**       business itself billing

  2     **System           How the         Custom fields,
        Preferences**      software is     regional settings
                           configured      

  3     **Finance Center** Financial       Payment methods, tax
                           integrations    configuration
                           and settings    

  4     **Integrations**   Third-party     Stripe, QuickBooks,
                           connections     etc.
  ---------------------------------------------------------------

**Decision (May 13, 2026):** "Business management is about my business.
System preferences is how the system is configured."

### 15.3 Settings UX Pattern

  ------------------------------------------------------------
  Pattern               Implementation
  --------------------- --------------------------------------
  Navigation            Accordion (collapsible sections)

  Default State         All categories collapsed, showing only
                        4 main labels

  Content               Single scrolling page per subcategory

  Interaction           Click category to expand, click
                        subcategory to view settings
  ------------------------------------------------------------

**Decision (May 13, 2026):** "When you click on company profile, you are
just scrolling down to see everything. All the settings is on one page,
just scrolling down."

### 15.4 Business Management Settings

#### 15.4.1 Company Info

  -------------------------------------------------------------
  Field            Type          Description
  ---------------- ------------- ------------------------------
  Company Name     Text          Legal business name

  Legal Entity     Dropdown      LLC, Corporation, Sole
                                 Proprietor, etc.

  Business Owner   Text          Owner's legal name
  Name                           

  Address          Address       Company headquarters address
                   fields        

  Business Hours   Time pickers  Operating hours (e.g., 8am-5pm
                                 Mon-Fri)
  -------------------------------------------------------------

#### 15.4.2 Company Profile

  --------------------------------------------------------------
  Setting              Type                 MVP Status
  -------------------- -------------------- --------------------
  About                Text area            ✅ Brief company
                                            description

  Industry             Dropdown             ✅ HVAC, Plumbing,
                                            Roofing, Cleaning,
                                            etc.

  Branding - Color 1   Color picker         ✅ Primary brand
                                            color

  Branding - Color 2   Color picker         ✅ Secondary brand
                                            color

  Logo                 Image upload         ✅ Company logo

  Social Network Links URLs                 ✅ Facebook,
                                            Instagram, LinkedIn,
                                            etc.
  --------------------------------------------------------------

**Industry Selection Decision (May 13, 2026):** "If we select this
during onboarding and you want to change, we should have the ability to
change or add second industry. In MVP, single industry selection only."

#### Branding Impact

  -------------------------------------------------------------
  Element                        Customization
  ------------------------------ ------------------------------
  UI Accent Colors               Changes based on selected
                                 colors

  PDF Templates                  Logo and colors applied to
                                 estimates/invoices

  Email Headers                  Company branding applied
  -------------------------------------------------------------

**Decision (May 13, 2026):** "Branding, we can select two colors. It's
going to change something how everything looks. Just slight
customization, not crazy customization."

#### 15.4.3 Manage Team (User Management)

  -------------------------------------------------------------
  Feature             MVP Status                Notes
  ------------------- ------------------------- ---------------
  Add User / Invite   ✅                        Send email
  User                                          invitation with
                                                temporary
                                                password

  Two-Factor          ✅                        Phone or
  Authentication                                email-based 2FA

  User Profiles       ✅                        Basic profile
                                                information

  Pay Rates           ✅                        Hourly rate or
                                                per-day rate

  User Role Title     ✅                        Salesperson,
                                                Installer,
                                                Helper, etc.

  Password Reset      ✅                        Admin can
                                                trigger
                                                password reset
  -------------------------------------------------------------

**User Capacity (MVP):** Maximum 3 users (owner + 2 employees)

**Decision (May 13, 2026):** "Manage the team - add the user, send the
link with temporary password and request to change. Settings of
two-factor authorizations, user profiles, pay rates."

#### User Profile Fields

  --------------------------------------------------------------
  Field                Type                 Purpose
  -------------------- -------------------- --------------------
  Name                 Text                 User's full name

  Email                Email                Login credential

  Phone                Phone                2FA and contact

  Role                 Dropdown             Admin or Employee

  Role Title           Text                 Job title (e.g.,
                                            "Lead Installer")

  Hourly Rate          Currency             For labor cost
                                            calculations

  Daily Rate           Currency             Alternative to
                                            hourly
  --------------------------------------------------------------

#### 15.4.4 MVP Roles & Permissions (Two Roles Only)

  --------------------------------------------------------------
  Role                 Access Level         Description
  -------------------- -------------------- --------------------
  **Admin**            Full Access          Owner - can access
                                            everything

  **Employee**         Limited Access       Cannot access
                                            restricted areas
  --------------------------------------------------------------

**Employee Restrictions (May 13, 2026):**

  -------------------------------------------------------------
  Cannot Access                  Reason
  ------------------------------ ------------------------------
  Settings                       Not their job to configure
                                 system

  Billing & Plan                 Payment information restricted

  Bank Information               Security - prevent fraud

  Custom Fields Configuration    System configuration
  -------------------------------------------------------------

**Decision (May 13, 2026):** "In our MVP, we have Peter the owner, aka
admin, admin login, and employee login. Employee login will not go to
system preferences, settings, and start changing the system preferences.
That's not their job."

**No custom role creation in MVP.** Custom roles available in
Pro/Enterprise.

#### 15.4.5 Billing and Plan

  --------------------------------------------------------------
  Setting         Specification             MVP Status
  --------------- ------------------------- --------------------
  Plan Details    "Vision 360 Core - 3      ✅ Display only
                  users"                    

  Change Plan     Upgrade to Pro/Enterprise ❌ Not in MVP (only
                                            Core plan)

  Payment Method  Credit card entry         ✅

  Payment History List of past subscription ✅
                  payments                  
  --------------------------------------------------------------

**Decision (May 13, 2026):** "We won't have the change plan in the MVP
because there is only one plan. You either use it or not."

### 15.5 System Preferences Settings

#### 15.5.1 Industry Selection

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  Selection              Dropdown with industry options

  MVP Behavior           Selected during onboarding, can
                         change in Settings

  Impact                 Future feature - triggers
                         industry-specific fields

  Options                HVAC, Plumbing, Roofing, Cleaning,
                         Pool Service, Electrical, etc.
  ------------------------------------------------------------

**Decision (May 13, 2026):** "Select the industry dropdown window. For
example, HVAC, plumbing, roofing, cleaning. In MVP, it will trigger
nothing. In Pro, it's going to trigger some additional fields in
different forms."

#### 15.5.2 Custom Fields Configuration

  --------------------------------------------------------------
  Entity               Custom Fields Count  Configuration
                                            Location
  -------------------- -------------------- --------------------
  Clients              2                    Settings → System
                                            Preferences → Custom
                                            Fields

  Properties           2                    Settings → System
                                            Preferences → Custom
                                            Fields

  Jobs                 2                    Settings → System
                                            Preferences → Custom
                                            Fields

  Estimates            2                    Settings → System
                                            Preferences → Custom
                                            Fields

  Invoices             2                    Settings → System
                                            Preferences → Custom
                                            Fields

  Team/Users           2                    Settings → System
                                            Preferences → Custom
                                            Fields
  --------------------------------------------------------------

**Decision (May 13, 2026):** "Custom fields, we are not creating the MVP
super customizable, but each form will have two custom fields. So items
two custom fields, clients two custom fields, invoices two custom
fields, jobs two custom fields."

#### Custom Field Configuration Interface

  -------------------------------------------------------------
  Setting                        Options
  ------------------------------ ------------------------------
  Field Name/Label               Text - rename "Custom Field 1"
                                 to "House Type"

  Field Type                     Text, Number, Date, Checkbox,
                                 Dropdown

  Dropdown Options               If dropdown: enter available
                                 options

  Required                       Yes/No toggle

  Visible                        Yes/No toggle
  -------------------------------------------------------------

#### Custom Field Types

  -------------------------------------------------------------
  Type                           Example Use Case
  ------------------------------ ------------------------------
  Text                           "Project Name", "Special
                                 Instructions"

  Number                         "Square Footage", "Number of
                                 Rooms"

  Date                           "Inspection Date", "Warranty
                                 Expiration"

  Checkbox                       "Commercial Job", "Priority
                                 Customer"

  Dropdown                       "Job Category: Metal Roof /
                                 Shingle Roof / Tile Roof"
  -------------------------------------------------------------

**Decision (May 13, 2026):** "Job custom field one, we're changing the
title to commercial job or job category selections. In roofing might be
metal roof job or material roof job. And then under the material roof
jobs, it might be metal roof, shingle roofs, wooden roofs."

#### 15.5.3 Regional Settings

  -------------------------------------------------------------
  Setting                Type            Options
  ---------------------- --------------- ----------------------
  Country                Dropdown        Full country list

  Counties/Regions       Dropdown        **Must be dropdown,
                                         not typed** - prevents
                                         misspellings

  Timezone               Standard picker Auto-detect with
                                         manual override

  Currency               Dropdown        USD, EUR, GBP, CAD,
                                         etc.

  Date Format            Radio           US (May 7, 2026) or EU
                                         (7 May 2026)

  First Day of Week      Radio           Sunday (US) or Monday
                                         (EU)
  -------------------------------------------------------------

**Counties Dropdown Requirement (May 13, 2026):** "When we create the
customer, we select counties from the list, not type the counties. If
you are in Florida, you're going to select seven of the Florida
counties."

**Date Format Decision (May 13, 2026):** "Date format is very simple but
very important. In US, we say May 7, 2026, in Europe, we say 7 May
2026."

**First Day of Week (May 13, 2026):** "In US starts on Sunday, in Europe
starts on Monday. It's just setting on the calendar. Very minor, but
very important to make sure it's set to the regional."

#### 15.5.4 Terms & Conditions

  --------------------------------------------------------------
  Document Type              Purpose           Location
  -------------------------- ----------------- -----------------
  Terms & Conditions         Legal terms       Settings → System
                             attached to       Preferences
                             estimates         

  Company Policies           General business  Settings → System
                             policies          Preferences

  Privacy Policy             Data handling     Settings → System
                             policies          Preferences

  Warranty Disclaimers       Product/service   Settings → System
                             warranties        Preferences
  --------------------------------------------------------------

#### Terms & Conditions Configuration

  -------------------------------------------------------------
  Field                          Description
  ------------------------------ ------------------------------
  Title                          Document title

  Content                        Rich text editor for terms

  Include in Estimates           Toggle to attach to all
                                 estimates

  Include in Invoices            Toggle to attach to all
                                 invoices
  -------------------------------------------------------------

### 15.6 Finance Center Settings

#### 15.6.1 Tax System Overview

  -------------------------------------------------------------
  Component                      Description
  ------------------------------ ------------------------------
  Tax Rates                      Individual tax rates (e.g.,
                                 "Florida Sales Tax: 7%")

  Tax Profiles                   Grouped tax rates for easy
                                 selection

  Default Profile                Pre-selected profile for all
                                 new invoices
  -------------------------------------------------------------

**Decision (May 13, 2026):** "Tax settings is forcing you to create tax
rate. Create tax name, Lviv Sales Tax, 23%. With this feature, we are
making this app usable in every part of US or almost every part of the
world."

#### 15.6.2 Tax Rates Configuration

  --------------------------------------------------------------
  Field                Type                 Example
  -------------------- -------------------- --------------------
  Tax Name             Text                 "Florida Sales Tax"

  Percentage           Number               7.00%

  Status               Toggle               Active/Inactive
  --------------------------------------------------------------

#### Creating Tax Rates

  -------------------------------------------------------------
  Step                           Action
  ------------------------------ ------------------------------
  1                              Click "+ Add Tax Rate"

  2                              Enter tax name

  3                              Enter percentage

  4                              Save rate
  -------------------------------------------------------------

**Multiple Jurisdictions Example:** - NY State Tax: 7% - NY County Tax:
0.25% - NY City Tax: 0.5%

#### 15.6.3 Tax Profiles (Groups)

  ------------------------------------------------------------
  Feature                  Description
  ------------------------ -----------------------------------
  Profile Name             Label for tax combination (e.g.,
                           "New York Combined Tax")

  Selected Rates           Checkboxes to select which rates to
                           include

  Total Calculation        Auto-calculated sum of selected
                           rates

  Default Toggle           Set one profile as default
  ------------------------------------------------------------

**Decision (May 13, 2026):** "Create tax profile instead of tax group.
Select tax rates. I'm gonna select these two taxes. And then every
single invoice has this tax profile pre-populated."

#### Tax Profile Example - New York Airport Restaurant

  -------------------------------------------------------------
  Profile Name                   Lviv Airport Tax
  ------------------------------ ------------------------------
  Tax Rate 1                     Lviv Sales Tax: 23%

  Tax Rate 2                     Lviv Airport Tax: 0.5%

  **Total**                      **23.5%**
  -------------------------------------------------------------

#### 15.6.4 No Tax Scenario

  -------------------------------------------------------------
  Scenario                       Solution
  ------------------------------ ------------------------------
  Service not taxable            Set item as "Taxable = No"

  Tax-exempt customer            Remove tax on individual
                                 invoice

  No taxes in jurisdiction       Don't create any tax rates
  -------------------------------------------------------------

**Decision (May 13, 2026):** "Can we have invoice without taxes at all?
Then we're gonna remove if it's in the taxes. We will have pencil to
edit the taxes, delete it."

#### 15.6.5 Bank Information

  --------------------------------------------------------------
  Field                Type                 Description
  -------------------- -------------------- --------------------
  Bank Name            Text                 Financial
                                            institution name

  Account Number       Encrypted            Bank account number
                                            (masked)

  Routing Number       Encrypted            Bank routing number
                                            (masked)

  Account Type         Dropdown             Checking/Savings
  --------------------------------------------------------------

**Security Note (May 13, 2026):** "We will not give employee access to
change the bank information, because then they can put their own bank
information and the credit card deposits will go to their bank account."

#### 15.6.6 Payment Methods Configuration

  -------------------------------------------------------------
  Method                         Configuration
  ------------------------------ ------------------------------
  Stripe                         API key connection

  Zelle                          Account email/phone

  Cash App                       Account identifier

  Cash                           No configuration needed

  Check                          Mailing address for checks
  -------------------------------------------------------------

### 15.7 Integrations

#### 15.7.1 Payment Integration - Stripe

  -------------------------------------------------------------
  Feature                        MVP Status
  ------------------------------ ------------------------------
  Connect Stripe Account         ✅

  Accept Card Payments           ✅

  Payment Links                  ✅

  Automatic Deposit              ✅
  -------------------------------------------------------------

#### 15.7.2 Integrations NOT in MVP

  --------------------------------------------------------------
  Integration          Moved To             Reason
  -------------------- -------------------- --------------------
  QuickBooks Online    Pro                  Accounting
                                            integration

  QuickBooks Desktop   Enterprise           Advanced accounting

  Xero                 Pro                  Alternative
                                            accounting

  Google Calendar Sync Pro                  Calendar integration

  SMS/Twilio           Pro                  Text messaging

  Email Marketing      Enterprise           Advanced marketing
  --------------------------------------------------------------

### 15.8 Settings Access Control

  --------------------------------------------------------------
  Setting Area         Admin                Employee
  -------------------- -------------------- --------------------
  Company Info         ✅                   ❌

  Company Profile      ✅                   ❌

  Manage Team          ✅                   ❌

  Billing & Plan       ✅                   ❌

  Custom Fields        ✅                   ❌

  Regional Settings    ✅                   ❌

  Tax Configuration    ✅                   ❌

  Bank Information     ✅                   ❌

  Integrations         ✅                   ❌
  --------------------------------------------------------------

**Decision (May 13, 2026):** "Employee login will not go to system
preferences, settings, and start changing the system preferences. That's
not their job."

### 15.9 Settings Data Hierarchy

  --------------------------------------------------------------
  Setting Type                 Scope          Example
  ---------------------------- -------------- ------------------
  Company-wide                 All users      Tax profiles,
                                              regional settings

  User-specific                Individual     Personal
                               user           notification
                                              preferences

  Entity-specific              Per record     Custom fields for
                               type           Jobs vs Clients
  --------------------------------------------------------------

### 15.10 Terminology Customization NOT in MVP

  -------------------------------------------------------------
  Feature              Status            Decision
  -------------------- ----------------- ----------------------
  Rename "Estimate" to ❌ Not in MVP     "We are not allowing
  "Quote"                                for these
                                         customizations"

  Rename "Invoice" to  ❌ Not in MVP     "Estimates are
  "Bill"                                 estimates"

  Custom Invoice       ❌ Not in MVP     "We dictate how you
  Numbering Format                       should use this
                                         software"
  -------------------------------------------------------------

**Decision (May 13, 2026):** "Invoice number, we are not changing this
invoice title. There is no value in this feature. We dictate how you
should use this software and it's working very well. But giving you
abilities to add those custom fields, that's the value."

### 15.11 Vendors Configuration

  --------------------------------------------------------------
  Field                Type                 Purpose
  -------------------- -------------------- --------------------
  Vendor Name          Text                 Company name (e.g.,
                                            "Ferguson Plumbing")

  Contact Name         Text                 Primary contact

  Phone                Phone                Contact number

  Email                Email                Contact email

  Address              Address              Vendor location
  --------------------------------------------------------------

**Decision (May 22, 2026):** "Vendor needs to be dropdown, not typed.
Select the vendor from the list. Like we do with clients and counties."

### 15.12 Manufacturers Configuration

  --------------------------------------------------------------
  Field                Type                 Purpose
  -------------------- -------------------- --------------------
  Manufacturer Name    Text                 Brand name (e.g.,
                                            "Carrier", "Trane")

  Website              URL                  Manufacturer website

  Support Phone        Phone                Technical support
  --------------------------------------------------------------

### 15.13 Item Categories Configuration

  -------------------------------------------------------------
  Feature                        Specification
  ------------------------------ ------------------------------
  Location                       Settings → System Preferences

  Customization                  Fully customizable per
                                 industry

  Item Type Specific             Different categories per item
                                 type
  -------------------------------------------------------------

**Decision (May 7, 2026):** "Categories are fully customizable in
Settings. Different industries have different categories."

#### Category Examples by Industry

  -------------------------------------------------------------
  Industry                       Sample Categories
  ------------------------------ ------------------------------
  HVAC                           Refrigerant, Copper,
                                 Electrical, Filters, Ductwork

  Roofing                        Shingles, Flashing,
                                 Underlayment, Fasteners,
                                 Gutters

  Cleaning                       Chemicals, Equipment,
                                 Supplies, Protective Gear

  Plumbing                       Pipes, Fittings, Fixtures,
                                 Tools, Drainage

  Pool Service                   Chemicals, Filters, Pumps,
                                 Accessories
  -------------------------------------------------------------

### 15.14 Notification Settings (Future)

  --------------------------------------------------------------
  Feature              MVP Status           Notes
  -------------------- -------------------- --------------------
  Email Notifications  Placeholder          Basic functionality

  Push Notifications   Placeholder          Mobile app
                                            notifications

  SMS Notifications    ❌ Pro               Requires Twilio
                                            integration
  --------------------------------------------------------------

**Decision (May 13, 2026):** "There will be some sort of notifications,
global settings. For example, client signature setting - when client
signs, notification on this top right notification ring."

### 15.15 Features NOT in MVP Settings Module

  -------------------------------------------------------------
  Feature              Moved To               Reason
  -------------------- ---------------------- -----------------
  Custom Roles         Pro/Enterprise         MVP has only
  Creation                                    Admin/Employee

  Multiple Industries  Pro                    MVP single
                                              industry only

  Terminology          Pro/Enterprise         "Estimates are
  Customization                               estimates"

  Custom Invoice       Pro                    MVP uses standard
  Numbering                                   format

  QuickBooks           Pro                    Accounting
  Integration                                 integration

  API Access           Enterprise             Developer
                                              features

  SSO/SAML             Enterprise             Enterprise
                                              security

  Audit Logs           Pro                    Activity tracking

  Data Export (Full)   Pro                    Complete data
                                              export

  White-labeling       Enterprise             Remove Vision360
                                              branding
  -------------------------------------------------------------

------------------------------------------------------------------------

## 16. Authorization Module

### 16.1 Registration Process

  ------------------------------------------------------------
  Step              Specification
  ----------------- ------------------------------------------
  **Work Email**    Required field - used as primary
                    identifier

  **Password**      Required, with eye icon for visibility
                    toggle

  **Agreement       Required - user must accept terms before
  Checkbox**        proceeding

  **Email           Confirmation code sent to email; user
  Verification**    enters code to verify
  ------------------------------------------------------------

#### Registration Screen Elements

  -------------------------------------------------------------
  Element                        Details
  ------------------------------ ------------------------------
  Page Title                     "Create Account"

  Email Field                    Label: "Work Email"

  Password Field                 Eye icon toggle for show/hide
                                 password (must be fully
                                 visible when toggled)

  Terms Checkbox                 "I agree to Terms of Service
                                 and Privacy Policy"

  Primary Button                 "Create Account"

  Secondary Link                 "Already have an account? Log
                                 in"
  -------------------------------------------------------------

### 16.2 Login Flow

  -------------------------------------------------------------
  Element                        Specification
  ------------------------------ ------------------------------
  **Email Field**                Work email used during
                                 registration

  **Password Field**             With eye icon for visibility
                                 toggle

  **Forgot Password Link**       Links to password reset flow

  **Remember Me**                Optional checkbox for session
                                 persistence

  **Login Button**               Primary action button

  **Create Account Link**        Link to registration page
  -------------------------------------------------------------

#### Login Error Handling

  -------------------------------------------------------------
  Scenario                       Response
  ------------------------------ ------------------------------
  Invalid Email                  "Please enter a valid email
                                 address"

  Wrong Password                 "Incorrect email or password"
                                 (generic for security)

  Account Locked                 "Account temporarily locked.
                                 Try again in X minutes"

  Unverified Email               Redirect to verification
                                 screen
  -------------------------------------------------------------

### 16.3 Password Reset Flow

  -------------------------------------------------------------
  Step                           Description
  ------------------------------ ------------------------------
  1\. Request Reset              User enters email address

  2\. Email Sent                 System sends reset link to
                                 registered email

  3\. Click Link                 User opens link from email

  4\. Set New Password           User enters new password with
                                 confirmation

  5\. Confirmation               Success message, redirect to
                                 login
  -------------------------------------------------------------

### 16.4 Onboarding Flow (Post-Registration)

#### Step 1: Email Verification

  -------------------------------------------------------------
  Element                        Specification
  ------------------------------ ------------------------------
  Screen Title                   "Verify Your Email"

  Input Field                    Confirmation code from email

  Resend Option                  "Didn't receive a code?
                                 Resend"

  Back Option                    Return to registration
  -------------------------------------------------------------

#### Step 2: Company Setup

  -------------------------------------------------------------
  Field               Specification
  ------------------- -----------------------------------------
  **Company Name**    Required - displays in top navigation bar
                      after onboarding

  **Team Size**       Selection field (1, 2-3, 4-10, 11+)

  **Industry**        Single selection only in MVP (HVAC,
                      Plumbing, Roofing, Cleaning, etc.)
  -------------------------------------------------------------

**Note:** Industry selection during onboarding can be changed later in
Settings \> Business Management \> Company Profile (May 13, 2026
decision).

### 16.5 Post-Onboarding Experience

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  **Trial Period**       7-day free trial

  **Credit Card          No credit card required at signup
  Required**             

  **Time to Start**      "Two minutes onboarding and they are
                         using"

  **After Trial**        Full subscription payment required to
                         continue (no freemium tier)
  ------------------------------------------------------------

### 16.6 Quick Start Guidance

  -------------------------------------------------------------
  Element                        Action
  ------------------------------ ------------------------------
  Add First Customer             Guided prompt/tutorial

  Create First Job               Guided prompt/tutorial

  Go to Homepage                 Call-to-action button
  -------------------------------------------------------------

### 16.7 Sample Company / Sandbox Feature

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  **Company Switcher**   Toggle between "Your Company" and
                         "Sample Company"

  **Sample Company       "Premium Services" (example)
  Name**                 

  **Pre-filled Data**    Jobs, clients, items - shows full
                         capability

  **Purpose**            Training tool, prevents empty state
                         issues
  ------------------------------------------------------------

### 16.8 User Account Menu

  -------------------------------------------------------------
  Position                       Top navigation bar,
                                 rightmost - user initials icon
  ------------------------------ ------------------------------

  -------------------------------------------------------------

#### Account Menu Items (MVP)

  -------------------------------------------------------------
  Item                           Function
  ------------------------------ ------------------------------
  **Profile**                    User's personal information
                                 and preferences

  **Logout**                     Sign out of the application
  -------------------------------------------------------------

**Decision (May 15, 2026):** Account menu contains Profile and Logout
only in MVP. Help is accessed via separate Help Center icon in top
navigation.

### 16.9 User Profile Section

  -------------------------------------------------------------
  Field                          Description
  ------------------------------ ------------------------------
  Name                           User's display name

  Email                          Work email (read-only, used
                                 for login)

  Phone                          Contact phone number

  Profile Picture                Optional avatar upload

  Password Change                Link to change password

  Notification Preferences       Email/SMS notification
                                 settings
  -------------------------------------------------------------

### 16.10 Team User Invitation Flow (Admin Only)

  ------------------------------------------------------------
  Step               Description
  ------------------ -----------------------------------------
  1\. Navigate       Settings \> Business Management \> Manage
                     Team

  2\. Click          "+ Invite User" button

  3\. Enter Details  First name, last name, email, role
                     (Admin/Employee), pay rate

  4\. Send           System sends email with temporary
  Invitation         password and setup link

  5\. User Receives  "Go there, set your password, and you are
  Email              all set"

  6\. User Sets      User clicks link, sets permanent password
  Password           

  7\. User Activated User can now log in and access the system
  ------------------------------------------------------------

#### Manage Team Actions

  -------------------------------------------------------------
  Action                         Description
  ------------------------------ ------------------------------
  Edit User                      Modify user details and
                                 permissions

  Send Password Reset Link       User receives email to reset
                                 password

  Invite User                    Send new invitation email

  Inactivate User                Remove user access (cannot
                                 delete in MVP)
  -------------------------------------------------------------

### 16.11 Two-Factor Authentication (2FA)

  ------------------------------------------------------------
  Feature                   MVP Status
  ------------------------- ----------------------------------
  **2FA Support**           ✅ Available

  **Methods**               Phone number SMS or Email

  **Configuration**         Settings \> Business Management \>
                            Manage Team \> Login and Security

  **Enforcement**           Optional per user in MVP
  ------------------------------------------------------------

### 16.12 Roles & Permissions (MVP)

  ----------------------------------------------------------------
  Role           Access Level              Description
  -------------- ------------------------- -----------------------
  **Admin**      Full Access               Owner - can access
                                           everything including
                                           Settings, Billing, Bank
                                           Info

  **Employee**   Limited Access            Cannot access:
                                           Settings, Billing, Bank
                                           Info, Custom Fields
                                           configuration
  ----------------------------------------------------------------

**Note:** No custom role creation in MVP. Only Admin and Employee roles
available.

### 16.13 Session Management

  ------------------------------------------------------------
  Feature                Specification
  ---------------------- -------------------------------------
  Session Timeout        Auto-logout after period of
                         inactivity (configurable)

  Multiple Sessions      Allowed - user can be logged in on
                         multiple devices

  Force Logout           Admin can remotely logout users
                         (Pro/Enterprise)
  ------------------------------------------------------------

------------------------------------------------------------------------

## 17. Version Feature Matrix

### 17.1 Version/Tier Structure

  --------------------------------------------------------------
  Version              Target               Color Theme
  -------------------- -------------------- --------------------
  **Core (MVP)**       Solo operator        Blue
                       (Peter)              

  **Pro**              Small business       Different color
                       (employees)          

  **Max**              Medium business      Different color

  **Enterprise**       Large business       Different color
  --------------------------------------------------------------

### 17.2 Feature Comparison Matrix

  -----------------------------------------------------------------
  Feature               Core             Pro        Max/Enterprise
  ---------------- --------------- --------------- ----------------
  Maximum Users           3              TBD             TBD

  Customer Summary       ✅              ✅               ✅
  Header                                           

  Financial              ✅              ✅               ✅
  Summary Cards                                    

  Horizontal Tab         ✅              ✅               ✅
  Navigation                                       

  Basic Tabs             ✅              ✅               ✅
  (Details, Jobs,                                  
  Invoices, etc.)                                  

  Tab                    ❌              ✅               ✅
  Customization                                    
  (on/off)                                         

  Custom Fields (2       ✅              ✅               ✅
  per entity)                                      

  Custom Fields          ❌              ❌               ✅
  (unlimited)                                      

  Tags                   ✅              ✅               ✅

  Account Manager        ❌              ✅               ✅
  Field                                            

  Appointments           ❌              ✅               ✅
  Module                                           

  Purchase Orders        ❌              ✅               ✅
  Tab                                              

  Service                ❌              ✅               ✅
  Agreements Tab                                   

  Equipment Tab          ❌              ✅               ✅

  Activity/Audit         ❌              ✅               ✅
  Trail Tab                                        

  Marketing Tab          ❌              ❌               ✅

  Custom Reports         ❌              ✅               ✅

  Route                  ❌              ✅               ✅
  Optimization                                     

  Dashboard              ❌              ✅               ✅

  Custom Roles           ❌              ❌               ✅

  Inventory              ❌              ✅               ✅
  Tracking                                         

  Multiple               ❌              ✅               ✅
  Industries                                       
  -----------------------------------------------------------------

### 17.3 Pro Version Indicators in MVP

  -------------------------------------------------------------
  Feature                        Implementation
  ------------------------------ ------------------------------
  Pro Features Color             Almond/beige color
                                 highlighting

  Location                       Items tabs, Settings options,
                                 etc.

  Behavior                       Visible but non-functional in
                                 Core
  -------------------------------------------------------------

------------------------------------------------------------------------

## 18. Non-Functional Requirements (MVP)

#### Accessibility Considerations

  ------------------------------------------------------------
  Requirement                 Specification
  --------------------------- --------------------------------
  Multi-generational Users    Support 70+ year old users

  Language Barriers           Support non-native English
                              speakers

  Low Tech Literacy           Design for users with minimal
                              software experience

  Clear Labels                Simple English menu labels
  ------------------------------------------------------------

### Security Requirements

#### Authentication

  --------------------------------------------------------------
  Requirement          Specification        MVP Status
  -------------------- -------------------- --------------------
  **Login Method**     Email + Password     ✅

  **Social Login**     Google/Apple Sign-in ❌ Pro/Max only

  **Two-Factor         Email verification   ✅
  Authentication**     code                 

  **"Skip on this      Trusted device       ✅
  Device"**            fingerprinting       

  **Password Reset**   Requires internet    ✅
                       connection           
  --------------------------------------------------------------

**Decision:** "Simple Invoice uses email/password - very, very
successful. Social login adds costs per user (\$15+ per login)."

#### Data Security

  ------------------------------------------------------------
  Requirement                 Specification
  --------------------------- --------------------------------
  **Encryption in Transit**   TLS 1.3 for all API traffic

  **Encryption at Rest**      Azure SQL TDE (Transparent Data
                              Encryption)

  **PCI Compliance**          Stripe handles all card data -
                              Vision360 never sees card
                              numbers

  **Secrets Management**      Azure Key Vault for API keys,
                              connection strings
  ------------------------------------------------------------

**Security Priority:** "Absolute requirement - I've heard some bad
examples that securities were not strong."

#### Role-Based Access

  ------------------------------------------------------------------
  Role           Access Level           Restricted Areas
  -------------- ---------------------- ----------------------------
  **Admin        Full access            None
  (Owner)**                             

  **Employee**   Limited access         Settings, Billing, Bank
                                        Info, Custom Fields config
  ------------------------------------------------------------------

**Decision (May 13, 2026):** "We will not give employee access to change
the bank information, because then they can put their own bank
information."

### Offline Capability Requirements (Mobile App)

**Business Problem:** 40% of rural service calls have spotty/no
connection. Even urban basements have no signal.

**Decision:** "We want to really make this decision right now versus
down the road fixing something that is not working."

#### Must Work Offline

  -------------------------------------------------------------
  Feature                        Offline Capability
  ------------------------------ ------------------------------
  **View Clients**               ✅ Pre-synced client list

  **View Client Details**        ✅ Access all client
                                 information

  **Create New Clients**         ✅ Sync when online

  **View Items/Price Book**      ✅ Pre-synced item library

  **Create Items**               ✅ Sync when online

  **Create Estimates**           ✅ **PRIMARY OFFLINE FEATURE**

  **Signature Capture**          ✅ Offline capable

  **View Scheduled Jobs**        ✅ Pre-synced jobs

  **Update Job Status**          ✅ Sync when online

  **Add Job Notes/Photos**       ✅ Store locally, sync later

  **Clock In/Out**               ✅ Time tracking offline
  -------------------------------------------------------------

**Rationale:** "Creating estimates at customer sites is core value
proposition, cannot depend on connectivity."

#### Explicitly NOT Offline

  -------------------------------------------------------------
  Feature                        Reason
  ------------------------------ ------------------------------
  Login/Registration             Requires internet for
                                 authentication

  Password Reset                 Security requirement

  User Profile Changes           Configuration happens from
                                 office

  Payment Processing             Stripe requires connectivity
  -------------------------------------------------------------

### 18 Localization Requirements

  -------------------------------------------------------------
  Requirement                    MVP Specification
  ------------------------------ ------------------------------
  **Languages**                  English and Spanish

  **Market**                     USA only (all versions through
                                 Enterprise)

  **Currency**                   USD, EUR, and configurable
                                 (Regional Settings)

  **Date Format**                US (May 7, 2026) and EU (7 May
                                 2026) configurable

  **First Day of Week**          Sunday (US) or Monday (EU)
                                 configurable

  **Timezone**                   Auto-detect with manual
                                 override
  -------------------------------------------------------------

**Decision (March 3, 2026):** "We will just focus on US for now. We will
not focus on expansion right now. We have plenty of our market here."

**Spanish Rationale:** "Large Spanish-speaking market in US field
service industry (construction, HVAC, plumbing, landscaping workers)."

### 18 Data Management Requirements

#### Data Integrity

  ------------------------------------------------------------
  Requirement                Implementation
  -------------------------- ---------------------------------
  **Cannot Delete Records**  Clients, Jobs, Items use
                             Inactivate instead of Delete

  **One-Way Relationships**  Client → Job (cannot change
                             client once job created)

  **Audit Trail**            Activity tab tracks all changes
                             (Pro/Enterprise)

  **Data Validation**        Dropdowns for counties/vendors
                             (prevent misspellings)
  ------------------------------------------------------------

**Decision (April 23, 2026):** "Cannot delete client records - data
integrity. Use Inactivate instead."

#### Data Retention

  -------------------------------------------------------------
  Data Type                      Retention
  ------------------------------ ------------------------------
  Business Data                  Indefinite (as long as account
                                 active)

  Backups                        30 days rolling

  Audit Logs                     TBD (Pro/Enterprise feature)
  -------------------------------------------------------------

### 18 Integration Requirements

  --------------------------------------------------------------
  Integration          MVP Status           Method
  -------------------- -------------------- --------------------
  **Stripe**           ✅                   Full API integration

  **QuickBooks         ❌ Pro               Future integration
  Online**                                  

  **Xero**             ❌ Pro               Future integration

  **Google Calendar**  ❌ Pro               Future integration

  **SMS/Twilio**       ❌ Pro               Future integration
  --------------------------------------------------------------

### 18 Notification Requirements

  --------------------------------------------------------------
  Notification Type    MVP Status           Channel
  -------------------- -------------------- --------------------
  Invoice Paid         ✅                   In-app (web), Push
                                            (mobile)

  Estimate Signed      ✅                   In-app (web), Push
                                            (mobile)

  Estimate Viewed      ✅                   Real-time
                                            notification (like
                                            Invoice Simple)

  SMS Notifications    ❌ Pro               Requires Twilio
  --------------------------------------------------------------

**Decision (May 19, 2026):** "Invoice Simple gives you this notification
on your cell phone instantly."

### 18 Trial & Subscription Model

  ------------------------------------------------------------
  Requirement                 Specification
  --------------------------- --------------------------------
  **Trial Period**            7-14 days

  **Credit Card Required**    ❌ No credit card needed for
                              trial

  **Trial Features**          All major functionality (with
                              exceptions)

  **Trial Exceptions**        Stripe integration, VoIP
                              (require payment method)

  **After Trial**             Full subscription payment
                              required to continue
  ------------------------------------------------------------

**Decision (March 3, 2026):** "No credit card needed seven days. Just
let them give them ability to play with this."

------------------------------------------------------------------------

## Document History

  --------------------------------------------------------------
  Date            Version                Changes
  --------------- ---------------------- -----------------------
  May 22, 2026    1.0                    Initial MVP
                                         requirements
                                         consolidation

  May 25, 2026    1.1                    Added comprehensive
                                         Authorization Module
                                         (Section 16) covering
                                         registration, login,
                                         onboarding, user
                                         invitation, 2FA, and
                                         session management

  May 25, 2026    1.2                    Added Homepage /
                                         Business Insight Module
                                         (Section 5) covering
                                         KPI blocks, date
                                         selector, Reports tab,
                                         and pre-built reports
                                         list

  May 25, 2026    1.3                    Expanded
                                         Schedule/Calendar
                                         Module (Section 13)
                                         with comprehensive
                                         requirements for
                                         calendar views,
                                         recurring jobs, job
                                         display, map view, and
                                         schedule settings

  May 25, 2026    1.4                    Expanded Client Module
                                         (Section 6) with 16
                                         subsections covering
                                         module overview, client
                                         profile layout, status
                                         system, tabs, fields
                                         (required/optional),
                                         properties, notes,
                                         documents, list page,
                                         quick filters, advanced
                                         filters, kebab menu,
                                         data hierarchy, bulk
                                         actions, and features
                                         not in MVP

  May 25, 2026    1.5                    Expanded Jobs Module
                                         (Section 7) with 28
                                         subsections covering
                                         module overview, job
                                         page layout, customer
                                         summary header, KPI
                                         blocks, job overview,
                                         job types, recurring
                                         jobs, tabs
                                         (appointments,
                                         checklist, documents,
                                         items, labor, expense,
                                         finance), job status,
                                         list page, quick
                                         filters, kebab menus,
                                         create job form, data
                                         hierarchy, calendar
                                         integration, bulk
                                         actions, and features
                                         not in MVP

  May 25, 2026    1.6                    Expanded Estimates
                                         Module (Section 9) with
                                         18 subsections covering
                                         module overview, page
                                         layout, tab structure,
                                         details tab content,
                                         statuses with color
                                         coding, notes types,
                                         deposit configuration,
                                         pictures/documents
                                         gallery, templates, PDF
                                         content, actions,
                                         activity tracking, list
                                         page, quick filters,
                                         kebab menus, create
                                         form,
                                         estimate-to-invoice
                                         conversion, and
                                         features not in MVP.
                                         Expanded Invoices
                                         Module (Section 10)
                                         with 19 subsections
                                         covering module
                                         overview, page layout,
                                         statuses (MVP decision:
                                         Unpaid, Overdue,
                                         Partially Paid, Paid,
                                         Void), tab structure,
                                         details tab, list page,
                                         quick filters, invoice
                                         numbering, templates,
                                         actions, kebab menus,
                                         create form, creation
                                         sources, payment
                                         integration, PDF
                                         content, overdue
                                         handling, recurring
                                         invoices, bulk actions,
                                         and features not in MVP

  May 25, 2026    1.7                    Expanded Items Module
                                         (Section 8) with 25
                                         subsections covering
                                         module overview, item
                                         types (predefined
                                         tabs - no "Others"
                                         category), item types
                                         display as tabs, item
                                         fields (MVP),
                                         description fields
                                         explained, pricing
                                         structure, category
                                         configuration, tax
                                         profile system, taxable
                                         field, vendor
                                         management (dropdown
                                         only - no free text),
                                         fields removed from
                                         MVP, item list page,
                                         quick filters, item
                                         type tab behavior,
                                         kebab menu actions,
                                         create item form, item
                                         details page layout,
                                         help/education bar,
                                         column customization,
                                         pagination, search
                                         functionality, bulk
                                         actions, import/export,
                                         item relationships, and
                                         features not in MVP

  May 25, 2026    1.8                    Expanded Settings
                                         Module (Section 15)
                                         with 15 subsections
                                         covering module
                                         overview, settings
                                         architecture (4 main
                                         categories), settings
                                         UX pattern (accordion
                                         navigation), business
                                         management settings
                                         (company info, company
                                         profile, manage team,
                                         MVP roles &
                                         permissions, billing
                                         and plan), system
                                         preferences (industry
                                         selection, custom
                                         fields configuration
                                         with 2 fields per
                                         entity, regional
                                         settings, terms &
                                         conditions), finance
                                         center (tax system
                                         overview, tax rates,
                                         tax profiles, no-tax
                                         scenarios, bank
                                         information, payment
                                         methods), integrations
                                         (Stripe only in MVP),
                                         settings access
                                         control, data
                                         hierarchy, terminology
                                         customization NOT in
                                         MVP,
                                         vendors/manufacturers
                                         configuration, item
                                         categories,
                                         notification settings
                                         placeholder, and
                                         features not in MVP

  May 25, 2026    1.9                    Expanded Payments
                                         Module (Section 11)
                                         with 14 subsections
                                         covering module
                                         overview, payment
                                         methods (Stripe, Zelle,
                                         Cash App, Cash, Check),
                                         payment fields, payment
                                         statuses, collect
                                         payment flow with
                                         multiple entry points,
                                         list page, quick
                                         filters, list columns,
                                         kebab menu actions,
                                         payment record view,
                                         Stripe integration,
                                         manual payment
                                         recording,
                                         payment-invoice
                                         relationship, and
                                         features not in MVP.
                                         Expanded Expenses
                                         Module (Section 12)
                                         with 15 subsections
                                         covering module
                                         overview, expense
                                         fields (vendor as
                                         dropdown only), expense
                                         categories, expense-job
                                         relationship, "Add
                                         Another Expense" batch
                                         entry feature, list
                                         page, quick filters,
                                         list columns, kebab
                                         menu actions, create
                                         expense form, receipt
                                         upload, vendor invoice
                                         number field, expense
                                         entry locations,
                                         reporting integration,
                                         and features not in MVP

  May 25, 2026    2.0                    Added comprehensive
                                         Non-Functional
                                         Requirements (Section
                                         18) with 13 subsections
                                         covering usability
                                         requirements (target
                                         user simplicity,
                                         Invoice Simple
                                         reference), performance
                                         requirements, platform
                                         & compatibility (web
                                         responsive, mobile
                                         React Native), security
                                         requirements
                                         (authentication, data
                                         security, RBAC),
                                         offline capability
                                         requirements (40% rural
                                         connectivity issue,
                                         client/item/estimate
                                         offline support, sync
                                         strategy), localization
                                         (English/Spanish, USA
                                         market only),
                                         availability &
                                         reliability (99.9%
                                         uptime, 30-day backup
                                         retention), scalability
                                         foundation (Core 1-3
                                         users to Enterprise
                                         250+), data management
                                         (inactivate vs delete,
                                         one-way relationships),
                                         integration
                                         requirements (Stripe
                                         only in MVP),
                                         notification
                                         requirements, trial &
                                         subscription model
                                         (7-14 day no-CC trial),
                                         and infrastructure
                                         costs (\~\$67/month)
  --------------------------------------------------------------

------------------------------------------------------------------------

*This document consolidates requirements from meetings held between
April 1, 2026 and May 22, 2026. When discrepancies exist between meeting
notes, the most recent decision takes precedence.*
