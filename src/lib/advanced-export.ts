import { Employee, Project, Task, TimeEntry, MileageEntry } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export interface ExportFormat {
  id: string
  name: string
  description: string
  fileExtension: string
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'standard_csv',
    name: 'Standard CSV',
    description: 'Einfaches CSV-Format für allgemeine Verwendung',
    fileExtension: 'csv'
  },
  {
    id: 'datev',
    name: 'DATEV-freundlich',
    description: 'CSV-Format optimiert für DATEV-Import',
    fileExtension: 'csv'
  },
  {
    id: 'sevdesk',
    name: 'SevDesk',
    description: 'CSV-Format für SevDesk-Import',
    fileExtension: 'csv'
  },
  {
    id: 'lexware',
    name: 'Lexware',
    description: 'CSV-Format für Lexware-Import',
    fileExtension: 'csv'
  },
  {
    id: 'excel',
    name: 'Excel (erweitert)',
    description: 'Detailliertes Format mit allen Feldern',
    fileExtension: 'csv'
  }
]

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateStandardCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[]
): string {
  const headers = [
    'Datum',
    'Mitarbeiter',
    'Mitarbeiter ID',
    'Projekt',
    'Projekt Code',
    'Task',
    'Start',
    'Ende',
    'Dauer (h)',
    'Abrechenbar',
    'Stundensatz',
    'Kosten',
    'Tags',
    'Ort',
    'Notiz',
    'Kostenstelle',
    'Status',
    'Gesperrt'
  ]

  const rows = timeEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)
    const task = tasks.find(t => t.id === entry.taskId)
    const cost = (entry.rate || 0) * entry.duration

    return [
      entry.date,
      employee?.name || '',
      employee?.id || '',
      project?.name || '',
      project?.code || '',
      task?.name || '',
      entry.startTime,
      entry.endTime,
      entry.duration.toFixed(2),
      entry.billable ? 'Ja' : 'Nein',
      entry.rate?.toFixed(2) || '',
      cost.toFixed(2),
      entry.tags?.join('; ') || '',
      entry.location || '',
      entry.notes || '',
      entry.costCenter || '',
      entry.approvalStatus,
      entry.locked ? 'Ja' : 'Nein'
    ].map(escapeCSV)
  })

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

function generateDATEVCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[]
): string {
  const headers = [
    'Buchungsdatum',
    'Belegnummer',
    'Mitarbeiternummer',
    'Mitarbeitername',
    'Konto',
    'Gegenkonto',
    'Betrag',
    'Stunden',
    'Buchungstext',
    'Kostenstelle'
  ]

  const rows = timeEntries.map((entry, idx) => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)
    const cost = (entry.rate || 0) * entry.duration
    const belegnummer = `TIME-${format(parseISO(entry.date), 'yyyyMMdd')}-${idx + 1}`

    return [
      format(parseISO(entry.date), 'dd.MM.yyyy'),
      belegnummer,
      employee?.id.slice(0, 10) || '',
      employee?.name || '',
      '4910',
      project?.code || '8400',
      cost.toFixed(2).replace('.', ','),
      entry.duration.toFixed(2).replace('.', ','),
      `${project?.name || ''} - ${entry.notes || ''}`.slice(0, 60),
      entry.costCenter || project?.code || ''
    ].map(escapeCSV)
  })

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')
}

function generateSevDeskCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[]
): string {
  const headers = [
    'Datum',
    'Mitarbeiter',
    'Projekt',
    'Leistung',
    'Stunden',
    'Stundensatz',
    'Summe',
    'Abrechenbar',
    'Beschreibung'
  ]

  const rows = timeEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)
    const task = tasks.find(t => t.id === entry.taskId)
    const cost = (entry.rate || 0) * entry.duration

    return [
      format(parseISO(entry.date), 'dd.MM.yyyy'),
      employee?.name || '',
      project?.name || '',
      task?.name || 'Allgemein',
      entry.duration.toFixed(2),
      entry.rate?.toFixed(2) || '0.00',
      cost.toFixed(2),
      entry.billable ? '1' : '0',
      entry.notes || ''
    ].map(escapeCSV)
  })

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

function generateLexwareCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[]
): string {
  const headers = [
    'Datum',
    'Personalnummer',
    'Name',
    'Projektnummer',
    'Projektname',
    'Stunden',
    'Betrag',
    'Beschreibung',
    'Kostenstelle'
  ]

  const rows = timeEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)
    const cost = (entry.rate || 0) * entry.duration

    return [
      format(parseISO(entry.date), 'dd.MM.yyyy'),
      employee?.id.slice(0, 10) || '',
      employee?.name || '',
      project?.code || project?.id.slice(0, 10) || '',
      project?.name || '',
      entry.duration.toFixed(2).replace('.', ','),
      cost.toFixed(2).replace('.', ','),
      entry.notes || '',
      entry.costCenter || ''
    ].map(escapeCSV)
  })

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')
}

function generateExtendedExcelCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[]
): string {
  const headers = [
    'Entry ID',
    'Datum',
    'Wochentag',
    'Mitarbeiter ID',
    'Mitarbeiter Name',
    'Mitarbeiter Email',
    'Mitarbeiter Rolle',
    'Projekt ID',
    'Projekt Name',
    'Projekt Code',
    'Projekt Start',
    'Projekt Ende',
    'Task ID',
    'Task Name',
    'Start Zeit',
    'Ende Zeit',
    'Dauer (h)',
    'Dauer (min)',
    'Abrechenbar',
    'Stundensatz',
    'Kosten',
    'Umsatz',
    'Tags',
    'Ort',
    'Notiz',
    'Kostenstelle',
    'Approval Status',
    'Gesperrt',
    'Genehmigt von',
    'Genehmigt am',
    'Erstellt am',
    'Erstellt von',
    'Geändert am',
    'Geändert von',
    'Anzahl Änderungen'
  ]

  const rows = timeEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)
    const task = tasks.find(t => t.id === entry.taskId)
    const cost = (employee?.hourlyRate || 0) * entry.duration
    const revenue = (entry.rate || 0) * entry.duration
    const durationMinutes = Math.round(entry.duration * 60)
    const weekday = format(parseISO(entry.date), 'EEEE', { locale: de })

    return [
      entry.id,
      entry.date,
      weekday,
      employee?.id || '',
      employee?.name || '',
      employee?.email || '',
      employee?.role || '',
      project?.id || '',
      project?.name || '',
      project?.code || '',
      project?.startDate || '',
      project?.endDate || '',
      task?.id || '',
      task?.name || '',
      entry.startTime,
      entry.endTime,
      entry.duration.toFixed(2),
      durationMinutes.toString(),
      entry.billable ? 'Ja' : 'Nein',
      entry.rate?.toFixed(2) || '',
      cost.toFixed(2),
      revenue.toFixed(2),
      entry.tags?.join('; ') || '',
      entry.location || '',
      entry.notes || '',
      entry.costCenter || '',
      entry.approvalStatus,
      entry.locked ? 'Ja' : 'Nein',
      entry.approvedBy || '',
      entry.approvedAt ? format(parseISO(entry.approvedAt), 'dd.MM.yyyy HH:mm') : '',
      entry.audit?.createdAt ? format(parseISO(entry.audit.createdAt), 'dd.MM.yyyy HH:mm') : '',
      entry.audit?.createdBy || '',
      entry.audit?.updatedAt ? format(parseISO(entry.audit.updatedAt), 'dd.MM.yyyy HH:mm') : '',
      entry.audit?.updatedBy || '',
      entry.changeLog?.length.toString() || '0'
    ].map(escapeCSV)
  })

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

export function exportTimeEntries(
  formatId: string,
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
  tasks: Task[],
  filename?: string
): void {
  let csvContent = ''
  const exportFormat = EXPORT_FORMATS.find(f => f.id === formatId)

  switch (formatId) {
    case 'datev':
      csvContent = generateDATEVCSV(timeEntries, employees, projects, tasks)
      break
    case 'sevdesk':
      csvContent = generateSevDeskCSV(timeEntries, employees, projects, tasks)
      break
    case 'lexware':
      csvContent = generateLexwareCSV(timeEntries, employees, projects, tasks)
      break
    case 'excel':
      csvContent = generateExtendedExcelCSV(timeEntries, employees, projects, tasks)
      break
    case 'standard_csv':
    default:
      csvContent = generateStandardCSV(timeEntries, employees, projects, tasks)
      break
  }

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.href = url
  const fileExt = exportFormat?.fileExtension || 'csv'
  link.download = filename || `zeiterfassung-export-${formatId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.${fileExt}`
  link.click()
  
  URL.revokeObjectURL(url)
}

export function exportMileageEntries(
  mileageEntries: MileageEntry[],
  employees: Employee[],
  projects: Project[]
): void {
  const headers = [
    'Datum',
    'Mitarbeiter',
    'Projekt',
    'Von',
    'Nach',
    'Distanz (km)',
    'Zweck',
    'Satz (€/km)',
    'Betrag (€)',
    'Status',
    'Gesperrt'
  ]

  const rows = mileageEntries.map(entry => {
    const employee = employees.find(e => e.id === entry.employeeId)
    const project = projects.find(p => p.id === entry.projectId)

    return [
      entry.date,
      employee?.name || '',
      project?.name || '',
      entry.startLocation,
      entry.endLocation,
      entry.distance.toFixed(1),
      entry.purpose,
      entry.rate?.toFixed(2) || '0.30',
      entry.amount?.toFixed(2) || (entry.distance * (entry.rate || 0.30)).toFixed(2),
      entry.approvalStatus,
      entry.locked ? 'Ja' : 'Nein'
    ].map(escapeCSV)
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.href = url
  link.download = `fahrtkosten-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  
  URL.revokeObjectURL(url)
}
