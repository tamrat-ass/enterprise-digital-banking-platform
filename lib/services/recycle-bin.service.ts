/**
 * Recycle Bin Service
 * Enterprise-grade soft delete functionality
 * Handles soft deletes, restores, permanent deletes, and audit logging
 */

import { db } from '@/lib/db'
import { documents, documentVersions, documentShares } from '@/lib/db/schema'
import { eq, isNull, isNotNull, and, or, desc, asc, ilike, gte, lte, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { FileStorageService } from './file-storage.service'
import { recordAudit } from '@/lib/audit'
import {
  SoftDeletedDocument,
  RecycleBinAuditLog,
  RecycleBinRetentionPolicy,
  SoftDeleteResult,
  PermanentDeleteResult,
  RestoreResult,
  BulkOperationResult,
  RecycleBinQueryParams,
  RestoreOptions,
  DocumentStatus,
} from '@/lib/types/recycle-bin'

export class RecycleBinService {
  /**
   * Soft delete a document
   * Marks document as deleted without removing from storage
   */
  static async softDeleteDocument(
    documentId: string,
    userId: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<SoftDeleteResult> {
    const auditId = crypto.randomUUID()
    const now = new Date()

    try {
      console.log('[RecycleBinService] Soft deleting document:', { documentId, userId })

      // Begin transaction-like operations
      // 1. Get document details
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)

      if (!doc.length) {
        throw new Error(`Document not found: ${documentId}`)
      }

      const document = doc[0]

      // 2. Update document status
      await db
        .update(documents)
        .set({
          status: 'deleted' as any,
          deletedAt: now,
          deletedBy: userId,
          originalStatus: document.status,
          updatedAt: now,
        })
        .where(eq(documents.id, documentId))

      // 3. Record audit log
      await this.recordSoftDeleteAudit(
        auditId,
        documentId,
        userId,
        'delete',
        ipAddress,
        userAgent,
        {
          documentTitle: document.title,
          originalStatus: document.status,
          reason: reason || 'User initiated soft delete',
        }
      )

      // 4. General audit trail
      await recordAudit({
        userId,
        actorName: userName,
        action: 'document.soft_delete',
        entityType: 'document',
        entityId: documentId,
        module: 'recycle-bin',
        details: `Soft deleted document: ${document.title}`,
      })

      console.log('[RecycleBinService] Document soft deleted successfully:', auditId)

      return {
        success: true,
        message: `Document "${document.title}" moved to Recycle Bin`,
        auditId,
        deletedAt: now,
      }
    } catch (err) {
      console.error('[RecycleBinService] Error soft deleting document:', err)
      throw err
    }
  }

  /**
   * Restore a soft-deleted document
   */
  static async restoreDocument(
    documentId: string,
    userId: string,
    userName: string,
    options: RestoreOptions = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<RestoreResult> {
    const auditId = crypto.randomUUID()
    const now = new Date()

    try {
      console.log('[RecycleBinService] Restoring document:', { documentId, userId })

      // 1. Get document details
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)

      if (!doc.length) {
        throw new Error(`Document not found: ${documentId}`)
      }

      const document = doc[0]

      if (document.status !== 'deleted') {
        throw new Error(`Document is not in Recycle Bin. Current status: ${document.status}`)
      }

      // 2. Get original status (default to 'approved')
      const restoredStatus = document.originalStatus || 'approved'

      // 3. Update document to restore
      await db
        .update(documents)
        .set({
          status: restoredStatus as any,
          deletedAt: null,
          deletedBy: null,
          originalStatus: null,
          updatedAt: now,
        })
        .where(eq(documents.id, documentId))

      // 4. Record audit log
      await this.recordSoftDeleteAudit(
        auditId,
        documentId,
        userId,
        'restore',
        ipAddress,
        userAgent,
        {
          documentTitle: document.title,
          restoredStatus,
          keepHistory: options.keepHistory !== false,
        }
      )

      // 5. General audit trail
      await recordAudit({
        userId,
        actorName: userName,
        action: 'document.restore',
        entityType: 'document',
        entityId: documentId,
        module: 'recycle-bin',
        details: `Restored document: ${document.title}`,
      })

      console.log('[RecycleBinService] Document restored successfully:', auditId)

      return {
        success: true,
        message: `Document "${document.title}" restored from Recycle Bin`,
        auditId,
        restoredAt: now,
      }
    } catch (err) {
      console.error('[RecycleBinService] Error restoring document:', err)
      throw err
    }
  }

  /**
   * Permanently delete a document
   * Removes from database and deletes physical files
   */
  static async permanentlyDeleteDocument(
    documentId: string,
    userId: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<PermanentDeleteResult> {
    const auditId = crypto.randomUUID()

    try {
      console.log('[RecycleBinService] Permanently deleting document:', { documentId, userId })

      // 1. Get document details
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)

      if (!doc.length) {
        throw new Error(`Document not found: ${documentId}`)
      }

      const document = doc[0]

      // 2. Get all versions to delete physical files
      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))

      let deletedFilesCount = 0

      // 3. Delete physical files from storage
      for (const version of versions) {
        try {
          if (version.filePath) {
            await FileStorageService.deleteFile(version.filePath)
            deletedFilesCount++
            console.log('[RecycleBinService] Deleted file:', version.filePath)
          }
          if (version.pdfPath) {
            await FileStorageService.deleteFile(version.pdfPath)
            deletedFilesCount++
            console.log('[RecycleBinService] Deleted PDF:', version.pdfPath)
          }
        } catch (fileErr) {
          console.warn('[RecycleBinService] Warning deleting file:', fileErr)
          // Continue with other deletions even if one fails
        }
      }

      // 4. Delete all associated records first (versions, shares, etc.)
      console.log('[RecycleBinService] Deleting document versions...')
      await db.delete(documentVersions).where(eq(documentVersions.documentId, documentId))
      
      console.log('[RecycleBinService] Deleting document shares...')
      try {
        await db.delete(documentShares).where(eq(documentShares.documentId, documentId))
      } catch (err) {
        console.warn('[RecycleBinService] Warning deleting document shares:', err)
      }
      
      // 5. Delete the document record
      console.log('[RecycleBinService] Deleting document record...')
      const deleteResult = await db.delete(documents).where(eq(documents.id, documentId))
      console.log('[RecycleBinService] Delete result:', deleteResult)

      // 5. Record audit log
      await this.recordSoftDeleteAudit(
        auditId,
        documentId,
        userId,
        'permanent_delete',
        ipAddress,
        userAgent,
        {
          documentTitle: document.title,
          versionsDeleted: versions.length,
          physicalFilesDeleted: deletedFilesCount,
          reason: reason || 'Automatic or user-initiated permanent deletion',
        }
      )

      // 6. General audit trail
      await recordAudit({
        userId,
        actorName: userName,
        action: 'document.permanent_delete',
        entityType: 'document',
        entityId: documentId,
        module: 'recycle-bin',
        details: `Permanently deleted document: ${document.title}`,
      })

      console.log('[RecycleBinService] Document permanently deleted:', auditId)

      return {
        success: true,
        message: `Document "${document.title}" permanently deleted`,
        auditId,
        physicalFilesDeleted: deletedFilesCount,
        databaseRecordsDeleted: 2 + versions.length, // document + shares record + versions
      }
    } catch (err) {
      console.error('[RecycleBinService] Error permanently deleting document:', err)
      throw err
    }
  }

  /**
   * Get all soft-deleted documents with pagination and filtering
   */
  static async getRecycleBinDocuments(
    params: RecycleBinQueryParams
  ): Promise<{
    documents: SoftDeletedDocument[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }> {
    try {
      console.log('[RecycleBinService] Fetching recycle bin documents:', params)

      const offset = (params.page - 1) * params.limit

      // Build where conditions
      const whereConditions: any[] = [isNotNull(documents.deletedAt)]

      if (params.search) {
        whereConditions.push(ilike(documents.title, `%${params.search}%`))
      }

      if (params.deletedByUserId) {
        whereConditions.push(eq(documents.deletedBy, params.deletedByUserId))
      }

      if (params.category) {
        whereConditions.push(eq(documents.category, params.category))
      }

      if (params.dateFrom) {
        whereConditions.push(gte(documents.deletedAt, params.dateFrom))
      }

      if (params.dateTo) {
        whereConditions.push(lte(documents.deletedAt, params.dateTo))
      }

      const where = and(...whereConditions)

      // Determine sort order
      let orderBy: any = desc(documents.deletedAt) // Default: newest first

      if (params.sortBy) {
        const sortDirection = params.sortOrder === 'asc' ? asc : desc

        switch (params.sortBy) {
          case 'title':
            orderBy = sortDirection(documents.title)
            break
          case 'deletedBy':
            orderBy = sortDirection(documents.deletedBy)
            break
          case 'deletedAt':
            orderBy = sortDirection(documents.deletedAt)
            break
        }
      }

      // Fetch documents
      const docs = await db
        .select()
        .from(documents)
        .where(where)
        .orderBy(orderBy)
        .limit(params.limit)
        .offset(offset)

      // Get total count
      const countResult = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(documents)
        .where(where)

      const total = countResult[0]?.total || 0
      const pages = Math.ceil(total / params.limit)

      console.log('[RecycleBinService] Fetched recycle bin documents:', {
        count: docs.length,
        total,
      })

      return {
        documents: docs as SoftDeletedDocument[],
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages,
        },
      }
    } catch (err) {
      console.error('[RecycleBinService] Error fetching recycle bin documents:', err)
      throw err
    }
  }

  /**
   * Get soft delete audit logs
   */
  static async getAuditLogs(
    dateFrom?: Date,
    dateTo?: Date,
    action?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    logs: RecycleBinAuditLog[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }> {
    try {
      console.log('[RecycleBinService] Fetching audit logs')

      const offset = (page - 1) * limit

      // Note: This requires the soft_delete_audit table to exist
      // For now, we're logging via the general audit system
      // In production, implement direct audit table queries

      return {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      }
    } catch (err) {
      console.error('[RecycleBinService] Error fetching audit logs:', err)
      throw err
    }
  }

  /**
   * Get retention policy
   */
  static async getRetentionPolicy(): Promise<RecycleBinRetentionPolicy> {
    try {
      console.log('[RecycleBinService] Fetching retention policy')

      // In production, query from soft_delete_retention_policy table
      // For now, return default
      return {
        id: 'default-retention-policy',
        daysBeforePermanentDelete: 30,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (err) {
      console.error('[RecycleBinService] Error fetching retention policy:', err)
      throw err
    }
  }

  /**
   * Bulk restore documents
   */
  static async bulkRestore(
    documentIds: string[],
    userId: string,
    userName: string,
    reason?: string
  ): Promise<BulkOperationResult> {
    const auditIds: string[] = []
    let successCount = 0
    const errors: Array<{ fileId: string; error: string }> = []

    console.log('[RecycleBinService] Bulk restoring documents:', { count: documentIds.length })

    for (const docId of documentIds) {
      try {
        const result = await this.restoreDocument(
          docId,
          userId,
          userName,
          { keepHistory: true },
          undefined,
          undefined
        )
        auditIds.push(result.auditId)
        successCount++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ fileId: docId, error: errorMsg })
        console.error('[RecycleBinService] Error restoring document:', docId, err)
      }
    }

    return {
      success: errors.length === 0,
      totalProcessed: documentIds.length,
      successCount,
      failureCount: errors.length,
      errors,
      auditIds,
    }
  }

  /**
   * Bulk permanent delete documents
   */
  static async bulkPermanentDelete(
    documentIds: string[],
    userId: string,
    userName: string,
    reason?: string
  ): Promise<BulkOperationResult> {
    const auditIds: string[] = []
    let successCount = 0
    const errors: Array<{ fileId: string; error: string }> = []

    console.log('[RecycleBinService] Bulk permanently deleting documents:', {
      count: documentIds.length,
    })

    for (const docId of documentIds) {
      try {
        const result = await this.permanentlyDeleteDocument(
          docId,
          userId,
          userName,
          undefined,
          undefined,
          reason
        )
        auditIds.push(result.auditId)
        successCount++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ fileId: docId, error: errorMsg })
        console.error('[RecycleBinService] Error permanently deleting document:', docId, err)
      }
    }

    return {
      success: errors.length === 0,
      totalProcessed: documentIds.length,
      successCount,
      failureCount: errors.length,
      errors,
      auditIds,
    }
  }

  /**
   * Cleanup old deleted files (background job)
   */
  static async cleanupExpiredDeletedFiles(retentionDays: number = 30): Promise<{
    deletedCount: number
    errors: string[]
  }> {
    console.log('[RecycleBinService] Running cleanup for expired deleted files')

    const deletedCount = 0
    const errors: string[] = []

    try {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() - retentionDays)

      // Find all documents deleted before expiration date
      const expiredDocs = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.status, 'deleted' as any),
            lte(documents.deletedAt, expirationDate)
          )
        )

      console.log('[RecycleBinService] Found expired documents:', expiredDocs.length)

      // Permanently delete each one
      for (const doc of expiredDocs) {
        try {
          await this.permanentlyDeleteDocument(
            doc.id,
            'SYSTEM',
            'Automated Cleanup',
            undefined,
            undefined,
            `Automatic cleanup: retention period of ${retentionDays} days exceeded`
          )
        } catch (err) {
          const errorMsg = `Failed to cleanup ${doc.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error('[RecycleBinService]', errorMsg)
        }
      }

      console.log('[RecycleBinService] Cleanup completed:', {
        deletedCount: expiredDocs.length,
        errors: errors.length,
      })

      return {
        deletedCount: expiredDocs.length,
        errors,
      }
    } catch (err) {
      console.error('[RecycleBinService] Error during cleanup:', err)
      throw err
    }
  }

  /**
   * Record soft delete audit log
   */
  private static async recordSoftDeleteAudit(
    auditId: string,
    entityId: string,
    userId: string,
    action: 'delete' | 'restore' | 'permanent_delete',
    ipAddress: string | undefined,
    userAgent: string | undefined,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // In production, insert into soft_delete_audit table
      console.log('[RecycleBinService] Recording soft delete audit:', {
        auditId,
        action,
        userId,
        entityId,
      })
    } catch (err) {
      console.error('[RecycleBinService] Error recording audit:', err)
      // Don't throw - audit failure shouldn't break the operation
    }
  }
}
