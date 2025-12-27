export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee',
  EXTERNAL = 'external'
}

export enum ApprovalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum AbsenceType {
  VACATION = 'vacation',
  SICK = 'sick',
  HOLIDAY = 'holiday',
  BLOCKED = 'blocked'
}

export interface AuditMetadata {
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  device?: string
}

export interface ChangeLogEntry {
  timestamp: string
  userId: string
  before: Record<string, any>
  after: Record<string, any>
  reason?: string
  device?: string
}

export interface Tenant {
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

export interface Client {
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

export interface Project {
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

export interface Phase {
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

export interface Task {
  id: string
  projectId: string
  phaseId?: string
  name: string
  description?: string
  estimatedHours?: number
  active: boolean
  audit: AuditMetadata
}

export interface Employee {
  id: string
  tenantId: string
  name: string
  email?: string
  role: UserRole
  hourlyRate?: number
  active: boolean
  audit: AuditMetadata
}

export interface Rate {
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

export interface TimeEntry {
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

export interface TimesheetPeriod {
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

export interface PlannedTime {
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

export interface Absence {
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

export interface Expense {
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

export interface MileageEntry {
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

export interface ActiveTimer {
  id: string
  employeeId: string
  projectId: string
  phaseId?: string
  taskId?: string
  startTime: number
  pausedAt?: number
  pausedDuration: number
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable: boolean
  isPaused: boolean
}

export interface TimeTemplate {
  id: string
  name: string
  employeeId: string
  projectId: string
  phaseId?: string
  taskId?: string
  duration?: number
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable: boolean
  isFavorite: boolean
  lastUsed: string
}

export interface CorrectionEntry {
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

export interface Permission {
  id: string
  roleId: UserRole
  canSeeRates: boolean
  canEditAfterApproval: boolean
  canCreateProjects: boolean
  canApproveTimesheets: boolean
  canViewAllEmployees: boolean
  canEditAllTimeEntries: boolean
  canAccessAdminPanel: boolean
  canRunReports: boolean
  restrictedToOwnProjects: boolean
  restrictedToOwnData: boolean
}

export interface Warning {
  id: string
  type: 'implausible' | 'overtime_risk' | 'budget_risk' | 'missing_days' | 'missing_notes' | 'weekend_work' | 'overlap' | 'gap'
  severity: 'low' | 'medium' | 'high' | 'critical'
  employeeId?: string
  projectId?: string
  entryId?: string
  date: string
  title: string
  description: string
  metadata?: Record<string, any>
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface LiveStatus {
  employeeId: string
  projectId?: string
  taskId?: string
  status: 'working' | 'paused' | 'idle'
  startTime: number
  duration: number
  lastActivity: number
}

export interface KPI {
  id: string
  name: string
  value: number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  target?: number
  unit: string
  period: string
  description: string
}

export interface RecurringEntry {
  id: string
  tenantId: string
  employeeId: string
  projectId: string
  phaseId?: string
  taskId?: string
  name: string
  duration?: number
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable: boolean
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    daysOfWeek?: number[]
    dayOfMonth?: number
    time?: string
  }
  active: boolean
  lastCreated?: string
  audit: AuditMetadata
}

export interface AutomationRule {
  id: string
  tenantId: string
  name: string
  type: 'auto_start_timer' | 'auto_tag' | 'auto_categorize'
  active: boolean
  conditions: {
    appOpened?: boolean
    locationChange?: { minDistance: number }
    timeOfDay?: { start: string; end: string }
    dayOfWeek?: number[]
  }
  actions: {
    startTimer?: { projectId: string; phaseId?: string; taskId?: string }
    addTag?: string
    setLocation?: string
  }
  priority: number
  audit: AuditMetadata
}

export interface Reminder {
  id: string
  tenantId: string
  employeeId?: string
  type: 'missing_time' | 'break_warning' | 'weekly_submission' | 'custom'
  title: string
  message: string
  schedule: {
    type: 'daily' | 'weekly' | 'after_hours' | 'before_deadline'
    time?: string
    dayOfWeek?: number
    hoursWorked?: number
  }
  active: boolean
  dismissed?: boolean
  dismissedAt?: string
  triggeredAt?: string
  audit: AuditMetadata
}

export interface AppSettings {
  tenantId: string
  autoStartTimer: boolean
  autoStartProjectId?: string
  autoTaggingEnabled: boolean
  autoTagRules: {
    distanceThreshold: number
    travelTag: string
  }
  reminders: {
    missingTimeEnabled: boolean
    missingTimeTime: string
    breakWarningEnabled: boolean
    breakWarningHours: number
    weeklySubmissionEnabled: boolean
    weeklySubmissionDay: number
    weeklySubmissionTime: string
  }
  audit: AuditMetadata
}

export type LegacyEmployee = Omit<Employee, 'tenantId' | 'role' | 'hourlyRate' | 'active' | 'audit'>
export type LegacyProject = Omit<Project, 'tenantId' | 'clientId' | 'code' | 'startDate' | 'endDate' | 'budget' | 'active' | 'audit'>
export type LegacyTimeEntry = Omit<TimeEntry, 'tenantId' | 'phaseId' | 'taskId' | 'duration' | 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'locked' | 'rate' | 'audit' | 'changeLog'>
export type LegacyMileageEntry = Omit<MileageEntry, 'tenantId' | 'projectId' | 'rate' | 'amount' | 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'locked' | 'audit' | 'changeLog'>
