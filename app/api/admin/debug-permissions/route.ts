import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { permissions, rolePermissions, roles as rolesTable, userRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/admin/debug-permissions
 * Debug endpoint to see what permissions exist and what users have
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Debug Permissions] Starting debug...')

    // Get Super Admin role with all its permissions
    const result = await db
      .select({
        roleName: rolesTable.name,
        roleId: rolesTable.id,
        permModule: permissions.module,
        permKey: permissions.permissionKey,
        permId: permissions.id,
      })
      .from(rolesTable)
      .leftJoin(rolePermissions, eq(rolesTable.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolesTable.name, 'Super Administrator'))

    console.log('[Debug] Found', result.length, 'rows for Super Admin')
    const perms = result.filter(r => r.permModule && r.permKey).map(r => `${r.permModule}.${r.permKey}`)
    console.log('[Debug] Permissions:', perms)

    return NextResponse.json({
      success: true,
      debug: {
        roleName: result[0]?.roleName,
        roleId: result[0]?.roleId,
        totalRows: result.length,
        permissions: [...new Set(perms)],
        allPermissions: result,
      },
    })
  } catch (err) {
    console.error('[Debug Permissions] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
