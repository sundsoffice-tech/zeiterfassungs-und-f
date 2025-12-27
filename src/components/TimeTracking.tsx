import { Employee, Project, TimeEntry } from '@/lib/types'

interface TimeTrackingProps {
  timeEntries: TimeEntry[]
  setTimeEntries: (updateFn: (prev: TimeEntry[]) => TimeEntry[]) => void
  employees: Employee[]
  projects: Project[]
}

export function TimeTracking({
  timeEntries,
  setTimeEntries,
  employees,
  projects,
}: TimeTrackingProps) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">
        Time Tracking component (legacy - replaced by TodayScreen)
      </p>
    </div>
  )
}
