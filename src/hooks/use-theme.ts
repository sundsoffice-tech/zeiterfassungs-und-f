import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  useEffect(() => {


      const systemTheme = window.matchMedia('(pr
    
    } else {

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    return () => mediaQuery.removeEventListener('change', handleChange)

    theme,
    resolvedTheme: theme === 'system'
      : theme
}














