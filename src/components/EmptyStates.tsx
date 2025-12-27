import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Clock, FolderOpen, ChartBar, FileText, ListBullets, Users, Lightning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  ctaLabel?: string
  ctaAction?: () => void
  ctaIcon?: ReactNode
  secondaryCtaLabel?: string
  secondaryCtaAction?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  ctaIcon,
  secondaryCtaLabel,
  secondaryCtaAction,
  className,
  variant = 'default'
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between p-4 border border-dashed rounded-lg bg-muted/20', className)}>
        <div className="flex items-center gap-3">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            <p className="text-sm font-medium">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {ctaLabel && ctaAction && (
          <Button onClick={ctaAction} size="sm" className="gap-2">
            {ctaIcon}
            {ctaLabel}
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
          {ctaLabel && ctaAction && (
            <Button onClick={ctaAction} size="sm" className="gap-2">
              {ctaIcon}
              {ctaLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && (
          <div className="mb-4 p-4 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {description}
          </p>
        )}
        <div className="flex gap-2">
          {ctaLabel && ctaAction && (
            <Button onClick={ctaAction} className="gap-2">
              {ctaIcon}
              {ctaLabel}
            </Button>
          )}
          {secondaryCtaLabel && secondaryCtaAction && (
            <Button onClick={secondaryCtaAction} variant="outline">
              {secondaryCtaLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyTimeEntries({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<Clock className="h-12 w-12" weight="duotone" />}
      title="Noch keine Zeiteinträge"
      description="Starten Sie jetzt mit der Zeiterfassung und verfolgen Sie Ihre Arbeitszeit effizient."
      ctaLabel="Jetzt Zeit erfassen"
      ctaAction={onAdd}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
    />
  )
}

export function EmptyProjects({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="h-12 w-12" weight="duotone" />}
      title="Keine Projekte vorhanden"
      description="Erstellen Sie Ihr erstes Projekt, um mit der Zeiterfassung zu beginnen."
      ctaLabel="Projekt erstellen"
      ctaAction={onAdd}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
    />
  )
}

export function EmptyReports({ onGenerate }: { onGenerate: () => void }) {
  return (
    <EmptyState
      icon={<ChartBar className="h-12 w-12" weight="duotone" />}
      title="Keine Daten verfügbar"
      description="Erfassen Sie Zeiteinträge, um detaillierte Berichte und Analysen zu generieren."
      ctaLabel="Zeiteinträge ansehen"
      ctaAction={onGenerate}
      ctaIcon={<Clock className="h-4 w-4" weight="bold" />}
    />
  )
}

export function EmptyEmployees({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" weight="duotone" />}
      title="Keine Mitarbeiter"
      description="Fügen Sie Mitarbeiter hinzu, um mit der Zeiterfassung zu starten."
      ctaLabel="Mitarbeiter hinzufügen"
      ctaAction={onAdd}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
    />
  )
}

export function EmptyTasks({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<ListBullets className="h-12 w-12" weight="duotone" />}
      title="Keine Aufgaben"
      description="Erstellen Sie Aufgaben für eine detailliertere Projektstruktur."
      ctaLabel="Aufgabe erstellen"
      ctaAction={onAdd}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
      variant="compact"
    />
  )
}

export function EmptyAutomation({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={<Lightning className="h-12 w-12" weight="duotone" />}
      title="Keine Automatisierungen"
      description="Richten Sie wiederkehrende Einträge und Erinnerungen ein, um Zeit zu sparen."
      ctaLabel="Automatisierung erstellen"
      ctaAction={onAdd}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
    />
  )
}

export function EmptyWeekView({ onAddTime }: { onAddTime: () => void }) {
  return (
    <EmptyState
      icon={<Clock className="h-8 w-8" weight="duotone" />}
      title="Keine Einträge diese Woche"
      description="Erfassen Sie Ihre Zeit für die aktuelle Woche."
      ctaLabel="Jetzt Zeit erfassen"
      ctaAction={onAddTime}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
      variant="inline"
    />
  )
}

export function EmptyDayView({ onAddTime }: { onAddTime: () => void }) {
  return (
    <EmptyState
      icon={<Clock className="h-8 w-8" weight="duotone" />}
      title="Noch keine Einträge heute"
      description="Starten Sie den Timer oder erfassen Sie Zeit manuell."
      ctaLabel="Zeit erfassen"
      ctaAction={onAddTime}
      ctaIcon={<Plus className="h-4 w-4" weight="bold" />}
      variant="inline"
    />
  )
}
