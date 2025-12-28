import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useKV<Theme>('theme-preference', 'system')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    const currentTheme = theme || 'system'
    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(currentTheme)
    }
  }, [theme])

  useEffect(() => {
    const currentTheme = theme || 'system'
    if (currentTheme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const currentTheme = theme || 'system'
  const resolvedTheme = currentTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : currentTheme

  return {
    theme: currentTheme,
    setTheme,
    resolvedTheme
  }
}
