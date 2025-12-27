import { useEffect, useState, useCallback } from 'react'

export function useIdleDetection(thresholdMinutes: number = 15) {
  const [lastActivityTime, setLastActivityTime] = useState(Date.now())
  const [isIdle, setIsIdle] = useState(false)

  const updateActivity = useCallback(() => {
    setLastActivityTime(Date.now())
    setIsIdle(false)
  }, [])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime
      const idleThreshold = thresholdMinutes * 60 * 1000
      
      if (idleTime >= idleThreshold) {
        setIsIdle(true)
      }
    }, 10000)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(interval)
    }
  }, [lastActivityTime, thresholdMinutes, updateActivity])

  return { isIdle, lastActivityTime, updateActivity }
}
