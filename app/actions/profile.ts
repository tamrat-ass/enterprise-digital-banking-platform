"use server"

import { db } from "@/lib/db"
import { profiles, departments } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { getUserId } from "@/lib/session"
import { recordAudit } from "@/lib/audit"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import type { RoleKey } from "@/lib/rbac"

/**
 * Creates a profile for the just-registered user. The very first user to
 * register becomes the Super Administrator; everyone else gets the role they
 * selected (defaulting to staff).
 */
export async function createProfile(input: {
  roleId: RoleKey
  departmentId: string | null
  jobTitle: string | null
}) {
  const userId = await getUserId()
  const session = await auth.api.getSession({ headers: await headers() })

  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(profiles)
    .where(eq(profiles.userId, userId))

  if (existing > 0) return { ok: true }

  // First registered user across the whole platform becomes super_admin.
  const [{ value: total }] = await db.select({ value: count() }).from(profiles)
  const roleId: RoleKey = total === 0 ? "super_admin" : input.roleId

  await db.insert(profiles).values({
    id: crypto.randomUUID(),
    userId,
    fullName: session?.user.name ?? null,
    email: session?.user.email ?? null,
    jobTitle: input.jobTitle,
    departmentId: input.departmentId,
    roleId,
    status: "active",
  })

  await recordAudit({
    userId,
    actorName: session?.user.name,
    action: "user.registered",
    entityType: "user",
    entityId: userId,
    module: "Users",
    details: `Registered with role ${roleId}`,
  })

  return { ok: true }
}

export async function getDepartmentsList() {
  return db.select().from(departments).orderBy(departments.name)
}
