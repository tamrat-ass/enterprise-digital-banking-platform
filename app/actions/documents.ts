'use server'

import { DocumentService } from '@/lib/services'
import { getCurrentUser } from '@/lib/session'

interface DocumentFilters {
  page?: number
  limit?: number
  category?: string
  status?: string
  departmentId?: string
  search?: string
}

interface FetchDocumentsResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Server action to fetch documents
 * This is used from client components to bypass CORS/session issues
 * Calls the service directly on the server
 */
export async function fetchDocuments(
  filters: DocumentFilters
): Promise<FetchDocumentsResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Check if user has permission to view documents
    if (!user.permissions?.includes('documents:view')) {
      return {
        success: false,
        error: 'Permission denied: documents:view',
      }
    }

    // Call DocumentService directly
    const result = await DocumentService.listDocuments({
      page: filters.page || 1,
      limit: filters.limit || 20,
      category: filters.category,
      status: filters.status as any,
      departmentId: filters.departmentId,
      search: filters.search,
    })

    return {
      success: true,
      data: result.data || [],
    }
  } catch (err) {
    console.error('[fetchDocuments] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch documents',
    }
  }
}
