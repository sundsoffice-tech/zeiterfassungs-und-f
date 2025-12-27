import { IntegrationType, IntegrationProvider, IntegrationConfig } from './types'

export interface IntegrationMetadata {
  type: IntegrationType
  provider: IntegrationProvider
  name: string
  description: string
  category: string
  requiredFields: {
    key: string
    label: string
    type: 'text' | 'password' | 'url' | 'select'
    placeholder?: string
    options?: { value: string; label: string }[]
    helpText?: string
    resourceLink?: string
  }[]
  optional: boolean
  iconColor: string
}

export const INTEGRATION_METADATA: Record<string, IntegrationMetadata> = {
  [IntegrationProvider.GOOGLE_CALENDAR]: {
    type: IntegrationType.CALENDAR,
    provider: IntegrationProvider.GOOGLE_CALENDAR,
    name: 'Google Calendar',
    description: 'Sync time entries with Google Calendar events',
    category: 'Kalender',
    requiredFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'your-app.apps.googleusercontent.com',
        helpText: 'OAuth 2.0 Client ID',
        resourceLink: 'https://console.cloud.google.com/apis/credentials'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        helpText: 'OAuth 2.0 Client Secret',
        resourceLink: 'https://console.cloud.google.com/apis/credentials'
      },
      {
        key: 'syncDirection',
        label: 'Sync Direction',
        type: 'select',
        options: [
          { value: 'one_way', label: 'One-way (Calendar → Time Tracking)' },
          { value: 'two_way', label: 'Two-way (Bidirectional)' }
        ]
      }
    ],
    optional: false,
    iconColor: 'text-blue-600'
  },
  [IntegrationProvider.OUTLOOK_CALENDAR]: {
    type: IntegrationType.CALENDAR,
    provider: IntegrationProvider.OUTLOOK_CALENDAR,
    name: 'Outlook Calendar',
    description: 'Sync time entries with Microsoft Outlook Calendar',
    category: 'Kalender',
    requiredFields: [
      {
        key: 'clientId',
        label: 'Application (client) ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Azure AD Application ID',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        helpText: 'Client secret value (not ID)',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps'
      },
      {
        key: 'tenantId',
        label: 'Tenant ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Azure AD Tenant (Directory) ID',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_IAM'
      }
    ],
    optional: false,
    iconColor: 'text-blue-500'
  },
  [IntegrationProvider.ICAL]: {
    type: IntegrationType.CALENDAR,
    provider: IntegrationProvider.ICAL,
    name: 'iCal / CalDAV',
    description: 'Import from iCal URLs (read-only)',
    category: 'Kalender',
    requiredFields: [
      {
        key: 'webhookUrl',
        label: 'iCal URL',
        type: 'url',
        placeholder: 'https://calendar.example.com/user/calendar.ics',
        helpText: 'Public or authenticated iCal feed URL'
      }
    ],
    optional: false,
    iconColor: 'text-gray-600'
  },
  [IntegrationProvider.JIRA]: {
    type: IntegrationType.PROJECT_MANAGEMENT,
    provider: IntegrationProvider.JIRA,
    name: 'Jira',
    description: 'Sync projects and tasks from Jira Cloud',
    category: 'PM-Tools',
    requiredFields: [
      {
        key: 'domain',
        label: 'Jira Domain',
        type: 'text',
        placeholder: 'your-company.atlassian.net',
        helpText: 'Your Jira Cloud domain'
      },
      {
        key: 'apiKey',
        label: 'API Token',
        type: 'password',
        helpText: 'Generate an API token for authentication',
        resourceLink: 'https://id.atlassian.com/manage-profile/security/api-tokens'
      },
      {
        key: 'config.email',
        label: 'Email',
        type: 'text',
        placeholder: 'user@example.com',
        helpText: 'Jira account email'
      }
    ],
    optional: false,
    iconColor: 'text-blue-700'
  },
  [IntegrationProvider.ASANA]: {
    type: IntegrationType.PROJECT_MANAGEMENT,
    provider: IntegrationProvider.ASANA,
    name: 'Asana',
    description: 'Sync projects and tasks from Asana',
    category: 'PM-Tools',
    requiredFields: [
      {
        key: 'apiKey',
        label: 'Personal Access Token',
        type: 'password',
        helpText: 'Generate a PAT in Asana developer console',
        resourceLink: 'https://app.asana.com/0/developer-console'
      },
      {
        key: 'workspaceId',
        label: 'Workspace ID',
        type: 'text',
        placeholder: '1234567890123456',
        helpText: 'Find workspace ID in URL or via API'
      }
    ],
    optional: false,
    iconColor: 'text-pink-600'
  },
  [IntegrationProvider.TRELLO]: {
    type: IntegrationType.PROJECT_MANAGEMENT,
    provider: IntegrationProvider.TRELLO,
    name: 'Trello',
    description: 'Sync boards and cards from Trello',
    category: 'PM-Tools',
    requiredFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'text',
        helpText: 'Get your API key from Trello',
        resourceLink: 'https://trello.com/app-key'
      },
      {
        key: 'apiSecret',
        label: 'API Token',
        type: 'password',
        helpText: 'Generate a token (link shown after getting key)',
        resourceLink: 'https://trello.com/app-key'
      }
    ],
    optional: false,
    iconColor: 'text-blue-600'
  },
  [IntegrationProvider.MONDAY]: {
    type: IntegrationType.PROJECT_MANAGEMENT,
    provider: IntegrationProvider.MONDAY,
    name: 'Monday.com',
    description: 'Sync boards and items from Monday.com',
    category: 'PM-Tools',
    requiredFields: [
      {
        key: 'apiKey',
        label: 'API Token',
        type: 'password',
        helpText: 'Generate in your Monday.com account',
        resourceLink: 'https://monday.com/developers/v2'
      }
    ],
    optional: false,
    iconColor: 'text-orange-600'
  },
  [IntegrationProvider.CLICKUP]: {
    type: IntegrationType.PROJECT_MANAGEMENT,
    provider: IntegrationProvider.CLICKUP,
    name: 'ClickUp',
    description: 'Sync spaces, folders, and tasks from ClickUp',
    category: 'PM-Tools',
    requiredFields: [
      {
        key: 'apiKey',
        label: 'API Token',
        type: 'password',
        helpText: 'Personal API token from ClickUp',
        resourceLink: 'https://app.clickup.com/settings/apps'
      }
    ],
    optional: false,
    iconColor: 'text-purple-600'
  },
  [IntegrationProvider.TEAMS]: {
    type: IntegrationType.COMMUNICATION,
    provider: IntegrationProvider.TEAMS,
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    category: 'Kommunikation',
    requiredFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://outlook.office.com/webhook/...',
        helpText: 'Incoming webhook URL for your channel',
        resourceLink: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook'
      }
    ],
    optional: true,
    iconColor: 'text-blue-600'
  },
  [IntegrationProvider.SLACK]: {
    type: IntegrationType.COMMUNICATION,
    provider: IntegrationProvider.SLACK,
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    category: 'Kommunikation',
    requiredFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/...',
        helpText: 'Incoming webhook URL for your channel',
        resourceLink: 'https://api.slack.com/messaging/webhooks'
      }
    ],
    optional: true,
    iconColor: 'text-purple-600'
  },
  [IntegrationProvider.DATEV]: {
    type: IntegrationType.ACCOUNTING,
    provider: IntegrationProvider.DATEV,
    name: 'DATEV',
    description: 'Export timesheet data in DATEV format',
    category: 'Accounting',
    requiredFields: [
      {
        key: 'exportFormat',
        label: 'Export Format',
        type: 'select',
        options: [
          { value: 'csv', label: 'CSV (Standard)' },
          { value: 'xml', label: 'XML (DATEV Format)' }
        ]
      },
      {
        key: 'config.consultantNumber',
        label: 'Consultant Number',
        type: 'text',
        placeholder: '12345',
        helpText: 'DATEV Beraternummer'
      },
      {
        key: 'config.clientNumber',
        label: 'Client Number',
        type: 'text',
        placeholder: '67890',
        helpText: 'DATEV Mandantennummer'
      }
    ],
    optional: false,
    iconColor: 'text-red-600'
  },
  [IntegrationProvider.LEXWARE]: {
    type: IntegrationType.ACCOUNTING,
    provider: IntegrationProvider.LEXWARE,
    name: 'Lexware',
    description: 'Export data compatible with Lexware accounting',
    category: 'Accounting',
    requiredFields: [
      {
        key: 'exportFormat',
        label: 'Export Format',
        type: 'select',
        options: [
          { value: 'csv', label: 'CSV (Lexware Format)' },
          { value: 'api', label: 'API (Direct Integration)' }
        ]
      },
      {
        key: 'apiKey',
        label: 'API Key (optional)',
        type: 'password',
        helpText: 'Only needed for direct API integration',
        resourceLink: 'https://www.lexware.de/api'
      }
    ],
    optional: false,
    iconColor: 'text-yellow-600'
  },
  [IntegrationProvider.SEVDESK]: {
    type: IntegrationType.ACCOUNTING,
    provider: IntegrationProvider.SEVDESK,
    name: 'sevDesk',
    description: 'Sync with sevDesk accounting platform',
    category: 'Accounting',
    requiredFields: [
      {
        key: 'apiKey',
        label: 'API Token',
        type: 'password',
        helpText: 'Get API token from sevDesk settings',
        resourceLink: 'https://my.sevdesk.de/#/admin/userManagement'
      },
      {
        key: 'exportFormat',
        label: 'Export Format',
        type: 'select',
        options: [
          { value: 'api', label: 'API (Direct Integration)' },
          { value: 'csv', label: 'CSV Fallback' }
        ]
      }
    ],
    optional: false,
    iconColor: 'text-blue-700'
  },
  [IntegrationProvider.MICROSOFT_ENTRA]: {
    type: IntegrationType.SSO,
    provider: IntegrationProvider.MICROSOFT_ENTRA,
    name: 'Microsoft Entra ID',
    description: 'Single Sign-On via Microsoft Entra ID (Azure AD)',
    category: 'SSO',
    requiredFields: [
      {
        key: 'clientId',
        label: 'Application ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Azure AD Application (client) ID',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        helpText: 'Client secret value',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps'
      },
      {
        key: 'tenantId',
        label: 'Tenant ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Azure AD Tenant (Directory) ID',
        resourceLink: 'https://portal.azure.com/#blade/Microsoft_AAD_IAM'
      }
    ],
    optional: false,
    iconColor: 'text-blue-600'
  },
  [IntegrationProvider.GOOGLE_WORKSPACE]: {
    type: IntegrationType.SSO,
    provider: IntegrationProvider.GOOGLE_WORKSPACE,
    name: 'Google Workspace',
    description: 'Single Sign-On via Google Workspace',
    category: 'SSO',
    requiredFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'your-app.apps.googleusercontent.com',
        helpText: 'OAuth 2.0 Client ID',
        resourceLink: 'https://console.cloud.google.com/apis/credentials'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        helpText: 'OAuth 2.0 Client Secret',
        resourceLink: 'https://console.cloud.google.com/apis/credentials'
      }
    ],
    optional: false,
    iconColor: 'text-red-600'
  },
  [IntegrationProvider.SAML]: {
    type: IntegrationType.SSO,
    provider: IntegrationProvider.SAML,
    name: 'SAML 2.0',
    description: 'Generic SAML 2.0 Single Sign-On',
    category: 'SSO',
    requiredFields: [
      {
        key: 'domain',
        label: 'SSO URL / Endpoint',
        type: 'url',
        placeholder: 'https://sso.example.com/saml',
        helpText: 'SAML Identity Provider endpoint'
      },
      {
        key: 'config.entityId',
        label: 'Entity ID',
        type: 'text',
        helpText: 'SAML Entity/Issuer ID'
      },
      {
        key: 'config.certificate',
        label: 'X.509 Certificate',
        type: 'text',
        placeholder: 'Paste certificate content',
        helpText: 'Public certificate from IdP'
      }
    ],
    optional: false,
    iconColor: 'text-gray-700'
  },
  [IntegrationProvider.OIDC]: {
    type: IntegrationType.SSO,
    provider: IntegrationProvider.OIDC,
    name: 'OpenID Connect',
    description: 'Generic OpenID Connect SSO',
    category: 'SSO',
    requiredFields: [
      {
        key: 'domain',
        label: 'Discovery URL',
        type: 'url',
        placeholder: 'https://accounts.example.com/.well-known/openid-configuration',
        helpText: 'OIDC discovery endpoint'
      },
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        helpText: 'OAuth client identifier'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        helpText: 'OAuth client secret'
      }
    ],
    optional: false,
    iconColor: 'text-indigo-600'
  },
  [IntegrationProvider.CUSTOM_WEBHOOK]: {
    type: IntegrationType.WEBHOOK,
    provider: IntegrationProvider.CUSTOM_WEBHOOK,
    name: 'Custom Webhook',
    description: 'Send events to custom webhook endpoints',
    category: 'Webhooks/API',
    requiredFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://api.example.com/webhook',
        helpText: 'Your webhook endpoint URL'
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret (optional)',
        type: 'password',
        helpText: 'Used for HMAC signature verification'
      },
      {
        key: 'config.events',
        label: 'Events',
        type: 'text',
        placeholder: 'time_entry.created, time_entry.approved',
        helpText: 'Comma-separated event types to send'
      }
    ],
    optional: true,
    iconColor: 'text-green-600'
  },
  [IntegrationProvider.CUSTOM_MDM]: {
    type: IntegrationType.MDM,
    provider: IntegrationProvider.CUSTOM_MDM,
    name: 'Mobile Device Management',
    description: 'Configure MDM policies for corporate devices',
    category: 'MDM',
    requiredFields: [
      {
        key: 'config.mdmProvider',
        label: 'MDM Provider',
        type: 'select',
        options: [
          { value: 'intune', label: 'Microsoft Intune' },
          { value: 'jamf', label: 'Jamf Pro' },
          { value: 'mobileiron', label: 'MobileIron' },
          { value: 'vmware', label: 'VMware Workspace ONE' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        key: 'config.allowCamera',
        label: 'Allow Camera',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ],
        helpText: 'For receipt capture'
      },
      {
        key: 'config.requirePin',
        label: 'Require Device PIN',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      }
    ],
    optional: true,
    iconColor: 'text-gray-600'
  }
}

export function getIntegrationsByCategory() {
  const categories: Record<string, IntegrationMetadata[]> = {}
  
  Object.values(INTEGRATION_METADATA).forEach(integration => {
    if (!categories[integration.category]) {
      categories[integration.category] = []
    }
    categories[integration.category].push(integration)
  })
  
  return categories
}

export function createDefaultIntegrationConfig(
  tenantId: string,
  provider: IntegrationProvider,
  userId: string
): Omit<IntegrationConfig, 'id'> {
  const metadata = INTEGRATION_METADATA[provider]
  
  return {
    tenantId,
    type: metadata.type,
    provider,
    name: metadata.name,
    description: metadata.description,
    enabled: false,
    config: {},
    audit: {
      createdBy: userId,
      createdAt: new Date().toISOString()
    }
  }
}

export function validateIntegrationConfig(config: IntegrationConfig): string[] {
  const errors: string[] = []
  const metadata = INTEGRATION_METADATA[config.provider]
  
  if (!metadata) {
    errors.push('Unknown integration provider')
    return errors
  }
  
  metadata.requiredFields.forEach(field => {
    const value = field.key.includes('.')
      ? config.config[field.key.split('.')[1]]
      : config.config[field.key] || (config as any)[field.key]
    
    if (!value && field.label.includes('optional') === false) {
      errors.push(`${field.label} is required`)
    }
  })
  
  return errors
}
