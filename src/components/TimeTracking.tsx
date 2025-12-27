import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, D
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateDuration, formatDuration, g
import { motion, AnimatePresence } from 'fram
import { Table, TableBody, TableCell, TableHead, Ta
import { useKV } from '@github/spark/hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescrip
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
interface TimeTrackingProps {
  setTimeEntries: (updateFn: (prev: TimeEntry[]) => TimeEntry[]) => void
  projects: Project[]
import { useKV } from '@github/spark/hooks'
import { useIdleDetection } from '@/hooks/use-idle-detection'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

interface TimeTrackingProps {
  timeEntries: TimeEntry[]
  setTimeEntries: (updateFn: (prev: TimeEntry[]) => TimeEntry[]) => void
  employees: Employee[]
  projects: Project[]
}


    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    endTime: '17:00',
    task: '',
  
    location: '',
    costCenter: '',
    useDuration: false

  
    adjustHours: 0

    name: '',
    projectId: '',
  
    tags: [] as string[],

    costCenter: '',
  })
  useEffect(() => 
      setCurrentTime(Date.now())
    return () => clearI

    if (isIdle &&
      if (run
        setIdleA
    }

    if (!allowMul
      return

      id: `timer_${
      projectId,
    

      tags: templateData?.tags,
      notes: templ
      billable
    }
    


    setActive
        timer.id ==
          : timer
    )
  }, [setActi
  const resumeTi
      (prev || []).map(ti
          const p
            ...ti
            pa
          }
        return tim
    


    const timer = activeTimers?.find(t =

    const n
      ...timeEntry


    toast.success('

    const timer = activeTimers?.find(t => t.id === timerId)

    const newEntry: TimeEntry = {
      ...timeEntry


      (prev || []).map(t =>

              projectId: newProjectId,
              pausedDuration: 0,
              pausedAt: undefined
          : 
    )


    setIdleAlertOpen(false)
    updateActivit

    if (idleAlertTimer) {
      const idleDuration
      setActiveTimers(
          timer.id === idleAlertTimer
            : timer
      )
      toast.success('Idle time discarde
    setIdleAlertOpen(false)
    updateActivity()

    e.preventDef
    i


    let endTime = formData.endTime
    if (formData.use
      const [startHour, startMin] = formData.startTime.split(':').map(Numb

      const endHour = Math.floor(endMinutes / 60) % 24
      endTime = `${endHour.to
      const [startHour, startMi
      const startMinutes = startHour * 60 + sta

        toast.err
      }

      id: `time_${Date.now()}`
      employeeId: formD

      endTime: endTime,
      tags: formData.tags.len
      notes: formData.notes || un
      billable: formData.billable,
      locked: false,
        createdBy:
      },
    }
    setTimeEntries((prev) => [..

      emplo
      dat
      endTime: '17:0
      ta
     
      location: '',
      costCenter: ''
      useDuration: false


    if (selectedEntries.size === 0) {
      return

      prev.map(entry => {

        
          updates.
     


          const duration = calculateDuration(entry.startTime, entry.endTi
    
          const endMinutes = startMinutes + Math.r
          const endHour = Math.floor(endMinutes / 60)


      })


    setBulkEditData({ projectId: '', notes: '', adju

    if (!templateData.name || !
      return


      employeeId: templateData.employeeId,

      location: templateData.
      costCenter: templateD
      isFavorite: false,
    }
    setTemplates((p
    setTemplateDialogOpen(false)
  }
  const startFromTemplate = (tem
    setTemplates((prev) =>
        t.id === template.id ? { 
    )
  }
  const
     

  }
  const toggleTemplateFavorite = (templateId: string)

      )
  }
  const deleteTemplate = (t
    toast.success('T


    setSelectedEntries(new Set(sele
  }
  const handleExport = () => {
    toast.success('Time entries exported to CSV')

    const newSelected = new Set
      newSelected.delete(entryId)
      newSelected.add(entryId)
    setSelectedEntries(newSelected)

    if (s
    } e
    }

    n

  const favoriteTemplates =
  const totalHours =
   

    <div className="space-y-6">
        <div>
    
          </p>
        <div className="flex gap-2">
            
     

            <DialogTrigger asChild>
                <Lightning classNa

            <DialogContent className="max-w-2xl">
                <DialogTitle>Quick Start Timer</DialogTit
              <Tabs defaultValue="favorites" className="w-full">
                  <TabsTrigger value="favorites">Fav
                  <TabsTrigger value="templates">Templa
      
                    {favoriteTemplates.length === 0 ? 
                        <Star classN
                      </div>
            
                          <Card key={template.id} className="hover:bg-accent/
                              <div className="flex items-start justify-
                                  <div className="fl
                                    <Badge var

                                  <p cl
        toast.error('End time must be after start time')
        return
      }
    }

    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      tenantId: 'default',
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date,
      startTime: startTime,
      endTime: endTime,
      duration: calculateDuration(startTime, endTime),
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      costCenter: formData.costCenter || undefined,
      billable: formData.billable,
      approvalStatus: formData.employeeId ? ('DRAFT' as any) : ('DRAFT' as any),
      locked: false,
      audit: {
        createdBy: formData.employeeId,
        createdAt: new Date().toISOString()
      },
      changeLog: []
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
      task: '',
      subtask: '',
      tags: [],
      tagInput: '',
      location: '',
      notes: '',
      costCenter: '',
      billable: true,
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
      task: templateData.task || undefined,
      subtask: templateData.subtask || undefined,
      tags: templateData.tags.length > 0 ? templateData.tags : undefined,
      location: templateData.location || undefined,
      notes: templateData.notes || undefined,
      costCenter: templateData.costCenter || undefined,
      billable: templateData.billable,
      isFavorite: false,
      lastUsed: new Date().toISOString()
    }

    setTemplates((prev) => [...(prev || []), newTemplate])
    toast.success('Template saved')
    setTemplateDialogOpen(false)
    setTemplateData({ name: '', employeeId: '', projectId: '', duration: '', task: '', subtask: '', tags: [], tagInput: '', location: '', notes: '', costCenter: '', billable: true })
  }

  const startFromTemplate = (template: TimeTemplate) => {
    startTimer(template.employeeId, template.projectId, template)
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
                                placehold
                              />
                          </div>
                        <DialogFo
                           
                          <B
                      
                  </div>
                    {(template
                        <Lightning className="h-12 w-12 mb-2" />
                      </div>
                      <div className="space-y-2">
                          <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                              <div className="flex items-sta
                                  <div className=
                            
                         
                                  <p className="t
                                  </p>
                                
                                    si
                                    onClick={() => toggleTemplateFavorite(template.id)}
                                    <Star cl
                                  <Button
                                    variant="ghost"
                              
                           
                              </div>
                          </Card>
                      </div>
                  </ScrollArea>
              </Tabs>
          </Dialog>
            <DialogTrigger asChild>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
              </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogTitle>Add Time Entry</DialogTitle>
              <form onSubmit={hand
                  <div className="grid gri
                      <Label html
                        val
                      >
                      
                        <Select
                            <S
                            </SelectItem>
                        </SelectContent>
                    </div>
                    <div className="space-y-2
                      <Select
                        onValueChange={(value) => setFormDa
                        <SelectTrigger
                        </SelectT
                          {projects.ma
                              {proj.name}
                          ))}
                      </Select>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      onChange={(e
                    />

                    <Checkbox
                      checked={formData.useDuration}
                        setFor
                    />
                      Use duration instead of end time
                  </div>
                  {formData.useDuration ? (
                      <Label htmlFor=
                        id="duration"
                        value={formData.duration}
                        placeho
                      />
                  ) : (
                      <div className="space-y-2"
                        <Input
                          type="time"
                          onChange={(e) => setFormData({ ...formData, startT
                        />
                      <div className="space-y-2">
                        <Input
                          type="time"
                          onChange={(e)
                        />
                    </div>


                    <h4 className="text-sm font-medium text-mu
                    <div className="grid grid-cols-2 gap-4">
                        <Label 
                          id="task"
                          onChange={(e) => setFormData({ ...formData, task: e.
                        />

                        <Label htmlFor="subtask">Subtask</L
                          id="subtask"
                          onChange={(e) => setFor
                        />
                    </div>
                    <div className="space-y-2">
                      <div className="f
                          id="tags
                          onChan
                          onKeyDown={(e) => {
                              e.preventDefault()
                                se
                                  tags: [...formData
                                })
                            }
                        />
                          type="button"
                          vari
                            if (

                                tagInpu

                        >
                        </Button>
                      {formD
                          {formData.tags.map((tag, idx) => (
                              <Tag className="h-3 w-3" />
                              <button
                                onClic
                                    ...formData,
                                  })
                                className="ml-1 hover:text-destructive"
                                <X className="h-3 w-3" />
                            </Badg
                        </div>

                    <div className="grid grid-cols-2 gap-
                        <Label htmlFor="location" className="flex items-center ga
                          Location
                        <Input
                          value={formData.location}
                          placeholder="e.g., Home Office"
                      </div>
                      <div classNa
                          <Bank clas
                        </Label>

                          onChange={(e) => setFormData(
                        />
                    </div>
                    <div className="fl
                        <CurrencyDollar className="h
                          <Label htmlFor="billable" className="
                        </div>
                      <Switch
                        checked={formData.billable}
                      />

                      <Label htmlFor="notes">Notes</Label>
                        id="notes"
                        onChange={(e) => setFormData({ ...
                        rows={3}
                    </div>
                </div>
                  <Button type="button"
                  </Button>
                </DialogFooter>
            </DialogContent>
        </div>

        <div className="space-y-3">
            <Clock className="h-5 w-5" weight="duot
          </h2>
            {activeTimers.map((timer) => {
              const hours = Math.floor(elapsed / (1000 
              
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  exit={{ opacity: 0, y:
                  <Card className="bo
                      <div className
                          <div cl
                              {getEmployeeName(employees, time
                            {timer.isPaus
                                Paus
                            )}
                              <Badge variant="outline" className="text-gree
                                Billable
                            )}
                          <h3 className="font-semibold text-lg">
                          </h3>
                            <p className="tex
                            </p>
                          {timer.tags && timer.tags.leng
                              {timer.tags.map((tag, idx) =>
                                  <Tag className="h-3 w-3 mr
                                </Badge>
                            </div>
                          {(timer.location
                              {timer.location && (
                                  <MapP
                                </span>
                              {timer.costCenter
                                  <Bank clas
                                </spa
                            </div>
                          {timer
                          )}

                            {formatTimerDuration(elapsed)}
                          <p className="text-xs text-mute
                          </p>
                      </div>
                      <div className="flex items-center 
                          <Button
                            onClick={() => resumeTimer(timer.id)}
                          >
                            Resume
                        ) : (

                            onClick={() => pauseTimer(tim
                          >
                            Pause
                        )}
                          value={timer.projectId}
                        >
                            <div className="flex items-cente
                              Swit
                          </SelectTr
                            {proje

                            ))}
                        </Select>
                          size="sm"
                          className="
                          <Stop className="mr-2 h-4 w-4" weight="fill" />
                        </Button>
                    </CardContent>
                </motion.div>
            })}
        </div>

        <Card>
            <Clock className="h-
            <p className="text-mut

                ? 'Add employees to start tracking time
            </p>
        </Card>
        <Card>
            <Clock className="h-16 w-16 text-muted-foregro
            <p className="text-muted-foreground text-center mb-4">
            </p>
        </Card>
        <>
            <motion.div
              animate={{ opacity
              <Card className=
                  <div className="flex
                      {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} s
                    <div className
                        size="sm"
                        onClick={() => setSelectedEntries(new Set())}
                        Clear Selection
                      <Dialog open={bu
                          <Bu
                        
                        </DialogTrigger>
                          <DialogHeader>
                          </DialogHeader>
                            <div className="space-y-2">
                              <Select
                            
                         
                                </SelectTrigger>
                                  {projects.map((proj) => (
                                      {proj.name}
                                  ))}
                              </Select>
                            <div className="space-y-2">
                              <Textarea
                                value={bulkEditData.notes}
                                placeholder="Leave empty to kee
                            </div>
                              <Label htmlFor
                                id="bulk
                                step="0.5"
                                onChange={(e) => setBulkEditData({ ...bulkEditData
                              />
                          </div>
                            <Button variant="outline" onClic
                            </Button>
                          </DialogFooter>
                      </Dialog>
                  </div>
              </Card>
          )}
          <Card>
              <div className="overflow-x-
                  <TableHeader>
                      <TableHead className="w-[50px
                          checked={selectedEntries.size === sortedEntries.lengt
                        />
                      <TableHead>Date</TableHead>
                      <TableHead>Project</T
                      <TableHead>Time<
                      <TableHead>Det
                    </TableRow>
                  <TableBody>
                      const
                      
                      
                          initi
                          tran
                     
                            
                   
                          </TableCell>
                            {new Da
                          <TableCell>
                              {getEmployeeName(employees, entry
                              
                       
                          <T
                            {entry.taskId ? `Task: ${entry.taskId}` : '-'}
                          <T
                          </TableCell>
                            {
                          <TableCell classNa
                              {entry.tags && ent
                                  {entry.tags.map((tag, id
                                      {tag}
                                  ))}
                             
                                <div className="fle
                                    <span className="flex items-center gap-1">
                       
                                  )}
                                    <span className="flex items-center 
                                      {e
                                  )}
                              )}
                                <p className="text-xs text-muted-for
                            </div>
                          <TableCell>
                             
                                size="ic
                              >
                          

                              <Button
                                size="icon"
                             
                              </Button>
                          </TableCell>
                      )
                  </TableBody>
              </div>
          </Card>
      )}
      <AlertDialog open={idleAlertOpen} onOpenChang
          <AlertDialogHeader>
            <AlertDialogDescription>
            </AlertDialogDescription>
          <AlertDialogFooter>
              Discard Idle Time
            <AlertDialogAction 
            </AlertDialogA
        </AlertDialogCon

}














































































































































































































































































































































































































































































































































































































































