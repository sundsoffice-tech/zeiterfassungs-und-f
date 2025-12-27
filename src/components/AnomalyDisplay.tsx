import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  AnomalyDetection, 
  AnomalyDetector, 
  AnomalyAnalysisContext,
  AnomalySeverity,
  AnomalyType
} from '@/lib/anomaly-detection'
import { 
  Brain, 
  Warning, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendUp,
  Sparkle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AnomalyDisplayProps {
  context: AnomalyAnalysisContext
  useAI?: boolean
}

export function AnomalyDisplay({ context, useAI = false }: AnomalyDisplayProps) {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const analyzeAnomalies = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const detections = useAI 
        ? await AnomalyDetector.analyzeWithAI(context)
        : await AnomalyDetector.analyzeEntry(context)
      
      setAnomalies(detections.sort((a, b) => b.confidence - a.confidence))
      setHasAnalyzed(true)
    } catch (err) {
      console.error('Fehler bei der Anomalie-Erkennung:', err)
      setError('Fehler bei der Analyse. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityIcon = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.CRITICAL:
        return <XCircle className="h-5 w-5 text-destructive" weight="fill" />
      case AnomalySeverity.WARNING:
        return <Warning className="h-5 w-5 text-amber-500" weight="fill" />
      case AnomalySeverity.INFO:
        return <Info className="h-5 w-5 text-blue-500" weight="fill" />
    }
  }

  const getSeverityBadgeVariant = (severity: AnomalySeverity): "default" | "destructive" | "secondary" => {
    switch (severity) {
      case AnomalySeverity.CRITICAL:
        return 'destructive'
      case AnomalySeverity.WARNING:
        return 'default'
      case AnomalySeverity.INFO:
        return 'secondary'
    }
  }

  const getSeverityLabel = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.CRITICAL:
        return 'Kritisch'
      case AnomalySeverity.WARNING:
        return 'Warnung'
      case AnomalySeverity.INFO:
        return 'Information'
    }
  }

  const getTypeIcon = (type: AnomalyType) => {
    switch (type) {
      case AnomalyType.TIME_OF_DAY:
        return <Clock className="h-4 w-4" weight="duotone" />
      case AnomalyType.DURATION:
        return <TrendUp className="h-4 w-4" weight="duotone" />
      case AnomalyType.MICRO_ENTRIES:
      case AnomalyType.FREQUENCY:
      case AnomalyType.PROJECT_SWITCHING:
      case AnomalyType.DEVIATION_FROM_TEAM:
      case AnomalyType.UNUSUAL_PATTERN:
        return <Sparkle className="h-4 w-4" weight="duotone" />
    }
  }

  const getTypeLabel = (type: AnomalyType) => {
    switch (type) {
      case AnomalyType.TIME_OF_DAY:
        return 'Tageszeit'
      case AnomalyType.DURATION:
        return 'Dauer'
      case AnomalyType.MICRO_ENTRIES:
        return 'Mikro-Einträge'
      case AnomalyType.FREQUENCY:
        return 'Häufigkeit'
      case AnomalyType.PROJECT_SWITCHING:
        return 'Projektwechsel'
      case AnomalyType.DEVIATION_FROM_TEAM:
        return 'Team-Abweichung'
      case AnomalyType.UNUSUAL_PATTERN:
        return 'Ungewöhnliches Muster'
    }
  }

  if (!hasAnalyzed && !isLoading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle className="text-base">
              {useAI ? 'KI-Anomalie-Erkennung' : 'Muster-Erkennung'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {useAI 
              ? 'Erweiterte KI-Analyse mit Vergleich zu historischen Mustern, Team-Durchschnitt und Projekt-Gewohnheiten'
              : 'Schnelle Muster-basierte Analyse ohne KI'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={analyzeAnomalies}
            variant="outline"
            className="w-full gap-2"
          >
            <Brain className="h-4 w-4" />
            {useAI ? 'KI-Analyse starten' : 'Muster analysieren'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" weight="duotone" />
            <CardTitle className="text-base">
              {useAI ? 'KI-Anomalien' : 'Erkannte Muster'}
            </CardTitle>
          </div>
          {hasAnalyzed && !isLoading && (
            <Button 
              onClick={analyzeAnomalies}
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
            >
              <Brain className="h-3 w-3" />
              Neu analysieren
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {anomalies.length > 0 
            ? `${anomalies.length} ${anomalies.length === 1 ? 'Anomalie' : 'Anomalien'} gefunden`
            : 'Keine Anomalien erkannt'
          }
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

        {!isLoading && anomalies.length === 0 && hasAnalyzed && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm">
              ✓ Keine ungewöhnlichen Muster erkannt. Der Eintrag entspricht den typischen Verhaltensweisen.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && anomalies.map((anomaly, idx) => (
          <div
            key={idx}
            className={cn(
              'flex gap-3 p-4 rounded-lg border bg-card text-card-foreground transition-all',
              anomaly.severity === AnomalySeverity.CRITICAL && 'border-destructive/50 bg-destructive/5',
              anomaly.severity === AnomalySeverity.WARNING && 'border-amber-500/50 bg-amber-500/5',
              anomaly.severity === AnomalySeverity.INFO && 'border-blue-500/50 bg-blue-500/5'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {getSeverityIcon(anomaly.severity)}
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{anomaly.title}</h4>
                  <Badge 
                    variant={getSeverityBadgeVariant(anomaly.severity)}
                    className="text-xs shrink-0"
                  >
                    {getSeverityLabel(anomaly.severity)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {anomaly.description}
                </p>
              </div>

              <div className="grid gap-2 p-3 rounded-md bg-muted/50 border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    {anomaly.baseline.metric}:
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Typisch</p>
                    <p className="font-mono font-semibold">{anomaly.baseline.typical}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Aktuell</p>
                    <p className="font-mono font-semibold text-foreground">{anomaly.baseline.current}</p>
                  </div>
                </div>
              </div>

              {anomaly.evidence.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Beweise:</p>
                  <ul className="space-y-1">
                    {anomaly.evidence.map((evidence, evidenceIdx) => (
                      <li key={evidenceIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary shrink-0">•</span>
                        <span className="flex-1">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(anomaly.type)}
                  <Badge variant="outline" className="text-xs font-mono">
                    {getTypeLabel(anomaly.type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Konfidenz:</span>
                  <Badge 
                    variant={anomaly.confidence >= 0.8 ? 'default' : 'secondary'}
                    className="text-xs font-mono"
                  >
                    {(anomaly.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && anomalies.length > 0 && (
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              💡 Diese Anomalien basieren auf Mustererkennung und {useAI ? 'KI-Analyse' : 'statistischen Vergleichen'}. 
              Sie dienen als Hinweis, nicht als Fehler. Die finale Entscheidung liegt immer beim Benutzer.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export function AnomalySummaryBadge({ anomalyCount, criticalCount }: { anomalyCount: number; criticalCount: number }) {
  if (anomalyCount === 0) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span>Keine Anomalien</span>
      </Badge>
    )
  }

  if (criticalCount > 0) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3 w-3" />
        <span>{criticalCount} Kritisch</span>
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Warning className="h-3 w-3" />
      <span>{anomalyCount} {anomalyCount === 1 ? 'Anomalie' : 'Anomalien'}</span>
    </Badge>
  )
}
