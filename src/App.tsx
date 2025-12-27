import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, FolderOpen, Users, Car, ChartBar } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { Dashboard } from '@/components/Dashboard'
import { TimeTracking } from '@/components/TimeTracking'
import { Projects } from '@/components/Projects'
import { Employees } from '@/components/Employees'
import { Mileage } from '@/components/Mileage'
import { Employee, Project, TimeEntry, MileageEntry } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [employees, setEmployees] = useKV<Employee[]>('employees', [])
  const [projects, setProjects] = useKV<Project[]>('projects', [])
  const [timeEntries, setTimeEntries] = useKV<TimeEntry[]>('timeEntries', [])
  const [mileageEntries, setMileageEntries] = useKV<MileageEntry[]>('mileageEntries', [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Zeiterfassung</h1>
              <p className="text-xs text-muted-foreground">Time & Mileage Tracker</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <ChartBar className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-2">
              <Clock className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Time</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="mileage" className="gap-2">
              <Car className="h-4 w-4" weight="duotone" />
              <span className="hidden sm:inline">Mileage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard
              employees={employees || []}
              projects={projects || []}
              timeEntries={timeEntries || []}
              mileageEntries={mileageEntries || []}
            />
          </TabsContent>

          <TabsContent value="time" className="mt-6">
            <TimeTracking
              timeEntries={timeEntries || []}
              setTimeEntries={setTimeEntries}
              employees={employees || []}
              projects={projects || []}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Projects
              projects={projects || []}
              setProjects={setProjects}
              timeEntries={timeEntries || []}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <Employees
              employees={employees || []}
              setEmployees={setEmployees}
              timeEntries={timeEntries || []}
              mileageEntries={mileageEntries || []}
            />
          </TabsContent>

          <TabsContent value="mileage" className="mt-6">
            <Mileage
              mileageEntries={mileageEntries || []}
              setMileageEntries={setMileageEntries}
              employees={employees || []}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  )
}

export default App