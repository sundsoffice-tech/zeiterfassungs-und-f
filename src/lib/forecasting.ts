import { TimeEntry, Project, Task, Employee, PlannedTime } from './types'
import { startOfWeek, endOfWeek, differenceInDays, addDays, format, parseISO, isWithinInterval } from 'date-fns'

export interface TimeEstimate {
  taskId?: string
  projectId: string
  estimatedHours: number
  confidence: number
  basedOn: {
    historicalEntries: number
    averageHours: number
    stdDeviation: number
  }
  explanation: string
}

export interface BudgetRiskAssessment {
  projectId: string
  projectName: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  budgetHours: number
  spentHours: number
  estimatedRemainingHours: number
  projectedTotalHours: number
  percentComplete: number
  daysRemaining: number
  burnRate: number
  factors: {
    name: string
    impact: number
    description: string
  }[]
  explanation: string
}

export interface StaffingRecommendation {
  projectId: string
  projectName: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  currentStaff: number
  recommendedStaff: number
  action: 'reduce' | 'maintain' | 'increase_moderate' | 'increase_urgent'
  impact: string
  explanation: string
  specificActions: string[]
  deadline?: string
  hoursNeeded: number
  daysAvailable: number
}

export interface ForecastData {
  estimates: TimeEstimate[]
  risks: BudgetRiskAssessment[]
  recommendations: StaffingRecommendation[]
  generatedAt: string
}

export function calculateTimeEstimate(
  projectId: string,
  taskId: string | undefined,
  timeEntries: TimeEntry[],
  projects: Project[],
  tasks: Task[]
): TimeEstimate {
  const relevantEntries = timeEntries.filter(
    entry => entry.projectId === projectId && 
    (taskId === undefined || entry.taskId === taskId)
  )

  if (relevantEntries.length === 0) {
    const project = projects.find(p => p.id === projectId)
    const task = tasks.find(t => t.id === taskId)
    
    return {
      taskId,
      projectId,
      estimatedHours: task?.estimatedHours || 8,
      confidence: 0,
      basedOn: {
        historicalEntries: 0,
        averageHours: 0,
        stdDeviation: 0
      },
      explanation: 'Keine historischen Daten verfügbar. Schätzung basiert auf Standard-Werten.'
    }
  }

  const hours = relevantEntries.map(e => e.duration)
  const avgHours = hours.reduce((sum, h) => sum + h, 0) / hours.length
  
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / hours.length
  const stdDev = Math.sqrt(variance)
  
  const confidence = Math.min(100, (relevantEntries.length / 10) * 100)
  
  const taskName = tasks.find(t => t.id === taskId)?.name || 'Projekt'
  const projectName = projects.find(p => p.id === projectId)?.name || 'Unbekannt'

  return {
    taskId,
    projectId,
    estimatedHours: Math.round(avgHours * 10) / 10,
    confidence: Math.round(confidence),
    basedOn: {
      historicalEntries: relevantEntries.length,
      averageHours: Math.round(avgHours * 10) / 10,
      stdDeviation: Math.round(stdDev * 10) / 10
    },
    explanation: `Basierend auf ${relevantEntries.length} historischen Einträgen für ${taskId ? taskName : projectName}. Durchschnitt: ${Math.round(avgHours * 10) / 10}h (±${Math.round(stdDev * 10) / 10}h).`
  }
}

export function assessBudgetRisk(
  project: Project,
  timeEntries: TimeEntry[],
  tasks: Task[],
  plannedTimes: PlannedTime[] = []
): BudgetRiskAssessment {
  const projectEntries = timeEntries.filter(e => e.projectId === project.id)
  const spentHours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
  
  const budgetHours = project.budget || 0
  
  const projectTasks = tasks.filter(t => t.projectId === project.id)
  const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  
  const completedTaskHours = projectTasks
    .filter(t => {
      const taskEntries = projectEntries.filter(e => e.taskId === t.id)
      const taskSpent = taskEntries.reduce((sum, e) => sum + e.duration, 0)
      return taskSpent >= (t.estimatedHours || 0) * 0.9
    })
    .reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  
  const percentComplete = totalEstimatedHours > 0 
    ? (completedTaskHours / totalEstimatedHours) * 100 
    : (budgetHours > 0 ? (spentHours / budgetHours) * 100 : 0)
  
  const estimatedRemainingHours = Math.max(0, totalEstimatedHours - spentHours)
  const projectedTotalHours = spentHours + estimatedRemainingHours
  
  const now = new Date()
  const endDate = project.endDate ? parseISO(project.endDate) : addDays(now, 30)
  const daysRemaining = Math.max(0, differenceInDays(endDate, now))
  
  const startDate = project.startDate ? parseISO(project.startDate) : addDays(now, -30)
  const projectDuration = differenceInDays(now, startDate)
  const burnRate = projectDuration > 0 ? spentHours / projectDuration : 0
  
  const factors: BudgetRiskAssessment['factors'] = []
  
  let riskScore = 0
  
  if (budgetHours > 0) {
    const budgetUsagePercent = (spentHours / budgetHours) * 100
    if (budgetUsagePercent > 90) {
      factors.push({
        name: 'Budget fast erschöpft',
        impact: 30,
        description: `${Math.round(budgetUsagePercent)}% des Budgets bereits verbraucht`
      })
      riskScore += 30
    } else if (budgetUsagePercent > 75) {
      factors.push({
        name: 'Budget-Warnung',
        impact: 20,
        description: `${Math.round(budgetUsagePercent)}% des Budgets verbraucht`
      })
      riskScore += 20
    }
    
    if (projectedTotalHours > budgetHours * 1.1) {
      factors.push({
        name: 'Budgetüberschreitung prognostiziert',
        impact: 35,
        description: `Projiziert: ${Math.round(projectedTotalHours)}h vs. Budget: ${budgetHours}h`
      })
      riskScore += 35
    }
  }
  
  if (daysRemaining < 7 && estimatedRemainingHours > 0) {
    const hoursPerDay = estimatedRemainingHours / Math.max(1, daysRemaining)
    if (hoursPerDay > 8) {
      factors.push({
        name: 'Zeitdruck kritisch',
        impact: 25,
        description: `${Math.round(hoursPerDay)}h/Tag nötig in verbleibenden ${daysRemaining} Tagen`
      })
      riskScore += 25
    }
  }
  
  if (burnRate > 0 && daysRemaining > 0) {
    const projectedByBurnRate = spentHours + (burnRate * daysRemaining)
    if (budgetHours > 0 && projectedByBurnRate > budgetHours * 1.15) {
      factors.push({
        name: 'Hohe Burn-Rate',
        impact: 20,
        description: `Aktuelle Rate: ${Math.round(burnRate * 10) / 10}h/Tag`
      })
      riskScore += 20
    }
  }
  
  if (percentComplete < 50 && daysRemaining < 14) {
    factors.push({
      name: 'Geringer Fortschritt',
      impact: 15,
      description: `Nur ${Math.round(percentComplete)}% abgeschlossen mit wenig Zeit`
    })
    riskScore += 15
  }
  
  if (projectEntries.length === 0 && daysRemaining < 14) {
    factors.push({
      name: 'Keine Aktivität',
      impact: 10,
      description: 'Projekt hat keine Zeiteinträge'
    })
    riskScore += 10
  }
  
  riskScore = Math.min(100, riskScore)
  
  let riskLevel: BudgetRiskAssessment['riskLevel']
  if (riskScore >= 70) riskLevel = 'critical'
  else if (riskScore >= 50) riskLevel = 'high'
  else if (riskScore >= 30) riskLevel = 'medium'
  else riskLevel = 'low'
  
  let explanation = ''
  if (riskLevel === 'critical') {
    explanation = `⚠️ KRITISCH: Hohe Wahrscheinlichkeit für Budgetüberschreitung (${riskScore}% Risiko).`
  } else if (riskLevel === 'high') {
    explanation = `⚡ HOCH: Budgetüberschreitung wahrscheinlich (${riskScore}% Risiko).`
  } else if (riskLevel === 'medium') {
    explanation = `⚠ MITTEL: Budget unter Beobachtung (${riskScore}% Risiko).`
  } else {
    explanation = `✓ NIEDRIG: Projekt im Plan (${riskScore}% Risiko).`
  }
  
  return {
    projectId: project.id,
    projectName: project.name,
    riskScore,
    riskLevel,
    budgetHours,
    spentHours: Math.round(spentHours * 10) / 10,
    estimatedRemainingHours: Math.round(estimatedRemainingHours * 10) / 10,
    projectedTotalHours: Math.round(projectedTotalHours * 10) / 10,
    percentComplete: Math.round(percentComplete),
    daysRemaining,
    burnRate: Math.round(burnRate * 10) / 10,
    factors,
    explanation
  }
}

export function generateStaffingRecommendation(
  project: Project,
  timeEntries: TimeEntry[],
  tasks: Task[],
  employees: Employee[],
  riskAssessment: BudgetRiskAssessment
): StaffingRecommendation {
  const projectEntries = timeEntries.filter(e => e.projectId === project.id)
  
  const uniqueEmployees = new Set(projectEntries.map(e => e.employeeId))
  const currentStaff = uniqueEmployees.size
  
  const hoursNeeded = riskAssessment.estimatedRemainingHours
  const daysAvailable = Math.max(1, riskAssessment.daysRemaining)
  
  const hoursPerPersonPerDay = 6
  const totalCapacity = currentStaff * hoursPerPersonPerDay * daysAvailable
  
  let recommendedStaff = currentStaff
  let action: StaffingRecommendation['action'] = 'maintain'
  let priority: StaffingRecommendation['priority'] = 'low'
  let impact = ''
  let specificActions: string[] = []
  
  if (hoursNeeded === 0 || !project.active) {
    action = 'maintain'
    priority = 'low'
    impact = 'Projekt läuft planmäßig oder ist abgeschlossen.'
    specificActions = ['Aktuelle Besetzung beibehalten']
  } else if (totalCapacity < hoursNeeded * 0.8) {
    const idealStaff = Math.ceil(hoursNeeded / (hoursPerPersonPerDay * daysAvailable))
    recommendedStaff = Math.max(currentStaff + 1, idealStaff)
    
    if (daysAvailable <= 3) {
      action = 'increase_urgent'
      priority = 'critical'
      impact = `Dringend: ${recommendedStaff - currentStaff} zusätzliche Personen sofort benötigt!`
      specificActions = [
        `${recommendedStaff - currentStaff} Personen SOFORT hinzufügen`,
        'Überstunden einplanen oder Deadline verschieben',
        'Täglich Status-Check durchführen'
      ]
    } else if (daysAvailable <= 7) {
      action = 'increase_urgent'
      priority = 'high'
      impact = `Dringend: ${recommendedStaff - currentStaff} zusätzliche Personen diese Woche benötigt.`
      specificActions = [
        `${recommendedStaff - currentStaff} Personen in den nächsten 2 Tagen hinzufügen`,
        'Priorisierung der kritischen Tasks',
        'Tägliches Monitoring der Fortschritte'
      ]
    } else {
      action = 'increase_moderate'
      priority = 'medium'
      impact = `Erhöhung auf ${recommendedStaff} Personen empfohlen für rechtzeitigen Abschluss.`
      specificActions = [
        `${recommendedStaff - currentStaff} Personen in nächster Woche hinzufügen`,
        'Ressourcenplanung mit Team abstimmen',
        'Wöchentliches Progress-Review'
      ]
    }
  } else if (totalCapacity > hoursNeeded * 2 && currentStaff > 1) {
    recommendedStaff = Math.max(1, Math.floor(hoursNeeded / (hoursPerPersonPerDay * daysAvailable)))
    action = 'reduce'
    priority = 'low'
    impact = `Überkapazität: ${currentStaff - recommendedStaff} Person(en) können anderen Projekten zugeteilt werden.`
    specificActions = [
      `${currentStaff - recommendedStaff} Person(en) anderen Projekten zuweisen`,
      'Mindestbesetzung von 1 Person beibehalten',
      'Restarbeiten klar definieren'
    ]
  } else {
    action = 'maintain'
    priority = 'low'
    impact = 'Aktuelle Besetzung ist angemessen für verbleibende Arbeit.'
    specificActions = ['Aktuelle Besetzung beibehalten', 'Fortschritt weiter beobachten']
  }
  
  let explanation = ''
  if (action === 'increase_urgent') {
    explanation = `🚨 ${impact} Bei aktueller Besetzung (${currentStaff} Personen) wird das Projekt verzögert. Empfehlung: ${recommendedStaff} Personen morgen statt ${currentStaff}, sonst Verzug.`
  } else if (action === 'increase_moderate') {
    explanation = `⚡ ${impact} Mit ${hoursNeeded}h verbleibend und ${daysAvailable} Tagen, benötigen Sie mehr Kapazität.`
  } else if (action === 'reduce') {
    explanation = `💡 ${impact} Projekt benötigt weniger Ressourcen als aktuell zugewiesen.`
  } else {
    explanation = `✓ ${impact} Kapazität ist ausreichend für verbleibende ${hoursNeeded}h in ${daysAvailable} Tagen.`
  }
  
  return {
    projectId: project.id,
    projectName: project.name,
    priority,
    currentStaff,
    recommendedStaff,
    action,
    impact,
    explanation,
    specificActions,
    deadline: project.endDate,
    hoursNeeded: Math.round(hoursNeeded * 10) / 10,
    daysAvailable
  }
}

export async function generateForecast(
  projects: Project[],
  tasks: Task[],
  timeEntries: TimeEntry[],
  employees: Employee[],
  plannedTimes: PlannedTime[] = []
): Promise<ForecastData> {
  const estimates: TimeEstimate[] = []
  const risks: BudgetRiskAssessment[] = []
  const recommendations: StaffingRecommendation[] = []
  
  const activeProjects = projects.filter(p => p.active)
  
  for (const project of activeProjects) {
    const projectTasks = tasks.filter(t => t.projectId === project.id && t.active)
    
    for (const task of projectTasks) {
      const estimate = calculateTimeEstimate(project.id, task.id, timeEntries, projects, tasks)
      estimates.push(estimate)
    }
    
    if (projectTasks.length === 0) {
      const estimate = calculateTimeEstimate(project.id, undefined, timeEntries, projects, tasks)
      estimates.push(estimate)
    }
    
    const riskAssessment = assessBudgetRisk(project, timeEntries, tasks, plannedTimes)
    risks.push(riskAssessment)
    
    const staffingRec = generateStaffingRecommendation(project, timeEntries, tasks, employees, riskAssessment)
    recommendations.push(staffingRec)
  }
  
  risks.sort((a, b) => b.riskScore - a.riskScore)
  recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
  
  return {
    estimates,
    risks,
    recommendations,
    generatedAt: new Date().toISOString()
  }
}

export async function generateAIEnhancedForecast(
  projects: Project[],
  tasks: Task[],
  timeEntries: TimeEntry[],
  employees: Employee[],
  plannedTimes: PlannedTime[] = []
): Promise<ForecastData> {
  const baseForecast = await generateForecast(projects, tasks, timeEntries, employees, plannedTimes)
  
  const topRisks = baseForecast.risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').slice(0, 3)
  
  if (topRisks.length > 0 && typeof window !== 'undefined' && window.spark) {
    try {
      const prompt = (window.spark.llmPrompt as any)`Du bist ein Projektmanagement-Experte. Analysiere folgende Projekt-Risiken und gib präzise Handlungsempfehlungen:

${JSON.stringify(topRisks.map(r => ({
  projekt: r.projectName,
  risikoScore: r.riskScore,
  risikoLevel: r.riskLevel,
  budgetStunden: r.budgetHours,
  verbraucht: r.spentHours,
  verbleibend: r.estimatedRemainingHours,
  projiziert: r.projectedTotalHours,
  tageVerbleibend: r.daysRemaining,
  burnRate: r.burnRate,
  fortschritt: r.percentComplete,
  faktoren: r.factors
})), null, 2)}

Gib für jedes Projekt:
1. Eine kurze Risikoeinschätzung (1 Satz)
2. Die 2-3 wichtigsten Sofortmaßnahmen
3. Eine realistische Prognose

Antworte im JSON-Format mit einem "insights" Array.`

      const response = await window.spark.llm(prompt, 'gpt-4o-mini', true)
      const aiInsights = JSON.parse(response)
      
      if (aiInsights.insights && Array.isArray(aiInsights.insights)) {
        aiInsights.insights.forEach((insight: any, index: number) => {
          if (baseForecast.risks[index]) {
            baseForecast.risks[index].explanation += `\n\n🤖 KI-Analyse: ${insight.einschaetzung || insight.assessment || ''}`
          }
        })
      }
    } catch (error) {
      console.error('AI forecast enhancement failed:', error)
    }
  }
  
  return baseForecast
}
