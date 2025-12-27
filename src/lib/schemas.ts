import { z } from 'zod'
import {
  UserRole,
  ApprovalStatus,
  AbsenceType,
  ActivityMode,
  TimerEventType,
  IntegrationType,
  IntegrationProvider,
  AuditEventType
} from './types'

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')
const isoDateTimeSchema = z.string().datetime()

export const AuditMetadataSchema = z.object({
  createdBy: z.string(),
  createdAt: isoDateTimeSchema,
  updatedBy: z.string().optional(),
  updatedAt: isoDateTimeSchema.optional(),
  device: z.string().optional()
})

export const ChangeLogEntrySchema = z.object({
  timestamp: isoDateTimeSchema,
  userId: z.string(),
  before: z.record(z.unknown()),
  after: z.record(z.unknown()),
  reason: z.string().optional(),
  device: z.string().optional()
})

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tenant name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  settings: z.object({
    defaultCurrency: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    weekStart: z.enum(['monday', 'sunday']).optional(),
    approvalRequired: z.boolean().optional(),
    multiTimerAllowed: z.boolean().optional()
  }).optional(),
  audit: AuditMetadataSchema
})

export const ClientSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Client name is required'),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  active: z.boolean(),
  audit: AuditMetadataSchema
})

export const ProjectSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  clientId: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  budget: z.number().nonnegative().optional(),
  active: z.boolean(),
  audit: AuditMetadataSchema
})

export const PhaseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Phase name is required'),
  description: z.string().optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  budget: z.number().nonnegative().optional(),
  order: z.number().int().nonnegative(),
  active: z.boolean(),
  audit: AuditMetadataSchema
})

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  phaseId: z.string().optional(),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  active: z.boolean(),
  audit: AuditMetadataSchema
})

export const EmployeeSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole),
  hourlyRate: z.number().nonnegative().optional(),
  active: z.boolean(),
  audit: AuditMetadataSchema
})

export const RateSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  hourlyRate: z.number().nonnegative(),
  validFrom: dateStringSchema,
  validTo: dateStringSchema.optional(),
  description: z.string().optional(),
  audit: AuditMetadataSchema
})

export const EvidenceAnchorSchema = z.object({
  type: z.enum(['calendar', 'file', 'location_hash', 'approval', 'system']),
  timestamp: isoDateTimeSchema,
  value: z.string(),
  verified: z.boolean()
})

export const TimeEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  projectId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  date: dateStringSchema,
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  duration: z.number().nonnegative(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  costCenter: z.string().optional(),
  billable: z.boolean(),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  approvedBy: z.string().optional(),
  approvedAt: isoDateTimeSchema.optional(),
  locked: z.boolean(),
  rate: z.number().nonnegative().optional(),
  audit: AuditMetadataSchema,
  changeLog: z.array(ChangeLogEntrySchema),
  isFavorite: z.boolean().optional(),
  calendarEventId: z.string().optional(),
  calendarProvider: z.nativeEnum(IntegrationProvider).optional(),
  evidenceAnchors: z.array(EvidenceAnchorSchema).optional()
}).refine(data => {
  const start = data.startTime.split(':').map(Number)
  const end = data.endTime.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  return endMinutes > startMinutes
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export const TimesheetPeriodSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  status: z.nativeEnum(ApprovalStatus),
  submittedAt: isoDateTimeSchema.optional(),
  approvedBy: z.string().optional(),
  approvedAt: isoDateTimeSchema.optional(),
  rejectionReason: z.string().optional(),
  totalHours: z.number().nonnegative(),
  audit: AuditMetadataSchema
})

export const PlannedTimeSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  projectId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  date: dateStringSchema,
  plannedHours: z.number().nonnegative(),
  notes: z.string().optional(),
  audit: AuditMetadataSchema
})

export const AbsenceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  type: z.nativeEnum(AbsenceType),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  days: z.number().int().positive(),
  reason: z.string().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  approvedBy: z.string().optional(),
  approvedAt: isoDateTimeSchema.optional(),
  audit: AuditMetadataSchema
})

export const MileageEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  projectId: z.string().optional(),
  date: dateStringSchema,
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  distance: z.number().positive(),
  purpose: z.string().min(1, 'Purpose is required'),
  rate: z.number().nonnegative().optional(),
  amount: z.number().nonnegative().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus),
  approvedBy: z.string().optional(),
  approvedAt: isoDateTimeSchema.optional(),
  locked: z.boolean(),
  audit: AuditMetadataSchema,
  changeLog: z.array(ChangeLogEntrySchema)
})

export const TimerEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(TimerEventType),
  timestamp: z.number(),
  timestampFormatted: isoDateTimeSchema,
  mode: z.nativeEnum(ActivityMode).optional(),
  projectId: z.string().optional(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
})

export const ActiveTimerSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  projectId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  startTime: z.number(),
  pausedAt: z.number().optional(),
  pausedDuration: z.number().nonnegative(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  costCenter: z.string().optional(),
  billable: z.boolean(),
  isPaused: z.boolean(),
  mode: z.nativeEnum(ActivityMode).optional(),
  events: z.array(TimerEventSchema),
  calendarEventId: z.string().optional()
})

export const ValidationRuleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  projectId: z.string().optional(),
  code: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string(),
  severity: z.enum(['hard', 'soft']),
  enabled: z.boolean(),
  threshold: z.number().optional(),
  requiredFields: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
  audit: AuditMetadataSchema
})

export const RecurringEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  projectId: z.string(),
  phaseId: z.string().optional(),
  taskId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  duration: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  costCenter: z.string().optional(),
  billable: z.boolean(),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    time: timeStringSchema.optional()
  }),
  active: z.boolean(),
  lastCreated: isoDateTimeSchema.optional(),
  audit: AuditMetadataSchema
})

export const AutomationRuleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  type: z.enum(['auto_start_timer', 'auto_tag', 'auto_categorize']),
  active: z.boolean(),
  conditions: z.object({
    appOpened: z.boolean().optional(),
    locationChange: z.object({ minDistance: z.number().nonnegative() }).optional(),
    timeOfDay: z.object({ start: timeStringSchema, end: timeStringSchema }).optional(),
    dayOfWeek: z.array(z.number().int().min(0).max(6)).optional()
  }),
  actions: z.object({
    startTimer: z.object({
      projectId: z.string(),
      phaseId: z.string().optional(),
      taskId: z.string().optional()
    }).optional(),
    addTag: z.string().optional(),
    setLocation: z.string().optional()
  }),
  priority: z.number().int().nonnegative(),
  audit: AuditMetadataSchema
})

export const ReminderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string().optional(),
  type: z.enum(['missing_time', 'break_warning', 'weekly_submission', 'custom']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  schedule: z.object({
    type: z.enum(['daily', 'weekly', 'after_hours', 'before_deadline']),
    time: timeStringSchema.optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    hoursWorked: z.number().nonnegative().optional()
  }),
  active: z.boolean(),
  dismissed: z.boolean().optional(),
  dismissedAt: isoDateTimeSchema.optional(),
  triggeredAt: isoDateTimeSchema.optional(),
  audit: AuditMetadataSchema
})

export const AppSettingsSchema = z.object({
  tenantId: z.string(),
  autoStartTimer: z.boolean(),
  autoStartProjectId: z.string().optional(),
  autoTaggingEnabled: z.boolean(),
  autoTagRules: z.object({
    distanceThreshold: z.number().nonnegative(),
    travelTag: z.string()
  }),
  reminders: z.object({
    missingTimeEnabled: z.boolean(),
    missingTimeTime: timeStringSchema,
    breakWarningEnabled: z.boolean(),
    breakWarningHours: z.number().nonnegative(),
    weeklySubmissionEnabled: z.boolean(),
    weeklySubmissionDay: z.number().int().min(0).max(6),
    weeklySubmissionTime: timeStringSchema
  }),
  audit: AuditMetadataSchema
})

export function parseTimeEntry(data: unknown): TimeEntry {
  return TimeEntrySchema.parse(data)
}

export function safeParseTimeEntry(data: unknown): z.SafeParseReturnType<unknown, TimeEntry> {
  return TimeEntrySchema.safeParse(data)
}

export function parseActiveTimer(data: unknown): ActiveTimer {
  return ActiveTimerSchema.parse(data)
}

export function safeParseActiveTimer(data: unknown): z.SafeParseReturnType<unknown, ActiveTimer> {
  return ActiveTimerSchema.safeParse(data)
}

export function parseEmployee(data: unknown): Employee {
  return EmployeeSchema.parse(data)
}

export function safeParseEmployee(data: unknown): z.SafeParseReturnType<unknown, Employee> {
  return EmployeeSchema.safeParse(data)
}

export function parseProject(data: unknown): Project {
  return ProjectSchema.parse(data)
}

export function safeParseProject(data: unknown): z.SafeParseReturnType<unknown, Project> {
  return ProjectSchema.safeParse(data)
}

export type TimeEntry = z.infer<typeof TimeEntrySchema>
export type ActiveTimer = z.infer<typeof ActiveTimerSchema>
export type Employee = z.infer<typeof EmployeeSchema>
export type Project = z.infer<typeof ProjectSchema>
export type MileageEntry = z.infer<typeof MileageEntrySchema>
export type Absence = z.infer<typeof AbsenceSchema>
export type Task = z.infer<typeof TaskSchema>
export type Phase = z.infer<typeof PhaseSchema>
export type RecurringEntry = z.infer<typeof RecurringEntrySchema>
export type AutomationRule = z.infer<typeof AutomationRuleSchema>
export type Reminder = z.infer<typeof ReminderSchema>
export type AppSettings = z.infer<typeof AppSettingsSchema>
export type ValidationRule = z.infer<typeof ValidationRuleSchema>
