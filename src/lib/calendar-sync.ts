import { TimeEntry, ActiveTimer, Project, Task, Phase, IntegrationConfig, IntegrationProvider, TimerEvent, TimerEventType, ActivityMode, ApprovalStatus } from './types'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string[]
  provider: IntegrationProvider
  calendarId?: string
  syncStatus: 'synced' | 'pending' | 'error'
  lastSyncedAt?: string
  errorMessage?: string
}

export interface CalendarSyncMapping {
  id: string
  tenantId: string
  calendarEventId: string
  timeEntryId?: string
  timerEventId?: string
  projectId?: string
  taskId?: string
  phaseId?: string
  mode?: ActivityMode
  status: 'mapped' | 'ignored' | 'suggested'
  confidence?: number
  mappingReason?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarSyncSettings {
  autoCreateTimeEntries: boolean
  autoStartTimer: boolean
  autoStopTimer: boolean
  syncPastDays: number
  syncFutureDays: number
  defaultBillable: boolean
  defaultMode?: ActivityMode
  titlePatterns: CalendarTitlePattern[]
  ignoredCalendars: string[]
  workingHoursOnly: boolean
  workingHoursStart: string
  workingHoursEnd: string
  minimumDurationMinutes: number
}

export interface CalendarTitlePattern {
  id: string
  pattern: string
  isRegex: boolean
  projectId?: string
  taskId?: string
  phaseId?: string
  mode?: ActivityMode
  tags?: string[]
  action: 'map' | 'ignore' | 'suggest'
  priority: number
}

export interface CalendarSyncLog {
  id: string
  tenantId: string
  timestamp: string
  provider: IntegrationProvider
  action: 'import' | 'export' | 'sync'
  eventsProcessed: number
  eventsCreated: number
  eventsUpdated: number
  eventsIgnored: number
  errors: string[]
  duration: number
}

export function getDefaultCalendarSyncSettings(): CalendarSyncSettings {
  return {
    autoCreateTimeEntries: false,
    autoStartTimer: false,
    autoStopTimer: false,
    syncPastDays: 7,
    syncFutureDays: 1,
    defaultBillable: true,
    titlePatterns: [],
    ignoredCalendars: [],
    workingHoursOnly: false,
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00',
    minimumDurationMinutes: 5
  }
}

export function matchCalendarEventToProject(
  event: CalendarEvent,
  projects: Project[],
  tasks: Task[],
  patterns: CalendarTitlePattern[]
): { projectId?: string; taskId?: string; phaseId?: string; mode?: ActivityMode; confidence: number; reason: string } {
  let bestMatch = {
    projectId: undefined as string | undefined,
    taskId: undefined as string | undefined,
    phaseId: undefined as string | undefined,
    mode: undefined as ActivityMode | undefined,
    confidence: 0,
    reason: 'No match found'
  }

  const sortedPatterns = [...patterns].sort((a, b) => b.priority - a.priority)

  for (const pattern of sortedPatterns) {
    let matches = false
    
    if (pattern.isRegex) {
      try {
        const regex = new RegExp(pattern.pattern, 'i')
        matches = regex.test(event.title) || (event.description ? regex.test(event.description) : false)
      } catch (e) {
        continue
      }
    } else {
      const searchText = `${event.title} ${event.description || ''}`.toLowerCase()
      matches = searchText.includes(pattern.pattern.toLowerCase())
    }

    if (matches) {
      if (pattern.action === 'ignore') {
        return {
          projectId: undefined,
          taskId: undefined,
          phaseId: undefined,
          mode: undefined,
          confidence: 100,
          reason: `Ignored by pattern: "${pattern.pattern}"`
        }
      }

      bestMatch = {
        projectId: pattern.projectId,
        taskId: pattern.taskId,
        phaseId: pattern.phaseId,
        mode: pattern.mode,
        confidence: pattern.action === 'map' ? 95 : 70,
        reason: `Matched pattern: "${pattern.pattern}"`
      }
      
      if (pattern.action === 'map') {
        return bestMatch
      }
    }
  }

  for (const project of projects) {
    const projectNameLower = project.name.toLowerCase()
    const eventTitleLower = event.title.toLowerCase()
    
    if (eventTitleLower.includes(projectNameLower)) {
      const projectTasks = tasks.filter(t => t.projectId === project.id)
      
      for (const task of projectTasks) {
        if (eventTitleLower.includes(task.name.toLowerCase())) {
          return {
            projectId: project.id,
            taskId: task.id,
            phaseId: task.phaseId,
            mode: undefined,
            confidence: 85,
            reason: `Project "${project.name}" and Task "${task.name}" found in title`
          }
        }
      }
      
      if (bestMatch.confidence < 75) {
        bestMatch = {
          projectId: project.id,
          taskId: undefined,
          phaseId: undefined,
          mode: undefined,
          confidence: 75,
          reason: `Project "${project.name}" found in title`
        }
      }
    }
  }

  const modeKeywords: Record<ActivityMode, string[]> = {
    [ActivityMode.FAHRT]: ['fahrt', 'drive', 'travel', 'anfahrt'],
    [ActivityMode.MONTAGE]: ['montage', 'installation', 'install', 'aufbau'],
    [ActivityMode.DEMONTAGE]: ['demontage', 'abbau', 'removal', 'uninstall'],
    [ActivityMode.PLANUNG]: ['planung', 'planning', 'plan', 'konzept'],
    [ActivityMode.BERATUNG]: ['beratung', 'consulting', 'beratungsgespräch', 'consultation'],
    [ActivityMode.WARTUNG]: ['wartung', 'maintenance', 'service', 'instandhaltung'],
    [ActivityMode.DOKUMENTATION]: ['dokumentation', 'documentation', 'dokument', 'bericht'],
    [ActivityMode.MEETING]: ['meeting', 'besprechung', 'call', 'termin'],
    [ActivityMode.SONSTIGES]: []
  }

  const eventText = `${event.title} ${event.description || ''}`.toLowerCase()
  
  for (const [mode, keywords] of Object.entries(modeKeywords)) {
    for (const keyword of keywords) {
      if (eventText.includes(keyword)) {
        if (bestMatch.projectId) {
          bestMatch.mode = mode as ActivityMode
          bestMatch.confidence = Math.min(bestMatch.confidence + 10, 95)
          bestMatch.reason += ` + Mode "${mode}" detected`
        } else {
          bestMatch.mode = mode as ActivityMode
          bestMatch.confidence = Math.max(bestMatch.confidence, 50)
          bestMatch.reason = `Mode "${mode}" detected from keywords`
        }
        break
      }
    }
  }

  return bestMatch
}

export function createTimeEntryFromCalendarEvent(
  event: CalendarEvent,
  employeeId: string,
  tenantId: string,
  projectId: string,
  taskId?: string,
  phaseId?: string,
  mode?: ActivityMode,
  billable: boolean = true
): Omit<TimeEntry, 'id'> {
  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  return {
    tenantId,
    employeeId,
    projectId,
    phaseId,
    taskId,
    date: startDate.toISOString().split('T')[0],
    startTime: event.startTime,
    endTime: event.endTime,
    duration,
    tags: mode ? [mode] : [],
    location: event.location,
    notes: `${event.title}${event.description ? `\n\n${event.description}` : ''}`,
    costCenter: undefined,
    billable,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    calendarEventId: event.id,
    calendarProvider: event.provider,
    audit: {
      createdBy: 'calendar-sync',
      createdAt: new Date().toISOString()
    },
    changeLog: []
  }
}

export function shouldIgnoreCalendarEvent(
  event: CalendarEvent,
  settings: CalendarSyncSettings
): { ignore: boolean; reason?: string } {
  if (settings.ignoredCalendars.includes(event.calendarId || '')) {
    return { ignore: true, reason: 'Calendar is in ignored list' }
  }

  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)

  if (durationMinutes < settings.minimumDurationMinutes) {
    return { ignore: true, reason: `Duration ${durationMinutes}min below minimum ${settings.minimumDurationMinutes}min` }
  }

  if (settings.workingHoursOnly) {
    const startHour = startDate.getHours()
    const startMinute = startDate.getMinutes()
    const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
    
    if (startTimeStr < settings.workingHoursStart || startTimeStr > settings.workingHoursEnd) {
      return { ignore: true, reason: 'Outside working hours' }
    }
  }

  const privateKeywords = ['private', 'privat', 'personal', 'persönlich']
  const eventText = `${event.title} ${event.description || ''}`.toLowerCase()
  
  if (privateKeywords.some(keyword => eventText.includes(keyword))) {
    return { ignore: true, reason: 'Marked as private' }
  }

  return { ignore: false }
}

export function createTimerEventsFromCalendarEvent(
  event: CalendarEvent,
  mode?: ActivityMode
): TimerEvent[] {
  const events: TimerEvent[] = []
  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)

  events.push({
    id: `${event.id}-start`,
    type: TimerEventType.START,
    timestamp: startDate.getTime(),
    timestampFormatted: event.startTime,
    mode,
    notes: `Calendar: ${event.title}`
  })

  events.push({
    id: `${event.id}-stop`,
    type: TimerEventType.STOP,
    timestamp: endDate.getTime(),
    timestampFormatted: event.endTime,
    mode
  })

  return events
}

export function exportTimeEntryToCalendarEvent(
  entry: TimeEntry,
  project?: Project,
  task?: Task
): Omit<CalendarEvent, 'id' | 'provider' | 'syncStatus'> {
  const projectName = project?.name || 'Unknown Project'
  const taskName = task?.name || ''
  const mode = entry.tags?.[0] as ActivityMode | undefined
  const modeLabel = mode ? ` [${mode.toUpperCase()}]` : ''
  
  const hours = Math.floor(entry.duration)
  const minutes = Math.round((entry.duration % 1) * 60)
  
  return {
    title: `${projectName}${taskName ? ` - ${taskName}` : ''}${modeLabel}`,
    description: entry.notes || '',
    startTime: entry.startTime,
    endTime: entry.endTime,
    location: entry.location,
    attendees: []
  }
}

export function exportActiveTimerToCalendarEvent(
  timer: ActiveTimer,
  project?: Project,
  task?: Task,
  phase?: Phase
): Omit<CalendarEvent, 'id' | 'provider' | 'syncStatus'> {
  const projectName = project?.name || 'Unknown Project'
  const taskName = task?.name || ''
  const phaseName = phase?.name || ''
  const modeLabel = timer.mode ? ` [${timer.mode.toUpperCase()}]` : ''
  
  const title = `${projectName}${taskName ? ` - ${taskName}` : ''}${phaseName ? ` (${phaseName})` : ''}${modeLabel}`
  const description = generateTimerEventDescription(timer, project, task, phase)
  
  const startTime = new Date(timer.startTime).toISOString()
  const endTime = timer.isPaused 
    ? new Date(timer.pausedAt!).toISOString()
    : new Date().toISOString()
  
  return {
    title,
    description,
    startTime,
    endTime,
    location: timer.location,
    attendees: []
  }
}

export function generateTimerEventDescription(
  timer: ActiveTimer,
  project?: Project,
  task?: Task,
  phase?: Phase
): string {
  const lines: string[] = []
  
  lines.push('⏱️ TIMER-DETAILS')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  
  if (project) {
    lines.push(`📁 Projekt: ${project.name}`)
  }
  if (phase) {
    lines.push(`📂 Phase: ${phase.name}`)
  }
  if (task) {
    lines.push(`✓ Aufgabe: ${task.name}`)
  }
  if (timer.mode) {
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
    const modeNames: Record<ActivityMode, string> = {
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
    lines.push(`${modeIcons[timer.mode]} Modus: ${modeNames[timer.mode]}`)
  }
  if (timer.location) {
    lines.push(`📍 Standort: ${timer.location}`)
  }
  if (timer.billable) {
    lines.push(`💰 Abrechenbar: Ja`)
  }
  if (timer.costCenter) {
    lines.push(`🏢 Kostenstelle: ${timer.costCenter}`)
  }
  if (timer.tags && timer.tags.length > 0) {
    lines.push(`🏷️ Tags: ${timer.tags.join(', ')}`)
  }
  
  lines.push('')
  lines.push('⏰ ZEITVERLAUF')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  
  if (timer.events && timer.events.length > 0) {
    timer.events.forEach(event => {
      const eventTime = new Date(event.timestamp).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      switch (event.type) {
        case TimerEventType.START:
          lines.push(`▶️  ${eventTime} - Gestartet${event.mode ? ` (${event.mode})` : ''}`)
          break
        case TimerEventType.PAUSE:
          lines.push(`⏸️  ${eventTime} - Pausiert`)
          break
        case TimerEventType.RESUME:
          lines.push(`▶️  ${eventTime} - Fortgesetzt`)
          break
        case TimerEventType.STOP:
          lines.push(`⏹️  ${eventTime} - Beendet`)
          break
        case TimerEventType.MODE_SWITCH:
          lines.push(`🔄 ${eventTime} - Modus gewechselt zu ${event.mode}`)
          break
      }
      
      if (event.notes) {
        lines.push(`   💬 ${event.notes}`)
      }
      if (event.location) {
        lines.push(`   📍 ${event.location}`)
      }
    })
  } else {
    const startTime = new Date(timer.startTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    lines.push(`▶️  ${startTime} - Gestartet`)
  }
  
  if (timer.isPaused && timer.pausedAt) {
    lines.push('')
    const pausedDurationMin = Math.floor(timer.pausedDuration / 60000)
    lines.push(`⏸️ Aktuell pausiert (${pausedDurationMin} Min)`)
  }
  
  const totalDuration = timer.isPaused && timer.pausedAt
    ? timer.pausedAt - timer.startTime - timer.pausedDuration
    : Date.now() - timer.startTime - timer.pausedDuration
  
  const hours = Math.floor(totalDuration / (1000 * 60 * 60))
  const minutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))
  
  lines.push('')
  lines.push(`⏱️ Gesamtdauer: ${hours}h ${minutes}min`)
  
  if (timer.notes) {
    lines.push('')
    lines.push('📝 NOTIZEN')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    lines.push(timer.notes)
  }
  
  lines.push('')
  lines.push('─────────────────────────')
  lines.push('🤖 Automatisch synchronisiert mit Zeiterfassung')
  
  return lines.join('\n')
}

export function syncTimerToCalendar(
  timer: ActiveTimer,
  project?: Project,
  task?: Task,
  phase?: Phase
): {
  shouldSync: boolean
  event?: Omit<CalendarEvent, 'id' | 'provider' | 'syncStatus'>
  reason?: string
} {
  const minDurationMs = 5 * 60 * 1000
  const currentDuration = Date.now() - timer.startTime - timer.pausedDuration
  
  if (currentDuration < minDurationMs) {
    return {
      shouldSync: false,
      reason: 'Timer duration below minimum threshold'
    }
  }
  
  if (!project) {
    return {
      shouldSync: false,
      reason: 'No project assigned'
    }
  }
  
  return {
    shouldSync: true,
    event: exportActiveTimerToCalendarEvent(timer, project, task, phase)
  }
}

export async function autoSyncTimerToCalendar(
  timer: ActiveTimer,
  provider: IntegrationProvider,
  project?: Project,
  task?: Task,
  phase?: Phase
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const syncResult = syncTimerToCalendar(timer, project, task, phase)
  
  if (!syncResult.shouldSync) {
    return {
      success: false,
      error: syncResult.reason
    }
  }
  
  try {
    const calendarEvent = syncResult.event!
    
    console.log('[Calendar Sync] Creating event:', {
      title: calendarEvent.title,
      start: calendarEvent.startTime,
      end: calendarEvent.endTime,
      provider
    })
    
    const eventId = `cal-${Date.now()}-${timer.id}`
    
    return {
      success: true,
      eventId
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function simulateCalendarSync(
  provider: IntegrationProvider,
  settings: CalendarSyncSettings,
  projects: Project[],
  tasks: Task[],
  employeeId: string,
  tenantId: string
): Promise<{
  events: CalendarEvent[]
  suggestions: Array<{
    event: CalendarEvent
    mapping: ReturnType<typeof matchCalendarEventToProject>
    timeEntry?: Omit<TimeEntry, 'id'>
  }>
}> {
  const mockEvents: CalendarEvent[] = [
    {
      id: 'cal-evt-001',
      title: 'Kurita Showroom Meeting',
      description: 'Besprechung neuer Produktlinie',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      location: 'Kurita Office',
      provider,
      syncStatus: 'pending'
    },
    {
      id: 'cal-evt-002',
      title: 'Fahrt zur Baustelle Nord',
      description: 'Anfahrt für Montage',
      startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      provider,
      syncStatus: 'pending'
    },
    {
      id: 'cal-evt-003',
      title: 'Team Standup',
      description: 'Daily standup meeting',
      startTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 6.75 * 60 * 60 * 1000).toISOString(),
      provider,
      syncStatus: 'pending'
    }
  ]

  const suggestions = mockEvents.map(event => {
    const shouldIgnore = shouldIgnoreCalendarEvent(event, settings)
    
    if (shouldIgnore.ignore) {
      return {
        event,
        mapping: {
          projectId: undefined,
          taskId: undefined,
          phaseId: undefined,
          mode: undefined,
          confidence: 0,
          reason: shouldIgnore.reason || 'Ignored'
        },
        timeEntry: undefined
      }
    }

    const mapping = matchCalendarEventToProject(event, projects, tasks, settings.titlePatterns)
    
    const timeEntry = mapping.projectId
      ? createTimeEntryFromCalendarEvent(
          event,
          employeeId,
          tenantId,
          mapping.projectId,
          mapping.taskId,
          mapping.phaseId,
          mapping.mode,
          settings.defaultBillable
        )
      : undefined

    return { event, mapping, timeEntry }
  })

  return { events: mockEvents, suggestions }
}
