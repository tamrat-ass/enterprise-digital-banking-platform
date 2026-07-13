import { NextRequest } from "next/server"
import { ApprovalService } from "@/lib/services"
import { approveRequestSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/approvals/[id]
 * Get a specific approval request
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(
      req,
      "approvals:view",
    )
    if (error) return error

    const approval = await ApprovalService.getApprovalRequest(params.id)
    return successResponse(approval)
  },
)

/**
 * POST /api/approvals/[id]/approve or /api/approvals/[id]/reject
 * Process an approval (approve or reject)
 */
export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(
      req,
      "approvals:approve",
    )
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) {
      return errorResponse("Invalid request body", 400)
    }

    const validation = approveRequestSchema.safeParse({
      approvalId: params.id,
      ...body,
    })

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    const result = await ApprovalService.processApproval(
      validation.data,
      user.id,
      user.name,
    )

    return successResponse(result)
  },
)
