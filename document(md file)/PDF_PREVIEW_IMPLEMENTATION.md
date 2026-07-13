# PDF Preview Implementation Guide

## Requirement Summary

- ✅ **Preview**: Show PDF version in browser
- ✅ **Download**: Download original file (DOCX, XLSX, PPTX)
- ✅ **Original**: Keep original file unchanged
- ✅ **Storage**: Both original and PDF stored separately

## System Architecture

```
Upload: DOCX, XLSX, PPTX
   ↓
   ├─→ Store Original: /uploads/[documentId].docx
   └─→ Queue PDF Conversion (async)
       ↓
       Convert to PDF
       ↓
       Store PDF: /uploads/[documentId].pdf
       ↓
       Update database: pdf_path = "/uploads/[documentId].pdf"

Preview Request:
   ↓
   Check: Is PDF available? (pdf_path != null)
   ├─→ YES: Serve PDF (inline) → Browser displays
   └─→ NO: Serve original (with MIME type)

Download Request:
   ↓
   Always serve original file
   ↓
   Browser downloads with original filename
```

## Implementation Steps

### Step 1: Set Up CloudConvert (Recommended for Cloud)

CloudConvert is the easiest solution - no local installation needed.

```bash
# 1. Go to https://cloudconvert.com
# 2. Sign up for free account
# 3. Get API key from https://cloudconvert.com/user/settings/api
# 4. Add to .env.local:

CLOUDCONVERT_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Step 2: Verify PDF Conversion Code

The system is already set up to convert files. Check these files are in place:

1. **lib/services/pdf-conversion.service.ts**
   - ✅ Already has CloudConvert conversion method
   - ✅ Already has LibreOffice fallback
   - ✅ Already has `getPreviewFile()` method

2. **lib/services/document.service.ts**
   - ✅ Already queues PDF conversion after upload (line 81-122)
   - ✅ Runs asynchronously (doesn't block upload)
   - ✅ Updates database with pdf_path when complete

3. **app/api/documents/[id]/preview/route.ts**
   - ✅ Already uses `PDFConversionService.getPreviewFile()`
   - ✅ Already serves with `inline` header
   - ✅ Falls back to original if PDF not available

4. **app/api/documents/[id]/download/route.ts**
   - ✅ Already serves original file only
   - ✅ Already uses `attachment` header

### Step 3: Test PDF Conversion

#### Test 1: Upload Office File
```
1. Go to http://localhost:3000/file-management
2. Click Upload
3. Select DOCX, XLSX, or PPTX file
4. Fill in details
5. Click Upload
6. ✅ File should upload successfully
7. Check database for pdf_path (may be null initially, filled after conversion)
```

#### Test 2: Check Conversion Status
```
Monitor server logs for:
[DocumentService] Queuing PDF conversion for: ...
[PDFConversion] Converting with CloudConvert: ...
[DocumentService] PDF conversion successful: ...
```

#### Test 3: Preview with PDF
```
1. After conversion completes, click Preview (👁️)
2. PDF should open in browser
3. ✅ Original DOCX/XLSX/PPTX not modified
```

#### Test 4: Download Original
```
1. Click Download (⬇️)
2. Original file should download
3. Open in Microsoft Office
4. ✅ Original format preserved
```

## Alternative: LocalLibreOffice (For Self-Hosted)

If you prefer local conversion without cloud dependency:

```bash
# 1. Install LibreOffice
# Windows: Download from https://www.libreoffice.org/download/
# macOS: brew install libreoffice
# Linux: apt-get install libreoffice

# 2. Install Node wrapper
npm install libreoffice-convert

# 3. Enable in code
# Set environment variable:
LIBREOFFICE_ENABLED=true
```

The code already supports this - it will automatically fall back to LibreOffice if CloudConvert isn't available.

## File Flow Detailed

### Upload Phase
```typescript
// User uploads: MyReport.docx

1. FileStorageService.saveFile()
   → Saves to: /public/uploads/[documentId].docx

2. DocumentService.createDocument()
   → filePath = "/uploads/[documentId].docx"
   → Saves to database
   → Queues PDF conversion

3. PDFConversionService.convertToPDF() [async]
   → Reads from: /public/uploads/[documentId].docx
   → Converts using CloudConvert API
   → Saves to: /public/uploads/[documentId].pdf
   → Updates database: pdf_path = "/uploads/[documentId].pdf"
```

### Preview Request
```typescript
// User clicks Preview (👁️)

1. Preview endpoint called
2. Gets latest version from database
3. Calls PDFConversionService.getPreviewFile()
   → Checks: if (pdfPath) → returns PDF path
   → Else: returns original file path
4. Reads file from disk
5. Serves with Content-Disposition: inline
   → Browser displays PDF ✅
```

### Download Request
```typescript
// User clicks Download (⬇️)

1. Download endpoint called
2. Gets latest version from database
3. Uses: currentVersion.filePath (original only)
4. Reads file from disk
5. Serves with Content-Disposition: attachment
   → Browser downloads original (.docx) ✅
```

## Database Schema

### document_versions table

```sql
| Column  | Type | Purpose |
|---------|------|---------|
| file_path | TEXT | Original file: /uploads/[id].docx |
| pdf_path | TEXT | Converted PDF: /uploads/[id].pdf (nullable) |
```

### Migration Already Applied
- ✅ `pdf_path` column created via `/api/admin/add-pdf-path-column`
- ✅ Column is nullable (PDF conversion is optional)

## Current Status

### Working
- ✅ Original file upload and storage
- ✅ PDF conversion code ready
- ✅ Preview displays correct file
- ✅ Download uses original
- ✅ Database structure ready

### Configuration Needed
- ⚠️ CloudConvert API key (optional if using LibreOffice)

## Example: Complete Flow

```
1. User uploads: "BRD for Fraud Management.docx"
   → Stored: /public/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.docx
   → Database: file_path = "/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.docx"
   → Database: pdf_path = null (initially)

2. Async: PDF conversion runs
   → Converts using CloudConvert API
   → Stored: /public/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.pdf
   → Database: pdf_path = "/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.pdf"

3. User clicks Preview (after PDF ready):
   → Preview endpoint calls getPreviewFile()
   → Returns: pdf_path = "/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.pdf"
   → Serves PDF with inline header
   → Browser displays PDF ✅

4. User clicks Download:
   → Download endpoint calls getDocument()
   → Returns: file_path = "/uploads/0d07641c-c979-47d7-b290-5a9f630649c3.docx"
   → Serves original DOCX
   → Browser downloads: "BRD for Fraud Management.docx" ✅

5. User opens downloaded file in Word ✅
   → Original format, no changes ✅
```

## Troubleshooting

### Issue: PDF not showing in preview
**Check:**
1. Is `pdf_path` NULL in database? 
   → Conversion hasn't completed yet (it's async)
2. Is PDF file on disk?
   → Check `/public/uploads/[documentId].pdf`
3. CloudConvert error?
   → Check server logs for conversion errors
   → Verify API key is set

### Issue: Conversion not happening
**Check:**
1. Is CloudConvert API key set?
   ```bash
   echo $CLOUDCONVERT_API_KEY
   ```
2. Is file type supported?
   → Must be: docx, doc, xlsx, xls, pptx, ppt
3. Check server logs:
   ```
   [DocumentService] Queuing PDF conversion for: ...
   [PDFConversion] Converting with CloudConvert: ...
   ```

### Issue: Download shows PDF instead of DOCX
**Fix:**
- This shouldn't happen - download endpoint always uses `file_path`
- Check database: ensure `file_path` is not the PDF path
- Check download endpoint code for bugs

## Security Considerations

✅ **Implemented:**
- Original file never modified
- PDF stored separately (not replacing original)
- Both files have same document ID (traceable)
- Audit logs track all conversions
- Permission checks on preview/download

✅ **Best Practices:**
- Use strong API key for CloudConvert
- Store API key in environment only
- Don't expose API key in logs or error messages

## Performance Notes

- **Upload**: Not blocked by conversion (async)
- **Preview First Time**: May take 2-30 seconds (first conversion)
- **Preview Later**: Instant (PDF cached)
- **Download**: Instant (original already on disk)

## Production Checklist

- ✅ System code ready
- ✅ Database structure ready
- ✅ CloudConvert API key needed (if using cloud)
- ⚠️ Test with sample Office files before going live
- ⚠️ Monitor disk space (stores both original + PDF)

## Summary

The system is **ready for PDF conversion**. Just add CloudConvert API key to `.env.local`:

```
CLOUDCONVERT_API_KEY=your_api_key_here
```

Everything else is already implemented:
- ✅ Conversion queued after upload
- ✅ PDF stored separately
- ✅ Preview uses PDF
- ✅ Download uses original
- ✅ Original file never modified

**Next Step:** Add CloudConvert API key and test!
