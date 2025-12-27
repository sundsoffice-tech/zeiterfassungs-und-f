# Trust & Evidence Layer

## Übersicht

Der **Beweis- & Vertrauens-Layer** ist ein nicht-überwachender Ansatz zur Erhöhung der Glaubwürdigkeit von Zeiterfassungsdaten. Statt auf Kontrolle und Überwachung (Screenshots, permanentes GPS-Tracking) zu setzen, nutzt das System objektive Plausibilitätsprüfungen und freiwillige Beweisanker.

## Problem

Zeiterfassungsdaten sind oft korrekt, wirken aber für:
- Kunden (bei Abrechnung nach Aufwand)
- Prüfer (bei Audits)
- Interne Stellen (Controlling, Geschäftsführung)

...beliebig oder manipulierbar.

Herkömmliche Lösungen setzen auf:
- ❌ Screenshots alle X Minuten
- ❌ Permanentes GPS-Tracking
- ❌ App-Überwachung
- ❌ Webcam-Aufnahmen

→ Diese Methoden sind **unbeliebt**, **datenschutzrechtlich problematisch** und schaffen ein **Misstrauensklima**.

## Lösung: Plausibilität statt Überwachung

### Kernprinzipien

1. **Keine Überwachung**: Mitarbeiter werden nicht überwacht
2. **Freiwilligkeit**: Beweisanker sind optional
3. **Transparenz**: Alle Bewertungsfaktoren sind nachvollziehbar
4. **Datenschutz**: DSGVO-konform, Datenminimierung

### Plausibilitäts-Score (0-100%)

Jeder Zeiteintrag erhält automatisch einen Plausibilitäts-Score basierend auf:

#### 1. Zeitliche Konsistenz (30% Gewichtung)
- Keine Überlappungen mit anderen Einträgen
- Realistische Tagesdauer (< 12-16h)
- Arbeit in üblichen Zeitfenstern (nicht 03:00-05:00)
- Nicht nur exakte Stunden (8:00, 4:00) → vermeidet "zu perfekte" Zeiten

**Beispiele:**
- ✅ 95%: 08:30-12:15 und 13:00-17:45 (realistisch)
- ⚠️ 65%: 02:00-18:00 (ungewöhnlich lang + ungewöhnliche Startzeit)
- ❌ 40%: Überlappung mit anderem Eintrag

#### 2. Plan vs. Ist (20% Gewichtung)
- Vergleich mit historischen Zeiten für gleiche Task
- Abweichung von durchschnittlicher Dauer

**Beispiele:**
- ✅ 100%: Task dauert normal 2-3h, heute 2,5h
- ⚠️ 70%: Task dauert normal 2h, heute 4h
- ❌ 40%: Task dauert normal 1h, heute 8h

#### 3. Projekt-Historie (15% Gewichtung)
- Hat Mitarbeiter schon oft an diesem Projekt gearbeitet?
- Höhere Historie = höheres Vertrauen

**Beispiele:**
- ✅ 95%: 30+ Einträge am Projekt
- ⚠️ 70%: 5 Einträge am Projekt
- ⚠️ 60%: Erster Eintrag am Projekt (noch keine Basis)

#### 4. Team-Vergleich (20% Gewichtung)
- Anonymisierter Vergleich mit anderen Mitarbeitern an gleicher Task
- Erkennt unrealistische Abweichungen

**Beispiele:**
- ✅ 100%: Im Team-Durchschnitt (±30%)
- ⚠️ 70%: 60% über Team-Durchschnitt
- ❌ 45%: 2x länger als Team-Durchschnitt

#### 5. Beweisqualität (15% Gewichtung)
- Anzahl und Art der freiwilligen Beweisanker
- Verifizierung der Beweise

**Beispiele:**
- ✅ 100%: Kalender + Standort-Hash + Freigabe
- ⚠️ 65%: Ein Beweisanker
- ⚠️ 50%: Keine Beweisanker (neutral)

### Vertrauensstufen

Basierend auf dem Plausibilitäts-Score:

| Score | Stufe | Farbe | Bedeutung |
|-------|-------|-------|-----------|
| 85-100% | **Hoch vertrauenswürdig** | 🟢 Grün | Keine Auffälligkeiten, hohe Plausibilität |
| 70-84% | **Mittleres Vertrauen** | 🟡 Gelb | Leichte Abweichungen, generell plausibel |
| 50-69% | **Niedriges Vertrauen** | 🟠 Orange | Mehrere Auffälligkeiten, Prüfung empfohlen |
| 0-49% | **Ungeprüft** | 🔴 Rot | Starke Inkonsistenzen, manuelle Prüfung nötig |

## Beweisanker (freiwillig)

Mitarbeiter können **optional** Beweisanker hinzufügen, um die Plausibilität zu erhöhen:

### 1. Kalendereintrag 📅
- Verknüpfung mit Outlook/Google Calendar Termin
- "Kundenmeeting bei Firma XYZ, 10:00-11:30"
- **Gespeichert:** Termin-Titel + Zeit (nicht der komplette Kalender)

### 2. Standortbereich 📍
- Nicht: Exakte GPS-Koordinaten
- Sondern: **Bereichs-Hash** (gerundet auf ~100m)
- "Baustellenbereich Nord: 48.13,11.58±100m"
- **DSGVO-konform:** Nur Hash, keine Bewegungsprofile

### 3. Projektdatei 📄
- "Dokument XYZ.docx geöffnet um 14:23"
- Kein Tracking, was gemacht wurde
- Nur Nachweis, dass am Projekt gearbeitet wurde

### 4. Freigabe durch Projektleiter ✅
- Projektleiter bestätigt Zeiten
- Automatisch als starker Beweisanker

### 5. System-Events 🤖
- Timer gestartet (automatisch)
- Projekt-Tool-Integration (z.B. Jira-Ticket bearbeitet)

## Vorteile

### Für Mitarbeiter
- ✅ **Keine Überwachung**: Kein Micromanagement
- ✅ **Freiwillige Nachweise**: Selbstbestimmt
- ✅ **Transparenz**: Nachvollziehbare Bewertung
- ✅ **Vertrauen**: Kultur des Vertrauens statt Kontrolle

### Für Admins/Projektleiter
- ✅ **Objektive Plausibilität**: Datenbasierte Einschätzung
- ✅ **Früherkennung**: Unplausible Einträge fallen sofort auf
- ✅ **Zeitersparnis**: Keine manuelle Prüfung aller Einträge
- ✅ **Reporting**: "98% plausibel, 0 manuelle Korrekturen"

### Für Kunden
- ✅ **Vertrauenswürdige Abrechnung**: Objektive Qualitätsmetriken
- ✅ **Nachvollziehbarkeit**: Transparente Plausibilitätsfaktoren
- ✅ **Professionalität**: Zeigt Qualitätsbewusstsein

### Für Compliance/Audit
- ✅ **Audit-Trail**: Alle Faktoren dokumentiert
- ✅ **Nachweisbar**: Objektive Kriterien
- ✅ **DSGVO-konform**: Datenminimierung

## Use Cases

### 1. Agenturen (Abrechnung nach Aufwand)
**Problem:** Kunde zweifelt an abgerechneten Stunden
**Lösung:** Rechnung enthält: "98% durchschnittliche Plausibilität, 142 von 150 Einträgen mit hohem Vertrauen, 3% mit Beweisankern"

### 2. Bau/Montage
**Problem:** Arbeitszeiten auf verschiedenen Baustellen schwer nachvollziehbar
**Lösung:** Standort-Hashes (freiwillig) + Team-Vergleich zeigen konsistente Muster

### 3. Beratung
**Problem:** Interne/externe Stellen hinterfragen Projekt-Zeiten
**Lösung:** Kalendertermine + Freigaben durch Projektleiter erhöhen Vertrauen

### 4. Remote Work
**Problem:** Wie sicherstellen, dass gearbeitet wurde ohne zu überwachen?
**Lösung:** Plausibilitätsmuster (zeitliche Konsistenz, Projekt-Historie) + freiwillige Beweisanker

## Implementierung

### Automatisch (keine Aktion nötig)
- Plausibilitäts-Score wird bei jedem Zeiteintrag berechnet
- Vertrauensstufe wird automatisch zugeordnet
- Faktoren werden gespeichert

### Optional (Mitarbeiter)
- Beweisanker hinzufügen (freiwillig)
- In Time Entry Detail: "+ Beweisanker"

### Admin-Dashboard
**Vertrauens-Tab** zeigt:
- Durchschnittlicher Plausibilitäts-Score (gesamt, pro Projekt, pro Mitarbeiter)
- Verteilung der Vertrauensstufen
- Projekte mit höchster/niedrigster Plausibilität
- Mitarbeiter-Konsistenz-Scores
- Einzelne Einträge mit Details

### Reports für Kunden
Projekt-Report kann enthalten:
```
Projekt: Website Relaunch
Zeitraum: 01.01.2024 - 31.03.2024
Gesamt: 248 Stunden

Vertrauensqualität:
- Durchschnittlicher Plausibilitäts-Score: 94%
- Hohe Vertrauenswürdigkeit: 235 Einträge (95%)
- Mittleres Vertrauen: 12 Einträge (5%)
- Niedrig/Ungeprüft: 1 Eintrag (0%)
- Mit Beweisankern: 47 Einträge (19%)
- Manuelle Korrekturen: 2 Einträge (1%)

→ Sehr hohe Datenqualität, objektiv plausibel
```

## Datenschutz

### Was wird NICHT gespeichert
- ❌ Screenshots
- ❌ Exakte GPS-Koordinaten
- ❌ Bewegungsprofile
- ❌ App-Nutzung
- ❌ Webcam-Aufnahmen
- ❌ Tastatureingaben

### Was wird gespeichert
- ✅ Plausibilitäts-Score (Zahl 0-100)
- ✅ Faktoren (Zahlen pro Kategorie)
- ✅ Freiwillige Beweisanker (vom Mitarbeiter hinzugefügt)
- ✅ Standort-Hash (gerundet, anonymisiert) falls freiwillig
- ✅ Kalendertermin-Titel (falls verknüpft)

### DSGVO-Konformität
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
- **Datenminimierung:** Nur notwendige Daten
- **Transparenz:** Mitarbeiter sehen alle Faktoren
- **Zweckbindung:** Nur für Zeiterfassung/Abrechnung
- **Speicherdauer:** Gemäß Aufbewahrungsfristen

## Technische Details

### Berechnung
- Real-time bei jedem Zeiteintrag
- Oder on-demand im Admin-Dashboard
- Caching für Performance

### Datenstruktur
```typescript
interface TrustMetrics {
  plausibilityScore: number // 0-100
  factors: {
    temporalConsistency: number // 0-100
    planVsActual: number // 0-100
    projectHistory: number // 0-100
    teamComparison: number // 0-100
    evidenceQuality: number // 0-100
  }
  evidenceAnchors: EvidenceAnchor[]
  flaggedIssues: string[]
  trustLevel: 'high' | 'medium' | 'low' | 'unverified'
  lastCalculated: string
}
```

### Performance
- Berechnung dauert < 50ms pro Eintrag
- Bulk-Berechnung für Reports optimiert
- Caching von Aggregationen

## Roadmap

### Phase 1 (Current) ✅
- Automatische Plausibilitäts-Scores
- Manuelle Beweisanker
- Admin-Dashboard
- Projekt/Mitarbeiter-Reports

### Phase 2 (Geplant)
- Integration mit Kalender-APIs (Auto-Linking)
- Integration mit Projektmanagement-Tools (Auto-Evidence)
- KI-basierte Anomalie-Erkennung (verbesserte Muster)
- Predictive Trust Score (Vorhersage vor Eintrag)

### Phase 3 (Vision)
- Blockchain-basierte Unveränderbarkeit (Optional)
- Kunden-Portal mit Live-Trust-Metrics
- Benchmarking (anonymisiert, branchenübergreifend)
- Zertifizierungen (ISO, TISAX, etc.)

## Erfolgsmetriken

### Interne KPIs
- Durchschnittlicher Plausibilitäts-Score > 85%
- < 5% Einträge mit niedrigem/ungeprüftem Status
- > 20% Einträge mit freiwilligen Beweisankern
- < 2% manuelle Korrekturen

### Business Impact
- **Reduzierte Rückfragen:** Weniger Nachfragen von Kunden
- **Schnellere Abrechnung:** Keine manuelle Prüfung nötig
- **Höhere Akzeptanz:** Mitarbeiter nutzen System lieber
- **Bessere Kundenbindung:** Vertrauen in Abrechnung

## Verkaufsargumente

> **"Vertrauen, nicht Kontrolle"**
> 
> Unsere Zeit-Tracker überwacht nicht, sondern schafft objektives Vertrauen durch Plausibilitätsprüfungen. Ihre Mitarbeiter werden respektiert, Ihre Kunden erhalten nachvollziehbare Nachweise.

**Perfekt für:**
- 🏢 Agenturen mit Aufwandsabrechnung
- 🏗️ Bau- und Montagebetriebe
- 💼 Beratungsunternehmen
- 🌍 Remote-First Unternehmen
- ✅ Compliance-sensible Branchen

**Unique Selling Point:**
"Der einzige Time Tracker, der Vertrauen schafft ohne zu überwachen"
