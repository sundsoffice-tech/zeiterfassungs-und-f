import { useState } from 'react'
import { Employee, Project, Task, Phase, TimeEntry, ApprovalStatus, AuditMetadata, Absence } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarBlank, CheckCircle, Plus, Copy } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { ValidationDisplay } from '@/components/ValidationDisplay'
import { TimeEntryValidator, ValidationContext, ValidationResult, ValidationQuickFix } from '@/lib/validation-rules'

interface WeekScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
  setTimeEntries: (value: TimeEntry[] | ((oldValue?: TimeEntry[]) => TimeEntry[])) => void
  absences?: Absence[]
}

export function WeekScreen({
  employees,
  projects,
  tasks,
  phases,
  timeEntries,
  setTimeEntries,
  absences = []
}: WeekScreenProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employees[0]?.id || '')
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  
  const activeProjects = projects.filter(p => p.active)

  const getEntriesForDay = (projectId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return timeEntries.filter(
      e => e.projectId === projectId && e.date === dateStr && e.employeeId === selectedEmployee
    )
  }

  const getDayTotal = (projectId: string, date: Date) => {
    const entries = getEntriesForDay(projectId, date)
    return entries.reduce((sum, e) => sum + e.duration, 0)
  }

  const getProjectWeekTotal = (projectId: string) => {
    return weekDays.reduce((sum, day) => sum + getDayTotal(projectId, day), 0)
  }

  const getDayColumnTotal = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return timeEntries
      .filter(e => e.date === dateStr && e.employeeId === selectedEmployee)
      .reduce((sum, e) => sum + e.duration, 0)
  }

  const getWeekGrandTotal = () => {
    return weekDays.reduce((sum, day) => sum + getDayColumnTotal(day), 0)
  }

  const handleCellChange = (projectId: string, date: Date, value: string) => {
    const hours = parseFloat(value) || 0
    if (hours < 0) return

    const dateStr = format(date, 'yyyy-MM-dd')
    const existingEntries = getEntriesForDay(projectId, date)

    if (existingEntries.length > 0) {
      const entry = existingEntries[0]
      setTimeEntries((current = []) =>
        current.map(e =>
          e.id === entry.id
            ? { ...e, duration: hours, endTime: format(addHours(parseISO(`${dateStr}T${e.startTime}`), hours), 'HH:mm') }
            : e
        )
      )
    } else if (hours > 0) {
      const audit: AuditMetadata = createAuditMetadata(selectedEmployee, 'Browser')
      const newEntry: TimeEntry = {
        id: `time-${Date.now()}-${Math.random()}`,
        tenantId: 'default',
        employeeId: selectedEmployee,
        projectId,
        date: dateStr,
        startTime: '09:00',
        endTime: format(addHours(parseISO(`${dateStr}T09:00`), hours), 'HH:mm'),
        duration: hours,
        billable: true,
        approvalStatus: ApprovalStatus.DRAFT,
        locked: false,
        audit,
        changeLog: []
      }
      setTimeEntries((current = []) => [...current, newEntry])
    }
  }

  const addHours = (date: Date, hours: number) => {
    return new Date(date.getTime() + hours * 60 * 60 * 1000)
  }

  const handleCopyWeek = () => {
    const lastWeekStart = addDays(currentWeekStart, -7)
    const lastWeekDays = Array.from({ length: 7 }, (_, i) => addDays(lastWeekStart, i))
    
    const lastWeekEntries = timeEntries.filter(e => {
      const entryDate = parseISO(e.date)
      return lastWeekDays.some(day => format(day, 'yyyy-MM-dd') === e.date) && e.employeeId === selectedEmployee
    })

    if (lastWeekEntries.length === 0) {
      toast.error('Keine Einträge in der letzten Woche gefunden')
      return
    }

    const newEntries = lastWeekEntries.map(e => {
      const oldDate = parseISO(e.date)
      const dayOffset = lastWeekDays.findIndex(d => format(d, 'yyyy-MM-dd') === e.date)
      const newDate = weekDays[dayOffset]
      const audit: AuditMetadata = createAuditMetadata(selectedEmployee, 'Browser')

      return {
        ...e,
        id: `time-${Date.now()}-${Math.random()}`,
        date: format(newDate, 'yyyy-MM-dd'),
        audit,
        changeLog: []
      }
    })

    setTimeEntries((current = []) => [...current, ...newEntries])
    toast.success(`${newEntries.length} Einträge kopiert`)
  }

  const handleSubmitWeek = () => {
    const weekEntries = timeEntries.filter(e => {
      const entryDate = parseISO(e.date)
      return weekDays.some(day => format(day, 'yyyy-MM-dd') === e.date) && e.employeeId === selectedEmployee
    })

    if (weekEntries.length === 0) {
      toast.error('Keine Einträge für diese Woche')
      return
    }

    setTimeEntries((current = []) =>
      current.map(e =>
        weekEntries.find(we => we.id === e.id)
          ? { ...e, approvalStatus: ApprovalStatus.SUBMITTED }
          : e
      )
    )

    toast.success('Woche eingereicht zur Genehmigung')
  }

  const getWeekStatus = () => {
    const weekEntries = timeEntries.filter(e => {
      const entryDate = parseISO(e.date)
      return weekDays.some(day => format(day, 'yyyy-MM-dd') === e.date) && e.employeeId === selectedEmployee
    })

    if (weekEntries.length === 0) return 'empty'
    if (weekEntries.every(e => e.approvalStatus === ApprovalStatus.APPROVED)) return 'approved'
    if (weekEntries.some(e => e.approvalStatus === ApprovalStatus.SUBMITTED)) return 'submitted'
    return 'draft'
  }

  const weekStatus = getWeekStatus()

  const getWeekValidationResults = () => {
    const weekEntries = timeEntries.filter(e => {
      return weekDays.some(day => format(day, 'yyyy-MM-dd') === e.date) && e.employeeId === selectedEmployee
    })

    const allResults: ValidationResult[] = []
    weekEntries.forEach(entry => {
      const context: ValidationContext = {
        entry,
        allEntries: timeEntries,
        projects,
        employees,
        absences: absences || [],
        holidays: []
      }
      const results = TimeEntryValidator.validate(context)
      allResults.push(...results)
    })
    return allResults
  }

  const validationResults = getWeekValidationResults()

  const handleApplyFix = (result: ValidationResult, fix: ValidationQuickFix) => {
    const { action } = fix

    if (action.type === 'update_field') {
      const weekEntries = timeEntries.filter(e => {
        return weekDays.some(day => format(day, 'yyyy-MM-dd') === e.date) && e.employeeId === selectedEmployee
      })

      const entryToUpdate = weekEntries.find(e => {
        if (result.metadata?.conflictingEntryId) {
          return false
        }
        const context: ValidationContext = {
          entry: e,
          allEntries: timeEntries,
          projects,
          employees,
          absences: [],
          holidays: []
        }
        const entryResults = TimeEntryValidator.validate(context)
        return entryResults.some(r => r.code === result.code && r.message === result.message)
      })

      if (entryToUpdate) {
        setTimeEntries((current = []) =>
          current.map(e => {
            if (e.id === entryToUpdate.id) {
              if (action.field === 'times') {
                return {
                  ...e,
                  startTime: action.value.startTime,
                  endTime: action.value.endTime,
                  duration: calculateDuration(action.value.startTime, action.value.endTime)
                }
              } else if (action.field) {
                return { ...e, [action.field]: action.value }
              }
            }
            return e
          })
        )
        toast.success(`Fix angewendet: ${fix.label}`)
      }
    } else if (action.type === 'delete_entry') {
      const entryIds = action.entries as string[]
      setTimeEntries((current = []) =>
        current.filter(e => !entryIds.includes(e.id))
      )
      toast.success('Eintrag gelöscht')
    }
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    return (endTotalMinutes - startTotalMinutes) / 60
  }

  return (
    <div className="space-y-6">
      {validationResults.length > 0 && (
        <ValidationDisplay
          results={validationResults}
          showSoftWarnings={true}
          onApplyFix={handleApplyFix}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarBlank className="h-5 w-5" weight="duotone" />
                Wochenansicht
              </CardTitle>
              <CardDescription>
                {format(currentWeekStart, 'dd. MMM', { locale: de })} - {format(addDays(currentWeekStart, 6), 'dd. MMM yyyy', { locale: de })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {weekStatus === 'approved' && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                  Genehmigt
                </Badge>
              )}
              {weekStatus === 'submitted' && (
                <Badge variant="secondary">Eingereicht</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
              >
                ← Vorherige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Heute
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
              >
                Nächste →
              </Button>
            </div>

            <div className="flex-1" />

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleCopyWeek} className="gap-2">
              <Copy className="h-4 w-4" />
              Letzte Woche
            </Button>

            {weekStatus === 'draft' && (
              <Button onClick={handleSubmitWeek} className="gap-2">
                <CheckCircle className="h-4 w-4" weight="fill" />
                Woche einreichen
              </Button>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 bg-muted/50">Projekt</TableHead>
                  {weekDays.map((day, i) => (
                    <TableHead key={i} className="text-center bg-muted/50">
                      <div className="flex flex-col">
                        <span className="text-xs font-normal text-muted-foreground">
                          {format(day, 'EEE', { locale: de })}
                        </span>
                        <span className="font-medium">{format(day, 'dd.MM')}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-muted/50 font-bold">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProjects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {project.name}
                      </div>
                    </TableCell>
                    {weekDays.map((day, i) => {
                      const total = getDayTotal(project.id, day)
                      return (
                        <TableCell key={i} className="p-1">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={total > 0 ? total.toFixed(1) : ''}
                            onChange={(e) => handleCellChange(project.id, day, e.target.value)}
                            className="text-center h-9 font-mono"
                            placeholder="-"
                            disabled={weekStatus === 'submitted' || weekStatus === 'approved'}
                          />
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center font-mono font-bold bg-muted/30">
                      {getProjectWeekTotal(project.id).toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Gesamt</TableCell>
                  {weekDays.map((day, i) => (
                    <TableCell key={i} className="text-center font-mono">
                      {getDayColumnTotal(day).toFixed(1)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-mono text-lg text-primary">
                    {getWeekGrandTotal().toFixed(1)}h
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Tastenkombinationen: Tab zum Navigieren, Enter zum Speichern
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Arbeitsstunden: </span>
                <span className="font-mono font-bold text-lg">{getWeekGrandTotal().toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
