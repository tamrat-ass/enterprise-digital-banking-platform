# File Upload Data Recording - Fix Checklist

## Issue
When customers upload files, documents are created in the database but:
1. File content is NOT being recorded/saved
2. Division information is showing as "N/A" instead of actual division names
3. Files cannot be previewed because there's no file path recorded

## Root Causes Found and Fixed

### 1. Missing `departmentId` in Document Creation ✅ FIXED
**Problem**: 
- API received `departmentId` from form
- But passed only `divisionId` to DocumentService
- DocumentService tried to save `departmentId: input.departmentId` which was undefined
- Result: Department info not saved

**File**: `app/api/documents/route.ts`
**Fix**: Added `departmentId` to the data before calling DocumentService.createDocument

### 2. Incomplete File Upload Flow Logging ✅ ENHANCED
**Problem**:
- File save failures were silently ignored
- No visibility into where the upload was failing
- Makes debugging impossible

**Files**:
- `lib/services/file-storage.service.ts` - Enhanced with detailed logging at each step
- `lib/services/document.service.ts` - Enhanced logging for file metadata
- `app/api/documents/route.ts` - Enhanced logging for FormData parsing

### 3. Missing Server Action for Document Fetching ✅ FIXED
**Problem**:
- Client component calling `/api/documents` directly got 401 Unauthorized
- Session wasn't being sent properly from client component
- File management table couldn't load documents

**File**: Created `app/actions/documents.ts`
**Fix**: Server action that calls DocumentService directly, with proper session context

### 4. Division Name Not Displaying ✅ FIXED
**Problem**:
- File management table showed "N/A" instead of division name
- Form data was sending `divisionId` but not `division_id` properly

**File**: `components/file-management-table.tsx`
**Fix**: 
- Now uses server action to fetch documents
- Properly fetches and caches division names
- Displays division name in Division column

## Testing Steps

### 1. Test File Upload with Division
```
1. Go to /upload page
2. Select a Department
3. Wait for Divisions to load
4. Select a Division
5. Add a file
6. Fill in title and category
7. Click Upload
8. Check browser console for logs (should see file save progress)
9. Check database:
   - documents table: verify departmentId and division_id are populated
   - document_versions table: verify file_path is populated with /uploads/[documentId].[ext]
   - public/uploads/ directory: verify file exists
```

### 2. Test File Management Table
```
1. Go to /file-management
2. Table should load files (using server action)
3. Division column should show actual division names, not "N/A"
4. Files should have uploaded date and uploader name
```

### 3. Test File Preview
```
1. Click eye icon on a file
2. For Office files: should show message about re-uploading
3. For PDFs/images: should open in browser
4. For other files: should download
```

### 4. Check Logs for Any Errors
Look in browser console and server logs for:
- `[FileStorageService]` logs - should show file path and verification
- `[DocumentService]` logs - should show document insertion and division ID
- `[POST Documents]` logs - should show FormData parsing and file size

## Expected Behavior After Fixes

✅ Files uploaded with complete metadata (title, category, department, division)
✅ Actual files saved to `public/uploads/` directory
✅ File paths recorded in `document_versions.file_path`
✅ Division names displaying correctly in file management table
✅ Division ID stored in documents table
✅ Department ID stored in documents table (not just description)
✅ File preview/download working for documents with files
✅ Server action used for secure fetching of documents

## Files Modified

1. `app/api/documents/route.ts` - Fixed departmentId not being passed
2. `lib/services/file-storage.service.ts` - Enhanced logging
3. `lib/services/document.service.ts` - Enhanced logging for file operations
4. `components/file-management-table.tsx` - Uses server action now
5. `app/actions/documents.ts` - NEW: Server action for document fetching

## Potential Issues to Watch

1. **Directory Permissions**: `public/uploads/` must be writable. If you get permission errors in logs, check directory permissions.

2. **File Size Limits**: Node.js and Next.js have limits. Monitor file size handling.

3. **Database Sync**: Make sure `division_id` column exists in documents table (should exist from migration).

4. **Session Handling**: Server action relies on next-auth session. Verify next-auth is properly configured.
