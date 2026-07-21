import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission, successResponse, errorResponse } from "@/lib/api-utils"
import { generateSecureToken } from "@/lib/password"
import { sendInvitationEmail } from "@/lib/email"

const INVITATION_EXPIRY_HOURS = 24

/**
 * POST /api/users/resend-invitation
 * 
 * Resend invitation email to an invited user
 * Only works for users with status = "invited"
 * 
 * SECURITY:
 * - Requires "users.create" permission (admin action)
 * - Generates new invitation token
 * - Previous token becomes invalid
 * - Can be called multiple times
 * 
 * REQUEST:
 * {
 *   "userId": "user_abc123..."
 * }
 */
export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "users.create")
  if (error) return error

  try {
    const body = await req.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return errorResponse('User ID is required', 400)
    }

    // Find the invited user
    const targetUser = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (targetUser.length === 0) {
      return errorResponse('User not found', 404)
    }

    const targetUserData = targetUser[0]

    // Check if user is still in invited status
    if (targetUserData.status !== 'invited') {
      return errorResponse(
        `Cannot resend invitation to user with status "${targetUserData.status}". Only invited users can receive invitations.`,
        400
      )
    }

    // Generate new invitation token
    const invitationToken = generateSecureToken()
    const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000)

    // Update user with new token
    await db
      .update(user)
      .set({
        invitationToken,
        invitationExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    console.log('[Resend Invitation] Generated new token for user:', targetUserData.email)

    // Build invitation link
    const baseUrl = process.env.BETTER_AUTH_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}`

    // Send invitation email
    const emailSent = await sendInvitationEmail(
      targetUserData.email,
      targetUserData.name,
      invitationLink,
      INVITATION_EXPIRY_HOURS
    )

    if (!emailSent) {
      console.warn('[Resend Invitation] Failed to send email to:', targetUserData.email)
      return errorResponse('Invitation token generated but email delivery failed', 500)
    }

    console.log('[Resend Invitation] Email sent successfully to:', targetUserData.email)

    return successResponse({
      email: targetUserData.email,
      name: targetUserData.name,
      message: 'Invitation email sent successfully',
    })
  } catch (err) {
    console.error('[Resend Invitation] Error:', err)
    if (err instanceof SyntaxError) {
      return errorResponse('Invalid request format', 400)
    }
    return errorResponse(err instanceof Error ? err.message : 'Failed to resend invitation', 500)
  }
}
