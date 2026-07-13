import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, user, userRoles, roles as rolesTable, permissions, rolePermissions, departments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ROLES, type Permission, type RoleKey } from "@/lib/rbac"

export interface CurrentUser {
  id: string
  name: string
  email: string
  jobTitle: string | null
  roleKey: RoleKey
  roleName: string
  roleId: string | null
  departmentId: string | null
  departmentName: string | null
  permissions: Permission[]
}

/**
 * Returns the authenticated user's id, or throws. Use inside server actions.
 */
export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Resolves the full current user with role + department + permissions.
 * Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    console.log('[getCurrentUser] No session found - user not authenticated')
    return null
  }

  console.log('[getCurrentUser] Session found for user:', session.user.name)

  try {
    // Get user's primary role (first one assigned)
    const userRoleRows = await db
      .select({
        roleId: userRoles.roleId,
        roleName: rolesTable.name,
        roleKey: rolesTable.key,
        roleLevel: rolesTable.level,
      })
      .from(userRoles)
      .innerJoin(rolesTable, eq(userRoles.roleId, rolesTable.id))
      .where(eq(userRoles.userId, session.user.id))
      .limit(1)

    const userRole = userRoleRows[0]
    
    // Get profile and department info
    const profileRows = await db
      .select({
        jobTitle: profiles.jobTitle,
        departmentId: profiles.departmentId,
        departmentName: departments.name,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(eq(profiles.userId, session.user.id))
      .limit(1)

    const profile = profileRows[0]

    // Determine role key
    let roleKey: RoleKey = "staff"
    let roleName = "Staff Member"
    let roleId: string | null = null
    
    if (userRole) {
      roleKey = (userRole.roleKey as RoleKey) || "staff"
      roleName = userRole.roleName || "Staff Member"
      roleId = userRole.roleId
    }

    // Get all permissions for the role
    let permissionKeys: Permission[] = []
    if (roleId) {
      const rolePerms = await db
        .select({
          permissionKey: permissions.key,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId))

      permissionKeys = rolePerms.map(p => p.permissionKey as Permission)
    }

    // Fall back to predefined role permissions if no database permissions found
    if (permissionKeys.length === 0 && ROLES[roleKey]) {
      const predefinedPerms = ROLES[roleKey].permissions
      if (predefinedPerms === "*") {
        permissionKeys = Object.values(ROLES)
          .flatMap(role => Array.isArray(role.permissions) ? role.permissions : [])
          .filter((v, i, a) => a.indexOf(v) === i) as Permission[]
      } else if (Array.isArray(predefinedPerms)) {
        permissionKeys = predefinedPerms
      }
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      jobTitle: profile?.jobTitle ?? null,
      roleKey,
      roleName,
      roleId,
      departmentId: profile?.departmentId ?? null,
      departmentName: profile?.departmentName ?? null,
      permissions: permissionKeys,
    }
  } catch (err) {
    console.error('[getCurrentUser] Error fetching user data:', err)
    // Return basic user info with default staff permissions
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      jobTitle: null,
      roleKey: "staff",
      roleName: "Staff Member",
      roleId: null,
      departmentId: null,
      departmentName: null,
      permissions: ROLES.staff.permissions as Permission[],
    }
  }
}

/**
 * Guards a page. Redirects to /sign-in when unauthenticated.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return user
}
