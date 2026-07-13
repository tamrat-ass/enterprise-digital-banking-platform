# Upload & Preview Recovery Guide

## Current Situation

You're getting a 404 when trying to preview a document. This typically means:
- The document ID doesn't exist in the database, OR
- The document was deleted, OR
- The upload failed silently

---

## Step 1: Check What Documents Actually Exist

### Open This URL:
```
http://localhost:3000/api/admin/test-upload
```

### You'll See:
```json
{
  "success": true,
  "summary": {
    "totalDocuments": 5,
    "documentsWithFilePath": 3,
    "documentsWithoutFilePath": 2
  },
  "documents": [
    {
      "document": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Test Document",
        "departmentId": "...",
        "divisionId": "...",
        "createdAt": "2026-07-07T12:00:00.000Z"
      },
      "versions": [...],
      "status": "✅ HAS FILE_PATH"
    }
  ]
}
```

### Document Interpretation:
- **totalDocuments:** How many documents are in your database
- **documentsWithFilePath:** Have files attached and can be previewed
- **documentsWithoutFilePath:** Metadata only, no actual file

---

## Step 2: Identify the Problem

### If `totalDocuments: 0`
→ **No documents exist** - You need to upload files

### If you see documents but the ID you wanted is missing
→ **That document was never created** - Use an ID from the list instead

### If a document shows `❌ NO FILE_PATH (NULL)`
→ **File wasn't saved** - Upload process failed partially

---

## Step 3: Quick Fix - Use Existing Document

1. **Copy a document ID** that shows `✅ HAS FILE_PATH`
   - From the `/api/admin/test-upload` response
   - Example: `550e8400-e29b-41d4-a716-446655440000`

2. **Try preview with that ID:**
   ```
   http://localhost:3000/api/documents/550e8400-e29b-41d4-a716-446655440000/preview
   ```

3. **It should work!** If it does, the system is functioning.

---

## Step 4: Upload a Fresh Test File

If no documents exist or you want a clean test:

### A) Go to upload page:
```
http://localhost:3000/upload
```

### B) Create a test file (test.txt):
```
This is a test file for the upload system.
It should be successfully uploaded and retrievable.
```

### C) Upload with this form data:
- **Title:** "Test Document"
- **Category:** (select any)
- **Department:** (select any)
- **Division:** (select any or leave blank)

### D) You should see:
```
✅ Successfully uploaded 1 file(s)
```

### E) Check server logs for:
```
[POST Documents] Request started
[DocumentService] Creating document: {
  "title": "Test Document",
  ...
}
[FileStorageService] File written successfully: ...
[DocumentService] File saved successfully at: /uploads/[UUID].txt
[DocumentService] About to insert document_version with: {
  "filePath": "/uploads/[UUID].txt",
  "filePathIsNull": false
}
[DocumentService] Document version inserted successfully with filePath: /uploads/[UUID].txt
```

---

## Step 5: Verify Upload Worked

### Check admin endpoint again:
```
http://localhost:3000/api/admin/test-upload
```

### You should see:
- `totalDocuments` increased by 1
- Your new document with `✅ HAS FILE_PATH`
- New document ID to use for preview

---

## Step 6: Try Preview with New Document

1. **Copy the new document ID** from test-upload response

2. **Try preview:**
   ```
   http://localhost:3000/api/documents/[NEW_ID]/preview
   ```

3. **Should show:** Your test file content

---

## If Upload Fails

### Check Terminal Logs

Look for ERROR messages with these prefixes:
- `[DocumentService]` - Document creation errors
- `[FileStorageService]` - File saving errors
- `[FileUploadForm]` - Frontend submission errors
- `[POST Documents]` - API route errors

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `FileStorageService returned null filePath` | File write failed | Check disk space, permissions |
| `ENOENT: no such file or directory, open` | uploads/ folder missing | Create `public/uploads/` |
| `EACCES: permission denied` | Can't write to folder | Fix folder permissions: `chmod 755` |
| `File save failed` | Generic error | Check disk/permissions |
| `Database insert failed` | DB permission issue | Check database credentials |

---

## Troubleshooting Checklist

- [ ] Verify `public/uploads/` directory exists
- [ ] Check directory is writable: `ls -la public/ | grep uploads`
- [ ] Try uploading a simple text file first
- [ ] Check server logs for all errors
- [ ] Verify database connection works
- [ ] Check `.env.local` database credentials
- [ ] Try uploading to a different category
- [ ] Restart dev server and try again

---

## File Upload Flow (What Should Happen)

```
1. User submits form on /upload
   ↓
2. FileUploadForm creates FormData with:
   - file (from file input)
   - title, category, department, division (form fields)
   ↓
3. POST /api/documents receives request
   ↓
4. Extract file and convert to ArrayBuffer
   ↓
5. Call DocumentService.createDocument()
   ↓
6. Call FileStorageService.saveFile()
   ↓
7. Write file to: public/uploads/[documentId].extension
   ↓
8. Return path: /uploads/[documentId].extension
   ↓
9. Insert document_versions row with filePath
   ↓
10. Frontend shows ✅ success
   ↓
11. Document visible in file-management
```

If any step fails, you'll get an error or silent failure.

---

## Terminal Output Interpretation

### ✅ Good Upload
```
[POST Documents] Request started
[POST Documents] FormData received: { fileExists: true, fileName: "test.txt", ... }
[DocumentService] Creating document: { title: "Test Document" ... }
[DocumentService] Saving file for document: { fileName: "test.txt", ... }
[FileStorageService] File written successfully: D:\...\public\uploads\[UUID].txt
[DocumentService] File saved successfully at: /uploads/[UUID].txt
[DocumentService] Verification - data in database: { filePath: "/uploads/[UUID].txt", filePathIsNull: false }
[POST Documents] Document created successfully: { id: "[UUID]", filePath: "/uploads/[UUID].txt", filePathIsNull: false }
```

**Key indicators:** `filePathIsNull: false` and "File written successfully"

### ❌ Failed Upload - No File
```
[POST Documents] FormData received: { fileExists: false, ... }
[DocumentService] No file content provided { hasContent: false, hasFileName: false }
[POST Documents] Document created: { id: "[UUID]", filePath: null }
```

**Problem:** No file was provided

### ❌ Failed Upload - File Write Error
```
[FileStorageService] About to write file: { filePath: "D:\...\public\uploads\[UUID].txt" ... }
[FileStorageService] Failed to save file: { error: "ENOENT: no such file..." }
[DocumentService] Failed to save file: { error: "File save failed: ENOENT..." }
```

**Problem:** Directory doesn't exist or file write failed

---

## Quick Diagnostic Commands

### Check if uploads directory exists:
```bash
# Windows:
dir public\uploads\

# Mac/Linux:
ls -la public/uploads/
```

If not found, create it:
```bash
# Windows:
mkdir public\uploads

# Mac/Linux:
mkdir -p public/uploads
```

### Check if files were actually saved:
```bash
# Windows:
dir public\uploads\* /S

# Mac/Linux:
ls -la public/uploads/
```

### Check database for documents:
```sql
SELECT id, title, status, created_at FROM documents LIMIT 10;
```

### Check database for file paths:
```sql
SELECT document_id, file_name, file_path, file_path IS NULL as "missing_file" 
FROM document_versions 
LIMIT 10;
```

---

## Recovery Process

If you're stuck:

### Option 1: Clean Start
```bash
# 1. Clear all documents
curl -X POST http://localhost:3000/api/admin/test-upload \
  -H "Content-Type: application/json" \
  -d '{"action":"clear-all"}'

# 2. Restart server
npm run dev

# 3. Upload fresh test file
# (follow Step 4 above)

# 4. Check status
curl http://localhost:3000/api/admin/test-upload
```

### Option 2: Check Database Directly
```bash
# Connect to your database with SQL client

# See all documents:
SELECT * FROM documents ORDER BY created_at DESC LIMIT 10;

# See all versions:
SELECT * FROM document_versions ORDER BY created_at DESC LIMIT 10;

# See which have file paths:
SELECT dv.document_id, dv.file_path, dv.file_path IS NULL as "no_file"
FROM document_versions dv
ORDER BY dv.created_at DESC
LIMIT 10;
```

---

## Success Criteria

You'll know it's working when:

1. ✅ Upload succeeds with green message
2. ✅ Server logs show `filePathIsNull: false`
3. ✅ Document appears in file-management
4. ✅ Preview shows file content
5. ✅ Download downloads the file
6. ✅ `/api/admin/test-upload` shows `✅ HAS FILE_PATH`

If all 6 are true → **System is working!** 🎉

---

## Next Steps

1. **Now:** Open `/api/admin/test-upload` to see current status
2. **Then:** Try previewing a document that shows `✅ HAS FILE_PATH`
3. **If works:** System is functional, issue was with that specific ID
4. **If fails:** Follow troubleshooting steps above
5. **If no documents:** Follow "Upload a Fresh Test File" section

---

## Questions to Ask Yourself

1. **Did the upload show a success message?**
   - Yes → Check `/api/admin/test-upload` for the document
   - No → Check terminal logs for error

2. **Does the document show in `/api/admin/test-upload`?**
   - Yes, with `✅ HAS FILE_PATH` → Should be able to preview
   - Yes, with `❌ NO FILE_PATH` → File save failed (see logs)
   - No → Upload didn't create the document

3. **What's in the server terminal?**
   - Error messages? → Fix that error
   - No errors but upload claimed success? → Check database directly
   - Everything looks good? → File might be on disk but DB has NULL path

---

**TL;DR:** Visit `/api/admin/test-upload` to see real documents that exist. Use one of those IDs for preview. If none exist, upload a new file following Step 4.
