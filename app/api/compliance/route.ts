import { NextRequest } from "next/server"
import { ComplianceService } from "@/lib/services"
import { createComplianceItemSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/compliance
 * List compliance items
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "compliance:view")
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const framework = req.nextUrl.searchParams.get("framework") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined

  const result = await ComplianceService.listComplianceItems(page, limit, {
    framework,
    status,
  })

  return successResponse(result)
})

/**
 * POST /api/compliance
 * Create a new compliance item
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "compliance:create")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse("Invalid request body", 400)

  const validation = createComplianceItemSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const item = await ComplianceService.createComplianceItem(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(item, 201)
})
