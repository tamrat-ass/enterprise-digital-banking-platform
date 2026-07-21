/**
 * Script to assign Super Admin role to a user
 * Usage: npx tsx scripts/assign-super-admin.ts "Tamrat Assefa Weldemesekel"
 */

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { v4 as uuidv4 } from 'uuid'

async function assignSuperAdminRole(userName: string) {
  try {
    console.log(`[Assign Super Admin] Starting role assignment for: ${userName}`)

    // Step 1: Find the user
    const userResult = await db.execute(sql`
      SELECT id, name, email FROM users WHERE name = ${userName} LIMIT 1
    `)

    const users = userResult as any[]
    if (!users || users.length === 0) {
      console.error(`[Assign Super Admin] User not found: ${userName}`)
      process.exit(1)
    }

    const userId = users[0].id
    const userEmail = users[0].email
    console.log(`[Assign Super Admin] Found user:`, { userId, name: userName, email: userEmail })

    // Step 2: Find the Super Admin role
    const roleResult = await db.execute(sql`
      SELECT id, name FROM roles WHERE name = 'Super Admin' LIMIT 1
    `)

    const roles = roleResult as any[]
    if (!roles || roles.length === 0) {
      console.error('[Assign Super Admin] Super Admin role not found')
      process.exit(1)
    }

    const roleId = roles[0].id
    console.log(`[Assign Super Admin] Found role:`, { roleId, name: 'Super Admin' })

    // Step 3: Check if user already has Super Admin role
    const existingResult = await db.execute(sql`
      SELECT id FROM user_roles 
      WHERE user_id = ${userId} AND role_id = ${roleId}
      LIMIT 1
    `)

    const existing = existingResult as any[]
    if (existing && existing.length > 0) {
      console.log(`[Assign Super Admin] User already has Super Admin role`)
      console.log('✅ Role assignment complete (already assigned)')
      process.exit(0)
    }

    // Step 4: Check existing roles
    const existingRolesResult = await db.execute(sql`
      SELECT id, role_id FROM user_roles WHERE user_id = ${userId}
    `)

    const existingRoles = existingRolesResult as any[]
    if (existingRoles && existingRoles.length > 0) {
      console.log(`[Assign Super Admin] User has ${existingRoles.length} existing role(s). Removing...`)
      
      // Delete existing roles
      await db.execute(sql`
        DELETE FROM user_roles WHERE user_id = ${userId}
      `)
      console.log(`[Assign Super Admin] Removed existing roles`)
    }

    // Step 5: Assign Super Admin role
    const userRoleId = uuidv4()
    await db.execute(sql`
      INSERT INTO user_roles (id, user_id, role_id, created_at)
      VALUES (${userRoleId}, ${userId}, ${roleId}, NOW())
    `)
    console.log(`[Assign Super Admin] Role assigned successfully`)

    // Step 6: Verify the assignment
    const verifyResult = await db.execute(sql`
      SELECT ur.id, u.name, r.name as role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}
    `)

    const verification = verifyResult as any[]
    if (verification && verification.length > 0) {
      console.log(`[Assign Super Admin] ✅ Verification successful:`, {
        userId,
        userName: verification[0].name,
        roleName: verification[0].role_name,
      })
      console.log('\n✅ Super Admin role successfully assigned!')
    } else {
      console.error('[Assign Super Admin] Verification failed - role not found after assignment')
      process.exit(1)
    }

  } catch (err) {
    console.error('[Assign Super Admin] Error:', err)
    process.exit(1)
  }
}

// Get user name from command line arguments
const userName = process.argv[2] || 'Tamrat Assefa Weldemesekel'
assignSuperAdminRole(userName).then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
