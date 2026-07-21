import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/fix-permissions
 * Fix Super Admin permissions - ensure they have all document permissions
 * This is a one-time setup endpoint
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Fix Permissions] Starting permission fix...')

    // 1. Get all document permissions
    const docPermsResult = await db.execute(sql`
      SELECT id FROM permissions 
      WHERE module = 'documents'
    `)
    const docPerms = docPermsResult as any[]
    console.log(`[Fix Permissions] Found ${docPerms.length} document permissions`)

    // 2. Get Super Admin role
    const superAdminResult = await db.execute(sql`
      SELECT id FROM roles WHERE name = 'Super Administrator' OR name = 'Super Admin'
    `)
    const superAdmin = (superAdminResult as any[])[0]
    
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Super Admin role not found',
      }, { status: 404 })
    }

    console.log(`[Fix Permissions] Super Admin role ID: ${superAdmin.id}`)

    // 3. Get existing role-permission links for Super Admin
    const existingResult = await db.execute(sql`
      SELECT permission_id FROM role_permissions WHERE role_id = ${superAdmin.id}
    `)
    const existing = new Set((existingResult as any[]).map(r => r.permission_id))
    console.log(`[Fix Permissions] Super Admin already has ${existing.size} permissions`)

    // 4. Add missing document permissions
    let added = 0
    for (const perm of docPerms) {
      if (!existing.has(perm.id)) {
        await db.execute(sql`
          INSERT INTO role_permissions (id, role_id, permission_id)
          VALUES (${`rp-${superAdmin.id}-${perm.id}`.substring(0, 20)}, ${superAdmin.id}, ${perm.id})
          ON CONFLICT DO NOTHING
        `)
        added++
        console.log(`[Fix Permissions] Added permission: ${perm.id}`)
      }
    }

    console.log(`[Fix Permissions] Added ${added} missing permissions`)

    // 5. Get all permissions and add to Super Admin
    const allPermsResult = await db.execute(sql`
      SELECT id FROM permissions
    `)
    const allPerms = allPermsResult as any[]
    
    let totalAdded = 0
    for (const perm of allPerms) {
      if (!existing.has(perm.id)) {
        try {
          await db.execute(sql`
            INSERT INTO role_permissions (id, role_id, permission_id)
            VALUES (${`rp-${superAdmin.id}-${perm.id}`.substring(0, 50)}, ${superAdmin.id}, ${perm.id})
            ON CONFLICT DO NOTHING
          `)
          totalAdded++
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed permissions - added ${totalAdded} permissions to Super Admin`,
      details: {
        superAdminRoleId: superAdmin.id,
        permissionsAdded: totalAdded,
        totalPermissions: allPerms.length,
      },
    })
  } catch (err) {
    console.error('[Fix Permissions] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
