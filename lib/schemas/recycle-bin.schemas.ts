/**
 * Zod schemas for Recycle Bin validation
 * Enterprise-grade request/response validation
 */

import { z } from 'zod'

// Recycle bin query validation
export const recycleBinQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['deletedAt', 'title', 'deletedBy', 'size']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  deletedByUserId: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

export type RecycleBinQueryInput = z.infer<typeof recycleBinQuerySchema>

// Restore file validation
export const restoreFileSchema = z.object({
  fileId: z.string().min(1),
  parentId: z.string().optional(),
  keepHistory: z.boolean().default(true),
})

export type RestoreFileInput = z.infer<typeof restoreFileSchema>

// Permanent delete validation
export const permanentDeleteSchema = z.object({
  fileId: z.string().min(1),
  reason: z.string().max(500).optional(),
  confirmDelete: z.boolean().refine(val => val === true, {
    message: 'Must confirm permanent deletion',
  }),
})

export type PermanentDeleteInput = z.infer<typeof permanentDeleteSchema>

// Bulk operations validation
export const bulkOperationSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(['restore', 'permanent_delete']),
  reason: z.string().max(500).optional(),
  confirmDelete: z.boolean().optional(),
})

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>

// Retention policy validation
export const retentionPolicySchema = z.object({
  daysBeforePermanentDelete: z.number().int().min(1).max(365).default(30),
  enabled: z.boolean().default(true),
})

export type RetentionPolicyInput = z.infer<typeof retentionPolicySchema>

// Soft delete audit filter
export const auditLogFilterSchema = z.object({
  entityId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['delete', 'restore', 'permanent_delete']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>
