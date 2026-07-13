# Upload Fix - Diagnostic & Solution

## PROBLEM IDENTIFIED
When customers upload documents, the file is saved but **`file_path` is NULL in the database**, causing the preview to show "This document does not have a file attached".

## ROOT CAUSE ANALYSIS

### What Happens When You Upload:
1. ✅ Client sends FormData with `file` object
2. ✅ API receives FormData and extracts file
3. ✅ FileStorageService.saveFile() is called and returns `/uploads/documentId.ext`
4. ✅ DocumentService.createDocument() inserts document to DB
5. ✅ But... `filePath` might not be inserted correctly

### Possible Issues:
1. **Race Condition** - file path saved AFTER null is inserted
2. **Type Mismatch** - filePath is being converted to null
3. **Silent Failure** - file save fails but error isn't thrown
4. **Database Column** - file_path column missing or has NULL default

## DIAGNOSIS STEPS

### Step 1: Check Database Schema
```sql
-- Run this to verify the column exists and has correct type
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'document_versions' AND column_name = 'file_path';
```

Expected Result:
```
column_name  | file_path
data_type    | text
is_nullable  | YES (true)
column_default | null
```

### Step 2: Check Existing Records
```sql
-- See what's actually stored
SELECT 
    id,
    document_id,
    version,
    file_name,
    file_path,
    created_at
FROM document_versions 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 3: Check File Storage
```bash
# Check if files exist on disk
ls -la public/uploads/
```

### Step 4: Enable Full Logging (DONE)
All services now have enhanced logging:
- DocumentService: logs file_path before/after insert
- FileStorageService: logs save success/failure
- Preview endpoint: logs database values and what's retrieved

### Step 5: Test Upload With Logs
1. Open browser DevTools → Network tab
2. Upload a test document
3. Check Server Logs for:
   - `[FileStorageService] File saved successfully at:`
   - `[DocumentService] About to insert document_version with filePath:`
   - `[DocumentService] Document version inserted successfully with filePath:`

## SOLUTION

### Fix 1: Verify Database Column
Run `/api/admin/fix-database` endpoint to auto-check and create column if missing.

### Fix 2: Test Upload Flow
Upload a test file and observe logs to identify WHERE the path is being lost.

### Fix 3: If Still NULL
Check:
- [ ] File was actually saved (`fs.stat()` verification in logs)
- [ ] FileStorageService returned path (not null, not error)
- [ ] DocumentService received the path from FileStorageService
- [ ] Database insert happened with path parameter

## LOGS TO CHECK

### Success Scenario (All logs present):
```
[FileStorageService] Starting file save: fileName=test.pdf, bufferSize=12345
[FileStorageService] File written successfully: /path/to/public/uploads/uuid.pdf
[FileStorageService] File verified: size=12345, path=/uploads/uuid.pdf
[FileStorageService] Returning relative path: /uploads/uuid.pdf
[DocumentService] File saved successfully at: /uploads/uuid.pdf
[DocumentService] About to insert document_version with: filePath=/uploads/uuid.pdf, filePathIsNull=false
[DocumentService] Document version inserted successfully with filePath: /uploads/uuid.pdf
```

### Failure Scenario (Missing logs):
If any of these are missing, that's where the issue is.

## ACTION PLAN

1. **First**: User visits `/api/admin/fix-database` → check database
2. **Then**: Upload test file → observe console logs
3. **If working**: All logs appear → problem solved
4. **If not**: Share the logs and we'll identify exact break point

