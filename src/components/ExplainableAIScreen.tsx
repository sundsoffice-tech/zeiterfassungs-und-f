import { useState, useMemo } from 'react'
import { Employee, Project, TimeEntry, Task, Phase } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExplainableInsightDisplay } from '@/components/ExplainableInsightDisplay'
import { useExplainableAI } from '@/hooks/use-explainable-ai'
import { useTimeEntryValidation } from '@/hooks/use-validation'
import { ValidationQuickFix, ValidationResult } from '@/lib/validation-rules'
import { AnomalyDetector, AnomalyAnalysisContext } from '@/lib/anomaly-detection'
import { StrictnessMode, DecisionAction, ExplainableInsight } from '@/lib/explainable-ai'
import {
  Brain,
  Sparkle,
  ChartBar,
  TrendUp,
  ShieldCheck,
  Lightbulb,
  Target,
  CheckCircle,
  Info,
  ArrowRight,
  ListChecks
} from '@phosphor-icons/react'
import { format, subDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'
import { AIInsightSkeleton } from '@/components/SkeletonLoaders'

interface ExplainableAIScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
}

export function ExplainableAIScreen({
  employees,
  projects,
  tasks,
  phases,
  timeEntries
}: ExplainableAIScreenProps) {
  const {
    strictnessMode,
    setStrictnessMode,
    adminDecisions,
    generateInsightsFromValidations,
    generateInsightsFromAnomalies,
    recordDecision,
    getDecisionStats,
    clearDecisionHistory
  } = useExplainableAI()

  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [selectedTab, setSelectedTab] = useState<'demo' | 'dashboard' | 'learning'>('demo')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

  const problematicEntries = useMemo(() => {
    return timeEntries
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
  }, [timeEntries])

  const validation = useTimeEntryValidation({
    entry: selectedEntry || {
      id: '',
      tenantId: '',
      employeeId: '',
      projectId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      duration: 8,
      tags: [],
      location: '',
      notes: '',
      costCenter: '',
      billable: false,
      approvalStatus: 'draft' as any,
      locked: false,
      audit: { createdBy: '', createdAt: '' },
      changeLog: []
    },
    allEntries: timeEntries,
    projects,
    employees,
    absences: [],
    holidays: [],
    tenantSettings: {
      maxDailyHours: 12,
      restrictedHours: { start: '03:00', end: '05:00' },
      weekendWorkRequiresApproval: true,
      requireNotesForBillable: true
    }
  })

  const allInsights = useMemo(() => {
    if (!selectedEntry) return []

    setIsGeneratingInsights(true)
    try {
      const validationInsights = generateInsightsFromValidations(
        selectedEntry,
        validation.results,
        { allEntries: timeEntries, projects, employees, tasks }
      )

      return validationInsights
    } finally {
      setTimeout(() => setIsGeneratingInsights(false), 300)
    }
  }, [selectedEntry, validation.results, timeEntries, projects, employees, tasks, generateInsightsFromValidations])

  const handleActionTaken = async (insight: ExplainableInsight, action: DecisionAction) => {
    if (!selectedEntry) return

    recordDecision(insight, action, selectedEntry)

    toast.success('Aktion ausgeführt', {
      description: `${action.label} wurde angewendet und die KI hat deine Entscheidung gelernt.`
    })

    console.log('Action taken:', {
      insight,
      action,
      entry: selectedEntry
    })
  }

  const learningStats = useMemo(() => {
    const stats: Record<string, ReturnType<typeof getDecisionStats>> = {}
    
    const uniqueTypes = new Set(
      adminDecisions.map(d => d.insightType)
    )

    uniqueTypes.forEach(type => {
      stats[type] = getDecisionStats(type)
    })

    return stats
  }, [adminDecisions, getDecisionStats])

  const overallAcceptRate = useMemo(() => {
    if (adminDecisions.length === 0) return 0
    const acceptActions = adminDecisions.filter(d => 
      d.actionTaken.includes('accept') || d.actionTaken.includes('confirm')
    )
    return (acceptActions.length / adminDecisions.length) * 100
  }, [adminDecisions])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="h-7 w-7 text-white" weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Erklärbare KI</h2>
            <p className="text-sm text-muted-foreground">
              Transparente KI-Validierung mit Entscheidungsmodus
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" weight="duotone" />
              Getroffene Entscheidungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{adminDecisions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              KI lernt aus deinen Mustern
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" weight="duotone" />
              Akzeptanzrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallAcceptRate.toFixed(0)}%</div>
            <Progress value={overallAcceptRate} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              Anteil akzeptierter Warnungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" weight="duotone" />
              Aktiver Modus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {strictnessMode === StrictnessMode.STRICT && '🛡️ Streng'}
              {strictnessMode === StrictnessMode.NEUTRAL && '⚖️ Neutral'}
              {strictnessMode === StrictnessMode.RELAXED && '🍃 Locker'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Validierungsstrenge
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo" className="gap-2">
            <Lightbulb className="h-4 w-4" weight="duotone" />
            Demo
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <ChartBar className="h-4 w-4" weight="duotone" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2">
            <Brain className="h-4 w-4" weight="duotone" />
            KI-Lernen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4 mt-6">
          <Alert className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <Brain className="h-4 w-4 text-purple-600" weight="duotone" />
            <AlertTitle>Erklärbare KI Demo</AlertTitle>
            <AlertDescription className="text-sm">
              Wähle einen Zeiteintrag aus, um zu sehen wie die KI Probleme erklärt und konkrete
              Handlungsoptionen vorschlägt. Jede Entscheidung wird gelernt und verbessert zukünftige
              Vorschläge.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zeiteintrag auswählen</CardTitle>
                  <CardDescription>
                    Wähle einen Eintrag aus den letzten 20 Einträgen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {problematicEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Keine Zeiteinträge vorhanden
                        </p>
                      )}
                      {problematicEntries.map((entry) => {
                        const project = projects.find(p => p.id === entry.projectId)
                        const employee = employees.find(e => e.id === entry.employeeId)
                        const isSelected = selectedEntry?.id === entry.id

                        return (
                          <Button
                            key={entry.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className="w-full h-auto py-3 px-4 justify-start text-left"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">
                                  {project?.name || 'Kein Projekt'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {entry.duration}h
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>{employee?.name || 'Unbekannt'}</div>
                                <div>
                                  {format(new Date(entry.date), 'dd. MMM yyyy', { locale: de })} •{' '}
                                  {entry.startTime} - {entry.endTime}
                                </div>
                              </div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {!selectedEntry && (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
                    <p className="text-sm text-muted-foreground">
                      Wähle einen Zeiteintrag aus, um die KI-Analyse zu sehen
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedEntry && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        Eintrag Details
                        <Badge variant="outline">
                          {allInsights.length} {allInsights.length === 1 ? 'Problem' : 'Probleme'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Projekt</span>
                          <p className="font-medium">
                            {projects.find(p => p.id === selectedEntry.projectId)?.name || 'Unbekannt'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Mitarbeiter</span>
                          <p className="font-medium">
                            {employees.find(e => e.id === selectedEntry.employeeId)?.name || 'Unbekannt'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Datum</span>
                          <p className="font-medium">
                            {format(new Date(selectedEntry.date), 'dd. MMMM yyyy', { locale: de })}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Dauer</span>
                          <p className="font-medium">{selectedEntry.duration}h</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground">Zeit</span>
                          <p className="font-medium">
                            {selectedEntry.startTime} - {selectedEntry.endTime}
                          </p>
                        </div>
                        {selectedEntry.notes && (
                          <div className="col-span-2">
                            <span className="text-xs text-muted-foreground">Notizen</span>
                            <p className="text-sm text-muted-foreground">{selectedEntry.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {isGeneratingInsights ? (
                    <AIInsightSkeleton />
                  ) : (
                    <ExplainableInsightDisplay
                      insights={allInsights}
                      onTakeAction={handleActionTaken}
                      showLearningNotes={true}
                      strictnessMode={strictnessMode}
                      onStrictnessModeChange={setStrictnessMode}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(learningStats).map(([type, stats]) => {
              if (!stats) return null

              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{type}</CardTitle>
                    <CardDescription className="text-xs">
                      {stats.totalDecisions} Entscheidungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Häufigste Aktion</span>
                        <span className="font-semibold">
                          {(stats.mostCommonActionRate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={stats.mostCommonActionRate * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.mostCommonAction}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Alle Aktionen:</p>
                      {Object.entries(stats.allActions).map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{action}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {Object.keys(learningStats).length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <ChartBar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
                <p className="text-sm text-muted-foreground mb-4">
                  Noch keine Lernstatistiken verfügbar
                </p>
                <p className="text-xs text-muted-foreground">
                  Triff Entscheidungen in der Demo, damit die KI lernen kann
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="learning" className="space-y-4 mt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Wie die KI lernt</AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              <p>
                Die erklärbare KI analysiert deine Entscheidungen und passt ihre Empfehlungen an:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Wenn du eine Warnung häufig akzeptierst, wird sie als "Standard-Aktion" vorgeschlagen</li>
                <li>Bei 80%+ Akzeptanzrate schlägt die KI vor, die Regel anzupassen</li>
                <li>Muster werden nach Projekt, Mitarbeiter und Dauer erkannt</li>
                <li>Der Validierungsmodus (Streng/Neutral/Locker) passt Schwellenwerte an</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lernverlauf</CardTitle>
              <CardDescription>
                Chronologische Auflistung deiner letzten Entscheidungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {adminDecisions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Noch keine Entscheidungen getroffen
                    </p>
                  )}
                  {adminDecisions
                    .slice()
                    .reverse()
                    .map((decision, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs font-mono">
                              {decision.insightType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(decision.timestamp), 'dd.MM.yy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{decision.actionTaken}</p>
                          {decision.context.projectId && (
                            <p className="text-xs text-muted-foreground">
                              Projekt: {projects.find(p => p.id === decision.context.projectId)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {adminDecisions.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-destructive">Lernhistorie zurücksetzen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Löscht alle gespeicherten Entscheidungen. Die KI beginnt neu zu lernen.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    clearDecisionHistory()
                    toast.success('Lernhistorie gelöscht')
                  }}
                >
                  Historie löschen
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
