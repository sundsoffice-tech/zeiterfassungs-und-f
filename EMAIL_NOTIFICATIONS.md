# Email Notifications für Anomalie-Erkennung

## Übersicht

Das System sendet automatisch E-Mail-Benachrichtigungen an Mitarbeiter, wenn Zeiterfassungs-Anomalien erkannt werden. Dies umfasst:
- Fehlende Stunden
- Keine Zeiteinträge
- Überstunden
- Wochenendarbeit

**Neu:** Das System unterstützt jetzt echte E-Mail-Dienste (SendGrid) für den Versand von Benachrichtigungen!

## E-Mail-Dienst-Konfiguration

### Unterstützte Provider

1. **SendGrid** - Professioneller E-Mail-Dienst mit kostenloser Stufe (100 E-Mails/Tag)
2. **Simuliert** - Für Tests und Entwicklung (keine echten E-Mails)

### SendGrid einrichten

1. Erstellen Sie ein kostenloses Konto bei [sendgrid.com](https://sendgrid.com)
2. Verifizieren Sie Ihre Absender-E-Mail-Adresse (Single Sender Verification)
3. Erstellen Sie einen API-Schlüssel:
   - Gehen Sie zu Settings → API Keys
   - Klicken Sie auf "Create API Key"
   - Wählen Sie "Full Access" oder "Restricted Access" (mindestens "Mail Send" Berechtigung)
   - Kopieren Sie den API-Schlüssel (wird nur einmal angezeigt!)
4. Navigieren Sie in der App zu **Admin → E-Mail-Konfiguration**
5. Wählen Sie "SendGrid" als Provider
6. Geben Sie Ihren API-Schlüssel ein
7. Geben Sie Ihre verifizierte Absender-E-Mail-Adresse ein
8. Klicken Sie auf "Verbindung testen" um die Konfiguration zu validieren
9. Speichern Sie die Konfiguration

### E-Mail-Konfiguration verwalten

Die Konfiguration finden Sie unter **Admin → E-Mail-Konfiguration**:

- **Provider wählen:** SendGrid oder Simuliert
- **API-Schlüssel:** Sicher gespeichert mit Spark KV
- **Absender-E-Mail:** Muss bei SendGrid verifiziert sein
- **Absender-Name:** Angezeigter Name in E-Mails
- **Verbindung testen:** Validiert die API-Schlüssel
- **Status anzeigen:** Zeigt ob E-Mails echt oder simuliert versendet werden



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
4. **Echter E-Mail-Versand über SendGrid API**
5. Fehlerbehandlung und Statusverfolgung

Die Klasse `EmailService` behandelt:
- SendGrid API-Integration
- Fallback auf Simulation wenn nicht konfiguriert
- Verbindungstests und Validierung
- Fehlerbehandlung und Logging

### Persistierung

- **E-Mail-Konfiguration:** Gespeichert unter `email-config`
- **Benachrichtigungseinstellungen:** Gespeichert unter `notification-preferences-{employeeId}`
- **Gesendete Benachrichtigungen:** Gespeichert unter `sent-anomaly-notifications`

Alle Daten werden mit dem Spark KV-System persistent und sicher gespeichert.

## Verwendung

### E-Mail-Dienst einrichten (Erforderlich für echte E-Mails)

1. Navigieren Sie zu **Admin → E-Mail-Konfiguration**
2. Wählen Sie "SendGrid" als Provider
3. Geben Sie Ihren API-Schlüssel und Absender-Details ein
4. Testen Sie die Verbindung
5. Speichern Sie die Konfiguration

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

- **Weitere E-Mail-Provider:** AWS SES, Mailgun, Postmark
- **Täglich/Wöchentlich geplante Zusammenfassungen** mit Cron-Jobs
- **SMS-Benachrichtigungen** als zusätzlicher Kanal
- **Push-Benachrichtigungen** für mobile Apps
- **Benachrichtigungs-Templates** anpassbar durch Admins
- **Mehrsprachigkeit** für E-Mail-Inhalte
- **Benachrichtigungs-Historie** pro Mitarbeiter
- **Unsubscribe-Link** in E-Mails
- **E-Mail-Tracking** (Öffnungsrate, Klickrate)

## Dateien

- `/src/lib/email-service.ts` - E-Mail-Dienst-Abstraction Layer mit SendGrid Integration
- `/src/lib/email-notifications.ts` - Hauptlogik für E-Mail-Benachrichtigungen
- `/src/hooks/use-notification-preferences.ts` - React Hook für Einstellungen
- `/src/components/EmailConfigScreen.tsx` - UI für E-Mail-Dienst-Konfiguration
- `/src/components/NotificationSettings.tsx` - UI für individuelle Einstellungen
- `/src/components/AnomalyNotificationCenter.tsx` - Admin-Zentrale für Versand
- `/src/components/EmployeeSettingsScreen.tsx` - Mitarbeiter-Einstellungen-Screen

## Technische Details

### E-Mail-Dienst Architektur

```typescript
// Konfiguration
interface EmailConfig {
  provider: 'sendgrid' | 'none'
  apiKey?: string
  fromEmail: string
  fromName: string
}

// Service Layer
class EmailService {
  async send(params: SendEmailParams): Promise<SendEmailResult>
  static async testConnection(config: EmailConfig): Promise<{ valid: boolean; error?: string }>
}

// Notification Layer
class EmailNotificationService {
  static initializeEmailService(config: EmailConfig)
  static async sendAnomalyNotification(...)
}
```

### SendGrid API Integration

Der Service nutzt die SendGrid v3 API:
- Endpoint: `https://api.sendgrid.com/v3/mail/send`
- Authentifizierung: Bearer Token (API-Schlüssel)
- Content: Text und HTML versions
- Fehlerbehandlung: Detaillierte Fehlermeldungen

### Sicherheit

- API-Schlüssel werden mit Spark KV sicher gespeichert
- Keine Klartext-Speicherung in lokalem Storage
- Verbindungstests validieren Credentials vor dem Speichern
