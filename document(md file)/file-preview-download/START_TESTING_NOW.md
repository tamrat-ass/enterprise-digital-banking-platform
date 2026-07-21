# ⚡ START TESTING NOW: File Preview and Download

**Status**: ✅ READY TO TEST  
**Time to First Test**: 5 minutes  
**Verification Complete**: YES

---

## What You Need to Know

The feature is **95% implemented**. All code is in place and should work. We need to verify it actually works end-to-end.

**Your Task**: Run through the test scenarios below and report any issues.

---

## Pre-Test Checklist (2 minutes)

```bash
# 1. Start dev server
npm run dev

# 2. Watch console for these messages during test:
# [Preview] ...
# [PDFConversion] ...
# [Download] ...

# 3. Open DevTools Network tab to see API calls
# Cmd+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
```

---

## Test 1: Basic Word Document Preview (5 minutes)

### Setup
1. Download a test Word file or create one:
   - Create `Test_Document.docx` in Word or use an existing .docx file
   - Content doesn't matter, just needs to be a valid .docx

### Steps
1. Navigate to `/upload` page in the app
2. Upload `Test_Document.docx`
3. Wait for upload to complete
4. Navigate to documents list (likely `/documents` or `/file-management`)
5. Find the uploaded document
6. **Click the Eye icon (Preview button)**
7. **Expected Result**: PDF opens in a new browser tab

### Console Logs to Expect
```
[Preview] Request for document: abc123...
[Preview] File check: { ..., extension: 'docx', needsConversion: true, hasPdfPath: false }
[Preview] No PDF found, attempting on-the-fly conversion...
[PDFConversion] Converting with CloudConvert: { fileName: 'Test_Document.docx', ... }
[PDFConversion] Creating CloudConvert task...
[PDFConversion] Task created, ID: xxxxx...
[PDFConversion] Waiting for conversion to complete...
[Preview] On-the-fly conversion successful: /uploads/xxxx.pdf
```

### ✅ Success Criteria
- [ ] PDF displays in browser (not downloaded)
- [ ] PDF is readable and shows document content
- [ ] Console shows `[PDFConversion] ... successful` message
- [ ] Takes 5-15 seconds (not instant - first conversion)

### ❌ If It Fails
1. Check browser console for JavaScript errors
2. Check server console for `[PDFConversion]` error logs
3. Verify `.env.local` has `CLOUDCONVERT_API_KEY`
4. Verify network request to `/api/documents/[id]/preview` in DevTools

---

## Test 2: Download Original File (3 minutes)

### Steps
1. Go back to documents list
2. Find the `Test_Document.docx` you just uploaded
3. **Click the Download icon (↓ button)**
4. **Expected Result**: Browser download dialog appears, downloads as `.docx` file

### Verify Downloaded File
```powershell
# Check Downloads folder
cd $env:USERPROFILE\Downloads
Get-ChildItem Test_Document*

# Should show: Test_Document.docx (NOT .pdf)
```

### ✅ Success Criteria
- [ ] Browser shows download dialog
- [ ] Downloaded file is `.docx` (not `.pdf`)
- [ ] File opens in Word/compatible software
- [ ] Console shows `[Download] ... Found! Size: xxxxx bytes`

### ❌ If It Fails
1. Check browser console for errors
2. Check server console for `[Download]` error logs
3. Verify downloaded file extension
4. Verify file is not corrupted (can open in Word)

---

## Test 3: Cached Preview - Speed Check (2 minutes)

### Steps
1. Go back to documents list
2. **Click Preview again for same document**
3. **Note the time it takes to load**
4. **Expected Result**: PDF displays instantly (<1 second)

### Console Logs to Expect
```
[Preview] Request for document: abc123...
[Preview] Latest version details: { ..., pdfPath: '/uploads/xxxx.pdf' }
[Preview] File check: { ..., needsConversion: true, hasPdfPath: true }  ← KEY: hasPdfPath is TRUE
[Preview] Using existing PDF: /uploads/xxxx.pdf
[Preview] Loading file from: { path: '/uploads/xxxx.pdf', ... }
[Preview] File loaded successfully, size: xxxxx bytes
```

### ✅ Success Criteria
- [ ] PDF displays instantly (<1 second)
- [ ] Console shows `Using existing PDF:` message
- [ ] No `[PDFConversion]` messages (using cache)
- [ ] Much faster than first preview

### ❌ If It Fails
1. Check if `pdfPath` is in database:
   ```bash
   npm run db:studio
   # Query: SELECT id, file_path, pdf_path FROM document_versions LIMIT 1;
   # Should show pdf_path populated (not NULL)
   ```
2. If NULL, conversion didn't save path - check server logs
3. If path exists but slow, disk access issue

---

## Test 4: Excel File (.xlsx) (3 minutes)

### Steps
1. Upload an Excel file (`.xlsx`)
2. Click Preview
3. **Expected**: PDF of spreadsheet displays
4. Click Download
5. **Expected**: Original `.xlsx` downloads

### ✅ Success Criteria
- [ ] Excel preview converts to PDF
- [ ] Download returns `.xlsx` file
- [ ] Console shows successful conversion

---

## Test 5: PowerPoint File (.pptx) (3 minutes)

### Steps
1. Upload a PowerPoint file (`.pptx`)
2. Click Preview
3. **Expected**: PDF of slides displays
4. Click Download
5. **Expected**: Original `.pptx` downloads

### ✅ Success Criteria
- [ ] PowerPoint preview converts to PDF
- [ ] Download returns `.pptx` file
- [ ] Console shows successful conversion

---

## Test 6: PDF File (No Conversion) (2 minutes)

### Steps
1. Upload a PDF file
2. Click Preview
3. **Expected**: Same PDF displays (no conversion needed)
4. Click Download
5. **Expected**: Original PDF downloads

### Console Logs to Expect
```
[Preview] File check: { ..., extension: 'pdf', needsConversion: false, ... }
```

### ✅ Success Criteria
- [ ] PDF displays without conversion
- [ ] No `[PDFConversion]` messages
- [ ] Download returns same PDF

---

## Test 7: Verify Original File Unchanged (2 minutes)

### Steps
1. Upload a `.docx` file
2. Record its file size and modification date
3. Click Preview (triggers conversion)
4. Click Download (download original)
5. Compare downloaded file with original

### Verify Files Match
```powershell
# Compare files
cd $env:USERPROFILE\Downloads
Get-FileHash Test_Document.docx  # Check hash before and after

# Sizes should match original exactly
Get-Item Test_Document.docx | Select Length
```

### ✅ Success Criteria
- [ ] Downloaded file size matches original
- [ ] Downloaded file MD5 hash matches original
- [ ] File opens without corruption
- [ ] File contents identical to original

---

## Test 8: Error Scenario - Large File (Optional)

### Steps
1. Upload a large file (>50MB if available)
2. Click Preview
3. Check if:
   - Conversion starts
   - Timeout handled gracefully (20 seconds)
   - Falls back to showing original file info

### ✅ Success Criteria
- [ ] No server crash
- [ ] User-friendly error message or fallback
- [ ] Console shows timeout or error message

---

## Test 9: Permissions Check (Optional)

### Steps
1. Create another test user account (or logout/login as different user)
2. Try to access preview endpoint directly:
   ```
   /api/documents/[id]/preview
   ```
3. **Expected**: Permission denied or requires login

### ✅ Success Criteria
- [ ] Unauthenticated access denied
- [ ] Authenticated user without permission denied
- [ ] Only authorized users can preview

---

## Test Summary Checklist

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Word preview | ☐ Pass ☐ Fail | |
| Test 2: Download .docx | ☐ Pass ☐ Fail | |
| Test 3: Cached preview | ☐ Pass ☐ Fail | |
| Test 4: Excel preview | ☐ Pass ☐ Fail | |
| Test 5: PowerPoint preview | ☐ Pass ☐ Fail | |
| Test 6: PDF preview | ☐ Pass ☐ Fail | |
| Test 7: Original unchanged | ☐ Pass ☐ Fail | |
| Test 8: Large file | ☐ Pass ☐ Fail | Optional |
| Test 9: Permissions | ☐ Pass ☐ Fail | Optional |

**Overall Result**: ☐ All Pass ☐ Some Failures

---

## If Tests Fail

### Debug Checklist

**For Preview Failures**:
1. [ ] Check `.env.local` has `CLOUDCONVERT_API_KEY`
2. [ ] Check server console for `[Preview]` or `[PDFConversion]` errors
3. [ ] Check Network tab - is `/api/documents/[id]/preview` request succeeding?
4. [ ] Check response Content-Type header
5. [ ] Check database - does pdf_path get populated?

**For Download Failures**:
1. [ ] Check Network tab - is `/api/documents/[id]/download` request succeeding?
2. [ ] Check response Content-Type and Content-Disposition headers
3. [ ] Check downloaded file extension (should match original)
4. [ ] Check file is not corrupted

**For Speed Issues**:
1. [ ] Is pdf_path stored in database?
2. [ ] Is CloudConvert API responding slowly?
3. [ ] Is disk read slow?

**CloudConvert API Issues**:
```bash
# Test API key directly
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.cloudconvert.com/v2/account

# Should return account info
# If error: API key invalid or quota exceeded
```

---

## Expected Results Summary

### ✅ All Tests Pass
- Feature is ready for production
- Mark as "APPROVED"
- Proceed to release

### ⚠️ Some Tests Fail
- Document failures in `FAILURE_LOG.md`
- Identify root cause from console logs
- Fix in order of priority

### 🔴 Major Failures
- Feature not ready
- Review spec documents for implementation details
- Check code implementation against spec

---

## Time Estimates

| Test | Time | Cumulative |
|------|------|-----------|
| Pre-checklist | 2 min | 2 min |
| Test 1-7 (Required) | 20 min | 22 min |
| Test 8-9 (Optional) | 10 min | 32 min |

**Total Time**: 20-30 minutes for full test suite

---

## Next Steps

### After Tests Pass ✅
1. Update `IMPLEMENTATION_STATUS.md` - mark as COMPLETE
2. Create `RELEASE_NOTES.md`
3. Document any lessons learned
4. Close out spec

### After Tests Fail ⚠️
1. Document issues in spec
2. Create bug fix tasks
3. Re-test after fixes

---

## Quick Reference

### File Locations
```
Preview Route:    app/api/documents/[id]/preview/route.ts
Download Route:   app/api/documents/[id]/download/route.ts
Conversion Svc:   lib/services/pdf-conversion.service.ts
Document Svc:     lib/services/document.service.ts
UI Component:     components/file-management-table.tsx
Database Schema:  lib/db/schema.ts
```

### Console Prefixes to Watch For
```
[Preview]         - Preview endpoint logs
[PDFConversion]   - PDF conversion logs
[Download]        - Download endpoint logs
[DocumentService] - Document service logs
```

### API Endpoints
```
GET /api/documents/[id]/preview       → Returns PDF for display
GET /api/documents/[id]/download      → Returns original file
```

---

## Ready to Start?

✅ All code is implemented  
✅ All configuration is done  
✅ Database schema is ready  
✅ Environment is configured  

**👉 Start with Test 1 now!**

When you're done, report results in the comments section.

---

## Report Template

```markdown
## Test Results: [DATE]

### Summary
- Tests Passed: X / 9
- Tests Failed: X / 9
- Overall Status: ✅ PASS / ⚠️ PARTIAL / 🔴 FAIL

### Detailed Results
- [ ] Test 1: Word preview - PASS / FAIL
- [ ] Test 2: Download - PASS / FAIL
- [ ] Test 3: Cached preview - PASS / FAIL
- [ ] Test 4: Excel preview - PASS / FAIL
- [ ] Test 5: PowerPoint preview - PASS / FAIL
- [ ] Test 6: PDF preview - PASS / FAIL
- [ ] Test 7: Original unchanged - PASS / FAIL
- [ ] Test 8: Large file - PASS / FAIL / SKIPPED
- [ ] Test 9: Permissions - PASS / FAIL / SKIPPED

### Issues Found
[List any failures or errors]

### Console Logs
[Paste relevant error logs if any failures]

### Recommendations
[Any observations or suggestions]
```

---

Good luck! 🚀
