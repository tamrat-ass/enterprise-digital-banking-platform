/**
 * Soft Delete Document API
 * DELETE /api/documents/:id/delete
 * Soft deletes a document (moves to Recycle Bin)
 */

import { NextRequest } from 'next/server'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { requirePermission, successResponse, errorResponse, withErrorHandling } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * DELETE /api/documents/:id/delete
 * Soft delete a document
 */
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, 'file.delete')
  if (error) return error

  try {
    // Extract document ID from path
    const pathSegments = req.nextUrl.pathname.split('/')
    const documentId = pathSegments[3]

    if (!documentId) {
      return errorResponse('Document ID is required', 400)
    }

    console.log('[Soft Delete API] Deleting document:', { documentId, userId: user?.id })

    // Verify document exists and user has access
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!doc.length) {
      return errorResponse('Document not found', 404)
    }

    const document = doc[0]

    // Verify ownership or admin permission
    if (document.ownerId !== user?.id) {
      const hasAdminPermission = user?.permissions?.includes('file.delete')
      if (!hasAdminPermission) {
        return errorResponse('You do not have permission to delete this document', 403)
      }
    }

    // Get request body for optional reason
    let reason: string | undefined
    try {
      const body = await req.json()
      reason = body.reason
    } catch {
      // Body is optional
    }

    // Get IP address and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    // Perform soft delete
    const result = await RecycleBinService.softDeleteDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      ipAddress || undefined,
      userAgent || undefined,
      reason
    )

    console.log('[Soft Delete API] Document soft deleted successfully:', result.auditId)

    return successResponse(result)
  } catch (err) {
    console.error('[Soft Delete API] Error soft deleting document:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to soft delete document',
      500
    )
  }
})
