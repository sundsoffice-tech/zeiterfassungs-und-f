import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ReminderService, ReminderType } from '@/lib/reminder-service'
import { useReminderSettings } from './use-reminder-settings'
import { Employee, TimeEntry, Absence } from '@/lib/types'

export function useReminderProcessor(
  employee: Employee | null,
  timeEntries: TimeEntry[],
  absences: Absence[]
) {
  const { settings } = useReminderSettings(employee?.id || '')
  const [lastChecked, setLastChecked] = useKV<string>(
    `reminder-last-checked-${employee?.id}`,
    ''
  )

  useEffect(() => {
    if (!employee) return

    const checkAndSendReminders = async () => {
      const now = new Date()
      const currentTimeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`

      if (lastChecked === currentTimeKey) {
        return
      }

      const checks = [
        {
          type: ReminderType.DAILY_UNDER_HOURS,
          check: () => ReminderService.checkDailyReminder(employee, timeEntries, settings)
        },
        {
          type: ReminderType.WEEKLY_UNDER_HOURS,
          check: () => ReminderService.checkWeeklyReminder(employee, timeEntries, absences, settings)
        },
        {
          type: ReminderType.WEEK_COMPLETION,
          check: () => ReminderService.checkWeekCompletion(employee, timeEntries, absences, settings)
        }
      ]

      for (const { type, check } of checks) {
        if (ReminderService.shouldTriggerReminder(settings, type, now)) {
          const reminderCheck = check()
          if (reminderCheck.shouldTrigger) {
            await ReminderService.sendReminderNotification(
              reminderCheck,
              employee,
              settings
            )
          }
        }
      }

      setLastChecked(currentTimeKey)
    }

    checkAndSendReminders()

    const interval = setInterval(checkAndSendReminders, 60000)

    return () => clearInterval(interval)
  }, [employee, timeEntries, absences, settings, lastChecked, setLastChecked])
}
