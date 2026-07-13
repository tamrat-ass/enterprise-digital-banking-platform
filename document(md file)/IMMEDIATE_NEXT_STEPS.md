# Immediate Next Steps - Fix Preview 404

## What Happened

You got a **404 error** when trying to preview document `cfff87a7-f066-4def-848a-13199d49b781`.

**Root Cause:** That document ID doesn't exist in your database.

---

## What to Do Right Now (2 minutes)

### Step 1: Check What Documents Exist

Open this URL in your browser:
```
http://localhost:3000/api/admin/test-upload
```

### Step 2: Look at the Response

You'll see a JSON response. Look for:
- `totalDocuments` - how many docs exist
- The `documents` array with actual IDs

### Step 3: Possible Outcomes

**Outcome A: You see documents with ✅ HAS FILE_PATH**
```json
{
  "documents": [
    {
      "document": {
        "id": "550e8400-e29b-41d4-a716-446655440000"
      },
      "status": "✅ HAS FILE_PATH"
    }
  ]
}
```
→ **Solution:** Use one of these IDs for preview:
```
http://localhost:3000/api/documents/550e8400-e29b-41d4-a716-446655440000/preview
```

**Outcome B: No documents (totalDocuments: 0)**
```json
{
  "success": true,
  "summary": {
    "totalDocuments": 0,
    "documentsWithFilePath": 0,
    "documentsWithoutFilePath": 0
  },
  "documents": []
}
```
→ **Solution:** Upload a new file (see Step 4 below)

**Outcome C: You see documents but they show ❌ NO FILE_PATH**
```json
{
  "documents": [
    {
      "document": { "id": "..." },
      "status": "❌ NO FILE_PATH (NULL)"
    }
  ]
}
```
→ **Solution:** Follow "Upload Recovery Guide" → Section on NULL file paths

---

## If You Have Documents (Outcome A)

This means your system IS working!

The ID `cfff87a7-f066-4def-848a-13199d49b781` simply doesn't exist in the database.

**Options:**
1. Use one of the IDs that DO exist
2. Upload a new file
3. Check where that ID came from (it may be invalid)

---

## If You Have NO Documents (Outcome B)

Time to upload your first test file:

### Step 1: Go to Upload Page
```
http://localhost:3000/upload
```

### Step 2: Create a Test File

Create a file called `test.txt` with content:
```
This is a test file for the upload system.
```

### Step 3: Fill in Upload Form
- **Title:** "Test Document"
- **Category:** Pick any
- **Department:** Pick any
- **Division:** Pick any (optional)

### Step 4: Click Upload

You should see: ✅ **"Successfully uploaded 1 file(s)"**

### Step 5: Check What Was Created

Go to:
```
http://localhost:3000/api/admin/test-upload
```

Now you should see your document with an ID. **Copy that ID.**

### Step 6: Try Preview

Use the ID you just copied:
```
http://localhost:3000/api/documents/[COPIED_ID]/preview
```

Should now work! ✅

---

## Check Server Logs

While doing this, watch your terminal where `npm run dev` is running.

You should see detailed logs like:
```
[POST Documents] Request started
[FileStorageService] File written successfully: ...
[DocumentService] File saved successfully at: /uploads/[UUID].txt
[DocumentService] Verification - data in database: { filePathIsNull: false }
```

**If you see errors,** look for these patterns:
- `FileStorageService] Failed to save file` → Disk/permission issue
- `Failed to create upload directory` → Folder doesn't exist
- `Document not found` → Database issue

---

## Everything Else to Know

**I already fixed:**
- ✅ All TypeScript type errors
- ✅ Null safety issues
- ✅ Build verified working

**What I added for debugging:**
- ✅ Better logging in preview route
- ✅ Better logging in documents API route
- ✅ This recovery guide

**What to check:**
- Server logs (most important)
- `/api/admin/test-upload` endpoint
- Check if `public/uploads/` directory exists

---

## Decision Tree

```
1. Visit /api/admin/test-upload
   ├─ totalDocuments = 0
   │  └─ Upload new file (see Step 4 above)
   │
   ├─ totalDocuments > 0 with ✅ HAS FILE_PATH
   │  └─ Copy an ID and use for preview
   │
   └─ totalDocuments > 0 with ❌ NO FILE_PATH
      └─ File wasn't saved, check logs for error
```

---

## One-Minute Verification

```bash
# 1. Check test-upload endpoint
curl http://localhost:3000/api/admin/test-upload | grep totalDocuments

# 2. If totalDocuments > 0, copy first document ID
# 3. Replace [ID] below:
curl http://localhost:3000/api/documents/[ID]/preview

# 4. Should get file content or metadata text
```

---

## File Management Page

Can also see documents here:
```
http://localhost:3000/file-management
```

Click **Preview** button on any document listed.

---

## Status Summary

| Component | Status | Next Action |
|-----------|--------|-------------|
| Code Fixes | ✅ Complete | N/A |
| Build | ✅ Verified | N/A |
| Logging | ✅ Enhanced | Monitor terminal |
| Database | ❓ Check | Visit /api/admin/test-upload |
| Upload | ❓ Check | Try uploading if no docs |
| Preview | ⏳ Test with real ID | See outcomes above |

---

## TL;DR

1. Open: `http://localhost:3000/api/admin/test-upload`
2. If documents exist with ✅, use one of those IDs for preview
3. If no documents, go to `/upload` and upload a test file
4. If documents exist with ❌, check server logs for errors

**That's it!** This will tell you exactly what's happening and what to do next.

---

**Time to complete:** 2-5 minutes

**Questions?** Check `UPLOAD_RECOVERY_GUIDE.md` for detailed troubleshooting.
