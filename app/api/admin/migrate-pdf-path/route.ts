import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * GET /api/admin/migrate-pdf-path
 * Add pdf_path column to document_versions table
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Admin] Adding pdf_path column to document_versions...')

    // Add pdf_path column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE document_versions
      ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(255) DEFAULT NULL
    `)

    console.log('[Admin] pdf_path column added/verified')

    return NextResponse.json({
      success: true,
      message: 'pdf_path column added successfully',
      column: 'pdf_path',
    }, { status: 200 })
  } catch (err) {
    console.error('[Admin] Error adding pdf_path column:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add pdf_path column',
      },
      { status: 500 }
    )
  }
}


