import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { performanceBudgets, PerformanceViolation, PerformanceSeverity } from '@/lib/performance-budgets'
import { Warning, XCircle, Info } from '@phosphor-icons/react'

interface PerformanceAlertProps {
  enabled?: boolean
  minSeverity?: PerformanceSeverity
  debounceMs?: number
}

export function PerformanceAlertProvider({
  enabled = true,
  minSeverity = PerformanceSeverity.WARNING,
  debounceMs = 5000
}: PerformanceAlertProps) {
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = performanceBudgets.onViolation((violation) => {
      const severityLevel = {
        [PerformanceSeverity.INFO]: 0,
        [PerformanceSeverity.WARNING]: 1,
        [PerformanceSeverity.CRITICAL]: 2
      }

      if (severityLevel[violation.severity] < severityLevel[minSeverity]) {
        return
      }

      const key = `${violation.component}-${violation.metric}`
      const now = Date.now()
      const lastAlert = lastAlertTime[key] || 0

      if (now - lastAlert < debounceMs) {
        return
      }

      setLastAlertTime(prev => ({ ...prev, [key]: now }))

      showPerformanceAlert(violation)
    })

    return unsubscribe
  }, [enabled, minSeverity, debounceMs, lastAlertTime])

  return null
}

function showPerformanceAlert(violation: PerformanceViolation) {
  const ratio = (violation.actualValue / violation.budgetValue).toFixed(2)
  const percentage = ((violation.actualValue / violation.budgetValue - 1) * 100).toFixed(0)

  const metricLabel = {
    renderTime: 'Render Time',
    reRenders: 'Re-renders',
    lifetime: 'Lifetime'
  }[violation.metric] || violation.metric

  const getIcon = () => {
    switch (violation.severity) {
      case PerformanceSeverity.CRITICAL:
        return <XCircle className="h-5 w-5" weight="fill" />
      case PerformanceSeverity.WARNING:
        return <Warning className="h-5 w-5" weight="fill" />
      case PerformanceSeverity.INFO:
        return <Info className="h-5 w-5" weight="fill" />
    }
  }

  const toastConfig = {
    [PerformanceSeverity.CRITICAL]: {
      icon: getIcon(),
      duration: 10000,
      className: 'border-destructive'
    },
    [PerformanceSeverity.WARNING]: {
      icon: getIcon(),
      duration: 5000,
      className: 'border-yellow-600'
    },
    [PerformanceSeverity.INFO]: {
      icon: getIcon(),
      duration: 3000,
      className: 'border-blue-600'
    }
  }

  const config = toastConfig[violation.severity]

  toast(`Performance Budget Violation: ${violation.component}`, {
    description: `${metricLabel} exceeded budget by ${percentage}% (${ratio}x). Actual: ${violation.actualValue.toFixed(2)}${violation.metric === 'reRenders' ? '' : 'ms'}, Budget: ${violation.budgetValue}${violation.metric === 'reRenders' ? '' : 'ms'}`,
    icon: config.icon,
    duration: config.duration,
    className: config.className
  })
}
