import { NextRequest } from "next/server"
import { ComplianceService } from "@/lib/services"
import { updateComplianceItemSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/compliance/[id]
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "compliance:view")
    if (error) return error

    const item = await ComplianceService.getComplianceItem(params.id)
    return successResponse(item)
  },
)

/**
 * PATCH /api/compliance/[id]
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "compliance:edit")
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) return errorResponse("Invalid request body", 400)

    const validation = updateComplianceItemSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    await ComplianceService.updateComplianceItem(
      params.id,
      validation.data,
      user.id,
      user.name,
    )

    const updated = await ComplianceService.getComplianceItem(params.id)
    return successResponse(updated)
  },
)
