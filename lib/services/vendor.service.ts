import { db } from "@/lib/db"
import { vendors, contracts } from "@/lib/db/schema"
import { eq, desc, and, ilike, sql } from "drizzle-orm"
import { recordAudit } from "@/lib/audit"
import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
  CreateContractInput,
  UpdateContractInput,
} from "@/lib/schemas"

/**
 * Vendor & Contract Service
 */

export class VendorService {
  /**
   * Create a new vendor
   */
  static async createVendor(
    input: CreateVendorInput,
    userId: string,
    userName: string,
  ) {
    const vendorId = crypto.randomUUID()

    // Calculate risk score based on rating
    const riskScoreMap: Record<string, number> = {
      low: 20,
      medium: 50,
      high: 75,
      critical: 100,
    }
    const riskScore = riskScoreMap[input.riskRating || "medium"]

    await db.insert(vendors).values({
      id: vendorId,
      name: input.name,
      category: input.category,
      contactEmail: input.contactEmail,
      status: input.status || "active",
      riskScore,
      riskRating: input.riskRating || "medium",
      dueDiligenceStatus: input.dueDiligenceStatus || "pending",
      performanceScore: 0,
      contractValue: input.contractValue
        ? Number(input.contractValue)
        : undefined,
      onboardedDate: input.onboardedDate
        ? new Date(input.onboardedDate)
        : new Date(),
      renewalDate: input.renewalDate
        ? new Date(input.renewalDate)
        : null,
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "vendor.created",
      entityType: "vendor",
      entityId: vendorId,
      module: "vendors",
      details: `Created vendor: ${input.name}`,
    })

    return { id: vendorId, ...input }
  }

  /**
   * Update vendor
   */
  static async updateVendor(
    vendorId: string,
    input: UpdateVendorInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {}

    if (input.name) updates.name = input.name
    if (input.category) updates.category = input.category
    if (input.contactEmail !== undefined)
      updates.contactEmail = input.contactEmail
    if (input.status) updates.status = input.status
    if (input.riskRating) {
      updates.riskRating = input.riskRating
      const riskScoreMap: Record<string, number> = {
        low: 20,
        medium: 50,
        high: 75,
        critical: 100,
      }
      updates.riskScore = riskScoreMap[input.riskRating]
    }
    if (input.dueDiligenceStatus)
      updates.dueDiligenceStatus = input.dueDiligenceStatus
    if (input.performanceScore !== undefined)
      updates.performanceScore = input.performanceScore

    await db.update(vendors).set(updates).where(eq(vendors.id, vendorId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "vendor.updated",
      entityType: "vendor",
      entityId: vendorId,
      module: "vendors",
      details: "Updated vendor information",
    })
  }

  /**
   * Get vendor with contracts
   */
  static async getVendor(vendorId: string) {
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, vendorId),
    })

    if (!vendor) throw new Error("Vendor not found")

    const vendorContracts = await db.query.contracts.findMany({
      where: eq(contracts.vendorId, vendorId),
    })

    return { ...vendor, contracts: vendorContracts }
  }

  /**
   * List vendors with filtering
   */
  static async listVendors(filters: VendorFilters) {
    const {
      category,
      status,
      riskRating,
      search,
      page = 1,
      limit = 20,
    } = filters
    const offset = (page - 1) * limit

    const whereConditions: any[] = []

    if (category) whereConditions.push(eq(vendors.category, category))
    if (status) whereConditions.push(eq(vendors.status, status))
    if (riskRating) whereConditions.push(eq(vendors.riskRating, riskRating))
    if (search) whereConditions.push(ilike(vendors.name, `%${search}%`))

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(vendors)
        .where(where)
        .orderBy(desc(vendors.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(vendors)
        .where(where),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get vendor statistics
   */
  static async getVendorStats() {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
        inactive: sql<number>`COUNT(CASE WHEN status = 'inactive' THEN 1 END)`,
        highRisk: sql<number>`COUNT(CASE WHEN risk_rating = 'high' OR risk_rating = 'critical' THEN 1 END)`,
      })
      .from(vendors)

    return stats
  }

  /**
   * Delete vendor (soft delete)
   */
  static async deleteVendor(
    vendorId: string,
    userId: string,
    userName: string,
  ) {
    await db
      .update(vendors)
      .set({ status: "inactive" })
      .where(eq(vendors.id, vendorId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "vendor.deleted",
      entityType: "vendor",
      entityId: vendorId,
      module: "vendors",
      details: "Vendor marked as inactive",
    })
  }
}

/**
 * Contract Service
 */
export class ContractService {
  /**
   * Create a new contract
   */
  static async createContract(
    input: CreateContractInput,
    userId: string,
    userName: string,
  ) {
    const contractId = crypto.randomUUID()

    await db.insert(contracts).values({
      id: contractId,
      title: input.title,
      counterparty: input.counterparty,
      vendorId: input.vendorId,
      type: input.type,
      value: input.value ? Number(input.value) : undefined,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      autoRenew: input.autoRenew || false,
      status: input.status || "draft",
      ownerName: userName,
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "contract.created",
      entityType: "contract",
      entityId: contractId,
      module: "contracts",
      details: `Created contract: ${input.title}`,
    })

    return { id: contractId, ...input }
  }

  /**
   * Update contract
   */
  static async updateContract(
    contractId: string,
    input: UpdateContractInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {}

    if (input.title) updates.title = input.title
    if (input.counterparty) updates.counterparty = input.counterparty
    if (input.type) updates.type = input.type
    if (input.value) updates.value = Number(input.value)
    if (input.startDate) updates.startDate = new Date(input.startDate)
    if (input.endDate) updates.endDate = new Date(input.endDate)
    if (input.autoRenew !== undefined) updates.autoRenew = input.autoRenew
    if (input.status) updates.status = input.status

    await db.update(contracts).set(updates).where(eq(contracts.id, contractId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "contract.updated",
      entityType: "contract",
      entityId: contractId,
      module: "contracts",
      details: "Updated contract",
    })
  }

  /**
   * Get contract
   */
  static async getContract(contractId: string) {
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
    })

    if (!contract) throw new Error("Contract not found")
    return contract
  }

  /**
   * List contracts
   */
  static async listContracts(page = 1, limit = 20) {
    const offset = (page - 1) * limit

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(contracts)
        .orderBy(desc(contracts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`COUNT(*)` }).from(contracts),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Delete contract
   */
  static async deleteContract(
    contractId: string,
    userId: string,
    userName: string,
  ) {
    await db
      .update(contracts)
      .set({ status: "terminated" })
      .where(eq(contracts.id, contractId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "contract.deleted",
      entityType: "contract",
      entityId: contractId,
      module: "contracts",
      details: "Contract terminated",
    })
  }
}
