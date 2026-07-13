# Testing Guide for File Upload Fix

## Quick Test (5 minutes)

### Setup
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/sign-in
3. Login with your test account
4. Open browser DevTools (F12) → Console tab
5. Open a terminal to watch server logs

### Test Case 1: Basic Upload
```
1. Navigate to /upload page
2. Fill in form:
   - Document Title: "Test Report"
   - Category: "Financial Reports"  
   - Department: "Finance" (or first available)
   - Division: Wait and select from populated list
   
3. Add a file: Click "Browse" and select a PDF or Word document

4. Click "Upload" button

5. WATCH FOR SUCCESS MESSAGE and no errors in DevTools
```

**What to check:**
- ✅ Success message appears
- ✅ Files list clears
- ✅ Form resets
- ✅ No 500 errors in console
- ✅ Console shows upload logs

---

## Advanced Test (15 minutes)

### Test Case 2: Verify Database Recording

```
1. Complete Test Case 1 successfully

2. Open database client (psql, pgAdmin, or similar)

3. Check documents table:
   SELECT id, title, department_id, division_id, owner_name 
   FROM documents 
   ORDER BY created_at DESC LIMIT 1;

4. VERIFY:
   - title = "Test Report" ✓
   - department_id is NOT NULL ✓
   - division_id is NOT NULL ✓
   - owner_name = your username ✓

5. Check document_versions table:
   SELECT id, document_id, file_path, file_name 
   FROM document_versions 
   WHERE document_id = 'from-step-3'
   ORDER BY version DESC LIMIT 1;

6. VERIFY:
   - file_path starts with "/uploads/" ✓
   - file_name matches your uploaded file ✓
   - file_path is NOT NULL ✓

7. Check filesystem:
   ls -la public/uploads/
   
8. VERIFY:
   - File exists with name: documentId.extension ✓
   - File size > 0 ✓
```

---

### Test Case 3: Verify File Management Table

```
1. Navigate to /file-management

2. WAIT for table to load (watch console for server action logs)

3. Look for your uploaded file:
   - File Name: ✓ Should show "Test Report"
   - Department: ✓ Should show "Finance"
   - Division: ✓ Should show actual division name (NOT "N/A")
   - Date Uploaded: ✓ Should show today
   - Uploaded By: ✓ Should show your username
   - Actions: ✓ Preview, Download, Share buttons available

4. Console should show:
   [FileManagementTable] Files from server action: [... actual files]
```

---

### Test Case 4: Preview/Download

```
1. From /file-management table

2. Click the Eye icon (Preview) for your file:
   - If PDF/Image: ✓ Should open in browser or new tab
   - If Word/Excel: ✓ Should show "Office file preview..." message
   - If other: ✓ Should download file
   
3. Click the Download icon:
   ✓ Should trigger download of the file
   ✓ Downloaded file should have correct name

4. Click Share icon:
   ✓ Should show share options (or placeholder)
```

---

## Console Log Checklist

### Upload Success - Browser Console Should Show:
```
✅ [FileUploadForm] Form data to send: {title: "Test Report", ...}
✅ [FileUploadForm] FormData entries: 
    title: Test Report
    category: other
    departmentId: [uuid]
    divisionId: [uuid]
    fileName: document.pdf
✅ [FileUploadForm] Uploading file: {fileName: "document.pdf", size: ...}
✅ [FileUploadForm] Upload response status: 201
✅ [FileUploadForm] Successfully uploaded 1 file(s)
```

### Upload Success - Server Logs Should Show:
```
✅ [POST Documents] FormData received: fileExists: true, fileSize: 12345
✅ [POST Documents] FormData parsed: departmentId: [uuid], fileContentSize: 12345
✅ [DocumentService] Creating document: departmentId: [uuid], divisionId: [uuid]
✅ [DocumentService] Saving file for document: fileName: document.pdf, contentSize: 12345
✅ [FileStorageService] Starting file save: fileName: document.pdf, bufferSize: 12345
✅ [FileStorageService] Upload dir ensured
✅ [FileStorageService] About to write file: filePath: /path/to/public/uploads/[uuid].pdf
✅ [FileStorageService] Buffer created, size: 12345
✅ [FileStorageService] File written successfully: /path/to/public/uploads/[uuid].pdf
✅ [FileStorageService] File verified: size: 12345
✅ [FileStorageService] Returning relative path: /uploads/[uuid].pdf
✅ [DocumentService] File saved successfully at: /uploads/[uuid].pdf
✅ [DocumentService] Document inserted with divisionId: [uuid]
✅ [POST Documents] Document created: id, title: Test Report
```

### File Management Table Load - Browser Console:
```
✅ [FileManagementTable] Calling server action to fetch documents
✅ [FileManagementTable] Files from server action: [... array with files]
✅ [FileManagementTable] Fetching division for divisionId: [uuid]
```

---

## Troubleshooting

### Issue: "This document does not have a file attached"
**Cause**: File wasn't saved (filePath is NULL in database)
**Check**:
1. Look for FileStorageService logs in server output
2. Check if `public/uploads/` directory exists and is writable
3. Check file_path column in document_versions table is NULL
**Fix**:
- Ensure `public/uploads/` directory exists and is writable
- Check disk space
- Check file size isn't too large

### Issue: Division shows "N/A"
**Cause**: divisionId not saved in database
**Check**:
1. Query database: `SELECT division_id FROM documents WHERE id = 'xxx'`
2. If NULL, then departmentId fix didn't work
**Fix**:
- Verify departmentId is being passed in API
- Check app/api/documents/route.ts has the fix

### Issue: 401 Unauthorized on file management page
**Cause**: Server action not working or auth issue
**Check**:
1. Console should show fetchDocuments error
2. Check session is valid
**Fix**:
- Clear cookies and login again
- Verify next-auth is configured properly

### Issue: Upload shows 500 error
**Cause**: Database or validation error
**Check**:
1. Look at server logs for full error message
2. Check validation error response
**Fix**:
- Verify all required fields are sent (title, category, etc.)
- Check database connection

### Issue: File preview/download returns 404
**Cause**: File path not found on disk
**Check**:
1. Verify file_path in document_versions table
2. Check if file exists in public/uploads/
**Fix**:
- Re-upload the file
- Check file storage service logs

---

## Performance Notes

### Expected Performance:
- Upload: < 2 seconds for typical file
- File Management load: < 1 second (with caching)
- Division name fetch: First time ~100ms, cached after
- File download: Depends on file size

### If Slow:
1. Check server logs for queries taking too long
2. Check network tab in DevTools for slow requests
3. Ensure database is responsive

---

## Files to Monitor During Testing

### Browser Console (F12)
- Look for [FileUploadForm], [FileManagementTable], [fetchDocuments] logs
- Should be no 401, 403, or 500 errors

### Server Terminal
- Look for [POST Documents], [DocumentService], [FileStorageService] logs
- Should see complete file save flow

### Database
```sql
-- Check documents table
SELECT id, title, department_id, division_id, owner_name, created_at 
FROM documents 
ORDER BY created_at DESC LIMIT 5;

-- Check document_versions with file paths
SELECT id, document_id, file_path, file_name, created_at 
FROM document_versions 
ORDER BY created_at DESC LIMIT 5;
```

### Filesystem
```bash
# Check uploads directory
ls -lah public/uploads/

# Should have files named with UUID:
# -rw-r--r-- 1 user group 12345 Oct 1 12:34 a1b2c3d4.pdf
# -rw-r--r-- 1 user group 23456 Oct 1 12:34 e5f6g7h8.docx
```

---

## Success Criteria

All of the following must be true for a successful fix:

✅ Upload completes with success message (no 500 error)
✅ Department ID stored in database (not NULL)
✅ Division ID stored in database (not NULL)
✅ File path stored in document_versions (not NULL)
✅ Actual file exists in public/uploads/ directory
✅ File Management table loads without errors
✅ Division name displays (not "N/A")
✅ File preview/download works for at least one file type
✅ No 401 Unauthorized errors in file management
✅ Console logs show complete upload flow with no errors
