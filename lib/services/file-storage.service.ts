import fs from 'fs/promises'
import path from 'path'

/**
 * File Storage Service - Handles local file storage
 * Stores uploaded files in a local directory
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export class FileStorageService {
  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDir() {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true })
    } catch (err) {
      console.error('Failed to create upload directory:', err)
    }
  }

  /**
   * Save uploaded file
   * Returns the file path relative to public folder
   */
  static async saveFile(
    fileBuffer: ArrayBuffer,
    fileName: string,
    documentId: string
  ): Promise<string> {
    console.log('[FileStorageService] Starting file save:', {
      fileName,
      documentId,
      bufferSize: fileBuffer.byteLength,
      uploadDir: UPLOAD_DIR,
    })

    try {
      await this.ensureUploadDir()
      console.log('[FileStorageService] Upload dir ensured')

      // Create a unique file name with document ID to avoid collisions
      const fileExtension = path.extname(fileName)
      const storageName = `${documentId}${fileExtension}`
      const filePath = path.join(UPLOAD_DIR, storageName)

      console.log('[FileStorageService] About to write file:', {
        filePath,
        storageName,
        extension: fileExtension,
      })

      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(fileBuffer)
      console.log('[FileStorageService] Buffer created, size:', buffer.length)

      await fs.writeFile(filePath, buffer)
      console.log('[FileStorageService] File written successfully:', filePath)

      // Verify file was written
      const stat = await fs.stat(filePath)
      console.log('[FileStorageService] File verified:', {
        size: stat.size,
        path: filePath,
      })

      // Return path relative to public folder
      const relativePath = `/uploads/${storageName}`
      console.log('[FileStorageService] Returning relative path:', relativePath)
      return relativePath
    } catch (err) {
      console.error('[FileStorageService] Failed to save file:', {
        error: err,
        fileName,
        documentId,
      })
      throw new Error(`Failed to save file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * Get file
   */
  static async getFile(filePath: string): Promise<Buffer> {
    try {
      console.log('[FileStorageService] Reading file:', { filePath, filePathType: typeof filePath, filePathLength: filePath.length })
      
      // Normalize the file path - remove leading slash if present since we're joining with cwd
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
      console.log('[FileStorageService] Normalized path:', { original: filePath, normalized: normalizedPath })
      
      const fullPath = path.join(process.cwd(), 'public', normalizedPath)
      console.log('[FileStorageService] Full path:', fullPath)
      
      // Check if file exists
      try {
        await fs.access(fullPath)
        console.log('[FileStorageService] File exists at:', fullPath)
      } catch {
        console.error('[FileStorageService] File does NOT exist at:', fullPath)
        console.error('[FileStorageService] CWD:', process.cwd())
        console.error('[FileStorageService] Looking in:', path.join(process.cwd(), 'public'))
        
        // List files in uploads directory for debugging
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        try {
          const files = await fs.readdir(uploadsDir)
          console.error('[FileStorageService] Files in uploads:', files.slice(0, 5))
        } catch {}
        
        throw new Error(`File does not exist at: ${fullPath}`)
      }
      
      const buffer = await fs.readFile(fullPath)
      console.log('[FileStorageService] File read successfully, size:', buffer.length)
      return buffer
    } catch (err) {
      console.error(`[FileStorageService] Failed to read file ${filePath}:`, err)
      throw new Error(`File not found: ${filePath}`)
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePath)
      await fs.unlink(fullPath)
      console.log(`File deleted: ${fullPath}`)
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err)
    }
  }
}
