import { useState } from 'react'
import { TimeEntry, Project, Task, Phase, Employee } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CheckCircle, XCircle } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface AISuggestion {
  type: 'project' | 'task' | 'duration' | 'notes' | 'split' | 'merge'
  title: string
  description: string
  confidence: 'high' | 'medium' | 'low'
  action?: {
    projectId?: string
    taskId?: string
    duration?: number
    notes?: string
    startTime?: string
    endTime?: string
  }
}

interface AISuggestionsProps {
  timeEntries: TimeEntry[]
  currentEntry?: Partial<TimeEntry>
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  employees: Employee[]
  employeeId: string
  onApplySuggestion?: (suggestion: AISuggestion) => void
}

export function AISuggestions({
  timeEntries,
  currentEntry,
  projects,
  tasks,
  phases,
  employees,
  employeeId,
  onApplySuggestion
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const recentEntries = timeEntries
        .filter(e => e.employeeId === employeeId)
        .slice(-10)
        .map(e => ({
          project: projects.find(p => p.id === e.projectId)?.name,
          task: tasks.find(t => t.id === e.taskId)?.name,
          duration: e.duration,
          date: e.date,
          notes: e.notes
        }))

      const prompt = window.spark.llmPrompt`Du bist ein intelligenter Assistent für Zeiterfassung. Analysiere die folgenden Zeiteinträge und den aktuellen Eintrag, um hilfreiche Vorschläge zu machen.

Letzte Zeiteinträge:
${JSON.stringify(recentEntries, null, 2)}

Aktueller Eintrag:
${JSON.stringify({
  project: currentEntry?.projectId ? projects.find(p => p.id === currentEntry.projectId)?.name : 'nicht ausgewählt',
  task: currentEntry?.taskId ? tasks.find(t => t.id === currentEntry.taskId)?.name : 'nicht ausgewählt',
  duration: currentEntry?.duration,
  startTime: currentEntry?.startTime,
  endTime: currentEntry?.endTime,
  notes: currentEntry?.notes
}, null, 2)}

Verfügbare Projekte:
${projects.filter(p => p.active).map(p => p.name).join(', ')}

Erstelle 2-4 konkrete Vorschläge zur Verbesserung oder Vervollständigung dieses Zeiteintrags. Berücksichtige Muster aus den vergangenen Einträgen.

Gib das Ergebnis als JSON-Objekt mit einer "suggestions" Property zurück, die ein Array von Objekten enthält:
{
  "suggestions": [
    {
      "type": "project" | "task" | "duration" | "notes" | "split" | "merge",
      "title": "Kurzer Titel",
      "description": "Detaillierte Beschreibung",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`

      const response = await window.spark.llm(prompt, 'gpt-4o-mini', true)
      const result = JSON.parse(response)
      
      if (result.suggestions && Array.isArray(result.suggestions)) {
        setSuggestions(result.suggestions)
      } else {
        setError('Unerwartetes Antwortformat vom KI-Assistenten')
      }
    } catch (err) {
      console.error('Fehler beim Generieren von Vorschlägen:', err)
      setError('Fehler beim Generieren von KI-Vorschlägen. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Hohe Konfidenz'
      case 'medium':
        return 'Mittlere Konfidenz'
      case 'low':
        return 'Niedrige Konfidenz'
      default:
        return confidence
    }
  }

  if (suggestions.length === 0 && !isLoading && !error) {
    return (
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-accent" weight="duotone" />
            <CardTitle className="text-base">KI-Assistent</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Intelligente Vorschläge basierend auf Ihren Zeiterfassungsmustern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateSuggestions}
            variant="outline"
            className="w-full gap-2"
          >
            <Sparkle className="h-4 w-4" />
            Vorschläge generieren
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-accent" weight="duotone" />
            <CardTitle className="text-base">KI-Vorschläge</CardTitle>
          </div>
          {!isLoading && suggestions.length > 0 && (
            <Button 
              onClick={generateSuggestions}
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
            >
              <Sparkle className="h-3 w-3" />
              Neu generieren
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Basierend auf Ihren letzten Einträgen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={cn(
              'flex gap-3 p-3 rounded-lg border bg-card text-card-foreground transition-colors',
              suggestion.confidence === 'high' && 'border-accent/50 bg-accent/5'
            )}
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <Badge 
                  variant={getConfidenceBadgeVariant(suggestion.confidence)}
                  className="text-xs shrink-0"
                >
                  {getConfidenceLabel(suggestion.confidence)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {suggestion.type}
                </Badge>
                {onApplySuggestion && suggestion.action && (
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
          </div>
        ))}

        {!isLoading && suggestions.length > 0 && (
          <Alert className="bg-muted/50">
            <AlertDescription className="text-xs text-muted-foreground">
              💡 Diese Vorschläge sind KI-generiert und sollten überprüft werden. Sie haben immer die volle Kontrolle.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
