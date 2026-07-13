import { db } from "@/lib/db"
import {
  approvalRequests,
  documents,
  workflows,
} from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { recordAudit } from "@/lib/audit"
import type {
  CreateApprovalInput,
  ApproveRequestInput,
  ApprovalFilters,
} from "@/lib/schemas"

/**
 * Approval & Workflow Service - Handles approval workflows
 */

export class ApprovalService {
  /**
   * Create an approval request
   */
  static async createApprovalRequest(
    input: CreateApprovalInput,
    userId: string,
    userName: string,
  ) {
    const approvalId = crypto.randomUUID()

    await db.insert(approvalRequests).values({
      id: approvalId,
      workflowId: input.workflowId,
      title: input.title,
      entityType: input.entityType,
      entityId: input.entityId,
      currentStep: 1,
      totalSteps: 1,
      status: "pending",
      requestedBy: userId,
      requestedByName: userName,
      priority: input.priority || "medium",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "approval.requested",
      entityType: "approval_request",
      entityId: approvalId,
      module: "approvals",
      details: `Created approval request for ${input.entityType}`,
    })

    return { id: approvalId, ...input }
  }

  /**
   * Approve or reject an approval request
   */
  static async processApproval(
    input: ApproveRequestInput,
    userId: string,
    userName: string,
  ) {
    const approval = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, input.approvalId),
    })

    if (!approval) throw new Error("Approval request not found")
    if (approval.status !== "pending")
      throw new Error("Approval request is not pending")

    const newStatus = input.approve ? "approved" : "rejected"

    await db
      .update(approvalRequests)
      .set({
        status: newStatus,
        assigneeName: userName,
      })
      .where(eq(approvalRequests.id, input.approvalId))

    // If approved and entity is a document, update document status
    if (input.approve && approval.entityType === "document") {
      await db
        .update(documents)
        .set({ status: "approved" })
        .where(eq(documents.id, approval.entityId))
    }

    await recordAudit({
      userId,
      actorName: userName,
      action: `approval.${newStatus}`,
      entityType: "approval_request",
      entityId: input.approvalId,
      module: "approvals",
      details: `${newStatus === "approved" ? "Approved" : "Rejected"} request${input.comment ? `: ${input.comment}` : ""}`,
    })

    return { status: newStatus }
  }

  /**
   * Get approval request with details
   */
  static async getApprovalRequest(approvalId: string) {
    const approval = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, approvalId),
    })

    if (!approval) throw new Error("Approval request not found")

    let entity: any = null

    // Fetch entity based on type
    if (approval.entityType === "document") {
      entity = await db.query.documents.findFirst({
        where: eq(documents.id, approval.entityId),
      })
    }

    return { ...approval, entity }
  }

  /**
   * List approval requests with filtering
   */
  static async listApprovalRequests(filters: ApprovalFilters) {
    const {
      status,
      priority,
      entityType,
      assignedToMe,
      page = 1,
      limit = 20,
    } = filters
    const offset = (page - 1) * limit

    const whereConditions: any[] = []

    if (status) whereConditions.push(eq(approvalRequests.status, status))
    if (priority)
      whereConditions.push(eq(approvalRequests.priority, priority))
    if (entityType)
      whereConditions.push(eq(approvalRequests.entityType, entityType))

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(approvalRequests)
        .where(where)
        .orderBy(
          desc(approvalRequests.priority),
          desc(approvalRequests.createdAt)
        )
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(approvalRequests)
        .where(where),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats() {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        approved: sql<number>`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
        avgTime: sql<string>`EXTRACT(EPOCH FROM AVG(NOW() - created_at)) / 3600`,
      })
      .from(approvalRequests)

    return stats
  }

  /**
   * Delegate approval to another user
   */
  static async delegateApproval(
    approvalId: string,
    delegateToName: string,
    userId: string,
    userName: string,
  ) {
    const approval = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, approvalId),
    })

    if (!approval) throw new Error("Approval request not found")

    await db
      .update(approvalRequests)
      .set({
        assigneeName: delegateToName,
      })
      .where(eq(approvalRequests.id, approvalId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "approval.delegated",
      entityType: "approval_request",
      entityId: approvalId,
      module: "approvals",
      details: `Delegated to ${delegateToName}`,
    })
  }

  /**
   * Escalate approval to higher level
   */
  static async escalateApproval(
    approvalId: string,
    reason: string,
    userId: string,
    userName: string,
  ) {
    const approval = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, approvalId),
    })

    if (!approval) throw new Error("Approval request not found")

    const newStep = Math.min(approval.currentStep + 1, approval.totalSteps)

    await db
      .update(approvalRequests)
      .set({
        currentStep: newStep,
        priority: "high",
      })
      .where(eq(approvalRequests.id, approvalId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "approval.escalated",
      entityType: "approval_request",
      entityId: approvalId,
      module: "approvals",
      details: `Escalated to step ${newStep}. Reason: ${reason}`,
    })
  }
}

/**
 * Workflow Service - Manages workflow definitions
 */
export class WorkflowService {
  /**
   * Get workflow
   */
  static async getWorkflow(workflowId: string) {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    })

    if (!workflow) throw new Error("Workflow not found")
    return workflow
  }

  /**
   * List workflows
   */
  static async listWorkflows() {
    return await db
      .select()
      .from(workflows)
      .where(eq(workflows.isActive, true))
      .orderBy(desc(workflows.createdAt))
  }

  /**
   * Get workflow for entity type
   */
  static async getDefaultWorkflow(entityType: string) {
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.entityType, entityType),
        eq(workflows.isActive, true)
      ),
    })

    return workflow || this.getSimpleApprovalWorkflow(entityType)
  }

  /**
   * Get a simple single-step approval workflow (default)
   */
  private static getSimpleApprovalWorkflow(entityType: string) {
    return {
      id: crypto.randomUUID(),
      name: `Standard ${entityType} Approval`,
      description: `Single-step approval for ${entityType}`,
      entityType,
      steps: [{ step: 1, name: "Approval", role: "department_head" }],
      slaHours: 48,
      isActive: true,
      createdAt: new Date(),
    }
  }
}
