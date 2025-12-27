import { useState } from 'react'
import { Employee, Project, TimeEntry, MileageEntry } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartBar, FunnelSimple, Download, MagnifyingGlass } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'

interface ReportsScreenProps {
  employees: Employee[]
  projects: Project[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
}

export function ReportsScreen({
  employees,
  projects,
  timeEntries,
  mileageEntries
}: ReportsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterBillable, setFilterBillable] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredEntries = timeEntries.filter(entry => {
    if (filterEmployee !== 'all' && entry.employeeId !== filterEmployee) return false
    if (filterProject !== 'all' && entry.projectId !== filterProject) return false
    if (filterBillable === 'billable' && !entry.billable) return false
    if (filterBillable === 'non-billable' && entry.billable) return false
    if (filterStatus !== 'all' && entry.approvalStatus !== filterStatus) return false

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

  const projectStats = projects.map(project => {
    const projectEntries = filteredEntries.filter(e => e.projectId === project.id)
    const hours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
    return {
      project,
      hours,
      entries: projectEntries.length
    }
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours)

  const employeeStats = employees.map(employee => {
    const empEntries = filteredEntries.filter(e => e.employeeId === employee.id)
    const hours = empEntries.reduce((sum, e) => sum + e.duration, 0)
    return {
      employee,
      hours,
      entries: empEntries.length
    }
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours)

  const handleExport = () => {
    const csvHeaders = ['Datum', 'Mitarbeiter', 'Projekt', 'Start', 'Ende', 'Dauer (h)', 'Abrechenbar', 'Status', 'Notizen']
    const csvRows = filteredEntries.map(entry => {
      const employee = employees.find(e => e.id === entry.employeeId)
      const project = projects.find(p => p.id === entry.projectId)
      return [
        entry.date,
        employee?.name || '',
        project?.name || '',
        entry.startTime,
        entry.endTime,
        entry.duration.toFixed(2),
        entry.billable ? 'Ja' : 'Nein',
        entry.approvalStatus,
        entry.notes || ''
      ].map(v => `"${v}"`).join(',')
    })

    const csv = [csvHeaders.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `zeiterfassung-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" weight="duotone" />
            Berichte & Analysen
          </CardTitle>
          <CardDescription>Durchsuchen und filtern Sie Ihre Zeiteinträge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Projekt, Mitarbeiter, Tag oder Notiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV Export
            </Button>
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="submitted">Eingereicht</SelectItem>
                <SelectItem value="approved">Genehmigt</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>

            {(filterEmployee !== 'all' || filterProject !== 'all' || filterBillable !== 'all' || filterStatus !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterEmployee('all')
                  setFilterProject('all')
                  setFilterBillable('all')
                  setFilterStatus('all')
                  setSearchQuery('')
                }}
              >
                Filter zurücksetzen
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Projekte</CardTitle>
            <CardDescription>Nach Stunden sortiert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectStats.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Projekte gefunden</p>
              )}
              {projectStats.slice(0, 10).map(stat => (
                <div key={stat.project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium truncate">{stat.project.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{stat.hours.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">{stat.entries} Einträge</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Mitarbeiter</CardTitle>
            <CardDescription>Nach Stunden sortiert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeStats.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Mitarbeiter gefunden</p>
              )}
              {employeeStats.slice(0, 10).map(stat => (
                <div key={stat.employee.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {stat.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium">{stat.employee.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{stat.hours.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">{stat.entries} Einträge</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
