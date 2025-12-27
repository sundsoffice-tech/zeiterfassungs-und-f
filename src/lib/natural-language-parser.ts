import { Project } from './types'

export interface ParsedTimeEntry {
  startTime: string
  endTime: string
  duration?: number
  projectName: string
  notes?: string
  isValid: boolean
  errors: string[]
  lineNumber: number
  originalText: string
}

export interface ParserResult {
  entries: ParsedTimeEntry[]
  hasErrors: boolean
  validCount: number
  errorCount: number
}

function normalizeTime(timeStr: string): string | null {
  const cleanTime = timeStr.trim().replace(/[.:]/g, ':')
  
  const hourOnlyMatch = cleanTime.match(/^(\d{1,2})$/)
  if (hourOnlyMatch) {
    const hour = parseInt(hourOnlyMatch[1])
    if (hour >= 0 && hour <= 23) {
      return `${hour.toString().padStart(2, '0')}:00`
    }
  }
  
  const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/)
  if (timeMatch) {
    const hour = parseInt(timeMatch[1])
    const minute = parseInt(timeMatch[2])
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }
  }
  
  return null
}

function parseDuration(durationStr: string): number | null {
  const match = durationStr.match(/^(\d+(?:\.\d+)?)[hH]?$/)
  if (match) {
    const hours = parseFloat(match[1])
    if (hours > 0 && hours <= 24) {
      return hours
    }
  }
  return null
}

function fuzzyMatchProject(projectName: string, projects: Project[]): Project | null {
  const searchName = projectName.toLowerCase().trim()
  
  const exactMatch = projects.find(p => p.name.toLowerCase() === searchName)
  if (exactMatch) return exactMatch
  
  const codeMatch = projects.find(p => p.code?.toLowerCase() === searchName)
  if (codeMatch) return codeMatch
  
  const startsWithMatch = projects.find(p => p.name.toLowerCase().startsWith(searchName))
  if (startsWithMatch) return startsWithMatch
  
  const containsMatch = projects.find(p => p.name.toLowerCase().includes(searchName))
  if (containsMatch) return containsMatch
  
  return null
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes + endMinutes) / 60
  }
  
  return (endMinutes - startMinutes) / 60
}

function parseTimeLine(line: string, lineNumber: number, projects: Project[]): ParsedTimeEntry {
  const originalText = line
  const errors: string[] = []
  let startTime = ''
  let endTime = ''
  let duration: number | undefined
  let projectName = ''
  let notes: string | undefined
  
  const timeRangePattern = /^(\d{1,2}(?:[:.]\d{2})?)\s*-\s*(\d{1,2}(?:[:.]\d{2})?)\s+(.+)$/
  const durationPattern = /^(\d+(?:\.\d+)?)[hH]\s+(.+)$/
  
  const timeRangeMatch = line.match(timeRangePattern)
  if (timeRangeMatch) {
    const [, start, end, rest] = timeRangeMatch
    
    const normalizedStart = normalizeTime(start)
    const normalizedEnd = normalizeTime(end)
    
    if (!normalizedStart) {
      errors.push(`Ungültiges Startzeit-Format: "${start}"`)
    } else {
      startTime = normalizedStart
    }
    
    if (!normalizedEnd) {
      errors.push(`Ungültiges Endzeit-Format: "${end}"`)
    } else {
      endTime = normalizedEnd
    }
    
    if (normalizedStart && normalizedEnd) {
      const startMinutes = timeToMinutes(normalizedStart)
      const endMinutes = timeToMinutes(normalizedEnd)
      
      if (startMinutes >= endMinutes) {
        errors.push('Startzeit muss vor der Endzeit liegen')
      } else {
        duration = calculateDuration(normalizedStart, normalizedEnd)
      }
    }
    
    const notesMatch = rest.match(/^(.+?)(?:\s*[:-]\s*(.+))?$/)
    if (notesMatch) {
      projectName = notesMatch[1].trim()
      notes = notesMatch[2]?.trim()
    }
  } else {
    const durationMatch = line.match(durationPattern)
    if (durationMatch) {
      const [, dur, rest] = durationMatch
      
      const parsedDuration = parseDuration(dur)
      if (!parsedDuration) {
        errors.push(`Ungültige Dauer: "${dur}"`)
      } else {
        duration = parsedDuration
      }
      
      const notesMatch = rest.match(/^(.+?)(?:\s*[:-]\s*(.+))?$/)
      if (notesMatch) {
        projectName = notesMatch[1].trim()
        notes = notesMatch[2]?.trim()
      }
    } else {
      errors.push('Ungültiges Format. Verwenden Sie: "8-12 Projekt" oder "2h Projekt"')
    }
  }
  
  if (projectName) {
    const matchedProject = fuzzyMatchProject(projectName, projects)
    if (!matchedProject) {
      errors.push(`Projekt "${projectName}" nicht gefunden`)
    }
  } else if (errors.length === 0) {
    errors.push('Projektname fehlt')
  }
  
  return {
    startTime,
    endTime,
    duration,
    projectName,
    notes,
    isValid: errors.length === 0,
    errors,
    lineNumber,
    originalText
  }
}

export function parseNaturalLanguageInput(input: string, projects: Project[]): ParserResult {
  const lines = input
    .split(/[,\n]/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const entries = lines.map((line, index) => parseTimeLine(line, index + 1, projects))
  
  const hasOverlaps = checkForOverlaps(entries.filter(e => e.isValid && e.startTime && e.endTime))
  
  const validCount = entries.filter(e => e.isValid).length
  const errorCount = entries.filter(e => !e.isValid).length
  
  return {
    entries,
    hasErrors: errorCount > 0 || hasOverlaps,
    validCount,
    errorCount
  }
}

function checkForOverlaps(entries: ParsedTimeEntry[]): boolean {
  const sorted = [...entries]
    .filter(e => e.startTime && e.endTime)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    
    const currentEnd = timeToMinutes(current.endTime)
    const nextStart = timeToMinutes(next.startTime)
    
    if (currentEnd > nextStart) {
      current.errors.push('Überschneidung mit nachfolgendem Eintrag')
      next.errors.push('Überschneidung mit vorherigem Eintrag')
      current.isValid = false
      next.isValid = false
    }
  }
  
  return sorted.some(e => !e.isValid)
}
