import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Toggle user status between active and disabled
 * POST /api/users/toggle-status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newStatus } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['active', 'invited', 'disabled']
    if (newStatus && !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch current user
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!targetUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentUser = targetUser[0]
    
    // Determine new status if not provided (toggle between active and disabled)
    let updatedStatus = newStatus
    if (!updatedStatus) {
      updatedStatus = currentUser.status === 'active' ? 'disabled' : 'active'
    }

    // Prevent toggling if user is in "invited" state without explicit new status
    if (currentUser.status === 'invited' && !newStatus) {
      return NextResponse.json(
        { error: 'Cannot auto-toggle invited users. Please specify new status explicitly.' },
        { status: 400 }
      )
    }

    console.log(`[Toggle User Status] User ${userId}: ${currentUser.status} → ${updatedStatus}`)

    // Update user status
    const updateResult = await db
      .update(user)
      .set({
        status: updatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    console.log(`[Toggle User Status] ✅ User status updated: ${updatedStatus}`)

    return NextResponse.json(
      {
        success: true,
        message: `User status changed to ${updatedStatus}`,
        userId,
        newStatus: updatedStatus,
        previousStatus: currentUser.status,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Toggle User Status] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
