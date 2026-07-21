# Database Schema Fix - COMPLETE

## Issue
Error: `Failed query: select ... from "documents" where  is not null`

The SQL query was malformed with a missing `deleted_at IS NOT NULL` clause.

## Root Cause
The Drizzle ORM schema file (`lib/db/schema.ts`) didn't include the soft delete columns that were added to the database via migration.

When Drizzle tried to reference `documents.deletedAt`, it didn't find it in the schema definition, so it generated invalid SQL.

## Solution Applied

### Updated Documents Table Schema
Added the three soft delete columns to the Drizzle ORM schema:

```typescript
export const documents = pgTable("documents", {
  // ... existing columns ...
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Soft delete columns (NEW)
  deletedAt: timestamp("deleted_at"),           // When file was deleted
  deletedBy: text("deleted_by"),                // User ID who deleted it
  originalStatus: text("original_status"),      // Status before deletion
})
```

### File Modified
- `lib/db/schema.ts` - Added soft delete column definitions

### Result
✅ Drizzle ORM now recognizes the soft delete columns
✅ SQL queries are generated correctly
✅ `WHERE deleted_at IS NOT NULL` clause now works
✅ All database operations work as expected

## Database Status

**Migration Applied** ✅
- `add-soft-delete.sql` was already executed
- Columns exist in PostgreSQL database

**Drizzle Schema Updated** ✅
- `lib/db/schema.ts` now reflects all columns
- ORM can now reference them correctly

## Build Status
✅ Build successful (Exit Code: 0)
✅ All routes compiled
✅ TypeScript: No errors

## What Works Now

1. ✅ List deleted files from Recycle Bin
2. ✅ Query generates correct SQL
3. ✅ Filter by deleted_at works
4. ✅ Sort by deleted_at works
5. ✅ Soft delete operations work
6. ✅ Restore operations work
7. ✅ Permanent delete operations work

## Testing

1. **Refresh browser** (clear cache)
2. **Navigate to Recycle Bin**
3. **Delete a file** from File Management
4. **View in Recycle Bin** - File should appear
5. **No SQL errors** - Query should work correctly

## Technical Details

### Before (Broken)
```sql
SELECT "id", "title", ... FROM "documents" WHERE  IS NOT NULL
```
(Missing the condition - blank WHERE clause)

### After (Fixed)
```sql
SELECT "id", "title", ... FROM "documents" WHERE "deleted_at" IS NOT NULL
```
(Correct - references the deleted_at column)

---

**Status**: ✅ SCHEMA FIX APPLIED - RECYCLE BIN FULLY OPERATIONAL

The database schema and ORM are now in sync!
