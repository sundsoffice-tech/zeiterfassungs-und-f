import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Repeat, Lightning, Bell, Plus, Trash, Play, MapPin } from '@phosphor-icons/react'
import { RecurringEntry, AutomationRule, Reminder, AppSettings, Employee, Project } from '@/lib/types'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface AutomationScreenProps {
  recurringEntries: RecurringEntry[]
  setRecurringEntries: (fn: (prev: RecurringEntry[]) => RecurringEntry[]) => void
  automationRules: AutomationRule[]
  setAutomationRules: (fn: (prev: AutomationRule[]) => AutomationRule[]) => void
  reminders: Reminder[]
  setReminders: (fn: (prev: Reminder[]) => Reminder[]) => void
  appSettings: AppSettings
  setAppSettings: (settings: AppSettings) => void
  employees: Employee[]
  projects: Project[]
}

export function AutomationScreen({
  recurringEntries,
  setRecurringEntries,
  automationRules,
  setAutomationRules,
  reminders,
  setReminders,
  appSettings,
  setAppSettings,
  employees,
  projects
}: AutomationScreenProps) {
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)

  const handleToggleRecurring = (id: string) => {
    setRecurringEntries((prev) =>
      (prev || []).map(entry =>
        entry.id === id ? { ...entry, active: !entry.active } : entry
      )
    )
  }

  const handleDeleteRecurring = (id: string) => {
    setRecurringEntries((prev) => (prev || []).filter(entry => entry.id !== id))
    toast.success('Wiederkehrender Eintrag gelöscht')
  }

  const handleToggleRule = (id: string) => {
    setAutomationRules((prev) =>
      (prev || []).map(rule =>
        rule.id === id ? { ...rule, active: !rule.active } : rule
      )
    )
  }

  const handleDeleteRule = (id: string) => {
    setAutomationRules((prev) => (prev || []).filter(rule => rule.id !== id))
    toast.success('Automatisierungsregel gelöscht')
  }

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      (prev || []).map(reminder =>
        reminder.id === id ? { ...reminder, active: !reminder.active, dismissed: false } : reminder
      )
    )
  }

  const handleAddRecurring = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newEntry: RecurringEntry = {
      id: `recurring-${Date.now()}`,
      tenantId: 'default-tenant',
      employeeId: employees[0]?.id || '',
      projectId: formData.get('projectId') as string,
      name: formData.get('name') as string,
      duration: parseInt(formData.get('duration') as string) || undefined,
      notes: formData.get('notes') as string || undefined,
      billable: formData.get('billable') === 'on',
      schedule: {
        frequency: formData.get('frequency') as 'daily' | 'weekly' | 'monthly',
        time: formData.get('time') as string || '09:00',
        daysOfWeek: formData.get('frequency') === 'weekly' 
          ? [1, 2, 3, 4, 5]
          : undefined
      },
      active: true,
      audit: {
        createdBy: 'user',
        createdAt: new Date().toISOString(),
        device: 'web'
      }
    }

    setRecurringEntries((prev) => [...(prev || []), newEntry])
    setIsRecurringDialogOpen(false)
    toast.success('Wiederkehrender Eintrag erstellt')
  }

  const handleAddAutoStartRule = () => {
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      tenantId: 'default-tenant',
      name: 'Auto-Start beim App-Öffnen',
      type: 'auto_start_timer',
      active: true,
      conditions: {
        appOpened: true,
        timeOfDay: { start: '08:00', end: '18:00' },
        dayOfWeek: [1, 2, 3, 4, 5]
      },
      actions: {
        startTimer: {
          projectId: projects[0]?.id || ''
        }
      },
      priority: 1,
      audit: {
        createdBy: 'user',
        createdAt: new Date().toISOString(),
        device: 'web'
      }
    }

    setAutomationRules((prev) => [...(prev || []), newRule])
    setIsRuleDialogOpen(false)
    toast.success('Automatisierungsregel erstellt')
  }

  const handleUpdateSettings = (key: keyof AppSettings, value: any) => {
    setAppSettings({
      ...appSettings,
      [key]: value
    })
    toast.success('Einstellungen aktualisiert')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Automatisierung</h2>
        <p className="text-muted-foreground">
          Zeiterfassung automatisieren - wiederkehrende Einträge, intelligente Regeln und Erinnerungen
        </p>
      </div>

      <Tabs defaultValue="recurring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recurring" className="gap-2">
            <Repeat className="h-4 w-4" weight="duotone" />
            Wiederkehrend
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Lightning className="h-4 w-4" weight="duotone" />
            Regeln
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" weight="duotone" />
            Erinnerungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Wiederkehrende Einträge</CardTitle>
                  <CardDescription>
                    Automatisch Zeiteinträge für regelmäßige Tätigkeiten erstellen (z. B. Daily Standup)
                  </CardDescription>
                </div>
                <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Eintrag hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Wiederkehrenden Eintrag erstellen</DialogTitle>
                      <DialogDescription>
                        Dieser Eintrag wird automatisch zu festgelegten Zeiten erstellt
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddRecurring} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="z.B. Daily Standup" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectId">Projekt</Label>
                        <Select name="projectId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Projekt wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Häufigkeit</Label>
                        <Select name="frequency" defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Täglich</SelectItem>
                            <SelectItem value="weekly">Wöchentlich (Mo-Fr)</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="time">Startzeit</Label>
                          <Input id="time" name="time" type="time" defaultValue="09:00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Dauer (Min)</Label>
                          <Input id="duration" name="duration" type="number" placeholder="30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notizen</Label>
                        <Input id="notes" name="notes" placeholder="Automatisch erstellt" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="billable" name="billable" defaultChecked />
                        <Label htmlFor="billable">Abrechenbar</Label>
                      </div>
                      <Button type="submit" className="w-full">Erstellen</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!recurringEntries || recurringEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine wiederkehrenden Einträge konfiguriert
                </div>
              ) : (
                <div className="space-y-3">
                  {recurringEntries.map(entry => {
                    const project = projects.find(p => p.id === entry.projectId)
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{entry.name}</h4>
                            {entry.active ? (
                              <Badge variant="default">Aktiv</Badge>
                            ) : (
                              <Badge variant="secondary">Inaktiv</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>{project?.name || 'Kein Projekt'}</span>
                            <span>•</span>
                            <span>
                              {entry.schedule.frequency === 'daily' && 'Täglich'}
                              {entry.schedule.frequency === 'weekly' && 'Wöchentlich (Mo-Fr)'}
                              {entry.schedule.frequency === 'monthly' && 'Monatlich'}
                            </span>
                            <span>•</span>
                            <span>{entry.schedule.time || '09:00'} Uhr</span>
                            {entry.duration && (
                              <>
                                <span>•</span>
                                <span>{entry.duration} Min</span>
                              </>
                            )}
                          </div>
                          {entry.lastCreated && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Zuletzt erstellt: {format(new Date(entry.lastCreated), 'dd.MM.yyyy')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={entry.active}
                            onCheckedChange={() => handleToggleRecurring(entry.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRecurring(entry.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Automatisierungsregeln</CardTitle>
                  <CardDescription>
                    Intelligente Regeln für automatisches Verhalten
                  </CardDescription>
                </div>
                <Button onClick={handleAddAutoStartRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Regel hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="h-5 w-5 text-primary" weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Timer automatisch starten</h4>
                      <p className="text-sm text-muted-foreground">
                        Startet Timer beim Öffnen der App
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.autoStartTimer || false}
                    onCheckedChange={(checked) => handleUpdateSettings('autoStartTimer', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Automatisches Tagging</h4>
                      <p className="text-sm text-muted-foreground">
                        Tags automatisch basierend auf Kontext hinzufügen (z.B. "Fahrt" bei Bewegung)
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.autoTaggingEnabled || false}
                    onCheckedChange={(checked) => handleUpdateSettings('autoTaggingEnabled', checked)}
                  />
                </div>
              </div>

              {automationRules && automationRules.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Benutzerdefinierte Regeln</h4>
                  {automationRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rule.name}</h4>
                          {rule.active ? (
                            <Badge variant="default">Aktiv</Badge>
                          ) : (
                            <Badge variant="secondary">Inaktiv</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.type === 'auto_start_timer' && 'Startet Timer automatisch'}
                          {rule.type === 'auto_tag' && 'Fügt Tags automatisch hinzu'}
                          {rule.type === 'auto_categorize' && 'Kategorisiert automatisch'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.active}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erinnerungen</CardTitle>
              <CardDescription>
                Automatische Benachrichtigungen für wichtige Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Fehlende Zeiten (Tagesende)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Erinnert dich am Ende des Tages, wenn noch keine Zeiten erfasst wurden
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Täglich um</span>
                      <Input
                        type="time"
                        className="w-24 h-8"
                        value={appSettings?.reminders?.missingTimeTime || '17:00'}
                        onChange={(e) => handleUpdateSettings('reminders', {
                          ...appSettings.reminders,
                          missingTimeTime: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.reminders?.missingTimeEnabled || false}
                    onCheckedChange={(checked) => handleUpdateSettings('reminders', {
                      ...appSettings.reminders,
                      missingTimeEnabled: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Pausenhinweis (Arbeitsrecht)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hinweis auf gesetzlich vorgeschriebene Pausen nach langer Arbeitszeit
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Nach</span>
                      <Input
                        type="number"
                        className="w-16 h-8"
                        value={appSettings?.reminders?.breakWarningHours || 6}
                        onChange={(e) => handleUpdateSettings('reminders', {
                          ...appSettings.reminders,
                          breakWarningHours: parseInt(e.target.value)
                        })}
                      />
                      <span className="text-muted-foreground">Stunden</span>
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.reminders?.breakWarningEnabled || false}
                    onCheckedChange={(checked) => handleUpdateSettings('reminders', {
                      ...appSettings.reminders,
                      breakWarningEnabled: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Wocheneinreichung</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Erinnerung an das Einreichen der Wochenzeiten
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Freitag um</span>
                      <Input
                        type="time"
                        className="w-24 h-8"
                        value={appSettings?.reminders?.weeklySubmissionTime || '16:00'}
                        onChange={(e) => handleUpdateSettings('reminders', {
                          ...appSettings.reminders,
                          weeklySubmissionTime: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <Switch
                    checked={appSettings?.reminders?.weeklySubmissionEnabled || false}
                    onCheckedChange={(checked) => handleUpdateSettings('reminders', {
                      ...appSettings.reminders,
                      weeklySubmissionEnabled: checked
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
