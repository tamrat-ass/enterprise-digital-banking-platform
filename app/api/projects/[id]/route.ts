import { NextRequest } from "next/server"
import { ProjectService } from "@/lib/services"
import { updateProjectSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/projects/[id]
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "projects:view")
    if (error) return error

    const project = await ProjectService.getProject(params.id)
    return successResponse(project)
  },
)

/**
 * PATCH /api/projects/[id]
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "projects:edit")
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) return errorResponse("Invalid request body", 400)

    const validation = updateProjectSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    await ProjectService.updateProject(
      params.id,
      validation.data,
      user.id,
      user.name,
    )

    const updated = await ProjectService.getProject(params.id)
    return successResponse(updated)
  },
)

/**
 * DELETE /api/projects/[id]
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "projects:delete")
    if (error) return error

    await ProjectService.deleteProject(params.id, user.id, user.name)
    return successResponse({ message: "Project deleted" })
  },
)
