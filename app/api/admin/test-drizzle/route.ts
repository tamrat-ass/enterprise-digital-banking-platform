import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documentVersions } from "@/lib/db/schema"
import { sql, eq } from "drizzle-orm"

/**
 * GET /api/admin/test-drizzle
 * Test Drizzle ORM query to debug connection issues
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Test Drizzle] Starting Drizzle query test...')

    // Test 1: Raw SQL
    console.log('[Test Drizzle] Test 1: Raw SQL COUNT query...')
    try {
      const rawCount = await db.execute(sql`SELECT COUNT(*) as count FROM document_versions`)
      console.log('[Test Drizzle] Raw COUNT query succeeded:', rawCount)
    } catch (err) {
      console.error('[Test Drizzle] Raw COUNT query failed:', err)
    }

    // Test 2: Raw SQL SELECT
    console.log('[Test Drizzle] Test 2: Raw SQL SELECT query...')
    try {
      const rawSelect = await db.execute(sql`SELECT id, document_id FROM document_versions LIMIT 1`)
      console.log('[Test Drizzle] Raw SELECT query result:', rawSelect)
    } catch (err) {
      console.error('[Test Drizzle] Raw SELECT query failed:', err)
    }

    // Test 3: Drizzle SELECT from documentVersions
    console.log('[Test Drizzle] Test 3: Drizzle ORM SELECT all fields...')
    try {
      const drizzleSelect = await db.select().from(documentVersions).limit(1)
      console.log('[Test Drizzle] Drizzle SELECT query succeeded:', drizzleSelect)
    } catch (err) {
      console.error('[Test Drizzle] Drizzle SELECT query failed:', err)
      console.error('[Test Drizzle] Error type:', typeof err)
      console.error('[Test Drizzle] Error keys:', Object.keys(err || {}))
      if (err instanceof Error) {
        console.error('[Test Drizzle] Error message:', err.message)
        console.error('[Test Drizzle] Error stack:', err.stack)
      }
    }

    // Test 4: Drizzle SELECT with specific columns
    console.log('[Test Drizzle] Test 4: Drizzle ORM SELECT with specific columns...')
    try {
      const drizzleSelectPartial = await db
        .select({
          id: documentVersions.id,
          documentId: documentVersions.documentId,
          version: documentVersions.version,
        })
        .from(documentVersions)
        .limit(1)
      console.log('[Test Drizzle] Drizzle partial SELECT query succeeded:', drizzleSelectPartial)
    } catch (err) {
      console.error('[Test Drizzle] Drizzle partial SELECT query failed:', err)
    }

    // Test 5: Check if there's data in the table
    console.log('[Test Drizzle] Test 5: Raw SQL COUNT to check if table is empty...')
    try {
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM document_versions`)
      console.log('[Test Drizzle] Count result type:', typeof countResult)
      console.log('[Test Drizzle] Count result:', countResult)
      
      // Try to extract the count
      const count = (countResult as any)?.[0]?.count || 0
      console.log('[Test Drizzle] Total versions in DB:', count)
    } catch (err) {
      console.error('[Test Drizzle] Count query failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Drizzle test completed - check logs for results',
      hint: 'Open browser console or server logs to see test output'
    })
  } catch (err) {
    console.error('[Test Drizzle] Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
