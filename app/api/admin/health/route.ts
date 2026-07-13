import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/health
 * Simple health check to verify database connection
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Health Check] Starting database health check...')

    // Test 1: Check if we can query the documents table
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documents)

    console.log('[Health Check] Count result:', countResult)

    const documentCount = countResult[0]?.count ?? 0

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: {
        connected: true,
        documentsCount: documentCount,
      },
      timestamp: new Date().toISOString(),
    }, { status: 200 })
  } catch (err) {
    console.error('[Health Check] Database error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)

    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
      details: errorMsg,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
