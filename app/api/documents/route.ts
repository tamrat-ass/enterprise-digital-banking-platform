import { NextRequest } from "next/server"
import { DocumentService } from "@/lib/services"
import { createDocumentSchema, documentFilterSchema } from "@/lib/schemas"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  getPaginationParams,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/documents
 * List all documents with filtering and pagination
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  console.log('[Documents API] GET request received')
  
  const { error, user } = await requirePermission(
    req,
    "documents.view",
  )
  if (error) {
    console.log('[Documents API] Auth check failed - user:', user ? 'null' : 'exists')
    return error
  }

  console.log('[Documents API] User authenticated:', {
    name: user?.name,
    id: user?.id,
    roleKey: user?.roleKey,
    permissions: user?.permissions,
  })

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const category = req.nextUrl.searchParams.get("category") || undefined
  const statusParam = req.nextUrl.searchParams.get("status") || undefined
  const departmentId = req.nextUrl.searchParams.get("departmentId") || undefined
  const search = req.nextUrl.searchParams.get("search") || undefined

  console.log('[Documents API] Filters:', { page, limit, category, statusParam, departmentId, search })

  // Validate status is one of the allowed values
  const validStatuses = ['approved', 'draft', 'archived', 'pending_approval']
  const status = statusParam && validStatuses.includes(statusParam) ? statusParam : undefined

  const result = await DocumentService.listDocuments({
    category,
    status: status as any,
    departmentId,
    search,
    page,
    limit,
  })

  console.log('[Documents API] Result:', { count: result.data.length, pagination: result.pagination })

  return successResponse(result)
})

/**
 * POST /api/documents
 * Create a new document
 * Accepts either JSON or FormData with file
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  console.log('[POST Documents] Request started')
  
  const { error, user } = await requirePermission(
    req,
    "documents.upload",
  )
  if (error) {
    console.log('[POST Documents] Permission denied')
    return error
  }

  console.log('[POST Documents] User authenticated, parsing content...')

  const contentType = req.headers.get('content-type') || ''
  let data: any

  if (contentType.includes('multipart/form-data')) {
    // Handle FormData (file upload)
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    console.log('[POST Documents] FormData received:', {
      fileExists: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      formDataKeys: Array.from(formData.keys()),
    })
    
    // Convert file to ArrayBuffer if present
    let fileContent = null
    let fileSize = 0
    if (file) {
      fileContent = await file.arrayBuffer()
      fileSize = fileContent.byteLength
      console.log('[POST Documents] File converted to ArrayBuffer:', {
        size: fileSize,
        type: typeof fileContent,
        constructor: (fileContent as any).constructor?.name,
      })
    }
    
    data = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      accessLevel: formData.get('accessLevel') as string,
      departmentId: formData.get('departmentId') as string,
      divisionId: formData.get('divisionId') as string,
      fileName: file?.name || (formData.get('fileName') as string),
      fileSize: fileSize,
      fileType: file?.type || 'application/octet-stream',
      fileContent: fileContent,
    }
    
    console.log('[POST Documents] FormData parsed:', {
      title: data.title,
      category: data.category,
      departmentId: data.departmentId,
      divisionId: data.divisionId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileContentSize: data.fileContent ? (data.fileContent as ArrayBuffer).byteLength : 0,
      hasFile: !!file,
      fileContentIsBuffer: data.fileContent instanceof ArrayBuffer,
    })
  } else {
    // Handle JSON
    data = await parseJsonBody(req)
  }

  if (!data) {
    return errorResponse("Invalid request body", 400)
  }

  // Validate against schema (only validate the JSON fields, not file content)
  const validation = createDocumentSchema.safeParse({
    title: data.title,
    category: data.category,
    accessLevel: data.accessLevel,
    description: data.description,
  })
  
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    console.log('[POST Documents] Validation errors:', errors)
    console.log('[POST Documents] Validation errors details:', validation.error.issues)
    return validationErrorResponse(errors as Record<string, string[]>)
  }

  console.log('[POST Documents] Validation passed, creating document with:', {
    title: data.title,
    departmentId: data.departmentId,
    divisionId: data.divisionId,
    fileName: data.fileName,
  })

  // Add departmentId to validation.data
  const validationDataWithDept = {
    ...validation.data,
    departmentId: data.departmentId,
  }

  const document = await DocumentService.createDocument(
    validationDataWithDept,
    user.id,
    user.name,
    {
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      fileContent: data.fileContent,
      divisionId: data.divisionId,
    }
  )

  console.log('[POST Documents] Document created successfully:', {
    id: document.id,
    title: document.title,
    filePath: document.filePath,
    filePathIsNull: document.filePath === null,
  })

  return successResponse(document, 201)
})

