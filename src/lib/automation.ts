import { RecurringEntry, TimeEntry, AutomationRule, Reminder, AppSettings, Employee, Project, AuditMetadata, ApprovalStatus } from './types'
import { format, addDays, isToday, isSameDay, getDay, startOfDay, differenceInMinutes } from 'date-fns'

export function shouldCreateRecurringEntry(recurring: RecurringEntry): boolean {
  if (!recurring.active) return false
  
  const today = new Date()
  const lastCreated = recurring.lastCreated ? new Date(recurring.lastCreated) : null
  
  if (lastCreated && isSameDay(today, lastCreated)) {
    return false
  }
  
  switch (recurring.schedule.frequency) {
    case 'daily':
      return true
      
    case 'weekly':
      if (!recurring.schedule.daysOfWeek) return false
      const dayOfWeek = getDay(today)
      return recurring.schedule.daysOfWeek.includes(dayOfWeek)
      
    case 'monthly':
      if (!recurring.schedule.dayOfMonth) return false
      return today.getDate() === recurring.schedule.dayOfMonth
      
    default:
      return false
  }
}

export function createTimeEntryFromRecurring(
  recurring: RecurringEntry,
  employeeId: string,
  tenantId: string
): Omit<TimeEntry, 'id'> {
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  
  const scheduleTime = recurring.schedule.time || '09:00'
  const [hours, minutes] = scheduleTime.split(':').map(Number)
  
  const startTime = new Date(now)
  startTime.setHours(hours, minutes, 0, 0)
  
  const endTime = new Date(startTime)
  if (recurring.duration) {
    endTime.setMinutes(endTime.getMinutes() + recurring.duration)
  } else {
    endTime.setMinutes(endTime.getMinutes() + 30)
  }
  
  const duration = differenceInMinutes(endTime, startTime)
  
  const audit: AuditMetadata = {
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    device: 'automation'
  }
  
  return {
    tenantId,
    employeeId,
    projectId: recurring.projectId,
    phaseId: recurring.phaseId,
    taskId: recurring.taskId,
    date: todayStr,
    startTime: format(startTime, 'HH:mm'),
    endTime: format(endTime, 'HH:mm'),
    duration,
    tags: recurring.tags || [],
    location: recurring.location,
    notes: recurring.notes || `Automatisch erstellt: ${recurring.name}`,
    costCenter: recurring.costCenter,
    billable: recurring.billable,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    audit,
    changeLog: []
  }
}

export function checkAutoStartTimer(
  rules: AutomationRule[],
  context: {
    timeOfDay: string
    dayOfWeek: number
    appOpened: boolean
  }
): AutomationRule | null {
  const activeRules = rules
    .filter(r => r.active && r.type === 'auto_start_timer')
    .sort((a, b) => b.priority - a.priority)
  
  for (const rule of activeRules) {
    if (rule.conditions.appOpened && context.appOpened) {
      if (rule.conditions.timeOfDay) {
        const { start, end } = rule.conditions.timeOfDay
        if (context.timeOfDay >= start && context.timeOfDay <= end) {
          if (rule.conditions.dayOfWeek) {
            if (rule.conditions.dayOfWeek.includes(context.dayOfWeek)) {
              return rule
            }
          } else {
            return rule
          }
        }
      } else if (rule.conditions.dayOfWeek) {
        if (rule.conditions.dayOfWeek.includes(context.dayOfWeek)) {
          return rule
        }
      } else {
        return rule
      }
    }
  }
  
  return null
}

export function checkAutoTagging(
  rules: AutomationRule[],
  context: {
    distanceTraveled?: number
  }
): string[] {
  const tags: string[] = []
  
  const activeRules = rules.filter(r => r.active && r.type === 'auto_tag')
  
  for (const rule of activeRules) {
    if (rule.conditions.locationChange && context.distanceTraveled) {
      if (context.distanceTraveled >= rule.conditions.locationChange.minDistance) {
        if (rule.actions.addTag) {
          tags.push(rule.actions.addTag)
        }
      }
    }
  }
  
  return tags
}

export function checkReminders(
  reminders: Reminder[],
  context: {
    currentTime: string
    dayOfWeek: number
    hoursWorked: number
    hasTimeEntriesToday: boolean
    timesheetSubmitted: boolean
  }
): Reminder[] {
  const triggered: Reminder[] = []
  
  for (const reminder of reminders) {
    if (!reminder.active || reminder.dismissed) continue
    
    switch (reminder.type) {
      case 'missing_time':
        if (reminder.schedule.time === context.currentTime && !context.hasTimeEntriesToday) {
          triggered.push(reminder)
        }
        break
        
      case 'break_warning':
        if (reminder.schedule.hoursWorked && context.hoursWorked >= reminder.schedule.hoursWorked) {
          triggered.push(reminder)
        }
        break
        
      case 'weekly_submission':
        if (
          reminder.schedule.dayOfWeek === context.dayOfWeek &&
          reminder.schedule.time === context.currentTime &&
          !context.timesheetSubmitted
        ) {
          triggered.push(reminder)
        }
        break
    }
  }
  
  return triggered
}

export function createDefaultReminders(tenantId: string, employeeId: string): Reminder[] {
  const audit: AuditMetadata = {
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    device: 'automation'
  }
  
  return [
    {
      id: `reminder-missing-time-${employeeId}`,
      tenantId,
      employeeId,
      type: 'missing_time',
      title: 'Zeiten fehlen',
      message: 'Du hast heute noch keine Zeiten erfasst. Bitte trage deine Arbeitszeiten ein.',
      schedule: {
        type: 'daily',
        time: '17:00'
      },
      active: true,
      audit
    },
    {
      id: `reminder-break-${employeeId}`,
      tenantId,
      employeeId,
      type: 'break_warning',
      title: 'Pause erforderlich',
      message: 'Du hast mehr als 6 Stunden gearbeitet. Nach deutschem Arbeitsrecht ist eine Pause von mindestens 30 Minuten erforderlich.',
      schedule: {
        type: 'after_hours',
        hoursWorked: 6
      },
      active: true,
      audit
    },
    {
      id: `reminder-weekly-${employeeId}`,
      tenantId,
      employeeId,
      type: 'weekly_submission',
      title: 'Wocheneinreichung',
      message: 'Bitte reiche deine Wochenzeiten bis Freitag 16:00 Uhr ein.',
      schedule: {
        type: 'weekly',
        dayOfWeek: 5,
        time: '16:00'
      },
      active: true,
      audit
    }
  ]
}

export function getDefaultAppSettings(tenantId: string): AppSettings {
  const audit: AuditMetadata = {
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    device: 'automation'
  }
  
  return {
    tenantId,
    autoStartTimer: false,
    autoTaggingEnabled: false,
    autoTagRules: {
      distanceThreshold: 5,
      travelTag: 'Fahrt'
    },
    reminders: {
      missingTimeEnabled: true,
      missingTimeTime: '17:00',
      breakWarningEnabled: true,
      breakWarningHours: 6,
      weeklySubmissionEnabled: true,
      weeklySubmissionDay: 5,
      weeklySubmissionTime: '16:00'
    },
    audit
  }
}

export function calculateHoursWorkedToday(timeEntries: TimeEntry[], employeeId: string): number {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  const todayEntries = timeEntries.filter(
    entry => entry.employeeId === employeeId && entry.date === today
  )
  
  return todayEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0)
}

export function hasTimeEntriesToday(timeEntries: TimeEntry[], employeeId: string): boolean {
  const today = format(new Date(), 'yyyy-MM-dd')
  return timeEntries.some(entry => entry.employeeId === employeeId && entry.date === today)
}
