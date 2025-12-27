import { ValidationResult, ValidationSeverity, ValidationQuickFix } from '@/lib/validation-rules'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ShieldWarning, ShieldCheck, Info, XCircle, Warning, Lightbulb, CaretDown, CheckCircle, Question } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ValidationDisplayProps {
  results: ValidationResult[]
  showSoftWarnings?: boolean
  compact?: boolean
  onApplyFix?: (result: ValidationResult, fix: ValidationQuickFix) => void
}

export function ValidationDisplay({ results, showSoftWarnings = true, compact = false, onApplyFix }: ValidationDisplayProps) {
  const hardErrors = results.filter(r => r.severity === ValidationSeverity.HARD && !r.valid)
  const softWarnings = results.filter(r => r.severity === ValidationSeverity.SOFT)

  if (hardErrors.length === 0 && (!showSoftWarnings || softWarnings.length === 0)) {
    return null
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {hardErrors.map((error, idx) => (
          <Alert key={idx} variant="destructive" className="py-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
        ))}
        {showSoftWarnings && softWarnings.map((warning, idx) => (
          <Alert key={idx} className="py-2 border-accent/50 bg-accent/5">
            <Warning className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm text-muted-foreground">
              {warning.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn(
      'border-2',
      hardErrors.length > 0 ? 'border-destructive' : 'border-accent/30'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {hardErrors.length > 0 ? (
            <ShieldWarning className="h-5 w-5 text-destructive" weight="duotone" />
          ) : (
            <Info className="h-5 w-5 text-accent" weight="duotone" />
          )}
          <CardTitle className="text-base">
            {hardErrors.length > 0 ? 'Fehler gefunden' : 'Hinweise zur Zeiterfassung'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {hardErrors.length > 0 
            ? 'Diese Fehler müssen behoben werden, bevor gespeichert werden kann'
            : 'Überprüfen Sie die folgenden Warnungen'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hardErrors.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Hard Rules
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {hardErrors.length} {hardErrors.length === 1 ? 'Fehler' : 'Fehler'}
                </span>
              </div>
              {hardErrors.map((error, idx) => (
                <ValidationItem key={idx} result={error} onApplyFix={onApplyFix} />
              ))}
            </div>
            {softWarnings.length > 0 && <Separator />}
          </>
        )}
        
        {showSoftWarnings && softWarnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1 border-accent text-accent">
                <Warning className="h-3 w-3" />
                Soft Rules
              </Badge>
              <span className="text-xs text-muted-foreground">
                {softWarnings.length} {softWarnings.length === 1 ? 'Warnung' : 'Warnungen'}
              </span>
            </div>
            {softWarnings.map((warning, idx) => (
              <ValidationItem key={idx} result={warning} onApplyFix={onApplyFix} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ValidationItem({ result, onApplyFix }: { result: ValidationResult; onApplyFix?: (result: ValidationResult, fix: ValidationQuickFix) => void }) {
  const isError = result.severity === ValidationSeverity.HARD && !result.valid
  const [showExplanation, setShowExplanation] = useState(false)
  
  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-md text-sm border',
      isError ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/5 border-accent/20'
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {isError ? (
          <XCircle className="h-4 w-4 text-destructive" weight="fill" />
        ) : (
          <Warning className="h-4 w-4 text-accent" weight="fill" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <p className={cn(
          'font-medium',
          isError ? 'text-destructive' : 'text-foreground'
        )}>
          {result.message}
        </p>
        
        {result.explanation && (
          <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                <Question className="h-3 w-3" />
                Warum wurde das markiert?
                <CaretDown className={cn("h-3 w-3 transition-transform", showExplanation && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border leading-relaxed">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" weight="duotone" />
                  <p>{result.explanation}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {result.quickFixes && result.quickFixes.length > 0 && onApplyFix && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" />
              1-Klick-Lösungen:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.quickFixes.map((fix) => (
                <Button
                  key={fix.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5 px-3 text-xs gap-1.5"
                  onClick={() => onApplyFix(result, fix)}
                >
                  <CheckCircle className="h-3 w-3" />
                  {fix.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
            {result.metadata.conflictingProject && (
              <p>Konflikt mit Projekt: {result.metadata.conflictingProject}</p>
            )}
            {result.metadata.projectName && (
              <p>Projekt: {result.metadata.projectName}</p>
            )}
            {result.metadata.totalHours && (
              <p>Gesamtstunden: {result.metadata.totalHours.toFixed(1)}h</p>
            )}
            {result.metadata.duration && (
              <p>Dauer: {result.metadata.duration.toFixed(1)}h</p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="outline" className="text-xs font-mono">
            {result.code}
          </Badge>
          {result.field && (
            <span className="text-xs text-muted-foreground">
              Feld: {result.field}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ValidationSummaryBadgeProps {
  hardErrorCount: number
  softWarningCount: number
  showText?: boolean
}

export function ValidationSummaryBadge({ 
  hardErrorCount, 
  softWarningCount, 
  showText = true 
}: ValidationSummaryBadgeProps) {
  if (hardErrorCount === 0 && softWarningCount === 0) {
    return (
      <Badge variant="outline" className="gap-1.5 border-green-500/50 bg-green-500/5 text-green-700">
        <ShieldCheck className="h-3 w-3" weight="fill" />
        {showText && <span>Keine Probleme</span>}
      </Badge>
    )
  }

  if (hardErrorCount > 0) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3 w-3" weight="fill" />
        {showText && <span>{hardErrorCount} Fehler</span>}
        {!showText && <span>{hardErrorCount}</span>}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5 border-accent text-accent">
      <Warning className="h-3 w-3" weight="fill" />
      {showText && <span>{softWarningCount} {softWarningCount === 1 ? 'Warnung' : 'Warnungen'}</span>}
      {!showText && <span>{softWarningCount}</span>}
    </Badge>
  )
}
