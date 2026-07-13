import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/departments/[id]
 * Get a specific department
 */
export const GET = withErrorHandling(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { error } = await requirePermission(req, "documents:view")
  if (error) return error

  const params = await context.params
  const deptId = params.id

  try {
    const dept = await db
      .select()
      .from(departments)
      .where(eq(departments.id, deptId))
      .limit(1)

    if (dept.length === 0) {
      return errorResponse('Department not found', 404)
    }

    return successResponse(dept[0])
  } catch (err) {
    console.error('Failed to fetch department:', err)
    return errorResponse('Failed to fetch department', 500)
  }
})

/**
 * PUT /api/departments/[id]
 * Update a department
 */
export const PUT = withErrorHandling(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const params = await context.params
  const deptId = params.id

  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { name, code, description, headName } = body

  try {
    // Check if department exists
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.id, deptId))
      .limit(1)

    if (existing.length === 0) {
      return errorResponse('Department not found', 404)
    }

    // Update department
    await db
      .update(departments)
      .set({
        name: name?.trim() || existing[0].name,
        code: code?.trim().toUpperCase() || existing[0].code,
        description: description?.trim() || existing[0].description,
        headName: headName?.trim() || existing[0].headName,
      })
      .where(eq(departments.id, deptId))

    return successResponse({
      id: deptId,
      name: name?.trim() || existing[0].name,
      code: code?.trim().toUpperCase() || existing[0].code,
      description: description?.trim() || existing[0].description,
      headName: headName?.trim() || existing[0].headName,
    })
  } catch (err: any) {
    console.error('Failed to update department:', err)
    if (err.code === '23505') {
      return errorResponse('Department code already exists', 400)
    }
    return errorResponse('Failed to update department', 500)
  }
})

/**
 * DELETE /api/departments/[id]
 * Delete a department
 */
export const DELETE = withErrorHandling(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const params = await context.params
  const deptId = params.id

  try {
    // Check if department exists
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.id, deptId))
      .limit(1)

    if (existing.length === 0) {
      return errorResponse('Department not found', 404)
    }

    // Delete department
    await db.delete(departments).where(eq(departments.id, deptId))

    return successResponse({
      message: 'Department deleted successfully',
      id: deptId,
    })
  } catch (err: any) {
    console.error('Failed to delete department:', err)
    // Check for foreign key constraint
    if (err.code === '23503') {
      return errorResponse(
        'Cannot delete department. It is still in use by documents or users.',
        400
      )
    }
    return errorResponse('Failed to delete department', 500)
  }
})
