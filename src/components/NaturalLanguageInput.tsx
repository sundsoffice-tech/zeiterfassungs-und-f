import { useState, useEffect } from 'react'
import { Project, Employee, TimeEntry, AuditMetadata, ApprovalStatus } from '@/lib/types'
import { parseNaturalLanguageInput, ParsedTimeEntry } from '@/lib/natural-language-parser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Warning, Sparkle, Plus } from '@phosphor-icons/react'
import { createAuditMetadata } from '@/lib/data-model-helpers'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface NaturalLanguageInputProps {
  employee: Employee
  projects: Project[]
  date: string
  onEntriesCreated: (entries: TimeEntry[]) => void
}

export function NaturalLanguageInput({
  employee,
  projects,
  date,
  onEntriesCreated
}: NaturalLanguageInputProps) {
  const [input, setInput] = useState('')
  const [parsedResult, setParsedResult] = useState<{ entries: ParsedTimeEntry[]; hasErrors: boolean; validCount: number; errorCount: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (input.trim().length === 0) {
      setParsedResult(null)
      return
    }

    const timeoutId = setTimeout(() => {
      const result = parseNaturalLanguageInput(input, projects.filter(p => p.active))
      setParsedResult(result)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [input, projects])

  const handleCreateEntries = () => {
    if (!parsedResult || parsedResult.hasErrors) {
      toast.error('Bitte beheben Sie alle Fehler vor dem Speichern')
      return
    }

    setIsProcessing(true)

    try {
      const newEntries: TimeEntry[] = []
      
      for (const parsed of parsedResult.entries.filter(e => e.isValid)) {
        const matchedProject = projects.find(p => 
          p.name.toLowerCase() === parsed.projectName.toLowerCase() ||
          p.code?.toLowerCase() === parsed.projectName.toLowerCase() ||
          p.name.toLowerCase().includes(parsed.projectName.toLowerCase())
        )
        
        if (!matchedProject) continue
        
        let duration = parsed.duration || 0
        if (parsed.startTime && parsed.endTime) {
          const [startH, startM] = parsed.startTime.split(':').map(Number)
          const [endH, endM] = parsed.endTime.split(':').map(Number)
          const startMinutes = startH * 60 + startM
          const endMinutes = endH * 60 + endM
          duration = (endMinutes - startMinutes) / 60
        }
        
        const entry: TimeEntry = {
          id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId: employee.tenantId,
          employeeId: employee.id,
          projectId: matchedProject.id,
          date: date,
          startTime: parsed.startTime || '09:00',
          endTime: parsed.endTime || format(new Date(`${date}T${parsed.startTime || '09:00'}:00`).getTime() + duration * 3600000, 'HH:mm'),
          duration: duration,
          notes: parsed.notes,
          billable: true,
          approvalStatus: ApprovalStatus.DRAFT,
          locked: false,
          audit: createAuditMetadata(employee.id),
          changeLog: []
        }
        
        newEntries.push(entry)
      }
      
      onEntriesCreated(newEntries)
      toast.success(`${newEntries.length} Zeiteinträge erfolgreich erstellt`)
      setInput('')
      setParsedResult(null)
    } catch (error) {
      toast.error('Fehler beim Erstellen der Einträge')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-accent" weight="duotone" />
            <CardTitle>Natural Language Eingabe</CardTitle>
          </div>
          {parsedResult && (
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" weight="fill" />
                {parsedResult.validCount}
              </Badge>
              {parsedResult.errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" weight="fill" />
                  {parsedResult.errorCount}
                </Badge>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          Schnelle Zeiteingabe: z.B. "8-12 ProjektA, 13-17 ProjektB" oder "2h Meeting, 4h Development"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="8-12 ProjektA - Entwicklung&#10;13-17 ProjektB - Testing&#10;2h Meeting"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="font-mono min-h-[120px] text-sm"
          id="natural-language-input"
        />
        
        {parsedResult && parsedResult.entries.length > 0 && (
          <div className="space-y-2">
            {parsedResult.entries.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  entry.isValid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {entry.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" weight="fill" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="font-mono text-xs text-muted-foreground">
                      Zeile {entry.lineNumber}: {entry.originalText}
                    </div>
                    
                    {entry.isValid ? (
                      <div className="text-sm font-medium">
                        {entry.startTime && entry.endTime ? (
                          <span>{entry.startTime} - {entry.endTime}</span>
                        ) : (
                          <span>{entry.duration}h</span>
                        )}
                        <span className="mx-2">→</span>
                        <span className="text-primary">{entry.projectName}</span>
                        {entry.notes && (
                          <span className="text-muted-foreground ml-2">({entry.notes})</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {entry.errors.map((error, errIndex) => (
                          <div key={errIndex} className="flex items-start gap-2 text-sm text-red-700">
                            <Warning className="h-4 w-4 mt-0.5 flex-shrink-0" weight="fill" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {parsedResult && parsedResult.entries.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {parsedResult.hasErrors ? (
                <span className="text-red-600 font-medium">
                  Fehler müssen behoben werden
                </span>
              ) : (
                <span className="text-green-600 font-medium">
                  Bereit zum Speichern
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput('')
                  setParsedResult(null)
                }}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleCreateEntries}
                disabled={!parsedResult || parsedResult.hasErrors || isProcessing}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {parsedResult.validCount} {parsedResult.validCount === 1 ? 'Eintrag' : 'Einträge'} erstellen
              </Button>
            </div>
          </div>
        )}
        
        {input.trim().length === 0 && (
          <Alert>
            <Sparkle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tipp:</strong> Mehrere Einträge mit Komma oder Zeilenumbruch trennen.
              Unterstützte Formate: "8-12 Projekt", "8:00-12:00 Projekt", "2h Projekt", "2.5h Projekt"
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
