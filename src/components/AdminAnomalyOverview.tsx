import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Employee, TimeEntry, Absence } from '@/lib/types'
import { GapOvertimeAnalysis, GapOvertimeDetector, GapOvertimeType, Severity } from '@/lib/gap-overtime-detection'
import { useAllEmployeesGapOvertimeDetection } from '@/hooks/use-gap-overtime-detection'
import { WarningCircle, ClockCountdown, TrendUp, Calendar, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Separator } from '@/components/ui/separator'

interface AdminAnomalyOverviewProps {
  employees: Employee[]
  timeEntries: TimeEntry[]
  absences: Absence[]
}

export function AdminAnomalyOverview({
  employees,
  timeEntries,
  absences
}: AdminAnomalyOverviewProps) {
  const allAnalyses = useAllEmployeesGapOvertimeDetection(employees, timeEntries, absences)

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH:
        return 'bg-destructive/10 border-destructive/50 text-destructive'
      case Severity.MEDIUM:
        return 'bg-accent/10 border-accent/50 text-accent-foreground'
      case Severity.LOW:
        return 'bg-secondary/10 border-secondary/50 text-secondary-foreground'
      default:
        return 'bg-muted'
    }
  }

  const getTypeIcon = (type: GapOvertimeType) => {
    switch (type) {
      case GapOvertimeType.MISSING_HOURS:
      case GapOvertimeType.NO_ENTRIES:
        return <ClockCountdown className="h-4 w-4" weight="duotone" />
      case GapOvertimeType.OVERTIME:
        return <TrendUp className="h-4 w-4" weight="duotone" />
      case GapOvertimeType.WEEKEND_WORK:
        return <Calendar className="h-4 w-4" weight="duotone" />
      default:
        return <WarningCircle className="h-4 w-4" weight="duotone" />
    }
  }

  const totalIssues = Array.from(allAnalyses.values()).reduce(
    (sum, analysis) => sum + analysis.issues.length,
    0
  )

  const totalGaps = Array.from(allAnalyses.values()).reduce(
    (sum, analysis) => sum + analysis.summary.totalGaps,
    0
  )

  const totalOvertime = Array.from(allAnalyses.values()).reduce(
    (sum, analysis) => sum + analysis.summary.totalOvertime,
    0
  )

  const totalMissingHours = Array.from(allAnalyses.values()).reduce(
    (sum, analysis) => sum + analysis.summary.totalMissingHours,
    0
  )

  const affectedEmployees = allAnalyses.size

  const allIssues = Array.from(allAnalyses.entries()).flatMap(([employeeId, analysis]) =>
    analysis.issues.map((issue) => ({
      ...issue,
      employeeId
    }))
  )

  const sortedIssues = allIssues.sort((a, b) => {
    if (a.severity !== b.severity) {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return b.date.localeCompare(a.date)
  })

  if (allAnalyses.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" weight="duotone" />
            Anomalie-Übersicht
          </CardTitle>
          <CardDescription>Zeiterfassungs-Anomalien der letzten 7 Tage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-16 w-16 mx-auto mb-3 opacity-50 text-green-500" />
            <p className="font-semibold">Keine Anomalien erkannt</p>
            <p className="text-sm mt-1">Alle Mitarbeiter haben vollständige Zeiterfassungen</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WarningCircle className="h-5 w-5 text-accent" weight="duotone" />
          Anomalie-Übersicht
        </CardTitle>
        <CardDescription>
          Zeiterfassungs-Anomalien der letzten 7 Tage für alle Mitarbeiter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-3xl font-bold text-foreground">{affectedEmployees}</div>
            <div className="text-xs text-muted-foreground mt-1">Betroffene MA</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <div className="text-3xl font-bold text-destructive">{totalGaps}</div>
            <div className="text-xs text-muted-foreground mt-1">Lücken</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/10">
            <div className="text-3xl font-bold text-accent">{totalOvertime}</div>
            <div className="text-xs text-muted-foreground mt-1">Überstunden</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-3xl font-bold text-primary">{totalIssues}</div>
            <div className="text-xs text-muted-foreground mt-1">Gesamt</div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
            Alle Anomalien ({totalIssues})
          </h4>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {sortedIssues.map((issue) => {
                const employee = employees.find((e) => e.id === issue.employeeId)
                
                return (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      getSeverityColor(issue.severity)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(issue.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span>{employee?.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {issue.title}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {format(parseISO(issue.date), 'EEEE, dd.MM.yyyy', { locale: de })}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs mb-1">{issue.description}</p>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">
                            Erwartet: <span className="font-medium">{issue.expectedHours}h</span>
                          </span>
                          <span className="text-muted-foreground">
                            Erfasst: <span className="font-medium">{issue.actualHours.toFixed(1)}h</span>
                          </span>
                          <span
                            className={cn(
                              'font-medium',
                              issue.difference < 0 ? 'text-destructive' : 'text-accent'
                            )}
                          >
                            {issue.difference > 0 ? '+' : ''}
                            {issue.difference.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {totalMissingHours > 0 && (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <ClockCountdown className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" weight="duotone" />
              <div>
                <div className="font-semibold text-sm">Fehlende Stunden insgesamt</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Es fehlen <span className="font-bold text-destructive">{totalMissingHours.toFixed(1)} Stunden</span> bei{' '}
                  <span className="font-bold">{affectedEmployees} Mitarbeiter{affectedEmployees !== 1 ? 'n' : ''}</span> in den letzten 7 Tagen.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
