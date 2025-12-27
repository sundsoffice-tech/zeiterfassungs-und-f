# CI Performance Regression Testing - Quick Start Guide

## 🚀 Overview

This project includes automated performance regression tests that run in CI pipelines. Tests automatically fail builds when components exceed performance budgets by 2x or more.

## ✅ Setup Complete

The following has been configured:

- ✅ Performance regression test suite (`src/tests/performance-regression.test.tsx`)
- ✅ Vitest configuration for performance tests (`vitest.config.performance.ts`)
- ✅ GitHub Actions workflow (`.github/workflows/performance-regression.yml`)
- ✅ CI script (`scripts/performance-ci.sh`)
- ✅ NPM test scripts
- ✅ Performance Test Dashboard UI component
- ✅ Comprehensive documentation

## 🏃 Running Tests

### Local Development

```bash
npm run test:performance
```

### Watch Mode

```bash
npm run test:performance:watch
```

### UI Mode (Interactive)

```bash
npm run test:performance:ui
```

## 📊 Viewing Results

### In the App

1. Navigate to the "Performance" tab in the app
2. Click on "Test Dashboard" sub-tab
3. View real-time performance metrics and test results

### In CI

1. Go to GitHub Actions tab
2. View the "Performance Regression Tests" workflow
3. Download performance reports from artifacts
4. Review PR comments for violation details

## 🔍 What Gets Tested

### Component Render Performance

Each major component is tested to ensure:
- Initial render time stays within budget
- Re-renders don't exceed limits
- Component lifetime is reasonable

### Monitored Components

- `App` - Main application component
- `TodayScreen` - Today's time tracking view
- `WeekScreen` - Weekly time tracking view
- `ReportsScreen` - Reports and analytics
- `Projects` - Project management view
- `AdminScreen` - Administration panel
- `QuickTimeEntry` - Quick time entry dialog
- `Dashboard` - Main dashboard view

## ⚠️ Performance Budgets

### Default Budgets

| Component | Max Render Time | Max Re-renders | Max Lifetime |
|-----------|----------------|----------------|--------------|
| App | 100ms | 10 | 5 min |
| TodayScreen | 50ms | 20 | 10 min |
| WeekScreen | 80ms | 15 | 10 min |
| ReportsScreen | 150ms | 10 | 5 min |
| Projects | 60ms | 15 | 10 min |
| QuickTimeEntry | 30ms | 25 | 2 min |
| AdminScreen | 80ms | 10 | 5 min |
| Dashboard | 100ms | 10 | 10 min |

### Severity Levels

- **INFO**: 1.0-1.5x over budget (warning only)
- **WARNING**: 1.5-2.0x over budget (flagged but doesn't fail)
- **CRITICAL**: 2.0x+ over budget (**FAILS CI**)

## 🚨 When CI Fails

If the performance regression test fails:

1. **Review the Output**: Check the CI logs for specific violations
2. **Identify the Component**: Note which component(s) failed
3. **Check the Metric**: See if it's render time, re-renders, or lifetime
4. **Profile Locally**: Run tests locally with `npm run test:performance:ui`
5. **Optimize**: Fix the performance issue
6. **Verify**: Re-run tests locally
7. **Push**: Commit and push your changes

### Common Fixes

```typescript
// ❌ BAD: Causes excessive re-renders
function MyComponent({ data }) {
  const [state, setState] = useState(processData(data)) // Runs every render!
}

// ✅ GOOD: Memoized processing
function MyComponent({ data }) {
  const processedData = useMemo(() => processData(data), [data])
}

// ❌ BAD: Creates new function every render
function MyComponent({ onSave }) {
  return <Child onClick={() => onSave()} />
}

// ✅ GOOD: Memoized callback
function MyComponent({ onSave }) {
  const handleClick = useCallback(() => onSave(), [onSave])
  return <Child onClick={handleClick} />
}
```

## 🔧 Adjusting Budgets

If a budget needs adjustment (legitimate complexity increase):

1. Edit `src/lib/performance-budgets.ts`
2. Update the `DEFAULT_BUDGETS` configuration
3. Document why the budget was increased
4. Get approval in code review

```typescript
'MyComponent': {
  component: 'MyComponent',
  maxRenderTime: 75,  // Increased from 50 due to new chart rendering
  maxReRenders: 20,
  maxLifetimeMs: 300000,
  enabled: true
}
```

## 📈 Monitoring in Production

Performance monitoring runs in production automatically. Access metrics via:

1. Performance tab in the app
2. Performance Test Dashboard
3. Browser DevTools (React Profiler)
4. Performance reports (downloadable JSON)

## 🔄 CI Workflow

The GitHub Actions workflow:

1. Runs on every PR and push to main/develop
2. Installs dependencies
3. Executes performance tests
4. Generates performance report
5. Uploads artifacts (reports, logs)
6. Comments on PR with results (if violations found)
7. Compares with base branch performance
8. Fails build if critical violations detected

## 📦 Artifacts

After each CI run, the following artifacts are available:

- `performance-reports-{sha}/` - Contains:
  - `performance-report-{timestamp}.json` - Full performance report
  - `test-output-{timestamp}.log` - Console output
  - `test-results.json` - Vitest results

## 🎯 Best Practices

### 1. Run Tests Before Pushing

```bash
npm run test:performance
```

### 2. Profile Components During Development

```typescript
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

function MyComponent() {
  usePerformanceMonitor('MyComponent')
  // Component code
}
```

### 3. Check Performance Tab Regularly

Monitor the Performance Test Dashboard tab to catch regressions early.

### 4. Keep Budgets Realistic

Set budgets based on:
- Actual measured performance
- Component complexity
- User experience requirements
- Hardware targets

### 5. Document Performance Decisions

When adjusting budgets or accepting violations, document why.

## 🐛 Troubleshooting

### Tests Pass Locally But Fail in CI

CI runs in a different environment. Ensure:
- Tests use relative timing (budget ratios, not absolute values)
- No hardcoded timeouts
- No external dependencies

### Flaky Tests

If tests are inconsistent:
- Check for background processes
- Verify no race conditions
- Increase measurement samples
- Use averaged metrics

### False Positives

If legitimate code changes trigger failures:
- Review if complexity genuinely increased
- Consider adjusting budgets
- Document the change
- Get peer review

## 📚 Additional Resources

- [PERFORMANCE_REGRESSION_TESTING.md](./PERFORMANCE_REGRESSION_TESTING.md) - Full documentation
- [PERFORMANCE_BUDGETS.md](./PERFORMANCE_BUDGETS.md) - Budget system details
- [React Performance Docs](https://react.dev/learn/render-and-commit)
- [Vitest Documentation](https://vitest.dev/)

## 🆘 Support

Need help?

1. Check the full documentation
2. Review test output and logs
3. Profile components with React DevTools
4. Check Performance Test Dashboard
5. Open an issue with details

## ✨ Summary

- 🧪 **Tests run automatically** in CI on every PR
- ⚡ **Critical violations fail builds** (2x+ over budget)
- 📊 **Detailed reports** available in artifacts
- 💬 **PR comments** show violation details
- 🎯 **Dashboard UI** for real-time monitoring
- 🔧 **Easy to adjust** budgets when needed

**The goal**: Catch performance regressions early and maintain a fast, responsive application.
