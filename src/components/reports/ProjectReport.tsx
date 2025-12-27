import { useState } from 'react'
import { Employee, Project, Task, TimeEntry } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartLine, Users, Clock, CurrencyCircleDollar, TrendUp, CaretDown, CaretRight } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { TimeEntryTimeline } from '@/components/reports/TimeEntryTimeline'

interface ProjectReportProps {
  projects: Project[]
  employees: Employee[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  onClose: () => void
}

interface ProjectAnalysis {
  project: Project
  totalHours: number
  billableHours: number
  nonBillableHours: number
  budgetUsed: number
  budgetRemaining: number
  budgetProgress: number
  forecast: number
  employeeBreakdown: {
    employee: Employee
    hours: number
    billableHours: number
  }[]
  taskBreakdown: {
    task: Task
    hours: number
    entries: number
  }[]
  dailyBreakdown: {
    date: string
    hours: number
    billableHours: number
  }[]
  totalRevenue: number
  totalCost: number
}

export function ProjectReport({ projects, employees, tasks, timeEntries, onClose }: ProjectReportProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const analyzeProject = (project: Project): ProjectAnalysis => {
    const projectEntries = timeEntries.filter(e => e.projectId === project.id)
    const totalHours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
    const billableHours = projectEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0)
    const nonBillableHours = totalHours - billableHours

    const budgetHours = project.budget || 0
    const budgetUsed = totalHours
    const budgetRemaining = Math.max(0, budgetHours - budgetUsed)
    const budgetProgress = budgetHours > 0 ? (budgetUsed / budgetHours) * 100 : 0
    
    const avgHoursPerDay = projectEntries.length > 0 ? totalHours / new Set(projectEntries.map(e => e.date)).size : 0
    const forecast = budgetRemaining > 0 && avgHoursPerDay > 0 ? budgetUsed + (avgHoursPerDay * 7) : budgetUsed

    const employeeMap = new Map<string, { hours: number; billableHours: number }>()
    projectEntries.forEach(entry => {
      const current = employeeMap.get(entry.employeeId) || { hours: 0, billableHours: 0 }
      employeeMap.set(entry.employeeId, {
        hours: current.hours + entry.duration,
        billableHours: current.billableHours + (entry.billable ? entry.duration : 0)
      })
    })

    const employeeBreakdown = Array.from(employeeMap.entries())
      .map(([empId, data]) => ({
        employee: employees.find(e => e.id === empId)!,
        hours: data.hours,
        billableHours: data.billableHours
      }))
      .filter(e => e.employee)
      .sort((a, b) => b.hours - a.hours)

    const taskMap = new Map<string, { hours: number; entries: number }>()
    projectEntries.forEach(entry => {
      if (entry.taskId) {
        const current = taskMap.get(entry.taskId) || { hours: 0, entries: 0 }
        taskMap.set(entry.taskId, {
          hours: current.hours + entry.duration,
          entries: current.entries + 1
        })
      }
    })

    const taskBreakdown = Array.from(taskMap.entries())
      .map(([taskId, data]) => ({
        task: tasks.find(t => t.id === taskId)!,
        hours: data.hours,
        entries: data.entries
      }))
      .filter(t => t.task)
      .sort((a, b) => b.hours - a.hours)

    const dailyMap = new Map<string, { hours: number; billableHours: number }>()
    projectEntries.forEach(entry => {
      const current = dailyMap.get(entry.date) || { hours: 0, billableHours: 0 }
      dailyMap.set(entry.date, {
        hours: current.hours + entry.duration,
        billableHours: current.billableHours + (entry.billable ? entry.duration : 0)
      })
    })

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        hours: data.hours,
        billableHours: data.billableHours
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalRevenue = projectEntries.reduce((sum, e) => sum + (e.rate || 0) * e.duration, 0)
    const totalCost = projectEntries.reduce((sum, e) => {
      const emp = employees.find(emp => emp.id === e.employeeId)
      return sum + (emp?.hourlyRate || 0) * e.duration
    }, 0)

    return {
      project,
      totalHours,
      billableHours,
      nonBillableHours,
      budgetUsed,
      budgetRemaining,
      budgetProgress,
      forecast,
      employeeBreakdown,
      taskBreakdown,
      dailyBreakdown,
      totalRevenue,
      totalCost
    }
  }

  const projectAnalyses = projects
    .map(analyzeProject)
    .filter(a => a.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours)

  const selectedAnalysis = selectedProjectId 
    ? projectAnalyses.find(a => a.project.id === selectedProjectId)
    : null

  if (selectedAnalysis) {
    const analysis = selectedAnalysis

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedProjectId(null)} className="mb-2 -ml-2">
              ← Zurück zu allen Projekten
            </Button>
            <h2 className="text-2xl font-bold">{analysis.project.name}</h2>
            <p className="text-sm text-muted-foreground">{analysis.project.description}</p>
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
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  Abrechenbar: {analysis.billableHours.toFixed(1)}h
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {analysis.budgetUsed.toFixed(0)}h / {analysis.project.budget || 0}h
              </div>
              <Progress value={analysis.budgetProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.budgetProgress.toFixed(0)}% verbraucht
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Restbudget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {analysis.budgetRemaining.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.budgetProgress > 100 ? (
                  <span className="text-destructive font-medium">Budget überschritten!</span>
                ) : analysis.budgetProgress > 80 ? (
                  <span className="text-orange-600 font-medium">Kritisch</span>
                ) : (
                  'Verfügbar'
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prognose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono flex items-center gap-1">
                <TrendUp className="h-5 w-5" weight="bold" />
                {analysis.forecast.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                7-Tage-Projektion
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList>
            <TabsTrigger value="employees">Mitarbeiter</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="entries">Alle Einträge</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="financial">Finanzen</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" weight="duotone" />
                  Mitarbeiter-Breakdown
                </CardTitle>
                <CardDescription>Stundenverteilung nach Mitarbeiter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.employeeBreakdown.map(item => {
                    const isExpanded = expandedEmployee === item.employee.id
                    const empEntries = timeEntries.filter(
                      e => e.projectId === analysis.project.id && e.employeeId === item.employee.id
                    )

                    return (
                      <div key={item.employee.id} className="border rounded-lg p-3">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedEmployee(isExpanded ? null : item.employee.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {item.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium">{item.employee.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.billableHours.toFixed(1)}h abrechenbar / {item.hours.toFixed(1)}h gesamt
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-lg">{item.hours.toFixed(1)}h</div>
                            <div className="text-xs text-muted-foreground">
                              {((item.hours / analysis.totalHours) * 100).toFixed(0)}% des Projekts
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pl-10 space-y-2">
                            <div className="text-sm font-medium mb-2">Einträge ({empEntries.length}):</div>
                            {empEntries.slice(0, 10).map(entry => {
                              const task = tasks.find(t => t.id === entry.taskId)
                              return (
                                <div key={entry.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        {format(parseISO(entry.date), 'dd.MM.yyyy', { locale: de })}
                                      </span>
                                      {task && <span className="text-xs">• {task.name}</span>}
                                      {entry.billable && <Badge variant="outline" className="text-xs">Abrechenbar</Badge>}
                                    </div>
                                    {entry.notes && (
                                      <div className="text-xs text-muted-foreground truncate">{entry.notes}</div>
                                    )}
                                  </div>
                                  <div className="font-mono text-sm font-medium">{entry.duration.toFixed(1)}h</div>
                                </div>
                              )
                            })}
                            {empEntries.length > 10 && (
                              <div className="text-xs text-muted-foreground text-center pt-2">
                                und {empEntries.length - 10} weitere Einträge...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine className="h-5 w-5" weight="duotone" />
                  Task-Breakdown
                </CardTitle>
                <CardDescription>Stundenverteilung nach Task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.taskBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Tasks zugeordnet</p>
                  ) : (
                    analysis.taskBreakdown.map(item => {
                      const isExpanded = expandedTask === item.task.id
                      const taskEntries = timeEntries.filter(
                        e => e.projectId === analysis.project.id && e.taskId === item.task.id
                      )

                      return (
                        <div key={item.task.id} className="border rounded-lg p-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedTask(isExpanded ? null : item.task.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {isExpanded ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
                              <div>
                                <div className="font-medium">{item.task.name}</div>
                                <div className="text-xs text-muted-foreground">{item.entries} Einträge</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-lg">{item.hours.toFixed(1)}h</div>
                              <div className="text-xs text-muted-foreground">
                                {((item.hours / analysis.totalHours) * 100).toFixed(0)}% des Projekts
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pl-8 space-y-2">
                              {taskEntries.slice(0, 10).map(entry => {
                                const emp = employees.find(e => e.id === entry.employeeId)
                                return (
                                  <div key={entry.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                          {format(parseISO(entry.date), 'dd.MM.yyyy', { locale: de })}
                                        </span>
                                        {emp && <span className="text-xs">• {emp.name}</span>}
                                      </div>
                                    </div>
                                    <div className="font-mono text-sm font-medium">{entry.duration.toFixed(1)}h</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-4">
            <TimeEntryTimeline
              entries={timeEntries.filter(e => e.projectId === analysis.project.id)}
              employees={employees}
              projects={projects}
              tasks={tasks}
              title={`Alle Zeiteinträge für ${analysis.project.name}`}
              description="Vollständige Übersicht mit Timer-Details und Notizen"
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" weight="duotone" />
                  Täglicher Stundenverlauf
                </CardTitle>
                <CardDescription>Burn-up Chart der Stunden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.dailyBreakdown.map((day, idx) => {
                    const cumulative = analysis.dailyBreakdown
                      .slice(0, idx + 1)
                      .reduce((sum, d) => sum + d.hours, 0)
                    
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground w-24">
                          {format(parseISO(day.date), 'dd.MM.yyyy', { locale: de })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div 
                                className="bg-primary h-full flex items-center justify-end pr-2"
                                style={{ width: `${Math.min(100, (day.hours / 8) * 100)}%` }}
                              >
                                <span className="text-xs font-medium text-primary-foreground">
                                  {day.hours.toFixed(1)}h
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground w-20 text-right font-mono">
                              Σ {cumulative.toFixed(1)}h
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umsatz (geschätzt)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-green-600">
                    €{analysis.totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.billableHours.toFixed(1)}h abrechenbar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kosten (geschätzt)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-orange-600">
                    €{analysis.totalCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mitarbeiterkosten
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Marge (geschätzt)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    €{(analysis.totalRevenue - analysis.totalCost).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.totalRevenue > 0 
                      ? `${(((analysis.totalRevenue - analysis.totalCost) / analysis.totalRevenue) * 100).toFixed(0)}%`
                      : '0%'} Marge
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CurrencyCircleDollar className="h-5 w-5" weight="duotone" />
                  Billable Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Abrechenbare Stunden</span>
                      <span className="text-sm font-mono font-bold">
                        {analysis.billableHours.toFixed(1)}h / {analysis.totalHours.toFixed(1)}h
                      </span>
                    </div>
                    <Progress 
                      value={(analysis.billableHours / analysis.totalHours) * 100} 
                      className="h-3"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold font-mono">
                      {((analysis.billableHours / analysis.totalHours) * 100).toFixed(0)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Billable Ratio</p>
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
          <h2 className="text-2xl font-bold">Projektberichte</h2>
          <p className="text-sm text-muted-foreground">Detaillierte Analyse aller Projekte</p>
        </div>
        <Button variant="outline" onClick={onClose}>Schließen</Button>
      </div>

      <div className="grid gap-4">
        {projectAnalyses.map(analysis => (
          <Card 
            key={analysis.project.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedProjectId(analysis.project.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{analysis.project.name}</h3>
                    <Badge variant={analysis.budgetProgress > 100 ? 'destructive' : 'outline'}>
                      {analysis.budgetProgress.toFixed(0)}% Budget
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{analysis.totalHours.toFixed(1)}h</span>
                      <span className="text-muted-foreground">gesamt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{analysis.employeeBreakdown.length}</span>
                      <span className="text-muted-foreground">Mitarbeiter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-green-600">
                        {analysis.billableHours.toFixed(1)}h
                      </span>
                      <span className="text-muted-foreground">abrechenbar</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Budget</div>
                  <div className="font-mono text-lg font-bold">
                    {analysis.budgetUsed.toFixed(0)}h / {analysis.project.budget || 0}h
                  </div>
                  <Progress value={analysis.budgetProgress} className="w-32 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projectAnalyses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Keine Projekte mit Zeiteinträgen gefunden</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
