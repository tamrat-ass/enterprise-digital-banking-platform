# PDF Conversion Setup Guide

The document management system now supports converting Office files (DOCX, PPTX, XLSX) to PDF for consistent browser previews.

## Architecture

```
Upload Office File (DOCX, PPTX, XLSX)
    ↓
Save Original File (unchanged)
    ↓
Queue PDF Conversion (async, non-blocking)
    ↓
Convert to PDF (if conversion method available)
    ↓
Save Preview PDF
    ↓
Database:
  - file_path: /uploads/[UUID].docx (original, always available)
  - pdf_path: /uploads/[UUID].pdf (preview, optional)
    ↓
Preview Endpoint (/api/documents/[id]/preview):
  - If pdf_path exists: Show PDF (all browsers support)
  - If pdf_path null: Show original file (fallback)
    ↓
Download Endpoint (/api/documents/[id]/download):
  - Always download original file (DOCX, not PDF)
```

## How It Works

### Upload Flow (No Changes Required)
1. User uploads DOCX, PPTX, or XLSX file
2. File is saved immediately to `/public/uploads/[UUID].[ext]`
3. Database record created with `file_path` and `pdf_path: null`
4. **Upload completes immediately** ✅
5. **In background**: PDF conversion queues asynchronously
6. **When ready**: PDF saved to `/public/uploads/[UUID].pdf`
7. **Database updated**: `pdf_path` field populated

### Preview Flow
1. User clicks "Preview" on a document
2. Endpoint checks if `pdf_path` exists
3. **If PDF available**: Returns PDF (works in all browsers)
4. **If PDF not yet available**: Returns original file
5. **If neither available**: Returns document metadata as text

### Download Flow
1. User clicks "Download"
2. **Always returns original file** (DOCX, not PDF)
3. User gets the exact file they uploaded

## Setup Options

### Option A: CloudConvert API (Recommended for Cloud/Managed)

**Best for:** Cloud deployments, no server maintenance, reliable

**Steps:**

1. Sign up at [CloudConvert](https://cloudconvert.com) (free tier available)
2. Get your API key from settings
3. Add to `.env.local`:
   ```
   CLOUDCONVERT_API_KEY=your_api_key_here
   CLOUDCONVERT_ENABLED=true
   ```
4. The system will use CloudConvert automatically

**Cost:** Free tier includes conversions, paid plans for higher volume

### Option B: LibreOffice (Recommended for Self-Hosted)

**Best for:** Self-hosted, on-premise, no external API calls

**Steps:**

1. **Install LibreOffice**
   - **Windows**: Download from [https://www.libreoffice.org/download/](https://www.libreoffice.org/download/)
   - **macOS**: `brew install libreoffice`
   - **Linux**: `apt-get install libreoffice`

2. **Install Node Wrapper**
   ```bash
   npm install libreoffice-convert
   ```

3. The system will use LibreOffice automatically when available

**Cost:** Free and open source

### Option C: Using Both (Fallback Chain)

The system automatically tries conversions in this order:

1. **CloudConvert API** (if configured and API key set)
2. **LibreOffice** (if installed locally)
3. **Fallback to original file** (if neither available)

This means you can:
- Start with LibreOffice while testing locally
- Scale to CloudConvert in production
- Or use LibreOffice in production for self-hosted setup

## File Preparation

The migration endpoint has been created to add the `pdf_path` column if needed:

```
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

## Testing PDF Conversion

### 1. Test Upload with Office File

Upload a DOCX, PPTX, or XLSX file:
- Title: "Test Office File"
- Department: Select any
- Division: Select any
- Category: Select any

Upload should complete **immediately** ✅

### 2. Check Server Logs

In terminal where `npm run dev` is running, you should see:

```
[DocumentService] Queuing PDF conversion for: Report.docx
[PDFConversion] Starting conversion: { fileName: 'Report.docx', extension: 'docx', documentId: '...' }
```

### 3. Preview the Document

- Navigate to File Management
- Click "Preview" on the uploaded file
- **If PDF available**: You'll see a PDF
- **If conversion not enabled**: You'll see the original Office file

### 4. Verify Database

Check that `pdf_path` is populated:

```sql
SELECT id, file_name, file_path, pdf_path 
FROM document_versions 
WHERE file_name LIKE '%.docx' OR file_name LIKE '%.pptx' OR file_name LIKE '%.xlsx'
LIMIT 5;
```

If `pdf_path` is `NULL`, conversion hasn't happened yet (may not be enabled).

## Configuration

### Environment Variables

```bash
# Required for CloudConvert
CLOUDCONVERT_API_KEY=your_api_key_here
CLOUDCONVERT_ENABLED=true

# Optional - conversion timeout in milliseconds (default: 30000)
PDF_CONVERSION_TIMEOUT=30000
```

### Conversion Timeout

Default is 30 seconds. Adjust if needed:
- Shorter timeout: Fail faster if service unavailable
- Longer timeout: Allow more time for large files

```bash
# 60 second timeout
PDF_CONVERSION_TIMEOUT=60000
```

## Monitoring

### Check Conversion Status

View the server logs during upload:

```
[PDFConversion] Starting conversion: { fileName: 'Report.docx', ... }
[PDFConversion] CloudConvert conversion complete: /uploads/[UUID].pdf
```

Or with LibreOffice:

```
[PDFConversion] Attempting LibreOffice conversion: { fileName: 'Report.docx', ... }
[PDFConversion] LibreOffice conversion complete: /uploads/[UUID].pdf
[DocumentService] Document updated with PDF path: /uploads/[UUID].pdf
```

### Troubleshooting

**Symptom**: PDF conversion not happening

**Check**:
1. Is CloudConvert configured? Check `.env.local` for `CLOUDCONVERT_API_KEY`
2. Is LibreOffice installed? Try: `libreoffice --version` in terminal
3. Check server logs for errors during upload

**Solution**:
- Install LibreOffice, OR
- Set up CloudConvert API key, OR
- Upload smaller test files to check if it's a timeout issue

## Performance Considerations

### Upload Performance
- Upload completes immediately ✅
- PDF conversion happens in background
- No impact on user experience

### Storage Requirements
- Original file: Always stored
- PDF file: Stored only if conversion enabled
- Typical overhead:
  - DOCX (50 KB) → PDF (200 KB)
  - PPTX (500 KB) → PDF (2-5 MB)
  - XLSX (100 KB) → PDF (300 KB)

### Preview Performance
- First preview: Returns original file while PDF converts
- Subsequent previews: Returns PDF (much faster, browser cached)

## Fallback Behavior

If conversion is not available, the system gracefully falls back:

1. **Preview**: Shows original Office file (if supported by browser)
2. **Original file**: Always available for download
3. **No errors**: User can still work with documents

This ensures the system works even without PDF conversion configured.

## Enterprise Features

### ✅ Implemented
- Async conversion (non-blocking uploads)
- Automatic retry with fallback
- Environment-based configuration
- Graceful degradation
- Comprehensive logging
- Database migration endpoint

### ✅ Database Schema
- `pdfPath` column added to `documentVersions` table
- Stores path to converted PDF
- Optional (can be NULL if conversion not available)

## Next Steps

1. **Choose your conversion method**:
   - CloudConvert (cloud) or LibreOffice (self-hosted)

2. **Install if needed**:
   - ```bash
     npm install libreoffice-convert  # For LibreOffice
     ```
   - Or set `CLOUDCONVERT_API_KEY` in `.env.local`

3. **Test with an Office file**:
   - Upload DOCX, PPTX, or XLSX
   - Check server logs
   - Preview should show PDF or original

4. **Monitor in production**:
   - Watch server logs for conversion errors
   - Check disk space for stored PDFs
   - Monitor conversion service health

## Support

### For LibreOffice Issues
- See: https://www.libreoffice.org/support/
- Node wrapper: https://www.npmjs.com/package/libreoffice-convert

### For CloudConvert Issues
- API docs: https://cloudconvert.com/api
- Support: https://cloudconvert.com/contact

### For Application Issues
- Check server logs in terminal where `npm run dev` runs
- Look for `[PDFConversion]` and `[DocumentService]` log lines
- Verify file system permissions in `/public/uploads/` directory

## FAQ

**Q: Does PDF conversion slow down uploads?**
A: No - conversion happens asynchronously in the background. Upload completes immediately.

**Q: What if conversion fails?**
A: The original file is still available for preview and download. Users won't see any errors.

**Q: Do I need both CloudConvert and LibreOffice?**
A: No - use whichever works best for your setup. The system tries both in order.

**Q: How much does CloudConvert cost?**
A: Free tier available for testing. Paid plans start with generous quotas. See [CloudConvert pricing](https://cloudconvert.com/pricing).

**Q: Can I use a different conversion service?**
A: Yes - the architecture supports adding new services. See `lib/services/pdf-conversion.service.ts` for the pattern.

