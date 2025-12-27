import { useState } from 'react'
import { Plus, Clock, Trash, Download } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimeEntry, Employee, Project } from '@/lib/types'
import { calculateDuration, formatDuration, getEmployeeName, getProjectName } from '@/lib/helpers'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportTimeEntriesToCSV } from '@/lib/csv-export'

interface TimeTrackingProps {
  timeEntries: TimeEntry[]
  setTimeEntries: (updateFn: (prev: TimeEntry[]) => TimeEntry[]) => void
  employees: Employee[]
  projects: Project[]
}

export function TimeTracking({ timeEntries, setTimeEntries, employees, projects }: TimeTrackingProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employeeId || !formData.projectId) {
      toast.error('Please select employee and project')
      return
    }

    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (endMinutes <= startMinutes) {
      toast.error('End time must be after start time')
      return
    }

    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    }

    setTimeEntries((prev) => [...prev, newEntry])
    toast.success('Time entry added successfully')

    setFormData({
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      notes: ''
    })
    setOpen(false)
  }

  const handleDelete = (entryId: string) => {
    setTimeEntries((prev) => prev.filter(entry => entry.id !== entryId))
    toast.success('Time entry deleted')
  }

  const handleExport = () => {
    exportTimeEntriesToCSV(timeEntries, employees, projects)
    toast.success('Time entries exported to CSV')
  }

  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalHours = timeEntries.reduce(
    (sum, entry) => sum + calculateDuration(entry.startTime, entry.endTime),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Time Tracking</h1>
          <p className="text-muted-foreground">
            Total: <span className="font-mono font-semibold text-primary">{formatDuration(totalHours)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {timeEntries.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" weight="bold" />
              Export CSV
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={employees.length === 0 || projects.length === 0}>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Add Time Entry
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this time entry..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Entry</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {employees.length === 0 || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
            <p className="text-muted-foreground text-center mb-4">
              {employees.length === 0 && projects.length === 0
                ? 'Add employees and projects to start tracking time'
                : employees.length === 0
                ? 'Add employees to start tracking time'
                : 'Add projects to start tracking time'}
            </p>
          </CardContent>
        </Card>
      ) : timeEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking time by adding your first entry
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry, index) => {
                    const duration = calculateDuration(entry.startTime, entry.endTime)
                    
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="group"
                      >
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>{getEmployeeName(employees, entry.employeeId)}</TableCell>
                        <TableCell>{getProjectName(projects, entry.projectId)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.startTime} - {entry.endTime}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-primary">
                          {formatDuration(duration)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                          {entry.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
