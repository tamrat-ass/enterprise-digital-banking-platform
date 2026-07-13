import { NextRequest } from "next/server"
import { ProjectService } from "@/lib/services"
import { createProjectSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/projects
 * List projects
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "projects:view")
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const status = req.nextUrl.searchParams.get("status") || undefined
  const departmentId = req.nextUrl.searchParams.get("departmentId") || undefined
  const priority = req.nextUrl.searchParams.get("priority") || undefined
  const search = req.nextUrl.searchParams.get("search") || undefined

  const result = await ProjectService.listProjects({
    status,
    departmentId,
    priority,
    search,
    page,
    limit,
  })

  return successResponse(result)
})

/**
 * POST /api/projects
 * Create a new project
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "projects:create")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse("Invalid request body", 400)

  const validation = createProjectSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const project = await ProjectService.createProject(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(project, 201)
})
