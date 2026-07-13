# Debug SQL Queries - Run These Now!

Use these SQL queries to diagnose the file_path issue in your database.

---

## Query 1: Check ALL Documents and Their File Paths

```sql
SELECT 
  d.id,
  d.title,
  d.department_id,
  d.division_id,
  dv.file_path,
  dv.file_name,
  d.created_at,
  CASE 
    WHEN dv.file_path IS NULL THEN '❌ NO FILE PATH'
    WHEN dv.file_path = '' THEN '❌ EMPTY FILE PATH'
    ELSE '✅ HAS FILE PATH: ' || dv.file_path
  END as file_status
FROM documents d
LEFT JOIN document_versions dv 
  ON d.id = dv.document_id 
  AND dv.version = (
    SELECT MAX(version) FROM document_versions 
    WHERE document_id = d.id
  )
ORDER BY d.created_at DESC
LIMIT 20;
```

**What to look for**:
- How many show `❌ NO FILE PATH`?
- How many show `✅ HAS FILE PATH`?
- If all show NULL or empty, that's your problem!

---

## Query 2: Count Documents With/Without Files

```sql
SELECT 
  CASE 
    WHEN file_path IS NULL THEN 'NULL'
    WHEN file_path = '' THEN 'EMPTY'
    ELSE 'HAS PATH'
  END as path_status,
  COUNT(*) as count
FROM (
  SELECT DISTINCT ON (d.id) 
    d.id,
    dv.file_path
  FROM documents d
  LEFT JOIN document_versions dv 
    ON d.id = dv.document_id
  ORDER BY d.id, dv.version DESC
) sub
GROUP BY path_status
ORDER BY count DESC;
```

**Example Output**:
```
path_status | count
NULL        | 15     ← Problems!
HAS PATH    | 5      ← Good!
EMPTY       | 0
```

---

## Query 3: Find a Specific Document's File Path

```sql
-- Replace 'YOUR_DOCUMENT_ID' with an actual document ID
SELECT 
  d.id,
  d.title,
  d.created_at,
  dv.version,
  dv.file_path,
  dv.file_name,
  dv.author_name,
  dv.created_at as version_created_at
FROM documents d
LEFT JOIN document_versions dv 
  ON d.id = dv.document_id
WHERE d.id = 'YOUR_DOCUMENT_ID'
ORDER BY dv.version DESC;
```

**Usage**:
```sql
-- Example with a real ID:
SELECT ... WHERE d.id = '550e8400-e29b-41d4-a716-446655440000'
```

---

## Query 4: Check Database Column Definitions

```sql
-- Verify that file_path column exists and is the right type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'document_versions'
ORDER BY ordinal_position;
```

**Expected output should include**:
```
column_name    | data_type | is_nullable
id             | uuid      | NO
document_id    | uuid      | NO
version        | integer   | NO
file_path      | character varying | YES   ← Look for this!
file_name      | character varying | YES
...
```

**If `file_path` is missing**: You need to add the column!

---

## Query 5: Add Missing file_path Column (If Needed)

**Only run this if Query 4 showed `file_path` is missing:**

```sql
ALTER TABLE document_versions 
ADD COLUMN file_path VARCHAR(255) DEFAULT NULL;
```

---

## Query 6: Check Latest Version For Each Document

```sql
SELECT 
  d.id,
  d.title,
  MAX(dv.version) as latest_version,
  dv.file_path
FROM documents d
LEFT JOIN document_versions dv 
  ON d.id = dv.document_id
GROUP BY d.id, d.title, dv.file_path
ORDER BY d.created_at DESC
LIMIT 20;
```

---

## Query 7: Find Documents With Null file_path

```sql
SELECT 
  d.id,
  d.title,
  d.owner_name,
  d.created_at,
  COUNT(dv.id) as version_count
FROM documents d
LEFT JOIN document_versions dv 
  ON d.id = dv.document_id
  AND dv.file_path IS NULL
GROUP BY d.id, d.title, d.owner_name, d.created_at
ORDER BY d.created_at DESC;
```

---

## Query 8: Update Old Documents With File Path (Manual Fix)

**⚠️ ONLY if you have actual files in /public/uploads/ directory:**

```sql
-- First, check what files exist
SELECT file_path FROM document_versions 
WHERE file_path IS NOT NULL 
LIMIT 5;
-- This shows the naming pattern

-- Then manually update a document:
UPDATE document_versions 
SET file_path = '/uploads/550e8400-e29b-41d4-a716-446655440000.pdf'
WHERE document_id = '550e8400-e29b-41d4-a716-446655440000'
AND version = 1;

-- Verify:
SELECT file_path FROM document_versions 
WHERE document_id = '550e8400-e29b-41d4-a716-446655440000';
-- Should show: /uploads/550e8400-e29b-41d4-a716-446655440000.pdf
```

---

## Quick Test Queries

### Test 1: Get latest 5 documents with their file status

```sql
SELECT 
  d.id,
  d.title,
  (SELECT file_path FROM document_versions 
   WHERE document_id = d.id 
   ORDER BY version DESC LIMIT 1) as latest_file_path
FROM documents d
ORDER BY d.created_at DESC
LIMIT 5;
```

### Test 2: Check if file_path column allows NULL values

```sql
SELECT 
  is_nullable,
  column_name
FROM information_schema.columns
WHERE table_name = 'document_versions' 
AND column_name = 'file_path';
```

**Expected**: `is_nullable = YES`

If `is_nullable = NO`, the column has a NOT NULL constraint, which could cause insert failures.

### Test 3: Count total documents vs documents with files

```sql
SELECT 
  (SELECT COUNT(*) FROM documents) as total_documents,
  (SELECT COUNT(DISTINCT d.id) FROM documents d
   JOIN document_versions dv ON d.id = dv.document_id
   WHERE dv.file_path IS NOT NULL) as docs_with_files;
```

**Example output**:
```
total_documents | docs_with_files
20              | 5    ← Only 5 out of 20 have files!
```

---

## How to Run These Queries

### Using psql (Command Line)

```bash
# Connect to database
psql -U postgres -d ahadufile -h localhost

# Then paste the SQL query and press Enter
# Press Ctrl+D to exit
```

### Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on database "ahadufile" 
3. Select "Query Tool"
4. Paste query
5. Click "Execute" button (F5)

### Using DBeaver (GUI)

1. Open DBeaver
2. Right-click on "ahadufile" database
3. Select "SQL Editor" 
4. New SQL Script
5. Paste query
6. Click "Execute" (Ctrl+Enter)

---

## Sample Results & What They Mean

### Good Result (Preview Should Work)
```
id                | title          | file_path
550e8400-...      | Policy         | /uploads/550e8400-...pdf
6ba7b810-...      | Budget         | /uploads/6ba7b810-...xlsx
```
✅ Files are stored properly!

### Bad Result #1 (Preview Won't Work)
```
id                | title          | file_path
550e8400-...      | Policy         | (NULL)
6ba7b810-...      | Budget         | (NULL)
```
❌ All documents missing file_path!

### Bad Result #2 (Partially Stored)
```
id                | title          | file_path
550e8400-...      | Policy         | /uploads/550e8400-...pdf
6ba7b810-...      | Budget         | (NULL)
```
⚠️ Some work, some don't - inconsistent storage

### Bad Result #3 (Empty Strings)
```
id                | title          | file_path
550e8400-...      | Policy         | 
6ba7b810-...      | Budget         | 
```
❌ Empty string instead of NULL or path

---

## Run This First

```sql
-- Single query that gives you the complete picture:
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END) as with_files,
  SUM(CASE WHEN file_path IS NULL THEN 1 ELSE 0 END) as without_files,
  ROUND(100.0 * SUM(CASE WHEN file_path IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 1) as percent_with_files
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

**This tells you instantly**:
- How many documents total
- How many have files
- How many are missing files
- The percentage with files

---

## Next Steps Based on Results

### If percent_with_files = 0%
- All documents are missing file_path
- Either: Column was never populated OR file save is failing for all new uploads
- **Action**: Check FileStorageService logs

### If percent_with_files = 100%
- All documents have file paths
- Preview should work!
- If still not working, check: File exists on disk? Browser cache?

### If 0% < percent_with_files < 100%
- Some uploads stored files, some didn't
- Likely: File storage started working at some point
- **Action**: Check which time period had failures

---

**Run these queries now and share the results!**
This will tell us exactly what's happening. 🔍
