import { useState, useEffect } from 'react'
import { Employee, Project, ActiveTimer } from '@/lib/types'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Clock, FolderOpen, ChartBar, UserCircleGear, CalendarBlank, Play, Stop, Sun, Moon, Monitor } from '@phosphor-icons/react'
import { useTheme } from '@/hooks/use-theme'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tab: string) => void
  employees: Employee[]
  projects: Project[]
  activeTimer: ActiveTimer | null
  setActiveTimer: (value: ActiveTimer | null | ((oldValue?: ActiveTimer | null) => ActiveTimer | null)) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  employees,
  projects,
  activeTimer,
  setActiveTimer
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const { setTheme } = useTheme()

  const commands = [
    {
      group: 'Navigation',
      items: [
        { id: 'nav-today', label: 'Heute öffnen', icon: Clock, action: () => onNavigate('today') },
        { id: 'nav-week', label: 'Woche öffnen', icon: CalendarBlank, action: () => onNavigate('week') },
        { id: 'nav-projects', label: 'Projekte öffnen', icon: FolderOpen, action: () => onNavigate('projects') },
        { id: 'nav-reports', label: 'Berichte öffnen', icon: ChartBar, action: () => onNavigate('reports') },
        { id: 'nav-admin', label: 'Admin öffnen', icon: UserCircleGear, action: () => onNavigate('admin') }
      ]
    },
    {
      group: 'Design',
      items: [
        { id: 'theme-light', label: 'Helles Theme', icon: Sun, action: () => setTheme('light') },
        { id: 'theme-dark', label: 'Dunkles Theme', icon: Moon, action: () => setTheme('dark') },
        { id: 'theme-system', label: 'System Theme', icon: Monitor, action: () => setTheme('system') }
      ]
    },
    {
      group: 'Timer',
      items: [
        ...(activeTimer
          ? [{ id: 'timer-stop', label: 'Timer stoppen', icon: Stop, action: () => setActiveTimer(null) }]
          : []
        )
      ]
    }
  ]

  const filteredCommands = commands.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  const handleSelect = (action: () => void) => {
    action()
    onOpenChange(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <Command className="rounded-lg border-none">
          <CommandInput
            placeholder="Suchen Sie nach Befehlen, Projekten..."
            value={search}
            onValueChange={setSearch}
            className="border-none"
          />
          <CommandList>
            <CommandEmpty>Keine Ergebnisse gefunden</CommandEmpty>
            {filteredCommands.map(group => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.items.map(item => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item.action)}
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      <Icon className="h-4 w-4 shrink-0" weight="duotone" />
                      <span className="flex-1">{item.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
            {projects.length > 0 && search && (
              <CommandGroup heading="Projekte">
                {projects
                  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 5)
                  .map(project => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => {
                        onNavigate('today')
                        onOpenChange(false)
                        setSearch('')
                      }}
                      className="flex items-center gap-2 min-h-[36px]"
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" weight="duotone" />
                      <span className="flex-1">{project.name}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
