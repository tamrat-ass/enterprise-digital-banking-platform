import { db } from "@/lib/db"
import { risks, complianceItems } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { recordAudit } from "@/lib/audit"
import type {
  CreateRiskInput,
  UpdateRiskInput,
  CreateComplianceInput,
  UpdateComplianceInput,
} from "@/lib/schemas"

/**
 * Risk Service - Handles risk management
 */

export class RiskService {
  /**
   * Create a new risk
   */
  static async createRisk(
    input: CreateRiskInput,
    userId: string,
    userName: string,
  ) {
    const riskId = crypto.randomUUID()

    // Calculate severity based on likelihood and impact
    const severityScore = (input.likelihood || 3) * (input.impact || 3)
    let severity: "low" | "medium" | "high" | "critical" = "low"
    if (severityScore >= 20) severity = "critical"
    else if (severityScore >= 12) severity = "high"
    else if (severityScore >= 6) severity = "medium"

    await db.insert(risks).values({
      id: riskId,
      title: input.title,
      description: input.description,
      category: input.category,
      departmentId: input.departmentId,
      likelihood: input.likelihood || 3,
      impact: input.impact || 3,
      severity,
      status: input.status || "open",
      ownerName: userName,
      control: input.control,
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "risk.created",
      entityType: "risk",
      entityId: riskId,
      module: "risk",
      details: `Created risk: ${input.title} (Severity: ${severity})`,
    })

    return { id: riskId, severity, ...input }
  }

  /**
   * Update risk
   */
  static async updateRisk(
    riskId: string,
    input: UpdateRiskInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {}

    if (input.title) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.category) updates.category = input.category
    if (input.likelihood) updates.likelihood = input.likelihood
    if (input.impact) updates.impact = input.impact
    if (input.status) updates.status = input.status
    if (input.control) updates.control = input.control

    // Recalculate severity if likelihood or impact changed
    if (input.likelihood || input.impact) {
      const existing = await db.query.risks.findFirst({
        where: eq(risks.id, riskId),
      })
      if (existing) {
        const newLikelihood = input.likelihood || existing.likelihood
        const newImpact = input.impact || existing.impact
        const severityScore = newLikelihood * newImpact

        let severity: "low" | "medium" | "high" | "critical" = "low"
        if (severityScore >= 20) severity = "critical"
        else if (severityScore >= 12) severity = "high"
        else if (severityScore >= 6) severity = "medium"

        updates.severity = severity
      }
    }

    await db.update(risks).set(updates).where(eq(risks.id, riskId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "risk.updated",
      entityType: "risk",
      entityId: riskId,
      module: "risk",
      details: "Updated risk",
    })
  }

  /**
   * Get risk
   */
  static async getRisk(riskId: string) {
    const risk = await db.query.risks.findFirst({
      where: eq(risks.id, riskId),
    })

    if (!risk) throw new Error("Risk not found")
    return risk
  }

  /**
   * List risks
   */
  static async listRisks(
    page = 1,
    limit = 20,
    filters?: {
      category?: string
      severity?: string
      status?: string
      departmentId?: string
    },
  ) {
    const offset = (page - 1) * limit
    const whereConditions: any[] = []

    if (filters?.category)
      whereConditions.push(eq(risks.category, filters.category))
    if (filters?.severity)
      whereConditions.push(eq(risks.severity, filters.severity))
    if (filters?.status) whereConditions.push(eq(risks.status, filters.status))
    if (filters?.departmentId)
      whereConditions.push(eq(risks.departmentId, filters.departmentId))

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(risks)
        .where(where)
        .orderBy(desc(risks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`COUNT(*)` }).from(risks).where(where),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get risk statistics
   */
  static async getRiskStats() {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        critical: sql<number>`COUNT(CASE WHEN severity = 'critical' THEN 1 END)`,
        high: sql<number>`COUNT(CASE WHEN severity = 'high' THEN 1 END)`,
        open: sql<number>`COUNT(CASE WHEN status = 'open' THEN 1 END)`,
        mitigated: sql<number>`COUNT(CASE WHEN status = 'mitigated' THEN 1 END)`,
      })
      .from(risks)

    return stats
  }

  /**
   * Delete risk (soft delete)
   */
  static async deleteRisk(
    riskId: string,
    userId: string,
    userName: string,
  ) {
    await db
      .update(risks)
      .set({ status: "resolved" })
      .where(eq(risks.id, riskId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "risk.deleted",
      entityType: "risk",
      entityId: riskId,
      module: "risk",
      details: "Risk resolved",
    })
  }
}

/**
 * Compliance Service - Handles compliance tracking
 */

export class ComplianceService {
  /**
   * Create compliance item
   */
  static async createComplianceItem(
    input: CreateComplianceInput,
    userId: string,
    userName: string,
  ) {
    const itemId = crypto.randomUUID()

    await db.insert(complianceItems).values({
      id: itemId,
      framework: input.framework,
      controlRef: input.controlRef,
      title: input.title,
      description: input.description,
      status: input.status || "not_assessed",
      ownerName: input.ownerName || userName,
      nextReview: input.nextReview
        ? new Date(input.nextReview)
        : null,
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "compliance.created",
      entityType: "compliance_item",
      entityId: itemId,
      module: "compliance",
      details: `Created compliance item: ${input.title}`,
    })

    return { id: itemId, ...input }
  }

  /**
   * Update compliance item
   */
  static async updateComplianceItem(
    itemId: string,
    input: UpdateComplianceInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {}

    if (input.title) updates.title = input.title
    if (input.description !== undefined)
      updates.description = input.description
    if (input.framework) updates.framework = input.framework
    if (input.controlRef) updates.controlRef = input.controlRef
    if (input.status) updates.status = input.status
    if (input.ownerName) updates.ownerName = input.ownerName
    if (input.nextReview) updates.nextReview = new Date(input.nextReview)

    updates.lastReviewed = new Date()

    await db
      .update(complianceItems)
      .set(updates)
      .where(eq(complianceItems.id, itemId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "compliance.updated",
      entityType: "compliance_item",
      entityId: itemId,
      module: "compliance",
      details: "Updated compliance item",
    })
  }

  /**
   * Get compliance item
   */
  static async getComplianceItem(itemId: string) {
    const item = await db.query.complianceItems.findFirst({
      where: eq(complianceItems.id, itemId),
    })

    if (!item) throw new Error("Compliance item not found")
    return item
  }

  /**
   * List compliance items
   */
  static async listComplianceItems(
    page = 1,
    limit = 20,
    filters?: { framework?: string; status?: string },
  ) {
    const offset = (page - 1) * limit
    const whereConditions: any[] = []

    if (filters?.framework)
      whereConditions.push(eq(complianceItems.framework, filters.framework))
    if (filters?.status)
      whereConditions.push(eq(complianceItems.status, filters.status))

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(complianceItems)
        .where(where)
        .orderBy(desc(complianceItems.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(complianceItems)
        .where(where),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get compliance statistics
   */
  static async getComplianceStats() {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        compliant: sql<number>`COUNT(CASE WHEN status = 'compliant' THEN 1 END)`,
        nonCompliant: sql<number>`COUNT(CASE WHEN status = 'non_compliant' THEN 1 END)`,
        partial: sql<number>`COUNT(CASE WHEN status = 'partial' THEN 1 END)`,
      })
      .from(complianceItems)

    return stats
  }
}
