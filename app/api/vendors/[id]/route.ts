import { NextRequest } from "next/server"
import { VendorService, ContractService } from "@/lib/services"
import { updateVendorSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/vendors/[id]
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "vendors:view")
    if (error) return error

    const vendor = await VendorService.getVendor(params.id)
    return successResponse(vendor)
  },
)

/**
 * PATCH /api/vendors/[id]
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "vendors:view")
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) return errorResponse("Invalid request body", 400)

    const validation = updateVendorSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    await VendorService.updateVendor(
      params.id,
      validation.data,
      user.id,
      user.name,
    )

    const updated = await VendorService.getVendor(params.id)
    return successResponse(updated)
  },
)

/**
 * DELETE /api/vendors/[id]
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { error, user } = await requirePermission(req, "vendors:view")
    if (error) return error

    await VendorService.deleteVendor(params.id, user.id, user.name)
    return successResponse({ message: "Vendor deleted" })
  },
)
