# KI-Vorschläge (Auto-Kategorisierung)

## Überblick

Die **Smart Auto-Kategorisierung** ist ein KI-gestütztes Feature, das intelligente Vorschläge für Projekte, Tasks und Tags basierend auf verschiedenen Kontext-Signalen macht. Es reduziert den manuellen Aufwand bei der Zeiterfassung erheblich und verbessert die Genauigkeit durch Mustererkennung.

## Kernfunktionalität

### 1. Kontext-Signal-Analyse

Das System analysiert mehrere Signale, um kontextbezogene Vorschläge zu generieren:

#### **Pflicht-Signale** (immer aktiv)
- **Titel/Notiz**: Textanalyse auf Projekt-Keywords und Kundennamen
  - Beispiel: "Besprechung Produktdesign" → erkennt Design-Projekt
  - Beispiel: "Bugfix Login-Formular" → erkennt Development-Task

- **Zeit-Muster**: Berücksichtigt Tageszeit und Wochentag
  - Beispiel: "Projekt A wird typischerweise montags morgens bearbeitet"
  - Vergleicht mit historischen Mustern des Mitarbeiters

#### **Opt-in-Signale** (datenschutzsensitiv, durch User aktivierbar)

- **📅 Kalendertermin**
  - Analysiert Termintitel, Startzeit, Endzeit, Ort, Teilnehmer
  - Beispiel: "Du warst 10:00–11:30 im Termin 'Kurita Showroom' → als Projekt Kurita buchen?"
  - Ideal für Meeting-basierte Zeiterfassung

- **📍 Standort**
  - GPS oder manuelle Ortseingabe
  - Lernt aus historischen Mustern (Ort → Projekt-Zuordnung)
  - Beispiel: "Kurita Showroom" → Projekt Kurita
  - **Datenschutz**: Nur mit expliziter Zustimmung aktivierbar

- **💻 Genutzte Apps**
  - Optional: Tracking verwendeter Anwendungen
  - Beispiel: "Figma, Sketch" → Design-Tasks
  - Beispiel: "GitHub, VS Code" → Development-Tasks
  - **Datenschutz**: Nur mit expliziter Zustimmung aktivierbar

- **🌐 Besuchte Webseiten**
  - Optional: Tracking besuchter Domains
  - Beispiel: "stackoverflow.com, github.com" → Programming-Kontext
  - **Datenschutz**: Nur mit expliziter Zustimmung aktivierbar

### 2. Multi-Signal-Kombination

Die KI kombiniert mehrere Signale für hochpräzise Vorschläge:

```
Kalendertitel: "Kurita Showroom Meeting"
+ Ort: "Kurita Büro, Berlin"
+ Zeit: 10:00-11:30 (Dienstagvormittag)
+ Historisch: Dienstagvormittag typisch für Kundenmeetings
= 95% Konfidenz → Projekt "Kurita", Task "Kundentermin", 1.5h
```

### 3. Konfidenz-Scoring

Jeder Vorschlag enthält:
- **Confidence Score** (0-100%): Wie sicher ist die KI?
  - 🟢 **70-100%**: Hohe Konfidenz (grünes Badge)
  - 🟡 **40-69%**: Mittlere Konfidenz (gelbes Badge)
  - ⚪ **0-39%**: Niedrige Konfidenz (graues Badge)

- **Reasoning**: Klare Erklärung warum dieser Vorschlag gemacht wird
  - Beispiel: "Kalendertitel 'Kurita Showroom' deutet stark auf Projekt Kurita hin. Standort bestätigt dies."

- **Based On**: Zeigt welche Signale verwendet wurden
  - 📊 Historie
  - 📅 Kalender
  - 📍 Standort
  - 💻 Apps
  - 📝 Titel
  - ⏰ Zeitmuster

### 4. Vorschlagstypen

Das System kann verschiedene Aspekte vorschlagen:

- **`project`**: Projekt-Vorschlag
- **`task`**: Task-Vorschlag
- **`tag`**: Tag-Vorschläge
- **`duration`**: Zeitdauer-Vorschlag
- **`complete`**: Komplettvorschlag (Projekt + Task + Tags + Zeit)

### 5. One-Click Apply

- Jeder Vorschlag hat einen "Anwenden"-Button
- Klick füllt die Formularfelder automatisch aus
- User behält volle Kontrolle und kann nachträglich anpassen

## Nutzung

### Im Today-Screen

1. Navigiere zum **"Heute"**-Tab
2. Scrolle zur **"KI-Vorschläge (Auto-Kategorisierung)"**-Karte
3. Gib Kontext-Signale ein:
   - **Titel/Notiz**: Beschreibe was du gemacht hast
   - **Kalendertermin** (optional): Aktiviere den Toggle und gib Meeting-Details ein
   - **Standort** (optional): Aktiviere und gib den Ort an
   - **Apps/Webseiten** (optional): Aktiviere und liste genutzte Tools auf
4. Klicke **"Vorschläge generieren"**
5. Warte auf KI-Analyse (~2-5 Sekunden)
6. Prüfe die Vorschläge:
   - Konfidenz-Level beachten
   - Reasoning lesen
   - Signal-Quellen überprüfen
7. Klicke **"Anwenden"** um Vorschlag zu übernehmen

## Datenschutz & Transparenz

### Privacy-First Design

Alle datenschutzsensiblen Signale sind:
- ❌ **Standard deaktiviert**
- ✅ **Opt-in mit explizitem Toggle**
- 🏷️ **Mit "datenschutzsensitiv"-Badge markiert**
- 📖 **Transparent dokumentiert**

### Was wird gespeichert?

- **Nicht gespeichert**: Rohe App-/Website-Daten
- **Gespeichert**: Nur die resultierenden Zeiteinträge mit Projekt/Task
- **Lokal verarbeitet**: Kontext-Signale werden nur für Suggestion-Generierung genutzt

### User-Kontrolle

- Volle Kontrolle über aktivierte Signale
- Jederzeit deaktivierbar
- Vorschläge sind optional - nie erzwungen
- Transparente Erklärungen (Reasoning + Signal-Quellen)

## Technische Details

### AI-Modelle

- **Hauptanalyse**: GPT-4o (hohe Genauigkeit)
- **Quick-Suggestions**: GPT-4o-mini (schneller, günstiger)
- **JSON-Mode**: Strukturierte Ausgabe für zuverlässiges Parsing

### Pattern Recognition

Das System lernt aus:
- **Persönlicher Historie** (letzte 30 Tage)
- **Projekt-Mustern** (typische Zeiten, Orte, Apps)
- **Team-Durchschnitt** (anonymisiert)
- **Zeit-Mustern** (Tageszeit, Wochentag)
- **Orts-Mustern** (Standort → Projekt-Zuordnung)

### Analyse-Algorithmen

1. **Keyword-Matching**: Simple text-based project detection
2. **Historical Pattern Analysis**: Frequency-based recommendations
3. **Time Pattern Recognition**: Time-of-day and day-of-week patterns
4. **Location Pattern Mapping**: Location → Project associations
5. **AI-Enhanced Context Analysis**: GPT-4 powered multi-signal reasoning

## Beispiele

### Beispiel 1: Kalendertitel

**Input:**
- Titel: "Kurita Showroom Besprechung"
- Kalender: 10:00-11:30
- Ort: "Kurita Office Berlin"

**Output:**
```
Vorschlag 1 (95% Konfidenz)
├─ Projekt: Kurita
├─ Task: Kundentermin
├─ Zeit: 10:00 - 11:30 (1.5h)
├─ Reasoning: "Kalendertitel 'Kurita Showroom' deutet stark auf Projekt 
│             Kurita hin. Standort bestätigt dies. Zeitfenster passt."
└─ Based On: 📅 Kalender, 📍 Standort, 📊 Historie
```

### Beispiel 2: App-basiert

**Input:**
- Titel: "Frontend Entwicklung"
- Apps: "VS Code, Chrome DevTools, GitHub Desktop"

**Output:**
```
Vorschlag 1 (82% Konfidenz)
├─ Projekt: WebApp Redesign
├─ Task: Frontend Development
├─ Tags: ["development", "frontend", "javascript"]
├─ Reasoning: "Verwendete Apps (VS Code, GitHub) deuten stark auf 
│             Entwicklungsarbeit hin. Titel bestätigt Frontend-Fokus."
└─ Based On: 💻 Apps, 📝 Titel, 📊 Historie
```

### Beispiel 3: Standort + Zeit-Muster

**Input:**
- Ort: "Home Office"
- Zeit: Montag, 09:00
- Titel: "Weekly Planning"

**Output:**
```
Vorschlag 1 (78% Konfidenz)
├─ Projekt: Internal - Planning
├─ Task: Weekly Team Sync
├─ Reasoning: "Montag morgens am Home Office typischerweise für 
│             Weekly Planning genutzt (basierend auf 8 ähnlichen 
│             Einträgen in den letzten 4 Wochen)."
└─ Based On: 📍 Standort, ⏰ Zeitmuster, 📊 Historie
```

## Best Practices

### Für hohe Genauigkeit:

1. **Konsistente Terminbenennungen**: Nutze immer ähnliche Kalendertitel für wiederkehrende Meetings
2. **Aktiviere relevante Signale**: Mehr Signale = bessere Vorschläge
3. **Feedback durch Nutzung**: Je mehr du das System nutzt, desto besser lernt es deine Muster
4. **Klare Titel**: Beschreibende Titel helfen der KI ("Design Review" statt "Meeting")

### Für Datenschutz:

1. Nur benötigte Signale aktivieren
2. Bei sensiblen Projekten: Standort-/App-Tracking deaktivieren
3. Regelmäßig überprüfen welche Signale aktiv sind

## Roadmap / Geplante Erweiterungen

- [ ] **Browser Extension**: Automatische App-/Website-Erkennung
- [ ] **Mobile Widget**: Quick-Add mit GPS-Standort
- [ ] **Slack/Teams Integration**: Meeting-Daten aus Chat-Tools
- [ ] **Lernmodus**: Explizites Feedback-System ("War dieser Vorschlag hilfreich?")
- [ ] **Smart Templates**: Auto-generierte Favoriten basierend auf Mustern
- [ ] **Conflict Detection**: "Du hast heute schon 3h auf Projekt X, aber Meeting war Projekt Y"

## Support & Feedback

Bei Fragen oder Problemen:
- Überprüfe Konfidenz-Level (niedrige Konfidenz = unsicherer Vorschlag)
- Prüfe welche Signale aktiviert sind
- Stelle sicher, dass genug historische Daten vorhanden sind (mind. 10 Einträge)
- Kontaktiere Admin bei anhaltenden Problemen
