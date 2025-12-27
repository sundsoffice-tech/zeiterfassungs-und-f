import { useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { ActiveTimer, Project, Task, Phase, IntegrationProvider } from '@/lib/types'
import { autoSyncTimerToCalendar } from '@/lib/calendar-sync'

interface CalendarAutoSyncSettings {
  enabled: boolean
  provider: IntegrationProvider
  syncInterval: number
  syncOnStart: boolean
  syncOnStop: boolean
  syncOnModeChange: boolean
  syncOnPause: boolean
}

export function useCalendarAutoSync(
  activeTimer: ActiveTimer | null,
  projects: Project[],
  tasks: Task[],
  phases: Phase[]
) {
  const [settings, setSettings] = useKV<CalendarAutoSyncSettings>(
    'calendar-auto-sync-settings',
    {
      enabled: false,
      provider: IntegrationProvider.GOOGLE_CALENDAR,
      syncInterval: 300000,
      syncOnStart: true,
      syncOnStop: true,
      syncOnModeChange: true,
      syncOnPause: false
    }
  )

  const lastSyncRef = useRef<number>(0)
  const lastTimerIdRef = useRef<string | null>(null)
  const lastEventCountRef = useRef<number>(0)

  useEffect(() => {
    if (!settings?.enabled || !activeTimer) {
      return
    }

    const currentSettings = settings

    const performSync = async () => {
      const project = projects.find(p => p.id === activeTimer.projectId)
      const task = tasks.find(t => t.id === activeTimer.taskId)
      const phase = phases.find(p => p.id === activeTimer.phaseId)

      try {
        const result = await autoSyncTimerToCalendar(
          activeTimer,
          currentSettings.provider,
          project,
          task,
          phase
        )

        if (result.success) {
          console.log('[Calendar Auto-Sync] Synced timer to calendar:', result.eventId)
        } else {
          console.warn('[Calendar Auto-Sync] Sync skipped:', result.error)
        }
      } catch (error) {
        console.error('[Calendar Auto-Sync] Sync failed:', error)
      }
    }

    const timerChanged = activeTimer.id !== lastTimerIdRef.current
    const eventsChanged = activeTimer.events.length !== lastEventCountRef.current
    const timeSinceLastSync = Date.now() - lastSyncRef.current

    if (timerChanged && currentSettings.syncOnStart) {
      performSync()
      lastSyncRef.current = Date.now()
      lastTimerIdRef.current = activeTimer.id
      lastEventCountRef.current = activeTimer.events.length
      return
    }

    if (eventsChanged) {
      const lastEvent = activeTimer.events[activeTimer.events.length - 1]
      
      if (lastEvent) {
        const shouldSync = 
          (lastEvent.type === 'stop' && currentSettings.syncOnStop) ||
          (lastEvent.type === 'pause' && currentSettings.syncOnPause) ||
          (lastEvent.type === 'mode_switch' && currentSettings.syncOnModeChange)

        if (shouldSync) {
          performSync()
          lastSyncRef.current = Date.now()
          lastEventCountRef.current = activeTimer.events.length
          return
        }
      }
    }

    if (timeSinceLastSync >= currentSettings.syncInterval) {
      performSync()
      lastSyncRef.current = Date.now()
    }

    const intervalId = setInterval(() => {
      const now = Date.now()
      if (now - lastSyncRef.current >= currentSettings.syncInterval) {
        performSync()
        lastSyncRef.current = now
      }
    }, 60000)

    return () => clearInterval(intervalId)
  }, [activeTimer, settings, projects, tasks, phases])

  return {
    settings,
    setSettings
  }
}
