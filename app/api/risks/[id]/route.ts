import { NextRequest } from "next/server"
import { RiskService } from "@/lib/services"
import { updateRiskSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/risks/[id]
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "risk:view")
    if (error) return error

    const risk = await RiskService.getRisk(params.id)
    return successResponse(risk)
  },
)

/**
 * PATCH /api/risks/[id]
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "risk:edit")
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) return errorResponse("Invalid request body", 400)

    const validation = updateRiskSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    await RiskService.updateRisk(
      params.id,
      validation.data,
      user.id,
      user.name,
    )

    const updated = await RiskService.getRisk(params.id)
    return successResponse(updated)
  },
)

/**
 * DELETE /api/risks/[id]
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "risk:delete")
    if (error) return error

    await RiskService.deleteRisk(params.id, user.id, user.name)
    return successResponse({ message: "Risk deleted" })
  },
)
