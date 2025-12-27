import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'

export interface WebVital {
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export interface LighthouseScore {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  timestamp: number
}

export interface WebVitalsHistory {
  vitals: WebVital[]
  lighthouseScores: LighthouseScore[]
}

const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
}

function getRating(name: WebVital['name'], value: number): WebVital['rating'] {
  const threshold = WEB_VITALS_THRESHOLDS[name]
  if (!threshold) return 'needs-improvement'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function useWebVitals() {
  const [history, setHistory] = useKV<WebVitalsHistory>('web-vitals-history', {
    vitals: [],
    lighthouseScores: []
  })
  const [currentVitals, setCurrentVitals] = useState<WebVital[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    const observeVital = (name: WebVital['name'], entryTypes: string[]) => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            let value = 0
            
            if (name === 'CLS') {
              value = (entry as any).value || 0
            } else if (name === 'FID') {
              value = (entry as any).processingStart - entry.startTime
            } else if (name === 'INP') {
              value = (entry as any).duration || 0
            } else if (name === 'LCP') {
              value = entry.startTime
            } else if (name === 'FCP') {
              value = entry.startTime
            } else if (name === 'TTFB') {
              value = (entry as any).responseStart - (entry as any).requestStart
            }

            const vital: WebVital = {
              name,
              value,
              rating: getRating(name, value),
              timestamp: Date.now()
            }

            setCurrentVitals((prev) => {
              const filtered = prev.filter(v => v.name !== name)
              return [...filtered, vital]
            })

            setHistory((prev) => ({
              vitals: [...(prev?.vitals || []), vital].slice(-100),
              lighthouseScores: prev?.lighthouseScores || []
            }))
          }
        })

        observer.observe({ entryTypes })
        
        return () => observer.disconnect()
      } catch (error) {
        console.warn(`Failed to observe ${name}:`, error)
      }
    }

    const cleanupFns: Array<(() => void) | undefined> = []

    cleanupFns.push(observeVital('FCP', ['paint']))
    cleanupFns.push(observeVital('LCP', ['largest-contentful-paint']))
    cleanupFns.push(observeVital('CLS', ['layout-shift']))
    cleanupFns.push(observeVital('FID', ['first-input']))
    cleanupFns.push(observeVital('INP', ['event']))
    
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming
        const ttfb = navEntry.responseStart - navEntry.requestStart
        
        const vital: WebVital = {
          name: 'TTFB',
          value: ttfb,
          rating: getRating('TTFB', ttfb),
          timestamp: Date.now()
        }
        
        setCurrentVitals((prev) => {
          const filtered = prev.filter(v => v.name !== 'TTFB')
          return [...filtered, vital]
        })
      }
    })
    
    try {
      navigationObserver.observe({ entryTypes: ['navigation'] })
      cleanupFns.push(() => navigationObserver.disconnect())
    } catch (error) {
      console.warn('Failed to observe TTFB:', error)
    }

    return () => {
      cleanupFns.forEach(cleanup => cleanup?.())
    }
  }, [setHistory])

  const recordLighthouseScore = (score: Omit<LighthouseScore, 'timestamp'>) => {
    const fullScore: LighthouseScore = {
      ...score,
      timestamp: Date.now()
    }
    
    setHistory((prev) => ({
      vitals: prev?.vitals || [],
      lighthouseScores: [...(prev?.lighthouseScores || []), fullScore].slice(-50)
    }))
  }

  const clearHistory = () => {
    setHistory({
      vitals: [],
      lighthouseScores: []
    })
    setCurrentVitals([])
  }

  return {
    currentVitals,
    history: history || { vitals: [], lighthouseScores: [] },
    recordLighthouseScore,
    clearHistory
  }
}
