import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useFormTelemetry } from '@/hooks/use-form-telemetry'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { safeAsync, ErrorCode, createError } from '@/lib/error-handler'
import { TimeEntrySchema, safeParseTimeEntry } from '@/lib/schemas'
import { isValidTimeString, isValidDateString } from '@/lib/type-guards'

export function ExampleFormComponent() {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [saving, setSaving] = useState(false)

  const { trackValidationError, trackSaveSuccess, trackSaveError } = useFormTelemetry({
    formName: 'ExampleForm'
  })

  const perf = usePerformanceMonitor('ExampleFormComponent')

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!date || !isValidDateString(date)) {
      errors.date = 'Gültiges Datum erforderlich (YYYY-MM-DD)'
    }

    if (!startTime || !isValidTimeString(startTime)) {
      errors.startTime = 'Gültige Startzeit erforderlich (HH:MM)'
    }

    if (!endTime || !isValidTimeString(endTime)) {
      errors.endTime = 'Gültige Endzeit erforderlich (HH:MM)'
    }

    if (startTime && endTime && startTime >= endTime) {
      errors.endTime = 'Endzeit muss nach Startzeit liegen'
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      trackValidationError(errors)
      const firstError = Object.values(errors)[0]
      toast.error('Validierungsfehler', { description: firstError })
      return
    }

    setSaving(true)

    const result = await perf.trackAsyncAction('save', async () => {
      return await safeAsync(
        async () => {
          const data = {
            id: `entry-${Date.now()}`,
            tenantId: 'default',
            employeeId: 'emp-1',
            projectId: 'proj-1',
            date,
            startTime,
            endTime,
            duration: calculateDuration(startTime, endTime),
            billable: true,
            approvalStatus: 'draft',
            locked: false,
            audit: {
              createdBy: 'user-1',
              createdAt: new Date().toISOString()
            },
            changeLog: []
          }

          const parseResult = safeParseTimeEntry(data)
          if (!parseResult.success) {
            throw createError(
              ErrorCode.VALIDATION_ERROR,
              'Datenvalidierung fehlgeschlagen',
              { zodError: parseResult.error }
            )
          }

          await saveToBackend(parseResult.data)
          return parseResult.data
        },
        {
          showToast: true,
          toastTitle: 'Speichern fehlgeschlagen',
          trackTelemetry: true,
          retry: true,
          retryOptions: {
            maxAttempts: 2,
            delayMs: 1000,
            onRetry: (attempt) => {
              toast.info('Erneuter Versuch...', {
                description: `Versuch ${attempt} von 2`
              })
            }
          },
          context: {
            formName: 'ExampleForm',
            date,
            startTime,
            endTime
          }
        }
      )
    })

    setSaving(false)

    if (result) {
      trackSaveSuccess({ entryId: result.id })
      toast.success('Erfolgreich gespeichert')
      
      setDate('')
      setStartTime('')
      setEndTime('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beispiel-Formular mit allen Features</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">Startzeit</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="HH:MM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">Endzeit</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="HH:MM"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function calculateDuration(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 60
}

async function saveToBackend(data: unknown): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (Math.random() < 0.1) {
    throw new Error('Simulated network error')
  }
}
