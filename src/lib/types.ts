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
  notes?: string
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
  notes?: string
  isPaused: boolean
}

export interface TimeTemplate {
  id: string
  name: string
  employeeId: string
  projectId: string
  duration?: number
  notes?: string
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
