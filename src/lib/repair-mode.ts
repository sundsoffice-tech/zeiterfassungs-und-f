import { TimeEntry, Employee, Project, Task, Phase, Absence } from './types'
import { ValidationResult, ValidationSeverity, TimeEntryValidator } from './validation-rules'
import { AnomalyDetection, AnomalySeverity } from './anomaly-detection'
import { parseISO, format, addMinutes, differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'

export enum IssueType {
  GAP = 'gap',
  OVERLAP = 'overlap',
  VALIDATION_ERROR = 'validation_error',
  ANOMALY = 'anomaly',
  MISSING_DATA = 'missing_data'
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

export enum IssueStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface TimeGap {
  date: string
  startTime: string
  endTime: string
  duration: number
  previousEntry?: TimeEntry
  nextEntry?: TimeEntry
}

export interface TimeOverlap {
  date: string
  entry1: TimeEntry
  entry2: TimeEntry
  overlapStart: string
  overlapEnd: string
  overlapDuration: number
}

export interface Issue {
  id: string
  type: IssueType
  severity: IssueSeverity
  status: IssueStatus
  title: string
  description: string
  employeeId: string
  date: string
  affectedEntries: string[]
  metadata: {
    gap?: TimeGap
    overlap?: TimeOverlap
    validationResult?: ValidationResult
    anomaly?: AnomalyDetection
    suggestedActions?: RepairAction[]
  }
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  dismissedReason?: string
}

export enum RepairActionType {
  FILL_GAP = 'fill_gap',
  SPLIT_ENTRY = 'split_entry',
  SHIFT_ENTRY = 'shift_entry',
  DELETE_ENTRY = 'delete_entry',
  MERGE_ENTRIES = 'merge_entries',
  UPDATE_FIELD = 'update_field',
  BATCH_UPDATE = 'batch_update'
}

export interface RepairAction {
  type: RepairActionType
  label: string
  description: string
  autoApplicable: boolean
  confidence: number
  payload: Record<string, any>
}

export interface RepairProposal {
  issueId: string
  action: RepairAction
  preview: {
    before: TimeEntry[]
    after: TimeEntry[]
  }
  estimated30SecondsFix: boolean
}

export class IssueDetector {
  static detectIssues(
    timeEntries: TimeEntry[],
    employees: Employee[],
    projects: Project[],
    tasks: Task[],
    phases: Phase[],
    absences: Absence[]
  ): Issue[] {
    const issues: Issue[] = []

    employees.forEach(employee => {
      const employeeEntries = timeEntries.filter(e => e.employeeId === employee.id)
      
      const dates = [...new Set(employeeEntries.map(e => e.date))].sort()
      
      dates.forEach(date => {
        const dayEntries = employeeEntries
          .filter(e => e.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        issues.push(...this.detectGaps(dayEntries, employee, date))
        issues.push(...this.detectOverlaps(dayEntries, employee, date))
      })

      issues.push(...this.detectMissingData(employeeEntries, employee, projects, tasks))
    })

    return issues
  }

  private static detectGaps(entries: TimeEntry[], employee: Employee, date: string): Issue[] {
    const issues: Issue[] = []

    if (entries.length < 2) return issues

    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i]
      const next = entries[i + 1]

      const currentEnd = this.parseTime(date, current.endTime)
      const nextStart = this.parseTime(date, next.startTime)

      const gapMinutes = differenceInMinutes(nextStart, currentEnd)

      if (gapMinutes >= 15 && gapMinutes <= 180) {
        const gap: TimeGap = {
          date,
          startTime: current.endTime,
          endTime: next.startTime,
          duration: gapMinutes / 60,
          previousEntry: current,
          nextEntry: next
        }

        let severity = IssueSeverity.INFO
        if (gapMinutes >= 30 && gapMinutes <= 90) severity = IssueSeverity.WARNING
        if (gapMinutes > 90) severity = IssueSeverity.CRITICAL

        issues.push({
          id: `gap-${employee.id}-${date}-${i}`,
          type: IssueType.GAP,
          severity,
          status: IssueStatus.PENDING,
          title: `Zeitlücke von ${(gapMinutes / 60).toFixed(1)}h erkannt`,
          description: `Zwischen ${current.endTime} und ${next.startTime} liegt eine Lücke von ${(gapMinutes / 60).toFixed(1)} Stunden`,
          employeeId: employee.id,
          date,
          affectedEntries: [current.id, next.id],
          metadata: {
            gap,
            suggestedActions: this.generateGapRepairActions(gap, current, next)
          },
          createdAt: new Date().toISOString()
        })
      }
    }

    return issues
  }

  private static detectOverlaps(entries: TimeEntry[], employee: Employee, date: string): Issue[] {
    const issues: Issue[] = []

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i]
        const entry2 = entries[j]

        const start1 = this.parseTime(date, entry1.startTime)
        const end1 = this.parseTime(date, entry1.endTime)
        const start2 = this.parseTime(date, entry2.startTime)
        const end2 = this.parseTime(date, entry2.endTime)

        if ((start1 < end2 && end1 > start2)) {
          const overlapStart = isAfter(start1, start2) ? start1 : start2
          const overlapEnd = isBefore(end1, end2) ? end1 : end2
          const overlapMinutes = differenceInMinutes(overlapEnd, overlapStart)

          if (overlapMinutes > 0) {
            const overlap: TimeOverlap = {
              date,
              entry1,
              entry2,
              overlapStart: format(overlapStart, 'HH:mm'),
              overlapEnd: format(overlapEnd, 'HH:mm'),
              overlapDuration: overlapMinutes / 60
            }

            issues.push({
              id: `overlap-${employee.id}-${date}-${i}-${j}`,
              type: IssueType.OVERLAP,
              severity: IssueSeverity.CRITICAL,
              status: IssueStatus.PENDING,
              title: `Überlappung von ${(overlapMinutes / 60).toFixed(1)}h erkannt`,
              description: `Einträge überschneiden sich zwischen ${overlap.overlapStart} und ${overlap.overlapEnd}`,
              employeeId: employee.id,
              date,
              affectedEntries: [entry1.id, entry2.id],
              metadata: {
                overlap,
                suggestedActions: this.generateOverlapRepairActions(overlap)
              },
              createdAt: new Date().toISOString()
            })
          }
        }
      }
    }

    return issues
  }

  private static detectMissingData(
    entries: TimeEntry[],
    employee: Employee,
    projects: Project[],
    tasks: Task[]
  ): Issue[] {
    const issues: Issue[] = []

    entries.forEach(entry => {
      const missingFields: string[] = []

      if (!entry.notes || entry.notes.trim() === '') {
        if (entry.billable || !entry.taskId) {
          missingFields.push('notes')
        }
      }

      if (!entry.taskId) {
        const project = projects.find(p => p.id === entry.projectId)
        if (project && !entry.notes?.trim()) {
          missingFields.push('task')
        }
      }

      if (missingFields.length > 0) {
        issues.push({
          id: `missing-data-${entry.id}`,
          type: IssueType.MISSING_DATA,
          severity: IssueSeverity.INFO,
          status: IssueStatus.PENDING,
          title: `Fehlende Details: ${missingFields.join(', ')}`,
          description: `Eintrag könnte detaillierter sein (${missingFields.join(', ')} fehlt)`,
          employeeId: employee.id,
          date: entry.date,
          affectedEntries: [entry.id],
          metadata: {
            suggestedActions: [
              {
                type: RepairActionType.UPDATE_FIELD,
                label: 'Details hinzufügen',
                description: `${missingFields.join(' und ')} ergänzen`,
                autoApplicable: false,
                confidence: 0.5,
                payload: { entryId: entry.id, fields: missingFields }
              }
            ]
          },
          createdAt: new Date().toISOString()
        })
      }
    })

    return issues
  }

  private static generateGapRepairActions(
    gap: TimeGap,
    previousEntry: TimeEntry,
    nextEntry: TimeEntry
  ): RepairAction[] {
    const actions: RepairAction[] = []

    actions.push({
      type: RepairActionType.FILL_GAP,
      label: 'Lücke füllen',
      description: `Neuen Zeiteintrag für ${gap.startTime} - ${gap.endTime} erstellen`,
      autoApplicable: false,
      confidence: 0.8,
      payload: {
        date: gap.date,
        startTime: gap.startTime,
        endTime: gap.endTime,
        duration: gap.duration,
        projectId: previousEntry.projectId,
        taskId: previousEntry.taskId
      }
    })

    if (gap.duration <= 1.5) {
      actions.push({
        type: RepairActionType.UPDATE_FIELD,
        label: 'Vorherigen Eintrag verlängern',
        description: `${previousEntry.startTime} - ${gap.endTime} (${(previousEntry.duration + gap.duration).toFixed(1)}h)`,
        autoApplicable: true,
        confidence: 0.7,
        payload: {
          entryId: previousEntry.id,
          endTime: gap.endTime,
          duration: previousEntry.duration + gap.duration
        }
      })

      actions.push({
        type: RepairActionType.UPDATE_FIELD,
        label: 'Nächsten Eintrag vorverlegen',
        description: `${gap.startTime} - ${nextEntry.endTime} (${(nextEntry.duration + gap.duration).toFixed(1)}h)`,
        autoApplicable: true,
        confidence: 0.7,
        payload: {
          entryId: nextEntry.id,
          startTime: gap.startTime,
          duration: nextEntry.duration + gap.duration
        }
      })
    }

    return actions
  }

  private static generateOverlapRepairActions(overlap: TimeOverlap): RepairAction[] {
    const actions: RepairAction[] = []

    actions.push({
      type: RepairActionType.SPLIT_ENTRY,
      label: 'Eintrag 1 splitten',
      description: `An Überlappung aufteilen (${overlap.entry1.startTime} - ${overlap.overlapStart} und ${overlap.overlapEnd} - ${overlap.entry1.endTime})`,
      autoApplicable: true,
      confidence: 0.8,
      payload: {
        entryId: overlap.entry1.id,
        splitAt: overlap.overlapStart,
        splitEnd: overlap.overlapEnd
      }
    })

    actions.push({
      type: RepairActionType.UPDATE_FIELD,
      label: 'Eintrag 1 kürzen',
      description: `Ende auf ${overlap.overlapStart} setzen`,
      autoApplicable: true,
      confidence: 0.9,
      payload: {
        entryId: overlap.entry1.id,
        endTime: overlap.overlapStart,
        duration: differenceInMinutes(
          this.parseTime(overlap.date, overlap.overlapStart),
          this.parseTime(overlap.date, overlap.entry1.startTime)
        ) / 60
      }
    })

    actions.push({
      type: RepairActionType.UPDATE_FIELD,
      label: 'Eintrag 2 kürzen',
      description: `Start auf ${overlap.overlapEnd} setzen`,
      autoApplicable: true,
      confidence: 0.9,
      payload: {
        entryId: overlap.entry2.id,
        startTime: overlap.overlapEnd,
        duration: differenceInMinutes(
          this.parseTime(overlap.date, overlap.entry2.endTime),
          this.parseTime(overlap.date, overlap.overlapEnd)
        ) / 60
      }
    })

    actions.push({
      type: RepairActionType.DELETE_ENTRY,
      label: 'Eintrag 2 löschen',
      description: 'Überlappenden Eintrag vollständig entfernen',
      autoApplicable: true,
      confidence: 0.5,
      payload: {
        entryId: overlap.entry2.id
      }
    })

    return actions
  }

  private static parseTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number)
    const d = parseISO(date)
    d.setHours(hours, minutes, 0, 0)
    return d
  }
}

export class RepairEngine {
  static async applyRepairAction(
    action: RepairAction,
    entries: TimeEntry[],
    currentUser: string
  ): Promise<TimeEntry[]> {
    const updatedEntries = [...entries]

    switch (action.type) {
      case RepairActionType.FILL_GAP:
        return this.fillGap(action, updatedEntries, currentUser)

      case RepairActionType.UPDATE_FIELD:
        return this.updateField(action, updatedEntries, currentUser)

      case RepairActionType.DELETE_ENTRY:
        return this.deleteEntry(action, updatedEntries)

      case RepairActionType.SPLIT_ENTRY:
        return this.splitEntry(action, updatedEntries, currentUser)

      case RepairActionType.BATCH_UPDATE:
        return this.batchUpdate(action, updatedEntries, currentUser)

      default:
        return updatedEntries
    }
  }

  private static fillGap(action: RepairAction, entries: TimeEntry[], currentUser: string): TimeEntry[] {
    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}`,
      tenantId: 'default-tenant',
      employeeId: entries[0]?.employeeId || 'unknown',
      projectId: action.payload.projectId,
      taskId: action.payload.taskId,
      date: action.payload.date,
      startTime: action.payload.startTime,
      endTime: action.payload.endTime,
      duration: action.payload.duration,
      billable: true,
      approvalStatus: 'draft' as any,
      locked: false,
      audit: {
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        device: 'repair-mode'
      },
      changeLog: []
    }

    return [...entries, newEntry]
  }

  private static updateField(action: RepairAction, entries: TimeEntry[], currentUser: string): TimeEntry[] {
    return entries.map(entry => {
      if (entry.id === action.payload.entryId) {
        const before = { ...entry }
        const updated = {
          ...entry,
          ...action.payload,
          audit: {
            ...entry.audit,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString()
          },
          changeLog: [
            ...entry.changeLog,
            {
              timestamp: new Date().toISOString(),
              userId: currentUser,
              before: { 
                startTime: entry.startTime,
                endTime: entry.endTime,
                duration: entry.duration
              },
              after: {
                startTime: action.payload.startTime || entry.startTime,
                endTime: action.payload.endTime || entry.endTime,
                duration: action.payload.duration || entry.duration
              },
              reason: 'AI Repair Mode',
              device: 'repair-mode'
            }
          ]
        }
        const { entryId, ...cleanUpdated } = updated as any
        return cleanUpdated
      }
      return entry
    })
  }

  private static deleteEntry(action: RepairAction, entries: TimeEntry[]): TimeEntry[] {
    return entries.filter(entry => entry.id !== action.payload.entryId)
  }

  private static splitEntry(action: RepairAction, entries: TimeEntry[], currentUser: string): TimeEntry[] {
    const targetEntry = entries.find(e => e.id === action.payload.entryId)
    if (!targetEntry) return entries

    const splitStart = action.payload.splitAt
    const splitEnd = action.payload.splitEnd

    const entry1Duration = differenceInMinutes(
      this.parseTime(targetEntry.date, splitStart),
      this.parseTime(targetEntry.date, targetEntry.startTime)
    ) / 60

    const entry2Duration = differenceInMinutes(
      this.parseTime(targetEntry.date, targetEntry.endTime),
      this.parseTime(targetEntry.date, splitEnd)
    ) / 60

    const entry1: TimeEntry = {
      ...targetEntry,
      endTime: splitStart,
      duration: entry1Duration,
      audit: {
        ...targetEntry.audit,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString()
      }
    }

    const entry2: TimeEntry = {
      ...targetEntry,
      id: `entry-${Date.now()}`,
      startTime: splitEnd,
      duration: entry2Duration,
      audit: {
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        device: 'repair-mode'
      },
      changeLog: []
    }

    return entries.filter(e => e.id !== targetEntry.id).concat([entry1, entry2])
  }

  private static batchUpdate(action: RepairAction, entries: TimeEntry[], currentUser: string): TimeEntry[] {
    const { entryIds, updates } = action.payload

    return entries.map(entry => {
      if (entryIds.includes(entry.id)) {
        return {
          ...entry,
          ...updates,
          audit: {
            ...entry.audit,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString()
          },
          changeLog: [
            ...entry.changeLog,
            {
              timestamp: new Date().toISOString(),
              userId: currentUser,
              before: {},
              after: updates,
              reason: 'Batch Repair',
              device: 'repair-mode'
            }
          ]
        }
      }
      return entry
    })
  }

  private static parseTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number)
    const d = parseISO(date)
    d.setHours(hours, minutes, 0, 0)
    return d
  }
}
