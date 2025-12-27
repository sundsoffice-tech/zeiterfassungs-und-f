import { TimeEntry, Project, Employee, Task, Phase } from './types'
import { ValidationResult, ValidationSeverity } from './validation-rules'
import { AnomalyDetection } from './anomaly-detection'

export enum StrictnessMode {
  STRICT = 'strict',
  NEUTRAL = 'neutral',
  RELAXED = 'relaxed'
}

export interface ExplainableInsight {
  id: string
  type: 'validation' | 'anomaly' | 'pattern'
  severity: 'critical' | 'warning' | 'info'
  title: string
  shortMessage: string
  
  explanation: {
    reason: string
    comparisonValues: ComparisonValue[]
    evidence: string[]
    context: string
  }
  
  decisionMode: DecisionMode
  
  learningData?: {
    previousDecisions: AdminDecision[]
    suggestedAction?: string
    confidence?: number
  }
}

export interface ComparisonValue {
  label: string
  current: string | number
  typical: string | number
  deviation?: number
  unit?: string
}

export interface DecisionMode {
  question: string
  actions: DecisionAction[]
  defaultAction?: string
  learningNote?: string
}

export interface DecisionAction {
  id: string
  label: string
  description: string
  icon?: string
  type: 'accept' | 'fix' | 'adjust' | 'notify' | 'disable' | 'split' | 'manual'
  consequence?: string
  
  action: {
    type: 'update_entry' | 'split_entry' | 'adjust_rule' | 'send_notification' | 'disable_warning' | 'confirm' | 'manual_review'
    params?: Record<string, any>
  }
  
  learnFromThis?: boolean
}

export interface AdminDecision {
  insightId: string
  insightType: string
  actionTaken: string
  timestamp: string
  context: {
    projectId?: string
    employeeId?: string
    duration?: number
    [key: string]: any
  }
}

export interface StrictnessModeConfig {
  mode: StrictnessMode
  label: string
  description: string
  icon: string
  thresholds: {
    durationDeviation: number
    overtimeWarning: number
    roundingTolerance: number
    anomalyConfidence: number
  }
  autoApprove: {
    minorDeviations: boolean
    repeatedPatterns: boolean
  }
}

export const STRICTNESS_MODES: Record<StrictnessMode, StrictnessModeConfig> = {
  [StrictnessMode.STRICT]: {
    mode: StrictnessMode.STRICT,
    label: 'Streng',
    description: 'Für Abrechnung und Audits - alle Abweichungen werden geprüft',
    icon: 'ShieldCheck',
    thresholds: {
      durationDeviation: 0.1,
      overtimeWarning: 8.5,
      roundingTolerance: 0.05,
      anomalyConfidence: 0.5
    },
    autoApprove: {
      minorDeviations: false,
      repeatedPatterns: false
    }
  },
  [StrictnessMode.NEUTRAL]: {
    mode: StrictnessMode.NEUTRAL,
    label: 'Neutral',
    description: 'Für interne Projekte - Balance zwischen Kontrolle und Effizienz',
    icon: 'Scales',
    thresholds: {
      durationDeviation: 0.25,
      overtimeWarning: 10,
      roundingTolerance: 0.1,
      anomalyConfidence: 0.7
    },
    autoApprove: {
      minorDeviations: true,
      repeatedPatterns: true
    }
  },
  [StrictnessMode.RELAXED]: {
    mode: StrictnessMode.RELAXED,
    label: 'Locker',
    description: 'Für kreative Arbeit - Fokus auf Vertrauen und Flexibilität',
    icon: 'Leaf',
    thresholds: {
      durationDeviation: 0.5,
      overtimeWarning: 12,
      roundingTolerance: 0.25,
      anomalyConfidence: 0.85
    },
    autoApprove: {
      minorDeviations: true,
      repeatedPatterns: true
    }
  }
}

export class ExplainableAI {
  private strictnessMode: StrictnessMode
  private adminDecisions: AdminDecision[]

  constructor(strictnessMode: StrictnessMode = StrictnessMode.NEUTRAL, adminDecisions: AdminDecision[] = []) {
    this.strictnessMode = strictnessMode
    this.adminDecisions = adminDecisions
  }

  generateInsight(
    entry: TimeEntry,
    validation: ValidationResult,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
      tasks: Task[]
    }
  ): ExplainableInsight {
    const project = context.projects.find(p => p.id === entry.projectId)
    const employee = context.employees.find(e => e.id === entry.employeeId)
    
    const explanation = this.generateExplanation(entry, validation, context)
    const decisionMode = this.generateDecisionMode(entry, validation, context)
    const learningData = this.analyzePreviousDecisions(validation.code, entry)

    return {
      id: `insight-${entry.id}-${validation.code}`,
      type: 'validation',
      severity: validation.severity === ValidationSeverity.HARD ? 'critical' : 'warning',
      title: validation.message,
      shortMessage: validation.message,
      explanation,
      decisionMode,
      learningData
    }
  }

  generateInsightFromAnomaly(
    entry: TimeEntry,
    anomaly: AnomalyDetection,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
      tasks: Task[]
    }
  ): ExplainableInsight {
    const explanation = this.generateAnomalyExplanation(entry, anomaly, context)
    const decisionMode = this.generateAnomalyDecisionMode(entry, anomaly, context)
    const learningData = this.analyzePreviousDecisions(anomaly.type, entry)

    return {
      id: `insight-${entry.id}-${anomaly.type}`,
      type: 'anomaly',
      severity: anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'warning' ? 'warning' : 'info',
      title: anomaly.title,
      shortMessage: anomaly.description,
      explanation,
      decisionMode,
      learningData
    }
  }

  private generateExplanation(
    entry: TimeEntry,
    validation: ValidationResult,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
    }
  ): ExplainableInsight['explanation'] {
    const project = context.projects.find(p => p.id === entry.projectId)
    const comparisonValues: ComparisonValue[] = []
    const evidence: string[] = []
    let reason = ''
    let contextInfo = ''

    switch (validation.code) {
      case 'OVERLAP':
        reason = 'Zeitüberschneidungen sind nicht möglich - Sie können nicht an zwei Aufgaben gleichzeitig arbeiten.'
        if (validation.metadata?.conflictingStartTime && validation.metadata?.conflictingEndTime) {
          comparisonValues.push({
            label: 'Aktueller Eintrag',
            current: `${entry.startTime} - ${entry.endTime}`,
            typical: `${validation.metadata.conflictingStartTime} - ${validation.metadata.conflictingEndTime}`,
            unit: 'Zeit'
          })
        }
        evidence.push(`Überschneidung mit bestehendem Eintrag erkannt`)
        evidence.push(`Beide Einträge haben überlappende Zeiträume`)
        contextInfo = 'Überschneidungen führen zu ungenauen Projektkostenabrechnungen und sind nicht erlaubt.'
        break

      case 'EXCEEDS_DAILY_HOURS':
        const maxHours = validation.metadata?.maxHours || 12
        const totalHours = validation.metadata?.totalHours || entry.duration
        reason = `Die Gesamtarbeitszeit für diesen Tag überschreitet die erlaubte Grenze von ${maxHours} Stunden.`
        comparisonValues.push({
          label: 'Tagesarbeitszeit',
          current: totalHours,
          typical: maxHours,
          deviation: ((totalHours - maxHours) / maxHours) * 100,
          unit: 'h'
        })
        evidence.push(`Gesamtstunden für ${entry.date}: ${totalHours.toFixed(1)}h`)
        evidence.push(`Erlaubtes Maximum: ${maxHours}h`)
        evidence.push(`Überschreitung: ${(totalHours - maxHours).toFixed(1)}h`)
        contextInfo = 'Lange Arbeitstage können auf Fehleingaben hinweisen oder Arbeitsschutzregelungen verletzen.'
        break

      case 'MISSING_NOTES':
        reason = `Für abrechenbare Tätigkeiten in diesem Projekt sind Notizen erforderlich, um die Transparenz gegenüber Kunden zu gewährleisten.`
        evidence.push(`Projekt: ${project?.name || 'Unbekannt'}`)
        evidence.push(`Abrechenbar: Ja`)
        evidence.push(`Notizen: Leer`)
        contextInfo = 'Detaillierte Notizen ermöglichen eine bessere Nachvollziehbarkeit und Kundenabrechnung.'
        break

      case 'UNUSUAL_ROUNDING':
        reason = 'Der Eintrag hat eine exakte Rundung (z.B. genau 8:00 oder 4:00), was auf nachträgliche Anpassung statt echter Zeitmessung hindeutet.'
        comparisonValues.push({
          label: 'Dauer',
          current: entry.duration,
          typical: 'variabel',
          unit: 'h'
        })
        evidence.push(`Dauer: ${entry.duration}h (exakte Rundung)`)
        evidence.push(`Typisch: variable Minuten (z.B. 3.75h, 7.5h)`)
        contextInfo = 'Gerundete Zeiten sind nicht falsch, können aber bei häufigem Auftreten auf ungenaue Erfassung hinweisen.'
        break

      case 'WEEKEND_WORK':
        reason = 'Arbeit am Wochenende erfordert eine besondere Genehmigung oder Begründung.'
        evidence.push(`Datum: ${entry.date} (Wochenende)`)
        evidence.push(`Projekt: ${project?.name || 'Unbekannt'}`)
        if (entry.notes) {
          evidence.push(`Notiz: ${entry.notes}`)
        }
        contextInfo = 'Wochenendarbeit sollte dokumentiert und genehmigt werden, um Arbeitsschutzregelungen einzuhalten.'
        break

      default:
        reason = validation.explanation || validation.message
        contextInfo = 'Weitere Details finden Sie in den Metadaten.'
    }

    return {
      reason,
      comparisonValues,
      evidence,
      context: contextInfo
    }
  }

  private generateDecisionMode(
    entry: TimeEntry,
    validation: ValidationResult,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
    }
  ): DecisionMode {
    const actions: DecisionAction[] = []
    const project = context.projects.find(p => p.id === entry.projectId)

    const previousPattern = this.adminDecisions
      .filter(d => d.insightType === validation.code)
      .slice(-10)

    const acceptRate = previousPattern.length > 0
      ? previousPattern.filter(d => d.actionTaken === 'accept').length / previousPattern.length
      : 0

    let learningNote: string | undefined
    if (previousPattern.length >= 3) {
      if (acceptRate >= 0.8) {
        learningNote = `In ${Math.round(acceptRate * 100)}% dieser Fälle akzeptierst du die Zeit - möchtest du die Regel anpassen?`
      } else if (acceptRate <= 0.2) {
        learningNote = `Du korrigierst diese Art von Warnung fast immer - möchtest du die Regel verschärfen?`
      }
    }

    switch (validation.code) {
      case 'OVERLAP':
        actions.push({
          id: 'accept-overlap',
          label: 'Eintrag akzeptieren',
          description: 'Überschneidung ist korrekt (z.B. Multitasking)',
          icon: 'CheckCircle',
          type: 'accept',
          consequence: 'Eintrag wird trotz Überschneidung gespeichert',
          action: {
            type: 'confirm',
            params: { overrideValidation: true }
          },
          learnFromThis: true
        })
        
        actions.push({
          id: 'split-entry',
          label: 'Eintrag aufteilen',
          description: 'Zeit zwischen den Projekten aufteilen',
          icon: 'SplitVertical',
          type: 'split',
          consequence: 'Erstellt zwei separate Einträge',
          action: {
            type: 'split_entry',
            params: {
              splitAt: validation.metadata?.conflictingStartTime
            }
          },
          learnFromThis: false
        })

        if (validation.metadata?.conflictingEntryId) {
          actions.push({
            id: 'adjust-times',
            label: 'Zeiten automatisch anpassen',
            description: 'Startzeit automatisch nach dem Ende des anderen Eintrags setzen',
            icon: 'Clock',
            type: 'fix',
            consequence: 'Startzeit wird automatisch angepasst',
            action: {
              type: 'update_entry',
              params: {
                startTime: validation.metadata.conflictingEndTime
              }
            },
            learnFromThis: false
          })
        }
        break

      case 'EXCEEDS_DAILY_HOURS':
        actions.push({
          id: 'accept-overtime',
          label: 'Überstunden akzeptieren',
          description: 'Die Arbeitszeit ist korrekt erfasst',
          icon: 'CheckCircle',
          type: 'accept',
          consequence: 'Eintrag wird gespeichert, Überstunden werden dokumentiert',
          action: {
            type: 'confirm',
            params: { overrideValidation: true }
          },
          learnFromThis: true
        })

        actions.push({
          id: 'review-entries',
          label: 'Einträge prüfen',
          description: 'Alle Einträge des Tages überprüfen',
          icon: 'MagnifyingGlass',
          type: 'manual',
          consequence: 'Öffnet Tagesansicht zur manuellen Prüfung',
          action: {
            type: 'manual_review',
            params: { date: entry.date }
          },
          learnFromThis: false
        })

        actions.push({
          id: 'adjust-project-limit',
          label: 'Projektregel anpassen',
          description: `Tageslimit für Projekt "${project?.name}" erhöhen`,
          icon: 'Gear',
          type: 'adjust',
          consequence: 'Warnung erscheint für dieses Projekt nicht mehr',
          action: {
            type: 'adjust_rule',
            params: {
              projectId: entry.projectId,
              maxDailyHours: (validation.metadata?.totalHours || 12) + 2
            }
          },
          learnFromThis: true
        })
        break

      case 'MISSING_NOTES':
        actions.push({
          id: 'accept-no-notes',
          label: 'Ohne Notizen fortfahren',
          description: 'Keine weitere Beschreibung nötig',
          icon: 'CheckCircle',
          type: 'accept',
          consequence: 'Eintrag wird ohne Notizen gespeichert',
          action: {
            type: 'confirm',
            params: { overrideValidation: true }
          },
          learnFromThis: true
        })

        actions.push({
          id: 'add-notes',
          label: 'Notizen hinzufügen',
          description: 'Beschreibung zur Tätigkeit ergänzen',
          icon: 'PencilSimple',
          type: 'fix',
          consequence: 'Öffnet Notizfeld zur Bearbeitung',
          action: {
            type: 'manual_review',
            params: { focusField: 'notes' }
          },
          learnFromThis: false
        })

        actions.push({
          id: 'notify-employee',
          label: 'Mitarbeiter informieren',
          description: 'Erinnerung senden: Notizen sind erforderlich',
          icon: 'PaperPlaneTilt',
          type: 'notify',
          consequence: 'Mitarbeiter erhält Benachrichtigung',
          action: {
            type: 'send_notification',
            params: {
              employeeId: entry.employeeId,
              template: 'missing_notes_reminder'
            }
          },
          learnFromThis: false
        })

        actions.push({
          id: 'disable-notes-rule',
          label: 'Regel für dieses Projekt deaktivieren',
          description: `Notizen für "${project?.name}" nicht mehr erzwingen`,
          icon: 'XCircle',
          type: 'disable',
          consequence: 'Warnung erscheint für dieses Projekt nicht mehr',
          action: {
            type: 'adjust_rule',
            params: {
              projectId: entry.projectId,
              requireNotes: false
            }
          },
          learnFromThis: true
        })
        break

      case 'WEEKEND_WORK':
        actions.push({
          id: 'accept-weekend',
          label: 'Wochenendarbeit genehmigen',
          description: 'Arbeit am Wochenende ist autorisiert',
          icon: 'CheckCircle',
          type: 'accept',
          consequence: 'Eintrag wird gespeichert und als genehmigt markiert',
          action: {
            type: 'confirm',
            params: { overrideValidation: true, approved: true }
          },
          learnFromThis: true
        })

        actions.push({
          id: 'notify-approval',
          label: 'Genehmigung anfordern',
          description: 'Projektleiter um Freigabe bitten',
          icon: 'ShieldCheck',
          type: 'notify',
          consequence: 'Projektleiter erhält Freigabeanfrage',
          action: {
            type: 'send_notification',
            params: {
              template: 'weekend_approval_request',
              projectId: entry.projectId
            }
          },
          learnFromThis: false
        })

        actions.push({
          id: 'allow-weekend-project',
          label: 'Wochenendarbeit für Projekt erlauben',
          description: `"${project?.name}" regelmäßig am Wochenende`,
          icon: 'CalendarCheck',
          type: 'adjust',
          consequence: 'Warnung erscheint für dieses Projekt nicht mehr',
          action: {
            type: 'adjust_rule',
            params: {
              projectId: entry.projectId,
              allowWeekendWork: true
            }
          },
          learnFromThis: true
        })
        break

      default:
        actions.push({
          id: 'accept-general',
          label: 'Eintrag akzeptieren',
          description: 'Warnung ignorieren und fortfahren',
          icon: 'CheckCircle',
          type: 'accept',
          consequence: 'Eintrag wird gespeichert',
          action: {
            type: 'confirm',
            params: { overrideValidation: true }
          },
          learnFromThis: true
        })

        actions.push({
          id: 'manual-review',
          label: 'Manuell prüfen',
          description: 'Eintrag im Detail überprüfen',
          icon: 'Eye',
          type: 'manual',
          consequence: 'Öffnet Detailansicht',
          action: {
            type: 'manual_review',
            params: {}
          },
          learnFromThis: false
        })
    }

    const defaultActionId = acceptRate >= 0.7 ? actions.find(a => a.type === 'accept')?.id : undefined

    return {
      question: 'Was möchtest du jetzt tun?',
      actions,
      defaultAction: defaultActionId,
      learningNote
    }
  }

  private generateAnomalyExplanation(
    entry: TimeEntry,
    anomaly: AnomalyDetection,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
    }
  ): ExplainableInsight['explanation'] {
    const comparisonValues: ComparisonValue[] = []
    
    comparisonValues.push({
      label: anomaly.baseline.metric,
      current: anomaly.baseline.current,
      typical: anomaly.baseline.typical,
      unit: ''
    })

    return {
      reason: anomaly.description,
      comparisonValues,
      evidence: anomaly.evidence,
      context: `Diese Anomalie wurde mit ${Math.round(anomaly.confidence * 100)}% Konfidenz erkannt.`
    }
  }

  private generateAnomalyDecisionMode(
    entry: TimeEntry,
    anomaly: AnomalyDetection,
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
    }
  ): DecisionMode {
    const actions: DecisionAction[] = []
    const project = context.projects.find(p => p.id === entry.projectId)

    actions.push({
      id: 'accept-anomaly',
      label: 'Als korrekt bestätigen',
      description: 'Dieses Muster ist beabsichtigt',
      icon: 'CheckCircle',
      type: 'accept',
      consequence: 'KI lernt, dass dies normal ist',
      action: {
        type: 'confirm',
        params: { learnPattern: true }
      },
      learnFromThis: true
    })

    actions.push({
      id: 'investigate',
      label: 'Genauer untersuchen',
      description: 'Eintrag und Kontext im Detail prüfen',
      icon: 'Detective',
      type: 'manual',
      consequence: 'Öffnet erweiterte Analyse',
      action: {
        type: 'manual_review',
        params: { showComparison: true }
      },
      learnFromThis: false
    })

    actions.push({
      id: 'notify-employee-anomaly',
      label: 'Mitarbeiter fragen',
      description: 'Rückfrage zum ungewöhnlichen Muster',
      icon: 'ChatCircle',
      type: 'notify',
      consequence: 'Mitarbeiter erhält Nachfrage',
      action: {
        type: 'send_notification',
        params: {
          employeeId: entry.employeeId,
          template: 'anomaly_inquiry',
          anomalyDetails: anomaly
        }
      },
      learnFromThis: false
    })

    return {
      question: 'Was möchtest du mit dieser Anomalie tun?',
      actions
    }
  }

  private analyzePreviousDecisions(
    insightType: string,
    entry: TimeEntry
  ): ExplainableInsight['learningData'] {
    const relevantDecisions = this.adminDecisions
      .filter(d => d.insightType === insightType)
      .filter(d => {
        if (d.context.projectId === entry.projectId) return true
        if (d.context.employeeId === entry.employeeId) return true
        if (Math.abs((d.context.duration || 0) - entry.duration) < 1) return true
        return false
      })
      .slice(-20)

    if (relevantDecisions.length < 3) {
      return {
        previousDecisions: relevantDecisions
      }
    }

    const actionCounts: Record<string, number> = {}
    relevantDecisions.forEach(d => {
      actionCounts[d.actionTaken] = (actionCounts[d.actionTaken] || 0) + 1
    })

    const mostCommon = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)[0]

    const confidence = mostCommon[1] / relevantDecisions.length

    let suggestedAction: string | undefined
    if (confidence >= 0.7) {
      suggestedAction = mostCommon[0]
    }

    return {
      previousDecisions: relevantDecisions,
      suggestedAction,
      confidence
    }
  }

  setStrictnessMode(mode: StrictnessMode) {
    this.strictnessMode = mode
  }

  getStrictnessMode(): StrictnessMode {
    return this.strictnessMode
  }

  recordDecision(decision: AdminDecision) {
    this.adminDecisions.push(decision)
  }

  getRelevantThreshold(metric: keyof StrictnessModeConfig['thresholds']): number {
    return STRICTNESS_MODES[this.strictnessMode].thresholds[metric]
  }
}
