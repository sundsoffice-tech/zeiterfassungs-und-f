import { useMemo } from 'react'
import { TimeEntry, Project, Employee, Absence } from '@/lib/types'
import { 
  TimeEntryValidator, 
  ValidationContext, 
  ValidationResult, 
  getValidationSummary 
} from '@/lib/validation-rules'

interface UseValidationOptions {
  entry: TimeEntry
  allEntries: TimeEntry[]
  projects: Project[]
  employees: Employee[]
  absences?: Absence[]
  holidays?: string[]
  tenantSettings?: ValidationContext['tenantSettings']
}

export function useTimeEntryValidation(options: UseValidationOptions) {
  const {
    entry,
    allEntries,
    projects,
    employees,
    absences = [],
    holidays = [],
    tenantSettings
  } = options

  const validationResults = useMemo<ValidationResult[]>(() => {
    const context: ValidationContext = {
      entry,
      allEntries,
      projects,
      employees,
      absences,
      holidays,
      tenantSettings
    }

    return TimeEntryValidator.validate(context)
  }, [entry, allEntries, projects, employees, absences, holidays, tenantSettings])

  const summary = useMemo(() => {
    return getValidationSummary(validationResults)
  }, [validationResults])

  return {
    results: validationResults,
    hardErrors: summary.hardErrors,
    softWarnings: summary.softWarnings,
    hasHardErrors: summary.hasHardErrors,
    hasSoftWarnings: summary.hasSoftWarnings,
    canSave: summary.canSave,
    summary
  }
}
