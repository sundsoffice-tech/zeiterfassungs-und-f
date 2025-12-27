import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, CalendarCheck, Envelope, BellRinging, DeviceMobile } from '@phosphor-icons/react'
import { useReminderSettings } from '@/hooks/use-reminder-settings'
import { Employee } from '@/lib/types'

interface ReminderSettingsScreenProps {
  employee: Employee
}

export function ReminderSettingsScreen({ employee }: ReminderSettingsScreenProps) {
  const {
    settings,
    updateDailyReminder,
    updateWeeklyReminder,
    updateWeekCompletion,
    toggleDailyReminder,
    toggleWeeklyReminder,
    toggleWeekCompletion
  } = useReminderSettings(employee.id)

  const toggleChannel = (
    type: 'daily' | 'weekly' | 'weekCompletion',
    channel: 'email' | 'push' | 'in_app'
  ) => {
    const currentChannels = 
      type === 'daily' ? settings.dailyReminder.channels :
      type === 'weekly' ? settings.weeklyReminder.channels :
      settings.weekCompletion.channels

    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel]

    if (type === 'daily') {
      updateDailyReminder({ channels: newChannels })
    } else if (type === 'weekly') {
      updateWeeklyReminder({ channels: newChannels })
    } else {
      updateWeekCompletion({ channels: newChannels })
    }
  }

  const weekDays = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" weight="duotone" />
          Erinnerungen
        </h2>
        <p className="text-muted-foreground mt-1">
          Konfiguriere deine persönlichen Erinnerungen für die Zeiterfassung
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" weight="duotone" />
            Tägliche Erinnerung
          </CardTitle>
          <CardDescription>
            Erinnere mich, wenn ich meine Sollstunden noch nicht erreicht habe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-enabled" className="text-base">
              Aktiviert
            </Label>
            <Switch
              id="daily-enabled"
              checked={settings.dailyReminder.enabled}
              onCheckedChange={toggleDailyReminder}
            />
          </div>

          {settings.dailyReminder.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="daily-time">Uhrzeit</Label>
                <Input
                  id="daily-time"
                  type="time"
                  value={settings.dailyReminder.time}
                  onChange={(e) => updateDailyReminder({ time: e.target.value })}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-threshold">Sollstunden pro Tag</Label>
                <Input
                  id="daily-threshold"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={settings.dailyReminder.threshold}
                  onChange={(e) => updateDailyReminder({ threshold: parseFloat(e.target.value) })}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-3">
                <Label>Benachrichtigungskanäle</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={settings.dailyReminder.channels.includes('in_app') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('daily', 'in_app')}
                  >
                    <BellRinging className="h-4 w-4 mr-1" />
                    In-App
                  </Badge>
                  <Badge
                    variant={settings.dailyReminder.channels.includes('email') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('daily', 'email')}
                  >
                    <Envelope className="h-4 w-4 mr-1" />
                    E-Mail
                  </Badge>
                  <Badge
                    variant={settings.dailyReminder.channels.includes('push') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('daily', 'push')}
                  >
                    <DeviceMobile className="h-4 w-4 mr-1" />
                    Push
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-accent" weight="duotone" />
            Wöchentliche Erinnerung
          </CardTitle>
          <CardDescription>
            Erinnere mich, wenn meine Wochenstunden unter dem Soll liegen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-enabled" className="text-base">
              Aktiviert
            </Label>
            <Switch
              id="weekly-enabled"
              checked={settings.weeklyReminder.enabled}
              onCheckedChange={toggleWeeklyReminder}
            />
          </div>

          {settings.weeklyReminder.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weekly-day">Wochentag</Label>
                  <Select
                    value={settings.weeklyReminder.dayOfWeek.toString()}
                    onValueChange={(value) => updateWeeklyReminder({ dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger id="weekly-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly-time">Uhrzeit</Label>
                  <Input
                    id="weekly-time"
                    type="time"
                    value={settings.weeklyReminder.time}
                    onChange={(e) => updateWeeklyReminder({ time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekly-threshold">Sollstunden pro Woche</Label>
                <Input
                  id="weekly-threshold"
                  type="number"
                  min="1"
                  max="80"
                  step="1"
                  value={settings.weeklyReminder.threshold}
                  onChange={(e) => updateWeeklyReminder({ threshold: parseFloat(e.target.value) })}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-3">
                <Label>Benachrichtigungskanäle</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={settings.weeklyReminder.channels.includes('in_app') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekly', 'in_app')}
                  >
                    <BellRinging className="h-4 w-4 mr-1" />
                    In-App
                  </Badge>
                  <Badge
                    variant={settings.weeklyReminder.channels.includes('email') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekly', 'email')}
                  >
                    <Envelope className="h-4 w-4 mr-1" />
                    E-Mail
                  </Badge>
                  <Badge
                    variant={settings.weeklyReminder.channels.includes('push') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekly', 'push')}
                  >
                    <DeviceMobile className="h-4 w-4 mr-1" />
                    Push
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-accent" weight="duotone" />
            Wochenabschluss-Check
          </CardTitle>
          <CardDescription>
            Erinnere mich am Ende der Woche, meine Einträge zu überprüfen und zu vervollständigen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="completion-enabled" className="text-base">
              Aktiviert
            </Label>
            <Switch
              id="completion-enabled"
              checked={settings.weekCompletion.enabled}
              onCheckedChange={toggleWeekCompletion}
            />
          </div>

          {settings.weekCompletion.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completion-day">Wochentag</Label>
                  <Select
                    value={settings.weekCompletion.dayOfWeek.toString()}
                    onValueChange={(value) => updateWeekCompletion({ dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger id="completion-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion-time">Uhrzeit</Label>
                  <Input
                    id="completion-time"
                    type="time"
                    value={settings.weekCompletion.time}
                    onChange={(e) => updateWeekCompletion({ time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Benachrichtigungskanäle</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={settings.weekCompletion.channels.includes('in_app') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekCompletion', 'in_app')}
                  >
                    <BellRinging className="h-4 w-4 mr-1" />
                    In-App
                  </Badge>
                  <Badge
                    variant={settings.weekCompletion.channels.includes('email') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekCompletion', 'email')}
                  >
                    <Envelope className="h-4 w-4 mr-1" />
                    E-Mail
                  </Badge>
                  <Badge
                    variant={settings.weekCompletion.channels.includes('push') ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2"
                    onClick={() => toggleChannel('weekCompletion', 'push')}
                  >
                    <DeviceMobile className="h-4 w-4 mr-1" />
                    Push
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Über Erinnerungen</p>
              <p className="text-sm text-muted-foreground">
                Erinnerungen helfen dir, deine Zeiterfassung vollständig zu halten. Du kannst sie jederzeit anpassen oder deaktivieren.
                E-Mail-Benachrichtigungen werden nur versendet, wenn ein E-Mail-Dienst konfiguriert ist.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
