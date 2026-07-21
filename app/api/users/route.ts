import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, userRoles, roles as rolesTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission, successResponse, errorResponse } from "@/lib/api-utils"
import { randomBytes } from "crypto"
import { generateSecureToken } from "@/lib/password"
import { sendInvitationEmail } from "@/lib/email"

const INVITATION_EXPIRY_HOURS = 24

/**
 * GET /api/users
 * Get list of all users with their assigned roles
 * Used for user management and role assignment
 * 
 * OPTIMIZATION: Previously had N+1 query problem:
 *   - Query 1: Fetch all users (returns 100 users)
 *   - Query 2-101: Fetch roles for each user individually (100 queries!)
 *   - Total: 101 queries
 * 
 * Now uses single query with LEFT JOIN:
 *   - Single query with JOIN to get users + their roles
 *   - Results grouped in application (no additional queries)
 *   - Total: 1 query
 * 
 * Impact: 100x fewer queries, releases connections immediately
 */
export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "users.view")
  if (error) return error

  try {
    console.log('[Users API] Fetching users list with roles - using optimized single query')

    // OPTIMIZED: Single query with LEFT JOIN instead of 1 + N queries
    const usersWithRolesRaw = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userStatus: user.status,
        roleId: rolesTable.id,
        roleName: rolesTable.name,
        userRoleId: userRoles.id,
      })
      .from(user)
      .leftJoin(userRoles, eq(user.id, userRoles.userId))
      .leftJoin(rolesTable, eq(userRoles.roleId, rolesTable.id))
      .orderBy(user.name)
      .limit(100)

    // Group results by user (deduplicate from JOIN)
    const usersMap = new Map<string, any>()
    
    for (const row of usersWithRolesRaw) {
      const key = row.userId
      
      if (!usersMap.has(key)) {
        usersMap.set(key, {
          id: row.userId,
          name: row.userName || 'Unknown',
          email: row.userEmail || '',
          status: row.userStatus || 'invited',
          roles: [],
        })
      }
      
      // Add role if this row has one
      if (row.roleId) {
        const user = usersMap.get(key)
        // Avoid duplicate roles (in case of multiple user_roles entries)
        if (!user.roles.find((r: any) => r.roleId === row.roleId)) {
          user.roles.push({
            id: row.userRoleId,
            roleId: row.roleId,
            roleName: row.roleName,
          })
        }
      }
    }

    const usersWithRoles = Array.from(usersMap.values())

    console.log('[Users API] Successfully fetched', usersWithRoles.length, 'users with roles using single optimized query')

    return successResponse(usersWithRoles)
  } catch (err) {
    console.error('[Users API] Error fetching users:', err)
    console.error('[Users API] Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch users', 500)
  }
}

/**
 * POST /api/users
 * Create a new user with invitation-based onboarding
 * 
 * ENTERPRISE FLOW:
 * 1. Admin creates user (name, email, roles)
 * 2. User created with status = "invited", no password
 * 3. System sends invitation email with activation link
 * 4. User clicks link and sets own password
 * 5. User account becomes active
 * 
 * Security:
 * - No temporary password shown to admin
 * - No plain passwords stored
 * - Invitation tokens expire after 24 hours
 * - Only Argon2/Bcrypt hashes stored
 */
export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "users.create")
  if (error) return error

  try {
    const body = await req.json()
    const { name, email } = body

    // Validate input
    if (!name || !email) {
      return errorResponse('Name and email are required', 400)
    }

    if (name.trim().length < 2) {
      return errorResponse('Name must be at least 2 characters', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400)
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      return errorResponse('User with this email already exists', 409)
    }

    // Generate invitation token (256 bits of entropy)
    const invitationToken = generateSecureToken()
    const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000)

    // Create new user with INVITED status (no password yet)
    const newUserId = `user_${randomBytes(12).toString('hex')}`
    await db.insert(user).values({
      id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      status: 'invited',
      invitationToken,
      invitationExpiresAt,
      emailVerified: false,
    })

    console.log('[Users API] Created new user:', newUserId, 'with email:', email, 'status: invited')

    // Build invitation link
    const baseUrl = process.env.BETTER_AUTH_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}`

    console.log('[Users API] 📧 Sending invitation email...')
    console.log('[Users API]    Email:', email)
    console.log('[Users API]    Link:', invitationLink)

    // Send invitation email
    const emailSent = await sendInvitationEmail(
      email,
      name,
      invitationLink,
      INVITATION_EXPIRY_HOURS
    )

    console.log('[Users API] 📧 Email result:', emailSent ? '✅ SUCCESS' : '❌ FAILED')

    if (!emailSent) {
      console.warn('[Users API] Failed to send invitation email, but user was created')
      // Don't fail the request - user is created, can resend later
    }

    // Fetch and return the created user (without sensitive data)
    const createdUser = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      })
      .from(user)
      .where(eq(user.id, newUserId))
      .limit(1)

    return successResponse({
      id: createdUser[0]?.id,
      name: createdUser[0]?.name,
      email: createdUser[0]?.email,
      status: createdUser[0]?.status,
      message: emailSent 
        ? 'User created successfully. Invitation email sent.'
        : 'User created successfully. Email delivery failed - admin can resend invitation.',
    }, 201)
  } catch (err) {
    console.error('[Users API] Error creating user:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to create user', 500)
  }
}

