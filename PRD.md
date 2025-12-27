# Planning Guide

A comprehensive, enterprise-grade time tracking application with multi-tenancy, role-based access, approval workflows, and full audit trails for managing employee work hours, project assignments, rates, and expenses in a scalable, compliant platform.

**Experience Qualities**: 
1. **Professional** - Clean, business-focused interface that conveys reliability and trustworthiness for workplace time management
2. **Efficient** - Quick data entry with minimal clicks, enabling fast logging of time entries and mileage without friction
3. **Organized** - Clear visual hierarchy and logical grouping of time entries, projects, and mileage records for easy review

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires enterprise-level features including multi-tenant architecture, role-based access control, hierarchical data structures (Tenant → Client → Project → Phase → Task), dynamic rate management, approval workflows, version control with audit trails, and immutable accounting logic after approval - warranting a sophisticated multi-view architecture with data model migration capabilities.

## Essential Features

### Multi-Tenant Architecture
- **Functionality**: Support multiple companies (tenants) in a single system with complete data isolation
- **Purpose**: Enable SaaS deployment where each company has their own isolated data space
- **Trigger**: System initialization or admin tenant creation
- **Progression**: Create tenant → Configure settings → Add users/employees → Assign roles → Begin operations
- **Success criteria**: Complete data isolation between tenants, tenant-specific configuration, proper data scoping in all queries

### Hierarchical Data Model
- **Functionality**: Structured data hierarchy: Tenant → Client → Project → Phase → Task → Time Entry
- **Purpose**: Enable detailed project organization and precise time allocation matching real-world business structures
- **Trigger**: Project setup and planning workflows
- **Progression**: Create client → Add project → Define phases (optional) → Create tasks (optional) → Log time against hierarchy
- **Success criteria**: Flexible navigation through hierarchy, optional intermediate levels, reporting at any level

### Role-Based Access Control
- **Functionality**: Four user roles with distinct permissions: Admin (full access), Project Manager (approve/manage), Employee (track time), External (limited contractor access)
- **Purpose**: Ensure data security and appropriate access levels for different organizational positions
- **Trigger**: User creation or role assignment
- **Progression**: Admin creates user → Assigns role → Role determines UI visibility and action permissions → System enforces boundaries
- **Success criteria**: Proper permission enforcement, role-appropriate UI, admin override capabilities

### Dynamic Rate Management
- **Functionality**: Flexible hourly rate definitions with hierarchy: Task Rate > Project Rate > Employee Rate. Valid date ranges (from/to) for rate changes over time.
- **Purpose**: Support varying billing rates based on project type, employee seniority, or time period for accurate revenue tracking
- **Trigger**: Project setup, contract changes, employee promotions
- **Progression**: Define rate → Set scope (employee/project/task) → Specify valid date range → System auto-selects appropriate rate for time entries
- **Success criteria**: Correct rate application based on hierarchy and date, historical accuracy, rate change auditing

### Approval Workflows
- **Functionality**: Timesheet period submissions with approval chain: Draft → Submitted → Approved/Rejected. Managers can approve/reject with comments.
- **Purpose**: Ensure time entry accuracy and provide formal authorization before payroll/billing processing
- **Trigger**: Employee submits timesheet period for approval
- **Progression**: Employee fills timesheet → Submits period → Manager reviews → Approves or rejects with reason → Locked if approved
- **Success criteria**: Status tracking, email notifications (simulated), rejection reasons captured, resubmission flow

### Audit Trail & Versioning
- **Functionality**: Every record tracks created_by, created_at, updated_by, updated_at, device. Full change log with before/after snapshots and reason.
- **Purpose**: Maintain complete history for compliance, debugging, and accountability
- **Trigger**: Any create, update, or delete operation
- **Progression**: User modifies data → System captures current state → Records change with user ID, timestamp, device, reason → Stores in immutable log
- **Success criteria**: Complete audit history, tamper-proof logs, queryable change history, device tracking

### Immutable Accounting Logic
- **Functionality**: Once approved, time/expense entries become locked and uneditable. Only correction entries (negative + positive) allowed.
- **Purpose**: Maintain accounting integrity and prevent retroactive tampering with approved financial data
- **Trigger**: Entry approval or period lock
- **Progression**: Entry approved → Status locked → Edit attempts blocked → Correction entry created → Links to original → Both visible in reports
- **Success criteria**: Locked entries cannot be modified, correction entries properly linked, audit trail preserved

### Planned vs Actual Time
- **Functionality**: Calendar/schedule planning with expected hours per employee/project/task. Compare planned vs actual in dashboards.
- **Purpose**: Enable resource planning, identify over/under allocation, improve estimation accuracy
- **Trigger**: Project planning or weekly scheduling
- **Progression**: Define planned hours → Assign to employee/project/date → Track actual time → View variance reports → Adjust plans
- **Success criteria**: Visual plan vs actual comparison, variance calculations, alerts for significant deviations

### Absence Management
- **Functionality**: Track vacation, sick days, holidays, blocked periods. Approval workflow for leave requests. Calendar integration.
- **Purpose**: Maintain accurate availability data, prevent time entry on absence days, support capacity planning
- **Trigger**: Employee requests leave or admin blocks dates
- **Progression**: Employee requests absence → Specifies type/dates → Submits → Manager approves → Blocks time entry on those dates → Reflected in planning
- **Success criteria**: Absence types supported, approval flow, calendar blocking, reporting

### Expense & Mileage Tracking
- **Functionality**: Log expenses and mileage with project assignment, receipts, rates, amounts. Approval workflow similar to timesheets.
- **Purpose**: Track reimbursable expenses and project costs beyond labor hours
- **Trigger**: Employee incurs business expense or drives for work
- **Progression**: Employee logs expense → Attaches receipt (optional) → Assigns to project → Submits → Manager approves → Included in project costs
- **Success criteria**: Multiple expense types, rate calculations for mileage, approval integration, cost reporting

### Employee Management
- **Functionality**: Create, view, edit, and manage employee profiles with names, emails, roles, hourly rates, and tenant assignment
- **Purpose**: Maintain a centralized employee database for time tracking, rate application, and access control
- **Trigger**: HR onboarding or admin user creation
- **Progression**: Click add employee → Enter details (name, email, role, rate) → Save → Employee can log in → Appears in assignments
- **Success criteria**: Employees persist, roles enforced, rates applied, deactivation without deletion

### Project Management
- **Functionality**: Create and manage projects with names, descriptions, client assignments, phases, tasks, dates, and budgets
- **Purpose**: Enable detailed time tracking against structured projects for accurate billing, reporting, and project management
- **Trigger**: Click "Add Project" button, edit existing project, or add phases/tasks
- **Progression**: Create client → Click add project → Enter project details → Optionally add phases → Optionally add tasks → Assign to employees → Track time
- **Success criteria**: Projects persist, support optional phases/tasks, client assignment, accumulated hours, budget tracking

### Time Entry Tracking (Enhanced with Detailed Fields)
- **Functionality**: Log work sessions with live timer (Start/Stop/Pause), manual time entry, project/phase/task hierarchy, templates, bulk editing, and approval workflow. Support both required and optional fields with full audit trails.
- **Purpose**: Record billable and non-billable hours for payroll, invoicing, and productivity analysis with maximum flexibility, detailed categorization, and compliance-ready audit logging
- **Required Fields**: Project, Date, Duration (or Start/End times), Tenant ID, Employee ID
- **Optional Fields**: Phase, Task, Tag(s), Location, Notes, Cost Center, Billable yes/no
- **Audit Fields**: Created by/at, Updated by/at, Device, Change Log
- **Trigger**: Click "Start Timer" for active tracking or "Add Time Entry" for manual entry
- **Progression**: 
  - Live Timer: Click start → Select employee/project/phase/task → Add optional details → Timer runs → Pause/resume → Switch project without stopping → Click stop → Entry saved with audit data → Calculates applicable rate
  - Manual Entry: Click add → Select employee/project (required) → Optional phase/task → Choose date (required) → Enter start/end times or duration (required) → Add optional fields → Save → Entry marked as draft → Submit for approval
  - Quick Actions: Use favorites, recent projects, or templates → Bulk select entries for mass edits (tags, billable status, etc.) → Export filtered entries
  - Auto-pause: Timer detects idle time → Prompts to discard or keep idle period → Optional auto-resume
  - Approval: Submit timesheet period → Manager reviews all entries → Approves or rejects → Approved entries lock → Only corrections allowed
- **Success criteria**: Active timer persists with device info, project/phase/task hierarchy navigation, rate auto-calculation, approval status tracking, locked entries prevent edits, correction entry workflow, complete change log, device tracking, bulk operations, compliance reporting

### Mileage & Expense Logbook
- **Functionality**: Record vehicle trips and expenses with employee, project, date, locations, distance, purpose, rates, amounts, receipts, and approval workflow
- **Purpose**: Track business mileage and expenses for reimbursement, tax compliance, and project cost allocation
- **Trigger**: Click "Add Mileage" or "Add Expense" button
- **Progression**: Click add → Select employee/project → Choose date → Enter details (locations/distance for mileage or amount/description for expenses) → Attach receipt (optional) → Rate auto-calculated → Submit for approval → Manager approves → Entry locks
- **Success criteria**: Mileage and expense entries persist, rate calculations, approval workflow integration, locked after approval, project cost aggregation, receipt storage

### Dashboard Overview
- **Functionality**: Display summary cards with total hours worked, active projects, and total mileage, plus CSV export capabilities
- **Purpose**: Provide at-a-glance metrics for quick status checks and export data for accounting/payroll
- **Trigger**: Navigate to dashboard view (default landing page)
- **Progression**: Load app → View summary metrics → Click into detailed views for more information → Export reports as needed
- **Success criteria**: Dashboard accurately reflects current data and updates when new entries are added, CSV exports contain complete data

### CSV Report Exports
- **Functionality**: Export time entries, mileage logs, and payroll reports to CSV format for accounting systems
- **Purpose**: Enable data import into accounting software, payroll systems, and spreadsheet analysis
- **Trigger**: Click export buttons on Dashboard, Time Tracking, or Mileage views
- **Progression**: Click export button → Select report type → Optionally specify date range → Generate CSV → Browser downloads file
- **Success criteria**: CSV files contain all relevant fields, proper formatting for German locale (date format, decimal separators), and descriptive filenames with timestamps

## Edge Case Handling
- **Empty States**: Clear call-to-action messages when no tenants, employees, projects, clients, time entries, or expenses exist
- **Invalid Time Ranges**: Prevent end times before start times with validation and helpful error messages
- **Missing Data**: Gracefully handle deleted employees/projects that have associated records by showing archived references
- **Duplicate Entries**: Allow multiple time entries for the same employee/project/day to accommodate split shifts
- **Negative Values**: Validate that distance, duration, and amount values are positive numbers
- **Date Selection**: Default to current date but allow historical entry backdating with permission checks
- **Optional Field Validation**: All optional fields can be empty without preventing save
- **Tag Management**: Prevent duplicate tags in the same entry, allow easy removal
- **Billable Toggle**: Default billable status to true but allow explicit non-billable marking
- **Rate Conflicts**: When multiple rates could apply, use most specific (task > project > employee)
- **Locked Entry Edits**: Block all edits to approved/locked entries, require correction entry workflow
- **Approval Permissions**: Only admins and project managers can approve, cannot approve own entries
- **Tenant Isolation**: Strictly enforce data scoping by tenant ID in all queries
- **Role Boundaries**: External users cannot see other employees' data, employees cannot approve
- **Rate Date Gaps**: System handles periods with no applicable rate by showing warning
- **Absence Conflicts**: Prevent time entry on absence days with clear messaging
- **Migration Safety**: Safely migrate legacy data to new model without data loss, preserve audit trail
- **Correction Linking**: Always maintain link between correction and original entry for audit trail

## Design Direction
The design should evoke enterprise professionalism, trustworthiness, and operational efficiency - like a well-organized corporate system. It should feel modern, powerful, and audit-ready while remaining approachable. The interface should prioritize clarity, compliance indicators (approval status, locked entries), role-appropriate views, and efficient data entry workflows.

## Color Selection
A professional palette with warm undertones to balance corporate formality with approachability, using blue for trust and orange accents for energy.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 250)) - Conveys professionalism, trust, and corporate reliability
- **Secondary Colors**: Soft Blue-Gray (oklch(0.85 0.02 250)) for backgrounds providing visual rest; Charcoal (oklch(0.25 0.01 250)) for text ensuring readability
- **Accent Color**: Vibrant Orange (oklch(0.68 0.19 45)) - Energetic highlight for CTAs, active states, and important metrics
- **Foreground/Background Pairings**: 
  - Background (White oklch(0.99 0 0)): Charcoal text (oklch(0.25 0.01 250)) - Ratio 13.2:1 ✓
  - Primary (Deep Blue oklch(0.45 0.15 250)): White text (oklch(0.99 0 0)) - Ratio 8.1:1 ✓
  - Accent (Vibrant Orange oklch(0.68 0.19 45)): White text (oklch(0.99 0 0)) - Ratio 4.9:1 ✓
  - Secondary (Soft Blue-Gray oklch(0.85 0.02 250)): Charcoal text (oklch(0.25 0.01 250)) - Ratio 10.5:1 ✓

## Font Selection
Typography should balance professional authority with modern approachability, using a geometric sans-serif for clarity.

- **Typographic Hierarchy**: 
  - H1 (Page Titles): Space Grotesk Bold/32px/tight letter spacing - for main view headers
  - H2 (Section Headers): Space Grotesk Semibold/24px/normal - for card titles and section divisions
  - H3 (Card Titles): Space Grotesk Medium/18px/normal - for individual item headers
  - Body (Content): Inter Regular/16px/relaxed line-height (1.6) - for descriptions and data
  - Labels: Inter Medium/14px/wide letter spacing - for form field labels and metadata
  - Data (Numbers): JetBrains Mono Medium/16px/tabular numbers - for times, distances, and hours

## Animations
Animations should enhance the sense of organization and efficiency through purposeful, snappy transitions that never delay user actions.

- **Data Entry Success**: Quick scale-up (1.0 → 1.02 → 1.0) with subtle green glow on save button (150ms) to confirm action
- **Card Additions**: New entries slide in from bottom with slight fade (250ms) to show content addition
- **Tab Transitions**: Smooth crossfade between views (200ms) maintaining spatial continuity
- **Metric Counters**: Number transitions animate with slight easing (300ms) when totals update
- **Hover States**: Subtle lift effect on cards (100ms) with slight shadow increase to indicate interactivity
- **Form Validation**: Shake animation (200ms) on invalid inputs with color shift to destructive state

## Component Selection
- **Components**: 
  - Tabs for main navigation (Dashboard, Time Tracking, Projects, Employees, Mileage, Expenses, Absences, Settings)
  - Dialog for add/edit forms with clear action buttons and validation
  - Card for displaying individual entries with approval status badges
  - Table for detailed entry lists with sortable columns
  - Select dropdowns for employee, project, phase, task selection with hierarchical display
  - Calendar (react-day-picker) for date selection and absence visualization
  - Input fields with clear labels, validation states, and audit info display
  - Badge for status indicators (Draft/Submitted/Approved/Rejected, Billable, Locked)
  - ScrollArea for long lists without breaking layout
  - Alert Dialog for approval/rejection confirmations with reason capture
  - Tooltip for displaying audit trail info on hover (created/updated by, device)
  - Accordion for expandable change log history
  
- **Customizations**: 
  - Custom approval status badge with color coding (gray/yellow/green/red)
  - Hierarchical project/phase/task selector with indentation
  - Rate display indicator showing applicable rate and source (employee/project/task)
  - Locked entry indicator preventing edit actions
  - Audit trail popover showing full change history
  - Correction entry form linking to original entry
  - Plan vs actual variance display with color-coded differences
  - Role-based component visibility (admin-only actions, manager approvals)
  - Timesheet period submission interface with batch operations
  
- **States**: 
  - Buttons: Primary (filled blue), secondary (outlined), disabled (grayed for locked entries), destructive (red for rejections)
  - Inputs: Default (border-input), focus (ring-accent), error (border-destructive), disabled (locked entries)
  - Cards: Draft (default), Submitted (yellow glow), Approved (green border), Rejected (red border), Locked (padlock icon)
  - Entries: Editable (default), Locked (grayed with lock icon), Correction (linked icon)
  
- **Icon Selection**: 
  - Clock for time entries
  - FolderOpen for projects
  - Users for employees and roles
  - Car for mileage
  - Receipt for expenses
  - CalendarBlank for absences and planning
  - Plus for add actions
  - PencilSimple for edit actions
  - Lock/LockOpen for locked/unlocked status
  - CheckCircle/XCircle for approval/rejection
  - ClockClockwise for correction entries
  - Eye for audit trail view
  - ChartBar for dashboard metrics and reports
  - ShieldCheck for admin-only features
  - UserCircleGear for role management
  - CurrencyDollar for rates and billable indicator
  - Play/Pause/Stop for timer controls
  - Lightning for quick actions and templates
  - ArrowsClockwise for plan vs actual comparison
  
- **Spacing**: 
  - Page padding: p-6 for desktop, p-4 for mobile
  - Card gaps: gap-4 for list views, gap-6 for approval workflows
  - Form field spacing: space-y-4 for vertical stacking, space-y-2 for grouped fields
  - Section margins: mb-8 between major sections, mb-4 for subsections
  - Internal card padding: p-6 for content, p-4 for compact entries
  - Audit info: text-xs with mt-2 spacing for metadata display
  
- **Mobile**: 
  - Tabs convert to bottom sheet navigation on mobile (<768px)
  - Cards stack vertically with full width
  - Hierarchical selectors use drawer instead of dropdown
  - Dialogs become drawer sheets from bottom on mobile
  - Table views switch to stacked card layout with key fields prominent
  - Approval actions move to bottom action bar
  - Audit trail accessible via dedicated button instead of hover
  - Two-column layouts become single column
  - Metric cards go from multi-column grid to single column stack
