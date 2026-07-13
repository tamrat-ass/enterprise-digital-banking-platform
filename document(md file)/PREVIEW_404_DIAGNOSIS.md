# Preview 404 Error - Diagnosis & Solution

## Error Details

```
GET /api/documents/cfff87a7-f066-4def-848a-13199d49b781/preview 404 in 609ms
```

**What this means:** The system tried to preview document `cfff87a7-f066-4def-848a-13199d49b781` but couldn't find it.

**Root Cause:** Document does not exist in the database.

---

## Why This Happens

### Scenario 1: Document Was Never Created
- The upload failed silently
- The document UUID doesn't match what was stored

### Scenario 2: Document Was Deleted
- Documents were cleared via admin endpoint
- Database was reset

### Scenario 3: Wrong Document ID
- File management table is showing wrong ID
- Database and UI are out of sync

---

## How to Diagnose

### Step 1: Check What Documents Exist

Open in browser:
```
http://localhost:3000/api/admin/test-upload
```

You'll see:
- Total documents in database
- Which ones have file_path stored
- The actual document IDs

**Note the document IDs shown here.**

---

### Step 2: Check Server Logs

Look at the terminal where `npm run dev` is running.

You should see logs like:
```
[Preview] Request for document: cfff87a7-f066-4def-848a-13199d49b781
[Preview] Error: {
  "documentId": "cfff87a7-f066-4def-848a-13199d49b781",
  "error": "Document not found",
  "errorType": "Error"
}
```

This confirms the document doesn't exist in the database.

---

### Step 3: Upload a New Test File

1. Go to: `http://localhost:3000/upload`
2. Upload a test file
3. Note the success message
4. Check `/api/admin/test-upload` again to see new document ID

---

## Solutions

### Solution 1: Use Correct Document ID

If you see documents in `/api/admin/test-upload`:

1. Copy one of the document IDs shown
2. Try preview with that ID:
   ```
   http://localhost:3000/api/documents/[CORRECT_ID]/preview
   ```

Replace `[CORRECT_ID]` with an actual ID from the test endpoint.

---

### Solution 2: Upload a New Document

```bash
# Go to upload page
http://localhost:3000/upload

# Create test.txt:
This is a test file

# Upload it with:
- Title: "Test Document"
- Category: Any
- Department: Any

# After success, check:
http://localhost:3000/api/admin/test-upload

# Copy the new document ID

# Try preview:
http://localhost:3000/api/documents/[NEW_ID]/preview
```

---

### Solution 3: Check File Management Page

1. Go to: `http://localhost:3000/file-management`
2. Look for any documents listed
3. Click Preview on an existing document
4. Check terminal logs for the request

---

## Understanding the Flow

```
Frontend requests preview
  ↓
Browser calls: /api/documents/[id]/preview
  ↓
API route gets document ID from URL
  ↓
DocumentService.getDocument(id) called
  ↓
  ├─ If document exists → Return document data
  │
  └─ If document NOT found → Throw "Document not found" error
       ↓
       Caught as 404 error
```

If you get a 404, the document simply doesn't exist in the database.

---

## Common Causes & Fixes

| Cause | How to Check | Solution |
|-------|--------------|----------|
| Document never uploaded | Check `/api/admin/test-upload` | Upload new file |
| Wrong document ID | Log shows `Document not found` | Use correct ID from test endpoint |
| Database cleared | No documents in test endpoint | Upload new files |
| Upload failed silently | Server logs show errors | Review upload logs |
| Corrupted document ID | Copy/paste error | Verify ID exactly |

---

## Debugging Checklist

- [ ] Run `/api/admin/test-upload` - note which documents exist
- [ ] Check if the document you're trying to preview is in that list
- [ ] Review server terminal logs for any error messages
- [ ] Upload a fresh test file and try with its ID
- [ ] Verify you're using correct document ID (copy from test endpoint)

---

## What the Test Endpoint Shows

When you visit `/api/admin/test-upload`, you see:

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
        "id": "550e8400-e29b-41d4-a716-446655440000",  // ← Use THIS ID
        "title": "Test Upload",
        "createdAt": "2026-07-07T12:34:56.000Z"
      },
      "versions": [...],
      "status": "✅ HAS FILE_PATH"
    }
  ]
}
```

**The `id` field in each document is what you need for the preview URL.**

---

## Next Steps

1. **Now:** Visit `/api/admin/test-upload` to see what documents exist
2. **Then:** Copy one document ID
3. **Try:** Preview with that ID: `/api/documents/[ID]/preview`
4. **If works:** The system is functioning correctly
5. **If doesn't work:** Check server logs for other error types

---

## Expected Behavior

### ✅ Working Correctly
- Document exists in `/api/admin/test-upload`
- Preview request succeeds with HTTP 200
- File content displays in browser
- Server logs show successful file load

### ❌ Not Working
- Document NOT in `/api/admin/test-upload` → Document doesn't exist
- HTTP 404 error → Document ID not found in database
- HTTP 500 error → Server error (check logs)
- File won't load → File doesn't exist on disk (but DB has the path)

---

## Quick Fix

```
1. Go to: http://localhost:3000/api/admin/test-upload
2. Copy a document ID from the list (e.g., "550e8400-...")
3. Try: http://localhost:3000/api/documents/550e8400-.../preview
4. Should work now!
```

If not, see "Debugging Checklist" above.

---

## Questions to Ask

1. **Did you just upload a file?** → Check if it shows in `/api/admin/test-upload`
2. **Did upload succeed?** → Look for green "Successfully uploaded" message
3. **Is the ID showing in file-management?** → That's the ID to use for preview
4. **Does server log show any errors?** → Review the [DocumentService] and [FileStorageService] logs

---

## Advanced: Manual Database Check

If you want to verify directly in the database:

```sql
SELECT id, title, status FROM documents LIMIT 10;
```

If this returns empty → No documents exist, need to upload.

```sql
SELECT document_id, file_path FROM document_versions LIMIT 10;
```

If `file_path` is NULL → Files not being saved (different issue).

---

**TL;DR:** Your document ID doesn't exist in the database. Check `/api/admin/test-upload` to see what IDs DO exist, and use one of those for preview.
