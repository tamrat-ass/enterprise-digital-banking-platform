# PDF Conversion Implementation Guide

## Architecture Overview

```
Upload Office File (DOCX, PPTX, XLSX)
    ↓
Save Original File
    ↓
Convert to PDF (Async)
    ↓
Save Preview PDF
    ↓
Database:
  - file_path: /uploads/[UUID].docx (original)
  - pdf_path: /uploads/[UUID].pdf (preview)
    ↓
Preview:
  - Show PDF (always works)
    ↓
Download:
  - Download original file (DOCX, not PDF)
```

---

## What Was Added

### 1. PDF Conversion Service
**File**: `lib/services/pdf-conversion.service.ts`

Provides:
- `needsConversion()` - Check if file needs PDF conversion
- `convertToPDF()` - Convert Office files to PDF
- `getPreviewFile()` - Get the best preview file (PDF if available, else original)

### 2. Database Schema Update
**File**: `lib/db/schema.ts`

Added field to `documentVersions`:
```typescript
pdfPath: text("pdf_path").default(null),
```

### 3. Migration Endpoint
**File**: `app/api/admin/migrate-pdf-path/route.ts`

Adds the `pdf_path` column to existing database:
```
GET /api/admin/migrate-pdf-path
```

---

## Implementation Steps

### Step 1: Create Database Column
```bash
GET http://localhost:3000/api/admin/migrate-pdf-path
```

Response:
```json
{
  "success": true,
  "message": "pdf_path column added successfully",
  "column": "pdf_path"
}
```

### Step 2: Choose Conversion Library

You have several options:

#### Option A: LibreOffice (Free, Self-Hosted)
```bash
# Install LibreOffice
# Windows: Download from https://www.libreoffice.org/download/
# Mac: brew install libreoffice
# Linux: apt-get install libreoffice

# Install Node wrapper
npm install libreoffice-convert
```

**Implementation**:
```typescript
const libre = require('libreoffice-convert');

static async convertToPDF(inputPath: string, fileName: string, documentId: string) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.pdf');
  
  return new Promise((resolve, reject) => {
    libre.convert({ infile: inputPath, outfile: outputPath }, (err, result) => {
      if (err) reject(err);
      resolve(outputPath);
    });
  });
}
```

#### Option B: CloudConvert API (Free tier available)
```bash
npm install cloudconvert
```

**Implementation**:
```typescript
import { createClient } from 'cloudconvert';

const cloudconvert = createClient({
  apiKey: process.env.CLOUDCONVERT_API_KEY
});

static async convertToPDF(inputPath: string, fileName: string, documentId: string) {
  const job = await cloudconvert.jobs.create({
    tasks: {
      'import-my-file': {
        operation: 'import/url',
        url: `http://localhost:3000/uploads/${documentId}${path.extname(fileName)}`
      },
      'convert-my-file': {
        operation: 'convert',
        input: 'import-my-file',
        output_format: 'pdf'
      },
      'export-my-file': {
        operation: 'export/url',
        input: 'convert-my-file'
      }
    }
  });
  
  // Wait for conversion and download PDF
  return pdfPath;
}
```

#### Option C: Aspose.Words API
```bash
npm install aspose-words-cloud
```

#### Option D: iLovePDF API
```bash
npm install ilovepdf
```

---

## Integration with Upload Service

Update `lib/services/document.service.ts`:

```typescript
import { PDFConversionService } from "./pdf-conversion.service"

static async createDocument(input, userId, userName, fileMetadata) {
  // ... existing code ...
  
  // Save file
  let filePath = await FileStorageService.saveFile(...)
  
  // Convert to PDF if needed
  let pdfPath = null
  if (fileMetadata?.fileName && PDFConversionService.needsConversion(fileMetadata.fileName)) {
    try {
      pdfPath = await PDFConversionService.convertToPDF(
        path.join(process.cwd(), 'public', filePath),
        fileMetadata.fileName,
        documentId
      )
    } catch (err) {
      console.error('PDF conversion failed:', err)
      // Continue without PDF - fallback to original file
    }
  }
  
  // Insert with both paths
  await db.insert(documentVersions).values({
    // ... other fields ...
    filePath: filePath,
    pdfPath: pdfPath,
  })
}
```

---

## Update Preview Endpoint

Update `/api/documents/[id]/preview/route.ts`:

```typescript
import { PDFConversionService } from "@/lib/services/pdf-conversion.service"

// Get latest version
const latestVersion = await db
  .select()
  .from(documentVersions)
  .where(eq(documentVersions.documentId, documentId))
  .orderBy(desc(documentVersions.version))
  .limit(1)

if (latestVersion.length > 0) {
  // Get preview file (PDF if available, else original)
  const preview = await PDFConversionService.getPreviewFile(
    latestVersion[0].filePath,
    latestVersion[0].pdfPath
  )
  
  // Stream the preview file
  const fileBuffer = await FileStorageService.getFile(preview.filePath)
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': preview.mimeType,
      'Content-Disposition': `inline; filename="${fileName}.pdf"`,
    },
  })
}
```

---

## Benefits of This Approach

| Feature | Before | After |
|---------|--------|-------|
| **DOCX Preview** | ❌ Not supported | ✅ PDF preview |
| **PPTX Preview** | ❌ Not supported | ✅ PDF preview |
| **XLSX Preview** | ❌ Not supported | ✅ PDF preview |
| **Original File Download** | ✅ Works | ✅ Still works |
| **Browser Compatibility** | ⚠️ Varies | ✅ All browsers |
| **Mobile Support** | ⚠️ Partial | ✅ Full support |
| **User Experience** | ⚠️ Inconsistent | ✅ Consistent |

---

## Database Query for Existing Data

To add PDF conversion for existing documents:

```sql
-- Find all documents without PDF conversion
SELECT dv.id, dv.file_path, dv.file_name
FROM document_versions dv
WHERE dv.pdf_path IS NULL
  AND (dv.file_name LIKE '%.docx' 
    OR dv.file_name LIKE '%.pptx' 
    OR dv.file_name LIKE '%.xlsx');

-- Queue them for conversion
-- Then run conversion batch job
```

---

## Deployment Checklist

- [ ] Add `pdf_path` column to database (run migration endpoint)
- [ ] Install chosen conversion library
- [ ] Add `CLOUDCONVERT_API_KEY` or similar to `.env.local`
- [ ] Update `document.service.ts` with conversion logic
- [ ] Update preview endpoint to use PDF
- [ ] Test with DOCX, PPTX, XLSX files
- [ ] Test fallback (conversion failures)
- [ ] Monitor conversion performance
- [ ] Set up error alerts for failed conversions

---

## Performance Considerations

### Async Conversion
Do conversion asynchronously after upload completes:

```typescript
// Upload completes immediately
res.json({ success: true, documentId })

// Queue PDF conversion in background
setTimeout(() => {
  convertToPDF(filePath, fileName, documentId)
}, 1000)
```

### Caching
Cache converted PDFs:
- Keep PDF in storage
- Reuse for multiple previews
- Only reconvert if source changes

### Storage
Estimate storage needs:
- DOCX (50 KB) → PDF (200 KB) 
- PPTX (500 KB) → PDF (2 MB)
- XLSX (100 KB) → PDF (300 KB)

---

## Recommended Choice for Enterprise DMS

**Best Option: LibreOffice (for self-hosted) or CloudConvert API (for managed)**

- **LibreOffice**: Free, works offline, no API limits
- **CloudConvert**: Reliable, scales easily, small cost

---

## Next Steps

1. Run migration: `GET /api/admin/migrate-pdf-path`
2. Install conversion library of choice
3. Update upload service with conversion logic
4. Update preview endpoint
5. Test with various file types
6. Monitor conversion quality and performance

