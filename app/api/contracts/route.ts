import { NextRequest } from "next/server"
import { ContractService } from "@/lib/services"
import { createContractSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/contracts
 * List contracts
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "contracts.view")
  if (error) return error

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")

  const result = await ContractService.listContracts(page, limit)
  return successResponse(result)
})

/**
 * POST /api/contracts
 * Create a new contract
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "contracts.view")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse("Invalid request body", 400)

  const validation = createContractSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  const contract = await ContractService.createContract(
    validation.data,
    user.id,
    user.name,
  )

  return successResponse(contract, 201)
})

