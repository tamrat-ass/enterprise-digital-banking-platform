import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { documentCategories } from "@/lib/db/schema"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  withErrorHandling,
} from "@/lib/api-utils"
import { eq } from "drizzle-orm"

/**
 * GET /api/categories/[id]
 * Get a specific category
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error } = await requirePermission(req, "categories.view")
  if (error) return error

  const { id } = await params

  try {
    const category = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.id, id))
      .limit(1)

    if (!category || category.length === 0) {
      return errorResponse('Category not found', 404)
    }

    return successResponse({
      data: category[0],
    })
  } catch (err: any) {
    console.error('Failed to fetch category:', err)
    return errorResponse('Failed to fetch category', 500)
  }
})

/**
 * PUT /api/categories/[id]
 * Update a category
 */
export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error } = await requirePermission(req, "categories.update")
  if (error) return error

  const { id } = await params
  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { name, code, description, color } = body

  // Validate at least one field is provided
  if (!name && !code && description === undefined && !color) {
    return errorResponse('At least one field must be provided for update', 400)
  }

  try {
    // Check if category exists
    const existing = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.id, id))
      .limit(1)

    if (!existing || existing.length === 0) {
      return errorResponse('Category not found', 404)
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (code) updateData.code = code.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (color) updateData.color = color
    updateData.updatedAt = new Date()

    await db
      .update(documentCategories)
      .set(updateData)
      .where(eq(documentCategories.id, id))

    const updated = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.id, id))
      .limit(1)

    console.log('[PUT /api/categories] Updated category:', { id, name })

    return successResponse({
      data: updated[0],
    })
  } catch (err: any) {
    console.error('Failed to update category:', err)
    if (err.code === '23505') {
      return errorResponse('Category name or code already exists', 400)
    }
    return errorResponse('Failed to update category', 500)
  }
})

/**
 * DELETE /api/categories/[id]
 * Delete a category (soft delete - mark as inactive)
 */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { error } = await requirePermission(req, "categories.delete")
  if (error) return error

  const { id } = await params

  try {
    // Check if category exists
    const existing = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.id, id))
      .limit(1)

    if (!existing || existing.length === 0) {
      return errorResponse('Category not found', 404)
    }

    // Soft delete - mark as inactive
    await db
      .update(documentCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documentCategories.id, id))

    console.log('[DELETE /api/categories] Deleted category:', { id })

    return successResponse({
      message: 'Category deleted successfully',
    })
  } catch (err: any) {
    console.error('Failed to delete category:', err)
    return errorResponse('Failed to delete category', 500)
  }
})
