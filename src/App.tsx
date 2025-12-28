import { useState, useEffect, lazy, Suspense } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Clock } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { NavigationMenu } from '@/components/NavigationMenu'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { TodayScreen } from '@/components/TodayScreen'
import { WeekScreen } from '@/components/WeekScreen'
import { Projects } from '@/components/Projects'
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
import { PerformanceAlertProvider } from '@/components/PerformanceAlertProvider'
import { PerformanceBudgetMonitor } from '@/components/PerformanceBudgetMonitor'
import { WebVitalsMonitor } from '@/components/WebVitalsMonitor'
import { PerformanceSeverity } from '@/lib/performance-budgets'
import { Employee, Project, TimeEntry, MileageEntry, Task, Phase, ActiveTimer, Absence } from '@/lib/types'
import { useAutomation } from '@/hooks/use-automation'
import { useCalendarAutoSync } from '@/hooks/use-calendar-auto-sync'
import { useReminderProcessor } from '@/hooks/use-reminder-processor'
import { getDefaultAppSettings } from '@/lib/automation'
import { EmailNotificationService } from '@/lib/email-notifications'
import { EmailConfig } from '@/lib/email-service'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { skipLinkClasses } from '@/lib/accessibility'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const ReportsScreen = lazy(() => import('@/components/ReportsScreen').then(m => ({ default: m.ReportsScreen })))

function ReportsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  usePerformanceMonitor('App')
  
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
      
      <header className="border-b bg-background sticky top-0 z-20" role="banner">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary-foreground" weight="bold" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold">Zeiterfassung</span>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6 pb-20 md:pb-6" role="main">
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
          <div className="hidden md:block">
            <NavigationMenu activeTab={activeTab} onNavigate={setActiveTab} />
          </div>

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
            <Suspense fallback={<ReportsLoadingSkeleton />}>
              <ReportsScreen
                employees={employees || []}
                projects={projects || []}
                timeEntries={timeEntries || []}
                mileageEntries={mileageEntries || []}
                tasks={tasks || []}
                absences={absences || []}
              />
            </Suspense>
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

          <TabsContent value="performance" className="mt-6">
            <PerformanceBudgetMonitor />
          </TabsContent>

          <TabsContent value="lighthouse" className="mt-6">
            <WebVitalsMonitor />
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

      <PerformanceAlertProvider enabled={true} minSeverity={PerformanceSeverity.WARNING} />

      <MobileBottomNav activeTab={activeTab} onNavigate={setActiveTab} />

      <Toaster />
    </div>
  )
}

export default App