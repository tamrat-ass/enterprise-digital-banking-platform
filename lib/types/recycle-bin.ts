/**
 * Recycle Bin Types
 * Enterprise-grade soft delete system types and interfaces
 */

export type DocumentStatus = 'active' | 'deleted' | 'archived'
export type SoftDeleteAction = 'delete' | 'restore' | 'permanent_delete'

export interface SoftDeletedDocument {
  id: string
  title: string
  description: string | null
  category: string
  departmentId: string | null
  divisionId: string | null
  status: DocumentStatus
  currentVersion: number
  tags: string[]
  ownerId: string
  ownerName: string | null
  accessLevel: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  deletedBy: string | null
  originalStatus: string | null
}

export interface RecycleBinAuditLog {
  id: string
  entityType: string
  entityId: string
  userId: string
  action: SoftDeleteAction
  timestamp: Date
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, any>
  createdAt: Date
}

export interface RecycleBinRetentionPolicy {
  id: string
  daysBeforePermanentDelete: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RestoreOptions {
  fileId: string
  parentId?: string // Optional: restore to specific parent
  keepHistory?: boolean // Keep the soft delete audit trail
}

export interface RecycleBinQueryParams {
  page: number
  limit: number
  sortBy?: 'deletedAt' | 'title' | 'deletedBy' | 'size'
  sortOrder?: 'asc' | 'desc'
  search?: string
  deletedByUserId?: string
  category?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface RecycleBinResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SoftDeleteResult {
  success: boolean
  message: string
  auditId: string
  deletedAt: Date
}

export interface PermanentDeleteResult {
  success: boolean
  message: string
  auditId: string
  physicalFilesDeleted: number
  databaseRecordsDeleted: number
}

export interface RestoreResult {
  success: boolean
  message: string
  auditId: string
  restoredAt: Date
}

export interface BulkOperation {
  fileIds: string[]
  action: 'restore' | 'permanent_delete'
  reason?: string
}

export interface BulkOperationResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  errors: Array<{
    fileId: string
    error: string
  }>
  auditIds: string[]
}
