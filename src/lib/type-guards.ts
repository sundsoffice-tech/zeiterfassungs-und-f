import {
  TimeEntry,
  Employee,
  Project,
  Task,
  Phase,
  ActiveTimer,
  MileageEntry,
  Absence,
  RecurringEntry,
  AutomationRule,
  Reminder,
  AppSettings
} from './types'

export function isTimeEntry(value: unknown): value is TimeEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  
  return (
    typeof entry.id === 'string' &&
    typeof entry.tenantId === 'string' &&
    typeof entry.employeeId === 'string' &&
    typeof entry.projectId === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.startTime === 'string' &&
    typeof entry.endTime === 'string' &&
    typeof entry.duration === 'number' &&
    typeof entry.billable === 'boolean' &&
    typeof entry.locked === 'boolean'
  )
}

export function isEmployee(value: unknown): value is Employee {
  if (typeof value !== 'object' || value === null) return false
  const emp = value as Record<string, unknown>
  
  return (
    typeof emp.id === 'string' &&
    typeof emp.tenantId === 'string' &&
    typeof emp.name === 'string' &&
    typeof emp.role === 'string' &&
    typeof emp.active === 'boolean'
  )
}

export function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false
  const proj = value as Record<string, unknown>
  
  return (
    typeof proj.id === 'string' &&
    typeof proj.tenantId === 'string' &&
    typeof proj.name === 'string' &&
    typeof proj.active === 'boolean'
  )
}

export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>
  
  return (
    typeof task.id === 'string' &&
    typeof task.projectId === 'string' &&
    typeof task.name === 'string' &&
    typeof task.active === 'boolean'
  )
}

export function isPhase(value: unknown): value is Phase {
  if (typeof value !== 'object' || value === null) return false
  const phase = value as Record<string, unknown>
  
  return (
    typeof phase.id === 'string' &&
    typeof phase.projectId === 'string' &&
    typeof phase.name === 'string' &&
    typeof phase.order === 'number' &&
    typeof phase.active === 'boolean'
  )
}

export function isActiveTimer(value: unknown): value is ActiveTimer {
  if (typeof value !== 'object' || value === null) return false
  const timer = value as Record<string, unknown>
  
  return (
    typeof timer.id === 'string' &&
    typeof timer.employeeId === 'string' &&
    typeof timer.projectId === 'string' &&
    typeof timer.startTime === 'number' &&
    typeof timer.pausedDuration === 'number' &&
    typeof timer.billable === 'boolean' &&
    typeof timer.isPaused === 'boolean' &&
    Array.isArray(timer.events)
  )
}

export function isMileageEntry(value: unknown): value is MileageEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  
  return (
    typeof entry.id === 'string' &&
    typeof entry.tenantId === 'string' &&
    typeof entry.employeeId === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.startLocation === 'string' &&
    typeof entry.endLocation === 'string' &&
    typeof entry.distance === 'number' &&
    typeof entry.purpose === 'string' &&
    typeof entry.locked === 'boolean'
  )
}

export function isAbsence(value: unknown): value is Absence {
  if (typeof value !== 'object' || value === null) return false
  const absence = value as Record<string, unknown>
  
  return (
    typeof absence.id === 'string' &&
    typeof absence.tenantId === 'string' &&
    typeof absence.employeeId === 'string' &&
    typeof absence.type === 'string' &&
    typeof absence.startDate === 'string' &&
    typeof absence.endDate === 'string' &&
    typeof absence.days === 'number'
  )
}

export function isArrayOf<T>(
  arr: unknown,
  typeGuard: (value: unknown) => value is T
): arr is T[] {
  if (!Array.isArray(arr)) return false
  return arr.every(typeGuard)
}

export function assertTimeEntry(value: unknown): asserts value is TimeEntry {
  if (!isTimeEntry(value)) {
    throw new Error('Invalid TimeEntry object')
  }
}

export function assertEmployee(value: unknown): asserts value is Employee {
  if (!isEmployee(value)) {
    throw new Error('Invalid Employee object')
  }
}

export function assertProject(value: unknown): asserts value is Project {
  if (!isProject(value)) {
    throw new Error('Invalid Project object')
  }
}

export function assertActiveTimer(value: unknown): asserts value is ActiveTimer {
  if (!isActiveTimer(value)) {
    throw new Error('Invalid ActiveTimer object')
  }
}

export function safeParseJSON<T>(
  json: string,
  typeGuard: (value: unknown) => value is T
): T | null {
  try {
    const parsed: unknown = JSON.parse(json)
    return typeGuard(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function safeParseJSONArray<T>(
  json: string,
  typeGuard: (value: unknown) => value is T
): T[] | null {
  try {
    const parsed: unknown = JSON.parse(json)
    return isArrayOf(parsed, typeGuard) ? parsed : null
  } catch {
    return null
  }
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

export function isValidTimeString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return /^\d{2}:\d{2}$/.test(value)
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}
