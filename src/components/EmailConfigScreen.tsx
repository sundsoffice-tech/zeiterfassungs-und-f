import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { EnvelopeSimple, CheckCircle, XCircle, Lightning, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { EmailConfig, EmailService } from '@/lib/email-service'
import { EmailNotificationService } from '@/lib/email-notifications'

export function EmailConfigScreen() {
  const [emailConfig, setEmailConfig] = useKV<EmailConfig>('email-config', {
    provider: 'none',
    fromEmail: 'noreply@zeiterfassung.app',
    fromName: 'Zeiterfassung'
  })

  const [localConfig, setLocalConfig] = useState<EmailConfig>(emailConfig || {
    provider: 'none',
    fromEmail: 'noreply@zeiterfassung.app',
    fromName: 'Zeiterfassung'
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (emailConfig) {
      setLocalConfig(emailConfig)
      EmailNotificationService.initializeEmailService(emailConfig)
    }
  }, [emailConfig])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const result = await EmailService.testConnection(localConfig)
      setTestResult(result)

      if (result.valid) {
        toast.success('Verbindung erfolgreich!', {
          description: 'Die E-Mail-Konfiguration ist gültig.'
        })
      } else {
        toast.error('Verbindung fehlgeschlagen', {
          description: result.error
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setTestResult({ valid: false, error: errorMsg })
      toast.error('Fehler beim Testen', {
        description: errorMsg
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      await setEmailConfig(localConfig)
      EmailNotificationService.initializeEmailService(localConfig)
      
      toast.success('Konfiguration gespeichert', {
        description: 'Die E-Mail-Einstellungen wurden erfolgreich aktualisiert.'
      })
    } catch (error) {
      toast.error('Fehler beim Speichern', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      })
    } finally {
      setSaving(false)
    }
  }

  const isConfigured = localConfig.provider !== 'none' && !!localConfig.apiKey

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">E-Mail-Konfiguration</h2>
        <p className="text-muted-foreground mt-1">
          Konfigurieren Sie einen E-Mail-Dienst, um automatische Benachrichtigungen zu versenden.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <EnvelopeSimple className="h-5 w-5 text-white" weight="bold" />
              </div>
              <div>
                <CardTitle>E-Mail-Dienst</CardTitle>
                <CardDescription>Wählen Sie einen Provider und konfigurieren Sie die Zugangsdaten</CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? 'default' : 'secondary'}>
              {isConfigured ? '✓ Konfiguriert' : 'Nicht konfiguriert'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={localConfig.provider}
            onValueChange={(value) => setLocalConfig({ ...localConfig, provider: value as 'sendgrid' | 'none' })}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
              <TabsTrigger value="none">Keine (Simuliert)</TabsTrigger>
            </TabsList>

            <TabsContent value="sendgrid" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>SendGrid Setup:</strong>
                  <ol className="mt-2 space-y-1 text-sm">
                    <li>1. Erstellen Sie ein kostenloses Konto bei <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sendgrid.com</a></li>
                    <li>2. Verifizieren Sie Ihre Absender-E-Mail-Adresse</li>
                    <li>3. Erstellen Sie einen API-Schlüssel unter Settings → API Keys</li>
                    <li>4. Geben Sie den API-Schlüssel hier ein</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API-Schlüssel</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="SG.xxxxxxxxxxxxxxxx"
                    value={localConfig.apiKey || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ihr SendGrid API-Schlüssel wird sicher gespeichert.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">Absender E-Mail</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@ihre-domain.de"
                    value={localConfig.fromEmail}
                    onChange={(e) => setLocalConfig({ ...localConfig, fromEmail: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Diese E-Mail-Adresse muss bei SendGrid verifiziert sein.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name">Absender Name</Label>
                  <Input
                    id="from-name"
                    type="text"
                    placeholder="Zeiterfassung"
                    value={localConfig.fromName}
                    onChange={(e) => setLocalConfig({ ...localConfig, fromName: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="none" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Im Simulations-Modus werden E-Mails nicht wirklich versendet, sondern nur in der Browser-Konsole ausgegeben. Dies ist nützlich für Tests und Entwicklung.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email-sim">Absender E-Mail (Simulation)</Label>
                  <Input
                    id="from-email-sim"
                    type="email"
                    placeholder="noreply@zeiterfassung.app"
                    value={localConfig.fromEmail}
                    onChange={(e) => setLocalConfig({ ...localConfig, fromEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name-sim">Absender Name (Simulation)</Label>
                  <Input
                    id="from-name-sim"
                    type="text"
                    placeholder="Zeiterfassung"
                    value={localConfig.fromName}
                    onChange={(e) => setLocalConfig({ ...localConfig, fromName: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {testResult && (
            <Alert variant={testResult.valid ? 'default' : 'destructive'}>
              {testResult.valid ? (
                <CheckCircle className="h-4 w-4" weight="bold" />
              ) : (
                <XCircle className="h-4 w-4" weight="bold" />
              )}
              <AlertDescription>
                {testResult.valid ? (
                  'Verbindung erfolgreich! Die Konfiguration ist gültig.'
                ) : (
                  `Fehler: ${testResult.error}`
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {localConfig.provider === 'sendgrid' && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !localConfig.apiKey}
              >
                <Lightning className="h-4 w-4 mr-2" />
                {testing ? 'Teste...' : 'Verbindung testen'}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Speichere...' : 'Konfiguration speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verwendung</CardTitle>
          <CardDescription>So verwenden Sie die E-Mail-Benachrichtigungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Benachrichtigungen konfigurieren</h4>
              <p className="text-muted-foreground">
                Gehen Sie zu <strong>Admin → Benachrichtigungen</strong>, um E-Mail-Benachrichtigungen für Anomalien zu konfigurieren.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Mitarbeiter-Einstellungen</h4>
              <p className="text-muted-foreground">
                Mitarbeiter können unter <strong>Admin → Mitarbeiter-Einstellungen</strong> ihre persönlichen Benachrichtigungspräferenzen festlegen.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Automatischer Versand</h4>
              <p className="text-muted-foreground">
                Wenn Anomalien erkannt werden, erhalten Mitarbeiter automatisch E-Mails mit Details und Handlungsempfehlungen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
