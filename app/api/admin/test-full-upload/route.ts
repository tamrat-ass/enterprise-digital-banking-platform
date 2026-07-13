import { NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/lib/services"

/**
 * POST /api/admin/test-full-upload
 * Full end-to-end test simulating a real document upload
 */
export async function POST(req: NextRequest) {
  const fileName = `test-document-${Date.now()}.txt`
  const testContent = new TextEncoder().encode(`Test document content created at ${new Date().toISOString()}`)

  console.log('[Full Upload Test] Starting full upload simulation...')

  try {
    // Simulate the upload process
    const document = await DocumentService.createDocument(
      {
        title: `Test Document - ${Date.now()}`,
        description: "This is a test document from the automated test",
        category: "general",
        departmentId: undefined,
        accessLevel: "internal",
        tags: ["test", "automated"],
        expiryDate: undefined,
      },
      "test-user-automated",
      "Automated Test User",
      {
        fileName: fileName,
        fileSize: testContent.byteLength,
        fileType: "text/plain",
        fileContent: testContent.buffer as ArrayBuffer,
        divisionId: undefined,
      }
    )

    console.log('[Full Upload Test] Document created successfully:', {
      id: document.id,
      title: document.title,
      filePath: document.filePath,
      filePathExists: !!document.filePath,
    })

    return NextResponse.json({
      success: true,
      message: 'Full upload test completed successfully',
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        filePath: document.filePath,
        fileSize: document.fileSize,
        version: document.version,
        status: 'draft',
      },
      test: {
        timestamp: new Date().toISOString(),
        uploadedFileName: fileName,
        uploadedContent: `${testContent.byteLength} bytes`,
      }
    }, { status: 201 })
  } catch (err) {
    console.error('[Full Upload Test] Error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    return NextResponse.json({
      success: false,
      error: errorMsg,
      hint: 'Check server logs for detailed error information',
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/test-full-upload
 * Check recent test uploads
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST to this endpoint to run a full upload test',
    endpoint: 'POST /api/admin/test-full-upload',
  })
}
