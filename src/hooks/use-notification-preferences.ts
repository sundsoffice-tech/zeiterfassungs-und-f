import { useKV } from '@github/spark/hooks'
import { NotificationPreferences, EmailNotificationService } from '@/lib/email-notifications'

export function useNotificationPreferences(employeeId: string) {
  const [preferences, setPreferences] = useKV<NotificationPreferences>(
    `notification-preferences-${employeeId}`,
    EmailNotificationService.getDefaultPreferences(employeeId)
  )

  return {
    preferences: preferences || EmailNotificationService.getDefaultPreferences(employeeId),
    setPreferences,
    updateAnomalySettings: (updates: Partial<NotificationPreferences['anomalyDetection']>) => {
      setPreferences((current) => {
        const base = current || EmailNotificationService.getDefaultPreferences(employeeId)
        return {
          ...base,
          anomalyDetection: {
            ...base.anomalyDetection,
            ...updates
          }
        }
      })
    },
    updateReminderSettings: (updates: Partial<NotificationPreferences['reminderNotifications']>) => {
      setPreferences((current) => {
        const base = current || EmailNotificationService.getDefaultPreferences(employeeId)
        return {
          ...base,
          reminderNotifications: {
            ...base.reminderNotifications,
            ...updates
          }
        }
      })
    },
    updateApprovalSettings: (updates: Partial<NotificationPreferences['approvalNotifications']>) => {
      setPreferences((current) => {
        const base = current || EmailNotificationService.getDefaultPreferences(employeeId)
        return {
          ...base,
          approvalNotifications: {
            ...base.approvalNotifications,
            ...updates
          }
        }
      })
    }
  }
}
