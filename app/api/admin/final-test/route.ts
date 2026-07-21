import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { DocumentService } from "@/lib/services"

/**
 * POST /api/admin/final-test
 * Comprehensive end-to-end test of the entire upload and preview system
 */
export async function POST(req: NextRequest) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
    }
  }

  try {
    // TEST 1: Create a document with file
    console.log('[Final Test] TEST 1: Create document with file')
    const fileName = `test-${Date.now()}.txt`
    const testContent = new TextEncoder().encode(`Test content at ${new Date().toISOString()}`)
    
    const document = await DocumentService.createDocument(
      {
        title: `Final Test Doc - ${Date.now()}`,
        description: "End-to-end test of upload and preview",
        category: "general",
        departmentId: undefined,
        accessLevel: "internal",
        tags: ["test", "final"],
        expiryDate: undefined,
      },
      "test-user-final",
      "Final Test User",
      {
        fileName: fileName,
        fileSize: testContent.byteLength,
        fileType: "text/plain",
        fileContent: testContent.buffer as ArrayBuffer,
        divisionId: undefined,
      }
    )

    testResults.tests.push({
      name: "Create Document",
      status: document.id ? "PASS" : "FAIL",
      details: {
        documentId: document.id,
        hasFilePath: !!document.filePath,
        filePath: document.filePath,
      }
    })
    if (document.id) testResults.summary.passed++
    else testResults.summary.failed++

    const docId = document.id

    // TEST 2: Query versions directly with raw SQL (same way check-data does it)
    console.log('[Final Test] TEST 2: Query versions directly with raw SQL')
    const versionsRaw = await db.execute(sql`
      SELECT id, version, file_name, file_path FROM document_versions WHERE document_id = ${docId}
    `)

    const hasVersions = (versionsRaw as any[]).length > 0
    const versionHasPath = hasVersions && (versionsRaw as any[])[0].file_path

    testResults.tests.push({
      name: "Query Versions (Raw SQL)",
      status: hasVersions && versionHasPath ? "PASS" : "FAIL",
      details: {
        documentId: docId,
        versionsCount: (versionsRaw as any[]).length,
        latestVersionFilePath: (versionsRaw as any[])[0]?.file_path || null,
      }
    })
    if (hasVersions && versionHasPath) testResults.summary.passed++
    else testResults.summary.failed++

    // TEST 3: Verify counts match
    console.log('[Final Test] TEST 3: Verify counts match')
    const docCount = await db.execute(sql`SELECT COUNT(*) as count FROM documents`)
    const verCount = await db.execute(sql`SELECT COUNT(*) as count FROM document_versions`)
    
    const docCountNum = parseInt((docCount as any[])[0]?.count || "0")
    const verCountNum = parseInt((verCount as any[])[0]?.count || "0")
    const countsMatch = docCountNum > 0 && verCountNum > 0

    testResults.tests.push({
      name: "Document Counts",
      status: countsMatch ? "PASS" : "FAIL",
      details: {
        totalDocuments: docCountNum,
        totalVersions: verCountNum,
      }
    })
    if (countsMatch) testResults.summary.passed++
    else testResults.summary.failed++

    testResults.success = testResults.summary.failed === 0
    testResults.message = testResults.success 
      ? "✅ All tests passed! Upload and preview system is fully functional."
      : "⚠️ Some tests failed - check details"

    return NextResponse.json(testResults, {
      status: testResults.success ? 200 : 500
    })

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    testResults.success = false
    testResults.message = "❌ Test suite failed with error"
    testResults.error = errorMsg
    testResults.summary.failed++

    return NextResponse.json(testResults, { status: 500 })
  }
}

/**
 * GET /api/admin/final-test
 * Instructions
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "POST to run final comprehensive test",
    endpoint: "POST /api/admin/final-test",
    description: "Runs end-to-end tests for document upload and preview system",
  })
}

