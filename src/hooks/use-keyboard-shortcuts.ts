import { useEffect, useCallback } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isInputFocused = activeElement instanceof HTMLInputElement || 
                          activeElement instanceof HTMLTextAreaElement ||
                          activeElement?.getAttribute('contenteditable') === 'true'

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue

      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.ctrl || shortcut.meta || !isInputFocused) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useGlobalShortcuts(
  onNewEntry?: () => void,
  onSave?: () => void,
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      description: 'Neuer Eintrag',
      action: () => onNewEntry?.(),
      enabled: enabled && !!onNewEntry
    },
    {
      key: 's',
      ctrl: true,
      description: 'Speichern',
      action: () => onSave?.(),
      enabled: enabled && !!onSave
    }
  ]

  useKeyboardShortcuts(shortcuts)
}
