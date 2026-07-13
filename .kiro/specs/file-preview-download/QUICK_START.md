# Quick Start: File Preview and Download Implementation

## TL;DR

System is **95% complete** - most code is already implemented. You just need to:
1. **Verify** database schema has `pdf_path` column
2. **Test** the complete flow
3. **Fix** any issues found during testing

---

## 5-Minute Setup

### Step 1: Verify Database Schema
```bash
# Open database studio
npm run db:studio

# In the UI, check if document_versions table has:
# - pdf_path column (VARCHAR, nullable)
# - If NOT present, see "Database Fix" section below
```

### Step 2: Verify Environment Config
```bash
# Check .env.local has CloudConvert API key
grep CLOUDCONVERT_API_KEY .env.local

# Should output something like:
# CLOUDCONVERT_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Step 3: Start Dev Server
```bash
npm run dev

# Server should start at http://localhost:3000
# Watch console for [Preview] and [PDFConversion] logs
```

---

## Testing the Flow (10 minutes)

### Test 1: Upload and Preview Word File

**Steps**:
1. Go to `/upload` (or document upload page)
2. Upload a `.docx` file (test file: "TestDocument.docx")
3. Wait for upload to complete
4. Go to documents list
5. Click the **Eye icon** (Preview button)
6. **Expected**: PDF opens in new tab

**Console Logs to Expect**:
```
[Preview] Request for document: abc123...
[Preview] File check: { fileName: 'TestDocument.docx', extension: 'docx', needsConversion: true, hasPdfPath: false }
[Preview] No PDF found, attempting on-the-fly conversion...
[PDFConversion] Converting with CloudConvert: { fileName: 'TestDocument.docx', documentId: 'abc123...' }
[PDFConversion] Creating CloudConvert task...
[PDFConversion] Task created, ID: xxxxxx
[PDFConversion] File uploaded successfully
[PDFConversion] Waiting for conversion to complete...
[PDFConversion] Task finished
[PDFConversion] Downloading converted PDF from: https://...
[PDFConversion] CloudConvert conversion successful: /uploads/abc123.pdf
[Preview] On-the-fly conversion successful: /uploads/abc123.pdf
[Preview] Loading file from: { path: '/uploads/abc123.pdf', mimeType: 'application/pdf' }
[Preview] File loaded successfully, size: 123456 bytes
```

✅ **Success**: PDF displays in browser

### Test 2: Download Original File

**Steps**:
1. Go back to documents list
2. Click the **Download icon** (↓ button)
3. **Expected**: `.docx` file downloads to Downloads folder

**Verify**:
```powershell
# Check Downloads folder
cd $env:USERPROFILE\Downloads
Get-ChildItem TestDocument* | ForEach-Object { Write-Host $_.Name }

# Should show: TestDocument.docx (NOT .pdf)
```

✅ **Success**: Original `.docx` file downloaded

### Test 3: Cached Preview

**Steps**:
1. Go back to documents list
2. Click Preview again (same document)
3. **Expected**: PDF opens in <1 second (very fast)

**Console Logs to Expect**:
```
[Preview] Request for document: abc123...
[Preview] Latest version details: { ..., pdfPath: '/uploads/abc123.pdf' }
[Preview] File check: { ..., hasPdfPath: true }
[Preview] Using existing PDF: /uploads/abc123.pdf
[Preview] Loading file from: { path: '/uploads/abc123.pdf', mimeType: 'application/pdf' }
[Preview] File loaded successfully, size: 123456 bytes
```

✅ **Success**: PDF loads instantly (uses cached version)

### Test 4: Excel File

**Steps**:
1. Upload `.xlsx` file
2. Click Preview
3. **Expected**: PDF of Excel spreadsheet opens

### Test 5: PowerPoint File

**Steps**:
1. Upload `.pptx` file
2. Click Preview
3. **Expected**: PDF of PowerPoint presentation opens

---

## Database Fix (If Needed)

### Check If `pdf_path` Column Exists

```sql
-- In your database, run:
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'document_versions' 
AND COLUMN_NAME = 'pdf_path';
```

**If column doesn't exist**, create it:

```sql
ALTER TABLE document_versions 
ADD COLUMN pdf_path VARCHAR(512) NULL;
```

Or use Drizzle migration:

```typescript
// drizzle/migrations/add_pdf_path.sql
ALTER TABLE document_versions ADD COLUMN pdf_path VARCHAR(512);
```

Then run:
```bash
npm run db:migrate
```

---

## Troubleshooting

### Problem: Preview doesn't convert PDF
**Check**:
1. CloudConvert API key in `.env.local`
2. Network request to `/api/documents/[id]/preview` (check Network tab in DevTools)
3. Console logs for error messages
4. CloudConvert API status at https://status.cloudconvert.com/

**Fix**:
```bash
# Verify API key works
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.cloudconvert.com/v2/account

# Should return account info, not error
```

### Problem: Download returns PDF instead of .docx
**Check**:
1. Download route code uses `filePath` (not `pdfPath`)
2. Content-Disposition header is `attachment` (not `inline`)

**Verify Route**:
```bash
# Open file
code app/api/documents/[id]/download/route.ts

# Should see:
# const filePath = currentVersion.filePath  ✓
# NOT: const filePath = currentVersion.pdfPath  ✗
```

### Problem: Second preview is slow
**Check**:
1. `pdf_path` is saved in database
2. Query Drizzle Studio to verify:

```sql
SELECT id, file_path, pdf_path FROM document_versions 
WHERE document_id = 'your-doc-id';
```

Should show `pdf_path` populated (not NULL)

---

## Monitoring & Logs

### Enable Debug Logging
```bash
# In .env.local, add:
DEBUG=*:Preview:*

# Or in code:
console.log('[Preview] ...message')  // Already in code
```

### Check Logs
```bash
# Terminal should show:
# [Preview] ...
# [PDFConversion] ...
# [FileStorageService] ...
# [DocumentService] ...
```

### Monitor CloudConvert API
```bash
# Check API quota usage
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.cloudconvert.com/v2/account

# Returns: remaining conversions, expiry date, etc.
```

---

## Performance Benchmarks

### Expected Performance

| Operation | First Time | Second Time | Notes |
|-----------|-----------|------------|-------|
| Upload .docx | 2-5s | - | File save + metadata |
| Preview (convert) | 5-15s | - | CloudConvert API |
| Preview (cached) | <1s | <1s | Disk read + network |
| Download | 1-2s | 1-2s | File transfer |

### Optimization Opportunities
- Redis caching for metadata lookups
- CloudConvert batch operations
- Async PDF generation in background

---

## Next Steps

### Immediate (Today)
- [ ] Verify database schema
- [ ] Run the 5-step testing flow above
- [ ] Check console logs match expectations
- [ ] Test with different file formats (xlsx, pptx)

### Short-term (This Week)
- [ ] Test edge cases (large files, special chars)
- [ ] Test error scenarios (API down, permissions)
- [ ] Performance testing with multiple users
- [ ] Create automated tests

### Long-term (This Month)
- [ ] Performance optimization
- [ ] CloudConvert quota monitoring
- [ ] User feedback and UX improvements
- [ ] Documentation for support team

---

## Success Checklist

- [ ] Upload .docx file ✓
- [ ] Click Preview → PDF displays ✓
- [ ] Click Download → Original .docx downloads ✓
- [ ] Original file unchanged after preview ✓
- [ ] Second preview is fast ✓
- [ ] Error handling works ✓
- [ ] All file types supported ✓
- [ ] Logging is clear ✓

---

## Support Resources

| Topic | Location |
|-------|----------|
| Full Requirements | `requirements.md` |
| Technical Design | `design.md` |
| Detailed Tasks | `tasks.md` |
| Implementation Status | `IMPLEMENTATION_STATUS.md` |
| Overview | `README.md` |

---

## Need Help?

### Check These First
1. **Console logs** - Look for `[Preview]` or `[PDFConversion]` messages
2. **Network tab** - Verify requests to `/api/documents/[id]/preview` and `/download`
3. **Database** - Verify `pdf_path` column exists and is populated
4. **Environment** - Verify `.env.local` has `CLOUDCONVERT_API_KEY`

### Still Stuck?
Review the spec documents in this order:
1. `README.md` - Overview
2. `requirements.md` - What should happen
3. `design.md` - How it works
4. `IMPLEMENTATION_STATUS.md` - What's done/what's not
5. `tasks.md` - Detailed implementation steps
