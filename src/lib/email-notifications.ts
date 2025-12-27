import { Employee } from './types'
import { GapOvertimeAnalysis, GapOvertimeIssue, GapOvertimeType, Severity } from './gap-overtime-detection'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY_DIGEST = 'daily_digest',
  WEEKLY_DIGEST = 'weekly_digest',
  DISABLED = 'disabled'
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app'
}

export interface NotificationPreferences {
  employeeId: string
  anomalyDetection: {
    enabled: boolean
    frequency: NotificationFrequency
    channels: NotificationChannel[]
    severityThreshold: Severity
  }
  reminderNotifications: {
    enabled: boolean
    channels: NotificationChannel[]
  }
  approvalNotifications: {
    enabled: boolean
    channels: NotificationChannel[]
  }
}

export interface EmailNotification {
  id: string
  to: string
  subject: string
  body: string
  htmlBody?: string
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
  error?: string
}

export interface NotificationLog {
  id: string
  employeeId: string
  type: 'anomaly' | 'reminder' | 'approval'
  sentAt: string
  channel: NotificationChannel
  content: string
  read: boolean
}

export class EmailNotificationService {
  static getDefaultPreferences(employeeId: string): NotificationPreferences {
    return {
      employeeId,
      anomalyDetection: {
        enabled: true,
        frequency: NotificationFrequency.IMMEDIATE,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        severityThreshold: Severity.MEDIUM
      },
      reminderNotifications: {
        enabled: true,
        channels: [NotificationChannel.IN_APP]
      },
      approvalNotifications: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
      }
    }
  }

  static shouldSendAnomalyNotification(
    analysis: GapOvertimeAnalysis,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.anomalyDetection.enabled) {
      return false
    }

    const severityOrder = { low: 0, medium: 1, high: 2 }
    const threshold = severityOrder[preferences.anomalyDetection.severityThreshold]

    const hasRelevantIssues = analysis.issues.some(
      (issue) => severityOrder[issue.severity] >= threshold
    )

    return hasRelevantIssues
  }

  static generateAnomalyEmailSubject(analysis: GapOvertimeAnalysis, employee: Employee): string {
    const { summary } = analysis

    if (summary.totalGaps > 0 && summary.totalOvertime > 0) {
      return `⚠️ Zeiterfassung: ${summary.totalGaps} Lücken und ${summary.totalOvertime} Überstunden erkannt`
    } else if (summary.totalGaps > 0) {
      return `⚠️ Zeiterfassung: ${summary.totalGaps} Lücke${summary.totalGaps > 1 ? 'n' : ''} erkannt`
    } else if (summary.totalOvertime > 0) {
      return `⚠️ Zeiterfassung: ${summary.totalOvertime} Tag${summary.totalOvertime > 1 ? 'e' : ''} mit Überstunden`
    }

    return '⚠️ Zeiterfassung: Anomalien erkannt'
  }

  static generateAnomalyEmailBody(
    analysis: GapOvertimeAnalysis,
    employee: Employee,
    appUrl: string = window.location.origin
  ): string {
    const { issues, summary } = analysis

    let body = `Hallo ${employee.name},\n\n`
    body += `wir haben Anomalien in Ihrer Zeiterfassung der letzten 7 Tage festgestellt:\n\n`

    body += `📊 ZUSAMMENFASSUNG\n`
    body += `─────────────────\n`
    if (summary.totalGaps > 0) {
      body += `• ${summary.totalGaps} Lücke${summary.totalGaps > 1 ? 'n' : ''} (${summary.totalMissingHours.toFixed(1)} Stunden fehlen)\n`
    }
    if (summary.totalOvertime > 0) {
      body += `• ${summary.totalOvertime} Tag${summary.totalOvertime > 1 ? 'e' : ''} mit Überstunden (${summary.totalExcessHours.toFixed(1)} Stunden mehr)\n`
    }
    body += `• ${summary.affectedDays} betroffene Tag${summary.affectedDays > 1 ? 'e' : ''}\n\n`

    const highSeverityIssues = issues.filter((i) => i.severity === Severity.HIGH)
    const mediumSeverityIssues = issues.filter((i) => i.severity === Severity.MEDIUM)

    if (highSeverityIssues.length > 0) {
      body += `🔴 DRINGEND (${highSeverityIssues.length})\n`
      body += `─────────────────\n`
      highSeverityIssues.forEach((issue) => {
        body += this.formatIssueForEmail(issue)
      })
      body += `\n`
    }

    if (mediumSeverityIssues.length > 0) {
      body += `🟡 MITTLERE PRIORITÄT (${mediumSeverityIssues.length})\n`
      body += `─────────────────\n`
      mediumSeverityIssues.forEach((issue) => {
        body += this.formatIssueForEmail(issue)
      })
      body += `\n`
    }

    body += `\n💡 NÄCHSTE SCHRITTE\n`
    body += `─────────────────\n`
    body += `Bitte ergänzen Sie Ihre Zeiteinträge, um Ihre Zeiterfassung zu vervollständigen.\n\n`
    body += `👉 Jetzt ergänzen: ${appUrl}\n\n`

    body += `─────────────────\n`
    body += `Diese E-Mail wurde automatisch generiert.\n`
    body += `Bei Fragen wenden Sie sich bitte an Ihren Administrator.\n`

    return body
  }

  static generateAnomalyEmailHtml(
    analysis: GapOvertimeAnalysis,
    employee: Employee,
    appUrl: string = window.location.origin
  ): string {
    const { issues, summary } = analysis

    const highSeverityIssues = issues.filter((i) => i.severity === Severity.HIGH)
    const mediumSeverityIssues = issues.filter((i) => i.severity === Severity.MEDIUM)

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e8965a; }
    .header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
    .header p { margin: 10px 0 0; color: #7f8c8d; font-size: 14px; }
    .summary { background: #fff9f5; border-left: 4px solid #e8965a; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .summary h2 { margin: 0 0 15px; font-size: 18px; color: #2c3e50; }
    .stat { display: flex; align-items: center; margin: 8px 0; font-size: 14px; }
    .stat-icon { margin-right: 10px; font-size: 18px; }
    .issues-section { margin: 30px 0; }
    .issues-section h3 { font-size: 16px; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .issue { background: #f9f9f9; border-radius: 6px; padding: 15px; margin-bottom: 12px; border-left: 4px solid #e8965a; }
    .issue.high { border-left-color: #e74c3c; background: #fef5f5; }
    .issue.medium { border-left-color: #f39c12; background: #fefaf5; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .issue-title { font-weight: 600; font-size: 15px; color: #2c3e50; }
    .issue-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-high { background: #e74c3c; color: white; }
    .badge-medium { background: #f39c12; color: white; }
    .issue-date { color: #7f8c8d; font-size: 13px; margin-bottom: 8px; }
    .issue-description { color: #555; font-size: 14px; margin-bottom: 10px; }
    .issue-details { display: flex; gap: 15px; font-size: 12px; color: #7f8c8d; margin-bottom: 10px; }
    .issue-action { background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 13px; color: #555; }
    .action-button { display: inline-block; background: #e8965a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; }
    .action-button:hover { background: #d68549; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Zeiterfassungs-Anomalien</h1>
      <p>Erkannt am ${format(new Date(), 'dd. MMMM yyyy', { locale: de })}</p>
    </div>

    <p>Hallo ${employee.name},</p>
    <p>wir haben Anomalien in Ihrer Zeiterfassung der letzten 7 Tage festgestellt:</p>

    <div class="summary">
      <h2>📊 Zusammenfassung</h2>
      ${summary.totalGaps > 0 ? `
      <div class="stat">
        <span class="stat-icon">🔴</span>
        <span><strong>${summary.totalGaps}</strong> Lücke${summary.totalGaps > 1 ? 'n' : ''} (${summary.totalMissingHours.toFixed(1)} Stunden fehlen)</span>
      </div>` : ''}
      ${summary.totalOvertime > 0 ? `
      <div class="stat">
        <span class="stat-icon">🟡</span>
        <span><strong>${summary.totalOvertime}</strong> Tag${summary.totalOvertime > 1 ? 'e' : ''} mit Überstunden (${summary.totalExcessHours.toFixed(1)} Stunden mehr)</span>
      </div>` : ''}
      <div class="stat">
        <span class="stat-icon">📅</span>
        <span><strong>${summary.affectedDays}</strong> betroffene Tag${summary.affectedDays > 1 ? 'e' : ''}</span>
      </div>
    </div>

    ${highSeverityIssues.length > 0 ? `
    <div class="issues-section">
      <h3>🔴 Dringend (${highSeverityIssues.length})</h3>
      ${highSeverityIssues.map((issue) => this.formatIssueForHtmlEmail(issue, 'high')).join('')}
    </div>` : ''}

    ${mediumSeverityIssues.length > 0 ? `
    <div class="issues-section">
      <h3>🟡 Mittlere Priorität (${mediumSeverityIssues.length})</h3>
      ${mediumSeverityIssues.map((issue) => this.formatIssueForHtmlEmail(issue, 'medium')).join('')}
    </div>` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}" class="action-button">
        Jetzt Zeiteinträge ergänzen →
      </a>
    </div>

    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert.</p>
      <p>Bei Fragen wenden Sie sich bitte an Ihren Administrator.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  private static formatIssueForEmail(issue: GapOvertimeIssue): string {
    const dateStr = format(parseISO(issue.date), 'EEEE, dd. MMMM yyyy', { locale: de })
    let text = `• ${dateStr}\n`
    text += `  ${issue.title}: ${issue.description}\n`
    text += `  Erwartet: ${issue.expectedHours}h | Erfasst: ${issue.actualHours.toFixed(1)}h | Differenz: ${issue.difference > 0 ? '+' : ''}${issue.difference.toFixed(1)}h\n`
    text += `  💡 ${issue.suggestedAction}\n\n`
    return text
  }

  private static formatIssueForHtmlEmail(issue: GapOvertimeIssue, severity: string): string {
    const dateStr = format(parseISO(issue.date), 'EEEE, dd. MMMM yyyy', { locale: de })
    const badgeClass = severity === 'high' ? 'badge-high' : 'badge-medium'
    
    return `
      <div class="issue ${severity}">
        <div class="issue-header">
          <div class="issue-title">${issue.title}</div>
          <span class="issue-badge ${badgeClass}">${this.getTypeLabel(issue.type)}</span>
        </div>
        <div class="issue-date">${dateStr}</div>
        <div class="issue-description">${issue.description}</div>
        <div class="issue-details">
          <span>Erwartet: <strong>${issue.expectedHours}h</strong></span>
          <span>Erfasst: <strong>${issue.actualHours.toFixed(1)}h</strong></span>
          <span>Differenz: <strong>${issue.difference > 0 ? '+' : ''}${issue.difference.toFixed(1)}h</strong></span>
        </div>
        <div class="issue-action">💡 ${issue.suggestedAction}</div>
      </div>
    `
  }

  private static getTypeLabel(type: GapOvertimeType): string {
    switch (type) {
      case GapOvertimeType.MISSING_HOURS:
        return 'Fehlende Stunden'
      case GapOvertimeType.NO_ENTRIES:
        return 'Keine Einträge'
      case GapOvertimeType.OVERTIME:
        return 'Überstunden'
      case GapOvertimeType.WEEKEND_WORK:
        return 'Wochenendarbeit'
      default:
        return 'Anomalie'
    }
  }

  static async simulateSendEmail(notification: EmailNotification): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    console.log('📧 EMAIL SENT')
    console.log('─────────────')
    console.log('To:', notification.to)
    console.log('Subject:', notification.subject)
    console.log('\nBody:\n', notification.body)
    console.log('─────────────')
  }

  static createNotification(
    employee: Employee,
    analysis: GapOvertimeAnalysis,
    appUrl?: string
  ): EmailNotification {
    if (!employee.email) {
      throw new Error(`Employee ${employee.name} has no email address`)
    }

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: employee.email,
      subject: this.generateAnomalyEmailSubject(analysis, employee),
      body: this.generateAnomalyEmailBody(analysis, employee, appUrl),
      htmlBody: this.generateAnomalyEmailHtml(analysis, employee, appUrl),
      status: 'pending'
    }
  }

  static async sendAnomalyNotification(
    employee: Employee,
    analysis: GapOvertimeAnalysis,
    preferences: NotificationPreferences,
    appUrl?: string
  ): Promise<EmailNotification | null> {
    if (!this.shouldSendAnomalyNotification(analysis, preferences)) {
      return null
    }

    if (!preferences.anomalyDetection.channels.includes(NotificationChannel.EMAIL)) {
      return null
    }

    const notification = this.createNotification(employee, analysis, appUrl)
    
    try {
      await this.simulateSendEmail(notification)
      notification.status = 'sent'
      notification.sentAt = new Date().toISOString()
    } catch (error) {
      notification.status = 'failed'
      notification.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return notification
  }

  static async sendBulkAnomalyNotifications(
    employeeAnalyses: Map<string, { employee: Employee; analysis: GapOvertimeAnalysis }>,
    preferencesMap: Map<string, NotificationPreferences>,
    appUrl?: string
  ): Promise<EmailNotification[]> {
    const notifications: EmailNotification[] = []

    for (const [employeeId, { employee, analysis }] of employeeAnalyses) {
      const preferences = preferencesMap.get(employeeId) || this.getDefaultPreferences(employeeId)
      
      try {
        const notification = await this.sendAnomalyNotification(employee, analysis, preferences, appUrl)
        if (notification) {
          notifications.push(notification)
        }
      } catch (error) {
        console.error(`Failed to send notification to ${employee.name}:`, error)
      }
    }

    return notifications
  }
}
