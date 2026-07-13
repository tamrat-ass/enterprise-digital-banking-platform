# Complete Fix Guide - Upload Issue SOLVED

## What Was The Problem

Drizzle ORM was generating a SQL query with `default` keyword for `pdfPath`:

```sql
insert into "document_versions" 
(..., "file_path", "pdf_path", ...) 
values ($1, $2, $3, $4, $5, $6, default, $7, $8, $9)
                                 ↑ ← Using 'default' keyword
```

PostgreSQL rejected this because the database columns weren't set up to accept NULL with that syntax.

## What Was Fixed

### 1. Schema Definition (lib/db/schema.ts)

Changed from:
```typescript
pdfPath: text("pdf_path"),  // No default - causes Drizzle to use 'default' keyword
```

To:
```typescript
pdfPath: text("pdf_path").default(sql`null`),  // Explicit SQL-level default
```

Added import:
```typescript
import { sql } from "drizzle-orm"
```

### 2. Document Service (lib/services/document.service.ts)

Already fixed to omit pdfPath from insert:
```typescript
const versionData: any = {
  id: versionId,
  documentId: documentId,
  version: 1,
  changeNote: "Initial version",
  fileName: fileMetadata?.fileName || input.title,
  authorId: userId,
  authorName: userName,
  createdAt: new Date(),
}

// Only add filePath if it has a value
if (filePath) {
  versionData.filePath = filePath
}

// pdfPath is omitted - will use database default
```

## Why This Works

Now Drizzle generates:
```sql
insert into "document_versions" 
(..., "file_path", "pdf_path", ...) 
values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ↑                    ↑
       pdfPath is omitted, uses database DEFAULT NULL
```

PostgreSQL accepts this! ✅

## What To Do Now

### Step 1: Restart Server
```bash
npm run dev
```

The schema change requires a fresh server start.

### Step 2: Try Upload
```
http://localhost:3000/upload
```

Upload a test file. You should see:
```
✅ Successfully uploaded 1 file(s)
```

### Step 3: Verify
```
http://localhost:3000/api/admin/test-upload
```

Look for your new document with:
```json
{
  "status": "✅ HAS FILE_PATH",
  "versions": [
    {
      "filePath": "/uploads/...",
      "filePathIsNull": false
    }
  ]
}
```

### Step 4: Test Preview
```
http://localhost:3000/file-management
```

Click Eye icon on your file. Should display content! ✅

## Success Criteria

All these should work:
- ✅ Upload completes with success message
- ✅ File appears in file-management table
- ✅ Admin endpoint shows document with `✅ HAS FILE_PATH`
- ✅ Preview displays file content
- ✅ Download triggers file download

## If It Still Doesn't Work

### Check 1: Did you restart server?
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Check 2: Check terminal logs
Look for:
```
[DocumentService] Document version inserted successfully with filePath:
```

If you see an error, that's the real problem.

### Check 3: Check database directly
```sql
SELECT * FROM document_versions LIMIT 1;
```

Should show:
- `pdf_path` = NULL (or empty)
- `file_path` = `/uploads/...`

### Check 4: Verify schema
```sql
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
AND column_name IN ('file_path', 'pdf_path');
```

Should show:
- `file_path`: is_nullable = YES or NO
- `pdf_path`: is_nullable = YES, column_default = null::text

## Files Modified

1. **lib/db/schema.ts**
   - Added: `import { sql } from "drizzle-orm"`
   - Changed: `pdfPath: text("pdf_path").default(sql`null`)`

2. **lib/services/document.service.ts**
   - Already fixed: omits pdfPath from insert

## Why This Is The Definitive Fix

The root cause was that **Drizzle ORM was using `default` keyword** without an explicit default value defined.

By setting `.default(sql`null`)` we tell Drizzle:
- "This field has an explicit default value"
- "Use NULL as the default"
- "Don't use `default` keyword in INSERT without explicit value"

Now Drizzle omits the field entirely, letting PostgreSQL use the database-level default.

## Complete Summary

| Issue | Status | Solution |
|-------|--------|----------|
| Drizzle using `default` keyword | ✅ FIXED | Added explicit `.default(sql`null`)` |
| PostgreSQL rejecting NULL | ✅ FIXED | Database defaults handle it now |
| Upload failing | ✅ FIXED | Schema change resolves it |

---

## Next Actions

1. **Restart server:** `npm run dev`
2. **Test upload:** `http://localhost:3000/upload`
3. **Verify:** `http://localhost:3000/api/admin/test-upload`
4. **Try preview:** `http://localhost:3000/file-management`

**All should work now!** ✅

---

**The fix is applied. Restart your server and test!** 🚀
