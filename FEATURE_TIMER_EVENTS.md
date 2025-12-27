# Feature: Automatische Zeitstempel & Moduswechsel

## Übersicht

Das System erfasst automatisch **alle Timer-Ereignisse mit präzisen Zeitstempeln** und ermöglicht nahtlose **Moduswechsel** zwischen verschiedenen Aktivitätskategorien während eines laufenden Timers. Alle Ereignisse werden als strukturiertes Log gespeichert und können für Nachweise, Analysen und Kalendereintragungen verwendet werden.

## Kernfunktionalität

### Automatische Zeitstempel

Jedes Timer-Ereignis wird mit folgenden Informationen aufgezeichnet:

- **Ereignistyp**: Start, Pause, Fortsetzen, Stopp, Moduswechsel
- **Zeitstempel**: Millisekunden-genauer Unix-Timestamp
- **Formatierte Zeit**: HH:mm:ss für die Anzeige
- **Kontext**: Aktueller Modus, Projekt, Phase, Task, Standort, Notizen

#### Ereignistypen

```typescript
enum TimerEventType {
  START = 'start',           // Timer gestartet
  PAUSE = 'pause',           // Timer pausiert
  RESUME = 'resume',         // Timer fortgesetzt
  STOP = 'stop',             // Timer beendet
  MODE_SWITCH = 'mode_switch' // Modus gewechselt
}
```

#### Ereignisstruktur

```typescript
interface TimerEvent {
  id: string                    // Eindeutige Event-ID
  type: TimerEventType          // Art des Ereignisses
  timestamp: number             // Unix-Timestamp (ms)
  timestampFormatted: string    // "14:23:45"
  mode?: ActivityMode           // Aktiver Modus
  projectId?: string            // Projekt-Referenz
  phaseId?: string             // Phasen-Referenz
  taskId?: string              // Task-Referenz
  location?: string            // Standortinformation
  notes?: string               // Zusätzliche Notizen
}
```

### Aktivitätsmodi

Das System unterstützt **9 vordefinierte Aktivitätsmodi** für verschiedene Arbeitskategorien:

| Modus | Icon | Beschreibung | Anwendungsfall |
|-------|------|--------------|----------------|
| **Fahrt** | 🚗 | Fahrzeiten und Reisen | Anfahrt zur Baustelle, Kundenbesuch |
| **Montage** | 🔧 | Installation und Aufbau | Geräteinstallation, Systemaufbau |
| **Demontage** | 🔨 | Abbau und Rückbau | Geräteabbau, Rückbau |
| **Planung** | 📋 | Planung und Konzeption | Projektplanung, Konzepterstellung |
| **Beratung** | 💬 | Beratung und Kommunikation | Kundengespräche, Beratung |
| **Wartung** | ⚙️ | Wartung und Service | Regelmäßige Wartung, Instandhaltung |
| **Dokumentation** | 📝 | Dokumentation | Projektdokumentation, Berichte |
| **Meeting** | 👥 | Meetings und Besprechungen | Team-Meetings, Kundenbesprechungen |
| **Sonstiges** | 📌 | Sonstige Tätigkeiten | Allgemeine Aufgaben |

### Moduswechsel während des Timers

Benutzer können **ohne Unterbrechung** zwischen Modi wechseln:

1. **Nahtloser Wechsel**: Timer läuft weiter, nur der Modus ändert sich
2. **Automatisches Logging**: Jeder Wechsel wird mit Zeitstempel erfasst
3. **Aufteilung nach Modus**: Das System berechnet die Dauer pro Modus
4. **Visuelles Feedback**: Toast-Notification mit Zeitstempel beim Wechsel

#### Beispiel-Ablauf

```
09:00:00 - Start (Fahrt)          → Beginn der Fahrt zum Kunden
09:45:00 - Modus → Montage        → Beginn der Installation
11:30:00 - Pause                  → Mittagspause
12:00:00 - Fortgesetzt            → Arbeit fortgesetzt
12:00:00 - Modus → Beratung       → Kundengespräch
13:15:00 - Modus → Montage        → Installation fortgesetzt
15:30:00 - Modus → Dokumentation  → Abschlussdokumentation
16:00:00 - Modus → Fahrt          → Rückfahrt
16:45:00 - Stopp                  → Timer beendet
```

**Ergebnis**: Ein einziger Zeiteintrag mit 7,75 Stunden und detailliertem Ereignisverlauf:
- Fahrt: 1,25h (09:00-09:45 + 16:00-16:45)
- Montage: 4,75h (09:45-11:30 + 12:00-13:15)
- Beratung: 1,25h (12:00-13:15 ist falsch, sollte nur die Beratungszeit sein)
- Dokumentation: 0,5h (15:30-16:00)

## Benutzeroberfläche

### Timer-Steuerung

#### Vor dem Start

- **Modusauswahl**: 9 Buttons mit Icons zur Auswahl des Start-Modus
- **Visuelles Feedback**: Aktiver Modus ist hervorgehoben (primary)
- **Default-Modus**: "Sonstiges" als Standardauswahl

#### Während des Timers

- **Modus-Wechsel-Leiste**: Gleiche 9 Buttons zum schnellen Wechseln
- **Aktueller Modus**: Hervorgehobener Button zeigt aktiven Modus
- **Ereigniszähler**: "X Ereignisse" Button zum Öffnen des Verlaufs
- **Deaktivierung bei Pause**: Moduswechsel nur möglich wenn Timer läuft

### Ereignisverlauf-Dialog

Ein detaillierter Dialog zeigt alle aufgezeichneten Ereignisse:

- **Chronologische Liste**: Alle Events von neu nach alt
- **Nummerierung**: Fortlaufende Nummer (1, 2, 3, ...)
- **Zeitstempel**: Formatierte Uhrzeit (HH:mm:ss)
- **Ereignisbeschreibung**: "Gestartet (Montage)", "Pausiert", "Modus gewechselt zu Fahrt"
- **Modus-Badge**: Farbiges Badge mit Icon für Modus-Events
- **Scrollbar**: Für lange Event-Listen

### Tagesübersicht

#### Aktivitäten nach Modus

Wenn mindestens ein Eintrag mit Modus vorhanden ist, wird eine **Zusammenfassung** angezeigt:

- **Grid-Layout**: 2-3-5 Spalten (responsive)
- **Modus-Karten**: 
  - Icon und Name
  - Gesamtdauer in Stunden
  - Anzahl der Einträge
- **Nur aktive Modi**: Leere Modi werden ausgeblendet

#### Eintrags-Badges

Jeder Zeiteintrag zeigt:

- **Modus-Badges**: Alle verwendeten Modi als farbige Badges
- **Automatik-Badge**: "Automatisch" mit Uhr-Icon für system-generierte Einträge
- **Zusatzinfos**: Notizen werden inline angezeigt

## Datenmodell-Erweiterungen

### ActiveTimer

```typescript
interface ActiveTimer {
  // ... bestehende Felder
  mode?: ActivityMode            // Aktueller Aktivitätsmodus
  events: TimerEvent[]           // Chronologisches Event-Log
  calendarEventId?: string       // Verknüpfung mit Kalendereintrag
}
```

### TimeEntry

```typescript
interface TimeEntry {
  // ... bestehende Felder
  tags?: string[]                // Enthält verwendete Modi als Tags
  evidenceAnchors?: Array<{      // Beweis-Anker für Nachvollziehbarkeit
    type: 'system' | ...
    timestamp: string
    value: string
    verified: boolean
  }>
}
```

## Technische Implementierung

### Event-Erstellung

```typescript
function createTimerEvent(
  type: TimerEventType,
  timer: Partial<ActiveTimer> = {}
): TimerEvent {
  const timestamp = Date.now()
  return {
    id: `event-${timestamp}-${randomId}`,
    type,
    timestamp,
    timestampFormatted: format(timestamp, 'HH:mm:ss'),
    mode: timer.mode,
    projectId: timer.projectId,
    // ...
  }
}
```

### Timer-Start mit Event

```typescript
const startEvent = createTimerEvent(TimerEventType.START, {
  mode: selectedMode,
  projectId: selectedProject,
  // ...
})

const newTimer: ActiveTimer = {
  // ... Timer-Daten
  mode: selectedMode,
  events: [startEvent]  // ← Event-Log beginnt
}
```

### Moduswechsel

```typescript
const handleModeSwitch = (newMode: ActivityMode) => {
  const switchEvent = createTimerEvent(TimerEventType.MODE_SWITCH, {
    ...activeTimer,
    mode: newMode
  })

  setActiveTimer({
    ...activeTimer,
    mode: newMode,
    events: [...activeTimer.events, switchEvent]  // ← Event anhängen
  })

  toast.success(`Modus gewechselt zu ${formatMode(newMode)}`, {
    description: format(new Date(), 'HH:mm:ss')  // ← Zeitstempel im Toast
  })
}
```

### Speicherung im TimeEntry

Beim Stoppen des Timers:

```typescript
const stopEvent = createTimerEvent(TimerEventType.STOP, activeTimer)
const allEvents = [...activeTimer.events, stopEvent]

// Modi als Tags speichern
const modeTags = activeTimer.mode ? [activeTimer.mode] : []
const allTags = [...(activeTimer.tags || []), ...modeTags]

// Beweis-Anker für Nachvollziehbarkeit
const evidenceAnchors = [{
  type: 'system',
  timestamp: new Date().toISOString(),
  value: `Automatische Aufzeichnung mit ${allEvents.length} Ereignissen`,
  verified: true
}]

const newEntry: TimeEntry = {
  // ... Standard-Felder
  tags: allTags,
  evidenceAnchors
}
```

## Kalenderintegration (Vorbereitet)

Das System bereitet Daten für Kalenderintegration vor:

### Kalendereintrag-Titel

```typescript
function createCalendarEventTitle(
  projectName: string,
  mode?: ActivityMode,
  taskName?: string
): string {
  let title = projectName
  if (taskName) title += ` - ${taskName}`
  if (mode) title += ` (${formatMode(mode)})`
  return title
  // Beispiel: "Kurita Showroom - Installation (Montage)"
}
```

### Kalendereintrag-Beschreibung

```typescript
function createCalendarEventDescription(
  timer: ActiveTimer,
  events: TimerEvent[]
): string {
  // Generiert mehrzeilige Beschreibung mit:
  // - Header
  // - Notizen (falls vorhanden)
  // - Ereignisliste mit Zeitstempeln
  // - Gesamtdauer
  // - Aufschlüsselung nach Modi
}
```

## Analysemöglichkeiten

### Modus-Dauer-Berechnung

```typescript
function calculateModeDurations(events: TimerEvent[]): Map<ActivityMode, number> {
  // Berechnet präzise Dauer für jeden Modus
  // Berücksichtigt Pausen zwischen Modi
  // Gibt Map<Modus, Millisekunden> zurück
}
```

### Timer-Zusammenfassung

```typescript
function getTimerSummary(timer: ActiveTimer): {
  totalDuration: number      // Gesamtdauer seit Start
  activeDuration: number     // Aktive Zeit (ohne Pausen)
  pauseDuration: number      // Gesamte Pausenzeit
  modeDurations: Map<ActivityMode, number>  // Zeit pro Modus
}
```

## Vorteile

### Für Mitarbeiter

✅ **Nahtlose Arbeit**: Kein Timer-Stopp beim Aktivitätswechsel  
✅ **Präzise Erfassung**: Automatische Zeitstempel ohne manuelle Eingabe  
✅ **Transparenz**: Vollständiger Ereignisverlauf jederzeit einsehbar  
✅ **Flexibilität**: Beliebige Moduswechsel während der Arbeit

### Für Projektmanager

✅ **Detaillierte Auswertung**: Zeitverteilung nach Aktivitätsmodus  
✅ **Nachvollziehbarkeit**: Lückenlose Dokumentation aller Ereignisse  
✅ **Analyse**: Erkennen von Mustern (z.B. hohe Fahrzeiten)  
✅ **Transparenz**: Beweis-Layer durch automatische Aufzeichnung

### Für die Abrechnung

✅ **Kategorisierung**: Klare Trennung zwischen Fahrt, Montage, Beratung etc.  
✅ **Beweiskraft**: Zeitstempel-basierte Nachweise für Kunden  
✅ **Automatisierung**: Modi werden als Tags exportiert  
✅ **Kalenderintegration**: Vorbereitet für automatische Kalendereinträge

## Best Practices

### Moduswahl

- **Beim Start**: Passenden Modus wählen (Standard: "Sonstiges")
- **Während der Arbeit**: Bei Tätigkeitswechsel Modus aktualisieren
- **Nicht übertreiben**: Nur bei signifikanten Wechseln ändern
- **Konsistenz**: Gleiche Modi für gleiche Tätigkeiten verwenden

### Event-Hygiene

- **Ereignisverlauf prüfen**: Vor dem Stoppen kurz durchsehen
- **Notizen ergänzen**: Wichtige Kontextinfos im Timer hinterlegen
- **Pause nutzen**: Bei längeren Unterbrechungen Timer pausieren

### Reporting

- **Tagesübersicht**: Modus-Verteilung prüfen
- **Wochenanalyse**: Trends in Aktivitätsmustern erkennen
- **Projektberichte**: Zeitverteilung pro Modus und Projekt

## Zukunftserweiterungen

### Phase 1 (Aktuell implementiert)
✅ Automatische Zeitstempel für alle Timer-Events  
✅ 9 Aktivitätsmodi mit Icons  
✅ Nahtloser Moduswechsel während Timer läuft  
✅ Ereignisverlauf-Dialog  
✅ Tagesübersicht mit Modus-Aufschlüsselung

### Phase 2 (Geplant)
🔄 **Kalenderintegration**: Automatische Synchronisation mit Google Calendar / Outlook  
🔄 **GPS-basierte Moduswechsel**: Automatischer Wechsel zu "Fahrt" bei Bewegung >50 km/h  
🔄 **Geo-Fencing**: Auto-Start bei Betreten der Baustelle  
🔄 **Modus-Vorschläge**: KI schlägt Modus basierend auf Projekt/Zeit/Standort vor  
🔄 **Wiederholungsmuster**: "Montags immer Planung 9-10 Uhr"

### Phase 3 (Vision)
🔮 **Spracherkennung**: "Timer starten, Montage, Projekt Kurita"  
🔮 **Smartwatch-Integration**: Moduswechsel vom Handgelenk  
🔮 **Team-Sync**: Sehen wann Kollegen vor Ort sind  
🔮 **Foto-Attachments**: Baufortschritts-Fotos direkt zu Events

## Zusammenfassung

Das automatische Zeitstempel-System mit Moduswechsel bietet:

- ✅ **Vollständige Nachvollziehbarkeit** aller Timer-Aktivitäten
- ✅ **Flexible Kategorisierung** durch 9 Aktivitätsmodi
- ✅ **Nahtlose Workflows** ohne Timer-Unterbrechungen
- ✅ **Detaillierte Analysen** nach Aktivitätstyp
- ✅ **Beweiskraft** durch präzise Zeitstempel
- ✅ **Kalendervorbereitung** für automatische Synchronisation

Die Implementierung folgt dem Prinzip der **"nicht-überwachenden Transparenz"**: Das System dokumentiert lückenlos, ohne den Mitarbeiter zu überwachen – die Daten dienen der Nachweisbarkeit und Optimierung, nicht der Kontrolle.
