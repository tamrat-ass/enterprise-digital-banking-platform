/**
 * Bulk Operations API
 * POST /api/recycle-bin/bulk-operations
 * Handle bulk restore or permanent delete operations
 */

import { NextRequest } from 'next/server'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { requirePermission, successResponse, errorResponse, withErrorHandling, parseJsonBody } from '@/lib/api-utils'
import { bulkOperationSchema } from '@/lib/schemas/recycle-bin.schemas'

/**
 * POST /api/recycle-bin/bulk-operations
 * Perform bulk restore or permanent delete
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  try {
    // Parse request body first to determine action
    const body = await parseJsonBody(req)
    const operation = bulkOperationSchema.parse(body)

    // Check appropriate permissions based on action
    const requiredPermission = operation.action === 'restore' ? 'file.restore' : 'file.permanentDelete'
    const { error, user } = await requirePermission(req, requiredPermission)
    if (error) return error

    console.log('[Bulk Operations API] Processing bulk operation:', {
      action: operation.action,
      fileCount: operation.fileIds.length,
      userId: user?.id,
    })

    // Require confirmation for permanent delete
    if (operation.action === 'permanent_delete' && !operation.confirmDelete) {
      return errorResponse(
        'Bulk permanent delete requires explicit confirmation. Set confirmDelete: true',
        400
      )
    }

    let result

    if (operation.action === 'restore') {
      result = await RecycleBinService.bulkRestore(
        operation.fileIds,
        user.id,
        user.name || 'Unknown',
        operation.reason
      )
    } else {
      result = await RecycleBinService.bulkPermanentDelete(
        operation.fileIds,
        user.id,
        user.name || 'Unknown',
        operation.reason
      )
    }

    console.log('[Bulk Operations API] Bulk operation completed:', {
      action: operation.action,
      successCount: result.successCount,
      failureCount: result.failureCount,
    })

    return successResponse(result)
  } catch (err) {
    console.error('[Bulk Operations API] Error processing bulk operation:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to process bulk operation',
      500
    )
  }
})
