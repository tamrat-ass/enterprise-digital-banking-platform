import { db } from "@/lib/db"
import { roles as rolesTable, permissions, rolePermissions, userRoles, user } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { ROLES, type RoleKey, type Permission } from "@/lib/rbac"

export interface CreateRoleInput {
  name: string
  key: string
  description?: string
  level?: number
  permissionIds: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  level?: number
  permissionIds?: string[]
}

export class RBACService {
  /**
   * Seed the database with predefined roles and permissions
   */
  static async seedRolesAndPermissions() {
    try {
      console.log('[RBACService] Starting seed operation...')

      // Create all permissions
      const permissionMap: Record<string, string> = {}
      for (const roleDef of Object.values(ROLES)) {
        if (roleDef.permissions === "*") continue
        
        for (const permissionKey of roleDef.permissions) {
          if (permissionMap[permissionKey]) continue

          const [module, action] = permissionKey.split(":")
          const name = `${module} - ${action}`

          try {
            const result = await db
              .insert(permissions)
              .values({
                id: `perm-${permissionKey.replace(":", "-")}`,
                key: permissionKey,
                name,
                description: `Permission to ${action} ${module}`,
                module,
                action,
              })
              .onConflictDoNothing()
              .returning({ id: permissions.id })

            permissionMap[permissionKey] = result[0]?.id || `perm-${permissionKey.replace(":", "-")}`
          } catch (err) {
            console.error(`[RBACService] Error creating permission ${permissionKey}:`, err)
          }
        }
      }

      // Create all roles
      for (const [roleKey, roleDef] of Object.entries(ROLES)) {
        try {
          // Insert or update role
          const roleId = `role-${roleKey}`
          await db
            .insert(rolesTable)
            .values({
              id: roleId,
              key: roleKey,
              name: roleDef.name,
              description: roleDef.description,
              level: roleDef.level,
              isSystem: true,
              isActive: true,
            })
            .onConflictDoNothing()

          // Clear existing role permissions
          await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

          // Add role permissions
          if (roleDef.permissions !== "*") {
            const rolePerms = roleDef.permissions.map((permKey) => ({
              id: `rp-${roleKey}-${permKey.replace(":", "-")}`,
              roleId,
              permissionId: permissionMap[permKey] || `perm-${permKey.replace(":", "-")}`,
            }))

            for (const rolePerm of rolePerms) {
              await db
                .insert(rolePermissions)
                .values(rolePerm)
                .onConflictDoNothing()
            }
          }

          console.log(`[RBACService] Seeded role: ${roleDef.name}`)
        } catch (err) {
          console.error(`[RBACService] Error seeding role ${roleKey}:`, err)
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
    const roleId = `role-${input.key}`

    try {
      // Check if role exists
      const existing = await db.query.roles.findFirst({
        where: eq(rolesTable.key, input.key),
      })

      if (existing) {
        throw new Error(`Role with key ${input.key} already exists`)
      }

      // Create role
      await db.insert(rolesTable).values({
        id: roleId,
        key: input.key,
        name: input.name,
        description: input.description,
        level: input.level || 1,
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
   * Get all roles
   */
  static async getAllRoles() {
    try {
      const allRoles = await db
        .select()
        .from(rolesTable)
        .orderBy(rolesTable.level)

      // Enrich with permission details
      const enriched = await Promise.all(
        allRoles.map(async (role) => {
          const rolePerms = await db
            .select({
              id: permissions.id,
              key: permissions.key,
              name: permissions.name,
              module: permissions.module,
              action: permissions.action,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, role.id))

          return {
            ...role,
            permissions: rolePerms,
          }
        })
      )

      return enriched
    } catch (err) {
      console.error('[RBACService] Error fetching roles:', err)
      throw err
    }
  }

  /**
   * Get a single role with permissions
   */
  static async getRole(roleId: string) {
    try {
      const role = await db.query.roles.findFirst({
        where: eq(rolesTable.id, roleId),
      })

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      const rolePerms = await db
        .select({
          id: permissions.id,
          key: permissions.key,
          name: permissions.name,
          module: permissions.module,
          action: permissions.action,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId))

      return { ...role, permissions: rolePerms }
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
      const role = await db.query.roles.findFirst({
        where: eq(rolesTable.id, roleId),
      })

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      if (role.isSystem && input.permissionIds) {
        throw new Error("Cannot modify permissions on system roles")
      }

      // Update role
      if (input.name || input.description || input.level !== undefined) {
        await db
          .update(rolesTable)
          .set({
            name: input.name,
            description: input.description,
            level: input.level,
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
   * Assign a role to a user
   */
  static async assignRoleToUser(userId: string, roleId: string) {
    try {
      // Check role exists
      const role = await db.query.roles.findFirst({
        where: eq(rolesTable.id, roleId),
      })

      if (!role) {
        throw new Error(`Role ${roleId} not found`)
      }

      // Check user exists
      const userData = await db.query.user.findFirst({
        where: eq(user.id, userId),
      })

      if (!userData) {
        throw new Error(`User ${userId} not found`)
      }

      // Remove existing roles for this user
      await db.delete(userRoles).where(eq(userRoles.userId, userId))

      // Assign new role
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

      const grouped: Record<string, typeof perms> = {}
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
      // Get user's role
      const userRole = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .limit(1)

      if (!userRole || userRole.length === 0) return false

      // Get all permissions for this role
      const rolePerms = await db
        .select({ permissionKey: permissions.key })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, userRole[0].roleId))

      const permissionKeys = rolePerms.map(p => p.permissionKey)
      return permissionKeys.includes(permission)
    } catch (err) {
      console.error('[RBACService] Error checking permission:', err)
      return false
    }
  }
}
