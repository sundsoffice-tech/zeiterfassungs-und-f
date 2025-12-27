import { useState, useEffect } from 'react'
import { TimeEntry, Project, Task, Phase } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Pencil, Trash, Clock } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface InlineEditableTimeEntryProps {
  entry: TimeEntry
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  onSave: (entry: TimeEntry) => void
  onDelete: (entryId: string) => void
  readOnly?: boolean
}

export function InlineEditableTimeEntry({
  entry,
  projects,
  tasks,
  phases,
  onSave,
  onDelete,
  readOnly = false
}: InlineEditableTimeEntryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEntry, setEditedEntry] = useState(entry)

  const project = projects.find(p => p.id === entry.projectId)
  const task = tasks.find(t => t.id === entry.taskId)
  const phase = phases.find(ph => ph.id === entry.phaseId)

  const availablePhases = phases.filter(ph => ph.projectId === editedEntry.projectId)
  const availableTasks = tasks.filter(t => 
    t.projectId === editedEntry.projectId && 
    (!editedEntry.phaseId || t.phaseId === editedEntry.phaseId)
  )

  useEffect(() => {
    setEditedEntry(entry)
  }, [entry])

  const handleSave = () => {
    onSave(editedEntry)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedEntry(entry)
    setIsEditing(false)
  }

  const formatDuration = (minutes: number) => {
    const hours = (minutes / 60).toFixed(2)
    return `${hours}h`
  }

  const timeToMinutes = (timeStr: string): number => {
    const [hours, mins] = timeStr.split(':').map(Number)
    return hours * 60 + mins
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-4 p-4 rounded-lg border transition-all',
          !readOnly && 'hover:border-primary/50 hover:bg-accent/20 cursor-pointer'
        )}
        onClick={() => !readOnly && setIsEditing(true)}
      >
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
          <Clock className="h-6 w-6" weight="duotone" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">
              {project?.name || 'Unbekanntes Projekt'}
            </h4>
            {task && (
              <Badge variant="outline" className="text-xs">
                {task.name}
              </Badge>
            )}
            {phase && (
              <Badge variant="secondary" className="text-xs">
                {phase.name}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-1">
            {entry.startTime} - {entry.endTime}
            {' • '}
            {format(new Date(entry.date), 'EEEE, dd. MMMM', { locale: de })}
          </p>
          
          {entry.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {entry.notes}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-bold font-mono">
            {formatDuration(entry.duration)}
          </div>
          {entry.billable && (
            <Badge variant="default" className="text-xs mt-1">
              Abrechenbar
            </Badge>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Pencil className="h-4 w-4" weight="bold" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(entry.id)
              }}
            >
              <Trash className="h-4 w-4" weight="bold" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border-2 border-primary bg-accent/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block">Projekt *</label>
          <Select
            value={editedEntry.projectId}
            onValueChange={(value) => setEditedEntry({ ...editedEntry, projectId: value, phaseId: undefined, taskId: undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Projekt wählen" />
            </SelectTrigger>
            <SelectContent>
              {projects.filter(p => p.active).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availablePhases.length > 0 && (
          <div>
            <label className="text-xs font-medium mb-1.5 block">Phase</label>
            <Select
              value={editedEntry.phaseId || 'none'}
              onValueChange={(value) => setEditedEntry({ ...editedEntry, phaseId: value === 'none' ? undefined : value, taskId: undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Phase wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Phase</SelectItem>
                {availablePhases.map(ph => (
                  <SelectItem key={ph.id} value={ph.id}>
                    {ph.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {availableTasks.length > 0 && (
          <div>
            <label className="text-xs font-medium mb-1.5 block">Aufgabe</label>
            <Select
              value={editedEntry.taskId || 'none'}
              onValueChange={(value) => setEditedEntry({ ...editedEntry, taskId: value === 'none' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aufgabe wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Aufgabe</SelectItem>
                {availableTasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium mb-1.5 block">Startzeit</label>
          <Input
            type="time"
            value={editedEntry.startTime}
            onChange={(e) => {
              const startTime = e.target.value
              const startMins = timeToMinutes(startTime)
              const endMins = timeToMinutes(editedEntry.endTime)
              const duration = endMins - startMins
              setEditedEntry({ ...editedEntry, startTime, duration })
            }}
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block">Endzeit</label>
          <Input
            type="time"
            value={editedEntry.endTime}
            onChange={(e) => {
              const endTime = e.target.value
              const startMins = timeToMinutes(editedEntry.startTime)
              const endMins = timeToMinutes(endTime)
              const duration = endMins - startMins
              setEditedEntry({ ...editedEntry, endTime, duration })
            }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block">Notizen</label>
        <Textarea
          value={editedEntry.notes || ''}
          onChange={(e) => setEditedEntry({ ...editedEntry, notes: e.target.value })}
          placeholder="Was wurde gemacht?"
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm font-medium">
          Dauer: <span className="font-mono text-primary">{formatDuration(editedEntry.duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" weight="bold" />
            Abbrechen
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-2"
          >
            <Check className="h-4 w-4" weight="bold" />
            Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
