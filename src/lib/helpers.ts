import { TimeEntry, MileageEntry, Employee, Project } from './types'

export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  let duration = endMinutes - startMinutes
  if (duration < 0) {
    duration += 24 * 60
  }
  
  return duration / 60
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  
  if (m === 0) {
    return `${h}h`
  }
  return `${h}h ${m}m`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

export function getTotalHoursByProject(timeEntries: TimeEntry[], projectId: string): number {
  return timeEntries
    .filter(entry => entry.projectId === projectId)
    .reduce((total, entry) => total + calculateDuration(entry.startTime, entry.endTime), 0)
}

export function getTotalHoursByEmployee(timeEntries: TimeEntry[], employeeId: string): number {
  return timeEntries
    .filter(entry => entry.employeeId === employeeId)
    .reduce((total, entry) => total + calculateDuration(entry.startTime, entry.endTime), 0)
}

export function getTotalMileageByEmployee(mileageEntries: MileageEntry[], employeeId: string): number {
  return mileageEntries
    .filter(entry => entry.employeeId === employeeId)
    .reduce((total, entry) => total + entry.distance, 0)
}

export function getEmployeeName(employees: Employee[], employeeId: string): string {
  const employee = employees.find(e => e.id === employeeId)
  return employee?.name || 'Unknown Employee'
}

export function getProjectName(projects: Project[], projectId: string): string {
  const project = projects.find(p => p.id === projectId)
  return project?.name || 'Unknown Project'
}
