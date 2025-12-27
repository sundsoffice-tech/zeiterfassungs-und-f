import { useState, useEffect } from 'react'

export function useLoadingState(initialLoading: boolean = true, delay: number = 300) {
  const [isLoading, setIsLoading] = useState(initialLoading)

  useEffect(() => {
    if (initialLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [initialLoading, delay])

  return { isLoading, setIsLoading }
}

export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, isLoading, error, refetch: fetchData }
}
