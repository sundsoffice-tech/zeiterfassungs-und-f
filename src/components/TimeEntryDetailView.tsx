import { TimeEntry, ActivityMode, TimerEventType, TimerEvent, Employee, Project, Task, Phase } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Play, Pause, ArrowsClockwise, Stop, CalendarBlank, User, FolderOpen, ListChecks, Tag, MapPin, CurrencyCircleDollar, FileText, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { formatMode, getModeIcon, getModeColor, formatTimerEventForDisplay } from '@/lib/timer-events'

interface TimeEntryDetailViewProps {
  entry: TimeEntry
  employee?: Employee
  project?: Project
  task?: Task
  phase?: Phase
  showTimerHistory?: boolean
}

export function TimeEntryDetailView({
  entry,
  employee,
  project,
  task,
  phase,
  showTimerHistory = true
}: TimeEntryDetailViewProps) {
  const hasEvents = entry.evidenceAnchors && entry.evidenceAnchors.length > 0
  const timerEvents = hasEvents 
    ? entry.evidenceAnchors!
        .filter(a => a.type === 'calendar' || a.type === 'file' || a.type === 'location_hash' || a.type === 'approval' || a.type === 'system')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : []

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="h-4 w-4 text-green-600" weight="fill" />
      case 'pause':
        return <Pause className="h-4 w-4 text-orange-600" weight="fill" />
      case 'resume':
        return <ArrowsClockwise className="h-4 w-4 text-blue-600" weight="fill" />
      case 'stop':
        return <Stop className="h-4 w-4 text-red-600" weight="fill" />
      case 'mode_switch':
        return <ArrowRight className="h-4 w-4 text-purple-600" weight="fill" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'start':
        return 'Timer gestartet'
      case 'pause':
        return 'Pause'
      case 'resume':
        return 'Fortgesetzt'
      case 'stop':
        return 'Timer gestoppt'
      case 'mode_switch':
        return 'Modus gewechselt'
      default:
        return type
    }
  }

  const parseEventValue = (value: string) => {
    try {
      return JSON.parse(value)
    } catch {
      return { mode: value }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" weight="duotone" />
            Zeiterfassungs-Details
          </CardTitle>
          <CardDescription>
            {format(parseISO(entry.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Startzeit</div>
              <div className="text-lg font-mono font-bold">{entry.startTime} Uhr</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Endzeit</div>
              <div className="text-lg font-mono font-bold">{entry.endTime} Uhr</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Dauer</div>
              <div className="text-lg font-mono font-bold text-primary">{entry.duration.toFixed(2)}h</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Abrechenbar</div>
              <div>
                {entry.billable ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                    Ja
                  </Badge>
                ) : (
                  <Badge variant="secondary">Nein</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {employee && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Mitarbeiter:</span>
                <span className="font-medium">{employee.name}</span>
              </div>
            )}

            {project && (
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Projekt:</span>
                <span className="font-medium">{project.name}</span>
              </div>
            )}

            {phase && (
              <div className="flex items-center gap-2">
                <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Phase:</span>
                <span className="font-medium">{phase.name}</span>
              </div>
            )}

            {task && (
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Aufgabe:</span>
                <span className="font-medium">{task.name}</span>
              </div>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" weight="duotone" />
                <span className="text-sm text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Ort:</span>
                <span className="font-medium">{entry.location}</span>
              </div>
            )}

            {entry.costCenter && (
              <div className="flex items-center gap-2">
                <CurrencyCircleDollar className="h-4 w-4 text-muted-foreground" weight="duotone" />
                <span className="text-sm text-muted-foreground">Kostenstelle:</span>
                <span className="font-medium">{entry.costCenter}</span>
              </div>
            )}

            {entry.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" weight="duotone" />
                <span className="text-sm text-muted-foreground">Notizen:</span>
                <p className="flex-1 text-sm">{entry.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showTimerHistory && timerEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowsClockwise className="h-5 w-5" weight="duotone" />
              Timer-Historie
            </CardTitle>
            <CardDescription>
              Detaillierte Zeitstempel aller Timer-Ereignisse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {timerEvents.map((event, index) => {
                  const eventData = parseEventValue(event.value)
                  const eventTime = format(new Date(event.timestamp), 'HH:mm:ss', { locale: de })
                  
                  return (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{getEventLabel(event.type)}</span>
                          <span className="text-xs font-mono text-muted-foreground">{eventTime}</span>
                        </div>
                        {eventData.mode && (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              <span className="ml-1">{eventData.mode}</span>
                            </Badge>
                          </div>
                        )}
                        {event.verified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                            Verifiziert
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {entry.changeLog && entry.changeLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" weight="duotone" />
              Änderungsverlauf
            </CardTitle>
            <CardDescription>
              Alle Änderungen an diesem Eintrag
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {entry.changeLog.map((log, index) => (
                  <div key={index} className="pb-3 border-b last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                      </span>
                      <Badge variant="outline" className="text-xs">{log.device || 'Unbekannt'}</Badge>
                    </div>
                    {log.reason && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Grund: {log.reason}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Vorher:</div>
                        <pre className="bg-muted/50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Nachher:</div>
                        <pre className="bg-muted/50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Audit-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Erstellt am:</span>
              <div className="font-mono">
                {format(new Date(entry.audit.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Erstellt von:</span>
              <div className="font-medium">{entry.audit.createdBy}</div>
            </div>
            {entry.audit.updatedAt && (
              <>
                <div>
                  <span className="text-muted-foreground">Geändert am:</span>
                  <div className="font-mono">
                    {format(new Date(entry.audit.updatedAt), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Geändert von:</span>
                  <div className="font-medium">{entry.audit.updatedBy || '-'}</div>
                </div>
              </>
            )}
            {entry.audit.device && (
              <div>
                <span className="text-muted-foreground">Gerät:</span>
                <div className="font-medium">{entry.audit.device}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
