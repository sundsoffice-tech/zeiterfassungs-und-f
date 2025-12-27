import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from '@phosphor-icons/react'
import { Project } from '@/lib/types'

interface CustomerPortalScreenProps {
  projects: Project[]
}

export function CustomerPortalScreen({ projects }: CustomerPortalScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" weight="duotone" />
            Kundenportal
          </CardTitle>
          <CardDescription>
            Secure portal for customers to view reports, approve entries, and download invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" weight="duotone" />
            <p className="text-lg font-medium mb-2">Kundenportal - Coming Soon</p>
            <p className="text-sm">
              Features: Customer login, view project reports, approve/reject entries, view invoices,
              download PDFs, messaging with PM, mobile-responsive, DSGVO-compliant
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
