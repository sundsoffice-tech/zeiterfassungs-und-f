import { TimeEntry, Project, Task, Phase, Employee } from './types'
import { parseISO, getHours, differenceInDays, format } from 'date-fns'

export enum AnomalyType {
  TIME_OF_DAY = 'time_of_day',
  DURATION = 'duration',
  MICRO_ENTRIES = 'micro_entries',
  FREQUENCY = 'frequency',
  PROJECT_SWITCHING = 'project_switching',
  DEVIATION_FROM_TEAM = 'deviation_from_team',
  UNUSUAL_PATTERN = 'unusual_pattern'
}

export enum AnomalySeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface AnomalyDetection {
  type: AnomalyType
  severity: AnomalySeverity
  title: string
  description: string
  evidence: string[]
  baseline: {
    metric: string
    typical: string
    current: string
  }
  confidence: number
}

export interface AnomalyAnalysisContext {
  currentEntry: TimeEntry
  employeeHistory: TimeEntry[]
  teamHistory: TimeEntry[]
  projectHistory: TimeEntry[]
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
}

export class AnomalyDetector {
  static async analyzeEntry(context: AnomalyAnalysisContext): Promise<AnomalyDetection[]> {
    const detections: AnomalyDetection[] = []

    detections.push(...this.detectTimeOfDayAnomaly(context))
    detections.push(...this.detectDurationAnomaly(context))
    detections.push(...this.detectMicroEntries(context))
    detections.push(...this.detectFrequencyAnomaly(context))
    detections.push(...this.detectProjectSwitchingAnomaly(context))
    detections.push(...this.detectTeamDeviationAnomaly(context))

    return detections.filter(d => d.confidence >= 0.6)
  }

  static async analyzeWithAI(
    context: AnomalyAnalysisContext
  ): Promise<AnomalyDetection[]> {
    const basicDetections = await this.analyzeEntry(context)

    try {
      const employeeStats = this.calculateEmployeeStats(context.employeeHistory)
      const projectStats = this.calculateProjectStats(context.projectHistory, context.currentEntry.projectId)
      const teamStats = this.calculateTeamStats(context.teamHistory)

      const prompt = (window.spark.llmPrompt as any)`Du bist ein Experte für Zeiterfassungs-Anomalie-Erkennung. Analysiere den folgenden Zeiteintrag im Vergleich zu historischen Mustern und identifiziere ungewöhnliche Verhaltensweisen.

Aktueller Eintrag:
- Projekt: ${context.projects.find(p => p.id === context.currentEntry.projectId)?.name || 'Unbekannt'}
- Task: ${context.currentEntry.taskId ? context.tasks.find(t => t.id === context.currentEntry.taskId)?.name : 'Keine'}
- Datum: ${context.currentEntry.date}
- Zeit: ${context.currentEntry.startTime} - ${context.currentEntry.endTime}
- Dauer: ${context.currentEntry.duration}h
- Notizen: ${context.currentEntry.notes || 'Keine'}

Mitarbeiter-Statistiken (letzte 30 Tage):
- Durchschnittliche Dauer: ${employeeStats.avgDuration.toFixed(2)}h
- Häufigste Startzeit: ${employeeStats.mostCommonStartHour}:00
- Häufigste Projekte: ${employeeStats.topProjects.slice(0, 3).join(', ')}
- Einträge mit Mikro-Dauer (<15min): ${employeeStats.microEntryPercentage.toFixed(1)}%

Projekt-Statistiken:
- Durchschnittliche Dauer für dieses Projekt: ${projectStats.avgDuration.toFixed(2)}h
- Typische Startzeiten: ${projectStats.typicalStartHours.join(', ')}
- Häufigste Tasks: ${projectStats.topTasks.slice(0, 3).join(', ')}

Team-Durchschnitt (alle Mitarbeiter):
- Durchschnittliche Dauer: ${teamStats.avgDuration.toFixed(2)}h
- Einträge pro Tag: ${teamStats.avgEntriesPerDay.toFixed(1)}

Bereits erkannte Basis-Anomalien:
${JSON.stringify(basicDetections.map(d => ({ type: d.type, title: d.title })), null, 2)}

Analysiere den Eintrag und identifiziere zusätzliche Muster-basierte Anomalien. Suche nach:
1. Abweichungen von persönlichen Gewohnheiten
2. Ungewöhnliches Verhalten im Vergleich zum Team
3. Projekt-spezifische Anomalien
4. Versteckte Muster, die auf Fehler oder ungewöhnliche Nutzung hinweisen

Gib das Ergebnis als JSON-Objekt mit einer "anomalies" Property zurück:
{
  "anomalies": [
    {
      "type": "unusual_pattern",
      "severity": "info" | "warning" | "critical",
      "title": "Kurze Beschreibung",
      "description": "Detaillierte Erklärung der Anomalie",
      "evidence": ["Beweis 1", "Beweis 2"],
      "baseline": {
        "metric": "Name der Metrik",
        "typical": "Typischer Wert",
        "current": "Aktueller Wert"
      },
      "confidence": 0.0 bis 1.0
    }
  ]
}`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const result = JSON.parse(response)

      if (result.anomalies && Array.isArray(result.anomalies)) {
        const aiDetections: AnomalyDetection[] = result.anomalies
          .filter((a: any) => a.confidence >= 0.6)
          .map((a: any) => ({
            type: a.type as AnomalyType,
            severity: a.severity as AnomalySeverity,
            title: a.title,
            description: a.description,
            evidence: a.evidence || [],
            baseline: a.baseline || { metric: '', typical: '', current: '' },
            confidence: a.confidence
          }))

        return [...basicDetections, ...aiDetections]
      }
    } catch (error) {
      console.error('AI anomaly detection failed:', error)
    }

    return basicDetections
  }

  private static detectTimeOfDayAnomaly(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory, projectHistory } = context
    const detections: AnomalyDetection[] = []

    if (employeeHistory.length < 5) return detections

    const currentHour = parseInt(currentEntry.startTime.split(':')[0])
    
    const employeeHours = employeeHistory.map(e => parseInt(e.startTime.split(':')[0]))
    const avgEmployeeHour = employeeHours.reduce((sum, h) => sum + h, 0) / employeeHours.length
    const stdDev = Math.sqrt(
      employeeHours.reduce((sum, h) => sum + Math.pow(h - avgEmployeeHour, 2), 0) / employeeHours.length
    )

    const projectEntries = projectHistory.filter(e => e.projectId === currentEntry.projectId)
    if (projectEntries.length >= 3) {
      const projectHours = projectEntries.map(e => parseInt(e.startTime.split(':')[0]))
      const avgProjectHour = projectHours.reduce((sum, h) => sum + h, 0) / projectHours.length

      const deviation = Math.abs(currentHour - avgProjectHour)
      
      if (deviation >= 4) {
        const project = context.projects.find(p => p.id === currentEntry.projectId)
        const typicalTime = Math.round(avgProjectHour)
        
        let severity: AnomalySeverity = AnomalySeverity.INFO
        if (currentHour >= 22 || currentHour <= 5) severity = AnomalySeverity.WARNING
        if (deviation >= 8) severity = AnomalySeverity.CRITICAL

        detections.push({
          type: AnomalyType.TIME_OF_DAY,
          severity,
          title: 'Ungewöhnliche Tageszeit für dieses Projekt',
          description: `Projekt "${project?.name}" wird normalerweise um ${typicalTime}:00 Uhr gebucht, heute um ${currentHour}:00 Uhr`,
          evidence: [
            `${projectEntries.length} frühere Einträge analysiert`,
            `Durchschnittliche Startzeit: ${typicalTime}:00 Uhr`,
            `Abweichung: ${deviation} Stunden`
          ],
          baseline: {
            metric: 'Startzeit',
            typical: `${typicalTime}:00 Uhr`,
            current: `${currentHour}:00 Uhr`
          },
          confidence: Math.min(0.9, 0.6 + (deviation / 12))
        })
      }
    }

    if (Math.abs(currentHour - avgEmployeeHour) > stdDev * 2) {
      detections.push({
        type: AnomalyType.TIME_OF_DAY,
        severity: AnomalySeverity.INFO,
        title: 'Abweichung von persönlichen Arbeitszeiten',
        description: `Sie arbeiten normalerweise um ${Math.round(avgEmployeeHour)}:00 Uhr, heute um ${currentHour}:00 Uhr`,
        evidence: [
          `Analyse von ${employeeHistory.length} Einträgen`,
          `Standardabweichung: ${stdDev.toFixed(1)} Stunden`
        ],
        baseline: {
          metric: 'Persönliche Startzeit',
          typical: `${Math.round(avgEmployeeHour)}:00 Uhr`,
          current: `${currentHour}:00 Uhr`
        },
        confidence: 0.7
      })
    }

    return detections
  }

  private static detectDurationAnomaly(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory, projectHistory } = context
    const detections: AnomalyDetection[] = []

    const projectEntries = projectHistory.filter(e => 
      e.projectId === currentEntry.projectId &&
      (!currentEntry.taskId || e.taskId === currentEntry.taskId)
    )

    if (projectEntries.length >= 3) {
      const durations = projectEntries.map(e => e.duration)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const stdDev = Math.sqrt(
        durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
      )

      const deviation = Math.abs(currentEntry.duration - avgDuration)
      const zScore = stdDev > 0 ? deviation / stdDev : 0

      if (zScore > 2) {
        const project = context.projects.find(p => p.id === currentEntry.projectId)
        const task = currentEntry.taskId ? context.tasks.find(t => t.id === currentEntry.taskId) : null
        
        let severity: AnomalySeverity = AnomalySeverity.INFO
        if (zScore > 3) severity = AnomalySeverity.WARNING
        if (zScore > 4) severity = AnomalySeverity.CRITICAL

        const scope = task ? `Task "${task.name}"` : `Projekt "${project?.name}"`

        detections.push({
          type: AnomalyType.DURATION,
          severity,
          title: 'Ungewöhnliche Dauer für diese Tätigkeit',
          description: `${scope} dauert normalerweise ${avgDuration.toFixed(1)}h, heute ${currentEntry.duration}h`,
          evidence: [
            `${projectEntries.length} frühere Einträge analysiert`,
            `Durchschnittliche Dauer: ${avgDuration.toFixed(1)}h`,
            `Standardabweichung: ${stdDev.toFixed(1)}h`,
            `Z-Score: ${zScore.toFixed(2)}`
          ],
          baseline: {
            metric: 'Dauer',
            typical: `${avgDuration.toFixed(1)}h`,
            current: `${currentEntry.duration}h`
          },
          confidence: Math.min(0.95, 0.7 + (zScore / 10))
        })
      }
    }

    return detections
  }

  private static detectMicroEntries(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory } = context
    const detections: AnomalyDetection[] = []

    if (employeeHistory.length < 10) return detections

    const recentEntries = employeeHistory.slice(-20)
    const microEntries = recentEntries.filter(e => e.duration <= 0.25)
    const microPercentage = (microEntries.length / recentEntries.length) * 100

    if (currentEntry.duration <= 0.25 && microPercentage > 30) {
      detections.push({
        type: AnomalyType.MICRO_ENTRIES,
        severity: AnomalySeverity.WARNING,
        title: 'Viele Mikro-Einträge erkannt',
        description: `${microPercentage.toFixed(0)}% Ihrer letzten Einträge sind unter 15 Minuten. Dies könnte auf eine ineffiziente Nutzung hinweisen.`,
        evidence: [
          `${microEntries.length} von ${recentEntries.length} Einträgen unter 15 Minuten`,
          'Empfehlung: Zusammenhängende Tätigkeiten als einen Eintrag erfassen'
        ],
        baseline: {
          metric: 'Mikro-Einträge',
          typical: '< 10%',
          current: `${microPercentage.toFixed(0)}%`
        },
        confidence: 0.85
      })
    }

    return detections
  }

  private static detectFrequencyAnomaly(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory } = context
    const detections: AnomalyDetection[] = []

    if (employeeHistory.length < 5) return detections

    const today = currentEntry.date
    const todayEntries = employeeHistory.filter(e => e.date === today)

    const dateGroups = employeeHistory.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgEntriesPerDay = Object.values(dateGroups).reduce((sum, count) => sum + count, 0) / Object.keys(dateGroups).length

    if (todayEntries.length >= avgEntriesPerDay * 2.5 && todayEntries.length >= 8) {
      detections.push({
        type: AnomalyType.FREQUENCY,
        severity: AnomalySeverity.INFO,
        title: 'Ungewöhnlich viele Einträge heute',
        description: `Sie haben heute ${todayEntries.length} Einträge, normalerweise sind es ${avgEntriesPerDay.toFixed(1)} pro Tag`,
        evidence: [
          `Heutige Einträge: ${todayEntries.length}`,
          `Durchschnitt: ${avgEntriesPerDay.toFixed(1)} Einträge/Tag`,
          'Hinweis: Viele kleine Einträge könnten zusammengefasst werden'
        ],
        baseline: {
          metric: 'Einträge pro Tag',
          typical: `${avgEntriesPerDay.toFixed(1)}`,
          current: `${todayEntries.length}`
        },
        confidence: 0.75
      })
    }

    return detections
  }

  private static detectProjectSwitchingAnomaly(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory } = context
    const detections: AnomalyDetection[] = []

    if (employeeHistory.length < 10) return detections

    const recentEntries = employeeHistory.slice(-20)
    const uniqueProjects = new Set(recentEntries.map(e => e.projectId)).size
    const switchRate = uniqueProjects / recentEntries.length

    if (switchRate > 0.6) {
      detections.push({
        type: AnomalyType.PROJECT_SWITCHING,
        severity: AnomalySeverity.INFO,
        title: 'Häufiger Projektwechsel',
        description: `Sie wechseln sehr häufig zwischen Projekten (${uniqueProjects} verschiedene Projekte in den letzten ${recentEntries.length} Einträgen)`,
        evidence: [
          `${uniqueProjects} verschiedene Projekte in ${recentEntries.length} Einträgen`,
          `Wechselrate: ${(switchRate * 100).toFixed(0)}%`,
          'Hinweis: Häufige Kontextwechsel können die Produktivität beeinträchtigen'
        ],
        baseline: {
          metric: 'Projektwechsel',
          typical: '< 40%',
          current: `${(switchRate * 100).toFixed(0)}%`
        },
        confidence: 0.7
      })
    }

    return detections
  }

  private static detectTeamDeviationAnomaly(context: AnomalyAnalysisContext): AnomalyDetection[] {
    const { currentEntry, employeeHistory, teamHistory, employees } = context
    const detections: AnomalyDetection[] = []

    if (teamHistory.length < 20 || employeeHistory.length < 5) return detections

    const teamDurations = teamHistory.map(e => e.duration)
    const teamAvgDuration = teamDurations.reduce((sum, d) => sum + d, 0) / teamDurations.length

    const employeeDurations = employeeHistory.map(e => e.duration)
    const employeeAvgDuration = employeeDurations.reduce((sum, d) => sum + d, 0) / employeeDurations.length

    const deviation = Math.abs(employeeAvgDuration - teamAvgDuration)
    const deviationPercentage = (deviation / teamAvgDuration) * 100

    if (deviationPercentage > 40) {
      const comparison = employeeAvgDuration > teamAvgDuration ? 'länger' : 'kürzer'
      
      detections.push({
        type: AnomalyType.DEVIATION_FROM_TEAM,
        severity: AnomalySeverity.INFO,
        title: 'Abweichung vom Team-Durchschnitt',
        description: `Ihre durchschnittliche Eintragsdauer (${employeeAvgDuration.toFixed(1)}h) ist ${deviationPercentage.toFixed(0)}% ${comparison} als der Team-Durchschnitt (${teamAvgDuration.toFixed(1)}h)`,
        evidence: [
          `Team-Durchschnitt: ${teamAvgDuration.toFixed(1)}h`,
          `Ihre Durchschnitt: ${employeeAvgDuration.toFixed(1)}h`,
          `Abweichung: ${deviationPercentage.toFixed(0)}%`,
          `Basierend auf ${teamHistory.length} Team-Einträgen`
        ],
        baseline: {
          metric: 'Durchschnittliche Dauer',
          typical: `${teamAvgDuration.toFixed(1)}h (Team)`,
          current: `${employeeAvgDuration.toFixed(1)}h`
        },
        confidence: 0.65
      })
    }

    return detections
  }

  private static calculateEmployeeStats(history: TimeEntry[]) {
    const durations = history.map(e => e.duration)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    const hourCounts: Record<number, number> = {}
    history.forEach(e => {
      const hour = parseInt(e.startTime.split(':')[0])
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const mostCommonStartHour = parseInt(
      Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '9'
    )

    const projectCounts: Record<string, number> = {}
    history.forEach(e => {
      projectCounts[e.projectId] = (projectCounts[e.projectId] || 0) + 1
    })
    const topProjects = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const microEntries = history.filter(e => e.duration <= 0.25)
    const microEntryPercentage = (microEntries.length / history.length) * 100

    return {
      avgDuration,
      mostCommonStartHour,
      topProjects,
      microEntryPercentage
    }
  }

  private static calculateProjectStats(history: TimeEntry[], projectId: string) {
    const projectEntries = history.filter(e => e.projectId === projectId)
    
    const durations = projectEntries.map(e => e.duration)
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    const hourCounts: Record<number, number> = {}
    projectEntries.forEach(e => {
      const hour = parseInt(e.startTime.split(':')[0])
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const typicalStartHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    const taskCounts: Record<string, number> = {}
    projectEntries.forEach(e => {
      if (e.taskId) {
        taskCounts[e.taskId] = (taskCounts[e.taskId] || 0) + 1
      }
    })
    const topTasks = Object.entries(taskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)

    return {
      avgDuration,
      typicalStartHours,
      topTasks
    }
  }

  private static calculateTeamStats(history: TimeEntry[]) {
    const durations = history.map(e => e.duration)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    const dateGroups = history.reduce((acc, entry) => {
      const key = `${entry.employeeId}-${entry.date}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgEntriesPerDay = Object.values(dateGroups).reduce((sum, count) => sum + count, 0) / Object.keys(dateGroups).length

    return {
      avgDuration,
      avgEntriesPerDay
    }
  }
}
