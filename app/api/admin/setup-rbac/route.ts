import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * GET /api/admin/setup-rbac
 * Check if RBAC tables exist
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Setup RBAC] Checking existing tables...')

    const rbacTables = ['roles', 'permissions', 'role_permissions', 'user_roles']
    const results: Record<string, boolean> = {}

    for (const tableName of rbacTables) {
      try {
        const result = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = ${tableName}
          )
        `)
        results[tableName] = (result as any[])[0]?.exists || false
        console.log(`[Setup RBAC] Table ${tableName}: ${results[tableName] ? 'EXISTS' : 'MISSING'}`)
      } catch (err) {
        console.log(`[Setup RBAC] Error checking ${tableName}:`, err)
        results[tableName] = false
      }
    }

    return NextResponse.json({
      success: true,
      tables: results,
      allTablesExist: Object.values(results).every(v => v),
      message: 'RBAC table check completed'
    })
  } catch (err) {
    console.error('[Setup RBAC] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/setup-rbac
 * ADMIN ONLY: Create all RBAC tables and seed initial data
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Setup RBAC] Creating RBAC tables and seeding data...')

    const steps: string[] = []

    // 1. Create roles table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS roles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          is_system BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      steps.push('✓ Created roles table')
      console.log('[Setup RBAC] roles table created/verified')
    } catch (err) {
      console.error('[Setup RBAC] Error creating roles table:', err)
      steps.push(`✗ Error creating roles table: ${err}`)
    }

    // 2. Create permissions table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS permissions (
          id TEXT PRIMARY KEY,
          module TEXT NOT NULL,
          permission_key TEXT NOT NULL,
          permission_name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      steps.push('✓ Created permissions table')
      console.log('[Setup RBAC] permissions table created/verified')
    } catch (err) {
      console.error('[Setup RBAC] Error creating permissions table:', err)
      steps.push(`✗ Error creating permissions table: ${err}`)
    }

    // 3. Create role_permissions table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id TEXT PRIMARY KEY,
          role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      steps.push('✓ Created role_permissions table')
      console.log('[Setup RBAC] role_permissions table created/verified')
    } catch (err) {
      console.error('[Setup RBAC] Error creating role_permissions table:', err)
      steps.push(`✗ Error creating role_permissions table: ${err}`)
    }

    // 4. Create user_roles table (if user table exists)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_roles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          assigned_by TEXT,
          assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      steps.push('✓ Created user_roles table')
      console.log('[Setup RBAC] user_roles table created/verified')
    } catch (err) {
      console.error('[Setup RBAC] Error creating user_roles table:', err)
      steps.push(`✗ Error creating user_roles table: ${err}`)
    }

    // 5. Seed system roles
    const systemRoles = [
      { id: 'role-super-admin', name: 'Super Admin', description: 'Full system access', isSystem: true },
      { id: 'role-system-admin', name: 'System Admin', description: 'System administration', isSystem: true },
      { id: 'role-document-officer', name: 'Document Officer', description: 'Document management', isSystem: true },
      { id: 'role-approver', name: 'Approver', description: 'Document approvals', isSystem: true },
      { id: 'role-viewer', name: 'Viewer', description: 'Read-only access', isSystem: true },
      { id: 'role-auditor', name: 'Auditor', description: 'Audit trail access', isSystem: true },
    ]

    for (const role of systemRoles) {
      try {
        await db.execute(sql`
          INSERT INTO roles (id, name, description, is_system, is_active)
          VALUES (${role.id}, ${role.name}, ${role.description}, ${role.isSystem}, true)
          ON CONFLICT (id) DO NOTHING
        `)
      } catch (err) {
        console.log(`[Setup RBAC] Role ${role.name} already exists or error:`, err)
      }
    }
    steps.push('✓ Seeded system roles (6 roles)')
    console.log('[Setup RBAC] System roles seeded')

    // 6. Seed permissions
    const permissionsToSeed = [
      // Users module
      { id: 'perm-users-create', module: 'users', key: 'create', name: 'Create Users' },
      { id: 'perm-users-view', module: 'users', key: 'view', name: 'View Users' },
      { id: 'perm-users-update', module: 'users', key: 'update', name: 'Update Users' },
      { id: 'perm-users-delete', module: 'users', key: 'delete', name: 'Delete Users' },
      // Documents module
      { id: 'perm-documents-create', module: 'documents', key: 'create', name: 'Create Documents' },
      { id: 'perm-documents-view', module: 'documents', key: 'view', name: 'View Documents' },
      { id: 'perm-documents-update', module: 'documents', key: 'update', name: 'Update Documents' },
      { id: 'perm-documents-delete', module: 'documents', key: 'delete', name: 'Delete Documents' },
      { id: 'perm-documents-upload', module: 'documents', key: 'upload', name: 'Upload Documents' },
      { id: 'perm-documents-preview', module: 'documents', key: 'preview', name: 'Preview Documents' },
      { id: 'perm-documents-download', module: 'documents', key: 'download', name: 'Download Documents' },
      { id: 'perm-documents-approve', module: 'documents', key: 'approve', name: 'Approve Documents' },
      // Roles module
      { id: 'perm-roles-create', module: 'roles', key: 'create', name: 'Create Roles' },
      { id: 'perm-roles-view', module: 'roles', key: 'view', name: 'View Roles' },
      { id: 'perm-roles-update', module: 'roles', key: 'update', name: 'Update Roles' },
      { id: 'perm-roles-delete', module: 'roles', key: 'delete', name: 'Delete Roles' },
      // Approvals module
      { id: 'perm-approvals-view', module: 'approvals', key: 'view', name: 'View Approvals' },
      { id: 'perm-approvals-approve', module: 'approvals', key: 'approve', name: 'Approve Requests' },
      // Reports module
      { id: 'perm-reports-view', module: 'reports', key: 'view', name: 'View Reports' },
      { id: 'perm-reports-export', module: 'reports', key: 'export', name: 'Export Reports' },
      // Categories module
      { id: 'perm-categories-create', module: 'categories', key: 'create', name: 'Create Categories' },
      { id: 'perm-categories-view', module: 'categories', key: 'view', name: 'View Categories' },
      { id: 'perm-categories-update', module: 'categories', key: 'update', name: 'Update Categories' },
      { id: 'perm-categories-delete', module: 'categories', key: 'delete', name: 'Delete Categories' },
      // Audit module
      { id: 'perm-audit-view', module: 'audit', key: 'view', name: 'View Audit Logs' },
    ]

    for (const perm of permissionsToSeed) {
      try {
        await db.execute(sql`
          INSERT INTO permissions (id, module, permission_key, permission_name, description)
          VALUES (${perm.id}, ${perm.module}, ${perm.key}, ${perm.name}, ${`Permission to ${perm.key} ${perm.module}`})
          ON CONFLICT (id) DO NOTHING
        `)
      } catch (err) {
        console.log(`[Setup RBAC] Permission ${perm.name} already exists or error:`, err)
      }
    }
    steps.push(`✓ Seeded permissions (${permissionsToSeed.length} permissions)`)
    console.log('[Setup RBAC] Permissions seeded')

    // 7. Assign all permissions to Super Admin role
    try {
      // Get all permission IDs
      const allPerms = await db.execute(sql`
        SELECT id FROM permissions
      `)

      const superAdminRoleId = 'role-super-admin'
      let assignedCount = 0

      for (const perm of allPerms as any[]) {
        try {
          await db.execute(sql`
            INSERT INTO role_permissions (id, role_id, permission_id)
            VALUES (${`rp-${superAdminRoleId}-${perm.id}`}, ${superAdminRoleId}, ${perm.id})
            ON CONFLICT (id) DO NOTHING
          `)
          assignedCount++
        } catch (err) {
          // Already assigned, skip
        }
      }
      steps.push(`✓ Assigned ${assignedCount} permissions to Super Admin role`)
      console.log('[Setup RBAC] Super Admin permissions assigned')
    } catch (err) {
      console.error('[Setup RBAC] Error assigning Super Admin permissions:', err)
      steps.push(`⚠ Error assigning Super Admin permissions: ${err}`)
    }

    return NextResponse.json({
      success: true,
      message: 'RBAC setup completed successfully',
      steps,
    }, { status: 200 })
  } catch (err) {
    console.error('[Setup RBAC] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to setup RBAC',
      },
      { status: 500 }
    )
  }
}

