# Implementation Status: File Preview and Download

## Current State Analysis

### ✅ Already Implemented

#### 1. Download Route (COMPLETE)
**File**: `app/api/documents/[id]/download/route.ts`
- ✅ Returns ORIGINAL file only (uses `filePath`, not `pdfPath`)
- ✅ Sets correct Content-Type for each file format
- ✅ Sets Content-Disposition: attachment (triggers download)
- ✅ Handles missing files with proper error message
- ✅ Authenticates user (requires documents:view permission)
- ✅ Escapes filename for special characters

#### 2. PDF Conversion Service (COMPLETE)
**File**: `lib/services/pdf-conversion.service.ts`
- ✅ CloudConvert API integration configured
- ✅ Supports Word, Excel, PowerPoint conversion
- ✅ 20-second timeout for preview requests
- ✅ Error handling for API failures
- ✅ Returns null gracefully if conversion fails

#### 3. Preview Route (MOSTLY COMPLETE)
**File**: `app/api/documents/[id]/preview/route.ts`
- ✅ Detects Office file formats
- ✅ Checks for cached PDF before converting
- ✅ Triggers on-the-fly conversion if no cached PDF
- ✅ Returns correct MIME types
- ✅ Sets Content-Disposition: inline for PDFs
- ✅ Handles non-Office formats (PDF, images, text)
- ✅ Comprehensive logging for debugging

#### 4. UI Layer (COMPLETE)
**File**: `components/file-management-table.tsx`
- ✅ Preview button calls `/api/documents/[id]/preview`
- ✅ Download button calls `/api/documents/[id]/download`
- ✅ Preview opens in new tab for inline display
- ✅ Download triggers native browser download
- ✅ Error handling for both operations

---

## Known Issues & Fixes Needed

### Issue 1: PDF Path Not Being Saved to Database
**Severity**: HIGH
**Status**: NEEDS FIX
**Description**: When PDF conversion completes during document upload, the pdf_path is updated asynchronously but not reliably saved back to database_versions table.

**Current Code Location**: `lib/services/document.service.ts` (lines ~90-110)
```typescript
// PDF conversion happens in setImmediate (background)
// Uses raw SQL: UPDATE document_versions SET pdf_path = ...
// But this happens after request completes
```

**Fix Required**:
- Ensure UPDATE query completes successfully
- Add logging to verify pdf_path is saved
- Add retry logic if UPDATE fails
- Consider saving pdf_path URL format: `/uploads/doc-id.pdf`

### Issue 2: PDF Conversion Timeout on First Preview
**Severity**: MEDIUM
**Status**: NEEDS TESTING
**Description**: If document uploaded but PDF conversion not completed in background, first preview might timeout if conversion takes >20 seconds.

**Current Behavior**:
- 20-second timeout for preview conversions (fails fast)
- Returns original file with download prompt if timeout

**Expected Behavior**: ✅ CORRECT
- This is acceptable - user can try preview again or download original

---

## Implementation Checklist

### Phase 1: Verification (READY NOW)
- [ ] Verify download route always uses `filePath` (not `pdfPath`)
- [ ] Verify preview route triggers conversion for Office files
- [ ] Verify preview route reuses cached PDF on second preview
- [ ] Verify UI calls correct endpoints

### Phase 2: Database Schema (CHECK NEEDED)
- [ ] Verify `document_versions.pdf_path` column exists
- [ ] Check if `pdf_path` is nullable VARCHAR
- [ ] Create migration if column doesn't exist

### Phase 3: Testing (DO NOW)
- [ ] Test upload .docx → Preview → Verify PDF displays
- [ ] Test upload .xlsx → Preview → Verify PDF displays
- [ ] Test upload .pptx → Preview → Verify PDF displays
- [ ] Test Download → Verify original file downloaded
- [ ] Test second Preview → Verify cached PDF loads fast
- [ ] Test Preview timeout → Verify graceful fallback

### Phase 4: Edge Cases (SECONDARY)
- [ ] Test very large files (>50MB)
- [ ] Test special characters in filenames
- [ ] Test concurrent preview requests
- [ ] Test CloudConvert API failure

---

## Next Steps

### IMMEDIATE (Do Now):
1. **Check database schema** - Verify `document_versions.pdf_path` exists
2. **Add logging** - Enhance logging in document upload to confirm pdf_path saved
3. **Manual testing** - Test complete flow: upload → preview → download

### SHORT TERM (Today):
1. Fix any issues found during testing
2. Verify PDF caching works (second preview is fast)
3. Test with different file formats

### LONG TERM (Optional):
1. Add automated tests for preview/download
2. Performance optimization (Redis caching for metadata)
3. Admin dashboard for CloudConvert API quota monitoring

---

## How to Proceed

### Option A: Verify Current Implementation Works
```bash
# 1. Start dev server
npm run dev

# 2. Test the flow:
# - Upload a Word document
# - Click Preview → Should show PDF in new tab
# - Click Download → Should download .docx file
# - Try Preview again → Should load cached PDF

# 3. Check server logs for:
# [Preview] File check: { needsConversion: true, ... }
# [PDFConversion] Converting with CloudConvert...
# [PDFConversion] CloudConvert conversion successful: /uploads/...
```

### Option B: Run Full Implementation Tasks
Execute tasks in `tasks.md` in order:
1. Task 1: Verify preview route ✅
2. Task 2: Verify PDF conversion ✅
3. Task 3: Verify download route ✅
4. Task 4: Verify UI ✅
5. Task 5: Check database schema ⏳
6. Task 6: End-to-end testing ⏳
7. Task 7: Edge cases ⏳

---

## Files Involved

| File | Status | Notes |
|------|--------|-------|
| `app/api/documents/[id]/preview/route.ts` | ✅ Ready | Triggers conversion, handles caching |
| `app/api/documents/[id]/download/route.ts` | ✅ Ready | Always returns original file |
| `lib/services/pdf-conversion.service.ts` | ✅ Ready | CloudConvert API integration |
| `lib/services/document.service.ts` | ⏳ Review | Check pdf_path save logic |
| `components/file-management-table.tsx` | ✅ Ready | UI calls correct endpoints |
| `lib/db/schema.ts` | ⏳ Check | Verify pdf_path column exists |
| `.env.local` | ✅ Ready | CLOUDCONVERT_API_KEY configured |

---

## Success Criteria

System is ready when:
- ✅ Upload Office file
- ✅ Click Preview → PDF displays in browser
- ✅ Click Download → Original .docx/.xlsx/.pptx downloads
- ✅ Second Preview uses cached PDF (fast load)
- ✅ Original file remains unchanged
- ✅ All endpoints authenticated
