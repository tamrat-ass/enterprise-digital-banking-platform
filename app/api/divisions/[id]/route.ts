import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { divisions } from "@/lib/db/schema"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  withErrorHandling,
} from "@/lib/api-utils"
import { eq } from "drizzle-orm"

/**
 * GET /api/divisions/[id]
 * Get a specific division
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error, user } = await requirePermission(req, "documents:view")
  if (error) return error

  const { id } = await params

  try {
    const division = await db
      .select()
      .from(divisions)
      .where(eq(divisions.id, id))
      .limit(1)

    if (division.length === 0) {
      return errorResponse('Division not found', 404)
    }

    return successResponse(division[0])
  } catch (err) {
    console.error('Failed to fetch division:', err)
    return errorResponse('Failed to fetch division', 500)
  }
})

/**
 * PUT /api/divisions/[id]
 * Update a division
 */
export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const { id } = await params
  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { name, code, description, headName, status } = body

  try {
    // Verify division exists
    const existingDivision = await db
      .select()
      .from(divisions)
      .where(eq(divisions.id, id))
      .limit(1)

    if (existingDivision.length === 0) {
      return errorResponse('Division not found', 404)
    }

    const updated = await db
      .update(divisions)
      .set({
        name: name?.trim() || existingDivision[0].name,
        code: code?.trim().toUpperCase() || existingDivision[0].code,
        description: description?.trim() || null,
        headName: headName?.trim() || null,
        status: status || existingDivision[0].status,
        updatedAt: new Date(),
      })
      .where(eq(divisions.id, id))
      .returning()

    return successResponse(updated[0])
  } catch (err: any) {
    console.error('Failed to update division:', err)
    if (err.code === '23505') {
      return errorResponse('Division code already exists for this department', 400)
    }
    return errorResponse('Failed to update division', 500)
  }
})

/**
 * DELETE /api/divisions/[id]
 * Delete a division
 */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const { id } = await params

  try {
    const result = await db
      .delete(divisions)
      .where(eq(divisions.id, id))
      .returning()

    if (result.length === 0) {
      return errorResponse('Division not found', 404)
    }

    return successResponse({ message: 'Division deleted successfully' })
  } catch (err: any) {
    console.error('Failed to delete division:', err)
    return errorResponse('Failed to delete division', 500)
  }
})
