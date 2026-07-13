import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * POST /api/rbac/seed
 * Seed the database with predefined roles and permissions
 * Admin only
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users:admin")
  if (error) return error

  try {
    await RBACService.seedRolesAndPermissions()
    return successResponse({ message: 'Roles and permissions seeded successfully' })
  } catch (err) {
    console.error('[Seed API] Error seeding roles:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to seed roles', 500)
  }
})
