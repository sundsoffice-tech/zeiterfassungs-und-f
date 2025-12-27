import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, FileText, CheckCircle, X } from '@phosphor-icons/react'
import { EvidenceAnchor } from '@/lib/trust-layer'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface EvidenceAnchorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (anchor: EvidenceAnchor) => void
  existingAnchors?: EvidenceAnchor[]
}

export function EvidenceAnchorDialog({
  open,
  onOpenChange,
  onAdd,
  existingAnchors = []
}: EvidenceAnchorDialogProps) {
  const [anchorType, setAnchorType] = useState<'calendar' | 'file' | 'location_hash'>('calendar')
  const [value, setValue] = useState('')

  const handleAdd = () => {
    if (!value.trim()) return

    const anchor: EvidenceAnchor = {
      type: anchorType,
      timestamp: new Date().toISOString(),
      value: value.trim(),
      verified: true
    }

    onAdd(anchor)
    setValue('')
    onOpenChange(false)
  }

  const getAnchorIcon = (type: string) => {
    switch (type) {
      case 'calendar': return <Calendar className="h-4 w-4" />
      case 'location_hash': return <MapPin className="h-4 w-4" />
      case 'file': return <FileText className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getPlaceholder = () => {
    switch (anchorType) {
      case 'calendar': return 'z.B. Kundenmeeting bei Firma XYZ, 10:00-11:30'
      case 'location_hash': return 'z.B. Baustellenbereich Nord, 48.137,11.576'
      case 'file': return 'z.B. Projekt-Dokument_v3.docx geöffnet'
    }
  }

  const getLabel = () => {
    switch (anchorType) {
      case 'calendar': return 'Kalendereintrag / Termin'
      case 'location_hash': return 'Standortbereich (anonymisiert)'
      case 'file': return 'Projektdatei / Dokument'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beweisanker hinzufügen</DialogTitle>
          <DialogDescription>
            Freiwillige Nachweise zur Erhöhung der Plausibilität (ohne Überwachung)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {existingAnchors.length > 0 && (
            <div className="space-y-2">
              <Label>Vorhandene Beweisanker</Label>
              <div className="space-y-2">
                {existingAnchors.map((anchor, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="mt-0.5">{getAnchorIcon(anchor.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{anchor.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(anchor.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </div>
                    {anchor.verified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                        Verifiziert
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anchor-type">Art des Nachweises</Label>
              <Select value={anchorType} onValueChange={(v) => setAnchorType(v as any)}>
                <SelectTrigger id="anchor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Kalendereintrag / Termin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="location_hash">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Standortbereich (Hash)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Projektdatei</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anchor-value">{getLabel()}</Label>
              <Input
                id="anchor-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getPlaceholder()}
              />
              <p className="text-xs text-muted-foreground">
                {anchorType === 'calendar' && 'Termin-Titel und Uhrzeit aus deinem Kalender'}
                {anchorType === 'location_hash' && 'Nur Bereichs-Hash wird gespeichert, nicht der exakte Standort (DSGVO-konform)'}
                {anchorType === 'file' && 'Name der Datei, die während der Arbeit geöffnet/bearbeitet wurde'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" weight="fill" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Keine Überwachung</div>
                <div className="text-blue-700 mt-1">
                  Beweisanker sind <strong>freiwillig</strong> und dienen nur der Plausibilität.
                  Es werden keine Screenshots, keine permanente GPS-Daten oder App-Tracking gespeichert.
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAdd} disabled={!value.trim()}>
              Hinzufügen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
