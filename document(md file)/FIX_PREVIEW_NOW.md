# Fix Preview Not Working - Action Plan

## The Situation

When you click preview, you see:
```
"This document does not have a file attached. Please re-upload the document."
```

**Root Cause**: `file_path` column in `document_versions` table is **NULL**

---

## Immediate Actions (Do These Now)

### Step 1: Verify Build Passes
```bash
npm run build
# Should complete with no errors
```
✅ Status: **DONE** - Build passing

---

### Step 2: Run Diagnostic SQL Query

Connect to PostgreSQL and run:

```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END) as with_files,
  SUM(CASE WHEN file_path IS NULL THEN 1 ELSE 0 END) as without_files
FROM (
  SELECT DISTINCT ON (d.id) 
    d.id,
    dv.file_path
  FROM documents d
  LEFT JOIN document_versions dv 
    ON d.id = dv.document_id
  ORDER BY d.id, dv.version DESC
) sub;
```

**What will happen**:
- Shows how many documents have file_path
- Shows how many are missing it

**If result shows `without_files = 0`**: All good, problem might be elsewhere
**If result shows `without_files > 0`**: Found the problem!

---

### Step 3: Check Physical Files

```bash
# Windows
dir D:\enterprise-digital-banking-platform\public\uploads\

# Should list files like:
# 550e8400-e29b-41d4-a716-446655440000.pdf
# 6ba7b810-9dad-11d1-80b4-00c04fd430c0.xlsx
```

**If files exist**: Database wasn't updated when files were saved
**If NO files**: File storage system is not working

---

### Step 4: Check Server Logs

Upload a new test file and watch server logs for:

```
[DocumentService] Saving file for document: {...}
[DocumentService] File saved successfully at: /uploads/...
[DocumentService] About to insert document_version with: {filePath: '...', filePathIsNull: false}
[DocumentService] Document version inserted successfully with filePath: /uploads/...
```

**If you see these logs**: File operations are working, database insert might have an issue
**If you DON'T see file save logs**: FileStorageService is failing

---

## Likely Problems & Quick Fixes

### Problem 1: File_Path Column Missing

**Check**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'document_versions' AND column_name = 'file_path';
```

**If empty result**: Column doesn't exist

**Fix**:
```sql
ALTER TABLE document_versions ADD COLUMN file_path VARCHAR(255);
```

---

### Problem 2: Database Not Updating

**Check Server Logs**: Look for database errors

**Likely Cause**: 
- Transaction rolling back
- Constraint violation
- Connection issue

**Fix**:
1. Restart database
2. Check database logs
3. Re-upload test file
4. Check logs again

---

### Problem 3: File Storage Failing

**Check Server Logs**: Look for "Failed to save file" errors

**Likely Cause**:
- /public/uploads/ directory doesn't exist
- No write permissions
- Disk space issue

**Fix**:
```bash
# Create directory
mkdir D:\enterprise-digital-banking-platform\public\uploads

# Or in PowerShell
New-Item -ItemType Directory -Path "D:\enterprise-digital-banking-platform\public\uploads" -Force
```

---

### Problem 4: Old Bulk-Uploaded Documents

**Symptoms**: 
- Documents exist but no files
- All have NULL file_path

**Cause**: Documents uploaded before file storage system

**Action**: 
- This is expected behavior
- Show user helpful message (already done ✓)
- Users re-upload from /upload page

---

## Full Diagnostic Procedure

1. **Check database**: Run SQL query (Step 2 above)
2. **Check files**: Dir command (Step 3 above)
3. **Check logs**: Upload test file (Step 4 above)
4. **Identify problem**: Match to "Likely Problems" above
5. **Apply fix**: Follow corresponding fix
6. **Verify**: Upload new file and check
7. **Test preview**: Should now work ✅

---

## Testing After Fix

### Test 1: Upload New File
```
1. Go to /upload
2. Select department/division
3. Upload test file
4. Check server logs - should see file saved
5. Check database - should show file_path
```

### Test 2: Check Database
```sql
SELECT file_path FROM document_versions 
ORDER BY created_at DESC LIMIT 1;
-- Should show: /uploads/[uuid].[ext] (NOT NULL)
```

### Test 3: Check Physical File
```bash
ls -la D:\enterprise-digital-banking-platform\public\uploads\[uuid].*
# Should show file exists
```

### Test 4: Try Preview
```
1. Go to /file-management
2. Find your test file
3. Click Preview button
4. Should display file (not error message)
```

---

## What I've Already Enhanced

✅ **Enhanced Logging** in DocumentService
- Logs file save start/end
- Logs file_path value before insert
- Logs if file save fails

✅ **Enhanced Logging** in Preview Endpoint
- Logs file_path value retrieved from database
- Logs if file_path is NULL
- Detailed logging for debugging

✅ **Enhanced Error Handling**
- Now throws error if file save fails
- Won't silently create NULL file_path

---

## Documentation I've Created

| File | Purpose |
|------|---------|
| `PREVIEW_NOT_WORKING_DIAGNOSIS.md` | Complete diagnostic guide |
| `DEBUG_SQL_QUERIES.md` | SQL queries to run |
| `FIX_PREVIEW_NOW.md` | This file - action plan |

---

## Quick Reference

**My Hypothesis**: 
File path is being generated and passed to document version insert, but either:
1. Column doesn't exist in database
2. Insert is failing silently
3. Transaction rolling back
4. File save is failing (null filePath)

**Most Likely**: Column issue or file save failing

**Action**: 
1. Run SQL query to check
2. Check server logs
3. Check /public/uploads/ directory
4. Apply corresponding fix

---

## Next Steps

```
Step 1: Connect to PostgreSQL
Step 2: Run diagnostic SQL query
Step 3: Share results with me
Step 4: I'll pinpoint exact issue
Step 5: Apply specific fix
Step 6: Test and verify
```

---

## Summary

Your preview structure is **architecturally correct** ✅

The issue is that `file_path` is **not being stored** in the database when files are uploaded.

**Why**:
- File save might be failing
- Database column might be missing  
- Insert might be failing

**How to Fix**:
1. Run SQL diagnostic query
2. Check what the results show
3. Apply the corresponding fix
4. Test new upload

**Timeline**: Should fix in < 15 minutes once you identify the issue

---

**Start with Step 1 above and let me know what you find!** 🔍
