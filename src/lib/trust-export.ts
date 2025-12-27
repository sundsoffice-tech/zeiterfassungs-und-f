import { TimeEntryWithTrust, ProjectTrustReport, EmployeeTrustReport } from '@/lib/trust-layer'
import { Project, Employee } from '@/lib/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function generateTrustReportText(
  projectReport: ProjectTrustReport,
  project: Project,
  startDate: string,
  endDate: string
): string {
  const totalEntries = projectReport.totalEntries
  const avgScore = projectReport.averagePlausibility
  const highPercent = Math.round((projectReport.highTrust / totalEntries) * 100)
  const mediumPercent = Math.round((projectReport.mediumTrust / totalEntries) * 100)
  const lowPercent = Math.round((projectReport.lowTrust / totalEntries) * 100)
  const unverifiedPercent = Math.round((projectReport.unverified / totalEntries) * 100)
  const evidencePercent = Math.round((projectReport.evidenceAnchored / totalEntries) * 100)
  const correctionPercent = Math.round((projectReport.manualCorrections / totalEntries) * 100)

  return `
VERTRAUENS- & QUALITÄTSBERICHT
================================

Projekt: ${project.name}
${project.code ? `Projektnummer: ${project.code}` : ''}
Zeitraum: ${format(new Date(startDate), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(endDate), 'dd.MM.yyyy', { locale: de })}
Berichtserstellt: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}

GESAMTBEWERTUNG
---------------
Durchschnittlicher Plausibilitäts-Score: ${avgScore}%
Gesamt-Einträge: ${totalEntries}

VERTRAUENSVERTEILUNG
--------------------
✓ Hoch vertrauenswürdig (≥85%):    ${projectReport.highTrust} Einträge (${highPercent}%)
○ Mittleres Vertrauen (70-84%):    ${projectReport.mediumTrust} Einträge (${mediumPercent}%)
⚠ Niedriges Vertrauen (50-69%):    ${projectReport.lowTrust} Einträge (${lowPercent}%)
✗ Ungeprüft (<50%):                ${projectReport.unverified} Einträge (${unverifiedPercent}%)

QUALITÄTSINDIKATOREN
-------------------
Mit freiwilligen Beweisankern:    ${projectReport.evidenceAnchored} Einträge (${evidencePercent}%)
Manuelle Korrekturen:             ${projectReport.manualCorrections} Einträge (${correctionPercent}%)

BEWERTUNG
---------
${
  avgScore >= 90 ? '★★★★★ Exzellente Datenqualität - sehr hohe objektive Plausibilität' :
  avgScore >= 80 ? '★★★★☆ Sehr gute Datenqualität - hohe Plausibilität' :
  avgScore >= 70 ? '★★★☆☆ Gute Datenqualität - akzeptable Plausibilität' :
  avgScore >= 60 ? '★★☆☆☆ Befriedigende Datenqualität - Verbesserung empfohlen' :
  '★☆☆☆☆ Niedrige Datenqualität - Überprüfung erforderlich'
}

${
  highPercent >= 85 ? 
  '✓ Sehr hohe Vertrauenswürdigkeit der erfassten Zeiten.' :
  highPercent >= 70 ?
  '○ Gute Vertrauenswürdigkeit mit vereinzelten Auffälligkeiten.' :
  '⚠ Erhöhte Anzahl an Einträgen mit niedriger Plausibilität.'
}

${
  correctionPercent <= 5 ?
  '✓ Sehr niedrige Korrekturrate - stabile Zeiterfassung.' :
  correctionPercent <= 10 ?
  '○ Akzeptable Korrekturrate.' :
  '⚠ Erhöhte Korrekturrate - Optimierungspotenzial vorhanden.'
}

HINWEIS
-------
Dieser Bericht basiert auf automatisierten Plausibilitätsprüfungen ohne 
Mitarbeiterüberwachung. Die Bewertung erfolgt anhand von:
- Zeitlicher Konsistenz
- Historischen Mustern
- Team-Vergleichen (anonymisiert)
- Freiwilligen Beweisankern
- Plan-Ist-Vergleichen

Die Daten wurden DSGVO-konform ohne Screenshots, permanentes GPS-Tracking
oder App-Überwachung erfasst.
`.trim()
}

export function exportTrustReportCSV(
  entries: TimeEntryWithTrust[],
  projects: Project[],
  employees: Employee[]
): string {
  const headers = [
    'Datum',
    'Mitarbeiter',
    'Projekt',
    'Startzeit',
    'Endzeit',
    'Dauer (Min)',
    'Plausibilitäts-Score',
    'Vertrauensstufe',
    'Zeitl. Konsistenz',
    'Plan vs. Ist',
    'Projekt-Historie',
    'Team-Vergleich',
    'Beweisqualität',
    'Anzahl Beweisanker',
    'Hinweise'
  ]

  const rows = entries.map(entry => {
    const project = projects.find(p => p.id === entry.projectId)
    const employee = employees.find(e => e.id === entry.employeeId)
    const trust = entry.trustMetrics

    return [
      entry.date,
      employee?.name || '-',
      project?.name || '-',
      entry.startTime,
      entry.endTime,
      entry.duration.toString(),
      trust ? trust.plausibilityScore.toString() : '-',
      trust ? trust.trustLevel : '-',
      trust ? trust.factors.temporalConsistency.toString() : '-',
      trust ? trust.factors.planVsActual.toString() : '-',
      trust ? trust.factors.projectHistory.toString() : '-',
      trust ? trust.factors.teamComparison.toString() : '-',
      trust ? trust.factors.evidenceQuality.toString() : '-',
      trust ? trust.evidenceAnchors.length.toString() : '0',
      trust && trust.flaggedIssues.length > 0 ? trust.flaggedIssues.join('; ') : '-'
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function downloadTrustReport(content: string, filename: string, type: 'text' | 'csv' = 'text') {
  const mimeType = type === 'csv' ? 'text/csv' : 'text/plain'
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
