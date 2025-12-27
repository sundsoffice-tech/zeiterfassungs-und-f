import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { performanceBudgets, PerformanceSeverity } from '@/lib/performance-budgets'
import { TodayScreen } from '@/components/TodayScreen'
import { WeekScreen } from '@/components/WeekScreen'
import { Projects } from '@/components/Projects'
import { AdminScreen } from '@/components/AdminScreen'
import { QuickTimeEntry } from '@/components/QuickTimeEntry'
import { TimeEntryDetailView } from '@/components/TimeEntryDetailView'
import { Dashboard } from '@/components/Dashboard'

vi.mock('@github/spark/hooks', () => ({
  useKV: (key: string, defaultValue: any) => {
    const [value, setValue] = vi.fn().mockReturnValue([defaultValue, vi.fn(), vi.fn()])()
    return [value, setValue, vi.fn()]
  }
}))

const CI_MODE = process.env.CI === 'true' || process.env.NODE_ENV === 'test'

describe('Performance Regression Tests', () => {
  beforeEach(() => {
    performanceBudgets.enable()
    performanceBudgets.clearViolations()
    performanceBudgets.clearStats()
  })

  afterEach(() => {
    const violations = performanceBudgets.getViolations({
      severity: PerformanceSeverity.CRITICAL
    })

    if (CI_MODE && violations.length > 0) {
      const report = performanceBudgets.getReport()
      console.error('Performance Budget Violations Detected:')
      console.error(JSON.stringify(report, null, 2))
      
      throw new Error(
        `Performance regression detected: ${violations.length} critical violations. ` +
        `Components: ${[...new Set(violations.map(v => v.component))].join(', ')}`
      )
    }
  })

  describe('Component Render Performance', () => {
    it('TodayScreen should render within budget', async () => {
      const budget = performanceBudgets.getBudget('TodayScreen')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <TodayScreen
          employees={[]}
          projects={[]}
          tasks={[]}
          phases={[]}
          timeEntries={[]}
          setTimeEntries={vi.fn()}
          activeTimer={null}
          setActiveTimer={vi.fn()}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      const stats = performanceBudgets.getComponentStats('TodayScreen')
      if (stats) {
        expect(stats.maxRenderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      }

      unmount()
    })

    it('WeekScreen should render within budget', async () => {
      const budget = performanceBudgets.getBudget('WeekScreen')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <WeekScreen
          employees={[]}
          projects={[]}
          tasks={[]}
          phases={[]}
          timeEntries={[]}
          setTimeEntries={vi.fn()}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      unmount()
    })

    it('Projects should render within budget', async () => {
      const budget = performanceBudgets.getBudget('Projects')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <Projects
          projects={[]}
          setProjects={vi.fn()}
          tasks={[]}
          setTasks={vi.fn()}
          phases={[]}
          setPhases={vi.fn()}
          timeEntries={[]}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      unmount()
    })

    it('AdminScreen should render within budget', async () => {
      const budget = performanceBudgets.getBudget('AdminScreen')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <AdminScreen
          employees={[]}
          setEmployees={vi.fn()}
          projects={[]}
          tasks={[]}
          timeEntries={[]}
          mileageEntries={[]}
          activeTimer={null}
          absences={[]}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      unmount()
    })

    it('QuickTimeEntry should render within budget', async () => {
      const budget = performanceBudgets.getBudget('QuickTimeEntry')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <QuickTimeEntry
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          employees={[]}
          projects={[]}
          tasks={[]}
          phases={[]}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      unmount()
    })

    it('Dashboard should render within budget', async () => {
      const budget = performanceBudgets.getBudget('Dashboard')
      expect(budget).toBeDefined()

      const startTime = performance.now()
      
      const { unmount } = render(
        <Dashboard
          employees={[]}
          projects={[]}
          timeEntries={[]}
          mileageEntries={[]}
        />
      )

      const renderTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(renderTime).toBeLessThan(budget!.maxRenderTime * 1.5)
      })

      unmount()
    })
  })

  describe('Re-render Performance', () => {
    it('should not exceed re-render budgets', async () => {
      const component = 'TodayScreen'
      const budget = performanceBudgets.getBudget(component)
      expect(budget).toBeDefined()

      const { rerender, unmount } = render(
        <TodayScreen
          employees={[]}
          projects={[]}
          tasks={[]}
          phases={[]}
          timeEntries={[]}
          setTimeEntries={vi.fn()}
          activeTimer={null}
          setActiveTimer={vi.fn()}
        />
      )

      for (let i = 0; i < 5; i++) {
        rerender(
          <TodayScreen
            employees={[]}
            projects={[]}
            tasks={[]}
            phases={[]}
            timeEntries={[]}
            setTimeEntries={vi.fn()}
            activeTimer={null}
            setActiveTimer={vi.fn()}
          />
        )
      }

      await waitFor(() => {
        const stats = performanceBudgets.getComponentStats(component)
        if (stats) {
          expect(stats.renderCount).toBeLessThanOrEqual(budget!.maxReRenders)
        }
      })

      unmount()
    })
  })

  describe('Violations Detection', () => {
    it('should detect and report critical violations', () => {
      const component = 'TestComponent'
      
      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 10,
        maxReRenders: 5,
        maxLifetimeMs: 1000,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component, 100)

      const violations = performanceBudgets.getViolations({
        component,
        severity: PerformanceSeverity.CRITICAL
      })

      expect(violations.length).toBeGreaterThan(0)
      expect(violations[0].component).toBe(component)
      expect(violations[0].severity).toBe(PerformanceSeverity.CRITICAL)
    })

    it('should calculate severity correctly', () => {
      const component = 'SeverityTest'
      
      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 50,
        maxReRenders: 10,
        maxLifetimeMs: 1000,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component, 75)
      let violations = performanceBudgets.getViolations({ component })
      expect(violations[violations.length - 1].severity).toBe(PerformanceSeverity.WARNING)

      performanceBudgets.trackRenderTime(component, 100)
      violations = performanceBudgets.getViolations({ component })
      expect(violations[violations.length - 1].severity).toBe(PerformanceSeverity.CRITICAL)
    })
  })

  describe('Performance Statistics', () => {
    it('should track component statistics accurately', () => {
      const component = 'StatsTest'
      
      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 100,
        maxReRenders: 50,
        maxLifetimeMs: 10000,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component, 10)
      performanceBudgets.trackRenderTime(component, 20)
      performanceBudgets.trackRenderTime(component, 30)

      const stats = performanceBudgets.getComponentStats(component)
      
      expect(stats).not.toBeNull()
      expect(stats!.renderCount).toBe(3)
      expect(stats!.avgRenderTime).toBe(20)
      expect(stats!.minRenderTime).toBe(10)
      expect(stats!.maxRenderTime).toBe(30)
    })

    it('should generate comprehensive performance report', () => {
      const component1 = 'Component1'
      const component2 = 'Component2'
      
      performanceBudgets.setBudget(component1, {
        component: component1,
        maxRenderTime: 50,
        maxReRenders: 10,
        maxLifetimeMs: 1000,
        enabled: true
      })

      performanceBudgets.setBudget(component2, {
        component: component2,
        maxRenderTime: 50,
        maxReRenders: 10,
        maxLifetimeMs: 1000,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component1, 60)
      performanceBudgets.trackRenderTime(component2, 40)

      const report = performanceBudgets.getReport()
      
      expect(report.budgets).toHaveProperty(component1)
      expect(report.budgets).toHaveProperty(component2)
      expect(report.violations.length).toBeGreaterThan(0)
      expect(report.summary.total).toBeGreaterThan(0)
      expect(report.componentStats).toHaveProperty(component1)
      expect(report.componentStats).toHaveProperty(component2)
    })
  })

  describe('Budget Management', () => {
    it('should allow setting custom budgets', () => {
      const component = 'CustomBudgetTest'
      const customBudget = {
        component,
        maxRenderTime: 25,
        maxReRenders: 5,
        maxLifetimeMs: 500,
        enabled: true
      }

      performanceBudgets.setBudget(component, customBudget)
      const budget = performanceBudgets.getBudget(component)

      expect(budget).toEqual(customBudget)
    })

    it('should reset budgets to defaults', () => {
      const component = 'App'
      const defaultBudget = performanceBudgets.getBudget(component)

      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 999,
        maxReRenders: 999,
        maxLifetimeMs: 999999,
        enabled: false
      })

      performanceBudgets.resetBudgets()
      const resetBudget = performanceBudgets.getBudget(component)

      expect(resetBudget).toEqual(defaultBudget)
    })
  })

  describe('CI Integration', () => {
    it('should fail CI when critical violations exceed threshold', () => {
      if (!CI_MODE) {
        return
      }

      const component = 'CITest'
      
      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 10,
        maxReRenders: 2,
        maxLifetimeMs: 100,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component, 50)

      const violations = performanceBudgets.getViolations({
        severity: PerformanceSeverity.CRITICAL
      })

      expect(violations.length).toBeGreaterThan(0)
    })

    it('should generate CI-friendly performance report', () => {
      const report = performanceBudgets.getReport()
      
      expect(report).toHaveProperty('budgets')
      expect(report).toHaveProperty('violations')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('componentStats')

      const jsonReport = JSON.stringify(report, null, 2)
      expect(jsonReport).toBeTruthy()
      expect(() => JSON.parse(jsonReport)).not.toThrow()
    })
  })

  describe('Performance Alerts', () => {
    it('should trigger alerts on violations', () => {
      const alertCallback = vi.fn()
      const unsubscribe = performanceBudgets.onViolation(alertCallback)

      const component = 'AlertTest'
      performanceBudgets.setBudget(component, {
        component,
        maxRenderTime: 10,
        maxReRenders: 5,
        maxLifetimeMs: 1000,
        enabled: true
      })

      performanceBudgets.trackRenderTime(component, 50)

      expect(alertCallback).toHaveBeenCalled()
      expect(alertCallback.mock.calls[0][0]).toHaveProperty('component', component)
      expect(alertCallback.mock.calls[0][0]).toHaveProperty('severity')

      unsubscribe()
    })
  })
})
