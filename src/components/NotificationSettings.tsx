import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bell, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react'
import { NotificationPreferences, NotificationFrequency, NotificationChannel } from '@/lib/email-notifications'
import { Severity } from '@/lib/gap-overtime-detection'
import { useNotificationPreferences } from '@/hooks/use-notification-preferences'
import { Employee } from '@/lib/types'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  employee: Employee
}

export function NotificationSettings({ employee }: NotificationSettingsProps) {
  const { preferences, updateAnomalySettings, updateReminderSettings, updateApprovalSettings } =
    useNotificationPreferences(employee.id)

  const handleAnomalyEnabledChange = (enabled: boolean) => {
    updateAnomalySettings({ enabled })
    toast.success(enabled ? 'Anomalie-Benachrichtigungen aktiviert' : 'Anomalie-Benachrichtigungen deaktiviert')
  }

  const handleAnomalyFrequencyChange = (frequency: NotificationFrequency) => {
    updateAnomalySettings({ frequency })
    toast.success('Benachrichtigungshäufigkeit aktualisiert')
  }

  const handleAnomalySeverityChange = (severity: Severity) => {
    updateAnomalySettings({ severityThreshold: severity })
    toast.success('Schweregrad-Filter aktualisiert')
  }

  const handleAnomalyChannelToggle = (channel: NotificationChannel) => {
    const currentChannels = preferences.anomalyDetection.channels
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel]

    if (newChannels.length === 0) {
      toast.error('Mindestens ein Kanal muss aktiviert sein')
      return
    }

    updateAnomalySettings({ channels: newChannels })
    toast.success('Benachrichtigungskanäle aktualisiert')
  }

  const handleReminderEnabledChange = (enabled: boolean) => {
    updateReminderSettings({ enabled })
    toast.success(enabled ? 'Erinnerungen aktiviert' : 'Erinnerungen deaktiviert')
  }

  const handleApprovalEnabledChange = (enabled: boolean) => {
    updateApprovalSettings({ enabled })
    toast.success(enabled ? 'Genehmigungs-Benachrichtigungen aktiviert' : 'Genehmigungs-Benachrichtigungen deaktiviert')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" weight="duotone" />
          Benachrichtigungseinstellungen
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre E-Mail- und In-App-Benachrichtigungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Anomalie-Erkennung</Label>
              <p className="text-sm text-muted-foreground">
                Benachrichtigungen bei Zeiterfassungs-Anomalien
              </p>
            </div>
            <Switch
              checked={preferences.anomalyDetection.enabled}
              onCheckedChange={handleAnomalyEnabledChange}
            />
          </div>

          {preferences.anomalyDetection.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="anomaly-frequency">Häufigkeit</Label>
                <Select
                  value={preferences.anomalyDetection.frequency}
                  onValueChange={(value) => handleAnomalyFrequencyChange(value as NotificationFrequency)}
                >
                  <SelectTrigger id="anomaly-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationFrequency.IMMEDIATE}>
                      Sofort
                    </SelectItem>
                    <SelectItem value={NotificationFrequency.DAILY_DIGEST}>
                      Täglich (Zusammenfassung)
                    </SelectItem>
                    <SelectItem value={NotificationFrequency.WEEKLY_DIGEST}>
                      Wöchentlich (Zusammenfassung)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {preferences.anomalyDetection.frequency === NotificationFrequency.IMMEDIATE &&
                    'Sie erhalten Benachrichtigungen sofort, wenn Anomalien erkannt werden.'}
                  {preferences.anomalyDetection.frequency === NotificationFrequency.DAILY_DIGEST &&
                    'Sie erhalten eine tägliche Zusammenfassung aller Anomalien.'}
                  {preferences.anomalyDetection.frequency === NotificationFrequency.WEEKLY_DIGEST &&
                    'Sie erhalten eine wöchentliche Zusammenfassung aller Anomalien.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anomaly-severity">Schweregrad-Filter</Label>
                <Select
                  value={preferences.anomalyDetection.severityThreshold}
                  onValueChange={(value) => handleAnomalySeverityChange(value as Severity)}
                >
                  <SelectTrigger id="anomaly-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Severity.LOW}>
                      Niedrig und höher
                    </SelectItem>
                    <SelectItem value={Severity.MEDIUM}>
                      Mittel und höher
                    </SelectItem>
                    <SelectItem value={Severity.HIGH}>
                      Nur Hoch
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Benachrichtigungen nur für Anomalien mit diesem Schweregrad oder höher.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Benachrichtigungskanäle</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <EnvelopeSimple className="h-5 w-5 text-muted-foreground" weight="duotone" />
                      <div>
                        <div className="font-medium text-sm">E-Mail</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.email || 'Keine E-Mail-Adresse hinterlegt'}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.anomalyDetection.channels.includes(NotificationChannel.EMAIL)}
                      onCheckedChange={() => handleAnomalyChannelToggle(NotificationChannel.EMAIL)}
                      disabled={!employee.email}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" weight="duotone" />
                      <div>
                        <div className="font-medium text-sm">In-App</div>
                        <div className="text-xs text-muted-foreground">
                          Benachrichtigungen in der Anwendung
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.anomalyDetection.channels.includes(NotificationChannel.IN_APP)}
                      onCheckedChange={() => handleAnomalyChannelToggle(NotificationChannel.IN_APP)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Erinnerungen</Label>
            <p className="text-sm text-muted-foreground">
              Erinnerungen für fehlende Zeiteinträge
            </p>
          </div>
          <Switch
            checked={preferences.reminderNotifications.enabled}
            onCheckedChange={handleReminderEnabledChange}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Genehmigungen</Label>
            <p className="text-sm text-muted-foreground">
              Benachrichtigungen zu Genehmigungs-Status
            </p>
          </div>
          <Switch
            checked={preferences.approvalNotifications.enabled}
            onCheckedChange={handleApprovalEnabledChange}
          />
        </div>

        {!employee.email && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-sm">
            <div className="flex gap-3">
              <EnvelopeSimple className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" weight="duotone" />
              <div>
                <div className="font-semibold mb-1">E-Mail-Adresse hinzufügen</div>
                <div className="text-muted-foreground">
                  Um E-Mail-Benachrichtigungen zu erhalten, fügen Sie bitte eine E-Mail-Adresse in Ihrem Profil hinzu.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
