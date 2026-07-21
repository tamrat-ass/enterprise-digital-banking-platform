import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { FileStorageService } from "@/lib/services/file-storage.service"
import { PDFConversionService } from "@/lib/services/pdf-conversion.service"

/**
 * GET /api/admin/test-preview/[documentId]
 * Test the preview flow for a specific document
 */
export async function GET(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('documentId')
  
  if (!documentId) {
    return NextResponse.json({
      success: false,
      error: 'documentId required as query param',
      example: '/api/admin/test-preview?documentId=10cccd22-98e4-463d-a8a9-63aa9ab04b26'
    })
  }

  const results: any = {
    documentId,
    steps: [],
    success: false,
  }

  try {
    // Step 1: Get document from database
    results.steps.push('Getting document...')
    const docResult = await db.execute(sql`
      SELECT id, title FROM documents WHERE id = ${documentId} LIMIT 1
    `)
    const doc = (docResult as any[])[0]

    if (!doc) {
      results.steps.push('❌ Document not found')
      return NextResponse.json(results, { status: 404 })
    }

    results.document = doc
    results.steps.push(`✅ Document found: ${doc.title}`)

    // Step 2: Get latest version
    results.steps.push('Getting latest version...')
    const verResult = await db.execute(sql`
      SELECT id, version, file_name, file_path, pdf_path
      FROM document_versions
      WHERE document_id = ${documentId}
      ORDER BY version DESC
      LIMIT 1
    `)
    const version = (verResult as any[])[0]

    if (!version) {
      results.steps.push('❌ No version found')
      return NextResponse.json(results, { status: 404 })
    }

    results.version = version
    results.steps.push(`✅ Version ${version.version} found`)
    results.steps.push(`   File: ${version.file_name}`)
    results.steps.push(`   Path in DB: ${version.file_path}`)
    results.steps.push(`   PDF Path in DB: ${version.pdf_path || 'null'}`)

    // Step 3: Get preview file (checks if PDF exists, otherwise uses original)
    results.steps.push('Determining preview file...')
    const preview = await PDFConversionService.getPreviewFile(
      version.file_path,
      version.pdf_path
    )
    results.preview = preview
    results.steps.push(`✅ Preview path: ${preview.filePath}`)
    results.steps.push(`   MIME type: ${preview.mimeType}`)

    // Step 4: Try to read the file from disk
    results.steps.push('Attempting to read file from disk...')
    try {
      const fileBuffer = await FileStorageService.getFile(preview.filePath)
      results.steps.push(`✅ File read successfully: ${fileBuffer.length} bytes`)
      results.success = true
      results.fileSize = fileBuffer.length
    } catch (readErr) {
      const errMsg = readErr instanceof Error ? readErr.message : String(readErr)
      results.steps.push(`❌ Failed to read file: ${errMsg}`)
      results.steps.push('   The file path in the database may be incorrect or the file may have been deleted')
    }

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    results.steps.push(`❌ Error: ${errMsg}`)
  }

  const httpStatus = results.success ? 200 : 500
  return NextResponse.json(results, { status: httpStatus })
}

/**
 * GET /api/admin/test-preview
 * List recent documents available for testing
 */
export async function HEAD(req: NextRequest) {
  const recentDocs = await db.execute(sql`
    SELECT id, title FROM documents ORDER BY created_at DESC LIMIT 5
  `)

  return NextResponse.json({
    success: true,
    message: 'Use ?documentId=<id> to test preview for a specific document',
    recentDocuments: (recentDocs as any[]).map(d => ({
      id: d.id,
      title: d.title,
      testUrl: `/api/admin/test-preview?documentId=${d.id}`
    }))
  })
}

