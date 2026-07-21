import { db } from "@/lib/db"
import { roles as rolesTable, permissions, rolePermissions, userRoles, user } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { ROLES, type Permission } from "@/lib/rbac"

export interface CreateRoleInput {
  name: string
  description?: string
  permissionIds: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissionIds?: string[]
}

export class RBACService {
  /**
   * Seed the database with predefined roles and permissions
   */
  static async seedRolesAndPermissions() {
    try {
      console.log('[RBACService] Starting seed operation...')

      // Map of all permissions to create
      const permissionsToCreate = [
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

      // Create permissions
      const permissionMap: Record<string, string> = {}
      for (const perm of permissionsToCreate) {
        try {
          const result = await db
            .insert(permissions)
            .values({
              id: `perm-${perm.module}-${perm.permissionKey}`,
              module: perm.module,
              permissionKey: perm.permissionKey,
              permissionName: perm.permissionName,
              description: `Permission to ${perm.permissionKey} ${perm.module}`,
            })
            .onConflictDoNothing()
            .returning({ id: permissions.id })

          permissionMap[`${perm.module}.${perm.permissionKey}`] = result[0]?.id || `perm-${perm.module}-${perm.permissionKey}`
        } catch (err) {
          console.error(`[RBACService] Error creating permission ${perm.module}.${perm.permissionKey}:`, err)
        }
      }

      // Predefined system roles
      const systemRoles = [
        {
          name: 'Super Admin',
          description: 'Full system access',
          permissions: Object.keys(permissionMap), // All permissions
        },
        {
          name: 'System Admin',
          description: 'Manage users, roles, and settings',
          permissions: [
            'dashboard.view', 'dashboard.admin',
            'users.create', 'users.view', 'users.update', 'users.delete',
            'roles.view', 'roles.create', 'roles.update', 'roles.delete',
            'audit.view',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',
          ],
        },
        {
          name: 'Document Officer',
          description: 'Upload and manage documents',
          permissions: [
            'dashboard.view',
            'documents.create', 'documents.view', 'documents.update', 'documents.upload',
            'documents.preview', 'documents.download',
            'categories.view', 'categories.create', 'categories.update',
          ],
        },
        {
          name: 'Approver',
          description: 'Review and approve documents',
          permissions: [
            'dashboard.view',
            'documents.view', 'documents.preview', 'documents.download',
            'documents.approve', 'approvals.view', 'approvals.approve',
            'categories.view',
          ],
        },
        {
          name: 'Viewer',
          description: 'View and download documents only',
          permissions: [
            'dashboard.view',
            'documents.view', 'documents.preview', 'documents.download',
            'categories.view',
          ],
        },
        {
          name: 'Auditor',
          description: 'View reports and audit logs (read-only)',
          permissions: [
            'dashboard.view',
            'documents.view', 'reports.view', 'audit.view',
            'categories.view',
          ],
        },
      ]

      // Create system roles
      for (const roleConfig of systemRoles) {
        try {
          const roleId = `role-${roleConfig.name.toLowerCase().replace(/\s+/g, '-')}`
          
          // Create role
          await db
            .insert(rolesTable)
            .values({
              id: roleId,
              name: roleConfig.name,
              description: roleConfig.description,
              isSystem: true,
              isActive: true,
            })
            .onConflictDoNothing()

          // Clear existing permissions
          await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

          // Add permissions
          for (const permKey of roleConfig.permissions) {
            const permId = permissionMap[permKey]
            if (permId) {
              await db
                .insert(rolePermissions)
                .values({
                  id: `rp-${roleId}-${permKey.replace('.', '-')}`,
                  roleId,
                  permissionId: permId,
                })
                .onConflictDoNothing()
            }
          }

          console.log(`[RBACService] Seeded role: ${roleConfig.name}`)
        } catch (err) {
          console.error(`[RBACService] Error seeding role ${roleConfig.name}:`, err)
        }
      }

      console.log('[RBACService] Seed completed successfully')
    } catch (err) {
      console.error('[RBACService] Seed error:', err)
      throw err
    }
  }

  /**
   * Create a new role
   */
  static async createRole(input: CreateRoleInput) {
    const roleId = `role-${Date.now()}`

    try {
      // Create role
      await db.insert(rolesTable).values({
        id: roleId,
        name: input.name,
        description: input.description,
        isSystem: false,
        isActive: true,
      })

      // Add permissions
      if (input.permissionIds.length > 0) {
        const rolePerms = input.permissionIds.map((permId) => ({
          id: `rp-${roleId}-${permId}`,
          roleId,
          permissionId: permId,
        }))

        await db.insert(rolePermissions).values(rolePerms)
      }

      return { id: roleId, ...input }
    } catch (err) {
      console.error('[RBACService] Error creating role:', err)
      throw err
    }
  }

  /**
   * Get all roles with permission and user counts
   */
  static async getAllRoles() {
    try {
      const allRoles = await db.select().from(rolesTable).orderBy(rolesTable.name)

      console.log('[RBACService] Found', allRoles.length, 'roles in database')

      // Enrich with permission and user counts
      const enriched = await Promise.all(
        allRoles.map(async (role) => {
          try {
            const rolePerms = await db
              .select({
                id: permissions.id,
                module: permissions.module,
                permissionKey: permissions.permissionKey,
                permissionName: permissions.permissionName,
              })
              .from(rolePermissions)
              .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
              .where(eq(rolePermissions.roleId, role.id))

            const userCount = await db
              .select()
              .from(userRoles)
              .where(eq(userRoles.roleId, role.id))

            console.log(`[RBACService] Role "${role.name}" has ${rolePerms.length} permissions and ${userCount.length} users`)

            return {
              ...role,
              permissions: rolePerms,
              permissionIds: rolePerms.map(p => p.id),
              userCount: userCount.length,
              permissionCount: rolePerms.length,
            }
          } catch (roleErr) {
            console.error(`[RBACService] Error enriching role ${role.id}:`, roleErr)
            return {
              ...role,
              permissions: [],
              permissionIds: [],
              userCount: 0,
              permissionCount: 0,
            }
          }
        })
      )

      return enriched
    } catch (err) {
      console.error('[RBACService] Error fetching roles:', err)
      console.error('[RBACService] Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
      throw err
    }
  }

  /**
   * Get a single role with permissions
   */
  static async getRole(roleId: string) {
    try {
      const roles = await db.select().from(rolesTable).where(eq(rolesTable.id, roleId))
      const role = roles[0]

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      const rolePerms = await db
        .select({
          id: permissions.id,
          module: permissions.module,
          permissionKey: permissions.permissionKey,
          permissionName: permissions.permissionName,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId))

      const userCount = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.roleId, roleId))

      return { 
        ...role, 
        permissions: rolePerms,
        permissionIds: rolePerms.map(p => p.id),
        userCount: userCount.length,
        permissionCount: rolePerms.length,
      }
    } catch (err) {
      console.error('[RBACService] Error fetching role:', err)
      throw err
    }
  }

  /**
   * Update a role
   */
  static async updateRole(roleId: string, input: UpdateRoleInput) {
    try {
      const roles = await db.select().from(rolesTable).where(eq(rolesTable.id, roleId))
      const role = roles[0]

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      // Update role
      if (input.name || input.description !== undefined) {
        await db
          .update(rolesTable)
          .set({
            name: input.name,
            description: input.description,
          })
          .where(eq(rolesTable.id, roleId))
      }

      // Update permissions if provided
      if (input.permissionIds) {
        // Clear existing
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

        // Add new
        if (input.permissionIds.length > 0) {
          const rolePerms = input.permissionIds.map((permId) => ({
            id: `rp-${roleId}-${permId}`,
            roleId,
            permissionId: permId,
          }))

          await db.insert(rolePermissions).values(rolePerms)
        }
      }

      return this.getRole(roleId)
    } catch (err) {
      console.error('[RBACService] Error updating role:', err)
      throw err
    }
  }

  /**
   * Assign a role to a user (supports multiple roles)
   */
  static async assignRoleToUser(userId: string, roleId: string) {
    try {
      // Check role exists
      const roleList = await db.select().from(rolesTable).where(eq(rolesTable.id, roleId))
      const role = roleList[0]

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      // Check user exists
      const userList = await db.select().from(user).where(eq(user.id, userId))
      const userData = userList[0]

      if (!userData) {
        throw new Error(`User ${userId} not found`)
      }

      // Check if already assigned
      const existing = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))

      if (existing.length > 0) {
        throw new Error("User already has this role")
      }

      // Assign role (support multiple roles)
      const userRoleId = `ur-${userId}-${roleId}`
      await db.insert(userRoles).values({
        id: userRoleId,
        userId,
        roleId,
        assignedBy: "system",
      })

      return { userId, roleId }
    } catch (err) {
      console.error('[RBACService] Error assigning role:', err)
      throw err
    }
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions() {
    try {
      return await db.select().from(permissions).orderBy(permissions.module)
    } catch (err) {
      console.error('[RBACService] Error fetching permissions:', err)
      throw err
    }
  }

  /**
   * Get permissions grouped by module
   */
  static async getPermissionsByModule() {
    try {
      const perms = await db.select().from(permissions).orderBy(permissions.module)

      const grouped: Record<string, Array<{
        id: string
        module: string
        permissionKey: string
        permissionName: string
        description: string | null
      }>> = {}

      for (const perm of perms) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = []
        }
        grouped[perm.module].push(perm)
      }

      return grouped
    } catch (err) {
      console.error('[RBACService] Error fetching permissions:', err)
      throw err
    }
  }

  /**
   * Check if user has permission
   */
  static async userHasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      // Get user's roles
      const userRolesList = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))

      if (!userRolesList || userRolesList.length === 0) return false

      // Parse the permission (module.permission_key)
      const [module, permissionKey] = permission.split('.')
      
      // Get all permissions for these roles
      for (const userRole of userRolesList) {
        const rolePerms = await db
          .select({ 
            module: permissions.module,
            permissionKey: permissions.permissionKey,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, userRole.roleId))

        const hasPermission = rolePerms.some(
          p => p.module === module && p.permissionKey === permissionKey
        )

        if (hasPermission) return true
      }

      return false
    } catch (err) {
      console.error('[RBACService] Error checking permission:', err)
      return false
    }
  }

  /**
   * Get user's roles with permissions
   */
  static async getUserRoles(userId: string) {
    try {
      const userRolesList = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))

      const enrichedRoles = await Promise.all(
        userRolesList.map(ur => this.getRole(ur.roleId))
      )

      return enrichedRoles
    } catch (err) {
      console.error('[RBACService] Error fetching user roles:', err)
      return []
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId: string, roleId: string) {
    try {
      await db
        .delete(userRoles)
        .where(
          and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
        )

      return { success: true }
    } catch (err) {
      console.error('[RBACService] Error removing role:', err)
      throw err
    }
  }
}