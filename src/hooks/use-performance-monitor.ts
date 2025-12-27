import { useEffect, useRef } from 'react'
import { telemetry } from '@/lib/telemetry'

export function usePerformanceMonitor(componentName: string, enabled = true) {
  const mountTimeRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    mountTimeRef.current = performance.now()
    renderCountRef.current = 0

    return () => {
      const unmountTime = performance.now()
      const lifetimeDuration = unmountTime - mountTimeRef.current

      telemetry.trackPerformance(`${componentName}_lifetime`, lifetimeDuration, {
        renderCount: renderCountRef.current
      })
    }
  }, [componentName, enabled])

  useEffect(() => {
    if (enabled) {
      renderCountRef.current += 1
    }
  })

  return {
    trackAction: (actionName: string, action: () => void) => {
      if (!enabled) {
        action()
        return
      }

      const startTime = performance.now()
      action()
      const endTime = performance.now()
      const duration = endTime - startTime

      telemetry.trackPerformance(`${componentName}_${actionName}`, duration)
    },

    trackAsyncAction: async <T,>(actionName: string, action: () => Promise<T>): Promise<T> => {
      if (!enabled) {
        return await action()
      }

      const startTime = performance.now()
      try {
        const result = await action()
        const endTime = performance.now()
        const duration = endTime - startTime

        telemetry.trackPerformance(`${componentName}_${actionName}`, duration, {
          success: true
        })

        return result
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        telemetry.trackPerformance(`${componentName}_${actionName}`, duration, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        throw error
      }
    }
  }
}

export function measureRenderTime(componentName: string): number {
  const startTime = performance.now()
  
  return startTime
}

export function recordRenderTime(componentName: string, startTime: number): void {
  const endTime = performance.now()
  const duration = endTime - startTime

  telemetry.trackPerformance(`${componentName}_render`, duration)
}

export function useRenderTime(componentName: string, enabled = true) {
  const renderStartRef = useRef<number>(0)

  useEffect(() => {
    renderStartRef.current = performance.now()
  })

  useEffect(() => {
    if (!enabled) return

    const renderEnd = performance.now()
    const renderDuration = renderEnd - renderStartRef.current

    if (renderDuration > 0) {
      telemetry.trackPerformance(`${componentName}_render`, renderDuration)
    }
  })
}
