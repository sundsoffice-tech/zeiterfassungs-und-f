import { TimeEntry, Employee, Project, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Eye, Play, Pause, ArrowsClockwise, Stop, MapPin, Tag, FileText } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useState } from 'react'
import { TimeEntryDetailView } from '@/components/TimeEntryDetailView'

interface TimeEntryTimelineProps {
  entries: TimeEntry[]
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  title?: string
  description?: string
}

export function TimeEntryTimeline({
  entries,
  employees,
  projects,
  tasks,
  title = 'Zeiteinträge',
  description = 'Detaillierte Übersicht aller erfassten Zeiten'
}: TimeEntryTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const handleViewDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setShowDetailDialog(true)
  }

  const getEventSummary = (entry: TimeEntry) => {
    if (!entry.evidenceAnchors || entry.evidenceAnchors.length === 0) {
      return 'Manuell erfasst'
    }

    const events = entry.evidenceAnchors
    const startEvents = events.filter(e => e.type === 'system' && e.value.includes('start'))
    const pauseEvents = events.filter(e => e.type === 'system' && e.value.includes('pause'))
    const resumeEvents = events.filter(e => e.type === 'system' && e.value.includes('resume'))

    if (startEvents.length > 0) {
      let summary = 'Timer verwendet'
      if (pauseEvents.length > 0) {
        summary += ` (${pauseEvents.length}× pausiert)`
      }
      return summary
    }

    return 'Erfasst'
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.startTime.localeCompare(a.startTime)
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" weight="duotone" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead className="text-center">Start</TableHead>
                  <TableHead className="text-center">Ende</TableHead>
                  <TableHead className="text-center">Dauer</TableHead>
                  <TableHead>Erfassung</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Keine Zeiteinträge gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEntries.map(entry => {
                    const employee = employees.find(e => e.id === entry.employeeId)
                    const project = projects.find(p => p.id === entry.projectId)
                    const task = tasks.find(t => t.id === entry.taskId)

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {format(parseISO(entry.date), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>{employee?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {project?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {entry.startTime}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {entry.endTime}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {entry.duration.toFixed(2)}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {getEventSummary(entry)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {entry.billable && (
                              <Badge variant="default" className="text-xs bg-green-600">€</Badge>
                            )}
                            {entry.tags && entry.tags.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-3 w-3" />
                              </Badge>
                            )}
                            {entry.location && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3" />
                              </Badge>
                            )}
                            {entry.notes && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Gesamt: {sortedEntries.length} Einträge
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Gesamtdauer:</span>
                <span className="font-mono font-bold text-foreground">
                  {sortedEntries.reduce((sum, e) => sum + e.duration, 0).toFixed(2)}h
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Abrechenbar:</span>
                <span className="font-mono font-bold text-green-600">
                  {sortedEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0).toFixed(2)}h
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vollständige Zeiterfassungs-Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <TimeEntryDetailView
              entry={selectedEntry}
              employee={employees.find(e => e.id === selectedEntry.employeeId)}
              project={projects.find(p => p.id === selectedEntry.projectId)}
              task={tasks.find(t => t.id === selectedEntry.taskId)}
              showTimerHistory={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
