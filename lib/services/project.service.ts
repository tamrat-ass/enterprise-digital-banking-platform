import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { eq, desc, and, ilike, sql } from "drizzle-orm"
import { recordAudit } from "@/lib/audit"
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
} from "@/lib/schemas"

/**
 * Project Service - Handles project management
 */

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    input: CreateProjectInput,
    userId: string,
    userName: string,
  ) {
    const projectId = crypto.randomUUID()

    await db.insert(projects).values({
      id: projectId,
      name: input.name,
      description: input.description,
      departmentId: input.departmentId,
      status: input.status || "planning",
      priority: input.priority || "medium",
      progress: 0,
      budget: input.budget ? Number(input.budget) : undefined,
      spent: 0,
      ownerName: userName,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      riskLevel: input.riskLevel || "low",
    })

    await recordAudit({
      userId,
      actorName: userName,
      action: "project.created",
      entityType: "project",
      entityId: projectId,
      module: "projects",
      details: `Created project: ${input.name}`,
    })

    return { id: projectId, ...input }
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    input: UpdateProjectInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {}

    if (input.name) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.status) updates.status = input.status
    if (input.priority) updates.priority = input.priority
    if (input.budget) updates.budget = Number(input.budget)
    if (input.riskLevel) updates.riskLevel = input.riskLevel
    if (input.startDate) updates.startDate = new Date(input.startDate)
    if (input.endDate) updates.endDate = new Date(input.endDate)

    await db.update(projects).set(updates).where(eq(projects.id, projectId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "project.updated",
      entityType: "project",
      entityId: projectId,
      module: "projects",
      details: "Updated project",
    })
  }

  /**
   * Update project progress
   */
  static async updateProgress(
    projectId: string,
    progress: number,
    userId: string,
    userName: string,
  ) {
    if (progress < 0 || progress > 100)
      throw new Error("Progress must be between 0 and 100")

    await db
      .update(projects)
      .set({ progress })
      .where(eq(projects.id, projectId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "project.progress_updated",
      entityType: "project",
      entityId: projectId,
      module: "projects",
      details: `Updated project progress to ${progress}%`,
    })
  }

  /**
   * Get project
   */
  static async getProject(projectId: string) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) throw new Error("Project not found")
    return project
  }

  /**
   * List projects with filtering
   */
  static async listProjects(filters: ProjectFilters) {
    const {
      status,
      departmentId,
      priority,
      search,
      page = 1,
      limit = 20,
    } = filters
    const offset = (page - 1) * limit

    const whereConditions: any[] = []

    if (status) whereConditions.push(eq(projects.status, status))
    if (departmentId)
      whereConditions.push(eq(projects.departmentId, departmentId))
    if (priority) whereConditions.push(eq(projects.priority, priority))
    if (search) whereConditions.push(ilike(projects.name, `%${search}%`))

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [list, [{ total }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(where)
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(projects)
        .where(where),
    ])

    return {
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(departmentId?: string) {
    const where = departmentId
      ? eq(projects.departmentId, departmentId)
      : undefined

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
        completed: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        onHold: sql<number>`COUNT(CASE WHEN status = 'on_hold' THEN 1 END)`,
        avgProgress: sql<number>`AVG(progress)`,
        highRisk: sql<number>`COUNT(CASE WHEN risk_level = 'high' THEN 1 END)`,
      })
      .from(projects)
      .where(where)

    return stats
  }

  /**
   * Delete project (soft delete via status)
   */
  static async deleteProject(
    projectId: string,
    userId: string,
    userName: string,
  ) {
    await db
      .update(projects)
      .set({ status: "cancelled" })
      .where(eq(projects.id, projectId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "project.deleted",
      entityType: "project",
      entityId: projectId,
      module: "projects",
      details: "Project cancelled",
    })
  }
}
