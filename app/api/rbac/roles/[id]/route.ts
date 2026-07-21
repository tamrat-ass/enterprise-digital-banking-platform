import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/roles/[id]
 * Get a specific role with permissions
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { error } = await requirePermission(req, "users.view")
    if (error) return error

    const { id } = await params

    try {
      const role = await RBACService.getRole(id)
      return successResponse(role)
    } catch (err) {
      console.error('[Role Details API] Error fetching role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to fetch role', 500)
    }
  }
)

/**
 * PATCH /api/rbac/roles/[id]
 * Update a role
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { error } = await requirePermission(req, "users.update")
    if (error) return error

    const { id } = await params

    try {
      const body = await req.json()
      const { name, description, permissionIds } = body

      const role = await RBACService.updateRole(id, {
        name,
        description,
        permissionIds,
      })

      return successResponse(role)
    } catch (err) {
      console.error('[Role Details API] Error updating role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to update role', 500)
    }
  }
)

/**
 * DELETE /api/rbac/roles/[id]
 * Delete a role
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { error } = await requirePermission(req, "users.delete")
    if (error) return error

    const { id } = await params

    try {
      const { db } = await import("@/lib/db")
      const { roles: rolesTable, rolePermissions, userRoles } = await import("@/lib/db/schema")
      const { eq } = await import("drizzle-orm")

      // Check if role exists
      const roleList = await db.select().from(rolesTable).where(eq(rolesTable.id, id))
      const role = roleList[0]

      if (!role) {
        return errorResponse('Role not found', 404)
      }

      if (role.isSystem) {
        return errorResponse('Cannot delete system roles', 403)
      }

      // Delete role permissions and user roles (cascade handled by DB)
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id))
      await db.delete(userRoles).where(eq(userRoles.roleId, id))
      await db.delete(rolesTable).where(eq(rolesTable.id, id))

      return successResponse({ success: true, id })
    } catch (err) {
      console.error('[Role Details API] Error deleting role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to delete role', 500)
    }
  }
)
