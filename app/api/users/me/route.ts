import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

/**
 * GET /api/users/me
 * Get current authenticated user with role and department info
 */
export async function GET() {
  try {
    console.log('[Users/Me] Fetching current user')

    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.log('[Users/Me] User not authenticated')
      return NextResponse.json(
        { status: 'error', message: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('[Users/Me] Found user:', currentUser.name)

    return NextResponse.json({
      status: 'success',
      data: currentUser,
    })
  } catch (err) {
    console.error('[Users/Me] Error fetching current user:', err)
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

