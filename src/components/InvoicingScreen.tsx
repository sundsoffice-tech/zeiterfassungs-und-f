import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from '@phosphor-icons/react'
import { Project } from '@/lib/types'

interface InvoicingScreenProps {
  projects: Project[]
}

export function InvoicingScreen({ projects }: InvoicingScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" weight="duotone" />
            Rechnungsmodul
          </CardTitle>
          <CardDescription>
            Generate invoices from approved hours with customizable templates and payment tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" weight="duotone" />
            <p className="text-lg font-medium mb-2">Rechnungsmodul - Coming Soon</p>
            <p className="text-sm">
              Features: Auto-generate from approved hours, customizable templates, line-item breakdown,
              tax calculations, PDF export, payment tracking, accounting system integration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
