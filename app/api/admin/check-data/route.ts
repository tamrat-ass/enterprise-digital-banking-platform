import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/check-data
 * Super simple check - just raw SQL counts
 */
export async function GET(_req: NextRequest) {
  const results: any = {
    success: false,
    steps: [],
  }

  try {
    // Step 1: Count documents
    results.steps.push('Counting documents...')
    const docCount = await db.execute(sql`SELECT COUNT(*) as count FROM documents`)
    const doc_count = (docCount as any[])[0]?.count || 0
    results.counts = { documents: doc_count }
    results.steps.push(`Found ${doc_count} documents`)

    // Step 2: Count versions
    results.steps.push('Counting versions...')
    const verCount = await db.execute(sql`SELECT COUNT(*) as count FROM document_versions`)
    const ver_count = (verCount as any[])[0]?.count || 0
    results.counts.versions = ver_count
    results.steps.push(`Found ${ver_count} versions`)

    // Step 3: Get docs
    results.steps.push('Fetching documents...')
    const docsRaw = await db.execute(sql`
      SELECT id, title FROM documents ORDER BY created_at DESC LIMIT 1
    `)
    results.steps.push(`Got ${(docsRaw as any[]).length} documents`)
    results.sample_docs = docsRaw

    // Step 4: Get versions
    if ((docsRaw as any[]).length > 0) {
      const docId = (docsRaw as any[])[0].id
      results.steps.push(`Fetching versions for doc ${docId}...`)
      const versionsRaw = await db.execute(sql`
        SELECT id, version, file_name, file_path FROM document_versions WHERE document_id = ${docId}
      `)
      results.steps.push(`Got ${(versionsRaw as any[]).length} versions`)
      results.sample_versions = versionsRaw
    }

    results.success = true
    return NextResponse.json(results)
  } catch (err) {
    results.error = err instanceof Error ? err.message : String(err)
    results.steps.push(`ERROR: ${results.error}`)
    return NextResponse.json(results, { status: 500 })
  }
}
