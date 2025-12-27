export interface EmailConfig {
  provider: 'sendgrid' | 'none'
  apiKey?: string
  fromEmail: string
  fromName: string
}

export interface SendEmailParams {
  to: string
  subject: string
  textContent: string
  htmlContent?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (this.config.provider === 'sendgrid') {
      return this.sendWithSendGrid(params)
    }

    return this.simulateSend(params)
  }

  private async sendWithSendGrid(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'SendGrid API key not configured'
      }
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: params.to }],
              subject: params.subject
            }
          ],
          from: {
            email: this.config.fromEmail,
            name: this.config.fromName
          },
          content: [
            {
              type: 'text/plain',
              value: params.textContent
            },
            ...(params.htmlContent ? [{
              type: 'text/html',
              value: params.htmlContent
            }] : [])
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `SendGrid API error: ${response.status} - ${JSON.stringify(errorData)}`
        }
      }

      const messageId = response.headers.get('X-Message-Id') || `sg-${Date.now()}`

      return {
        success: true,
        messageId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async simulateSend(params: SendEmailParams): Promise<SendEmailResult> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    console.log('📧 EMAIL SIMULATED (No provider configured)')
    console.log('─────────────────────────────────────────')
    console.log('To:', params.to)
    console.log('Subject:', params.subject)
    console.log('\nText Content:\n', params.textContent)
    if (params.htmlContent) {
      console.log('\n[HTML content included]')
    }
    console.log('─────────────────────────────────────────')

    return {
      success: true,
      messageId: `sim-${Date.now()}`
    }
  }

  static async testConnection(config: EmailConfig): Promise<{ valid: boolean; error?: string }> {
    if (config.provider === 'sendgrid') {
      if (!config.apiKey) {
        return { valid: false, error: 'API key is required' }
      }

      try {
        const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          }
        })

        if (!response.ok) {
          return { valid: false, error: `Invalid API key: ${response.status}` }
        }

        return { valid: true }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }

    return { valid: true }
  }
}
