import { useState } from 'react'
import { Employee, Project, TimeEntry, MileageEntry, Task, Absence } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartBar, FunnelSimple, Download, MagnifyingGlass, FolderOpen, User, ShieldCheck, Brain, Tag } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ProjectReport } from '@/components/reports/ProjectReport'
import { EmployeeReport } from '@/components/reports/EmployeeReport'
import { AuditReport } from '@/components/reports/AuditReport'
import { AIInsightsReport } from '@/components/reports/AIInsightsReport'
import { exportTimeEntries, exportMileageEntries, EXPORT_FORMATS } from '@/lib/advanced-export'
import { toast } from 'sonner'

interface ReportsScreenProps {
  employees: Employee[]
  projects: Project[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
  tasks?: Task[]
  absences?: Absence[]
}

export function ReportsScreen({
  employees,
  projects,
  timeEntries,
  mileageEntries,
  tasks = [],
  absences = []
}: ReportsScreenProps) {
  const [activeReport, setActiveReport] = useState<'overview' | 'project' | 'employee' | 'audit' | 'ai'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterBillable, setFilterBillable] = useState<string>('all')
  const [exportFormat, setExportFormat] = useState('standard_csv')

  const filteredEntries = timeEntries.filter(entry => {
    if (filterEmployee !== 'all' && entry.employeeId !== filterEmployee) return false
    if (filterProject !== 'all' && entry.projectId !== filterProject) return false
    if (filterBillable === 'billable' && !entry.billable) return false
    if (filterBillable === 'non-billable' && entry.billable) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const project = projects.find(p => p.id === entry.projectId)
      const employee = employees.find(e => e.id === entry.employeeId)
      return (
        project?.name.toLowerCase().includes(query) ||
        employee?.name.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return true
  })

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.duration, 0)
  const billableHours = filteredEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0)
  const nonBillableHours = totalHours - billableHours

  const handleExportTimeEntries = () => {
    try {
      exportTimeEntries(exportFormat, filteredEntries, employees, projects, tasks)
      toast.success('Export erfolgreich', {
        description: `${filteredEntries.length} Einträge exportiert als ${EXPORT_FORMATS.find(f => f.id === exportFormat)?.name}`
      })
    } catch (error) {
      toast.error('Export fehlgeschlagen')
    }
  }

  const handleExportMileage = () => {
    try {
      exportMileageEntries(mileageEntries, employees, projects)
      toast.success('Fahrtkosten exportiert', {
        description: `${mileageEntries.length} Einträge exportiert`
      })
    } catch (error) {
      toast.error('Export fehlgeschlagen')
    }
  }

  if (activeReport === 'project') {
    return (
      <ProjectReport
        projects={projects}
        employees={employees}
        tasks={tasks}
        timeEntries={filteredEntries}
        onClose={() => setActiveReport('overview')}
      />
    )
  }

  if (activeReport === 'employee') {
    return (
      <EmployeeReport
        employees={employees}
        projects={projects}
        tasks={tasks}
        timeEntries={filteredEntries}
        absences={absences}
        onClose={() => setActiveReport('overview')}
      />
    )
  }

  if (activeReport === 'audit') {
    return (
      <AuditReport
        employees={employees}
        projects={projects}
        timeEntries={filteredEntries}
        onClose={() => setActiveReport('overview')}
      />
    )
  }

  if (activeReport === 'ai') {
    return (
      <AIInsightsReport
        employees={employees}
        projects={projects}
        tasks={tasks}
        timeEntries={filteredEntries}
        onClose={() => setActiveReport('overview')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" weight="duotone" />
            Berichte & Analysen
          </CardTitle>
          <CardDescription>Umfassende Reports „bis ins letzte Detail"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Projekt, Mitarbeiter, Tag oder Notiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple className="h-4 w-4 text-muted-foreground" />
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle Projekte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Projekte</SelectItem>
                {projects.map(proj => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBillable} onValueChange={setFilterBillable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Abrechenbarkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="billable">Abrechenbar</SelectItem>
                <SelectItem value="non-billable">Nicht abrechenbar</SelectItem>
              </SelectContent>
            </Select>

            {(filterEmployee !== 'all' || filterProject !== 'all' || filterBillable !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterEmployee('all')
                  setFilterProject('all')
                  setFilterBillable('all')
                  setSearchQuery('')
                }}
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap border-t pt-4">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(fmt => (
                  <SelectItem key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExportTimeEntries} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Zeiteinträge Export
            </Button>

            {mileageEntries.length > 0 && (
              <Button onClick={handleExportMileage} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Fahrtkosten Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gesamtstunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{totalHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1">{filteredEntries.length} Einträge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abrechenbar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-green-600">{billableHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              {((billableHours / totalHours) * 100 || 0).toFixed(0)}% der Gesamtzeit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nicht abrechenbar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-orange-600">{nonBillableHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              {((nonBillableHours / totalHours) * 100 || 0).toFixed(0)}% der Gesamtzeit
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standardreports mit Drill-down</CardTitle>
          <CardDescription>Detaillierte Berichte für verschiedene Perspektiven</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2" onClick={() => setActiveReport('project')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Projektbericht</h3>
                    <p className="text-xs text-muted-foreground">{projects.length} Projekte</p>
                  </div>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Ist-Stunden nach Mitarbeiter/Task/Tag</li>
                  <li>• Budget & Prognose</li>
                  <li>• Burn-up/Burn-down Timeline</li>
                  <li>• Abrechenbar vs. nicht abrechenbar</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2" onClick={() => setActiveReport('employee')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mitarbeiterbericht</h3>
                    <p className="text-xs text-muted-foreground">{employees.length} Mitarbeiter</p>
                  </div>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Wochenübersicht & Auslastung</li>
                  <li>• Billable Ratio</li>
                  <li>• Überstunden & Abwesenheit</li>
                  <li>• Qualitätsindikatoren</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2" onClick={() => setActiveReport('audit')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-orange-600" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Audit & Compliance</h3>
                    <p className="text-xs text-muted-foreground">Prüfbar</p>
                  </div>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Alle Änderungen (Wer/Was/Wann)</li>
                  <li>• Einträge außerhalb Normalzeit</li>
                  <li>• Nachträgliche Einträge &gt;X Tage</li>
                  <li>• Exportfähig als PDF</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 border-primary" onClick={() => setActiveReport('ai')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">KI-Insights</h3>
                    <p className="text-xs text-muted-foreground">Admin Only</p>
                  </div>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Top 10 Anomalien + Begründung</li>
                  <li>• Häufigste Fehlerquellen</li>
                  <li>• Projekte mit Risiko-Score</li>
                  <li>• Empfohlene Maßnahmen</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
