import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

/**
 * GET /api/admin/find-user?search=tamrat
 * GET /api/admin/find-user (list all users)
 */
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search")

    // Get all users
    const allUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }).from(user)

    // If no search, return all users
    if (!search) {
      return NextResponse.json(
        {
          success: true,
          total: allUsers.length,
          message: "All users in database",
          users: allUsers,
        },
        { status: 200 }
      )
    }

    // Filter by search term
    const searchLower = search.toLowerCase()
    const results = allUsers.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    )

    return NextResponse.json(
      {
        success: true,
        search,
        found: results.length,
        users: results,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error("[Find User] Error:", err)
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

