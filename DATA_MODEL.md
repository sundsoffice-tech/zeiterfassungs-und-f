# Data Model Architecture

## Overview

This document describes the enterprise-grade data model for the Zeiterfassung time tracking system. The architecture supports multi-tenancy, role-based access control, hierarchical project structures, dynamic rate management, approval workflows, and comprehensive audit trails.

## Core Principles

1. **Multi-Tenancy**: Complete data isolation between tenants (companies)
2. **Audit Trail**: Every entity tracks who created/updated it, when, from what device
3. **Immutability**: Approved entries cannot be edited, only corrected via new entries
4. **Hierarchy**: Flexible structure from Tenant → Client → Project → Phase → Task
5. **Versioning**: Full change log with before/after snapshots
6. **Compliance**: Ready for accounting audits and regulatory requirements

## Entity Hierarchy

```
Tenant (Company)
├── Client (Customer/Account)
│   └── Project
│       ├── Phase (Optional)
│       └── Task (Optional)
│           └── TimeEntry
├── Employee (with Role)
├── Rate (Employee/Project/Task specific)
├── Absence (Vacation, Sick, Holiday)
├── Expense & Mileage
└── TimesheetPeriod (Approval workflow)
```

## Core Entities

### Tenant
The top-level organizational unit representing a company.

```typescript
interface Tenant {
  id: string
  name: string
  companyName: string
  settings?: {
    defaultCurrency?: string
    timeFormat?: '12h' | '24h'
    weekStart?: 'monday' | 'sunday'
    approvalRequired?: boolean
    multiTimerAllowed?: boolean
  }
  audit: AuditMetadata
}
```

### Client
Represents customers or accounts that have projects.

```typescript
interface Client {
  id: string
  tenantId: string
  name: string
  description?: string
  contactPerson?: string
  email?: string
  phone?: string
  active: boolean
  audit: AuditMetadata
}
```

### Project
Work containers with phases and tasks.

```typescript
interface Project {
  id: string
  tenantId: string
  clientId?: string
  name: string
  description?: string
  code?: string
  startDate?: string
  endDate?: string
  budget?: number
  active: boolean
  audit: AuditMetadata
}
```

### Phase
Optional project subdivision (e.g., "Planning", "Development", "Testing").

```typescript
interface Phase {
  id: string
  projectId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  budget?: number
  order: number
  active: boolean
  audit: AuditMetadata
}
```

### Task
Specific work items within projects or phases.

```typescript
interface Task {
  id: string
  projectId: string
  phaseId?: string
  name: string
  description?: string
  estimatedHours?: number
  active: boolean
  audit: AuditMetadata
}
```

### Employee
Users who track time, with role-based permissions.

```typescript
enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee',
  EXTERNAL = 'external'
}

interface Employee {
  id: string
  tenantId: string
  name: string
  email?: string
  role: UserRole
  hourlyRate?: number
  active: boolean
  audit: AuditMetadata
}
```

**Role Permissions:**
- **Admin**: Full system access, manage all entities, approve any entries
- **Project Manager**: Approve timesheets, manage assigned projects, view team data
- **Employee**: Track own time, view own data, submit for approval
- **External**: Track own time only, limited visibility

### Rate
Dynamic hourly rate definitions with scope and date range.

```typescript
interface Rate {
  id: string
  tenantId: string
  employeeId?: string
  projectId?: string
  taskId?: string
  hourlyRate: number
  validFrom: string
  validTo?: string
  description?: string
  audit: AuditMetadata
}
```

**Rate Hierarchy (most specific wins):**
1. Task Rate (if taskId specified)
2. Project Rate (if projectId specified, no taskId)
3. Employee Rate (if employeeId specified, no project/task)
4. No Rate (warning shown)

**Example:**
- Employee "John" has base rate €50/hr
- Project "Website" has rate €75/hr
- Task "Emergency Fix" has rate €100/hr
- → Time logged on "Emergency Fix" uses €100/hr

### TimeEntry
Core time tracking entity with approval workflow and audit trail.

```typescript
enum ApprovalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

interface TimeEntry {
  id: string
  tenantId: string
  employeeId: string
  projectId: string
  phaseId?: string
  taskId?: string
  date: string
  startTime: string
  endTime: string
  duration: number
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable: boolean
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  locked: boolean
  rate?: number
  audit: AuditMetadata
  changeLog: ChangeLogEntry[]
  isFavorite?: boolean
}
```

**Required Fields:** tenantId, employeeId, projectId, date, startTime, endTime, duration, billable, approvalStatus, locked
**Optional Fields:** phaseId, taskId, tags, location, notes, costCenter, rate, approvedBy, approvedAt, isFavorite

**Lifecycle:**
1. **Draft**: Employee creates entry, can edit freely
2. **Submitted**: Employee submits for approval, locked from edits
3. **Approved**: Manager approves, entry fully locked, rate calculated
4. **Rejected**: Manager rejects with reason, employee can re-edit and resubmit

### TimesheetPeriod
Batch approval of time entries by period (e.g., weekly).

```typescript
interface TimesheetPeriod {
  id: string
  tenantId: string
  employeeId: string
  startDate: string
  endDate: string
  status: ApprovalStatus
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  totalHours: number
  audit: AuditMetadata
}
```

**Workflow:**
- Employee fills week of time entries
- Submits entire period for approval
- All entries in period move to "submitted"
- Manager reviews and approves/rejects period
- If approved, all entries lock
- If rejected, entries return to draft with reason

### PlannedTime
Capacity planning and forecasting.

```typescript
interface PlannedTime {
  id: string
  tenantId: string
  employeeId: string
  projectId: string
  phaseId?: string
  taskId?: string
  date: string
  plannedHours: number
  notes?: string
  audit: AuditMetadata
}
```

**Use Cases:**
- Resource allocation planning
- Capacity forecasting
- Plan vs Actual variance analysis
- Over/under allocation alerts

### Absence
Leave management and availability tracking.

```typescript
enum AbsenceType {
  VACATION = 'vacation',
  SICK = 'sick',
  HOLIDAY = 'holiday',
  BLOCKED = 'blocked'
}

interface Absence {
  id: string
  tenantId: string
  employeeId: string
  type: AbsenceType
  startDate: string
  endDate: string
  days: number
  reason?: string
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  audit: AuditMetadata
}
```

**Absence Types:**
- **Vacation**: Requested time off
- **Sick**: Sick leave
- **Holiday**: Public holidays (auto-populated)
- **Blocked**: Administrative blackout periods

### Expense & MileageEntry
Non-labor costs with approval workflow.

```typescript
interface Expense {
  id: string
  tenantId: string
  employeeId: string
  projectId?: string
  date: string
  type: 'mileage' | 'other'
  amount: number
  currency: string
  description: string
  receiptUrl?: string
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  audit: AuditMetadata
}

interface MileageEntry {
  id: string
  tenantId: string
  employeeId: string
  projectId?: string
  date: string
  startLocation: string
  endLocation: string
  distance: number
  purpose: string
  rate?: number
  amount?: number
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  locked: boolean
  audit: AuditMetadata
  changeLog: ChangeLogEntry[]
}
```

## Audit & Versioning

### AuditMetadata
Attached to every entity for compliance tracking.

```typescript
interface AuditMetadata {
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  device?: string
}
```

**Captured Information:**
- Who created the record (user ID)
- When it was created (ISO timestamp)
- Who last updated it (user ID)
- When it was updated (ISO timestamp)
- Device/client info (browser, mobile app, etc.)

### ChangeLogEntry
Full history of modifications to time/mileage entries.

```typescript
interface ChangeLogEntry {
  timestamp: string
  userId: string
  before: Record<string, any>
  after: Record<string, any>
  reason?: string
  device?: string
}
```

**Captured on Every Update:**
- Complete "before" snapshot of changed fields
- Complete "after" snapshot of new values
- Optional reason for change
- User who made the change
- Timestamp and device

**Example:**
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "userId": "emp-123",
  "before": { "endTime": "17:00", "duration": 8 },
  "after": { "endTime": "18:00", "duration": 9 },
  "reason": "Forgot to log extra hour",
  "device": "Chrome 120 / Windows"
}
```

### CorrectionEntry
For fixing approved/locked entries without breaking immutability.

```typescript
interface CorrectionEntry {
  id: string
  tenantId: string
  originalEntryId: string
  originalEntryType: 'time' | 'mileage'
  reason: string
  correctedBy: string
  correctedAt: string
  beforeData: Record<string, any>
  afterData: Record<string, any>
}
```

**Correction Workflow:**
1. Approved entry found with error
2. User requests correction (requires reason)
3. System creates negative entry (reverses original)
4. System creates positive entry (new correct values)
5. CorrectionEntry links all three together
6. Reports show net effect

**Example:**
- Original: 8 hours on Project A
- Correction needed: Should be 6 hours
- Creates: -8 hours (reversal) + 6 hours (correct) = Net -2 hours
- All linked via CorrectionEntry

## Data Migration

The system includes migration utilities for upgrading from the legacy data model to the new architecture.

### Migration Strategy

```typescript
// Automatic migration on app start
import { migrateAllData } from '@/lib/migration'

// Check if migration needed
const migrated = await spark.kv.get('migration_completed')
if (!migrated) {
  await migrateAllData(spark)
}
```

### What Gets Migrated

**Legacy → New Mapping:**
- `Employee` → Adds: tenantId, role (default: EMPLOYEE), active: true, audit metadata
- `Project` → Adds: tenantId, clientId (from old client field), active: true, audit metadata
- `TimeEntry` → Adds: tenantId, duration (calculated), billable (default: true), approvalStatus: DRAFT, locked: false, audit metadata, empty changeLog
- `MileageEntry` → Adds: tenantId, approvalStatus: DRAFT, locked: false, audit metadata, empty changeLog

### Backwards Compatibility

Legacy type aliases are provided for gradual migration:
```typescript
export type LegacyEmployee = Omit<Employee, 'tenantId' | 'role' | 'hourlyRate' | 'active' | 'audit'>
export type LegacyProject = Omit<Project, 'tenantId' | 'clientId' | 'code' | 'startDate' | 'endDate' | 'budget' | 'active' | 'audit'>
// etc.
```

## Helper Functions

### Creating Audit Metadata
```typescript
import { createAuditMetadata } from '@/lib/data-model-helpers'

const audit = createAuditMetadata(userId, device)
// { createdBy: 'emp-123', createdAt: '2025-01-15T14:30:00Z', device: 'Chrome' }
```

### Updating Audit Metadata
```typescript
import { updateAuditMetadata } from '@/lib/data-model-helpers'

const updatedAudit = updateAuditMetadata(existingAudit, userId, device)
// { ...existing, updatedBy: 'emp-456', updatedAt: '2025-01-15T15:00:00Z' }
```

### Creating Change Log Entries
```typescript
import { createChangeLogEntry } from '@/lib/data-model-helpers'

const logEntry = createChangeLogEntry(
  userId,
  { endTime: '17:00' },
  { endTime: '18:00' },
  'Forgot to log extra hour',
  device
)
```

### Checking Edit Permissions
```typescript
import { canEditEntry } from '@/lib/data-model-helpers'

if (canEditEntry(timeEntry, userRole)) {
  // Allow edit
} else {
  // Show error: "Entry is locked or approved"
}
```

### Getting Applicable Rate
```typescript
import { getApplicableRate } from '@/lib/data-model-helpers'

const rate = getApplicableRate(
  allRates,
  employeeId,
  projectId,
  taskId,
  date
)
// Returns most specific applicable rate or undefined
```

## Best Practices

### 1. Always Scope by Tenant
```typescript
// ✅ Correct
const projects = (await spark.kv.get('projects_v2') || [])
  .filter(p => p.tenantId === currentTenantId)

// ❌ Wrong
const projects = await spark.kv.get('projects_v2') || []
```

### 2. Use Audit Helpers
```typescript
// ✅ Correct
const newEmployee = {
  id: generateId(),
  tenantId,
  name: 'John Doe',
  role: UserRole.EMPLOYEE,
  active: true,
  audit: createAuditMetadata(currentUserId, deviceInfo)
}

// ❌ Wrong
const newEmployee = {
  id: generateId(),
  name: 'John Doe',
  createdAt: new Date().toISOString()
}
```

### 3. Check Permissions Before Actions
```typescript
// ✅ Correct
if (!canEditEntry(timeEntry, userRole)) {
  toast.error('Cannot edit approved entries')
  return
}

// ❌ Wrong
// Just allow edit without checking
```

### 4. Use Correction Workflow
```typescript
// ✅ Correct: For approved entries
if (timeEntry.locked) {
  createCorrectionEntry(timeEntry, newValues, reason)
}

// ❌ Wrong: Direct edit of approved entry
timeEntry.endTime = newTime
```

### 5. Calculate Duration
```typescript
// ✅ Correct
import { calculateDuration } from '@/lib/data-model-helpers'

const duration = calculateDuration(startTime, endTime, date)

// ❌ Wrong: Manual calculation prone to errors
const duration = (new Date(endTime) - new Date(startTime)) / 3600000
```

### 6. Log All Changes
```typescript
// ✅ Correct
const logEntry = createChangeLogEntry(
  userId,
  { duration: oldDuration },
  { duration: newDuration },
  reason
)
timeEntry.changeLog.push(logEntry)

// ❌ Wrong: Update without logging
timeEntry.duration = newDuration
```

## Storage Keys

The system uses these KV storage keys:

- `tenants` - Tenant[]
- `clients` - Client[]
- `projects_v2` - Project[]
- `phases` - Phase[]
- `tasks` - Task[]
- `employees_v2` - Employee[]
- `rates` - Rate[]
- `timeEntries_v2` - TimeEntry[]
- `timesheetPeriods` - TimesheetPeriod[]
- `plannedTimes` - PlannedTime[]
- `absences` - Absence[]
- `expenses` - Expense[]
- `mileageEntries_v2` - MileageEntry[]
- `corrections` - CorrectionEntry[]
- `migration_completed` - boolean

## Future Enhancements

Potential extensions to the data model:

1. **Webhooks**: Notify external systems on approval/rejection
2. **Custom Fields**: Tenant-specific additional fields
3. **Recurring Entries**: Template-based automatic entry creation
4. **Integrations**: Sync with accounting systems (DATEV, Xero, etc.)
5. **Time Zones**: Multi-timezone support for global teams
6. **Attachments**: File storage for receipts, documents
7. **Comments**: Discussion threads on entries
8. **Notifications**: Email/push for approvals, rejections
9. **Reports**: Pre-built reports (payroll, billing, utilization)
10. **API**: REST/GraphQL API for external integrations
