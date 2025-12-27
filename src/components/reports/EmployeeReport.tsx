import { useState } from 'react'
import { Employee, Project, Task, TimeEntry, Absence } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Clock, Warning, CheckCircle, CalendarBlank, TrendUp } from '@phosphor-icons/react'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'

interface EmployeeReportProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  absences: Absence[]
  onClose: () => void
}

interface EmployeeAnalysis {
  employee: Employee
  totalHours: number
  billableHours: number
  nonBillableHours: number
  billableRatio: number
  weeklyBreakdown: {
    weekStart: string
    hours: number
    billableHours: number
    overtime: number
  }[]
  projectBreakdown: {
    project: Project
    hours: number
    billableHours: number
  }[]
  absenceDays: number
  qualityScore: {
    corrections: number
    warnings: number
    lateSubmissions: number
    score: number
  }
  avgHoursPerDay: number
}

export function EmployeeReport({ employees, projects, tasks, timeEntries, absences, onClose }: EmployeeReportProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month')

  const analyzeEmployee = (employee: Employee): EmployeeAnalysis => {
    const empEntries = timeEntries.filter(e => e.employeeId === employee.id)
    const totalHours = empEntries.reduce((sum, e) => sum + e.duration, 0)
    const billableHours = empEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0)
    const nonBillableHours = totalHours - billableHours
    const billableRatio = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    const weekMap = new Map<string, { hours: number; billableHours: number }>()
    empEntries.forEach(entry => {
      const date = parseISO(entry.date)
      const weekStart = format(startOfWeek(date, { locale: de }), 'yyyy-MM-dd')
      const current = weekMap.get(weekStart) || { hours: 0, billableHours: 0 }
      weekMap.set(weekStart, {
        hours: current.hours + entry.duration,
        billableHours: current.billableHours + (entry.billable ? entry.duration : 0)
      })
    })

    const weeklyBreakdown = Array.from(weekMap.entries())
      .map(([weekStart, data]) => ({
        weekStart,
        hours: data.hours,
        billableHours: data.billableHours,
        overtime: Math.max(0, data.hours - 40)
      }))
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, 12)

    const projectMap = new Map<string, { hours: number; billableHours: number }>()
    empEntries.forEach(entry => {
      const current = projectMap.get(entry.projectId) || { hours: 0, billableHours: 0 }
      projectMap.set(entry.projectId, {
        hours: current.hours + entry.duration,
        billableHours: current.billableHours + (entry.billable ? entry.duration : 0)
      })
    })

    const projectBreakdown = Array.from(projectMap.entries())
      .map(([projId, data]) => ({
        project: projects.find(p => p.id === projId)!,
        hours: data.hours,
        billableHours: data.billableHours
      }))
      .filter(p => p.project)
      .sort((a, b) => b.hours - a.hours)

    const empAbsences = absences.filter(a => a.employeeId === employee.id)
    const absenceDays = empAbsences.reduce((sum, a) => sum + a.days, 0)

    const corrections = empEntries.filter(e => e.changeLog && e.changeLog.length > 1).length
    const warnings = empEntries.filter(e => e.duration > 12 || (e.duration === 8 && e.duration % 1 === 0)).length
    
    const today = new Date()
    const lateSubmissions = empEntries.filter(e => {
      const entryDate = parseISO(e.date)
      const createdDate = e.audit?.createdAt ? parseISO(e.audit.createdAt) : entryDate
      return differenceInDays(createdDate, entryDate) > 3
    }).length

    const qualityScore = Math.max(0, 100 - (corrections * 2) - (warnings * 1) - (lateSubmissions * 3))

    const daysWorked = new Set(empEntries.map(e => e.date)).size
    const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0

    return {
      employee,
      totalHours,
      billableHours,
      nonBillableHours,
      billableRatio,
      weeklyBreakdown,
      projectBreakdown,
      absenceDays,
      qualityScore: {
        corrections,
        warnings,
        lateSubmissions,
        score: qualityScore
      },
      avgHoursPerDay
    }
  }

  const employeeAnalyses = employees
    .map(analyzeEmployee)
    .filter(a => a.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours)

  const selectedAnalysis = selectedEmployeeId
    ? employeeAnalyses.find(a => a.employee.id === selectedEmployeeId)
    : null

  if (selectedAnalysis) {
    const analysis = selectedAnalysis

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedEmployeeId(null)} className="mb-2 -ml-2">
              ← Zurück zu allen Mitarbeitern
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                {analysis.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{analysis.employee.name}</h2>
                <p className="text-sm text-muted-foreground">{analysis.employee.email}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtstunden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{analysis.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ø {analysis.avgHoursPerDay.toFixed(1)}h/Tag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Billable Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{analysis.billableRatio.toFixed(0)}%</div>
              <Progress value={analysis.billableRatio} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualitätsscore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono flex items-center gap-2">
                {analysis.qualityScore.score}
                {analysis.qualityScore.score >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                ) : analysis.qualityScore.score >= 70 ? (
                  <Warning className="h-5 w-5 text-orange-600" weight="fill" />
                ) : (
                  <Warning className="h-5 w-5 text-destructive" weight="fill" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.qualityScore.score >= 90 ? 'Ausgezeichnet' : analysis.qualityScore.score >= 70 ? 'Gut' : 'Verbesserungsbedarf'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Abwesenheit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{analysis.absenceDays} Tage</div>
              <p className="text-xs text-muted-foreground mt-1">Urlaub, Krank, etc.</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList>
            <TabsTrigger value="weekly">Wochenübersicht</TabsTrigger>
            <TabsTrigger value="projects">Projekte</TabsTrigger>
            <TabsTrigger value="quality">Qualität</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarBlank className="h-5 w-5" weight="duotone" />
                  Wochenübersicht & Auslastung
                </CardTitle>
                <CardDescription>Stunden pro Woche mit Überstundenanalyse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.weeklyBreakdown.map(week => {
                    const weekEnd = format(
                      endOfWeek(parseISO(week.weekStart), { locale: de }),
                      'dd.MM.yyyy',
                      { locale: de }
                    )
                    const weekStartFormatted = format(parseISO(week.weekStart), 'dd.MM.yyyy', { locale: de })
                    const utilizationPercent = (week.hours / 40) * 100

                    return (
                      <div key={week.weekStart} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">
                            KW: {weekStartFormatted} - {weekEnd}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono font-bold">{week.hours.toFixed(1)}h</div>
                              <div className="text-xs text-muted-foreground">
                                {week.billableHours.toFixed(1)}h abrechenbar
                              </div>
                            </div>
                          </div>
                        </div>
                        <Progress value={Math.min(100, utilizationPercent)} className="h-2 mb-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Auslastung: {utilizationPercent.toFixed(0)}%</span>
                          {week.overtime > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{week.overtime.toFixed(1)}h Überstunden
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5" weight="duotone" />
                  Projektverteilung
                </CardTitle>
                <CardDescription>Arbeitszeitverteilung nach Projekten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.projectBreakdown.map(item => (
                    <div key={item.project.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.project.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{ width: `${(item.hours / analysis.totalHours) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {item.billableHours.toFixed(1)}h abrechenbar
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {((item.hours / analysis.totalHours) * 100).toFixed(0)}% der Zeit
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg">{item.hours.toFixed(1)}h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" weight="duotone" />
                  Qualitätsindikatoren
                </CardTitle>
                <CardDescription>Korrekturen, Warnungen und Compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Gesamtscore</span>
                      <span className="text-2xl font-bold font-mono">{analysis.qualityScore.score}/100</span>
                    </div>
                    <Progress value={analysis.qualityScore.score} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold font-mono text-orange-600">
                          {analysis.qualityScore.corrections}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Korrekturen</div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Einträge mit Änderungen
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold font-mono text-yellow-600">
                          {analysis.qualityScore.warnings}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Warnungen</div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Ungewöhnliche Einträge
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold font-mono text-destructive">
                          {analysis.qualityScore.lateSubmissions}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Verspätet</div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Einträge &gt;3 Tage spät
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Empfehlungen:</h4>
                    <div className="space-y-2">
                      {analysis.qualityScore.corrections > 10 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Warning className="h-4 w-4 text-orange-600 mt-0.5" weight="fill" />
                          <p className="text-muted-foreground">
                            Viele Korrekturen - Timer häufiger nutzen statt manuelle Eingabe
                          </p>
                        </div>
                      )}
                      {analysis.qualityScore.lateSubmissions > 5 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Warning className="h-4 w-4 text-destructive mt-0.5" weight="fill" />
                          <p className="text-muted-foreground">
                            Verspätete Einreichungen - tägliche Erfassung etablieren
                          </p>
                        </div>
                      )}
                      {analysis.qualityScore.score >= 90 && (
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" weight="fill" />
                          <p className="text-muted-foreground">
                            Ausgezeichnete Datenqualität - weiter so!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mitarbeiterberichte</h2>
          <p className="text-sm text-muted-foreground">Detaillierte Analyse aller Mitarbeiter</p>
        </div>
        <Button variant="outline" onClick={onClose}>Schließen</Button>
      </div>

      <div className="grid gap-4">
        {employeeAnalyses.map(analysis => (
          <Card
            key={analysis.employee.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedEmployeeId(analysis.employee.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                  {analysis.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{analysis.employee.name}</h3>
                    <Badge variant={analysis.qualityScore.score >= 90 ? 'default' : 'outline'}>
                      Score: {analysis.qualityScore.score}
                    </Badge>
                    <Badge variant={analysis.billableRatio >= 80 ? 'default' : 'secondary'}>
                      {analysis.billableRatio.toFixed(0)}% Billable
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{analysis.totalHours.toFixed(1)}h</span>
                      <span className="text-muted-foreground">gesamt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-green-600">
                        {analysis.billableHours.toFixed(1)}h
                      </span>
                      <span className="text-muted-foreground">abrechenbar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{analysis.projectBreakdown.length}</span>
                      <span className="text-muted-foreground">Projekte</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Ø Stunden/Tag</div>
                  <div className="font-mono text-xl font-bold">{analysis.avgHoursPerDay.toFixed(1)}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employeeAnalyses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Keine Mitarbeiter mit Zeiteinträgen gefunden</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
