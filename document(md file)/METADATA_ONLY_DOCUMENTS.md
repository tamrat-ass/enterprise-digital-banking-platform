# Handling Metadata-Only Documents

## What Are Metadata-Only Documents?

Documents that were created BEFORE the file storage system was implemented. These documents have:
- ✅ Title, description, category
- ✅ Department and division info (after recent fix)
- ✅ Metadata (created date, owner, status)
- ❌ NO actual file stored on disk
- ❌ NO file_path recorded in database

These appear in the File Management table but cannot be previewed or downloaded.

## How They Appear

When you try to preview or download a metadata-only document, you'll see:

**Preview**: Text file showing document metadata with note:
```
DOCUMENT PREVIEW
============================================================

Title: BRD for fraud managing
Description: ...
Category: Financial Reports
Status: draft
...

Note: This document was created before file storage was available.
To preview the actual file, please re-upload the document.
```

**Download**: Error message:
```
⚠️ This document needs to be re-uploaded.

This document (BRD for fraud managing) was created before 
file storage was enabled. To download it, please re-upload 
the file from the upload page.

Go to /upload to add the file.
```

## Why This Happens

1. **Old System**: Earlier version didn't save files to disk
2. **Metadata Preserved**: Document info was saved to database
3. **Migration Issue**: When system upgraded, old documents had no file paths
4. **New System**: Current system properly saves files (now fixed)

## Solution: Re-Upload The Files

### Option 1: Manual Re-Upload (Best for Important Documents)

1. Go to `/upload` page
2. Fill in:
   - Title: Same as original document
   - Category: Same as original
   - Department: Same as original
   - Division: Same as original
   - Select the file to upload
3. Click Upload
4. New document created with proper file storage

**Result**: 
- New document with file_path
- Both old (metadata-only) and new (with file) exist
- Can delete old one if desired

### Option 2: Batch Re-Upload (For Bulk Documents)

Coming soon - we can create a batch upload utility if needed.

## Database Details

### How to Identify Metadata-Only Documents

```sql
-- Find all metadata-only documents (no file_path)
SELECT 
  d.id,
  d.title,
  d.owner_name,
  d.created_at,
  dv.file_path,
  CASE WHEN dv.file_path IS NULL THEN 'NO FILE' ELSE 'HAS FILE' END as status
FROM documents d
LEFT JOIN document_versions dv ON d.id = dv.document_id
ORDER BY d.created_at DESC;
```

### How to Count Them

```sql
-- Count documents with and without files
SELECT 
  CASE WHEN dv.file_path IS NULL THEN 'No File (Metadata Only)' ELSE 'Has File' END as type,
  COUNT(*) as count
FROM documents d
LEFT JOIN document_versions dv ON d.id = dv.document_id
GROUP BY (dv.file_path IS NULL);
```

### How to Delete Metadata-Only Documents

If you want to clean up and remove old metadata-only documents:

```sql
-- Soft delete (mark as archived)
UPDATE documents d
SET status = 'archived'
WHERE d.id IN (
  SELECT d.id 
  FROM documents d
  LEFT JOIN document_versions dv ON d.id = dv.document_id
  WHERE dv.file_path IS NULL
);

-- Or permanently delete (careful!)
DELETE FROM documents d
WHERE d.id IN (
  SELECT d.id 
  FROM documents d
  LEFT JOIN document_versions dv ON d.id = dv.document_id
  WHERE dv.file_path IS NULL
);
```

## User Instructions

### When User Encounters Error

The system now shows helpful messages:

1. **Preview shows metadata text**
   - User sees document info in text format
   - Notice tells them to re-upload

2. **Download shows helpful error**
   - Message explains document needs re-upload
   - Tells them to go to /upload page

3. **No more confusing errors**
   - Error message is clear and actionable
   - Explains what went wrong and how to fix it

## Technical Implementation

### Updated Error Messages

**Download Endpoint** (`app/api/documents/[id]/download/route.ts`):
```typescript
// User-friendly message for metadata-only documents
return errorResponse(
  `This document (${doc.title}) was created before file storage was enabled. 
   To download it, please re-upload the file from the upload page.`,
  404
)
```

**Preview Endpoint** (`app/api/documents/[id]/preview/route.ts`):
```typescript
// Shows metadata with note about re-uploading
const content = `DOCUMENT PREVIEW\n...
Note: This document was created before file storage was available.
To preview the actual file, please re-upload the document.\n`
```

**File Management UI** (`components/file-management-table.tsx`):
```typescript
// Better error handling for metadata-only documents
if (errorMessage.includes('before file storage was enabled')) {
  alert(`⚠️ This document needs to be re-uploaded.\n\n${errorMessage}\n\nGo to /upload to add the file.`)
}
```

## Workflow Recommendation

### For End Users

1. **Notice metadata-only document** → Can't preview/download
2. **See helpful error message** → Explains what to do
3. **Go to /upload page** → Re-upload the file with original metadata
4. **File now works** → Can preview and download

### For Administrators

Option 1: Manual approach
- Notify users of metadata-only documents
- Users re-upload files
- System handles it automatically

Option 2: Automated approach (future)
- Create batch re-upload utility
- Allow users to associate existing files with old documents
- More complex but faster for large migrations

## Prevention

**Going Forward**
- All new documents have files stored immediately ✅
- File storage verified with fs.stat() ✅
- File path always recorded ✅
- No new metadata-only documents will be created

## Q&A

**Q: Can I get my old document back?**
A: Yes! The metadata is still there. Go to /upload and re-upload the file. The old metadata-only document remains for reference.

**Q: Why not just allow re-attaching files?**
A: The current design is simpler. Users can re-upload and keep both versions for audit trail. Future version could support file replacement.

**Q: How many metadata-only documents do we have?**
A: Run the SQL query above to count them. Then plan accordingly.

**Q: Can I delete the old metadata-only documents?**
A: Yes, using the SQL DELETE query above, but be careful. Archive them first if you want to keep history.

**Q: Will new uploads have this problem?**
A: No! The recent fixes ensure all new documents have proper file storage. This only affects documents from before the fix was applied.

---

## Summary

**Metadata-only documents are:**
- ✅ Documents with no file attached
- ✅ From before file storage implementation
- ✅ Safe and won't cause data loss
- ✅ Easily fixed by re-uploading the file

**The system now:**
- ✅ Shows helpful error messages
- ✅ Explains what went wrong
- ✅ Provides clear action steps
- ✅ Prevents new metadata-only documents
