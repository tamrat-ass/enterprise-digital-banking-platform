# Preview Not Working - Diagnostic Guide

## The Problem
When trying to preview a document, you see:
```
"This document does not have a file attached. Please re-upload the document."
```

## Root Cause
The `file_path` column in `document_versions` table is **NULL** instead of containing `/uploads/[uuid].[extension]`.

---

## Why This Happens

The preview flow requires:
```
1. Upload file
   ↓
2. Save file to disk → GET file path (/uploads/uuid.pdf)
   ↓
3. Save file path to database (document_versions.file_path)
   ↓
4. When preview clicked, query database
   ↓
5. Find file_path
   ↓
6. Load file from disk
   ↓
7. Display preview
```

If step 3 is **skipped or fails**, `file_path` stays **NULL** and preview fails.

---

## Step 1: Check the Database

### Query to Run
```sql
SELECT 
  d.id,
  d.title,
  dv.file_path,
  dv.file_name,
  CASE 
    WHEN dv.file_path IS NULL THEN 'NO FILE PATH ❌'
    ELSE 'HAS FILE PATH ✅'
  END as status
FROM documents d
LEFT JOIN document_versions dv ON d.id = dv.document_id
ORDER BY d.created_at DESC
LIMIT 10;
```

### Expected Results

**GOOD (File preview should work)**:
```
id                                  | title           | file_path                      | status
550e8400-e29b-41d4-a716-446655440000 | Policy          | /uploads/550e8400-e29b-41d4.pdf | HAS FILE PATH ✅
6ba7b810-9dad-11d1-80b4-00c04fd430c0 | Budget          | /uploads/6ba7b810-9dad-11d1.xlsx | HAS FILE PATH ✅
```

**BAD (File preview will fail)**:
```
id                                  | title           | file_path | status
550e8400-e29b-41d4-a716-446655440000 | Policy          | NULL      | NO FILE PATH ❌
6ba7b810-9dad-11d1-80b4-00c04fd430c0 | Budget          | NULL      | NO FILE PATH ❌
```

If your result shows **NULL**, the problem is confirmed: **file_path is not being saved**.

---

## Step 2: Check Server Logs

When you click preview, check the server logs for:

### Good Logs
```
[DocumentService] Creating document with: {
  title: 'Policy Document',
  fileName: 'policy.pdf',
  ...
}
[DocumentService] Saving file for document: {
  documentId: '550e8400-...',
  fileName: 'policy.pdf',
  contentSize: 2621440
}
[DocumentService] File saved successfully at: /uploads/550e8400-e29b-41d4.pdf
[DocumentService] About to insert document_version with: {
  filePath: '/uploads/550e8400-e29b-41d4.pdf',
  filePathIsNull: false
}
[DocumentService] Document version inserted successfully with filePath: /uploads/550e8400-e29b-41d4.pdf

[Preview] Latest version details: {
  filePath: '/uploads/550e8400-e29b-41d4.pdf',
  filePathIsNull: false
}
```

### Bad Logs (File Path is NULL)
```
[DocumentService] File saved successfully at: /uploads/550e8400-e29b-41d4.pdf
[DocumentService] About to insert document_version with: {
  filePath: '/uploads/550e8400-e29b-41d4.pdf',
  filePathIsNull: false
}
[DocumentService] Document version inserted successfully with filePath: /uploads/550e8400-e29b-41d4.pdf

[Preview] Latest version details: {
  filePath: null,                    ← PROBLEM HERE!
  filePathIsNull: true
}
```

**If this happens**: The file path was saved to the service variable but somehow didn't make it to the database. This suggests a **database insert issue**.

### Bad Logs (File Save Failed)
```
[DocumentService] File saved successfully at: /uploads/550e8400-e29b-41d4.pdf
[DocumentService] About to insert document_version with: {
  filePath: null,                    ← PROBLEM HERE!
  filePathIsNull: true
}

[Preview] Latest version details: {
  filePath: null
}
```

**If this happens**: The file save either failed or returned null. Check:
- Does `/public/uploads/` directory exist?
- Is it writable?
- Is there disk space?

---

## Step 3: Check the Physical File

### Does the File Exist on Disk?

```bash
# On Windows
dir D:\enterprise-digital-banking-platform\public\uploads\

# Should show files like:
# 550e8400-e29b-41d4-a716-446655440000.pdf
# 6ba7b810-9dad-11d1-80b4-00c04fd430c0.xlsx
```

**If files exist**: Good! Problem is just the database not being updated.
**If NO files**: The FileStorageService.saveFile() is failing silently.

---

## Step 4: Identify the Exact Problem

### Scenario 1: Files exist but database is NULL

**Problem**: Files ARE being saved to disk, but `file_path` is not being stored in database.

**Likely Cause**: 
- Database insert is failing silently
- Transaction is rolling back
- Column name mismatch

**Fix**:
```typescript
// In DocumentService.createDocument:
console.log('[DocumentService] About to insert with filePath:', filePath)
// Check logs - does it log the correct filePath?

// If yes, but database still shows NULL:
// Problem is in the database insert itself
```

**Action**:
1. Check if `document_versions` table has `file_path` column
2. Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'document_versions';`
3. Look for `file_path` (snake_case, not camelCase)

### Scenario 2: Files don't exist AND database is NULL

**Problem**: Files are NOT being saved to disk AND `file_path` is NULL.

**Likely Cause**:
- FileStorageService.saveFile() is failing
- /public/uploads/ directory doesn't exist
- Permissions issue

**Fix**:
1. Check logs for: `[FileStorageService] File written successfully`
2. If not present, FileStorageService is failing
3. Check: Does `/project/public/uploads/` directory exist?

**Action**:
```typescript
// Ensure directory exists
mkdir D:\enterprise-digital-banking-platform\public\uploads

// Or in Node.js code:
import fs from 'fs/promises'
await fs.mkdir(uploadDir, { recursive: true })
```

### Scenario 3: Old bulk-uploaded documents

**Problem**: Documents uploaded before this system was built have no file_path.

**Root Cause**: Those documents were created without the file storage system.

**Expected**: This is normal for old documents. Users need to re-upload them.

**Handling**: System shows helpful message about re-uploading (already implemented ✓).

---

## Step 5: Fix the Issue

### Fix Option A: File save is failing

**Check logs for errors like**:
```
[FileStorageService] Failed to save file: Error: ENOENT: no such file or directory
[FileStorageService] Failed to save file: Error: EACCES: permission denied
```

**Solution**:
```typescript
// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// In saveFile method:
await fs.mkdir(UPLOAD_DIR, { recursive: true })
```

This is already in the code, so it should work. If directory exists check permissions.

### Fix Option B: Database insert is failing

**Check if column exists**:
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'document_versions' 
AND column_name = 'file_path';
```

**If column doesn't exist, create it**:
```sql
ALTER TABLE document_versions ADD COLUMN file_path VARCHAR(255);
```

**Verify insert works**:
```sql
UPDATE document_versions 
SET file_path = '/uploads/test.pdf' 
WHERE id = '[some-version-id]';

SELECT file_path FROM document_versions 
WHERE id = '[some-version-id]';
-- Should show: /uploads/test.pdf
```

### Fix Option C: Application logic issue

**Check if fileMetadata is being passed**:

In the upload endpoint (`app/api/documents/route.ts`):
```typescript
// Is divisionId being passed?
console.log('[POST Documents] fileMetadata:', {
  fileName: data.fileName,
  fileSize: data.fileSize,
  fileContent: data.fileContent ? 'present' : 'MISSING!',
  divisionId: data.divisionId,
})

// Call DocumentService
const document = await DocumentService.createDocument(
  validationDataWithDept,
  user.id,
  user.name,
  {
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileType: data.fileType,
    fileContent: data.fileContent,  // ← Must not be null!
    divisionId: data.divisionId,
  }
)
```

**Verify**: In logs, does `[DocumentService] File saved successfully` appear?

If **YES**: File save worked, problem is database.
If **NO**: File save failed, check FileStorageService logs.

---

## Quick Diagnostic Checklist

Run through these in order:

- [ ] Check database: Do documents have NULL file_path?
  - Yes → Continue to step 2
  - No → Preview should work, check browser cache

- [ ] Check server logs during preview: Does log show file_path value?
  - Yes (non-NULL) → Database query is working, file load might fail
  - No (NULL) → Database is actually storing NULL

- [ ] Check /public/uploads/ directory: Does it exist? Any files?
  - Yes → Files are being saved, problem is database
  - No → FileStorageService is not saving files

- [ ] Check FileStorageService logs: Does "File written successfully" appear?
  - Yes → File is saved, go to step 5B (database insert issue)
  - No → File save is failing, go to step 5A (directory/permissions)

- [ ] Check DocumentService logs: Does "About to insert document_version" show filePath?
  - Yes (non-NULL) → Database insert should work
  - No (NULL) → File save failed, go to step 5A

---

## Action Plan

### If files exist but DB shows NULL
```
1. Check column exists: SELECT column_name FROM information_schema.columns WHERE table_name = 'document_versions'
2. If file_path missing, create: ALTER TABLE document_versions ADD COLUMN file_path VARCHAR(255)
3. Update existing docs: UPDATE document_versions SET file_path = '[compute from files]' WHERE file_path IS NULL
4. Re-upload a test file
5. Check logs and database again
```

### If files don't exist
```
1. Check directory: ls -la D:\enterprise-digital-banking-platform\public\uploads\
2. If missing, create: mkdir D:\enterprise-digital-banking-platform\public\uploads
3. Check permissions: Must be writable by Node.js process
4. Re-upload a test file
5. Check if file appears in directory
```

### If old bulk-uploaded docs (no files, by design)
```
1. This is expected - show users the re-upload message (already done ✓)
2. Users can re-upload from /upload page
3. New uploads will have files properly stored
```

---

## Testing the Fix

After applying fixes:

1. **Upload a test file**
   ```
   Go to /upload
   Select file
   Click Upload
   Check server logs
   ```

2. **Check database**
   ```sql
   SELECT id, title, file_path FROM documents 
   ORDER BY created_at DESC LIMIT 1;
   ```
   Should show: `/uploads/[uuid].[ext]` (NOT NULL)

3. **Check file on disk**
   ```
   ls D:\enterprise-digital-banking-platform\public\uploads\
   Should see the file
   ```

4. **Try preview**
   ```
   Go to /file-management
   Click Preview button
   Should display file (or metadata if old document)
   ```

5. **Check server logs**
   ```
   Should see: [Preview] File loaded successfully
   Should NOT see: [Preview] No file path found
   ```

---

## Success Criteria

✅ Database shows `/uploads/[uuid].[ext]` in file_path
✅ File exists in /public/uploads/ directory
✅ Server logs show file being found and loaded
✅ Preview displays file or helpful message
✅ No error messages in browser console

---

## Getting Help

If you're still having issues:

1. **Share server logs** from when you upload and preview
2. **Share database query result** from the SELECT statement above
3. **Share directory listing** of `/public/uploads/`
4. **Share browser console errors** if any

This will pinpoint the exact issue!

---

**Next Step**: Follow the Quick Diagnostic Checklist above and let me know what you find! 🔍
