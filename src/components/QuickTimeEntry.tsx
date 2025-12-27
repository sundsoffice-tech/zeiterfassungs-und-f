import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format, addMinutes } from 'date-fns'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { Employee, Project, Task, Phase, TimeEntry, ApprovalStatus } from '@/lib/types'
import { Clock, FloppyDisk } from '@phosphor-icons/react'
import { useGlobalShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { announceToScreenReader } from '@/lib/accessibility'
import { useFormTelemetry } from '@/hooks/use-form-telemetry'

interface QuickTimeEntryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  onSave: (entry: TimeEntry) => void
}

export function QuickTimeEntry({
  open,
  onOpenChange,
  employees,
  projects,
  tasks,
  phases,
  onSave
}: QuickTimeEntryProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [duration, setDuration] = useState<string>('')

  const { trackValidationError, trackSaveSuccess } = useFormTelemetry({
    formName: 'QuickTimeEntry'
  })

  const availablePhases = phases.filter(p => p.projectId === selectedProject)
  const availableTasks = tasks.filter(t => 
    (!selectedPhase || t.phaseId === selectedPhase)
  )

  const handleSave = () => {
    const errors: Record<string, string> = {}

    if (!selectedEmployee) {
      errors.employee = 'Mitarbeiter ist erforderlich'
    }

    if (!selectedProject) {
      errors.project = 'Projekt ist erforderlich'
    }

    if (!duration || parseFloat(duration) <= 0) {
      errors.duration = 'Gültige Dauer ist erforderlich'
    }

    if (Object.keys(errors).length > 0) {
      trackValidationError(errors)
      const firstError = Object.values(errors)[0]
      toast.error(firstError)
      announceToScreenReader(`Fehler: ${firstError}`, 'assertive')
      return
    }

    const now = new Date()
    const startTime = format(now, 'HH:mm')
    const durationHours = parseFloat(duration)
    const endTime = format(addMinutes(now, durationHours * 60), 'HH:mm')
    
    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      tenantId: 'default',
      employeeId: selectedEmployee,
      projectId: selectedProject,
      phaseId: selectedPhase && selectedPhase !== 'none' ? selectedPhase : undefined,
      taskId: selectedTask && selectedTask !== 'none' ? selectedTask : undefined,
      date: format(now, 'yyyy-MM-dd'),
      startTime: startTime,
      endTime: endTime,
      duration: durationHours,
      tags: [],
      billable: true,
      approvalStatus: ApprovalStatus.DRAFT,
      locked: false,
      audit: createAuditMetadata(selectedEmployee),
      changeLog: [],
      evidenceAnchors: [{
        type: 'system',
        timestamp: now.toISOString(),
        value: 'Schnelleintrag',
        verified: true
      }]
    }

    onSave(newEntry)
    
    trackSaveSuccess({
      duration: durationHours,
      projectId: selectedProject,
      hasPhase: !!selectedPhase,
      hasTask: !!selectedTask
    })
    
    setSelectedEmployee('')
    setSelectedProject('')
    setSelectedPhase('')
    setSelectedTask('')
    setDuration('')
    
    toast.success('Zeiteintrag erfolgreich gespeichert')
    announceToScreenReader('Zeiteintrag erfolgreich gespeichert')
    onOpenChange(false)
  }

  useGlobalShortcuts(
    undefined,
    handleSave,
    open
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="quick-entry-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" weight="duotone" aria-hidden="true" />
            Schnelleintrag
          </DialogTitle>
          <DialogDescription id="quick-entry-description">
            Erfassen Sie schnell einen Zeiteintrag. Pflichtfelder sind mit * markiert. Speichern mit Strg+S oder Cmd+S.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Mitarbeiter <span className="text-destructive" aria-label="Pflichtfeld">*</span></Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee" aria-label="Mitarbeiter auswählen" aria-required="true">
                <SelectValue placeholder="Mitarbeiter wählen" />
              </SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.active).map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Projekt <span className="text-destructive" aria-label="Pflichtfeld">*</span></Label>
            <Select 
              value={selectedProject} 
              onValueChange={(val) => {
                setSelectedProject(val)
                setSelectedPhase('')
                setSelectedTask('')
              }}
            >
              <SelectTrigger id="project" aria-label="Projekt auswählen" aria-required="true">
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
              <Label htmlFor="phase">Phase (optional)</Label>
              <Select 
                value={selectedPhase} 
                onValueChange={(val) => {
                  setSelectedPhase(val)
                  setSelectedTask('')
                }}
              >
                <SelectTrigger id="phase" aria-label="Phase auswählen">
                  <SelectValue placeholder="Phase wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Phase</SelectItem>
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
              <Label htmlFor="task">Task (optional)</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger id="task" aria-label="Task auswählen">
                  <SelectValue placeholder="Task wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Task</SelectItem>
                  {availableTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="duration">Dauer (Stunden) <span className="text-destructive" aria-label="Pflichtfeld">*</span></Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              min="0"
              placeholder="z.B. 2.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              aria-required="true"
              aria-describedby="duration-help"
            />
            <p id="duration-help" className="text-xs text-muted-foreground">
              Geben Sie die Dauer in Stunden ein, z.B. 2.5 für 2 Stunden und 30 Minuten
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Schnellauswahl Dauer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('0.5')}
              aria-label="Dauer 0,5 Stunden setzen"
            >
              0.5h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('1')}
              aria-label="Dauer 1 Stunde setzen"
            >
              1h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('2')}
              aria-label="Dauer 2 Stunden setzen"
            >
              2h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('4')}
              aria-label="Dauer 4 Stunden setzen"
            >
              4h
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} aria-label="Dialog schließen ohne zu speichern">
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="gap-2" aria-label="Zeiteintrag speichern (Tastenkürzel: Strg+S)">
            <FloppyDisk className="h-4 w-4" weight="duotone" aria-hidden="true" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


