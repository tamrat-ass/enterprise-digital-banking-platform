import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/add-pdf-path-column
 * Add pdf_path column to document_versions table if it doesn't exist
 */
export async function GET(_req: NextRequest) {
  try {
    console.log('[AddPdfPath] Checking if pdf_path column exists...')

    // Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' AND column_name = 'pdf_path'
    `)

    const columnExists = (columnCheck as any[]).length > 0

    if (columnExists) {
      console.log('[AddPdfPath] Column already exists')
      return NextResponse.json({
        success: true,
        message: 'pdf_path column already exists',
        columnExists: true,
      })
    }

    console.log('[AddPdfPath] Column does not exist, creating it...')
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE document_versions
      ADD COLUMN pdf_path VARCHAR(255) DEFAULT NULL
    `)

    console.log('[AddPdfPath] Column created successfully')

    // Verify it was created
    const verifyCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' AND column_name = 'pdf_path'
    `)

    const verified = (verifyCheck as any[]).length > 0

    return NextResponse.json({
      success: true,
      message: 'pdf_path column added successfully',
      columnExists: true,
      verified: verified,
      column: verified ? (verifyCheck as any[])[0] : null,
    })
  } catch (err) {
    console.error('[AddPdfPath] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    }, { status: 500 })
  }
}

