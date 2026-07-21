import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/verify-setup
 * Comprehensive system verification endpoint
 * Checks database state, RBAC tables, and setup status
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Verify Setup] Running comprehensive system check...')

    const verification: Record<string, any> = {
      timestamp: new Date().toISOString(),
      checks: {},
    }

    // Check 1: Database tables exist
    const rbacTables = ['roles', 'permissions', 'role_permissions', 'user_roles']
    const tableChecks: Record<string, boolean> = {}

    for (const tableName of rbacTables) {
      try {
        const result = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = ${tableName}
          )
        `)
        tableChecks[tableName] = (result as any[])[0]?.exists || false
      } catch (err) {
        tableChecks[tableName] = false
      }
    }

    verification.checks.rbacTables = {
      status: Object.values(tableChecks).every(v => v) ? 'PASS' : 'FAIL',
      tables: tableChecks,
    }

    // Check 2: System roles exist
    try {
      const rolesResult = await db.execute(sql`
        SELECT id, name FROM roles ORDER BY name
      `)
      const allRoles = rolesResult as any[]
      const systemRoles = allRoles.filter(r => r.id.startsWith('role-'))
      
      verification.checks.systemRoles = {
        status: systemRoles.length >= 6 ? 'PASS' : 'WARN',
        count: systemRoles.length,
        roles: systemRoles.map(r => ({ id: r.id, name: r.name })),
      }
    } catch (err) {
      verification.checks.systemRoles = {
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Check 3: Permissions seeded
    try {
      const permsResult = await db.execute(sql`
        SELECT module, COUNT(*) as count FROM permissions GROUP BY module ORDER BY module
      `)
      const permsByModule = permsResult as any[]
      const totalPerms = permsByModule.reduce((sum, row) => sum + row.count, 0)

      verification.checks.permissions = {
        status: totalPerms >= 20 ? 'PASS' : 'WARN',
        totalPermissions: totalPerms,
        byModule: permsByModule.map(r => ({ module: r.module, count: r.count })),
      }
    } catch (err) {
      verification.checks.permissions = {
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Check 4: Super Admin has all permissions
    try {
      const permsCount = await db.execute(sql`
        SELECT COUNT(DISTINCT rp.permission_id) as count
        FROM role_permissions rp
        WHERE rp.role_id = 'role-super-admin'
      `)
      const count = (permsCount as any[])[0]?.count || 0

      verification.checks.superAdminPermissions = {
        status: count > 0 ? 'PASS' : 'WARN',
        permissionsAssigned: count,
      }
    } catch (err) {
      verification.checks.superAdminPermissions = {
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Check 5: Tamrat is Super Admin
    try {
      const tamratResult = await db.execute(sql`
        SELECT u.id, u.name, r.id as role_id, r.name as role_name, ur.id as assignment_id
        FROM "user" u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = 'ahadu@gmail.com'
      `)
      const tamratData = tamratResult as any[]

      if (tamratData.length > 0) {
        // Check if user has the Super Admin role (either by name "Super Admin" or "Super Administrator")
        const isSuperAdmin = tamratData.some(row => 
          row.role_name === 'Super Admin' || 
          row.role_name === 'Super Administrator' ||
          row.role_id === 'role-super-admin'
        )
        
        // Check if user has any role assigned
        const hasAnyRole = tamratData.some(row => row.role_name)
        
        verification.checks.tamratStatus = {
          status: isSuperAdmin ? 'PASS' : 'WARN',
          found: true,
          userId: tamratData[0]?.id,
          name: tamratData[0]?.name,
          email: 'ahadu@gmail.com',
          isSuperAdmin,
          hasAnyRole,
          assignedRoles: tamratData
            .filter(row => row.role_name)
            .map(row => ({ id: row.role_id, name: row.role_name })),
        }
      } else {
        verification.checks.tamratStatus = {
          status: 'FAIL',
          found: false,
          message: 'User with email ahadu@gmail.com not found',
        }
      }
    } catch (err) {
      verification.checks.tamratStatus = {
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Check 6: Document tables exist (existing functionality)
    try {
      const docResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'documents'
        )
      `)
      const documentTablesExist = (docResult as any[])[0]?.exists || false

      verification.checks.documentManagement = {
        status: documentTablesExist ? 'PASS' : 'WARN',
        documentsTableExists: documentTablesExist,
      }
    } catch (err) {
      verification.checks.documentManagement = {
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Summary
    const allChecks = Object.values(verification.checks)
    const passedChecks = allChecks.filter(c => c.status === 'PASS').length
    const failedChecks = allChecks.filter(c => c.status === 'FAIL').length
    const warnedChecks = allChecks.filter(c => c.status === 'WARN').length

    verification.summary = {
      totalChecks: allChecks.length,
      passed: passedChecks,
      failed: failedChecks,
      warned: warnedChecks,
      overallStatus: failedChecks === 0 ? 'READY' : 'ISSUES_DETECTED',
    }

    return NextResponse.json(verification, { status: 200 })
  } catch (err) {
    console.error('[Verify Setup] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

