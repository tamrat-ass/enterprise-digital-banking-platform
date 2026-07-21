import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documents, documentVersions } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/test-upload
 * 
 * Diagnostic endpoint using RAW SQL to check uploads and file paths
 */
export async function GET(_req: NextRequest) {
  try {
    console.log('[Test Upload] Fetching recent documents and versions using RAW SQL...')

    // Get recent documents using RAW SQL
    const recentDocs = await db.execute(sql`
      SELECT id, title, status, created_at
      FROM documents
      ORDER BY created_at DESC
      LIMIT 10
    `)

    console.log(`[Test Upload] Successfully fetched ${(recentDocs as any[]).length} recent documents`)

    if ((recentDocs as any[]).length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalDocuments: 0,
          documentsWithFilePath: 0,
          documentsWithoutFilePath: 0,
        },
        documents: [],
        diagnostic: {
          message: '📭 No documents in database yet',
          actionItems: [
            '1. Go to http://localhost:3000/upload',
            '2. Upload a test file',
            '3. Check back here after upload',
          ],
        },
      }, { status: 200 })
    }

    // Get all versions for these documents using RAW SQL
    const results = await Promise.all(
      (recentDocs as any[]).map(async (doc) => {
        try {
          console.log(`[Test Upload] Fetching versions for document ${doc.id} with raw SQL...`)
          
          // Use RAW SQL to read document_versions
          const versions = await db.execute(sql`
            SELECT id, document_id, version, file_name, file_path, author_id 
            FROM document_versions 
            WHERE document_id = ${doc.id}
            ORDER BY version DESC
          `)

          console.log(`[Test Upload] Found ${(versions as any[]).length} versions for ${doc.id}`)

          return {
            document: {
              id: doc.id,
              title: doc.title,
              status: doc.status,
            },
            versions: ((versions as any[]) || []).map((v: any) => ({
              id: v.id,
              version: v.version,
              fileName: v.file_name,
              filePath: v.file_path,
              filePathIsNull: v.file_path === null,
            })),
          }
        } catch (versionErr) {
          const errMsg = versionErr instanceof Error ? versionErr.message : String(versionErr)
          console.error(`[Test Upload] Error fetching versions for ${doc.id}:`, errMsg)
          
          return {
            document: {
              id: doc.id,
              title: doc.title,
              status: doc.status,
            },
            versions: [],
            error: `Failed to fetch versions: ${errMsg}`,
          }
        }
      })
    )

    const docsWithPath = results.filter((r) => r.versions?.some((v) => v.filePath))
    const docsWithoutPath = results.filter((r) => !r.versions?.some((v) => v.filePath))

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments: results.length,
        documentsWithFilePath: docsWithPath.length,
        documentsWithoutFilePath: docsWithoutPath.length,
      },
      documents: results.map((r) => ({
        ...r,
        status: r.versions?.some((v) => v.filePath) 
          ? '✅ HAS FILE_PATH' 
          : '❌ NO FILE_PATH (NULL)',
      })),
      diagnostic: {
        message: docsWithoutPath.length > 0 
          ? `⚠️ ${docsWithoutPath.length} documents missing file_path`
          : '✅ All documents have file_path',
      },
    }, { status: 200 })
  } catch (err) {
    console.error('[Test Upload] Database query error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    return NextResponse.json({
      success: false,
      error: 'Database query failed',
      details: errorMsg,
      hint: 'Check if documents table exists in database',
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/test-upload
 * 
 * Clear all documents for testing (use with caution!)
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'clear-all') {
      console.warn('[Test Upload] CLEARING ALL DOCUMENTS!')
      
      // Delete all document versions first (due to foreign keys)
      await db.delete(documentVersions)
      
      // Delete all documents
      await db.delete(documents)
      
      console.log('[Test Upload] All documents cleared')
      
      return NextResponse.json({
        success: true,
        message: 'All documents cleared for testing',
      }, { status: 200 })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
    }, { status: 400 })
  } catch (err) {
    console.error('[Test Upload] Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}

