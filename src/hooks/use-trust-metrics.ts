import { useMemo } from 'react'
import { TimeEntry, Employee } from '@/lib/types'
import { TimeEntryWithTrust, calculatePlausibilityScore, TrustMetrics } from '@/lib/trust-layer'

export function useTrustMetrics(
  timeEntries: TimeEntry[],
  employees: Employee[]
): {
  entriesWithTrust: TimeEntryWithTrust[]
  overallScore: number
  trustDistribution: {
    high: number
    medium: number
    low: number
    unverified: number
  }
  recalculateTrust: (entry: TimeEntry) => TrustMetrics
} {
  const entriesWithTrust = useMemo<TimeEntryWithTrust[]>(() => {
    return timeEntries.map(entry => {
      const trustMetrics = calculatePlausibilityScore(
        entry,
        timeEntries,
        employees,
        entry.evidenceAnchors || []
      )
      return {
        ...entry,
        trustMetrics
      }
    })
  }, [timeEntries, employees])

  const overallScore = useMemo(() => {
    if (entriesWithTrust.length === 0) return 0
    const sum = entriesWithTrust.reduce(
      (acc, e) => acc + (e.trustMetrics?.plausibilityScore || 0),
      0
    )
    return Math.round(sum / entriesWithTrust.length)
  }, [entriesWithTrust])

  const trustDistribution = useMemo(() => {
    const dist = {
      high: 0,
      medium: 0,
      low: 0,
      unverified: 0
    }

    entriesWithTrust.forEach(entry => {
      if (!entry.trustMetrics) {
        dist.unverified++
        return
      }
      switch (entry.trustMetrics.trustLevel) {
        case 'high':
          dist.high++
          break
        case 'medium':
          dist.medium++
          break
        case 'low':
          dist.low++
          break
        case 'unverified':
          dist.unverified++
          break
      }
    })

    return dist
  }, [entriesWithTrust])

  const recalculateTrust = (entry: TimeEntry): TrustMetrics => {
    return calculatePlausibilityScore(
      entry,
      timeEntries,
      employees,
      entry.evidenceAnchors || []
    )
  }

  return {
    entriesWithTrust,
    overallScore,
    trustDistribution,
    recalculateTrust
  }
}
