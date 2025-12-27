import { TimeEntry, Employee, Project, Task } from './types'
import { differenceInMinutes, parseISO, startOfDay, endOfDay, isWeekend, format } from 'date-fns'

export interface EvidenceAnchor {
  type: 'calendar' | 'file' | 'location_hash' | 'approval' | 'system'
  timestamp: string
  value: string
  verified: boolean
}

export interface PlausibilityFactors {
  temporalConsistency: number
  planVsActual: number
  projectHistory: number
  teamComparison: number
  evidenceQuality: number
}

export interface TrustMetrics {
  plausibilityScore: number
  factors: PlausibilityFactors
  evidenceAnchors: EvidenceAnchor[]
  flaggedIssues: string[]
  trustLevel: 'high' | 'medium' | 'low' | 'unverified'
  lastCalculated: string
}

export interface TimeEntryWithTrust extends TimeEntry {
  trustMetrics?: TrustMetrics
}

export interface ProjectTrustReport {
  projectId: string
  projectName: string
  totalEntries: number
  averagePlausibility: number
  highTrust: number
  mediumTrust: number
  lowTrust: number
  unverified: number
  manualCorrections: number
  evidenceAnchored: number
}

export interface EmployeeTrustReport {
  employeeId: string
  employeeName: string
  totalEntries: number
  averagePlausibility: number
  consistencyScore: number
  evidenceUsageRate: number
}

function calculateTemporalConsistency(
  entry: TimeEntry,
  allEntries: TimeEntry[]
): number {
  let score = 100

  const entryDate = parseISO(entry.date)
  const employeeEntries = allEntries.filter(e => 
    e.employeeId === entry.employeeId &&
    e.id !== entry.id
  )

  const overlaps = employeeEntries.filter(e => {
    if (e.date !== entry.date) return false
    const eStart = parseISO(`${e.date}T${e.startTime}`)
    const eEnd = parseISO(`${e.date}T${e.endTime}`)
    const entryStart = parseISO(`${entry.date}T${entry.startTime}`)
    const entryEnd = parseISO(`${entry.date}T${entry.endTime}`)
    return (entryStart < eEnd && entryEnd > eStart)
  })

  if (overlaps.length > 0) {
    score -= 40
  }

  if (entry.duration > 12 * 60) {
    score -= 20
  }

  if (entry.duration > 16 * 60) {
    score -= 30
  }

  const startMinutes = parseInt(entry.startTime.split(':')[0]) * 60 + parseInt(entry.startTime.split(':')[1])
  if (startMinutes < 180 || startMinutes > 1380) {
    score -= 15
  }

  const isExactHour = entry.duration % 60 === 0
  const employeeDayEntries = employeeEntries.filter(e => e.date === entry.date)
  const allExactHours = employeeDayEntries.every(e => e.duration % 60 === 0)
  if (isExactHour && allExactHours && employeeDayEntries.length > 3) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function calculatePlanVsActual(
  entry: TimeEntry,
  allEntries: TimeEntry[]
): number {
  const projectEntries = allEntries.filter(e => 
    e.projectId === entry.projectId &&
    e.taskId === entry.taskId &&
    e.id !== entry.id
  ).slice(-10)

  if (projectEntries.length === 0) {
    return 50
  }

  const avgDuration = projectEntries.reduce((sum, e) => sum + e.duration, 0) / projectEntries.length
  const deviation = Math.abs(entry.duration - avgDuration) / avgDuration

  if (deviation < 0.2) return 100
  if (deviation < 0.5) return 85
  if (deviation < 1.0) return 70
  if (deviation < 2.0) return 55
  return 40
}

function calculateProjectHistory(
  entry: TimeEntry,
  allEntries: TimeEntry[]
): number {
  const employeeProjectEntries = allEntries.filter(e =>
    e.employeeId === entry.employeeId &&
    e.projectId === entry.projectId &&
    e.id !== entry.id
  )

  if (employeeProjectEntries.length === 0) {
    return 60
  }

  if (employeeProjectEntries.length > 20) {
    return 95
  }

  return 60 + (employeeProjectEntries.length * 1.75)
}

function calculateTeamComparison(
  entry: TimeEntry,
  allEntries: TimeEntry[],
  employees: Employee[]
): number {
  const taskEntries = allEntries.filter(e =>
    e.projectId === entry.projectId &&
    e.taskId === entry.taskId &&
    e.employeeId !== entry.employeeId
  )

  if (taskEntries.length < 3) {
    return 70
  }

  const avgTeamDuration = taskEntries.reduce((sum, e) => sum + e.duration, 0) / taskEntries.length
  const deviation = Math.abs(entry.duration - avgTeamDuration) / avgTeamDuration

  if (deviation < 0.3) return 100
  if (deviation < 0.6) return 85
  if (deviation < 1.0) return 70
  if (deviation < 2.0) return 55
  return 45
}

function calculateEvidenceQuality(evidenceAnchors: EvidenceAnchor[]): number {
  if (evidenceAnchors.length === 0) return 50

  let score = 50
  const verified = evidenceAnchors.filter(a => a.verified).length

  score += verified * 15
  
  const hasCalendar = evidenceAnchors.some(a => a.type === 'calendar')
  const hasApproval = evidenceAnchors.some(a => a.type === 'approval')
  const hasLocation = evidenceAnchors.some(a => a.type === 'location_hash')

  if (hasCalendar) score += 10
  if (hasApproval) score += 15
  if (hasLocation) score += 10

  return Math.min(100, score)
}

export function calculatePlausibilityScore(
  entry: TimeEntry,
  allEntries: TimeEntry[],
  employees: Employee[],
  evidenceAnchors: EvidenceAnchor[] = []
): TrustMetrics {
  const factors: PlausibilityFactors = {
    temporalConsistency: calculateTemporalConsistency(entry, allEntries),
    planVsActual: calculatePlanVsActual(entry, allEntries),
    projectHistory: calculateProjectHistory(entry, allEntries),
    teamComparison: calculateTeamComparison(entry, allEntries, employees),
    evidenceQuality: calculateEvidenceQuality(evidenceAnchors)
  }

  const weights = {
    temporalConsistency: 0.30,
    planVsActual: 0.20,
    projectHistory: 0.15,
    teamComparison: 0.20,
    evidenceQuality: 0.15
  }

  const plausibilityScore = Math.round(
    factors.temporalConsistency * weights.temporalConsistency +
    factors.planVsActual * weights.planVsActual +
    factors.projectHistory * weights.projectHistory +
    factors.teamComparison * weights.teamComparison +
    factors.evidenceQuality * weights.evidenceQuality
  )

  const flaggedIssues: string[] = []
  
  if (factors.temporalConsistency < 60) {
    flaggedIssues.push('Zeitliche Inkonsistenz erkannt')
  }
  if (factors.planVsActual < 50) {
    flaggedIssues.push('Weicht stark vom üblichen Muster ab')
  }
  if (factors.teamComparison < 50) {
    flaggedIssues.push('Abweichung vom Team-Durchschnitt')
  }

  let trustLevel: 'high' | 'medium' | 'low' | 'unverified'
  if (plausibilityScore >= 85) trustLevel = 'high'
  else if (plausibilityScore >= 70) trustLevel = 'medium'
  else if (plausibilityScore >= 50) trustLevel = 'low'
  else trustLevel = 'unverified'

  return {
    plausibilityScore,
    factors,
    evidenceAnchors,
    flaggedIssues,
    trustLevel,
    lastCalculated: new Date().toISOString()
  }
}

export function generateProjectTrustReport(
  projectId: string,
  projectName: string,
  entries: TimeEntryWithTrust[]
): ProjectTrustReport {
  const projectEntries = entries.filter(e => e.projectId === projectId)
  
  const totalEntries = projectEntries.length
  const withTrust = projectEntries.filter(e => e.trustMetrics)
  
  const avgPlausibility = withTrust.length > 0
    ? withTrust.reduce((sum, e) => sum + (e.trustMetrics?.plausibilityScore || 0), 0) / withTrust.length
    : 0

  const highTrust = withTrust.filter(e => e.trustMetrics?.trustLevel === 'high').length
  const mediumTrust = withTrust.filter(e => e.trustMetrics?.trustLevel === 'medium').length
  const lowTrust = withTrust.filter(e => e.trustMetrics?.trustLevel === 'low').length
  const unverified = withTrust.filter(e => e.trustMetrics?.trustLevel === 'unverified').length

  const manualCorrections = projectEntries.filter(e => e.changeLog && e.changeLog.length > 0).length
  const evidenceAnchored = withTrust.filter(e => 
    e.trustMetrics?.evidenceAnchors && e.trustMetrics.evidenceAnchors.length > 0
  ).length

  return {
    projectId,
    projectName,
    totalEntries,
    averagePlausibility: Math.round(avgPlausibility),
    highTrust,
    mediumTrust,
    lowTrust,
    unverified,
    manualCorrections,
    evidenceAnchored
  }
}

export function generateEmployeeTrustReport(
  employeeId: string,
  employeeName: string,
  entries: TimeEntryWithTrust[]
): EmployeeTrustReport {
  const employeeEntries = entries.filter(e => e.employeeId === employeeId)
  const withTrust = employeeEntries.filter(e => e.trustMetrics)

  const totalEntries = employeeEntries.length
  const avgPlausibility = withTrust.length > 0
    ? withTrust.reduce((sum, e) => sum + (e.trustMetrics?.plausibilityScore || 0), 0) / withTrust.length
    : 0

  const consistencyScore = withTrust.length > 0
    ? withTrust.reduce((sum, e) => sum + (e.trustMetrics?.factors.temporalConsistency || 0), 0) / withTrust.length
    : 0

  const withEvidence = withTrust.filter(e => 
    e.trustMetrics?.evidenceAnchors && e.trustMetrics.evidenceAnchors.length > 0
  ).length
  const evidenceUsageRate = totalEntries > 0 ? (withEvidence / totalEntries) * 100 : 0

  return {
    employeeId,
    employeeName,
    totalEntries,
    averagePlausibility: Math.round(avgPlausibility),
    consistencyScore: Math.round(consistencyScore),
    evidenceUsageRate: Math.round(evidenceUsageRate)
  }
}

export function createCalendarAnchor(
  eventTitle: string,
  eventTime: string
): EvidenceAnchor {
  return {
    type: 'calendar',
    timestamp: new Date().toISOString(),
    value: `Kalendereintrag: ${eventTitle} um ${eventTime}`,
    verified: true
  }
}

export function createLocationHashAnchor(
  latitude: number,
  longitude: number,
  radius: number = 100
): EvidenceAnchor {
  const roundedLat = Math.round(latitude * 100) / 100
  const roundedLon = Math.round(longitude * 100) / 100
  const hash = `${roundedLat},${roundedLon}±${radius}m`
  
  return {
    type: 'location_hash',
    timestamp: new Date().toISOString(),
    value: hash,
    verified: true
  }
}

export function createApprovalAnchor(
  approverName: string,
  approvalTime: string
): EvidenceAnchor {
  return {
    type: 'approval',
    timestamp: approvalTime,
    value: `Freigegeben durch: ${approverName}`,
    verified: true
  }
}

export function createFileAnchor(
  fileName: string,
  fileTimestamp: string
): EvidenceAnchor {
  return {
    type: 'file',
    timestamp: fileTimestamp,
    value: `Datei geöffnet: ${fileName}`,
    verified: false
  }
}

export function getTrustLevelColor(level: 'high' | 'medium' | 'low' | 'unverified'): string {
  switch (level) {
    case 'high': return 'text-green-600'
    case 'medium': return 'text-yellow-600'
    case 'low': return 'text-orange-600'
    case 'unverified': return 'text-red-600'
  }
}

export function getTrustLevelBadgeColor(level: 'high' | 'medium' | 'low' | 'unverified'): string {
  switch (level) {
    case 'high': return 'bg-green-100 text-green-800 border-green-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'unverified': return 'bg-red-100 text-red-800 border-red-200'
  }
}

export function getTrustLevelLabel(level: 'high' | 'medium' | 'low' | 'unverified'): string {
  switch (level) {
    case 'high': return 'Hoch vertrauenswürdig'
    case 'medium': return 'Mittleres Vertrauen'
    case 'low': return 'Niedriges Vertrauen'
    case 'unverified': return 'Ungeprüft'
  }
}
