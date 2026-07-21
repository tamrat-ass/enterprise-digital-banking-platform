/**
 * Restore Document API
 * POST /api/recycle-bin/:id/restore
 * Restores a soft-deleted document from Recycle Bin
 */

import { NextRequest } from 'next/server'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { requirePermission, successResponse, errorResponse, withErrorHandling, parseJsonBody } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { restoreFileSchema } from '@/lib/schemas/recycle-bin.schemas'

/**
 * POST /api/recycle-bin/:id/restore
 * Restore a soft-deleted document
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, 'file.restore')
  if (error) return error

  try {
    // Extract document ID from path
    const pathSegments = req.nextUrl.pathname.split('/')
    const documentId = pathSegments[3]

    if (!documentId) {
      return errorResponse('Document ID is required', 400)
    }

    console.log('[Restore API] Restoring document:', { documentId, userId: user?.id })

    // Verify document exists and is deleted
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!doc.length) {
      return errorResponse('Document not found', 404)
    }

    const document = doc[0]

    if (document.status !== 'deleted') {
      return errorResponse(
        `Document is not in Recycle Bin. Current status: ${document.status}`,
        400
      )
    }

    // Verify ownership or admin permission
    if (document.ownerId !== user?.id) {
      const hasAdminPermission = user?.permissions?.includes('file.restore')
      if (!hasAdminPermission) {
        return errorResponse('You do not have permission to restore this document', 403)
      }
    }

    // Parse request body
    const body = await parseJsonBody(req)
    const restoreOptions = restoreFileSchema.parse({
      fileId: documentId,
      ...body,
    })

    // Get IP address and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    // Perform restore
    const result = await RecycleBinService.restoreDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      restoreOptions,
      ipAddress || undefined,
      userAgent || undefined
    )

    console.log('[Restore API] Document restored successfully:', result.auditId)

    return successResponse(result)
  } catch (err) {
    console.error('[Restore API] Error restoring document:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to restore document',
      500
    )
  }
})
