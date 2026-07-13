import { NextRequest } from "next/server"
import { ApprovalService } from "@/lib/services"
import { createApprovalRequestSchema, approvalFilterSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/approvals
 * List approval requests
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(
    req,
    "approvals:view",
  )
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const status = req.nextUrl.searchParams.get("status") || undefined
  const priority = req.nextUrl.searchParams.get("priority") || undefined
  const entityType = req.nextUrl.searchParams.get("entityType") || undefined

  const result = await ApprovalService.listApprovalRequests({
    status,
    priority,
    entityType,
    page,
    limit,
  })

  return successResponse(result)
})

/**
 * POST /api/approvals
 * Create an approval request
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(
    req,
    "approvals:view",
  )
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) {
    return errorResponse("Invalid request body", 400)
  }

  const validation = createApprovalRequestSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const approval = await ApprovalService.createApprovalRequest(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(approval, 201)
})
