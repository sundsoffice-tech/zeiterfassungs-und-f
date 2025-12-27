import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  performanceBudgets, 
  PerformanceSeverity,
  PerformanceViolation 
} from '@/lib/performance-budgets'
import { 
  CheckCircle, 
  Warning, 
  XCircle, 
  Gauge,
  TrendUp,
  TrendDown,
  Minus,
  ArrowsClockwise,
  Download
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface PerformanceTestDashboardProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PerformanceTestDashboard({ 
  autoRefresh = false, 
  refreshInterval = 5000 
}: PerformanceTestDashboardProps) {
  const [report, setReport] = useState(performanceBudgets.getReport())
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setReport(performanceBudgets.getReport())
      setLastUpdate(Date.now())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const handleRefresh = () => {
    setReport(performanceBudgets.getReport())
    setLastUpdate(Date.now())
  }

  const handleDownloadReport = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-report-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getSeverityIcon = (severity: PerformanceSeverity) => {
    switch (severity) {
      case PerformanceSeverity.CRITICAL:
        return <XCircle className="h-5 w-5 text-destructive" weight="fill" />
      case PerformanceSeverity.WARNING:
        return <Warning className="h-5 w-5 text-accent" weight="fill" />
      case PerformanceSeverity.INFO:
        return <CheckCircle className="h-5 w-5 text-muted-foreground" weight="fill" />
    }
  }

  const getSeverityBadgeVariant = (severity: PerformanceSeverity): "destructive" | "default" | "secondary" => {
    switch (severity) {
      case PerformanceSeverity.CRITICAL:
        return 'destructive'
      case PerformanceSeverity.WARNING:
        return 'default'
      case PerformanceSeverity.INFO:
        return 'secondary'
    }
  }

  const getTrendIcon = (actual: number, budget: number) => {
    const ratio = actual / budget
    if (ratio >= 1.2) return <TrendUp className="h-4 w-4 text-destructive" />
    if (ratio <= 0.8) return <TrendDown className="h-4 w-4 text-green-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getHealthScore = (): number => {
    const total = Object.keys(report.budgets).length
    if (total === 0) return 100

    const componentsWithViolations = new Set(report.violations.map(v => v.component)).size
    return Math.round(((total - componentsWithViolations) / total) * 100)
  }

  const healthScore = getHealthScore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Test Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <ArrowsClockwise className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthScore}%</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(report.budgets).length} components monitored
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              <Warning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all severity levels
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {report.summary.bySeverity[PerformanceSeverity.CRITICAL]}
              </div>
              <p className="text-xs text-muted-foreground">
                Must be addressed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <Warning className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {report.summary.bySeverity[PerformanceSeverity.WARNING]}
              </div>
              <p className="text-xs text-muted-foreground">
                Review recommended
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {report.summary.bySeverity[PerformanceSeverity.CRITICAL] > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Critical Performance Issues Detected</AlertTitle>
          <AlertDescription>
            {report.summary.bySeverity[PerformanceSeverity.CRITICAL]} critical 
            performance violation{report.summary.bySeverity[PerformanceSeverity.CRITICAL] > 1 ? 's' : ''} detected. 
            These will fail CI builds and must be addressed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="stats">Component Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Violations</CardTitle>
              <CardDescription>
                Components exceeding performance budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.violations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" weight="fill" />
                  <p className="text-lg font-medium">No violations detected</p>
                  <p className="text-sm text-muted-foreground">
                    All components are performing within budgets
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Ratio</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.violations.slice(-20).reverse().map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(violation.severity)}
                            <Badge variant={getSeverityBadgeVariant(violation.severity)}>
                              {violation.severity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {violation.component}
                        </TableCell>
                        <TableCell>{violation.metric}</TableCell>
                        <TableCell>{violation.actualValue.toFixed(2)}</TableCell>
                        <TableCell>{violation.budgetValue}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(violation.actualValue, violation.budgetValue)}
                            <span className={
                              violation.actualValue / violation.budgetValue >= 2
                                ? 'text-destructive font-semibold'
                                : violation.actualValue / violation.budgetValue >= 1.5
                                ? 'text-accent font-medium'
                                : ''
                            }>
                              {(violation.actualValue / violation.budgetValue).toFixed(2)}x
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Budgets</CardTitle>
              <CardDescription>
                Configured performance budgets for all components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Max Render Time</TableHead>
                    <TableHead>Max Re-renders</TableHead>
                    <TableHead>Max Lifetime</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(report.budgets).map((budget) => {
                    const hasViolations = report.violations.some(
                      v => v.component === budget.component
                    )
                    return (
                      <TableRow key={budget.component}>
                        <TableCell className="font-medium">
                          {budget.component}
                        </TableCell>
                        <TableCell>{budget.maxRenderTime}ms</TableCell>
                        <TableCell>{budget.maxReRenders}</TableCell>
                        <TableCell>{(budget.maxLifetimeMs / 1000).toFixed(0)}s</TableCell>
                        <TableCell>
                          {budget.enabled ? (
                            hasViolations ? (
                              <Badge variant="destructive">Violated</Badge>
                            ) : (
                              <Badge variant="secondary">Healthy</Badge>
                            )
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Statistics</CardTitle>
              <CardDescription>
                Real-time performance metrics for monitored components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(report.componentStats).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No statistics available</p>
                  <p className="text-sm text-muted-foreground">
                    Component statistics will appear after components render
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Renders</TableHead>
                      <TableHead>Avg Time</TableHead>
                      <TableHead>Min Time</TableHead>
                      <TableHead>Max Time</TableHead>
                      <TableHead>P95 Time</TableHead>
                      <TableHead>Violations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(report.componentStats).map(([component, stats]) => (
                      stats && (
                        <TableRow key={component}>
                          <TableCell className="font-medium">{component}</TableCell>
                          <TableCell>{stats.renderCount}</TableCell>
                          <TableCell>{stats.avgRenderTime.toFixed(2)}ms</TableCell>
                          <TableCell>{stats.minRenderTime.toFixed(2)}ms</TableCell>
                          <TableCell>{stats.maxRenderTime.toFixed(2)}ms</TableCell>
                          <TableCell>{stats.p95RenderTime.toFixed(2)}ms</TableCell>
                          <TableCell>
                            {stats.violations > 0 ? (
                              <Badge variant="destructive">{stats.violations}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
