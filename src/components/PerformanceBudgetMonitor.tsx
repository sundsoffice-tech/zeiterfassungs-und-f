import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  performanceBudgets, 
  PerformanceViolation, 
  PerformanceSeverity,
  PerformanceBudget 
} from '@/lib/performance-budgets'
import { 
  Warning, 
  CheckCircle, 
  XCircle, 
  Info, 
  Gauge,
  ChartBar,
  Trash,
  Eye,
  EyeSlash
} from '@phosphor-icons/react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function PerformanceBudgetMonitor() {
  const [violations, setViolations] = useState<PerformanceViolation[]>([])
  const [budgets, setBudgets] = useState(performanceBudgets.getAllBudgets())
  const [summary, setSummary] = useState(performanceBudgets.getViolationSummary())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  useEffect(() => {
    const updateData = () => {
      setViolations(performanceBudgets.getViolations())
      setSummary(performanceBudgets.getViolationSummary())
      setBudgets(performanceBudgets.getAllBudgets())
    }

    updateData()

    if (autoRefresh) {
      const interval = setInterval(updateData, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    const unsubscribe = performanceBudgets.onViolation(() => {
      setViolations(performanceBudgets.getViolations())
      setSummary(performanceBudgets.getViolationSummary())
    })

    return unsubscribe
  }, [])

  const handleClearViolations = (componentName?: string) => {
    performanceBudgets.clearViolations(componentName)
    performanceBudgets.clearStats(componentName)
    setViolations(performanceBudgets.getViolations())
    setSummary(performanceBudgets.getViolationSummary())
  }

  const handleToggleBudget = (componentName: string, enabled: boolean) => {
    const budget = budgets[componentName]
    if (budget) {
      performanceBudgets.setBudget(componentName, { ...budget, enabled })
      setBudgets(performanceBudgets.getAllBudgets())
    }
  }

  const handleUpdateBudget = (
    componentName: string,
    field: keyof PerformanceBudget,
    value: number
  ) => {
    const budget = budgets[componentName]
    if (budget) {
      performanceBudgets.setBudget(componentName, { ...budget, [field]: value })
      setBudgets(performanceBudgets.getAllBudgets())
    }
  }

  const getSeverityColor = (severity: PerformanceSeverity) => {
    switch (severity) {
      case PerformanceSeverity.CRITICAL:
        return 'destructive'
      case PerformanceSeverity.WARNING:
        return 'default'
      case PerformanceSeverity.INFO:
        return 'secondary'
    }
  }

  const getSeverityIcon = (severity: PerformanceSeverity) => {
    switch (severity) {
      case PerformanceSeverity.CRITICAL:
        return <XCircle className="h-4 w-4" weight="fill" />
      case PerformanceSeverity.WARNING:
        return <Warning className="h-4 w-4" weight="fill" />
      case PerformanceSeverity.INFO:
        return <Info className="h-4 w-4" weight="fill" />
    }
  }

  const formatMetric = (metric: string) => {
    switch (metric) {
      case 'renderTime':
        return 'Render Time'
      case 'reRenders':
        return 'Re-renders'
      case 'lifetime':
        return 'Lifetime'
      default:
        return metric
    }
  }

  const sortedComponents = Object.keys(budgets).sort((a, b) => {
    const aViolations = summary.byComponent[a] || 0
    const bViolations = summary.byComponent[b] || 0
    return bViolations - aViolations
  })

  const recentViolations = violations.slice(-10).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Budget Monitor</h2>
          <p className="text-muted-foreground">
            Track component performance and budget violations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClearViolations()}
          >
            <Trash className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" weight="fill" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.bySeverity[PerformanceSeverity.CRITICAL]}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warning className="h-4 w-4 text-yellow-600" weight="fill" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.bySeverity[PerformanceSeverity.WARNING]}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" weight="fill" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.bySeverity[PerformanceSeverity.INFO]}
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.bySeverity[PerformanceSeverity.CRITICAL] > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Critical Performance Issues Detected</AlertTitle>
          <AlertDescription>
            {summary.bySeverity[PerformanceSeverity.CRITICAL]} component(s) are exceeding performance budgets by 2x or more.
            Consider optimizing these components.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations" className="gap-2">
            <Warning className="h-4 w-4" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2">
            <Gauge className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <ChartBar className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Violations</CardTitle>
              <CardDescription>
                Latest performance budget violations (max 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentViolations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-3" weight="fill" />
                  <h3 className="font-semibold text-lg">No Violations</h3>
                  <p className="text-sm text-muted-foreground">
                    All components are within their performance budgets
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {recentViolations.map((violation) => (
                      <div
                        key={violation.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(violation.severity)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">
                                  {violation.component}
                                </span>
                                <Badge variant={getSeverityColor(violation.severity)}>
                                  {violation.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatMetric(violation.metric)} exceeded budget
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(violation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Actual:</span>
                            <span className="ml-2 font-mono font-medium">
                              {violation.actualValue.toFixed(2)}
                              {violation.metric === 'reRenders' ? '' : 'ms'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="ml-2 font-mono font-medium">
                              {violation.budgetValue}
                              {violation.metric === 'reRenders' ? '' : 'ms'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ratio:</span>
                            <span className="ml-2 font-mono font-medium text-destructive">
                              {(violation.actualValue / violation.budgetValue).toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Violations by Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedComponents
                  .filter((comp) => summary.byComponent[comp] > 0)
                  .map((componentName) => {
                    const count = summary.byComponent[componentName]
                    const stats = performanceBudgets.getComponentStats(componentName)

                    return (
                      <div key={componentName} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{componentName}</span>
                            <Badge variant="secondary">{count} violations</Badge>
                          </div>
                          {stats && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Avg: {stats.avgRenderTime.toFixed(2)}ms · 
                              P95: {stats.p95RenderTime.toFixed(2)}ms · 
                              Renders: {stats.renderCount}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearViolations(componentName)}
                        >
                          Clear
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Configuration</CardTitle>
              <CardDescription>
                Configure performance budgets for each component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {sortedComponents.map((componentName) => {
                    const budget = budgets[componentName]
                    if (!budget) return null

                    return (
                      <div key={componentName} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium text-lg">
                              {componentName}
                            </span>
                            {summary.byComponent[componentName] > 0 && (
                              <Badge variant="destructive">
                                {summary.byComponent[componentName]} violations
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {budget.enabled ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeSlash className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Switch
                              checked={budget.enabled}
                              onCheckedChange={(enabled) =>
                                handleToggleBudget(componentName, enabled)
                              }
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${componentName}-render`} className="text-xs">
                              Max Render Time (ms)
                            </Label>
                            <Input
                              id={`${componentName}-render`}
                              type="number"
                              value={budget.maxRenderTime}
                              onChange={(e) =>
                                handleUpdateBudget(
                                  componentName,
                                  'maxRenderTime',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={!budget.enabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${componentName}-rerenders`} className="text-xs">
                              Max Re-renders
                            </Label>
                            <Input
                              id={`${componentName}-rerenders`}
                              type="number"
                              value={budget.maxReRenders}
                              onChange={(e) =>
                                handleUpdateBudget(
                                  componentName,
                                  'maxReRenders',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={!budget.enabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${componentName}-lifetime`} className="text-xs">
                              Max Lifetime (ms)
                            </Label>
                            <Input
                              id={`${componentName}-lifetime`}
                              type="number"
                              value={budget.maxLifetimeMs}
                              onChange={(e) =>
                                handleUpdateBudget(
                                  componentName,
                                  'maxLifetimeMs',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={!budget.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Statistics</CardTitle>
              <CardDescription>
                Detailed performance metrics for each component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {sortedComponents.map((componentName) => {
                    const stats = performanceBudgets.getComponentStats(componentName)
                    if (!stats) return null

                    const budget = budgets[componentName]
                    const renderTimeRatio = stats.avgRenderTime / budget.maxRenderTime
                    const reRenderRatio = stats.renderCount / budget.maxReRenders

                    return (
                      <div key={componentName} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium">{componentName}</span>
                          {stats.violations > 0 && (
                            <Badge variant="destructive">
                              {stats.violations} violations
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Renders</p>
                            <p className="font-mono font-semibold">{stats.renderCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Avg Time</p>
                            <p className="font-mono font-semibold">
                              {stats.avgRenderTime.toFixed(2)}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Min Time</p>
                            <p className="font-mono font-semibold">
                              {stats.minRenderTime.toFixed(2)}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Max Time</p>
                            <p className="font-mono font-semibold">
                              {stats.maxRenderTime.toFixed(2)}ms
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Render Time Budget</span>
                            <span className="font-mono">
                              {stats.avgRenderTime.toFixed(2)} / {budget.maxRenderTime}ms
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                renderTimeRatio > 1
                                  ? 'bg-destructive'
                                  : renderTimeRatio > 0.8
                                  ? 'bg-yellow-600'
                                  : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(renderTimeRatio * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Re-render Budget</span>
                            <span className="font-mono">
                              {stats.renderCount} / {budget.maxReRenders}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                reRenderRatio > 1
                                  ? 'bg-destructive'
                                  : reRenderRatio > 0.8
                                  ? 'bg-yellow-600'
                                  : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(reRenderRatio * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground">
                            P95 Render Time: <span className="font-mono">{stats.p95RenderTime.toFixed(2)}ms</span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
