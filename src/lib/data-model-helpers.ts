import { 
  AuditMetadata, 
  ChangeLogEntry,
  TimeEntry,
  MileageEntry,
  ApprovalStatus
} from './types'

export function createAuditMetadata(userId: string, device?: string): AuditMetadata {
  return {
    createdBy: userId,
    createdAt: new Date().toISOString(),
    device
  }
}

export function updateAuditMetadata(existing: AuditMetadata, userId: string, device?: string): AuditMetadata {
  return {
    ...existing,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
    device
  }
}

export function createChangeLogEntry(
  userId: string,
  before: Record<string, any>,
  after: Record<string, any>,
  reason?: string,
  device?: string
): ChangeLogEntry {
  return {
    timestamp: new Date().toISOString(),
    userId,
    before,
    after,
    reason,
    device
  }
}

export function canEditEntry(
  entry: TimeEntry | MileageEntry,
  userRole: string
): boolean {
  if (entry.locked) {
    return false
  }
  
  if (entry.approvalStatus === ApprovalStatus.APPROVED) {
    return false
  }
  
  if (userRole === 'admin' || userRole === 'project_manager') {
    return true
  }
  
  return entry.approvalStatus === ApprovalStatus.DRAFT
}

export function canApproveEntry(
  userRole: string
): boolean {
  return userRole === 'admin' || userRole === 'project_manager'
}

export function calculateDuration(startTime: string, endTime: string, date: string): number {
  const start = new Date(`${date}T${startTime}`)
  const end = new Date(`${date}T${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

export function getApplicableRate(
  rates: Array<{
    employeeId?: string
    projectId?: string
    taskId?: string
    hourlyRate: number
    validFrom: string
    validTo?: string
  }>,
  employeeId: string,
  projectId: string,
  taskId: string | undefined,
  date: string
): number | undefined {
  const dateObj = new Date(date)
  
  const applicableRates = rates.filter(rate => {
    const validFrom = new Date(rate.validFrom)
    const validTo = rate.validTo ? new Date(rate.validTo) : null
    
    const dateValid = dateObj >= validFrom && (!validTo || dateObj <= validTo)
    
    if (!dateValid) return false
    
    if (rate.taskId && rate.taskId === taskId) return true
    if (rate.projectId && rate.projectId === projectId && !rate.taskId) return true
    if (rate.employeeId && rate.employeeId === employeeId && !rate.projectId && !rate.taskId) return true
    
    return false
  })
  
  applicableRates.sort((a, b) => {
    if (a.taskId && !b.taskId) return -1
    if (!a.taskId && b.taskId) return 1
    if (a.projectId && !b.projectId) return -1
    if (!a.projectId && b.projectId) return 1
    return 0
  })
  
  return applicableRates[0]?.hourlyRate
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount)
}

export function getUserDisplayName(userId: string, employees: Array<{ id: string; name: string }>): string {
  return employees.find(e => e.id === userId)?.name || userId
}
