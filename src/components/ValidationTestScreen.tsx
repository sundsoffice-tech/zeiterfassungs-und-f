import { useState } from 'react'
import { Employee, Project, TimeEntry, Task, Phase, ApprovalStatus, UserRole, Absence, AbsenceType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useTimeEntryValidation } from '@/hooks/use-validation'
import { ValidationDisplay, ValidationSummaryBadge } from '@/components/ValidationDisplay'
import { AISuggestions, AISuggestion } from '@/components/AISuggestions'
import { ShieldCheck, Brain, TestTube, Play } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { toast } from 'sonner'

interface ValidationTestScreenProps {
  employees: Employee[]
  projects: Project[]
  tasks: Task[]
  phases: Phase[]
  timeEntries: TimeEntry[]
  absences: Absence[]
}

export function ValidationTestScreen({
  employees,
  projects,
  tasks,
  phases,
  timeEntries,
  absences
}: ValidationTestScreenProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  const [testEntry, setTestEntry] = useState<TimeEntry>({
    id: 'test-entry-1',
    tenantId: 'tenant-1',
    employeeId: employees[0]?.id || '',
    projectId: projects[0]?.id || '',
    phaseId: undefined,
    taskId: undefined,
    date: today,
    startTime: '09:00',
    endTime: '17:00',
    duration: 8,
    tags: [],
    location: '',
    notes: '',
    costCenter: '',
    billable: true,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    audit: createAuditMetadata('test-user'),
    changeLog: []
  })

  const [tenantSettings, setTenantSettings] = useState({
    maxDailyHours: 12,
    restrictedHours: { start: '03:00', end: '05:00' },
    weekendWorkRequiresApproval: true,
    requireNotesForBillable: true
  })

  const validation = useTimeEntryValidation({
    entry: testEntry,
    allEntries: timeEntries,
    projects,
    employees,
    absences,
    holidays: ['2024-12-25', '2024-12-26', '2025-01-01'],
    tenantSettings
  })

  const handleFieldChange = (field: keyof TimeEntry, value: any) => {
    setTestEntry(prev => {
      const updated = { ...prev, [field]: value }
      
      if (field === 'startTime' || field === 'endTime') {
        const [startHour, startMin] = updated.startTime.split(':').map(Number)
        const [endHour, endMin] = updated.endTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        let duration = (endMinutes - startMinutes) / 60
        if (duration < 0) duration += 24
        updated.duration = duration
      }
      
      return updated
    })
  }

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (!suggestion.action) return

    setTestEntry(prev => ({
      ...prev,
      ...(suggestion.action?.projectId && { projectId: suggestion.action.projectId }),
      ...(suggestion.action?.taskId && { taskId: suggestion.action.taskId }),
      ...(suggestion.action?.duration && { duration: suggestion.action.duration }),
      ...(suggestion.action?.notes && { notes: suggestion.action.notes }),
      ...(suggestion.action?.startTime && { startTime: suggestion.action.startTime }),
      ...(suggestion.action?.endTime && { endTime: suggestion.action.endTime }),
    }))

    toast.success(`Vorschlag angewendet: ${suggestion.title}`)
  }

  const runTestScenario = (scenario: string) => {
    const emp = employees[0]?.id || ''
    const proj = projects[0]?.id || ''

    switch (scenario) {
      case 'overlap':
        setTestEntry(prev => ({
          ...prev,
          employeeId: emp,
          date: today,
          startTime: '10:00',
          endTime: '12:00',
          duration: 2
        }))
        toast.info('Test: Überlappung mit existierendem Eintrag')
        break

      case 'negative':
        setTestEntry(prev => ({
          ...prev,
          startTime: '17:00',
          endTime: '09:00',
          duration: -8
        }))
        toast.info('Test: Negative Dauer')
        break

      case 'restricted':
        setTestEntry(prev => ({
          ...prev,
          startTime: '03:30',
          endTime: '11:30',
          duration: 8
        }))
        toast.info('Test: Gesperrte Zeitfenster')
        break

      case 'excessive':
        setTestEntry(prev => ({
          ...prev,
          startTime: '06:00',
          endTime: '21:00',
          duration: 15
        }))
        toast.info('Test: Übermäßige Tagesstunden')
        break

      case 'missing-notes':
        setTestEntry(prev => ({
          ...prev,
          billable: true,
          notes: '',
          taskId: undefined
        }))
        toast.info('Test: Fehlende Notizen')
        break

      case 'valid':
        setTestEntry(prev => ({
          ...prev,
          employeeId: emp,
          projectId: proj,
          startTime: '09:00',
          endTime: '17:00',
          duration: 8,
          billable: true,
          notes: 'Entwicklung Feature XYZ',
          date: today
        }))
        toast.success('Test: Gültiger Eintrag')
        break

      default:
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="h-6 w-6 text-accent" weight="duotone" />
            KI-Validierung & Vorschläge
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Teste die Zeitlogik-Validierung und KI-Assistenz
          </p>
        </div>
        <ValidationSummaryBadge 
          hardErrorCount={validation.hardErrors.length}
          softWarningCount={validation.softWarnings.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="h-4 w-4" weight="duotone" />
                Test-Szenarien
              </CardTitle>
              <CardDescription className="text-xs">
                Schnelltests für verschiedene Validierungsregeln
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('overlap')}
                  className="justify-start"
                >
                  Überlappung
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('negative')}
                  className="justify-start"
                >
                  Negative Dauer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('restricted')}
                  className="justify-start"
                >
                  Gesperrte Zeit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('excessive')}
                  className="justify-start"
                >
                  Überstunden
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('missing-notes')}
                  className="justify-start"
                >
                  Fehlende Notizen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTestScenario('valid')}
                  className="justify-start"
                >
                  ✓ Gültig
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zeiteintrag bearbeiten</CardTitle>
              <CardDescription className="text-xs">
                Passe die Werte an, um die Validierung zu testen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Mitarbeiter</Label>
                <Select
                  value={testEntry.employeeId}
                  onValueChange={(value) => handleFieldChange('employeeId', value)}
                >
                  <SelectTrigger id="employee">
                    <SelectValue />
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
                <Label htmlFor="project">Projekt</Label>
                <Select
                  value={testEntry.projectId}
                  onValueChange={(value) => handleFieldChange('projectId', value)}
                >
                  <SelectTrigger id="project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name} {!proj.active && '(Inaktiv)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={testEntry.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={testEntry.startTime}
                    onChange={(e) => handleFieldChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={testEntry.endTime}
                    onChange={(e) => handleFieldChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Dauer (Stunden)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.1"
                  value={testEntry.duration}
                  onChange={(e) => handleFieldChange('duration', parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={testEntry.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Beschreibung der Tätigkeit..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="billable" className="cursor-pointer">
                  Abrechenbar
                </Label>
                <Switch
                  id="billable"
                  checked={testEntry.billable}
                  onCheckedChange={(checked) => handleFieldChange('billable', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  disabled={!validation.canSave}
                  className="flex-1"
                  onClick={() => toast.success('Eintrag gespeichert (Demo-Modus)')}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
                {!validation.canSave && (
                  <Badge variant="destructive">
                    {validation.hardErrors.length} Fehler
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ValidationDisplay
            results={validation.results}
            showSoftWarnings={true}
          />

          <AISuggestions
            timeEntries={timeEntries}
            currentEntry={testEntry}
            projects={projects}
            tasks={tasks}
            phases={phases}
            employees={employees}
            employeeId={testEntry.employeeId}
            onApplySuggestion={handleApplySuggestion}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validierungs-Details</CardTitle>
              <CardDescription className="text-xs">
                Technische Informationen zur Validierung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hard Errors:</span>
                  <Badge variant={validation.hasHardErrors ? 'destructive' : 'outline'}>
                    {validation.hardErrors.length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Soft Warnings:</span>
                  <Badge variant={validation.hasSoftWarnings ? 'secondary' : 'outline'}>
                    {validation.softWarnings.length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Can Save:</span>
                  <Badge variant={validation.canSave ? 'default' : 'destructive'}>
                    {validation.canSave ? 'Ja' : 'Nein'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Aktive Regeln:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Überlappung</Badge>
                  <Badge variant="outline" className="text-xs">Negative Dauer</Badge>
                  <Badge variant="outline" className="text-xs">Gesperrte Zeiten</Badge>
                  <Badge variant="outline" className="text-xs">Projektstatus</Badge>
                  <Badge variant="outline" className="text-xs">Abwesenheit</Badge>
                  <Badge variant="outline" className="text-xs">Tagesstunden</Badge>
                  <Badge variant="outline" className="text-xs">Notizen</Badge>
                  <Badge variant="outline" className="text-xs">Rundungen</Badge>
                  <Badge variant="outline" className="text-xs">Wochenende</Badge>
                  <Badge variant="outline" className="text-xs">Feiertage</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
