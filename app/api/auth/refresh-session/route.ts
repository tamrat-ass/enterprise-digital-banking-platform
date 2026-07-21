import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { successResponse, errorResponse } from "@/lib/api-utils"

/**
 * POST /api/auth/refresh-session
 * Refresh the current user's session with latest permissions from database
 * 
 * This endpoint forces a fresh load of user permissions from the database,
 * bypassing the per-request cache. Call this after admin updates a user's role/permissions.
 */
export async function POST(req: NextRequest) {
  try {
    // Note: We can't directly bypass the cache() function, but by calling getCurrentUser()
    // in a new request context, it will fetch fresh data from the database.
    // The cache only applies within the same request.
    
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    console.log('[refresh-session] User session refreshed:', {
      name: user.name,
      role: user.roleName,
      permissions: user.permissions.length,
    })

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleName,
        permissions: user.permissions,
      },
      message: 'Session refreshed successfully',
    })
  } catch (err) {
    console.error('[refresh-session] Error:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to refresh session', 500)
  }
}

/**
 * GET /api/auth/refresh-session
 * Quick session refresh status check
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    return successResponse({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        permissions: user.permissions,
      },
    })
  } catch (err) {
    return errorResponse('Unauthorized', 401)
  }
}
