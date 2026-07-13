import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { divisions, departments } from "@/lib/db/schema"
import {
  requirePermission,
  successResponse,
  errorResponse,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from "@/lib/api-utils"
import { eq } from "drizzle-orm"

/**
 * GET /api/divisions?departmentId=xxx
 * List all divisions, optionally filtered by department
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  console.log('[Divisions API] GET request received')
  
  const { error, user } = await requirePermission(req, "documents:view")
  if (error) {
    console.log('[Divisions API] Permission denied')
    return error
  }

  try {
    const departmentId = req.nextUrl.searchParams.get("departmentId")
    
    let divisionList
    if (departmentId) {
      // Verify department exists
      const dept = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId))
        .limit(1)
      
      if (dept.length === 0) {
        return errorResponse('Department not found', 404)
      }

      divisionList = await db
        .select()
        .from(divisions)
        .where(eq(divisions.departmentId, departmentId))
        .orderBy(divisions.name)
    } else {
      divisionList = await db
        .select()
        .from(divisions)
        .orderBy(divisions.name)
    }

    console.log('[Divisions API] Found divisions:', divisionList.length)

    return successResponse({
      data: divisionList,
      pagination: {
        page: 1,
        limit: 100,
        total: divisionList.length,
        pages: 1,
      },
    })
  } catch (err) {
    console.error('Failed to fetch divisions:', err)
    return errorResponse('Failed to fetch divisions', 500)
  }
})

/**
 * POST /api/divisions
 * Create a new division
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "documents:admin")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { departmentId, name, code, description, headName, status } = body

  // Validate required fields
  if (!departmentId || !name || !code) {
    return validationErrorResponse({
      departmentId: !departmentId ? ['Department ID is required'] : [],
      name: !name ? ['Name is required'] : [],
      code: !code ? ['Code is required'] : [],
    })
  }

  try {
    // Verify department exists
    const dept = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1)
    
    if (dept.length === 0) {
      return errorResponse('Department not found', 404)
    }

    const divisionId = crypto.randomUUID()
    await db.insert(divisions).values({
      id: divisionId,
      departmentId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      headName: headName?.trim() || null,
      status: status || "active",
    })

    console.log('[POST /api/divisions] Created division:', { id: divisionId, name, departmentId })

    return successResponse(
      {
        id: divisionId,
        departmentId,
        name,
        code: code.toUpperCase(),
        description: description || null,
        headName: headName || null,
        status: status || "active",
      },
      201
    )
  } catch (err: any) {
    console.error('Failed to create division:', err)
    if (err.code === '23505') {
      return errorResponse('Division code already exists for this department', 400)
    }
    return errorResponse('Failed to create division', 500)
  }
})
