# Why "Document not found" Happens - Root Cause Analysis

## The Real Problem

When you click **Preview** on a document in the File Management table, you're getting "Document not found" alert. Here's the **exact sequence** of what's happening:

---

## Step-by-Step Breakdown

### 1. File Management Table Loads
```
User opens /file-management
  ↓
fetchDocuments() server action runs
  ↓
DocumentService.listDocuments() queries database
  ↓
Returns documents FROM DATABASE
```

### 2. Documents Are Displayed
The table shows documents that came from the database. Each has an `id` field.

### 3. User Clicks Preview
```
User clicks Eye icon
  ↓
handleViewFile(fileId, file) is called
  ↓
fileId = document.id (from table)
  ↓
Sends: GET /api/documents/{fileId}/preview
```

### 4. Preview Endpoint Gets 404
```
Preview route receives fileId
  ↓
Calls: DocumentService.getDocument(fileId)
  ↓
Queries: SELECT FROM documents WHERE id = fileId
  ↓
Result: NO ROWS FOUND
  ↓
Throws: "Document not found"
  ↓
Returns: 404 error
  ↓
Alert: "Document not found"
```

---

## Why Document Exists in Table But Not in Preview

### Possibility 1: Query Returns Different Data Than What's Stored
```
listDocuments() returns: [{ id: "ABC", title: "Doc1" }]
But getDocument("ABC") finds: Nothing

This could mean:
- Different database connections
- Data cache issue
- Race condition
```

### Possibility 2: Document Is Being Soft-Deleted
```
Document inserted: status = "draft"
But listDocuments() filters by status
And getDocument() doesn't apply the same filter

So: Document exists but filter hides it
But when you click it, different query logic applies
```

### Possibility 3: The ID Shown in Table Is Not The Real ID
```
Table shows: "Test Document"
But the ID associated with it is wrong
Or ID gets corrupted during display
```

### Possibility 4: Documents Table vs Document_Versions Mismatch
```
Document inserted into documents table
But NOT inserted into document_versions table
And getDocument() joins these tables
So document appears in listDocuments() but fails in getDocument()
```

---

## The Most Likely Cause

Looking at the code, here's what I believe is happening:

### In `listDocuments()`:
```typescript
const [docs, [{ total }]] = await Promise.all([
  db.select().from(documents)   // ← Gets ALL documents
    .where(where)
    .orderBy(desc(documents.createdAt))
    .limit(limit)
    .offset(offset),
  // ...
])

return { data: docs, ... }  // ← Returns documents directly
```

This returns documents that match the filter.

### In `getDocument()`:
```typescript
const doc = await db.query.documents.findFirst({
  where: eq(documents.id, documentId),
})

if (!doc) throw new Error("Document not found")  // ← 404 ERROR HERE

const versions = await db.query.documentVersions.findMany({
  where: eq(documentVersions.documentId, documentId),
  ...
})
```

**THE ISSUE:** If the document was somehow deleted or doesn't actually exist in the database, but the LIST query still returns it (due to caching or different data source), then:
- Document shows in table
- But doesn't exist in database
- So preview fails

---

## The Real Root Cause

### Most Likely: **Database Synchronization Issue**

The file management table shows documents that might be:
1. From a stale cache
2. From a different database view
3. Not actually committed to the database yet

When preview tries to access the same document directly, it can't find it because:
- The document was never actually saved to the database
- OR it was saved but in a different partition/schema
- OR there's a read/write consistency issue

### Evidence:
```
[FileManagementTable] Files from server action: [array of 5 items]
  ↓
User clicks Preview on item #3
  ↓
[Preview] Request for document: cfff87a7-...
[Preview] Error: { error: "Document not found" }
```

The document was in the response but can't be found individually.

---

## Why This Keeps Happening

### Scenario 1: Upload Succeeds But Document Never Actually Saved
```
uploadForm sends FormData
  ↓
API route creates DocumentService.createDocument()
  ↓
Returns success to frontend ✅
  ↓
BUT database insert actually failed silently
  ↓
OR database insert worked but for wrong document
  ↓
Frontend thinks it worked
  ↓
User sees doc in list (from cache)
  ↓
Can't preview (not actually in DB)
```

### Scenario 2: Different Data Sources
```
listDocuments() reads from: connection A
getDocument() reads from: connection B (or different replica)
They're out of sync
```

### Scenario 3: Permissions/Row-Level Security
```
User can see document in list
But can't access it directly
Due to RLS or permission filtering
```

---

## How to Actually Fix This

### Step 1: Verify Upload Success
Before clicking Preview:
1. Go to: `http://localhost:3000/api/admin/test-upload`
2. Look at the JSON response
3. Find the document ID shown
4. **Check if it matches what's in the File Management table**

### Step 2: Check Terminal Logs During Upload
```
[POST Documents] Request started
[DocumentService] Creating document:
[FileStorageService] File written successfully
[DocumentService] Document version inserted successfully
```

**If you see errors here**, the upload failed.

### Step 3: Query Database Directly
```sql
SELECT id, title, status FROM documents LIMIT 10;
SELECT document_id, file_name FROM document_versions LIMIT 10;
```

**If empty**, documents aren't being saved.

### Step 4: Check If IDs Match
```
ID shown in file-management table vs
ID returned by /api/admin/test-upload vs
ID in database query
```

**If they don't match**, there's a data mapping issue.

---

## The Real Fix

### What I Need to Do:

1. **Make `getDocument()` return the same documents as `listDocuments()`**
   
   OR

2. **Add detailed logging to show data flows match**
   
   OR

3. **Verify the document actually exists before trying to preview**

### What You Need to Do:

**Run this diagnostic:**

1. Upload a file
2. Note the exact ID from `/api/admin/test-upload`
3. Go to File Management and see if that ID is shown
4. Click Preview and watch terminal logs
5. Check if ID in logs matches what you expected

**Report what you find:**
- Does uploaded document show in File Management?
- What's the ID in the test endpoint vs table?
- What's in the terminal logs?
- What database query returns?

---

## Why It's Happening Now

The document ID `cfff87a7-f066-4def-848a-13199d49b781` was in:
- ✅ File Management table (so `listDocuments()` returned it)
- ❌ Preview route (so `getDocument()` couldn't find it)

**This means:**
- `listDocuments()` and `getDocument()` are querying different data
- OR document was deleted after list loaded
- OR there's a database replication/sync issue
- OR the ID is being corrupted somewhere

---

## Next Diagnostic Steps

To confirm what's actually happening, I need you to:

1. **Check file-management logs:**
   ```
   [FileManagementTable] Files from server action: [...]
   ```
   Look for the documents returned.

2. **Check preview logs:**
   ```
   [Preview] Request for document: [ID]
   [Preview] Error: { error: "Document not found" }
   ```

3. **Check database:**
   ```sql
   SELECT id FROM documents WHERE id = 'cfff87a7-f066-4def-848a-13199d49b781';
   ```
   Does this return anything?

4. **Compare IDs:**
   - What's shown in File Management table title bar
   - What's in `/api/admin/test-upload`
   - What's in the terminal log when you click Preview

**If they all match but preview still fails:**
- Database connection issue
- Permission/RLS filtering
- Data model mismatch

**If they don't match:**
- ID corruption in data flow
- Multiple document sources
- Cache issue

---

## Summary

**Why it happens:**
- File Management table shows documents from database
- Preview endpoint can't find the same documents
- This means the two queries are returning different data

**Most likely cause:**
- Upload process succeeded but document wasn't actually saved to database
- Or document was saved but to a different database/partition
- Or there's a read/write consistency issue

**How to diagnose:**
- Check `/api/admin/test-upload` for real documents in DB
- Verify IDs match between table and API responses
- Check terminal logs for any errors
- Query database directly to see what exists

**How to fix:**
- Ensure upload actually saves document to database
- Ensure all queries access the same database
- Ensure data flows are consistent

---

**Bottom line:** The document exists somewhere (since it's in the list), but not where the preview endpoint is looking for it. This suggests a data sync or query logic issue.
