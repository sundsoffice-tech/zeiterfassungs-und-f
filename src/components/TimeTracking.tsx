import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Trash, Download, Play, Pause, Stop, Star, ArrowsClockwise, CheckSquare, PencilSimple, Lightning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimeEntry, Employee, Project, ActiveTimer, TimeTemplate } from '@/lib/types'
import { calculateDuration, formatDuration, getEmployeeName, getProjectName } from '@/lib/helpers'
import { formatTimerDuration, getTimerElapsedTime, convertTimerToTimeEntry, getRecentProjects, millisecondsToDuration } from '@/lib/timer-helpers'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportTimeEntriesToCSV } from '@/lib/csv-export'
import { useKV } from '@github/spark/hooks'
import { useIdleDetection } from '@/hooks/use-idle-detection'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface TimeTrackingProps {
  timeEntries: TimeEntry[]
  setTimeEntries: (updateFn: (prev: TimeEntry[]) => TimeEntry[]) => void
  employees: Employee[]
  projects: Project[]
}

export function TimeTracking({ timeEntries, setTimeEntries, employees, projects }: TimeTrackingProps) {
  const [activeTimers, setActiveTimers] = useKV<ActiveTimer[]>('activeTimers', [])
  const [templates, setTemplates] = useKV<TimeTemplate[]>('timeTemplates', [])
  const [idleThreshold] = useKV<number>('idleThreshold', 15)
  const [allowMultipleTimers] = useKV<boolean>('allowMultipleTimers', false)
  
  const [open, setOpen] = useState(false)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [idleAlertTimer, setIdleAlertTimer] = useState<ActiveTimer | null>(null)
  const [idleAlertOpen, setIdleAlertOpen] = useState(false)
  
  const { isIdle, lastActivityTime, updateActivity } = useIdleDetection(idleThreshold)

  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    duration: '',
    notes: '',
    useDuration: false
  })

  const [bulkEditData, setBulkEditData] = useState({
    projectId: '',
    notes: '',
    adjustHours: 0
  })

  const [templateData, setTemplateData] = useState({
    name: '',
    employeeId: '',
    projectId: '',
    duration: '',
    notes: ''
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isIdle && activeTimers && activeTimers.length > 0) {
      const runningTimers = activeTimers.filter(t => !t.isPaused)
      if (runningTimers.length > 0) {
        setIdleAlertTimer(runningTimers[0])
        setIdleAlertOpen(true)
      }
    }
  }, [isIdle, activeTimers])

  const startTimer = useCallback((employeeId: string, projectId: string, notes?: string) => {
    if (!allowMultipleTimers && activeTimers && activeTimers.length > 0) {
      toast.error('Stop the current timer before starting a new one')
      return
    }

    const newTimer: ActiveTimer = {
      id: `timer_${Date.now()}`,
      employeeId,
      projectId,
      startTime: Date.now(),
      pausedDuration: 0,
      notes: notes || '',
      isPaused: false
    }

    setActiveTimers((prev) => [...(prev || []), newTimer])
    toast.success('Timer started')
    updateActivity()
  }, [activeTimers, allowMultipleTimers, setActiveTimers, updateActivity])

  const pauseTimer = useCallback((timerId: string) => {
    setActiveTimers((prev) =>
      (prev || []).map(timer =>
        timer.id === timerId && !timer.isPaused
          ? { ...timer, isPaused: true, pausedAt: Date.now() }
          : timer
      )
    )
    toast.info('Timer paused')
  }, [setActiveTimers])

  const resumeTimer = useCallback((timerId: string) => {
    setActiveTimers((prev) =>
      (prev || []).map(timer => {
        if (timer.id === timerId && timer.isPaused && timer.pausedAt) {
          const pauseDuration = Date.now() - timer.pausedAt
          return {
            ...timer,
            isPaused: false,
            pausedAt: undefined,
            pausedDuration: timer.pausedDuration + pauseDuration
          }
        }
        return timer
      })
    )
    toast.success('Timer resumed')
    updateActivity()
  }, [setActiveTimers, updateActivity])

  const stopTimer = useCallback((timerId: string) => {
    const timer = activeTimers?.find(t => t.id === timerId)
    if (!timer) return

    const timeEntry = convertTimerToTimeEntry(timer)
    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      ...timeEntry,
      createdAt: new Date().toISOString()
    }

    setTimeEntries((prev) => [...prev, newEntry])
    setActiveTimers((prev) => (prev || []).filter(t => t.id !== timerId))
    
    toast.success('Timer stopped and entry saved')
  }, [activeTimers, setActiveTimers, setTimeEntries])

  const switchTimerProject = useCallback((timerId: string, newProjectId: string) => {
    const timer = activeTimers?.find(t => t.id === timerId)
    if (!timer) return

    const timeEntry = convertTimerToTimeEntry(timer)
    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      ...timeEntry,
      createdAt: new Date().toISOString()
    }

    setTimeEntries((prev) => [...prev, newEntry])

    setActiveTimers((prev) =>
      (prev || []).map(t =>
        t.id === timerId
          ? {
              ...t,
              projectId: newProjectId,
              startTime: Date.now(),
              pausedDuration: 0,
              isPaused: false,
              pausedAt: undefined
            }
          : t
      )
    )

    toast.success('Switched to new project')
  }, [activeTimers, setActiveTimers, setTimeEntries])

  const handleIdleKeep = () => {
    setIdleAlertOpen(false)
    setIdleAlertTimer(null)
    updateActivity()
  }

  const handleIdleDiscard = () => {
    if (idleAlertTimer) {
      const idleStartTime = lastActivityTime
      const idleDuration = Date.now() - idleStartTime

      setActiveTimers((prev) =>
        (prev || []).map(timer =>
          timer.id === idleAlertTimer.id
            ? { ...timer, pausedDuration: timer.pausedDuration + idleDuration }
            : timer
        )
      )
      
      toast.success('Idle time discarded')
    }
    setIdleAlertOpen(false)
    setIdleAlertTimer(null)
    updateActivity()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employeeId || !formData.projectId) {
      toast.error('Please select employee and project')
      return
    }

    let startTime = formData.startTime
    let endTime = formData.endTime

    if (formData.useDuration && formData.duration) {
      const durationMinutes = parseInt(formData.duration)
      const [startHour, startMin] = formData.startTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = startMinutes + durationMinutes
      
      const endHour = Math.floor(endMinutes / 60) % 24
      const endMin = endMinutes % 60
      endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
    } else {
      const [startHour, startMin] = formData.startTime.split(':').map(Number)
      const [endHour, endMin] = formData.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      if (endMinutes <= startMinutes) {
        toast.error('End time must be after start time')
        return
      }
    }

    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date,
      startTime: startTime,
      endTime: endTime,
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
      duration: '',
      notes: '',
      useDuration: false
    })
    setOpen(false)
  }

  const handleBulkEdit = () => {
    if (selectedEntries.size === 0) {
      toast.error('No entries selected')
      return
    }

    setTimeEntries((prev) =>
      prev.map(entry => {
        if (!selectedEntries.has(entry.id)) return entry

        const updates: Partial<TimeEntry> = {}
        
        if (bulkEditData.projectId) {
          updates.projectId = bulkEditData.projectId
        }
        
        if (bulkEditData.notes) {
          updates.notes = bulkEditData.notes
        }

        if (bulkEditData.adjustHours !== 0) {
          const duration = calculateDuration(entry.startTime, entry.endTime)
          const newDuration = Math.max(0, duration + bulkEditData.adjustHours)
          const [startHour, startMin] = entry.startTime.split(':').map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = startMinutes + Math.round(newDuration * 60)
          
          const endHour = Math.floor(endMinutes / 60) % 24
          const endMin = endMinutes % 60
          updates.endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
        }

        return { ...entry, ...updates }
      })
    )

    toast.success(`Updated ${selectedEntries.size} entries`)
    setSelectedEntries(new Set())
    setBulkEditOpen(false)
    setBulkEditData({ projectId: '', notes: '', adjustHours: 0 })
  }

  const saveTemplate = () => {
    if (!templateData.name || !templateData.employeeId || !templateData.projectId) {
      toast.error('Please fill in all required fields')
      return
    }

    const newTemplate: TimeTemplate = {
      id: `template_${Date.now()}`,
      name: templateData.name,
      employeeId: templateData.employeeId,
      projectId: templateData.projectId,
      duration: templateData.duration ? parseInt(templateData.duration) : undefined,
      notes: templateData.notes,
      isFavorite: false,
      lastUsed: new Date().toISOString()
    }

    setTemplates((prev) => [...(prev || []), newTemplate])
    toast.success('Template saved')
    setTemplateDialogOpen(false)
    setTemplateData({ name: '', employeeId: '', projectId: '', duration: '', notes: '' })
  }

  const startFromTemplate = (template: TimeTemplate) => {
    startTimer(template.employeeId, template.projectId, template.notes)
    setTemplates((prev) =>
      (prev || []).map(t =>
        t.id === template.id ? { ...t, lastUsed: new Date().toISOString() } : t
      )
    )
    setQuickStartOpen(false)
  }

  const toggleFavorite = (entryId: string) => {
    setTimeEntries((prev) =>
      prev.map(entry =>
        entry.id === entryId ? { ...entry, isFavorite: !entry.isFavorite } : entry
      )
    )
  }

  const toggleTemplateFavorite = (templateId: string) => {
    setTemplates((prev) =>
      (prev || []).map(t =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      )
    )
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => (prev || []).filter(t => t.id !== templateId))
    toast.success('Template deleted')
  }

  const handleDelete = (entryId: string) => {
    setTimeEntries((prev) => prev.filter(entry => entry.id !== entryId))
    selectedEntries.delete(entryId)
    setSelectedEntries(new Set(selectedEntries))
    toast.success('Time entry deleted')
  }

  const handleExport = () => {
    exportTimeEntriesToCSV(timeEntries, employees, projects)
    toast.success('Time entries exported to CSV')
  }

  const toggleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const selectAllEntries = () => {
    if (selectedEntries.size === sortedEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(sortedEntries.map(e => e.id)))
    }
  }

  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const recentProjects = getRecentProjects(timeEntries, 5)
  const favoriteTemplates = (templates || []).filter(t => t.isFavorite)

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
          <Dialog open={quickStartOpen} onOpenChange={setQuickStartOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={employees.length === 0 || projects.length === 0}>
                <Lightning className="mr-2 h-4 w-4" weight="fill" />
                Quick Start
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Quick Start Timer</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="favorites" className="space-y-4">
                  <ScrollArea className="h-[300px]">
                    {favoriteTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mb-2" />
                        <p>No favorite templates yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {favoriteTemplates.map(template => (
                          <Card key={template.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardContent className="p-4" onClick={() => startFromTemplate(template)}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{template.name}</h4>
                                    <Badge variant="secondary">
                                      {getEmployeeName(employees, template.employeeId)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {getProjectName(projects, template.projectId)}
                                  </p>
                                  {template.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{template.notes}</p>
                                  )}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleTemplateFavorite(template.id)
                                  }}
                                >
                                  <Star className="h-4 w-4" weight="fill" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="recent" className="space-y-4">
                  <ScrollArea className="h-[300px]">
                    {recentProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mb-2" />
                        <p>No recent projects</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentProjects.map((recent, idx) => (
                          <Card 
                            key={idx} 
                            className="hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => {
                              startTimer(recent.employeeId, recent.projectId)
                              setQuickStartOpen(false)
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary">
                                  {getEmployeeName(employees, recent.employeeId)}
                                </Badge>
                              </div>
                              <p className="font-medium">
                                {getProjectName(projects, recent.projectId)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last used: {new Date(recent.lastUsed).toLocaleDateString('de-DE')}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="templates" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          New Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Template</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name *</Label>
                            <Input
                              id="template-name"
                              value={templateData.name}
                              onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                              placeholder="e.g., Daily Standup"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="template-employee">Employee *</Label>
                            <Select
                              value={templateData.employeeId}
                              onValueChange={(value) => setTemplateData({ ...templateData, employeeId: value })}
                            >
                              <SelectTrigger id="template-employee">
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
                            <Label htmlFor="template-project">Project *</Label>
                            <Select
                              value={templateData.projectId}
                              onValueChange={(value) => setTemplateData({ ...templateData, projectId: value })}
                            >
                              <SelectTrigger id="template-project">
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
                            <Label htmlFor="template-duration">Default Duration (minutes)</Label>
                            <Input
                              id="template-duration"
                              type="number"
                              value={templateData.duration}
                              onChange={(e) => setTemplateData({ ...templateData, duration: e.target.value })}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="template-notes">Default Notes</Label>
                            <Textarea
                              id="template-notes"
                              value={templateData.notes}
                              onChange={(e) => setTemplateData({ ...templateData, notes: e.target.value })}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={saveTemplate}>Save Template</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ScrollArea className="h-[250px]">
                    {(templates || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Lightning className="h-12 w-12 mb-2" />
                        <p>No templates created yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(templates || []).map(template => (
                          <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 cursor-pointer" onClick={() => startFromTemplate(template)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{template.name}</h4>
                                    <Badge variant="secondary">
                                      {getEmployeeName(employees, template.employeeId)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {getProjectName(projects, template.projectId)}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => toggleTemplateFavorite(template.id)}
                                  >
                                    <Star className="h-4 w-4" weight={template.isFavorite ? "fill" : "regular"} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteTemplate(template.id)}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-duration"
                      checked={formData.useDuration}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, useDuration: checked as boolean })
                      }
                    />
                    <Label htmlFor="use-duration" className="text-sm font-normal cursor-pointer">
                      Use duration instead of end time
                    </Label>
                  </div>

                  {formData.useDuration ? (
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 60"
                        required
                      />
                    </div>
                  ) : (
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
                  )}

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

      {activeTimers && activeTimers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" weight="duotone" />
            Active Timers
          </h2>
          <div className="grid gap-3">
            {activeTimers.map((timer) => {
              const elapsed = getTimerElapsedTime(timer)
              const { hours, minutes } = millisecondsToDuration(elapsed)
              
              return (
                <motion.div
                  key={timer.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-accent/50 bg-accent/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">
                              {getEmployeeName(employees, timer.employeeId)}
                            </Badge>
                            {timer.isPaused && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Paused
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg">
                            {getProjectName(projects, timer.projectId)}
                          </h3>
                          {timer.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{timer.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-3xl font-bold text-primary">
                            {formatTimerDuration(elapsed)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {hours}h {minutes}m
                          </p>
                        </div>
                      </div>
                      <Separator className="mb-3" />
                      <div className="flex items-center gap-2">
                        {timer.isPaused ? (
                          <Button
                            size="sm"
                            onClick={() => resumeTimer(timer.id)}
                            className="flex-1"
                          >
                            <Play className="mr-2 h-4 w-4" weight="fill" />
                            Resume
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseTimer(timer.id)}
                            className="flex-1"
                          >
                            <Pause className="mr-2 h-4 w-4" weight="fill" />
                            Pause
                          </Button>
                        )}
                        <Select
                          value={timer.projectId}
                          onValueChange={(value) => switchTimerProject(timer.id, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <div className="flex items-center gap-2">
                              <ArrowsClockwise className="h-4 w-4" />
                              Switch Project
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((proj) => (
                              <SelectItem key={proj.id} value={proj.id}>
                                {proj.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => stopTimer(timer.id)}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <Stop className="mr-2 h-4 w-4" weight="fill" />
                          Stop
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

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
              Start tracking time by adding your first entry or starting a timer
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedEntries.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEntries(new Set())}
                      >
                        Clear Selection
                      </Button>
                      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <PencilSimple className="mr-2 h-4 w-4" />
                            Bulk Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bulk Edit Entries</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="bulk-project">Change Project</Label>
                              <Select
                                value={bulkEditData.projectId}
                                onValueChange={(value) => setBulkEditData({ ...bulkEditData, projectId: value })}
                              >
                                <SelectTrigger id="bulk-project">
                                  <SelectValue placeholder="Keep unchanged" />
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
                              <Label htmlFor="bulk-notes">Update Notes</Label>
                              <Textarea
                                id="bulk-notes"
                                value={bulkEditData.notes}
                                onChange={(e) => setBulkEditData({ ...bulkEditData, notes: e.target.value })}
                                placeholder="Leave empty to keep unchanged"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bulk-adjust">Adjust Duration (hours)</Label>
                              <Input
                                id="bulk-adjust"
                                type="number"
                                step="0.5"
                                value={bulkEditData.adjustHours}
                                onChange={(e) => setBulkEditData({ ...bulkEditData, adjustHours: parseFloat(e.target.value) || 0 })}
                                placeholder="e.g., 0.5 to add 30 min, -1 to subtract 1 hour"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleBulkEdit}>Apply Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedEntries.size === sortedEntries.length && sortedEntries.length > 0}
                          onCheckedChange={selectAllEntries}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEntries.map((entry, index) => {
                      const duration = calculateDuration(entry.startTime, entry.endTime)
                      const isSelected = selectedEntries.has(entry.id)
                      
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={`group ${isSelected ? 'bg-accent/20' : ''}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectEntry(entry.id)}
                            />
                          </TableCell>
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
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(entry.id)}
                              >
                                <Star 
                                  className="h-4 w-4" 
                                  weight={entry.isFavorite ? "fill" : "regular"} 
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={idleAlertOpen} onOpenChange={setIdleAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Idle Time Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You've been idle for {idleThreshold} minutes. Would you like to keep or discard this idle time from your timer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleIdleDiscard}>
              Discard Idle Time
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleIdleKeep}>
              Keep All Time
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
