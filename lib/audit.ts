import { db } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"
import { headers } from "next/headers"

interface AuditEntry {
  userId?: string
  actorName?: string
  action: string
  entityType?: string
  entityId?: string
  module?: string
  details?: string
}

/**
 * Records an immutable audit-trail entry. Never throws into the caller —
 * audit failures must not break the primary operation.
 */
export async function recordAudit(entry: AuditEntry) {
  try {
    let ip: string | undefined
    try {
      const h = await headers()
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined
    } catch {
      ip = undefined
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: entry.userId ?? null,
      actorName: entry.actorName ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      module: entry.module ?? null,
      details: entry.details ?? null,
      ipAddress: ip ?? null,
    })
  } catch (err) {
    console.log("[v0] audit log failed:", (err as Error).message)
  }
}
