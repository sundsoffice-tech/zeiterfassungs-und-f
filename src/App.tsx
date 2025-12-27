import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, FolderOpen, ChartBar, UserCircleGear, CalendarBlank, ShieldCheck, Wrench, TrendUp, Lightning, CloudArrowUp, Rocket, ShieldStar, Brain, CalendarCheck, Article } from '@phosphor-icons/react'
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
import { ExplainableAIScreen } from '@/components/ExplainableAIScreen'
import { CalendarIntegrationScreen } from '@/components/CalendarIntegrationScreen'
import { TimePickerDemo } from '@/components/TimePickerDemo'
import { CommandPalette } from '@/components/CommandPalette'
import { ReminderNotificationDisplay } from '@/components/ReminderNotificationDisplay'
import { Employee, Project, TimeEntry, MileageEntry, Task, Phase, ActiveTimer, Absence } from '@/lib/types'
import { useAutomation } from '@/hooks/use-automation'
import { useCalendarAutoSync } from '@/hooks/use-calendar-auto-sync'
import { useReminderProcessor } from '@/hooks/use-reminder-processor'
import { getDefaultAppSettings } from '@/lib/automation'
import { EmailNotificationService } from '@/lib/email-notifications'
import { EmailConfig } from '@/lib/email-service'
import { skipLinkClasses } from '@/lib/accessibility'

function App() {
  const [activeTab, setActiveTab] = useState('timepicker')
  const [employees, setEmployees] = useKV<Employee[]>('employees_v2', [])
  const [projects, setProjects] = useKV<Project[]>('projects_v2', [])
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [phases, setPhases] = useKV<Phase[]>('phases', [])
  const [timeEntries, setTimeEntries] = useKV<TimeEntry[]>('timeEntries_v2', [])
  const [mileageEntries, setMileageEntries] = useKV<MileageEntry[]>('mileageEntries_v2', [])
  const [absences, setAbsences] = useKV<Absence[]>('absences', [])
  const [activeTimer, setActiveTimer] = useKV<ActiveTimer | null>('activeTimer', null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [emailConfig] = useKV<EmailConfig>('email-config', {
    provider: 'none',
    fromEmail: 'noreply@zeiterfassung.app',
    fromName: 'Zeiterfassung'
  })

  useEffect(() => {
    if (emailConfig) {
      EmailNotificationService.initializeEmailService(emailConfig)
    }
  }, [emailConfig])

  const automation = useAutomation(
    employees || [],
    timeEntries || [],
    setTimeEntries,
    activeTimer || null,
    setActiveTimer
  )

  const calendarAutoSync = useCalendarAutoSync(
    activeTimer || null,
    projects || [],
    tasks || [],
    phases || []
  )

  useReminderProcessor(
    employees && employees.length > 0 ? employees[0] : null,
    timeEntries || [],
    absences || []
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
      <a href="#main-content" className={skipLinkClasses}>
        Zum Hauptinhalt springen
      </a>
      
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20" role="banner">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center" role="img" aria-label="Zeiterfassung Logo">
                <Clock className="h-6 w-6 text-white" weight="bold" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Zeiterfassung</h1>
                <p className="text-xs text-muted-foreground">Weltklasse Time Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded border" aria-label="Tastenkombination: Befehl K oder Strg K">
                <span className="text-muted-foreground">⌘K</span>
              </kbd>
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground" role="complementary" aria-label="Tastenkürzel">
                <span className="px-2 py-1 bg-muted rounded border">N</span>
                <span>Neuer Eintrag</span>
                <span className="ml-2 px-2 py-1 bg-muted rounded border">⌘S</span>
                <span>Speichern</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6" role="main">
        {employees && employees.length > 0 && (
          <div className="mb-6">
            <ReminderNotificationDisplay
              employee={employees[0]}
              timeEntries={timeEntries || []}
              absences={absences || []}
              onNavigate={setActiveTab}
            />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-14 lg:w-auto lg:inline-grid" role="tablist" aria-label="Hauptnavigation">
            <TabsTrigger value="timepicker" className="gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10" aria-label="Time Picker Ansicht">
              <Article className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Time Picker</span>
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-2" aria-label="Heute Ansicht">
              <Clock className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Heute</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2" aria-label="Wochenansicht">
              <CalendarBlank className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Woche</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2" aria-label="Projektübersicht">
              <FolderOpen className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Projekte</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2" aria-label="Berichte">
              <ChartBar className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Berichte</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" aria-label="Kalenderintegration">
              <CalendarCheck className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Kalender</span>
            </TabsTrigger>
            <TabsTrigger value="trust" className="gap-2" aria-label="Vertrauensschicht">
              <ShieldStar className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Vertrauen</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2" aria-label="Prognose und Forecast">
              <TrendUp className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2" aria-label="Automatisierung">
              <Lightning className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2" aria-label="Offline und Synchronisation">
              <CloudArrowUp className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Offline/Sync</span>
            </TabsTrigger>
            <TabsTrigger value="pro" className="gap-2 bg-gradient-to-r from-accent/10 to-primary/10" aria-label="Pro Module">
              <Rocket className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Pro</span>
            </TabsTrigger>
            <TabsTrigger value="repair" className="gap-2" aria-label="Reparaturmodus">
              <Wrench className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Reparatur</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2" aria-label="KI-Validierung">
              <ShieldCheck className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">KI-Validierung</span>
            </TabsTrigger>
            <TabsTrigger value="explainable" className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10" aria-label="Erklärbare KI">
              <Brain className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Erklärbare KI</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2" aria-label="Adminbereich">
              <UserCircleGear className="h-4 w-4" weight="duotone" aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timepicker" className="mt-6">
            <TimePickerDemo />
          </TabsContent>

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

          <TabsContent value="calendar" className="mt-6">
            <CalendarIntegrationScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              onTimeEntryCreated={(entry) => {
                setTimeEntries((current) => [...(current || []), entry])
              }}
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

          <TabsContent value="explainable" className="mt-6">
            <ExplainableAIScreen
              employees={employees || []}
              projects={projects || []}
              tasks={tasks || []}
              phases={phases || []}
              timeEntries={timeEntries || []}
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