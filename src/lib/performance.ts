import { TimeEntry, MileageEntry, Employee, Project } from './types'

export interface CachedAggregation {
  key: string
  timestamp: number
  ttl: number
  data: any
}

export interface FilterOptions {
  dateFrom?: string
  dateTo?: string
  employeeIds?: string[]
  projectIds?: string[]
  billable?: boolean
}

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, CachedAggregation>()

export class PerformanceHelper {
  static clearCache() {
    cache.clear()
  }

  static getCached<T>(key: string): T | null {
    const cached = cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  static setCache(key: string, data: any, ttl: number = CACHE_TTL) {
    cache.set(key, {
      key,
      timestamp: Date.now(),
      ttl,
      data
    })
  }

  static aggregateByEmployee(
    entries: TimeEntry[],
    employees: Employee[],
    filters?: FilterOptions
  ): Map<string, { hours: number; billableHours: number; entries: number }> {
    const cacheKey = `agg-emp-${JSON.stringify(filters)}`
    const cached = this.getCached<Map<string, any>>(cacheKey)
    if (cached) return cached

    const filtered = this.filterEntries(entries, filters)
    const result = new Map()

    for (const entry of filtered) {
      const existing = result.get(entry.employeeId) || { hours: 0, billableHours: 0, entries: 0 }
      existing.hours += entry.duration
      existing.billableHours += entry.billable ? entry.duration : 0
      existing.entries += 1
      result.set(entry.employeeId, existing)
    }

    this.setCache(cacheKey, result)
    return result
  }

  static aggregateByProject(
    entries: TimeEntry[],
    projects: Project[],
    filters?: FilterOptions
  ): Map<string, { hours: number; billableHours: number; entries: number; cost?: number }> {
    const cacheKey = `agg-proj-${JSON.stringify(filters)}`
    const cached = this.getCached<Map<string, any>>(cacheKey)
    if (cached) return cached

    const filtered = this.filterEntries(entries, filters)
    const result = new Map()

    for (const entry of filtered) {
      const existing = result.get(entry.projectId) || { hours: 0, billableHours: 0, entries: 0, cost: 0 }
      existing.hours += entry.duration
      existing.billableHours += entry.billable ? entry.duration : 0
      existing.entries += 1
      if (entry.rate) {
        existing.cost = (existing.cost || 0) + (entry.duration * entry.rate)
      }
      result.set(entry.projectId, existing)
    }

    this.setCache(cacheKey, result)
    return result
  }

  static aggregateByDate(
    entries: TimeEntry[],
    filters?: FilterOptions
  ): Map<string, { hours: number; billableHours: number; entries: number }> {
    const cacheKey = `agg-date-${JSON.stringify(filters)}`
    const cached = this.getCached<Map<string, any>>(cacheKey)
    if (cached) return cached

    const filtered = this.filterEntries(entries, filters)
    const result = new Map()

    for (const entry of filtered) {
      const existing = result.get(entry.date) || { hours: 0, billableHours: 0, entries: 0 }
      existing.hours += entry.duration
      existing.billableHours += entry.billable ? entry.duration : 0
      existing.entries += 1
      result.set(entry.date, existing)
    }

    this.setCache(cacheKey, result)
    return result
  }

  static paginateEntries<T>(
    entries: T[],
    page: number,
    pageSize: number = 50
  ): { data: T[]; total: number; pages: number; page: number } {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    return {
      data: entries.slice(start, end),
      total: entries.length,
      pages: Math.ceil(entries.length / pageSize),
      page
    }
  }

  static filterEntries(entries: TimeEntry[], filters?: FilterOptions): TimeEntry[] {
    if (!filters) return entries

    return entries.filter(entry => {
      if (filters.dateFrom && entry.date < filters.dateFrom) return false
      if (filters.dateTo && entry.date > filters.dateTo) return false
      if (filters.employeeIds && filters.employeeIds.length > 0) {
        if (!filters.employeeIds.includes(entry.employeeId)) return false
      }
      if (filters.projectIds && filters.projectIds.length > 0) {
        if (!filters.projectIds.includes(entry.projectId)) return false
      }
      if (filters.billable !== undefined && entry.billable !== filters.billable) return false
      return true
    })
  }

  static indexEntries(entries: TimeEntry[]): {
    byEmployee: Map<string, TimeEntry[]>
    byProject: Map<string, TimeEntry[]>
    byDate: Map<string, TimeEntry[]>
  } {
    const byEmployee = new Map<string, TimeEntry[]>()
    const byProject = new Map<string, TimeEntry[]>()
    const byDate = new Map<string, TimeEntry[]>()

    for (const entry of entries) {
      if (!byEmployee.has(entry.employeeId)) {
        byEmployee.set(entry.employeeId, [])
      }
      byEmployee.get(entry.employeeId)!.push(entry)

      if (!byProject.has(entry.projectId)) {
        byProject.set(entry.projectId, [])
      }
      byProject.get(entry.projectId)!.push(entry)

      if (!byDate.has(entry.date)) {
        byDate.set(entry.date, [])
      }
      byDate.get(entry.date)!.push(entry)
    }

    return { byEmployee, byProject, byDate }
  }

  static getPerformanceMetrics(): {
    cacheSize: number
    cachedKeys: string[]
    entriesInCache: number
  } {
    let entriesInCache = 0
    const cachedKeys: string[] = []

    cache.forEach((value, key) => {
      cachedKeys.push(key)
      if (value.data instanceof Map) {
        entriesInCache += value.data.size
      } else if (Array.isArray(value.data)) {
        entriesInCache += value.data.length
      }
    })

    return {
      cacheSize: cache.size,
      cachedKeys,
      entriesInCache
    }
  }

  static optimizeForLargeDataset<T>(
    data: T[],
    operation: (batch: T[]) => void,
    batchSize: number = 1000
  ): void {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      operation(batch)
      
      if (i % (batchSize * 10) === 0 && i > 0) {
        console.log(`Processed ${i} of ${data.length} items...`)
      }
    }
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  static memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key)!
      }
      const result = func(...args)
      cache.set(key, result)
      return result
    }) as T
  }

  static async processLargeDatasetAsync<T, R>(
    data: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 100,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(processor))
      results.push(...batchResults)
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, data.length), data.length)
      }
    }
    
    return results
  }

  static calculateStats(entries: TimeEntry[]): {
    total: number
    totalHours: number
    billableHours: number
    avgDuration: number
    minDuration: number
    maxDuration: number
  } {
    if (entries.length === 0) {
      return {
        total: 0,
        totalHours: 0,
        billableHours: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0
      }
    }

    const totalHours = entries.reduce((sum, e) => sum + e.duration, 0)
    const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0)
    const durations = entries.map(e => e.duration)

    return {
      total: entries.length,
      totalHours,
      billableHours,
      avgDuration: totalHours / entries.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    }
  }
}

export function useLazyLoad<T>(
  data: T[],
  initialBatchSize: number = 50,
  incrementSize: number = 25
) {
  let currentSize = initialBatchSize

  const loadMore = () => {
    currentSize += incrementSize
    return data.slice(0, currentSize)
  }

  const hasMore = () => currentSize < data.length

  return {
    currentData: data.slice(0, currentSize),
    loadMore,
    hasMore,
    totalCount: data.length,
    loadedCount: Math.min(currentSize, data.length)
  }
}
