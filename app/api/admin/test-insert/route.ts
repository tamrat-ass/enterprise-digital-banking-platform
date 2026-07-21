import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documents, documentVersions } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

/**
 * POST /api/admin/test-insert
 * Test inserting a document and version using RAW SQL to bypass Drizzle insert issue
 */
export async function POST(req: NextRequest) {
  const docId = crypto.randomUUID()
  const versionId = crypto.randomUUID()
  const userId = "test-user-" + Date.now()

  console.log('[Test Insert] Starting test insert with RAW SQL...')
  console.log('[Test Insert] Creating test document:', { docId, versionId, userId })

  try {
    // Step 1: Insert document using Drizzle (this works)
    console.log('[Test Insert] Step 1: Inserting document...')
    await db.insert(documents).values({
      id: docId,
      title: "Test Document - " + Date.now(),
      description: "This is a test document",
      category: "general",
      status: "draft",
      ownerId: userId,
      ownerName: "Test User",
    })
    console.log('[Test Insert] Document inserted successfully')

    // Step 2: Insert version using RAW SQL
    console.log('[Test Insert] Step 2: Inserting version with RAW SQL...')
    const insertResult = await db.execute(sql`
      INSERT INTO document_versions 
        (id, document_id, version, change_note, file_name, file_path, author_id, author_name)
      VALUES 
        (${versionId}, ${docId}, 1, 'Test version', 'test.txt', '/uploads/test.txt', ${userId}, 'Test User')
      RETURNING id, document_id, version, file_name, file_path, author_id
    `)
    console.log('[Test Insert] Version insert result:', insertResult)
    console.log('[Test Insert] Version inserted successfully')

    // Step 3: Read it back
    console.log('[Test Insert] Step 3: Reading back with raw SQL...')
    const readResult = await db.execute(sql`
      SELECT id, document_id, version, file_name, file_path, author_id, created_at
      FROM document_versions 
      WHERE id = ${versionId}
    `)
    console.log('[Test Insert] Read result:', readResult)

    return NextResponse.json({
      success: true,
      message: 'Test insert completed successfully with RAW SQL',
      data: {
        docId,
        versionId,
        userId,
        inserted: true,
        insertResult,
      }
    })
  } catch (err) {
    console.error('[Test Insert] Error occurred:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : ''
    
    return NextResponse.json({
      success: false,
      error: errorMsg,
      details: {
        docId,
        versionId,
        userId,
        errorType: typeof err,
        stack: errorStack.substring(0, 500),
      },
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/test-insert
 * Verify the test document was created
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Test Insert GET] Checking test documents...')

    // Count total versions
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM document_versions
    `)
    console.log('[Test Insert GET] Count result:', countResult)

    // Try raw SQL read of all
    const allRaw = await db.execute(sql`
      SELECT id, document_id, version, file_name FROM document_versions LIMIT 10
    `)
    console.log('[Test Insert GET] Raw SQL read all:', allRaw)

    return NextResponse.json({
      success: true,
      message: 'Test GET completed'
    })
  } catch (err) {
    console.error('[Test Insert GET] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}

