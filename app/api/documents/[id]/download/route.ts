import { NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/lib/services"
import { FileStorageService } from "@/lib/services/file-storage.service"
import { requirePermission, errorResponse } from "@/lib/api-utils"

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'zip': 'application/zip',
  'json': 'application/json',
  'xml': 'application/xml',
  'html': 'text/html',
  'mp4': 'video/mp4',
  'mp3': 'audio/mpeg',
}

/**
 * GET /api/documents/[id]/download
 * Download a document file
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission(req, "documents.view")
    if (error) return error

    const params = await context.params
    const documentId = params.id

    console.log('[Download] Loading document:', documentId)
    const doc = await DocumentService.getDocument(documentId)
    console.log('[Download] Document found:', doc.title)

    // Get the current version to find the file
    const currentVersion = doc.versions && doc.versions[0]
    if (!currentVersion || !currentVersion.filePath) {
      console.log('[Download] No file path found - document metadata only')
      // Return a user-friendly error message
      const message = `This document (${doc.title}) was created before file storage was enabled. To download it, please re-upload the file from the upload page.`
      return errorResponse(message, 404)
    }

    const filePath = currentVersion.filePath
    const fileName = currentVersion.fileName || doc.title || 'document'
    
    // Extract extension from filePath (e.g., /uploads/uuid.txt -> txt)
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || 'txt'
    const mimeType = MIME_TYPES[fileExtension] || 'application/octet-stream'

    console.log('[Download] File:', fileName, 'Path:', filePath, 'Ext:', fileExtension, 'MIME:', mimeType)

    // Get the actual file from storage
    try {
      const fileBuffer = await FileStorageService.getFile(filePath)
      console.log('[Download] Found! Size:', fileBuffer.length, 'bytes')
      
      // Properly escape filename for Content-Disposition header
      const escapedFileName = fileName.replace(/"/g, '\\"')
      
      // Return the file with correct MIME type and attachment header
      return new NextResponse(fileBuffer as unknown as any, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${escapedFileName}"`,
          'Content-Length': String(fileBuffer.length),
        },
      })
    } catch (e) {
      console.error('[Download] File retrieval failed:', e)
      return errorResponse(`File not found: ${filePath}`, 404)
    }
  } catch (err) {
    console.error('[Download] Error:', err instanceof Error ? err.message : String(err))
    return errorResponse('Failed to download document', 500)
  }
}
