import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash, 
  Eye, 
  Download, 
  FileText,
  Clock,
  Warning,
  CheckCircle,
  MapPin,
  HardDrives,
  Key
} from '@phosphor-icons/react'
import { 
  PrivacySettings, 
  AuditLog, 
  DataRetentionPolicy, 
  GDPRRequest,
  DataRetentionPeriod,
  AuditEventType,
  Employee,
  TimeEntry,
  MileageEntry
} from '@/lib/types'
import { format, subMonths, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface PrivacySecurityScreenProps {
  employees: Employee[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
}

export function PrivacySecurityScreen({ employees, timeEntries, mileageEntries }: PrivacySecurityScreenProps) {
  const [privacySettings, setPrivacySettings] = useKV<PrivacySettings>('privacy_settings', getDefaultPrivacySettings())
  const [auditLogs, setAuditLogs] = useKV<AuditLog[]>('audit_logs', [])
  const [retentionPolicies, setRetentionPolicies] = useKV<DataRetentionPolicy[]>('retention_policies', [])
  const [gdprRequests, setGdprRequests] = useKV<GDPRRequest[]>('gdpr_requests', [])
  
  const [selectedTab, setSelectedTab] = useState('overview')
  const [auditLogFilter, setAuditLogFilter] = useState<AuditEventType | 'all'>('all')
  const [newPolicyDialog, setNewPolicyDialog] = useState(false)
  const [newGDPRDialog, setNewGDPRDialog] = useState(false)

  const logAuditEvent = (event: Partial<AuditLog>) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      tenantId: 'default-tenant',
      timestamp: new Date().toISOString(),
      success: true,
      severity: 'low',
      ...event
    } as AuditLog
    
    setAuditLogs((current) => [newLog, ...current].slice(0, 1000))
  }

  const handlePrivacySettingChange = (path: string, value: any) => {
    setPrivacySettings((current) => {
      if (!current) return getDefaultPrivacySettings()
      const updated = { ...current }
      const parts = path.split('.')
      let obj: any = updated
      
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = value
      
      return updated
    })

    logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGE,
      userId: 'current-user',
      userName: 'Administrator',
      action: 'privacy_setting_changed',
      details: { setting: path, newValue: value },
      severity: 'medium'
    })

    toast.success('Datenschutz-Einstellung aktualisiert')
  }

  const executeRetentionPolicy = (policy: DataRetentionPolicy) => {
    const cutoffDate = subMonths(new Date(), policy.customDays || 12)
    let deletedCount = 0

    if (policy.dataType === 'time_entries' || policy.dataType === 'all') {
      const oldEntries = timeEntries.filter(e => parseISO(e.date) < cutoffDate)
      deletedCount += oldEntries.length
    }

    logAuditEvent({
      eventType: AuditEventType.DATA_DELETE,
      userId: 'system',
      userName: 'Automated Retention',
      action: 'retention_policy_executed',
      details: { policyId: policy.id, policyName: policy.name, recordsDeleted: deletedCount },
      severity: 'high'
    })

    setRetentionPolicies((current) =>
      current.map((p) => p.id === policy.id ? { ...p, lastExecuted: new Date().toISOString() } : p)
    )

    toast.success(`Aufbewahrungsrichtlinie ausgeführt: ${deletedCount} Datensätze gelöscht`)
  }

  const createRetentionPolicy = (data: Partial<DataRetentionPolicy>) => {
    const newPolicy: DataRetentionPolicy = {
      id: Date.now().toString(),
      tenantId: 'default-tenant',
      name: data.name || 'Neue Richtlinie',
      dataType: data.dataType || 'time_entries',
      retentionPeriod: data.retentionPeriod || DataRetentionPeriod.YEAR_1,
      autoDelete: data.autoDelete ?? false,
      archiveBeforeDelete: data.archiveBeforeDelete ?? true,
      notifyBeforeDelete: data.notifyBeforeDelete ?? true,
      notifyDaysBefore: 7,
      enabled: data.enabled ?? true,
      audit: {
        createdBy: 'current-user',
        createdAt: new Date().toISOString()
      }
    }

    setRetentionPolicies((current) => [...current, newPolicy])
    
    logAuditEvent({
      eventType: AuditEventType.RETENTION_POLICY_CHANGE,
      userId: 'current-user',
      userName: 'Administrator',
      action: 'retention_policy_created',
      details: { policyId: newPolicy.id, policyName: newPolicy.name },
      severity: 'high'
    })

    toast.success('Aufbewahrungsrichtlinie erstellt')
    setNewPolicyDialog(false)
  }

  const createGDPRRequest = (employeeId: string, requestType: GDPRRequest['requestType']) => {
    const employee = employees.find(e => e.id === employeeId)
    const newRequest: GDPRRequest = {
      id: Date.now().toString(),
      tenantId: 'default-tenant',
      employeeId,
      employeeName: employee?.name,
      requestType,
      status: 'pending',
      requestDate: new Date().toISOString(),
      audit: {
        createdBy: 'current-user',
        createdAt: new Date().toISOString()
      }
    }

    setGdprRequests((current) => [...current, newRequest])
    
    logAuditEvent({
      eventType: AuditEventType.GDPR_REQUEST,
      userId: employeeId,
      userName: employee?.name,
      action: `gdpr_request_${requestType}`,
      details: { requestId: newRequest.id },
      severity: 'critical'
    })

    toast.success(`DSGVO-Anfrage erstellt: ${getRequestTypeLabel(requestType)}`)
    setNewGDPRDialog(false)
  }

  const processGDPRRequest = (requestId: string, action: 'complete' | 'reject') => {
    setGdprRequests((current) =>
      current.map((req) => {
        if (req.id === requestId) {
          logAuditEvent({
            eventType: AuditEventType.GDPR_REQUEST,
            userId: req.employeeId,
            userName: req.employeeName,
            action: `gdpr_request_${action}d`,
            details: { requestId, requestType: req.requestType },
            severity: 'critical'
          })

          return {
            ...req,
            status: action === 'complete' ? 'completed' : 'rejected',
            completionDate: new Date().toISOString(),
            processedBy: 'current-user'
          }
        }
        return req
      })
    )

    toast.success(`DSGVO-Anfrage ${action === 'complete' ? 'abgeschlossen' : 'abgelehnt'}`)
  }

  const exportPersonalData = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    const employeeTimeEntries = timeEntries.filter(e => e.employeeId === employeeId)
    const employeeMileage = mileageEntries.filter(e => e.employeeId === employeeId)

    const exportData = {
      employee,
      timeEntries: employeeTimeEntries,
      mileageEntries: employeeMileage,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-data-${employee?.name.replace(/\s/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()

    logAuditEvent({
      eventType: AuditEventType.DATA_EXPORT,
      userId: employeeId,
      userName: employee?.name,
      action: 'personal_data_exported',
      details: { 
        timeEntriesCount: employeeTimeEntries.length,
        mileageEntriesCount: employeeMileage.length
      },
      severity: 'high'
    })

    toast.success('Personenbezogene Daten exportiert')
  }

  const filteredAuditLogs = auditLogFilter === 'all' 
    ? (auditLogs || [])
    : (auditLogs || []).filter(log => log.eventType === auditLogFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Datenschutz & Sicherheit</h2>
          <p className="text-muted-foreground">DSGVO-konforme Datenverwaltung und Sicherheitseinstellungen</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" weight="fill" />
          DSGVO-konform
        </Badge>
      </div>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Datenschutz by Design</AlertTitle>
        <AlertDescription>
          Diese Anwendung folgt den Prinzipien der Datenminimierung und Privacy by Default. 
          Kein App-Tracking, keine Analytik, nur erforderliche Daten werden erfasst.
        </AlertDescription>
      </Alert>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <ShieldCheck className="h-4 w-4" weight="duotone" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="encryption" className="gap-2">
            <Key className="h-4 w-4" weight="duotone" />
            Verschlüsselung
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Clock className="h-4 w-4" weight="duotone" />
            Aufbewahrung
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Eye className="h-4 w-4" weight="duotone" />
            Audit-Logs
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="gap-2">
            <FileText className="h-4 w-4" weight="duotone" />
            DSGVO-Rechte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Datenminimierung
                </CardTitle>
                <CardDescription>Erfassung nur erforderlicher Daten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="no-tracking">Kein App-Tracking</Label>
                  <Switch
                    id="no-tracking"
                    checked={privacySettings?.dataMinimization.noAppTracking ?? true}
                    onCheckedChange={(checked) => handlePrivacySettingChange('dataMinimization.noAppTracking', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="no-analytics">Keine Analytik</Label>
                  <Switch
                    id="no-analytics"
                    checked={privacySettings?.dataMinimization.noAnalytics ?? true}
                    onCheckedChange={(checked) => handlePrivacySettingChange('dataMinimization.noAnalytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="minimal-data">Nur Pflichtfelder erfassen</Label>
                  <Switch
                    id="minimal-data"
                    checked={privacySettings?.dataMinimization.collectOnlyRequired ?? false}
                    onCheckedChange={(checked) => handlePrivacySettingChange('dataMinimierung.collectOnlyRequired', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrives className="h-5 w-5" />
                  Hosting & Verarbeitung
                </CardTitle>
                <CardDescription>EU-Region und AVV-konforme Verarbeitung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hosting-region">Hosting-Region</Label>
                  <Select
                    value={privacySettings?.hosting.region || 'eu-central'}
                    onValueChange={(value) => handlePrivacySettingChange('hosting.region', value)}
                  >
                    <SelectTrigger id="hosting-region">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eu-central">EU-Central (Frankfurt)</SelectItem>
                      <SelectItem value="eu-west">EU-West (Ireland)</SelectItem>
                      <SelectItem value="eu-north">EU-North (Stockholm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="eu-only">Nur EU-Verarbeitung</Label>
                  <Switch
                    id="eu-only"
                    checked={privacySettings?.hosting.euOnly ?? true}
                    onCheckedChange={(checked) => handlePrivacySettingChange('hosting.euOnly', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="avv-signed">AVV unterzeichnet</Label>
                  <Badge variant={privacySettings?.hosting.dataProcessingAgreementSigned ? 'default' : 'secondary'}>
                    {privacySettings?.hosting.dataProcessingAgreementSigned ? <CheckCircle className="h-3 w-3 mr-1" /> : <Warning className="h-3 w-3 mr-1" />}
                    {privacySettings?.hosting.dataProcessingAgreementSigned ? 'Ja' : 'Nein'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  DSGVO-Compliance
                </CardTitle>
                <CardDescription>Betroffenenrechte und Transparenz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ComplianceItem label="Recht auf Auskunft" enabled={privacySettings?.gdprCompliance.rightToAccess} />
                <ComplianceItem label="Recht auf Löschung" enabled={privacySettings?.gdprCompliance.rightToErasure} />
                <ComplianceItem label="Recht auf Datenübertragbarkeit" enabled={privacySettings?.gdprCompliance.rightToPortability} />
                <ComplianceItem label="Recht auf Berichtigung" enabled={privacySettings?.gdprCompliance.rightToRectification} />
                <ComplianceItem label="Subprozessorenliste gepflegt" enabled={privacySettings?.gdprCompliance.subprocessorListMaintained} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Subprozessoren
                </CardTitle>
                <CardDescription>Liste der Datenverarbeiter</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {privacySettings?.hosting.subprocessorList && privacySettings.hosting.subprocessorList.length > 0 ? (
                      privacySettings.hosting.subprocessorList.map((processor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{processor}</span>
                          <Badge variant="outline">EU</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine Subprozessoren konfiguriert</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Verschlüsselungseinstellungen</CardTitle>
              <CardDescription>Schutz von Daten in Transit und at Rest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Verschlüsselung in Transit (TLS)</Label>
                    <p className="text-sm text-muted-foreground">HTTPS/TLS 1.3 für alle Datenübertragungen</p>
                  </div>
                  <Badge variant="default" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Aktiv
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="at-rest" className="text-base">Verschlüsselung at Rest</Label>
                    <p className="text-sm text-muted-foreground">AES-256 für gespeicherte Daten</p>
                  </div>
                  <Switch
                    id="at-rest"
                    checked={privacySettings?.encryption.atRest ?? true}
                    onCheckedChange={(checked) => handlePrivacySettingChange('encryption.atRest', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="e2e-notes" className="text-base">Ende-zu-Ende für Notizen</Label>
                    <p className="text-sm text-muted-foreground">Optional: Client-seitige Verschlüsselung für sensible Notizen</p>
                  </div>
                  <Switch
                    id="e2e-notes"
                    checked={privacySettings?.encryption.endToEndNotes ?? false}
                    onCheckedChange={(checked) => handlePrivacySettingChange('encryption.endToEndNotes', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="e2e-attachments" className="text-base">Ende-zu-Ende für Anhänge</Label>
                    <p className="text-sm text-muted-foreground">Optional: Client-seitige Verschlüsselung für Belege und Dokumente</p>
                  </div>
                  <Switch
                    id="e2e-attachments"
                    checked={privacySettings?.encryption.endToEndAttachments ?? false}
                    onCheckedChange={(checked) => handlePrivacySettingChange('encryption.endToEndAttachments', checked)}
                  />
                </div>
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>Verschlüsselungsalgorithmen</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>In Transit: TLS 1.3 mit Perfect Forward Secrecy</li>
                    <li>At Rest: AES-256-GCM für Datenbank und Dateispeicher</li>
                    <li>Ende-zu-Ende: RSA-4096 + AES-256 (optional)</li>
                    <li>Schlüsselverwaltung: Hardware Security Module (HSM)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Aufbewahrungsrichtlinien</h3>
              <p className="text-sm text-muted-foreground">Automatische Löschung nach definierten Zeiträumen</p>
            </div>
            <Dialog open={newPolicyDialog} onOpenChange={setNewPolicyDialog}>
              <DialogTrigger asChild>
                <Button>Richtlinie hinzufügen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Aufbewahrungsrichtlinie</DialogTitle>
                  <DialogDescription>Definieren Sie Löschregeln für verschiedene Datentypen</DialogDescription>
                </DialogHeader>
                <RetentionPolicyForm onSubmit={createRetentionPolicy} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {(retentionPolicies || []).length > 0 ? (
              (retentionPolicies || []).map((policy) => (
                <Card key={policy.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{policy.name}</CardTitle>
                        <CardDescription>{policy.description}</CardDescription>
                      </div>
                      <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                        {policy.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Datentyp</Label>
                        <p className="font-medium">{getDataTypeLabel(policy.dataType)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Aufbewahrungsdauer</Label>
                        <p className="font-medium">{getRetentionPeriodLabel(policy.retentionPeriod)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Auto-Löschung</Label>
                        <p className="font-medium">{policy.autoDelete ? 'Aktiviert' : 'Deaktiviert'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Zuletzt ausgeführt</Label>
                        <p className="font-medium">
                          {policy.lastExecuted 
                            ? format(parseISO(policy.lastExecuted), 'dd.MM.yyyy HH:mm', { locale: de })
                            : 'Nie'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeRetentionPolicy(policy)}
                        disabled={!policy.enabled}
                      >
                        Jetzt ausführen
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRetentionPolicies((current) =>
                            current.map((p) => p.id === policy.id ? { ...p, enabled: !p.enabled } : p)
                          )
                        }}
                      >
                        {policy.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine Aufbewahrungsrichtlinien konfiguriert
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Audit-Protokolle</h3>
              <p className="text-sm text-muted-foreground">
                {(auditLogs || []).length} Ereignisse protokolliert
              </p>
            </div>
            <Select value={auditLogFilter} onValueChange={(value: any) => setAuditLogFilter(value)}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ereignisse</SelectItem>
                <SelectItem value={AuditEventType.USER_LOGIN}>Benutzeranmeldungen</SelectItem>
                <SelectItem value={AuditEventType.DATA_ACCESS}>Datenzugriffe</SelectItem>
                <SelectItem value={AuditEventType.DATA_EXPORT}>Datenexporte</SelectItem>
                <SelectItem value={AuditEventType.DATA_DELETE}>Datenlöschungen</SelectItem>
                <SelectItem value={AuditEventType.SETTINGS_CHANGE}>Einstellungsänderungen</SelectItem>
                <SelectItem value={AuditEventType.APPROVAL_ACTION}>Genehmigungen</SelectItem>
                <SelectItem value={AuditEventType.GDPR_REQUEST}>DSGVO-Anfragen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {(filteredAuditLogs || []).length > 0 ? (
                (filteredAuditLogs || []).map((log) => (
                  <Card key={log.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityVariant(log.severity)}>
                              {log.severity}
                            </Badge>
                            <span className="text-sm font-medium">{getEventTypeLabel(log.eventType)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                            </span>
                          </div>
                          <p className="text-sm">{log.action}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Benutzer: {log.userName || log.userId}</span>
                            {log.userRole && <span>Rolle: {log.userRole}</span>}
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          </div>
                          {log.details && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Details anzeigen
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        {log.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                        ) : (
                          <Warning className="h-5 w-5 text-destructive" weight="fill" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Audit-Logs vorhanden
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">DSGVO-Betroffenenrechte</h3>
              <p className="text-sm text-muted-foreground">Verwaltung von Auskunfts-, Lösch- und Portabilitätsanfragen</p>
            </div>
            <Dialog open={newGDPRDialog} onOpenChange={setNewGDPRDialog}>
              <DialogTrigger asChild>
                <Button>Anfrage erstellen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue DSGVO-Anfrage</DialogTitle>
                  <DialogDescription>Erfassen Sie eine Betroffenenanfrage</DialogDescription>
                </DialogHeader>
                <GDPRRequestForm 
                  employees={employees} 
                  onSubmit={(employeeId, requestType) => createGDPRRequest(employeeId, requestType)} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {(gdprRequests || []).length > 0 ? (
              (gdprRequests || []).map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{request.employeeName}</CardTitle>
                        <CardDescription>{getRequestTypeLabel(request.requestType)}</CardDescription>
                      </div>
                      <Badge variant={getStatusVariant(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Anfragedatum</Label>
                        <p className="font-medium">
                          {format(parseISO(request.requestDate), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                      {request.completionDate && (
                        <div>
                          <Label className="text-muted-foreground">Abschlussdatum</Label>
                          <p className="font-medium">
                            {format(parseISO(request.completionDate), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (request.requestType === 'access' || request.requestType === 'portability') {
                              exportPersonalData(request.employeeId)
                            }
                            processGDPRRequest(request.id, 'complete')
                          }}
                        >
                          {request.requestType === 'access' || request.requestType === 'portability' 
                            ? 'Daten exportieren & abschließen' 
                            : 'Abschließen'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processGDPRRequest(request.id, 'reject')}
                        >
                          Ablehnen
                        </Button>
                      </div>
                    )}
                    {request.status === 'completed' && (request.requestType === 'access' || request.requestType === 'portability') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportPersonalData(request.employeeId)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Erneut exportieren
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine DSGVO-Anfragen vorhanden
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ComplianceItem({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {enabled ? (
        <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
      ) : (
        <Warning className="h-4 w-4 text-amber-500" weight="fill" />
      )}
    </div>
  )
}

function RetentionPolicyForm({ onSubmit }: { onSubmit: (data: Partial<DataRetentionPolicy>) => void }) {
  const [formData, setFormData] = useState<Partial<DataRetentionPolicy>>({
    name: '',
    dataType: 'time_entries',
    retentionPeriod: DataRetentionPeriod.YEAR_1,
    autoDelete: false,
    archiveBeforeDelete: true,
    notifyBeforeDelete: true,
    enabled: true
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="policy-name">Name</Label>
        <Input
          id="policy-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="z.B. Zeiteinträge 1 Jahr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="data-type">Datentyp</Label>
        <Select
          value={formData.dataType}
          onValueChange={(value: any) => setFormData({ ...formData, dataType: value })}
        >
          <SelectTrigger id="data-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time_entries">Zeiteinträge</SelectItem>
            <SelectItem value="mileage">Fahrtenbuch</SelectItem>
            <SelectItem value="expenses">Spesen</SelectItem>
            <SelectItem value="audit_logs">Audit-Logs</SelectItem>
            <SelectItem value="deleted_data">Gelöschte Daten</SelectItem>
            <SelectItem value="all">Alle Daten</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="retention-period">Aufbewahrungsdauer</Label>
        <Select
          value={formData.retentionPeriod}
          onValueChange={(value: any) => setFormData({ ...formData, retentionPeriod: value })}
        >
          <SelectTrigger id="retention-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DataRetentionPeriod.MONTHS_6}>6 Monate</SelectItem>
            <SelectItem value={DataRetentionPeriod.YEAR_1}>1 Jahr</SelectItem>
            <SelectItem value={DataRetentionPeriod.YEARS_3}>3 Jahre</SelectItem>
            <SelectItem value={DataRetentionPeriod.YEARS_5}>5 Jahre</SelectItem>
            <SelectItem value={DataRetentionPeriod.YEARS_10}>10 Jahre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-delete">Auto-Löschung aktivieren</Label>
        <Switch
          id="auto-delete"
          checked={formData.autoDelete}
          onCheckedChange={(checked) => setFormData({ ...formData, autoDelete: checked })}
        />
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(formData)}>Richtlinie erstellen</Button>
      </DialogFooter>
    </div>
  )
}

function GDPRRequestForm({ 
  employees, 
  onSubmit 
}: { 
  employees: Employee[]
  onSubmit: (employeeId: string, requestType: GDPRRequest['requestType']) => void 
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [requestType, setRequestType] = useState<GDPRRequest['requestType']>('access')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Mitarbeiter</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger id="employee">
            <SelectValue placeholder="Mitarbeiter wählen..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="request-type">Anfragetyp</Label>
        <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
          <SelectTrigger id="request-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="access">Auskunft (Art. 15)</SelectItem>
            <SelectItem value="erasure">Löschung (Art. 17)</SelectItem>
            <SelectItem value="portability">Datenübertragbarkeit (Art. 20)</SelectItem>
            <SelectItem value="rectification">Berichtigung (Art. 16)</SelectItem>
            <SelectItem value="restriction">Einschränkung (Art. 18)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(employeeId, requestType)} disabled={!employeeId}>
          Anfrage erstellen
        </Button>
      </DialogFooter>
    </div>
  )
}

function getDefaultPrivacySettings(): PrivacySettings {
  return {
    id: 'default',
    tenantId: 'default-tenant',
    dataMinimization: {
      enabled: true,
      collectOnlyRequired: false,
      noAppTracking: true,
      noAnalytics: true
    },
    encryption: {
      inTransit: true,
      atRest: true,
      endToEndNotes: false,
      endToEndAttachments: false,
      algorithm: 'AES-256-GCM'
    },
    retention: {
      timeEntriesMonths: 36,
      mileageEntriesMonths: 36,
      auditLogsMonths: 24,
      deletedDataMonths: 6,
      autoDeleteAfterRetention: false
    },
    gdprCompliance: {
      enabled: true,
      dataProcessingAgreement: true,
      subprocessorListMaintained: true,
      rightToAccess: true,
      rightToErasure: true,
      rightToPortability: true,
      rightToRectification: true
    },
    hosting: {
      region: 'eu-central',
      euOnly: true,
      dataProcessingAgreementSigned: true,
      subprocessorList: [
        'AWS Europe (Frankfurt) - Infrastructure',
        'GitHub Spark - Application Platform'
      ]
    },
    audit: {
      createdBy: 'system',
      createdAt: new Date().toISOString()
    }
  }
}

function getDataTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    time_entries: 'Zeiteinträge',
    mileage: 'Fahrtenbuch',
    expenses: 'Spesen',
    audit_logs: 'Audit-Logs',
    deleted_data: 'Gelöschte Daten',
    attachments: 'Anhänge',
    all: 'Alle Daten'
  }
  return labels[type] || type
}

function getRetentionPeriodLabel(period: DataRetentionPeriod): string {
  const labels: Record<DataRetentionPeriod, string> = {
    [DataRetentionPeriod.MONTHS_6]: '6 Monate',
    [DataRetentionPeriod.YEAR_1]: '1 Jahr',
    [DataRetentionPeriod.YEARS_3]: '3 Jahre',
    [DataRetentionPeriod.YEARS_5]: '5 Jahre',
    [DataRetentionPeriod.YEARS_10]: '10 Jahre',
    [DataRetentionPeriod.CUSTOM]: 'Benutzerdefiniert'
  }
  return labels[period]
}

function getEventTypeLabel(type: AuditEventType): string {
  const labels: Record<AuditEventType, string> = {
    [AuditEventType.USER_LOGIN]: 'Benutzeranmeldung',
    [AuditEventType.USER_LOGOUT]: 'Benutzerabmeldung',
    [AuditEventType.DATA_ACCESS]: 'Datenzugriff',
    [AuditEventType.DATA_EXPORT]: 'Datenexport',
    [AuditEventType.DATA_DELETE]: 'Datenlöschung',
    [AuditEventType.SETTINGS_CHANGE]: 'Einstellungsänderung',
    [AuditEventType.APPROVAL_ACTION]: 'Genehmigungsaktion',
    [AuditEventType.RATE_CHANGE]: 'Satzänderung',
    [AuditEventType.PROJECT_CHANGE]: 'Projektänderung',
    [AuditEventType.EMPLOYEE_CHANGE]: 'Mitarbeiteränderung',
    [AuditEventType.INTEGRATION_CHANGE]: 'Integrationsänderung',
    [AuditEventType.RETENTION_POLICY_CHANGE]: 'Aufbewahrungsrichtlinienänderung',
    [AuditEventType.DATA_ANONYMIZATION]: 'Datenanonymisierung',
    [AuditEventType.GDPR_REQUEST]: 'DSGVO-Anfrage'
  }
  return labels[type]
}

function getRequestTypeLabel(type: GDPRRequest['requestType']): string {
  const labels: Record<GDPRRequest['requestType'], string> = {
    access: 'Recht auf Auskunft',
    erasure: 'Recht auf Löschung',
    portability: 'Recht auf Datenübertragbarkeit',
    rectification: 'Recht auf Berichtigung',
    restriction: 'Recht auf Einschränkung'
  }
  return labels[type]
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    rejected: 'Abgelehnt'
  }
  return labels[status] || status
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    processing: 'outline',
    completed: 'default',
    rejected: 'destructive'
  }
  return variants[status] || 'secondary'
}

function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'secondary',
    medium: 'outline',
    high: 'default',
    critical: 'destructive'
  }
  return variants[severity] || 'secondary'
}
