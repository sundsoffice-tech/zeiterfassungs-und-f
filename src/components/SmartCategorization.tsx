import { useState } from 'react'
import { TimeEntry, Project, Task, Employee } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { 
  Sparkle, 
  CheckCircle, 
  CalendarDots, 
  MapPin, 
  Monitor, 
  Globe,
  Clock,
  Info
} from '@phosphor-icons/react'
import { 
  generateContextBasedSuggestions, 
  analyzeCalendarEventForSuggestion,
  ContextSignals,
  CategorizationSuggestion,
  CalendarEventSuggestion
} from '@/lib/ai-categorization'
import { cn } from '@/lib/utils'

interface SmartCategorizationProps {
  employeeId: string
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  onApplySuggestion?: (suggestion: CategorizationSuggestion) => void
}

export function SmartCategorization({
  employeeId,
  projects,
  tasks,
  timeEntries,
  onApplySuggestion
}: SmartCategorizationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([])
  const [calendarSuggestion, setCalendarSuggestion] = useState<CalendarEventSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [contextSignals, setContextSignals] = useState<ContextSignals>({
    title: '',
    notes: '',
    calendarEvent: undefined,
    location: '',
    usedApps: [],
    usedWebsites: [],
    timeOfDay: undefined,
    dayOfWeek: undefined
  })

  const [enabledSignals, setEnabledSignals] = useState({
    calendar: true,
    location: false,
    apps: false,
    websites: false
  })

  const [calendarEventInput, setCalendarEventInput] = useState({
    title: '',
    startTime: '10:00',
    endTime: '11:30',
    location: ''
  })

  const generateSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    setSuggestions([])
    setCalendarSuggestion(null)

    try {
      const now = new Date()
      const timeOfDay = now.getHours() >= 6 && now.getHours() < 12 
        ? 'morning' 
        : now.getHours() >= 12 && now.getHours() < 18 
          ? 'afternoon' 
          : 'evening'
      
      const dayOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()]

      const context: ContextSignals = {
        title: contextSignals.title || undefined,
        notes: contextSignals.notes || undefined,
        calendarEvent: enabledSignals.calendar && calendarEventInput.title ? {
          title: calendarEventInput.title,
          startTime: calendarEventInput.startTime,
          endTime: calendarEventInput.endTime,
          location: calendarEventInput.location || undefined
        } : undefined,
        location: enabledSignals.location && contextSignals.location ? contextSignals.location : undefined,
        usedApps: enabledSignals.apps && contextSignals.usedApps && contextSignals.usedApps.length > 0 ? contextSignals.usedApps : undefined,
        usedWebsites: enabledSignals.websites && contextSignals.usedWebsites && contextSignals.usedWebsites.length > 0 ? contextSignals.usedWebsites : undefined,
        timeOfDay,
        dayOfWeek
      }

      const results = await generateContextBasedSuggestions(
        context,
        projects,
        tasks,
        timeEntries,
        employeeId
      )

      setSuggestions(results)

      if (context.calendarEvent) {
        const calSuggestion = await analyzeCalendarEventForSuggestion(
          context.calendarEvent.title,
          { start: context.calendarEvent.startTime, end: context.calendarEvent.endTime },
          context.calendarEvent.location,
          projects,
          timeEntries
        )
        setCalendarSuggestion(calSuggestion)
      }

    } catch (err) {
      console.error('Error generating smart suggestions:', err)
      setError('Fehler beim Generieren von Vorschlägen. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-slate-600 bg-slate-50 border-slate-200'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'Hohe Konfidenz'
    if (confidence >= 40) return 'Mittlere Konfidenz'
    return 'Niedrige Konfidenz'
  }

  const handleAppsInput = (value: string) => {
    const apps = value.split(',').map(a => a.trim()).filter(Boolean)
    setContextSignals(prev => ({ ...prev, usedApps: apps }))
  }

  const handleWebsitesInput = (value: string) => {
    const sites = value.split(',').map(s => s.trim()).filter(Boolean)
    setContextSignals(prev => ({ ...prev, usedWebsites: sites }))
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkle className="h-5 w-5 text-accent" weight="duotone" />
          <CardTitle className="text-base">KI-Vorschläge (Auto-Kategorisierung)</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Intelligente Projekt- und Task-Vorschläge basierend auf Kontext-Signalen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titel / Notiz
            </Label>
            <Input
              id="title"
              placeholder="z.B. 'Besprechung Produktdesign' oder 'Bugfix Login'"
              value={contextSignals.title}
              onChange={(e) => setContextSignals(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDots className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Kalendertermin</Label>
              </div>
              <Switch
                checked={enabledSignals.calendar}
                onCheckedChange={(checked) => setEnabledSignals(prev => ({ ...prev, calendar: checked }))}
              />
            </div>
            {enabledSignals.calendar && (
              <div className="ml-6 space-y-2 p-3 border rounded-lg bg-card">
                <Input
                  placeholder="Termintitel: z.B. 'Kurita Showroom Meeting'"
                  value={calendarEventInput.title}
                  onChange={(e) => setCalendarEventInput(prev => ({ ...prev, title: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={calendarEventInput.startTime}
                    onChange={(e) => setCalendarEventInput(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                  <Input
                    type="time"
                    value={calendarEventInput.endTime}
                    onChange={(e) => setCalendarEventInput(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Ort (optional)"
                  value={calendarEventInput.location}
                  onChange={(e) => setCalendarEventInput(prev => ({ ...prev, location: e.target.value }))}
                />
                <Alert className="bg-muted/50 border-primary/20">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Beispiel: "Du warst 10:00–11:30 im Termin 'Kurita Showroom' → als Projekt Kurita buchen?"
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  Standort 
                  <Badge variant="outline" className="ml-2 text-xs">optional, datenschutzsensitiv</Badge>
                </Label>
              </div>
              <Switch
                checked={enabledSignals.location}
                onCheckedChange={(checked) => setEnabledSignals(prev => ({ ...prev, location: checked }))}
              />
            </div>
            {enabledSignals.location && (
              <div className="ml-6">
                <Input
                  placeholder="z.B. 'Kurita Showroom' oder 'Kundenbüro Berlin'"
                  value={contextSignals.location}
                  onChange={(e) => setContextSignals(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  Genutzte Apps
                  <Badge variant="outline" className="ml-2 text-xs">optional, datenschutzsensitiv</Badge>
                </Label>
              </div>
              <Switch
                checked={enabledSignals.apps}
                onCheckedChange={(checked) => setEnabledSignals(prev => ({ ...prev, apps: checked }))}
              />
            </div>
            {enabledSignals.apps && (
              <div className="ml-6">
                <Input
                  placeholder="z.B. 'Figma, Sketch, Photoshop' (kommagetrennt)"
                  onChange={(e) => handleAppsInput(e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  Besuchte Webseiten
                  <Badge variant="outline" className="ml-2 text-xs">optional, datenschutzsensitiv</Badge>
                </Label>
              </div>
              <Switch
                checked={enabledSignals.websites}
                onCheckedChange={(checked) => setEnabledSignals(prev => ({ ...prev, websites: checked }))}
              />
            </div>
            {enabledSignals.websites && (
              <div className="ml-6">
                <Input
                  placeholder="z.B. 'github.com, stackoverflow.com' (kommagetrennt)"
                  onChange={(e) => handleWebsitesInput(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={generateSuggestions}
          className="w-full gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              <Sparkle className="h-4 w-4" />
              Vorschläge generieren
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && calendarSuggestion && (
          <Alert className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/40">
            <CalendarDots className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              <strong>Kalender-Vorschlag:</strong> "{calendarSuggestion.calendarTitle}" → Projekt{' '}
              <Badge variant="secondary" className="font-mono">
                {calendarSuggestion.suggestedProject}
              </Badge>{' '}
              für {calendarSuggestion.suggestedDuration}
              <div className="text-xs text-muted-foreground mt-1">
                {calendarSuggestion.reasoning}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" />
              Vorschläge ({suggestions.length})
            </h4>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 bg-card space-y-3 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {suggestion.projectName && (
                        <Badge variant="default" className="font-medium">
                          {suggestion.projectName}
                        </Badge>
                      )}
                      {suggestion.taskName && (
                        <Badge variant="secondary" className="font-medium">
                          {suggestion.taskName}
                        </Badge>
                      )}
                      {suggestion.tags && suggestion.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {suggestion.startTime && suggestion.endTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {suggestion.startTime} - {suggestion.endTime}
                      </div>
                    )}
                  </div>
                  <Badge 
                    className={cn(
                      "shrink-0 text-xs font-mono",
                      getConfidenceColor(suggestion.confidence)
                    )}
                  >
                    {suggestion.confidence}%
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suggestion.reasoning}
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-1 flex-wrap">
                    {suggestion.basedOn.map((signal, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {signal === 'history' && '📊 Historie'}
                        {signal === 'calendar' && '📅 Kalender'}
                        {signal === 'location' && '📍 Standort'}
                        {signal === 'apps' && '💻 Apps'}
                        {signal === 'title' && '📝 Titel'}
                        {signal === 'time-pattern' && '⏰ Zeitmuster'}
                      </Badge>
                    ))}
                  </div>
                  {onApplySuggestion && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => onApplySuggestion(suggestion)}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Anwenden
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs text-muted-foreground">
                💡 KI-Vorschläge basieren auf Kontext-Analyse und sollten vor Anwendung überprüft werden. 
                Sie haben immer die volle Kontrolle. Datenschutzsensitive Signale (Standort, Apps, Webseiten) 
                sind optional und werden nur mit Ihrer Zustimmung verwendet.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && suggestions.length === 0 && !error && !calendarSuggestion && contextSignals.title && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Keine passenden Vorschläge gefunden. Versuchen Sie mehr Kontext-Signale hinzuzufügen 
              (z.B. Kalendertermin oder Standort).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
