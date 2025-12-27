import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash, Info, Link as LinkIcon, CheckCircle, XCircle, Lightning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { IntegrationConfig, IntegrationProvider } from '@/lib/types'
import { INTEGRATION_METADATA, getIntegrationsByCategory, createDefaultIntegrationConfig, validateIntegrationConfig } from '@/lib/integrations'

export function IntegrationsScreen() {
  const [integrations, setIntegrations] = useKV<IntegrationConfig[]>('integrations', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null)
  const [formData, setFormData] = useState<Partial<IntegrationConfig>>({})
  const [activeCategory, setActiveCategory] = useState<string>('Kalender')

  const categories = getIntegrationsByCategory()
  const categoryNames = Object.keys(categories)

  const handleAddIntegration = (provider: IntegrationProvider) => {
    const newConfig = createDefaultIntegrationConfig('default-tenant', provider, 'current-user')
    setFormData({ ...newConfig, id: `int_${Date.now()}` })
    setEditingIntegration(null)
    setDialogOpen(true)
  }

  const handleEditIntegration = (integration: IntegrationConfig) => {
    setFormData(integration)
    setEditingIntegration(integration)
    setDialogOpen(true)
  }

  const handleSaveIntegration = () => {
    if (!formData.provider) {
      toast.error('Provider ist erforderlich')
      return
    }

    const integrationToSave = formData as IntegrationConfig
    const errors = validateIntegrationConfig(integrationToSave)
    
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    setIntegrations((current) => {
      const currentIntegrations = current || []
      if (editingIntegration) {
        return currentIntegrations.map(int => int.id === editingIntegration.id ? integrationToSave : int)
      } else {
        return [...currentIntegrations, integrationToSave]
      }
    })

    toast.success(editingIntegration ? 'Integration aktualisiert' : 'Integration hinzugefügt')
    setDialogOpen(false)
    setFormData({})
    setEditingIntegration(null)
  }

  const handleDeleteIntegration = (id: string) => {
    setIntegrations((current) => (current || []).filter(int => int.id !== id))
    toast.success('Integration gelöscht')
  }

  const handleToggleIntegration = (id: string, enabled: boolean) => {
    setIntegrations((current) => 
      (current || []).map(int => int.id === id ? { ...int, enabled } : int)
    )
    toast.success(enabled ? 'Integration aktiviert' : 'Integration deaktiviert')
  }

  const updateFormConfig = (key: string, value: any) => {
    setFormData(current => ({
      ...current,
      config: {
        ...(current.config || {}),
        [key]: value
      }
    }))
  }

  const updateFormField = (key: string, value: any) => {
    if (key.startsWith('config.')) {
      const configKey = key.split('.')[1]
      updateFormConfig(configKey, value)
    } else {
      setFormData(current => ({ ...current, [key]: value }))
    }
  }

  const getIntegrationStatus = (integration: IntegrationConfig) => {
    if (!integration.enabled) return { label: 'Deaktiviert', color: 'text-gray-500' }
    if (integration.lastSyncStatus === 'success') return { label: 'Aktiv', color: 'text-green-600' }
    if (integration.lastSyncStatus === 'error') return { label: 'Fehler', color: 'text-red-600' }
    return { label: 'Konfiguriert', color: 'text-blue-600' }
  }

  const integrationsForCategory = (category: string) => {
    return (integrations || []).filter(int => {
      const metadata = INTEGRATION_METADATA[int.provider]
      return metadata?.category === category
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Integrationen</h2>
          <p className="text-muted-foreground mt-1">
            Verbinde Zeiterfassung mit deinen Tools und Systemen
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Lightning weight="fill" />
          {(integrations || []).filter(i => i.enabled).length} aktiv
        </Badge>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Alle API-Schlüssel und Zugangsdaten werden verschlüsselt gespeichert. Links zeigen, wo du die benötigten Credentials erhältst.
        </AlertDescription>
      </Alert>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-7">
          {categoryNames.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categoryNames.map(category => (
          <TabsContent key={category} value={category} className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {categories[category].map(metadata => {
                const existingIntegration = integrationsForCategory(category).find(
                  int => int.provider === metadata.provider
                )
                const status = existingIntegration ? getIntegrationStatus(existingIntegration) : null

                return (
                  <Card key={metadata.provider} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <LinkIcon className={`h-6 w-6 ${metadata.iconColor}`} weight="duotone" />
                          <div>
                            <CardTitle className="text-lg">{metadata.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {metadata.description}
                            </CardDescription>
                          </div>
                        </div>
                        {status && (
                          <Badge variant={status.label === 'Aktiv' ? 'default' : 'outline'} className={status.color}>
                            {status.label === 'Aktiv' && <CheckCircle className="h-3 w-3 mr-1" weight="fill" />}
                            {status.label === 'Fehler' && <XCircle className="h-3 w-3 mr-1" weight="fill" />}
                            {status.label}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!metadata.optional && (
                        <Badge variant="secondary" className="text-xs">
                          Pflicht für beste App
                        </Badge>
                      )}
                      
                      {existingIntegration ? (
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Switch
                              checked={existingIntegration.enabled}
                              onCheckedChange={(enabled) => handleToggleIntegration(existingIntegration.id, enabled)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {existingIntegration.enabled ? 'Aktiviert' : 'Deaktiviert'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditIntegration(existingIntegration)}
                          >
                            Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteIntegration(existingIntegration.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAddIntegration(metadata.provider)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Hinzufügen
                        </Button>
                      )}

                      {existingIntegration?.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Letzte Sync: {new Date(existingIntegration.lastSync).toLocaleString('de-DE')}
                        </p>
                      )}

                      {existingIntegration?.lastSyncError && (
                        <p className="text-xs text-red-600">
                          Fehler: {existingIntegration.lastSyncError}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'Integration bearbeiten' : 'Integration hinzufügen'}
            </DialogTitle>
            <DialogDescription>
              {formData.provider && INTEGRATION_METADATA[formData.provider]?.description}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {formData.provider && INTEGRATION_METADATA[formData.provider]?.requiredFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.label.includes('optional') && (
                      <span className="text-xs text-muted-foreground ml-2">(optional)</span>
                    )}
                  </Label>
                  
                  {field.type === 'select' ? (
                    <Select
                      value={field.key.startsWith('config.') 
                        ? formData.config?.[field.key.split('.')[1]] 
                        : (formData as any)[field.key]
                      }
                      onValueChange={(value) => updateFormField(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || `Wähle ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={
                        field.key.startsWith('config.')
                          ? formData.config?.[field.key.split('.')[1]] || ''
                          : (formData as any)[field.key] || ''
                      }
                      onChange={(e) => updateFormField(field.key, e.target.value)}
                    />
                  )}
                  
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">
                      {field.helpText}
                    </p>
                  )}
                  
                  {field.resourceLink && (
                    <a
                      href={field.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Credentials hier erhalten
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveIntegration}>
              {editingIntegration ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
