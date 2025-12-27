import { useState } from 'react'
import { Employee, Project, TimeEntry, ChangeLogEntry } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ShieldCheck, MagnifyingGlass, Clock, Warning, FileText } from '@phosphor-icons/react'
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns'
import { de } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AuditReportProps {
  employees: Employee[]
  projects: Project[]
  timeEntries: TimeEntry[]
  onClose: () => void
}

interface AuditEntry {
  entry: TimeEntry
  employee: Employee
  project: Project
  issues: string[]
  severity: 'low' | 'medium' | 'high'
}

export function AuditReport({ employees, projects, timeEntries, onClose }: AuditReportProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  const analyzeAuditCompliance = (): AuditEntry[] => {
    const auditEntries: AuditEntry[] = []
    const now = new Date()

    timeEntries.forEach(entry => {
      const employee = employees.find(e => e.id === entry.employeeId)
      const project = projects.find(p => p.id === entry.projectId)
      
      if (!employee || !project) return

      const issues: string[] = []
      let severity: 'low' | 'medium' | 'high' = 'low'

      const entryDate = parseISO(entry.date)
      const entryHour = parseInt(entry.startTime.split(':')[0])

      if (entry.changeLog && entry.changeLog.length > 0) {
        issues.push(`${entry.changeLog.length} Änderung(en) vorgenommen`)
        severity = 'medium'
      }

      if (entryHour < 6 || entryHour > 22) {
        issues.push(`Außerhalb Normalzeit: ${entry.startTime}`)
        severity = 'medium'
      }

      if (entry.audit?.createdAt) {
        const createdDate = parseISO(entry.audit.createdAt)
        const daysLate = differenceInDays(createdDate, entryDate)
        if (daysLate > 3) {
          issues.push(`Nachträglich erfasst: ${daysLate} Tage später`)
          severity = daysLate > 7 ? 'high' : 'medium'
        }
      }

      if (entry.duration > 12) {
        issues.push(`Ungewöhnlich lange Dauer: ${entry.duration.toFixed(1)}h`)
        severity = 'high'
      }

      if (entry.duration === 8 || entry.duration === 4) {
        issues.push('Exakte Rundung (möglicher Schätzwert)')
        severity = 'low'
      }

      if (!entry.notes || entry.notes.trim().length < 5) {
        issues.push('Keine/zu kurze Notiz')
        severity = 'low'
      }

      if (entry.locked && entry.changeLog && entry.changeLog.length > 0) {
        const hasPostLockChanges = entry.changeLog.some(log => {
          if (entry.approvedAt) {
            return parseISO(log.timestamp) > parseISO(entry.approvedAt)
          }
          return false
        })
        if (hasPostLockChanges) {
          issues.push('Änderung nach Sperrung!')
          severity = 'high'
        }
      }

      if (issues.length > 0) {
        auditEntries.push({
          entry,
          employee,
          project,
          issues,
          severity
        })
      }
    })

    return auditEntries.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  const getAllChangeLogs = (): Array<{
    entry: TimeEntry
    employee: Employee
    project: Project
    change: ChangeLogEntry
  }> => {
    const allChanges: Array<{
      entry: TimeEntry
      employee: Employee
      project: Project
      change: ChangeLogEntry
    }> = []

    timeEntries.forEach(entry => {
      const employee = employees.find(e => e.id === entry.employeeId)
      const project = projects.find(p => p.id === entry.projectId)
      
      if (!employee || !project) return

      entry.changeLog?.forEach(change => {
        allChanges.push({ entry, employee, project, change })
      })
    })

    return allChanges.sort((a, b) => 
      parseISO(b.change.timestamp).getTime() - parseISO(a.change.timestamp).getTime()
    )
  }

  const auditEntries = analyzeAuditCompliance()
  const allChangeLogs = getAllChangeLogs()

  const filteredAuditEntries = auditEntries.filter(item => {
    if (filterSeverity !== 'all' && item.severity !== filterSeverity) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.employee.name.toLowerCase().includes(query) ||
        item.project.name.toLowerCase().includes(query) ||
        item.issues.some(issue => issue.toLowerCase().includes(query))
      )
    }

    return true
  })

  const stats = {
    total: auditEntries.length,
    high: auditEntries.filter(e => e.severity === 'high').length,
    medium: auditEntries.filter(e => e.severity === 'medium').length,
    low: auditEntries.filter(e => e.severity === 'low').length,
    totalChanges: allChangeLogs.length,
    uniqueEmployeesWithIssues: new Set(auditEntries.map(e => e.employee.id)).size
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" weight="duotone" />
            Audit & Compliance Report
          </h2>
          <p className="text-sm text-muted-foreground">Alle Änderungen und Compliance-Vorfälle</p>
        </div>
        <Button variant="outline" onClick={onClose}>Schließen</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Vorfälle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Kritisch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{stats.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Hohe Priorität</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Mittel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-orange-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground mt-1">Mittlere Priorität</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Niedrig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.low}</div>
            <p className="text-xs text-muted-foreground mt-1">Niedrige Priorität</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Änderungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.totalChanges}</div>
            <p className="text-xs text-muted-foreground mt-1">Alle Änderungen</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="issues" className="w-full">
        <TabsList>
          <TabsTrigger value="issues">Compliance-Vorfälle</TabsTrigger>
          <TabsTrigger value="changes">Änderungsprotokoll</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Mitarbeiter, Projekt oder Problem..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'high', 'medium', 'low'] as const).map(sev => (
                    <Button
                      key={sev}
                      variant={filterSeverity === sev ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterSeverity(sev)}
                    >
                      {sev === 'all' ? 'Alle' : sev === 'high' ? 'Kritisch' : sev === 'medium' ? 'Mittel' : 'Niedrig'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredAuditEntries.map((item, idx) => (
                    <Card
                      key={`${item.entry.id}-${idx}`}
                      className={`border-l-4 ${
                        item.severity === 'high'
                          ? 'border-l-destructive'
                          : item.severity === 'medium'
                          ? 'border-l-orange-500'
                          : 'border-l-muted'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                item.severity === 'high' ? 'destructive' :
                                item.severity === 'medium' ? 'outline' : 'secondary'
                              }>
                                {item.severity === 'high' ? 'KRITISCH' : 
                                 item.severity === 'medium' ? 'MITTEL' : 'NIEDRIG'}
                              </Badge>
                              <span className="font-medium">{item.employee.name}</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{item.project.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(item.entry.date), 'dd.MM.yyyy', { locale: de })} • 
                              {item.entry.startTime} - {item.entry.endTime} ({item.entry.duration.toFixed(1)}h)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Probleme:</div>
                          {item.issues.map((issue, issueIdx) => (
                            <div key={issueIdx} className="flex items-start gap-2 text-sm">
                              <Warning className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" weight="fill" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>

                        {item.entry.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Notiz:</div>
                            <div className="text-sm">{item.entry.notes}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {filteredAuditEntries.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Keine Compliance-Vorfälle gefunden
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" weight="duotone" />
                Alle Änderungen (Wer/Was/Wann/Warum)
              </CardTitle>
              <CardDescription>Vollständiges Audit-Log aller Modifikationen</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {allChangeLogs.map((item, idx) => {
                    const changeUser = employees.find(e => e.id === item.change.userId)
                    
                    return (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {format(parseISO(item.change.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                                </span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm">{changeUser?.name || 'Unbekannt'}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.employee.name} • {item.project.name}
                                {item.change.device && ` • ${item.change.device}`}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Vorher:</div>
                              <div className="bg-destructive/10 rounded p-2 font-mono text-xs">
                                {JSON.stringify(item.change.before, null, 2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Nachher:</div>
                              <div className="bg-green-500/10 rounded p-2 font-mono text-xs">
                                {JSON.stringify(item.change.after, null, 2)}
                              </div>
                            </div>
                          </div>

                          {item.change.reason && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-muted-foreground mb-1">Grund:</div>
                              <div className="text-sm">{item.change.reason}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}

                  {allChangeLogs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Keine Änderungen protokolliert
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
