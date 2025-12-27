import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Bell, CheckCircle, Clock, CalendarCheck, Envelope } from '@phosphor-icons/react'
import { ReminderService, ReminderType } from '@/lib/reminder-service'
import { Employee, TimeEntry, Absence } from '@/lib/types'
import { useReminderSettings } from '@/hooks/use-reminder-settings'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface ReminderTestScreenProps {
  employee: Employee
  timeEntries: TimeEntry[]
  absences: Absence[]
}

export function ReminderTestScreen({ employee, timeEntries, absences }: ReminderTestScreenProps) {
  const { settings } = useReminderSettings(employee.id)
  const [testResults, setTestResults] = useState<{
    type: ReminderType
    result: boolean
    message: string
  }[]>([])

  const runDailyReminderTest = async () => {
    const check = ReminderService.checkDailyReminder(
      employee,
      timeEntries,
      settings,
      format(new Date(), 'yyyy-MM-dd')
    )

    const result = await ReminderService.sendReminderNotification(
      check,
      employee,
      settings
    )

    const { title, message } = ReminderService.createNotificationMessage(check, employee)

    setTestResults((prev) => [
      ...prev,
      {
        type: ReminderType.DAILY_UNDER_HOURS,
        result,
        message: check.shouldTrigger ? `${title}: ${message}` : 'Erinnerung nicht erforderlich (Sollstunden erreicht)'
      }
    ])

    if (check.shouldTrigger) {
      toast.success('Tägliche Erinnerung gesendet!', {
        description: `${check.data.actualHours.toFixed(1)}h von ${check.data.targetHours}h erfasst`
      })
    } else {
      toast.info('Tägliche Erinnerung nicht erforderlich', {
        description: 'Du hast deine Sollstunden erreicht!'
      })
    }
  }

  const runWeeklyReminderTest = async () => {
    const check = ReminderService.checkWeeklyReminder(
      employee,
      timeEntries,
      absences,
      settings
    )

    const result = await ReminderService.sendReminderNotification(
      check,
      employee,
      settings
    )

    const { title, message } = ReminderService.createNotificationMessage(check, employee)

    setTestResults((prev) => [
      ...prev,
      {
        type: ReminderType.WEEKLY_UNDER_HOURS,
        result,
        message: check.shouldTrigger ? `${title}: ${message}` : 'Erinnerung nicht erforderlich (Wochenstunden erreicht)'
      }
    ])

    if (check.shouldTrigger) {
      toast.success('Wöchentliche Erinnerung gesendet!', {
        description: `${check.data.actualHours.toFixed(1)}h von ${check.data.targetHours}h erfasst`
      })
    } else {
      toast.info('Wöchentliche Erinnerung nicht erforderlich', {
        description: 'Du hast deine Wochenstunden erreicht!'
      })
    }
  }

  const runWeekCompletionTest = async () => {
    const check = ReminderService.checkWeekCompletion(
      employee,
      timeEntries,
      absences,
      settings
    )

    const result = await ReminderService.sendReminderNotification(
      check,
      employee,
      settings
    )

    const { title, message } = ReminderService.createNotificationMessage(check, employee)

    setTestResults((prev) => [
      ...prev,
      {
        type: ReminderType.WEEK_COMPLETION,
        result,
        message: check.shouldTrigger ? `${title}: ${message}` : 'Erinnerung nicht erforderlich (Woche vollständig)'
      }
    ])

    if (check.shouldTrigger) {
      toast.success('Wochenabschluss-Erinnerung gesendet!', {
        description: `${check.data.missingDays?.length || 0} fehlende Tage`
      })
    } else {
      toast.info('Wochenabschluss-Erinnerung nicht erforderlich', {
        description: 'Deine Woche ist vollständig!'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" weight="duotone" />
          Erinnerungen Testen
        </h2>
        <p className="text-muted-foreground mt-1">
          Teste die Erinnerungsfunktionen und sieh, wie sie funktionieren
        </p>
      </div>

      <Alert>
        <Bell className="h-4 w-4" />
        <AlertTitle>Test-Modus</AlertTitle>
        <AlertDescription>
          Dieser Bildschirm ermöglicht es dir, die verschiedenen Erinnerungstypen zu testen.
          In der Produktion werden diese automatisch basierend auf deinen Einstellungen ausgelöst.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" weight="duotone" />
            Tägliche Erinnerung testen
          </CardTitle>
          <CardDescription>
            Simuliert eine tägliche Stunden-Erinnerung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {settings.dailyReminder.enabled ? 'Aktiviert' : 'Deaktiviert'}
              </p>
            </div>
            <div>
              <p className="font-medium">Sollstunden</p>
              <p className="text-sm text-muted-foreground">
                {settings.dailyReminder.threshold}h
              </p>
            </div>
            <div>
              <p className="font-medium">Kanäle</p>
              <div className="flex gap-1 mt-1">
                {settings.dailyReminder.channels.map(channel => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel === 'in_app' && 'In-App'}
                    {channel === 'email' && 'E-Mail'}
                    {channel === 'push' && 'Push'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={runDailyReminderTest} className="w-full gap-2">
            <Bell className="h-4 w-4" />
            Tägliche Erinnerung jetzt testen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-accent" weight="duotone" />
            Wöchentliche Erinnerung testen
          </CardTitle>
          <CardDescription>
            Simuliert eine wöchentliche Stunden-Erinnerung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {settings.weeklyReminder.enabled ? 'Aktiviert' : 'Deaktiviert'}
              </p>
            </div>
            <div>
              <p className="font-medium">Sollstunden</p>
              <p className="text-sm text-muted-foreground">
                {settings.weeklyReminder.threshold}h
              </p>
            </div>
            <div>
              <p className="font-medium">Kanäle</p>
              <div className="flex gap-1 mt-1">
                {settings.weeklyReminder.channels.map(channel => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel === 'in_app' && 'In-App'}
                    {channel === 'email' && 'E-Mail'}
                    {channel === 'push' && 'Push'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={runWeeklyReminderTest} className="w-full gap-2">
            <Bell className="h-4 w-4" />
            Wöchentliche Erinnerung jetzt testen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-accent" weight="duotone" />
            Wochenabschluss-Check testen
          </CardTitle>
          <CardDescription>
            Simuliert einen Wochenabschluss-Check
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {settings.weekCompletion.enabled ? 'Aktiviert' : 'Deaktiviert'}
              </p>
            </div>
            <div>
              <p className="font-medium">Kanäle</p>
              <div className="flex gap-1 mt-1">
                {settings.weekCompletion.channels.map(channel => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel === 'in_app' && 'In-App'}
                    {channel === 'email' && 'E-Mail'}
                    {channel === 'push' && 'Push'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={runWeekCompletionTest} className="w-full gap-2">
            <Bell className="h-4 w-4" />
            Wochenabschluss-Check jetzt testen
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test-Ergebnisse</CardTitle>
            <CardDescription>
              Verlauf der durchgeführten Tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.reverse().map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`rounded-full p-1 ${result.result ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {result.result ? (
                      <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                    ) : (
                      <Bell className="h-4 w-4 text-blue-600" weight="fill" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {result.type === ReminderType.DAILY_UNDER_HOURS && 'Tägliche Erinnerung'}
                      {result.type === ReminderType.WEEKLY_UNDER_HOURS && 'Wöchentliche Erinnerung'}
                      {result.type === ReminderType.WEEK_COMPLETION && 'Wochenabschluss-Check'}
                    </p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
