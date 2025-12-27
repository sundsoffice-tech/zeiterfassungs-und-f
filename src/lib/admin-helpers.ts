import { 
  TimeEntry, 
  Employee, 
  Project, 
  Task, 
  MileageEntry, 
  ActiveTimer, 
  UserRole,
  Warning,
  LiveStatus,
  KPI,
  TimesheetPeriod,
  Absence,
  ApprovalStatus
} from './types'
import { format, startOfWeek, endOfWeek, isWeekend, parseISO, differenceInDays, startOfDay, endOfDay } from 'date-fns'

export function calculateLiveStatuses(
  activeTimer: ActiveTimer | null,
  employees: Employee[]
): LiveStatus[] {
  const statuses: LiveStatus[] = []
  
  if (activeTimer) {
    const now = Date.now()
    const elapsed = activeTimer.isPaused
      ? activeTimer.pausedAt! - activeTimer.startTime - activeTimer.pausedDuration
      : now - activeTimer.startTime - activeTimer.pausedDuration
    
    statuses.push({
      employeeId: activeTimer.employeeId,
      projectId: activeTimer.projectId,
      taskId: activeTimer.taskId,
      status: activeTimer.isPaused ? 'paused' : 'working',
      startTime: activeTimer.startTime,
      duration: elapsed,
      lastActivity: activeTimer.isPaused ? activeTimer.pausedAt! : now
    })
  }
  
  return statuses
}

export function detectWarnings(
  timeEntries: TimeEntry[],
  mileageEntries: MileageEntry[],
  employees: Employee[],
  projects: Project[],
  absences: Absence[],
  timesheetPeriods: TimesheetPeriod[]
): Warning[] {
  const warnings: Warning[] = []
  const today = new Date()
  
  timeEntries.forEach((entry) => {
    const entryDate = parseISO(entry.date)
    
    if (entry.duration > 12) {
      warnings.push({
        id: `warn-${entry.id}-overtime`,
        type: 'overtime_risk',
        severity: entry.duration > 16 ? 'critical' : entry.duration > 14 ? 'high' : 'medium',
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        entryId: entry.id,
        date: entry.date,
        title: 'Überlange Arbeitszeit',
        description: `${entry.duration.toFixed(1)}h Arbeit an einem Tag (Limit: 12h)`,
        metadata: { duration: entry.duration },
        acknowledged: false
      })
    }
    
    if (isWeekend(entryDate)) {
      warnings.push({
        id: `warn-${entry.id}-weekend`,
        type: 'implausible',
        severity: 'low',
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        entryId: entry.id,
        date: entry.date,
        title: 'Wochenendarbeit',
        description: 'Zeiteintrag am Wochenende',
        acknowledged: false
      })
    }
    
    if (entry.billable && !entry.notes) {
      warnings.push({
        id: `warn-${entry.id}-missing-notes`,
        type: 'missing_notes',
        severity: 'low',
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        entryId: entry.id,
        date: entry.date,
        title: 'Fehlende Notizen',
        description: 'Abrechenbarer Eintrag ohne Beschreibung',
        acknowledged: false
      })
    }
    
    const durationMinutes = entry.duration * 60
    const roundedMinutes = Math.round(durationMinutes)
    if (roundedMinutes % 60 === 0 && durationMinutes > 60) {
      warnings.push({
        id: `warn-${entry.id}-perfect-rounding`,
        type: 'implausible',
        severity: 'low',
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        entryId: entry.id,
        date: entry.date,
        title: 'Verdächtige Rundung',
        description: `Exakt ${entry.duration}h - möglicherweise geschätzt`,
        acknowledged: false
      })
    }
  })
  
  projects.forEach((project) => {
    if (!project.budget) return
    
    const projectEntries = timeEntries.filter(e => e.projectId === project.id)
    const totalHours = projectEntries.reduce((sum, e) => sum + e.duration, 0)
    const budgetUsage = (totalHours / project.budget) * 100
    
    if (budgetUsage > 80) {
      warnings.push({
        id: `warn-${project.id}-budget`,
        type: 'budget_risk',
        severity: budgetUsage > 100 ? 'critical' : budgetUsage > 95 ? 'high' : 'medium',
        projectId: project.id,
        date: format(today, 'yyyy-MM-dd'),
        title: 'Budget-Risiko',
        description: `Projekt ${project.name}: ${budgetUsage.toFixed(0)}% Budget verbraucht`,
        metadata: { budgetUsage, totalHours, budget: project.budget },
        acknowledged: false
      })
    }
  })
  
  employees.forEach((employee) => {
    const employeeEntries = timeEntries.filter(e => e.employeeId === employee.id)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    
    const employeeDays = new Set(employeeEntries.map(e => e.date))
    const missingDays: string[] = []
    
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const isAbsent = absences.some(a => 
        a.employeeId === employee.id && 
        dateStr >= a.startDate && 
        dateStr <= a.endDate
      )
      
      if (!employeeDays.has(dateStr) && !isWeekend(d) && !isAbsent && d <= today) {
        missingDays.push(dateStr)
      }
    }
    
    if (missingDays.length > 0) {
      warnings.push({
        id: `warn-${employee.id}-missing-days`,
        type: 'missing_days',
        severity: missingDays.length > 2 ? 'high' : 'medium',
        employeeId: employee.id,
        date: format(today, 'yyyy-MM-dd'),
        title: 'Fehlende Tage',
        description: `${employee.name}: ${missingDays.length} Tage ohne Zeiteintrag diese Woche`,
        metadata: { missingDays },
        acknowledged: false
      })
    }
  })
  
  return warnings
}

export function calculateKPIs(
  timeEntries: TimeEntry[],
  mileageEntries: MileageEntry[],
  employees: Employee[],
  projects: Project[]
): KPI[] {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  
  const thisWeekEntries = timeEntries.filter(e => {
    const entryDate = parseISO(e.date)
    return entryDate >= weekStart && entryDate <= weekEnd
  })
  
  const billableHours = thisWeekEntries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + e.duration, 0)
  
  const nonBillableHours = thisWeekEntries
    .filter(e => !e.billable)
    .reduce((sum, e) => sum + e.duration, 0)
  
  const totalHours = billableHours + nonBillableHours
  const utilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0
  
  const activeProjects = projects.filter(p => {
    const hasRecentActivity = timeEntries.some(e => 
      e.projectId === p.id && 
      differenceInDays(today, parseISO(e.date)) <= 7
    )
    return hasRecentActivity
  }).length
  
  const projectsWithBudget = projects.filter(p => p.budget).length
  const projectsOverBudget = projects.filter(p => {
    if (!p.budget) return false
    const spent = timeEntries
      .filter(e => e.projectId === p.id)
      .reduce((sum, e) => sum + e.duration, 0)
    return spent > p.budget
  }).length
  
  const totalRevenue = timeEntries
    .filter(e => e.billable && e.rate)
    .reduce((sum, e) => sum + (e.duration * (e.rate || 0)), 0)
  
  const totalCost = timeEntries.reduce((sum, e) => {
    const employee = employees.find(emp => emp.id === e.employeeId)
    const rate = employee?.hourlyRate || 0
    return sum + (e.duration * rate)
  }, 0)
  
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
  
  return [
    {
      id: 'utilization',
      name: 'Auslastung',
      value: utilization,
      target: 75,
      unit: '%',
      period: 'Diese Woche',
      description: 'Abrechenbare vs. nicht-abrechenbare Stunden',
      changeDirection: utilization >= 75 ? 'up' : 'down'
    },
    {
      id: 'billable-hours',
      name: 'Abrechenbare Stunden',
      value: billableHours,
      unit: 'h',
      period: 'Diese Woche',
      description: 'Gesamt abrechenbare Arbeitsstunden'
    },
    {
      id: 'active-projects',
      name: 'Aktive Projekte',
      value: activeProjects,
      unit: '',
      period: 'Letzte 7 Tage',
      description: 'Projekte mit Aktivität'
    },
    {
      id: 'budget-compliance',
      name: 'Budget-Einhaltung',
      value: projectsWithBudget > 0 
        ? ((projectsWithBudget - projectsOverBudget) / projectsWithBudget) * 100 
        : 100,
      target: 100,
      unit: '%',
      period: 'Alle Projekte',
      description: `${projectsOverBudget} von ${projectsWithBudget} Projekten über Budget`,
      changeDirection: projectsOverBudget === 0 ? 'up' : 'down'
    },
    {
      id: 'profit-margin',
      name: 'Marge',
      value: profitMargin,
      target: 30,
      unit: '%',
      period: 'Diese Woche',
      description: 'Gewinnmarge (Umsatz - Kosten)',
      changeDirection: profitMargin >= 30 ? 'up' : profitMargin >= 20 ? 'neutral' : 'down'
    }
  ]
}

export function getPendingTimesheets(
  timesheetPeriods: TimesheetPeriod[]
): TimesheetPeriod[] {
  return timesheetPeriods.filter(t => t.status === ApprovalStatus.SUBMITTED)
}

export function getOpenApprovals(
  timeEntries: TimeEntry[],
  mileageEntries: MileageEntry[]
): { timeEntries: TimeEntry[], mileageEntries: MileageEntry[] } {
  return {
    timeEntries: timeEntries.filter(e => e.approvalStatus === ApprovalStatus.SUBMITTED),
    mileageEntries: mileageEntries.filter(e => e.approvalStatus === ApprovalStatus.SUBMITTED)
  }
}

export function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      'view_all',
      'edit_all',
      'approve_all',
      'see_rates',
      'create_projects',
      'manage_users',
      'run_reports',
      'edit_after_approval',
      'access_admin'
    ],
    [UserRole.PROJECT_MANAGER]: [
      'view_team',
      'edit_team',
      'approve_team',
      'see_rates',
      'create_projects',
      'run_reports'
    ],
    [UserRole.EMPLOYEE]: [
      'view_own',
      'edit_own',
      'submit_own'
    ],
    [UserRole.EXTERNAL]: [
      'view_own',
      'edit_own',
      'submit_own'
    ]
  }
  
  return permissions[role]?.includes(action) || false
}

export function filterDataByRole(
  role: UserRole,
  userId: string,
  data: any[],
  dataType: 'timeEntry' | 'employee' | 'project'
): any[] {
  if (role === UserRole.ADMIN) {
    return data
  }
  
  if (role === UserRole.EXTERNAL || role === UserRole.EMPLOYEE) {
    if (dataType === 'timeEntry') {
      return data.filter((item: TimeEntry) => item.employeeId === userId)
    }
    if (dataType === 'employee') {
      return data.filter((item: Employee) => item.id === userId)
    }
  }
  
  return data
}
