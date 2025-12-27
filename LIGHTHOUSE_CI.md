# Lighthouse CI Integration

This document describes the Lighthouse CI integration for automated web vitals and accessibility monitoring.

## Overview

Lighthouse CI runs automated audits on every push and pull request, measuring:
- **Performance**: Loading speed, bundle size, asset optimization
- **Accessibility**: ARIA labels, color contrast, keyboard navigation
- **Best Practices**: HTTPS, console errors, deprecated APIs
- **SEO**: Meta tags, structured data, mobile-friendliness

## Components

### 1. GitHub Actions Workflow (`.github/workflows/lighthouse-ci.yml`)

Automatically runs Lighthouse CI on:
- Push to `main` branch
- Pull requests to `main` branch

**Workflow Steps:**
1. Checkout code
2. Install dependencies
3. Build production bundle
4. Run Lighthouse CI audit
5. Upload results as artifacts
6. Comment PR with summary (for pull requests)

### 2. Lighthouse Configuration (`lighthouserc.json`)

**Collection Settings:**
- 3 runs per URL (for statistical significance)
- Desktop preset with realistic network throttling
- Optimized for CI environment

**Assertions:**
- Performance score: ≥ 90 (error)
- Accessibility score: ≥ 95 (error)
- Best Practices score: ≥ 90 (error)
- SEO score: ≥ 85 (warning)

**Web Vitals Thresholds:**
- First Contentful Paint (FCP): ≤ 2000ms
- Largest Contentful Paint (LCP): ≤ 2500ms
- Cumulative Layout Shift (CLS): ≤ 0.1
- Total Blocking Time (TBT): ≤ 300ms
- Speed Index: ≤ 3000ms
- Time to Interactive: ≤ 3500ms

**Accessibility Checks (Error Level):**
- Color contrast ratios
- Document title
- HTML lang attribute
- Meta viewport
- Button names
- Link names
- Image alt attributes
- Label elements
- ARIA attributes and values

### 3. Web Vitals Hook (`src/hooks/use-web-vitals.ts`)

Real-time monitoring of Core Web Vitals using Performance Observer API:

```typescript
const { currentVitals, history, recordLighthouseScore, clearHistory } = useWebVitals()
```

**Tracked Metrics:**
- **FCP** (First Contentful Paint): Time until first visible content
- **LCP** (Largest Contentful Paint): Time until largest visible element
- **CLS** (Cumulative Layout Shift): Visual stability measure
- **FID** (First Input Delay): First interaction latency
- **TTFB** (Time to First Byte): Server response time
- **INP** (Interaction to Next Paint): Overall interaction latency

**Features:**
- Automatic rating (good/needs-improvement/poor)
- Historical tracking (last 100 vitals, last 50 Lighthouse scores)
- Persistent storage using `useKV`
- Performance Observer for real-time measurements

### 4. Web Vitals Monitor UI (`src/components/WebVitalsMonitor.tsx`)

Dashboard for viewing web vitals and Lighthouse scores with 4 tabs:

#### Vitals Tab
- Real-time Core Web Vitals cards
- Color-coded status badges (green/yellow/red)
- Average values
- Last measurement timestamps

#### Lighthouse Tab
- Latest Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Visual progress bars
- Score interpretation

#### History Tab
- Complete history of all measurements
- Scrollable timeline view
- Quick filtering by metric

#### Info Tab
- Explanation of each metric
- Threshold descriptions
- CI/CD integration info

## Usage

### Running Locally

```bash
# Build the application
npm run build

# Run Lighthouse CI (requires build)
npm run lighthouse

# Or run individual steps
npm run lighthouse:collect
npm run lighthouse:assert
npm run lighthouse:upload
```

### Viewing Results

**In GitHub Actions:**
1. Navigate to Actions tab
2. Click on Lighthouse CI workflow
3. Download artifacts for detailed reports
4. View PR comment for summary (on pull requests)

**In Application:**
1. Navigate to Lighthouse tab
2. View real-time Web Vitals
3. Check historical trends
4. Review Lighthouse scores (populated by CI)

### Understanding Scores

**Performance (90+ required):**
- Bundle size optimization
- Code splitting effectiveness
- Image optimization
- Caching strategies

**Accessibility (95+ required):**
- WCAG AA contrast ratios
- Keyboard navigation
- Screen reader compatibility
- Semantic HTML

**Best Practices (90+ required):**
- HTTPS usage
- No console errors
- Modern JavaScript APIs
- Security headers

**SEO (85+ warning):**
- Meta tags
- Mobile-friendly design
- Structured data
- Valid HTML

### Ratings

| Score/Metric | Good | Needs Improvement | Poor |
|--------------|------|-------------------|------|
| Lighthouse Score | ≥ 90 | 50-89 | < 50 |
| FCP | ≤ 1800ms | 1800-3000ms | > 3000ms |
| LCP | ≤ 2500ms | 2500-4000ms | > 4000ms |
| CLS | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| FID | ≤ 100ms | 100-300ms | > 300ms |
| TTFB | ≤ 800ms | 800-1800ms | > 1800ms |
| INP | ≤ 200ms | 200-500ms | > 500ms |

## CI/CD Integration

### Required Secrets (Optional)

For persistent storage and enhanced features:
- `LHCI_GITHUB_APP_TOKEN`: GitHub App token for commenting on PRs

### Workflow Triggers

**Push to main:**
- Runs full Lighthouse audit
- Uploads results as artifacts
- Updates historical baseline

**Pull Requests:**
- Runs comparative audit vs. main branch
- Comments with score differences
- Fails if thresholds not met

### Artifact Retention

- Lighthouse results stored for 30 days
- HTML reports available for download
- JSON data for custom analysis

## Monitoring Strategy

### Real-Time (Client-Side)
- Web Vitals automatically collected during normal usage
- Performance Observer API tracks metrics
- Data persisted locally for historical analysis

### CI/CD (Build-Time)
- Automated audits on every deployment
- Prevents performance regressions
- Ensures accessibility standards

### Combined View
- Web Vitals Monitor shows both real-time and CI data
- Historical trends reveal patterns
- Immediate feedback on code changes

## Troubleshooting

### Lighthouse CI Fails

**Build errors:**
```bash
# Verify build works locally
npm run build
npm run preview
```

**Score threshold failures:**
1. Review detailed HTML report in artifacts
2. Focus on specific failing audits
3. Apply recommended fixes
4. Rerun CI

**Timeout issues:**
- Increase `startServerReadyTimeout` in `lighthouserc.json`
- Check build output for errors
- Verify preview server starts correctly

### Web Vitals Not Appearing

**Browser compatibility:**
- Requires modern browser with Performance Observer API
- Chrome/Edge recommended for full metric coverage

**Missing metrics:**
- Some metrics (FID, INP) require user interaction
- LCP requires visible content above the fold
- CLS accumulates over page lifetime

## Best Practices

### Optimizing Performance Score

1. **Code Splitting**: Lazy load routes and heavy components
2. **Image Optimization**: Use modern formats (WebP, AVIF)
3. **Bundle Analysis**: Remove unused dependencies
4. **Caching**: Implement proper cache headers
5. **Critical CSS**: Inline critical styles

### Improving Accessibility Score

1. **Color Contrast**: Use WCAG AA compliant colors
2. **Keyboard Navigation**: Test all interactions
3. **ARIA Labels**: Provide descriptive labels
4. **Semantic HTML**: Use proper heading hierarchy
5. **Focus Management**: Visible focus indicators

### Maintaining Best Practices Score

1. **Console Clean**: Remove all console errors
2. **HTTPS**: Ensure secure connections
3. **Modern APIs**: Avoid deprecated features
4. **Error Handling**: Graceful error boundaries
5. **Security**: Implement CSP headers

## Performance Budget

Current budgets defined in `lighthouserc.json`:

```json
{
  "dom-size": 1500 nodes (warn)
  "bootup-time": 3500ms (warn)
  "mainthread-work-breakdown": 4000ms (warn)
}
```

Adjust these based on your application's needs and complexity.

## Future Enhancements

- [ ] Lighthouse Server for persistent result storage
- [ ] Custom assertions for app-specific metrics
- [ ] Visual regression testing integration
- [ ] Performance budget alerts via notifications
- [ ] Automatic issue creation for failing audits
- [ ] Trend analysis and anomaly detection
- [ ] Multi-page auditing for complex apps
- [ ] Integration with analytics platforms

## Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
