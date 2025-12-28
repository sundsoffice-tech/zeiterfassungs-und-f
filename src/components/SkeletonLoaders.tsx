import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Tabelle wird geladen">
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Daten werden geladen...</span>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Karten werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Karten werden geladen...</span>
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Liste wird geladen">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
      <span className="sr-only">Liste wird geladen...</span>
    </div>
  )
}

export function TimeEntrySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Zeiteinträge werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
      <span className="sr-only">Zeiteinträge werden geladen...</span>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Dashboard wird geladen">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <span className="sr-only">Dashboard wird geladen...</span>
    </div>
  )
}

export function WeekViewSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Wochenansicht wird geladen">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 gap-0 border-b bg-muted/50">
          <Skeleton className="h-10 m-2" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 m-2" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-0 border-b">
            <Skeleton className="h-12 m-3" />
            {Array.from({ length: 7 }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-12 m-3" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Wochenansicht wird geladen...</span>
    </div>
  )
}

export function ForecastSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Prognose wird geladen">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <span className="sr-only">Prognose wird geladen...</span>
    </div>
  )
}

export function AIInsightSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="KI-Einsichten werden geladen">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">KI-Einsichten werden geladen...</span>
    </div>
  )
}

export function ProjectListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Projekte werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Projekte werden geladen...</span>
    </div>
  )
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="space-y-4" role="status" aria-label="Diagramm wird geladen">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className={`w-full ${height}`} />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <span className="sr-only">Diagramm wird geladen...</span>
    </div>
  )
}

export function EmployeeListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Mitarbeiter werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
      <span className="sr-only">Mitarbeiter werden geladen...</span>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Formular wird geladen">
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <span className="sr-only">Formular wird geladen...</span>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Kalender wird geladen">
      <div className="flex items-center justify-between p-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <span className="sr-only">Kalender wird geladen...</span>
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Bericht wird geladen">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={8} columns={6} />
        </CardContent>
      </Card>
      <span className="sr-only">Bericht wird geladen...</span>
    </div>
  )
}

export function IntegrationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Integrationen werden geladen">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Integrationen werden geladen...</span>
    </div>
  )
}
