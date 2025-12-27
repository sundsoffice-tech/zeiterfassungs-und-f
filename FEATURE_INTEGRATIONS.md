# Integrationen - Integration Management

## Überblick

Das Integrationen-Modul ermöglicht die nahtlose Verbindung der Zeiterfassungsanwendung mit externen Tools und Diensten. Alle für eine "weltklasse" App erforderlichen Integrationen sind verfügbar und können zentral im Admin-Bereich verwaltet werden.

## Integration-Kategorien

### 📅 Kalender
- **Google Calendar**: Bidirektionale Synchronisation von Zeiteinträgen und Kalenderereignissen
- **Outlook Calendar**: Integration mit Microsoft 365/Outlook Kalendern
- **iCal / CalDAV**: Import von iCal-Feeds (nur lesend)

**Anwendungsfälle:**
- Automatische Zeitbuchungen basierend auf Kalenderterminen
- Synchronisation von Meetings als Zeiteinträge
- Visualisierung von Arbeitsstunden im Kalender

### 🗂️ PM-Tools (Projektmanagement)
- **Jira**: Synchronisation von Projekten, Epics, und Tickets
- **Asana**: Import von Workspaces, Projekten und Tasks
- **Trello**: Boards und Karten als Projekte/Aufgaben
- **Monday.com**: Board-basierte Projektsynchronisation
- **ClickUp**: Spaces, Folders und Tasks importieren

**Anwendungsfälle:**
- Automatischer Import von Projekten und Aufgaben
- Zeitbuchung direkt auf PM-Tool-Tickets
- Bidirektionale Synchronisation von Zeitaufwänden

### 💬 Kommunikation
- **Microsoft Teams**: Benachrichtigungen an Team-Channels
- **Slack**: Webhook-basierte Updates und Notifications

**Anwendungsfälle:**
- Automatische Benachrichtigungen bei Genehmigungen
- Erinnerungen für fehlende Zeiteinträge
- Status-Updates zu Projekten

### 💰 Accounting (Buchhaltung)
- **DATEV**: Export im DATEV-Format (CSV/XML)
- **Lexware**: Export für Lexware-kompatible Formate
- **sevDesk**: API-Integration für direkte Datensynchronisation

**Anwendungsfälle:**
- Automatischer Export für Lohnbuchhaltung
- Rechnungserstellung basierend auf Zeiteinträgen
- DATEV-konforme Dokumentation

### 🔐 SSO (Single Sign-On)
- **Microsoft Entra ID** (Azure AD): Enterprise SSO für Microsoft 365
- **Google Workspace**: SSO für Google-basierte Unternehmen
- **SAML 2.0**: Generische SAML-Integration
- **OpenID Connect**: Standard OIDC-Protokoll

**Anwendungsfälle:**
- Zentrale Benutzerverwaltung
- Sicherer Zugang ohne separate Passwörter
- Compliance mit Unternehmensrichtlinien

### 🔗 Webhooks/API
- **Custom Webhooks**: Eigene Endpunkte für Events
- **Unterstützte Events:**
  - `time_entry.created`
  - `time_entry.updated`
  - `time_entry.approved`
  - `project.created`
  - `project.updated`
  - `employee.created`
  - `employee.updated`

**Anwendungsfälle:**
- Integration mit eigenen Systemen
- Automatisierung von Workflows
- Daten-Pipelines und Analytics

### 📱 MDM (Mobile Device Management)
- **Unterstützte Provider:**
  - Microsoft Intune
  - Jamf Pro
  - MobileIron
  - VMware Workspace ONE

**Anwendungsfälle:**
- Verwaltung von Firmenhandys
- Erzwingung von Sicherheitsrichtlinien
- Gerätebasierte Zugriffskontrolle

## Integration hinzufügen

### Schritt 1: Admin-Bereich öffnen
1. Navigiere zum **Admin**-Tab in der Hauptnavigation
2. Wähle den **Integrationen**-Reiter
3. Wähle die passende Kategorie (z.B. "Kalender", "PM-Tools")

### Schritt 2: Integration auswählen
1. Klicke auf **Hinzufügen** bei der gewünschten Integration
2. Ein Konfigurationsdialog öffnet sich

### Schritt 3: Credentials eingeben
Jedes Feld zeigt:
- **Label**: Bezeichnung des Feldes (z.B. "Client ID")
- **Hilfetext**: Erklärung, was eingetragen werden muss
- **Resource Link**: Direkter Link zur Credential-Quelle (z.B. Google Console, Azure Portal)

**Beispiel: Google Calendar**
```
Client ID: your-app.apps.googleusercontent.com
Client Secret: ••••••••••••••••
Sync Direction: Two-way (Bidirectional)

📎 Credentials hier erhalten → https://console.cloud.google.com/apis/credentials
```

### Schritt 4: Speichern und Aktivieren
1. Klicke **Hinzufügen** zum Speichern
2. Toggle den Schalter auf **Aktiviert**
3. Die Integration ist nun aktiv

## Integration verwalten

### Status-Indikatoren
- **Aktiv** (Grün): Integration läuft und synchronisiert erfolgreich
- **Fehler** (Rot): Letzter Sync fehlgeschlagen, Fehlermeldung anzeigen
- **Konfiguriert** (Blau): Eingerichtet, aber noch nicht aktiviert
- **Deaktiviert** (Grau): Integration pausiert

### Aktionen
- **Bearbeiten**: Credentials oder Einstellungen ändern
- **Löschen**: Integration vollständig entfernen
- **Toggle**: Schnell aktivieren/deaktivieren

### Sync-Informationen
Jede Integration zeigt:
- **Letzte Sync**: Zeitpunkt der letzten erfolgreichen Synchronisation
- **Status**: Aktueller Verbindungsstatus
- **Fehler**: Fehlermeldung bei Problemen

## Credential-Management

### Sicherheit
- Alle API-Keys, Secrets und Tokens werden **verschlüsselt** gespeichert
- Credentials sind nur für Administratoren sichtbar
- HTTPS/TLS für alle API-Verbindungen

### Wo finde ich Credentials?

#### Google Calendar / Google Workspace
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Erstelle ein neues OAuth 2.0 Client-ID Projekt
3. Füge Redirect URI hinzu: `https://your-app.com/oauth/google`
4. Kopiere Client-ID und Client-Secret

#### Microsoft Entra ID / Outlook
1. Öffne [Azure Portal - App Registrierungen](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Registriere neue Anwendung
3. Erstelle ein Client-Secret unter "Certificates & secrets"
4. Notiere Application (client) ID und Tenant ID

#### Jira
1. Gehe zu [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Erstelle neuen API-Token
3. Verwende deine Jira-Domain (z.B. `firma.atlassian.net`)

#### DATEV
- Konfiguriere Beraternummer und Mandantennummer
- Wähle Exportformat (CSV oder XML)
- Keine API-Keys erforderlich (Export-basiert)

## Pflichtintegrationen für "beste App"

Folgende Integrationen sind als **Pflicht** markiert:
- ✅ Mindestens eine **Kalender**-Integration (Google/Outlook/iCal)
- ✅ Mindestens ein **PM-Tool** (Jira/Asana/Trello/Monday/ClickUp)
- ✅ Mindestens eine **Kommunikations**-Plattform (Teams/Slack)
- ✅ Mindestens eine **Accounting**-Integration (DATEV/Lexware/sevDesk)
- ✅ **SSO** für Enterprise-Kunden (Entra ID/Google Workspace/SAML/OIDC)
- ✅ **Webhooks** für API-basierte Integrationen
- ✅ **MDM-Kompatibilität** für Firmenhandys

Diese sind mit einem **"Pflicht für beste App"**-Badge gekennzeichnet.

## Fehlerbehandlung

### Häufige Probleme

**Problem: "Invalid credentials"**
- Lösung: Überprüfe Client-ID und Secret auf Tippfehler
- Stelle sicher, dass Credentials nicht abgelaufen sind
- Prüfe, ob Redirect URIs korrekt konfiguriert sind

**Problem: "Rate limit exceeded"**
- Lösung: Reduziere Sync-Intervall
- Warte einige Minuten und versuche erneut
- Kontaktiere API-Provider für höhere Limits

**Problem: "Connection timeout"**
- Lösung: Überprüfe Firewall-Einstellungen
- Stelle sicher, dass API-Endpunkt erreichbar ist
- Prüfe Netzwerkverbindung

**Problem: "Scope permission denied"**
- Lösung: Stelle sicher, dass OAuth-App die richtigen Permissions hat
- Neuautorisierung durchführen
- Admin-Consent einholen (bei Enterprise SSO)

### Support
Bei Problemen:
1. Prüfe Fehlermeldung in der Integration-Karte
2. Schaue in die Dokumentation des Drittanbieters
3. Teste Credentials direkt beim Anbieter
4. Kontaktiere Support mit Fehlercode

## Best Practices

### Sicherheit
- ✅ Verwende dedizierte Service-Accounts für Integrationen
- ✅ Setze minimale Permissions (Principle of Least Privilege)
- ✅ Rotiere Credentials regelmäßig
- ✅ Deaktiviere ungenutzte Integrationen

### Performance
- ✅ Konfiguriere sinnvolle Sync-Intervalle (nicht zu häufig)
- ✅ Nutze One-Way Sync wenn Bidirektional nicht nötig
- ✅ Filtere unnötige Daten beim Import

### Compliance
- ✅ Dokumentiere alle aktiven Integrationen
- ✅ Informiere Mitarbeiter über Datenflüsse
- ✅ Prüfe DSGVO-Konformität der Drittanbieter
- ✅ Führe regelmäßige Security Audits durch

## API-Dokumentation

### Webhook-Payload-Format

Alle Webhooks senden JSON-Payloads im folgenden Format:

```json
{
  "event": "time_entry.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": "tenant-123",
  "data": {
    "id": "te-456",
    "employee_id": "emp-789",
    "project_id": "proj-012",
    "duration": 120,
    "billable": true,
    "date": "2024-01-15"
  },
  "signature": "sha256=abc123..." 
}
```

### HMAC-Signatur verifizieren

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

## Roadmap

Geplante Integrationen:
- [ ] Notion
- [ ] Linear
- [ ] GitHub Projects
- [ ] Basecamp
- [ ] Wrike
- [ ] Smartsheet
- [ ] QuickBooks
- [ ] Xero
- [ ] FreshBooks

## Changelog

### v1.0 (Initial Release)
- ✅ 16 Integrationen in 7 Kategorien
- ✅ Kalender: Google, Outlook, iCal
- ✅ PM-Tools: Jira, Asana, Trello, Monday, ClickUp
- ✅ Kommunikation: Teams, Slack
- ✅ Accounting: DATEV, Lexware, sevDesk
- ✅ SSO: Entra ID, Google Workspace, SAML, OIDC
- ✅ Webhooks und MDM-Support
- ✅ Sichere Credential-Verwaltung
- ✅ Status-Tracking und Fehlerbehandlung
