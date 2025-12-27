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
      gradient: 'from-primary/10 to-accent/10',
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
        {
          id: 'timepicker',
          label: 'Time Picker',
          icon: <Article className="h-4 w-4" weight="duotone" />,
          gradient: 'from-primary/10 to-accent/10',
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
          gradient: 'from-primary/10 to-accent/10',
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
      gradient: 'from-accent/10 to-primary/10',
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
          gradient: 'from-accent/10 to-primary/10',
        },
        {
          id: 'explainable',
          label: 'Erklärbare KI',
          icon: <Brain className="h-4 w-4" weight="duotone" />,
          gradient: 'from-purple-500/10 to-pink-500/10',
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
      gradient: 'from-orange-500/10 to-red-500/10',
      items: [
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
          gradient: 'from-green-500/10 to-emerald-500/10',
        },
        {
          id: 'lighthouse',
          label: 'Lighthouse',
          icon: <Lighthouse className="h-4 w-4" weight="duotone" />,
          gradient: 'from-orange-500/10 to-yellow-500/10',
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
              variant={isSectionActive(section) ? "default" : "outline"}
              className={`gap-2 ${section.gradient ? `bg-gradient-to-r ${section.gradient}` : ''} ${isSectionActive(section) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              aria-label={`${section.label} Menü`}
            >
              {section.icon}
              <span className="hidden sm:inline">{section.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56"
            role="menu"
            aria-label={`${section.label} Untermenü`}
          >
            {section.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`gap-2 cursor-pointer ${item.gradient ? `bg-gradient-to-r ${item.gradient}` : ''} ${
                  activeTab === item.id ? 'bg-accent font-medium' : ''
                }`}
                role="menuitem"
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  )
}
