/**
 * Recycle Bin API Endpoints
 * GET /api/recycle-bin - List deleted files
 */

import { NextRequest } from 'next/server'
import { RecycleBinService } from '@/lib/services/recycle-bin.service'
import { requirePermission, successResponse, errorResponse, withErrorHandling } from '@/lib/api-utils'
import { recycleBinQuerySchema } from '@/lib/schemas/recycle-bin.schemas'

/**
 * GET /api/recycle-bin
 * List all soft-deleted documents with pagination and filtering
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, 'recycleBin.view')
  if (error) return error

  try {
    console.log('[Recycle Bin API] GET - Fetching deleted files')

    // Parse query parameters
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const sortBy = (req.nextUrl.searchParams.get('sortBy') as any) || 'deletedAt'
    const sortOrder = (req.nextUrl.searchParams.get('sortOrder') as any) || 'desc'
    const search = req.nextUrl.searchParams.get('search') || undefined
    const deletedByUserId = req.nextUrl.searchParams.get('deletedByUserId') || undefined
    const category = req.nextUrl.searchParams.get('category') || undefined

    // Validate query parameters
    const queryData = recycleBinQuerySchema.parse({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      deletedByUserId,
      category,
    })

    // Fetch deleted documents
    const result = await RecycleBinService.getRecycleBinDocuments(queryData)

    console.log('[Recycle Bin API] Successfully fetched recycle bin documents:', {
      count: result.documents.length,
      total: result.pagination.total,
    })

    return successResponse({
      documents: result.documents,
      pagination: result.pagination,
    })
  } catch (err) {
    console.error('[Recycle Bin API] Error fetching recycle bin:', err)
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to fetch recycle bin',
      500
    )
  }
})
