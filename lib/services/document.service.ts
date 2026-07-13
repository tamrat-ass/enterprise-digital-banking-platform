import { db } from "@/lib/db"
import {
  documents,
  documentVersions,
  approvalRequests,
} from "@/lib/db/schema"
import { eq, desc, and, ilike, sql } from "drizzle-orm"
import { recordAudit } from "@/lib/audit"
import { FileStorageService } from "./file-storage.service"
import { PDFConversionService } from "./pdf-conversion.service"
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from "@/lib/schemas"
import path from "path"

/**
 * Document Service - Handles all document-related business logic
 */

export class DocumentService {
  /**
   * Create a new document
   */
  static async createDocument(
    input: CreateDocumentInput,
    userId: string,
    userName: string,
    fileMetadata?: {
      fileName?: string
      fileSize?: number
      fileType?: string
      fileContent?: ArrayBuffer | null
      divisionId?: string
    }
  ) {
    const documentId = crypto.randomUUID()
    const versionId = crypto.randomUUID()

    console.log('[DocumentService] Creating document:', {
      title: input.title,
      departmentId: input.departmentId,
      divisionId: fileMetadata?.divisionId,
      fileName: fileMetadata?.fileName,
    })

    // Save file if provided
    let filePath: string | null = null
    let pdfPath: string | null = null
    if (fileMetadata?.fileContent && fileMetadata?.fileName) {
      try {
        console.log('[DocumentService] Saving file for document:', {
          documentId,
          fileName: fileMetadata.fileName,
          contentSize: fileMetadata.fileContent.byteLength,
          contentType: fileMetadata.fileContent.constructor.name,
        })
        filePath = await FileStorageService.saveFile(
          fileMetadata.fileContent,
          fileMetadata.fileName,
          documentId
        )
        console.log('[DocumentService] File saved successfully at:', filePath)
        
        // VERIFY: Log that filePath is not null
        if (!filePath) {
          console.error('[DocumentService] WARNING: FileStorageService returned null filePath!')
        } else {
          console.log('[DocumentService] File path verified as non-null:', {
            filePath,
            filePathLength: filePath.length,
            filePathType: typeof filePath,
          })
        }

        // Convert to PDF if needed (async, non-blocking)
        if (fileMetadata.fileName && PDFConversionService.needsConversion(
          path.extname(fileMetadata.fileName).toLowerCase().slice(1)
        )) {
          console.log('[DocumentService] Queuing PDF conversion for:', fileMetadata.fileName)
          
          // Run conversion asynchronously without blocking upload
          setImmediate(async () => {
            try {
              if (!filePath) {
                console.error('[DocumentService] File path is null, cannot convert to PDF')
                return
              }
              
              const fullPath = path.join(process.cwd(), 'public', filePath)
              const convertedPath = await PDFConversionService.convertToPDF(
                fullPath,
                fileMetadata.fileName!,
                documentId
              )
              
              if (convertedPath) {
                console.log('[DocumentService] PDF conversion successful:', convertedPath)
                
                // Update database with PDF path using RAW SQL to avoid Drizzle ORM bug
                const relativePdfPath = convertedPath.replace(
                  path.join(process.cwd(), 'public'),
                  ''
                ).replace(/\\/g, '/')
                
                await db.execute(sql`
                  UPDATE document_versions
                  SET pdf_path = ${relativePdfPath}
                  WHERE id = ${versionId}
                `)
                
                console.log('[DocumentService] Document updated with PDF path:', relativePdfPath)
              } else {
                console.log('[DocumentService] PDF conversion not available, using original file')
              }
            } catch (err) {
              console.error('[DocumentService] PDF conversion failed (non-blocking):', err)
              // Don't fail the upload - PDF conversion is optional
            }
          })
        }
      } catch (err) {
        console.error('[DocumentService] Failed to save file:', {
          error: err,
          documentId,
          fileName: fileMetadata.fileName,
          errorMessage: err instanceof Error ? err.message : String(err),
        })
        // IMPORTANT: In production, fail the upload if file save fails
        throw new Error(`File save failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else {
      console.log('[DocumentService] No file content provided', {
        hasContent: !!fileMetadata?.fileContent,
        hasFileName: !!fileMetadata?.fileName,
        fileMetadata: fileMetadata ? Object.keys(fileMetadata) : 'null',
      })
      // If file content is missing but was expected, log it
      if (fileMetadata?.fileName && !fileMetadata?.fileContent) {
        console.error('[DocumentService] ERROR: File name provided but no content!')
      }
    }

    // Insert document using RAW SQL to avoid Drizzle default keyword issue
    console.log('[DocumentService] Inserting document with RAW SQL...')
    await db.execute(sql`
      INSERT INTO documents 
        (id, title, description, category, department_id, division_id, status, current_version, tags, owner_id, owner_name, access_level, expiry_date)
      VALUES 
        (${documentId}, ${input.title}, ${input.description || null}, ${input.category}, ${input.departmentId || null}, ${fileMetadata?.divisionId || null}, 'draft', 1, ${JSON.stringify(input.tags || [])}, ${userId}, ${userName}, ${input.accessLevel || 'internal'}, ${input.expiryDate || null})
    `)

    console.log('[DocumentService] Document inserted with divisionId:', fileMetadata?.divisionId)

    // Verify filePath before insert
    console.log('[DocumentService] About to insert document_version with:', {
      documentId,
      version: 1,
      fileName: fileMetadata?.fileName || input.title,
      filePath: filePath,
      filePathIsNull: filePath === null,
    })

    // Create first version with file metadata using RAW SQL to avoid Drizzle insert bug
    console.log('[DocumentService] About to insert version with RAW SQL:', {
      versionId,
      documentId,
      fileName: fileMetadata?.fileName || input.title,
      filePath: filePath || null,
      authorId: userId,
      authorName: userName,
    })
    
    // Use raw SQL instead of Drizzle ORM to avoid the "default" keyword issue
    const versionInsertResult = await db.execute(sql`
      INSERT INTO document_versions 
        (id, document_id, version, change_note, file_name, file_path, author_id, author_name)
      VALUES 
        (${versionId}, ${documentId}, 1, 'Initial version', ${fileMetadata?.fileName || input.title}, ${filePath || null}, ${userId}, ${userName})
      RETURNING id, document_id, version, file_name, file_path
    `)
    console.log('[DocumentService] Document version inserted successfully with RAW SQL:', versionInsertResult)
    console.log('[DocumentService] Document version inserted successfully with RAW SQL')
    
    // Verify the insert by reading it back with raw SQL
    const verifyInsert = await db.execute(sql`
      SELECT id, document_id, version, file_name, file_path, author_id
      FROM document_versions
      WHERE id = ${versionId}
      LIMIT 1
    `)
    
    if (verifyInsert && (verifyInsert as any[]).length > 0) {
      const inserted = (verifyInsert as any[])[0]
      console.log('[DocumentService] Verification - data in database:', {
        id: inserted.id,
        documentId: inserted.document_id,
        version: inserted.version,
        fileName: inserted.file_name,
        filePath: inserted.file_path,
        filePathIsNull: inserted.file_path === null,
      })
      
      if (inserted.file_path !== (filePath || null)) {
        console.error('[DocumentService] MISMATCH! Expected filePath:', filePath, 'Got:', inserted.file_path)
      }
    } else {
      console.error('[DocumentService] ERROR: Could not verify insert!')
    }

    // Record audit
    await recordAudit({
      userId,
      actorName: userName,
      action: "document.created",
      entityType: "document",
      entityId: documentId,
      module: "documents",
      details: `Created document: ${input.title}${fileMetadata?.fileName ? ` (${fileMetadata.fileName})` : ''}`,
    })

    return { 
      id: documentId, 
      version: 1, 
      ...input,
      fileName: fileMetadata?.fileName,
      fileSize: fileMetadata?.fileSize,
      fileType: fileMetadata?.fileType,
      filePath: filePath,
      divisionId: fileMetadata?.divisionId,
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    input: UpdateDocumentInput,
    userId: string,
    userName: string,
  ) {
    const updates: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (input.title) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.category) updates.category = input.category
    if (input.accessLevel) updates.accessLevel = input.accessLevel
    if (input.tags) updates.tags = input.tags
    if (input.expiryDate)
      updates.expiryDate = input.expiryDate

    await db.update(documents).set(updates).where(eq(documents.id, documentId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "document.updated",
      entityType: "document",
      entityId: documentId,
      module: "documents",
      details: `Updated document metadata`,
    })
  }

  /**
   * Create a new version of a document
   */
  static async createVersion(
    documentId: string,
    changeNote: string,
    userId: string,
    userName: string,
  ) {
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    })

    if (!doc) throw new Error("Document not found")

    const newVersion = doc.currentVersion + 1
    const versionId = crypto.randomUUID()

    // Use RAW SQL to insert version (avoid Drizzle ORM bug)
    await db.execute(sql`
      INSERT INTO document_versions
        (id, document_id, version, change_note, author_id, author_name)
      VALUES
        (${versionId}, ${documentId}, ${newVersion}, ${changeNote}, ${userId}, ${userName})
    `)

    await db
      .update(documents)
      .set({ currentVersion: newVersion, updatedAt: new Date() })
      .where(eq(documents.id, documentId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "document.versioned",
      entityType: "document",
      entityId: documentId,
      module: "documents",
      details: `Created version ${newVersion}: ${changeNote}`,
    })

    return { version: newVersion, versionId }
  }

  /**
   * Get document with versions
   */
  static async getDocument(documentId: string) {
    // Use RAW SQL to read document (avoid any Drizzle ORM issues)
    const docResults = await db.execute(sql`
      SELECT id, title, description, category, department_id, division_id, status, current_version, tags, owner_id, owner_name, access_level, expiry_date, created_at, updated_at
      FROM documents
      WHERE id = ${documentId}
      LIMIT 1
    `)

    const docRaw = (docResults as any[])[0]
    if (!docRaw) throw new Error("Document not found")

    // Map raw SQL to schema structure
    const doc = {
      id: docRaw.id,
      title: docRaw.title,
      description: docRaw.description,
      category: docRaw.category,
      departmentId: docRaw.department_id,
      divisionId: docRaw.division_id,
      status: docRaw.status,
      currentVersion: docRaw.current_version,
      tags: docRaw.tags,
      ownerId: docRaw.owner_id,
      ownerName: docRaw.owner_name,
      accessLevel: docRaw.access_level,
      expiryDate: docRaw.expiry_date,
      createdAt: docRaw.created_at,
      updatedAt: docRaw.updated_at,
    }

    // Use RAW SQL to read document versions (avoid Drizzle ORM bug)
    const versionsResults = await db.execute(sql`
      SELECT id, document_id, version, change_note, file_name, file_path, pdf_path, author_id, author_name, created_at
      FROM document_versions
      WHERE document_id = ${documentId}
      ORDER BY version DESC
    `)

    // Map raw SQL results to schema structure
    const versions = (versionsResults as any[]).map((v: any) => ({
      id: v.id,
      documentId: v.document_id,
      version: v.version,
      changeNote: v.change_note,
      fileName: v.file_name,
      filePath: v.file_path,
      pdfPath: v.pdf_path,
      authorId: v.author_id,
      authorName: v.author_name,
      createdAt: v.created_at,
    }))

    return { ...doc, versions }
  }

  /**
   * List documents with filtering and pagination
   */
  static async listDocuments(filters: DocumentFilters) {
    const {
      category,
      status,
      departmentId,
      search,
      page = 1,
      limit = 20,
    } = filters
    const offset = (page - 1) * limit

    const whereConditions: any[] = []

    if (category) whereConditions.push(eq(documents.category, category))
    if (status) whereConditions.push(eq(documents.status, status))
    if (departmentId)
      whereConditions.push(eq(documents.departmentId, departmentId))
    if (search)
      whereConditions.push(
        ilike(documents.title, `%${search}%`)
      )

    const where = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const [docs, [{ total }]] = await Promise.all([
      db
        .select()
        .from(documents)
        .where(where)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(documents)
        .where(where),
    ])

    return {
      data: docs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Delete a document (soft delete via status)
   */
  static async deleteDocument(
    documentId: string,
    userId: string,
    userName: string,
  ) {
    await db
      .update(documents)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(documents.id, documentId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "document.deleted",
      entityType: "document",
      entityId: documentId,
      module: "documents",
      details: "Document archived",
    })
  }

  /**
   * Submit document for approval
   */
  static async submitForApproval(
    documentId: string,
    workflowId: string,
    userId: string,
    userName: string,
  ) {
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    })

    if (!doc) throw new Error("Document not found")

    const approvalId = crypto.randomUUID()

    await db.insert(approvalRequests).values({
      id: approvalId,
      workflowId,
      title: `Approval: ${doc.title}`,
      entityType: "document",
      entityId: documentId,
      currentStep: 1,
      totalSteps: 1,
      status: "pending",
      requestedBy: userId,
      requestedByName: userName,
      priority: "medium",
    })

    await db
      .update(documents)
      .set({ status: "pending_approval", updatedAt: new Date() })
      .where(eq(documents.id, documentId))

    await recordAudit({
      userId,
      actorName: userName,
      action: "document.submitted_for_approval",
      entityType: "document",
      entityId: documentId,
      module: "documents",
      details: `Submitted for approval with workflow: ${workflowId}`,
    })

    return approvalId
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(departmentId?: string) {
    const where = departmentId
      ? eq(documents.departmentId, departmentId)
      : undefined

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        draft: sql<number>`COUNT(CASE WHEN status = 'draft' THEN 1 END)`,
        approved: sql<number>`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        archived: sql<number>`COUNT(CASE WHEN status = 'archived' THEN 1 END)`,
      })
      .from(documents)
      .where(where)

    return stats
  }
}
