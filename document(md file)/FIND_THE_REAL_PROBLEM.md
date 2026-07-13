# Find The Real Problem - Interactive Diagnostic

Your problem: **Documents show in table but preview says "Document not found"**

This guide will help you find exactly why.

---

## Step 1: Upload a Test File (2 min)

### A) Go to upload page:
```
http://localhost:3000/upload
```

### B) Upload a file:
- **Title:** "Diagnostic Test"
- **Category:** Any
- **Department:** Any
- **Division:** Any (optional)
- **File:** Any file (test.txt is fine)

### C) You should see:
```
✅ Successfully uploaded 1 file(s)
```

**Copy down the success message time.**

---

## Step 2: Check What's in Database (3 min)

### A) Open admin endpoint:
```
http://localhost:3000/api/admin/test-upload
```

### B) Copy the ENTIRE JSON response and look for:

```json
{
  "documents": [
    {
      "document": {
        "id": "550e8400-e29b-41d4-a716-446655440000"  // ← COPY THIS
      }
    }
  ]
}
```

**Write down:**
- How many documents total?
- How many have `✅ HAS FILE_PATH`?
- The ID of your newly uploaded "Diagnostic Test" document

---

## Step 3: Check File Management Table (2 min)

### A) Go to file management:
```
http://localhost:3000/file-management
```

### B) Look for your "Diagnostic Test" document

**Write down:**
- Do you see it in the table?
- What's the title shown?
- Is there an Eye icon (Preview button)?

---

## Step 4: Try Preview (1 min)

### A) Click the Eye icon for "Diagnostic Test"

### B) What happens?

**Option 1:** Document preview loads ✅
→ **System is working!**

**Option 2:** Alert says "Document not found" ❌
→ **Follow Step 5**

**Option 3:** Some other error
→ **Write it down and check terminal**

---

## Step 5: Check Terminal Logs (5 min)

**WHILE** clicking Preview, watch your `npm run dev` terminal.

### You should see logs like:

#### ✅ If it works:
```
[Preview] Request for document: 550e8400-e29b-41d4-a716-446655440000
[Preview] Document found: { id: "550e8400-...", title: "Diagnostic Test" }
[Preview] Latest version details: { filePath: "/uploads/550e8400-....txt", ... }
[Preview] File loaded successfully, size: 1234 bytes
```

#### ❌ If it fails:
```
[Preview] Request for document: 550e8400-e29b-41d4-a716-446655440000
[Preview] Error: {
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "Document not found",
  "errorType": "Error"
}
```

### Write down exactly what you see in terminal.

---

## Step 6: Compare The IDs (2 min)

**Very important:** Do these 3 match?

1. **ID from /api/admin/test-upload:**
   ```
   550e8400-e29b-41d4-a716-446655440000
   ```

2. **ID shown in terminal when you click Preview:**
   ```
   [Preview] Request for document: 550e8400-e29b-41d4-a716-446655440000
   ```

3. **What you see in File Management table:**
   - Does it match the IDs above?

**If all 3 match but still says "Document not found":**
→ **Go to Step 7**

**If they DON'T match:**
→ **There's an ID corruption issue**

---

## Step 7: Check Database Directly (5 min)

You need to query your database directly. Based on your `.env.local`, find your database tool.

### Query 1: Do documents exist?
```sql
SELECT id, title, status FROM documents ORDER BY created_at DESC LIMIT 5;
```

**Expected:** See your "Diagnostic Test" document

**If empty:** No documents are being saved to database

**If shows documents:** Documents ARE in database

### Query 2: Do versions exist?
```sql
SELECT document_id, file_name, file_path FROM document_versions ORDER BY created_at DESC LIMIT 5;
```

**Expected:** See matching document IDs from Query 1

**If file_path is NULL:** File wasn't saved to disk

### Query 3: Find specific document:
```sql
SELECT * FROM documents WHERE title LIKE '%Diagnostic%';
```

**Expected:** Your upload with exact ID from /api/admin/test-upload

---

## Results Interpretation

### Scenario A: All IDs match, documents in table, database shows documents

```
✅ IDs match everywhere
✅ Documents in /api/admin/test-upload
✅ Documents in File Management table
✅ Documents in database query
❌ But preview says "Document not found"
```

**Problem:** The getDocument() query is failing even though document exists.

**Possible causes:**
- Different database connection
- Permission/RLS issue
- Query logic error

**Solution:** Check database access/permissions

---

### Scenario B: IDs don't match

```
❌ ID in admin endpoint: 550e8400-...
❌ ID shown in terminal: 99999999-...
❌ IDs don't match
```

**Problem:** Document ID is being corrupted between steps.

**Cause:** Data mapping or ID transformation issue in code

**Solution:** Trace where ID changes

---

### Scenario C: Document in table but not in database

```
✅ Shows in File Management table
❌ NOT in /api/admin/test-upload
❌ NOT in database query
```

**Problem:** Table is showing stale/cached data

**Cause:** Caching issue or documents table is different source

**Solution:** Clear cache, check data source

---

### Scenario D: Database empty

```
❌ /api/admin/test-upload returns empty
❌ Database query returns no rows
❌ File Management table shows nothing
```

**Problem:** Documents aren't being saved during upload

**Cause:** Upload process fails silently

**Solution:** Check upload logs for errors

---

## What to Report

When you've done all 7 steps, tell me:

1. **Upload result:** Success or failed?
2. **Admin endpoint:** How many documents? IDs?
3. **File Management:** Shows documents?
4. **Preview:** Works or says "Document not found"?
5. **Terminal logs:** What exact errors?
6. **ID comparison:** Match or different?
7. **Database query:** Shows documents? With file_path?

**With this info, I can pinpoint the exact problem.**

---

## Quick Diagnostic Command (Advanced)

If you have curl installed:

```bash
# 1. Check admin endpoint
curl http://localhost:3000/api/admin/test-upload

# 2. Try preview with first document ID from above
# Replace [ID] with actual ID:
curl http://localhost:3000/api/documents/[ID]/preview

# 3. Check response
# If it says "Document not found" in response, same error
# If it shows file content, it works!
```

---

## Common Findings & Their Meanings

| Finding | Means | Solution |
|---------|-------|----------|
| Upload works, admin shows docs, preview fails | Query mismatch or permissions | Check DB access |
| Upload works, admin empty, preview fails | Documents not saved to DB | Check upload logs |
| All IDs match, preview fails | Connection/permission issue | Check DB credentials |
| IDs don't match anywhere | Data corruption in flow | Trace ID through code |
| File Management empty but admin has docs | Cache/display issue | Clear cache |
| Database query returns NULL file_path | File not saved to disk | Check FileStorageService logs |

---

## Timeline to Find Problem

| Step | Time | What you learn |
|------|------|---|
| 1. Upload test | 2 min | Does upload work? |
| 2. Check admin | 3 min | What's actually in DB? |
| 3. Check table | 2 min | Does UI show it? |
| 4. Try preview | 1 min | Works or fails? |
| 5. Check logs | 5 min | What's the error? |
| 6. Compare IDs | 2 min | Are they consistent? |
| 7. Query DB | 5 min | Truth about DB state |

**Total: ~20 minutes to pinpoint exact problem**

---

## Next Action

**Start with Step 1** and work through sequentially.

When you have findings from all 7 steps, come back and tell me what you found.

**I can then tell you exactly what's wrong and how to fix it.**

---

## Example: What a Complete Report Looks Like

```
Step 1: Upload succeeded ✅
Step 2: /api/admin/test-upload shows 1 document
        ID: 550e8400-e29b-41d4-a716-446655440000
        Status: ✅ HAS FILE_PATH
Step 3: File Management shows "Diagnostic Test" 
Step 4: Click Preview → Alert "Document not found" ❌
Step 5: Terminal shows:
        [Preview] Request for: 550e8400-...
        [Preview] Error: Document not found
Step 6: IDs match perfectly everywhere ✅
Step 7: Database query shows:
        documents table: HAS the document ✅
        document_versions table: HAS the document ✅
        file_path: /uploads/550e8400-....txt ✅
```

**Conclusion:** Document exists everywhere, but getDocument() query fails.
**Problem:** Likely database connection or permission issue.

---

**Ready to diagnose? Start with Step 1!**
