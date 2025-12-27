import { useState, useEffect } from 'react'
import { Employee, Project, Task, Phase, TimeEntry, ActiveTimer, UserRole, AuditMetadata, ApprovalStatus, Absence, ActivityMode, TimerEventType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, Stop, Star, Clock, Lightning, Plus, CarSimple, Wrench, Hammer, ClipboardText, ChatsCircle, Gear, FileText, Users, PushPin, ArrowsClockwise } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format, addMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { SmartCategorization } from '@/components/SmartCategorization'
import { CategorizationSuggestion } from '@/lib/ai-categorization'
import { ValidationDisplay } from '@/components/ValidationDisplay'
import { TimeEntryValidator, ValidationContext, ValidationResult, ValidationQuickFix } from '@/lib/validation-rules'
import { createTimerEvent, formatTimerEventForDisplay, formatMode, getModeIcon, getModeColor, getTimerSummary, formatDuration, createCalendarEventTitle } from '@/lib/timer-events'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuickTimeEntry } from '@/components/QuickTimeEntry'
import { NaturalLanguageInput } from '@/components/NaturalLanguageInput'
import { ContinueWorkTile } from '@/components/ContinueWorkTile'
import { AnomalyBanner } from '@/components/AnomalyBanner'
import { useGapOvertimeDetection } from '@/hooks/use-gap-overtime-detection'
import { InlineEditableTimeEntry } from '@/components/InlineEditableTimeEntry'
import { EmptyDayView } from '@/components/EmptyStates'

interface TodayScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
  setTimeEntries: (value: TimeEntry[] | ((oldValue?: TimeEntry[]) => TimeEntry[])) => void
  activeTimer: ActiveTimer | null
  setActiveTimer: (value: ActiveTimer | null | ((oldValue?: ActiveTimer | null) => ActiveTimer | null)) => void
  absences?: Absence[]
}

export function TodayScreen({
  employees,
  projects,
  tasks,
  phases,
  timeEntries,
  setTimeEntries,
  activeTimer,
  setActiveTimer,
  absences = []
}: TodayScreenProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [selectedMode, setSelectedMode] = useState<ActivityMode>(ActivityMode.SONSTIGES)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showEventHistory, setShowEventHistory] = useState(false)
  const [showQuickEntry, setShowQuickEntry] = useState(false)

  const currentEmployee = employees.find(e => e.id === selectedEmployee)
  const currentProject = projects.find(p => p.id === selectedProject)
  const availablePhases = phases.filter(ph => ph.projectId === selectedProject)
  const availableTasks = tasks.filter(t => 
    t.projectId === selectedProject && 
    (!selectedPhase || t.phaseId === selectedPhase)
  )

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id)
    }
  }, [employees, selectedEmployee])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (activeTimer && !activeTimer.isPaused) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - activeTimer.startTime - activeTimer.pausedDuration
        setElapsedTime(Math.floor(elapsed / 1000))
      }, 1000)
    } else if (activeTimer && activeTimer.isPaused && activeTimer.pausedAt) {
      const elapsed = activeTimer.pausedAt - activeTimer.startTime - activeTimer.pausedDuration
      setElapsedTime(Math.floor(elapsed / 1000))
    } else {
      setElapsedTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (!selectedProject) {
      toast.error('Bitte wählen Sie ein Projekt aus')
      return
    }

    if (!selectedEmployee) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus')
      return
    }

    const startEvent = createTimerEvent(TimerEventType.START, {
      mode: selectedMode,
      projectId: selectedProject,
      phaseId: selectedPhase || undefined,
      taskId: selectedTask || undefined
    })

    const newTimer: ActiveTimer = {
      id: `timer-${Date.now()}`,
      employeeId: selectedEmployee,
      projectId: selectedProject,
      phaseId: selectedPhase || undefined,
      taskId: selectedTask || undefined,
      startTime: Date.now(),
      pausedDuration: 0,
      billable: true,
      isPaused: false,
      mode: selectedMode,
      events: [startEvent]
    }

    setActiveTimer(newTimer)
    toast.success(`Timer gestartet (${formatMode(selectedMode)})`, {
      description: format(new Date(), 'HH:mm:ss')
    })
  }

  const handlePause = () => {
    if (!activeTimer) return

    if (activeTimer.isPaused) {
      const resumeEvent = createTimerEvent(TimerEventType.RESUME, activeTimer)
      
      const pauseDuration = Date.now() - (activeTimer.pausedAt || Date.now())
      setActiveTimer({
        ...activeTimer,
        isPaused: false,
        pausedDuration: activeTimer.pausedDuration + pauseDuration,
        pausedAt: undefined,
        events: [...activeTimer.events, resumeEvent]
      })
      toast.success('Timer fortgesetzt', {
        description: format(new Date(), 'HH:mm:ss')
      })
    } else {
      const pauseEvent = createTimerEvent(TimerEventType.PAUSE, activeTimer)
      
      setActiveTimer({
        ...activeTimer,
        isPaused: true,
        pausedAt: Date.now(),
        events: [...activeTimer.events, pauseEvent]
      })
      toast.success('Timer pausiert', {
        description: format(new Date(), 'HH:mm:ss')
      })
    }
  }

  const handleStop = () => {
    if (!activeTimer) return

    const stopEvent = createTimerEvent(TimerEventType.STOP, activeTimer)
    const allEvents = [...activeTimer.events, stopEvent]

    const endTime = Date.now()
    const duration = (endTime - activeTimer.startTime - activeTimer.pausedDuration) / 1000 / 3600

    const currentDate = format(new Date(), 'yyyy-MM-dd')
    const startTimeStr = format(new Date(activeTimer.startTime), 'HH:mm')
    const endTimeStr = format(new Date(endTime), 'HH:mm')

    const audit: AuditMetadata = createAuditMetadata(activeTimer.employeeId, 'Browser')

    const modeTags = activeTimer.mode ? [activeTimer.mode] : []
    const allTags = [...(activeTimer.tags || []), ...modeTags]

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      tenantId: 'default',
      employeeId: activeTimer.employeeId,
      projectId: activeTimer.projectId,
      phaseId: activeTimer.phaseId,
      taskId: activeTimer.taskId,
      date: currentDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: parseFloat(duration.toFixed(2)),
      tags: allTags,
      location: activeTimer.location,
      notes: activeTimer.notes,
      costCenter: activeTimer.costCenter,
      billable: activeTimer.billable,
      approvalStatus: ApprovalStatus.DRAFT,
      locked: false,
      audit,
      changeLog: [],
      evidenceAnchors: [{
        type: 'system',
        timestamp: new Date().toISOString(),
        value: `Automatische Aufzeichnung mit ${allEvents.length} Ereignissen`,
        verified: true
      }]
    }

    setTimeEntries((current = []) => [...current, newEntry])
    setActiveTimer(null)
    setElapsedTime(0)
    
    const summary = getTimerSummary({ ...activeTimer, events: allEvents })
    toast.success(`${duration.toFixed(2)} Stunden gespeichert`, {
      description: `${allEvents.length} Ereignisse aufgezeichnet`
    })
  }

  const handleModeSwitch = (newMode: ActivityMode) => {
    if (!activeTimer || activeTimer.isPaused) return

    const switchEvent = createTimerEvent(TimerEventType.MODE_SWITCH, {
      ...activeTimer,
      mode: newMode
    })

    setActiveTimer({
      ...activeTimer,
      mode: newMode,
      events: [...activeTimer.events, switchEvent]
    })

    setSelectedMode(newMode)
    toast.success(`Modus gewechselt zu ${formatMode(newMode)}`, {
      description: format(new Date(), 'HH:mm:ss')
    })
  }

  const handleSwitch = () => {
    if (!activeTimer) return
    handleStop()
    setTimeout(() => handleStart(), 100)
  }

  const todayEntries = timeEntries.filter(entry => entry.date === format(new Date(), 'yyyy-MM-dd'))
  const totalHoursToday = todayEntries.reduce((sum, entry) => sum + entry.duration, 0)

  const recentProjects = Array.from(new Set(
    timeEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(e => e.projectId)
  )).slice(0, 5)

  const favoriteEntries = timeEntries.filter(e => e.isFavorite).slice(0, 3)

  const getAllValidationResults = () => {
    const allResults: ValidationResult[] = []
    todayEntries.forEach(entry => {
      const context: ValidationContext = {
        entry,
        allEntries: timeEntries,
        projects,
        employees,
        absences: absences || [],
        holidays: []
      }
      const results = TimeEntryValidator.validate(context)
      allResults.push(...results)
    })
    return allResults
  }

  const validationResults = getAllValidationResults()

  const gapOvertimeAnalysis = useGapOvertimeDetection(
    currentEmployee || null,
    timeEntries,
    absences || []
  )

  const handleApplyFix = (result: ValidationResult, fix: ValidationQuickFix) => {
    const { action } = fix

    if (action.type === 'update_field') {
      const entryToUpdate = todayEntries.find(e => {
        if (result.metadata?.conflictingEntryId) {
          return false
        }
        const context: ValidationContext = {
          entry: e,
          allEntries: timeEntries,
          projects,
          employees,
          absences: [],
          holidays: []
        }
        const entryResults = TimeEntryValidator.validate(context)
        return entryResults.some(r => r.code === result.code && r.message === result.message)
      })

      if (entryToUpdate) {
        setTimeEntries((current = []) =>
          current.map(e => {
            if (e.id === entryToUpdate.id) {
              if (action.field === 'times') {
                return {
                  ...e,
                  startTime: action.value.startTime,
                  endTime: action.value.endTime,
                  duration: calculateDuration(action.value.startTime, action.value.endTime)
                }
              } else if (action.field) {
                return { ...e, [action.field]: action.value }
              }
            }
            return e
          })
        )
        toast.success(`Fix angewendet: ${fix.label}`)
      }
    } else if (action.type === 'delete_entry') {
      const entryIds = action.entries as string[]
      setTimeEntries((current = []) =>
        current.filter(e => !entryIds.includes(e.id))
      )
      toast.success('Eintrag gelöscht')
    }
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    return (endTotalMinutes - startTotalMinutes) / 60
  }

  const handleResumeEntry = (entry: TimeEntry) => {
    if (activeTimer) {
      toast.error('Stoppen Sie zuerst den aktiven Timer')
      return
    }

    setSelectedEmployee(entry.employeeId)
    setSelectedProject(entry.projectId)
    setSelectedPhase(entry.phaseId || '')
    setSelectedTask(entry.taskId || '')
    
    handleStart()
    
    toast.success('Timer mit letzten Einstellungen gestartet', {
      description: projects.find(p => p.id === entry.projectId)?.name || 'Projekt'
    })
  }

  const handleStartFromFavorite = (projectId: string, phaseId?: string, taskId?: string) => {
    if (activeTimer) {
      toast.error('Stoppen Sie zuerst den aktiven Timer')
      return
    }

    setSelectedProject(projectId)
    setSelectedPhase(phaseId || '')
    setSelectedTask(taskId || '')
    
    handleStart()
    
    const project = projects.find(p => p.id === projectId)
    toast.success('Timer gestartet', {
      description: project?.name || 'Projekt'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-accent via-primary to-accent/80 shadow-xl">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">Zeit erfassen</h2>
          <p className="text-white/90 text-sm">Schnelleintrag in nur 2 Klicks</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setShowQuickEntry(true)}
          className="bg-white text-primary hover:bg-white/90 shadow-lg gap-2 text-lg px-8 py-6"
        >
          <Plus className="h-6 w-6" weight="bold" />
          Zeit erfassen
        </Button>
      </div>

      <QuickTimeEntry
        open={showQuickEntry}
        onOpenChange={setShowQuickEntry}
        employees={employees}
        projects={projects}
        tasks={tasks}
        phases={phases}
        onSave={(entry) => {
          setTimeEntries((current = []) => [...current, entry])
        }}
      />

      {gapOvertimeAnalysis && gapOvertimeAnalysis.issues.length > 0 && (
        <AnomalyBanner
          analysis={gapOvertimeAnalysis}
          onFillGaps={() => {
            setShowQuickEntry(true)
            toast.info('Bitte ergänzen Sie die fehlenden Zeiteinträge')
          }}
        />
      )}

      <ContinueWorkTile
        employees={employees}
        projects={projects}
        tasks={tasks}
        phases={phases}
        timeEntries={timeEntries}
        activeTimer={activeTimer}
        onResumeEntry={handleResumeEntry}
        onStartFromFavorite={handleStartFromFavorite}
      />

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" weight="duotone" />
            Timer
          </CardTitle>
          <CardDescription>Starten Sie Ihre Zeiterfassung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold tracking-tight mb-4 text-primary">
              {formatTime(elapsedTime)}
            </div>
            {activeTimer && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant={activeTimer.isPaused ? 'secondary' : 'default'}>
                  {activeTimer.isPaused ? 'Pausiert' : 'Läuft'}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Projekt *</label>
              <Select 
                value={selectedProject} 
                onValueChange={(val) => {
                  setSelectedProject(val)
                  setSelectedPhase('')
                  setSelectedTask('')
                }}
                disabled={!!activeTimer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Projekt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.active).map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availablePhases.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Phase (optional)</label>
                <Select 
                  value={selectedPhase} 
                  onValueChange={(val) => {
                    setSelectedPhase(val)
                    setSelectedTask('')
                  }}
                  disabled={!!activeTimer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Phase wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Phase</SelectItem>
                    {availablePhases.map(phase => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availableTasks.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Task (optional)</label>
                <Select 
                  value={selectedTask} 
                  onValueChange={setSelectedTask}
                  disabled={!!activeTimer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Task wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kein Task</SelectItem>
                    {availableTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!activeTimer && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Aktivitätsmodus</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                <Button
                  variant={selectedMode === ActivityMode.FAHRT ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.FAHRT)}
                  className="gap-2"
                >
                  <CarSimple className="h-4 w-4" weight="duotone" />
                  Fahrt
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.MONTAGE ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.MONTAGE)}
                  className="gap-2"
                >
                  <Wrench className="h-4 w-4" weight="duotone" />
                  Montage
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.DEMONTAGE ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.DEMONTAGE)}
                  className="gap-2"
                >
                  <Hammer className="h-4 w-4" weight="duotone" />
                  Demontage
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.PLANUNG ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.PLANUNG)}
                  className="gap-2"
                >
                  <ClipboardText className="h-4 w-4" weight="duotone" />
                  Planung
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.BERATUNG ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.BERATUNG)}
                  className="gap-2"
                >
                  <ChatsCircle className="h-4 w-4" weight="duotone" />
                  Beratung
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.WARTUNG ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.WARTUNG)}
                  className="gap-2"
                >
                  <Gear className="h-4 w-4" weight="duotone" />
                  Wartung
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.DOKUMENTATION ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.DOKUMENTATION)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" weight="duotone" />
                  Doku
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.MEETING ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.MEETING)}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" weight="duotone" />
                  Meeting
                </Button>
                <Button
                  variant={selectedMode === ActivityMode.SONSTIGES ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(ActivityMode.SONSTIGES)}
                  className="gap-2"
                >
                  <PushPin className="h-4 w-4" weight="duotone" />
                  Sonstiges
                </Button>
              </div>
            </div>
          )}

          {activeTimer && activeTimer.mode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Modus wechseln</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventHistory(true)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {activeTimer.events.length} Ereignisse
                </Button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {Object.values(ActivityMode).map((mode) => (
                  <Button
                    key={mode}
                    variant={activeTimer.mode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeSwitch(mode)}
                    disabled={activeTimer.isPaused}
                    className="gap-2"
                  >
                    {mode === ActivityMode.FAHRT && <CarSimple className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.MONTAGE && <Wrench className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.DEMONTAGE && <Hammer className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.PLANUNG && <ClipboardText className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.BERATUNG && <ChatsCircle className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.WARTUNG && <Gear className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.DOKUMENTATION && <FileText className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.MEETING && <Users className="h-4 w-4" weight="duotone" />}
                    {mode === ActivityMode.SONSTIGES && <PushPin className="h-4 w-4" weight="duotone" />}
                    <span className="hidden sm:inline">{formatMode(mode)}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 justify-center">
            {!activeTimer ? (
              <Button 
                onClick={handleStart} 
                size="lg" 
                className="gap-2"
                disabled={!selectedProject}
              >
                <Play className="h-5 w-5" weight="fill" />
                Starten
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handlePause} 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2"
                >
                  <Pause className="h-5 w-5" weight="fill" />
                  {activeTimer.isPaused ? 'Fortsetzen' : 'Pause'}
                </Button>
                <Button 
                  onClick={handleStop} 
                  size="lg" 
                  variant="destructive" 
                  className="gap-2"
                >
                  <Stop className="h-5 w-5" weight="fill" />
                  Stoppen
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEventHistory} onOpenChange={setShowEventHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ereignisverlauf</DialogTitle>
            <DialogDescription>
              Automatische Aufzeichnung aller Timer-Aktionen mit Zeitstempel
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {activeTimer && activeTimer.events.length > 0 ? (
              <div className="space-y-2">
                {activeTimer.events.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">
                        {formatTimerEventForDisplay(event)}
                      </div>
                      {event.mode && (
                        <Badge variant="secondary" className="text-xs">
                          {getModeIcon(event.mode)} {formatMode(event.mode)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Keine Ereignisse aufgezeichnet
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" weight="duotone" />
              Zuletzt verwendet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine kürzlichen Projekte</p>
            )}
            {recentProjects.map(projectId => {
              const project = projects.find(p => p.id === projectId)
              if (!project) return null
              return (
                <Button
                  key={projectId}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedProject(projectId)
                    if (!activeTimer) {
                      handleStart()
                    }
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{project.name}</span>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-4 w-4" weight="duotone" />
              Favoriten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {favoriteEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine Favoriten</p>
            )}
            {favoriteEntries.map(entry => {
              const project = projects.find(p => p.id === entry.projectId)
              if (!project) return null
              return (
                <Button
                  key={entry.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedProject(entry.projectId)
                    if (entry.phaseId) setSelectedPhase(entry.phaseId)
                    if (entry.taskId) setSelectedTask(entry.taskId)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Star className="h-3 w-3" weight="fill" />
                    <span className="text-sm">{project.name}</span>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {currentEmployee && (
        <NaturalLanguageInput
          employee={currentEmployee}
          projects={projects}
          date={format(new Date(), 'yyyy-MM-dd')}
          onEntriesCreated={(entries) => {
            setTimeEntries((current = []) => [...current, ...entries])
          }}
        />
      )}

      <SmartCategorization
        employeeId={selectedEmployee}
        projects={projects}
        tasks={tasks}
        timeEntries={timeEntries}
        onApplySuggestion={(suggestion: CategorizationSuggestion) => {
          if (suggestion.projectId) {
            setSelectedProject(suggestion.projectId)
          }
          if (suggestion.taskId) {
            setSelectedTask(suggestion.taskId)
          }
          toast.success('Vorschlag angewendet')
        }}
      />

      {validationResults.length > 0 && (
        <ValidationDisplay
          results={validationResults}
          showSoftWarnings={true}
          onApplyFix={handleApplyFix}
        />
      )}

      {todayEntries.some(e => e.tags?.some(tag => Object.values(ActivityMode).includes(tag as ActivityMode))) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowsClockwise className="h-5 w-5" weight="duotone" />
              Aktivitäten nach Modus
            </CardTitle>
            <CardDescription>Zeitverteilung der verschiedenen Aktivitätsmodi heute</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.values(ActivityMode).map(mode => {
                const modeEntries = todayEntries.filter(e => 
                  e.tags?.includes(mode)
                )
                const totalHours = modeEntries.reduce((sum, e) => sum + e.duration, 0)
                
                if (totalHours === 0) return null
                
                return (
                  <div
                    key={mode}
                    className="p-3 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">{getModeIcon(mode)}</div>
                      <div className="text-sm font-medium">{formatMode(mode)}</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-primary">
                      {totalHours.toFixed(2)}h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {modeEntries.length} {modeEntries.length === 1 ? 'Eintrag' : 'Einträge'}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Heute</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, dd. MMMM yyyy')}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono">{totalHoursToday.toFixed(2)}h</div>
              <div className="text-xs text-muted-foreground">Gesamt heute</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <EmptyDayView onAddTime={() => setShowQuickEntry(true)} />
          ) : (
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <InlineEditableTimeEntry
                  key={entry.id}
                  entry={entry}
                  projects={projects}
                  tasks={tasks}
                  phases={phases}
                  onSave={(updatedEntry) => {
                    setTimeEntries((current = []) =>
                      current.map(e => e.id === updatedEntry.id ? updatedEntry : e)
                    )
                    toast.success('Eintrag aktualisiert')
                  }}
                  onDelete={(entryId) => {
                    setTimeEntries((current = []) =>
                      current.filter(e => e.id !== entryId)
                    )
                    toast.success('Eintrag gelöscht')
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
