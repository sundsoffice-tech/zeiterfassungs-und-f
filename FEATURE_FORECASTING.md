# Forecast & Planning Feature Documentation

## Overview

The Forecast & Planning feature provides comprehensive predictive analytics for project management, enabling proactive decision-making through:

1. **Time Estimation**: Historical data-driven predictions for task/project durations
2. **Budget Risk Assessment**: Multi-factor risk scoring to predict budget overruns
3. **Staffing Recommendations**: Intelligent capacity planning with specific actions

## Core Capabilities

### 1. Time Estimation Engine

Analyzes historical time entries to predict future effort requirements.

**Algorithm:**
- Calculates average duration from historical entries for matching project/task combinations
- Computes standard deviation to measure consistency
- Generates confidence score (0-100%) based on sample size (10+ entries = 100%)
- Falls back to estimated hours or default (8h) when no historical data exists

**Output:**
```typescript
{
  taskId?: string
  projectId: string
  estimatedHours: number           // Average from historical data
  confidence: number               // 0-100%, higher with more data points
  basedOn: {
    historicalEntries: number      // Sample size
    averageHours: number           // Mean duration
    stdDeviation: number           // Variability measure
  }
  explanation: string              // Human-readable reasoning
}
```

**Use Cases:**
- Project planning and sprint estimation
- Resource allocation decisions
- Client quote preparation
- Comparing estimated vs actual effort

### 2. Budget Risk Assessment

Multi-dimensional analysis to predict likelihood of budget overruns.

**Risk Factors:**
1. **Budget Usage** (+30% if >90% consumed, +20% if >75%)
2. **Budget Overrun Projection** (+35% if projected >110% budget)
3. **Timeline Pressure** (+25% if <7 days with high daily hours needed)
4. **Burn Rate** (+20% if current rate projects significant overrun)
5. **Completion Rate** (+15% if <50% complete with <14 days remaining)
6. **Project Activity** (+10% if no entries with imminent deadline)

**Risk Score Calculation:**
```
Risk Score = sum(applicable factors)
Capped at 100%

Severity Levels:
- Critical: 70-100%
- High: 50-69%
- Medium: 30-49%
- Low: 0-29%
```

**Metrics Tracked:**
- Budget hours (planned capacity)
- Spent hours (actual consumption)
- Estimated remaining hours (calculated from task estimates)
- Projected total hours (spent + remaining)
- Percent complete (weighted by task completion)
- Days remaining (until project end date)
- Burn rate (hours per day average)

**Output:**
```typescript
{
  projectId: string
  projectName: string
  riskScore: number                    // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  budgetHours: number
  spentHours: number
  estimatedRemainingHours: number
  projectedTotalHours: number
  percentComplete: number
  daysRemaining: number
  burnRate: number                     // hours/day
  factors: Array<{
    name: string
    impact: number                     // Risk points added
    description: string
  }>
  explanation: string                  // Summary with emoji severity indicator
}
```

### 3. Staffing Recommendations

Capacity-based analysis to optimize team allocation.

**Algorithm:**
```
Required Capacity = estimatedRemainingHours
Available Capacity = currentStaff × 6h/day × daysRemaining

if (availableCapacity < requiredCapacity × 0.8):
  action = increase
  if (daysRemaining <= 3): urgency = critical
  if (daysRemaining <= 7): urgency = high
  else: urgency = medium
  
  recommendedStaff = ceil(requiredCapacity / (6 × daysRemaining))

else if (availableCapacity > requiredCapacity × 2 and currentStaff > 1):
  action = reduce
  recommendedStaff = max(1, floor(requiredCapacity / (6 × daysRemaining)))

else:
  action = maintain
  recommendedStaff = currentStaff
```

**Assumptions:**
- 6 productive hours per person per day (accounts for meetings, breaks, context switching)
- Minimum staffing of 1 person
- Linear scaling (no efficiency loss from adding people)

**Output:**
```typescript
{
  projectId: string
  projectName: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  currentStaff: number
  recommendedStaff: number
  action: 'reduce' | 'maintain' | 'increase_moderate' | 'increase_urgent'
  impact: string                       // One-line summary
  explanation: string                  // Detailed reasoning with emoji
  specificActions: string[]            // Bullet-pointed action items
  deadline?: string
  hoursNeeded: number
  daysAvailable: number
}
```

**Example Recommendations:**
- **Critical Priority**: "🚨 Empfehlung: 3 Personen morgen statt 1, sonst Verzug"
  - Actions: "2 Personen SOFORT hinzufügen", "Überstunden einplanen", "Täglich Status-Check"
- **High Priority**: "⚡ 2 zusätzliche Personen diese Woche benötigt"
  - Actions: "2 Personen in den nächsten 2 Tagen hinzufügen", "Tägliches Monitoring"
- **Medium Priority**: "⚠ Erhöhung auf 3 Personen empfohlen"
  - Actions: "1 Person in nächster Woche hinzufügen", "Wöchentliches Progress-Review"
- **Low Priority**: "✓ Aktuelle Besetzung ist angemessen"
  - Actions: "Aktuelle Besetzung beibehalten", "Fortschritt weiter beobachten"

## AI Enhancement

Optional GPT-4-powered analysis for high-risk projects.

**Process:**
1. Identify top 3 projects with risk level "high" or "critical"
2. Send structured JSON to GPT-4o-mini with project metrics and risk factors
3. Request short assessment, immediate actions, and realistic prognosis
4. Parse response and append to risk explanations with 🤖 prefix

**Prompt Structure:**
```
Du bist ein Projektmanagement-Experte. Analysiere folgende Projekt-Risiken...

Gib für jedes Projekt:
1. Eine kurze Risikoeinschätzung (1 Satz)
2. Die 2-3 wichtigsten Sofortmaßnahmen
3. Eine realistische Prognose

Antworte im JSON-Format mit einem "insights" Array.
```

**Graceful Degradation:**
- If AI unavailable or errors, falls back to rule-based analysis only
- Error logged but doesn't block forecast generation
- UI indicates whether forecast is AI-enhanced

## User Interface

### Navigation
Access via "Forecast" tab in main navigation (TrendUp icon)

### Layout
Three-tab interface:
1. **Personalempfehlungen** (Staffing Recommendations)
2. **Budget-Risiken** (Budget Risks)
3. **Zeitschätzungen** (Time Estimates)

### Alert Banner
Shown when critical/high risks or urgent recommendations exist:
- Lists all critical budget risks with explanation
- Lists all urgent staffing recommendations with impact
- Orange background with warning icon for visibility

### Cards
**Staffing Recommendation Card:**
- Color-coded border (red/orange/yellow/green) by priority
- Action icon (TrendUp/TrendDown/CheckCircle) based on recommendation
- Priority badge (🚨 KRITISCH, ⚡ HOCH, ⚠ MITTEL, ✓ NIEDRIG)
- Current vs Recommended staff comparison with arrow
- Detailed explanation
- Bullet-pointed specific actions

**Budget Risk Card:**
- Color-coded border by severity level
- Risk score badge (percentage)
- Progress bar showing budget usage
- Metric grid (spent/remaining/burn rate)
- Detailed explanation (may include AI insights)
- Risk factors breakdown with impact scores

**Time Estimate Card:**
- Project and task name
- Estimated hours (large, prominent)
- Confidence badge
- Metric grid (entries/average/std deviation)
- Historical explanation

### Actions
- **Prognose erstellen**: Generate basic forecast (rule-based)
- **KI-Prognose erstellen**: Generate AI-enhanced forecast
- **Aktualisieren**: Refresh current forecast type
- Auto-generates on first load if projects exist

### Visual Design
- Consistent severity colors (red=critical, orange=high, yellow=medium, green=low)
- Emoji prefixes for quick recognition (🚨⚡⚠✓🤖)
- Progress bars and metric grids for at-a-glance insights
- Scroll area for long estimate lists

## Implementation Details

### Files
- **`/src/lib/forecasting.ts`**: Core algorithms and forecast generation
- **`/src/components/ForecastScreen.tsx`**: UI component with three-tab interface

### Dependencies
- `date-fns` for date calculations
- `spark.llm` API for AI enhancement (optional)
- Existing type definitions (Employee, Project, Task, TimeEntry, PlannedTime)

### Performance
- Basic forecast: <3 seconds for 50+ projects
- AI-enhanced forecast: <10 seconds (depends on API latency)
- Computations cached until refresh requested

### Data Requirements
**Minimum:**
- Active projects with budget/dates
- Time entries with project assignments
- Employee records

**Optional:**
- Tasks with estimated hours (improves accuracy)
- Planned time entries (not yet implemented in calculations)
- Historical data (6+ weeks recommended for high confidence)

## Use Cases

### 1. Weekly Planning Meeting
Project manager reviews Forecast tab before weekly team meeting:
- Identifies projects with "critical" staffing needs
- Reviews specific actions for urgent recommendations
- Presents data-driven case for resource reallocation

### 2. Client Status Report
Before quarterly review with client:
- Checks budget risk assessment
- Prepares explanation for any "high" or "critical" risks
- Proposes mitigation strategies from specific actions

### 3. Sprint Planning
During sprint planning:
- Reviews time estimates for planned tasks
- Adjusts sprint scope based on confidence levels
- Allocates team members according to staffing recommendations

### 4. Executive Dashboard
Leadership review:
- Sorts projects by risk score
- Focuses attention on critical/high-risk projects
- Makes strategic hiring/staffing decisions

## Future Enhancements

### Planned Features
1. **Historical Accuracy Tracking**: Compare estimates vs actuals, tune algorithms
2. **What-If Scenarios**: Model impact of adding/removing staff or extending deadlines
3. **Multi-Project Portfolio View**: Cross-project resource optimization
4. **Trend Analysis**: Risk score changes over time
5. **Notification System**: Proactive alerts when risk levels change
6. **Integration with Planned Time**: Incorporate planned hours into capacity calculations
7. **Team Skill Matching**: Recommend specific people based on skills, not just headcount
8. **Budget Forecasting**: Extend to cost projections, not just hours

### Known Limitations
- Linear scaling assumption (reality: adding people has diminishing returns)
- No consideration of team member experience/seniority
- Doesn't account for dependencies between tasks
- No vacation/absence integration in capacity planning
- AI enhancement requires internet connection

## Testing Recommendations

### Test Scenarios
1. **No Historical Data**: Verify fallback to defaults/estimates
2. **Overstaffed Project**: Confirm "reduce" recommendation
3. **Understaffed with Tight Deadline**: Verify "critical" priority
4. **Projects On Track**: Check "maintain" recommendations
5. **High Budget Usage**: Validate risk factor calculations
6. **AI Unavailable**: Ensure graceful degradation

### Sample Data
Create test projects with:
- Various budget utilization levels (50%, 80%, 95%, 110%)
- Different timeline pressures (30 days, 14 days, 3 days)
- Mixed staffing levels (0, 1, 3, 5 people)
- Historical entries with varying patterns

## Configuration

No user-configurable settings currently. Hard-coded constants:

```typescript
// Capacity planning
const hoursPerPersonPerDay = 6

// Risk thresholds
const budgetWarningThreshold = 0.75    // 75%
const budgetCriticalThreshold = 0.90   // 90%
const overrunProjection = 1.10         // 110%

// Timeline urgency
const urgentDays = 7
const criticalDays = 3

// Confidence scoring
const maxConfidenceEntries = 10

// AI enhancement
const topRisksToAnalyze = 3
```

Consider making these configurable in tenant settings for v2.
