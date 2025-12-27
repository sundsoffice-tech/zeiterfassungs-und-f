import { useState, useEffect } from 'react'
import { Employee, Project, Task, TimeEntry } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Lightning, TrendUp, Warning, Lightbulb, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AIInsightsReportProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  onClose: () => void
}

interface Anomaly {
  id: string
  type: 'overlap' | 'unusual_hours' | 'pattern_break' | 'duration_anomaly' | 'missing_data'
  severity: 'low' | 'medium' | 'high'
  description: string
  reasoning: string
  entry?: TimeEntry
  employee?: Employee
  project?: Project
}

interface CommonIssue {
  type: string
  count: number
  description: string
  examples: string[]
}

interface ProjectRisk {
  project: Project
  riskScore: number
  reasons: string[]
  recommendation: string
}

interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
}

export function AIInsightsReport({ employees, projects, tasks, timeEntries, onClose }: AIInsightsReportProps) {
  const [loading, setLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [commonIssues, setCommonIssues] = useState<CommonIssue[]>([])
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  const analyzeAnomalies = (): Anomaly[] => {
    const detected: Anomaly[] = []

    const sortedEntries = [...timeEntries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.startTime.localeCompare(b.startTime)
    })

    sortedEntries.forEach((entry, idx) => {
      const employee = employees.find(e => e.id === entry.employeeId)
      const project = projects.find(p => p.id === entry.projectId)
      
      if (!employee || !project) return

      const startHour = parseInt(entry.startTime.split(':')[0])
      if (startHour < 6 || startHour > 22) {
        detected.push({
          id: `unusual-hours-${entry.id}`,
          type: 'unusual_hours',
          severity: startHour < 3 || startHour > 23 ? 'high' : 'medium',
          description: `Ungewöhnliche Arbeitszeit: ${entry.startTime}`,
          reasoning: `Eintrag von ${employee.name} beginnt um ${entry.startTime}, was außerhalb der üblichen Arbeitszeiten (6:00-22:00) liegt.`,
          entry,
          employee,
          project
        })
      }

      if (entry.duration > 12) {
        detected.push({
          id: `long-duration-${entry.id}`,
          type: 'duration_anomaly',
          severity: entry.duration > 16 ? 'high' : 'medium',
          description: `Ungewöhnlich lange Dauer: ${entry.duration.toFixed(1)}h`,
          reasoning: `Diese Zeitspanne von ${entry.duration.toFixed(1)} Stunden ist deutlich über dem Durchschnitt und könnte ein Fehler sein oder auf Überlastung hinweisen.`,
          entry,
          employee,
          project
        })
      }

      const nextEntry = sortedEntries[idx + 1]
      if (nextEntry && nextEntry.employeeId === entry.employeeId && nextEntry.date === entry.date) {
        const [h1, m1] = entry.endTime.split(':').map(Number)
        const [h2, m2] = nextEntry.startTime.split(':').map(Number)
        const end1 = h1 * 60 + m1
        const start2 = h2 * 60 + m2
        
        if (end1 > start2) {
          detected.push({
            id: `overlap-${entry.id}-${nextEntry.id}`,
            type: 'overlap',
            severity: 'high',
            description: `Überlappung: ${entry.endTime} → ${nextEntry.startTime}`,
            reasoning: `Zwei Zeiteinträge von ${employee.name} überschneiden sich am ${entry.date}. Dies deutet auf einen Eingabefehler oder vergessenes Stoppen des Timers hin.`,
            entry,
            employee,
            project
          })
        }
      }
    })

    employees.forEach(employee => {
      const empEntries = timeEntries.filter(e => e.employeeId === employee.id)
      const projectCounts = new Map<string, number>()
      empEntries.forEach(e => {
        projectCounts.set(e.projectId, (projectCounts.get(e.projectId) || 0) + 1)
      })

      empEntries.forEach(entry => {
        const project = projects.find(p => p.id === entry.projectId)
        if (!project) return

        const entryHour = parseInt(entry.startTime.split(':')[0])
        const typicalHours = empEntries
          .filter(e => e.projectId === entry.projectId && e.id !== entry.id)
          .map(e => parseInt(e.startTime.split(':')[0]))
        
        if (typicalHours.length >= 5) {
          const avgHour = typicalHours.reduce((sum, h) => sum + h, 0) / typicalHours.length
          if (Math.abs(entryHour - avgHour) > 4) {
            detected.push({
              id: `pattern-break-${entry.id}`,
              type: 'pattern_break',
              severity: 'low',
              description: `Abweichung von gewohntem Muster`,
              reasoning: `${employee.name} arbeitet normalerweise um ${avgHour.toFixed(0)}:00 an ${project.name}, dieser Eintrag beginnt jedoch um ${entry.startTime}.`,
              entry,
              employee,
              project
            })
          }
        }
      })
    })

    return detected
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
      .slice(0, 10)
  }

  const analyzeCommonIssues = (): CommonIssue[] => {
    const issues: CommonIssue[] = []

    const overlaps = timeEntries.filter((entry, idx, arr) => {
      const nextEntry = arr.find(e => 
        e.employeeId === entry.employeeId && 
        e.date === entry.date && 
        e.startTime < entry.endTime && 
        e.startTime >= entry.startTime &&
        e.id !== entry.id
      )
      return !!nextEntry
    })

    if (overlaps.length > 0) {
      issues.push({
        type: 'Überlappungen',
        count: overlaps.length,
        description: 'Zeiteinträge überschneiden sich (möglicherweise durch mobiles Tracking)',
        examples: overlaps.slice(0, 3).map(e => {
          const emp = employees.find(emp => emp.id === e.employeeId)
          return `${emp?.name}: ${e.date} ${e.startTime}-${e.endTime}`
        })
      })
    }

    const missingNotes = timeEntries.filter(e => !e.notes || e.notes.trim().length < 5)
    if (missingNotes.length > 0) {
      issues.push({
        type: 'Fehlende/zu kurze Notizen',
        count: missingNotes.length,
        description: 'Einträge ohne aussagekräftige Beschreibung',
        examples: missingNotes.slice(0, 3).map(e => {
          const emp = employees.find(emp => emp.id === e.employeeId)
          const proj = projects.find(p => p.id === e.projectId)
          return `${emp?.name} → ${proj?.name} (${e.date})`
        })
      })
    }

    const roundedEntries = timeEntries.filter(e => e.duration === 8 || e.duration === 4 || e.duration === 2)
    if (roundedEntries.length > timeEntries.length * 0.3) {
      issues.push({
        type: 'Zu viele Rundungen',
        count: roundedEntries.length,
        description: 'Viele Einträge mit exakten Rundungen (8h, 4h, 2h) - möglicherweise Schätzwerte',
        examples: [`${((roundedEntries.length / timeEntries.length) * 100).toFixed(0)}% aller Einträge sind gerundet`]
      })
    }

    const longEntries = timeEntries.filter(e => e.duration > 12)
    if (longEntries.length > 0) {
      issues.push({
        type: 'Überlange Einträge',
        count: longEntries.length,
        description: 'Zeiteinträge über 12 Stunden - möglicher Fehler oder extreme Überstunden',
        examples: longEntries.slice(0, 3).map(e => {
          const emp = employees.find(emp => emp.id === e.employeeId)
          return `${emp?.name}: ${e.duration.toFixed(1)}h am ${e.date}`
        })
      })
    }

    return issues.sort((a, b) => b.count - a.count)
  }

  const analyzeProjectRisks = (): ProjectRisk[] => {
    return projects
      .map(project => {
        const projectEntries = timeEntries.filter(e => e.projectId === project.id)
        if (projectEntries.length === 0) return null

        const totalHours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
        const budget = project.budget || 0
        const budgetUsage = budget > 0 ? (totalHours / budget) * 100 : 0

        const reasons: string[] = []
        let riskScore = 0

        if (budgetUsage > 100) {
          reasons.push(`Budget um ${(budgetUsage - 100).toFixed(0)}% überschritten`)
          riskScore += 40
        } else if (budgetUsage > 90) {
          reasons.push(`${budgetUsage.toFixed(0)}% des Budgets verbraucht`)
          riskScore += 30
        } else if (budgetUsage > 80) {
          reasons.push(`${budgetUsage.toFixed(0)}% des Budgets verbraucht`)
          riskScore += 20
        }

        const daysWorked = new Set(projectEntries.map(e => e.date)).size
        const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0
        if (avgHoursPerDay > 8) {
          reasons.push(`Durchschnittlich ${avgHoursPerDay.toFixed(1)}h/Tag (hohe Intensität)`)
          riskScore += 15
        }

        const issuesCount = projectEntries.filter(e => 
          e.changeLog.length > 0 || !e.notes || e.duration > 12
        ).length
        const issueRatio = projectEntries.length > 0 ? issuesCount / projectEntries.length : 0
        if (issueRatio > 0.2) {
          reasons.push(`${(issueRatio * 100).toFixed(0)}% der Einträge haben Qualitätsprobleme`)
          riskScore += 20
        }

        const uniqueEmployees = new Set(projectEntries.map(e => e.employeeId)).size
        if (uniqueEmployees === 1 && projectEntries.length > 20) {
          reasons.push('Nur ein Mitarbeiter beteiligt (Single Point of Failure)')
          riskScore += 15
        }

        let recommendation = ''
        if (riskScore >= 60) {
          recommendation = 'Sofortige Überprüfung empfohlen. Budget-Stopp erwägen bis Maßnahmen geklärt sind.'
        } else if (riskScore >= 40) {
          recommendation = 'Engmaschiges Monitoring. Ressourcen-Planung überprüfen.'
        } else if (riskScore >= 20) {
          recommendation = 'Beobachten. Vorsorgliche Maßnahmen vorbereiten.'
        } else {
          recommendation = 'Projekt im grünen Bereich. Reguläres Monitoring fortsetzen.'
        }

        return riskScore > 0 ? { project, riskScore, reasons, recommendation } : null
      })
      .filter((r): r is ProjectRisk => r !== null)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
  }

  const generateRecommendations = (): Recommendation[] => {
    const recs: Recommendation[] = []

    const missingNotesRatio = timeEntries.filter(e => !e.notes || e.notes.trim().length < 5).length / timeEntries.length
    if (missingNotesRatio > 0.3) {
      recs.push({
        title: 'Pflichtfeld für Notizen einführen',
        description: `${(missingNotesRatio * 100).toFixed(0)}% der Einträge haben keine aussagekräftigen Notizen. Führen Sie ein Pflichtfeld ein, um die Nachvollziehbarkeit zu verbessern.`,
        impact: 'high',
        actionable: true
      })
    }

    const hasOverlaps = timeEntries.some((entry, idx, arr) => {
      return arr.some(e => 
        e.employeeId === entry.employeeId && 
        e.date === entry.date && 
        e.startTime < entry.endTime && 
        e.startTime >= entry.startTime &&
        e.id !== entry.id
      )
    })
    if (hasOverlaps) {
      recs.push({
        title: 'Automatische Überlappungsprüfung aktivieren',
        description: 'Es wurden Überlappungen erkannt. Implementieren Sie eine automatische Prüfung beim Speichern.',
        impact: 'high',
        actionable: true
      })
    }

    const taskUsage = timeEntries.filter(e => e.taskId).length / timeEntries.length
    if (taskUsage < 0.5) {
      recs.push({
        title: 'Task-Templates für häufige Tätigkeiten',
        description: `Nur ${(taskUsage * 100).toFixed(0)}% der Einträge nutzen Tasks. Templates würden die Erfassung beschleunigen und Konsistenz verbessern.`,
        impact: 'medium',
        actionable: true
      })
    }

    const projectsWithHighRisk = projects.filter(project => {
      const projectEntries = timeEntries.filter(e => e.projectId === project.id)
      const totalHours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
      return project.budget && totalHours > project.budget * 0.9
    })
    if (projectsWithHighRisk.length > 0) {
      recs.push({
        title: 'Budget-Warnsystem einrichten',
        description: `${projectsWithHighRisk.length} Projekt(e) haben >90% Budget-Auslastung. Automatische Warnungen ab 80% würden Überschreitungen verhindern.`,
        impact: 'high',
        actionable: true
      })
    }

    const avgEntriesPerDay = timeEntries.length / new Set(timeEntries.map(e => `${e.employeeId}-${e.date}`)).size
    if (avgEntriesPerDay > 5) {
      recs.push({
        title: 'Projektwechsel minimieren',
        description: `Durchschnittlich ${avgEntriesPerDay.toFixed(1)} Einträge pro Tag/Mitarbeiter. Häufige Wechsel reduzieren Produktivität. Fokuszeiten einplanen.`,
        impact: 'medium',
        actionable: true
      })
    }

    return recs.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }

  const generateAIAnalysis = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const detectedAnomalies = analyzeAnomalies()
      const issues = analyzeCommonIssues()
      const risks = analyzeProjectRisks()
      const recs = generateRecommendations()

      setAnomalies(detectedAnomalies)
      setCommonIssues(issues)
      setProjectRisks(risks)
      setRecommendations(recs)
      setAiGenerated(true)

      toast.success('KI-Analyse abgeschlossen', {
        description: `${detectedAnomalies.length} Anomalien, ${issues.length} Fehlerquellen, ${risks.length} Risiko-Projekte erkannt`
      })
    } catch (error) {
      toast.error('Fehler bei der KI-Analyse')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateAIAnalysis()
  }, [])

  if (loading && !aiGenerated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 animate-pulse" weight="duotone" />
              KI-Insights Report
            </h2>
            <p className="text-sm text-muted-foreground">Wird analysiert...</p>
          </div>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        </div>

        <Card>
          <CardContent className="py-24 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse text-primary" weight="duotone" />
            <p className="text-lg font-medium">KI analysiert Ihre Daten...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Anomalien erkennen • Muster finden • Risiken bewerten
            </p>
            <Progress value={33} className="w-64 mx-auto mt-6" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7" weight="duotone" />
            KI-Insights Report (Admin)
          </h2>
          <p className="text-sm text-muted-foreground">
            Intelligente Analyse • Anomalie-Erkennung • Handlungsempfehlungen
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAIAnalysis} disabled={loading}>
            <Sparkle className="h-4 w-4 mr-2" />
            Neu analysieren
          </Button>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Anomalien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{anomalies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Erkannt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fehlerquellen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{commonIssues.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Kategorien</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Risiko-Projekte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{projectRisks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Benötigen Aufmerksamkeit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empfehlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Maßnahmen</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning className="h-5 w-5" weight="duotone" />
            Top 10 Anomalien (mit Begründung)
          </CardTitle>
          <CardDescription>Die auffälligsten Muster in Ihren Zeitdaten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <Card
                key={anomaly.id}
                className={`border-l-4 ${
                  anomaly.severity === 'high'
                    ? 'border-l-destructive'
                    : anomaly.severity === 'medium'
                    ? 'border-l-orange-500'
                    : 'border-l-yellow-500'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          anomaly.severity === 'high' ? 'destructive' :
                          anomaly.severity === 'medium' ? 'outline' : 'secondary'
                        }>
                          {anomaly.severity === 'high' ? 'KRITISCH' : 
                           anomaly.severity === 'medium' ? 'MITTEL' : 'INFO'}
                        </Badge>
                        <Badge variant="outline">{anomaly.type.replace('_', ' ')}</Badge>
                        {anomaly.employee && <span className="text-sm font-medium">{anomaly.employee.name}</span>}
                        {anomaly.project && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{anomaly.project.name}</span>
                          </>
                        )}
                      </div>
                      <div className="font-medium">{anomaly.description}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3 mt-2">
                    <span className="font-medium text-foreground">KI-Begründung: </span>
                    {anomaly.reasoning}
                  </div>
                </CardContent>
              </Card>
            ))}

            {anomalies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Keine signifikanten Anomalien gefunden - Ihre Daten sehen gut aus! ✓
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning className="h-5 w-5" weight="duotone" />
            Häufigste Fehlerquellen
          </CardTitle>
          <CardDescription>Systematische Probleme, die mehrfach auftreten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commonIssues.map((issue, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{issue.type}</div>
                    <div className="text-sm text-muted-foreground">{issue.description}</div>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {issue.count}x
                  </Badge>
                </div>
                {issue.examples.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Beispiele:</div>
                    <div className="space-y-1">
                      {issue.examples.map((example, exIdx) => (
                        <div key={exIdx} className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1">
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {commonIssues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Keine häufigen Fehlerquellen erkannt ✓
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="h-5 w-5" weight="duotone" />
            Projekte mit Risiko-Score
          </CardTitle>
          <CardDescription>Projekte die besondere Aufmerksamkeit benötigen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectRisks.map(risk => (
              <Card key={risk.project.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{risk.project.name}</h3>
                        <Badge variant={risk.riskScore >= 60 ? 'destructive' : 'outline'}>
                          Risiko: {risk.riskScore}/100
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-3">
                        {risk.reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Warning className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" weight="fill" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Progress value={risk.riskScore} className="w-24 h-3" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {risk.riskScore >= 60 ? 'Kritisch' : risk.riskScore >= 40 ? 'Hoch' : 'Mittel'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded p-3 text-sm">
                    <span className="font-medium">Empfehlung: </span>
                    {risk.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}

            {projectRisks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Alle Projekte im grünen Bereich ✓
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" weight="duotone" />
            Empfohlene Maßnahmen
          </CardTitle>
          <CardDescription>Konkrete Handlungsempfehlungen zur Verbesserung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      rec.impact === 'high' ? 'bg-green-500/10' :
                      rec.impact === 'medium' ? 'bg-orange-500/10' : 'bg-blue-500/10'
                    }`}>
                      <Lightbulb className={`h-5 w-5 ${
                        rec.impact === 'high' ? 'text-green-600' :
                        rec.impact === 'medium' ? 'text-orange-600' : 'text-blue-600'
                      }`} weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant={rec.impact === 'high' ? 'default' : 'outline'}>
                          {rec.impact === 'high' ? 'Hoher Impact' : rec.impact === 'medium' ? 'Mittlerer Impact' : 'Niedriger Impact'}
                        </Badge>
                        {rec.actionable && (
                          <Badge variant="secondary">Umsetzbar</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {recommendations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Keine dringenden Empfehlungen - System läuft optimal ✓
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
