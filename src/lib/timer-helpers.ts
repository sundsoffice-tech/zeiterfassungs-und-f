import { ActiveTimer, TimeEntry, TimeTemplate } from './types'

export function formatTimerDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function getTimerElapsedTime(timer: ActiveTimer): number {
  if (timer.isPaused && timer.pausedAt) {
    return timer.pausedAt - timer.startTime - timer.pausedDuration
  }
  return Date.now() - timer.startTime - timer.pausedDuration
}

export function convertTimerToTimeEntry(
  timer: ActiveTimer,
  endTime: number = Date.now()
): Omit<TimeEntry, 'id' | 'createdAt'> {
  const startDate = new Date(timer.startTime)
  const actualEndTime = endTime - timer.pausedDuration
  const endDate = new Date(actualEndTime)

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return {
    employeeId: timer.employeeId,
    projectId: timer.projectId,
    date: startDate.toISOString().split('T')[0],
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    notes: timer.notes || ''
  }
}

export function getRecentProjects(
  timeEntries: TimeEntry[],
  limit: number = 5
): Array<{ employeeId: string; projectId: string; lastUsed: string }> {
  const projectMap = new Map<string, { employeeId: string; projectId: string; lastUsed: string }>()

  const sorted = [...timeEntries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  for (const entry of sorted) {
    const key = `${entry.employeeId}-${entry.projectId}`
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        lastUsed: entry.createdAt
      })
    }
    if (projectMap.size >= limit) break
  }

  return Array.from(projectMap.values())
}

export function detectIdleTime(lastActivityTime: number, idleThresholdMinutes: number = 15): boolean {
  const idleThresholdMs = idleThresholdMinutes * 60 * 1000
  return Date.now() - lastActivityTime > idleThresholdMs
}

export function millisecondsToDuration(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / 60000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  }
}
