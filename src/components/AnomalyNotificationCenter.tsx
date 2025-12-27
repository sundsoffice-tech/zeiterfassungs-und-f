import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, PaperPlaneTilt, CheckCircle, XCircle, Clock, Users, Gear } from '@phosphor-icons/react'
import { Employee, TimeEntry, Absence } from '@/lib/types'
import { GapOvertimeDetector } from '@/lib/gap-overtime-detection'
import { EmailNotificationService, EmailNotification, NotificationPreferences } from '@/lib/email-notifications'
import { EmailConfig } from '@/lib/email-service'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AnomalyNotificationCenterProps {
  employees: Employee[]
  timeEntries: TimeEntry[]
  absences: Absence[]
}

export function AnomalyNotificationCenter({
  employees,
  timeEntries,
  absences
}: AnomalyNotificationCenterProps) {
  const [sentNotifications, setSentNotifications] = useKV<EmailNotification[]>('sent-anomaly-notifications', [])
  const [emailConfig] = useKV<EmailConfig>('email-config', {
    provider: 'none',
    fromEmail: 'noreply@zeiterfassung.app',
    fromName: 'Zeiterfassung'
  })
  const [sending, setSending] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const isEmailConfigured = emailConfig?.provider !== 'none' && !!emailConfig?.apiKey

  const analyzeAndSendNotifications = async (employeeIds?: string[]) => {
    setSending(true)
    const notifications: EmailNotification[] = []

    try {
      const targetEmployees = employeeIds 
        ? employees.filter((e) => employeeIds.includes(e.id))
        : employees

      for (const employee of targetEmployees) {
        const analysis = GapOvertimeDetector.analyzeLast7Days(employee, timeEntries, absences)
        
        if (analysis.issues.length === 0) {
          continue
        }

        const preferencesKey = `notification-preferences-${employee.id}`
        const storedPreferences = await window.spark.kv.get<NotificationPreferences>(preferencesKey)
        const preferences = storedPreferences || EmailNotificationService.getDefaultPreferences(employee.id)

        const notification = await EmailNotificationService.sendAnomalyNotification(
          employee,
          analysis,
          preferences,
          window.location.origin
        )

        if (notification) {
          notifications.push(notification)
        }
      }

      if (notifications.length > 0) {
        setSentNotifications((current) => [...notifications, ...(current || [])])
        toast.success(`${notifications.length} Benachrichtigung${notifications.length > 1 ? 'en' : ''} gesendet`)
      } else {
        toast.info('Keine Benachrichtigungen zu senden')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Fehler beim Senden der Benachrichtigungen')
    } finally {
      setSending(false)
    }
  }

  const sendToAllEmployees = async () => {
    const employeesWithAnomalies = employees.filter((employee) => {
      const analysis = GapOvertimeDetector.analyzeLast7Days(employee, timeEntries, absences)
      return analysis.issues.length > 0
    })

    if (employeesWithAnomalies.length === 0) {
      toast.info('Keine Mitarbeiter mit Anomalien gefunden')
      return
    }

    await analyzeAndSendNotifications(employeesWithAnomalies.map((e) => e.id))
  }

  const sendToSingleEmployee = async (employeeId: string) => {
    await analyzeAndSendNotifications([employeeId])
  }

  const employeesWithAnomalies = employees.map((employee) => {
    const analysis = GapOvertimeDetector.analyzeLast7Days(employee, timeEntries, absences)
    return {
      employee,
      analysis,
      hasAnomalies: analysis.issues.length > 0
    }
  }).filter((item) => item.hasAnomalies)

  const clearHistory = () => {
    setSentNotifications([])
    toast.success('Verlauf gelöscht')
  }

  return (
    <div className="space-y-6">
      {!isEmailConfigured && (
        <Alert>
          <Gear className="h-4 w-4" />
          <AlertDescription>
            <strong>E-Mail-Dienst nicht konfiguriert:</strong> E-Mails werden nur simuliert und in der Browser-Konsole angezeigt. 
            Bitte konfigurieren Sie einen E-Mail-Dienst unter <strong>E-Mail-Konfiguration</strong>, um echte E-Mails zu versenden.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <EnvelopeSimple className="h-5 w-5" weight="duotone" />
                Anomalie-Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Senden Sie E-Mail-Benachrichtigungen an Mitarbeiter mit erkannten Zeiterfassungs-Anomalien
              </CardDescription>
            </div>
            <Badge variant={isEmailConfigured ? 'default' : 'secondary'}>
              {isEmailConfigured ? '✓ Konfiguriert' : 'Simuliert'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <Users className="h-10 w-10 text-muted-foreground" weight="duotone" />
            <div className="flex-1">
              <div className="text-2xl font-bold">{employeesWithAnomalies.length}</div>
              <div className="text-sm text-muted-foreground">
                Mitarbeiter mit Anomalien
              </div>
            </div>
            <Button
              onClick={sendToAllEmployees}
              disabled={sending || employeesWithAnomalies.length === 0}
              className="gap-2"
            >
              <PaperPlaneTilt className="h-4 w-4" weight="duotone" />
              An alle senden
            </Button>
          </div>

          {employeesWithAnomalies.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Betroffene Mitarbeiter</h4>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {employeesWithAnomalies.map(({ employee, analysis }) => (
                      <div
                        key={employee.id}
                        className={cn(
                          'p-3 rounded-lg border transition-colors',
                          selectedEmployeeId === employee.id ? 'border-primary bg-primary/5' : 'bg-card hover:border-muted-foreground/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-1">{employee.name}</div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {employee.email || 'Keine E-Mail-Adresse'}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {analysis.summary.totalGaps} Lücke{analysis.summary.totalGaps !== 1 ? 'n' : ''}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {analysis.summary.totalOvertime} Überstunden-Tag{analysis.summary.totalOvertime !== 1 ? 'e' : ''}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {analysis.issues.length} Problem{analysis.issues.length !== 1 ? 'e' : ''}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendToSingleEmployee(employee.id)}
                            disabled={sending || !employee.email}
                            className="gap-2"
                          >
                            <PaperPlaneTilt className="h-3 w-3" weight="duotone" />
                            Senden
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" weight="duotone" />
                Gesendete Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Verlauf der gesendeten E-Mail-Benachrichtigungen
              </CardDescription>
            </div>
            {sentNotifications && sentNotifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Verlauf löschen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!sentNotifications || sentNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <EnvelopeSimple className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p>Noch keine Benachrichtigungen gesendet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {[...(sentNotifications || [])].reverse().map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      notification.status === 'sent' && 'bg-green-50 border-green-200',
                      notification.status === 'failed' && 'bg-red-50 border-red-200',
                      notification.status === 'pending' && 'bg-yellow-50 border-yellow-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.status === 'sent' && (
                          <CheckCircle className="h-5 w-5 text-green-600" weight="duotone" />
                        )}
                        {notification.status === 'failed' && (
                          <XCircle className="h-5 w-5 text-red-600" weight="duotone" />
                        )}
                        {notification.status === 'pending' && (
                          <Clock className="h-5 w-5 text-yellow-600" weight="duotone" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-semibold text-sm">{notification.subject}</div>
                          <Badge
                            variant={
                              notification.status === 'sent'
                                ? 'default'
                                : notification.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {notification.status === 'sent' && 'Gesendet'}
                            {notification.status === 'failed' && 'Fehler'}
                            {notification.status === 'pending' && 'Ausstehend'}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground mb-2">
                          An: {notification.to}
                        </div>

                        {notification.sentAt && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(notification.sentAt), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                          </div>
                        )}

                        {notification.status === 'failed' && notification.error && (
                          <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                            Fehler: {notification.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
