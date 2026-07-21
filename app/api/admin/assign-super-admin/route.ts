import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * POST /api/admin/assign-super-admin
 * Emergency endpoint to assign Super Admin role
 * Requires admin setup key from environment variable
 * Usage: POST with header X-Admin-Setup-Key or in body as setupKey
 */
export const POST = async (req: NextRequest) => {
  try {
    console.log('[Assign Super Admin] Starting role assignment...')

    // Check admin setup authorization
    const setupKey = req.headers.get('x-admin-setup-key') || 
                     req.headers.get('X-Admin-Setup-Key')
    
    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      // Body is optional
    }

    const bodySetupKey = body?.setupKey
    const allSetupKey = setupKey || bodySetupKey
    const expectedKey = process.env.ADMIN_SETUP_KEY || 'default-setup-key'

    // Allow if setup key matches OR if in development mode
    const isDev = process.env.NODE_ENV === 'development'
    const isAuthorized = isDev || (allSetupKey === expectedKey)

    if (!isAuthorized) {
      console.warn('[Assign Super Admin] Unauthorized attempt')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized. Provide valid setupKey header or environment variable.' 
        },
        { status: 403 }
      )
    }

    const userName = body?.userName || 'Tamrat Assefa Weldemesekel'
    console.log('[Assign Super Admin] Searching for user:', userName)

    // Step 1: Find the user by name
    const userResult = await db.execute(sql`
      SELECT id, name, email FROM users WHERE name = ${userName} LIMIT 1
    `)

    const users = userResult as any[]
    if (!users || users.length === 0) {
      console.error('[Assign Super Admin] User not found:', userName)
      return NextResponse.json(
        { success: false, message: `User not found: ${userName}` },
        { status: 404 }
      )
    }

    const userId = users[0].id
    console.log('[Assign Super Admin] Found user:', { userId, name: users[0].name, email: users[0].email })

    // Step 2: Find the Super Admin role
    const roleResult = await db.execute(sql`
      SELECT id, name FROM roles WHERE name = 'Super Admin' LIMIT 1
    `)

    const roles = roleResult as any[]
    if (!roles || roles.length === 0) {
      console.error('[Assign Super Admin] Super Admin role not found')
      return NextResponse.json(
        { success: false, message: 'Super Admin role not found in database' },
        { status: 404 }
      )
    }

    const roleId = roles[0].id
    console.log('[Assign Super Admin] Found role:', { roleId, name: roles[0].name })

    // Step 3: Check if user already has this role
    const existingResult = await db.execute(sql`
      SELECT id FROM user_roles 
      WHERE user_id = ${userId} AND role_id = ${roleId}
      LIMIT 1
    `)

    const existing = existingResult as any[]
    if (existing && existing.length > 0) {
      console.log('[Assign Super Admin] User already has Super Admin role')
      return NextResponse.json(
        { 
          success: true, 
          message: 'User already has Super Admin role',
          data: { userId, roleId, alreadyAssigned: true }
        },
        { status: 200 }
      )
    }

    // Step 4: Remove any existing roles
    const existingRoles = await db.execute(sql`
      SELECT id FROM user_roles WHERE user_id = ${userId}
    `)
    
    if ((existingRoles as any[]).length > 0) {
      await db.execute(sql`
        DELETE FROM user_roles WHERE user_id = ${userId}
      `)
      console.log('[Assign Super Admin] Removed', (existingRoles as any[]).length, 'existing role(s)')
    }

    // Step 5: Assign Super Admin role
    const userRoleId = `user-role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await db.execute(sql`
      INSERT INTO user_roles (id, user_id, role_id, created_at)
      VALUES (${userRoleId}, ${userId}, ${roleId}, NOW())
    `)
    console.log('[Assign Super Admin] Role assigned successfully')

    // Step 6: Verify
    const verifyResult = await db.execute(sql`
      SELECT ur.id, u.name, r.name as role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}
    `)

    const verification = verifyResult as any[]

    return NextResponse.json(
      {
        success: true,
        message: 'Super Admin role assigned successfully',
        data: {
          userId,
          roleId,
          userName: users[0].name,
          userEmail: users[0].email,
          roleName: 'Super Admin',
          verification: verification && verification.length > 0 ? verification[0] : null
        }
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[Assign Super Admin] Error:', err)
    return NextResponse.json(
      { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to assign role',
        error: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status: 500 }
    )
  }
}
