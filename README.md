# Zeiterfassung - Time & Mileage Tracker

A world-class time tracking application with advanced features including AI-powered validation, forecasting, automation, and comprehensive performance monitoring.

## 🚀 Features

### Core Functionality
- **Time Tracking**: Record work hours with project, task, and phase allocation
- **Mileage Tracking**: Track business mileage with GPS integration
- **Project Management**: Organize work by projects, tasks, and phases
- **Reporting**: Comprehensive reports with charts and analytics
- **Absence Management**: Track vacation, sick leave, and other absences

### Advanced Features
- **AI Validation**: Intelligent validation of time entries using GPT-4
- **Explainable AI**: Transparent AI decision-making with evidence tracking
- **Forecasting**: Predict project completion and resource needs
- **Automation**: Recurring entries, smart categorization, reminders
- **Calendar Integration**: Auto-sync with calendar events
- **Trust Layer**: Validate data integrity and detect anomalies
- **Offline Sync**: Work offline with automatic synchronization
- **Email Notifications**: Anomaly alerts and reminders via email
- **Repair Mode**: Fix data inconsistencies and validation errors

### Performance & Quality
- **Performance Budgets**: Real-time component render monitoring
- **Performance Regression Tests**: Automated CI tests for performance
- **Lighthouse CI**: Automated web vitals and accessibility audits
- **Accessibility**: WCAG AA compliant, keyboard navigation, screen reader support
- **Code Quality**: Strict TypeScript, comprehensive error handling

## 📊 Performance Monitoring

### Web Vitals & Lighthouse CI

Real-time monitoring of Core Web Vitals and automated Lighthouse audits:

- **Performance Score**: ≥ 90 (automated checks)
- **Accessibility Score**: ≥ 95 (automated checks)
- **Best Practices**: ≥ 90
- **SEO**: ≥ 85

**Tracked Metrics:**
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- FID (First Input Delay)
- TTFB (Time to First Byte)
- INP (Interaction to Next Paint)

See [LIGHTHOUSE_CI.md](./LIGHTHOUSE_CI.md) for detailed documentation.

### Performance Budgets

Automated monitoring of component render times with configurable thresholds:
- Warning: > 16ms
- Error: > 50ms

See [PERFORMANCE_BUDGETS.md](./PERFORMANCE_BUDGETS.md) for details.

## 🛠️ Development

### Prerequisites
- Node.js 20+
- npm 10+

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing & Quality Checks

```bash
# Run performance regression tests
npm run test:performance

# Run Lighthouse CI audit
npm run lighthouse

# Or use the helper script
bash scripts/lighthouse-ci.sh

# Lint code
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run test:performance` - Run performance tests
- `npm run lighthouse` - Run Lighthouse CI audit
- `npm run lighthouse:collect` - Collect Lighthouse data
- `npm run lighthouse:assert` - Assert Lighthouse thresholds
- `npm run lighthouse:upload` - Upload Lighthouse results

## 🎨 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Phosphor Icons
- **Charts**: Recharts + D3.js
- **Forms**: React Hook Form + Zod
- **State**: React hooks + useKV (persistent storage)
- **AI**: OpenAI GPT-4 (via Spark SDK)
- **Testing**: Vitest
- **CI/CD**: GitHub Actions
- **Performance**: Lighthouse CI, Web Vitals

## 📖 Documentation

- [Product Requirements Document](./PRD.md)
- [Lighthouse CI Integration](./LIGHTHOUSE_CI.md)
- [Performance Budgets](./PERFORMANCE_BUDGETS.md)
- [Performance Testing](./PERFORMANCE_REGRESSION_TESTING.md)
- [Accessibility](./ACCESSIBILITY.md)
- [Email Notifications](./EMAIL_NOTIFICATIONS.md)
- [Trust Layer](./FEATURE_TRUST_LAYER.md)
- [Data Model](./DATA_MODEL.md)
- [Security](./SECURITY.md)

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── TodayScreen.tsx
│   ├── WeekScreen.tsx
│   ├── Projects.tsx
│   ├── WebVitalsMonitor.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── use-web-vitals.ts
│   ├── use-performance-monitor.ts
│   ├── use-automation.ts
│   └── ...
├── lib/                # Utility functions and types
│   ├── types.ts
│   ├── performance-budgets.ts
│   ├── automation.ts
│   └── ...
├── App.tsx             # Main application component
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## 🔒 Security

- No secrets in code (use environment variables)
- WCAG AA compliant for accessibility
- Secure data persistence via Spark KV
- CSP headers recommended in production

## 🤝 Contributing

This is a Spark template project. For issues or improvements:
1. Document the issue clearly
2. Provide reproduction steps
3. Suggest solutions when possible

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
