import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, userRoles, roles as rolesTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * POST /api/admin/make-super-admin
 * Make a user a Super Admin
 * Query params: email or userId
 */
export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json()

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: "Either email or userId is required" },
        { status: 400 }
      )
    }

    // Find the user
    let targetUserId = userId
    if (!targetUserId && email) {
      const users = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.email, email))
      
      if (users.length === 0) {
        return NextResponse.json(
          { success: false, error: `User with email ${email} not found` },
          { status: 404 }
        )
      }
      
      targetUserId = users[0].id
      console.log(`[Make Super Admin] Found user: ${users[0].name} (${users[0].email})`)
    }

    // Find Super Admin role
    const superAdminRoles = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.name, "Super Admin"))

    if (superAdminRoles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Super Admin role not found. Run POST /api/rbac/seed first" },
        { status: 404 }
      )
    }

    const superAdminRoleId = superAdminRoles[0].id

    // Remove existing roles
    await db.delete(userRoles).where(eq(userRoles.userId, targetUserId))

    // Assign Super Admin role
    await db.insert(userRoles).values({
      id: `ur-${targetUserId}-${superAdminRoleId}`,
      userId: targetUserId,
      roleId: superAdminRoleId,
      assignedBy: "system",
    })

    return NextResponse.json(
      { 
        success: true, 
        message: `User has been made Super Admin`,
        userId: targetUserId,
        roleId: superAdminRoleId,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error("[Make Super Admin] Error:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

