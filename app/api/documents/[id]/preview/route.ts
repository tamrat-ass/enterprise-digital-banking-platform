import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { DocumentService } from "@/lib/services"
import { FileStorageService } from "@/lib/services"
import { PDFConversionService } from "@/lib/services/pdf-conversion.service"
import {
  requirePermission,
  errorResponse,
} from "@/lib/api-utils"

/**
 * GET /api/documents/[id]/preview
 * Get document preview/content
 * Converts Office files to PDF for inline preview
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(
    req,
    "documents.view",
  )
  if (error) return error

  const { id: documentId } = await params
  
  // Check if this is a preview request for a deleted file from Recycle Bin
  const url = new URL(req.url)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'

  console.log('[Preview] Request for document:', documentId, { includeDeleted })

  try {
    const document = await DocumentService.getDocument(documentId, includeDeleted)
    console.log('[Preview] Document found:', { id: document.id, title: document.title })
    
    // Get the latest version - use the one from getDocument which already fetched it
    const latestVersion = document.versions && document.versions.length > 0 ? document.versions[0] : null

    // Use the actual uploaded filename, not the document title
    const fileName = latestVersion?.fileName || document.title || 'document'
    
    console.log('[Preview] Document:', documentId, 'File:', fileName, 'Versions found:', latestVersion ? 1 : 0)
    
    // Log version details
    if (latestVersion) {
      console.log('[Preview] Latest version details:', {
        id: latestVersion.id,
        version: latestVersion.version,
        fileName: latestVersion.fileName,
        filePath: latestVersion.filePath,
        pdfPath: latestVersion.pdfPath,
      })
    } else {
      console.log('[Preview] No versions found for document')
    }
    
    // If we have a file path, try to load it
    if (latestVersion && latestVersion.filePath) {
      try {
        const fileExtension = path.extname(fileName).toLowerCase().slice(1)
        
        // Check if this is an Office file that needs conversion
        const needsConversion = PDFConversionService.needsConversion(fileExtension)
        
        console.log('[Preview] File check:', {
          fileName,
          extension: fileExtension,
          needsConversion,
          hasPdfPath: !!latestVersion.pdfPath,
        })

        let previewPath = latestVersion.filePath
        let previewMimeType = 'application/octet-stream'

        // If it's an Office file and we have a PDF path, use the PDF
        if (needsConversion && latestVersion.pdfPath) {
          console.log('[Preview] Using existing PDF:', latestVersion.pdfPath)
          previewPath = latestVersion.pdfPath
          previewMimeType = 'application/pdf'
        }
        // If it's an Office file but NO PDF path exists, try to convert on-the-fly
        else if (needsConversion && !latestVersion.pdfPath) {
          console.log('[Preview] No PDF found, attempting on-the-fly conversion...')
          try {
            const fullPath = path.join(process.cwd(), 'public', latestVersion.filePath)
            console.log('[Preview] Conversion details:', {
              fullPath,
              isCloudConvertAvailable: PDFConversionService.isCloudConvertAvailable(),
              fileExtension,
            })
            
            const convertedPdfPath = await PDFConversionService.convertToPDF(
              fullPath,
              fileName,
              documentId
            )
            
            console.log('[Preview] convertToPDF returned:', {
              result: convertedPdfPath,
              isNull: convertedPdfPath === null,
              type: typeof convertedPdfPath,
            })
            
            if (convertedPdfPath) {
              console.log('[Preview] On-the-fly conversion successful:', convertedPdfPath)
              previewPath = convertedPdfPath
              previewMimeType = 'application/pdf'
            } else {
              console.log('[Preview] Conversion failed or returned null - conversion service is not working properly')
              console.log('[Preview] Check CloudConvert API key and service logs above')
              
              // Return error response instead of falling back to original file
              // This makes the problem visible instead of silently failing
              const errorContent = `
PDF CONVERSION FAILED

The system tried to convert this document to PDF for preview, but the conversion failed.

Possible causes:
1. CloudConvert API key is not configured or invalid
2. CloudConvert service is down
3. The file format is not supported
4. Network connectivity issue

File Details:
- Name: ${fileName}
- Type: ${fileExtension}

Check the server console for detailed error messages.
              `.trim()
              
              return new NextResponse(errorContent, {
                status: 400,
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Content-Disposition': `attachment; filename="error.txt"`,
                },
              })
            }
          } catch (convErr) {
            console.error('[Preview] On-the-fly conversion error:', {
              message: convErr instanceof Error ? convErr.message : String(convErr),
              stack: convErr instanceof Error ? convErr.stack : undefined,
            })
            
            // Return error instead of silent fallback
            const errorContent = `
PDF CONVERSION ERROR

An error occurred while converting this document to PDF.

Error: ${convErr instanceof Error ? convErr.message : String(convErr)}

Check the server console for details.
            `.trim()
            
            return new NextResponse(errorContent, {
              status: 500,
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="error.txt"`,
              },
            })
          }
        }
        // For other previewable formats (PDF, images, etc.)
        else {
          const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'json': 'application/json',
            'xml': 'application/xml',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
          }
          previewMimeType = mimeTypes[fileExtension] || 'application/octet-stream'
        }
        
        console.log('[Preview] Loading file from:', {
          path: previewPath,
          mimeType: previewMimeType,
        })
        
        const fileBuffer = await FileStorageService.getFile(previewPath)
        console.log('[Preview] File loaded successfully, size:', fileBuffer.length, 'bytes')

        // For PDF files being previewed, use .pdf extension in the filename
        // This ensures browsers treat it as a PDF regardless of original file type
        let displayFileName = (latestVersion?.fileName || fileName)
          .replace(/"/g, '\\"')  // Escape quotes for header value
        
        if (previewMimeType === 'application/pdf' && !displayFileName.toLowerCase().endsWith('.pdf')) {
          // Replace extension with .pdf for converted Office documents
          displayFileName = displayFileName.replace(/\.[^.]+$/, '.pdf')
        }

        // For PDF and images, use inline. For others, use attachment
        const disposition = previewMimeType === 'application/pdf' || previewMimeType.startsWith('image/')
          ? 'inline'
          : 'attachment'

        console.log('[Preview] Response headers:', {
          contentType: previewMimeType,
          disposition,
          displayFileName,
        })

        return new NextResponse(fileBuffer as unknown as any, {
          status: 200,
          headers: {
            'Content-Type': previewMimeType,
            'Content-Disposition': `${disposition}; filename="${displayFileName}"`,
            'Cache-Control': 'public, max-age=3600',
            // Force inline viewing for PDFs - some browsers download by default
            'X-Content-Type-Options': 'nosniff',
          },
        })
      } catch (fileErr) {
        console.error('[Preview] File retrieval failed:', {
          filePath: latestVersion.filePath,
          pdfPath: latestVersion.pdfPath,
          error: fileErr instanceof Error ? fileErr.message : String(fileErr),
        })
        // Fall through to return metadata
      }
    } else {
      console.log('[Preview] No file path found in document versions', {
        hasLatestVersion: !!latestVersion,
        filePath: latestVersion?.filePath,
      })
    }

    // If no file path or file retrieval failed, return document metadata as text
    console.log('[Preview] Returning document metadata as plain text')
    const content = `DOCUMENT PREVIEW\n${'='.repeat(60)}\n\nTitle: ${document.title}\n\nDescription: ${document.description || 'No description provided'}\n\nCategory: ${document.category}\nStatus: ${document.status}\nAccess Level: ${document.accessLevel}\n\nCreated by: ${document.ownerName}\nCreated at: ${new Date(document.createdAt).toLocaleString()}\n\nNote: This document was created before file storage was available.\nTo preview the actual file, please re-upload the document.\n`
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${fileName}.txt"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[Preview] Error:', {
      documentId,
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    })
    return errorResponse('Document not found', 404)
  }
}
