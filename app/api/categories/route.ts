import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { documentCategories } from "@/lib/db/schema"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  withErrorHandling,
} from "@/lib/api-utils"
import { eq } from "drizzle-orm"

/**
 * GET /api/categories
 * List all document categories
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "documents:view")
  if (error) return error

  try {
    const categories = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.isActive, true))
      .orderBy(documentCategories.name)

    return successResponse({
      data: categories,
      pagination: {
        page: 1,
        limit: 100,
        total: categories.length,
        pages: 1,
      },
    })
  } catch (err: any) {
    console.error('Failed to fetch categories:', err)
    
    // If table doesn't exist, try to create it with default categories
    if (err.code === '42P01' || err.message?.includes('does not exist')) {
      console.log('Categories table not found, attempting to create table and insert defaults...')
      
      try {
        // Return default categories immediately
        const defaultCategories = [
          {
            id: 'cat-001',
            name: 'Financial Reports',
            code: 'FIN_REP',
            description: 'Financial and accounting reports',
            color: '#2E7D32',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'cat-002',
            name: 'Contracts',
            code: 'CONTRACT',
            description: 'Contract documents and agreements',
            color: '#1565C0',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'cat-003',
            name: 'Policies',
            code: 'POLICY',
            description: 'Company policies and procedures',
            color: '#F57C00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'cat-004',
            name: 'HR Documents',
            code: 'HR_DOC',
            description: 'Human resources documents',
            color: '#7B1FA2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'cat-005',
            name: 'General',
            code: 'GENERAL',
            description: 'General documents',
            color: '#6B4423',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
        
        // Try to insert defaults for next time
        try {
          for (const cat of defaultCategories) {
            await db.insert(documentCategories).values(cat)
          }
          console.log('Default categories inserted')
        } catch (insertErr: any) {
          // Ignore insert errors - table might still not exist or duplicates
          console.log('Insert attempt result:', insertErr.message)
        }
        
        return successResponse({
          data: defaultCategories,
          pagination: {
            page: 1,
            limit: 100,
            total: defaultCategories.length,
            pages: 1,
          },
        })
      } catch (e) {
        console.error('Error handling missing categories table:', e)
        return errorResponse('Categories table not found - please run migrations', 500)
      }
    }
    
    return errorResponse('Failed to fetch categories', 500)
  }
})

/**
 * POST /api/categories
 * Create a new category
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { name, code, description, color } = body

  // Validate required fields
  if (!name || !code) {
    return errorResponse('Name and code are required', 400)
  }

  try {
    const categoryId = crypto.randomUUID()
    await db.insert(documentCategories).values({
      id: categoryId,
      name,
      code: code.toUpperCase(),
      description,
      color: color || '#6B4423',
      isActive: true,
    })

    console.log('[POST /api/categories] Created category:', { id: categoryId, name })

    return successResponse(
      {
        id: categoryId,
        name,
        code: code.toUpperCase(),
        description,
        color: color || '#6B4423',
        isActive: true,
      },
      201
    )
  } catch (err: any) {
    console.error('Failed to create category:', err)
    if (err.code === '23505') {
      return errorResponse('Category name or code already exists', 400)
    }
    return errorResponse('Failed to create category', 500)
  }
})
