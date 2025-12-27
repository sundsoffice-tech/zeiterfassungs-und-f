import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowsClockwise, Play, Clock, Star, CaretRight, DotsSixVertical } from '@phosphor-icons/react'
import { Employee, Project, Task, Phase, TimeEntry, ActiveTimer } from '@/lib/types'
import { format, isToday, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, Reorder } from 'framer-motion'

interface ContinueWorkTileProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
  activeTimer: ActiveTimer | null
  onResumeEntry: (entry: TimeEntry) => void
  onStartFromFavorite: (projectId: string, phaseId?: string, taskId?: string) => void
}

export function ContinueWorkTile({
  employees,
  projects,
  tasks,
  phases,
  timeEntries,
  activeTimer,
  onResumeEntry,
  onStartFromFavorite
}: ContinueWorkTileProps) {
  const [recentActionsPriority, setRecentActionsPriority] = useKV<string[]>('recent-actions-priority', [])
  const [orderedRecentEntries, setOrderedRecentEntries] = useState<TimeEntry[]>([])

  const getLastEntry = (): TimeEntry | null => {
    if (timeEntries.length === 0) return null
    
    const sortedEntries = [...timeEntries].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.endTime.localeCompare(a.endTime)
    })
    
    return sortedEntries[0]
  }

  const getRecentEntries = (): TimeEntry[] => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentEntries = timeEntries
      .filter(entry => {
        const entryDate = parseISO(entry.date)
        return entryDate >= sevenDaysAgo
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.endTime.localeCompare(a.endTime)
      })
    
    const uniqueProjects = new Map<string, TimeEntry>()
    for (const entry of recentEntries) {
      const key = `${entry.projectId}-${entry.phaseId || ''}-${entry.taskId || ''}`
      if (!uniqueProjects.has(key)) {
        uniqueProjects.set(key, entry)
      }
    }
    
    return Array.from(uniqueProjects.values()).slice(0, 5)
  }

  useEffect(() => {
    const baseEntries = getRecentEntries()
    
    if (!recentActionsPriority || recentActionsPriority.length === 0) {
      setOrderedRecentEntries(baseEntries)
      return
    }

    const priorityMap = new Map(recentActionsPriority.map((id, index) => [id, index]))
    
    const sorted = [...baseEntries].sort((a, b) => {
      const aPriority = priorityMap.get(a.id) ?? Infinity
      const bPriority = priorityMap.get(b.id) ?? Infinity
      return aPriority - bPriority
    })
    
    setOrderedRecentEntries(sorted)
  }, [timeEntries, recentActionsPriority])

  const handleReorder = (newOrder: TimeEntry[]) => {
    setOrderedRecentEntries(newOrder)
    setRecentActionsPriority((current) => newOrder.map(entry => entry.id))
  }

  const getFavoriteEntries = (): TimeEntry[] => {
    return timeEntries
      .filter(entry => entry.isFavorite)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
  }

  const getProjectName = (projectId: string): string => {
    return projects.find(p => p.id === projectId)?.name || 'Unbekanntes Projekt'
  }

  const getTaskName = (taskId?: string): string | undefined => {
    if (!taskId) return undefined
    return tasks.find(t => t.id === taskId)?.name
  }

  const getPhaseName = (phaseId?: string): string | undefined => {
    if (!phaseId) return undefined
    return phases.find(ph => ph.id === phaseId)?.name
  }

  const formatDuration = (duration: number): string => {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    if (hours === 0) return `${minutes}min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  const lastEntry = getLastEntry()
  const favoriteEntries = getFavoriteEntries()

  return (
    <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-background border-accent/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
            <ArrowsClockwise className="h-6 w-6 text-white" weight="bold" />
          </div>
          <div>
            <CardTitle className="text-xl">Weitermachen</CardTitle>
            <CardDescription>Letzter Timer fortsetzen oder schnell starten</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastEntry && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" weight="duotone" />
              <span>Zuletzt bearbeitet</span>
            </div>
            <div 
              className={cn(
                "group relative p-4 rounded-lg border bg-card hover:bg-accent/5 hover:border-accent/40 transition-all cursor-pointer",
                "hover:shadow-md"
              )}
              onClick={() => onResumeEntry(lastEntry)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{getProjectName(lastEntry.projectId)}</span>
                    {lastEntry.billable && (
                      <Badge variant="secondary" className="text-xs">Abrechenbar</Badge>
                    )}
                  </div>
                  {(lastEntry.phaseId || lastEntry.taskId) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {lastEntry.phaseId && (
                        <span>{getPhaseName(lastEntry.phaseId)}</span>
                      )}
                      {lastEntry.phaseId && lastEntry.taskId && (
                        <CaretRight className="h-3 w-3" weight="bold" />
                      )}
                      {lastEntry.taskId && (
                        <span>{getTaskName(lastEntry.taskId)}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{format(parseISO(lastEntry.date), 'EEE, dd. MMM', { locale: de })}</span>
                    <span>•</span>
                    <span>{formatDuration(lastEntry.duration)}</span>
                  </div>
                  {lastEntry.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{lastEntry.notes}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  className="shrink-0 gap-2 bg-accent hover:bg-accent/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResumeEntry(lastEntry)
                  }}
                >
                  <Play className="h-4 w-4" weight="fill" />
                  Starten
                </Button>
              </div>
            </div>
          </div>
        )}

        {favoriteEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" weight="fill" />
                <span>Favoriten</span>
              </div>
              <div className="space-y-2">
                {favoriteEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 hover:border-accent/40 transition-all cursor-pointer"
                    )}
                    onClick={() => onStartFromFavorite(entry.projectId, entry.phaseId, entry.taskId)}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{getProjectName(entry.projectId)}</div>
                      {(entry.phaseId || entry.taskId) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.phaseId && <span>{getPhaseName(entry.phaseId)}</span>}
                          {entry.phaseId && entry.taskId && <CaretRight className="h-3 w-3" weight="bold" />}
                          {entry.taskId && <span>{getTaskName(entry.taskId)}</span>}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartFromFavorite(entry.projectId, entry.phaseId, entry.taskId)
                      }}
                    >
                      <Play className="h-4 w-4" weight="fill" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {orderedRecentEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" weight="duotone" />
                <span>Letzte Aktionen (7 Tage)</span>
                <Badge variant="outline" className="text-xs ml-auto">Ziehen zum Sortieren</Badge>
              </div>
              <ScrollArea className="h-[200px]">
                <Reorder.Group 
                  axis="y" 
                  values={orderedRecentEntries} 
                  onReorder={handleReorder}
                  className="space-y-2 pr-4"
                >
                  {orderedRecentEntries.map((entry) => (
                    <Reorder.Item
                      key={entry.id}
                      value={entry}
                      className={cn(
                        "group flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/5 hover:border-accent/40 transition-all cursor-grab active:cursor-grabbing",
                        "hover:shadow-sm"
                      )}
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        borderColor: "oklch(0.68 0.19 45)"
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="shrink-0 text-muted-foreground/40 group-hover:text-accent transition-colors cursor-grab active:cursor-grabbing">
                        <DotsSixVertical className="h-5 w-5" weight="bold" />
                      </div>
                      <div 
                        className="flex-1 flex items-center justify-between"
                        onClick={() => onResumeEntry(entry)}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="font-medium text-sm">{getProjectName(entry.projectId)}</div>
                          {(entry.phaseId || entry.taskId) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {entry.phaseId && <span>{getPhaseName(entry.phaseId)}</span>}
                              {entry.phaseId && entry.taskId && <CaretRight className="h-3 w-3" weight="bold" />}
                              {entry.taskId && <span>{getTaskName(entry.taskId)}</span>}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(entry.date), 'dd.MM.yyyy', { locale: de })} • {formatDuration(entry.duration)}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            onResumeEntry(entry)
                          }}
                        >
                          <Play className="h-4 w-4" weight="fill" />
                        </Button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </ScrollArea>
            </div>
          </>
        )}

        {!lastEntry && orderedRecentEntries.length === 0 && favoriteEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" weight="duotone" />
            <p className="text-sm">Noch keine Zeiteinträge vorhanden</p>
            <p className="text-xs mt-1">Starten Sie einen Timer, um hier fortzufahren</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
