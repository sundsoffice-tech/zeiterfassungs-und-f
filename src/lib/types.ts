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

export enum IntegrationType {
  CALENDAR = 'calendar',
  PROJECT_MANAGEMENT = 'project_management',
  COMMUNICATION = 'communication',
  ACCOUNTING = 'accounting',
  SSO = 'sso',
  WEBHOOK = 'webhook',
  MDM = 'mdm'
}

export enum IntegrationProvider {
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK_CALENDAR = 'outlook_calendar',
  ICAL = 'ical',
  JIRA = 'jira',
  ASANA = 'asana',
  TRELLO = 'trello',
  MONDAY = 'monday',
  CLICKUP = 'clickup',
  TEAMS = 'teams',
  SLACK = 'slack',
  DATEV = 'datev',
  LEXWARE = 'lexware',
  SEVDESK = 'sevdesk',
  MICROSOFT_ENTRA = 'microsoft_entra',
  GOOGLE_WORKSPACE = 'google_workspace',
  SAML = 'saml',
  OIDC = 'oidc',
  CUSTOM_WEBHOOK = 'custom_webhook',
  CUSTOM_MDM = 'custom_mdm'
}

export enum DataRetentionPeriod {
  MONTHS_6 = '6_months',
  YEAR_1 = '1_year',
  YEARS_3 = '3_years',
  YEARS_5 = '5_years',
  YEARS_10 = '10_years',
  CUSTOM = 'custom'
}

export enum EncryptionLevel {
  TRANSIT_ONLY = 'transit_only',
  AT_REST = 'at_rest',
  END_TO_END = 'end_to_end'
}

export enum AuditEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETE = 'data_delete',
  SETTINGS_CHANGE = 'settings_change',
  APPROVAL_ACTION = 'approval_action',
  RATE_CHANGE = 'rate_change',
  PROJECT_CHANGE = 'project_change',
  EMPLOYEE_CHANGE = 'employee_change',
  INTEGRATION_CHANGE = 'integration_change',
  RETENTION_POLICY_CHANGE = 'retention_policy_change',
  DATA_ANONYMIZATION = 'data_anonymization',
  GDPR_REQUEST = 'gdpr_request'
}

export interface PrivacySettings {
  id: string
  tenantId: string
  dataMinimization: {
    enabled: boolean
    collectOnlyRequired: boolean
    noAppTracking: boolean
    noAnalytics: boolean
  }
  encryption: {
    inTransit: boolean
    atRest: boolean
    endToEndNotes: boolean
    endToEndAttachments: boolean
    algorithm?: string
  }
  retention: {
    timeEntriesMonths: number
    mileageEntriesMonths: number
    auditLogsMonths: number
    deletedDataMonths: number
    autoDeleteAfterRetention: boolean
  }
  gdprCompliance: {
    enabled: boolean
    dataProcessingAgreement: boolean
    subprocessorListMaintained: boolean
    rightToAccess: boolean
    rightToErasure: boolean
    rightToPortability: boolean
    rightToRectification: boolean
  }
  hosting: {
    region: string
    euOnly: boolean
    dataProcessingAgreementSigned: boolean
    subprocessorList: string[]
  }
  audit: AuditMetadata
}

export interface AuditLog {
  id: string
  tenantId: string
  eventType: AuditEventType
  userId: string
  userName?: string
  userRole?: UserRole
  timestamp: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  resourceId?: string
  action: string
  details?: Record<string, any>
  before?: Record<string, any>
  after?: Record<string, any>
  success: boolean
  errorMessage?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface DataRetentionPolicy {
  id: string
  tenantId: string
  name: string
  description?: string
  dataType: 'time_entries' | 'mileage' | 'expenses' | 'audit_logs' | 'deleted_data' | 'attachments' | 'all'
  retentionPeriod: DataRetentionPeriod
  customDays?: number
  autoDelete: boolean
  archiveBeforeDelete: boolean
  notifyBeforeDelete: boolean
  notifyDaysBefore?: number
  enabled: boolean
  lastExecuted?: string
  audit: AuditMetadata
}

export interface GDPRRequest {
  id: string
  tenantId: string
  employeeId: string
  employeeName?: string
  requestType: 'access' | 'erasure' | 'portability' | 'rectification' | 'restriction'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestDate: string
  completionDate?: string
  processedBy?: string
  notes?: string
  dataExportUrl?: string
  audit: AuditMetadata
}

export interface DataAnonymizationLog {
  id: string
  tenantId: string
  employeeId: string
  anonymizedAt: string
  anonymizedBy: string
  recordsAffected: {
    timeEntries: number
    mileageEntries: number
    expenses: number
    projects: number
    auditLogs: number
  }
  retainedData: string[]
  reason: string
}

export interface IntegrationConfig {
  id: string
  tenantId: string
  type: IntegrationType
  provider: IntegrationProvider
  name: string
  description?: string
  enabled: boolean
  config: {
    apiKey?: string
    apiSecret?: string
    clientId?: string
    clientSecret?: string
    accessToken?: string
    refreshToken?: string
    webhookUrl?: string
    webhookSecret?: string
    domain?: string
    tenantId?: string
    organizationId?: string
    workspaceId?: string
    serverId?: string
    exportFormat?: 'csv' | 'xml' | 'json' | 'api'
    syncDirection?: 'one_way' | 'two_way'
    autoSync?: boolean
    syncInterval?: number
    fieldMappings?: Record<string, string>
    [key: string]: any
  }
  lastSync?: string
  lastSyncStatus?: 'success' | 'error' | 'pending'
  lastSyncError?: string
  audit: AuditMetadata
}

export interface WebhookEvent {
  id: string
  tenantId: string
  integrationId: string
  event: 'time_entry.created' | 'time_entry.updated' | 'time_entry.approved' | 'project.created' | 'project.updated' | 'employee.created' | 'employee.updated'
  payload: Record<string, any>
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
  retryCount: number
  error?: string
  audit: AuditMetadata
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
