import { useMemo } from 'react'
import { GapOvertimeDetector, GapOvertimeAnalysis } from '@/lib/gap-overtime-detection'
import { Employee, TimeEntry, Absence } from '@/lib/types'

export function useGapOvertimeDetection(
  employee: Employee | null,
  timeEntries: TimeEntry[],
  absences: Absence[] = []
): GapOvertimeAnalysis | null {
  return useMemo(() => {
    if (!employee) return null
    
    return GapOvertimeDetector.analyzeLast7Days(employee, timeEntries, absences)
  }, [employee, timeEntries, absences])
}

export function useAllEmployeesGapOvertimeDetection(
  employees: Employee[],
  timeEntries: TimeEntry[],
  absences: Absence[] = []
): Map<string, GapOvertimeAnalysis> {
  return useMemo(() => {
    return GapOvertimeDetector.analyzeAllEmployees(employees, timeEntries, absences)
  }, [employees, timeEntries, absences])
}
