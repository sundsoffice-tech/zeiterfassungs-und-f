import { useState, useEffect } from 'react'
import { Employee, Project, Task, Phase, TimeEntry, ActiveTimer, UserRole, AuditMetadata, ApprovalStatus, Absence } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, Stop, Star, Clock, Lightning, Plus } from '@phosphor-icons/react'
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
  const [elapsedTime, setElapsedTime] = useState(0)

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

    const newTimer: ActiveTimer = {
      id: `timer-${Date.now()}`,
      employeeId: selectedEmployee,
      projectId: selectedProject,
      phaseId: selectedPhase || undefined,
      taskId: selectedTask || undefined,
      startTime: Date.now(),
      pausedDuration: 0,
      billable: true,
      isPaused: false
    }

    setActiveTimer(newTimer)
    toast.success('Timer gestartet')
  }

  const handlePause = () => {
    if (!activeTimer) return

    if (activeTimer.isPaused) {
      const pauseDuration = Date.now() - (activeTimer.pausedAt || Date.now())
      setActiveTimer({
        ...activeTimer,
        isPaused: false,
        pausedDuration: activeTimer.pausedDuration + pauseDuration,
        pausedAt: undefined
      })
      toast.success('Timer fortgesetzt')
    } else {
      setActiveTimer({
        ...activeTimer,
        isPaused: true,
        pausedAt: Date.now()
      })
      toast.success('Timer pausiert')
    }
  }

  const handleStop = () => {
    if (!activeTimer) return

    const endTime = Date.now()
    const duration = (endTime - activeTimer.startTime - activeTimer.pausedDuration) / 1000 / 3600

    const currentDate = format(new Date(), 'yyyy-MM-dd')
    const startTimeStr = format(new Date(activeTimer.startTime), 'HH:mm')
    const endTimeStr = format(new Date(endTime), 'HH:mm')

    const audit: AuditMetadata = createAuditMetadata(activeTimer.employeeId, 'Browser')

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
      tags: activeTimer.tags,
      location: activeTimer.location,
      notes: activeTimer.notes,
      costCenter: activeTimer.costCenter,
      billable: activeTimer.billable,
      approvalStatus: ApprovalStatus.DRAFT,
      locked: false,
      audit,
      changeLog: []
    }

    setTimeEntries((current = []) => [...current, newEntry])
    setActiveTimer(null)
    setElapsedTime(0)
    toast.success(`${duration.toFixed(2)} Stunden gespeichert`)
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

  return (
    <div className="space-y-6">
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
                <Button 
                  onClick={handleSwitch} 
                  size="lg" 
                  variant="outline" 
                  className="gap-2"
                >
                  <Lightning className="h-5 w-5" weight="fill" />
                  Wechseln
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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
          {todayEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Einträge für heute</p>
            </div>
          )}
          <div className="space-y-3">
            {todayEntries.map((entry) => {
              const project = projects.find(p => p.id === entry.projectId)
              const employee = employees.find(e => e.id === entry.employeeId)
              return (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project?.name || 'Unbekanntes Projekt'}</span>
                      {entry.billable && (
                        <Badge variant="secondary" className="text-xs">Abrechenbar</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {employee?.name} • {entry.startTime} - {entry.endTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{entry.duration.toFixed(2)}h</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
