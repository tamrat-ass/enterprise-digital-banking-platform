import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { getCurrentUser, getUserId } from "@/lib/session"
import { successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { permissions } from "@/lib/db/schema"

/**
 * POST /api/rbac/seed
 * Seed the database with predefined roles and permissions
 * 
 * IMPORTANT: This endpoint requires authentication but bypasses permission checks
 * because it's needed to bootstrap the RBAC system on first setup.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  try {
    // Get current user (must be authenticated)
    const userId = await getUserId().catch(() => null)
    
    if (!userId) {
      return errorResponse('Unauthorized - must be signed in', 401)
    }

    console.log('[Seed API] Starting seed operation for user:', userId)

    // Check if permissions already exist (to avoid re-seeding)
    const existingPerms = await db.select().from(permissions).limit(1)
    
    if (existingPerms.length > 0) {
      console.log('[Seed API] Permissions already seeded - skipping')
      return successResponse({ 
        message: 'Roles and permissions already seeded',
        alreadySeeded: true 
      })
    }

    // Run the seed operation
    await RBACService.seedRolesAndPermissions()
    
    console.log('[Seed API] Seed operation completed successfully')
    
    return successResponse({ 
      message: 'Roles and permissions seeded successfully',
      alreadySeeded: false 
    })
  } catch (err) {
    console.error('[Seed API] Error seeding roles:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to seed roles', 500)
  }
})

