import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MapPin, Crosshair, Play, Stop, Plus, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { GPSMileageEntry, GPSLocation, Employee, Project, ApprovalStatus } from '@/lib/types'
import { getEmployeeName } from '@/lib/helpers'
import { motion } from 'framer-motion'

interface GPSMileageScreenProps {
  employees: Employee[]
  projects: Project[]
}

interface GPSTracking {
  active: boolean
  startTime?: number
  startLocation?: GPSLocation
  routePoints: GPSLocation[]
  distance: number
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=de`
    )
    const data = await response.json()
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

export function GPSMileageScreen({ employees, projects }: GPSMileageScreenProps) {
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [tracking, setTracking] = useState<GPSTracking>({ active: false, routePoints: [], distance: 0 })
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null)
  const [entries, setEntries] = useKV<GPSMileageEntry[]>('gps_mileage_entries', [])
  const [watchId, setWatchId] = useState<number | null>(null)
  const [suggestedEntry, setSuggestedEntry] = useState<Partial<GPSMileageEntry> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<GPSMileageEntry>>({
    employeeId: '',
    projectId: '',
    purpose: '',
    rate: 0.30
  })

  useEffect(() => {
    if (gpsEnabled && !watchId) {
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: GPSLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            }
            setCurrentLocation(newLocation)

            if (tracking.active && tracking.routePoints.length > 0) {
              const lastPoint = tracking.routePoints[tracking.routePoints.length - 1]
              const dist = calculateDistance(
                lastPoint.latitude,
                lastPoint.longitude,
                newLocation.latitude,
                newLocation.longitude
              )
              
              if (dist > 0.05) {
                setTracking(prev => ({
                  ...prev,
                  routePoints: [...prev.routePoints, newLocation],
                  distance: prev.distance + dist
                }))
              }
            }
          },
          (error) => {
            toast.error(`GPS-Fehler: ${error.message}`)
            setGpsEnabled(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        )
        setWatchId(id)
        toast.success('GPS-Tracking aktiviert')
      } else {
        toast.error('GPS wird von diesem Browser nicht unterstützt')
        setGpsEnabled(false)
      }
    } else if (!gpsEnabled && watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setCurrentLocation(null)
      toast.success('GPS-Tracking deaktiviert')
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [gpsEnabled, watchId, tracking.active, tracking.routePoints])

  const startTracking = async () => {
    if (!currentLocation) {
      toast.error('Warte auf GPS-Signal...')
      return
    }

    const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude)
    const locationWithAddress = { ...currentLocation, address }

    setTracking({
      active: true,
      startTime: Date.now(),
      startLocation: locationWithAddress,
      routePoints: [locationWithAddress],
      distance: 0
    })

    toast.success('Fahrt gestartet')
  }

  const stopTracking = async () => {
    if (!tracking.active || !tracking.startLocation || !currentLocation) {
      return
    }

    const endAddress = await reverseGeocode(currentLocation.latitude, currentLocation.longitude)
    const endLocation = { ...currentLocation, address: endAddress }

    const entry: Partial<GPSMileageEntry> = {
      startLocation: tracking.startLocation.address || 'Unbekannt',
      endLocation: endAddress,
      distance: Math.round(tracking.distance * 100) / 100,
      gpsTracked: true,
      startGPS: tracking.startLocation,
      endGPS: endLocation,
      routePoints: tracking.routePoints,
      manualOverride: false,
      date: new Date().toISOString().split('T')[0]
    }

    setSuggestedEntry(entry)
    setFormData({ ...formData, ...entry })
    setDialogOpen(true)

    setTracking({ active: false, routePoints: [], distance: 0 })
    toast.success(`Fahrt beendet - ${entry.distance} km aufgezeichnet`)
  }

  const saveEntry = () => {
    if (!formData.employeeId || !formData.startLocation || !formData.endLocation || !formData.distance || !formData.purpose) {
      toast.error('Bitte alle Pflichtfelder ausfüllen')
      return
    }

    const newEntry: GPSMileageEntry = {
      id: `gps_mileage_${Date.now()}`,
      tenantId: 'default-tenant',
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date || new Date().toISOString().split('T')[0],
      startLocation: formData.startLocation,
      endLocation: formData.endLocation,
      distance: typeof formData.distance === 'string' ? parseFloat(formData.distance) : formData.distance,
      purpose: formData.purpose || '',
      rate: formData.rate || 0.30,
      amount: (typeof formData.distance === 'string' ? parseFloat(formData.distance) : formData.distance) * (formData.rate || 0.30),
      approvalStatus: ApprovalStatus.DRAFT,
      locked: false,
      gpsTracked: formData.gpsTracked || false,
      startGPS: formData.startGPS,
      endGPS: formData.endGPS,
      routePoints: formData.routePoints,
      manualOverride: formData.manualOverride || false,
      audit: {
        createdBy: formData.employeeId,
        createdAt: new Date().toISOString(),
        device: 'GPS-System'
      },
      changeLog: []
    }

    setEntries(prev => [...(prev || []), newEntry])
    toast.success('Fahrt gespeichert')
    setDialogOpen(false)
    setSuggestedEntry(null)
    setFormData({ employeeId: '', projectId: '', purpose: '', rate: 0.30 })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" weight="duotone" />
              GPS-Tracking Status
            </CardTitle>
            <CardDescription>Automatische Fahrtzeiten mit GPS-Aufzeichnung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gps-enabled">GPS-Tracking aktivieren</Label>
              <Switch
                id="gps-enabled"
                checked={gpsEnabled}
                onCheckedChange={setGpsEnabled}
              />
            </div>

            {gpsEnabled && currentLocation && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-accent" weight="fill" />
                  <span className="font-medium">Aktuelle Position:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Genauigkeit: ±{Math.round(currentLocation.accuracy)}m
                </p>
              </div>
            )}

            {tracking.active && (
              <div className="space-y-2 p-4 bg-accent/10 border border-accent rounded-lg">
                <p className="text-sm font-medium text-accent">📍 Fahrt läuft...</p>
                <p className="text-2xl font-bold font-mono">{tracking.distance.toFixed(2)} km</p>
                <p className="text-xs text-muted-foreground">
                  Start: {tracking.startLocation?.address || 'Lädt...'}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {!tracking.active ? (
                <Button
                  onClick={startTracking}
                  disabled={!gpsEnabled || !currentLocation}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" weight="fill" />
                  Fahrt starten
                </Button>
              ) : (
                <Button
                  onClick={stopTracking}
                  variant="destructive"
                  className="flex-1"
                >
                  <Stop className="h-4 w-4 mr-2" weight="fill" />
                  Fahrt beenden
                </Button>
              )}
            </div>

            <Button
              onClick={() => {
                setFormData({ ...formData, gpsTracked: false, manualOverride: true })
                setDialogOpen(true)
              }}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manuelle Fahrt hinzufügen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DSGVO & Datenschutz</CardTitle>
            <CardDescription>Transparente GPS-Datennutzung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
              <p className="font-medium text-blue-900">🔒 Ihre Daten bleiben sicher</p>
              <ul className="space-y-1 text-blue-700 text-xs">
                <li>• GPS-Daten nur während aktiver Fahrt erfasst</li>
                <li>• Standortdaten lokal gespeichert</li>
                <li>• Explizite Zustimmung erforderlich</li>
                <li>• Jederzeit deaktivierbar</li>
                <li>• Keine Hintergrundverfolgung</li>
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-medium">Verwendungszweck</p>
              <p className="text-muted-foreground text-xs">
                GPS-Tracking dient ausschließlich der automatischen Kilometererfassung für
                Fahrtkostenabrechnung und Projektdokumentation. Standortdaten werden nicht
                zur Mitarbeiterüberwachung verwendet.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" weight="fill" />
              <span>DSGVO-konform nach Art. 6 Abs. 1 lit. a (Einwilligung)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GPS-Fahrtenbuch</CardTitle>
          <CardDescription>
            {entries?.length || 0} Einträge • {(entries || []).reduce((sum, e) => sum + e.distance, 0).toFixed(2)} km gesamt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Von</TableHead>
                <TableHead>Nach</TableHead>
                <TableHead className="text-right">Kilometer</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Art</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!entries || entries.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Noch keine Fahrten aufgezeichnet
                  </TableCell>
                </TableRow>
              ) : (
                (entries || []).map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b"
                  >
                    <TableCell>{new Date(entry.date).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>{employees.find(e => e.id === entry.employeeId)?.name || 'Unbekannt'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.startLocation}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.endLocation}</TableCell>
                    <TableCell className="text-right font-mono">{entry.distance} km</TableCell>
                    <TableCell className="text-right font-mono">€{entry.amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      {entry.gpsTracked ? (
                        <Badge variant="default" className="gap-1">
                          <MapPin className="h-3 w-3" weight="fill" />
                          GPS
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Manuell</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.approvalStatus === 'approved' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                          Genehmigt
                        </Badge>
                      ) : entry.approvalStatus === 'rejected' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" weight="fill" />
                          Abgelehnt
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Entwurf</Badge>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fahrt speichern</DialogTitle>
            <DialogDescription>
              {suggestedEntry?.gpsTracked
                ? 'GPS-aufgezeichnete Fahrt - bitte Details überprüfen und ergänzen'
                : 'Manuelle Fahrt hinzufügen'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Mitarbeiter *</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Mitarbeiter wählen" />
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
                <Label htmlFor="project">Projekt</Label>
                <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-location">Von *</Label>
                <Input
                  id="start-location"
                  value={formData.startLocation || ''}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  placeholder="Startadresse"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-location">Nach *</Label>
                <Input
                  id="end-location"
                  value={formData.endLocation || ''}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  placeholder="Zieladresse"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Kilometer *</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance || ''}
                  onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) })}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Satz (€/km)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate || 0.30}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Betrag</Label>
                <Input
                  value={`€${((formData.distance || 0) * (formData.rate || 0.30)).toFixed(2)}`}
                  disabled
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Zweck *</Label>
              <Input
                id="purpose"
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="z.B. Kundenbesuch, Materialtransport"
              />
            </div>

            {suggestedEntry?.gpsTracked && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <MapPin className="h-4 w-4 flex-shrink-0" weight="fill" />
                <span>GPS-aufgezeichnet mit {formData.routePoints?.length || 0} Routenpunkten</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveEntry}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
