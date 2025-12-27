import { telemetry, TelemetryEventType } from './telemetry'

export enum PerformanceSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface PerformanceBudget {
  component: string
  maxRenderTime: number
  maxReRenders: number
  maxLifetimeMs: number
  enabled: boolean
}

export interface PerformanceViolation {
  id: string
  component: string
  metric: string
  actualValue: number
  budgetValue: number
  severity: PerformanceSeverity
  timestamp: number
  stackTrace?: string
}

export interface PerformanceBudgetConfig {
  [componentName: string]: PerformanceBudget
}

const DEFAULT_BUDGETS: PerformanceBudgetConfig = {
  'App': {
    component: 'App',
    maxRenderTime: 100,
    maxReRenders: 10,
    maxLifetimeMs: 300000,
    enabled: true
  },
  'TodayScreen': {
    component: 'TodayScreen',
    maxRenderTime: 50,
    maxReRenders: 20,
    maxLifetimeMs: 600000,
    enabled: true
  },
  'WeekScreen': {
    component: 'WeekScreen',
    maxRenderTime: 80,
    maxReRenders: 15,
    maxLifetimeMs: 600000,
    enabled: true
  },
  'ReportsScreen': {
    component: 'ReportsScreen',
    maxRenderTime: 150,
    maxReRenders: 10,
    maxLifetimeMs: 300000,
    enabled: true
  },
  'Projects': {
    component: 'Projects',
    maxRenderTime: 60,
    maxReRenders: 15,
    maxLifetimeMs: 600000,
    enabled: true
  },
  'QuickTimeEntry': {
    component: 'QuickTimeEntry',
    maxRenderTime: 30,
    maxReRenders: 25,
    maxLifetimeMs: 120000,
    enabled: true
  },
  'TimeEntryDetailView': {
    component: 'TimeEntryDetailView',
    maxRenderTime: 25,
    maxReRenders: 30,
    maxLifetimeMs: 180000,
    enabled: true
  },
  'Dashboard': {
    component: 'Dashboard',
    maxRenderTime: 100,
    maxReRenders: 10,
    maxLifetimeMs: 600000,
    enabled: true
  },
  'AdminScreen': {
    component: 'AdminScreen',
    maxRenderTime: 80,
    maxReRenders: 10,
    maxLifetimeMs: 300000,
    enabled: true
  }
}

class PerformanceBudgetService {
  private budgets: PerformanceBudgetConfig = { ...DEFAULT_BUDGETS }
  private violations: PerformanceViolation[] = []
  private renderCounts: Map<string, number> = new Map()
  private renderTimes: Map<string, number[]> = new Map()
  private enabled = true
  private alertCallbacks: ((violation: PerformanceViolation) => void)[] = []
  private maxViolations = 100

  setBudget(componentName: string, budget: Partial<PerformanceBudget>): void {
    this.budgets[componentName] = {
      ...this.budgets[componentName],
      component: componentName,
      ...budget
    }
  }

  getBudget(componentName: string): PerformanceBudget | undefined {
    return this.budgets[componentName]
  }

  getAllBudgets(): PerformanceBudgetConfig {
    return { ...this.budgets }
  }

  resetBudgets(): void {
    this.budgets = { ...DEFAULT_BUDGETS }
  }

  trackRenderTime(componentName: string, renderTime: number): void {
    if (!this.enabled) return

    const budget = this.budgets[componentName]
    if (!budget || !budget.enabled) return

    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, [])
    }
    this.renderTimes.get(componentName)!.push(renderTime)

    const renderCount = (this.renderCounts.get(componentName) || 0) + 1
    this.renderCounts.set(componentName, renderCount)

    this.checkRenderTimeBudget(componentName, renderTime, budget)
    this.checkReRenderBudget(componentName, renderCount, budget)

    telemetry.trackPerformance(`${componentName}_render`, renderTime, {
      renderCount,
      budgetMaxRenderTime: budget.maxRenderTime,
      budgetMaxReRenders: budget.maxReRenders
    })
  }

  trackLifetime(componentName: string, lifetimeMs: number): void {
    if (!this.enabled) return

    const budget = this.budgets[componentName]
    if (!budget || !budget.enabled) return

    this.checkLifetimeBudget(componentName, lifetimeMs, budget)

    telemetry.trackPerformance(`${componentName}_lifetime`, lifetimeMs, {
      budgetMaxLifetime: budget.maxLifetimeMs
    })
  }

  private checkRenderTimeBudget(
    componentName: string,
    renderTime: number,
    budget: PerformanceBudget
  ): void {
    if (renderTime > budget.maxRenderTime) {
      const severity = this.calculateSeverity(renderTime, budget.maxRenderTime)
      this.recordViolation({
        component: componentName,
        metric: 'renderTime',
        actualValue: renderTime,
        budgetValue: budget.maxRenderTime,
        severity
      })
    }
  }

  private checkReRenderBudget(
    componentName: string,
    renderCount: number,
    budget: PerformanceBudget
  ): void {
    if (renderCount > budget.maxReRenders) {
      const severity = this.calculateSeverity(renderCount, budget.maxReRenders)
      this.recordViolation({
        component: componentName,
        metric: 'reRenders',
        actualValue: renderCount,
        budgetValue: budget.maxReRenders,
        severity
      })
    }
  }

  private checkLifetimeBudget(
    componentName: string,
    lifetimeMs: number,
    budget: PerformanceBudget
  ): void {
    if (lifetimeMs > budget.maxLifetimeMs) {
      const severity = this.calculateSeverity(lifetimeMs, budget.maxLifetimeMs)
      this.recordViolation({
        component: componentName,
        metric: 'lifetime',
        actualValue: lifetimeMs,
        budgetValue: budget.maxLifetimeMs,
        severity
      })
    }
  }

  private calculateSeverity(actualValue: number, budgetValue: number): PerformanceSeverity {
    const ratio = actualValue / budgetValue

    if (ratio >= 2.0) {
      return PerformanceSeverity.CRITICAL
    } else if (ratio >= 1.5) {
      return PerformanceSeverity.WARNING
    } else {
      return PerformanceSeverity.INFO
    }
  }

  private recordViolation(violation: Omit<PerformanceViolation, 'id' | 'timestamp' | 'stackTrace'>): void {
    const fullViolation: PerformanceViolation = {
      ...violation,
      id: `${violation.component}-${violation.metric}-${Date.now()}`,
      timestamp: Date.now(),
      stackTrace: this.captureStackTrace()
    }

    this.violations.push(fullViolation)

    if (this.violations.length > this.maxViolations) {
      this.violations.shift()
    }

    telemetry.trackPerformance('performance_budget_violation', fullViolation.actualValue, {
      component: fullViolation.component,
      metric: fullViolation.metric,
      budgetValue: fullViolation.budgetValue,
      severity: fullViolation.severity,
      ratio: (fullViolation.actualValue / fullViolation.budgetValue).toFixed(2)
    })

    this.alertCallbacks.forEach(callback => callback(fullViolation))

    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      this.logViolation(fullViolation)
    }
  }

  private captureStackTrace(): string {
    try {
      const stack = new Error().stack || ''
      const lines = stack.split('\n').slice(3)
      return lines.join('\n')
    } catch {
      return ''
    }
  }

  private logViolation(violation: PerformanceViolation): void {
    const severityEmoji = {
      [PerformanceSeverity.INFO]: 'ℹ️',
      [PerformanceSeverity.WARNING]: '⚠️',
      [PerformanceSeverity.CRITICAL]: '🚨'
    }

    const ratio = (violation.actualValue / violation.budgetValue).toFixed(2)
    const percentage = ((violation.actualValue / violation.budgetValue - 1) * 100).toFixed(1)

    console.warn(
      `${severityEmoji[violation.severity]} Performance Budget Violation`,
      `\n  Component: ${violation.component}`,
      `\n  Metric: ${violation.metric}`,
      `\n  Actual: ${violation.actualValue.toFixed(2)}ms`,
      `\n  Budget: ${violation.budgetValue}ms`,
      `\n  Ratio: ${ratio}x (${percentage}% over budget)`,
      `\n  Severity: ${violation.severity}`,
      violation.stackTrace ? `\n\n${violation.stackTrace}` : ''
    )
  }

  onViolation(callback: (violation: PerformanceViolation) => void): () => void {
    this.alertCallbacks.push(callback)
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  getViolations(filters?: {
    component?: string
    severity?: PerformanceSeverity
    metric?: string
    since?: number
  }): PerformanceViolation[] {
    let filtered = [...this.violations]

    if (filters?.component) {
      filtered = filtered.filter(v => v.component === filters.component)
    }
    if (filters?.severity) {
      filtered = filtered.filter(v => v.severity === filters.severity)
    }
    if (filters?.metric) {
      filtered = filtered.filter(v => v.metric === filters.metric)
    }
    if (filters?.since !== undefined) {
      filtered = filtered.filter(v => v.timestamp >= filters.since!)
    }

    return filtered
  }

  getViolationSummary(): {
    total: number
    byComponent: Record<string, number>
    bySeverity: Record<PerformanceSeverity, number>
    byMetric: Record<string, number>
  } {
    const byComponent: Record<string, number> = {}
    const bySeverity: Record<PerformanceSeverity, number> = {
      [PerformanceSeverity.INFO]: 0,
      [PerformanceSeverity.WARNING]: 0,
      [PerformanceSeverity.CRITICAL]: 0
    }
    const byMetric: Record<string, number> = {}

    for (const violation of this.violations) {
      byComponent[violation.component] = (byComponent[violation.component] || 0) + 1
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1
      byMetric[violation.metric] = (byMetric[violation.metric] || 0) + 1
    }

    return {
      total: this.violations.length,
      byComponent,
      bySeverity,
      byMetric
    }
  }

  getComponentStats(componentName: string): {
    renderCount: number
    avgRenderTime: number
    minRenderTime: number
    maxRenderTime: number
    p95RenderTime: number
    violations: number
  } | null {
    const renderTimes = this.renderTimes.get(componentName)
    if (!renderTimes || renderTimes.length === 0) {
      return null
    }

    const sorted = [...renderTimes].sort((a, b) => a - b)
    const sum = sorted.reduce((acc, val) => acc + val, 0)
    const p95Index = Math.floor(sorted.length * 0.95)

    return {
      renderCount: this.renderCounts.get(componentName) || 0,
      avgRenderTime: sum / sorted.length,
      minRenderTime: sorted[0],
      maxRenderTime: sorted[sorted.length - 1],
      p95RenderTime: sorted[p95Index] || sorted[sorted.length - 1],
      violations: this.violations.filter(v => v.component === componentName).length
    }
  }

  clearViolations(componentName?: string): void {
    if (componentName) {
      this.violations = this.violations.filter(v => v.component !== componentName)
    } else {
      this.violations = []
    }
  }

  clearStats(componentName?: string): void {
    if (componentName) {
      this.renderCounts.delete(componentName)
      this.renderTimes.delete(componentName)
    } else {
      this.renderCounts.clear()
      this.renderTimes.clear()
    }
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getReport(): {
    budgets: PerformanceBudgetConfig
    violations: PerformanceViolation[]
    summary: ReturnType<typeof this.getViolationSummary>
    componentStats: Record<string, ReturnType<typeof this.getComponentStats>>
  } {
    const componentStats: Record<string, ReturnType<typeof this.getComponentStats>> = {}
    
    for (const componentName of Object.keys(this.budgets)) {
      const stats = this.getComponentStats(componentName)
      if (stats) {
        componentStats[componentName] = stats
      }
    }

    return {
      budgets: this.getAllBudgets(),
      violations: this.getViolations(),
      summary: this.getViolationSummary(),
      componentStats
    }
  }
}

export const performanceBudgets = new PerformanceBudgetService()
