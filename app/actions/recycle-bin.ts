/**
 * Recycle Bin Server Actions
 * Client-side server actions for recycle bin operations
 */

'use server'

import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { getCurrentUser } from '@/lib/session'
import { RecycleBinQueryParams } from '@/lib/types/recycle-bin'

interface RecycleBinResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Fetch recycle bin documents
 */
export async function fetchRecycleBinDocuments(
  params: RecycleBinQueryParams
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('recycleBin.view')) {
      return {
        success: false,
        error: 'Permission denied: recycleBin.view',
      }
    }

    const result = await RecycleBinService.getRecycleBinDocuments(params)

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error fetching recycle bin:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch recycle bin',
    }
  }
}

/**
 * Soft delete a document
 */
export async function softDeleteDocument(
  documentId: string,
  reason?: string
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('file.delete')) {
      return {
        success: false,
        error: 'Permission denied: file.delete',
      }
    }

    const result = await RecycleBinService.softDeleteDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      undefined,
      undefined,
      reason
    )

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error soft deleting document:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete document',
    }
  }
}

/**
 * Restore a document
 */
export async function restoreDocument(
  documentId: string,
  keepHistory?: boolean
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('file.restore')) {
      return {
        success: false,
        error: 'Permission denied: file.restore',
      }
    }

    const result = await RecycleBinService.restoreDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      { fileId: documentId, keepHistory }
    )

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error restoring document:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to restore document',
    }
  }
}

/**
 * Permanently delete a document
 */
export async function permanentlyDeleteDocument(
  documentId: string,
  reason?: string
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('file.permanentDelete')) {
      return {
        success: false,
        error: 'Permission denied: file.permanentDelete',
      }
    }

    const result = await RecycleBinService.permanentlyDeleteDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      undefined,
      undefined,
      reason
    )

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error permanently deleting document:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to permanently delete document',
    }
  }
}

/**
 * Bulk restore documents
 */
export async function bulkRestoreDocuments(
  documentIds: string[],
  reason?: string
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('file.restore')) {
      return {
        success: false,
        error: 'Permission denied: file.restore',
      }
    }

    const result = await RecycleBinService.bulkRestore(
      documentIds,
      user.id,
      user.name || 'Unknown',
      reason
    )

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error bulk restoring documents:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to bulk restore documents',
    }
  }
}

/**
 * Bulk permanently delete documents
 */
export async function bulkPermanentlyDeleteDocuments(
  documentIds: string[],
  reason?: string
): Promise<RecycleBinResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check permission
    if (!user.permissions?.includes('file.permanentDelete')) {
      return {
        success: false,
        error: 'Permission denied: file.permanentDelete',
      }
    }

    const result = await RecycleBinService.bulkPermanentDelete(
      documentIds,
      user.id,
      user.name || 'Unknown',
      reason
    )

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[Recycle Bin Actions] Error bulk permanently deleting documents:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to bulk permanently delete documents',
    }
  }
}
