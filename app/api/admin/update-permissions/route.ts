import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { getUserId } from "@/lib/session"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { permissions, rolePermissions, roles as rolesTable } from "@/lib/db/schema"

/**
 * POST /api/admin/update-permissions
 * Force update/refresh all permissions and role-permission mappings
 * 
 * This endpoint will:
 * 1. Add any missing permissions that aren't in the database
 * 2. Update role-permission mappings to include new permissions
 * 3. Preserve existing data while adding new permissions
 * 
 * This is safe to run multiple times - it uses onConflictDoNothing()
 */
export async function POST(req: NextRequest) {
  try {
    // Get current user (must be authenticated)
    let userId: string | null = null
    try {
      userId = await getUserId()
    } catch {
      userId = null
    }
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Must be signed in to update permissions',
      }, { status: 401 })
    }

    console.log('[update-permissions] Starting permission update for user:', userId)

    // Define all permissions (must match what's in seedRolesAndPermissions)
    const allPermissions = [
      // Dashboard module
      { module: 'dashboard', permissionKey: 'view', permissionName: 'View Dashboard' },
      { module: 'dashboard', permissionKey: 'create', permissionName: 'Create Dashboard Items' },
      { module: 'dashboard', permissionKey: 'edit', permissionName: 'Edit Dashboard' },
      { module: 'dashboard', permissionKey: 'delete', permissionName: 'Delete Dashboard Items' },
      { module: 'dashboard', permissionKey: 'admin', permissionName: 'Administer Dashboard' },
      // Users module
      { module: 'users', permissionKey: 'create', permissionName: 'Create Users' },
      { module: 'users', permissionKey: 'view', permissionName: 'View Users' },
      { module: 'users', permissionKey: 'update', permissionName: 'Update Users' },
      { module: 'users', permissionKey: 'delete', permissionName: 'Delete Users' },
      // Documents module
      { module: 'documents', permissionKey: 'create', permissionName: 'Create Documents' },
      { module: 'documents', permissionKey: 'view', permissionName: 'View Documents' },
      { module: 'documents', permissionKey: 'update', permissionName: 'Update Documents' },
      { module: 'documents', permissionKey: 'delete', permissionName: 'Delete Documents' },
      { module: 'documents', permissionKey: 'upload', permissionName: 'Upload Documents' },
      { module: 'documents', permissionKey: 'preview', permissionName: 'Preview Documents' },
      { module: 'documents', permissionKey: 'download', permissionName: 'Download Documents' },
      { module: 'documents', permissionKey: 'approve', permissionName: 'Approve Documents' },
      // Roles module
      { module: 'roles', permissionKey: 'create', permissionName: 'Create Roles' },
      { module: 'roles', permissionKey: 'view', permissionName: 'View Roles' },
      { module: 'roles', permissionKey: 'update', permissionName: 'Update Roles' },
      { module: 'roles', permissionKey: 'delete', permissionName: 'Delete Roles' },
      // Approvals module
      { module: 'approvals', permissionKey: 'view', permissionName: 'View Approvals' },
      { module: 'approvals', permissionKey: 'approve', permissionName: 'Approve Requests' },
      // Reports module
      { module: 'reports', permissionKey: 'view', permissionName: 'View Reports' },
      { module: 'reports', permissionKey: 'export', permissionName: 'Export Reports' },
      // Categories module
      { module: 'categories', permissionKey: 'create', permissionName: 'Create Categories' },
      { module: 'categories', permissionKey: 'view', permissionName: 'View Categories' },
      { module: 'categories', permissionKey: 'update', permissionName: 'Update Categories' },
      { module: 'categories', permissionKey: 'delete', permissionName: 'Delete Categories' },
      // Audit module
      { module: 'audit', permissionKey: 'view', permissionName: 'View Audit Logs' },
    ]

    // Create permission map
    const permissionMap: Record<string, string> = {}
    let addedCount = 0

    console.log('[update-permissions] Upserting permissions...')
    for (const perm of allPermissions) {
      try {
        const permId = `perm-${perm.module}-${perm.permissionKey}`
        
        // Try to insert - if it exists, it will be ignored
        const result = await db
          .insert(permissions)
          .values({
            id: permId,
            module: perm.module,
            permissionKey: perm.permissionKey,
            permissionName: perm.permissionName,
            description: `Permission to ${perm.permissionKey} ${perm.module}`,
          })
          .onConflictDoNothing()
          .returning({ id: permissions.id })

        if (result && result.length > 0) {
          addedCount++
          console.log(`[update-permissions] Created permission: ${perm.module}.${perm.permissionKey}`)
        }

        permissionMap[`${perm.module}.${perm.permissionKey}`] = permId
      } catch (err) {
        console.error(`[update-permissions] Error upserting permission ${perm.module}.${perm.permissionKey}:`, err)
      }
    }

    console.log(`[update-permissions] Added ${addedCount} new permissions`)

    // Now update role permissions
    const roleUpdates = [
      {
        roleName: 'Super Admin',
        permissions: Object.keys(permissionMap), // All permissions
      },
      {
        roleName: 'System Admin',
        permissions: [
          'dashboard.view', 'dashboard.admin',
          'users.create', 'users.view', 'users.update', 'users.delete',
          'roles.view', 'roles.create', 'roles.update', 'roles.delete',
          'audit.view',
          'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        ],
      },
      {
        roleName: 'Document Officer',
        permissions: [
          'dashboard.view',
          'documents.create', 'documents.view', 'documents.update', 'documents.upload',
          'documents.preview', 'documents.download',
          'categories.view', 'categories.create', 'categories.update',
        ],
      },
      {
        roleName: 'Approver',
        permissions: [
          'dashboard.view',
          'documents.view', 'documents.preview', 'documents.download',
          'documents.approve', 'approvals.view', 'approvals.approve',
          'categories.view',
        ],
      },
      {
        roleName: 'Viewer',
        permissions: [
          'dashboard.view',
          'documents.view', 'documents.preview', 'documents.download',
          'categories.view',
        ],
      },
      {
        roleName: 'Auditor',
        permissions: [
          'dashboard.view',
          'documents.view', 'reports.view', 'audit.view',
          'categories.view',
        ],
      },
    ]

    let roleUpdateCount = 0

    console.log('[update-permissions] Updating role permissions...')
    for (const roleConfig of roleUpdates) {
      try {
        // Find the role
        const existingRoles = await db
          .select()
          .from(rolesTable)
          .where(db.eq(rolesTable.name, roleConfig.roleName))

        if (existingRoles.length === 0) {
          console.warn(`[update-permissions] Role not found: ${roleConfig.roleName}`)
          continue
        }

        const roleId = existingRoles[0].id

        // Add missing permissions to this role
        for (const permKey of roleConfig.permissions) {
          const permId = permissionMap[permKey]
          if (permId) {
            try {
              const rpId = `rp-${roleId}-${permKey.replace('.', '-')}`
              
              // Try to insert - if it exists, it will be ignored
              const result = await db
                .insert(rolePermissions)
                .values({
                  id: rpId,
                  roleId,
                  permissionId: permId,
                })
                .onConflictDoNothing()
                .returning({ id: rolePermissions.id })

              if (result && result.length > 0) {
                roleUpdateCount++
              }
            } catch (err) {
              console.error(`[update-permissions] Error adding permission to role:`, err)
            }
          }
        }

        console.log(`[update-permissions] Updated role: ${roleConfig.roleName}`)
      } catch (err) {
        console.error(`[update-permissions] Error updating role ${roleConfig.roleName}:`, err)
      }
    }

    console.log(`[update-permissions] Updated ${roleUpdateCount} role-permission mappings`)

    // Get final counts
    const finalPerms = await db.select().from(permissions)
    const finalRolePerms = await db.select().from(rolePermissions)

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      added: {
        permissions: addedCount,
        rolePermissions: roleUpdateCount,
      },
      totals: {
        totalPermissions: finalPerms.length,
        totalRolePermissions: finalRolePerms.length,
      },
    }, { status: 200 })
  } catch (err) {
    console.error('[update-permissions] Error:', err)
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update permissions',
      error: err instanceof Error ? err.message : undefined,
    }, { status: 500 })
  }
}
