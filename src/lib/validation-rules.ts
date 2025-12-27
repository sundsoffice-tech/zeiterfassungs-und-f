import { TimeEntry, Project, Employee, Absence, AbsenceType } from './types'
import { parseISO, isWeekend, format } from 'date-fns'

export enum ValidationSeverity {
  HARD = 'hard',
  SOFT = 'soft'
}

export interface ValidationResult {
  valid: boolean
  severity: ValidationSeverity
  code: string
  message: string
  field?: string
  metadata?: Record<string, any>
  explanation?: string
  quickFixes?: ValidationQuickFix[]
}

export interface ValidationQuickFix {
  id: string
  label: string
  description: string
  icon?: string
  action: {
    type: 'update_field' | 'split_entry' | 'move_entry' | 'delete_entry' | 'confirm' | 'fill_gap'
    field?: string
    value?: any
    entries?: any[]
  }
}

export interface ValidationContext {
  entry: TimeEntry
  allEntries: TimeEntry[]
  projects: Project[]
  employees: Employee[]
  absences: Absence[]
  holidays: string[]
  tenantSettings?: {
    maxDailyHours?: number
    restrictedHours?: { start: string; end: string }
    weekendWorkRequiresApproval?: boolean
    requireNotesForBillable?: boolean
  }
}

export class TimeEntryValidator {
  static validate(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = []

    results.push(...this.validateHardRules(context))
    results.push(...this.validateSoftRules(context))

    return results
  }

  private static validateHardRules(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = []

    results.push(...this.checkOverlaps(context))
    results.push(...this.checkNegativeDuration(context))
    results.push(...this.checkRestrictedHours(context))
    results.push(...this.checkProjectStatus(context))
    results.push(...this.checkAbsenceConflicts(context))

    return results
  }

  private static validateSoftRules(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = []

    results.push(...this.checkDailyHoursLimit(context))
    results.push(...this.checkMissingNotes(context))
    results.push(...this.checkUnusualRounding(context))
    results.push(...this.checkWeekendWork(context))
    results.push(...this.checkHolidayWork(context))
    results.push(...this.checkLongShifts(context))
    results.push(...this.checkNoPauses(context))

    return results
  }

  private static checkOverlaps(context: ValidationContext): ValidationResult[] {
    const { entry, allEntries } = context
    const results: ValidationResult[] = []

    const entryStart = this.parseTime(entry.date, entry.startTime)
    const entryEnd = this.parseTime(entry.date, entry.endTime)

    const overlapping = allEntries.filter(e => {
      if (e.id === entry.id) return false
      if (e.employeeId !== entry.employeeId) return false
      if (e.date !== entry.date) return false

      const otherStart = this.parseTime(e.date, e.startTime)
      const otherEnd = this.parseTime(e.date, e.endTime)

      return (
        (entryStart >= otherStart && entryStart < otherEnd) ||
        (entryEnd > otherStart && entryEnd <= otherEnd) ||
        (entryStart <= otherStart && entryEnd >= otherEnd)
      )
    })

    overlapping.forEach(overlappingEntry => {
      const quickFixes: any[] = [
        {
          id: 'move-to-end',
          label: 'Nach Ende verschieben',
          description: `Startzeit auf ${overlappingEntry.endTime} setzen`,
          action: {
            type: 'update_field',
            field: 'startTime',
            value: overlappingEntry.endTime
          }
        },
        {
          id: 'adjust-end',
          label: 'Ende anpassen',
          description: `Endzeit auf ${overlappingEntry.startTime} setzen`,
          action: {
            type: 'update_field',
            field: 'endTime',
            value: overlappingEntry.startTime
          }
        },
        {
          id: 'delete-other',
          label: 'Anderen Eintrag löschen',
          description: 'Den überlappenden Eintrag entfernen',
          action: {
            type: 'delete_entry',
            entries: [overlappingEntry.id]
          }
        }
      ]

      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'OVERLAP',
        message: `Überschneidung mit einem anderen Zeiteintrag (${overlappingEntry.startTime} - ${overlappingEntry.endTime})`,
        field: 'startTime',
        explanation: `Dieser Eintrag überschneidet sich zeitlich mit einem bereits vorhandenen Eintrag. Zwei Zeiteinträge können nicht zur gleichen Zeit stattfinden. Die Überschneidung ist zwischen ${entry.startTime}-${entry.endTime} und ${overlappingEntry.startTime}-${overlappingEntry.endTime}.`,
        metadata: {
          conflictingEntryId: overlappingEntry.id,
          conflictingProject: overlappingEntry.projectId,
          conflictingStartTime: overlappingEntry.startTime,
          conflictingEndTime: overlappingEntry.endTime
        },
        quickFixes
      })
    })

    return results
  }

  private static checkNegativeDuration(context: ValidationContext): ValidationResult[] {
    const { entry } = context
    const results: ValidationResult[] = []

    const start = this.parseTime(entry.date, entry.startTime)
    const end = this.parseTime(entry.date, entry.endTime)

    if (end <= start) {
      const nextDay = new Date(end)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayTime = `${String(nextDay.getHours()).padStart(2, '0')}:${String(nextDay.getMinutes()).padStart(2, '0')}`

      const quickFixes: any[] = [
        {
          id: 'swap-times',
          label: 'Zeiten vertauschen',
          description: 'Start- und Endzeit tauschen',
          action: {
            type: 'update_field',
            field: 'times',
            value: { startTime: entry.endTime, endTime: entry.startTime }
          }
        },
        {
          id: 'add-12-hours',
          label: '+12 Stunden zur Endzeit',
          description: 'Nachtschicht: Endzeit auf nächsten Tag setzen',
          action: {
            type: 'update_field',
            field: 'endTime',
            value: nextDayTime
          }
        }
      ]

      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'NEGATIVE_DURATION',
        message: 'Endzeit muss nach der Startzeit liegen',
        field: 'endTime',
        explanation: `Die Endzeit (${entry.endTime}) liegt vor der Startzeit (${entry.startTime}). Dies führt zu einer negativen Dauer. Wenn Sie eine Nachtschicht erfassen möchten, die über Mitternacht geht, verwenden Sie die 1-Klick-Lösung "+12 Stunden" oder splitten Sie den Eintrag in zwei Tage.`,
        quickFixes
      })
    }

    return results
  }

  private static checkRestrictedHours(context: ValidationContext): ValidationResult[] {
    const { entry, tenantSettings } = context
    const results: ValidationResult[] = []

    if (!tenantSettings?.restrictedHours) return results

    const { start, end } = tenantSettings.restrictedHours
    const entryStart = this.parseTime(entry.date, entry.startTime)
    const restrictedStart = this.parseTime(entry.date, start)
    const restrictedEnd = this.parseTime(entry.date, end)

    if (entryStart >= restrictedStart && entryStart < restrictedEnd) {
      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'RESTRICTED_HOURS',
        message: `Zeiterfassung zwischen ${start} und ${end} Uhr erfordert Freigabe`,
        field: 'startTime',
        metadata: {
          restrictedWindow: { start, end }
        }
      })
    }

    return results
  }

  private static checkProjectStatus(context: ValidationContext): ValidationResult[] {
    const { entry, projects } = context
    const results: ValidationResult[] = []

    const project = projects.find(p => p.id === entry.projectId)

    if (!project) {
      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'PROJECT_NOT_FOUND',
        message: 'Projekt nicht gefunden',
        field: 'projectId'
      })
      return results
    }

    if (!project.active) {
      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'PROJECT_INACTIVE',
        message: `Projekt "${project.name}" ist gesperrt oder geschlossen`,
        field: 'projectId',
        metadata: {
          projectName: project.name
        }
      })
    }

    if (project.endDate) {
      const entryDate = parseISO(entry.date)
      const projectEndDate = parseISO(project.endDate)
      
      if (entryDate > projectEndDate) {
        results.push({
          valid: false,
          severity: ValidationSeverity.HARD,
          code: 'PROJECT_ENDED',
          message: `Projekt "${project.name}" endete am ${format(projectEndDate, 'dd.MM.yyyy')}`,
          field: 'date',
          metadata: {
            projectName: project.name,
            endDate: project.endDate
          }
        })
      }
    }

    return results
  }

  private static checkAbsenceConflicts(context: ValidationContext): ValidationResult[] {
    const { entry, absences } = context
    const results: ValidationResult[] = []

    const entryDate = parseISO(entry.date)

    const conflictingAbsence = absences.find(absence => {
      if (absence.employeeId !== entry.employeeId) return false
      const startDate = parseISO(absence.startDate)
      const endDate = parseISO(absence.endDate)
      return entryDate >= startDate && entryDate <= endDate
    })

    if (conflictingAbsence) {
      const typeLabel = {
        [AbsenceType.VACATION]: 'Urlaub',
        [AbsenceType.SICK]: 'Krankheit',
        [AbsenceType.HOLIDAY]: 'Feiertag',
        [AbsenceType.BLOCKED]: 'Sperrzeit'
      }[conflictingAbsence.type]

      results.push({
        valid: false,
        severity: ValidationSeverity.HARD,
        code: 'ABSENCE_CONFLICT',
        message: `Zeiterfassung nicht möglich: ${typeLabel} am ${format(entryDate, 'dd.MM.yyyy')}`,
        field: 'date',
        metadata: {
          absenceType: conflictingAbsence.type,
          absenceReason: conflictingAbsence.reason
        }
      })
    }

    return results
  }

  private static checkDailyHoursLimit(context: ValidationContext): ValidationResult[] {
    const { entry, allEntries, tenantSettings } = context
    const results: ValidationResult[] = []

    const maxHours = tenantSettings?.maxDailyHours || 12

    const totalHoursForDay = allEntries
      .filter(e => e.employeeId === entry.employeeId && e.date === entry.date && e.id !== entry.id)
      .reduce((sum, e) => sum + e.duration, 0) + entry.duration

    if (totalHoursForDay > maxHours) {
      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'EXCESSIVE_DAILY_HOURS',
        message: `Tagesdauer überschreitet ${maxHours} Stunden (${totalHoursForDay.toFixed(1)}h)`,
        field: 'duration',
        metadata: {
          totalHours: totalHoursForDay,
          limit: maxHours
        }
      })
    }

    return results
  }

  private static checkMissingNotes(context: ValidationContext): ValidationResult[] {
    const { entry, projects, tenantSettings } = context
    const results: ValidationResult[] = []

    if (!tenantSettings?.requireNotesForBillable) return results

    const project = projects.find(p => p.id === entry.projectId)
    
    if (entry.billable && (!entry.notes || entry.notes.trim().length === 0)) {
      const quickFixes: any[] = [
        {
          id: 'add-standard-note',
          label: 'Standard-Notiz hinzufügen',
          description: 'Generische Projektarbeit eintragen',
          action: {
            type: 'update_field',
            field: 'notes',
            value: `Projektarbeit ${project?.name || ''}`
          }
        },
        {
          id: 'mark-non-billable',
          label: 'Als nicht abrechenbar markieren',
          description: 'Wenn keine Details nötig sind',
          action: {
            type: 'update_field',
            field: 'billable',
            value: false
          }
        }
      ]

      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'MISSING_NOTES',
        message: `Abrechenbare Zeit sollte eine Notiz enthalten`,
        field: 'notes',
        explanation: `Abrechenbare Zeiten sollten eine Beschreibung der durchgeführten Tätigkeit enthalten, damit der Kunde nachvollziehen kann, wofür die Zeit aufgewendet wurde. Dies ist auch wichtig für die interne Dokumentation und Qualitätssicherung.`,
        metadata: {
          projectName: project?.name
        },
        quickFixes
      })
    }

    if (!entry.taskId && project?.name && (!entry.notes || entry.notes.trim().length === 0)) {
      const quickFixes: any[] = [
        {
          id: 'add-placeholder-note',
          label: 'Platzhalter eintragen',
          description: 'Temporäre Notiz, später ergänzen',
          action: {
            type: 'update_field',
            field: 'notes',
            value: '[Details nachtragen]'
          }
        }
      ]

      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'MISSING_TASK_OR_NOTES',
        message: 'Eintrag ohne Task sollte eine Notiz enthalten',
        field: 'notes',
        explanation: 'Wenn kein spezifischer Task ausgewählt ist, sollte eine Notiz die Tätigkeit beschreiben, um die Zuordnung und spätere Nachvollziehbarkeit zu gewährleisten.',
        quickFixes
      })
    }

    return results
  }

  private static checkUnusualRounding(context: ValidationContext): ValidationResult[] {
    const { entry, allEntries } = context
    const results: ValidationResult[] = []

    const duration = entry.duration

    const isExactHour = duration % 1 === 0 && duration >= 4

    if (isExactHour) {
      const employeeEntries = allEntries.filter(e => 
        e.employeeId === entry.employeeId && 
        e.id !== entry.id
      )

      const exactHourCount = employeeEntries.filter(e => e.duration % 1 === 0 && e.duration >= 4).length
      const totalEntries = employeeEntries.length

      if (totalEntries >= 10 && exactHourCount / totalEntries > 0.7) {
        results.push({
          valid: true,
          severity: ValidationSeverity.SOFT,
          code: 'UNUSUAL_ROUNDING',
          message: `Ungewöhnlich häufige Rundungen auf volle Stunden (${Math.round(exactHourCount / totalEntries * 100)}%)`,
          field: 'duration',
          metadata: {
            exactHourPercentage: exactHourCount / totalEntries,
            duration: duration
          }
        })
      }
    }

    return results
  }

  private static checkWeekendWork(context: ValidationContext): ValidationResult[] {
    const { entry, employees, tenantSettings } = context
    const results: ValidationResult[] = []

    if (!tenantSettings?.weekendWorkRequiresApproval) return results

    const entryDate = parseISO(entry.date)
    const employee = employees.find(e => e.id === entry.employeeId)

    if (isWeekend(entryDate) && employee && !employee.email?.includes('weekend-approved')) {
      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'WEEKEND_WORK',
        message: `Wochenendarbeit erfordert möglicherweise Freigabe (${format(entryDate, 'dd.MM.yyyy')})`,
        field: 'date',
        metadata: {
          isWeekend: true,
          day: format(entryDate, 'EEEE')
        }
      })
    }

    return results
  }

  private static checkHolidayWork(context: ValidationContext): ValidationResult[] {
    const { entry, holidays } = context
    const results: ValidationResult[] = []

    if (holidays.includes(entry.date)) {
      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'HOLIDAY_WORK',
        message: `Arbeit an einem Feiertag (${format(parseISO(entry.date), 'dd.MM.yyyy')})`,
        field: 'date',
        metadata: {
          isHoliday: true
        }
      })
    }

    return results
  }

  private static checkLongShifts(context: ValidationContext): ValidationResult[] {
    const { entry } = context
    const results: ValidationResult[] = []

    if (entry.duration >= 10) {
      results.push({
        valid: true,
        severity: ValidationSeverity.SOFT,
        code: 'LONG_SHIFT',
        message: `Lange Schicht: ${entry.duration.toFixed(1)} Stunden ohne dokumentierte Pause`,
        field: 'duration',
        metadata: {
          duration: entry.duration
        }
      })
    }

    return results
  }

  private static checkNoPauses(context: ValidationContext): ValidationResult[] {
    const { entry, allEntries } = context
    const results: ValidationResult[] = []

    const dayEntries = allEntries.filter(e => 
      e.employeeId === entry.employeeId && 
      e.date === entry.date &&
      e.id !== entry.id
    ).concat(entry).sort((a, b) => a.startTime.localeCompare(b.startTime))

    if (dayEntries.length >= 2) {
      const totalDuration = dayEntries.reduce((sum, e) => sum + e.duration, 0)
      
      if (totalDuration >= 8) {
        let hasGap = false
        for (let i = 0; i < dayEntries.length - 1; i++) {
          const current = dayEntries[i]
          const next = dayEntries[i + 1]
          
          const currentEnd = this.parseTime(current.date, current.endTime)
          const nextStart = this.parseTime(next.date, next.startTime)
          
          const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)
          
          if (gapMinutes >= 30) {
            hasGap = true
            break
          }
        }

        if (!hasGap) {
          results.push({
            valid: true,
            severity: ValidationSeverity.SOFT,
            code: 'NO_PAUSES',
            message: `${totalDuration.toFixed(1)} Stunden ohne erkennbare Pause (mind. 30 Min)`,
            field: 'duration',
            metadata: {
              totalDuration: totalDuration,
              entryCount: dayEntries.length
            }
          })
        }
      }
    }

    return results
  }

  private static parseTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number)
    const d = parseISO(date)
    d.setHours(hours, minutes, 0, 0)
    return d
  }
}

export function getValidationSummary(results: ValidationResult[]): {
  hasHardErrors: boolean
  hasSoftWarnings: boolean
  hardErrors: ValidationResult[]
  softWarnings: ValidationResult[]
  canSave: boolean
} {
  const hardErrors = results.filter(r => r.severity === ValidationSeverity.HARD && !r.valid)
  const softWarnings = results.filter(r => r.severity === ValidationSeverity.SOFT)

  return {
    hasHardErrors: hardErrors.length > 0,
    hasSoftWarnings: softWarnings.length > 0,
    hardErrors,
    softWarnings,
    canSave: hardErrors.length === 0
  }
}
