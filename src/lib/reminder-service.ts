import { Employee, TimeEntry, Absence } from './types'
import { format, parseISO, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, isFriday, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { EmailService } from './email-service'
import { EmailNotificationService } from './email-notifications'

export enum ReminderType {
  DAILY_UNDER_HOURS = 'daily_under_hours',
  WEEKLY_UNDER_HOURS = 'weekly_under_hours',
  WEEK_COMPLETION = 'week_completion',
  MISSING_TIME_ENTRY = 'missing_time_entry'
}

export enum ReminderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  DISABLED = 'disabled'
}

export interface ReminderSettings {
  employeeId: string
  dailyReminder: {
    enabled: boolean
    time: string
    threshold: number
    channels: ('email' | 'push' | 'in_app')[]
  }
  weeklyReminder: {
    enabled: boolean
    dayOfWeek: number
    time: string
    threshold: number
    channels: ('email' | 'push' | 'in_app')[]
  }
  weekCompletion: {
    enabled: boolean
    dayOfWeek: number
    time: string
    channels: ('email' | 'push' | 'in_app')[]
  }
}

export interface ReminderCheck {
  type: ReminderType
  shouldTrigger: boolean
  data: {
    targetHours: number
    actualHours: number
    difference: number
    date?: string
    weekStart?: string
    weekEnd?: string
    missingDays?: string[]
  }
}

export interface ReminderNotification {
  id: string
  employeeId: string
  type: ReminderType
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export class ReminderService {
  static getDefaultSettings(employeeId: string): ReminderSettings {
    return {
      employeeId,
      dailyReminder: {
        enabled: false,
        time: '17:00',
        threshold: 8,
        channels: ['in_app']
      },
      weeklyReminder: {
        enabled: false,
        dayOfWeek: 5,
        time: '16:00',
        threshold: 40,
        channels: ['in_app']
      },
      weekCompletion: {
        enabled: false,
        dayOfWeek: 5,
        time: '17:00',
        channels: ['in_app']
      }
    }
  }

  static calculateDailyHours(
    employee: Employee,
    timeEntries: TimeEntry[],
    date: string
  ): number {
    const dayStart = startOfDay(parseISO(date))
    const dayEnd = endOfDay(parseISO(date))

    return timeEntries
      .filter(entry => 
        entry.employeeId === employee.id &&
        entry.date === date
      )
      .reduce((total, entry) => total + (entry.duration || 0), 0) / 60
  }

  static calculateWeeklyHours(
    employee: Employee,
    timeEntries: TimeEntry[],
    date: Date
  ): { total: number; weekStart: string; weekEnd: string; dailyBreakdown: Record<string, number> } {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

    const dailyBreakdown: Record<string, number> = {}
    let total = 0

    timeEntries
      .filter(entry => {
        const entryDate = parseISO(entry.date)
        return (
          entry.employeeId === employee.id &&
          isWithinInterval(entryDate, { start: weekStart, end: weekEnd })
        )
      })
      .forEach(entry => {
        const hours = (entry.duration || 0) / 60
        total += hours
        dailyBreakdown[entry.date] = (dailyBreakdown[entry.date] || 0) + hours
      })

    return {
      total,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      dailyBreakdown
    }
  }

  static getMissingDays(
    employee: Employee,
    timeEntries: TimeEntry[],
    absences: Absence[],
    date: Date
  ): string[] {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    
    const missingDays: string[] = []
    const entriesByDate = new Set(
      timeEntries
        .filter(entry => entry.employeeId === employee.id)
        .map(entry => entry.date)
    )
    
    const absenceDates = new Set<string>()
    absences
      .filter(absence => absence.employeeId === employee.id)
      .forEach(absence => {
        const start = parseISO(absence.startDate)
        const end = parseISO(absence.endDate)
        let current = start
        while (current <= end) {
          absenceDates.add(format(current, 'yyyy-MM-dd'))
          current = addDays(current, 1)
        }
      })

    for (let i = 0; i < 5; i++) {
      const checkDate = addDays(weekStart, i)
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      
      if (checkDate <= new Date() && !entriesByDate.has(dateStr) && !absenceDates.has(dateStr)) {
        missingDays.push(dateStr)
      }
    }

    return missingDays
  }

  static checkDailyReminder(
    employee: Employee,
    timeEntries: TimeEntry[],
    settings: ReminderSettings,
    date: string = format(new Date(), 'yyyy-MM-dd')
  ): ReminderCheck {
    const actualHours = this.calculateDailyHours(employee, timeEntries, date)
    const targetHours = settings.dailyReminder.threshold
    const difference = targetHours - actualHours

    return {
      type: ReminderType.DAILY_UNDER_HOURS,
      shouldTrigger: settings.dailyReminder.enabled && difference > 0,
      data: {
        targetHours,
        actualHours,
        difference,
        date
      }
    }
  }

  static checkWeeklyReminder(
    employee: Employee,
    timeEntries: TimeEntry[],
    absences: Absence[],
    settings: ReminderSettings,
    date: Date = new Date()
  ): ReminderCheck {
    const { total, weekStart, weekEnd, dailyBreakdown } = this.calculateWeeklyHours(
      employee,
      timeEntries,
      date
    )
    
    const targetHours = settings.weeklyReminder.threshold
    const difference = targetHours - total
    const missingDays = this.getMissingDays(employee, timeEntries, absences, date)

    return {
      type: ReminderType.WEEKLY_UNDER_HOURS,
      shouldTrigger: settings.weeklyReminder.enabled && difference > 0,
      data: {
        targetHours,
        actualHours: total,
        difference,
        weekStart,
        weekEnd,
        missingDays
      }
    }
  }

  static checkWeekCompletion(
    employee: Employee,
    timeEntries: TimeEntry[],
    absences: Absence[],
    settings: ReminderSettings,
    date: Date = new Date()
  ): ReminderCheck {
    const { total, weekStart, weekEnd } = this.calculateWeeklyHours(employee, timeEntries, date)
    const missingDays = this.getMissingDays(employee, timeEntries, absences, date)
    const targetHours = 40

    return {
      type: ReminderType.WEEK_COMPLETION,
      shouldTrigger: settings.weekCompletion.enabled && (missingDays.length > 0 || total < targetHours),
      data: {
        targetHours,
        actualHours: total,
        difference: targetHours - total,
        weekStart,
        weekEnd,
        missingDays
      }
    }
  }

  static createNotificationMessage(check: ReminderCheck, employee: Employee): { title: string; message: string; htmlMessage: string } {
    const employeeName = employee.name

    switch (check.type) {
      case ReminderType.DAILY_UNDER_HOURS:
        return {
          title: '⏰ Tägliche Stunden-Erinnerung',
          message: `Hallo ${employeeName}! Du hast heute ${check.data.actualHours.toFixed(1)} von ${check.data.targetHours} Sollstunden erfasst. Noch ${check.data.difference.toFixed(1)} Stunden fehlen.`,
          htmlMessage: `
            <h2>⏰ Tägliche Stunden-Erinnerung</h2>
            <p>Hallo <strong>${employeeName}</strong>!</p>
            <p>Du hast heute <strong>${check.data.actualHours.toFixed(1)} von ${check.data.targetHours} Sollstunden</strong> erfasst.</p>
            <p style="color: #e8965a; font-weight: 600;">Noch ${check.data.difference.toFixed(1)} Stunden fehlen.</p>
            <p>Bitte denke daran, deine Zeiterfassung zu vervollständigen.</p>
          `
        }

      case ReminderType.WEEKLY_UNDER_HOURS:
        const missingDaysText = check.data.missingDays?.length 
          ? `\n\nFehlende Tage: ${check.data.missingDays.map(d => format(parseISO(d), 'dd.MM.yyyy', { locale: de })).join(', ')}`
          : ''
        return {
          title: '📅 Wöchentliche Stunden-Erinnerung',
          message: `Hallo ${employeeName}! Diese Woche (${format(parseISO(check.data.weekStart!), 'dd.MM.', { locale: de })} - ${format(parseISO(check.data.weekEnd!), 'dd.MM.yyyy', { locale: de })}) hast du ${check.data.actualHours.toFixed(1)} von ${check.data.targetHours} Sollstunden erfasst. Noch ${check.data.difference.toFixed(1)} Stunden fehlen.${missingDaysText}`,
          htmlMessage: `
            <h2>📅 Wöchentliche Stunden-Erinnerung</h2>
            <p>Hallo <strong>${employeeName}</strong>!</p>
            <p>Diese Woche (<strong>${format(parseISO(check.data.weekStart!), 'dd.MM.', { locale: de })} - ${format(parseISO(check.data.weekEnd!), 'dd.MM.yyyy', { locale: de })}</strong>) hast du <strong>${check.data.actualHours.toFixed(1)} von ${check.data.targetHours} Sollstunden</strong> erfasst.</p>
            <p style="color: #e8965a; font-weight: 600;">Noch ${check.data.difference.toFixed(1)} Stunden fehlen.</p>
            ${check.data.missingDays?.length ? `
              <div style="margin-top: 16px; padding: 12px; background: #fff3e0; border-radius: 8px;">
                <strong>Fehlende Tage:</strong><br/>
                ${check.data.missingDays.map(d => format(parseISO(d), 'dd.MM.yyyy (EEEE)', { locale: de })).join('<br/>')}
              </div>
            ` : ''}
          `
        }

      case ReminderType.WEEK_COMPLETION:
        return {
          title: '✅ Wochenabschluss-Check',
          message: `Hallo ${employeeName}! Zeit für deinen Wochenabschluss. Du hast ${check.data.actualHours.toFixed(1)} von ${check.data.targetHours} Stunden erfasst.${check.data.missingDays?.length ? ` Es fehlen noch Einträge für ${check.data.missingDays.length} Tag(e).` : ' Bitte überprüfe deine Einträge.'}`,
          htmlMessage: `
            <h2>✅ Wochenabschluss-Check</h2>
            <p>Hallo <strong>${employeeName}</strong>!</p>
            <p>Zeit für deinen Wochenabschluss für die Woche <strong>${format(parseISO(check.data.weekStart!), 'dd.MM.', { locale: de })} - ${format(parseISO(check.data.weekEnd!), 'dd.MM.yyyy', { locale: de })}</strong>.</p>
            <div style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #6b3cc6;">
                ${check.data.actualHours.toFixed(1)} / ${check.data.targetHours} Stunden
              </p>
            </div>
            ${check.data.missingDays?.length ? `
              <div style="margin-top: 16px; padding: 12px; background: #ffebee; border-radius: 8px;">
                <strong>⚠️ Es fehlen noch Einträge für ${check.data.missingDays.length} Tag(e):</strong><br/>
                ${check.data.missingDays.map(d => format(parseISO(d), 'dd.MM.yyyy (EEEE)', { locale: de })).join('<br/>')}
              </div>
            ` : ''}
            <p style="margin-top: 16px;">Bitte überprüfe deine Einträge und schließe deine Woche ab.</p>
          `
        }

      default:
        return {
          title: 'Erinnerung',
          message: 'Bitte überprüfe deine Zeiterfassung.',
          htmlMessage: '<p>Bitte überprüfe deine Zeiterfassung.</p>'
        }
    }
  }

  static async sendReminderNotification(
    check: ReminderCheck,
    employee: Employee,
    settings: ReminderSettings
  ): Promise<boolean> {
    if (!check.shouldTrigger) {
      return false
    }

    const { title, message, htmlMessage } = this.createNotificationMessage(check, employee)
    
    let channels: ('email' | 'push' | 'in_app')[] = []
    switch (check.type) {
      case ReminderType.DAILY_UNDER_HOURS:
        channels = settings.dailyReminder.channels
        break
      case ReminderType.WEEKLY_UNDER_HOURS:
        channels = settings.weeklyReminder.channels
        break
      case ReminderType.WEEK_COMPLETION:
        channels = settings.weekCompletion.channels
        break
    }

    if (channels.includes('email') && employee.email) {
      try {
        const emailService = EmailNotificationService.getEmailService()
        await emailService.send({
          to: employee.email,
          subject: title,
          textContent: message,
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                h2 { color: #6b3cc6; margin-bottom: 16px; }
                .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              ${htmlMessage}
              <div class="footer">
                <p>Diese Erinnerung wurde automatisch von Zeiterfassung gesendet.</p>
                <p>Du kannst deine Erinnerungseinstellungen in den Einstellungen anpassen.</p>
              </div>
            </body>
            </html>
          `
        })
        return true
      } catch (error) {
        console.error('Failed to send reminder email:', error)
      }
    }

    return false
  }

  static shouldTriggerReminder(
    settings: ReminderSettings,
    type: ReminderType,
    currentTime: Date = new Date()
  ): boolean {
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentDay = currentTime.getDay()

    switch (type) {
      case ReminderType.DAILY_UNDER_HOURS: {
        if (!settings.dailyReminder.enabled) return false
        const [targetHour, targetMinute] = settings.dailyReminder.time.split(':').map(Number)
        return currentHour === targetHour && currentMinute === targetMinute
      }

      case ReminderType.WEEKLY_UNDER_HOURS: {
        if (!settings.weeklyReminder.enabled) return false
        const [targetHour, targetMinute] = settings.weeklyReminder.time.split(':').map(Number)
        return (
          currentDay === settings.weeklyReminder.dayOfWeek &&
          currentHour === targetHour &&
          currentMinute === targetMinute
        )
      }

      case ReminderType.WEEK_COMPLETION: {
        if (!settings.weekCompletion.enabled) return false
        const [targetHour, targetMinute] = settings.weekCompletion.time.split(':').map(Number)
        return (
          currentDay === settings.weekCompletion.dayOfWeek &&
          currentHour === targetHour &&
          currentMinute === targetMinute
        )
      }

      default:
        return false
    }
  }
}
