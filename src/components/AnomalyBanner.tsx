import { useState } from 'react'
import { X, WarningCircle, ClockCountdown, TrendUp, Calendar } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GapOvertimeAnalysis, GapOvertimeDetector, GapOvertimeType, Severity } from '@/lib/gap-overtime-detection'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface AnomalyBannerProps {
  analysis: GapOvertimeAnalysis
  onDismiss?: () => void
  onFillGaps?: () => void
  className?: string
}

export function AnomalyBanner({
  analysis,
  onDismiss,
  onFillGaps,
  className
}: AnomalyBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (isDismissed || !GapOvertimeDetector.shouldShowBanner(analysis)) {
    return null
  }

  const mostUrgentIssue = GapOvertimeDetector.getMostUrgentIssue(analysis)
  const bannerMessage = GapOvertimeDetector.getBannerMessage(analysis)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleFillGaps = () => {
    onFillGaps?.()
  }

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH:
        return 'destructive'
      case Severity.MEDIUM:
        return 'default'
      case Severity.LOW:
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type: GapOvertimeType) => {
    switch (type) {
      case GapOvertimeType.MISSING_HOURS:
      case GapOvertimeType.NO_ENTRIES:
        return <ClockCountdown className="h-5 w-5" weight="duotone" />
      case GapOvertimeType.OVERTIME:
        return <TrendUp className="h-5 w-5" weight="duotone" />
      case GapOvertimeType.WEEKEND_WORK:
        return <Calendar className="h-5 w-5" weight="duotone" />
      default:
        return <WarningCircle className="h-5 w-5" weight="duotone" />
    }
  }

  const getTypeLabel = (type: GapOvertimeType) => {
    switch (type) {
      case GapOvertimeType.MISSING_HOURS:
        return 'Fehlende Stunden'
      case GapOvertimeType.NO_ENTRIES:
        return 'Keine Einträge'
      case GapOvertimeType.OVERTIME:
        return 'Überstunden'
      case GapOvertimeType.WEEKEND_WORK:
        return 'Wochenendarbeit'
      default:
        return 'Anomalie'
    }
  }

  const hasGaps = analysis.summary.totalGaps > 0

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn('w-full', className)}
        >
          <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 via-background to-background shadow-md">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <WarningCircle className="h-6 w-6 text-accent" weight="duotone" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Anomalie-Hinweise
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {bannerMessage}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {analysis.summary.totalGaps > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <ClockCountdown className="h-3 w-3" weight="duotone" />
                            {analysis.summary.totalMissingHours.toFixed(1)}h fehlen
                          </Badge>
                        )}
                        {analysis.summary.totalOvertime > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <TrendUp className="h-3 w-3" weight="duotone" />
                            {analysis.summary.totalExcessHours.toFixed(1)}h Überstunden
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" weight="duotone" />
                          {analysis.summary.affectedDays} Tag{analysis.summary.affectedDays !== 1 ? 'e' : ''}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {hasGaps && (
                          <Button
                            onClick={handleFillGaps}
                            size="sm"
                            className="gap-2 bg-accent hover:bg-accent/90"
                          >
                            <ClockCountdown className="h-4 w-4" weight="duotone" />
                            Jetzt ergänzen
                          </Button>
                        )}
                        <Button
                          onClick={() => setShowDetails(true)}
                          size="sm"
                          variant="outline"
                        >
                          Details anzeigen
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleDismiss}
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Anomalie-Details (Letzte 7 Tage)</DialogTitle>
            <DialogDescription>
              Übersicht aller erkannten Zeiterfassungs-Anomalien
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-destructive">
                        {analysis.summary.totalGaps}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Lücken
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {analysis.summary.totalMissingHours.toFixed(1)}h fehlen
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent">
                        {analysis.summary.totalOvertime}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Überstunden
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {analysis.summary.totalExcessHours.toFixed(1)}h mehr
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Alle Anomalien ({analysis.issues.length})
                </h4>

                {analysis.issues
                  .sort((a, b) => {
                    if (a.severity !== b.severity) {
                      const severityOrder = { high: 0, medium: 1, low: 2 }
                      return severityOrder[a.severity] - severityOrder[b.severity]
                    }
                    return b.date.localeCompare(a.date)
                  })
                  .map((issue) => (
                    <Card key={issue.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div
                              className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                issue.severity === Severity.HIGH && 'bg-destructive/10 text-destructive',
                                issue.severity === Severity.MEDIUM && 'bg-accent/10 text-accent',
                                issue.severity === Severity.LOW && 'bg-secondary/10 text-secondary-foreground'
                              )}
                            >
                              {getTypeIcon(issue.type)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="font-semibold text-sm">
                                {issue.title}
                              </h5>
                              <Badge
                                variant={getSeverityColor(issue.severity)}
                                className="text-xs"
                              >
                                {getTypeLabel(issue.type)}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {format(parseISO(issue.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                            </p>

                            <p className="text-sm mb-2">{issue.description}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Erwartet: <span className="font-medium">{issue.expectedHours}h</span>
                              </span>
                              <span>
                                Erfasst: <span className="font-medium">{issue.actualHours.toFixed(1)}h</span>
                              </span>
                              <span>
                                Differenz:{' '}
                                <span
                                  className={cn(
                                    'font-medium',
                                    issue.difference < 0 ? 'text-destructive' : 'text-accent'
                                  )}
                                >
                                  {issue.difference > 0 ? '+' : ''}
                                  {issue.difference.toFixed(1)}h
                                </span>
                              </span>
                            </div>

                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              💡 {issue.suggestedAction}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            {hasGaps && (
              <Button onClick={() => {
                setShowDetails(false)
                handleFillGaps()
              }} className="gap-2 bg-accent hover:bg-accent/90">
                <ClockCountdown className="h-4 w-4" weight="duotone" />
                Jetzt ergänzen
              </Button>
            )}
            <Button onClick={() => setShowDetails(false)} variant="outline">
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
