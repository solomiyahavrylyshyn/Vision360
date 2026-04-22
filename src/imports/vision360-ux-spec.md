# Vision360 FSM Platform - Phase 1A UX Specification
## Desktop-First Responsive Web Application

**Version**: 1.0
**Date**: 2026-04-01
**Client**: Marek Stroz
**Project**: Field Service Management Web Application
**Design Architect**: Claude (Anthropic)

---

## Project Overview

### Platform Details
- **Technology**: Angular, Desktop-first, Responsive
- **Primary Target**: Desktop 1366px+
- **Responsive**: Adapts to tablet (768px-1365px) and mobile (375px-767px)
- **Competitor Reference**: Jobber (primary), Invoice Simple, Workiz

### Client
Marek Stroz - Home service contractor business

---

## Design System Foundation

### Color Palette - Steel Theme

```css
/* Primary Colors */
--color-sidebar-dark: #1C2B3A;
--color-primary: #4A6FA5;
--color-primary-light: #EBF0F8;
--color-primary-border: #C8D5E8;
--color-white: #FFFFFF;

/* Backgrounds */
--color-bg-grey-light: #F5F7FA;
--color-bg-grey: #EDF0F5;

/* Borders */
--color-border: #DDE3EE;

/* Text */
--color-text-primary: #1A2332;
--color-text-secondary: #546478;

/* Status Colors */
--color-success: #16A34A;
--color-warning: #D97706;
--color-error: #DC2626;
```

### Typography Scale
- **H1**: Page titles (32px desktop, 28px tablet, 24px mobile)
- **H2**: Section headers (24px desktop, 22px tablet, 20px mobile)
- **H3**: Card/panel titles (20px desktop, 18px tablet, 16px mobile)
- **Body**: Default text (16px desktop/tablet, 14px mobile)
- **Small**: Meta information, labels (14px desktop/tablet, 12px mobile)
- **Mono**: Numbers, IDs

### Responsive Breakpoints

```css
/* Desktop (Primary) */
@media (min-width: 1366px) { /* Full layout */ }

/* Tablet */
@media (min-width: 768px) and (max-width: 1365px) { /* Adapted layout */ }

/* Mobile */
@media (max-width: 767px) { /* Compact layout */ }
```

### Global Responsive Patterns

**Left Sidebar**
- **Desktop (1366px+)**: 64px collapsed, 240px expanded (user toggles)
- **Tablet (768px-1365px)**: Fixed at 64px (icons only)
- **Mobile (≤767px)**: Hidden by default, hamburger menu triggers off-canvas overlay

**Content Area**
- **Desktop**: `calc(100vw - sidebar-width - 48px padding)`
- **Tablet**: `calc(100vw - 64px - 32px padding)`
- **Mobile**: `calc(100vw - 32px padding)`

**Top Bar**
- **Desktop**: 64px height
- **Tablet**: 64px height
- **Mobile**: 56px height

---

## 1. Main App Shell - Navigation Structure

### Layout Hierarchy

```
AppShell
├── LeftSidebar (collapsed by default)
├── TopBar
└── MainContent (router-outlet)
```

### Left Sidebar - Collapsed State (Desktop 1366px)

**Dimensions**
- Width: 64px
- Height: 100vh
- Position: Fixed left
- Background: #1C2B3A (sidebar-dark)

**Component Structure**
```
LeftSidebar
├── Logo Area (top)
│   └── Logo Icon (32x32px, centered, 16px padding)
├── Navigation Items (scrollable middle section)
│   ├── Home (eye icon) - ACTIVE MODULE
│   ├── Clients (users icon) - ACTIVE MODULE
│   ├── Estimates (document icon) - ACTIVE MODULE
│   ├── Invoices (receipt icon) - ACTIVE MODULE
│   ├── Payments (credit-card icon) - ACTIVE MODULE
│   ├── Jobs (briefcase icon) - ACTIVE MODULE
│   ├── Events (calendar icon) - ACTIVE MODULE
│   ├── Expenses (dollar-sign icon) - ACTIVE MODULE
│   ├── Items (package icon) - ACTIVE MODULE
│   ├── Reports (bar-chart icon) - ACTIVE MODULE
│   ├── --- DIVIDER ---
│   ├── Service Agreements (file-text icon) - LOCKED
│   ├── Employee Management (users icon) - LOCKED
│   ├── Inventory (box icon) - LOCKED
│   └── AI Autopilot (zap icon) - LOCKED
└── Expand Toggle (bottom, chevron-right icon)
```

**Navigation Item Specs**
- Size: 64x56px clickable area
- Icon: 24x24px, centered, color: #C8D5E8
- States:
  - **Default**: Icon #C8D5E8, transparent bg
  - **Hover**: Lighter bg (#2A3B4D), scale icon 1.05x
  - **Active**: Icon #4A6FA5 (primary blue), left border 3px #4A6FA5
  - **Locked**: 40% opacity, cursor not-allowed, lock icon overlay (12x12px)

### Left Sidebar - Expanded State

**Dimensions**
- Width: 240px
- Transition: 250ms ease-in-out

**Component Structure**
```
LeftSidebar (expanded)
├── Logo Area
│   ├── Logo Icon (32x32px)
│   └── Text: "Vision360" (H3, color: #FFFFFF)
├── Navigation Items
│   └── Each item:
│       ├── Icon (24x24px, 16px left padding)
│       ├── Label (Body, 12px left margin, color: #C8D5E8)
│       └── Badge (optional, right-aligned, bg: #4A6FA5)
└── Collapse Toggle (chevron-left icon)
```

### Top Bar

**Dimensions**
- Height: 64px
- Width: calc(100vw - 64px) when sidebar collapsed
- Position: Fixed top
- Background: #FFFFFF
- Border-bottom: 1px #DDE3EE

**Component Structure**
```
TopBar
├── Left Section (empty, allows for breadcrumbs)
├── Center Section (flexible space)
└── Right Section
    └── Settings Button
        ├── Icon: gear/cog (24x24px, color: #546478)
        ├── Size: 40x40px clickable area
        ├── Hover: bg #EDF0F5
        └── Tooltip: "Settings"
```

### Responsive Behavior

**Tablet (768px-1365px)**
- Sidebar: Locked at 64px (icons only)
- Content adjusts accordingly

**Mobile (≤767px)**
- Sidebar: Hidden (off-canvas)
- Hamburger menu: Top-left of TopBar
- TopBar height: 56px
- Hamburger triggers overlay sidebar (280px wide)

---

## 2. Home / Dashboard Screen

**Route**: `/home` (default after login)
**Icon**: Eye icon

### Desktop Layout (1366px+)

**Dimensions**
- Content width: calc(100vw - 64px - 48px)
- Max-width: 1280px (centered)
- Padding: 24px all sides

### Component Hierarchy

```
DashboardPage
├── PageHeader
│   ├── Title: "Home" (H1, color: #1A2332)
│   └── Subtitle: "Welcome back, Marek" (Body, color: #546478)
├── QuickStats (4-column grid, gap: 16px)
│   ├── StatCard: Active Jobs
│   ├── StatCard: Upcoming Events Today
│   ├── StatCard: Pending Invoices
│   └── StatCard: Revenue This Month
├── MainContent (2-column: 8:4 ratio, gap: 24px)
│   ├── LeftColumn
│   │   ├── UpcomingEventsWidget
│   │   └── RecentActivityWidget
│   └── RightColumn
│       ├── QuickActionsWidget
│       └── PendingTasksWidget
```

### StatCard Component

```
StatCard
├── Container
│   ├── Background: #FFFFFF
│   ├── Border: 1px #DDE3EE
│   ├── Border-radius: 8px
│   ├── Padding: 20px
│   ├── Min-height: 120px
│   └── Hover: shadow elevation
├── Icon (32x32px, color: #4A6FA5)
├── Value (H1, bold, color: #1A2332)
├── Label (Small, color: #546478)
└── Change Indicator (optional)
    ├── Arrow icon
    └── Percentage (color: #16A34A for positive, #DC2626 for negative)
```

### Responsive Behavior

**Tablet (768px-1365px)**
- QuickStats: Remains 4 columns, cards shrink
- MainContent: Becomes 7:5 ratio

**Mobile (≤767px)**
- QuickStats: Single column, stacked
- MainContent: Single column
- Order: QuickStats → QuickActions → UpcomingEvents → RecentActivity

---

## 3. Clients List Screen

**Route**: `/clients`
**Icon**: Users icon

### Desktop Layout (1366px+)

**Component Hierarchy**

```
ClientsPage
├── PageHeader
│   ├── Title: "Clients" (H1)
│   └── PrimaryAction: "+ New Client" (bg: #4A6FA5, text: #FFFFFF)
├── FilterBar (bg: #F5F7FA, border-radius: 8px)
│   ├── SearchInput (320px)
│   ├── StatusChips (All/Active/Inactive)
│   └── SortDropdown
├── ClientsTable
│   ├── Columns: Checkbox | Name | Contact | Address | Total Jobs | Last Activity | Actions
│   └── Rows: ClientRow (72px each)
└── EmptyState (if no clients)
```

### ClientRow (Desktop)

```
ClientRow
├── Background: #FFFFFF
├── Border-bottom: 1px #DDE3EE
├── Hover: bg #F5F7FA
├── NameCell
│   ├── Avatar (32px circle, bg: #EBF0F8, text: #4A6FA5)
│   └── Name (Body, bold, color: #1A2332)
├── ContactCell (color: #546478)
└── Actions (kebab menu, color: #546478)
```

### Responsive Behavior

**Tablet (768px-1365px)**
- Hide "Address" column
- Table remains visible

**Mobile (≤767px)**
- FilterBar stacks vertically
- Table → Card layout via CSS
- ClientCard:
  ```
  ┌─────────────────────────────┐
  │ [Avatar] John Smith         │
  │ john@example.com            │
  │ (555) 123-4567             │
  │ 5 jobs                [⋮]  │
  └─────────────────────────────┘
  ```

---

## 4. Create Estimate Screen

**Route**: `/estimates/new` or `/estimates/:id/edit`

### Desktop Layout (1366px+)

**Component Hierarchy**

```
CreateEstimatePage
├── PageHeader
│   ├── BackButton (← Estimates)
│   ├── Title: "New Estimate" (H1)
│   └── Actions
│       ├── Save Draft (secondary)
│       ├── Preview (secondary)
│       └── Send Estimate (primary: #4A6FA5)
├── FormLayout (2-column: 7:5 ratio)
│   ├── LeftColumn - Main Form
│   │   ├── ClientSection
│   │   ├── JobSection (optional)
│   │   ├── EstimateDetailsSection
│   │   ├── LineItemsSection
│   │   ├── NotesSection
│   │   └── AttachmentsSection
│   └── RightColumn - Summary (sticky)
│       └── EstimateSummary
```

### LineItemsSection

```
LineItemsTable
├── Header (bg: #EDF0F5)
│   ├── Item/Service
│   ├── Quantity
│   ├── Unit Price
│   ├── Tax (checkbox)
│   └── Amount
└── LineItemRow (each)
    ├── Border: 1px #DDE3EE
    ├── Border-radius: 4px
    ├── Margin-bottom: 8px
    └── ItemSelector (autocomplete from Items catalog)
```

### SubtotalSection

```
SubtotalSection (bg: #EBF0F8)
├── Padding: 16px
├── Border-radius: 8px
├── SubtotalRow (color: #1A2332)
├── TaxRow (color: #546478)
└── TotalRow (H2, bold, color: #4A6FA5)
```

### Responsive Behavior

**Tablet (768px-1365px)**
- FormLayout: 6:6 ratio
- LineItems: Remains table format

**Mobile (≤767px)**
- FormLayout: Single column
- RightColumn (Summary): Fixed bottom sheet
- LineItems: Card-based layout
- All form fields: Full width, stacked

---

## 5. Jobs Screen (List View)

**Route**: `/jobs`
**Icon**: Briefcase icon

### Desktop Layout (1366px+)

**Component Hierarchy**

```
JobsPage
├── PageHeader
│   ├── Title: "Jobs" (H1)
│   └── "+ New Job" (primary button)
├── FilterBar
│   ├── SearchInput (320px)
│   ├── StatusChips (All/Active/Scheduled/In Progress/Completed/Cancelled)
│   └── SortDropdown
├── JobsTable
│   ├── Columns: Checkbox | Job # | Client | Description | Status | Next Event | Total Value | Actions
│   └── Rows: JobRow (72px each)
```

### JobRow

```
JobRow
├── Background: #FFFFFF
├── Border-bottom: 1px #DDE3EE
├── Hover: bg #F5F7FA
├── JobNumberCell (color: #4A6FA5, mono font)
├── StatusBadge
│   ├── Active: bg #EBF0F8, text #4A6FA5
│   ├── In Progress: bg #FEF3C7, text #D97706
│   ├── Completed: bg #DCFCE7, text #16A34A
│   └── Cancelled: bg #F5F7FA, text #546478
└── TotalValue (Body, bold, color: #1A2332)
```

### Responsive Behavior

**Tablet (768px-1365px)**
- Hide "Description" column
- Table remains visible

**Mobile (≤767px)**
- FilterBar: Stack vertically
- Table → Card layout
- JobCard:
  ```
  ┌─────────────────────────────┐
  │ J-1234        [Status]      │
  │ John Smith                  │
  │ Kitchen renovation...       │
  │ Next: Jan 15, 2:00 PM      │
  │ $2,450.00          [⋮]     │
  └─────────────────────────────┘
  ```

---

## 6. Single Job Detail Screen

**Route**: `/jobs/:id`

### Desktop Layout (1366px+)

**Component Hierarchy**

```
JobDetailPage
├── PageHeader (64px, border-bottom: 1px #DDE3EE)
│   ├── BackButton + Job # + Status
│   ├── Job Description (H1)
│   └── Actions: [Edit] [Menu] [Primary Action]
├── ClientInfoBar (bg: #EBF0F8, border: 1px #C8D5E8)
│   ├── Avatar + Client Name
│   ├── Contact (email, phone)
│   ├── Location
│   └── Quick Actions (Call, Email, Navigate)
├── MainLayout (2-column: 8:4 ratio)
│   ├── LeftColumn
│   │   ├── mat-tab-group
│   │   │   ├── Events Tab (default) ★
│   │   │   ├── Estimates Tab
│   │   │   ├── Invoices Tab
│   │   │   ├── Expenses Tab
│   │   │   ├── Payments Tab
│   │   │   └── Files Tab
│   │   └── TabContent
│   └── RightColumn (360px, sticky)
│       ├── JobSummaryCard
│       └── ActivityFeed
```

### Events Tab - EventCard

```
EventCard
├── Container
│   ├── Background: #FFFFFF
│   ├── Border: 1px #DDE3EE
│   ├── Border-left: 4px (status color)
│   │   ├── Scheduled: #4A6FA5
│   │   ├── In Progress: #D97706
│   │   ├── Completed: #16A34A
│   │   └── Cancelled: #546478
│   ├── Border-radius: 8px
│   ├── Padding: 24px
│   └── Hover: shadow elevation
├── TimelineDot (16px, left, matches border color)
├── DateTime (H3, color: #1A2332)
├── Description (Body, color: #546478)
└── StatusBadge
```

### JobSummaryCard

```
JobSummaryCard (sticky, bg: #FFFFFF, border: 1px #DDE3EE)
├── Header: "Job Summary" (H3, color: #1A2332)
├── Metadata (color: #546478)
├── Divider (border: 1px #DDE3EE)
├── FinancialSummary
│   ├── Estimates row
│   ├── Invoices row
│   ├── Payments row (color: #16A34A)
│   ├── Expenses row (color: #DC2626)
│   └── Balance Due (H3, bold, color: #4A6FA5)
└── QuickActions
```

### Responsive Behavior

**Tablet (768px-1365px)**
- MainLayout: 7:5 ratio
- RightColumn: 320px

**Mobile (≤767px)**
- Single column layout
- RightColumn: Collapsible accordion at top
- ClientInfoBar: Stacks vertically
- Tabs: Horizontal scroll

---

## 7. Create/Edit Event Screen

**Route**: `/events/new` or `/events/:id/edit`

### Desktop Layout (1366px+)

**Component Hierarchy**

```
CreateEventPage
├── PageHeader
│   ├── BackButton
│   ├── Title: "Schedule Event" (H1)
│   └── Actions
│       ├── Cancel (ghost)
│       ├── Save Draft (secondary)
│       └── Save & Notify Client (primary: #4A6FA5)
├── FormLayout (2-column: 7:5 ratio)
│   ├── LeftColumn - Main Form
│   │   ├── JobSection (if from /events/new)
│   │   ├── DateTimeSection
│   │   ├── DetailsSection
│   │   ├── AssignmentSection
│   │   ├── NotesSection
│   │   └── NotificationSection
│   └── RightColumn - Event Summary (sticky)
│       ├── EventPreview
│       ├── JobContext
│       └── RelatedItems
```

### DateTimeSection

```
DateTimeSection
├── Label: "Date & Time" (H3, color: #1A2332)
├── FieldGrid (2 columns)
│   ├── DateField (mat-datepicker)
│   ├── StartTimeField
│   ├── DurationField (dropdown)
│   └── EndTimeField (auto-calculated)
└── AllDayCheckbox
```

**Field Styling**
- Border: 1px #DDE3EE
- Focus: border #4A6FA5
- Background: #FFFFFF
- Label: Small, color #546478

### EventPreview (Right Column)

```
EventPreview (sticky, bg: #FFFFFF, border: 1px #DDE3EE)
├── Label: "Event Summary" (H3)
├── ClientInfo (avatar + name)
├── Divider
├── EventDetails (icon + text, color: #546478)
│   ├── Date
│   ├── Time
│   ├── Duration
│   └── Type
└── JobContext (bg: #EBF0F8, padding: 12px)
```

### Responsive Behavior

**Mobile (≤767px)**
- FormLayout: Single column
- EventPreview: Fixed bottom sheet
- DateTimeSection: All fields full-width, stacked
- Actions: Sticky bottom bar

---

## 8. Expenses Screen

**Route**: `/expenses`
**Icon**: Dollar-sign icon

### Desktop Layout (1366px+)

**Component Hierarchy**

```
ExpensesPage
├── PageHeader
│   ├── Title: "Expenses" (H1)
│   └── "+ Add Expense" (primary button)
├── SummaryBar (4-column grid)
│   ├── StatCard: Total Expenses
│   ├── StatCard: This Month
│   ├── StatCard: Reimbursable Pending (color: #16A34A)
│   └── StatCard: Non-Reimbursable
├── FilterBar
│   ├── SearchInput
│   ├── TypeFilter (All/Reimbursable/Non-Reimbursable/Recurring)
│   ├── DateRangeFilter
│   └── CategoryFilter
├── ExpensesTable
│   ├── Columns: Checkbox | Date | Description | Category | Job | Type | Receipt | Amount | Actions
│   └── Rows: ExpenseRow (72px each)
```

### ExpenseRow

```
ExpenseRow
├── Background: #FFFFFF
├── Border-bottom: 1px #DDE3EE
├── Hover: bg #F5F7FA
├── Description
│   ├── Text (Body, color: #1A2332)
│   └── Recurring icon (if recurring): 🔁
├── TypeCell
│   ├── Reimbursable: chip bg #DCFCE7, text #16A34A
│   └── Non-Reimbursable: chip bg #F5F7FA, text #546478
├── Receipt: thumbnail (48x48px) or "—"
└── Amount (Body, bold, color: #1A2332)
```

### Create Expense Modal

**Receipt Upload Zone**
```
DragDropZone
├── Border: 2px dashed #C8D5E8
├── Border-radius: 8px
├── Background: #EBF0F8 (on drag)
├── Icon: upload-cloud (48px, color: #4A6FA5)
├── Text: "Drag receipt here or click to browse"
└── Formats: "JPG, PNG, PDF up to 10MB"
```

**Recurring Expense Section**
```
RecurringSection
├── Toggle: mat-slide-toggle (color: #4A6FA5)
├── FrequencyDropdown (if ON)
├── StartDate
└── EndOptions
```

### Responsive Behavior

**Tablet (768px-1365px)**
- SummaryBar: Remains 4 columns
- Table: Hide "Category" column

**Mobile (≤767px)**
- SummaryBar: 2x2 grid
- FilterBar: Stack vertically
- Table → Card layout
- ExpenseModal: Full-screen

---

## 9. Items Catalog Screen

**Route**: `/items`
**Icon**: Package icon

### Desktop Layout (1366px+)

**Component Hierarchy**

```
ItemsCatalogPage
├── PageHeader
│   ├── Title: "Items Catalog" (H1)
│   └── Actions
│       ├── Import (secondary)
│       └── "+ Add Item" (primary: #4A6FA5)
├── SidebarLayout (2-column: 3:9 ratio)
│   ├── LeftSidebar - Categories (280px)
│   │   ├── Header: "Categories" + "+ New"
│   │   ├── All Items (bold, bg: #EBF0F8 if active)
│   │   ├── Uncategorized
│   │   ├── Divider
│   │   └── CustomCategories (drag-sortable)
│   │       └── CategoryItem
│   │           ├── ColorDot (8px circle)
│   │           ├── Label
│   │           └── Count
│   └── MainContent
│       ├── ToolBar (search + filters + view toggle)
│       ├── ItemsGrid (default, 4 columns)
│       │   └── ItemCard
│       └── OR ItemsTable
```

### ItemCard

```
ItemCard
├── Container
│   ├── Width: 280px
│   ├── Background: #FFFFFF
│   ├── Border: 1px #DDE3EE
│   ├── Border-radius: 8px
│   ├── Padding: 16px
│   ├── Min-height: 240px
│   └── Hover: shadow + bg #F5F7FA
├── CategoryBadge (top-left, color-coded)
├── ItemIcon (64x64px, color: #C8D5E8)
├── ItemName (H3, bold, color: #1A2332)
├── Description (Small, color: #546478, 2 lines max)
├── Price (H2, bold, color: #4A6FA5)
└── QuickAdd button (border: 1px #C8D5E8)
```

### Category Management

**CategoryItem**
```
CategoryItem
├── Height: 40px
├── Padding: 8px 12px
├── Hover: bg #EDF0F5
├── Active: bg #EBF0F8, border-left: 3px #4A6FA5
├── ColorDot (8px, left)
├── Label (Body, color: #1A2332)
└── Count (Small, color: #546478)
```

**Color Options for Categories**
- Primary: #4A6FA5
- Success: #16A34A
- Warning: #D97706
- Error: #DC2626
- Purple: #9333EA
- Teal: #0D9488
- Pink: #DB2777
- Orange: #EA580C

### Responsive Behavior

**Tablet (768px-1365px)**
- Sidebar: 240px
- ItemsGrid: 3 columns

**Mobile (≤767px)**
- Category sidebar: Horizontal chip scroll (sticky top)
- ItemsGrid: Single column (full-width cards)
- ItemModal: Full-screen

---

## 10. Onboarding Flow

**Routes**: `/onboarding/step-1`, `/onboarding/step-2`, `/onboarding/step-3`
**Context**: First-time user registration, 3 steps max

### Step 1: Account Creation

**Desktop Layout (560px centered card)**

```
AccountCreationPage
├── Logo (64px, color: #4A6FA5)
├── Heading: "Create Your Account" (H1)
├── Subheading (color: #546478)
├── Form
│   ├── EmailField
│   ├── PasswordField
│   │   └── Strength indicator (bar)
│   │       ├── Weak: #DC2626
│   │       ├── Medium: #D97706
│   │       └── Strong: #16A34A
│   ├── ConfirmPasswordField
│   └── TermsCheckbox
├── SubmitButton
│   ├── Text: "Create Account"
│   ├── Background: #4A6FA5
│   ├── Color: #FFFFFF
│   └── Disabled: bg #C8D5E8
└── Footer: "Already have an account?" + Sign In link
```

### Step 2: Company Setup

**Desktop Layout (560px centered card)**

```
CompanySetupPage
├── ProgressIndicator (top)
│   ├── Step 1: ✓ (color: #16A34A)
│   ├── Step 2: ● (color: #4A6FA5, pulsing)
│   └── Step 3: ○ (color: #C8D5E8)
├── Heading: "Tell Us About Your Business"
├── Form
│   ├── CompanyNameField
│   ├── YourNameFields (2-column)
│   ├── PhoneField
│   └── TimezoneField
└── Actions
    ├── Back (ghost, color: #546478)
    └── Continue (primary: #4A6FA5)
```

### Step 3: Welcome & First Action

**Desktop Layout (640px centered card)**

```
WelcomePage
├── ProgressIndicator (all completed)
├── Celebration (check-circle icon, 80px, color: #16A34A)
├── Heading: "Welcome to Vision360, [Name]!" (H1)
├── QuickStartOptions (3 cards)
│   └── OptionCard
│       ├── Icon (48px, color: #4A6FA5)
│       ├── Title (H3)
│       ├── Description (color: #546478)
│       └── Button (secondary)
└── Footer
    ├── ResourceLinks
    └── "Skip to Dashboard" link
```

### Responsive Behavior

**Mobile (≤767px)**
- Card: Full-screen layout (no card border)
- Width: calc(100vw - 32px)
- Logo: 48px
- All fields: Full width
- Social buttons: Stack vertically

---

## 11. Notification Patterns

### Toast Messages (Snackbar)

**Structure**
```
Toast
├── Position: Bottom-center (desktop), top-center (mobile)
├── Width: Max 560px (desktop), calc(100vw - 32px) (mobile)
├── Padding: 16px 24px
├── Border-radius: 8px
├── Shadow: Elevation 6
└── Duration: 4 seconds
```

**Toast Types**

**Success Toast**
- Background: #16A34A
- Icon: check-circle (#FFFFFF)
- Text: #FFFFFF

**Error Toast**
- Background: #DC2626
- Icon: alert-circle (#FFFFFF)
- Text: #FFFFFF

**Warning Toast**
- Background: #D97706
- Icon: alert-triangle (#FFFFFF)
- Text: #FFFFFF

**Info Toast**
- Background: #4A6FA5
- Icon: info (#FFFFFF)
- Text: #FFFFFF

**Neutral Toast**
- Background: #1C2B3A
- Text: #FFFFFF

### Empty States

**Structure**
```
EmptyState (centered)
├── Icon (80-120px, color: #C8D5E8)
├── Heading (H2, color: #1A2332)
├── Description (Body, color: #546478)
└── PrimaryAction (button, bg: #4A6FA5)
```

### Loading States

**Full-Page Spinner**
- Spinner color: #4A6FA5
- Background: rgba(255, 255, 255, 0.9)

**Skeleton Screens**
- Background: #EDF0F5
- Shimmer: #F5F7FA to #FFFFFF
- Animation: 1.5s infinite

**Button Loading**
- Spinner: 20px diameter, color: #FFFFFF
- Button disabled: bg #C8D5E8

---

## 12. Responsive Behavior Patterns

### Table → Card Transformation

```scss
.data-table {
  @media (min-width: 768px) {
    display: table;
  }

  @media (max-width: 767px) {
    display: block;

    tr {
      display: block;
      border: 1px solid #DDE3EE;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      background: #FFFFFF;
    }

    td {
      display: block;
      border: none;
    }
  }
}
```

### Form Grid Responsiveness

```scss
.form-grid {
  display: grid;
  gap: 16px;

  @media (min-width: 1366px) {
    &.two-column { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr !important;
  }
}
```

### Modal Responsiveness

```scss
.mat-dialog-container {
  @media (min-width: 1366px) {
    max-width: 720px;
    border-radius: 12px;
  }

  @media (max-width: 767px) {
    max-width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
  }
}
```

---

## Navigation Structure Summary

### Active Modules (Phase 1A)
1. Home (eye icon) - Dashboard
2. Clients (users icon) - Client management
3. Estimates (document icon) - Create and send estimates
4. Invoices (receipt icon) - Invoice management
5. Payments (credit-card icon) - Payment tracking
6. Jobs (briefcase icon) - Job containers
7. Events (calendar icon) - Appointments/visits
8. Expenses (dollar-sign icon) - Expense tracking with receipts
9. Items (package icon) - Items catalog with categories
10. Reports (bar-chart icon) - Basic reporting
11. Settings (gear icon, top-right only)

### Locked Features (Future Phases)
- Service Agreements (grayed out, lock icon)
- Employee Management (grayed out, lock icon)
- Inventory (grayed out, lock icon)
- AI Autopilot (grayed out, lock icon)

---

## Key Domain Concepts

### Job = Accounting Container
- Holds Events, Estimates, Expenses, Payments
- Has a client, description, status
- Financial summary rolls up all related items

### Event = Single Visit/Appointment
- Always belongs to a Job
- Has date, time, assigned technician
- Customers see "Appointment" in notifications (not "Event")

### Expense Types (Required Field)
- **Reimbursable**: Can be billed to client
- **Non-Reimbursable**: Business overhead

### Recurring Expenses
- Frequency: Weekly, Bi-weekly, Monthly, Quarterly, Yearly
- Start date and end options
- Creates individual expense records

### Items Catalog
- NOT called "Price Book"
- Custom categories (user-defined)
- Each item has: name, description, price, unit, category
- Used in estimates for quick line item addition

---

## UX Principles

1. **Clean, Minimal, Not Cluttered**
   - White space for breathing room
   - Clear visual hierarchy
   - Focused task flows

2. **Settings in ONE Place Only**
   - Top-right corner of TopBar
   - Consistent across all screens
   - Never in multiple locations

3. **Desktop-First, Responsive**
   - Design for 1366px primary
   - Adapt down to tablet and mobile
   - Same components, responsive layouts

4. **Spell Check Everywhere**
   - All text inputs and textareas
   - Enabled by default
   - Helps prevent typos in client communications

5. **Drag & Drop Receipt Upload**
   - In Expenses screen
   - Visual feedback on drag
   - Progress indicators

6. **Simple Onboarding**
   - Email + password (Step 1)
   - Company setup (Step 2)
   - Welcome + first action (Step 3)
   - Can skip Step 3

---

## Angular Material Component Usage

### Primary Components
- `mat-table` with `matSort`, `matPaginator`
- `mat-card` for cards and panels
- `mat-form-field` with `matInput` for inputs
- `mat-select` for dropdowns
- `mat-autocomplete` for searchable selects
- `mat-datepicker` for date inputs
- `mat-checkbox`, `mat-radio-button`, `mat-slide-toggle`
- `mat-button`, `mat-raised-button`, `mat-icon-button`
- `mat-dialog` for modals
- `mat-snack-bar` for toasts
- `mat-progress-spinner`, `mat-progress-bar`
- `mat-tab-group` for tabs
- `mat-menu` for dropdown menus
- `mat-chip`, `mat-chip-list` for filters and tags

---

## End of Specification

**Status**: Ready for Figma design and Angular development
**Version**: 1.0
**Last Updated**: 2026-04-01
