/**
 * Permanent Delete API
 * DELETE /api/recycle-bin/:id/permanent-delete
 * Permanently deletes a document (removes from database and storage)
 */

import { NextRequest } from 'next/server'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { requirePermission, successResponse, errorResponse, withErrorHandling, parseJsonBody } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { permanentDeleteSchema } from '@/lib/schemas/recycle-bin.schemas'

/**
 * DELETE /api/recycle-bin/:id/permanent-delete
 * Permanently delete a document
 */
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, 'file.permanentDelete')
  if (error) return error

  try {
    // Extract document ID from path
    const pathSegments = req.nextUrl.pathname.split('/')
    const documentId = pathSegments[3]

    if (!documentId) {
      return errorResponse('Document ID is required', 400)
    }

    console.log('[Permanent Delete API] Permanently deleting document:', {
      documentId,
      userId: user?.id,
    })

    // Verify document exists
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
      const hasAdminPermission = user?.permissions?.includes('file.permanentDelete')
      if (!hasAdminPermission) {
        return errorResponse('You do not have permission to permanently delete this document', 403)
      }
    }

    // Parse request body
    let deleteRequest = {
      fileId: documentId,
      confirmDelete: false,
    }

    try {
      const body = await parseJsonBody(req)
      deleteRequest = permanentDeleteSchema.parse({
        fileId: documentId,
        ...body,
      })
    } catch (parseErr) {
      console.warn('[Permanent Delete API] Failed to parse request body:', parseErr)
      // Continue without body validation for now
    }

    // Require explicit confirmation
    if (!deleteRequest.confirmDelete) {
      return errorResponse(
        'Permanent deletion requires explicit confirmation. Set confirmDelete: true',
        400
      )
    }

    // Get IP address and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    // Perform permanent delete
    const result = await RecycleBinService.permanentlyDeleteDocument(
      documentId,
      user.id,
      user.name || 'Unknown',
      ipAddress || undefined,
      userAgent || undefined,
      deleteRequest.reason
    )

    console.log('[Permanent Delete API] Document permanently deleted:', result.auditId)

    return successResponse(result)
  } catch (err) {
    console.error('[Permanent Delete API] Error permanently deleting document:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to permanently delete document',
      500
    )
  }
})
