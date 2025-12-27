# Planning Guide

A comprehensive, enterprise-grade time tracking application with intuitive UI/UX featuring a minimalist navigation (Heute/Today, Woche/Week, Projekte/Projects, Berichte/Reports, Forecast, Automation, Admin), weltklasse timer interface, keyboard shortcuts, command palette (Ctrl+K), powerful automation capabilities including recurring entries and intelligent reminders, AI-powered forecasting, and comprehensive admin dashboard for efficient time management that runs itself.

**Experience Qualities**: 
1. **Intuitiv** - World-class interface that feels natural and requires zero training with large timer, smart project selection, instant feedback, and automation that works in the background
2. **Schnell** - Lightning-fast interactions with keyboard shortcuts, command palette (Ctrl+K), one-click actions, and automated processes that never delay the user
3. **Automatisch** - Self-running system with recurring entries, intelligent reminders, auto-start timers, and automated tagging that minimizes manual data entry

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires sophisticated features including active timer management, automation engine with recurring entries and rules, AI-powered reminders and forecasting, weekly timesheet with copy/paste/drag-drop, global search with filter chips, command palette for keyboard-driven workflows, multi-tenant architecture, role-based access control, approval workflows, and comprehensive reporting - warranting a sophisticated multi-view architecture optimized for speed, automation, and usability.

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

### Admin Dashboard (Kontrolle ohne Micromanagement)
- **Functionality**: Comprehensive administrative control center featuring live status tracking, KPIs, warnings, approval management, user administration, integrations management, and DSGVO-compliant privacy & security controls. Includes seven tabs: Overview (live status + top warnings), Live-Status (all employees), KPIs (key metrics), Warnungen (all warnings by severity), Genehmigungen (pending approvals), Integrationen (third-party integrations), and Datenschutz & Sicherheit (GDPR-compliant privacy and security management).
- **Purpose**: Provide administrators and project managers with at-a-glance oversight without micromanagement, enabling proactive problem detection and efficient approval workflows while maintaining team autonomy. Centralize management of all external integrations for calendars, project management tools, communication platforms, accounting systems, SSO providers, webhooks, and mobile device management. Ensure DSGVO compliance through comprehensive privacy settings, audit logging, data retention policies, and GDPR subject rights management.
- **Live Status (Heute aktiv)**: Real-time view of who is working on what with active timers, showing employee names, current project/task, status (working/paused), and elapsed time. Updates dynamically as timers start, pause, or stop.
- **KPIs**: Five key performance indicators with targets and trend indicators:
  - **Auslastung (Utilization)**: Billable vs non-billable hours percentage (target: 75%)
  - **Abrechenbare Stunden (Billable Hours)**: Total billable hours this week
  - **Aktive Projekte (Active Projects)**: Projects with activity in last 7 days
  - **Budget-Einhaltung (Budget Compliance)**: Percentage of projects within budget (target: 100%)
  - **Marge (Profit Margin)**: Revenue minus cost percentage (target: 30%)
- **Warnungen (Warnings)**: Automated detection and categorization of issues with severity levels (critical/high/medium/low):
  - **Überlange Arbeitszeit**: Daily hours >12h (critical if >16h)
  - **Wochenendarbeit**: Entries on weekend without approval (low severity)
  - **Fehlende Notizen**: Billable entries without description (low severity)
  - **Verdächtige Rundung**: Perfectly rounded hours suggesting estimation (low severity)
  - **Budget-Risiko**: Projects >80% budget consumed (critical if >100%, high if >95%)
  - **Fehlende Tage**: Missing timesheet days for current week (high if >2 days, medium otherwise)
  - Warnings display employee name, project, date, severity badge, description, and "Bestätigen" button
- **Offene Genehmigungen (Pending Approvals)**: Unified view of all pending approvals for time entries and mileage with one-click approve/reject actions, showing employee, project, date, and duration/distance.
- **User Management Tab**: Employee creation, editing, deletion with role assignment (Admin/Projektleiter/Mitarbeiter/Extern), hourly rate setting, and role permissions overview showing capabilities for each role:
  - **Admin**: Full system access, manage users, approve all entries, create projects, view/edit rates, edit after approval
  - **Projektleiter**: Approve team entries, manage own projects, view team data, create reports, view rates (own projects only)
  - **Mitarbeiter**: Track own time, view own entries, submit timesheets, view projects, export own reports, no rate visibility
  - **Extern**: Track own time only, restricted visibility, no other employees visible, assigned projects only, no rate visibility
- **Integrationen Tab**: Comprehensive integration management for all third-party services required for a world-class app:
  - **Calendar Integrations**: Google Calendar, Outlook Calendar, iCal/CalDAV with sync direction control (one-way/two-way)
  - **Project Management**: Jira, Asana, Trello, Monday.com, ClickUp for syncing projects, tasks, and time tracking
  - **Communication**: Microsoft Teams, Slack for notifications and updates via webhooks
  - **Accounting**: DATEV export (CSV/XML), Lexware interface (CSV/API), sevDesk API integration for seamless accounting data transfer
  - **SSO (Single Sign-On)**: Microsoft Entra ID (Azure AD), Google Workspace, SAML 2.0, OpenID Connect for enterprise authentication
  - **Webhooks/API**: Custom webhook endpoints for Create/Update/Approve events with HMAC signature support
  - **Mobile Device Management**: MDM compatibility configuration for corporate device policies (Intune, Jamf, MobileIron, VMware Workspace ONE)
  - **Configuration Management**: Add, edit, delete, enable/disable integrations with full credential management (API keys, OAuth tokens, certificates)
  - **Status Tracking**: Real-time status indicators (Active, Error, Configured, Deactivated), last sync timestamps, error messages
  - **Credential Help**: Inline links showing where to obtain API keys, client IDs, secrets, and other required credentials for each integration
  - **Validation**: Required field validation, connection testing, and error feedback for misconfigured integrations
  - **Badge Indicators**: "Pflicht für beste App" badges on required integrations (all calendar, PM, accounting, SSO integrations)
  - **Minimalist Presentation**: Category-based tabs (Kalender, PM-Tools, Kommunikation, Accounting, SSO, Webhooks/API, MDM) for easy navigation
  - **Security**: Encrypted storage of all credentials, secure handling of OAuth tokens and secrets
- **Privacy & Security Tab (Datenschutz & Sicherheit)**: Comprehensive DSGVO-compliant privacy and security management with five sub-tabs:
  - **Overview (Übersicht)**: Four summary cards showing:
    - **Datenminimierung**: Toggle switches for no app tracking (standard), no analytics, collect only required fields
    - **Hosting & Verarbeitung**: EU region selection (eu-central, eu-west, eu-north), EU-only processing toggle, AVV signed badge
    - **DSGVO-Compliance**: Checklist showing rights to access, erasure, portability, rectification, subprocessor list maintained
    - **Subprozessoren**: Scrollable list of data processors with EU badges (e.g., AWS Europe Frankfurt, GitHub Spark)
  - **Encryption (Verschlüsselung)**: Configure encryption levels for data protection:
    - **In Transit (TLS)**: Always active HTTPS/TLS 1.3 with badge indicator
    - **At Rest**: Toggle for AES-256-GCM encryption of stored data
    - **End-to-End Notes**: Optional client-side encryption for sensitive notes
    - **End-to-End Attachments**: Optional client-side encryption for receipts and documents
    - **Algorithm Info**: Alert box listing encryption methods (TLS 1.3 PFS, AES-256-GCM, RSA-4096+AES-256, HSM key management)
  - **Retention (Aufbewahrung)**: Data retention policy management with automated deletion:
    - **Policy Creation**: Dialog to create new retention policies with name, data type (time entries, mileage, expenses, audit logs, deleted data, attachments, all), retention period (6 months, 1 year, 3 years, 5 years, 10 years), auto-delete toggle, archive before delete, notify before delete
    - **Policy Cards**: Each policy displays name, description, data type, retention period, auto-delete status, last executed timestamp
    - **Execute Now**: Manual execution button for immediate policy application
    - **Enable/Disable**: Toggle policy active status without deletion
    - **Automated Execution**: Background process checks and applies retention policies automatically
  - **Audit Logs (Audit-Protokolle)**: Comprehensive activity logging for compliance and security:
    - **Event Tracking**: All user actions logged with type (login, logout, data access, data export, data delete, settings change, approval action, rate change, project change, employee change, integration change, retention policy change, data anonymization, GDPR request)
    - **Log Details**: Each log shows severity badge (low/medium/high/critical), event type, action description, timestamp (dd.MM.yyyy HH:mm:ss), user name/ID, role, IP address (optional), success/failure icon
    - **Filtering**: Dropdown to filter by event type (all, user logins, data access, data exports, data deletions, settings changes, approvals, GDPR requests)
    - **Expandable Details**: Click "Details anzeigen" to see full JSON metadata including before/after state, reason, device
    - **Scroll View**: 600px scrollable area displaying up to 1000 most recent events
    - **Count Display**: Header shows total logged events count
  - **GDPR Rights (DSGVO-Betroffenenrechte)**: Manage subject access requests and data portability:
    - **Request Creation**: Dialog to create new GDPR requests with employee selection, request type (access/Art. 15, erasure/Art. 17, portability/Art. 20, rectification/Art. 16, restriction/Art. 18)
    - **Request Cards**: Each request shows employee name, request type label, status badge (pending/processing/completed/rejected), request date, completion date (if applicable)
    - **Processing Actions**: Pending requests show "Export data & complete" button (for access/portability) or generic "Complete" button, plus "Reject" button
    - **Data Export**: One-click JSON export of all personal data (employee profile, time entries, mileage entries) with timestamped filename
    - **Re-export**: Completed access/portability requests allow re-downloading data
    - **Audit Trail**: All GDPR request actions automatically logged in audit logs with critical severity
    - **Status Tracking**: Visual workflow from pending → processing → completed/rejected with timestamp tracking
- **Privacy by Design Principles**:
  - **Datenminimierung**: No app tracking, no analytics, no unnecessary data collection by default
  - **Verschlüsselung**: TLS 1.3 in transit (always), AES-256-GCM at rest (toggle), optional E2E for notes/attachments
  - **Aufbewahrung**: Configurable retention periods per data type with automated deletion after expiry
  - **Rechte/Protokolle**: Full audit logging of all admin actions, GDPR subject rights management (access, erasure, portability, rectification, restriction)
  - **Hosting**: EU-only regions (Frankfurt, Ireland, Stockholm), AVV/DPA signed, subprocessor list maintained
  - **Transparency**: Clear privacy badges, explicit consent toggles, detailed audit trails, accessible GDPR request workflow
- **Summary Cards**: Four metric cards at top showing: Heute aktiv (active workers), Offene Genehmigungen (pending approvals), Warnungen (total warnings with critical/high count), Mitarbeiter (active users)
- **Alert Banner**: Prominent orange alert at top when critical or high-severity warnings exist, showing counts and requiring attention
- **Trigger**: Navigate to Admin tab, select Dashboard/Users/Integrationen/Datenschutz & Sicherheit sub-tabs, system automatically calculates metrics and warnings on load
- **Progression**: Open Admin → View Dashboard overview with live statuses and top warnings → Explore KPIs tab for metrics → Check Warnungen tab for all issues → Review Genehmigungen tab for approvals → Switch to Users tab for employee management → Navigate to Integrationen tab → Browse categories (Kalender, PM-Tools, etc.) → Click "Hinzufügen" on integration card → Enter credentials with help links → Save and enable integration → View status and last sync info → Toggle enabled/disabled → Edit or delete as needed → Navigate to Datenschutz & Sicherheit tab → Review Overview for privacy settings and compliance status → Configure Encryption levels → Create/manage Retention policies → Review Audit logs with filtering → Process GDPR requests (create, export data, complete/reject) → Return to Dashboard for ongoing monitoring
- **Success criteria**: Live status updates in real-time as timers change, KPIs calculate correctly from time entry data, warnings detect all configured rule violations with correct severity levels, approval list shows only submitted entries, user management CRUD operations work, role permissions accurately reflect access levels, dashboard loads in <2 seconds with 100+ entries, integrations can be configured and enabled/disabled, credentials are stored securely, status tracking shows accurate connection state, help links direct to correct credential sources, validation prevents saving incomplete configurations, all required integrations are identified with badges, privacy settings persist and apply correctly, encryption toggles work as expected, retention policies execute and delete data after configured periods, audit logs capture all relevant events with full metadata, GDPR requests can be created/processed with data export functionality, all privacy & security features are DSGVO-compliant

### AI-Assisted Time Logic (Validation & Suggestions)
- **Functionality**: Comprehensive validation system with hard rules (blocking errors) and soft rules (warnings), plus AI-powered suggestions based on historical patterns, advanced AI-powered anomaly detection that identifies unusual behavior patterns, and smart auto-categorization that suggests projects/tasks based on multiple context signals
- **Purpose**: Ensure data quality, prevent common errors, detect anomalies, provide intelligent assistance, identify unusual patterns that deviate from personal habits, and reduce manual categorization effort by intelligently suggesting projects/tasks based on rich context signals while maintaining full transparency and user control
- **Hard Rules (Blocking)**:
  - Overlapping time entries for same employee
  - Negative duration (end time before start time)
  - Restricted hours (e.g., 03:00-05:00) requiring approval
  - Project closed/inactive
  - Absence conflicts (vacation, sick, holiday, blocked dates)
  - Project ended (booking after project end date)
- **Soft Rules (Warnings)**:
  - Daily hours exceeding limit (default 12h)
  - Missing notes for billable entries or entries without tasks
  - Unusual rounding patterns (always exact hours like 8:00, 4:00)
  - Weekend work without approval
  - Holiday work
  - Long shifts without documented pauses (>10h)
  - No pauses detected in 8+ hour days (less than 30 min gap)
- **AI Suggestions**: Contextual recommendations based on employee's recent entries, project patterns, and typical workflows (project suggestions, task recommendations, duration estimates, note templates)
- **Anomaly Detection (Pattern-Based)**: 
  - **Time of Day Anomalies**: Detects when a project is booked at an unusual time (e.g., "Projekt A wird sonst morgens gebucht, heute nachts")
  - **Duration Anomalies**: Identifies when a task takes significantly longer or shorter than typical (e.g., "Task X dauert im Schnitt 45 min, heute 4h")
  - **Micro-Entries**: Flags excessive small entries suggesting inefficient usage (e.g., "Viele Mikro-Einträge → Hinweis auf falsche Nutzung")
  - **Frequency Anomalies**: Detects unusual number of entries per day
  - **Project Switching**: Identifies excessive context switching between projects
  - **Team Deviation**: Compares individual behavior to team average
  - **AI-Enhanced Detection**: GPT-4 powered analysis for complex pattern recognition
  - Comparison baselines: Personal historical behavior (30 days), team average, project-specific patterns
  - Confidence scoring (0-100%) and severity levels (Info, Warning, Critical)
  - Evidence-based explanations with clear metrics (typical vs current values)
- **Smart Auto-Categorization (Context-Based Suggestions)**:
  - **Title/Notes Analysis**: Parses text for project keywords and client names (e.g., "Besprechung Produktdesign" → Design project)
  - **Calendar Event Integration**: Analyzes meeting titles, times, locations, and attendees to suggest projects (e.g., "Du warst 10:00–11:30 im Termin 'Kurita Showroom' → als Projekt Kurita buchen?")
  - **Location-Based Suggestions** (optional, privacy-sensitive): Uses GPS/manual location to suggest projects based on historical patterns (e.g., "Kurita Showroom" → Kurita project)
  - **App/Website Tracking** (optional, privacy-sensitive): Analyzes used applications and websites to suggest task types (e.g., "Figma" → Design tasks, "GitHub" → Development tasks)
  - **Time Pattern Recognition**: Considers time of day and day of week patterns (e.g., employee typically works on Project A in mornings)
  - **Multi-Signal Analysis**: Combines multiple context signals for high-confidence suggestions with explicit reasoning
  - **Privacy Controls**: Location, app, and website tracking are opt-in with clear privacy badges and user consent toggles
  - **Confidence Scoring**: Each suggestion includes confidence percentage (0-100%) and signal sources used (history, calendar, location, apps, title, time-pattern)
  - **One-Click Apply**: Users can apply suggestions with single click or dismiss them
- **Trigger**: Real-time validation on entry creation/edit, AI suggestions on demand via button click, anomaly detection via dedicated analysis tabs, smart categorization accessible from Today screen with context signal input, repair mode accessible from dedicated Reparatur tab
- **Progression**: Enter time data → System validates in real-time → Shows hard errors (blocks save) or soft warnings (can proceed) → User requests AI suggestions → AI analyzes patterns → Provides 2-4 actionable recommendations → User applies or dismisses → Navigate to Anomaly tabs → Click analyze → System compares to patterns → Shows detected anomalies with evidence → User reviews and takes action if needed → User opens Smart Categorization → Enters context signals (title, calendar event, location, apps) → Enables desired privacy-sensitive signals → Clicks generate → AI analyzes multi-signal context → Shows project/task suggestions with confidence and reasoning → User applies or modifies suggestions → Navigate to Repair Mode → View inbox of issues → Select issue → Choose suggested fix → Apply in one click → Issue resolved
- **Success criteria**: All validation rules function correctly, clear distinction between blocking errors and warnings, AI suggestions are contextually relevant, anomaly detection identifies meaningful patterns with high confidence (>60%), smart categorization provides accurate suggestions based on context signals with clear reasoning, privacy controls are evident and functional, full transparency (error codes, field names, metadata, evidence, signal sources displayed), user maintains full control, baseline metrics clearly shown (typical vs current), repair mode detects gaps/overlaps and provides actionable fixes

### AI Repair Mode ("Fehler in 30 Sekunden fixen")
- **Functionality**: Intelligent inbox system that automatically detects time entry issues (gaps, overlaps, missing data, validation errors) and provides one-click repair actions with preview and confidence scoring. Includes daily/weekly inbox filters, batch correction capabilities, and smart action suggestions.
- **Purpose**: Dramatically reduce time spent fixing data quality issues by providing instant, AI-powered repair suggestions that can be applied in seconds, making data cleanup effortless and error-free.
- **Issue Detection**:
  - **Time Gaps**: Detects gaps between entries (15 min to 3h) and suggests filling, extending previous, or advancing next entry
  - **Overlaps**: Identifies overlapping time entries and offers splitting, trimming, or deletion options
  - **Missing Data**: Flags entries without notes/tasks that should have them based on billability or project requirements
  - **Validation Errors**: Surfaces hard and soft validation rule violations from the validation engine
  - **Anomalies**: Integrates with anomaly detection to surface pattern-based issues
- **Repair Actions**:
  - **Fill Gap**: Create new time entry for gap period with project/task selection
  - **Extend Entry**: Lengthen previous or next entry to cover gap
  - **Split Entry**: Divide overlapping entry into two parts at overlap boundary
  - **Trim Entry**: Shorten entry to remove overlap (adjust start or end time)
  - **Delete Entry**: Remove duplicate or erroneous entry entirely
  - **Update Field**: Modify specific fields (notes, task, billable status)
  - **Batch Update**: Apply same correction to multiple entries at once
- **Inbox System**:
  - **Daily Inbox**: Today's issues requiring attention with priority sorting (Critical → Warning → Info)
  - **Weekly Inbox**: All issues from current week for batch review
  - **Filter Options**: All/Today/Week/Daily/Weekly views with real-time issue count badges
  - **Status Tracking**: Pending → In Review → Resolved → Dismissed with timestamps
  - **Auto-Resolution**: Issues automatically marked resolved when underlying data changes
- **User Experience**:
  - **Quick-Fix Badge**: Issues with auto-applicable actions (confidence >70%) get special "Quick-Fix" badge
  - **Action Preview**: Shows before/after state for all repair actions before applying
  - **Confidence Scoring**: Each action displays confidence percentage based on historical patterns
  - **One-Click Apply**: Primary actions can be applied instantly without additional dialogs
  - **Dismiss Option**: Users can mark issues as irrelevant with optional reason
  - **Statistics Dashboard**: Shows total issues, breakdown by severity, and quick-fixable count
  - **Auto-Analysis**: Continuously monitors time entries and updates issue list in background
- **Trigger**: Navigate to "Reparatur" tab, automatic background analysis on data changes, manual "Neu analysieren" button
- **Progression**: System detects issues → Categorizes by type and severity → Generates repair suggestions → Displays in prioritized inbox → User selects issue → Reviews suggested actions with confidence scores → Chooses action → Previews changes → Applies with one click → Issue marked resolved → Updated time entries saved → Toast confirmation
- **Success criteria**: Issues detected accurately across all employees and dates, repair actions work correctly without data corruption, confidence scores correlate with success rate, quick-fix actions complete in <5 seconds, batch operations handle 20+ entries efficiently, auto-resolution prevents stale issues, dismissed issues don't reappear, audit trail maintained for all repairs

### Forecast & Planning ("Datenbasierte Vorhersage & Kapazitätsplanung")
- **Functionality**: Comprehensive forecasting system that predicts time effort per task/project based on historical patterns, calculates budget risk scores (0-100%) with severity levels (low/medium/high/critical), generates smart staffing recommendations with specific actions, and provides AI-enhanced insights for critical projects.
- **Purpose**: Enable proactive project management by predicting overruns, identifying resource gaps, and recommending staffing adjustments before projects go off track. Supports data-driven decisions like "2 Leute morgen statt 1, sonst Verzug" to prevent delays.
- **Time Estimation**:
  - **Historical Analysis**: Analyzes past time entries for projects/tasks to calculate average duration, standard deviation, and confidence scores
  - **Confidence Scoring**: 0-100% confidence based on number of historical data points (10+ entries = 100%)
  - **Per-Task Estimates**: Individual estimates for each task based on task-specific history
  - **Per-Project Estimates**: Aggregate estimates when no task-level data exists
  - **Explanation**: Clear reasoning showing "Basierend auf X historischen Einträgen, Durchschnitt: Yh (±Zh)"
- **Budget Risk Assessment**:
  - **Risk Score**: 0-100% calculated from multiple factors (budget usage, burn rate, timeline pressure, completion rate)
  - **Severity Levels**: Low (<30%), Medium (30-50%), High (50-70%), Critical (70%+)
  - **Risk Factors**: Itemized breakdown showing each contributing factor (e.g., "Budget fast erschöpft +30%", "Hohe Burn-Rate +20%")
  - **Metrics**: Budget hours, spent hours, estimated remaining, projected total, completion %, days remaining, burn rate (h/day)
  - **Hard Rules**:
    - Budget >90% consumed → +30% risk
    - Projected hours >110% budget → +35% risk
    - <7 days remaining with high daily hours needed → +25% risk
    - High burn rate with projected overage → +20% risk
    - <50% complete with <14 days left → +15% risk
    - No activity with imminent deadline → +10% risk
  - **Visual Indicators**: Color-coded cards (green/yellow/orange/red), progress bars, metric grids
- **Staffing Recommendations**:
  - **Analysis**: Compares required capacity (remaining hours / days available) vs current capacity (staff × 6h/day × days)
  - **Actions**: reduce, maintain, increase_moderate, increase_urgent
  - **Priority Levels**: Low, Medium, High, Critical based on timeline urgency
  - **Current vs Recommended**: Visual comparison showing staff changes needed
  - **Specific Actions**: Bullet-pointed list of concrete steps (e.g., "2 Personen SOFORT hinzufügen", "Überstunden einplanen")
  - **Logic**:
    - Capacity <80% of needs → Increase staff (urgent if <7 days, moderate if >7 days)
    - Capacity >200% of needs → Reduce staff (free up for other projects)
    - Capacity adequate → Maintain current staffing
  - **Examples**: "Empfehlung: 3 Personen morgen statt 1, sonst Verzug" for critical projects
- **AI Enhancement**:
  - **GPT-4 Analysis**: Optional AI-powered analysis of top 3 critical/high-risk projects
  - **Insights**: Short risk assessment (1 sentence), 2-3 immediate actions, realistic prognosis
  - **JSON Mode**: Structured response with insights array for each project
  - **Graceful Degradation**: Falls back to rule-based analysis if AI unavailable
  - **Transparency**: AI insights clearly marked with 🤖 prefix
- **User Interface**:
  - **Three Tabs**: Personalempfehlungen (staffing), Budget-Risiken (risk), Zeitschätzungen (estimates)
  - **Alert Banner**: Highlights critical risks and urgent recommendations requiring immediate attention
  - **Generate Options**: Basic forecast (rule-based, instant) or AI-enhanced forecast (includes GPT analysis)
  - **Auto-Refresh**: Automatically generates basic forecast on load if projects exist
  - **Timestamp**: Shows when forecast was generated and whether AI-enhanced
  - **Color Coding**: Consistent severity-based colors (red=critical, orange=high, yellow=medium, green=low)
- **Trigger**: Navigate to "Forecast" tab, click "Prognose erstellen" or "KI-Prognose erstellen", or auto-generated on first load
- **Progression**: User opens Forecast tab → System auto-generates basic forecast → Displays recommendations/risks/estimates in tabs → User optionally clicks "KI-Prognose" → AI analyzes top risks → Enhanced insights displayed → User reviews staffing needs → Takes action on urgent recommendations → Refreshes forecast to see updated predictions
- **Success criteria**: Time estimates within 20% accuracy when confidence >60%, risk scores correlate with actual overruns, staffing recommendations are actionable and specific, AI insights add value beyond rule-based analysis, UI clearly communicates urgency levels, critical projects highlighted prominently, forecasts complete in <3 seconds (basic) or <10 seconds (AI-enhanced)

### Automation ("Damit es von alleine läuft")
- **Functionality**: Comprehensive automation system with three pillars: recurring entries, intelligent rules, and smart reminders. Automatically creates time entries, starts timers based on context, adds tags based on behavior, and sends proactive reminders to maintain compliance and data quality. Background processes run continuously without user intervention.
- **Purpose**: Minimize manual data entry, reduce forgotten time tracking, ensure compliance with labor laws (break reminders), maintain data quality (missing time alerts), and automate routine tasks so the system "runs itself" requiring minimal user attention.
- **Recurring Entries (Wiederkehrende Einträge)**:
  - **Functionality**: Automatically create time entries for regular activities (e.g., Daily Standup, Weekly Team Meeting)
  - **Schedule Options**: Daily, Weekly (with day selection Mo-Fr), Monthly (with day of month)
  - **Configuration**: Name, project/phase/task, start time, duration, notes, billable status, tags, location
  - **Creation Logic**: System checks every minute if recurring entry should be created today, prevents duplicates on same day
  - **Last Created Tracking**: Records when entry was last automatically created to prevent duplication
  - **Management UI**: Three-tab interface (Wiederkehrend, Regeln, Erinnerungen) with add/edit/delete/toggle active
  - **Display**: Shows name, project, frequency, time, duration, last created date, active/inactive badge
  - **Examples**: "Daily Standup" every weekday at 09:00 for 15 min, "Weekly Planning" every Monday at 10:00 for 60 min
- **Automation Rules (Intelligente Regeln)**:
  - **Auto-Start Timer**: Automatically start timer when app opens, with optional conditions (time of day 08:00-18:00, weekdays only)
  - **Auto-Tagging**: Automatically add tags based on context (e.g., "Fahrt" tag when GPS movement >X km detected)
  - **Conditions**: App opened, time of day range, day of week, location change (distance threshold)
  - **Actions**: Start timer (with project/phase/task), add tag, set location
  - **Priority System**: Rules have priority order (1=highest) for conflict resolution
  - **Configuration**: Name, type (auto_start_timer | auto_tag | auto_categorize), active status, conditions, actions, priority
  - **Management UI**: Toggle switches for built-in rules, custom rule creation dialog
  - **Examples**: "Start work timer weekday mornings", "Tag travel when moving >5km", "Categorize based on calendar events"
- **Reminders (Erinnerungen)**:
  - **Missing Time (Tagesende)**: Alert at end of day (default 17:00) if no time entries recorded yet
  - **Break Warning (Arbeitsrecht)**: Alert after X hours worked (default 6h) reminding of legally required breaks per German labor law
  - **Weekly Submission (Wocheneinreichung)**: Alert on Friday at 16:00 to submit weekly timesheet for approval
  - **Customization**: Each reminder can be enabled/disabled, time adjusted, threshold modified
  - **Delivery**: Toast notifications with title, message, dismiss action, 10-second duration
  - **Dismissal Tracking**: User can mark reminder as understood, preventing repeated notifications for same day/event
  - **Background Checking**: System checks every minute if reminder conditions met, tracks last check time to prevent spam
  - **Context Awareness**: Reminders consider current state (hours worked today, entries exist, timesheet submitted)
  - **Examples**: "Zeiten fehlen - Du hast heute noch keine Zeiten erfasst", "Pause erforderlich - Nach 6h Arbeit ist 30min Pause nötig", "Wocheneinreichung - Bitte reiche Zeiten bis Freitag 16:00 ein"
- **App Settings Integration**:
  - **Global Toggles**: Enable/disable auto-start timer, auto-tagging, each reminder type
  - **Thresholds**: Distance for travel tagging (default 5km), hours for break warning (default 6h)
  - **Times**: Missing time reminder time (default 17:00), weekly submission day/time (default Fri 16:00)
  - **Persistence**: All settings stored in spark.kv with useKV hook for automatic persistence
  - **Defaults**: System provides sensible defaults on first use, customizable thereafter
- **Background Processing**:
  - **Interval Checks**: useEffect with 60-second interval for recurring entries and reminders
  - **On Mount**: Auto-start timer check runs once when app loads (if enabled)
  - **State Management**: useKV ensures automation state (recurring entries, rules, reminders, settings) persists across sessions
  - **Toast Feedback**: Success messages when recurring entry created, timer auto-started, or actions taken
- **User Interface**:
  - **Tab Navigation**: Automation tab in main navigation with Lightning icon
  - **Three Sub-Tabs**: Wiederkehrend (recurring entries), Regeln (rules), Erinnerungen (reminders)
  - **Card-Based Layout**: Each automation item displayed in card with toggle switch, metadata, action buttons
  - **Dialogs**: Add/edit forms for recurring entries with all configuration options
  - **Inline Settings**: Reminder times/thresholds editable directly in cards without opening dialogs
  - **Status Badges**: Active/Inactive visual indicators for each automation item
- **Trigger**: Background processes run automatically every minute, user can configure via Automation tab
- **Progression**: System loads → Initializes automation hook → Checks recurring entries (creates if needed) → Checks reminders (sends if triggered) → Checks auto-start rules (starts timer if matched) → User configures automation settings → Adds recurring entries → Enables/disables rules → Customizes reminders → System continues background processing → User receives automated entries and alerts → Minimal manual intervention required
- **Success criteria**: Recurring entries created at correct times without duplicates, auto-start timer works on app open (when enabled), reminders trigger at specified times with correct context, dismissals prevent repeated notifications, settings persist across sessions, background processing runs efficiently without performance impact, toast notifications clear and actionable, automation UI intuitive with inline editing, all automation can be disabled per user preference

### Offline Sync & Mobile Capabilities (Without Compromise)
- **Functionality**: Complete offline-first time tracking with automatic synchronization, conflict resolution, GPS tracking (DSGVO-compliant), attachments (photos, receipts, documents), and battery-optimized background timers
- **Purpose**: Enable seamless time tracking anywhere without internet connectivity, automatically sync when connection restored, prevent data loss, support field workers, and provide rich context through attachments and location data
- **Core Features**:
  - **Offline Queue Management**: All time entries, mileage, and changes queued locally when offline. Automatic batch synchronization when online. Priority-based queue (critical entries sync first). Retry mechanism with configurable max attempts. Real-time queue status with pending/synced/error counts.
  - **Conflict Resolution System**: Four resolution strategies: Newest Wins (default, uses latest timestamp), Local Wins (always keep device changes), Server Wins (always accept server version), Manual (user reviews and resolves). Automatic detection of conflicted fields. Visual conflict comparison UI showing local vs server versions. Configurable per-user preference with inline explanation of each strategy.
  - **GPS Location Tracking (Optional, DSGVO-compliant)**: Permission-based opt-in GPS tracking. Captures latitude, longitude, accuracy, timestamp on-demand or continuous. Reverse geocoding for human-readable addresses. Location data stored locally, transmitted only with explicit user consent. Clear privacy notices explaining data usage. Automatic location attachment to time entries when tracking enabled. Useful for field workers, construction, travel documentation.
  - **Attachments & Receipts**: Support for photos (JPG, PNG, HEIC), PDFs, documents (DOCX, TXT), audio notes. Automatic thumbnail generation for images. Client-side compression to optimize storage and upload. Base64 encoding for offline storage with upload queue. Upload status tracking (pending/uploading/uploaded/error). 10MB max file size per attachment. Encrypted local storage of attachment data. Multiple attachments per time entry.
  - **Background Timer Optimization**: Battery-efficient timer implementation using minimal resources. Wake Lock API to prevent screen timeout during active timer. Automatic timer state persistence and restoration after app restart. Heartbeat system (30-second intervals) to verify timer integrity. Timer continues running when app in background or browser tab inactive. Elapsed time calculated from stored start timestamp (not incremental) to prevent drift. Pause/resume capability with duration tracking. Device ID tracking for multi-device scenarios.
  - **Device Management**: Unique device ID generation and storage (UUID v4). Device identifier included in all offline metadata. Enables multi-device conflict detection and resolution. Device-specific sync queue management. Last sync timestamp per device.
  - **Network State Detection**: Real-time online/offline status monitoring. Automatic sync trigger on network restoration (configurable). Visual indicators for connection status throughout UI. Offline mode banner when no connectivity. Graceful degradation of features requiring connectivity.
  - **Sync Configuration**: Auto-sync enable/disable toggle. Configurable sync interval (default 30 seconds). Sync on network restore toggle. Max retry attempts (default 3). Batch size for sync operations (default 10 items). All settings persisted in localStorage.
- **User Interface**:
  - **Offline/Sync Tab**: Dedicated navigation tab with CloudArrowUp icon
  - **Connection Status Card**: Online/offline badge, device ID display, last sync timestamp, sync queue progress bar with pending count
  - **GPS Tracking Card**: Toggle for location tracking, current coordinates display, accuracy indicator, DSGVO privacy notice
  - **Sync Settings Card**: Auto-sync toggle, network restore toggle, conflict resolution strategy selector with detailed explanations, visual radio button selection
  - **Background Timer Card**: Status indicators for wake lock, auto-restoration, heartbeat system, offline storage
  - **Attachments Card**: Supported file formats display, privacy and encryption notices, upload queue status
  - **Manual Sync Button**: Large prominent "Jetzt synchronisieren" button, shows spinner during sync, displays result toast with counts
- **Technical Implementation**:
  - **OfflineSyncManager Class**: Singleton instance managing global sync state. Queue stored in localStorage with JSON serialization. Event listeners for online/offline events. Auto-sync interval timer with cleanup. Batch processing of queue items with priority sorting.
  - **BackgroundTimerManager Class**: Separate singleton for timer management. Timer state in localStorage for persistence across sessions. setInterval for 1-second tick updates. Separate heartbeat interval for health checks. Wake Lock API integration with fallback. Elapsed seconds calculated from start time difference.
  - **React Hooks**: useOfflineSync() for connection status, queue management, sync operations. useGPS() for location tracking, permission management, continuous updates. useAttachments() for file processing, upload queue, thumbnail generation. useBackgroundTimer() for timer control, state monitoring, elapsed time display.
  - **Metadata Structure**: OfflineMetadata includes offlineId, syncStatus, lastSyncAttempt, syncError, conflictData, deviceId, timestamps. ConflictData includes localVersion, serverVersion, conflictedFields array, detectedAt timestamp.
  - **Data Types**: SyncStatus enum (synced/pending/conflict/error). ConflictResolution enum (local_wins/server_wins/newest_wins/manual). AttachmentType enum (photo/receipt/document/audio). GPSLocation interface with lat/lng/accuracy/timestamp/address. Attachment interface with id/type/name/size/url/base64/uploadStatus/thumbnail.
- **Privacy & Security**:
  - **GPS Data**: No automatic location transmission. Explicit user consent required for each location capture. Clear explanation of data usage and storage. Option to disable location tracking completely. DSGVO Article 6 compliance (explicit consent).
  - **Attachments**: Local encryption of file data before storage. Secure base64 encoding. No automatic uploads without user action. Thumbnail generation client-side only. Option to delete attachments before sync.
  - **Device Tracking**: Device ID does not contain personal information (random UUID). Used solely for conflict resolution, not user identification. Can be regenerated if needed.
- **Trigger**: User navigates to Offline/Sync tab, goes offline/online, starts timer in offline mode, adds attachments, enables GPS tracking
- **Progression**: User opens app → Background timer restored if exists → Offline state detected → All changes queued locally → User continues working without interruption → Connection restored → Auto-sync triggered (if enabled) → Queue processed in batches → Conflicts detected and resolved per strategy → Success/error toasts shown → User can manually sync anytime → GPS tracking enabled when needed → Location captured → Attachments added to entries → All queued for upload → Synced when online → Complete data integrity maintained
- **Success criteria**: All offline changes successfully queued and synced when online, zero data loss regardless of connectivity, conflicts resolved automatically per user preference, GPS tracking accurate within specified tolerance, attachments uploaded with progress tracking, background timer runs continuously without draining battery excessively, wake lock prevents timer interruption, timer state restored after app restart, sync queue visible with real-time status, manual sync completes within seconds, network state changes detected immediately, DSGVO compliance for location data, all privacy notices clear and accessible, offline mode fully functional without degradation, multi-device scenarios handled correctly

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
  - TrendUp for forecast and planning
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
  - Warning for risk indicators
  - Target for time estimates
  - SparkleIcon for AI-enhanced features
  
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
