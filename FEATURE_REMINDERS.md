# Reminder System Documentation

## Overview

The reminder system provides opt-in notifications to help employees maintain complete time tracking records. It includes three types of reminders:

1. **Daily Under-Hours Reminder**: Notifies when daily target hours haven't been met
2. **Weekly Under-Hours Reminder**: Notifies when weekly target hours are below threshold
3. **Week Completion Check**: Reminds to review and complete time entries at week-end

## Features

### Reminder Types

#### Daily Under-Hours Reminder
- **Trigger**: Configurable daily time (e.g., 17:00)
- **Condition**: Actual hours < target hours for the day
- **Customization**: 
  - Enable/disable
  - Set target hours (e.g., 8h)
  - Choose notification channels (in-app, email, push)
  - Set reminder time

#### Weekly Under-Hours Reminder
- **Trigger**: Configurable day and time (e.g., Friday 16:00)
- **Condition**: Actual hours < target hours for the week
- **Customization**:
  - Enable/disable
  - Set target hours (e.g., 40h)
  - Choose day of week
  - Choose notification channels
  - Set reminder time

#### Week Completion Check
- **Trigger**: Configurable day and time (e.g., Friday 17:00)
- **Condition**: Missing days OR hours below target
- **Customization**:
  - Enable/disable
  - Choose day of week
  - Choose notification channels
  - Set reminder time

### Notification Channels

1. **In-App**: Visual notifications displayed in the application
2. **Email**: Sent via configured email service (SendGrid, etc.)
3. **Push**: Browser push notifications (future implementation)

### Smart Detection

- **Working Days Only**: Only checks Monday-Friday
- **Respects Absences**: Excludes vacation, sick days, holidays from calculations
- **Gap Detection**: Identifies missing time entry days
- **Real-time Updates**: Notifications refresh as time entries are added

## Architecture

### Components

1. **ReminderService** (`lib/reminder-service.ts`)
   - Core business logic for reminders
   - Calculates daily/weekly hours
   - Checks reminder conditions
   - Sends notifications via email

2. **useReminderSettings** (`hooks/use-reminder-settings.ts`)
   - React hook for managing reminder settings
   - Persists settings to KV store per employee

3. **useReminderProcessor** (`hooks/use-reminder-processor.ts`)
   - Background processor that checks and triggers reminders
   - Runs every minute
   - Prevents duplicate notifications

4. **ReminderSettingsScreen** (`components/ReminderSettingsScreen.tsx`)
   - UI for configuring reminder preferences
   - Per-employee settings

5. **ReminderNotificationDisplay** (`components/ReminderNotificationDisplay.tsx`)
   - Shows active reminders with actionable CTAs
   - Dismissible notifications
   - Animated display

6. **ReminderTestScreen** (`components/ReminderTestScreen.tsx`)
   - Test interface for simulating reminders
   - Useful for setup and debugging

### Data Flow

```
User configures settings
    ↓
Settings stored in KV (useReminderSettings)
    ↓
useReminderProcessor runs in background
    ↓
ReminderService checks conditions
    ↓
If triggered → Send email (if configured)
    ↓
ReminderNotificationDisplay shows in-app notification
    ↓
User can dismiss or take action
```

### Storage

All reminder data is stored in the Spark KV store:

- **Settings**: `reminder-settings-{employeeId}`
- **Dismissed Reminders**: `dismissed-reminders-{employeeId}-{date}`
- **Last Check**: `reminder-last-checked-{employeeId}`

## Usage

### For Employees

1. Navigate to **Admin → Mitarbeiter-Einstellungen**
2. Select your name from the dropdown
3. Go to **Erinnerungen** tab
4. Configure each reminder type:
   - Toggle enabled/disabled
   - Set target hours
   - Choose notification channels
   - Set time and day preferences
5. Test reminders in **Erinnerungen Testen** tab

### For Administrators

1. Access **Admin → Mitarbeiter-Einstellungen**
2. Select employee to configure
3. Adjust reminder settings for that employee
4. Use test screen to verify functionality

### Email Configuration

For email notifications to work:

1. Go to **Admin → E-Mail-Konfiguration**
2. Select provider (SendGrid)
3. Enter API key
4. Test connection
5. Save configuration

## Email Templates

### Daily Under-Hours
```
Subject: ⏰ Tägliche Stunden-Erinnerung
Body: Du hast heute X von Y Sollstunden erfasst. Noch Z Stunden fehlen.
```

### Weekly Under-Hours
```
Subject: 📅 Wöchentliche Stunden-Erinnerung
Body: Diese Woche hast du X von Y Sollstunden erfasst. Noch Z Stunden fehlen.
Includes: List of missing days
```

### Week Completion Check
```
Subject: ✅ Wochenabschluss-Check
Body: Zeit für deinen Wochenabschluss. X/Y Stunden erfasst.
Includes: Missing days if any
```

## API Reference

### ReminderService

```typescript
// Check if daily reminder should trigger
ReminderService.checkDailyReminder(
  employee: Employee,
  timeEntries: TimeEntry[],
  settings: ReminderSettings,
  date?: string
): ReminderCheck

// Check if weekly reminder should trigger
ReminderService.checkWeeklyReminder(
  employee: Employee,
  timeEntries: TimeEntry[],
  absences: Absence[],
  settings: ReminderSettings,
  date?: Date
): ReminderCheck

// Check if week completion reminder should trigger
ReminderService.checkWeekCompletion(
  employee: Employee,
  timeEntries: TimeEntry[],
  absences: Absence[],
  settings: ReminderSettings,
  date?: Date
): ReminderCheck

// Send notification
ReminderService.sendReminderNotification(
  check: ReminderCheck,
  employee: Employee,
  settings: ReminderSettings
): Promise<boolean>
```

### useReminderSettings Hook

```typescript
const {
  settings,
  updateDailyReminder,
  updateWeeklyReminder,
  updateWeekCompletion,
  toggleDailyReminder,
  toggleWeeklyReminder,
  toggleWeekCompletion
} = useReminderSettings(employeeId)
```

## Best Practices

1. **Start with In-App Only**: Test with in-app notifications before enabling email
2. **Conservative Thresholds**: Set realistic target hours to avoid notification fatigue
3. **End-of-Day Timing**: Schedule daily reminders for end of workday (17:00-18:00)
4. **Friday Week Checks**: Default to Friday afternoon for week completion
5. **Test Before Enabling**: Use test screen to verify behavior
6. **Email Service Required**: Configure email service for email channel to work

## Future Enhancements

- [ ] Browser push notifications
- [ ] SMS notifications
- [ ] Slack/Teams integration
- [ ] Custom message templates
- [ ] Multi-language support
- [ ] Reminder history/analytics
- [ ] Snooze functionality
- [ ] Smart scheduling (ML-based timing)
- [ ] Team-wide reminder policies
- [ ] Escalation rules

## Troubleshooting

### Reminders Not Showing

1. Check if reminder is enabled in settings
2. Verify target hours are set correctly
3. Check if hours already meet threshold
4. Ensure time entries are saved
5. Look in browser console for errors

### Email Not Sending

1. Verify email configuration in Admin panel
2. Test email connection
3. Check employee has email address set
4. Ensure email channel is enabled
5. Check console for email service errors

### Wrong Calculations

1. Verify time entries have correct dates
2. Check absence records are properly set
3. Ensure working days are Monday-Friday
4. Test with ReminderTestScreen to debug

## Security & Privacy

- All reminder settings are per-employee and private
- No sharing of reminder data between employees
- Email notifications respect GDPR compliance
- All data stored in encrypted KV store
- Users can opt-out anytime by disabling reminders
