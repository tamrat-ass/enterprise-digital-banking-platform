# Document Upload System - Final Fix Summary

## Problem
Document uploads were failing with a "Failed query" error when trying to insert document versions into the database.

## Root Cause
**Drizzle ORM's insert builder was generating incorrect SQL** for the `document_versions` table:
- When fields with `.default()` in the schema (like `pdfPath` and `createdAt`) were omitted from the `.values()` object, Drizzle would still include them in the INSERT statement with the keyword `default`
- Example broken SQL:
  ```sql
  INSERT INTO document_versions (..., pdf_path, ..., created_at) 
  VALUES (..., default, ..., default)
  ```
- PostgreSQL would reject this because `default` is not a valid value in an INSERT statement

## Solution

### 1. **Use Raw SQL for Document Version Inserts** (Primary Fix)
Replaced Drizzle ORM's insert builder with raw SQL for inserting document versions:

**Before (Broken):**
```typescript
await db.insert(documentVersions).values({
  id: versionId,
  documentId: documentId,
  version: 1,
  changeNote: "Initial version",
  fileName: fileMetadata?.fileName,
  authorId: userId,
  authorName: userName,
})
```

**After (Fixed):**
```typescript
await db.execute(sql`
  INSERT INTO document_versions 
    (id, document_id, version, change_note, file_name, file_path, author_id, author_name)
  VALUES 
    (${versionId}, ${documentId}, 1, 'Initial version', ${fileName}, ${filePath}, ${userId}, ${userName})
  RETURNING id, document_id, version
`)
```

### 2. **Fixed Schema Definition**
Updated `lib/db/schema.ts` to use consistent default handling:
```typescript
export const documentVersions = pgTable("document_versions", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  version: integer("version").notNull(),
  changeNote: text("change_note"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  pdfPath: text("pdf_path"),  // Removed .default() - nullable without explicit default
  authorId: text("author_id"),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),  // SQL-level default
})
```

## Files Modified

1. **`lib/services/document.service.ts`**
   - Replaced Drizzle `db.insert()` with `db.execute(sql`...`)` for document version inserts
   - Updated verification code to use raw SQL reads
   - Added detailed logging for debugging

2. **`lib/db/schema.ts`**
   - Removed `.default(sql`null`)` from `pdfPath`
   - Changed `createdAt` to use `default(sql`CURRENT_TIMESTAMP`)` instead of `.defaultNow()`

3. **`app/api/admin/create-tables/route.ts`**
   - Added GET endpoint to check which tables exist
   - Enhanced POST to create all required tables (documents, document_versions, document_categories)

4. **`app/api/admin/test-upload/route.ts`**
   - Added detailed error logging and diagnostics
   - Raw SQL fallback queries for debugging

5. **`app/api/admin/test-insert/route.ts`** (New)
   - Created to demonstrate working raw SQL insert
   - Shows the difference between broken Drizzle insert and working raw SQL

## How to Verify the Fix

1. **Clear test data** (optional):
   ```
   POST http://localhost:3000/api/admin/test-upload
   Body: {"action":"clear-all"}
   ```

2. **Upload a document** via the UI:
   - Go to http://localhost:3000/upload
   - Select a file and upload

3. **Check the database**:
   ```
   GET http://localhost:3000/api/admin/test-upload
   ```
   - Should see documents with file_path populated
   - Look for `✅ HAS FILE_PATH` status

## Testing Endpoints

- `GET /api/admin/health` - Database connection health check
- `GET /api/admin/create-tables` - Check which tables exist
- `POST /api/admin/create-tables` - Create missing tables
- `GET /api/admin/test-upload` - Diagnostic endpoint for documents and versions
- `POST /api/admin/test-insert` - Test raw SQL insert (demonstrates the fix)

## Impact

✅ Uploads now work correctly
✅ File paths are properly stored in the database
✅ Document versions can be previewed
✅ No changes needed on the frontend
✅ Raw SQL is parameterized (no SQL injection risk)

## Next Steps

1. Migrate to use raw SQL inserts for any other Drizzle ORM insert operations that have similar issues
2. Consider upgrading Drizzle ORM if a newer version fixes the insert builder issue
3. Add unit tests to verify insert/select operations work correctly
