import { 
  Employee, 
  Project, 
  TimeEntry, 
  MileageEntry,
  LegacyEmployee,
  LegacyProject,
  LegacyTimeEntry,
  LegacyMileageEntry,
  UserRole,
  ApprovalStatus,
  AuditMetadata
} from './types'

const DEFAULT_TENANT_ID = 'default-tenant'

function createAuditMetadata(userId: string = 'system', createdAt?: string): AuditMetadata {
  return {
    createdBy: userId,
    createdAt: createdAt || new Date().toISOString(),
  }
}

export function migrateLegacyEmployee(legacy: LegacyEmployee, tenantId: string = DEFAULT_TENANT_ID): Employee {
  return {
    ...legacy,
    tenantId,
    role: UserRole.EMPLOYEE,
    active: true,
    audit: createAuditMetadata('migration', (legacy as any).createdAt)
  }
}

export function migrateLegacyProject(legacy: LegacyProject, tenantId: string = DEFAULT_TENANT_ID): Project {
  return {
    id: legacy.id,
    tenantId,
    name: legacy.name,
    description: legacy.description,
    clientId: (legacy as any).client,
    active: true,
    audit: createAuditMetadata('migration', (legacy as any).createdAt)
  }
}

export function migrateLegacyTimeEntry(legacy: LegacyTimeEntry, tenantId: string = DEFAULT_TENANT_ID): TimeEntry {
  const startDate = new Date(`${legacy.date}T${legacy.startTime}`)
  const endDate = new Date(`${legacy.date}T${legacy.endTime}`)
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  
  return {
    ...legacy,
    tenantId,
    duration,
    billable: legacy.billable ?? true,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    audit: createAuditMetadata('migration', (legacy as any).createdAt),
    changeLog: []
  }
}

export function migrateLegacyMileageEntry(legacy: LegacyMileageEntry, tenantId: string = DEFAULT_TENANT_ID): MileageEntry {
  return {
    ...legacy,
    tenantId,
    approvalStatus: ApprovalStatus.DRAFT,
    locked: false,
    audit: createAuditMetadata('migration', (legacy as any).createdAt),
    changeLog: []
  }
}

export async function migrateAllData(spark: any) {
  const employees = await spark.kv.get<LegacyEmployee[]>('employees') || []
  const projects = await spark.kv.get<LegacyProject[]>('projects') || []
  const timeEntries = await spark.kv.get<LegacyTimeEntry[]>('timeEntries') || []
  const mileageEntries = await spark.kv.get<LegacyMileageEntry[]>('mileageEntries') || []

  const migratedEmployees = employees.map(e => migrateLegacyEmployee(e))
  const migratedProjects = projects.map(p => migrateLegacyProject(p))
  const migratedTimeEntries = timeEntries.map(t => migrateLegacyTimeEntry(t))
  const migratedMileageEntries = mileageEntries.map(m => migrateLegacyMileageEntry(m))

  await spark.kv.set('employees_v2', migratedEmployees)
  await spark.kv.set('projects_v2', migratedProjects)
  await spark.kv.set('timeEntries_v2', migratedTimeEntries)
  await spark.kv.set('mileageEntries_v2', migratedMileageEntries)
  await spark.kv.set('migration_completed', true)

  return {
    employees: migratedEmployees,
    projects: migratedProjects,
    timeEntries: migratedTimeEntries,
    mileageEntries: migratedMileageEntries
  }
}
