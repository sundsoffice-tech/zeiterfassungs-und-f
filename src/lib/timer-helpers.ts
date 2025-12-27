import { ActiveTimer, TimeEntry, TimeTemplate, ApprovalStatus } from './types'

export function formatTimerDuration(totalSeconds: number): string {
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
  const actualEndTime = endTime - timer.pausedDuration
  const startDate = new Date(timer.startTime)
  const endDate = new Date(actualEndTime)

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return {
    tenantId: 'default',
    employeeId: timer.employeeId,
    projectId: timer.projectId,
    phaseId: timer.phaseId,
    taskId: timer.taskId,
    date: startDate.toISOString().split('T')[0],
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    duration: (actualEndTime - timer.startTime) / (1000 * 60 * 60),
    tags: timer.tags || [],
    location: timer.location,
    notes: timer.notes,
    costCenter: timer.costCenter,
    billable: timer.billable ?? true,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    audit: {
      createdBy: timer.employeeId,
      createdAt: new Date().toISOString()
    },
    changeLog: [],
    evidenceAnchors: []
  }
}

export function getRecentProjects(
  timeEntries: TimeEntry[],
  limit: number = 5
): Array<{ employeeId: string; projectId: string; lastUsed: string }> {
  const projectMap = new Map<string, { employeeId: string; projectId: string; lastUsed: string }>()

  const sorted = [...timeEntries].sort(
    (a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime()
  )

  for (const entry of sorted) {
    const key = `${entry.employeeId}-${entry.projectId}`
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        lastUsed: entry.audit.createdAt
      })
    }
    if (projectMap.size >= limit) break
  }

  return Array.from(projectMap.values())
}
