# Performance Budget System

A comprehensive performance monitoring and alerting system for React components that tracks render times, re-render counts, and component lifetimes against configurable budgets.

## Overview

The Performance Budget System provides real-time monitoring of component performance with automatic alerts when components exceed their allocated performance budgets. This helps maintain consistent application performance and catches performance regressions early.

## Features

### 🎯 Budget Configuration
- Define performance budgets per component
- Set limits for render time, re-render count, and lifetime
- Enable/disable monitoring for individual components
- Default budgets for common components

### 🚨 Violation Detection
- Automatic tracking when budgets are exceeded
- Three severity levels: INFO (>100%), WARNING (>150%), CRITICAL (>200%)
- Stack trace capture for debugging
- Historical violation tracking

### 📊 Monitoring Dashboard
- Real-time performance metrics
- Violation history and trends
- Component statistics (avg, min, max, P95)
- Budget utilization progress bars
- Interactive budget configuration

### 🔔 Real-time Alerts
- Toast notifications for violations
- Configurable severity thresholds
- Debounced alerts to prevent spam
- Visual severity indicators

## Quick Start

### 1. Enable Monitoring for a Component

```tsx
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

function MyComponent() {
  usePerformanceMonitor('MyComponent')
  
  return <div>My component content</div>
}
```

### 2. Configure Budget (Optional)

```tsx
import { performanceBudgets } from '@/lib/performance-budgets'

performanceBudgets.setBudget('MyComponent', {
  component: 'MyComponent',
  maxRenderTime: 50,        // milliseconds
  maxReRenders: 20,         // count
  maxLifetimeMs: 300000,    // 5 minutes
  enabled: true
})
```

### 3. Enable Alerts

Already enabled in App.tsx:

```tsx
import { PerformanceAlertProvider } from '@/components/PerformanceAlertProvider'
import { PerformanceSeverity } from '@/lib/performance-budgets'

<PerformanceAlertProvider 
  enabled={true} 
  minSeverity={PerformanceSeverity.WARNING}
  debounceMs={5000}
/>
```

### 4. Access the Dashboard

Navigate to the "Performance" tab in the main application navigation.

## Default Budgets

| Component | Max Render Time | Max Re-renders | Max Lifetime |
|-----------|----------------|----------------|--------------|
| App | 100ms | 10 | 5 minutes |
| TodayScreen | 50ms | 20 | 10 minutes |
| WeekScreen | 80ms | 15 | 10 minutes |
| ReportsScreen | 150ms | 10 | 5 minutes |
| Projects | 60ms | 15 | 10 minutes |
| QuickTimeEntry | 30ms | 25 | 2 minutes |
| Dashboard | 100ms | 10 | 10 minutes |
| AdminScreen | 80ms | 10 | 5 minutes |

## API Reference

### usePerformanceMonitor Hook

```tsx
const { trackAction, trackAsyncAction } = usePerformanceMonitor(componentName, enabled)
```

**Parameters:**
- `componentName` (string): Unique name for the component
- `enabled` (boolean): Whether to enable monitoring (default: true)

**Returns:**
- `trackAction`: Function to track synchronous actions
- `trackAsyncAction`: Function to track asynchronous actions

**Example:**
```tsx
function MyComponent() {
  const perf = usePerformanceMonitor('MyComponent')
  
  const handleClick = () => {
    perf.trackAction('button_click', () => {
      // Your synchronous code
    })
  }
  
  const handleAsyncClick = async () => {
    await perf.trackAsyncAction('fetch_data', async () => {
      return await fetchData()
    })
  }
}
```

### performanceBudgets Service

#### setBudget(componentName, budget)

Configure or update a performance budget.

```tsx
performanceBudgets.setBudget('MyComponent', {
  component: 'MyComponent',
  maxRenderTime: 50,
  maxReRenders: 20,
  maxLifetimeMs: 300000,
  enabled: true
})
```

#### getBudget(componentName)

Get the current budget for a component.

```tsx
const budget = performanceBudgets.getBudget('MyComponent')
```

#### getViolations(filters?)

Get violation records with optional filtering.

```tsx
// All violations
const all = performanceBudgets.getViolations()

// Critical only
const critical = performanceBudgets.getViolations({
  severity: PerformanceSeverity.CRITICAL
})

// For specific component
const component = performanceBudgets.getViolations({
  component: 'TodayScreen'
})

// Recent violations (last hour)
const recent = performanceBudgets.getViolations({
  since: Date.now() - 3600000
})
```

#### getViolationSummary()

Get aggregated violation statistics.

```tsx
const summary = performanceBudgets.getViolationSummary()
// {
//   total: 42,
//   byComponent: { TodayScreen: 15, WeekScreen: 10 },
//   bySeverity: { critical: 5, warning: 20, info: 17 },
//   byMetric: { renderTime: 25, reRenders: 12, lifetime: 5 }
// }
```

#### getComponentStats(componentName)

Get detailed performance statistics for a component.

```tsx
const stats = performanceBudgets.getComponentStats('TodayScreen')
// {
//   renderCount: 42,
//   avgRenderTime: 35.2,
//   minRenderTime: 12.1,
//   maxRenderTime: 89.5,
//   p95RenderTime: 72.3,
//   violations: 8
// }
```

#### onViolation(callback)

Listen for violation events.

```tsx
const unsubscribe = performanceBudgets.onViolation((violation) => {
  console.log('Violation detected:', violation)
  // Custom handling
})

// Later: unsubscribe()
```

#### clearViolations(componentName?)

Clear violation history.

```tsx
// Clear all violations
performanceBudgets.clearViolations()

// Clear for specific component
performanceBudgets.clearViolations('TodayScreen')
```

#### clearStats(componentName?)

Clear performance statistics.

```tsx
// Clear all stats
performanceBudgets.clearStats()

// Clear for specific component
performanceBudgets.clearStats('TodayScreen')
```

## Severity Levels

### INFO (>100% of budget)
- Budget exceeded but within acceptable range
- Monitor for patterns
- No immediate action required

### WARNING (>150% of budget)
- Significant budget overrun
- Investigate if violations are frequent
- Consider optimization

### CRITICAL (>200% of budget)
- Severe performance issue
- Immediate optimization recommended
- May impact user experience

## Performance Optimization Tips

### Common Causes of Violations

1. **Excessive Re-renders**
   - Missing dependencies in useEffect
   - Creating new objects/functions in render
   - Prop drilling causing cascade re-renders

2. **Slow Render Times**
   - Complex calculations during render
   - Large lists without virtualization
   - Heavy component trees
   - Synchronous network requests

3. **Long Component Lifetimes**
   - Memory leaks from uncleared intervals/listeners
   - Retained references preventing cleanup
   - Missing cleanup in useEffect

### Optimization Strategies

#### Memoization

```tsx
import { useMemo, useCallback, memo } from 'react'

// Memoize expensive calculations
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), 
  [data]
)

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Memoize components
const MemoizedComponent = memo(MyComponent)
```

#### Virtual Scrolling

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// For long lists
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
})
```

#### Code Splitting

```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

#### Defer Non-Critical Rendering

```tsx
import { useTransition } from 'react'

const [isPending, startTransition] = useTransition()

startTransition(() => {
  // Non-urgent state updates
  setSearchResults(results)
})
```

## Dashboard Usage

### Violations Tab

View recent performance violations with:
- Component name
- Metric type (render time, re-renders, lifetime)
- Actual vs. budget values
- Severity indicator
- Timestamp

Filter violations by:
- Component
- Severity
- Metric type
- Time range

### Budgets Tab

Configure performance budgets:
- Enable/disable monitoring per component
- Adjust render time threshold
- Adjust re-render limit
- Adjust lifetime limit
- See violation count per component

### Stats Tab

View detailed statistics:
- Total render count
- Average, min, max render times
- P95 render time
- Budget utilization (progress bars)
- Historical trends

## Console Output

In development mode, violations are logged to the console:

```
⚠️ Performance Budget Violation
  Component: TodayScreen
  Metric: renderTime
  Actual: 75.23ms
  Budget: 50ms
  Ratio: 1.50x (50.5% over budget)
  Severity: warning
  
  at TodayScreen (src/components/TodayScreen.tsx:54:12)
  at div
  at Tabs
  ...
```

## Best Practices

### Setting Budgets

1. **Start Conservative**: Begin with generous budgets and tighten based on actual performance
2. **Consider Context**: User-facing components need stricter budgets than admin screens
3. **Monitor Trends**: Watch for gradual performance degradation over time
4. **Adjust for Complexity**: Complex visualizations may need higher budgets

### Responding to Violations

1. **INFO**: 
   - Log and monitor
   - No immediate action unless frequent

2. **WARNING**: 
   - Investigate root cause
   - Profile component if violations persist
   - Consider optimization

3. **CRITICAL**: 
   - Immediate action required
   - Profile and optimize
   - May need architectural changes

### Regular Maintenance

- Review dashboard weekly
- Clear old violations monthly
- Adjust budgets based on hardware capabilities
- Document performance requirements in PRD

## Integration with Telemetry

Performance violations are automatically tracked in the telemetry system:

```tsx
import { telemetry, TelemetryEventType } from '@/lib/telemetry'

const perfEvents = telemetry.getEventsByType(TelemetryEventType.PERFORMANCE)
```

## Troubleshooting

### Component Not Tracked

Ensure `usePerformanceMonitor` is called at the top level:

```tsx
// ✅ Correct
function MyComponent() {
  usePerformanceMonitor('MyComponent')
  // ...
}

// ❌ Wrong - inside condition
function MyComponent() {
  if (condition) {
    usePerformanceMonitor('MyComponent')
  }
}
```

### No Violations Showing

1. Check if monitoring is enabled
2. Verify component name matches budget configuration
3. Check if budget thresholds are too high
4. Ensure `PerformanceAlertProvider` is mounted

### High Re-render Count

Common causes:
- Missing memoization
- Inline object/function creation
- Prop changes from parent
- State updates in render

Use React DevTools Profiler to identify re-render causes.

## License

Part of the Zeiterfassung application.
