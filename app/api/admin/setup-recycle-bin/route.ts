/**
 * Setup Recycle Bin Permissions
 * POST /api/admin/setup-recycle-bin
 * Inserts recycle bin permissions into the database
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { permissions as permissionsTable, rolePermissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePermission, successResponse, errorResponse } from '@/lib/api-utils'

export const POST = async (req: NextRequest) => {
  const { error } = await requirePermission(req, 'roles.view')
  if (error) return error

  try {
    console.log('[Setup Recycle Bin] Starting setup...')

    // Define recycle bin permissions
    const recycleBinPermissions = [
      {
        module: 'recycleBin',
        permissionKey: 'view',
        permissionName: 'View Recycle Bin',
        description: 'Permission to view recycle bin and deleted files',
      },
      {
        module: 'file',
        permissionKey: 'delete',
        permissionName: 'Delete Files',
        description: 'Permission to delete files (soft delete)',
      },
      {
        module: 'file',
        permissionKey: 'restore',
        permissionName: 'Restore Files',
        description: 'Permission to restore files from recycle bin',
      },
      {
        module: 'file',
        permissionKey: 'permanentDelete',
        permissionName: 'Permanently Delete Files',
        description: 'Permission to permanently delete files',
      },
    ]

    const createdPermissions: Record<string, string> = {}

    // Create permissions
    for (const perm of recycleBinPermissions) {
      try {
        const permId = `perm-${perm.module}-${perm.permissionKey}`

        // Check if permission already exists
        const existing = await db
          .select()
          .from(permissionsTable)
          .where(eq(permissionsTable.id, permId))

        if (existing.length === 0) {
          const result = await db
            .insert(permissionsTable)
            .values({
              id: permId,
              module: perm.module,
              permissionKey: perm.permissionKey,
              permissionName: perm.permissionName,
              description: perm.description,
            })
            .returning({ id: permissionsTable.id })

          createdPermissions[`${perm.module}.${perm.permissionKey}`] = result[0]?.id || permId
          console.log(`[Setup Recycle Bin] Created permission: ${perm.module}.${perm.permissionKey}`)
        } else {
          createdPermissions[`${perm.module}.${perm.permissionKey}`] = existing[0].id
          console.log(`[Setup Recycle Bin] Permission already exists: ${perm.module}.${perm.permissionKey}`)
        }
      } catch (err) {
        console.error(`[Setup Recycle Bin] Error creating permission ${perm.module}.${perm.permissionKey}:`, err)
      }
    }

    return successResponse({
      message: 'Recycle bin permissions setup completed',
      permissionsCreated: Object.keys(createdPermissions).length,
      permissions: createdPermissions,
    })
  } catch (err) {
    console.error('[Setup Recycle Bin] Error:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to setup recycle bin permissions',
      500
    )
  }
}
