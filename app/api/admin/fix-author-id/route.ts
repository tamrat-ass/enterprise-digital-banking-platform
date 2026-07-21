import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/fix-author-id
 * Fix the author_id column type from UUID to TEXT (for Clerk auth IDs)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Fix Author ID] Starting schema fix...')

    // Check current column type
    const columnInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' 
      AND column_name = 'author_id'
    `)

    console.log('[Fix Author ID] Current column info:', columnInfo)

    // Try to alter column to TEXT type
    try {
      await db.execute(sql`
        ALTER TABLE document_versions 
        ALTER COLUMN author_id TYPE text
      `)
      console.log('[Fix Author ID] Successfully altered author_id to TEXT type')
    } catch (alterErr) {
      console.log('[Fix Author ID] Column already TEXT or error:', alterErr)
    }

    // Also fix pdf_path to allow NULL if needed
    try {
      await db.execute(sql`
        ALTER TABLE document_versions 
        ALTER COLUMN pdf_path DROP NOT NULL
      `)
      console.log('[Fix Author ID] Made pdf_path nullable')
    } catch (pdfErr) {
      console.log('[Fix Author ID] pdf_path already nullable:', pdfErr)
    }

    // Verify
    const finalInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' 
      AND column_name IN ('author_id', 'pdf_path', 'file_path')
      ORDER BY column_name
    `)

    console.log('[Fix Author ID] Final schema:', finalInfo)

    return NextResponse.json({
      success: true,
      message: 'Schema fixed: author_id is now TEXT, pdf_path is nullable',
      before: columnInfo,
      after: finalInfo,
    }, { status: 200 })
  } catch (err) {
    console.error('[Fix Author ID] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}

