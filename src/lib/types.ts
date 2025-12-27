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
