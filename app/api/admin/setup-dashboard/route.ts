import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { permissions, rolePermissions, roles as rolesTable } from "@/lib/db/schema"

/**
 * POST /api/admin/setup-dashboard
 * Quick endpoint to add dashboard permissions directly
 * 
 * No auth check - can be called to quickly add dashboard permissions
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[setup-dashboard] Starting dashboard permission setup...')

    // Step 1: Add dashboard permissions
    const dashboardPerms = [
      { id: 'perm-dashboard-view', key: 'view', name: 'View Dashboard' },
      { id: 'perm-dashboard-create', key: 'create', name: 'Create Dashboard Items' },
      { id: 'perm-dashboard-edit', key: 'edit', name: 'Edit Dashboard' },
      { id: 'perm-dashboard-delete', key: 'delete', name: 'Delete Dashboard Items' },
      { id: 'perm-dashboard-admin', key: 'admin', name: 'Administer Dashboard' },
    ]

    const permIds: Record<string, string> = {}

    console.log('[setup-dashboard] Inserting dashboard permissions...')
    for (const perm of dashboardPerms) {
      try {
        const result = await db
          .insert(permissions)
          .values({
            id: perm.id,
            module: 'dashboard',
            permissionKey: perm.key,
            permissionName: perm.name,
            description: `Permission to ${perm.key} dashboard`,
          })
          .onConflictDoNothing()
          .returning({ id: permissions.id })

        if (result && result.length > 0) {
          permIds[perm.key] = perm.id
          console.log(`[setup-dashboard] Inserted: dashboard.${perm.key}`)
        } else {
          permIds[perm.key] = perm.id
          console.log(`[setup-dashboard] Already exists: dashboard.${perm.key}`)
        }
      } catch (err) {
        console.error(`[setup-dashboard] Error inserting ${perm.key}:`, err)
        permIds[perm.key] = perm.id
      }
    }

    // Step 2: Find all roles and add dashboard.view to them
    console.log('[setup-dashboard] Adding dashboard.view to all roles...')
    const allRoles = await db.select().from(rolesTable)
    
    let rolesUpdated = 0
    for (const role of allRoles) {
      try {
        // Check if dashboard.view is already assigned
        const existing = await db
          .select()
          .from(rolePermissions)
          .where(
            db.and(
              db.eq(rolePermissions.roleId, role.id),
              db.eq(rolePermissions.permissionId, 'perm-dashboard-view')
            )
          )

        if (existing.length === 0) {
          await db
            .insert(rolePermissions)
            .values({
              id: `rp-${role.id}-dashboard-view`,
              roleId: role.id,
              permissionId: 'perm-dashboard-view',
            })
            .onConflictDoNothing()
          
          rolesUpdated++
          console.log(`[setup-dashboard] Added dashboard.view to role: ${role.name}`)
        }
      } catch (err) {
        console.error(`[setup-dashboard] Error adding to role ${role.id}:`, err)
      }
    }

    // Step 3: Add dashboard.admin to System Admin and Super Admin
    console.log('[setup-dashboard] Adding dashboard.admin to admin roles...')
    const adminRoles = await db
      .select()
      .from(rolesTable)
      .where(
        db.or(
          db.eq(rolesTable.name, 'System Admin'),
          db.eq(rolesTable.name, 'Super Admin')
        )
      )

    let adminRolesUpdated = 0
    for (const role of adminRoles) {
      try {
        const existing = await db
          .select()
          .from(rolePermissions)
          .where(
            db.and(
              db.eq(rolePermissions.roleId, role.id),
              db.eq(rolePermissions.permissionId, 'perm-dashboard-admin')
            )
          )

        if (existing.length === 0) {
          await db
            .insert(rolePermissions)
            .values({
              id: `rp-${role.id}-dashboard-admin`,
              roleId: role.id,
              permissionId: 'perm-dashboard-admin',
            })
            .onConflictDoNothing()
          
          adminRolesUpdated++
          console.log(`[setup-dashboard] Added dashboard.admin to role: ${role.name}`)
        }
      } catch (err) {
        console.error(`[setup-dashboard] Error adding admin to role ${role.id}:`, err)
      }
    }

    const finalPerms = await db.select().from(permissions).where(db.eq(permissions.module, 'dashboard'))
    
    return NextResponse.json({
      success: true,
      message: '✅ Dashboard permissions setup complete!',
      added: {
        permissions: dashboardPerms.length,
        rolesWithView: rolesUpdated,
        adminRoles: adminRolesUpdated,
      },
      dashboard_permissions: finalPerms.map(p => `${p.module}.${p.permissionKey}`),
    }, { status: 200 })
  } catch (err) {
    console.error('[setup-dashboard] Error:', err)
    return NextResponse.json({
      success: false,
      message: '❌ Failed to setup dashboard permissions',
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/setup-dashboard
 * Check current dashboard permissions status
 */
export async function GET(req: NextRequest) {
  try {
    const dashboardPerms = await db
      .select()
      .from(permissions)
      .where(db.eq(permissions.module, 'dashboard'))

    return NextResponse.json({
      success: true,
      dashboard_permissions_count: dashboardPerms.length,
      dashboard_permissions: dashboardPerms.map(p => ({
        id: p.id,
        module: p.module,
        permissionKey: p.permissionKey,
        permissionName: p.permissionName,
      })),
    }, { status: 200 })
  } catch (err) {
    console.error('[setup-dashboard] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
