# Dark Mode Implementation

## Übersicht

Die Zeiterfassung-App unterstützt jetzt einen vollständigen Dark Mode mit automatischer Erkennung der Systemeinstellung. Benutzer können zwischen hellem, dunklem und System-Theme wechseln.

## Funktionen

### Theme-Modi

- **Hell (Light)**: Heller Modus mit weißem Hintergrund
- **Dunkel (Dark)**: Dunkler Modus mit dunklem Hintergrund
- **System**: Automatische Anpassung an die Systemeinstellung des Betriebssystems

### Automatische Systemerkennung

Der Dark Mode erkennt automatisch die Systemeinstellung über die `prefers-color-scheme` Media Query. Wenn der Benutzer das "System"-Theme auswählt, passt sich die App dynamisch an Änderungen der Systemeinstellung an.

### Persistierung

Die Theme-Präferenz wird im KV-Store gespeichert und bleibt über Sitzungen hinweg erhalten.

### Flicker-Free Loading

Ein Inline-Script im HTML-Head stellt sicher, dass das Theme ohne Flackern geladen wird, indem es vor dem ersten Render angewendet wird.

## Komponenten

### `useTheme` Hook

Hook für Theme-Verwaltung mit automatischer Systemerkennung:

```typescript
import { useTheme } from '@/hooks/use-theme'

const { theme, setTheme, resolvedTheme } = useTheme()
```

**Return Values:**
- `theme`: Aktuelles Theme ('light' | 'dark' | 'system')
- `setTheme`: Funktion zum Ändern des Themes
- `resolvedTheme`: Aufgelöstes Theme ('light' | 'dark'), berücksichtigt Systemeinstellung

### `ThemeToggle` Komponente

Dropdown-Menü für Theme-Auswahl im Header:

```typescript
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle />
```

Features:
- Animiertes Sonnen-/Mond-Icon
- Dropdown mit allen drei Theme-Optionen
- Visuelles Feedback für aktuelle Auswahl
- Barrierefreie Bedienung

## Verwendung

### Theme wechseln

**Über UI:**
- Header: Klick auf das Sonnen-/Mond-Icon
- Command Palette: `Cmd/Ctrl + K` → "Helles Theme", "Dunkles Theme" oder "System Theme"

**Über Code:**
```typescript
const { setTheme } = useTheme()

// Theme setzen
setTheme('light')
setTheme('dark')
setTheme('system')
```

### Theme abfragen

```typescript
const { theme, resolvedTheme } = useTheme()

// Gewählte Präferenz (kann 'system' sein)
console.log(theme)

// Tatsächlich angewendetes Theme (immer 'light' oder 'dark')
console.log(resolvedTheme)
```

## CSS-Variablen

Alle Farben sind sowohl für Light als auch Dark Mode in `main.css` definiert:

```css
:root {
  --background: oklch(0.99 0.001 250);
  --foreground: oklch(0.20 0.015 250);
  /* ... weitere Light Mode Farben */
}

.dark {
  --background: oklch(0.15 0.02 250);
  --foreground: oklch(0.95 0.01 250);
  /* ... weitere Dark Mode Farben */
}
```

## Barrierefreiheit

- Tastaturnavigation im Theme-Toggle funktioniert vollständig
- Screen Reader erhalten korrekte Labels
- Fokus-Zustände sind sichtbar
- WCAG AA Kontrastwerte werden in beiden Modi eingehalten

## Technische Details

### Flicker Prevention

Das Inline-Script in `index.html` lädt die Theme-Präferenz aus localStorage und wendet sie an, bevor React rendert:

```javascript
(function() {
  try {
    const stored = localStorage.getItem('spark-kv:theme-preference');
    const theme = stored ? JSON.parse(stored) : 'system';
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }
  } catch (e) {}
})();
```

### System Theme Reaktivität

Der `useTheme` Hook registriert einen Event Listener für Änderungen der Systemeinstellung:

```typescript
useEffect(() => {
  if (theme !== 'system') return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(e.matches ? 'dark' : 'light')
  }

  mediaQuery.addEventListener('change', handleChange)
  return () => mediaQuery.removeEventListener('change', handleChange)
}, [theme])
```

## Integration mit Command Palette

Theme-Befehle sind in der Command Palette verfügbar:

- `Cmd/Ctrl + K` → "Helles Theme"
- `Cmd/Ctrl + K` → "Dunkles Theme"  
- `Cmd/Ctrl + K` → "System Theme"

## Testing

Um die Dark Mode Funktionalität zu testen:

1. **UI-Toggle**: Klick auf das Theme-Icon im Header
2. **Command Palette**: `Cmd/Ctrl + K` und "Theme" eingeben
3. **System-Anpassung**: Systemeinstellung ändern und beobachten, dass sich die App anpasst (wenn "System" gewählt ist)
4. **Persistenz**: Theme ändern, Seite neu laden, Theme sollte erhalten bleiben

## Bekannte Einschränkungen

Keine bekannten Einschränkungen.

## Zukünftige Erweiterungen

Mögliche zukünftige Features:
- Anpassbare Farbpaletten pro Theme
- Theme-basierte Diagrammfarben
- Zeitbasiertes automatisches Umschalten (z.B. nachts automatisch dunkel)
- Theme-Vorschau vor Auswahl
