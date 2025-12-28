# Skeleton Loaders & Async Content - Implementation Guide

This document describes the skeleton loader system implemented to prevent layout jumps across the application.

## Overview

Skeleton loaders provide placeholder UI while async content loads, maintaining consistent layout and improving perceived performance.

## Available Skeleton Components

Located in `/src/components/SkeletonLoaders.tsx`:

### 1. **TableSkeleton**
```tsx
<TableSkeleton rows={5} columns={4} />
```
Use for: Data tables, grid views

### 2. **CardSkeleton**
```tsx
<CardSkeleton count={3} />
```
Use for: Card grids, dashboard widgets

### 3. **ListSkeleton**
```tsx
<ListSkeleton items={5} />
```
Use for: Lists, feed items, navigation items

### 4. **TimeEntrySkeleton**
```tsx
<TimeEntrySkeleton count={5} />
```
Use for: Time entry lists (domain-specific)

### 5. **DashboardSkeleton**
```tsx
<DashboardSkeleton />
```
Use for: Dashboard overview screens

### 6. **WeekViewSkeleton**
```tsx
<WeekViewSkeleton />
```
Use for: Calendar/week views

### 7. **ForecastSkeleton**
```tsx
<ForecastSkeleton />
```
Use for: Forecast/prediction screens

### 8. **AIInsightSkeleton**
```tsx
<AIInsightSkeleton />
```
Use for: AI-generated insights, suggestions

### 9. **ProjectListSkeleton**
```tsx
<ProjectListSkeleton count={5} />
```
Use for: Project lists

### 10. **ChartSkeleton**
```tsx
<ChartSkeleton height="h-96" />
```
Use for: Charts, graphs, visualizations

### 11. **EmployeeListSkeleton**
```tsx
<EmployeeListSkeleton count={5} />
```
Use for: Employee/user lists

### 12. **FormSkeleton**
```tsx
<FormSkeleton />
```
Use for: Forms loading async validation

### 13. **CalendarSkeleton**
```tsx
<CalendarSkeleton />
```
Use for: Calendar views

### 14. **ReportSkeleton**
```tsx
<ReportSkeleton />
```
Use for: Report screens

### 15. **IntegrationSkeleton**
```tsx
<IntegrationSkeleton count={4} />
```
Use for: Integration cards

## AsyncContentWrapper Component

Comprehensive wrapper for async content with built-in skeleton support:

```tsx
import { AsyncContentWrapper } from '@/components/AsyncContentWrapper'

<AsyncContentWrapper
  isLoading={loading}
  error={error}
  skeleton="chart"
  minHeight="min-h-[400px]"
  isEmpty={data.length === 0}
  emptyState={<EmptyState />}
>
  <YourContent />
</AsyncContentWrapper>
```

### Props:
- `isLoading`: boolean - Shows skeleton when true
- `error`: Error | null - Shows error state when present
- `skeleton`: SkeletonType - Type of skeleton to display
- `customSkeleton`: ReactNode - Custom skeleton component
- `minHeight`: string - Minimum height (prevents layout jump)
- `errorFallback`: ReactNode - Custom error component
- `emptyState`: ReactNode - Shown when isEmpty is true
- `isEmpty`: boolean - Indicates empty data
- `className`: string - Additional classes

## useAsyncState Hook

Track async operation state:

```tsx
import { useAsyncState } from '@/hooks/use-async-state'

const { data, loading, error, execute } = useAsyncState<ForecastData>(null)

const loadData = async () => {
  await execute(async () => {
    const result = await fetchData()
    return result
  })
}

// In component
if (loading) return <ForecastSkeleton />
if (error) return <ErrorDisplay error={error} />
return <DataDisplay data={data} />
```

## Implementation Pattern

### Basic Pattern
```tsx
function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <TableSkeleton rows={5} columns={4} />

  return <DataTable data={data} />
}
```

### Advanced Pattern with AsyncContentWrapper
```tsx
function MyComponent() {
  const { data, loading, error, execute } = useAsyncState<MyData[]>([])

  useEffect(() => {
    execute(fetchMyData)
  }, [])

  return (
    <AsyncContentWrapper
      isLoading={loading}
      error={error}
      skeleton="list"
      isEmpty={!data || data.length === 0}
      emptyState={<EmptyListState />}
    >
      <MyDataList data={data} />
    </AsyncContentWrapper>
  )
}
```

## Layout Stability CSS

Additional CSS classes in `/src/styles/layout-stability.css`:

### Utility Classes:
- `.async-content-wrapper` - Standard async content container
- `.chart-container` - For charts with min-height
- `.stable-text` - Tabular numbers, no text shift
- `.stable-icon` - Icons that don't shift
- `.preserve-aspect-square` - 1:1 aspect ratio
- `.preserve-aspect-video` - 16:9 aspect ratio
- `.preserve-aspect-card` - 4:3 aspect ratio

### Usage:
```tsx
<div className="chart-container">
  {loading ? <ChartSkeleton /> : <Chart data={data} />}
</div>
```

## Best Practices

### 1. Always Match Skeleton to Content
The skeleton should visually match the content it's replacing:
```tsx
// ✅ Good
{loading ? <TimeEntrySkeleton count={entries.length || 5} /> : <TimeEntryList />}

// ❌ Bad
{loading ? <CardSkeleton /> : <ComplexTable />}
```

### 2. Set Minimum Heights
Prevent layout jumps by reserving space:
```tsx
<div className="min-h-[300px]">
  {loading ? <Skeleton /> : <Content />}
</div>
```

### 3. Match Skeleton Count to Expected Data
```tsx
<AsyncContentWrapper
  skeleton="list"
  isLoading={loading}
>
  <ListSkeleton items={expectedCount || 5} />
</AsyncContentWrapper>
```

### 4. Use Accessibility Attributes
All skeletons include `role="status"` and `aria-label`:
```tsx
<div role="status" aria-label="Daten werden geladen">
  <Skeleton />
  <span className="sr-only">Daten werden geladen...</span>
</div>
```

### 5. Smooth Transitions
Use CSS transitions for loading state changes:
```tsx
<div className="transition-opacity duration-200" data-loading={loading}>
  {content}
</div>
```

## Examples in Codebase

### ForecastScreen
```tsx
// /src/components/ForecastScreen.tsx
if (loading) {
  return <ForecastSkeleton />
}
```

### ExplainableAIScreen
```tsx
// /src/components/ExplainableAIScreen.tsx
{isGeneratingInsights ? (
  <AIInsightSkeleton />
) : (
  <ExplainableInsightDisplay insights={allInsights} />
)}
```

### CalendarIntegrationScreen
```tsx
// /src/components/CalendarIntegrationScreen.tsx
{isSyncing && <ListSkeleton items={3} />}
{!isSyncing && calendar.pendingEvents.length > 0 && (
  <EventList events={calendar.pendingEvents} />
)}
```

### ReportsScreen (Lazy Loaded)
```tsx
// /src/App.tsx
<Suspense fallback={<ReportsLoadingSkeleton />}>
  <ReportsScreen {...props} />
</Suspense>
```

## Testing Skeleton Loaders

To test skeleton loaders in development:

1. **Slow down network in DevTools**: Throttle to "Slow 3G"
2. **Add artificial delay**:
```tsx
const loadData = async () => {
  setLoading(true)
  await new Promise(resolve => setTimeout(resolve, 2000)) // Test delay
  const data = await fetchData()
  setLoading(false)
}
```

## Common Issues & Solutions

### Issue: Layout still jumps
**Solution**: Ensure skeleton has same height as content
```tsx
// Add min-height matching content
<div className="min-h-[400px]">
  {loading ? <Skeleton className="h-[400px]" /> : <Content />}
</div>
```

### Issue: Skeleton flashes briefly
**Solution**: Add minimum display time
```tsx
const [loading, setLoading] = useState(true)
const loadData = async () => {
  const start = Date.now()
  const data = await fetchData()
  const elapsed = Date.now() - start
  if (elapsed < 300) {
    await new Promise(r => setTimeout(r, 300 - elapsed))
  }
  setLoading(false)
}
```

### Issue: Content shifts on data load
**Solution**: Use CSS containment
```tsx
<div className="content-container" style={{ contain: 'layout' }}>
  {content}
</div>
```

## Performance Considerations

1. **Skeleton components are lightweight** - Only render simple shapes
2. **Use CSS for animations** - Hardware-accelerated
3. **Avoid nested skeletons** - One skeleton per async boundary
4. **Memoize skeleton components** - No need to re-render
5. **Lazy load heavy content** - Use React.lazy() with skeleton fallback

## Future Enhancements

- [ ] Add loading progress indicators to skeletons
- [ ] Create animated skeleton variants
- [ ] Add theme-aware skeleton colors
- [ ] Generate skeletons automatically from component structure
- [ ] Add skeleton preview in Storybook
