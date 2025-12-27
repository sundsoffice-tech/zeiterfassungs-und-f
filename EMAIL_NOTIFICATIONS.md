# Email Notifications für Anomalie-Erkennung

## Übersicht

Das System sendet automatisch E-Mail-Benachrichtigungen an Mitarbeiter, wenn Zeiterfassungs-Anomalien erkannt werden. Dies umfasst:
- Fehlende Stunden
- Keine Zeiteinträge
- Überstunden
- Wochenendarbeit

## Hauptfunktionen

### 1. Benachrichtigungseinstellungen

Jeder Mitarbeiter kann seine persönlichen Benachrichtigungseinstellungen unter **Admin → Mitarbeiter-Einstellungen** konfigurieren:

- **Anomalie-Erkennung aktivieren/deaktivieren**
- **Häufigkeit wählen:**
  - Sofort (Echtzeit-Benachrichtigungen)
  - Täglich (Zusammenfassung)
  - Wöchentlich (Zusammenfassung)
- **Schweregrad-Filter:** Niedrig, Mittel oder Hoch
- **Kanäle wählen:** E-Mail und/oder In-App

### 2. Anomalie-Benachrichtigungszentrale

Administratoren finden unter **Admin → Benachrichtigungen** die Benachrichtigungszentrale mit:

- **Übersicht:** Anzahl der Mitarbeiter mit Anomalien
- **Massenversand:** E-Mails an alle betroffenen Mitarbeiter senden
- **Einzelversand:** E-Mails an einzelne Mitarbeiter senden
- **Verlauf:** Liste aller gesendeten Benachrichtigungen

## E-Mail-Inhalt

Jede Anomalie-E-Mail enthält:

1. **Zusammenfassung:**
   - Anzahl der Lücken und fehlende Stunden
   - Anzahl der Überstunden-Tage
   - Anzahl betroffener Tage

2. **Detaillierte Liste nach Schweregrad:**
   - 🔴 Dringend (Hoher Schweregrad)
   - 🟡 Mittlere Priorität (Mittlerer Schweregrad)

3. **Für jede Anomalie:**
   - Datum und Wochentag
   - Typ (Fehlende Stunden, Überstunden, etc.)
   - Beschreibung
   - Erwartete vs. erfasste Stunden
   - Differenz
   - Empfohlene Maßnahme

4. **Call-to-Action:** Link zur Anwendung zum Ergänzen der Zeiteinträge

## Technische Details

### Datenstruktur

```typescript
NotificationPreferences {
  employeeId: string
  anomalyDetection: {
    enabled: boolean
    frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'disabled'
    channels: ['email', 'in_app']
    severityThreshold: 'low' | 'medium' | 'high'
  }
  reminderNotifications: { ... }
  approvalNotifications: { ... }
}
```

### E-Mail-Versand

Die Funktion `EmailNotificationService.sendAnomalyNotification()` übernimmt:

1. Prüfung der Benachrichtigungseinstellungen
2. Filterung nach Schweregrad
3. Generierung von Text- und HTML-Version
4. Simulierter E-Mail-Versand (Console-Log)

**Hinweis:** Der aktuelle Versand ist simuliert. In einer Produktionsumgebung würde hier ein echter E-Mail-Dienst (z.B. SendGrid, AWS SES) integriert werden.

### Persistierung

- **Benachrichtigungseinstellungen:** Gespeichert unter `notification-preferences-{employeeId}`
- **Gesendete Benachrichtigungen:** Gespeichert unter `sent-anomaly-notifications`

Alle Daten werden mit dem Spark KV-System persistent gespeichert.

## Verwendung

### Als Administrator

1. Navigieren Sie zu **Admin → Benachrichtigungen**
2. Sehen Sie die Liste der Mitarbeiter mit Anomalien
3. Klicken Sie auf **"An alle senden"** für Massenversand
4. Oder klicken Sie bei einzelnen Mitarbeitern auf **"Senden"**
5. Überprüfen Sie den Verlauf der gesendeten Benachrichtigungen

### Als Mitarbeiter

1. Navigieren Sie zu **Admin → Mitarbeiter-Einstellungen**
2. Wählen Sie Ihren Namen aus
3. Konfigurieren Sie Ihre Benachrichtigungseinstellungen
4. Aktivieren/Deaktivieren Sie E-Mail-Benachrichtigungen

## Zukunftserweiterungen

Mögliche Erweiterungen des Systems:

- **Echte E-Mail-Integration** mit SMTP oder E-Mail-Dienst
- **Täglich/Wöchentlich geplante Zusammenfassungen** mit Cron-Jobs
- **SMS-Benachrichtigungen** als zusätzlicher Kanal
- **Push-Benachrichtigungen** für mobile Apps
- **Benachrichtigungs-Templates** anpassbar durch Admins
- **Mehrsprachigkeit** für E-Mail-Inhalte
- **Benachrichtigungs-Historie** pro Mitarbeiter
- **Unsubscribe-Link** in E-Mails

## Dateien

- `/src/lib/email-notifications.ts` - Hauptlogik für E-Mail-Benachrichtigungen
- `/src/hooks/use-notification-preferences.ts` - React Hook für Einstellungen
- `/src/components/NotificationSettings.tsx` - UI für individuelle Einstellungen
- `/src/components/AnomalyNotificationCenter.tsx` - Admin-Zentrale für Versand
- `/src/components/EmployeeSettingsScreen.tsx` - Mitarbeiter-Einstellungen-Screen
