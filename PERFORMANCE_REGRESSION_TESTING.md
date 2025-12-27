# Performance Regression Testing

## Overview

This application includes automated performance regression tests that run in CI to ensure components stay within performance budgets. The tests automatically fail CI builds when critical performance violations are detected.

## Quick Start

### Run Performance Tests Locally

```bash
npm run test:performance
```

### Watch Mode (for development)

```bash
npm run test:performance:watch
```

### UI Mode (for detailed analysis)

```bash
npm run test:performance:ui
```

## How It Works

### Performance Budgets

Each component has defined performance budgets for:

- **Render Time**: Maximum time (in ms) a component should take to render
- **Re-renders**: Maximum number of re-renders during component lifetime
- **Lifetime**: Maximum time (in ms) a component instance should exist

### Default Budgets

```typescript
{
  'App': {
    maxRenderTime: 100ms,
    maxReRenders: 10,
    maxLifetimeMs: 300000ms (5 minutes)
  },
  'TodayScreen': {
    maxRenderTime: 50ms,
    maxReRenders: 20,
    maxLifetimeMs: 600000ms (10 minutes)
  },
  'WeekScreen': {
    maxRenderTime: 80ms,
    maxReRenders: 15,
    maxLifetimeMs: 600000ms
  },
  'ReportsScreen': {
    maxRenderTime: 150ms,
    maxReRenders: 10,
    maxLifetimeMs: 300000ms
  }
}
```

### Severity Levels

Performance violations are classified by severity:

- **INFO**: 1.0-1.5x over budget
- **WARNING**: 1.5-2.0x over budget  
- **CRITICAL**: 2.0x+ over budget (fails CI)

## CI Integration

### When Tests Run

Performance regression tests automatically run on:

- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

### What Happens on Failure

When critical performance violations are detected:

1. ❌ CI build fails
2. 📊 Performance report is generated and uploaded as artifact
3. 💬 PR is commented with violation details
4. 📈 Performance comparison with base branch is provided

### Viewing Results

Performance reports are available in:

- **GitHub Actions Artifacts**: Download from the workflow run
- **PR Comments**: Automatic comment with violation details
- **Console Output**: Detailed logs in the CI run

## Test Structure

### Component Render Tests

Tests verify that components render within their allocated time budget:

```typescript
it('TodayScreen should render within budget', async () => {
  const budget = performanceBudgets.getBudget('TodayScreen')
  
  const startTime = performance.now()
  render(<TodayScreen {...props} />)
  const renderTime = performance.now() - startTime
  
  expect(renderTime).toBeLessThan(budget.maxRenderTime * 1.5)
})
```

### Re-render Tests

Tests ensure components don't re-render excessively:

```typescript
it('should not exceed re-render budgets', async () => {
  const { rerender } = render(<Component {...props} />)
  
  // Trigger multiple re-renders
  for (let i = 0; i < 5; i++) {
    rerender(<Component {...props} />)
  }
  
  const stats = performanceBudgets.getComponentStats('Component')
  expect(stats.renderCount).toBeLessThanOrEqual(budget.maxReRenders)
})
```

### Violation Detection Tests

Tests verify the monitoring system correctly detects violations:

```typescript
it('should detect and report critical violations', () => {
  performanceBudgets.trackRenderTime('TestComponent', 100) // Over budget
  
  const violations = performanceBudgets.getViolations({
    severity: PerformanceSeverity.CRITICAL
  })
  
  expect(violations.length).toBeGreaterThan(0)
})
```

## Adjusting Budgets

### When to Adjust

Consider adjusting budgets when:

- Legitimate feature additions increase complexity
- Component purpose changes significantly
- New dependencies are added
- Testing reveals budgets are too strict/lenient

### How to Adjust

Edit the budget configuration in `src/lib/performance-budgets.ts`:

```typescript
const DEFAULT_BUDGETS: PerformanceBudgetConfig = {
  'MyComponent': {
    component: 'MyComponent',
    maxRenderTime: 60,      // Increase if needed
    maxReRenders: 15,       // Adjust based on use case
    maxLifetimeMs: 300000,  // Component lifetime budget
    enabled: true
  }
}
```

### Setting Runtime Budgets

Budgets can also be adjusted at runtime:

```typescript
import { performanceBudgets } from '@/lib/performance-budgets'

performanceBudgets.setBudget('MyComponent', {
  component: 'MyComponent',
  maxRenderTime: 75,
  maxReRenders: 20,
  maxLifetimeMs: 400000,
  enabled: true
})
```

## Monitoring in Production

### Real-time Monitoring

The performance monitoring system runs in production:

```typescript
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

function MyComponent() {
  usePerformanceMonitor('MyComponent')
  
  // Component code
}
```

### Accessing Performance Data

Get performance statistics for any component:

```typescript
import { performanceBudgets } from '@/lib/performance-budgets'

const stats = performanceBudgets.getComponentStats('MyComponent')
// Returns: {
//   renderCount: number,
//   avgRenderTime: number,
//   minRenderTime: number,
//   maxRenderTime: number,
//   p95RenderTime: number,
//   violations: number
// }
```

### Generating Reports

Generate comprehensive performance reports:

```typescript
const report = performanceBudgets.getReport()
// Returns: {
//   budgets: { ... },
//   violations: [ ... ],
//   summary: { total, byComponent, bySeverity, byMetric },
//   componentStats: { ... }
// }
```

## Debugging Performance Issues

### 1. Identify the Component

Check CI output or run tests locally:

```bash
npm run test:performance
```

Look for output like:

```
⚠️ Performance Budget Violation
  Component: TodayScreen
  Metric: renderTime
  Actual: 125.42ms
  Budget: 50ms
  Ratio: 2.51x (151% over budget)
  Severity: critical
```

### 2. Profile the Component

Use React DevTools Profiler:

1. Open React DevTools
2. Go to "Profiler" tab
3. Click "Record"
4. Interact with the component
5. Stop recording and analyze

### 3. Common Fixes

**Excessive Re-renders**
- Use `React.memo()` for expensive components
- Optimize dependencies in `useEffect` and `useMemo`
- Use `useCallback` for function props

**Slow Initial Render**
- Lazy load heavy components
- Split large components into smaller ones
- Defer non-critical rendering

**Heavy Computations**
- Use `useMemo` for expensive calculations
- Move computations to web workers
- Optimize data structures and algorithms

### 4. Verify Fixes

Run tests locally to verify improvements:

```bash
npm run test:performance
```

## Best Practices

### 1. Monitor New Components

Add budgets for all new components:

```typescript
performanceBudgets.setBudget('NewComponent', {
  component: 'NewComponent',
  maxRenderTime: 50,
  maxReRenders: 15,
  maxLifetimeMs: 300000,
  enabled: true
})
```

### 2. Track Performance in Development

Use the performance monitor hook:

```typescript
function MyComponent() {
  const { trackAction, trackAsyncAction } = usePerformanceMonitor('MyComponent')
  
  const handleClick = () => {
    trackAction('button_click', () => {
      // Action code
    })
  }
  
  const fetchData = async () => {
    await trackAsyncAction('fetch_data', async () => {
      // Async operation
    })
  }
}
```

### 3. Review Performance Reports

Regularly check performance reports in CI artifacts to:

- Identify trends
- Catch gradual degradation
- Plan optimization work

### 4. Set Realistic Budgets

Base budgets on:

- Component complexity
- Expected usage patterns
- User experience requirements
- Actual measured performance

### 5. Document Exceptions

If a component legitimately exceeds budgets, document why:

```typescript
// ReportsScreen has higher budget due to complex chart rendering
// and large dataset processing (500+ time entries)
'ReportsScreen': {
  maxRenderTime: 150,  // Higher due to chart complexity
  maxReRenders: 10,
  maxLifetimeMs: 300000,
  enabled: true
}
```

## Troubleshooting

### Tests Failing Locally but Passing in CI

Different hardware performance can cause variance. Use relative metrics:

```typescript
// Instead of absolute time checks
expect(renderTime).toBeLessThan(50)

// Use budget ratios
expect(renderTime).toBeLessThan(budget.maxRenderTime * 1.5)
```

### Flaky Tests

Performance tests can be flaky. Consider:

- Increasing timeout values
- Adding warmup renders
- Using averaged measurements
- Checking for background processes

### False Positives

If tests fail incorrectly:

1. Run tests multiple times locally
2. Check for external factors (CPU load, memory pressure)
3. Review recent code changes
4. Consider adjusting budgets if legitimate

## CI Configuration

### GitHub Actions

The performance regression workflow is defined in:

```
.github/workflows/performance-regression.yml
```

### Custom CI Setup

For other CI systems, use the provided script:

```bash
chmod +x ./scripts/performance-ci.sh
./scripts/performance-ci.sh
```

The script:
- Sets `CI=true` environment variable
- Runs performance tests
- Generates reports
- Exits with error code on failure

## Performance Reports

### Report Structure

```json
{
  "budgets": {
    "ComponentName": {
      "component": "ComponentName",
      "maxRenderTime": 50,
      "maxReRenders": 20,
      "maxLifetimeMs": 600000,
      "enabled": true
    }
  },
  "violations": [
    {
      "id": "violation-id",
      "component": "ComponentName",
      "metric": "renderTime",
      "actualValue": 125.5,
      "budgetValue": 50,
      "severity": "critical",
      "timestamp": 1234567890,
      "stackTrace": "..."
    }
  ],
  "summary": {
    "total": 5,
    "byComponent": { "TodayScreen": 3, "WeekScreen": 2 },
    "bySeverity": { "critical": 2, "warning": 3, "info": 0 },
    "byMetric": { "renderTime": 4, "reRenders": 1 }
  },
  "componentStats": {
    "ComponentName": {
      "renderCount": 15,
      "avgRenderTime": 45.3,
      "minRenderTime": 38.2,
      "maxRenderTime": 62.1,
      "p95RenderTime": 58.4,
      "violations": 2
    }
  }
}
```

### Accessing Reports

Reports are saved to `./performance-reports/` directory:

- `performance-report-{timestamp}.json`: Full report
- `test-output-{timestamp}.log`: Test console output
- `test-results.json`: Vitest test results

## Future Enhancements

### Planned Features

- [ ] Performance trend tracking across commits
- [ ] Automated performance regression bisection
- [ ] Performance budget recommendations based on metrics
- [ ] Integration with monitoring services (Datadog, New Relic)
- [ ] Lighthouse CI integration for web vitals
- [ ] Real user monitoring (RUM) integration

### Experimental Features

- Bundle size regression testing
- Memory leak detection
- Network request performance tracking
- Animation frame rate monitoring

## Support

For questions or issues:

1. Check this documentation
2. Review existing performance reports
3. Check component-specific documentation
4. Review the performance budgets source code
5. Open an issue with reproduction steps

## References

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Vitest Documentation](https://vitest.dev/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
