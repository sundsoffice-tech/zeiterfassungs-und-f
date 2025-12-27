import { Clock, FolderOpen, Users, Car } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeEntry, MileageEntry, Employee, Project } from '@/lib/types'
import { calculateDuration, formatDuration } from '@/lib/helpers'
import { motion } from 'framer-motion'

interface DashboardProps {
  employees: Employee[]
  projects: Project[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
}

export function Dashboard({ employees, projects, timeEntries, mileageEntries }: DashboardProps) {
  const totalHours = timeEntries.reduce(
    (sum, entry) => sum + calculateDuration(entry.startTime, entry.endTime),
    0
  )
  
  const totalMileage = mileageEntries.reduce((sum, entry) => sum + entry.distance, 0)
  
  const activeProjects = projects.length
  const totalEmployees = employees.length

  const stats = [
    {
      title: 'Total Hours',
      value: formatDuration(totalHours),
      icon: Clock,
      color: 'text-primary'
    },
    {
      title: 'Active Projects',
      value: activeProjects.toString(),
      icon: FolderOpen,
      color: 'text-accent'
    },
    {
      title: 'Employees',
      value: totalEmployees.toString(),
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Total Mileage',
      value: `${totalMileage.toLocaleString('de-DE')} km`,
      icon: Car,
      color: 'text-accent'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your time tracking and mileage data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} weight="duotone" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" weight="duotone" />
              Recent Time Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No time entries yet</p>
                <p className="text-sm">Start tracking time to see entries here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.slice(-5).reverse().map((entry) => {
                  const employee = employees.find(e => e.id === entry.employeeId)
                  const project = projects.find(p => p.id === entry.projectId)
                  const duration = calculateDuration(entry.startTime, entry.endTime)
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium">{employee?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{project?.name || 'Unknown Project'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium">{formatDuration(duration)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-accent" weight="duotone" />
              Recent Mileage Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mileageEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No mileage entries yet</p>
                <p className="text-sm">Start logging trips to see entries here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mileageEntries.slice(-5).reverse().map((entry) => {
                  const employee = employees.find(e => e.id === entry.employeeId)
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium">{employee?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.startLocation} → {entry.endLocation}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium">{entry.distance} km</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
