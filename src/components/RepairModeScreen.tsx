import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Wrench, 
  Lightning, 
  Clock, 
  Warning, 
  CheckCircle, 
  X,
  Play,
  ArrowsClockwise,
  Sparkle,
  CalendarBlank,
  List
} from '@phosphor-icons/react'
import { 
  Issue, 
  IssueType, 
  IssueSeverity, 
  IssueStatus,
  IssueDetector,
  RepairAction,
  RepairEngine,
  RepairActionType
} from '@/lib/repair-mode'
import { TimeEntry, Employee, Project, Task, Phase, Absence } from '@/lib/types'
import { format, parseISO, startOfWeek, endOfWeek, subDays, isWithinInterval } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

interface RepairModeScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
  setTimeEntries: (entries: TimeEntry[] | ((prev: TimeEntry[]) => TimeEntry[])) => void
  absences: Absence[]
}

type InboxFilter = 'all' | 'today' | 'week' | 'daily' | 'weekly'

export function RepairModeScreen({
  employees,
  projects,
  tasks,
  phases,
  timeEntries,
  setTimeEntries,
  absences
}: RepairModeScreenProps) {
  const [issues, setIssues] = useKV<Issue[]>('repair-issues', [])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [repairDialogOpen, setRepairDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<RepairAction | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [newEntryData, setNewEntryData] = useState({
    projectId: '',
    taskId: '',
    notes: ''
  })

  useEffect(() => {
    analyzeIssues()
  }, [timeEntries])

  const analyzeIssues = () => {
    setIsAnalyzing(true)
    const detectedIssues = IssueDetector.detectIssues(
      timeEntries,
      employees,
      projects,
      tasks,
      phases,
      absences
    )

    setIssues((currentIssues) => {
      const current = currentIssues || []
      const existingIds = new Set(current.map(i => i.id))
      const newIssues = detectedIssues.filter(i => !existingIds.has(i.id))
      
      const updatedExisting = current.map(existing => {
        const found = detectedIssues.find(d => d.id === existing.id)
        if (found && existing.status === IssueStatus.PENDING) {
          return { ...existing, ...found }
        }
        return existing
      })

      const resolvedIds = new Set(detectedIssues.map(i => i.id))
      const autoResolved = updatedExisting.map(issue => {
        if (issue.status === IssueStatus.PENDING && !resolvedIds.has(issue.id)) {
          return {
            ...issue,
            status: IssueStatus.RESOLVED,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'auto'
          }
        }
        return issue
      })

      return [...autoResolved, ...newIssues]
    })

    setTimeout(() => setIsAnalyzing(false), 500)
  }

  const filteredIssues = useMemo(() => {
    let filtered = (issues || []).filter(i => i.status !== IssueStatus.DISMISSED)

    const today = format(new Date(), 'yyyy-MM-dd')
    const weekStart = startOfWeek(new Date(), { locale: de })
    const weekEnd = endOfWeek(new Date(), { locale: de })

    switch (inboxFilter) {
      case 'today':
        filtered = filtered.filter(i => i.date === today)
        break
      case 'week':
        filtered = filtered.filter(i => {
          const issueDate = parseISO(i.date)
          return isWithinInterval(issueDate, { start: weekStart, end: weekEnd })
        })
        break
      case 'daily':
        filtered = filtered.filter(i => i.type === IssueType.GAP || i.type === IssueType.OVERLAP)
        break
      case 'weekly':
        filtered = filtered.filter(i => {
          const issueDate = parseISO(i.date)
          return isWithinInterval(issueDate, { start: weekStart, end: weekEnd })
        })
        break
    }

    return filtered.sort((a, b) => {
      const severityOrder = {
        [IssueSeverity.CRITICAL]: 0,
        [IssueSeverity.WARNING]: 1,
        [IssueSeverity.INFO]: 2
      }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
  }, [issues, inboxFilter])

  const stats = useMemo(() => {
    const pending = (issues || []).filter(i => i.status === IssueStatus.PENDING)
    return {
      total: pending.length,
      critical: pending.filter(i => i.severity === IssueSeverity.CRITICAL).length,
      warning: pending.filter(i => i.severity === IssueSeverity.WARNING).length,
      info: pending.filter(i => i.severity === IssueSeverity.INFO).length,
      quickFixable: pending.filter(i => 
        i.metadata.suggestedActions?.some(a => a.autoApplicable && a.confidence > 0.7)
      ).length
    }
  }, [issues])

  const handleApplyAction = async (issue: Issue, action: RepairAction) => {
    try {
      const currentUser = 'current-user'
      const updatedEntries = await RepairEngine.applyRepairAction(action, timeEntries, currentUser)
      
      setTimeEntries(updatedEntries)

      setIssues((currentIssues) =>
        (currentIssues || []).map(i =>
          i.id === issue.id
            ? {
                ...i,
                status: IssueStatus.RESOLVED,
                resolvedAt: new Date().toISOString(),
                resolvedBy: currentUser
              }
            : i
        )
      )

      toast.success('Reparatur erfolgreich', {
        description: action.label
      })

      setRepairDialogOpen(false)
      setSelectedIssue(null)
      setSelectedAction(null)
    } catch (error) {
      toast.error('Fehler bei der Reparatur', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      })
    }
  }

  const handleDismissIssue = (issueId: string, reason?: string) => {
    setIssues((currentIssues) =>
      (currentIssues || []).map(i =>
        i.id === issueId
          ? {
              ...i,
              status: IssueStatus.DISMISSED,
              dismissedReason: reason
            }
          : i
      )
    )
    toast.info('Problem als irrelevant markiert')
  }

  const handleBatchCorrection = () => {
    if (selectedIssueIds.length === 0) {
      toast.error('Keine Probleme ausgewählt')
      return
    }

    toast.success(`${selectedIssueIds.length} Probleme werden bearbeitet...`)
  }

  const openRepairDialog = (issue: Issue, action?: RepairAction) => {
    setSelectedIssue(issue)
    setSelectedAction(action || null)
    
    if (action?.type === RepairActionType.FILL_GAP) {
      setNewEntryData({
        projectId: action.payload.projectId || '',
        taskId: action.payload.taskId || '',
        notes: ''
      })
    }
    
    setRepairDialogOpen(true)
  }

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return 'destructive'
      case IssueSeverity.WARNING:
        return 'default'
      case IssueSeverity.INFO:
        return 'secondary'
    }
  }

  const getTypeIcon = (type: IssueType) => {
    switch (type) {
      case IssueType.GAP:
        return <Clock className="h-4 w-4" />
      case IssueType.OVERLAP:
        return <ArrowsClockwise className="h-4 w-4" />
      case IssueType.VALIDATION_ERROR:
        return <Warning className="h-4 w-4" />
      case IssueType.ANOMALY:
        return <Sparkle className="h-4 w-4" />
      case IssueType.MISSING_DATA:
        return <List className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Wrench className="h-7 w-7 text-white" weight="bold" />
            </div>
            KI-Reparaturmodus
          </h2>
          <p className="text-muted-foreground mt-1">
            Fehler automatisch in 30 Sekunden fixen
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={analyzeIssues}
            variant="outline"
            disabled={isAnalyzing}
          >
            <Lightning className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analysiere...' : 'Neu analysieren'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Zu prüfen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Kritisch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Sofort beheben</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.warning}</div>
            <p className="text-xs text-muted-foreground mt-1">Prüfen empfohlen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.info}</div>
            <p className="text-xs text-muted-foreground mt-1">Optional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-accent">Quick-Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.quickFixable}</div>
            <p className="text-xs text-muted-foreground mt-1">1-Click-Fix</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              <Lightning className="h-4 w-4 mr-2" />
              Zu prüfen ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              <CheckCircle className="h-4 w-4 mr-2" />
              Gelöst
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={inboxFilter} onValueChange={(v) => setInboxFilter(v as InboxFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Probleme</SelectItem>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="daily">Tägliche Inbox</SelectItem>
                <SelectItem value="weekly">Wöchentliche Inbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="pending" className="space-y-3">
          {filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Alles sauber! 🎉</h3>
                <p className="text-muted-foreground">Keine Probleme gefunden</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {filteredIssues.map(issue => (
                  <Card key={issue.id} className="hover:border-accent/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getTypeIcon(issue.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base">{issue.title}</CardTitle>
                              <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                                {issue.severity}
                              </Badge>
                              {issue.metadata.suggestedActions?.some(a => a.autoApplicable && a.confidence > 0.7) && (
                                <Badge variant="outline" className="text-xs border-accent text-accent">
                                  <Lightning className="h-3 w-3 mr-1" />
                                  Quick-Fix
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm">
                              {issue.description}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarBlank className="h-3 w-3" />
                                {format(parseISO(issue.date), 'dd.MM.yyyy', { locale: de })}
                              </div>
                              <div>
                                {employees.find(e => e.id === issue.employeeId)?.name || 'Unbekannt'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissIssue(issue.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {issue.metadata.suggestedActions && issue.metadata.suggestedActions.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Vorgeschlagene Aktionen:
                          </p>
                          {issue.metadata.suggestedActions.map((action, idx) => (
                            <Button
                              key={idx}
                              variant={action.autoApplicable && action.confidence > 0.7 ? 'default' : 'outline'}
                              size="sm"
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => openRepairDialog(issue, action)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Play className="h-3 w-3" />
                                  <span className="font-medium">{action.label}</span>
                                  {action.autoApplicable && (
                                    <Badge variant="secondary" className="text-xs">
                                      {Math.round(action.confidence * 100)}% sicher
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {(issues || [])
                .filter(i => i.status === IssueStatus.RESOLVED)
                .map(issue => (
                  <Card key={issue.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                          <div>
                            <CardTitle className="text-base">{issue.title}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {issue.description}
                            </CardDescription>
                            <p className="text-xs text-muted-foreground mt-2">
                              Gelöst am {format(parseISO(issue.resolvedAt!), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={repairDialogOpen} onOpenChange={setRepairDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reparatur-Aktion anwenden</DialogTitle>
            <DialogDescription>
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAction?.type === RepairActionType.FILL_GAP && (
            <div className="space-y-4 py-4">
              <Alert>
                <Lightning className="h-4 w-4" />
                <AlertDescription>
                  Ein neuer Zeiteintrag wird erstellt für die Lücke zwischen{' '}
                  <strong>{selectedAction.payload.startTime}</strong> und{' '}
                  <strong>{selectedAction.payload.endTime}</strong> ({selectedAction.payload.duration.toFixed(1)}h)
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label>Projekt</Label>
                  <Select
                    value={newEntryData.projectId}
                    onValueChange={(value) => setNewEntryData(prev => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p.active).map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Task (optional)</Label>
                  <Select
                    value={newEntryData.taskId}
                    onValueChange={(value) => setNewEntryData(prev => ({ ...prev, taskId: value }))}
                    disabled={!newEntryData.projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Task wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks
                        .filter(t => t.projectId === newEntryData.projectId && t.active)
                        .map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notizen</Label>
                  <Textarea
                    value={newEntryData.notes}
                    onChange={(e) => setNewEntryData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Was wurde gemacht?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedAction?.type === RepairActionType.UPDATE_FIELD && (
            <div className="py-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Der Zeiteintrag wird aktualisiert:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {selectedAction.payload.startTime && (
                      <li>Startzeit: {selectedAction.payload.startTime}</li>
                    )}
                    {selectedAction.payload.endTime && (
                      <li>Endzeit: {selectedAction.payload.endTime}</li>
                    )}
                    {selectedAction.payload.duration && (
                      <li>Dauer: {selectedAction.payload.duration.toFixed(1)}h</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {selectedAction?.type === RepairActionType.SPLIT_ENTRY && (
            <div className="py-4">
              <Alert>
                <ArrowsClockwise className="h-4 w-4" />
                <AlertDescription>
                  Der Eintrag wird in zwei Teile aufgeteilt:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Teil 1: bis {selectedAction.payload.splitAt}</li>
                    <li>Teil 2: ab {selectedAction.payload.splitEnd}</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {selectedAction?.type === RepairActionType.DELETE_ENTRY && (
            <div className="py-4">
              <Alert variant="destructive">
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  Der Zeiteintrag wird gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRepairDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (selectedIssue && selectedAction) {
                  const actionToApply = selectedAction.type === RepairActionType.FILL_GAP
                    ? {
                        ...selectedAction,
                        payload: {
                          ...selectedAction.payload,
                          projectId: newEntryData.projectId,
                          taskId: newEntryData.taskId || undefined,
                          notes: newEntryData.notes
                        }
                      }
                    : selectedAction

                  handleApplyAction(selectedIssue, actionToApply)
                }
              }}
              disabled={
                selectedAction?.type === RepairActionType.FILL_GAP && !newEntryData.projectId
              }
            >
              <Lightning className="h-4 w-4 mr-2" />
              Anwenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
