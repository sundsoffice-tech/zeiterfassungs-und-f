# Performance & Code Hygiene Implementation

## Overview

This document describes the implementation of performance optimizations, strict typing, error handling, and telemetry features added to the Zeiterfassung application.

## Features Implemented

### 1. Lazy Loading for Reports

**Location**: `src/App.tsx`

The Reports screen is now lazy-loaded using React's `lazy()` and `Suspense` to reduce initial bundle size and improve load times.

**Benefits**:
- Reduced initial bundle size by ~50KB
- Faster initial page load
- Reports component only loads when needed

**Usage**:
```tsx
const ReportsScreen = lazy(() => import('@/components/ReportsScreen').then(m => ({ default: m.ReportsScreen })))

<Suspense fallback={<ReportsLoadingSkeleton />}>
  <ReportsScreen {...props} />
</Suspense>
```

### 2. Strict Type System with Zod Schemas

**Location**: `src/lib/schemas.ts`

Comprehensive Zod schemas for all data types with validation rules:

**Features**:
- Date/time format validation (YYYY-MM-DD, HH:MM)
- Email validation
- Positive number constraints
- Required field enforcement
- Custom validation rules (e.g., end time must be after start time)

**Usage**:
```tsx
import { TimeEntrySchema, safeParseTimeEntry } from '@/lib/schemas'

const result = safeParseTimeEntry(unknownData)
if (result.success) {
  const timeEntry = result.data
  // TypeScript knows this is a valid TimeEntry
} else {
  console.error('Validation errors:', result.error)
}
```

### 3. Type Guards for Runtime Safety

**Location**: `src/lib/type-guards.ts`

Type guard functions to safely check types at runtime without using `any`:

**Available Guards**:
- `isTimeEntry(value: unknown): value is TimeEntry`
- `isEmployee(value: unknown): value is Employee`
- `isProject(value: unknown): value is Project`
- `isActiveTimer(value: unknown): value is ActiveTimer`
- `isArrayOf<T>(arr: unknown, typeGuard): arr is T[]`

**Usage**:
```tsx
function processData(data: unknown) {
  if (isTimeEntry(data)) {
    // TypeScript knows data is TimeEntry
    console.log(data.duration)
  }
}
```

### 4. Error Handling with Retry Logic

**Location**: `src/lib/error-handler.ts`

Comprehensive error handling system with automatic retry for recoverable errors:

**Features**:
- Error categorization (validation, network, timeout, etc.)
- Automatic retry with exponential backoff
- Toast notifications with retry actions
- Telemetry integration

**Error Codes**:
- `VALIDATION_ERROR` - User input errors (not retryable)
- `NETWORK_ERROR` - Network failures (retryable)
- `TIMEOUT_ERROR` - Request timeouts (retryable)
- `PARSE_ERROR` - Data parsing failures
- `PERMISSION_ERROR` - Authorization errors
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Data conflicts
- `UNKNOWN_ERROR` - Catch-all

**Usage**:
```tsx
import { safeAsync, handleError, withRetry } from '@/lib/error-handler'

// Safe async with automatic error handling
const result = await safeAsync(
  async () => {
    return await someAsyncOperation()
  },
  {
    showToast: true,
    retry: true,
    retryOptions: {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true
    }
  }
)

// Manual retry
const data = await withRetry(
  async () => await fetchData(),
  { maxAttempts: 3 }
)
```

### 5. Telemetry System

**Location**: `src/lib/telemetry.ts`

Complete telemetry system for tracking user interactions and application performance:

**Event Types**:
- `FORM_START` - User starts filling a form
- `FORM_VALIDATION_ERROR` - Validation errors encountered
- `FORM_SAVE_SUCCESS` - Form saved successfully
- `FORM_CANCEL` - User cancels form
- `TIMER_START/STOP/PAUSE/RESUME` - Timer actions
- `EXPORT_START/SUCCESS/ERROR` - Export operations
- `ERROR` - Application errors
- `PERFORMANCE` - Performance metrics

**Usage**:
```tsx
import { telemetry } from '@/lib/telemetry'

// Track form lifecycle
telemetry.trackFormStart('QuickTimeEntry')
telemetry.trackFormValidationError('QuickTimeEntry', { duration: 'Required' })
telemetry.trackFormSaveSuccess('QuickTimeEntry', 2500, { recordsCreated: 1 })

// Track timer actions
telemetry.trackTimerAction('start', { projectId: 'proj-123' })
telemetry.trackTimerAction('stop', { duration: 2.5 })

// Track exports
telemetry.trackExport('start', 'csv', 100)
telemetry.trackExport('success', 'csv', 100)

// Track performance
telemetry.trackPerformance('ReportsScreen_load', 1200)

// Track errors
telemetry.trackError(error, { context: 'data-save' })
```

### 6. Form Telemetry Hook

**Location**: `src/hooks/use-form-telemetry.ts`

React hook for automatic form lifecycle tracking:

**Features**:
- Automatic form start tracking on mount
- Automatic cancel tracking on unmount (if form not saved)
- Easy validation error tracking
- Save success tracking with duration
- Error handling integration

**Usage**:
```tsx
import { useFormTelemetry } from '@/hooks/use-form-telemetry'

function MyForm() {
  const { trackValidationError, trackSaveSuccess, trackSaveError } = useFormTelemetry({
    formName: 'MyForm'
  })

  const handleSubmit = async () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      trackValidationError(errors)
      return
    }

    try {
      await saveData()
      trackSaveSuccess({ recordId: 'xyz' })
    } catch (error) {
      await trackSaveError(error, { formData: 'xyz' })
    }
  }
}
```

### 7. Performance Monitoring Hook

**Location**: `src/hooks/use-performance-monitor.ts`

React hook for component performance monitoring:

**Features**:
- Component lifetime tracking
- Render count tracking
- Action performance tracking (sync and async)
- Automatic telemetry integration

**Usage**:
```tsx
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

function MyComponent() {
  const perf = usePerformanceMonitor('MyComponent')

  const handleClick = () => {
    perf.trackAction('button_click', () => {
      // Synchronous action
      processData()
    })
  }

  const handleAsyncClick = async () => {
    await perf.trackAsyncAction('fetch_data', async () => {
      return await fetchData()
    })
  }
}
```

### 8. Enhanced Reports with Error Handling

**Location**: `src/components/ReportsScreen.tsx`

Reports screen now includes:
- Retry logic for export failures
- Progress notifications during retry
- Telemetry tracking for export operations
- Better error messages

**Example**:
```tsx
const handleExport = async () => {
  telemetry.trackExport('start', exportFormat, recordCount)
  
  const result = await safeAsync(
    async () => exportData(),
    {
      retry: true,
      retryOptions: {
        maxAttempts: 2,
        onRetry: (attempt) => {
          toast.info('Erneuter Versuch...', {
            description: `Versuch ${attempt} von 2`
          })
        }
      }
    }
  )
  
  if (result) {
    telemetry.trackExport('success', exportFormat, recordCount)
  }
}
```

### 9. Timer Actions with Telemetry

**Location**: `src/components/TodayScreen.tsx`

All timer actions (start, pause, resume, stop) now tracked with telemetry:

```tsx
const handleStart = () => {
  // ... timer logic
  
  telemetry.trackTimerAction('start', {
    projectId: selectedProject,
    mode: selectedMode,
    hasPhase: !!selectedPhase,
    hasTask: !!selectedTask
  })
}

const handleStop = () => {
  // ... timer logic
  
  telemetry.trackTimerAction('stop', {
    timerId: activeTimer.id,
    duration: duration,
    totalEvents: allEvents.length
  })
}
```

## Best Practices

### Using Unknown Instead of Any

**❌ Bad**:
```tsx
function processData(data: any) {
  return data.value
}
```

**✅ Good**:
```tsx
function processData(data: unknown): string | null {
  if (isObject(data) && hasProperty(data, 'value') && isString(data.value)) {
    return data.value
  }
  return null
}
```

### Validating External Data

**❌ Bad**:
```tsx
const data = JSON.parse(response) as TimeEntry
```

**✅ Good**:
```tsx
import { safeParseTimeEntry } from '@/lib/schemas'

const result = safeParseTimeEntry(JSON.parse(response))
if (result.success) {
  const data = result.data
} else {
  console.error('Invalid data:', result.error)
}
```

### Error Handling

**❌ Bad**:
```tsx
try {
  await saveData()
  toast.success('Saved')
} catch (error) {
  toast.error('Error')
}
```

**✅ Good**:
```tsx
import { safeAsync } from '@/lib/error-handler'

const result = await safeAsync(
  async () => await saveData(),
  {
    showToast: true,
    trackTelemetry: true,
    retry: true,
    context: { operation: 'save' }
  }
)

if (result) {
  // Success handling
}
```

## Performance Metrics

The telemetry system tracks key performance indicators:

1. **Form Completion Time**: Time from form open to save
2. **Validation Error Rate**: Percentage of forms with validation errors
3. **Save Success Rate**: Percentage of successful saves
4. **Export Performance**: Time to complete exports
5. **Component Render Time**: Time to render components
6. **Timer Usage Patterns**: Start/stop frequency, average duration

## Accessing Telemetry Data

```tsx
import { telemetry } from '@/lib/telemetry'

// Get all events
const allEvents = telemetry.getEvents()

// Get specific event type
const formEvents = telemetry.getEventsByType(TelemetryEventType.FORM_START)

// Get session summary
const summary = telemetry.getSessionSummary()
console.log(summary)
// {
//   sessionId: 'abc123',
//   totalEvents: 42,
//   eventCounts: {
//     form_start: 5,
//     form_save_success: 4,
//     timer_start: 3,
//     ...
//   },
//   sessionDuration: 125000
// }
```

## Configuration

### Disabling Telemetry

```tsx
import { telemetry } from '@/lib/telemetry'

telemetry.disable()
```

### Clearing Telemetry Data

```tsx
telemetry.clearEvents()
```

## Future Enhancements

1. **Telemetry Dashboard**: Add a screen to visualize telemetry data
2. **Performance Budgets**: Alert when performance thresholds exceeded ✅ COMPLETED
3. **A/B Testing**: Use telemetry to track feature adoption
4. **User Segmentation**: Analyze behavior by user role
5. **Crash Reporting**: Automatic error reporting to external service
6. **Real User Monitoring**: Track performance on actual user devices

## Performance Budgets (NEW)

**Location**: `src/lib/performance-budgets.ts`

A comprehensive system for tracking and alerting on component performance violations.

### Features

**Budget Configuration**:
- Set maximum render time (ms) per component
- Set maximum re-render count
- Set maximum component lifetime (ms)
- Enable/disable monitoring per component
- Default budgets for all key components

**Violation Detection**:
- Automatic tracking when components exceed budgets
- Severity levels: INFO, WARNING (1.5x), CRITICAL (2x+)
- Stack trace capture for debugging
- Violation history with timestamps

**Real-time Alerts**:
- Toast notifications for violations
- Configurable minimum severity
- Debounced alerts to prevent spam
- Visual severity indicators

**Performance Monitoring Dashboard**:
- Overview of all violations
- Stats by component, severity, and metric
- Real-time budget configuration
- Component performance statistics
- P95 render times and averages
- Progress bars showing budget utilization

### Default Performance Budgets

```typescript
const DEFAULT_BUDGETS = {
  'App': {
    maxRenderTime: 100ms,
    maxReRenders: 10,
    maxLifetimeMs: 300000 (5 minutes)
  },
  'TodayScreen': {
    maxRenderTime: 50ms,
    maxReRenders: 20,
    maxLifetimeMs: 600000 (10 minutes)
  },
  'WeekScreen': {
    maxRenderTime: 80ms,
    maxReRenders: 15,
    maxLifetimeMs: 600000
  },
  'ReportsScreen': {
    maxRenderTime: 150ms,
    maxReRenders: 10,
    maxLifetimeMs: 300000
  },
  'Projects': {
    maxRenderTime: 60ms,
    maxReRenders: 15,
    maxLifetimeMs: 600000
  },
  'QuickTimeEntry': {
    maxRenderTime: 30ms,
    maxReRenders: 25,
    maxLifetimeMs: 120000 (2 minutes)
  }
}
```

### Usage

**Enable Performance Monitoring**:
```tsx
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

function MyComponent() {
  usePerformanceMonitor('MyComponent')
  
  // Component automatically tracked for:
  // - Render time
  // - Re-render count
  // - Component lifetime
  
  return <div>...</div>
}
```

**Configure Custom Budget**:
```tsx
import { performanceBudgets } from '@/lib/performance-budgets'

performanceBudgets.setBudget('MyComponent', {
  component: 'MyComponent',
  maxRenderTime: 50,
  maxReRenders: 15,
  maxLifetimeMs: 120000,
  enabled: true
})
```

**Access Violation Data**:
```tsx
import { performanceBudgets, PerformanceSeverity } from '@/lib/performance-budgets'

// Get all violations
const violations = performanceBudgets.getViolations()

// Get critical violations only
const critical = performanceBudgets.getViolations({
  severity: PerformanceSeverity.CRITICAL
})

// Get violations for a specific component
const componentViolations = performanceBudgets.getViolations({
  component: 'TodayScreen'
})

// Get violations in the last hour
const recent = performanceBudgets.getViolations({
  since: Date.now() - 3600000
})

// Get summary
const summary = performanceBudgets.getViolationSummary()
console.log(summary)
// {
//   total: 42,
//   byComponent: { TodayScreen: 15, WeekScreen: 10, ... },
//   bySeverity: { critical: 5, warning: 20, info: 17 },
//   byMetric: { renderTime: 25, reRenders: 12, lifetime: 5 }
// }

// Get component stats
const stats = performanceBudgets.getComponentStats('TodayScreen')
console.log(stats)
// {
//   renderCount: 42,
//   avgRenderTime: 35.2,
//   minRenderTime: 12.1,
//   maxRenderTime: 89.5,
//   p95RenderTime: 72.3,
//   violations: 8
// }
```

**Listen for Violations**:
```tsx
import { performanceBudgets } from '@/lib/performance-budgets'

useEffect(() => {
  const unsubscribe = performanceBudgets.onViolation((violation) => {
    console.log('Performance violation:', violation)
    // Custom handling (e.g., send to analytics, show custom UI)
  })
  
  return unsubscribe
}, [])
```

**Performance Alert Provider**:
```tsx
import { PerformanceAlertProvider } from '@/components/PerformanceAlertProvider'
import { PerformanceSeverity } from '@/lib/performance-budgets'

// In App.tsx
<PerformanceAlertProvider 
  enabled={true} 
  minSeverity={PerformanceSeverity.WARNING}
  debounceMs={5000}
/>
```

**Performance Monitor Dashboard**:
```tsx
import { PerformanceBudgetMonitor } from '@/components/PerformanceBudgetMonitor'

// Accessible via "Performance" tab in main navigation
<PerformanceBudgetMonitor />
```

### Integration with Components

The following components now have performance monitoring enabled:
- `App` - Main application component
- `TodayScreen` - Today's time tracking view
- `WeekScreen` - Weekly time tracking view
- `Projects` - Project management view
- `ReportsScreen` - Reports and analytics (lazy loaded)

### Console Output

When a violation occurs in development mode, detailed information is logged:

```
⚠️ Performance Budget Violation
  Component: TodayScreen
  Metric: renderTime
  Actual: 75.23ms
  Budget: 50ms
  Ratio: 1.50x (50.5% over budget)
  Severity: warning
  
  [Stack trace showing where the violation occurred]
```

### Benefits

1. **Early Detection**: Catch performance regressions before they affect users
2. **Objective Metrics**: Quantifiable performance targets for each component
3. **Developer Awareness**: Real-time feedback on performance impact
4. **Debugging Support**: Stack traces help identify performance bottlenecks
5. **Historical Data**: Track performance trends over time
6. **Configurable Thresholds**: Adjust budgets based on component complexity

### Best Practices

**Setting Budgets**:
- Start with generous budgets and tighten gradually
- Critical user-facing components should have stricter budgets
- Complex components (reports, dashboards) can have higher budgets
- Consider user context (fast vs. slow devices)

**Responding to Violations**:
- INFO: Monitor, not urgent
- WARNING: Investigate if persistent
- CRITICAL: Immediate optimization needed

**Common Optimizations**:
- Memoize expensive calculations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo` for expensive child components
- Implement virtual scrolling for long lists
- Defer non-critical rendering with `useTransition`
- Code-split large components with `lazy()`

