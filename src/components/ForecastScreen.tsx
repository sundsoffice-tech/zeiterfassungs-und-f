import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChartBar, 
  TrendUp, 
  TrendDown, 
  Users, 
  Warning, 
  CheckCircle,
  Clock,
  SparkleIcon,
  ArrowRight,
  Target
} from '@phosphor-icons/react'
import { Employee, Project, Task, TimeEntry, PlannedTime } from '@/lib/types'
import { 
  generateForecast, 
  generateAIEnhancedForecast,
  ForecastData,
  BudgetRiskAssessment,
  StaffingRecommendation,
  TimeEstimate 
} from '@/lib/forecasting'
import { toast } from 'sonner'
import { ForecastSkeleton } from '@/components/SkeletonLoaders'

interface ForecastScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  plannedTimes?: PlannedTime[]
}

export function ForecastScreen({
  employees,
  projects,
  tasks,
  timeEntries,
  plannedTimes = []
}: ForecastScreenProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiEnhanced, setAiEnhanced] = useState(false)

  const generateBasicForecast = async () => {
    setLoading(true)
    try {
      const data = await generateForecast(projects, tasks, timeEntries, employees, plannedTimes)
      setForecast(data)
      setAiEnhanced(false)
      toast.success('Prognose generiert')
    } catch (error) {
      toast.error('Fehler beim Generieren der Prognose')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generateAIForecast = async () => {
    setLoading(true)
    try {
      const data = await generateAIEnhancedForecast(projects, tasks, timeEntries, employees, plannedTimes)
      setForecast(data)
      setAiEnhanced(true)
      toast.success('KI-Prognose generiert')
    } catch (error) {
      toast.error('Fehler beim Generieren der KI-Prognose')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projects.length > 0) {
      generateBasicForecast()
    }
  }, [])

  const getRiskColor = (level: BudgetRiskAssessment['riskLevel']) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskBadgeVariant = (level: BudgetRiskAssessment['riskLevel']) => {
    switch (level) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'secondary'
    }
  }

  const getPriorityColor = (priority: StaffingRecommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getActionIcon = (action: StaffingRecommendation['action']) => {
    switch (action) {
      case 'increase_urgent':
      case 'increase_moderate':
        return <TrendUp className="h-5 w-5" weight="bold" />
      case 'reduce':
        return <TrendDown className="h-5 w-5" weight="bold" />
      case 'maintain':
        return <CheckCircle className="h-5 w-5" weight="bold" />
    }
  }

  if (loading) {
    return <ForecastSkeleton />
  }

  if (!forecast) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Forecast & Planung</h2>
            <p className="text-muted-foreground mt-1">
              Vorhersage, Risiken und Empfehlungen auf Basis historischer Daten
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prognose generieren</CardTitle>
            <CardDescription>
              Analysieren Sie Ihre Projekte und erhalten Sie datenbasierte Vorhersagen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateBasicForecast} disabled={loading} className="w-full">
              <ChartBar className="h-4 w-4 mr-2" />
              Prognose erstellen
            </Button>
            <Button 
              onClick={generateAIForecast} 
              disabled={loading} 
              variant="outline" 
              className="w-full"
            >
              <SparkleIcon className="h-4 w-4 mr-2" />
              KI-Prognose erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const criticalRisks = forecast.risks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')
  const urgentRecommendations = forecast.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Forecast & Planung</h2>
          <p className="text-muted-foreground mt-1">
            Generiert: {new Date(forecast.generatedAt).toLocaleString('de-DE')}
            {aiEnhanced && <Badge variant="outline" className="ml-2">KI-Erweitert</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateBasicForecast} disabled={loading} variant="outline" size="sm">
            <ChartBar className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={generateAIForecast} disabled={loading} size="sm">
            <SparkleIcon className="h-4 w-4 mr-2" />
            KI-Prognose
          </Button>
        </div>
      </div>

      {(criticalRisks.length > 0 || urgentRecommendations.length > 0) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Warning className="h-5 w-5" weight="bold" />
              Sofortige Aufmerksamkeit erforderlich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalRisks.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Kritische Budget-Risiken</h4>
                <ul className="space-y-2">
                  {criticalRisks.map(risk => (
                    <li key={risk.projectId} className="text-sm">
                      <span className="font-medium">{risk.projectName}</span>: {risk.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {urgentRecommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Dringende Personalempfehlungen</h4>
                <ul className="space-y-2">
                  {urgentRecommendations.map(rec => (
                    <li key={rec.projectId} className="text-sm">
                      <span className="font-medium">{rec.projectName}</span>: {rec.impact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations" className="gap-2">
            <Users className="h-4 w-4" />
            Personalempfehlungen
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-2">
            <Warning className="h-4 w-4" />
            Budget-Risiken
          </TabsTrigger>
          <TabsTrigger value="estimates" className="gap-2">
            <Target className="h-4 w-4" />
            Zeitschätzungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {forecast.recommendations.map(rec => (
              <Card key={rec.projectId} className={`${getPriorityColor(rec.priority)} border-2`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getActionIcon(rec.action)}
                        {rec.projectName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {rec.hoursNeeded}h verbleibend • {rec.daysAvailable} Tage verfügbar
                      </CardDescription>
                    </div>
                    <Badge variant={rec.priority === 'critical' || rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority === 'critical' && '🚨 KRITISCH'}
                      {rec.priority === 'high' && '⚡ HOCH'}
                      {rec.priority === 'medium' && '⚠ MITTEL'}
                      {rec.priority === 'low' && '✓ NIEDRIG'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rec.currentStaff}</div>
                      <div className="text-xs text-muted-foreground">Aktuell</div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rec.recommendedStaff}</div>
                      <div className="text-xs text-muted-foreground">Empfohlen</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">{rec.explanation}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Empfohlene Maßnahmen:</h4>
                    <ul className="space-y-2">
                      {rec.specificActions.map((action, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            {forecast.recommendations.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine aktiven Projekte für Personalempfehlungen
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid gap-4">
            {forecast.risks.map(risk => (
              <Card key={risk.projectId} className={`${getRiskColor(risk.riskLevel)} border-2`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {risk.projectName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {risk.percentComplete}% abgeschlossen • {risk.daysRemaining} Tage verbleibend
                      </CardDescription>
                    </div>
                    <Badge variant={getRiskBadgeVariant(risk.riskLevel)}>
                      Risiko: {risk.riskScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Budget-Nutzung</span>
                      <span className="font-medium">
                        {risk.spentHours}h / {risk.budgetHours}h
                      </span>
                    </div>
                    <Progress 
                      value={(risk.spentHours / risk.budgetHours) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold">{risk.spentHours}h</div>
                      <div className="text-xs text-muted-foreground">Verbraucht</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold">{risk.estimatedRemainingHours}h</div>
                      <div className="text-xs text-muted-foreground">Verbleibend</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold">{risk.burnRate}h/Tag</div>
                      <div className="text-xs text-muted-foreground">Burn-Rate</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium whitespace-pre-line">{risk.explanation}</p>
                  </div>

                  {risk.factors.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Risikofaktoren:</h4>
                        <div className="space-y-2">
                          {risk.factors.map((factor, idx) => (
                            <div key={idx} className="flex items-start justify-between text-sm p-2 bg-white/60 rounded">
                              <div className="flex-1">
                                <div className="font-medium">{factor.name}</div>
                                <div className="text-xs text-muted-foreground">{factor.description}</div>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                +{factor.impact}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            {forecast.risks.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine aktiven Projekte für Risikoanalyse
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="estimates" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4 pr-4">
              {forecast.estimates.map((estimate, idx) => {
                const project = projects.find(p => p.id === estimate.projectId)
                const task = tasks.find(t => t.id === estimate.taskId)
                
                return (
                  <Card key={`${estimate.projectId}-${estimate.taskId || 'project'}-${idx}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {project?.name || 'Unbekanntes Projekt'}
                          </CardTitle>
                          {task && (
                            <CardDescription className="mt-1">
                              Task: {task.name}
                            </CardDescription>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{estimate.estimatedHours}h</div>
                          <Badge variant={estimate.confidence > 60 ? 'secondary' : 'outline'} className="mt-1">
                            {estimate.confidence}% Konfidenz
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="p-2 bg-muted rounded">
                          <div className="text-sm font-medium">{estimate.basedOn.historicalEntries}</div>
                          <div className="text-xs text-muted-foreground">Einträge</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-sm font-medium">{estimate.basedOn.averageHours}h</div>
                          <div className="text-xs text-muted-foreground">Durchschnitt</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-sm font-medium">±{estimate.basedOn.stdDeviation}h</div>
                          <div className="text-xs text-muted-foreground">Abweichung</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{estimate.explanation}</p>
                    </CardContent>
                  </Card>
                )
              })}

              {forecast.estimates.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Zeitschätzungen verfügbar
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
