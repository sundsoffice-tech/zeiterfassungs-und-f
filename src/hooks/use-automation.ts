import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { format, getDay } from 'date-fns'
import {
  RecurringEntry,
  AutomationRule,
  Reminder,
  AppSettings,
  TimeEntry,
  ActiveTimer
} from '@/lib/types'
import {
  shouldCreateRecurringEntry,
  createTimeEntryFromRecurring,
  checkAutoStartTimer,
  checkAutoTagging,
  checkReminders,
  createDefaultReminders,
  getDefaultAppSettings,
  calculateHoursWorkedToday,
  hasTimeEntriesToday
} from '@/lib/automation'
import { toast } from 'sonner'

export function useAutomation(
  employees: any[],
  timeEntries: TimeEntry[],
  setTimeEntries: (fn: (prev: TimeEntry[]) => TimeEntry[]) => void,
  activeTimer: ActiveTimer | null,
  setActiveTimer: (timer: ActiveTimer | null) => void
) {
  const [recurringEntries, setRecurringEntries] = useKV<RecurringEntry[]>('recurring_entries', [])
  const [automationRules, setAutomationRules] = useKV<AutomationRule[]>('automation_rules', [])
  const [reminders, setReminders] = useKV<Reminder[]>('reminders', [])
  const [appSettings, setAppSettings] = useKV<AppSettings>('app_settings', getDefaultAppSettings('default-tenant'))
  const [lastCheckTime, setLastCheckTime] = useState<string>('')

  useEffect(() => {
    if (!employees || employees.length === 0) return
    if (!appSettings) return

    const currentEmployee = employees[0]

    checkRecurringEntries(currentEmployee)
    
    const interval = setInterval(() => {
      checkRecurringEntries(currentEmployee)
      checkActiveReminders(currentEmployee)
    }, 60000)

    return () => clearInterval(interval)
  }, [employees, recurringEntries, appSettings, timeEntries])

  useEffect(() => {
    if (!employees || employees.length === 0) return
    if (!appSettings || !appSettings.autoStartTimer) return
    
    const currentEmployee = employees[0]
    handleAutoStartTimer(currentEmployee)
  }, [])

  const checkRecurringEntries = (employee: any) => {
    if (!recurringEntries || recurringEntries.length === 0) return

    recurringEntries.forEach(recurring => {
      if (shouldCreateRecurringEntry(recurring)) {
        const newEntry = createTimeEntryFromRecurring(
          recurring,
          employee.id,
          'default-tenant'
        )

        setTimeEntries((prev) => [
          ...prev,
          { ...newEntry, id: `time-${Date.now()}-${Math.random()}` }
        ])

        setRecurringEntries((prev) =>
          (prev || []).map(r =>
            r.id === recurring.id
              ? { ...r, lastCreated: format(new Date(), 'yyyy-MM-dd') }
              : r
          )
        )

        toast.success(`Wiederkehrender Eintrag erstellt: ${recurring.name}`)
      }
    })
  }

  const handleAutoStartTimer = (employee: any) => {
    if (activeTimer) return

    const now = new Date()
    const context = {
      timeOfDay: format(now, 'HH:mm'),
      dayOfWeek: getDay(now),
      appOpened: true
    }

    const matchedRule = checkAutoStartTimer(automationRules || [], context)

    if (matchedRule && matchedRule.actions.startTimer) {
      const newTimer: ActiveTimer = {
        id: `timer-${Date.now()}`,
        employeeId: employee.id,
        projectId: matchedRule.actions.startTimer.projectId,
        phaseId: matchedRule.actions.startTimer.phaseId,
        taskId: matchedRule.actions.startTimer.taskId,
        startTime: Date.now(),
        pausedDuration: 0,
        billable: true,
        isPaused: false
      }

      setActiveTimer(newTimer)
      toast.success('Timer automatisch gestartet')
    }
  }

  const checkActiveReminders = (employee: any) => {
    if (!appSettings || !reminders || reminders.length === 0) return

    const now = new Date()
    const currentTime = format(now, 'HH:mm')
    const currentMinute = `${currentTime}`

    if (lastCheckTime === currentMinute) return
    setLastCheckTime(currentMinute)

    const hoursWorked = calculateHoursWorkedToday(timeEntries || [], employee.id)
    const hasEntries = hasTimeEntriesToday(timeEntries || [], employee.id)

    const context = {
      currentTime,
      dayOfWeek: getDay(now),
      hoursWorked,
      hasTimeEntriesToday: hasEntries,
      timesheetSubmitted: false
    }

    const triggered = checkReminders(reminders, context)

    triggered.forEach(reminder => {
      toast.warning(reminder.title, {
        description: reminder.message,
        duration: 10000,
        action: {
          label: 'Verstanden',
          onClick: () => {
            setReminders((prev) =>
              (prev || []).map(r =>
                r.id === reminder.id
                  ? { ...r, dismissed: true, dismissedAt: new Date().toISOString() }
                  : r
              )
            )
          }
        }
      })
    })
  }

  return {
    recurringEntries,
    setRecurringEntries,
    automationRules,
    setAutomationRules,
    reminders,
    setReminders,
    appSettings,
    setAppSettings
  }
}
