import { useEffect, useRef, useCallback } from 'react'
import { telemetry } from '@/lib/telemetry'
import { handleError, ErrorCode, createError } from '@/lib/error-handler'

export interface UseFormTelemetryOptions {
  formName: string
  trackValidationErrors?: boolean
  trackCancel?: boolean
  trackSave?: boolean
}

export function useFormTelemetry(options: UseFormTelemetryOptions) {
  const { formName, trackValidationErrors = true, trackCancel = true, trackSave = true } = options
  const startTimeRef = useRef<number>(0)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (!hasStartedRef.current) {
      startTimeRef.current = Date.now()
      telemetry.trackFormStart(formName)
      hasStartedRef.current = true
    }

    return () => {
      if (trackCancel && hasStartedRef.current) {
        const timeSpent = Date.now() - startTimeRef.current
        if (timeSpent > 1000) {
          telemetry.trackFormCancel(formName, timeSpent)
        }
      }
    }
  }, [formName, trackCancel])

  const trackValidationError = useCallback(
    (errors: Record<string, unknown>) => {
      if (trackValidationErrors) {
        telemetry.trackFormValidationError(formName, errors)
      }
    },
    [formName, trackValidationErrors]
  )

  const trackSaveSuccess = useCallback(
    (metadata?: Record<string, unknown>) => {
      if (trackSave) {
        const duration = Date.now() - startTimeRef.current
        telemetry.trackFormSaveSuccess(formName, duration, metadata)
      }
    },
    [formName, trackSave]
  )

  const trackSaveError = useCallback(
    async (error: unknown, context?: Record<string, unknown>) => {
      await handleError(error, {
        showToast: true,
        trackTelemetry: true,
        context: {
          formName,
          ...context
        }
      })
    },
    [formName]
  )

  return {
    trackValidationError,
    trackSaveSuccess,
    trackSaveError
  }
}
