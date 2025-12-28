# Layout Stability Improvements

Diese Dokumentation beschreibt die umgesetzten Maßnahmen zur Verhinderung von Layout Shifts bei Buttons und Menüs.

## Implementierte Verbesserungen

### 1. Button-Komponente (`ui/button.tsx`)
- **Minimale Höhen**: Alle Button-Größen haben nun `min-h-*` Eigenschaften
  - Default: `min-h-[2.25rem]`
  - Small: `min-h-[2rem]`
  - Large: `min-h-[2.5rem]`
  - Icon: `min-w-[2.25rem] min-h-[2.25rem]`
- **will-change-auto**: Optimiert GPU-Rendering ohne permanente Layer-Promotion
- **shrink-0**: Verhindert, dass SVG-Icons schrumpfen

### 2. Navigation Menu (`NavigationMenu.tsx`)
- **Strukturelle Verbesserungen**:
  - Wrapper-Spans mit `flex items-center gap-2` für konsistente Icon/Text-Ausrichtung
  - `whitespace-nowrap` verhindert Textumbrüche
  - `shrink-0` für Icons und ChevronDown
  - `min-h-[36px]` für alle Buttons und Menu-Items
  - `min-w-[14rem]` für Dropdown-Inhalte

### 3. Mobile Bottom Navigation (`MobileBottomNav.tsx`)
- **Touch-optimierte Größen**:
  - Buttons: `min-h-[56px] min-w-[56px]` (über WCAG 2.2 Mindestgröße)
  - Sheet-Items: `min-h-[5rem]` für bessere Berührbarkeit
- **Text-Overflow-Handling**:
  - `whitespace-nowrap overflow-hidden text-ellipsis`
  - `max-w-full` verhindert horizontales Überlaufen

### 4. Theme Toggle (`ThemeToggle.tsx`)
- **Icon-Button Stabilität**:
  - `min-h-[2.25rem] min-w-[2.25rem]`
  - `relative` Positionierung für absolute Icon-Überblendung
  - `shrink-0` für beide Icons (Sun/Moon)
  - `flex-1` für Text in Dropdown-Items mit fester Checkmark-Position

### 5. Command Palette (`CommandPalette.tsx`)
- **Konsistente Item-Höhen**:
  - Alle CommandItems: `min-h-[36px]`
  - `flex-1` für Labels, `shrink-0` für Icons

### 6. Dropdown Menu Komponente (`ui/dropdown-menu.tsx`)
- **Menu-Item Stabilität**:
  - `min-h-[36px]` für alle DropdownMenuItems
  - Icons bereits mit `shrink-0` versehen

### 7. CSS-Grundlagen (`index.css`)
- **Font-Rendering-Optimierung**:
  ```css
  font-feature-settings: 'tnum' on, 'lnum' on;
  font-variant-numeric: tabular-nums;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  ```
- **Layout Containment**:
  ```css
  nav, [role="navigation"] {
    contain: layout;
  }
  ```

### 8. Layout Stability Stylesheet (`styles/layout-stability.css`)
Neue dedizierte CSS-Datei mit Utility-Klassen und Base-Styles:

- **Base Layer**: 
  - Box-Sizing für alle interaktiven Elemente
  - Konsistente Flexbox-Ausrichtung
  - Layout/Style/Paint Containment für Nav-Buttons

- **Component Layer**:
  - `.stable-text`: Tabular Numerals und optimiertes Rendering
  - `.stable-icon`: Flex-basierte Icon-Container
  - `.stable-nav-item`: Vordefinierte Mindestgrößen
  - `.stable-dropdown-content`: Minimale Breiten
  - `.stable-menu-item`: Konsistente Item-Höhen

## Vorteile

1. **Keine Layout Shifts**: Text und Icons springen nicht mehr beim Rendern
2. **Konsistente Größen**: Alle interaktiven Elemente haben vorhersehbare Dimensionen
3. **Bessere Performance**: CSS Containment reduziert Reflow-Bereiche
4. **Verbesserte Accessibility**: Größere Touch-Targets (WCAG 2.2 konform)
5. **Optimiertes Font-Rendering**: Zahlen und Text bleiben visuell stabil

## Browser-Kompatibilität

Alle verwendeten CSS-Features sind in modernen Browsern verfügbar:
- `contain: layout` - Chrome 52+, Firefox 69+, Safari 15.4+
- `font-feature-settings` - Chrome 48+, Firefox 34+, Safari 9.1+
- `font-variant-numeric` - Chrome 52+, Firefox 34+, Safari 9.1+
- `will-change` - Chrome 36+, Firefox 36+, Safari 9.1+

## Wartung

Bei neuen Komponenten beachten:
1. Immer `min-h-*` und/oder `min-w-*` für interaktive Elemente setzen
2. Icons mit `shrink-0` versehen
3. Text mit `whitespace-nowrap` schützen (wo sinnvoll)
4. Flexbox-Container mit expliziten `gap`-Werten verwenden
5. `contain: layout` für Container mit vielen interaktiven Elementen
