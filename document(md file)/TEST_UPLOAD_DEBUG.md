# Upload Debugging Guide

## THE PROBLEM
When documents are uploaded, they show "This document does not have a file attached" on preview, meaning `file_path` is NULL in the database.

## QUICK TEST

### Step 1: Check Database Column
Open a terminal and run:
```bash
curl "http://localhost:3000/api/admin/fix-database"
```

Expected response: `"columnName":"file_path"` (either exists or was created)

### Step 2: Upload Test File
1. Open `http://localhost:3000` → Documents → Upload
2. Select a small test file (e.g., test.txt with "Hello World")
3. Fill in Title, Category, Department
4. Click Upload

### Step 3: Monitor Server Logs
Watch for these exact logs in your terminal running `npm run dev`:

#### EXPECTED SUCCESS LOGS:
```
[FileUploadForm] Uploading file: {
  "fileName": "test.txt",
  "size": 11,
  "type": "text/plain",
  "departmentId": "..."
}

[POST Documents] FormData received: {
  "fileExists": true,
  "fileName": "test.txt",
  "fileSize": 11,
  "fileType": "text/plain"
}

[POST Documents] FormData parsed: {
  "title": "...",
  "fileName": "test.txt",
  "fileSize": 11,
  "fileContentSize": 11,
  "hasFile": true
}

[DocumentService] Saving file for document: {
  "fileName": "test.txt",
  "contentSize": 11,
  "contentType": "ArrayBuffer"
}

[FileStorageService] Starting file save: {
  "fileName": "test.txt",
  "bufferSize": 11,
  "uploadDir": "/.../public/uploads"
}

[FileStorageService] File written successfully: /.../public/uploads/[UUID].txt

[FileStorageService] File verified: {
  "size": 11,
  "path": "/.../public/uploads/[UUID].txt"
}

[FileStorageService] Returning relative path: /uploads/[UUID].txt

[DocumentService] File saved successfully at: /uploads/[UUID].txt

[DocumentService] File path verified as non-null: {
  "filePath": "/uploads/[UUID].txt",
  "filePathLength": 21,
  "filePathType": "string"
}

[DocumentService] About to insert document_version with filePath: /uploads/[UUID].txt

[DocumentService] Document version inserted successfully with filePath: /uploads/[UUID].txt
```

### Step 4: Check Database
After upload, check what was actually stored:
```sql
SELECT id, document_id, version, file_name, file_path, created_at 
FROM document_versions 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected: `file_path` should show `/uploads/[UUID].txt`, NOT `NULL`

### Step 5: Test Preview
1. Go back to file management
2. Find your test document
3. Click Preview

If working: File should display
If broken: "This document does not have a file attached"

## DEBUGGING CHECKLIST

- [ ] Step 1: Column exists (run /api/admin/fix-database)
- [ ] Step 2: Upload completes without error
- [ ] Step 3: Check server logs for SUCCESS logs above
- [ ] Step 4: Database shows file_path value (not NULL)
- [ ] Step 5: Preview works

## IF IT FAILS

### If logs show `[FileStorageService] File written successfully` but file_path is NULL:
→ Issue is between file save and database insert
→ Database insert is silently failing
→ Check database user permissions

### If logs show `[POST Documents] FormData parsed` but no fileContentSize:
→ File is not being sent properly from client
→ FormData.append('file', file) is failing
→ Check browser console for errors

### If logs DON'T show `[DocumentService] Saving file`:
→ fileMetadata.fileContent is empty
→ Problem is in API route parsing
→ File FormData extraction failed

### If logs show `ERROR: File name provided but no content!`:
→ File name exists but no content
→ FormData has file as empty
→ Browser didn't properly attach file

## WHAT TO SHARE IF STILL BROKEN

When sharing results, provide:
1. The actual console logs from the upload
2. The database query result (file_path value)
3. Whether `/uploads/[UUID].txt` file exists on disk
4. Your environment (Windows/Mac/Linux, Node version)

