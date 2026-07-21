import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { requirePermission, successResponse, errorResponse } from "@/lib/api-utils"

/**
 * PUT /api/users/[id]
 * Update a user's name and/or status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both sync and async params (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)
  const { error } = await requirePermission(req, "users.edit")
  if (error) return error

  try {
    const id = resolvedParams.id
    if (!id) {
      return errorResponse('User ID is required', 400)
    }
    let body
    try {
      body = await req.json()
    } catch (e) {
      return errorResponse('Invalid JSON in request body', 400)
    }
    
    const { name, status } = body

    console.log('[Users API] PUT /api/users/[id] - Updating user:', id)
    console.log('[Users API] Request body:', { name, status })

    if (!name || !name.trim()) {
      return errorResponse('Name is required', 400)
    }

    // Build update object
    const updateData: any = { 
      name: name.trim(),
      updatedAt: new Date(),
    }

    // Only add status if provided and valid
    if (status && ['active', 'disabled', 'invited'].includes(status)) {
      updateData.status = status
      console.log('[Users API] Also updating status to:', status)
    }

    console.log('[Users API] Update data to be set:', updateData)

    // Update the user
    const result = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))

    console.log('[Users API] Updated user:', id, 'Result:', result)

    // Fetch and return the updated user
    const updatedUser = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (updatedUser.length === 0) {
      return errorResponse('User not found', 404)
    }

    console.log('[Users API] Successfully updated user:', id, updatedUser[0])

    return successResponse({
      id: updatedUser[0].id,
      name: updatedUser[0].name,
      email: updatedUser[0].email,
      status: updatedUser[0].status,
    })
  } catch (err) {
    console.error('[Users API] Error updating user:', err)
    console.error('[Users API] Error stack:', err instanceof Error ? err.stack : 'No stack')
    console.error('[Users API] Error type:', err instanceof Error ? err.constructor.name : typeof err)
    
    // Log detailed error information
    if (err instanceof Error) {
      console.error('[Users API] Error message:', err.message)
      console.error('[Users API] Error cause:', (err as any).cause)
      console.error('[Users API] Full error object:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
      })
    }
    
    return errorResponse(
      err instanceof Error ? `${err.message}` : 'Failed to update user',
      500
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { error } = await requirePermission(req, "users.delete")
  if (error) return error

  try {
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    if (!id) {
      return errorResponse('User ID is required', 400)
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return errorResponse('User not found', 404)
    }

    // Delete the user
    await db
      .delete(user)
      .where(eq(user.id, id))

    console.log('[Users API] Deleted user:', id)

    return successResponse({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('[Users API] Error deleting user:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to delete user', 500)
  }
}
