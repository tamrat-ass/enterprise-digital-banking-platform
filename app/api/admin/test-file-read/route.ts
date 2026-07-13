import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { FileStorageService } from "@/lib/services/file-storage.service"
import fs from 'fs/promises'
import path from 'path'

/**
 * GET /api/admin/test-file-read?documentId=...
 * Test file reading with detailed diagnostics
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
    console.log('[TestFileRead] Starting test for document:', documentId)

    // Step 1: Fetch from database
    console.log('[TestFileRead] Step 1: Fetching from database...')
    const versionResults = await db.execute(sql`
      SELECT id, file_name, file_path FROM document_versions
      WHERE document_id = ${documentId}
      ORDER BY version DESC
      LIMIT 1
    `)

    const version = (versionResults as any[])[0]
    if (!version) {
      return NextResponse.json({
        error: 'Document not found',
        documentId,
      }, { status: 404 })
    }

    console.log('[TestFileRead] Version found:', {
      id: version.id,
      fileName: version.file_name,
      filePath: version.file_path,
    })

    const filePath = version.file_path
    const fileName = version.file_name

    // Step 2: Check the direct path on disk
    console.log('[TestFileRead] Step 2: Checking disk...')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    console.log('[TestFileRead] Uploads directory:', uploadsDir)

    // List all files in uploads
    let filesList: string[] = []
    try {
      filesList = await fs.readdir(uploadsDir)
      console.log('[TestFileRead] Files in uploads:', filesList.slice(0, 10))
    } catch (err) {
      console.error('[TestFileRead] Could not list files:', err)
    }

    // Step 3: Test FileStorageService.getFile()
    console.log('[TestFileRead] Step 3: Testing FileStorageService.getFile()...')
    console.log('[TestFileRead] Calling with filePath:', filePath)

    let fileBuffer: Buffer | null = null
    let fileReadError: string | null = null

    try {
      fileBuffer = await FileStorageService.getFile(filePath)
      console.log('[TestFileRead] SUCCESS: File read, size:', fileBuffer.length, 'bytes')
    } catch (err) {
      fileReadError = err instanceof Error ? err.message : String(err)
      console.error('[TestFileRead] ERROR reading file:', fileReadError)
    }

    // Step 4: Test path construction manually
    console.log('[TestFileRead] Step 4: Testing path construction manually...')
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const manualFullPath = path.join(process.cwd(), 'public', normalizedPath)
    console.log('[TestFileRead] Manual path:', manualFullPath)

    let manualFileExists = false
    let manualFileSize = 0
    try {
      const stat = await fs.stat(manualFullPath)
      manualFileExists = true
      manualFileSize = stat.size
      console.log('[TestFileRead] File exists on disk! Size:', manualFileSize)
    } catch (err) {
      console.error('[TestFileRead] File does NOT exist at manual path:', manualFullPath)
      console.error('[TestFileRead] Error:', err instanceof Error ? err.message : String(err))
    }

    // Step 5: Try to read manually
    let manualReadSuccess = false
    let manualReadError: string | null = null
    let manualReadSize = 0
    try {
      if (manualFileExists) {
        const buffer = await fs.readFile(manualFullPath)
        manualReadSuccess = true
        manualReadSize = buffer.length
        console.log('[TestFileRead] Manual read SUCCESS! Size:', manualReadSize)
      }
    } catch (err) {
      manualReadError = err instanceof Error ? err.message : String(err)
      console.error('[TestFileRead] Manual read ERROR:', manualReadError)
    }

    return NextResponse.json({
      documentId,
      fileName,
      filePath,
      steps: {
        databaseFetch: 'Success',
        diskCheck: {
          uploadsDir,
          filesCount: filesList.length,
          sampleFiles: filesList.slice(0, 5),
        },
        fileStorageServiceTest: {
          success: fileBuffer !== null,
          error: fileReadError,
          bufferSize: fileBuffer?.length || 0,
        },
        manualPathConstruction: {
          originalPath: filePath,
          normalizedPath,
          fullPath: manualFullPath,
          fileExists: manualFileExists,
          fileSize: manualFileSize,
        },
        manualRead: {
          success: manualReadSuccess,
          error: manualReadError,
          bufferSize: manualReadSize,
        },
      },
    })
  } catch (err) {
    console.error('[TestFileRead] Fatal error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    }, { status: 500 })
  }
}
