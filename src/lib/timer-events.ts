import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { TimerEvent, TimerEventType, ActivityMode, ActiveTimer } from './types'

export function createTimerEvent(
  type: TimerEventType,
  timer: Partial<ActiveTimer> = {}
): TimerEvent {
  const timestamp = Date.now()
  return {
    id: `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp,
    timestampFormatted: format(timestamp, 'HH:mm:ss', { locale: de }),
    mode: timer.mode,
    projectId: timer.projectId,
    phaseId: timer.phaseId,
    taskId: timer.taskId,
    location: timer.location,
    notes: timer.notes
  }
}

export function formatTimerEventForDisplay(event: TimerEvent): string {
  const time = event.timestampFormatted
  
  switch (event.type) {
    case TimerEventType.START:
      return `${time} - Gestartet${event.mode ? ` (${formatMode(event.mode)})` : ''}`
    case TimerEventType.PAUSE:
      return `${time} - Pausiert`
    case TimerEventType.RESUME:
      return `${time} - Fortgesetzt`
    case TimerEventType.STOP:
      return `${time} - Beendet`
    case TimerEventType.MODE_SWITCH:
      return `${time} - Modus gewechselt zu ${formatMode(event.mode!)}`
    default:
      return `${time} - Unbekannt`
  }
}

export function formatMode(mode: ActivityMode): string {
  const modeLabels: Record<ActivityMode, string> = {
    [ActivityMode.FAHRT]: 'Fahrt',
    [ActivityMode.MONTAGE]: 'Montage',
    [ActivityMode.DEMONTAGE]: 'Demontage',
    [ActivityMode.PLANUNG]: 'Planung',
    [ActivityMode.BERATUNG]: 'Beratung',
    [ActivityMode.WARTUNG]: 'Wartung',
    [ActivityMode.DOKUMENTATION]: 'Dokumentation',
    [ActivityMode.MEETING]: 'Meeting',
    [ActivityMode.SONSTIGES]: 'Sonstiges'
  }
  return modeLabels[mode]
}

export function getModeIcon(mode: ActivityMode): string {
  const modeIcons: Record<ActivityMode, string> = {
    [ActivityMode.FAHRT]: '🚗',
    [ActivityMode.MONTAGE]: '🔧',
    [ActivityMode.DEMONTAGE]: '🔨',
    [ActivityMode.PLANUNG]: '📋',
    [ActivityMode.BERATUNG]: '💬',
    [ActivityMode.WARTUNG]: '⚙️',
    [ActivityMode.DOKUMENTATION]: '📝',
    [ActivityMode.MEETING]: '👥',
    [ActivityMode.SONSTIGES]: '📌'
  }
  return modeIcons[mode]
}

export function getModeColor(mode: ActivityMode): string {
  const modeColors: Record<ActivityMode, string> = {
    [ActivityMode.FAHRT]: 'bg-blue-500',
    [ActivityMode.MONTAGE]: 'bg-green-500',
    [ActivityMode.DEMONTAGE]: 'bg-orange-500',
    [ActivityMode.PLANUNG]: 'bg-purple-500',
    [ActivityMode.BERATUNG]: 'bg-pink-500',
    [ActivityMode.WARTUNG]: 'bg-yellow-500',
    [ActivityMode.DOKUMENTATION]: 'bg-indigo-500',
    [ActivityMode.MEETING]: 'bg-cyan-500',
    [ActivityMode.SONSTIGES]: 'bg-gray-500'
  }
  return modeColors[mode]
}

export function calculateModeDurations(events: TimerEvent[]): Map<ActivityMode, number> {
  const durations = new Map<ActivityMode, number>()
  
  let currentMode: ActivityMode | undefined
  let modeStartTime: number | undefined
  let isPaused = false
  let pauseStartTime: number | undefined
  let totalPauseDuration = 0

  events.forEach((event, index) => {
    switch (event.type) {
      case TimerEventType.START:
      case TimerEventType.MODE_SWITCH:
        if (currentMode && modeStartTime && !isPaused) {
          const duration = event.timestamp - modeStartTime - totalPauseDuration
          durations.set(currentMode, (durations.get(currentMode) || 0) + duration)
        }
        currentMode = event.mode
        modeStartTime = event.timestamp
        totalPauseDuration = 0
        break

      case TimerEventType.PAUSE:
        isPaused = true
        pauseStartTime = event.timestamp
        break

      case TimerEventType.RESUME:
        if (isPaused && pauseStartTime) {
          totalPauseDuration += event.timestamp - pauseStartTime
        }
        isPaused = false
        pauseStartTime = undefined
        break

      case TimerEventType.STOP:
        if (currentMode && modeStartTime && !isPaused) {
          const duration = event.timestamp - modeStartTime - totalPauseDuration
          durations.set(currentMode, (durations.get(currentMode) || 0) + duration)
        }
        break
    }
  })

  if (currentMode && modeStartTime && !isPaused) {
    const now = Date.now()
    const duration = now - modeStartTime - totalPauseDuration
    durations.set(currentMode, (durations.get(currentMode) || 0) + duration)
  }

  return durations
}

export function getTimerSummary(timer: ActiveTimer): {
  totalDuration: number
  activeDuration: number
  pauseDuration: number
  modeDurations: Map<ActivityMode, number>
} {
  const now = Date.now()
  const totalDuration = now - timer.startTime
  const pauseDuration = timer.isPaused && timer.pausedAt
    ? timer.pausedDuration + (now - timer.pausedAt)
    : timer.pausedDuration
  const activeDuration = totalDuration - pauseDuration

  const modeDurations = calculateModeDurations(timer.events)

  return {
    totalDuration,
    activeDuration,
    pauseDuration,
    modeDurations
  }
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function createCalendarEventTitle(
  projectName: string,
  mode?: ActivityMode,
  taskName?: string
): string {
  let title = projectName
  if (taskName) title += ` - ${taskName}`
  if (mode) title += ` (${formatMode(mode)})`
  return title
}

export function createCalendarEventDescription(timer: ActiveTimer, events: TimerEvent[]): string {
  const lines: string[] = []
  
  lines.push('Zeiterfassung - Automatischer Eintrag')
  lines.push('')
  
  if (timer.notes) {
    lines.push(`Notizen: ${timer.notes}`)
    lines.push('')
  }

  lines.push('Ereignisse:')
  events.forEach(event => {
    lines.push(`  ${formatTimerEventForDisplay(event)}`)
  })

  const summary = getTimerSummary(timer)
  lines.push('')
  lines.push(`Gesamtdauer: ${formatDuration(summary.activeDuration)}`)
  
  if (summary.modeDurations.size > 0) {
    lines.push('')
    lines.push('Nach Modus:')
    summary.modeDurations.forEach((duration, mode) => {
      lines.push(`  ${formatMode(mode)}: ${formatDuration(duration)}`)
    })
  }

  return lines.join('\n')
}
