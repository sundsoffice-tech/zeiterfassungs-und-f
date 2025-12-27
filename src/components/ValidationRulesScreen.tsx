import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { ValidationRule, Project, AuditMetadata } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Plus, PencilSimple, Trash, Sliders, Warning, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createAuditMetadata } from '@/lib/data-model-helpers'

interface ValidationRulesScreenProps {
  projects: Project[]
}

export function ValidationRulesScreen({ projects }: ValidationRulesScreenProps) {
  const [rules, setRules] = useKV<ValidationRule[]>('validation_rules', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    severity: 'soft' as 'hard' | 'soft',
    enabled: true,
    projectId: '',
    threshold: '',
    requiredFields: [] as string[]
  })

  const defaultRules = [
    { code: 'OVERLAP', name: 'Überlappungen', description: 'Zwei Zeiteinträge überschneiden sich' },
    { code: 'NEGATIVE_DURATION', name: 'Negative Dauer', description: 'Endzeit ist vor der Startzeit' },
    { code: 'RESTRICTED_HOURS', name: 'Gesperrte Zeiten', description: 'Zeiterfassung in gesperrten Zeitfenstern' },
    { code: 'PROJECT_INACTIVE', name: 'Inaktives Projekt', description: 'Projekt ist gesperrt oder geschlossen' },
    { code: 'ABSENCE_CONFLICT', name: 'Abwesenheitskonflikt', description: 'Zeiterfassung während Abwesenheit' },
    { code: 'EXCESSIVE_DAILY_HOURS', name: 'Übermäßige Stunden', description: 'Tagesdauer überschreitet Limit' },
    { code: 'MISSING_NOTES', name: 'Fehlende Notizen', description: 'Abrechenbare Zeit ohne Beschreibung' },
    { code: 'UNUSUAL_ROUNDING', name: 'Auffällige Rundungen', description: 'Ungewöhnlich häufig auf volle Stunden gerundet' },
    { code: 'WEEKEND_WORK', name: 'Wochenendarbeit', description: 'Arbeit am Wochenende ohne Freigabe' },
    { code: 'HOLIDAY_WORK', name: 'Feiertagsarbeit', description: 'Arbeit an Feiertagen' },
    { code: 'LONG_SHIFT', name: 'Lange Schicht', description: 'Schicht über 10 Stunden ohne Pause' },
    { code: 'NO_PAUSES', name: 'Keine Pausen', description: 'Arbeitstag ohne erkennbare Pausen' }
  ]

  const handleAdd = () => {
    setEditingRule(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      severity: 'soft',
      enabled: true,
      projectId: 'none',
      threshold: '',
      requiredFields: []
    })
    setDialogOpen(true)
  }

  const handleEdit = (rule: ValidationRule) => {
    setEditingRule(rule)
    setFormData({
      code: rule.code,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      enabled: rule.enabled,
      projectId: rule.projectId || 'none',
      threshold: rule.threshold?.toString() || '',
      requiredFields: rule.requiredFields || []
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Code und Name sind erforderlich')
      return
    }

    const audit: AuditMetadata = editingRule
      ? { ...editingRule.audit, updatedBy: 'admin', updatedAt: new Date().toISOString() }
      : createAuditMetadata('admin', 'Browser')

    if (editingRule) {
      setRules((current = []) =>
        current.map(r =>
          r.id === editingRule.id
            ? {
                ...r,
                code: formData.code,
                name: formData.name,
                description: formData.description,
                severity: formData.severity,
                enabled: formData.enabled,
                projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
                threshold: formData.threshold ? parseFloat(formData.threshold) : undefined,
                requiredFields: formData.requiredFields.length > 0 ? formData.requiredFields : undefined,
                audit
              }
            : r
        )
      )
      toast.success('Regel aktualisiert')
    } else {
      const newRule: ValidationRule = {
        id: `rule-${Date.now()}`,
        tenantId: 'default',
        code: formData.code,
        name: formData.name,
        description: formData.description,
        severity: formData.severity,
        enabled: formData.enabled,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
        threshold: formData.threshold ? parseFloat(formData.threshold) : undefined,
        requiredFields: formData.requiredFields.length > 0 ? formData.requiredFields : undefined,
        audit
      }
      setRules((current = []) => [...current, newRule])
      toast.success('Regel hinzugefügt')
    }

    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diese Regel wirklich löschen?')) {
      setRules((current = []) => current.filter(r => r.id !== id))
      toast.success('Regel gelöscht')
    }
  }

  const handleToggle = (id: string, enabled: boolean) => {
    setRules((current = []) =>
      current.map(r =>
        r.id === id
          ? {
              ...r,
              enabled,
              audit: { ...r.audit, updatedBy: 'admin', updatedAt: new Date().toISOString() }
            }
          : r
      )
    )
    toast.success(enabled ? 'Regel aktiviert' : 'Regel deaktiviert')
  }

  const globalRules = (rules || []).filter(r => !r.projectId)
  const projectRules = (rules || []).filter(r => r.projectId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" weight="duotone" />
            Validierungsregeln
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurieren Sie Hard/Soft Rules, Schwellenwerte und projektspezifische Regeln
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Regel hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Regel bearbeiten' : 'Neue Validierungsregel'}
              </DialogTitle>
              <DialogDescription>
                Definieren Sie eine neue Validierungsregel oder passen Sie eine bestehende an
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })}
                    placeholder="CUSTOM_RULE"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Eigene Regel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Was wird von dieser Regel geprüft?"
                  rows={2}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Schweregrad *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value as 'hard' | 'soft' })}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hard">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Hard (blockierend)
                        </div>
                      </SelectItem>
                      <SelectItem value="soft">
                        <div className="flex items-center gap-2">
                          <Warning className="h-4 w-4 text-accent" />
                          Soft (Warnung)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Schwellenwert (optional)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step="0.1"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                    placeholder="z.B. 12 für Stunden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Projekt (optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Global (alle Projekte)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Global (alle Projekte)</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wenn leer, gilt die Regel für alle Projekte
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex-1">
                  <Label htmlFor="enabled" className="cursor-pointer">Regel aktiv</Label>
                  <p className="text-xs text-muted-foreground">
                    Aktivieren oder deaktivieren Sie diese Regel
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList>
          <TabsTrigger value="global" className="gap-2">
            <ShieldCheck className="h-4 w-4" weight="duotone" />
            Globale Regeln ({globalRules.length})
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-2">
            <Sliders className="h-4 w-4" weight="duotone" />
            Projektspezifisch ({projectRules.length})
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <Warning className="h-4 w-4" weight="duotone" />
            Standard-Regeln
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-3">
          {globalRules.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine globalen Regeln konfiguriert</p>
                <p className="text-xs mt-1">Fügen Sie Regeln hinzu, die für alle Projekte gelten</p>
              </CardContent>
            </Card>
          )}
          {globalRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </TabsContent>

        <TabsContent value="project" className="space-y-3">
          {projectRules.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Sliders className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine projektspezifischen Regeln konfiguriert</p>
                <p className="text-xs mt-1">Erstellen Sie Regeln für spezifische Projekte</p>
              </CardContent>
            </Card>
          )}
          {projectRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </TabsContent>

        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vordefinierte Regelcodes</CardTitle>
              <CardDescription className="text-xs">
                Diese Codes können Sie bei der Erstellung eigener Regeln verwenden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {defaultRules.map((rule) => (
                  <div key={rule.code} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.code}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RuleCardProps {
  rule: ValidationRule
  projects: Project[]
  onEdit: (rule: ValidationRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

function RuleCard({ rule, projects, onEdit, onDelete, onToggle }: RuleCardProps) {
  const project = projects.find(p => p.id === rule.projectId)

  return (
    <Card className={!rule.enabled ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {rule.code}
              </Badge>
              <Badge variant={rule.severity === 'hard' ? 'destructive' : 'secondary'} className="text-xs">
                {rule.severity === 'hard' ? (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Hard
                  </>
                ) : (
                  <>
                    <Warning className="h-3 w-3 mr-1" />
                    Soft
                  </>
                )}
              </Badge>
              {project && (
                <Badge variant="outline" className="text-xs">
                  {project.name}
                </Badge>
              )}
              {rule.threshold && (
                <Badge variant="outline" className="text-xs">
                  Limit: {rule.threshold}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1">{rule.name}</h3>
            {rule.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rule.description}
              </p>
            )}
            {rule.requiredFields && rule.requiredFields.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">Pflichtfelder:</span>
                {rule.requiredFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={rule.enabled}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(rule)}
              className="h-8 w-8 p-0"
            >
              <PencilSimple className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rule.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
