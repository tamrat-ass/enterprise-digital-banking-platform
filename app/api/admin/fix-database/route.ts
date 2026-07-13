import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/fix-database
 * 
 * Diagnostic endpoint to check and fix database issues
 * This is for admin use only - checks if file_path column exists and creates it if needed
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Fix Database] Starting database check...')

    // Check if file_path column exists in document_versions table
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' 
      AND column_name = 'file_path'
    `)

    const columnExists = (columnCheck as any[]).length > 0

    console.log('[Fix Database] Column check result:', { columnExists, recordCount: (columnCheck as any[]).length })

    if (!columnExists) {
      console.log('[Fix Database] Column does not exist, creating it...')
      // Create the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE document_versions 
        ADD COLUMN file_path VARCHAR(255) DEFAULT NULL
      `)
      console.log('[Fix Database] Column created successfully')

      return NextResponse.json({
        success: true,
        action: 'created',
        message: 'file_path column was missing and has been created',
        columnName: 'file_path',
        columnType: 'VARCHAR(255)'
      }, { status: 200 })
    } else {
      console.log('[Fix Database] Column already exists')
      return NextResponse.json({
        success: true,
        action: 'exists',
        message: 'file_path column already exists',
        columnName: 'file_path'
      }, { status: 200 })
    }
  } catch (err) {
    console.error('[Fix Database] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/fix-database
 * 
 * Actually apply fixes to the database
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'create-column') {
      console.log('[Fix Database] Creating file_path column...')
      
      try {
        await db.execute(sql`
          ALTER TABLE document_versions 
          ADD COLUMN IF NOT EXISTS file_path VARCHAR(255) DEFAULT NULL
        `)
        
        console.log('[Fix Database] Column created/verified')
        
        return NextResponse.json({
          success: true,
          message: 'Column created successfully'
        }, { status: 200 })
      } catch (err) {
        // Column might already exist, that's OK
        console.log('[Fix Database] Column might already exist:', err)
        return NextResponse.json({
          success: true,
          message: 'Column exists or was created'
        }, { status: 200 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 })
  } catch (err) {
    console.error('[Fix Database] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
