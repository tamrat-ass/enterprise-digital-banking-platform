import fs from 'fs/promises'
import path from 'path'

/**
 * PDF Conversion Service
 * Converts Office files to PDF for preview using CloudConvert API
 * 
 * Environment variables:
 * - CLOUDCONVERT_API_KEY: Your CloudConvert API key (required for conversions)
 */

const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY

console.log('[PDFConversionService] Initialized')
console.log('[PDFConversionService] CloudConvert API Key present:', !!CLOUDCONVERT_API_KEY)
if (!CLOUDCONVERT_API_KEY) {
  console.warn('[PDFConversionService] WARNING: CLOUDCONVERT_API_KEY is not set!')
  console.warn('[PDFConversionService] Add CLOUDCONVERT_API_KEY to .env.local and restart dev server')
}

export class PDFConversionService {
  /**
   * Check if file needs conversion to PDF
   */
  static needsConversion(fileExtension: string): boolean {
    const officeFormats = [
      'docx', 'doc', // Word
      'xlsx', 'xls', // Excel
      'pptx', 'ppt', // PowerPoint
      'odt', 'odp', 'ods', // OpenDocument
    ]
    return officeFormats.includes(fileExtension.toLowerCase())
  }

  /**
   * Check if CloudConvert is available
   */
  static isCloudConvertAvailable(): boolean {
    if (!CLOUDCONVERT_API_KEY) {
      return false
    }
    return true
  }

  /**
   * Convert file to PDF using CloudConvert API
   * 
   * To enable:
   * 1. Sign up at https://cloudconvert.com
   * 2. Get your API key from settings  
   * 3. Set CLOUDCONVERT_API_KEY in .env.local
   */
  static async convertToPDFCloudConvert(
    inputPath: string,
    fileName: string,
    documentId: string
  ): Promise<string | null> {
    try {
      if (!this.isCloudConvertAvailable()) {
        console.log('[PDFConversion] CloudConvert API key not configured')
        return null
      }

      console.log('[PDFConversion] Converting with CloudConvert:', {
        fileName,
        documentId,
        inputPath,
      })

      const fileBuffer = await fs.readFile(inputPath)
      const fileExtension = path.extname(fileName).toLowerCase().slice(1)
      
      console.log('[PDFConversion] File read:', {
        fileSize: fileBuffer.length,
        extension: fileExtension,
      })
      
      // Save the file to disk and use import/base64 instead
      console.log('[PDFConversion] Converting file to base64...')
      let base64Content = Buffer.from(fileBuffer).toString('base64')
      
      // Strip any accidental data URL prefix
      base64Content = base64Content.replace(/^data:.*;base64,/, '')
      
      console.log('[PDFConversion] Base64 prepared:', {
        fileName,
        fileExtension,
        base64Length: base64Content.length,
        base64Start: base64Content.slice(0, 30),
      })

      // Create a job with import/base64
      console.log('[PDFConversion] Creating CloudConvert job with base64...')
      const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: {
            'import-file': {
              operation: 'import/base64',
              file: base64Content,
              filename: fileName,
            },
            'convert-file': {
              operation: 'convert',
              input: 'import-file',
              input_format: fileExtension,
              output_format: 'pdf',
            },
            'export-file': {
              operation: 'export/url',
              input: 'convert-file',
            },
          },
          tag: documentId,
        }),
      })

      if (!createJobResponse.ok) {
        const errorText = await createJobResponse.text()
        console.error('[PDFConversion] Failed to create job:', {
          status: createJobResponse.status,
          error: errorText,
        })
        return null
      }

      const jobData = await createJobResponse.json() as any
      console.log('[PDFConversion] Job created, ID:', jobData.data?.id)

      if (!jobData.data?.id) {
        console.error('[PDFConversion] No job ID in response')
        return null
      }

      const jobId = jobData.data.id
      console.log('[PDFConversion] File data included in job creation')

      // Step 3: Wait for the job to complete (with shorter timeout for previews)
      console.log('[PDFConversion] Waiting for conversion to complete...')
      let attempts = 0
      const maxAttempts = 20 // 20 seconds timeout for preview requests

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
          },
        })

        if (!statusResponse.ok) {
          console.error('[PDFConversion] Failed to get job status:', statusResponse.status)
          break
        }

        const status = await statusResponse.json() as any
        
        console.log('[PDFConversion] Job status:', {
          jobId,
          status: status.data?.status,
          attempt: attempts + 1,
        })
        
        if (status.data?.status === 'finished') {
          console.log('[PDFConversion] Task finished')
          
          // Find the export task result
          const exportTask = status.data.tasks?.find((t: any) => t.name === 'export-file')
          if (exportTask?.result?.files?.[0]?.url) {
            const downloadUrl = exportTask.result.files[0].url
            
            // Step 4: Download the converted PDF
            console.log('[PDFConversion] Downloading converted PDF from:', downloadUrl.substring(0, 100) + '...')
            const downloadResponse = await fetch(downloadUrl)
            
            if (!downloadResponse.ok) {
              console.error('[PDFConversion] Failed to download converted PDF:', downloadResponse.status)
              return null
            }

            const pdfBuffer = await downloadResponse.arrayBuffer()
            const pdfPath = inputPath.replace(/\.[^.]+$/, '.pdf')
            
            console.log('[PDFConversion] Writing PDF to disk:', {
              pdfPath,
              pdfSize: pdfBuffer.byteLength,
            })
            
            await fs.writeFile(pdfPath, Buffer.from(pdfBuffer))
            
            console.log('[PDFConversion] CloudConvert conversion successful:', pdfPath)
            
            // Return relative path for database storage
            const relativePath = pdfPath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/')
            console.log('[PDFConversion] Returning relative path:', relativePath)
            return relativePath
          } else {
            console.error('[PDFConversion] No download URL found in export task result')
            console.log('[PDFConversion] Export task result:', JSON.stringify(exportTask))
          }
        }

        if (status.data?.status === 'failed') {
          console.error('[PDFConversion] Conversion failed:', status.data?.message)
          if (status.data?.tasks) {
            status.data.tasks.forEach((t: any) => {
              if (t.status === 'failed') {
                console.error(`  Task ${t.name}:`, t.message)
                if (t.error) console.error(`  Error details:`, t.error)
              }
            })
          }
          break
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }

      console.error('[PDFConversion] Conversion timeout or failed after', maxAttempts, 'attempts')
      return null
    } catch (err) {
      console.error('[PDFConversion] CloudConvert error:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
      return null
    }
  }

  /**
   * Convert file to PDF using local LibreOffice
   * 
   * Disabled - Use CloudConvert instead
   */
  static async convertToPDFLibreOffice(
    _inputPath: string,
    _fileName: string,
    _documentId: string
  ): Promise<string | null> {
    console.log('[PDFConversion] LibreOffice not available - use CloudConvert instead')
    return null
  }

  /**
   * Convert file to PDF
   * Tries CloudConvert first (if configured), then falls back to LibreOffice
   */
  static async convertToPDF(
    inputPath: string,
    fileName: string,
    documentId: string
  ): Promise<string | null> {
    try {
      const fileExtension = path.extname(fileName).toLowerCase().slice(1)
      
      if (!this.needsConversion(fileExtension)) {
        // File is already in a previewable format
        return null
      }

      console.log('[PDFConversion] Starting conversion:', {
        fileName,
        extension: fileExtension,
        documentId,
        inputPath,
      })

      // Try CloudConvert first if available
      if (this.isCloudConvertAvailable()) {
        const cloudResult = await this.convertToPDFCloudConvert(inputPath, fileName, documentId)
        if (cloudResult) return cloudResult
      }

      // Fall back to LibreOffice
      const libreResult = await this.convertToPDFLibreOffice(inputPath, fileName, documentId)
      if (libreResult) return libreResult

      console.log('[PDFConversion] No conversion method available - using original file for preview')
      return null
    } catch (err) {
      console.error('[PDFConversion] Error:', err)
      return null
    }
  }

  /**
   * Get preview file for display
   */
  static async getPreviewFile(
    originalPath: string,
    pdfPath: string | null
  ): Promise<{ filePath: string; mimeType: string }> {
    // If PDF conversion exists, use it
    if (pdfPath) {
      return {
        filePath: pdfPath,
        mimeType: 'application/pdf',
      }
    }

    // Otherwise use original file
    const ext = path.extname(originalPath).toLowerCase().slice(1)
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
      // Office formats - not previewable directly
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'ppt': 'application/vnd.ms-powerpoint',
    }

    return {
      filePath: originalPath,
      mimeType: mimeTypes[ext] || 'application/octet-stream',
    }
  }
}

