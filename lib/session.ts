import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, roles, departments } from "@/lib/db/schema"
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
  departmentId: string | null
  departmentName: string | null
  permissions: Permission[] | "*"
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

  const rows = await db
    .select({
      profileRoleId: profiles.roleId,
      jobTitle: profiles.jobTitle,
      departmentId: profiles.departmentId,
      departmentName: departments.name,
      roleName: roles.name,
      rolePermissions: roles.permissions,
    })
    .from(profiles)
    .leftJoin(roles, eq(profiles.roleId, roles.id))
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  const profile = rows[0]
  
  // Determine role key - try to match database role to predefined role
  let roleKey: RoleKey = "staff"
  if (profile?.profileRoleId) {
    // Map database role IDs to RoleKey
    const roleKeyMap: Record<string, RoleKey> = {
      "role-super-admin": "super_admin",
      "role-executive": "executive",
      "role-compliance-officer": "compliance_officer",
      "role-auditor": "auditor",
      "role-department-head": "department_head",
      "role-staff": "staff",
    }
    roleKey = roleKeyMap[profile.profileRoleId] || "staff"
  }
  
  const roleDef = ROLES[roleKey] ?? ROLES.staff
  
  // Use permissions from database if available, otherwise fall back to predefined
  let permissions: Permission[] | "*" = roleDef.permissions
  if (profile?.rolePermissions) {
    if (profile.rolePermissions === "*" || Array.isArray(profile.rolePermissions)) {
      permissions = profile.rolePermissions as Permission[] | "*"
    }
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    jobTitle: profile?.jobTitle ?? null,
    roleKey,
    roleName: profile?.roleName || roleDef.name,
    departmentId: profile?.departmentId ?? null,
    departmentName: profile?.departmentName ?? null,
    permissions,
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
