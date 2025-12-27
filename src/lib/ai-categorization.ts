import { TimeEntry, Project, Task, Employee } from './types'

export interface ContextSignals {
  title?: string
  notes?: string
  calendarEvent?: {
    title: string
    startTime: string
    endTime: string
    location?: string
    attendees?: string[]
  }
  location?: string
  usedApps?: string[]
  usedWebsites?: string[]
  timeOfDay?: string
  dayOfWeek?: string
}

export interface CategorizationSuggestion {
  type: 'project' | 'task' | 'tag' | 'duration' | 'complete'
  projectId?: string
  projectName?: string
  taskId?: string
  taskName?: string
  tags?: string[]
  duration?: number
  startTime?: string
  endTime?: string
  confidence: number
  reasoning: string
  basedOn: ('history' | 'calendar' | 'location' | 'apps' | 'title' | 'time-pattern')[]
}

export interface CalendarEventSuggestion {
  calendarTitle: string
  suggestedProject: string
  suggestedDuration: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export async function generateContextBasedSuggestions(
  context: ContextSignals,
  projects: Project[],
  tasks: Task[],
  historicalEntries: TimeEntry[],
  employeeId: string
): Promise<CategorizationSuggestion[]> {
  const activeProjects = projects.filter(p => p.active)
  const activeTasks = tasks.filter(t => t.active)
  
  const recentProjectUsage = getRecentProjectUsage(historicalEntries, employeeId, 30)
  const timePatterns = analyzeTimePatterns(historicalEntries, employeeId)
  const locationPatterns = analyzeLocationPatterns(historicalEntries, employeeId)
  
  const contextDescription = buildContextDescription(context, recentProjectUsage, timePatterns, locationPatterns)
  
  const prompt = window.spark.llmPrompt`Du bist ein intelligenter Assistent für Zeiterfassung. Analysiere den gegebenen Kontext und schlage passende Projekte, Tasks und Tags vor.

KONTEXT:
${contextDescription}

VERFÜGBARE PROJEKTE:
${activeProjects.map(p => `- ${p.name} (ID: ${p.id})${p.description ? ': ' + p.description : ''}`).join('\n')}

VERFÜGBARE TASKS:
${activeTasks.map(t => {
  const proj = projects.find(p => p.id === t.projectId)
  return `- ${t.name} (ID: ${t.id}, Projekt: ${proj?.name || 'Unknown'})`
}).join('\n')}

HISTORISCHE PROJEKT-NUTZUNG (letzte 30 Tage):
${recentProjectUsage.map(rp => `- ${rp.projectName}: ${rp.count} Einträge, ${rp.totalHours.toFixed(1)}h gesamt`).join('\n')}

AUFGABE:
Basierend auf dem Kontext, erstelle 2-4 konkrete Vorschläge für die Kategorisierung dieses Zeiteintrags. 
Berücksichtige:
- Kalendertitel und Teilnehmer (Hinweise auf Kundennamen oder Projektnamen)
- Standort (z.B. "Kurita Showroom" → Projekt "Kurita")
- Genutzte Apps/Webseiten (z.B. "Figma" → Design-Task, "GitHub" → Development)
- Tageszeit und Wochenmuster
- Historische Muster des Mitarbeiters

Gib für jeden Vorschlag eine CONFIDENCE (0-100) und REASONING an.
Nenne explizit auf welchen Signalen der Vorschlag basiert (history, calendar, location, apps, title, time-pattern).

Antworte als JSON-Objekt mit einer "suggestions" Property:
{
  "suggestions": [
    {
      "type": "complete",
      "projectId": "project-id-here",
      "projectName": "Projektname",
      "taskId": "task-id-or-null",
      "taskName": "Taskname oder null",
      "tags": ["tag1", "tag2"],
      "startTime": "10:00",
      "endTime": "11:30",
      "confidence": 85,
      "reasoning": "Kalendertitel 'Kurita Showroom' deutet stark auf Projekt Kurita hin. Standort bestätigt dies.",
      "basedOn": ["calendar", "location", "history"]
    }
  ]
}`

  try {
    const response = await window.spark.llm(prompt, 'gpt-4o', true)
    const result = JSON.parse(response)
    
    if (result.suggestions && Array.isArray(result.suggestions)) {
      return result.suggestions.map((s: any) => ({
        ...s,
        confidence: Math.min(100, Math.max(0, s.confidence || 50))
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error generating context-based suggestions:', error)
    return []
  }
}

export async function analyzeCalendarEventForSuggestion(
  eventTitle: string,
  eventTime: { start: string; end: string },
  eventLocation?: string,
  projects: Project[] = [],
  historicalEntries: TimeEntry[] = []
): Promise<CalendarEventSuggestion | null> {
  const activeProjects = projects.filter(p => p.active)
  
  const prompt = window.spark.llmPrompt`Du bist ein Assistent für Zeiterfassung. Analysiere diesen Kalendertermin und schlage vor, wie er als Zeiteintrag gebucht werden sollte.

KALENDERTERMIN:
Titel: "${eventTitle}"
Zeit: ${eventTime.start} bis ${eventTime.end}
${eventLocation ? `Ort: ${eventLocation}` : ''}

VERFÜGBARE PROJEKTE:
${activeProjects.map(p => `- ${p.name}${p.description ? ': ' + p.description : ''}`).join('\n')}

AUFGABE:
Analysiere den Kalendertitel und Ort, um zu ermitteln:
1. Welches Projekt passt am besten?
2. Wie viel Zeit sollte gebucht werden?
3. Wie sicher bist du (high/medium/low)?

Beispiel: "Kurita Showroom Meeting" → Projekt "Kurita", 1.5h, high confidence

Antworte als JSON-Objekt mit einer "suggestion" Property:
{
  "suggestion": {
    "calendarTitle": "${eventTitle}",
    "suggestedProject": "Projektname",
    "suggestedDuration": "1.5h",
    "confidence": "high",
    "reasoning": "Erklärung warum dieser Vorschlag passt"
  }
}`

  try {
    const response = await window.spark.llm(prompt, 'gpt-4o-mini', true)
    const result = JSON.parse(response)
    return result.suggestion || null
  } catch (error) {
    console.error('Error analyzing calendar event:', error)
    return null
  }
}

function buildContextDescription(
  context: ContextSignals,
  projectUsage: any[],
  timePatterns: any,
  locationPatterns: Map<string, any>
): string {
  const parts: string[] = []
  
  if (context.title) {
    parts.push(`Titel/Notiz: "${context.title}"`)
  }
  
  if (context.notes) {
    parts.push(`Zusätzliche Notizen: "${context.notes}"`)
  }
  
  if (context.calendarEvent) {
    parts.push(`Kalendertermin: "${context.calendarEvent.title}"`)
    parts.push(`Zeit: ${context.calendarEvent.startTime} - ${context.calendarEvent.endTime}`)
    if (context.calendarEvent.location) {
      parts.push(`Ort: ${context.calendarEvent.location}`)
    }
    if (context.calendarEvent.attendees && context.calendarEvent.attendees.length > 0) {
      parts.push(`Teilnehmer: ${context.calendarEvent.attendees.join(', ')}`)
    }
  }
  
  if (context.location) {
    parts.push(`Aktueller Standort: ${context.location}`)
    
    const locationHistory = locationPatterns.get(context.location)
    if (locationHistory) {
      parts.push(`Standort-Historie: An diesem Ort wurden ${locationHistory.count} Einträge erfasst, meist für Projekt "${locationHistory.mostCommonProject}"`)
    }
  }
  
  if (context.usedApps && context.usedApps.length > 0) {
    parts.push(`Genutzte Apps: ${context.usedApps.join(', ')}`)
  }
  
  if (context.usedWebsites && context.usedWebsites.length > 0) {
    parts.push(`Besuchte Webseiten: ${context.usedWebsites.join(', ')}`)
  }
  
  if (context.timeOfDay) {
    parts.push(`Tageszeit: ${context.timeOfDay}`)
    
    const timePattern = timePatterns[context.timeOfDay]
    if (timePattern) {
      parts.push(`Typischerweise um diese Zeit: ${timePattern.mostCommonProject}`)
    }
  }
  
  if (context.dayOfWeek) {
    parts.push(`Wochentag: ${context.dayOfWeek}`)
  }
  
  return parts.join('\n')
}

function getRecentProjectUsage(entries: TimeEntry[], employeeId: string, days: number) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]
  
  const recentEntries = entries.filter(
    e => e.employeeId === employeeId && e.date >= cutoffStr
  )
  
  const projectStats = new Map<string, { count: number; totalHours: number; projectName: string }>()
  
  recentEntries.forEach(entry => {
    const existing = projectStats.get(entry.projectId) || {
      count: 0,
      totalHours: 0,
      projectName: entry.projectId
    }
    
    existing.count++
    existing.totalHours += entry.duration / 60
    projectStats.set(entry.projectId, existing)
  })
  
  return Array.from(projectStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function analyzeTimePatterns(entries: TimeEntry[], employeeId: string) {
  const patterns: Record<string, { count: number; mostCommonProject: string }> = {
    morning: { count: 0, mostCommonProject: '' },
    afternoon: { count: 0, mostCommonProject: '' },
    evening: { count: 0, mostCommonProject: '' }
  }
  
  const employeeEntries = entries.filter(e => e.employeeId === employeeId)
  
  employeeEntries.forEach(entry => {
    const hour = parseInt(entry.startTime.split(':')[0])
    let period = 'morning'
    
    if (hour >= 6 && hour < 12) period = 'morning'
    else if (hour >= 12 && hour < 18) period = 'afternoon'
    else period = 'evening'
    
    patterns[period].count++
  })
  
  return patterns
}

function analyzeLocationPatterns(entries: TimeEntry[], employeeId: string) {
  const locationMap = new Map<string, { count: number; mostCommonProject: string; projectCounts: Map<string, number> }>()
  
  entries
    .filter(e => e.employeeId === employeeId && e.location)
    .forEach(entry => {
      const loc = entry.location!
      const existing = locationMap.get(loc) || {
        count: 0,
        mostCommonProject: '',
        projectCounts: new Map<string, number>()
      }
      
      existing.count++
      existing.projectCounts.set(
        entry.projectId,
        (existing.projectCounts.get(entry.projectId) || 0) + 1
      )
      
      const sorted = Array.from(existing.projectCounts.entries()).sort((a, b) => b[1] - a[1])
      if (sorted.length > 0) {
        existing.mostCommonProject = sorted[0][0]
      }
      
      locationMap.set(loc, existing)
    })
  
  return locationMap
}

export function extractProjectKeywords(projects: Project[]): Map<string, string[]> {
  const keywordMap = new Map<string, string[]>()
  
  projects.forEach(project => {
    const keywords: string[] = []
    
    const words = project.name.toLowerCase().split(/[\s\-_]+/)
    keywords.push(...words)
    
    if (project.description) {
      const descWords = project.description.toLowerCase().split(/[\s\-_,\.]+/)
      keywords.push(...descWords.filter(w => w.length > 3))
    }
    
    if (project.code) {
      keywords.push(project.code.toLowerCase())
    }
    
    keywordMap.set(project.id, [...new Set(keywords)])
  })
  
  return keywordMap
}

export function findProjectByKeywordMatch(
  text: string,
  projects: Project[],
  keywordMap: Map<string, string[]>
): { projectId: string; confidence: number } | null {
  const textLower = text.toLowerCase()
  const matches: Array<{ projectId: string; score: number }> = []
  
  projects.forEach(project => {
    const keywords = keywordMap.get(project.id) || []
    let score = 0
    
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        score += keyword.length
      }
    })
    
    if (score > 0) {
      matches.push({ projectId: project.id, score })
    }
  })
  
  if (matches.length === 0) return null
  
  matches.sort((a, b) => b.score - a.score)
  const best = matches[0]
  
  const confidence = Math.min(100, (best.score / text.length) * 200)
  
  return {
    projectId: best.projectId,
    confidence: Math.round(confidence)
  }
}
