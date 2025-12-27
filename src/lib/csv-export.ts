import { TimeEntry, MileageEntry, Employee, Project } from './types'
import { calculateDuration, getEmployeeName, getProjectName } from './helpers'

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return ''
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function exportTimeEntriesToCSV(
  timeEntries: TimeEntry[],
  employees: Employee[],
  projects: Project[]
) {
  if (timeEntries.length === 0) {
    return
  }

  const headers = [
    'Date',
    'Employee',
    'Employee Email',
    'Project',
    'Client',
    'Start Time',
    'End Time',
    'Duration (hours)',
    'Notes'
  ]

  const rows = timeEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const employee = employees.find(e => e.id === entry.employeeId)
      const project = projects.find(p => p.id === entry.projectId)
      const duration = calculateDuration(entry.startTime, entry.endTime)
      
      return [
        escapeCSV(new Date(entry.date).toLocaleDateString('de-DE')),
        escapeCSV(employee?.name || 'Unknown'),
        escapeCSV(employee?.email || ''),
        escapeCSV(project?.name || 'Unknown'),
        escapeCSV(project?.clientId || ''),
        escapeCSV(entry.startTime),
        escapeCSV(entry.endTime),
        escapeCSV(duration.toFixed(2)),
        escapeCSV(entry.notes || '')
      ]
    })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(csvContent, `time-entries-${dateStr}.csv`)
}

export function exportMileageEntriesToCSV(
  mileageEntries: MileageEntry[],
  employees: Employee[]
) {
  if (mileageEntries.length === 0) {
    return
  }

  const headers = [
    'Date',
    'Employee',
    'Employee Email',
    'Start Location',
    'End Location',
    'Distance (km)',
    'Purpose'
  ]

  const rows = mileageEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const employee = employees.find(e => e.id === entry.employeeId)
      
      return [
        escapeCSV(new Date(entry.date).toLocaleDateString('de-DE')),
        escapeCSV(employee?.name || 'Unknown'),
        escapeCSV(employee?.email || ''),
        escapeCSV(entry.startLocation),
        escapeCSV(entry.endLocation),
        escapeCSV(entry.distance),
        escapeCSV(entry.purpose)
      ]
    })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(csvContent, `mileage-entries-${dateStr}.csv`)
}

export function exportEmployeeTimeReportToCSV(
  employees: Employee[],
  timeEntries: TimeEntry[],
  projects: Project[]
) {
  if (employees.length === 0 || timeEntries.length === 0) {
    return
  }

  const headers = [
    'Employee',
    'Employee Email',
    'Total Hours',
    'Number of Entries'
  ]

  const rows = employees.map(employee => {
    const employeeEntries = timeEntries.filter(e => e.employeeId === employee.id)
    const totalHours = employeeEntries.reduce(
      (sum, entry) => sum + calculateDuration(entry.startTime, entry.endTime),
      0
    )
    
    return [
      escapeCSV(employee.name),
      escapeCSV(employee.email || ''),
      escapeCSV(totalHours.toFixed(2)),
      escapeCSV(employeeEntries.length)
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(csvContent, `employee-time-report-${dateStr}.csv`)
}

export function exportProjectTimeReportToCSV(
  projects: Project[],
  timeEntries: TimeEntry[],
  employees: Employee[]
) {
  if (projects.length === 0 || timeEntries.length === 0) {
    return
  }

  const headers = [
    'Project',
    'Client',
    'Total Hours',
    'Number of Entries',
    'Number of Employees'
  ]

  const rows = projects.map(project => {
    const projectEntries = timeEntries.filter(e => e.projectId === project.id)
    const totalHours = projectEntries.reduce(
      (sum, entry) => sum + calculateDuration(entry.startTime, entry.endTime),
      0
    )
    const uniqueEmployees = new Set(projectEntries.map(e => e.employeeId))
    
    return [
      escapeCSV(project.name),
      escapeCSV(project.clientId || ''),
      escapeCSV(totalHours.toFixed(2)),
      escapeCSV(projectEntries.length),
      escapeCSV(uniqueEmployees.size)
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const dateStr = new Date().toISOString().split('T')[0]
  downloadCSV(csvContent, `project-time-report-${dateStr}.csv`)
}

export function exportPayrollReportToCSV(
  employees: Employee[],
  timeEntries: TimeEntry[],
  mileageEntries: MileageEntry[],
  startDate?: string,
  endDate?: string
) {
  if (employees.length === 0) {
    return
  }

  let filteredTimeEntries = timeEntries
  let filteredMileageEntries = mileageEntries

  if (startDate && endDate) {
    filteredTimeEntries = timeEntries.filter(
      e => e.date >= startDate && e.date <= endDate
    )
    filteredMileageEntries = mileageEntries.filter(
      e => e.date >= startDate && e.date <= endDate
    )
  }

  const headers = [
    'Employee',
    'Employee Email',
    'Total Hours',
    'Total Mileage (km)',
    'Number of Time Entries',
    'Number of Mileage Entries',
    'Period Start',
    'Period End'
  ]

  const rows = employees.map(employee => {
    const employeeTimeEntries = filteredTimeEntries.filter(e => e.employeeId === employee.id)
    const employeeMileageEntries = filteredMileageEntries.filter(e => e.employeeId === employee.id)
    
    const totalHours = employeeTimeEntries.reduce(
      (sum, entry) => sum + calculateDuration(entry.startTime, entry.endTime),
      0
    )
    
    const totalMileage = employeeMileageEntries.reduce(
      (sum, entry) => sum + entry.distance,
      0
    )
    
    return [
      escapeCSV(employee.name),
      escapeCSV(employee.email || ''),
      escapeCSV(totalHours.toFixed(2)),
      escapeCSV(totalMileage.toFixed(2)),
      escapeCSV(employeeTimeEntries.length),
      escapeCSV(employeeMileageEntries.length),
      escapeCSV(startDate || 'All time'),
      escapeCSV(endDate || 'All time')
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const period = startDate && endDate ? `${startDate}_to_${endDate}` : 'all-time'
  downloadCSV(csvContent, `payroll-report-${period}.csv`)
}
