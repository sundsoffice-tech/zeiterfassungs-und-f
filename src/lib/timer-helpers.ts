import { ActiveTimer, TimeEntry, TimeTemplate } from './types'

  const hours = Math.floor(totalSeconds / 3600)
  const seconds = totalSeconds % 60
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
e

export function getTimerElapsedTime(timer: ActiveTimer): number {
  if (timer.isPaused && timer.pausedAt) {
    return timer.pausedAt - timer.startTime - timer.pausedDuration

  return Date.now() - timer.startTime - timer.pausedDuration
 

export function convertTimerToTimeEntry(
  timer: ActiveTimer,
  endTime: number = Date.now()
): Omit<TimeEntry, 'id' | 'createdAt'> {
}
  const actualEndTime = endTime - timer.pausedDuration
  limit: number = 5

  const sorted = [...timeEntries].sort
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

        em
    employeeId: timer.employeeId,
    projectId: timer.projectId,
    date: startDate.toISOString().split('T')[0],
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
  const idleThresholdMs = id
  }
}

export function getRecentProjects(
  timeEntries: TimeEntry[],

): Array<{ employeeId: string; projectId: string; lastUsed: string }> {
  const projectMap = new Map<string, { employeeId: string; projectId: string; lastUsed: string }>()


    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()


  for (const entry of sorted) {
    const key = `${entry.employeeId}-${entry.projectId}`

      projectMap.set(key, {

        projectId: entry.projectId,
        lastUsed: entry.createdAt
      })
    }
    if (projectMap.size >= limit) break


  return Array.from(projectMap.values())
}













