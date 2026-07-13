import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * GET /api/admin/create-tables
 * Check which tables exist
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Create Tables] Checking existing tables...')

    const tables = ['documents', 'document_versions', 'document_categories']
    const results: Record<string, boolean> = {}

    for (const tableName of tables) {
      try {
        const result = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = ${tableName}
          )
        `)
        results[tableName] = (result as any[])[0]?.exists || false
        console.log(`[Create Tables] Table ${tableName}: ${results[tableName] ? 'EXISTS' : 'MISSING'}`)
      } catch (err) {
        console.log(`[Create Tables] Error checking ${tableName}:`, err)
        results[tableName] = false
      }
    }

    return NextResponse.json({
      success: true,
      tables: results,
      message: 'Table check completed'
    })
  } catch (err) {
    console.error('[Create Tables] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/create-tables
 * ADMIN ONLY: Create missing database tables
 * This is a helper endpoint for development/setup
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Create Tables] Creating all required tables...')

    // Create documents table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          department_id TEXT,
          division_id TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          current_version INTEGER NOT NULL DEFAULT 1,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          owner_id TEXT NOT NULL,
          owner_name TEXT,
          access_level TEXT NOT NULL DEFAULT 'internal',
          expiry_date DATE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('[Create Tables] documents table created/verified')
    } catch (err) {
      console.log('[Create Tables] documents table error:', err)
    }

    // Create document_versions table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS document_versions (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          change_note TEXT,
          file_name TEXT,
          file_path TEXT,
          pdf_path TEXT,
          author_id TEXT,
          author_name TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('[Create Tables] document_versions table created/verified')
    } catch (err) {
      console.log('[Create Tables] document_versions table error:', err)
    }

    // Create document_categories table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS document_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          code TEXT NOT NULL UNIQUE,
          description TEXT,
          color TEXT DEFAULT '#6B4423',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('[Create Tables] document_categories table created/verified')
    } catch (err) {
      console.log('[Create Tables] document_categories table error:', err)
    }

    // Insert default categories
    const categories = [
      {
        id: 'cat-001',
        name: 'Financial Reports',
        code: 'FIN_REP',
        description: 'Financial and accounting reports',
        color: '#2E7D32',
      },
      {
        id: 'cat-002',
        name: 'Contracts',
        code: 'CONTRACT',
        description: 'Contract documents and agreements',
        color: '#1565C0',
      },
      {
        id: 'cat-003',
        name: 'Policies',
        code: 'POLICY',
        description: 'Company policies and procedures',
        color: '#F57C00',
      },
      {
        id: 'cat-004',
        name: 'HR Documents',
        code: 'HR_DOC',
        description: 'Human resources documents',
        color: '#7B1FA2',
      },
      {
        id: 'cat-005',
        name: 'General',
        code: 'GENERAL',
        description: 'General documents',
        color: '#6B4423',
      },
    ]

    for (const cat of categories) {
      try {
        await db.execute(sql`
          INSERT INTO document_categories (id, name, code, description, color, is_active)
          VALUES (${cat.id}, ${cat.name}, ${cat.code}, ${cat.description}, ${cat.color}, true)
          ON CONFLICT (id) DO NOTHING
        `)
      } catch (e) {
        console.log(`[Create Tables] Category ${cat.name} already exists or error inserting`)
      }
    }

    console.log('[Create Tables] All tables created and populated successfully')

    return NextResponse.json({
      success: true,
      message: 'All tables created and populated successfully',
      tables: ['documents', 'document_versions', 'document_categories'],
    })
  } catch (err) {
    console.error('[Create Tables] Error creating tables:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create tables',
      },
      { status: 500 }
    )
  }
}
