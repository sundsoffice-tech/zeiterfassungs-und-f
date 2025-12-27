import { useState, useMemo } from 'react'
import { Employee, Project, TimeEntry, Task } from '@/lib/types'
import {
  TimeEntryWithTrust,
  calculatePlausibilityScore,
  generateProjectTrustReport,
  generateEmployeeTrustReport,
  getTrustLevelBadgeColor,
  getTrustLevelLabel,
  EvidenceAnchor
} from '@/lib/trust-layer'
import { generateTrustReportText, exportTrustReportCSV, downloadTrustReport } from '@/lib/trust-export'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ShieldCheck,
  TrendUp,
  Users,
  FolderOpen,
  CheckCircle,
  Warning,
  XCircle,
  Calendar,
  MapPin,
  FileText,
  Eye,
  Download,
  FileCsv,
  FileText as FileTextIcon
} from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDuration } from '@/lib/helpers'
import { format, parseISO, subDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

interface TrustLayerScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
}

export function TrustLayerScreen({
  employees,
  projects,
  tasks,
  timeEntries
}: TrustLayerScreenProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [activeView, setActiveView] = useState<'overview' | 'projects' | 'employees' | 'entries'>('overview')

  const entriesWithTrust = useMemo<TimeEntryWithTrust[]>(() => {
    return timeEntries.map(entry => {
      const trustMetrics = calculatePlausibilityScore(
        entry,
        timeEntries,
        employees,
        []
      )
      return {
        ...entry,
        trustMetrics
      }
    })
  }, [timeEntries, employees])

  const filteredEntries = useMemo(() => {
    let filtered = entriesWithTrust
    if (selectedProject !== 'all') {
      filtered = filtered.filter(e => e.projectId === selectedProject)
    }
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(e => e.employeeId === selectedEmployee)
    }
    return filtered
  }, [entriesWithTrust, selectedProject, selectedEmployee])

  const overallStats = useMemo(() => {
    const total = filteredEntries.length
    const avgScore = total > 0
      ? filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.plausibilityScore || 0), 0) / total
      : 0

    const highTrust = filteredEntries.filter(e => e.trustMetrics?.trustLevel === 'high').length
    const mediumTrust = filteredEntries.filter(e => e.trustMetrics?.trustLevel === 'medium').length
    const lowTrust = filteredEntries.filter(e => e.trustMetrics?.trustLevel === 'low').length
    const unverified = filteredEntries.filter(e => e.trustMetrics?.trustLevel === 'unverified').length

    const withEvidence = filteredEntries.filter(e =>
      e.trustMetrics?.evidenceAnchors && e.trustMetrics.evidenceAnchors.length > 0
    ).length

    const manualCorrections = filteredEntries.filter(e => e.changeLog && e.changeLog.length > 0).length

    return {
      total,
      avgScore: Math.round(avgScore),
      highTrust,
      mediumTrust,
      lowTrust,
      unverified,
      withEvidence,
      manualCorrections,
      highTrustPercent: total > 0 ? Math.round((highTrust / total) * 100) : 0,
      evidenceRate: total > 0 ? Math.round((withEvidence / total) * 100) : 0,
      correctionRate: total > 0 ? Math.round((manualCorrections / total) * 100) : 0
    }
  }, [filteredEntries])

  const projectReports = useMemo(() => {
    return projects.map(project =>
      generateProjectTrustReport(project.id, project.name, filteredEntries)
    ).filter(r => r.totalEntries > 0)
      .sort((a, b) => b.averagePlausibility - a.averagePlausibility)
  }, [projects, filteredEntries])

  const employeeReports = useMemo(() => {
    return employees.map(employee =>
      generateEmployeeTrustReport(employee.id, employee.name, filteredEntries)
    ).filter(r => r.totalEntries > 0)
      .sort((a, b) => b.averagePlausibility - a.averagePlausibility)
  }, [employees, filteredEntries])

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'calendar': return <Calendar className="h-4 w-4" />
      case 'location_hash': return <MapPin className="h-4 w-4" />
      case 'file': return <FileText className="h-4 w-4" />
      case 'approval': return <CheckCircle className="h-4 w-4" />
      default: return <ShieldCheck className="h-4 w-4" />
    }
  }

  const handleExportProjectReport = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const report = projectReports.find(r => r.projectId === projectId)
    if (!report) return

    const oldestEntry = filteredEntries
      .filter(e => e.projectId === projectId)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    const newestEntry = filteredEntries
      .filter(e => e.projectId === projectId)
      .sort((a, b) => b.date.localeCompare(a.date))[0]

    const startDate = oldestEntry?.date || format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const endDate = newestEntry?.date || format(new Date(), 'yyyy-MM-dd')

    const content = generateTrustReportText(report, project, startDate, endDate)
    const filename = `Vertrauensbericht_${project.name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.txt`
    
    downloadTrustReport(content, filename, 'text')
    toast.success('Vertrauensbericht exportiert')
  }

  const handleExportCSV = () => {
    const content = exportTrustReportCSV(filteredEntries, projects, employees)
    const filename = `Trust_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    
    downloadTrustReport(content, filename, 'csv')
    toast.success('CSV-Export abgeschlossen')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Beweis- & Vertrauens-Layer</h2>
        <p className="text-muted-foreground mt-1">
          Objektive Plausibilität ohne Überwachung
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alle Projekte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Projekte</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alle Mitarbeiter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mitarbeiter</SelectItem>
            {employees.map(employee => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileCsv className="h-4 w-4" />
            CSV Export
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <ShieldCheck className="h-4 w-4" weight="duotone" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen className="h-4 w-4" weight="duotone" />
            Projekte
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" weight="duotone" />
            Mitarbeiter
          </TabsTrigger>
          <TabsTrigger value="entries" className="gap-2">
            <Eye className="h-4 w-4" weight="duotone" />
            Einträge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Durchschnittlicher Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">{overallStats.avgScore}%</div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendUp className="h-3 w-3 mr-1" weight="bold" />
                    Hoch
                  </Badge>
                </div>
                <Progress value={overallStats.avgScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Vertrauenswürdige Einträge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats.highTrustPercent}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats.highTrust} von {overallStats.total} Einträgen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mit Beweisankern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats.evidenceRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats.withEvidence} mit Nachweis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Manuelle Korrekturen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats.correctionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats.manualCorrections} Korrekturen
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vertrauens-Verteilung</CardTitle>
                <CardDescription>Kategorisierung nach Plausibilität</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                      <span className="text-sm font-medium">Hoch (≥85%)</span>
                    </div>
                    <span className="text-sm font-bold">{overallStats.highTrust}</span>
                  </div>
                  <Progress value={(overallStats.highTrust / overallStats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Warning className="h-5 w-5 text-yellow-600" weight="fill" />
                      <span className="text-sm font-medium">Mittel (70-84%)</span>
                    </div>
                    <span className="text-sm font-bold">{overallStats.mediumTrust}</span>
                  </div>
                  <Progress value={(overallStats.mediumTrust / overallStats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Warning className="h-5 w-5 text-orange-600" weight="fill" />
                      <span className="text-sm font-medium">Niedrig (50-69%)</span>
                    </div>
                    <span className="text-sm font-bold">{overallStats.lowTrust}</span>
                  </div>
                  <Progress value={(overallStats.lowTrust / overallStats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" weight="fill" />
                      <span className="text-sm font-medium">Ungeprüft (&lt;50%)</span>
                    </div>
                    <span className="text-sm font-bold">{overallStats.unverified}</span>
                  </div>
                  <Progress value={(overallStats.unverified / overallStats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualitäts-Metriken</CardTitle>
                <CardDescription>Vertrauensindikatoren im Detail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Zeitliche Konsistenz</span>
                      <span className="font-medium">
                        {Math.round(
                          filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.temporalConsistency || 0), 0) / 
                          filteredEntries.length
                        )}%
                      </span>
                    </div>
                    <Progress value={
                      filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.temporalConsistency || 0), 0) / 
                      filteredEntries.length
                    } />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Plan vs. Ist</span>
                      <span className="font-medium">
                        {Math.round(
                          filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.planVsActual || 0), 0) / 
                          filteredEntries.length
                        )}%
                      </span>
                    </div>
                    <Progress value={
                      filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.planVsActual || 0), 0) / 
                      filteredEntries.length
                    } />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Projekt-Historie</span>
                      <span className="font-medium">
                        {Math.round(
                          filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.projectHistory || 0), 0) / 
                          filteredEntries.length
                        )}%
                      </span>
                    </div>
                    <Progress value={
                      filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.projectHistory || 0), 0) / 
                      filteredEntries.length
                    } />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Team-Vergleich</span>
                      <span className="font-medium">
                        {Math.round(
                          filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.teamComparison || 0), 0) / 
                          filteredEntries.length
                        )}%
                      </span>
                    </div>
                    <Progress value={
                      filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.teamComparison || 0), 0) / 
                      filteredEntries.length
                    } />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Beweisqualität</span>
                      <span className="font-medium">
                        {Math.round(
                          filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.evidenceQuality || 0), 0) / 
                          filteredEntries.length
                        )}%
                      </span>
                    </div>
                    <Progress value={
                      filteredEntries.reduce((sum, e) => sum + (e.trustMetrics?.factors.evidenceQuality || 0), 0) / 
                      filteredEntries.length
                    } />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projekt-Vertrauensreports</CardTitle>
              <CardDescription>Plausibilität nach Projekt</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {projectReports.map(report => (
                    <Card key={report.projectId} className="border-l-4" style={{
                      borderLeftColor: report.averagePlausibility >= 85 ? '#16a34a' :
                        report.averagePlausibility >= 70 ? '#ca8a04' :
                        report.averagePlausibility >= 50 ? '#ea580c' : '#dc2626'
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{report.projectName}</CardTitle>
                            <CardDescription>{report.totalEntries} Einträge</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              report.averagePlausibility >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
                              report.averagePlausibility >= 70 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              report.averagePlausibility >= 50 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }>
                              {report.averagePlausibility}% Score
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleExportProjectReport(report.projectId)}
                              className="h-8 w-8 p-0"
                            >
                              <FileTextIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-green-600">{report.highTrust}</div>
                            <div className="text-xs text-muted-foreground">Hoch</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-yellow-600">{report.mediumTrust}</div>
                            <div className="text-xs text-muted-foreground">Mittel</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-orange-600">{report.lowTrust}</div>
                            <div className="text-xs text-muted-foreground">Niedrig</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-red-600">{report.unverified}</div>
                            <div className="text-xs text-muted-foreground">Ungeprüft</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span>Mit Beweisankern:</span>
                          <span className="font-medium">{report.evidenceAnchored} ({Math.round((report.evidenceAnchored / report.totalEntries) * 100)}%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Manuelle Korrekturen:</span>
                          <span className="font-medium">{report.manualCorrections} ({Math.round((report.manualCorrections / report.totalEntries) * 100)}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mitarbeiter-Vertrauensreports</CardTitle>
              <CardDescription>Plausibilität nach Mitarbeiter</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {employeeReports.map(report => (
                    <Card key={report.employeeId} className="border-l-4" style={{
                      borderLeftColor: report.averagePlausibility >= 85 ? '#16a34a' :
                        report.averagePlausibility >= 70 ? '#ca8a04' :
                        report.averagePlausibility >= 50 ? '#ea580c' : '#dc2626'
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{report.employeeName}</CardTitle>
                            <CardDescription>{report.totalEntries} Einträge</CardDescription>
                          </div>
                          <Badge className={
                            report.averagePlausibility >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
                            report.averagePlausibility >= 70 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            report.averagePlausibility >= 50 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }>
                            {report.averagePlausibility}% Score
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Konsistenz-Score:</span>
                            <span className="font-medium">{report.consistencyScore}%</span>
                          </div>
                          <Progress value={report.consistencyScore} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Beweisanker-Nutzung:</span>
                            <span className="font-medium">{report.evidenceUsageRate}%</span>
                          </div>
                          <Progress value={report.evidenceUsageRate} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Einzelne Einträge mit Vertrauens-Details</CardTitle>
              <CardDescription>Detaillierte Plausibilitätsanalyse</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredEntries.slice(0, 50).map(entry => {
                    const project = projects.find(p => p.id === entry.projectId)
                    const employee = employees.find(e => e.id === entry.employeeId)
                    const task = tasks.find(t => t.id === entry.taskId)

                    return (
                      <Card key={entry.id} className="border-l-4" style={{
                        borderLeftColor: !entry.trustMetrics ? '#9ca3af' :
                          entry.trustMetrics.trustLevel === 'high' ? '#16a34a' :
                          entry.trustMetrics.trustLevel === 'medium' ? '#ca8a04' :
                          entry.trustMetrics.trustLevel === 'low' ? '#ea580c' : '#dc2626'
                      }}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{project?.name || 'Unbekannt'}</CardTitle>
                              <CardDescription>
                                {employee?.name} • {format(parseISO(entry.date), 'EEE, dd. MMM yyyy', { locale: de })}
                                {task && ` • ${task.name}`}
                              </CardDescription>
                            </div>
                            {entry.trustMetrics && (
                              <Badge className={getTrustLevelBadgeColor(entry.trustMetrics.trustLevel)}>
                                {entry.trustMetrics.plausibilityScore}%
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Zeit:</span>
                            <span className="font-medium font-mono">{entry.startTime} - {entry.endTime} ({formatDuration(entry.duration)})</span>
                          </div>

                          {entry.trustMetrics && (
                            <>
                              <Separator />
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Plausibilitätsfaktoren:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Zeitl. Konsistenz:</span>
                                    <span className="font-medium">{entry.trustMetrics.factors.temporalConsistency}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan vs. Ist:</span>
                                    <span className="font-medium">{entry.trustMetrics.factors.planVsActual}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Projekt-Historie:</span>
                                    <span className="font-medium">{entry.trustMetrics.factors.projectHistory}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Team-Vergleich:</span>
                                    <span className="font-medium">{entry.trustMetrics.factors.teamComparison}%</span>
                                  </div>
                                </div>
                              </div>

                              {entry.trustMetrics.evidenceAnchors.length > 0 && (
                                <>
                                  <Separator />
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">Beweisanker:</div>
                                    <div className="space-y-1">
                                      {entry.trustMetrics.evidenceAnchors.map((anchor, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs">
                                          <div className="mt-0.5">{getEvidenceIcon(anchor.type)}</div>
                                          <div className="flex-1">
                                            <div className="font-medium">{anchor.value}</div>
                                            <div className="text-muted-foreground">
                                              {format(parseISO(anchor.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                                            </div>
                                          </div>
                                          {anchor.verified && (
                                            <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {entry.trustMetrics.flaggedIssues.length > 0 && (
                                <>
                                  <Separator />
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-orange-600">Hinweise:</div>
                                    <div className="space-y-1">
                                      {entry.trustMetrics.flaggedIssues.map((issue, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-orange-600">
                                          <Warning className="h-4 w-4 mt-0.5" weight="fill" />
                                          <span>{issue}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
