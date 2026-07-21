import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { user, account } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { hashPassword, validatePasswordStrength } from "@/lib/password"
import crypto from "crypto"

/**
 * POST /api/users/set-password
 * 
 * Allow invited users to set their password and activate their account
 * Integrates with Better Auth to create credential account for login
 * 
 * SECURITY:
 * - Requires valid invitation token (expires after 24 hours)
 * - Validates password strength (enterprise requirements)
 * - Hashes password with bcryptjs (12 rounds)
 * - Sets user status to "active"
 * - Clears invitation token after use (one-time use)
 * - Creates Better Auth credential account for email/password login
 * 
 * REQUEST:
 * {
 *   "invitationToken": "abc123...",
 *   "password": "SecurePass123!"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invitationToken, password } = body

    // Validate input
    if (!invitationToken || typeof invitationToken !== 'string') {
      return errorResponse('Invitation token is required', 400)
    }

    if (!password || typeof password !== 'string') {
      return errorResponse('Password is required', 400)
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password)
    if (!strengthCheck.isValid) {
      return errorResponse(
        `Password does not meet security requirements: ${strengthCheck.errors.join('; ')}`,
        400
      )
    }

    // Find user with valid invitation token
    const invitedUser = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        invitationExpiresAt: user.invitationExpiresAt,
      })
      .from(user)
      .where(
        and(
          eq(user.invitationToken, invitationToken),
          eq(user.status, 'invited')
        )
      )
      .limit(1)

    if (invitedUser.length === 0) {
      console.warn('[Set Password] Invalid or expired invitation token attempted')
      return errorResponse('Invalid or expired invitation token', 401)
    }

    const targetUser = invitedUser[0]

    // Check if invitation has expired
    if (targetUser.invitationExpiresAt && new Date() > targetUser.invitationExpiresAt) {
      console.warn('[Set Password] Expired invitation token for user:', targetUser.email)
      return errorResponse('Invitation token has expired', 401)
    }

    // Hash the password
    let passwordHash: string
    try {
      passwordHash = await hashPassword(password)
    } catch (err) {
      console.error('[Set Password] Password hashing failed:', err)
      return errorResponse('Failed to process password', 500)
    }

    // Create Better Auth credential account via database insert
    // Better Auth expects an "account" record with the hashed password
    try {
      console.log('[Set Password] Creating Better Auth credential account for:', targetUser.email)
      
      // Generate unique account ID
      const accountId = `account_${crypto.randomBytes(12).toString('hex')}`
      
      // Check if account already exists
      const existingAccount = await db
        .select()
        .from(account)
        .where(eq(account.userId, targetUser.id))
        .limit(1)

      if (existingAccount.length === 0) {
        // Insert new account record
        await db.insert(account).values({
          id: accountId,
          accountId: targetUser.id,
          providerId: 'credential',
          userId: targetUser.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log('[Set Password] Better Auth credential created successfully:', targetUser.email)
      } else {
        // Update existing account
        await db
          .update(account)
          .set({
            password: passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(account.userId, targetUser.id))
        console.log('[Set Password] Better Auth credential updated:', targetUser.email)
      }
    } catch (err) {
      console.warn('[Set Password] Better Auth credential creation warning:', err instanceof Error ? err.message : err)
      // Continue anyway - password is set in user table
    }

    // Update user in database: set password, activate account, clear invitation token
    await db
      .update(user)
      .set({
        passwordHash,
        status: 'active',
        invitationToken: null,
        invitationExpiresAt: null,
        passwordChangedAt: new Date(),
        emailVerified: true, // User has verified their email by setting password
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUser.id))

    console.log('[Set Password] User activated successfully:', targetUser.email)

    return successResponse({
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      status: 'active',
      message: 'Password set successfully. Your account is now active and you can login.',
    })
  } catch (err) {
    console.error('[Set Password] Error:', err)
    if (err instanceof SyntaxError) {
      return errorResponse('Invalid request format', 400)
    }
    return errorResponse(err instanceof Error ? err.message : 'Failed to set password', 500)
  }
}
