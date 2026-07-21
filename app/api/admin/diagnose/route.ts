import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { db } from "@/lib/db"
import { user, userRoles, roles as rolesTable, permissions, rolePermissions } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

/**
 * GET /api/admin/diagnose
 * Diagnostic endpoint to troubleshoot permission and database issues
 * No authentication required for debugging
 */
export async function GET(req: NextRequest) {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      checks: {},
    }

    // 1. Database Connection Check
    try {
      console.log('[Diagnose] Checking database connection...')
      const result = await db.select(sql`1`).from(user).limit(1)
      diagnostics.checks.database = {
        status: "✅ Connected",
        message: "Database connection successful",
      }
    } catch (err) {
      diagnostics.checks.database = {
        status: "❌ Failed",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 2. Session/User Check
    try {
      console.log('[Diagnose] Checking current user session...')
      const currentUser = await getCurrentUser()
      if (currentUser) {
        diagnostics.checks.session = {
          status: "✅ Authenticated",
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          roleName: currentUser.roleName,
          roleId: currentUser.roleId,
          permissions: currentUser.permissions,
          permissionCount: currentUser.permissions.length,
        }
      } else {
        diagnostics.checks.session = {
          status: "⚠️ Not Authenticated",
          message: "No active session found",
        }
      }
    } catch (err) {
      diagnostics.checks.session = {
        status: "❌ Error",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 3. User Roles Table Check
    try {
      console.log('[Diagnose] Checking user_roles table...')
      const userRoleCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(userRoles)

      diagnostics.checks.userRoles = {
        status: "✅ Accessible",
        totalRows: userRoleCount[0]?.count || 0,
      }
    } catch (err) {
      diagnostics.checks.userRoles = {
        status: "❌ Error",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 4. Roles Table Check
    try {
      console.log('[Diagnose] Checking roles table...')
      const rolesList = await db.select().from(rolesTable).limit(10)
      diagnostics.checks.roles = {
        status: "✅ Accessible",
        totalRoles: rolesList.length,
        roles: rolesList.map(r => ({
          id: r.id,
          name: r.name,
          isSystem: r.isSystem,
        })),
      }
    } catch (err) {
      diagnostics.checks.roles = {
        status: "❌ Error",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 5. Permissions Table Check
    try {
      console.log('[Diagnose] Checking permissions table...')
      const permCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(permissions)

      diagnostics.checks.permissions = {
        status: "✅ Accessible",
        totalPermissions: permCount[0]?.count || 0,
      }
    } catch (err) {
      diagnostics.checks.permissions = {
        status: "❌ Error",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 6. Role Permissions Table Check
    try {
      console.log('[Diagnose] Checking role_permissions table...')
      const rolePermCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(rolePermissions)

      diagnostics.checks.rolePermissions = {
        status: "✅ Accessible",
        totalAssignments: rolePermCount[0]?.count || 0,
      }
    } catch (err) {
      diagnostics.checks.rolePermissions = {
        status: "❌ Error",
        message: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 7. Sample User Check (if authenticated)
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        console.log('[Diagnose] Checking sample user role and permissions...')
        
        const userRoleData = await db
          .select({
            roleId: userRoles.roleId,
            roleName: rolesTable.name,
          })
          .from(userRoles)
          .innerJoin(rolesTable, eq(userRoles.roleId, rolesTable.id))
          .where(eq(userRoles.userId, currentUser.id))
          .limit(1)

        const rolePerms = userRoleData[0]
          ? await db
              .select({
                module: permissions.module,
                permissionKey: permissions.permissionKey,
                permissionName: permissions.permissionName,
              })
              .from(rolePermissions)
              .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
              .where(eq(rolePermissions.roleId, userRoleData[0].roleId))
          : []

        diagnostics.checks.currentUserDetails = {
          status: "✅ Retrieved",
          userId: currentUser.id,
          roleAssignment: userRoleData[0] || { status: "No role assigned" },
          databasePermissions: rolePerms.map(p => `${p.module}.${p.permissionKey}`),
          sessionPermissions: currentUser.permissions,
          permissionsMatch: 
            JSON.stringify(rolePerms.map(p => `${p.module}.${p.permissionKey}`).sort()) ===
            JSON.stringify(currentUser.permissions.sort()),
        }
      }
    } catch (err) {
      diagnostics.checks.currentUserDetails = {
        status: "ℹ️ Skipped",
        message: "Not authenticated or error occurred",
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }

    console.log('[Diagnose] Diagnostics complete:', JSON.stringify(diagnostics, null, 2))

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (err) {
    console.error('[Diagnose] Unexpected error:', err)
    return NextResponse.json(
      {
        status: "❌ Fatal Error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
