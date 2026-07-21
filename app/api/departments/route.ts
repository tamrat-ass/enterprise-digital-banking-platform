import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { departments, divisions } from "@/lib/db/schema"
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
 * GET /api/departments
 * List all departments with their divisions
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  console.log('[Departments API] GET request received')
  
  const { error, user } = await requirePermission(req, "documents.view")
  if (error) {
    console.log('[Departments API] Permission denied')
    return error
  }

  console.log('[Departments API] User:', user?.name, 'ID:', user?.id)

  try {
    const deptList = await db
      .select()
      .from(departments)
      .orderBy(departments.name)

    // Fetch divisions for each department
    const departmentsWithDivisions = await Promise.all(
      deptList.map(async (dept) => {
        const divs = await db
          .select()
          .from(divisions)
          .where(eq(divisions.departmentId, dept.id))
          .orderBy(divisions.name)
        
        return {
          ...dept,
          divisions: divs,
        }
      })
    )

    console.log('[Departments API] Found departments:', deptList.length)

    return successResponse({
      data: departmentsWithDivisions,
      pagination: {
        page: 1,
        limit: 100,
        total: deptList.length,
        pages: 1,
      },
    })
  } catch (err) {
    console.error('Failed to fetch departments:', err)
    return errorResponse('Failed to fetch departments', 500)
  }
})

/**
 * POST /api/departments
 * Create a new department with optional divisions
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "documents.admin")
  if (error) return error

  const body = await parseJsonBody(req)
  if (!body) return errorResponse('Invalid request body', 400)

  const { name, code, description, headName, divisions: divisionsData } = body

  // Validate required fields
  if (!name || !code) {
    return validationErrorResponse({
      name: !name ? ['Name is required'] : [],
      code: !code ? ['Code is required'] : [],
    })
  }

  try {
    const deptId = crypto.randomUUID()
    
    // Create department
    await db.insert(departments).values({
      id: deptId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      headName: headName?.trim() || null,
    })

    // Create divisions if provided
    let createdDivisions: any[] = []
    if (Array.isArray(divisionsData) && divisionsData.length > 0) {
      const divisionValues = divisionsData.map((div: any) => ({
        id: crypto.randomUUID(),
        departmentId: deptId,
        name: div.name.trim(),
        code: div.code.trim().toUpperCase(),
        description: div.description?.trim() || null,
        headName: div.headName?.trim() || null,
        status: div.status || "active",
      }))

      const inserted = await db.insert(divisions).values(divisionValues).returning()
      createdDivisions = inserted
    }

    console.log('[POST /api/departments] Created department:', { id: deptId, name, divisionCount: createdDivisions.length })

    return successResponse(
      {
        id: deptId,
        name,
        code: code.toUpperCase(),
        description: description || null,
        headName: headName || null,
        divisions: createdDivisions,
      },
      201
    )
  } catch (err: any) {
    console.error('Failed to create department:', err)
    if (err.code === '23505') {
      return errorResponse('Department code already exists', 400)
    }
    return errorResponse('Failed to create department', 500)
  }
})

