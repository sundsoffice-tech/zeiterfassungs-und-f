export interface Employee {
  id: string
  name: string
  email?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  client?: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  projectId: string
  date: string
  startTime: string
  endTime: string
  task?: string
  subtask?: string
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable?: boolean
  createdAt: string
  isFavorite?: boolean
}

export interface ActiveTimer {
  id: string
  employeeId: string
  projectId: string
  startTime: number
  pausedAt?: number
  pausedDuration: number
  task?: string
  subtask?: string
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable?: boolean
  isPaused: boolean
}

export interface TimeTemplate {
  id: string
  name: string
  employeeId: string
  projectId: string
  duration?: number
  task?: string
  subtask?: string
  tags?: string[]
  location?: string
  notes?: string
  costCenter?: string
  billable?: boolean
  isFavorite: boolean
  lastUsed: string
}

export interface MileageEntry {
  id: string
  employeeId: string
  date: string
  startLocation: string
  endLocation: string
  distance: number
  purpose: string
  createdAt: string
}
