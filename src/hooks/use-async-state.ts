import { useState, useCallback } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }))
  }, [])

  const setData = useCallback((data: T) => {
    setState({ data, loading: false, error: null })
  }, [])

  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, loading: false, error }))
  }, [])

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading()
    try {
      const result = await asyncFn()
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    }
  }, [setLoading, setData, setError])

  return {
    ...state,
    setLoading,
    setData,
    setError,
    reset,
    execute
  }
}
