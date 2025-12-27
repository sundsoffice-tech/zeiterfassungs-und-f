import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 touch-scroll", className)}>
      <div className="min-w-[600px] md:min-w-0">
        {children}
      </div>
    </div>
  )
}
