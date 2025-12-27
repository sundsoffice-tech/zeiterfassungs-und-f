import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, 
  TrendUp, 
  TrendDown, 
  Lightbulb, 
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FolderOpen,
  Lightning,
  Sparkle,
  ChartBar,
  ArrowRight,
  Info,
  ShieldCheck
} from '@phosphor-icons/react'
import { TimeEntry, Project, Employee, Task } from '@/lib/types'
import { AdminDecision } from '@/lib/explainable-ai'

interface AIDecisionTrendsScreenProps {
  adminDecisions: AdminDecision[]
  timeEntries: TimeEntry[]
  projects: Project[]
  employees: Employee[]
  tasks: Task[]
}

interface DecisionPattern {
  id: string
  pattern: string
  frequency: number
  acceptanceRate: number
  actionDistribution: Record<string, number>
  trend: 'increasing' | 'decreasing' | 'stable'
  avgResolutionTime?: number
}

interface OptimizationOpportunity {
  id: string
  type: 'automation' | 'rule_adjustment' | 'training' | 'workflow'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  potentialSavings: {
    timePerWeek: number
    decisionsAutomated: number
  }
  recommendedActions: string[]
}

export function AIDecisionTrendsScreen({
  adminDecisions,
  timeEntries,
  projects,
  employees,
  tasks
}: AIDecisionTrendsScreenProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all')

  const filteredDecisions = useMemo(() => {
    const now = new Date()
    const cutoff = timeRange === 'all' ? new Date(0) : 
      new Date(now.getTime() - (
        timeRange === '7d' ? 7 : 
        timeRange === '30d' ? 30 : 90
      ) * 24 * 60 * 60 * 1000)

    return adminDecisions.filter(d => new Date(d.timestamp) >= cutoff)
  }, [adminDecisions, timeRange])

  const decisionStats = useMemo(() => {
    const total = filteredDecisions.length
    const byType = filteredDecisions.reduce((acc, d) => {
      acc[d.insightType] = (acc[d.insightType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byAction = filteredDecisions.reduce((acc, d) => {
      acc[d.actionTaken] = (acc[d.actionTaken] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const acceptActions = ['accept', 'confirm']
    const fixActions = ['fix', 'split_entry', 'update_entry']
    const adjustActions = ['adjust_rule', 'disable_warning']

    const accepted = filteredDecisions.filter(d => acceptActions.includes(d.actionTaken)).length
    const fixed = filteredDecisions.filter(d => fixActions.includes(d.actionTaken)).length
    const adjusted = filteredDecisions.filter(d => adjustActions.includes(d.actionTaken)).length

    return {
      total,
      byType,
      byAction,
      accepted,
      fixed,
      adjusted,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0
    }
  }, [filteredDecisions])

  const decisionPatterns = useMemo((): DecisionPattern[] => {
    const patterns: Record<string, {
      frequency: number
      actions: string[]
      contexts: any[]
    }> = {}

    filteredDecisions.forEach(decision => {
      const key = `${decision.insightType}_${decision.context.projectId || 'any'}`
      if (!patterns[key]) {
        patterns[key] = { frequency: 0, actions: [], contexts: [] }
      }
      patterns[key].frequency++
      patterns[key].actions.push(decision.actionTaken)
      patterns[key].contexts.push(decision.context)
    })

    return Object.entries(patterns)
      .map(([key, data], index) => {
        const [insightType, projectId] = key.split('_')
        const project = projects.find(p => p.id === projectId)
        
        const actionDist = data.actions.reduce((acc, action) => {
          acc[action] = (acc[action] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const acceptCount = (actionDist.accept || 0) + (actionDist.confirm || 0)
        const acceptanceRate = (acceptCount / data.frequency) * 100

        const oldDecisions = adminDecisions.filter(d => 
          new Date(d.timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
        const oldFreq = oldDecisions.filter(d => 
          d.insightType === insightType && (d.context.projectId || 'any') === projectId
        ).length

        const trend: 'increasing' | 'decreasing' | 'stable' = 
          data.frequency > oldFreq * 1.2 ? 'increasing' :
          data.frequency < oldFreq * 0.8 ? 'decreasing' : 'stable'

        return {
          id: `pattern-${index}`,
          pattern: project ? `${insightType} in ${project.name}` : insightType,
          frequency: data.frequency,
          acceptanceRate,
          actionDistribution: actionDist,
          trend
        }
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }, [filteredDecisions, projects, adminDecisions])

  const optimizationOpportunities = useMemo((): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = []

    const highAcceptancePatterns = decisionPatterns.filter(p => p.acceptanceRate > 80 && p.frequency > 5)
    if (highAcceptancePatterns.length > 0) {
      opportunities.push({
        id: 'auto-accept-1',
        type: 'automation',
        priority: 'high',
        title: 'Auto-Approve High Confidence Patterns',
        description: `${highAcceptancePatterns.length} patterns have >80% acceptance rate`,
        impact: 'Reduce manual review time by automating consistently accepted decisions',
        effort: 'low',
        potentialSavings: {
          timePerWeek: highAcceptancePatterns.reduce((sum, p) => sum + p.frequency, 0) * 0.5,
          decisionsAutomated: highAcceptancePatterns.reduce((sum, p) => sum + p.frequency, 0)
        },
        recommendedActions: [
          'Create automation rule for these patterns',
          'Set confidence threshold to 90%',
          'Enable weekly review of auto-approved items'
        ]
      })
    }

    const highFixPatterns = decisionPatterns.filter(p => {
      const fixRate = ((p.actionDistribution.fix || 0) + (p.actionDistribution.split_entry || 0)) / p.frequency
      return fixRate > 0.6 && p.frequency > 3
    })
    if (highFixPatterns.length > 0) {
      opportunities.push({
        id: 'training-1',
        type: 'training',
        priority: 'high',
        title: 'Employee Training Opportunity',
        description: `${highFixPatterns.length} patterns require frequent manual fixes`,
        impact: 'Prevent common data entry errors at the source',
        effort: 'medium',
        potentialSavings: {
          timePerWeek: highFixPatterns.reduce((sum, p) => sum + p.frequency, 0) * 2,
          decisionsAutomated: 0
        },
        recommendedActions: [
          'Identify affected employees',
          'Create training materials for common patterns',
          'Add inline hints in time entry forms'
        ]
      })
    }

    const ruleAdjustPatterns = decisionPatterns.filter(p => {
      const adjustRate = ((p.actionDistribution.adjust_rule || 0) + (p.actionDistribution.disable_warning || 0)) / p.frequency
      return adjustRate > 0.4
    })
    if (ruleAdjustPatterns.length > 0) {
      opportunities.push({
        id: 'rule-adjust-1',
        type: 'rule_adjustment',
        priority: 'medium',
        title: 'Validation Rules Need Tuning',
        description: `${ruleAdjustPatterns.length} patterns frequently trigger rule adjustments`,
        impact: 'Reduce false positives and improve AI accuracy',
        effort: 'low',
        potentialSavings: {
          timePerWeek: ruleAdjustPatterns.reduce((sum, p) => sum + p.frequency, 0) * 1,
          decisionsAutomated: ruleAdjustPatterns.reduce((sum, p) => sum + p.frequency, 0)
        },
        recommendedActions: [
          'Review threshold settings for affected projects',
          'Consider project-specific validation rules',
          'Update AI learning parameters'
        ]
      })
    }

    const increasingPatterns = decisionPatterns.filter(p => p.trend === 'increasing')
    if (increasingPatterns.length > 3) {
      opportunities.push({
        id: 'workflow-1',
        type: 'workflow',
        priority: 'medium',
        title: 'Emerging Issues Detected',
        description: `${increasingPatterns.length} patterns show increasing frequency`,
        impact: 'Address root causes before they become major issues',
        effort: 'medium',
        potentialSavings: {
          timePerWeek: 0,
          decisionsAutomated: 0
        },
        recommendedActions: [
          'Investigate recent process changes',
          'Check for new projects with different patterns',
          'Consider proactive notifications'
        ]
      })
    }

    const projectSpecific = filteredDecisions.reduce((acc, d) => {
      if (d.context.projectId) {
        acc[d.context.projectId] = (acc[d.context.projectId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topProject = Object.entries(projectSpecific).sort((a, b) => b[1] - a[1])[0]
    if (topProject && topProject[1] > decisionStats.total * 0.3) {
      const project = projects.find(p => p.id === topProject[0])
      opportunities.push({
        id: 'project-specific-1',
        type: 'rule_adjustment',
        priority: 'high',
        title: `Project-Specific Rules Needed: ${project?.name || 'Unknown'}`,
        description: `${topProject[1]} decisions (${Math.round((topProject[1] / decisionStats.total) * 100)}%) relate to one project`,
        impact: 'Custom rules can handle project-specific patterns automatically',
        effort: 'low',
        potentialSavings: {
          timePerWeek: topProject[1] * 0.5,
          decisionsAutomated: topProject[1]
        },
        recommendedActions: [
          'Create project-specific validation profile',
          'Adjust thresholds for this project type',
          'Document project-specific patterns'
        ]
      })
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [decisionPatterns, filteredDecisions, projects, decisionStats.total])

  const topInsightTypes = useMemo(() => {
    return Object.entries(decisionStats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [decisionStats.byType])

  const efficiencyMetrics = useMemo(() => {
    const avgDecisionsPerDay = filteredDecisions.length / (
      timeRange === '7d' ? 7 : 
      timeRange === '30d' ? 30 : 
      timeRange === '90d' ? 90 : 365
    )

    const estimatedTimePerDecision = 2
    const totalTimeSpent = filteredDecisions.length * estimatedTimePerDecision
    const potentialTimeSaved = optimizationOpportunities.reduce((sum, opp) => 
      sum + (opp.potentialSavings.timePerWeek * 4), 0
    )

    return {
      avgDecisionsPerDay,
      totalTimeSpent,
      potentialTimeSaved,
      efficiencyGain: totalTimeSpent > 0 ? (potentialTimeSaved / totalTimeSpent) * 100 : 0
    }
  }, [filteredDecisions.length, timeRange, optimizationOpportunities])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" weight="duotone" />
            KI-Entscheidungstrends
          </h2>
          <p className="text-muted-foreground mt-2">
            Analyse der Admin-Entscheidungen und Optimierungsmöglichkeiten
          </p>
        </div>

        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Letzte 7 Tage</SelectItem>
            <SelectItem value="30d">Letzte 30 Tage</SelectItem>
            <SelectItem value="90d">Letzte 90 Tage</SelectItem>
            <SelectItem value="all">Alle Zeit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ChartBar className="h-4 w-4 text-muted-foreground" />
              Gesamtentscheidungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{decisionStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ø {efficiencyMetrics.avgDecisionsPerDay.toFixed(1)} pro Tag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Akzeptanzrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{decisionStats.acceptanceRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {decisionStats.accepted} von {decisionStats.total} akzeptiert
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Zeitaufwand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(efficiencyMetrics.totalTimeSpent / 60)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              ca. {(efficiencyMetrics.totalTimeSpent / filteredDecisions.length || 0).toFixed(0)} min/Entscheidung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" />
              Einsparpotenzial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(efficiencyMetrics.potentialTimeSaved / 60)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {efficiencyMetrics.efficiencyGain.toFixed(0)}% Effizienzsteigerung möglich
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimierungen
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Target className="h-4 w-4" />
            Muster
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <Lightning className="h-4 w-4" />
            Aktionen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" weight="duotone" />
                Optimierungsmöglichkeiten
              </CardTitle>
              <CardDescription>
                Identifizierte Chancen zur Verbesserung der Effizienz und Genauigkeit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optimizationOpportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Optimierungsmöglichkeiten gefunden</p>
                  <p className="text-sm mt-1">Ihr System läuft bereits optimal!</p>
                </div>
              ) : (
                optimizationOpportunities.map((opp) => (
                  <Card key={opp.id} className="border-l-4" style={{
                    borderLeftColor: opp.priority === 'high' ? 'oklch(0.68 0.19 45)' :
                                    opp.priority === 'medium' ? 'oklch(0.45 0.15 250)' :
                                    'oklch(0.50 0.02 250)'
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{opp.title}</CardTitle>
                            <Badge variant={
                              opp.priority === 'high' ? 'default' :
                              opp.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {opp.priority === 'high' ? 'Hoch' :
                               opp.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              {opp.type === 'automation' && <Lightning className="h-3 w-3" />}
                              {opp.type === 'rule_adjustment' && <Target className="h-3 w-3" />}
                              {opp.type === 'training' && <Users className="h-3 w-3" />}
                              {opp.type === 'workflow' && <FolderOpen className="h-3 w-3" />}
                              {opp.type === 'automation' && 'Automatisierung'}
                              {opp.type === 'rule_adjustment' && 'Regelanpassung'}
                              {opp.type === 'training' && 'Schulung'}
                              {opp.type === 'workflow' && 'Workflow'}
                            </Badge>
                          </div>
                          <CardDescription>{opp.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Auswirkung</div>
                          <div className="font-medium">{opp.impact}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Aufwand</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              opp.effort === 'low' ? 'outline' :
                              opp.effort === 'medium' ? 'secondary' : 'default'
                            }>
                              {opp.effort === 'low' ? 'Niedrig' :
                               opp.effort === 'medium' ? 'Mittel' : 'Hoch'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="text-sm font-medium">Einsparpotenzial</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Zeit pro Woche</div>
                            <div className="font-bold text-accent">
                              {Math.round(opp.potentialSavings.timePerWeek / 60)}h {Math.round(opp.potentialSavings.timePerWeek % 60)}min
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Automatisierte Entscheidungen</div>
                            <div className="font-bold text-accent">
                              {opp.potentialSavings.decisionsAutomated}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Empfohlene Maßnahmen</div>
                        <ul className="space-y-1">
                          {opp.recommendedActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Umsetzen
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Info className="h-4 w-4" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" weight="duotone" />
                Entscheidungsmuster
              </CardTitle>
              <CardDescription>
                Häufige Muster in Admin-Entscheidungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {decisionPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Muster gefunden</p>
                </div>
              ) : (
                decisionPatterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold mb-1">{pattern.pattern}</div>
                          <div className="text-sm text-muted-foreground">
                            {pattern.frequency} Vorkommen im Zeitraum
                          </div>
                        </div>
                        <Badge variant={
                          pattern.trend === 'increasing' ? 'default' :
                          pattern.trend === 'decreasing' ? 'secondary' : 'outline'
                        } className="gap-1">
                          {pattern.trend === 'increasing' && <TrendUp className="h-3 w-3" />}
                          {pattern.trend === 'decreasing' && <TrendDown className="h-3 w-3" />}
                          {pattern.trend === 'increasing' && 'Steigend'}
                          {pattern.trend === 'decreasing' && 'Fallend'}
                          {pattern.trend === 'stable' && 'Stabil'}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Akzeptanzrate</span>
                            <span className="text-accent">{pattern.acceptanceRate.toFixed(0)}%</span>
                          </div>
                          <Progress value={pattern.acceptanceRate} className="h-2" />
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-2">Aktionsverteilung</div>
                          <div className="space-y-1">
                            {Object.entries(pattern.actionDistribution)
                              .sort((a, b) => b[1] - a[1])
                              .map(([action, count]) => (
                                <div key={action} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground capitalize">
                                    {action.replace(/_/g, ' ')}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{count}</span>
                                    <span className="text-muted-foreground">
                                      ({Math.round((count / pattern.frequency) * 100)}%)
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-primary" weight="duotone" />
                  Top Insight-Typen
                </CardTitle>
                <CardDescription>
                  Häufigste KI-Erkenntnisse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topInsightTypes.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        {count} ({Math.round((count / decisionStats.total) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(count / decisionStats.total) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightning className="h-5 w-5 text-accent" weight="duotone" />
                  Aktionsübersicht
                </CardTitle>
                <CardDescription>
                  Verteilung der Admin-Aktionen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Akzeptiert</span>
                    </div>
                    <span className="font-bold">{decisionStats.accepted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Korrigiert</span>
                    </div>
                    <span className="font-bold">{decisionStats.fixed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-accent" />
                      <span className="text-sm">Regel angepasst</span>
                    </div>
                    <span className="font-bold">{decisionStats.adjusted}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">Alle Aktionen</div>
                  {Object.entries(decisionStats.byAction)
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {action.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5 text-accent" weight="duotone" />
                Schnellaktionen
              </CardTitle>
              <CardDescription>
                Basierend auf Ihren Entscheidungstrends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Sparkle className="h-4 w-4" />
                Automatisierungsregeln aus Top-Mustern erstellen
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <Target className="h-4 w-4" />
                Projektspezifische Validierungsprofile anlegen
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <Users className="h-4 w-4" />
                Schulungsbedarf-Report generieren
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <TrendUp className="h-4 w-4" />
                Wöchentlichen Optimierungs-Report aktivieren
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" weight="duotone" />
                KI-Lernfortschritt
              </CardTitle>
              <CardDescription>
                Das System lernt aus Ihren Entscheidungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Entscheidungsdatenbasis</span>
                  <span className="font-bold">{adminDecisions.length} Einträge</span>
                </div>
                <Progress value={Math.min((adminDecisions.length / 1000) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {adminDecisions.length < 100 && 'Mehr Daten für bessere Vorhersagen sammeln'}
                  {adminDecisions.length >= 100 && adminDecisions.length < 500 && 'Gute Datenbasis, KI lernt aktiv'}
                  {adminDecisions.length >= 500 && 'Ausgezeichnete Datenbasis, hohe Vorhersagegenauigkeit'}
                </p>
              </div>

              <div className="text-sm space-y-2 bg-background/50 rounded-lg p-3">
                <div className="font-medium">Nächste Lernmeilensteine:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    {adminDecisions.length >= 100 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2" />
                    )}
                    100 Entscheidungen: Basis-Mustererkennung
                  </li>
                  <li className="flex items-center gap-2">
                    {adminDecisions.length >= 500 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2" />
                    )}
                    500 Entscheidungen: Erweiterte Vorhersagen
                  </li>
                  <li className="flex items-center gap-2">
                    {adminDecisions.length >= 1000 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2" />
                    )}
                    1000 Entscheidungen: Autonome Optimierung
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
