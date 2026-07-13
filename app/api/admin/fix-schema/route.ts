import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/fix-schema
 * Fix the document_versions table schema to make columns nullable
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Fix Schema] Checking document_versions table structure...')

    // Get table structure
    const tableInfo = await db.execute(sql`
      SELECT column_name, is_nullable, column_default, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' 
      AND column_name IN ('file_path', 'pdf_path')
    `)

    console.log('[Fix Schema] Current table structure:', tableInfo)

    // Check if columns are NOT NULL
    const filePathNotNull = await db.execute(sql`
      SELECT is_nullable FROM information_schema.columns 
      WHERE table_name = 'document_versions' AND column_name = 'file_path'
    `)

    console.log('[Fix Schema] file_path is_nullable:', filePathNotNull)

    // Try to alter table if needed
    try {
      // Make file_path nullable
      await db.execute(sql`
        ALTER TABLE document_versions 
        ALTER COLUMN file_path DROP NOT NULL
      `)
      console.log('[Fix Schema] Altered file_path to be nullable')
    } catch (err) {
      console.log('[Fix Schema] file_path already nullable or error:', err)
    }

    try {
      // Make pdf_path nullable (should already be)
      await db.execute(sql`
        ALTER TABLE document_versions 
        ALTER COLUMN pdf_path DROP NOT NULL
      `)
      console.log('[Fix Schema] Altered pdf_path to be nullable')
    } catch (err) {
      console.log('[Fix Schema] pdf_path already nullable or error:', err)
    }

    // Check final structure
    const finalInfo = await db.execute(sql`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' 
      AND column_name IN ('file_path', 'pdf_path')
    `)

    console.log('[Fix Schema] Final table structure:', finalInfo)

    return NextResponse.json({
      success: true,
      message: 'Schema fix applied',
      before: tableInfo,
      after: finalInfo,
    }, { status: 200 })
  } catch (err) {
    console.error('[Fix Schema] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
