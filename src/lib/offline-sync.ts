import { v4 as uuidv4 } from 'uuid'

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error'
}

export enum ConflictResolution {
  LOCAL_WINS = 'local_wins',
  SERVER_WINS = 'server_wins',
  NEWEST_WINS = 'newest_wins',
  MANUAL = 'manual'
}

export enum AttachmentType {
  PHOTO = 'photo',
  RECEIPT = 'receipt',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

export interface OfflineMetadata {
  offlineId: string
  syncStatus: SyncStatus
  lastSyncAttempt?: string
  syncError?: string
  conflictData?: ConflictData
  deviceId: string
  offlineCreatedAt: string
  offlineUpdatedAt: string
}

export interface ConflictData {
  localVersion: any
  serverVersion: any
  conflictedFields: string[]
  detectedAt: string
}

export interface GPSLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
  address?: string
}

export interface Attachment {
  id: string
  type: AttachmentType
  name: string
  mimeType: string
  size: number
  url?: string
  base64Data?: string
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error'
  uploadedAt?: string
  thumbnail?: string
}

export interface SyncQueueItem {
  id: string
  entityType: 'timeEntry' | 'mileageEntry' | 'employee' | 'project' | 'task'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
  retryCount: number
  priority: number
  conflictResolution?: ConflictResolution
}

export interface SyncConfig {
  autoSyncEnabled: boolean
  syncInterval: number
  conflictResolution: ConflictResolution
  syncOnNetworkRestore: boolean
  maxRetries: number
  batchSize: number
}

export interface BackgroundTimerState {
  isRunning: boolean
  startTime: string
  pauseTime?: string
  elapsedSeconds: number
  projectId: string
  taskId?: string
  employeeId: string
  lastHeartbeat: string
  batteryOptimized: boolean
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSyncEnabled: true,
  syncInterval: 30000,
  conflictResolution: ConflictResolution.NEWEST_WINS,
  syncOnNetworkRestore: true,
  maxRetries: 3,
  batchSize: 10
}

export class OfflineSyncManager {
  private syncQueue: SyncQueueItem[] = []
  private syncConfig: SyncConfig
  private isOnline: boolean = navigator.onLine
  private isSyncing: boolean = false
  private syncInterval?: number
  private deviceId: string

  constructor(config?: Partial<SyncConfig>) {
    this.syncConfig = { ...DEFAULT_SYNC_CONFIG, ...config }
    this.deviceId = this.getOrCreateDeviceId()
    this.initializeEventListeners()
    this.loadSyncQueue()
    
    if (this.syncConfig.autoSyncEnabled) {
      this.startAutoSync()
    }
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = uuidv4()
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  private initializeEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      if (this.syncConfig.syncOnNetworkRestore) {
        this.syncNow()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private loadSyncQueue(): void {
    const stored = localStorage.getItem('sync_queue')
    if (stored) {
      try {
        this.syncQueue = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to load sync queue', e)
        this.syncQueue = []
      }
    }
  }

  private saveSyncQueue(): void {
    localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue))
  }

  addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    }

    this.syncQueue.push(queueItem)
    this.saveSyncQueue()

    if (this.isOnline && this.syncConfig.autoSyncEnabled) {
      this.syncNow()
    }
  }

  async syncNow(): Promise<{ success: boolean; synced: number; errors: number; conflicts: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { success: false, synced: 0, errors: 0, conflicts: 0 }
    }

    this.isSyncing = true
    let synced = 0
    let errors = 0
    let conflicts = 0

    const batch = this.syncQueue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.syncConfig.batchSize)

    for (const item of batch) {
      try {
        const result = await this.syncItem(item)
        
        if (result.success) {
          synced++
          this.removeFromQueue(item.id)
        } else if (result.conflict) {
          conflicts++
          item.retryCount++
        } else {
          errors++
          item.retryCount++
          
          if (item.retryCount >= this.syncConfig.maxRetries) {
            this.removeFromQueue(item.id)
          }
        }
      } catch (error) {
        console.error('Sync error for item', item.id, error)
        errors++
        item.retryCount++
        
        if (item.retryCount >= this.syncConfig.maxRetries) {
          this.removeFromQueue(item.id)
        }
      }
    }

    this.saveSyncQueue()
    this.isSyncing = false

    return { success: true, synced, errors, conflicts }
  }

  private async syncItem(item: SyncQueueItem): Promise<{ success: boolean; conflict?: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { success: true }
  }

  private removeFromQueue(itemId: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId)
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval)
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncNow()
      }
    }, this.syncConfig.syncInterval)
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval)
      this.syncInterval = undefined
    }
  }

  getQueueStatus(): { total: number; pending: number; conflicts: number } {
    return {
      total: this.syncQueue.length,
      pending: this.syncQueue.filter(i => i.retryCount < this.syncConfig.maxRetries).length,
      conflicts: this.syncQueue.filter(i => i.conflictResolution === ConflictResolution.MANUAL).length
    }
  }

  getDeviceId(): string {
    return this.deviceId
  }

  isDeviceOnline(): boolean {
    return this.isOnline
  }
}

export async function resolveConflict(
  localData: any,
  serverData: any,
  resolution: ConflictResolution
): Promise<any> {
  switch (resolution) {
    case ConflictResolution.LOCAL_WINS:
      return localData
    
    case ConflictResolution.SERVER_WINS:
      return serverData
    
    case ConflictResolution.NEWEST_WINS:
      const localTime = new Date(localData.offlineUpdatedAt || localData.updatedAt).getTime()
      const serverTime = new Date(serverData.updatedAt).getTime()
      return localTime > serverTime ? localData : serverData
    
    case ConflictResolution.MANUAL:
      return null
    
    default:
      return serverData
  }
}

export function detectConflicts(localData: any, serverData: any): string[] {
  const conflictedFields: string[] = []
  const fieldsToCheck = ['startTime', 'endTime', 'duration', 'projectId', 'taskId', 'description', 'billable']

  for (const field of fieldsToCheck) {
    if (localData[field] !== serverData[field]) {
      conflictedFields.push(field)
    }
  }

  return conflictedFields
}

export function createOfflineMetadata(deviceId: string): OfflineMetadata {
  return {
    offlineId: uuidv4(),
    syncStatus: SyncStatus.PENDING,
    deviceId,
    offlineCreatedAt: new Date().toISOString(),
    offlineUpdatedAt: new Date().toISOString()
  }
}

export async function requestGPSPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state === 'granted' || result.state === 'prompt'
  } catch (e) {
    return false
  }
}

export async function getCurrentLocation(): Promise<GPSLocation | null> {
  if (!navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        })
      },
      (error) => {
        console.error('GPS error', error)
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
      }
    )
  })
}

export async function reverseGeocode(location: GPSLocation): Promise<string | null> {
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
}

export async function processAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const base64Data = reader.result as string
      
      const attachment: Attachment = {
        id: uuidv4(),
        type: determineAttachmentType(file.type),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        base64Data,
        uploadStatus: 'pending'
      }

      if (file.type.startsWith('image/')) {
        createThumbnail(base64Data).then(thumbnail => {
          attachment.thumbnail = thumbnail
          resolve(attachment)
        }).catch(() => {
          resolve(attachment)
        })
      } else {
        resolve(attachment)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

function determineAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) {
    return AttachmentType.PHOTO
  } else if (mimeType === 'application/pdf' || mimeType.includes('receipt')) {
    return AttachmentType.RECEIPT
  } else if (mimeType.startsWith('audio/')) {
    return AttachmentType.AUDIO
  } else {
    return AttachmentType.DOCUMENT
  }
}

async function createThumbnail(base64Data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      const maxSize = 200
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = base64Data
  })
}

export class BackgroundTimerManager {
  private timerId?: number
  private heartbeatId?: number
  private wakeLockSentinel?: any

  async startTimer(state: BackgroundTimerState): Promise<void> {
    this.stopTimer()
    
    localStorage.setItem('background_timer', JSON.stringify(state))
    
    this.timerId = window.setInterval(() => {
      this.updateTimerState()
    }, 1000)

    this.heartbeatId = window.setInterval(() => {
      this.sendHeartbeat()
    }, 30000)

    if (state.batteryOptimized) {
      await this.requestWakeLock()
    }
  }

  stopTimer(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId)
      this.timerId = undefined
    }

    if (this.heartbeatId) {
      window.clearInterval(this.heartbeatId)
      this.heartbeatId = undefined
    }

    this.releaseWakeLock()
    localStorage.removeItem('background_timer')
  }

  pauseTimer(): void {
    const state = this.getTimerState()
    if (state && state.isRunning) {
      state.isRunning = false
      state.pauseTime = new Date().toISOString()
      localStorage.setItem('background_timer', JSON.stringify(state))
    }
  }

  resumeTimer(): void {
    const state = this.getTimerState()
    if (state && !state.isRunning && state.pauseTime) {
      const pauseDuration = Date.now() - new Date(state.pauseTime).getTime()
      state.isRunning = true
      state.startTime = new Date(new Date(state.startTime).getTime() + pauseDuration).toISOString()
      state.pauseTime = undefined
      localStorage.setItem('background_timer', JSON.stringify(state))
    }
  }

  getTimerState(): BackgroundTimerState | null {
    const stored = localStorage.getItem('background_timer')
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch (e) {
      return null
    }
  }

  private updateTimerState(): void {
    const state = this.getTimerState()
    if (!state || !state.isRunning) return

    const elapsed = Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000)
    state.elapsedSeconds = elapsed
    state.lastHeartbeat = new Date().toISOString()
    
    localStorage.setItem('background_timer', JSON.stringify(state))
  }

  private sendHeartbeat(): void {
    const state = this.getTimerState()
    if (!state) return

    console.log('Timer heartbeat:', {
      elapsed: state.elapsedSeconds,
      project: state.projectId,
      employee: state.employeeId
    })
  }

  private async requestWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen')
        console.log('Wake lock acquired')
      } catch (err) {
        console.error('Wake lock failed', err)
      }
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release()
      this.wakeLockSentinel = null
      console.log('Wake lock released')
    }
  }

  isRunning(): boolean {
    const state = this.getTimerState()
    return state?.isRunning ?? false
  }
}

export const globalSyncManager = new OfflineSyncManager()
export const globalTimerManager = new BackgroundTimerManager()
