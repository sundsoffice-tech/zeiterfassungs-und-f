import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { TimeEntry, Project, Employee, Task, Phase } from '@/lib/types'
import { ValidationResult } from '@/lib/validation-rules'
import { AnomalyDetection } from '@/lib/anomaly-detection'
import {
  ExplainableAI,
  ExplainableInsight,
  StrictnessMode,
  AdminDecision,
  DecisionAction
} from '@/lib/explainable-ai'

export function useExplainableAI(
  initialMode: StrictnessMode = StrictnessMode.NEUTRAL
) {
  const [strictnessMode, setStrictnessMode] = useKV<StrictnessMode>(
    'explainable-ai-strictness-mode',
    initialMode
  )
  
  const [adminDecisions, setAdminDecisions] = useKV<AdminDecision[]>(
    'explainable-ai-admin-decisions',
    []
  )

  const explainableAI = useMemo(() => {
    return new ExplainableAI(strictnessMode || StrictnessMode.NEUTRAL, adminDecisions || [])
  }, [strictnessMode, adminDecisions])

  const generateInsightsFromValidations = (
    entry: TimeEntry,
    validations: ValidationResult[],
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
      tasks: Task[]
    }
  ): ExplainableInsight[] => {
    return validations
      .filter(v => !v.valid)
      .map(validation => explainableAI.generateInsight(entry, validation, context))
  }

  const generateInsightsFromAnomalies = (
    entry: TimeEntry,
    anomalies: AnomalyDetection[],
    context: {
      allEntries: TimeEntry[]
      projects: Project[]
      employees: Employee[]
      tasks: Task[]
    }
  ): ExplainableInsight[] => {
    const modeConfig = explainableAI.getStrictnessMode()
    const threshold = explainableAI.getRelevantThreshold('anomalyConfidence')
    
    return anomalies
      .filter(a => a.confidence >= threshold)
      .map(anomaly => explainableAI.generateInsightFromAnomaly(entry, anomaly, context))
  }

  const recordDecision = (
    insight: ExplainableInsight,
    action: DecisionAction,
    entry: TimeEntry
  ) => {
    const decision: AdminDecision = {
      insightId: insight.id,
      insightType: insight.type,
      actionTaken: action.id,
      timestamp: new Date().toISOString(),
      context: {
        projectId: entry.projectId,
        employeeId: entry.employeeId,
        duration: entry.duration,
        date: entry.date
      }
    }

    setAdminDecisions((current) => {
      const updated = [...(current || []), decision]
      return updated.slice(-1000)
    })

    explainableAI.recordDecision(decision)
  }

  const getDecisionStats = (insightType: string) => {
    const decisions = adminDecisions || []
    const relevantDecisions = decisions.filter(
      d => d.insightType === insightType
    )

    if (relevantDecisions.length === 0) {
      return null
    }

    const actionCounts: Record<string, number> = {}
    relevantDecisions.forEach(d => {
      actionCounts[d.actionTaken] = (actionCounts[d.actionTaken] || 0) + 1
    })

    const mostCommon = Object.entries(actionCounts).sort(([, a], [, b]) => b - a)[0]

    return {
      totalDecisions: relevantDecisions.length,
      mostCommonAction: mostCommon[0],
      mostCommonActionCount: mostCommon[1],
      mostCommonActionRate: mostCommon[1] / relevantDecisions.length,
      allActions: actionCounts
    }
  }

  const clearDecisionHistory = () => {
    setAdminDecisions([])
  }

  return {
    strictnessMode: strictnessMode || StrictnessMode.NEUTRAL,
    setStrictnessMode,
    adminDecisions: adminDecisions || [],
    generateInsightsFromValidations,
    generateInsightsFromAnomalies,
    recordDecision,
    getDecisionStats,
    clearDecisionHistory,
    explainableAI
  }
}
