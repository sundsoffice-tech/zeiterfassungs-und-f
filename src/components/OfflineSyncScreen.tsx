import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CloudArrowUp, 
  CloudSlash, 
  CheckCircle, 
  Warning, 
  MapPin, 
  Image as ImageIcon, 
  File, 
  BatteryCharging, 
  WifiSlash,
  ArrowsClockwise,
  Info
} from '@phosphor-icons/react'
import { useOfflineSync, useGPS, useAttachments } from '@/hooks/use-offline-sync'
import { ConflictResolution, SyncConfig } from '@/lib/offline-sync'
import { toast } from 'sonner'

interface OfflineSyncScreenProps {
  onClose?: () => void
}

export function OfflineSyncScreen({ onClose }: OfflineSyncScreenProps) {
  const { isOnline, isSyncing, queueStatus, syncNow, getDeviceId } = useOfflineSync()
  const { location, isTracking, hasPermission, error: gpsError, requestPermission, startTracking, stopTracking } = useGPS()
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    autoSyncEnabled: true,
    syncInterval: 30000,
    conflictResolution: ConflictResolution.NEWEST_WINS,
    syncOnNetworkRestore: true,
    maxRetries: 3,
    batchSize: 10
  })
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('sync_config')
    if (stored) {
      try {
        setSyncConfig(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load sync config')
      }
    }

    const lastSync = localStorage.getItem('last_sync_time')
    if (lastSync) {
      setLastSyncTime(lastSync)
    }
  }, [])

  const saveSyncConfig = (config: SyncConfig) => {
    setSyncConfig(config)
    localStorage.setItem('sync_config', JSON.stringify(config))
  }

  const handleSyncNow = async () => {
    const result = await syncNow()
    
    if (result.success) {
      const now = new Date().toISOString()
      setLastSyncTime(now)
      localStorage.setItem('last_sync_time', now)
      
      toast.success('Synchronisierung erfolgreich', {
        description: `${result.synced} Einträge synchronisiert${result.conflicts > 0 ? `, ${result.conflicts} Konflikte` : ''}`
      })
    } else {
      toast.error('Synchronisierung fehlgeschlagen')
    }
  }

  const handleGPSToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!hasPermission) {
        const granted = await requestPermission()
        if (!granted) {
          toast.error('GPS-Berechtigung verweigert', {
            description: 'Bitte erlaube den Zugriff auf deinen Standort in den Browsereinstellungen'
          })
          return
        }
      }
      startTracking()
      toast.success('GPS-Tracking aktiviert')
    } else {
      stopTracking()
      toast.info('GPS-Tracking deaktiviert')
    }
  }

  const getQueueProgress = () => {
    if (queueStatus.total === 0) return 100
    return ((queueStatus.total - queueStatus.pending) / queueStatus.total) * 100
  }

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nie'
    
    const now = new Date()
    const then = new Date(lastSyncTime)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `Vor ${diffMins} Min.`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Vor ${diffHours} Std.`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offline & Synchronisierung</h2>
          <p className="text-muted-foreground">Offline erfassen, später synchronisieren – ohne Kompromisse</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <CloudArrowUp className="h-5 w-5 text-primary" weight="duotone" />
                ) : (
                  <CloudSlash className="h-5 w-5 text-muted-foreground" weight="duotone" />
                )}
                <CardTitle>Verbindungsstatus</CardTitle>
              </div>
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <CardDescription>
              Gerät-ID: <span className="font-mono text-xs">{getDeviceId()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Letzte Synchronisierung</span>
              <span className="text-sm font-medium">{formatLastSync()}</span>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Warteschlange</span>
                <span className="font-medium">{queueStatus.total} Einträge</span>
              </div>
              <Progress value={getQueueProgress()} className="h-2" />
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Ausstehend: {queueStatus.pending}</span>
                {queueStatus.conflicts > 0 && (
                  <span className="text-warning">Konflikte: {queueStatus.conflicts}</span>
                )}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing || queueStatus.total === 0}
            >
              {isSyncing ? (
                <>
                  <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisiere...
                </>
              ) : (
                <>
                  <CloudArrowUp className="mr-2 h-4 w-4" />
                  Jetzt synchronisieren
                </>
              )}
            </Button>

            {!isOnline && (
              <Alert>
                <WifiSlash className="h-4 w-4" />
                <AlertDescription>
                  Keine Internetverbindung. Daten werden automatisch synchronisiert, sobald die Verbindung wiederhergestellt ist.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" weight="duotone" />
              <CardTitle>GPS-Standort</CardTitle>
            </div>
            <CardDescription>Optional, nur wenn nötig (DSGVO-konform)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gps-tracking" className="text-sm font-normal">
                Standortverfolgung
              </Label>
              <Switch
                id="gps-tracking"
                checked={isTracking}
                onCheckedChange={handleGPSToggle}
              />
            </div>

            {gpsError && (
              <Alert variant="destructive">
                <Warning className="h-4 w-4" />
                <AlertDescription>{gpsError}</AlertDescription>
              </Alert>
            )}

            {location && (
              <div className="space-y-2 rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Breitengrad</span>
                  <span className="font-mono">{location.latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Längengrad</span>
                  <span className="font-mono">{location.longitude.toFixed(6)}</span>
                </div>
                {location.accuracy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Genauigkeit</span>
                    <span className="font-mono">±{Math.round(location.accuracy)}m</span>
                  </div>
                )}
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Standortdaten werden nur lokal gespeichert und nur übertragen, wenn du es explizit erlaubst. Keine automatische Übertragung.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowsClockwise className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle>Synchronisierungseinstellungen</CardTitle>
          </div>
          <CardDescription>Konfliktauflösung und automatische Synchronisierung konfigurieren</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Automatische Synchronisierung</Label>
              <p className="text-xs text-muted-foreground">
                Daten werden automatisch alle {syncConfig.syncInterval / 1000} Sekunden synchronisiert
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={syncConfig.autoSyncEnabled}
              onCheckedChange={(checked) => {
                saveSyncConfig({ ...syncConfig, autoSyncEnabled: checked })
                toast.success(checked ? 'Auto-Sync aktiviert' : 'Auto-Sync deaktiviert')
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sync-on-restore">Bei Netzwerkwiederherstellung synchronisieren</Label>
              <p className="text-xs text-muted-foreground">
                Automatisch synchronisieren, sobald Internetverbindung verfügbar
              </p>
            </div>
            <Switch
              id="sync-on-restore"
              checked={syncConfig.syncOnNetworkRestore}
              onCheckedChange={(checked) => {
                saveSyncConfig({ ...syncConfig, syncOnNetworkRestore: checked })
              }}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Konfliktauflösung</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Legt fest, wie Konflikte zwischen lokalen und Server-Daten gelöst werden
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="conflict-resolution"
                  value={ConflictResolution.NEWEST_WINS}
                  checked={syncConfig.conflictResolution === ConflictResolution.NEWEST_WINS}
                  onChange={(e) => {
                    saveSyncConfig({ ...syncConfig, conflictResolution: e.target.value as ConflictResolution })
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Neueste Version gewinnt</div>
                  <div className="text-xs text-muted-foreground">Automatisch die zuletzt geänderte Version verwenden (empfohlen)</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="conflict-resolution"
                  value={ConflictResolution.LOCAL_WINS}
                  checked={syncConfig.conflictResolution === ConflictResolution.LOCAL_WINS}
                  onChange={(e) => {
                    saveSyncConfig({ ...syncConfig, conflictResolution: e.target.value as ConflictResolution })
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Lokale Version gewinnt</div>
                  <div className="text-xs text-muted-foreground">Immer lokale Änderungen bevorzugen</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="conflict-resolution"
                  value={ConflictResolution.SERVER_WINS}
                  checked={syncConfig.conflictResolution === ConflictResolution.SERVER_WINS}
                  onChange={(e) => {
                    saveSyncConfig({ ...syncConfig, conflictResolution: e.target.value as ConflictResolution })
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Server-Version gewinnt</div>
                  <div className="text-xs text-muted-foreground">Immer Server-Änderungen bevorzugen</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="conflict-resolution"
                  value={ConflictResolution.MANUAL}
                  checked={syncConfig.conflictResolution === ConflictResolution.MANUAL}
                  onChange={(e) => {
                    saveSyncConfig({ ...syncConfig, conflictResolution: e.target.value as ConflictResolution })
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Manuell auflösen</div>
                  <div className="text-xs text-muted-foreground">Konflikte manuell prüfen und entscheiden</div>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle>Hintergrund-Timer & Optimierung</CardTitle>
          </div>
          <CardDescription>Batterie-optimierte Timer-Verwaltung im Hintergrund</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Der Hintergrund-Timer ist batterie-optimiert und läuft stabil, auch wenn die App im Hintergrund ist. 
              Timer werden automatisch gespeichert und wiederhergestellt.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-primary" />
                Wake Lock
              </div>
              <p className="text-xs text-muted-foreground">
                Verhindert, dass das Display ausgeht während ein Timer läuft
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-primary" />
                Auto-Wiederherstellung
              </div>
              <p className="text-xs text-muted-foreground">
                Timer werden automatisch nach App-Neustart wiederhergestellt
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-primary" />
                Heartbeat-System
              </div>
              <p className="text-xs text-muted-foreground">
                Regelmäßige Überprüfung alle 30 Sekunden zur Datenintegrität
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-primary" />
                Offline-Speicherung
              </div>
              <p className="text-xs text-muted-foreground">
                Timer-Daten werden lokal gespeichert und später synchronisiert
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle>Anhänge & Belege</CardTitle>
          </div>
          <CardDescription>Fotos, Belege und Projektunterlagen (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <File className="h-4 w-4" />
            <AlertDescription>
              Anhänge können zu jedem Zeiteintrag hinzugefügt werden. Unterstützte Formate: Fotos (JPG, PNG), PDFs, Audio-Dateien. 
              Maximale Dateigröße: 10 MB pro Datei.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3 space-y-1">
              <div className="font-medium text-sm">Fotos</div>
              <div className="text-xs text-muted-foreground">JPG, PNG, HEIC</div>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <div className="font-medium text-sm">Belege</div>
              <div className="text-xs text-muted-foreground">PDF, Scans</div>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <div className="font-medium text-sm">Dokumente</div>
              <div className="text-xs text-muted-foreground">DOCX, TXT, MD</div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="font-medium text-sm">Datenschutz & Speicherung</div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Anhänge werden lokal verschlüsselt gespeichert</li>
              <li>Upload nur mit expliziter Bestätigung</li>
              <li>Automatische Komprimierung für Fotos</li>
              <li>Thumbnail-Generierung für schnelle Vorschau</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
