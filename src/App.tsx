import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, FolderOpen, ChartBar, UserCircleGear, CalendarBlank, ShieldCheck, Wrench, TrendUp, Lightning, CloudArrowUp, Rocket, ShieldStar } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { TodayScreen } from '@/components/TodayScreen'
import { WeekScreen } from '@/components/WeekScreen'
import { Projects } from '@/components/Projects'
import { ReportsScreen } from '@/components/ReportsScreen'
import { AdminScreen } from '@/components/AdminScreen'
import { ValidationTestScreen } from '@/components/ValidationTestScreen'
import { RepairModeScreen } from '@/components/RepairModeScreen'
import { ForecastScreen } from '@/components/ForecastScreen'
import { AutomationScreen } from '@/components/AutomationScreen'
import { OfflineSyncScreen } from '@/components/OfflineSyncScreen'
import { ProModuleScreen } from '@/components/ProModuleScreen'
import { TrustLayerScreen } from '@/components/TrustLayerScreen'
import { CommandPalette } from '@/components/CommandPalette'
import { Employee, Project, TimeEntry, MileageEntry, Task, Phase, ActiveTimer, Absence } from '@/lib/types'
import { useAutomation } from '@/hooks/use-automation'
import { getDefaultAppSettings } from '@/lib/automation'

function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [employees, setEmployees] = useKV<Employee[]>('employees_v2', [])
  const [projects, setProjects] = useKV<Project[]>('projects_v2', [])
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [phases, setPhases] = useKV<Phase[]>('phases', [])
  const [timeEntries, setTimeEntries] = useKV<TimeEntry[]>('timeEntries_v2', [])
  const [mileageEntries, setMileageEntries] = useKV<MileageEntry[]>('mileageEntries_v2', [])
  const [absences, setAbsences] = useKV<Absence[]>('absences', [])
  const [activeTimer, setActiveTimer] = useKV<ActiveTimer | null>('activeTimer', null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const automation = useAutomation(
    employees || [],
    timeEntries || [],
    setTimeEntries,
    activeTimer || null,
    setActiveTimer
  )

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
          <TabsList className="grid w-full grid-cols-12 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="trust" className="gap-2">
              <ShieldStar className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Vertrauen</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendUp className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Lightning className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2">
              <CloudArrowUp className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Offline/Sync</span>
            </TabsTrigger>
            <TabsTrigger value="pro" className="gap-2 bg-gradient-to-r from-accent/10 to-primary/10">
              <Rocket className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Pro</span>
            </TabsTrigger>
            <TabsTrigger value="repair" className="gap-2">
              <Wrench className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Reparatur</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <ShieldCheck className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">KI-Validierung</span>
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
              tasks={tasks || []}
              absences={absences || []}
            />
          </TabsContent>

          <TabsContent value="trust" className="mt-6">
            <TrustLayerScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              timeEntries={timeEntries || []}
            />
          </TabsContent>

          <TabsContent value="forecast" className="mt-6">
            <ForecastScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              timeEntries={timeEntries || []}
            />
          </TabsContent>

          <TabsContent value="automation" className="mt-6">
            <AutomationScreen
              recurringEntries={automation.recurringEntries || []}
              setRecurringEntries={automation.setRecurringEntries}
              automationRules={automation.automationRules || []}
              setAutomationRules={automation.setAutomationRules}
              reminders={automation.reminders || []}
              setReminders={automation.setReminders}
              appSettings={automation.appSettings || getDefaultAppSettings('default-tenant')}
              setAppSettings={automation.setAppSettings}
              employees={employees || []}
              projects={projects || []}
            />
          </TabsContent>

          <TabsContent value="offline" className="mt-6">
            <OfflineSyncScreen />
          </TabsContent>

          <TabsContent value="pro" className="mt-6">
            <ProModuleScreen
              employees={employees || []}
              setEmployees={setEmployees}
              projects={projects || []}
              setProjects={setProjects}
            />
          </TabsContent>

          <TabsContent value="repair" className="mt-6">
            <RepairModeScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              phases={phases || []}
              timeEntries={timeEntries || []}
              setTimeEntries={setTimeEntries}
              absences={absences || []}
            />
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <ValidationTestScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              phases={phases || []}
              timeEntries={timeEntries || []}
              absences={absences || []}
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <AdminScreen
              employees={employees || []}
              setEmployees={setEmployees}
              projects={projects || []}
              tasks={tasks || []}
              timeEntries={timeEntries || []}
              mileageEntries={mileageEntries || []}
              activeTimer={activeTimer || null}
              absences={absences || []}
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