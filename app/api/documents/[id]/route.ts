import { NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/lib/services"
import { updateDocumentSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-utils"

/**
 * GET /api/documents/[id]
 * Get a specific document with versions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requirePermission(
      req,
      "documents:view",
    )
    if (error) return error

    const { id } = await params
    const document = await DocumentService.getDocument(id)
    return successResponse(document)
  } catch (err) {
    console.error('GET /api/documents/[id] error:', err)
    return errorResponse('Failed to fetch document', 500)
  }
}

/**
 * PATCH /api/documents/[id]
 * Update document metadata
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requirePermission(
      req,
      "documents:edit",
    )
    if (error) return error

    const body = await parseJsonBody(req)
    if (!body) {
      return errorResponse("Invalid request body", 400)
    }

    const validation = updateDocumentSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    const { id } = await params
    await DocumentService.updateDocument(
      id,
      validation.data,
      user.id,
      user.name,
    )

    const updated = await DocumentService.getDocument(id)
    return successResponse(updated)
  } catch (err) {
    console.error('PATCH /api/documents/[id] error:', err)
    return errorResponse('Failed to update document', 500)
  }
}

/**
 * DELETE /api/documents/[id]
 * Archive/delete a document
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await requirePermission(
      req,
      "documents:delete",
    )
    if (error) return error

    const { id } = await params
    await DocumentService.deleteDocument(id, user.id, user.name)
    return successResponse({ message: "Document archived" })
  } catch (err) {
    console.error('DELETE /api/documents/[id] error:', err)
    return errorResponse('Failed to delete document', 500)
  }
}
