import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Employee, Project, Task, Phase, TimeEntry, ApprovalStatus, ActivityMode, AuditMetadata } from '@/lib/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { Clock, FloppyDisk } from '@phosphor-icons/react'

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
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employees.length > 0 ? employees[0].id : '')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [duration, setDuration] = useState<string>('')

  const availablePhases = phases.filter(ph => ph.projectId === selectedProject)
  const availableTasks = tasks.filter(t => 
    t.projectId === selectedProject && 
    (!selectedPhase || t.phaseId === selectedPhase)
  )

  const handleSave = () => {
    if (!selectedEmployee) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus')
      return
    }

    if (!selectedProject) {
      toast.error('Bitte wählen Sie ein Projekt aus')
      return
    }

    if (!duration || parseFloat(duration) <= 0) {
      toast.error('Bitte geben Sie eine gültige Dauer ein')
      return
    }

    const durationHours = parseFloat(duration)
    const now = new Date()
    const startTime = format(now, 'HH:mm')
    const endDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000)
    const endTime = format(endDate, 'HH:mm')

    const audit: AuditMetadata = createAuditMetadata(selectedEmployee, 'Browser')

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      tenantId: 'default',
      employeeId: selectedEmployee,
      projectId: selectedProject,
      phaseId: selectedPhase || undefined,
      taskId: selectedTask || undefined,
      date: format(now, 'yyyy-MM-dd'),
      startTime,
      endTime,
      duration: durationHours,
      tags: [],
      billable: true,
      approvalStatus: ApprovalStatus.DRAFT,
      locked: false,
      audit,
      changeLog: [],
      evidenceAnchors: [{
        type: 'system',
        timestamp: new Date().toISOString(),
        value: 'Schnelleintrag',
        verified: true
      }]
    }

    onSave(newEntry)
    toast.success(`${durationHours} Stunden gespeichert`)
    
    setDuration('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" weight="duotone" />
            Zeit erfassen
          </DialogTitle>
          <DialogDescription>
            Schnelleintrag - maximal 2 Klicks bis zum Speichern
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Mitarbeiter *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
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
            <Label htmlFor="project">Projekt *</Label>
            <Select 
              value={selectedProject} 
              onValueChange={(val) => {
                setSelectedProject(val)
                setSelectedPhase('')
                setSelectedTask('')
              }}
            >
              <SelectTrigger id="project">
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
                <SelectTrigger id="phase">
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
              <Label htmlFor="task">Task (optional)</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger id="task">
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

          <div className="space-y-2">
            <Label htmlFor="duration">Dauer (Stunden) *</Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              min="0"
              placeholder="z.B. 2.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('0.5')}
            >
              0.5h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('1')}
            >
              1h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('2')}
            >
              2h
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration('4')}
            >
              4h
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <FloppyDisk className="h-4 w-4" weight="duotone" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
