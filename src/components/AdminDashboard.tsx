import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Employee,
  Project,
  Task,
  TimeEntry,
  MileageEntry,
  ActiveTimer,
  TimesheetPeriod,
  Absence,
  UserRole,
  ApprovalStatus,
  Warning,
  LiveStatus,
  KPI
} from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  TrendUp,
  TrendDown,
  Warning as WarningIcon,
  CheckCircle,
  Clock,
  FolderOpen,
  Users,
  CurrencyDollar,
  ChartBar,
  Target,
  Lightning,
  CalendarBlank,
  ShieldCheck
} from '@phosphor-icons/react'
import { calculateLiveStatuses, detectWarnings, calculateKPIs, getOpenApprovals } from '@/lib/admin-helpers'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface AdminDashboardProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
  activeTimer: ActiveTimer | null
  absences: Absence[]
}

export function AdminDashboard({
  employees,
  projects,
  tasks,
  timeEntries,
  mileageEntries,
  activeTimer,
  absences
}: AdminDashboardProps) {
  const [timesheetPeriods] = useKV<TimesheetPeriod[]>('timesheet_periods', [])
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [liveStatuses, setLiveStatuses] = useState<LiveStatus[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    const detectedWarnings = detectWarnings(
      timeEntries,
      mileageEntries,
      employees,
      projects,
      absences,
      timesheetPeriods || []
    )
    setWarnings(detectedWarnings)

    const statuses = calculateLiveStatuses(activeTimer, employees)
    setLiveStatuses(statuses)

    const calculatedKpis = calculateKPIs(timeEntries, mileageEntries, employees, projects)
    setKpis(calculatedKpis)
  }, [timeEntries, mileageEntries, employees, projects, absences, activeTimer, timesheetPeriods])

  const openApprovals = getOpenApprovals(timeEntries, mileageEntries)
  const criticalWarnings = warnings.filter(w => w.severity === 'critical')
  const highWarnings = warnings.filter(w => w.severity === 'high')

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unbekannt'
  }

  const getProjectName = (id?: string) => {
    if (!id) return 'Kein Projekt'
    return projects.find(p => p.id === id)?.name || 'Unbekannt'
  }

  const getTaskName = (id?: string) => {
    if (!id) return null
    return tasks.find(t => t.id === id)?.name || null
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}:${minutes.toString().padStart(2, '0')}h`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Kritisch</Badge>
      case 'high': return <Badge className="bg-orange-500 text-white">Hoch</Badge>
      case 'medium': return <Badge className="bg-yellow-500 text-white">Mittel</Badge>
      case 'low': return <Badge variant="secondary">Niedrig</Badge>
      default: return <Badge variant="outline">Info</Badge>
    }
  }

  const getKpiIcon = (kpiId: string) => {
    switch (kpiId) {
      case 'utilization': return Target
      case 'billable-hours': return Clock
      case 'active-projects': return FolderOpen
      case 'budget-compliance': return CurrencyDollar
      case 'profit-margin': return ChartBar
      default: return Lightning
    }
  }

  return (
    <div className="space-y-6">
      {(criticalWarnings.length > 0 || highWarnings.length > 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <WarningIcon className="h-5 w-5 text-orange-600" weight="duotone" />
          <AlertTitle className="text-orange-900">Achtung erforderlich</AlertTitle>
          <AlertDescription className="text-orange-800">
            {criticalWarnings.length > 0 && (
              <div className="font-medium">{criticalWarnings.length} kritische Warnungen</div>
            )}
            {highWarnings.length > 0 && (
              <div>{highWarnings.length} wichtige Warnungen</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Heute aktiv</CardDescription>
            <CardTitle className="text-2xl font-bold">{liveStatuses.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightning className="h-4 w-4" weight="duotone" />
              <span>Mitarbeiter arbeiten gerade</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Offene Genehmigungen</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {openApprovals.timeEntries.length + openApprovals.mileageEntries.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" weight="duotone" />
              <span>Warten auf Freigabe</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Warnungen</CardDescription>
            <CardTitle className="text-2xl font-bold">{warnings.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WarningIcon className="h-4 w-4" weight="duotone" />
              <span className="text-orange-600 font-medium">
                {criticalWarnings.length + highWarnings.length} erfordern Aufmerksamkeit
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Mitarbeiter</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {employees.filter(e => e.active).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" weight="duotone" />
              <span>Aktive Benutzer</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="live">Live-Status</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="warnings">Warnungen</TabsTrigger>
          <TabsTrigger value="approvals">Genehmigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightning className="h-5 w-5" weight="duotone" />
                  Heute aktiv
                </CardTitle>
                <CardDescription>Wer arbeitet woran (Live-Status)</CardDescription>
              </CardHeader>
              <CardContent>
                {liveStatuses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Keine aktiven Timer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveStatuses.map((status) => {
                      const employee = employees.find(e => e.id === status.employeeId)
                      const project = projects.find(p => p.id === status.projectId)
                      const task = status.taskId ? tasks.find(t => t.id === status.taskId) : null
                      
                      return (
                        <div key={status.employeeId} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {employee?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{employee?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {project?.name || 'Kein Projekt'}
                              {task && ` • ${task.name}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={status.status === 'working' ? 'default' : 'secondary'}>
                              {status.status === 'working' ? 'Aktiv' : 'Pausiert'}
                            </Badge>
                            <div className="text-sm font-mono mt-1">
                              {formatDuration(status.duration)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WarningIcon className="h-5 w-5" weight="duotone" />
                  Wichtigste Warnungen
                </CardTitle>
                <CardDescription>Kritische & wichtige Probleme</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {[...criticalWarnings, ...highWarnings].length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                      <p>Keine kritischen Warnungen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...criticalWarnings, ...highWarnings].slice(0, 10).map((warning) => (
                        <div
                          key={warning.id}
                          className={`p-3 rounded-lg border ${getSeverityColor(warning.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{warning.title}</div>
                              <div className="text-xs mt-1">{warning.description}</div>
                              {warning.employeeId && (
                                <div className="text-xs mt-1 opacity-75">
                                  {getEmployeeName(warning.employeeId)}
                                </div>
                              )}
                            </div>
                            {getSeverityBadge(warning.severity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5" weight="duotone" />
                Live-Status aller Mitarbeiter
              </CardTitle>
              <CardDescription>Echtzeitübersicht der aktuellen Aktivitäten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.filter(e => e.active).map((employee) => {
                  const status = liveStatuses.find(s => s.employeeId === employee.id)
                  
                  return (
                    <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{employee.name}</div>
                        {status ? (
                          <div className="text-sm text-muted-foreground">
                            {getProjectName(status.projectId)}
                            {status.taskId && ` • ${getTaskName(status.taskId)}`}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Nicht aktiv</div>
                        )}
                      </div>
                      {status ? (
                        <div className="text-right">
                          <Badge variant={status.status === 'working' ? 'default' : 'secondary'}>
                            {status.status === 'working' ? 'Aktiv' : 'Pausiert'}
                          </Badge>
                          <div className="text-sm font-mono mt-1">
                            {formatDuration(status.duration)}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Offline</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => {
              const Icon = getKpiIcon(kpi.id)
              const isAboveTarget = kpi.target ? kpi.value >= kpi.target : false
              
              return (
                <Card key={kpi.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs">{kpi.name}</CardDescription>
                      <Icon className="h-5 w-5 text-muted-foreground" weight="duotone" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {kpi.value.toFixed(kpi.unit === '%' ? 0 : 1)}
                        </span>
                        <span className="text-lg text-muted-foreground">{kpi.unit}</span>
                      </div>
                      
                      {kpi.target && (
                        <div className="flex items-center gap-2 text-sm">
                          {isAboveTarget ? (
                            <TrendUp className="h-4 w-4 text-green-600" weight="bold" />
                          ) : (
                            <TrendDown className="h-4 w-4 text-red-600" weight="bold" />
                          )}
                          <span className={isAboveTarget ? 'text-green-600' : 'text-red-600'}>
                            Ziel: {kpi.target}{kpi.unit}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {kpi.period}
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {kpi.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WarningIcon className="h-5 w-5" weight="duotone" />
                Alle Warnungen
              </CardTitle>
              <CardDescription>
                {warnings.length} Warnungen insgesamt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Alle ({warnings.length})</TabsTrigger>
                  <TabsTrigger value="critical">Kritisch ({criticalWarnings.length})</TabsTrigger>
                  <TabsTrigger value="high">Hoch ({highWarnings.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {warnings.map((warning) => (
                        <div
                          key={warning.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{warning.title}</span>
                                {getSeverityBadge(warning.severity)}
                              </div>
                              <div className="text-sm mb-2">{warning.description}</div>
                              <div className="flex items-center gap-4 text-xs opacity-75">
                                {warning.employeeId && (
                                  <span>👤 {getEmployeeName(warning.employeeId)}</span>
                                )}
                                {warning.projectId && (
                                  <span>📁 {getProjectName(warning.projectId)}</span>
                                )}
                                <span>📅 {format(parseISO(warning.date), 'dd. MMM yyyy', { locale: de })}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Bestätigen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="critical" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {criticalWarnings.map((warning) => (
                        <div
                          key={warning.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{warning.title}</span>
                                {getSeverityBadge(warning.severity)}
                              </div>
                              <div className="text-sm mb-2">{warning.description}</div>
                              <div className="flex items-center gap-4 text-xs opacity-75">
                                {warning.employeeId && (
                                  <span>👤 {getEmployeeName(warning.employeeId)}</span>
                                )}
                                {warning.projectId && (
                                  <span>📁 {getProjectName(warning.projectId)}</span>
                                )}
                                <span>📅 {format(parseISO(warning.date), 'dd. MMM yyyy', { locale: de })}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Bestätigen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="high" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {highWarnings.map((warning) => (
                        <div
                          key={warning.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{warning.title}</span>
                                {getSeverityBadge(warning.severity)}
                              </div>
                              <div className="text-sm mb-2">{warning.description}</div>
                              <div className="flex items-center gap-4 text-xs opacity-75">
                                {warning.employeeId && (
                                  <span>👤 {getEmployeeName(warning.employeeId)}</span>
                                )}
                                {warning.projectId && (
                                  <span>📁 {getProjectName(warning.projectId)}</span>
                                )}
                                <span>📅 {format(parseISO(warning.date), 'dd. MMM yyyy', { locale: de })}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Bestätigen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" weight="duotone" />
                  Offene Zeiteinträge
                </CardTitle>
                <CardDescription>
                  {openApprovals.timeEntries.length} Einträge warten auf Genehmigung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {openApprovals.timeEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                      <p>Keine offenen Genehmigungen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {openApprovals.timeEntries.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {getEmployeeName(entry.employeeId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {getProjectName(entry.projectId)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(entry.date), 'dd. MMM yyyy', { locale: de })} • {entry.duration.toFixed(1)}h
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-red-600">
                                ✕
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarBlank className="h-5 w-5" weight="duotone" />
                  Offene Fahrtenbücher
                </CardTitle>
                <CardDescription>
                  {openApprovals.mileageEntries.length} Einträge warten auf Genehmigung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {openApprovals.mileageEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                      <p>Keine offenen Genehmigungen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {openApprovals.mileageEntries.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {getEmployeeName(entry.employeeId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {entry.startLocation} → {entry.endLocation}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(entry.date), 'dd. MMM yyyy', { locale: de })} • {entry.distance} km
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-red-600">
                                ✕
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
