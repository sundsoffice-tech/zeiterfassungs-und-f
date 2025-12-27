import { useState, useEffect, useCallback } from 'react'
import {
  OfflineSyncManager,
  BackgroundTimerManager,
  SyncStatus,
  GPSLocation,
  Attachment,
  getCurrentLocation,
  processAttachment,
  createOfflineMetadata,
  globalSyncManager,
  globalTimerManager
} from '@/lib/offline-sync'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [queueStatus, setQueueStatus] = useState({ total: 0, pending: 0, conflicts: 0 })

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(globalSyncManager.isDeviceOnline())
      setQueueStatus(globalSyncManager.getQueueStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    try {
      const result = await globalSyncManager.syncNow()
      setQueueStatus(globalSyncManager.getQueueStatus())
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const addToQueue = useCallback((
    entityType: 'timeEntry' | 'mileageEntry' | 'employee' | 'project' | 'task',
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: number = 5
  ) => {
    globalSyncManager.addToQueue({
      entityType,
      entityId,
      operation,
      data,
      priority
    })
    setQueueStatus(globalSyncManager.getQueueStatus())
  }, [])

  const getDeviceId = useCallback(() => {
    return globalSyncManager.getDeviceId()
  }, [])

  const createOfflineData = useCallback((data: any) => {
    const deviceId = globalSyncManager.getDeviceId()
    return {
      ...data,
      offlineMetadata: createOfflineMetadata(deviceId)
    }
  }, [])

  return {
    isOnline,
    isSyncing,
    queueStatus,
    syncNow,
    addToQueue,
    getDeviceId,
    createOfflineData
  }
}

export function useGPS() {
  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    if (!navigator.geolocation) {
      setError('GPS nicht verfügbar')
      return
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      setHasPermission(result.state === 'granted')
      
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted')
      })
    } catch (e) {
      setError('Berechtigung konnte nicht geprüft werden')
    }
  }

  const requestPermission = async () => {
    setError(null)
    
    try {
      const loc = await getCurrentLocation()
      if (loc) {
        setLocation(loc)
        setHasPermission(true)
        return true
      } else {
        setError('Standort konnte nicht ermittelt werden')
        return false
      }
    } catch (e) {
      setError('Berechtigung verweigert')
      return false
    }
  }

  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    setIsTracking(true)
    setError(null)

    const updateLocation = async () => {
      const loc = await getCurrentLocation()
      if (loc) {
        setLocation(loc)
      }
    }

    updateLocation()
    const interval = setInterval(updateLocation, 60000)

    return () => {
      clearInterval(interval)
      setIsTracking(false)
    }
  }, [hasPermission])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  const getCurrentGPS = useCallback(async () => {
    setError(null)
    const loc = await getCurrentLocation()
    if (loc) {
      setLocation(loc)
    } else {
      setError('Standort konnte nicht ermittelt werden')
    }
    return loc
  }, [])

  return {
    location,
    isTracking,
    hasPermission,
    error,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentGPS
  }
}

export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addAttachment = useCallback(async (file: File) => {
    setIsProcessing(true)
    try {
      const attachment = await processAttachment(file)
      setAttachments(prev => [...prev, attachment])
      return attachment
    } catch (error) {
      console.error('Failed to process attachment', error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const addAttachments = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    const processed: Attachment[] = []
    
    for (const file of files) {
      try {
        const attachment = await processAttachment(file)
        processed.push(attachment)
      } catch (error) {
        console.error('Failed to process attachment', error)
      }
    }
    
    setAttachments(prev => [...prev, ...processed])
    setIsProcessing(false)
    return processed
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  const getAttachment = useCallback((id: string) => {
    return attachments.find(a => a.id === id)
  }, [attachments])

  return {
    attachments,
    isProcessing,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
    getAttachment
  }
}

export function useBackgroundTimer() {
  const [timerState, setTimerState] = useState(globalTimerManager.getTimerState())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const state = globalTimerManager.getTimerState()
      setTimerState(state)
      
      if (state?.isRunning) {
        const elapsed = Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000)
        setElapsedSeconds(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const startTimer = useCallback(async (
    projectId: string,
    taskId: string | undefined,
    employeeId: string,
    batteryOptimized: boolean = true
  ) => {
    await globalTimerManager.startTimer({
      isRunning: true,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      projectId,
      taskId,
      employeeId,
      lastHeartbeat: new Date().toISOString(),
      batteryOptimized
    })
    setTimerState(globalTimerManager.getTimerState())
  }, [])

  const stopTimer = useCallback(() => {
    globalTimerManager.stopTimer()
    setTimerState(null)
    setElapsedSeconds(0)
  }, [])

  const pauseTimer = useCallback(() => {
    globalTimerManager.pauseTimer()
    setTimerState(globalTimerManager.getTimerState())
  }, [])

  const resumeTimer = useCallback(() => {
    globalTimerManager.resumeTimer()
    setTimerState(globalTimerManager.getTimerState())
  }, [])

  return {
    timerState,
    elapsedSeconds,
    isRunning: timerState?.isRunning ?? false,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer
  }
}
