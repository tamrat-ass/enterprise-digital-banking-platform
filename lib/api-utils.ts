import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { hasPermission } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"

/**
 * API Response Helpers
 */

export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  )
}

export function errorResponse(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      errors,
    },
    { status: 400 }
  )
}

/**
 * Permission Check Middleware
 */

export async function requireAuth(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: errorResponse("Unauthorized", 401),
      user: null,
    }
  }
  return { error: null, user }
}

export async function requirePermission(
  req: NextRequest,
  permission: Permission,
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      error: errorResponse("Unauthorized", 401),
      user: null,
    }
  }

  if (!hasPermission(user.permissions, permission)) {
    return {
      error: errorResponse("Forbidden: Insufficient permissions", 403),
      user: null,
    }
  }

  return { error: null, user }
}

/**
 * Request Parsing Helpers
 */

export async function parseJsonBody(req: NextRequest) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export function getQueryParam(req: NextRequest, key: string): string | null {
  return req.nextUrl.searchParams.get(key)
}

export function getPaginationParams(req: NextRequest) {
  const page = Math.max(1, parseInt(getQueryParam(req, "page") || "1"))
  const limit = Math.min(100, parseInt(getQueryParam(req, "limit") || "20"))
  return { page, limit }
}

/**
 * Error Handler for API Routes
 */

export async function handleApiError(error: unknown) {
  console.error("API Error:", error)

  if (error instanceof Error) {
    // Validation errors
    if (error.message.includes("validation")) {
      return errorResponse(error.message, 400)
    }

    // Not found errors
    if (error.message.includes("not found")) {
      return errorResponse(error.message, 404)
    }

    // Authorization errors
    if (error.message.includes("Unauthorized")) {
      return errorResponse(error.message, 401)
    }

    // Generic error
    return errorResponse(error.message, 500)
  }

  return errorResponse("An unexpected error occurred", 500)
}

/**
 * Async Route Handler Wrapper
 */

export type ApiHandler = (
  req: NextRequest,
  params?: Record<string, string>,
) => Promise<NextResponse>

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req, params) => {
    try {
      return await handler(req, params)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
