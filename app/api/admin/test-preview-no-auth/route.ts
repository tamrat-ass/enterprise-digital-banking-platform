import { NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/lib/services"
import { FileStorageService } from "@/lib/services"
import { PDFConversionService } from "@/lib/services/pdf-conversion.service"
import { errorResponse } from "@/lib/api-utils"

/**
 * GET /api/admin/test-preview-no-auth?documentId=...
 * Test preview endpoint logic without authentication
 */
export async function GET(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('documentId')
  
  if (!documentId) {
    return NextResponse.json(
      { error: 'documentId query parameter required' },
      { status: 400 }
    )
  }

  try {
    console.log('[TestPreviewNoAuth] Testing preview for:', documentId)

    // Step 1: Get document
    console.log('[TestPreviewNoAuth] Step 1: Getting document...')
    const document = await DocumentService.getDocument(documentId)
    console.log('[TestPreviewNoAuth] Document found:', { id: document.id, title: document.title })

    // Step 2: Get latest version from document
    console.log('[TestPreviewNoAuth] Step 2: Getting latest version...')
    const latestVersion = document.versions && document.versions.length > 0 ? document.versions[0] : null
    console.log('[TestPreviewNoAuth] Latest version:', latestVersion ? { id: latestVersion.id, filePath: latestVersion.filePath } : 'none')

    if (!latestVersion) {
      return NextResponse.json({
        error: 'No versions found for document',
        documentId,
      }, { status: 404 })
    }

    if (!latestVersion.filePath) {
      return NextResponse.json({
        warning: 'No file path in version',
        version: latestVersion,
        documentId,
      }, { status: 200 })
    }

    // Step 3: Get preview file
    console.log('[TestPreviewNoAuth] Step 3: Getting preview file...')
    const preview = await PDFConversionService.getPreviewFile(
      latestVersion.filePath,
      latestVersion.pdfPath
    )
    console.log('[TestPreviewNoAuth] Preview file:', {
      filePath: preview.filePath,
      mimeType: preview.mimeType,
    })

    // Step 4: Read file
    console.log('[TestPreviewNoAuth] Step 4: Reading file...')
    const fileBuffer = await FileStorageService.getFile(preview.filePath)
    console.log('[TestPreviewNoAuth] File read successfully, size:', fileBuffer.length)

    return NextResponse.json({
      success: true,
      documentId,
      fileName: latestVersion.fileName,
      filePath: latestVersion.filePath,
      fileSize: fileBuffer.length,
      mimeType: preview.mimeType,
      message: 'Preview logic working correctly - file would be served',
    })
  } catch (err) {
    console.error('[TestPreviewNoAuth] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      documentId,
    }, { status: 500 })
  }
}
