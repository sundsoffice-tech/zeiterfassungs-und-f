import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, Clock, CalendarCheck, ArrowRight } from '@phosphor-icons/react'
import { ReminderService, ReminderCheck, ReminderType } from '@/lib/reminder-service'
import { Employee, TimeEntry, Absence } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useReminderSettings } from '@/hooks/use-reminder-settings'
import { motion, AnimatePresence } from 'framer-motion'

interface ReminderNotificationDisplayProps {
  employee: Employee
  timeEntries: TimeEntry[]
  absences: Absence[]
  onNavigate?: (tab: string) => void
}

export function ReminderNotificationDisplay({
  employee,
  timeEntries,
  absences,
  onNavigate
}: ReminderNotificationDisplayProps) {
  const { settings } = useReminderSettings(employee.id)
  const [activeReminders, setActiveReminders] = useState<ReminderCheck[]>([])
  const [dismissedReminders, setDismissedReminders] = useKV<string[]>(
    `dismissed-reminders-${employee.id}-${format(new Date(), 'yyyy-MM-dd')}`,
    []
  )

  useEffect(() => {
    const checkReminders = () => {
      const reminders: ReminderCheck[] = []

      const dailyCheck = ReminderService.checkDailyReminder(
        employee,
        timeEntries,
        settings
      )
      if (dailyCheck.shouldTrigger && !dismissedReminders?.includes(ReminderType.DAILY_UNDER_HOURS)) {
        reminders.push(dailyCheck)
      }

      const weeklyCheck = ReminderService.checkWeeklyReminder(
        employee,
        timeEntries,
        absences,
        settings
      )
      if (weeklyCheck.shouldTrigger && !dismissedReminders?.includes(ReminderType.WEEKLY_UNDER_HOURS)) {
        reminders.push(weeklyCheck)
      }

      const completionCheck = ReminderService.checkWeekCompletion(
        employee,
        timeEntries,
        absences,
        settings
      )
      if (completionCheck.shouldTrigger && !dismissedReminders?.includes(ReminderType.WEEK_COMPLETION)) {
        reminders.push(completionCheck)
      }

      setActiveReminders(reminders)
    }

    checkReminders()
    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [employee, timeEntries, absences, settings, dismissedReminders])

  const dismissReminder = (type: ReminderType) => {
    setDismissedReminders((current) => [...(current || []), type])
  }

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case ReminderType.DAILY_UNDER_HOURS:
        return <Clock className="h-5 w-5" weight="duotone" />
      case ReminderType.WEEKLY_UNDER_HOURS:
      case ReminderType.WEEK_COMPLETION:
        return <CalendarCheck className="h-5 w-5" weight="duotone" />
      default:
        return <Bell className="h-5 w-5" weight="duotone" />
    }
  }

  const getReminderColor = (type: ReminderType) => {
    switch (type) {
      case ReminderType.DAILY_UNDER_HOURS:
        return 'bg-accent/10 border-accent/20 text-accent-foreground'
      case ReminderType.WEEKLY_UNDER_HOURS:
        return 'bg-primary/10 border-primary/20 text-primary-foreground'
      case ReminderType.WEEK_COMPLETION:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-900'
      default:
        return 'bg-muted border-border'
    }
  }

  if (activeReminders.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {activeReminders.map((reminder) => {
          const { title, message } = ReminderService.createNotificationMessage(reminder, employee)
          
          return (
            <motion.div
              key={reminder.type}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Card className={`border-2 ${getReminderColor(reminder.type)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-background/80 p-2.5 backdrop-blur-sm">
                      {getReminderIcon(reminder.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => dismissReminder(reminder.type)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {reminder.data.actualHours.toFixed(1)}h
                          </Badge>
                          <span className="text-muted-foreground">von</span>
                          <Badge variant="outline" className="font-mono">
                            {reminder.data.targetHours}h
                          </Badge>
                        </div>

                        {reminder.data.difference > 0 && (
                          <Badge variant="destructive" className="font-mono">
                            -{reminder.data.difference.toFixed(1)}h
                          </Badge>
                        )}
                      </div>

                      {reminder.data.missingDays && reminder.data.missingDays.length > 0 && (
                        <div className="rounded-lg bg-background/80 backdrop-blur-sm p-3 space-y-2">
                          <p className="text-sm font-medium">Fehlende Tage:</p>
                          <div className="flex flex-wrap gap-2">
                            {reminder.data.missingDays.map(date => (
                              <Badge key={date} variant="outline" className="text-xs">
                                {format(parseISO(date), 'dd.MM. (EEEE)', { locale: de })}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => onNavigate?.('today')}
                          className="gap-2"
                        >
                          Zeit erfassen
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        {reminder.type !== ReminderType.DAILY_UNDER_HOURS && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate?.('week')}
                          >
                            Wochenansicht
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
