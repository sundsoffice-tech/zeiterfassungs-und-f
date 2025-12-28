import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { 
  DashboardSkeleton, 
  TableSkeleton, 
  CardSkeleton, 
  ListSkeleton,
  TimeEntrySkeleton,
  ForecastSkeleton,
  AIInsightSkeleton,
  ProjectListSkeleton,
  ChartSkeleton,
  ReportSkeleton
} from '@/components/SkeletonLoaders'

type SkeletonType = 
  | 'dashboard' 
  | 'table' 
  | 'card' 
  | 'list' 
  | 'time-entry'
  | 'forecast'
  | 'ai-insight'
  | 'project-list'
  | 'chart'
  | 'report'
  | 'custom'

interface AsyncContentWrapperProps {
  isLoading: boolean
  error?: Error | null
  children: ReactNode
  skeleton?: SkeletonType
  customSkeleton?: ReactNode
  minHeight?: string
  errorFallback?: ReactNode
  emptyState?: ReactNode
  isEmpty?: boolean
  className?: string
}

export function AsyncContentWrapper({
  isLoading,
  error,
  children,
  skeleton = 'card',
  customSkeleton,
  minHeight = 'min-h-[200px]',
  errorFallback,
  emptyState,
  isEmpty = false,
  className
}: AsyncContentWrapperProps) {
  const containerClass = cn(
    'async-content-wrapper transition-opacity duration-200',
    minHeight,
    className
  )

  if (isLoading) {
    return (
      <div className={containerClass} data-loading="true">
        {customSkeleton ? customSkeleton : renderSkeleton(skeleton)}
      </div>
    )
  }

  if (error && errorFallback) {
    return (
      <div className={containerClass}>
        {errorFallback}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(containerClass, 'flex items-center justify-center')}>
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Fehler beim Laden</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isEmpty && emptyState) {
    return (
      <div className={containerClass}>
        {emptyState}
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {children}
    </div>
  )
}

function renderSkeleton(type: SkeletonType) {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />
    case 'table':
      return <TableSkeleton />
    case 'card':
      return <CardSkeleton />
    case 'list':
      return <ListSkeleton />
    case 'time-entry':
      return <TimeEntrySkeleton />
    case 'forecast':
      return <ForecastSkeleton />
    case 'ai-insight':
      return <AIInsightSkeleton />
    case 'project-list':
      return <ProjectListSkeleton />
    case 'chart':
      return <ChartSkeleton />
    case 'report':
      return <ReportSkeleton />
    default:
      return <CardSkeleton count={1} />
  }
}
