import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { TimePicker } from '@/components/TimePicker'
import { Clock, FloppyDisk, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function TimePickerDemo() {
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [breakStart, setBreakStart] = useState('12:00')
  const [breakEnd, setBreakEnd] = useState('13:00')
  const [description, setDescription] = useState('')
  const [isStartValid, setIsStartValid] = useState(true)
  const [isEndValid, setIsEndValid] = useState(true)
  const [isBreakStartValid, setIsBreakStartValid] = useState(true)
  const [isBreakEndValid, setIsBreakEndValid] = useState(true)

  const calculateDuration = (start: string, end: string): number => {
    const parseTime = (timeStr: string): number => {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
      if (!match) return 0
      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      return hours * 60 + minutes
    }

    const startMinutes = parseTime(start)
    const endMinutes = parseTime(end)
    
    if (endMinutes <= startMinutes) return 0
    
    return (endMinutes - startMinutes) / 60
  }

  const calculateBreakDuration = (start: string, end: string): number => {
    const parseTime = (timeStr: string): number => {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
      if (!match) return 0
      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      return hours * 60 + minutes
    }

    const startMinutes = parseTime(start)
    const endMinutes = parseTime(end)
    
    if (endMinutes <= startMinutes) return 0
    
    return (endMinutes - startMinutes) / 60
  }

  const workDuration = calculateDuration(startTime, endTime)
  const breakDuration = calculateBreakDuration(breakStart, breakEnd)
  const netDuration = workDuration - breakDuration

  const handleSave = () => {
    if (!isStartValid || !isEndValid || !isBreakStartValid || !isBreakEndValid) {
      toast.error('Bitte korrigieren Sie die Zeitangaben')
      return
    }

    if (workDuration <= 0) {
      toast.error('Endzeit muss nach der Startzeit liegen')
      return
    }

    if (breakDuration < 0) {
      toast.error('Pausenende muss nach dem Pausenanfang liegen')
      return
    }

    toast.success(`Zeiteintrag gespeichert: ${netDuration.toFixed(2)}h netto`, {
      description: `${startTime} - ${endTime} (Pause: ${breakDuration.toFixed(2)}h)`
    })
  }

  const canSave = isStartValid && isEndValid && isBreakStartValid && isBreakEndValid && workDuration > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Time Picker Komponente</h2>
        <p className="text-muted-foreground">
          Verbesserte Zeiteingabe mit "Jetzt"-Button, ±15/±30 Min-Shortcuts, und Inline-Validierung
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" weight="duotone" />
              Manueller Zeiteintrag
            </CardTitle>
            <CardDescription>
              Zeiteintrag mit Arbeitszeit und Pausenzeiten erfassen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Datum</span>
                <span className="font-mono text-sm">{format(new Date(), 'dd.MM.yyyy')}</span>
              </div>

              <TimePicker
                label="Startzeit *"
                id="start-time"
                value={startTime}
                onChange={setStartTime}
                compareWith={endTime}
                compareType="start"
                onValidationChange={(valid) => setIsStartValid(valid)}
              />

              <TimePicker
                label="Endzeit *"
                id="end-time"
                value={endTime}
                onChange={setEndTime}
                compareWith={startTime}
                compareType="end"
                onValidationChange={(valid) => setIsEndValid(valid)}
              />

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4">Pause (optional)</h4>
                
                <div className="space-y-4">
                  <TimePicker
                    label="Pausenbeginn"
                    id="break-start"
                    value={breakStart}
                    onChange={setBreakStart}
                    compareWith={breakEnd}
                    compareType="start"
                    onValidationChange={(valid) => setIsBreakStartValid(valid)}
                  />

                  <TimePicker
                    label="Pausenende"
                    id="break-end"
                    value={breakEnd}
                    onChange={setBreakEnd}
                    compareWith={breakStart}
                    compareType="end"
                    onValidationChange={(valid) => setIsBreakEndValid(valid)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Was haben Sie gemacht?"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="flex items-center gap-2"
              >
                <FloppyDisk className="h-4 w-4" weight="duotone" />
                Speichern
              </Button>
              
              {canSave && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                  <span>Bereit zum Speichern</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Berechnete Zeiten</CardTitle>
              <CardDescription>Automatische Berechnung der Arbeitszeit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Gesamtzeit</span>
                  <span className="text-lg font-bold font-mono">
                    {workDuration.toFixed(2)}h
                  </span>
                </div>

                {breakDuration > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Pause</span>
                    <span className="text-lg font-bold font-mono text-muted-foreground">
                      -{breakDuration.toFixed(2)}h
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-semibold">Netto-Arbeitszeit</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {netDuration.toFixed(2)}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Was macht diese Komponente besonders?</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" weight="fill" />
                  <div>
                    <div className="font-medium">„Jetzt"-Button</div>
                    <div className="text-sm text-muted-foreground">
                      Aktuelle Uhrzeit mit einem Klick einfügen
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" weight="fill" />
                  <div>
                    <div className="font-medium">Zeit-Shortcuts</div>
                    <div className="text-sm text-muted-foreground">
                      ±15 und ±30 Minuten Buttons für schnelle Anpassungen
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" weight="fill" />
                  <div>
                    <div className="font-medium">Inline-Validierung</div>
                    <div className="text-sm text-muted-foreground">
                      Echtzeit-Prüfung: Startzeit &lt; Endzeit
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" weight="fill" />
                  <div>
                    <div className="font-medium">Timezone-Aware</div>
                    <div className="text-sm text-muted-foreground">
                      Automatische Handhabung der lokalen Zeitzone
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" weight="fill" />
                  <div>
                    <div className="font-medium">Klare Fehleranzeige</div>
                    <div className="text-sm text-muted-foreground">
                      Rote Markierung mit Warnicon bei ungültigen Eingaben
                    </div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verwendungsbeispiel</CardTitle>
              <CardDescription>So wird die Komponente eingebunden</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`<TimePicker
  label="Startzeit *"
  value={startTime}
  onChange={setStartTime}
  compareWith={endTime}
  compareType="start"
  onValidationChange={(valid) => 
    setIsValid(valid)
  }
/>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-accent/50 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning className="h-5 w-5 text-accent" weight="duotone" />
            Validierungsregeln
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="border-accent text-accent">
                Format-Validierung
              </Badge>
              <p className="text-sm text-muted-foreground">
                Eingabe muss dem Format HH:MM entsprechen (z.B. 09:30)
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="border-accent text-accent">
                Bereichsprüfung
              </Badge>
              <p className="text-sm text-muted-foreground">
                Stunden: 00-23, Minuten: 00-59
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="border-accent text-accent">
                Vergleichsprüfung
              </Badge>
              <p className="text-sm text-muted-foreground">
                Endzeit muss größer als Startzeit sein
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
