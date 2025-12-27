import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CalendarBlank, ArrowsClockwise, Check, X, Plus, Trash, MagnifyingGlass, Clock, MapPin, TextAlignLeft, Lightning } from '@phosphor-icons/react'
import { useCalendarSync } from '@/hooks/use-calendar-sync'
import { Employee, Project, Task, IntegrationProvider, ActivityMode } from '@/lib/types'
import { CalendarEvent, CalendarTitlePattern, matchCalendarEventToProject, createTimeEntryFromCalendarEvent, getDefaultCalendarSyncSettings, CalendarSyncSettings } from '@/lib/calendar-sync'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CalendarIntegrationScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  onTimeEntryCreated?: (entry: any) => void
}

const updateSettings = (current: CalendarSyncSettings | undefined, updates: Partial<CalendarSyncSettings>): CalendarSyncSettings => {
  const base = current || getDefaultCalendarSyncSettings()
  return { ...base, ...updates }
}

export function CalendarIntegrationScreen({
  employees,
  projects,
  tasks,
  onTimeEntryCreated
}: CalendarIntegrationScreenProps) {
  const defaultEmployee = employees[0]
  const calendar = useCalendarSync(
    defaultEmployee?.id || 'default-employee',
    'default-tenant',
    projects,
    tasks
  )

  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider>(IntegrationProvider.GOOGLE_CALENDAR)
  const [patternDialog, setPatternDialog] = useState(false)
  const [newPattern, setNewPattern] = useState<Partial<CalendarTitlePattern>>({
    pattern: '',
    isRegex: false,
    action: 'suggest',
    priority: 50
  })

  const handleSync = async () => {
    try {
      const suggestions = await calendar.syncCalendar(selectedProvider)
      toast.success(`Synchronisiert: ${suggestions.length} Ereignisse gefunden`)
    } catch (error) {
      toast.error('Synchronisierung fehlgeschlagen')
    }
  }

  const handleAcceptSuggestion = (event: CalendarEvent, projectId: string, taskId?: string, phaseId?: string) => {
    calendar.createMappingFromSuggestion(event, projectId, taskId, phaseId)
    
    if (calendar.settings?.autoCreateTimeEntries) {
      const timeEntry = createTimeEntryFromCalendarEvent(
        event,
        defaultEmployee?.id || 'default-employee',
        'default-tenant',
        projectId,
        taskId,
        phaseId,
        undefined,
        calendar.settings.defaultBillable
      )
      onTimeEntryCreated?.({ ...timeEntry, id: `entry-${Date.now()}` })
    }
    
    toast.success('Ereignis zugeordnet')
  }

  const handleAddPattern = () => {
    if (!newPattern.pattern) {
      toast.error('Bitte ein Pattern eingeben')
      return
    }

    calendar.addTitlePattern({
      pattern: newPattern.pattern,
      isRegex: newPattern.isRegex || false,
      projectId: newPattern.projectId,
      taskId: newPattern.taskId,
      phaseId: newPattern.phaseId,
      mode: newPattern.mode,
      tags: newPattern.tags,
      action: newPattern.action || 'suggest',
      priority: newPattern.priority || 50
    })

    setNewPattern({
      pattern: '',
      isRegex: false,
      action: 'suggest',
      priority: 50
    })
    setPatternDialog(false)
    toast.success('Pattern hinzugefügt')
  }

  const settings = calendar.settings || {
    autoCreateTimeEntries: false,
    autoStartTimer: false,
    autoStopTimer: false,
    syncPastDays: 7,
    syncFutureDays: 1,
    defaultBillable: true,
    titlePatterns: [],
    ignoredCalendars: [],
    workingHoursOnly: false,
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00',
    minimumDurationMinutes: 5
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kalenderintegration</h2>
        <p className="text-muted-foreground">
          Automatische Synchronisation von Kalenderereignissen mit Zeiterfassung
        </p>
      </div>

      <Tabs defaultValue="sync" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="auto-sync">Timer-Sync</TabsTrigger>
          <TabsTrigger value="patterns">Automatische Zuordnung</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="logs">Protokoll</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kalender synchronisieren</CardTitle>
              <CardDescription>
                Importiere Ereignisse aus deinem Kalender und ordne sie Projekten zu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Kalenderanbieter</Label>
                  <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as IntegrationProvider)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IntegrationProvider.GOOGLE_CALENDAR}>Google Calendar</SelectItem>
                      <SelectItem value={IntegrationProvider.OUTLOOK_CALENDAR}>Outlook Calendar</SelectItem>
                      <SelectItem value={IntegrationProvider.ICAL}>iCal / CalDAV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSync} disabled={calendar.isSyncing} className="gap-2">
                    <ArrowsClockwise className={calendar.isSyncing ? 'animate-spin' : ''} />
                    {calendar.isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
                  </Button>
                </div>
              </div>

              {calendar.pendingEvents.length > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Ausstehende Ereignisse ({calendar.pendingEvents.length})</h3>
                    <Badge variant="secondary">{calendar.pendingEvents.length} zu überprüfen</Badge>
                  </div>

                  {calendar.pendingEvents.map((event) => {
                    const match = matchCalendarEventToProject(event, projects, tasks, settings.titlePatterns)
                    const project = match.projectId ? projects.find(p => p.id === match.projectId) : null
                    const task = match.taskId ? tasks.find(t => t.id === match.taskId) : null

                    return (
                      <Card key={event.id}>
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-semibold">{event.title}</div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(event.startTime), 'dd.MM.yyyy HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </div>
                                )}
                                {event.description && (
                                  <div className="flex items-center gap-1">
                                    <TextAlignLeft className="h-4 w-4" />
                                    {event.description.slice(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {match.confidence > 0 && (
                                <Badge variant={match.confidence >= 75 ? 'default' : 'secondary'}>
                                  {match.confidence}% Übereinstimmung
                                </Badge>
                              )}
                              {match.mode && (
                                <Badge variant="outline" className="gap-1">
                                  <Lightning className="h-3 w-3" />
                                  {match.mode}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {match.confidence > 0 && (
                            <div className="bg-muted/50 rounded p-3 space-y-2">
                              <div className="text-sm font-medium">Vorgeschlagene Zuordnung:</div>
                              <div className="flex items-center gap-2 text-sm">
                                {project && (
                                  <>
                                    <Badge variant="outline">{project.name}</Badge>
                                    {task && <Badge variant="outline">{task.name}</Badge>}
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{match.reason}</div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {match.projectId && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(event, match.projectId!, match.taskId, match.phaseId)}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Akzeptieren
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Manuell zuordnen
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ereignis zuordnen</DialogTitle>
                                  <DialogDescription>
                                    Wähle ein Projekt und optional einen Task für dieses Kalenderereignis
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label>Projekt *</Label>
                                    <Select
                                      onValueChange={(projectId) => {
                                        const task = tasks.find(t => t.projectId === projectId)
                                        handleAcceptSuggestion(event, projectId, task?.id)
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Projekt wählen" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {projects.filter(p => p.active).map(p => (
                                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => calendar.ignoreEvent(event.id)}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Ignorieren
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {calendar.pendingEvents.length === 0 && !calendar.isSyncing && (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarBlank className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Keine ausstehenden Ereignisse</p>
                  <p className="text-sm">Klicke auf "Jetzt synchronisieren" um Ereignisse zu importieren</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatische Timer-Synchronisation</CardTitle>
              <CardDescription>
                Synchronisiere aktive Timer automatisch mit deinem Kalender inkl. aller Timer-Details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <div className="font-semibold">Automatische Synchronisation aktivieren</div>
                    <div className="text-sm text-muted-foreground">
                      Timer werden automatisch als Kalenderereignisse erstellt/aktualisiert
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoCreateTimeEntries}
                    onCheckedChange={(checked) => {
                      calendar.setSettings((current) => updateSettings(current, { autoCreateTimeEntries: checked }))
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kalenderanbieter</Label>
                    <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as IntegrationProvider)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IntegrationProvider.GOOGLE_CALENDAR}>Google Calendar</SelectItem>
                        <SelectItem value={IntegrationProvider.OUTLOOK_CALENDAR}>Outlook Calendar</SelectItem>
                        <SelectItem value={IntegrationProvider.ICAL}>iCal / CalDAV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Synchronisationsintervall</Label>
                    <Select
                      value={String(settings.syncPastDays || 5)}
                      onValueChange={(v) => {
                        calendar.setSettings((current) => updateSettings(current, { syncPastDays: parseInt(v) }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Minute</SelectItem>
                        <SelectItem value="5">5 Minuten</SelectItem>
                        <SelectItem value="10">10 Minuten</SelectItem>
                        <SelectItem value="15">15 Minuten</SelectItem>
                        <SelectItem value="30">30 Minuten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="font-semibold text-sm">Synchronisations-Trigger</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Bei Timer-Start</Label>
                      <Switch
                        checked={settings.autoStartTimer}
                        onCheckedChange={(checked) => {
                          calendar.setSettings((current) => updateSettings(current, { autoStartTimer: checked }))
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Bei Timer-Stopp</Label>
                      <Switch
                        checked={settings.autoStopTimer}
                        onCheckedChange={(checked) => {
                          calendar.setSettings((current) => updateSettings(current, { autoStopTimer: checked }))
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Bei Modus-Wechsel</Label>
                      <Switch
                        checked={settings.workingHoursOnly}
                        onCheckedChange={(checked) => {
                          calendar.setSettings((current) => updateSettings(current, { workingHoursOnly: checked }))
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Bei Pause</Label>
                      <Switch
                        checked={settings.defaultBillable}
                        onCheckedChange={(checked) => {
                          calendar.setSettings((current) => updateSettings(current, { defaultBillable: checked }))
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarBlank className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold text-sm">Was wird synchronisiert?</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>✓ Projekt, Task und Phase</div>
                        <div>✓ Aktivitätsmodus (Fahrt, Montage, etc.)</div>
                        <div>✓ Vollständiger Zeitverlauf (Start, Pause, Fortsetzen, Modus-Wechsel)</div>
                        <div>✓ Standortinformationen</div>
                        <div>✓ Notizen und Tags</div>
                        <div>✓ Kostenstelle und Abrechenbarkeit</div>
                        <div>✓ Automatisch formatierte, lesbare Beschreibung</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-start gap-3">
                    <Lightning className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">Beispiel Kalenderbeschreibung</div>
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-background/50 p-3 rounded mt-2">
{`⏱️ TIMER-DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Projekt: Kurita Showroom
✓ Aufgabe: Installation
🔧 Modus: Montage
📍 Standort: Hauptstraße 123
💰 Abrechenbar: Ja

⏰ ZEITVERLAUF
━━━━━━━━━━━━━━━━━━━━━━━━━━
▶️  09:15:00 - Gestartet (Montage)
⏸️  11:30:00 - Pausiert
▶️  12:15:00 - Fortgesetzt
🔄 14:00:00 - Modus gewechselt zu Demontage
⏹️  16:30:00 - Beendet

⏱️ Gesamtdauer: 6h 30min

📝 NOTIZEN
━━━━━━━━━━━━━━━━━━━━━━━━━━
Alte Anlage demontiert, neue installiert.
Kunde sehr zufrieden.

─────────────────────────
🤖 Automatisch synchronisiert`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatische Zuordnungsregeln</CardTitle>
              <CardDescription>
                Definiere Muster, um Kalenderereignisse automatisch Projekten und Tasks zuzuordnen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={patternDialog} onOpenChange={setPatternDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus />
                    Neue Regel hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Neue Zuordnungsregel</DialogTitle>
                    <DialogDescription>
                      Erstelle eine Regel, um Ereignisse basierend auf ihrem Titel automatisch zuzuordnen
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Pattern / Suchbegriff *</Label>
                      <Input
                        placeholder="z.B. 'Kurita' oder '^Meeting.*'"
                        value={newPattern.pattern}
                        onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Textsuche (enthält) oder RegEx Pattern
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newPattern.isRegex}
                        onCheckedChange={(checked) => setNewPattern({ ...newPattern, isRegex: checked })}
                      />
                      <Label>Als Regular Expression behandeln</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Projekt</Label>
                        <Select
                          value={newPattern.projectId}
                          onValueChange={(v) => setNewPattern({ ...newPattern, projectId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.filter(p => p.active).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Task</Label>
                        <Select
                          value={newPattern.taskId}
                          onValueChange={(v) => setNewPattern({ ...newPattern, taskId: v })}
                          disabled={!newPattern.projectId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            {tasks.filter(t => t.projectId === newPattern.projectId).map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Aktivitätsmodus</Label>
                        <Select
                          value={newPattern.mode}
                          onValueChange={(v) => setNewPattern({ ...newPattern, mode: v as ActivityMode })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ActivityMode.FAHRT}>Fahrt</SelectItem>
                            <SelectItem value={ActivityMode.MONTAGE}>Montage</SelectItem>
                            <SelectItem value={ActivityMode.DEMONTAGE}>Demontage</SelectItem>
                            <SelectItem value={ActivityMode.PLANUNG}>Planung</SelectItem>
                            <SelectItem value={ActivityMode.BERATUNG}>Beratung</SelectItem>
                            <SelectItem value={ActivityMode.WARTUNG}>Wartung</SelectItem>
                            <SelectItem value={ActivityMode.DOKUMENTATION}>Dokumentation</SelectItem>
                            <SelectItem value={ActivityMode.MEETING}>Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Aktion</Label>
                        <Select
                          value={newPattern.action}
                          onValueChange={(v) => setNewPattern({ ...newPattern, action: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="map">Automatisch zuordnen</SelectItem>
                            <SelectItem value="suggest">Als Vorschlag anzeigen</SelectItem>
                            <SelectItem value="ignore">Ignorieren</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Priorität (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newPattern.priority}
                        onChange={(e) => setNewPattern({ ...newPattern, priority: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Höhere Priorität = wird zuerst geprüft
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setPatternDialog(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleAddPattern}>
                        Regel hinzufügen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {settings.titlePatterns.length > 0 ? (
                <div className="space-y-2">
                  {settings.titlePatterns
                    .sort((a, b) => b.priority - a.priority)
                    .map((pattern) => {
                      const project = pattern.projectId ? projects.find(p => p.id === pattern.projectId) : null
                      const task = pattern.taskId ? tasks.find(t => t.id === pattern.taskId) : null

                      return (
                        <Card key={pattern.id}>
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">{pattern.pattern}</code>
                                {pattern.isRegex && <Badge variant="secondary">RegEx</Badge>}
                                <Badge variant={pattern.action === 'map' ? 'default' : pattern.action === 'ignore' ? 'destructive' : 'outline'}>
                                  {pattern.action === 'map' ? 'Auto' : pattern.action === 'ignore' ? 'Ignorieren' : 'Vorschlag'}
                                </Badge>
                                <Badge variant="outline">Priorität: {pattern.priority}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {project && <span>→ {project.name}</span>}
                                {task && <span>/ {task.name}</span>}
                                {pattern.mode && <span className="flex items-center gap-1"><Lightning className="h-3 w-3" />{pattern.mode}</span>}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => calendar.deleteTitlePattern(pattern.id)}
                              className="gap-2"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Noch keine Regeln definiert</p>
                  <p className="text-sm">Erstelle Regeln für automatische Zuordnung von Ereignissen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisationseinstellungen</CardTitle>
              <CardDescription>
                Konfiguriere, wie Kalenderereignisse synchronisiert werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatisch Zeiteinträge erstellen</Label>
                    <p className="text-sm text-muted-foreground">
                      Zeiteinträge automatisch aus zugeordneten Ereignissen erstellen
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoCreateTimeEntries}
                    onCheckedChange={(checked) => calendar.setSettings({ ...settings, autoCreateTimeEntries: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Timer automatisch starten</Label>
                    <p className="text-sm text-muted-foreground">
                      Timer bei Ereignisstart automatisch starten
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoStartTimer}
                    onCheckedChange={(checked) => calendar.setSettings({ ...settings, autoStartTimer: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Timer automatisch stoppen</Label>
                    <p className="text-sm text-muted-foreground">
                      Timer bei Ereignisende automatisch stoppen
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoStopTimer}
                    onCheckedChange={(checked) => calendar.setSettings({ ...settings, autoStopTimer: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nur Arbeitszeiten synchronisieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Ereignisse außerhalb der Arbeitszeiten ignorieren
                    </p>
                  </div>
                  <Switch
                    checked={settings.workingHoursOnly}
                    onCheckedChange={(checked) => calendar.setSettings({ ...settings, workingHoursOnly: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vergangene Tage synchronisieren</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.syncPastDays}
                    onChange={(e) => calendar.setSettings({ ...settings, syncPastDays: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Zukünftige Tage synchronisieren</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.syncFutureDays}
                    onChange={(e) => calendar.setSettings({ ...settings, syncFutureDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {settings.workingHoursOnly && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Arbeitsbeginn</Label>
                    <Input
                      type="time"
                      value={settings.workingHoursStart}
                      onChange={(e) => calendar.setSettings({ ...settings, workingHoursStart: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Arbeitsende</Label>
                    <Input
                      type="time"
                      value={settings.workingHoursEnd}
                      onChange={(e) => calendar.setSettings({ ...settings, workingHoursEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Minimale Ereignisdauer (Minuten)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.minimumDurationMinutes}
                  onChange={(e) => calendar.setSettings({ ...settings, minimumDurationMinutes: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ereignisse kürzer als diese Dauer werden ignoriert
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Standard: Abrechenbar</Label>
                  <p className="text-sm text-muted-foreground">
                    Neue Zeiteinträge standardmäßig als abrechenbar markieren
                  </p>
                </div>
                <Switch
                  checked={settings.defaultBillable}
                  onCheckedChange={(checked) => calendar.setSettings({ ...settings, defaultBillable: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisationsprotokoll</CardTitle>
              <CardDescription>
                Verlauf aller Synchronisationsvorgänge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(calendar.syncLogs || []).length > 0 ? (
                <div className="space-y-2">
                  {(calendar.syncLogs || []).map((log) => (
                    <Card key={log.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={log.errors.length > 0 ? 'destructive' : 'default'}>
                                {log.provider}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}
                              </span>
                              <Badge variant="outline">{log.duration}ms</Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Verarbeitet: {log.eventsProcessed} Ereignisse</div>
                              {log.eventsCreated > 0 && <div>Erstellt: {log.eventsCreated}</div>}
                              {log.eventsUpdated > 0 && <div>Aktualisiert: {log.eventsUpdated}</div>}
                              {log.eventsIgnored > 0 && <div>Ignoriert: {log.eventsIgnored}</div>}
                              {log.errors.length > 0 && (
                                <div className="text-destructive">Fehler: {log.errors.join(', ')}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Keine Synchronisationsprotokolle vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
