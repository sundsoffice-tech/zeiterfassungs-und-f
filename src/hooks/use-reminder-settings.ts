import { useKV } from '@github/spark/hooks'
import { ReminderSettings, ReminderService } from '@/lib/reminder-service'

export function useReminderSettings(employeeId: string) {
  const [settings, setSettings] = useKV<ReminderSettings>(
    `reminder-settings-${employeeId}`,
    ReminderService.getDefaultSettings(employeeId)
  )

  const currentSettings = settings || ReminderService.getDefaultSettings(employeeId)

  return {
    settings: currentSettings,
    setSettings,
    
    updateDailyReminder: (updates: Partial<ReminderSettings['dailyReminder']>) => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          dailyReminder: {
            ...base.dailyReminder,
            ...updates
          }
        }
      })
    },
    
    updateWeeklyReminder: (updates: Partial<ReminderSettings['weeklyReminder']>) => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          weeklyReminder: {
            ...base.weeklyReminder,
            ...updates
          }
        }
      })
    },
    
    updateWeekCompletion: (updates: Partial<ReminderSettings['weekCompletion']>) => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          weekCompletion: {
            ...base.weekCompletion,
            ...updates
          }
        }
      })
    },
    
    toggleDailyReminder: () => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          dailyReminder: {
            ...base.dailyReminder,
            enabled: !base.dailyReminder.enabled
          }
        }
      })
    },
    
    toggleWeeklyReminder: () => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          weeklyReminder: {
            ...base.weeklyReminder,
            enabled: !base.weeklyReminder.enabled
          }
        }
      })
    },
    
    toggleWeekCompletion: () => {
      setSettings((current) => {
        const base = current || ReminderService.getDefaultSettings(employeeId)
        return {
          ...base,
          weekCompletion: {
            ...base.weekCompletion,
            enabled: !base.weekCompletion.enabled
          }
        }
      })
    }
  }
}
