import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { requirePermission, errorResponse } from "@/lib/api-utils"
import { recordAudit } from "@/lib/audit"

interface ShareRequest {
  permissions: Array<{
    userId: string
    permission: 'view' | 'download' | 'edit'
  }>
}

/**
 * POST /api/documents/[id]/share
 * Share a document with other users
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(req, "documents:share")
  if (error) return error

  const { id: documentId } = await params
  const body = await req.json() as ShareRequest

  console.log('[Share] Sharing document:', {
    documentId,
    permissionsCount: body.permissions?.length || 0,
  })

  try {
    // Verify document exists
    const docResult = await db.execute(sql`
      SELECT id FROM documents WHERE id = ${documentId}
      LIMIT 1
    `)

    const doc = (docResult as any[])[0]
    if (!doc) {
      return errorResponse('Document not found', 404)
    }

    // Get current user
    const session = req.cookies.get('auth_session')
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    // Share with each user
    const results = []
    for (const permission of body.permissions || []) {
      try {
        // Create share record using raw SQL
        await db.execute(sql`
          INSERT INTO document_shares (id, document_id, user_id, permission, shared_by, shared_at)
          VALUES (
            ${crypto.randomUUID()},
            ${documentId},
            ${permission.userId},
            ${permission.permission},
            ${session.value},
            NOW()
          )
          ON CONFLICT (document_id, user_id) DO UPDATE SET
            permission = ${permission.permission},
            updated_at = NOW()
        `)

        results.push({
          userId: permission.userId,
          status: 'success',
        })
      } catch (err) {
        console.error('[Share] Error sharing with user:', permission.userId, err)
        results.push({
          userId: permission.userId,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Record audit
    try {
      await recordAudit({
        userId: session.value,
        actorName: 'User',
        action: 'document.shared',
        entityType: 'document',
        entityId: documentId,
        module: 'documents',
        details: `Shared with ${body.permissions?.length || 0} users`,
      })
    } catch (err) {
      console.error('[Share] Audit logging failed:', err)
    }

    console.log('[Share] Document shared successfully')

    return NextResponse.json({
      status: 'success',
      message: 'Document shared successfully',
      results,
    })
  } catch (err) {
    console.error('[Share] Error:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to share document',
      500
    )
  }
}

/**
 * GET /api/documents/[id]/share
 * Get sharing details for a document
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(req, "documents.view")
  if (error) return error

  const { id: documentId } = await params

  try {
    // Get all shares for this document
    const sharesResult = await db.execute(sql`
      SELECT 
        ds.id,
        ds.user_id,
        u.name as user_name,
        u.email,
        ds.permission,
        ds.shared_at,
        ds.shared_by
      FROM document_shares ds
      LEFT JOIN "user" u ON ds.user_id = u.id
      WHERE ds.document_id = ${documentId}
      ORDER BY ds.shared_at DESC
    `)

    return NextResponse.json({
      status: 'success',
      data: sharesResult || [],
    })
  } catch (err) {
    console.error('[Share] Error fetching shares:', err)
    return errorResponse('Failed to fetch shares', 500)
  }
}

/**
 * DELETE /api/documents/[id]/share
 * Remove sharing for a user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(req, "documents.share")
  if (error) return error

  const { id: documentId } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return errorResponse('userId parameter is required', 400)
  }

  try {
    // Delete the share record
    await db.execute(sql`
      DELETE FROM document_shares
      WHERE document_id = ${documentId} AND user_id = ${userId}
    `)

    console.log('[Share] Document share removed:', { documentId, userId })

    return NextResponse.json({
      status: 'success',
      message: 'Share removed successfully',
    })
  } catch (err) {
    console.error('[Share] Error removing share:', err)
    return errorResponse('Failed to remove share', 500)
  }
}
