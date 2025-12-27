import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, FolderOpen, ChartBar, UserCircleGear, CalendarBlank } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { TodayScreen } from '@/components/TodayScreen'
import { WeekScreen } from '@/components/WeekScreen'
import { Projects } from '@/components/Projects'
import { ReportsScreen } from '@/components/ReportsScreen'
import { AdminScreen } from '@/components/AdminScreen'
import { CommandPalette } from '@/components/CommandPalette'
import { Employee, Project, TimeEntry, MileageEntry, Task, Phase, ActiveTimer } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [employees, setEmployees] = useKV<Employee[]>('employees_v2', [])
  const [projects, setProjects] = useKV<Project[]>('projects_v2', [])
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [phases, setPhases] = useKV<Phase[]>('phases', [])
  const [timeEntries, setTimeEntries] = useKV<TimeEntry[]>('timeEntries_v2', [])
  const [mileageEntries, setMileageEntries] = useKV<MileageEntry[]>('mileageEntries_v2', [])
  const [activeTimer, setActiveTimer] = useKV<ActiveTimer | null>('activeTimer', null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" weight="bold" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Zeiterfassung</h1>
                <p className="text-xs text-muted-foreground">Weltklasse Time Tracking</p>
              </div>
            </div>
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded border">
              <span className="text-muted-foreground">⌘K</span>
            </kbd>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="today" className="gap-2">
              <Clock className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Heute</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <CalendarBlank className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Woche</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Projekte</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <ChartBar className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Berichte</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <UserCircleGear className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <TodayScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              phases={phases || []}
              timeEntries={timeEntries || []}
              setTimeEntries={setTimeEntries}
              activeTimer={activeTimer || null}
              setActiveTimer={setActiveTimer}
            />
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <WeekScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              phases={phases || []}
              timeEntries={timeEntries || []}
              setTimeEntries={setTimeEntries}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Projects
              projects={projects || []}
              setProjects={setProjects}
              tasks={tasks || []}
              setTasks={setTasks}
              phases={phases || []}
              setPhases={setPhases}
              timeEntries={timeEntries || []}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsScreen
              employees={employees || []}
              projects={projects || []}
              timeEntries={timeEntries || []}
              mileageEntries={mileageEntries || []}
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <AdminScreen
              employees={employees || []}
              setEmployees={setEmployees}
            />
          </TabsContent>
        </Tabs>
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={setActiveTab}
        employees={employees || []}
        projects={projects || []}
        activeTimer={activeTimer || null}
        setActiveTimer={setActiveTimer}
      />

      <Toaster />
    </div>
  )
}

export default App