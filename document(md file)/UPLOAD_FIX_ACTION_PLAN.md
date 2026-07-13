# Upload Fix - Complete Action Plan

## PROBLEM SUMMARY
When documents are uploaded, the file is not being stored correctly. The `file_path` in the database shows as NULL, causing "This document does not have a file attached" errors when previewing or downloading.

**Root Cause**: The `filePath` is not being saved to the `document_versions` table during upload.

---

## STEP-BY-STEP FIX PROCEDURE

### STEP 1: Verify Database Column (2 minutes)
First, ensure the `file_path` column exists in the database:

```bash
# In your browser, visit this URL:
http://localhost:3000/api/admin/fix-database
```

**Expected response:**
```json
{
  "success": true,
  "action": "exists",
  "message": "file_path column already exists",
  "columnName": "file_path"
}
```

If it says `"action": "created"`, the column was missing and is now created. ✅

---

### STEP 2: Check Current Upload Status (3 minutes)
See what documents you have and which ones are missing file paths:

```bash
# In your browser, visit:
http://localhost:3000/api/admin/test-upload
```

**You'll see:**
- How many documents have file_path: ✅ HAS FILE_PATH
- How many documents have NULL: ❌ NO FILE_PATH (NULL)

**If all say NULL**, then all your uploads are affected. This is the problem we need to fix.

---

### STEP 3: Test New Upload with Logging (10 minutes)

**IMPORTANT**: Clear old documents first, then test with a fresh upload:

#### A) Clear old test documents (optional)
```bash
# In your browser, POST request (use curl or Postman):
curl -X POST http://localhost:3000/api/admin/test-upload \
  -H "Content-Type: application/json" \
  -d '{"action":"clear-all"}'
```

#### B) Open Developer Tools
1. Press `F12` in your browser
2. Go to **Console** tab
3. Go to **Network** tab

#### C) Upload a small test file
1. Go to http://localhost:3000/upload
2. Select a small file (e.g., test.txt or a small PDF)
3. Fill in:
   - **Document Title**: "Test Upload"
   - **Category**: Any category
   - **Department**: Any department
   - **Division**: Any division (if applicable)
4. Click **Upload**

#### D) Watch for Success Messages
Look in the browser **Console** tab for messages like:
```
[FileUploadForm] Uploading file: {
  fileName: "test.txt",
  size: 1024,
  departmentId: "..."
}
```

---

### STEP 4: Check Server Logs (5 minutes)

In your **terminal where you run `npm run dev`**, look for these logs:

#### ✅ GOOD - File is being saved:
```
[FileStorageService] File written successfully: /path/to/public/uploads/[UUID].txt
[FileStorageService] Returning relative path: /uploads/[UUID].txt
[DocumentService] File saved successfully at: /uploads/[UUID].txt
```

#### ✅ GOOD - File path is being inserted:
```
[DocumentService] About to insert document_version with filePath: /uploads/[UUID].txt, filePathIsNull: false
[DocumentService] Document version inserted successfully with filePath: /uploads/[UUID].txt
```

#### ❌ BAD - File path is NULL:
```
[DocumentService] About to insert document_version with filePath: null, filePathIsNull: true
```

---

### STEP 5: Check Database (5 minutes)

After the test upload, query your database directly:

```sql
SELECT id, version, file_name, file_path 
FROM document_versions 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- `file_path` should show: `/uploads/[UUID].ext` (NOT NULL)

**If NULL**, the file was saved but not inserted into the database correctly.

---

### STEP 6: Check File Exists on Disk (2 minutes)

If the database shows a path like `/uploads/[UUID].txt`, verify the file actually exists:

```bash
# Windows Command Prompt:
dir "public\uploads\"

# Or check the specific file:
type "public\uploads\[UUID].txt"

# Mac/Linux:
ls -la public/uploads/
cat public/uploads/[UUID].txt
```

If the file exists on disk but `file_path` is NULL in DB, there's a database insert issue.

---

### STEP 7: Test Preview (2 minutes)

If everything above worked:

1. Go to http://localhost:3000/file-management
2. Find your test document
3. Click **Preview**
4. The file should display ✅

If it still shows "This document does not have a file attached", then `file_path` is NULL. Go back to Step 4.

---

## WHAT TO DO IF IT'S STILL BROKEN

### If file_path is NULL in database after upload:

**Possible Causes:**
1. Database insert is failing silently
2. filePath parameter is not being passed to the insert
3. Database user doesn't have permission to update the column

**To Fix:**
- Check the code in `lib/services/document.service.ts` at the line that does `db.insert(documentVersions).values({...filePath...})`
- Add extra logging before the insert
- Check if database user has INSERT permission on `document_versions`

### If file is not being saved to disk:

**Possible Causes:**
1. `public/uploads/` directory doesn't exist or is not writable
2. File permission issues on the server
3. Disk space issue

**To Fix:**
```bash
# Create directory if missing:
mkdir -p public/uploads
chmod 755 public/uploads

# Check permissions:
ls -la public/
```

### If logs don't show any [FileStorageService] messages:

**Possible Causes:**
1. fileContent is not being passed from API to service
2. FormData is not properly extracting the file
3. File is undefined before reaching the service

**To Fix:**
- Check the `POST /api/documents` route in `app/api/documents/route.ts`
- Verify FormData parsing is correct
- Ensure file content is in ArrayBuffer format

---

## QUICK REFERENCE

| Step | What to Do | Time | Link |
|------|-----------|------|------|
| 1 | Fix database | 2 min | http://localhost:3000/api/admin/fix-database |
| 2 | Check status | 3 min | http://localhost:3000/api/admin/test-upload |
| 3 | Upload test | 10 min | http://localhost:3000/upload |
| 4 | Check logs | 5 min | Terminal running `npm run dev` |
| 5 | Query DB | 5 min | Your database client |
| 6 | Check disk | 2 min | `ls public/uploads/` or File Explorer |
| 7 | Test preview | 2 min | http://localhost:3000/file-management |

---

## AFTER IT'S WORKING

### Re-upload old documents
Old documents created before this fix won't have file_path. To make them work:

1. Upload the same file again through the upload form
2. The new upload will have the correct file_path
3. The old metadata-only document can be deleted

### Test with multiple file types
Ensure it works with:
- PDF files
- Word docs (.docx)
- Excel files (.xlsx)
- Images
- Text files

### Monitor in production
After deployment, monitor:
- Check that new uploads have file_path
- Monitor disk space in `public/uploads/`
- Set up cleanup jobs for old files if needed

---

## IF YOU GET STUCK

Provide this information:

1. **Output of `/api/admin/test-upload`** - shows current status
2. **Server logs during upload** - copy-paste the [FileStorageService] and [DocumentService] logs
3. **Database query result** - `SELECT * FROM document_versions LIMIT 1;`
4. **Your environment**:
   - OS: Windows/Mac/Linux
   - Node version: `node --version`
   - npm version: `npm --version`
5. **Any error messages** from the browser console or server terminal

