import { Clock, FolderOpen, ChartBar, Lightning, DotsThreeOutline } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  activeTab: string
  onNavigate: (tab: string) => void
}

const mainNavItems = [
  { id: 'today', label: 'Zeiterfassung', icon: Clock },
  { id: 'projects', label: 'Projekte', icon: FolderOpen },
  { id: 'reports', label: 'Berichte', icon: ChartBar },
  { id: 'automation', label: 'Automation', icon: Lightning },
]

const moreNavItems = [
  { id: 'week', label: 'Woche', icon: Clock },
  { id: 'timepicker', label: 'Time Picker', icon: Clock },
  { id: 'calendar', label: 'Kalender', icon: Clock },
  { id: 'trust', label: 'Vertrauen', icon: Clock },
  { id: 'forecast', label: 'Prognose', icon: Clock },
  { id: 'offline', label: 'Offline/Sync', icon: Clock },
  { id: 'pro', label: 'Pro Module', icon: Clock },
  { id: 'explainable', label: 'Erklärbare KI', icon: Clock },
  { id: 'admin', label: 'Admin', icon: Clock },
  { id: 'validation', label: 'KI-Validierung', icon: Clock },
  { id: 'repair', label: 'Reparatur', icon: Clock },
  { id: 'performance', label: 'Performance', icon: Clock },
  { id: 'lighthouse', label: 'Lighthouse', icon: Clock },
]

export function MobileBottomNav({ activeTab, onNavigate }: MobileBottomNavProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden pb-safe"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-2 mobile-nav-height">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] px-2",
                isActive && "text-primary bg-primary/10"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Button>
          )
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] px-2"
              aria-label="Mehr Optionen"
            >
              <DotsThreeOutline className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] leading-tight">Mehr</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Weitere Optionen</SheetTitle>
              <SheetDescription>
                Wählen Sie eine Option aus
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => onNavigate(item.id)}
                    className="h-20 flex flex-col items-center gap-2"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-6 w-6" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
