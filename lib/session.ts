import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, userRoles, roles as rolesTable, permissions, rolePermissions, departments, session as sessionTable, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { type Permission } from "@/lib/rbac"

export interface CurrentUser {
  id: string
  name: string
  email: string
  jobTitle: string | null
  roleName: string
  roleId: string | null
  departmentId: string | null
  departmentName: string | null
  permissions: Permission[]
}

/**
 * Get the session token from the request headers/cookies
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie') || ''
    
    // Parse authToken from cookies
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=')
      acc[key.trim()] = decodeURIComponent(value || '')
      return acc
    }, {} as Record<string, string>)
    
    return cookies.authToken || null
  } catch (err) {
    console.error('[getSessionToken] Error parsing cookies:', err)
    return null
  }
}

/**
 * Validate our custom session from the database
 * Returns userId if valid session exists
 */
async function validateCustomSession(): Promise<string | null> {
  try {
    const token = await getSessionToken()
    if (!token) return null
    
    console.log('[validateCustomSession] Checking token:', token.substring(0, 20) + '...')
    
    // Query database for session
    const sessions = await db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.token, token))
      .limit(1)
    
    if (!sessions.length) {
      console.log('[validateCustomSession] No session found for token')
      return null
    }
    
    const sess = sessions[0]
    
    // NOTE: We do NOT check expiration anymore - tokens are static and don't expire
    // This allows for permanent session tokens without needing refresh logic
    
    console.log('[validateCustomSession] Session valid for userId:', sess.userId)
    return sess.userId
  } catch (err) {
    console.error('[validateCustomSession] Error validating session:', err)
    return null
  }
}

/**
 * Returns the authenticated user's id, or throws. Use inside server actions.
 */
export async function getUserId() {
  // First try custom session
  const customUserId = await validateCustomSession()
  if (customUserId) {
    return customUserId
  }
  
  // Fallback to Better Auth
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Internal function: Directly queries database for user data
 * Combines role, profile, department, and permissions into a SINGLE efficient query
 * 
 * OPTIMIZATION: Previously made 2 separate queries:
 *   1. userRoles + rolesTable + profiles + departments
 *   2. rolePermissions + permissions
 * 
 * Now combines into 1 query with LEFT JOIN on permissions
 */
async function fetchUserDataFromDatabase(userId: string): Promise<CurrentUser | null> {
  try {
    console.log('[fetchUserDataFromDatabase] Querying for userId:', userId)
    
    // SINGLE OPTIMIZED QUERY: Get role, profile, and ALL permissions in one go
    const result = await db
      .select({
        roleId: userRoles.roleId,
        roleName: rolesTable.name,
        jobTitle: profiles.jobTitle,
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        permissionModule: permissions.module,
        permissionKey: permissions.permissionKey,
      })
      .from(userRoles)
      .innerJoin(rolesTable, eq(userRoles.roleId, rolesTable.id))
      .leftJoin(profiles, eq(userRoles.userId, profiles.userId))
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))

    if (result.length === 0) {
      console.log('[fetchUserDataFromDatabase] No role found for user')
      return null
    }

    const row = result[0]
    console.log('[fetchUserDataFromDatabase] Found role:', row.roleName)

    // Deduplicate permissions (may have multiple rows due to join)
    const permissionKeys: Permission[] = [
      ...new Set(
        result
          .filter(r => r.permissionModule && r.permissionKey)
          .map(r => `${r.permissionModule}.${r.permissionKey}` as Permission)
      )
    ]

    console.log('[fetchUserDataFromDatabase] Found', permissionKeys.length, 'permissions')

    return {
      id: userId,
      name: '',
      email: '',
      jobTitle: row.jobTitle ?? null,
      roleName: row.roleName || "No Role Assigned",
      roleId: row.roleId || null,
      departmentId: row.departmentId ?? null,
      departmentName: row.departmentName ?? null,
      permissions: permissionKeys,
    } as CurrentUser
  } catch (err) {
    console.error('[fetchUserDataFromDatabase] Error:', err)
    throw err
  }
}

/**
 * Resolves the full current user with role + department + permissions.
 * Returns null when unauthenticated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // First try custom session
  const customUserId = await validateCustomSession()
  let userId = customUserId
  
  // If custom session fails, try Better Auth
  if (!userId) {
    const session = await auth.api.getSession({ headers: await headers() })
    userId = session?.user?.id
  }
  
  if (!userId) {
    console.log('[getCurrentUser] No session found - user not authenticated')
    return null
  }

  console.log('[getCurrentUser] Session found for userId:', userId)

  try {
    const dbData = await fetchUserDataFromDatabase(userId)
    
    // Get user from database
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    
    if (!userRecord.length) {
      console.log('[getCurrentUser] User not found in database')
      return null
    }
    
    const userData = userRecord[0]
    
    if (!dbData) {
      console.warn('[getCurrentUser] No role assigned to user')
      const fallbackUser: CurrentUser = {
        id: userId,
        name: userData.name,
        email: userData.email,
        jobTitle: null,
        roleName: "No Role Assigned",
        roleId: null,
        departmentId: null,
        departmentName: null,
        permissions: [],
      }
      return fallbackUser
    }

    const currentUser: CurrentUser = {
      id: userId,
      name: userData.name,
      email: userData.email,
      jobTitle: dbData.jobTitle,
      roleName: dbData.roleName,
      roleId: dbData.roleId,
      departmentId: dbData.departmentId,
      departmentName: dbData.departmentName,
      permissions: dbData.permissions,
    }

    console.log('[getCurrentUser] Successfully loaded user:', { 
      name: currentUser.name, 
      role: currentUser.roleName, 
      permissions: currentUser.permissions.length 
    })

    return currentUser
  } catch (err) {
    console.error('[getCurrentUser] ERROR fetching user data:', err)
    console.warn('[getCurrentUser] Falling back to no-role user')
    
    // Get minimal user info
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    
    if (!userRecord.length) return null
    
    const userData = userRecord[0]
    const fallbackUser: CurrentUser = {
      id: userId,
      name: userData.name,
      email: userData.email,
      jobTitle: null,
      roleName: "No Role Assigned",
      roleId: null,
      departmentId: null,
      departmentName: null,
      permissions: [],
    }
    return fallbackUser
  }
})

/**
 * Guards a page. Redirects to /sign-in when unauthenticated.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return user
}
