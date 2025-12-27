import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  CalendarEvent,
  CalendarSyncMapping,
  CalendarSyncSettings,
  CalendarTitlePattern,
  CalendarSyncLog,
  getDefaultCalendarSyncSettings,
  matchCalendarEventToProject,
  createTimeEntryFromCalendarEvent,
  shouldIgnoreCalendarEvent,
  simulateCalendarSync
} from '@/lib/calendar-sync'
import { TimeEntry, Project, Task, IntegrationProvider, Employee } from '@/lib/types'

export function useCalendarSync(
  employeeId: string,
  tenantId: string,
  projects: Project[],
  tasks: Task[]
) {
  const [settings, setSettings] = useKV<CalendarSyncSettings>(
    'calendar-sync-settings',
    getDefaultCalendarSyncSettings()
  )
  const [mappings, setMappings] = useKV<CalendarSyncMapping[]>('calendar-sync-mappings', [])
  const [syncLogs, setSyncLogs] = useKV<CalendarSyncLog[]>('calendar-sync-logs', [])
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const addTitlePattern = (pattern: Omit<CalendarTitlePattern, 'id'>) => {
    setSettings((current) => {
      const defaults = getDefaultCalendarSyncSettings()
      const base = current || defaults
      return {
        ...base,
        titlePatterns: [
          ...base.titlePatterns,
          {
            ...pattern,
            id: `pattern-${Date.now()}`
          }
        ]
      }
    })
  }

  const updateTitlePattern = (id: string, updates: Partial<CalendarTitlePattern>) => {
    setSettings((current) => {
      const defaults = getDefaultCalendarSyncSettings()
      const base = current || defaults
      return {
        ...base,
        titlePatterns: base.titlePatterns.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        )
      }
    })
  }

  const deleteTitlePattern = (id: string) => {
    setSettings((current) => {
      const defaults = getDefaultCalendarSyncSettings()
      const base = current || defaults
      return {
        ...base,
        titlePatterns: base.titlePatterns.filter((p) => p.id !== id)
      }
    })
  }

  const syncCalendar = async (provider: IntegrationProvider) => {
    setIsSyncing(true)
    const startTime = Date.now()

    try {
      const { events, suggestions } = await simulateCalendarSync(
        provider,
        settings || getDefaultCalendarSyncSettings(),
        projects,
        tasks,
        employeeId,
        tenantId
      )

      setPendingEvents(events)

      const log: CalendarSyncLog = {
        id: `log-${Date.now()}`,
        tenantId,
        timestamp: new Date().toISOString(),
        provider,
        action: 'import',
        eventsProcessed: events.length,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsIgnored: suggestions.filter((s) => s.mapping.confidence === 0).length,
        errors: [],
        duration: Date.now() - startTime
      }

      setSyncLogs((current) => [log, ...(current || [])].slice(0, 50))

      return suggestions
    } catch (error) {
      const log: CalendarSyncLog = {
        id: `log-${Date.now()}`,
        tenantId,
        timestamp: new Date().toISOString(),
        provider,
        action: 'import',
        eventsProcessed: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsIgnored: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime
      }

      setSyncLogs((current) => [log, ...(current || [])].slice(0, 50))
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const createMappingFromSuggestion = (
    event: CalendarEvent,
    projectId: string,
    taskId?: string,
    phaseId?: string
  ) => {
    const newMapping: CalendarSyncMapping = {
      id: `mapping-${Date.now()}`,
      tenantId,
      calendarEventId: event.id,
      projectId,
      taskId,
      phaseId,
      status: 'mapped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setMappings((current) => [...(current || []), newMapping])
    setPendingEvents((current) => (current || []).filter((e) => e.id !== event.id))

    return newMapping
  }

  const ignoreEvent = (eventId: string) => {
    const event = pendingEvents.find((e) => e.id === eventId)
    if (!event) return

    const newMapping: CalendarSyncMapping = {
      id: `mapping-${Date.now()}`,
      tenantId,
      calendarEventId: event.id,
      status: 'ignored',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setMappings((current) => [...(current || []), newMapping])
    setPendingEvents((current) => (current || []).filter((e) => e.id !== eventId))
  }

  return {
    settings,
    setSettings,
    mappings,
    syncLogs,
    pendingEvents,
    isSyncing,
    addTitlePattern,
    updateTitlePattern,
    deleteTitlePattern,
    syncCalendar,
    createMappingFromSuggestion,
    ignoreEvent
  }
}
