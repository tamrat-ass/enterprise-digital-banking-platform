import { NextRequest } from "next/server"
import { RiskService } from "@/lib/services"
import { createRiskSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/risks
 * List risks
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "risk:view")
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const category = req.nextUrl.searchParams.get("category") || undefined
  const severity = req.nextUrl.searchParams.get("severity") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined

  const result = await RiskService.listRisks(page, limit, {
    category,
    severity,
    status,
  })

  return successResponse(result)
})

/**
 * POST /api/risks
 * Create a new risk
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "risk:create")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse("Invalid request body", 400)

  const validation = createRiskSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const risk = await RiskService.createRisk(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(risk, 201)
})
