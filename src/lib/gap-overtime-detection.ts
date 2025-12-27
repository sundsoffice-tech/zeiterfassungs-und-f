import { TimeEntry, Employee, Absence, AbsenceType } from './types'
import { startOfDay, endOfDay, eachDayOfInterval, format, parseISO, isWeekend, subDays } from 'date-fns'

export enum GapOvertimeType {
  MISSING_HOURS = 'missing_hours',
  OVERTIME = 'overtime',
  WEEKEND_WORK = 'weekend_work',
  NO_ENTRIES = 'no_entries'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface GapOvertimeIssue {
  id: string
  type: GapOvertimeType
  severity: Severity
  date: string
  title: string
  description: string
  expectedHours: number
  actualHours: number
  difference: number
  employee: Employee
  suggestedAction: string
}

export interface GapOvertimeAnalysis {
  issues: GapOvertimeIssue[]
  summary: {
    totalGaps: number
    totalOvertime: number
    totalMissingHours: number
    totalExcessHours: number
    affectedDays: number
  }
}

const STANDARD_WORK_HOURS = 8
const OVERTIME_THRESHOLD = 10
const MIN_WORK_HOURS = 6

export class GapOvertimeDetector {
  static analyzeLast7Days(
    employee: Employee,
    timeEntries: TimeEntry[],
    absences: Absence[] = []
  ): GapOvertimeAnalysis {
    const today = new Date()
    const sevenDaysAgo = subDays(today, 7)
    
    const dateRange = eachDayOfInterval({
      start: sevenDaysAgo,
      end: today
    })

    const issues: GapOvertimeIssue[] = []

    dateRange.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const isWeekendDay = isWeekend(date)

      const dailyEntries = timeEntries.filter(
        (entry) => entry.employeeId === employee.id && entry.date === dateStr
      )

      const dailyAbsences = absences.filter(
        (absence) =>
          absence.employeeId === employee.id &&
          dateStr >= absence.startDate &&
          dateStr <= absence.endDate &&
          (absence.type === AbsenceType.VACATION || 
           absence.type === AbsenceType.SICK || 
           absence.type === AbsenceType.HOLIDAY)
      )

      const hasAbsence = dailyAbsences.length > 0
      const totalHours = dailyEntries.reduce((sum, entry) => sum + entry.duration, 0)

      if (hasAbsence) {
        return
      }

      if (isWeekendDay && totalHours > 0) {
        issues.push({
          id: `${employee.id}-${dateStr}-weekend`,
          type: GapOvertimeType.WEEKEND_WORK,
          severity: Severity.MEDIUM,
          date: dateStr,
          title: 'Wochenendarbeit',
          description: `${totalHours.toFixed(1)} Stunden am Wochenende gearbeitet`,
          expectedHours: 0,
          actualHours: totalHours,
          difference: totalHours,
          employee,
          suggestedAction: 'Zeitausgleich prüfen oder als Überstunden markieren'
        })
      } else if (!isWeekendDay) {
        if (totalHours === 0) {
          issues.push({
            id: `${employee.id}-${dateStr}-missing`,
            type: GapOvertimeType.NO_ENTRIES,
            severity: Severity.HIGH,
            date: dateStr,
            title: 'Keine Einträge',
            description: 'Keine Zeiteinträge für diesen Arbeitstag erfasst',
            expectedHours: STANDARD_WORK_HOURS,
            actualHours: 0,
            difference: -STANDARD_WORK_HOURS,
            employee,
            suggestedAction: 'Fehlende Zeiten nachtragen'
          })
        } else if (totalHours < MIN_WORK_HOURS) {
          const difference = STANDARD_WORK_HOURS - totalHours
          issues.push({
            id: `${employee.id}-${dateStr}-gap`,
            type: GapOvertimeType.MISSING_HOURS,
            severity: difference > 4 ? Severity.HIGH : Severity.MEDIUM,
            date: dateStr,
            title: 'Fehlende Stunden',
            description: `Nur ${totalHours.toFixed(1)} von ${STANDARD_WORK_HOURS} Stunden erfasst`,
            expectedHours: STANDARD_WORK_HOURS,
            actualHours: totalHours,
            difference: -difference,
            employee,
            suggestedAction: `Fehlende ${difference.toFixed(1)} Stunden ergänzen`
          })
        } else if (totalHours >= OVERTIME_THRESHOLD) {
          const difference = totalHours - STANDARD_WORK_HOURS
          issues.push({
            id: `${employee.id}-${dateStr}-overtime`,
            type: GapOvertimeType.OVERTIME,
            severity: totalHours >= 12 ? Severity.HIGH : Severity.MEDIUM,
            date: dateStr,
            title: 'Überstunden',
            description: `${totalHours.toFixed(1)} Stunden erfasst (${difference.toFixed(1)}h Überstunden)`,
            expectedHours: STANDARD_WORK_HOURS,
            actualHours: totalHours,
            difference: difference,
            employee,
            suggestedAction: 'Überstunden bestätigen oder Einträge korrigieren'
          })
        }
      }
    })

    const totalMissingHours = issues
      .filter((i) => i.type === GapOvertimeType.MISSING_HOURS || i.type === GapOvertimeType.NO_ENTRIES)
      .reduce((sum, i) => sum + Math.abs(i.difference), 0)

    const totalExcessHours = issues
      .filter((i) => i.type === GapOvertimeType.OVERTIME || i.type === GapOvertimeType.WEEKEND_WORK)
      .reduce((sum, i) => sum + i.difference, 0)

    const totalGaps = issues.filter(
      (i) => i.type === GapOvertimeType.MISSING_HOURS || i.type === GapOvertimeType.NO_ENTRIES
    ).length

    const totalOvertime = issues.filter(
      (i) => i.type === GapOvertimeType.OVERTIME || i.type === GapOvertimeType.WEEKEND_WORK
    ).length

    const affectedDays = new Set(issues.map((i) => i.date)).size

    return {
      issues,
      summary: {
        totalGaps,
        totalOvertime,
        totalMissingHours,
        totalExcessHours,
        affectedDays
      }
    }
  }

  static analyzeAllEmployees(
    employees: Employee[],
    timeEntries: TimeEntry[],
    absences: Absence[] = []
  ): Map<string, GapOvertimeAnalysis> {
    const results = new Map<string, GapOvertimeAnalysis>()

    employees.forEach((employee) => {
      const analysis = this.analyzeLast7Days(employee, timeEntries, absences)
      if (analysis.issues.length > 0) {
        results.set(employee.id, analysis)
      }
    })

    return results
  }

  static getMostUrgentIssue(analysis: GapOvertimeAnalysis): GapOvertimeIssue | null {
    if (analysis.issues.length === 0) return null

    const highSeverityIssues = analysis.issues.filter((i) => i.severity === Severity.HIGH)
    if (highSeverityIssues.length > 0) {
      return highSeverityIssues.sort((a, b) => b.date.localeCompare(a.date))[0]
    }

    const mediumSeverityIssues = analysis.issues.filter((i) => i.severity === Severity.MEDIUM)
    if (mediumSeverityIssues.length > 0) {
      return mediumSeverityIssues.sort((a, b) => b.date.localeCompare(a.date))[0]
    }

    return analysis.issues.sort((a, b) => b.date.localeCompare(a.date))[0]
  }

  static shouldShowBanner(analysis: GapOvertimeAnalysis): boolean {
    return analysis.issues.filter((i) => i.severity !== Severity.LOW).length > 0
  }

  static getBannerMessage(analysis: GapOvertimeAnalysis): string {
    const { summary } = analysis

    if (summary.totalGaps > 0 && summary.totalOvertime > 0) {
      return `${summary.totalGaps} Lücke${summary.totalGaps > 1 ? 'n' : ''} und ${summary.totalOvertime} Überstunden in den letzten 7 Tagen`
    } else if (summary.totalGaps > 0) {
      return `${summary.totalGaps} Zeiterfassungs-Lücke${summary.totalGaps > 1 ? 'n' : ''} in den letzten 7 Tagen`
    } else if (summary.totalOvertime > 0) {
      return `${summary.totalOvertime} Tag${summary.totalOvertime > 1 ? 'e' : ''} mit Überstunden in den letzten 7 Tagen`
    }

    return 'Anomalien in der Zeiterfassung erkannt'
  }
}
