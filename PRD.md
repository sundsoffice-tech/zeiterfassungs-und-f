# Planning Guide

A comprehensive time tracking application for managing employee work hours, project assignments, and mileage logs in one unified platform.

**Experience Qualities**: 
1. **Professional** - Clean, business-focused interface that conveys reliability and trustworthiness for workplace time management
2. **Efficient** - Quick data entry with minimal clicks, enabling fast logging of time entries and mileage without friction
3. **Organized** - Clear visual hierarchy and logical grouping of time entries, projects, and mileage records for easy review

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires multiple interconnected features including employee management, project tracking, time entries with filtering/reporting, and mileage logbook with calculations - warranting a multi-view architecture.

## Essential Features

### Employee Management
- **Functionality**: Create, view, edit, and manage employee profiles with names and unique identifiers
- **Purpose**: Maintain a centralized employee database for time tracking assignments
- **Trigger**: Click "Add Employee" button or edit existing employee card
- **Progression**: Click add button → Enter employee details in dialog → Save → Employee appears in list
- **Success criteria**: Employees persist between sessions, can be edited, and appear in time entry selection dropdowns

### Project Management
- **Functionality**: Create and manage projects with names, descriptions, and client information
- **Purpose**: Enable time tracking against specific projects for accurate billing and reporting
- **Trigger**: Click "Add Project" button or edit existing project card
- **Progression**: Click add button → Enter project details in dialog → Save → Project appears in list and time entry dropdowns
- **Success criteria**: Projects persist, can be assigned to multiple time entries, and show accumulated hours

### Time Entry Tracking
- **Functionality**: Log work sessions with employee, project, date, start/end time, and optional notes
- **Purpose**: Record billable and non-billable hours for payroll, invoicing, and productivity analysis
- **Trigger**: Click "Add Time Entry" button
- **Progression**: Click add → Select employee → Select project → Choose date → Enter start/end times → Add notes → Save → Entry appears in timeline
- **Success criteria**: Time entries calculate duration automatically, can be filtered by employee/project/date, and display total hours

### Mileage Logbook
- **Functionality**: Record vehicle trips with employee, date, start/end locations, distance, and purpose
- **Purpose**: Track business mileage for expense reimbursement and tax deduction compliance
- **Trigger**: Click "Add Mileage" button
- **Progression**: Click add → Select employee → Choose date → Enter start/end locations → Input distance → Specify trip purpose → Save → Entry appears in log
- **Success criteria**: Mileage entries persist, calculate totals by employee/date range, and display distance summary

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
- **Empty States**: Clear call-to-action messages when no employees, projects, time entries, or mileage logs exist
- **Invalid Time Ranges**: Prevent end times before start times with validation and helpful error messages
- **Missing Data**: Gracefully handle deleted employees/projects that have associated time entries by showing archived references
- **Duplicate Entries**: Allow multiple time entries for the same employee/project/day to accommodate split shifts
- **Negative Mileage**: Validate that distance values are positive numbers with appropriate error feedback
- **Date Selection**: Default to current date but allow historical entry backdating

## Design Direction
The design should evoke professionalism, trustworthiness, and efficiency - like a well-organized office workspace. It should feel modern and corporate without being sterile, with a balanced color palette that conveys both authority and approachability. The interface should prioritize clarity and speed of data entry.

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
  - Tabs for main navigation (Dashboard, Time Tracking, Projects, Employees, Mileage)
  - Dialog for add/edit forms with clear action buttons
  - Card for displaying individual entries with hover states
  - Table for detailed mileage and time entry lists
  - Select dropdowns for employee and project selection
  - Calendar (react-day-picker) for date selection
  - Input fields with clear labels and validation states
  - Badge for status indicators (active projects, entry types)
  - ScrollArea for long lists without breaking layout
  
- **Customizations**: 
  - Custom summary metric cards with large numbers and trend indicators
  - Dual time picker inputs (start/end) with validation relationship
  - Mileage entry card with calculated total display
  - Project card showing accumulated hours as progress indicator
  
- **States**: 
  - Buttons: Primary (filled blue), secondary (outlined), hover (slight lift + shadow), active (pressed inset)
  - Inputs: Default (border-input), focus (ring-accent), error (border-destructive), success (border-green)
  - Cards: Default (subtle border), hover (elevated shadow), selected (accent border)
  
- **Icon Selection**: 
  - Clock for time entries
  - FolderOpen for projects
  - Users for employees
  - Car for mileage
  - Plus for add actions
  - PencilSimple for edit actions
  - BarChart for dashboard metrics
  - Download for CSV exports
  - FileText for reports section
  
- **Spacing**: 
  - Page padding: p-6 for desktop, p-4 for mobile
  - Card gaps: gap-4 for list views
  - Form field spacing: space-y-4 for vertical stacking
  - Section margins: mb-8 between major sections
  - Internal card padding: p-6 for content breathing room
  
- **Mobile**: 
  - Tabs convert to bottom sheet navigation on mobile (<768px)
  - Cards stack vertically with full width
  - Dialogs become drawer sheets from bottom on mobile
  - Table views switch to stacked card layout
  - Two-column layouts (time picker pairs) become single column
  - Metric cards go from 3-column grid to single column stack
