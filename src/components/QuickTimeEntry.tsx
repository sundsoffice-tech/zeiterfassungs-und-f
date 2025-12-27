import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Employee, Project, Task, Phase, TimeEntry, ApprovalStatus, ActivityMode } from '@/lib/types'
import { toast } from 'sonner'
import { format, addMinutes } from 'date-fns'
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [duration, setDuration] = useState<string>('')

  const availablePhases = phases.filter(p => p.projectId === selectedProject)
  const availableTasks = tasks.filter(t => 
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

    const now = new Date()
    const startTime = format(now, 'HH:mm')
    const durationHours = parseFloat(duration)
    const endTime = format(addMinutes(now, durationHours * 60), 'HH:mm')
    
    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      tenantId: 'default',
      employeeId: selectedEmployee,
      projectId: selectedProject,
      phaseId: selectedPhase || undefined,
      taskId: selectedTask || undefined,
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
    
    setSelectedEmployee('')
    setSelectedProject('')
    setSelectedPhase('')
    setSelectedTask('')
    setDuration('')
    
    toast.success('Zeiteintrag erfolgreich gespeichert')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" weight="duotone" />
            Schnelleintrag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Mitarbeiter *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
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
