import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')

  const availableTasks = tasks.filter(t => 
    (!selectedPhase || t.phaseId === selectedPhase)

    if (!selectedEmployee) {
      return

      toast.error('Bitte wählen Sie ein Projekt aus
   

      return

    const now = new Date()
    const en


      id: `time-${Date.now(
      employeeId: selectedEmployee,
      phaseI
     

      tags: [],
      approvalStatus: ApprovalStatus.DRAFT,
      audit,
     

        verified: true
    }
    onSave(newEntry)
    
    onOpenChange(false)

    <Dialog open={open} onOpenChange={onOpenChange}>

            <Clock className="h-5
          </DialogTitle>
            Schnelleintrag
        </DialogHeader>
        <div className="space-y-4
            <Label htmlFor="employee">Mita
              <SelectTrigger id="employe
              </SelectTrigger>
                
              
                ))}
            </S

            <Label htmlFor="project">Projek
              value=
            
                setS
            >
                <Select
              <SelectContent>
                  <SelectItem ke
                  </Se
        
     

              <Label
                value={selectedPhase} 
    
                }}
                <Select
   

          
                    </SelectItem>
                </SelectContent>
            </div>

            <div className="space-y-2">
              <Select val
                  <Selec
                <SelectConten
                  {availableTasks.map(task => (
                      {task.na
                  ))}

          )}
          <div className="space-y-2">
            <Input
              type="number"
              min="0"
              value={duration}
            />

            <Button
              variant="outline"
              onClick={() => s
              0.5h
            <Button
              variant="outline
              onClick
              1h

              variant="outline"
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
