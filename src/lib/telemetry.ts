import { z } from 'zod'

export enum TelemetryEventType {
  FORM_START = 'form_start',
  FORM_VALIDATION_ERROR = 'form_validation_error',
  FORM_SAVE_SUCCESS = 'form_save_success',
  FORM_CANCEL = 'form_cancel',
  TIMER_START = 'timer_start',
  TIMER_STOP = 'timer_stop',
  TIMER_PAUSE = 'timer_pause',
  TIMER_RESUME = 'timer_resume',
  EXPORT_START = 'export_start',
  EXPORT_SUCCESS = 'export_success',
  EXPORT_ERROR = 'export_error',
  DATA_LOAD = 'data_load',
  DATA_SAVE = 'data_save',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}

export const TelemetryEventSchema = z.object({
  eventType: z.nativeEnum(TelemetryEventType),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  duration: z.number().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    stack: z.string().optional()
  }).optional()
})

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>

class TelemetryService {
  private sessionId: string
  private events: TelemetryEvent[] = []
  private maxEvents = 1000
  private enabled = true

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  setUserId(userId: string): void {
    this.events.push(this.createEvent(TelemetryEventType.DATA_LOAD, {
      action: 'user_identified',
      userId
    }))
  }

  trackFormStart(formName: string, metadata?: Record<string, unknown>): void {
    this.track(TelemetryEventType.FORM_START, {
      formName,
      ...metadata
    })
  }

  trackFormValidationError(formName: string, errors: Record<string, unknown>): void {
    this.track(TelemetryEventType.FORM_VALIDATION_ERROR, {
      formName,
      errors,
      errorCount: Object.keys(errors).length
    })
  }

  trackFormSaveSuccess(formName: string, duration: number, metadata?: Record<string, unknown>): void {
    this.track(TelemetryEventType.FORM_SAVE_SUCCESS, {
      formName,
      duration,
      ...metadata
    })
  }

  trackFormCancel(formName: string, timeSpent: number): void {
    this.track(TelemetryEventType.FORM_CANCEL, {
      formName,
      timeSpent
    })
  }

  trackTimerAction(action: 'start' | 'stop' | 'pause' | 'resume', metadata?: Record<string, unknown>): void {
    const eventType = action === 'start' ? TelemetryEventType.TIMER_START :
      action === 'stop' ? TelemetryEventType.TIMER_STOP :
      action === 'pause' ? TelemetryEventType.TIMER_PAUSE :
      TelemetryEventType.TIMER_RESUME

    this.track(eventType, metadata)
  }

  trackExport(status: 'start' | 'success' | 'error', format: string, recordCount: number, error?: Error): void {
    const eventType = status === 'start' ? TelemetryEventType.EXPORT_START :
      status === 'success' ? TelemetryEventType.EXPORT_SUCCESS :
      TelemetryEventType.EXPORT_ERROR

    this.track(eventType, {
      format,
      recordCount,
      ...(error && {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      })
    })
  }

  trackPerformance(label: string, duration: number, metadata?: Record<string, unknown>): void {
    this.track(TelemetryEventType.PERFORMANCE, {
      label,
      duration,
      ...metadata
    })
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track(TelemetryEventType.ERROR, {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      ...context
    })
  }

  private track(eventType: TelemetryEventType, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return

    const event = this.createEvent(eventType, metadata)
    this.events.push(event)

    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.log('[Telemetry]', eventType, metadata)
    }
  }

  private createEvent(eventType: TelemetryEventType, metadata?: Record<string, unknown>): TelemetryEvent {
    return {
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: metadata || {}
    }
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  getEventsByType(eventType: TelemetryEventType): TelemetryEvent[] {
    return this.events.filter(e => e.eventType === eventType)
  }

  getSessionSummary(): Record<string, unknown> {
    const summary: Record<string, number> = {}
    
    for (const event of this.events) {
      summary[event.eventType] = (summary[event.eventType] || 0) + 1
    }

    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      eventCounts: summary,
      sessionDuration: this.events.length > 0 
        ? Date.now() - this.events[0].timestamp 
        : 0
    }
  }

  clearEvents(): void {
    this.events = []
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

export const telemetry = new TelemetryService()
