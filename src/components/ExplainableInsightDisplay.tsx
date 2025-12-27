import { useState } from 'react'
import { ExplainableInsight, DecisionAction, StrictnessMode, STRICTNESS_MODES } from '@/lib/explainable-ai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ShieldWarning,
  ShieldCheck,
  Info,
  Warning,
  XCircle,
  Lightbulb,
  CaretDown,
  CheckCircle,
  Question,
  TrendUp,
  TrendDown,
  Equals,
  Brain,
  Target,
  ArrowRight,
  Sparkle,
  Scales,
  Leaf,
  ShieldStar
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ExplainableInsightDisplayProps {
  insights: ExplainableInsight[]
  onTakeAction?: (insight: ExplainableInsight, action: DecisionAction) => void
  showLearningNotes?: boolean
  compact?: boolean
  strictnessMode?: StrictnessMode
  onStrictnessModeChange?: (mode: StrictnessMode) => void
}

export function ExplainableInsightDisplay({
  insights,
  onTakeAction,
  showLearningNotes = true,
  compact = false,
  strictnessMode = StrictnessMode.NEUTRAL,
  onStrictnessModeChange
}: ExplainableInsightDisplayProps) {
  const criticalInsights = insights.filter(i => i.severity === 'critical')
  const warningInsights = insights.filter(i => i.severity === 'warning')
  const infoInsights = insights.filter(i => i.severity === 'info')

  if (insights.length === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/5">
        <ShieldCheck className="h-4 w-4 text-green-600" weight="duotone" />
        <AlertTitle className="text-green-900">Keine Probleme erkannt</AlertTitle>
        <AlertDescription className="text-green-700">
          Alle Zeiteinträge sind plausibel und entsprechen den erwarteten Mustern.
        </AlertDescription>
      </Alert>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <CompactInsightCard
            key={insight.id || idx}
            insight={insight}
            onTakeAction={onTakeAction}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {onStrictnessModeChange && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scales className="h-5 w-5 text-primary" weight="duotone" />
                <CardTitle className="text-base">Validierungsmodus</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">
              Passt die Strenge der KI-Validierung an den Projekttyp an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(STRICTNESS_MODES).map((mode) => {
                const Icon = mode.icon === 'ShieldCheck' ? ShieldStar : mode.icon === 'Scales' ? Scales : Leaf
                const isActive = strictnessMode === mode.mode
                return (
                  <Button
                    key={mode.mode}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-auto py-3 flex flex-col items-start gap-1',
                      !isActive && 'hover:bg-muted'
                    )}
                    onClick={() => onStrictnessModeChange(mode.mode)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4" weight="duotone" />
                      <span className="font-semibold">{mode.label}</span>
                    </div>
                    <span className="text-xs font-normal text-left opacity-80">
                      {mode.description}
                    </span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {criticalInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1.5">
              <XCircle className="h-3 w-3" weight="fill" />
              Kritische Fehler
            </Badge>
            <span className="text-xs text-muted-foreground">
              {criticalInsights.length} {criticalInsights.length === 1 ? 'Fehler' : 'Fehler'}
            </span>
          </div>
          {criticalInsights.map((insight, idx) => (
            <InsightCard
              key={insight.id || idx}
              insight={insight}
              onTakeAction={onTakeAction}
              showLearningNotes={showLearningNotes}
            />
          ))}
        </div>
      )}

      {warningInsights.length > 0 && (
        <>
          {criticalInsights.length > 0 && <Separator />}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-accent text-accent">
                <Warning className="h-3 w-3" weight="fill" />
                Warnungen
              </Badge>
              <span className="text-xs text-muted-foreground">
                {warningInsights.length} {warningInsights.length === 1 ? 'Warnung' : 'Warnungen'}
              </span>
            </div>
            {warningInsights.map((insight, idx) => (
              <InsightCard
                key={insight.id || idx}
                insight={insight}
                onTakeAction={onTakeAction}
                showLearningNotes={showLearningNotes}
              />
            ))}
          </div>
        </>
      )}

      {infoInsights.length > 0 && (
        <>
          {(criticalInsights.length > 0 || warningInsights.length > 0) && <Separator />}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-blue-500 text-blue-600">
                <Info className="h-3 w-3" weight="fill" />
                Hinweise
              </Badge>
              <span className="text-xs text-muted-foreground">
                {infoInsights.length} {infoInsights.length === 1 ? 'Hinweis' : 'Hinweise'}
              </span>
            </div>
            {infoInsights.map((insight, idx) => (
              <InsightCard
                key={insight.id || idx}
                insight={insight}
                onTakeAction={onTakeAction}
                showLearningNotes={showLearningNotes}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InsightCard({
  insight,
  onTakeAction,
  showLearningNotes
}: {
  insight: ExplainableInsight
  onTakeAction?: (insight: ExplainableInsight, action: DecisionAction) => void
  showLearningNotes: boolean
}) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [showDecisions, setShowDecisions] = useState(true)

  const isCritical = insight.severity === 'critical'
  const isWarning = insight.severity === 'warning'
  const isInfo = insight.severity === 'info'

  const borderColor = isCritical
    ? 'border-destructive'
    : isWarning
    ? 'border-accent'
    : 'border-blue-500/30'

  const bgColor = isCritical
    ? 'bg-destructive/5'
    : isWarning
    ? 'bg-accent/5'
    : 'bg-blue-500/5'

  const Icon = isCritical ? XCircle : isWarning ? Warning : Info

  const defaultAction = insight.decisionMode.actions.find(
    a => a.id === insight.decisionMode.defaultAction
  )

  return (
    <Card className={cn('border-2', borderColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', bgColor)}>
            <Icon
              className={cn(
                'h-5 w-5',
                isCritical && 'text-destructive',
                isWarning && 'text-accent',
                isInfo && 'text-blue-600'
              )}
              weight="duotone"
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base leading-snug">{insight.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {insight.shortMessage}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-auto py-2 text-sm font-medium hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Question className="h-4 w-4 text-primary" weight="duotone" />
                Warum sehe ich das?
              </div>
              <CaretDown
                className={cn('h-4 w-4 transition-transform', showExplanation && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" weight="duotone" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Erklärung</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.explanation.reason}
                    </p>
                  </div>
                </div>
              </div>

              {insight.explanation.comparisonValues.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Vergleichswerte
                    </p>
                    <div className="space-y-2">
                      {insight.explanation.comparisonValues.map((comparison, idx) => (
                        <ComparisonDisplay key={idx} comparison={comparison} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {insight.explanation.evidence.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Nachweise
                    </p>
                    <ul className="space-y-1">
                      {insight.explanation.evidence.map((evidence, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 shrink-0 mt-0.5 text-primary" weight="fill" />
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {insight.explanation.context && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 p-2 bg-primary/5 rounded border border-primary/10">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" weight="duotone" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.explanation.context}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={showDecisions} onOpenChange={setShowDecisions}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-auto py-2 text-sm font-medium hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" weight="duotone" />
                {insight.decisionMode.question}
              </div>
              <CaretDown
                className={cn('h-4 w-4 transition-transform', showDecisions && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3">
              {showLearningNotes &&
                insight.learningData &&
                insight.learningData.previousDecisions.length >= 3 && (
                  <Alert className="bg-purple-500/5 border-purple-500/30">
                    <Brain className="h-4 w-4 text-purple-600" weight="duotone" />
                    <AlertTitle className="text-sm text-purple-900">KI-Lernhinweis</AlertTitle>
                    <AlertDescription className="text-xs text-purple-700">
                      {insight.decisionMode.learningNote ||
                        `Basierend auf ${insight.learningData.previousDecisions.length} früheren Entscheidungen.`}
                      {insight.learningData.suggestedAction && insight.learningData.confidence && (
                        <span className="block mt-1">
                          Vorschlag: {insight.learningData.suggestedAction} (
                          {Math.round(insight.learningData.confidence * 100)}% Konfidenz)
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

              <div className="space-y-2">
                {insight.decisionMode.actions.map((action) => {
                  const isDefault = action.id === insight.decisionMode.defaultAction
                  return (
                    <ActionButton
                      key={action.id}
                      action={action}
                      isDefault={isDefault}
                      onTakeAction={() => onTakeAction?.(insight, action)}
                    />
                  )
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function CompactInsightCard({
  insight,
  onTakeAction
}: {
  insight: ExplainableInsight
  onTakeAction?: (insight: ExplainableInsight, action: DecisionAction) => void
}) {
  const isCritical = insight.severity === 'critical'
  const isWarning = insight.severity === 'warning'

  const Icon = isCritical ? XCircle : isWarning ? Warning : Info

  const quickAction = insight.decisionMode.actions[0]

  return (
    <Alert
      className={cn(
        'py-3',
        isCritical && 'border-destructive bg-destructive/5',
        isWarning && 'border-accent bg-accent/5',
        !isCritical && !isWarning && 'border-blue-500/30 bg-blue-500/5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 mt-0.5',
              isCritical && 'text-destructive',
              isWarning && 'text-accent',
              !isCritical && !isWarning && 'text-blue-600'
            )}
            weight="fill"
          />
          <div className="flex-1">
            <AlertDescription className="text-sm font-medium">
              {insight.shortMessage}
            </AlertDescription>
          </div>
        </div>
        {quickAction && onTakeAction && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 h-auto py-1.5 px-3 text-xs"
            onClick={() => onTakeAction(insight, quickAction)}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {quickAction.label}
          </Button>
        )}
      </div>
    </Alert>
  )
}

function ComparisonDisplay({ comparison }: { comparison: ExplainableInsight['explanation']['comparisonValues'][0] }) {
  let deviationIcon: React.ReactNode = null
  let deviationColor = ''

  if (comparison.deviation !== undefined) {
    const absDeviation = Math.abs(comparison.deviation)
    if (absDeviation > 50) {
      deviationIcon = comparison.deviation > 0 ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />
      deviationColor = 'text-destructive'
    } else if (absDeviation > 20) {
      deviationIcon = comparison.deviation > 0 ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />
      deviationColor = 'text-accent'
    } else {
      deviationIcon = <Equals className="h-3 w-3" />
      deviationColor = 'text-green-600'
    }
  }

  return (
    <div className="flex items-center justify-between p-2 bg-background/50 rounded border text-sm">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{comparison.label}</p>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs text-muted-foreground">Aktuell: </span>
            <span className="font-semibold">
              {comparison.current}
              {comparison.unit && ` ${comparison.unit}`}
            </span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <div>
            <span className="text-xs text-muted-foreground">Typisch: </span>
            <span className="font-medium text-muted-foreground">
              {comparison.typical}
              {comparison.unit && ` ${comparison.unit}`}
            </span>
          </div>
        </div>
      </div>
      {deviationIcon && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', deviationColor)}>
          {deviationIcon}
          <span>{Math.abs(comparison.deviation || 0).toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  action,
  isDefault,
  onTakeAction
}: {
  action: DecisionAction
  isDefault: boolean
  onTakeAction: () => void
}) {
  const typeColors = {
    accept: 'border-green-500/50 hover:bg-green-500/10 hover:border-green-500',
    fix: 'border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500',
    adjust: 'border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-500',
    notify: 'border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500',
    disable: 'border-gray-500/50 hover:bg-gray-500/10 hover:border-gray-500',
    split: 'border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-500',
    manual: 'border-yellow-500/50 hover:bg-yellow-500/10 hover:border-yellow-500'
  }

  return (
    <Button
      variant={isDefault ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'w-full h-auto py-3 px-4 flex items-start gap-3 text-left justify-start',
        !isDefault && typeColors[action.type]
      )}
      onClick={onTakeAction}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{action.label}</span>
          {isDefault && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkle className="h-3 w-3" weight="fill" />
              Empfohlen
            </Badge>
          )}
          {action.learnFromThis && (
            <Badge variant="outline" className="text-xs gap-1 border-purple-500/50 text-purple-600">
              <Brain className="h-3 w-3" weight="duotone" />
              KI lernt
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1.5">{action.description}</p>
        {action.consequence && (
          <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border/50">
            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground italic">{action.consequence}</p>
          </div>
        )}
      </div>
    </Button>
  )
}
