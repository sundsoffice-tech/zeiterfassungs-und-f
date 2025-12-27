import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from '@phosphor-icons/react'
import { Employee, Project } from '@/lib/types'

interface MaterialToolScreenProps {
  employees: Employee[]
  projects: Project[]
}

export function MaterialToolScreen({ employees, projects }: MaterialToolScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" weight="duotone" />
            Material & Werkzeug
          </CardTitle>
          <CardDescription>
            Track material usage and tool checkout per project with cost aggregation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" weight="duotone" />
            <p className="text-lg font-medium mb-2">Material & Werkzeug - Coming Soon</p>
            <p className="text-sm">
              Features: Material usage tracking, tool checkout system, inventory dashboard,
              receipt photo uploads, cost aggregation, low-stock alerts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
