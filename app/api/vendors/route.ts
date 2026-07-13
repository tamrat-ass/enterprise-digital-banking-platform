import { NextRequest } from "next/server"
import { VendorService } from "@/lib/services"
import { createVendorSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/vendors
 * List vendors
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "vendors:view")
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const category = req.nextUrl.searchParams.get("category") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined
  const riskRating = req.nextUrl.searchParams.get("riskRating") || undefined
  const search = req.nextUrl.searchParams.get("search") || undefined

  const result = await VendorService.listVendors({
    category,
    status,
    riskRating,
    search,
    page,
    limit,
  })

  return successResponse(result)
})

/**
 * POST /api/vendors
 * Create a new vendor
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "vendors:view")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse("Invalid request body", 400)

  const validation = createVendorSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const vendor = await VendorService.createVendor(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(vendor, 201)
})
