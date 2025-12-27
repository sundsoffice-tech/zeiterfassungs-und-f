# Real Email Service Integration

This document describes the integration of real email services (SendGrid) into the Zeiterfassung application for sending anomaly notifications to employees.

## Overview

The application now supports sending **real emails** via SendGrid API, with a fallback simulation mode for development and testing. Employees receive beautifully formatted HTML emails when time tracking anomalies are detected.

## Features

### 1. Email Service Provider Support

- **SendGrid Integration**: Full integration with SendGrid v3 API for production email delivery
- **Simulation Mode**: Development-friendly mode that logs emails to console without sending
- **Provider Abstraction**: Clean service layer that makes it easy to add more providers (AWS SES, Mailgun, etc.)

### 2. Email Configuration UI

Located at **Admin → E-Mail-Konfiguration**, administrators can:

- Choose between SendGrid and Simulation mode
- Configure API credentials securely
- Set sender email and name
- Test connection to validate configuration
- View configuration status (Configured/Simulated)

### 3. Secure Credential Storage

- API keys stored securely using Spark KV system
- No plaintext storage in localStorage
- Automatic initialization on app startup
- Configuration persists between sessions

### 4. Rich Email Content

Anomaly notification emails include:

- **Professional HTML Layout**: Responsive design with branded styling
- **Summary Section**: Quick overview of gaps, overtime, and affected days
- **Detailed Issues**: Each anomaly with date, type, description, and action items
- **Priority Badges**: Visual indicators for high/medium severity issues
- **Call-to-Action**: Direct link back to the app to fix issues
- **Plain Text Alternative**: Accessible fallback for all email clients

### 5. Smart Notification Center

The **Admin → Benachrichtigungen** screen shows:

- Configuration status indicator (Configured/Simulated)
- Count of employees with anomalies
- List of affected employees with anomaly details
- Send to all or individual employees
- Notification history with status tracking
- Warning when email service is not configured

## Setup Guide

### SendGrid Setup (Free Tier)

1. **Create Account**
   - Visit [sendgrid.com](https://sendgrid.com) and sign up
   - Free tier includes 100 emails/day (sufficient for most use cases)

2. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email address and complete verification
   - This email will be used as the "From" address

3. **Create API Key**
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "Zeiterfassung Production")
   - Choose "Restricted Access" and enable "Mail Send" permission (recommended)
   - Or choose "Full Access" for simplicity
   - **Important**: Copy the API key immediately (shown only once!)

4. **Configure in App**
   - Open the app and navigate to **Admin → E-Mail-Konfiguration**
   - Select "SendGrid" as provider
   - Paste your API key
   - Enter your verified sender email
   - Set sender name (e.g., "Zeiterfassung")
   - Click "Verbindung testen" to validate
   - Click "Konfiguration speichern"

5. **Test the Integration**
   - Add a test employee with a real email address
   - Create some time entries with gaps or anomalies
   - Go to **Admin → Benachrichtigungen**
   - Click "Senden" for the test employee
   - Check the employee's inbox for the notification

## Architecture

### Service Layer

```typescript
// Email Service (Provider Abstraction)
src/lib/email-service.ts
- EmailService class: Handles actual sending
- Supports SendGrid with easy extensibility
- Connection testing and validation
- Fallback to simulation mode

// Notification Service (Business Logic)
src/lib/email-notifications.ts
- EmailNotificationService class: Notification logic
- Email content generation (text + HTML)
- Preference checking and filtering
- Integration with anomaly detection
```

### UI Components

```typescript
// Configuration
src/components/EmailConfigScreen.tsx
- Provider selection (SendGrid/Simulated)
- API key management
- Connection testing
- Save and validate configuration

// Notification Management
src/components/AnomalyNotificationCenter.tsx
- Shows configuration status
- List employees with anomalies
- Send notifications (bulk or individual)
- View notification history
```

### Data Flow

1. **Initialization**: App loads email config from KV storage
2. **Configuration**: Admin sets up SendGrid in EmailConfigScreen
3. **Detection**: System detects anomalies in time tracking
4. **Notification**: Admin triggers email send from AnomalyNotificationCenter
5. **Processing**: EmailNotificationService checks preferences and generates content
6. **Sending**: EmailService sends via SendGrid API or simulates
7. **Tracking**: Results stored in notification history

## API Integration

### SendGrid v3 API

**Endpoint**: `POST https://api.sendgrid.com/v3/mail/send`

**Authentication**:
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Payload**:
```json
{
  "personalizations": [
    {
      "to": [{ "email": "employee@example.com" }],
      "subject": "⚠️ Zeiterfassung: Anomalien erkannt"
    }
  ],
  "from": {
    "email": "noreply@your-domain.com",
    "name": "Zeiterfassung"
  },
  "content": [
    {
      "type": "text/plain",
      "value": "Plain text email content..."
    },
    {
      "type": "text/html",
      "value": "<html>HTML email content...</html>"
    }
  ]
}
```

**Response**:
- Success: `202 Accepted` with `X-Message-Id` header
- Error: `4xx` or `5xx` with error details in JSON

## Email Content Structure

### HTML Email Features

- **Responsive Design**: Mobile-friendly layout
- **Branded Header**: App logo and title
- **Color-Coded Priority**: Red (high), Yellow (medium)
- **Issue Cards**: Rounded corners, proper spacing, clear typography
- **Action Button**: Prominent CTA to fix issues
- **Footer**: Auto-generated notice and contact info

### Email Variables

```typescript
// Content Generation
generateAnomalyEmailSubject(): string
generateAnomalyEmailBody(): string (plain text)
generateAnomalyEmailHtml(): string (HTML)
```

### Customization

To customize email appearance, edit these functions in `src/lib/email-notifications.ts`:

- **Styling**: Modify inline CSS in `generateAnomalyEmailHtml()`
- **Content**: Adjust text in both body and HTML generation functions
- **Layout**: Change HTML structure in HTML generation function

## Security Considerations

### API Key Storage

- Stored in Spark KV (browser IndexedDB)
- Not transmitted to external servers (except SendGrid)
- Encrypted at rest by browser
- Scoped to user session

### Best Practices

1. **Use Restricted API Keys**: Only grant "Mail Send" permission
2. **Verify Sender Domain**: Use domain authentication for production
3. **Rate Limiting**: SendGrid free tier = 100 emails/day
4. **Error Handling**: All API errors caught and logged
5. **Test Before Production**: Always test with simulation mode first

## Development

### Adding New Email Providers

To add AWS SES, Mailgun, or other providers:

1. Update `EmailConfig` type in `email-service.ts`:
   ```typescript
   provider: 'sendgrid' | 'aws-ses' | 'mailgun' | 'none'
   ```

2. Add new send method in `EmailService`:
   ```typescript
   private async sendWithAWSSES(params: SendEmailParams): Promise<SendEmailResult> {
     // Implementation
   }
   ```

3. Update `send()` method to route to new provider:
   ```typescript
   async send(params: SendEmailParams): Promise<SendEmailResult> {
     if (this.config.provider === 'aws-ses') {
       return this.sendWithAWSSES(params)
     }
     // ... other providers
   }
   ```

4. Add configuration UI in `EmailConfigScreen.tsx`

### Testing

```typescript
// Test connection
const result = await EmailService.testConnection(config)
console.log(result.valid) // true if API key is valid

// Send test email
const emailService = new EmailService(config)
const result = await emailService.send({
  to: 'test@example.com',
  subject: 'Test Email',
  textContent: 'This is a test',
  htmlContent: '<p>This is a test</p>'
})
```

## Troubleshooting

### Common Issues

**"Invalid API key" error**
- Verify the API key was copied completely
- Check that the key has "Mail Send" permission
- Try creating a new API key

**"Sender email not verified" error**
- Complete Single Sender Verification in SendGrid
- Wait a few minutes after verification
- Check spam folder for verification email

**Emails not arriving**
- Check recipient's spam/junk folder
- Verify SendGrid account is not suspended
- Check SendGrid Activity Feed for delivery status
- Ensure you haven't exceeded rate limits (100/day free tier)

**"Connection failed" error**
- Check internet connectivity
- Verify SendGrid API is accessible (not blocked by firewall)
- Try testing connection again

### Debug Mode

Enable debug output in console:

```typescript
// In browser console
localStorage.setItem('debug-email', 'true')
```

This will log all email operations to the console.

## Future Enhancements

Planned features:

- [ ] AWS SES integration
- [ ] Mailgun integration  
- [ ] Email templates with custom branding
- [ ] Schedule daily/weekly digests
- [ ] Email tracking (opens, clicks)
- [ ] Multi-language support
- [ ] Unsubscribe links
- [ ] Attachment support (PDF reports)
- [ ] Batch sending optimization
- [ ] Retry logic for failed sends

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid v3 API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [SendGrid Free Tier Details](https://sendgrid.com/pricing/)
- [Email Design Best Practices](https://www.emailonacid.com/blog/article/email-development/email-development-best-practices-2/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review SendGrid documentation
3. Check browser console for errors
4. Test with simulation mode to isolate issues
5. Verify employee email addresses are correct

---

**Last Updated**: Integration completed in iteration 5
**Status**: Production-ready with SendGrid support
