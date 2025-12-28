import { 
  Clock, 
  FolderOpen, 
  ChartBar, 
  UserCircleGear, 
  CalendarBlank, 
  ShieldCheck, 
  Wrench, 
  TrendUp, 
  Lightning, 
  CloudArrowUp, 
  Rocket, 
  ShieldStar, 
  Brain, 
  CalendarCheck, 
  Article, 
  Gauge, 
  Lighthouse 
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { FEATURES } from '@/lib/feature-flags'
import { ChevronDown } from 'lucide-react'

interface NavigationMenuProps {
  activeTab: string
  onNavigate: (tab: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  gradient?: string
}

interface MenuSection {
  id: string
  label: string
  icon: React.ReactNode
  gradient?: string
  items: MenuItem[]
}

export function NavigationMenu({ activeTab, onNavigate }: NavigationMenuProps) {
  const sections: MenuSection[] = [
    {
      id: 'zeiterfassung',
      label: 'Zeiterfassung',
      icon: <Clock className="h-4 w-4" weight="duotone" />,
      items: [
        {
          id: 'today',
          label: 'Heute',
          icon: <Clock className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'week',
          label: 'Woche',
          icon: <CalendarBlank className="h-4 w-4" weight="duotone" />,
        },
      ],
    },
    {
      id: 'verwaltung',
      label: 'Verwaltung',
      icon: <FolderOpen className="h-4 w-4" weight="duotone" />,
      items: [
        {
          id: 'projects',
          label: 'Projekte',
          icon: <FolderOpen className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'calendar',
          label: 'Kalender',
          icon: <CalendarCheck className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'admin',
          label: 'Admin',
          icon: <UserCircleGear className="h-4 w-4" weight="duotone" />,
        },
      ],
    },
    {
      id: 'berichte',
      label: 'Berichte & Analyse',
      icon: <ChartBar className="h-4 w-4" weight="duotone" />,
      items: [
        {
          id: 'reports',
          label: 'Berichte',
          icon: <ChartBar className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'forecast',
          label: 'Prognose',
          icon: <TrendUp className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'trust',
          label: 'Vertrauen',
          icon: <ShieldStar className="h-4 w-4" weight="duotone" />,
        },
      ],
    },
    {
      id: 'automatisierung',
      label: 'Automatisierung',
      icon: <Lightning className="h-4 w-4" weight="duotone" />,
      items: [
        {
          id: 'automation',
          label: 'Automation',
          icon: <Lightning className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'offline',
          label: 'Offline/Sync',
          icon: <CloudArrowUp className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'pro',
          label: 'Pro Module',
          icon: <Rocket className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'explainable',
          label: 'Erklärbare KI',
          icon: <Brain className="h-4 w-4" weight="duotone" />,
        },
      ],
    },
  ]

  // Add developer tools section only in dev mode
  if (FEATURES.DEV_TOOLS) {
    sections.push({
      id: 'dev-tools',
      label: 'Dev Tools',
      icon: <Wrench className="h-4 w-4" weight="duotone" />,
      items: [
        {
          id: 'timepicker',
          label: 'Time Picker Demo',
          icon: <Article className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'validation',
          label: 'KI-Validierung',
          icon: <ShieldCheck className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'repair',
          label: 'Reparatur',
          icon: <Wrench className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'performance',
          label: 'Performance',
          icon: <Gauge className="h-4 w-4" weight="duotone" />,
        },
        {
          id: 'lighthouse',
          label: 'Lighthouse',
          icon: <Lighthouse className="h-4 w-4" weight="duotone" />,
        },
      ],
    })
  }

  // Check if any item in a section is active
  const isSectionActive = (section: MenuSection) => {
    return section.items.some(item => item.id === activeTab)
  }

  return (
    <nav 
      className="flex flex-wrap gap-2 w-full" 
      role="navigation" 
      aria-label="Hauptnavigation"
    >
      {sections.map((section) => (
        <DropdownMenu key={section.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isSectionActive(section) ? "default" : "ghost"}
              className={`gap-2 px-4 py-2 font-medium min-h-[36px] ${isSectionActive(section) ? 'shadow-sm' : ''}`}
              aria-label={`${section.label} Menü`}
            >
              <span className="flex items-center gap-2 shrink-0">
                {section.icon}
                <span className="hidden sm:inline whitespace-nowrap">{section.label}</span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" aria-hidden="true" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 min-w-[14rem]"
            role="menu"
            aria-label={`${section.label} Untermenü`}
          >
            {section.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`gap-2 cursor-pointer min-h-[36px] ${
                  activeTab === item.id ? 'bg-accent font-medium' : ''
                }`}
                role="menuitem"
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span className="flex items-center gap-2 w-full">
                  {item.icon}
                  <span className="whitespace-nowrap">{item.label}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  )
}
