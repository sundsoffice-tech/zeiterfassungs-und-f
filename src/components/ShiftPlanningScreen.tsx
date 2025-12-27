import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck } from '@phosphor-icons/react'
import { Employee, Project } from '@/lib/types'

interface ShiftPlanningScreenProps {
  employees: Employee[]
  projects: Project[]
}

export function ShiftPlanningScreen({ employees, projects }: ShiftPlanningScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" weight="duotone" />
            Schichtplanung
          </CardTitle>
          <CardDescription>
            Visual shift scheduler with drag-and-drop, recurring templates, and conflict detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CalendarCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" weight="duotone" />
            <p className="text-lg font-medium mb-2">Schichtplanung - Coming Soon</p>
            <p className="text-sm">
              Features: Visual calendar, drag-and-drop scheduling, recurring shift templates,
              employee availability, conflict detection, shift swaps, calendar export
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
