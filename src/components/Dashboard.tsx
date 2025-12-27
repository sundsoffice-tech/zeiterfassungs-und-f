import { useState } from 'react'
import { Clock, FolderOpen, Users, Car, Download, FileText } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimeEntry, MileageEntry, Employee, Project } from '@/lib/types'
import { calculateDuration, formatDuration } from '@/lib/helpers'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  exportTimeEntriesToCSV,
  exportMileageEntriesToCSV,
  exportEmployeeTimeReportToCSV,
  exportProjectTimeReportToCSV,
  exportPayrollReportToCSV
} from '@/lib/csv-export'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface DashboardProps {
  employees: Employee[]
  projects: Project[]
  timeEntries: TimeEntry[]
  mileageEntries: MileageEntry[]
}

export function Dashboard({ employees, projects, timeEntries, mileageEntries }: DashboardProps) {
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false)
  const [payrollDates, setPayrollDates] = useState({
    startDate: '',
    endDate: ''
  })

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

  const handleExportTimeEntries = () => {
    exportTimeEntriesToCSV(timeEntries, employees, projects)
    toast.success('Time entries exported to CSV')
  }

  const handleExportMileageEntries = () => {
    exportMileageEntriesToCSV(mileageEntries, employees)
    toast.success('Mileage entries exported to CSV')
  }

  const handleExportEmployeeReport = () => {
    exportEmployeeTimeReportToCSV(employees, timeEntries, projects)
    toast.success('Employee time report exported to CSV')
  }

  const handleExportProjectReport = () => {
    exportProjectTimeReportToCSV(projects, timeEntries, employees)
    toast.success('Project time report exported to CSV')
  }

  const handleExportPayrollReport = () => {
    if (payrollDates.startDate && payrollDates.endDate) {
      if (payrollDates.startDate > payrollDates.endDate) {
        toast.error('Start date must be before end date')
        return
      }
      exportPayrollReportToCSV(employees, timeEntries, mileageEntries, payrollDates.startDate, payrollDates.endDate)
      toast.success('Payroll report exported to CSV')
      setPayrollDialogOpen(false)
    } else {
      exportPayrollReportToCSV(employees, timeEntries, mileageEntries)
      toast.success('Payroll report exported to CSV')
      setPayrollDialogOpen(false)
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" weight="duotone" />
            Export Reports
          </CardTitle>
          <CardDescription>
            Download CSV reports for accounting and payroll purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={handleExportTimeEntries}
              disabled={timeEntries.length === 0}
            >
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-0.5 text-primary" weight="duotone" />
                <div className="text-left">
                  <div className="font-semibold">Time Entries</div>
                  <div className="text-xs text-muted-foreground">
                    Detailed time tracking data
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={handleExportMileageEntries}
              disabled={mileageEntries.length === 0}
            >
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-0.5 text-accent" weight="duotone" />
                <div className="text-left">
                  <div className="font-semibold">Mileage Entries</div>
                  <div className="text-xs text-muted-foreground">
                    Travel log for reimbursement
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={handleExportEmployeeReport}
              disabled={employees.length === 0 || timeEntries.length === 0}
            >
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-0.5 text-primary" weight="duotone" />
                <div className="text-left">
                  <div className="font-semibold">Employee Summary</div>
                  <div className="text-xs text-muted-foreground">
                    Hours by employee
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={handleExportProjectReport}
              disabled={projects.length === 0 || timeEntries.length === 0}
            >
              <div className="flex items-start gap-3 w-full">
                <Download className="h-5 w-5 mt-0.5 text-accent" weight="duotone" />
                <div className="text-left">
                  <div className="font-semibold">Project Summary</div>
                  <div className="text-xs text-muted-foreground">
                    Hours by project
                  </div>
                </div>
              </div>
            </Button>

            <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  disabled={employees.length === 0}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Download className="h-5 w-5 mt-0.5 text-primary" weight="duotone" />
                    <div className="text-left">
                      <div className="font-semibold">Payroll Report</div>
                      <div className="text-xs text-muted-foreground">
                        Combined time & mileage
                      </div>
                    </div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Payroll Report</DialogTitle>
                  <DialogDescription>
                    Download a comprehensive report with time and mileage data for payroll processing. Optionally filter by date range.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date (Optional)</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={payrollDates.startDate}
                      onChange={(e) => setPayrollDates({ ...payrollDates, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date (Optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={payrollDates.endDate}
                      onChange={(e) => setPayrollDates({ ...payrollDates, endDate: e.target.value })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leave dates empty to export all data
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPayrollDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExportPayrollReport}>
                    <Download className="mr-2 h-4 w-4" weight="bold" />
                    Export Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

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
