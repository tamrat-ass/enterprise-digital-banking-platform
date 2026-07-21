# 🔧 Troubleshooting Guide: File Preview Not Working

**Last Updated**: July 13, 2026  
**Status**: Diagnostic Guide for Preview Issues  

---

## Symptom: Word File Downloads Instead of Preview

When clicking Preview on a Word (.docx) file, you see:
- ❌ File automatically downloads instead of displaying in browser
- ❌ Downloaded file is the original .docx (correct), but preview still not showing
- ❌ No PDF is created or displayed

### Root Cause Analysis

The issue occurs in this sequence:

1. **File Upload** → Stored at `/uploads/[documentId].docx` ✅
2. **Preview Request** → Calls `/api/documents/[id]/preview` ✅
3. **PDF Conversion Check** → Checks if `pdfPath` exists in database
   - First time: `pdfPath` is `null` ❌
4. **On-the-fly Conversion** → Tries to convert using CloudConvert
   - **THIS IS WHERE IT FAILS** 🚨

---

## Diagnosis Steps

### Step 1: Check CloudConvert API Key

Verify the API key is correctly configured:

```bash
# Check .env.local
cat .env.local | grep CLOUDCONVERT_API_KEY
```

**Expected Output**:
```
CLOUDCONVERT_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIn...
```

✅ If key exists and starts with `eyJ0eXA...` (JWT format), it's configured.  
❌ If key is empty or missing, the conversion won't work.

### Step 2: Test CloudConvert API Directly

Test if the API key is valid by calling CloudConvert:

```bash
# Replace YOUR_API_KEY with the actual key from .env.local
$apiKey = "YOUR_API_KEY_HERE"
$headers = @{
    "Authorization" = "Bearer $apiKey"
}

Invoke-RestMethod -Uri "https://api.cloudconvert.com/v2/account" -Headers $headers
```

**Expected Response**:
```json
{
  "data": {
    "id": "...",
    "email": "...",
    "plan": "..."
  }
}
```

✅ If you get account data, the API key is valid.  
❌ If you get "Unauthorized" error, the API key is expired or invalid.

### Step 3: Check Browser Console for Errors

1. Open browser **DevTools** (F12 or Cmd+Shift+I)
2. Go to **Network** tab
3. Click Preview button
4. Look for request to `/api/documents/[id]/preview`
5. Check the **Response** tab

**Expected**:
- Status: `200`
- Content-Type: `application/pdf`
- Response shows PDF binary data

**If you see errors**:
- Status: `200` but Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  → Conversion failed, serving original file
- Status: `500`
  → Server error, check server console logs

### Step 4: Check Server Console Logs

Watch the terminal where you ran `npm run dev` for these logs:

```
[Preview] Request for document: abc123...
[Preview] Document found: { id: 'abc123', title: 'My Document' }
[Preview] File check: { extension: 'docx', needsConversion: true, hasPdfPath: false }
[Preview] No PDF found, attempting on-the-fly conversion...
[PDFConversion] Creating CloudConvert task...
[PDFConversion] Task created, ID: task123...
[PDFConversion] Uploading file to task...
[PDFConversion] File uploaded successfully
[PDFConversion] Waiting for conversion to complete...
[PDFConversion] Task status: { taskId: 'task123', status: 'finished', attempt: 1 }
[PDFConversion] Task finished
[PDFConversion] Downloading converted PDF...
[PDFConversion] CloudConvert conversion successful: /uploads/abc123.pdf
[Preview] On-the-fly conversion successful: /uploads/abc123.pdf
[Preview] File loaded successfully, size: 50000 bytes
```

---

## Common Issues and Fixes

### ❌ Issue 1: API Key Invalid or Expired

**Symptom**:
```
[PDFConversion] CloudConvert error: Unauthorized
```

**Fix**:
1. Go to https://cloudconvert.com/dashboard/api/keys
2. Generate a new API key
3. Update `.env.local`:
   ```
   CLOUDCONVERT_API_KEY=new_key_here
   ```
4. Restart dev server: `npm run dev`

---

### ❌ Issue 2: API Key Not Configured

**Symptom**:
```
[PDFConversion] CloudConvert API key not configured
```

**Fix**:
1. Check `.env.local` exists
2. Add line: `CLOUDCONVERT_API_KEY=your_api_key`
3. Restart dev server

---

### ❌ Issue 3: File Upload Fails

**Symptom**:
```
[PDFConversion] Upload failed: 400 Bad Request
```

**Possible Causes**:
- File is corrupted
- File is too large (CloudConvert has size limits)
- File format not supported

**Fix**:
1. Try with a different .docx file
2. Create a fresh Word document and try again
3. Check file size - keep under 50MB

---

### ❌ Issue 4: Conversion Timeout

**Symptom**:
```
[PDFConversion] Conversion timeout after 20 attempts
```

**Cause**: CloudConvert taking too long to convert  
**Fix**:
1. Try with a smaller/simpler Word file
2. Check CloudConvert service status: https://status.cloudconvert.com
3. Increase timeout in `pdf-conversion.service.ts` (line with `maxAttempts = 20`)

---

### ❌ Issue 5: File Path Issues

**Symptom**:
```
[FileStorageService] File not found at: D:\...\public\uploads\...
```

**Cause**: File wasn't saved correctly or path is wrong  
**Fix**:
1. Check if file exists: `ls public/uploads/`
2. Check database for correct file path:
   ```sql
   SELECT id, file_name, file_path, pdf_path FROM document_versions LIMIT 5;
   ```

---

## Testing Checklist

Use this to systematically test the feature:

```
Setup:
[ ] Dev server running: npm run dev
[ ] CloudConvert API key configured in .env.local
[ ] Database is running and accessible
[ ] Browser DevTools open (F12)

Test File Upload:
[ ] Create or download test Word file
[ ] Navigate to /upload page
[ ] Upload file successfully
[ ] File appears in documents list

Test Preview:
[ ] Click Preview button
[ ] Check browser Network tab - request succeeds (200)
[ ] Check server console for [Preview] and [PDFConversion] logs
[ ] If PDF shows: ✅ SUCCESS
[ ] If Word file downloads: ❌ Conversion failed

Debug Conversion Failure:
[ ] Check [PDFConversion] logs for error message
[ ] Verify API key is valid (test with curl)
[ ] Try different Word file (may be file corruption)
[ ] Check CloudConvert status page for outages

Test Caching (Second Preview):
[ ] Click Preview again for same document
[ ] Should load instantly (no conversion)
[ ] Check database: pdf_path should be populated
[ ] Check server console: should say "Using existing PDF"

Test Download:
[ ] Click Download button
[ ] Should download original .docx file
[ ] Downloaded file should open in Word
```

---

## Advanced Debugging

### Enable Verbose Logging

Add more detailed logging to `pdf-conversion.service.ts`:

```typescript
// In convertToPDFCloudConvert method, after step 2 upload:
console.log('[PDFConversion] Upload response status:', uploadResponse.status)
console.log('[PDFConversion] Upload response headers:', Object.fromEntries(uploadResponse.headers))
const uploadResponseText = await uploadResponse.text()
console.log('[PDFConversion] Upload response body:', uploadResponseText)
```

### Test CloudConvert API Manually

Create a test script `test-cloudconvert.js`:

```javascript
const apiKey = process.env.CLOUDCONVERT_API_KEY
const fs = require('fs/promises')

async function testConversion() {
  // Create task
  const taskRes = await fetch('https://api.cloudconvert.com/v2/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        'import-file': { operation: 'import/upload' },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          input_format: 'docx',
          output_format: 'pdf',
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file',
        },
      },
    }),
  })
  
  const taskData = await taskRes.json()
  console.log('Task created:', taskData.data?.id)
  
  // Continue with upload and conversion...
}

testConversion()
```

Run with:
```bash
node test-cloudconvert.js
```

---

## Performance Considerations

### Expected Timing

- **First Preview (with conversion)**: 10-30 seconds
  - CloudConvert API: ~5-20 seconds
  - Network latency: ~2-5 seconds
  - Disk I/O: ~1-2 seconds

- **Second Preview (cached)**: <1 second
  - Direct disk read from cached PDF

### Optimization Tips

1. **Use CloudConvert Pro** for faster conversion (~5s)
2. **Pre-convert on upload** instead of on-demand:
   - Move async conversion to synchronous in upload flow
   - Wait for conversion before marking upload complete
3. **Cache PDFs longer** - change `Cache-Control` header
4. **Use CDN** for static PDF files

---

## When to Seek Help

Create a bug report if:

1. ✅ CloudConvert API key is valid (tested with curl)
2. ✅ Smaller test files fail (rules out file-specific issues)
3. ✅ Server console shows clear error message
4. ✅ Issue persists after restart

**Include in bug report**:
- Full server console log output
- Network tab screenshot
- File that reproduces issue
- Steps to reproduce
- Expected vs actual behavior

---

## Resolution Flowchart

```
User clicks Preview
    ↓
Is file a Word/Office file?
    ├─ NO → Serve original file or PDF as-is ✅
    └─ YES → Check if PDF exists
         ├─ YES → Serve cached PDF ✅
         └─ NO → Start on-the-fly conversion
              ├─ CloudConvert API key configured?
              │   ├─ NO → Log error, serve original file
              │   └─ YES → Create conversion task
              ├─ Task created successfully?
              │   ├─ NO → Log error, serve original file
              │   └─ YES → Upload file to task
              ├─ File uploaded?
              │   ├─ NO → Log error, serve original file
              │   └─ YES → Wait for conversion (20 sec timeout)
              ├─ Conversion finished?
              │   ├─ NO → Timeout, serve original file
              │   └─ YES → Download PDF
              ├─ PDF downloaded?
              │   ├─ NO → Log error, serve original file
              │   └─ YES → Save to disk, update database
              └─ Serve PDF to browser ✅
```

---

## Related Files

- **Preview Route**: `app/api/documents/[id]/preview/route.ts`
- **Conversion Service**: `lib/services/pdf-conversion.service.ts`
- **Config**: `.env.local` (CLOUDCONVERT_API_KEY)
- **Database**: `lib/db/schema.ts` (pdf_path column)

---

## Next Steps

After troubleshooting:

1. ✅ If preview works → Run full test suite in `START_TESTING_NOW.md`
2. ❌ If preview fails → Document error and open issue with logs

Good luck! 🚀
