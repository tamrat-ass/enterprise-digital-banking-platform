# Verification Steps - File Upload Fix

## Build Status ✅
Build completed successfully with no errors.

## Code Changes Applied

### 5 Files Modified/Created:

1. ✅ **app/api/documents/route.ts** 
   - Added departmentId to DocumentService call
   - Enhanced FormData logging
   
2. ✅ **app/actions/documents.ts** (NEW)
   - Server action for fetching documents with proper auth
   
3. ✅ **lib/services/file-storage.service.ts**
   - Enhanced with detailed logging
   - Added file verification with fs.stat()
   
4. ✅ **lib/services/document.service.ts**
   - Enhanced logging for file operations
   
5. ✅ **components/file-management-table.tsx**
   - Now uses server action instead of direct fetch
   - Proper division name display

## Step-by-Step Verification

### STEP 1: Clean Build
```bash
cd d:\enterprise-digital-banking-platform
npm run build
# Expected: Completed successfully in ~30s
```
✅ Status: **PASSED** - Build completed with no errors

---

### STEP 2: Test File Upload

**Instructions:**
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/sign-in`
3. Login with test account
4. Go to `http://localhost:3000/upload`
5. Fill the form:
   - Title: "Test Document"
   - Category: Select one
   - Department: Select one (auto-loads divisions)
   - Division: Select one (should be populated)
6. Add a file (any PDF, Word doc, etc.)
7. Click Upload button

**What to expect:**
- ✅ "Successfully uploaded" message appears
- ✅ No error messages in console
- ✅ Server logs show [POST Documents] and [FileStorageService] entries
- ✅ Form clears after success

**Console logs you should see:**
```
[FileUploadForm] FormData entries:
  title: Test Document
  departmentId: [uuid]
  divisionId: [uuid]
  fileName: [filename]

[FileUploadForm] Upload response status: 201
[FileUploadForm] Successfully uploaded 1 file(s)
```

---

### STEP 3: Verify Database

After successful upload, check database:

```sql
-- Check documents table
SELECT 
  id,
  title,
  department_id,
  division_id,
  owner_name,
  created_at
FROM documents 
WHERE title = 'Test Document'
ORDER BY created_at DESC 
LIMIT 1;

-- Expected columns should have values:
-- id: [uuid]
-- title: "Test Document"
-- department_id: [uuid] ✅ (NOT NULL)
-- division_id: [uuid] ✅ (NOT NULL)
-- owner_name: [your username]
```

```sql
-- Check document_versions table
SELECT 
  id,
  document_id,
  file_path,
  file_name,
  version
FROM document_versions 
WHERE document_id = (
  SELECT id FROM documents 
  WHERE title = 'Test Document' 
  LIMIT 1
)
ORDER BY version DESC
LIMIT 1;

-- Expected:
-- file_path: /uploads/[uuid].[ext] ✅ (NOT NULL)
-- file_name: [original filename]
-- version: 1
```

---

### STEP 4: Verify File On Disk

```bash
# List files in uploads directory
ls -lah d:\enterprise-digital-banking-platform\public\uploads\

# Expected output should show:
# [uuid].pdf (or .docx, etc.)
# Size should match uploaded file size
```

**Check in Windows Explorer:**
Navigate to: `d:\enterprise-digital-banking-platform\public\uploads\`
Should see your uploaded file with UUID name

---

### STEP 5: Test File Management Table

1. Navigate to `http://localhost:3000/file-management`
2. Wait for table to load (~1-2 seconds)

**What to expect:**
- ✅ Table loads without errors
- ✅ Your "Test Document" appears in the list
- ✅ File Name: "Test Document"
- ✅ Department: Correct department name
- ✅ Division: **Actual division name** (NOT "N/A") ✅
- ✅ Date Uploaded: Today's date
- ✅ Uploaded By: Your username
- ✅ Action buttons visible (eye, download, share)

**Console should show:**
```
[FileManagementTable] Calling server action to fetch documents
[FileManagementTable] Files from server action: (array with your file)
[FileManagementTable] Fetching division for divisionId: [uuid]
```

---

### STEP 6: Test File Preview

1. In File Management table, click the 👁️ (Eye) icon for your file

**Expected behavior based on file type:**

**If PDF/Image:**
- ✅ Opens in new tab/browser viewer
- ✅ Can see the file content

**If Word/Excel/PowerPoint (.docx, .xlsx, .pptx, etc.):**
- ✅ Alert shows: "Office file preview requires the file to be uploaded"
- ✅ (This is expected - for actual Office files, would integrate with Google Docs API)

**If other file type:**
- ✅ Downloads to computer

---

### STEP 7: Test File Download

1. In File Management table, click the ⬇️ (Download) icon

**Expected:**
- ✅ Browser downloads the file
- ✅ File name is correct
- ✅ File size matches original
- ✅ File opens correctly

---

## Verification Checklist

### Code Changes
- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] No runtime errors on startup

### Database
- [ ] department_id is populated (not NULL)
- [ ] division_id is populated (not NULL)
- [ ] file_path is populated (not NULL)
- [ ] All values are valid UUIDs or paths

### File System
- [ ] public/uploads/ directory exists
- [ ] Uploaded files exist in directory
- [ ] File names match [uuid].[extension] format
- [ ] File sizes are correct

### User Interface
- [ ] Upload form loads
- [ ] Department dropdown works
- [ ] Division dropdown loads after department selection
- [ ] Upload completes successfully
- [ ] Success message displays

### File Management
- [ ] Table loads without 401 errors
- [ ] Files display in table
- [ ] Division names show (not "N/A")
- [ ] All columns populated correctly
- [ ] Action buttons work

### Preview/Download
- [ ] Eye icon opens preview
- [ ] Download icon triggers download
- [ ] Correct MIME types shown
- [ ] Office files show appropriate message

---

## Console Error Checklist

❌ **Should NOT see:**
- `401 Unauthorized`
- `[FileStorageService] Failed to save file`
- `Cannot find module '@/app/actions/documents'`
- `Document does not have a file attached` (when file was uploaded)
- `TypeError` or `SyntaxError`

✅ **Should see:**
- `[POST Documents] FormData parsed:` with departmentId and divisionId
- `[DocumentService] Saving file for document:`
- `[FileStorageService] File saved successfully at:`
- `[FileStorageService] File verified:` with file size

---

## Server Logs Checklist

✅ **Expected patterns in server logs:**

```
[POST Documents] FormData received: fileExists: true
[POST Documents] FormData parsed: departmentId: [uuid], divisionId: [uuid], fileContentSize: [number]
[DocumentService] Creating document: departmentId: [uuid], divisionId: [uuid]
[DocumentService] Saving file for document: fileName: [name], contentSize: [number]
[FileStorageService] Starting file save: fileName: [name], bufferSize: [number]
[FileStorageService] Upload dir ensured
[FileStorageService] About to write file: filePath: [path]
[FileStorageService] Buffer created, size: [number]
[FileStorageService] File written successfully: [path]
[FileStorageService] File verified: size: [number]
[FileStorageService] Returning relative path: /uploads/[uuid].[ext]
[DocumentService] File saved successfully at: /uploads/[uuid].[ext]
[DocumentService] Document inserted with divisionId: [uuid]
[POST Documents] Document created: id: [uuid], title: [title]
```

---

## Troubleshooting

### If Division Shows "N/A"
```sql
SELECT division_id FROM documents 
WHERE title = 'Test Document' LIMIT 1;
```
- If NULL → departmentId fix didn't work → Check app/api/documents/route.ts
- If has value → Try refreshing page or clearing browser cache

### If File Shows "Not Found" on Preview
```sql
SELECT file_path FROM document_versions 
WHERE document_id = (SELECT id FROM documents WHERE title = 'Test Document')
LIMIT 1;
```
- If NULL → file save failed → Check server logs for [FileStorageService] errors
- If has path → Check if file exists in public/uploads/

### If 401 Unauthorized Appears
- Clear browser cookies
- Login again
- Check if session is still valid
- Verify next-auth configuration

### If Upload Fails with 500
- Check server logs for full error message
- Verify all required fields are sent
- Check database connection
- Try a smaller file

---

## Success Criteria (All Must Pass)

1. ✅ Build completes successfully
2. ✅ Upload form works without errors
3. ✅ Department ID saved in database
4. ✅ Division ID saved in database
5. ✅ File saved to public/uploads/ directory
6. ✅ File path saved in document_versions table
7. ✅ File Management table loads (no 401)
8. ✅ Division name displays correctly
9. ✅ File preview/download works
10. ✅ Console logs show complete flow
11. ✅ No error messages anywhere

---

## Final Sign-Off

When all above verification steps are complete and successful, the fix is ready for deployment.

**Date Tested:** [Your test date]
**Tester Name:** [Your name]
**Result:** ✅ PASS / ❌ FAIL

---

## Next Steps After Verification

1. ✅ Document any issues found in ISSUES_FOUND.md
2. ✅ Share TESTING_GUIDE.md with QA team
3. ✅ Deploy to staging environment
4. ✅ Deploy to production when confident
5. ✅ Monitor error logs for 24 hours post-deploy
