import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ShieldCheck, ShieldWarning, ShieldSlash, Shield, Calendar, MapPin, FileText, CheckCircle } from '@phosphor-icons/react'
import { TrustMetrics } from '@/lib/trust-layer'

interface TrustIndicatorProps {
  trustMetrics?: TrustMetrics
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function TrustIndicator({ trustMetrics, size = 'md', showDetails = true }: TrustIndicatorProps) {
  if (!trustMetrics) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1 bg-gray-50 text-gray-600 border-gray-200">
              <Shield className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              {size !== 'sm' && <span>-</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Noch nicht bewertet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const { plausibilityScore, trustLevel, factors, evidenceAnchors, flaggedIssues } = trustMetrics

  const getIcon = () => {
    switch (trustLevel) {
      case 'high':
        return <ShieldCheck className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} weight="fill" />
      case 'medium':
        return <ShieldWarning className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} weight="fill" />
      case 'low':
        return <ShieldWarning className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} weight="fill" />
      case 'unverified':
        return <ShieldSlash className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} weight="fill" />
    }
  }

  const getColorClass = () => {
    switch (trustLevel) {
      case 'high':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
      case 'low':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
      case 'unverified':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    }
  }

  const getLabel = () => {
    switch (trustLevel) {
      case 'high': return 'Hoch'
      case 'medium': return 'Mittel'
      case 'low': return 'Niedrig'
      case 'unverified': return 'Ungeprüft'
    }
  }

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`gap-1 ${getColorClass()}`}>
              {getIcon()}
              {size !== 'sm' && <span>{plausibilityScore}%</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-medium">{getLabel()} ({plausibilityScore}%)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 cursor-help ${getColorClass()}`}>
            {getIcon()}
            {size !== 'sm' && <span>{plausibilityScore}%</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm" side="bottom" align="start">
          <div className="space-y-2 p-1">
            <div className="font-medium text-sm border-b pb-1 mb-2">
              {getLabel()} Vertrauen ({plausibilityScore}%)
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="text-muted-foreground">Zeitl. Konsistenz:</div>
                <div className="font-medium text-right">{factors.temporalConsistency}%</div>
                
                <div className="text-muted-foreground">Plan vs. Ist:</div>
                <div className="font-medium text-right">{factors.planVsActual}%</div>
                
                <div className="text-muted-foreground">Projekt-Historie:</div>
                <div className="font-medium text-right">{factors.projectHistory}%</div>
                
                <div className="text-muted-foreground">Team-Vergleich:</div>
                <div className="font-medium text-right">{factors.teamComparison}%</div>
                
                <div className="text-muted-foreground">Beweisqualität:</div>
                <div className="font-medium text-right">{factors.evidenceQuality}%</div>
              </div>
            </div>

            {evidenceAnchors.length > 0 && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="font-medium text-xs mb-1">Beweisanker:</div>
                  <div className="space-y-1">
                    {evidenceAnchors.slice(0, 3).map((anchor, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs">
                        {anchor.type === 'calendar' && <Calendar className="h-3 w-3" />}
                        {anchor.type === 'location_hash' && <MapPin className="h-3 w-3" />}
                        {anchor.type === 'file' && <FileText className="h-3 w-3" />}
                        {anchor.type === 'approval' && <CheckCircle className="h-3 w-3" />}
                        <span className="truncate">{anchor.value}</span>
                      </div>
                    ))}
                    {evidenceAnchors.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{evidenceAnchors.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {flaggedIssues.length > 0 && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="font-medium text-xs mb-1 text-orange-600">Hinweise:</div>
                  <div className="space-y-0.5">
                    {flaggedIssues.slice(0, 2).map((issue, idx) => (
                      <div key={idx} className="text-xs text-orange-600">• {issue}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
