# Next Steps - Preview/Download Feature Testing

**Status**: ✅ All Code Fixes Complete  
**Build Status**: ✅ PASSES  
**Ready**: YES - Ready for testing

---

## Summary of Fixes Applied Today

Three critical bugs have been fixed:

1. **✅ FIXED**: CloudConvert job payload was malformed
   - Added `filename` field to import/base64 task
   - Strip data URL prefix from base64 string
   - File: `lib/services/pdf-conversion.service.ts`

2. **✅ FIXED**: ReferenceError in preview route (fileBuffer before init)
   - Moved buffer declaration before error handling
   - File: `app/api/documents/[id]/preview/route.ts`

3. **✅ FIXED**: PDF downloading instead of displaying inline
   - Change displayFileName to `.pdf` when serving PDFs
   - Ensures browser honors `Content-Disposition: inline`
   - File: `app/api/documents/[id]/preview/route.ts`

---

## What You Need to Do

### Step 1: Restart Dev Server

```bash
npm run dev
```

Wait for the server to start completely. You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 2: Prepare a Test File

- Create or download a Word file (`.docx`)
- Keep it simple (any content works)
- Example: `Test_Document.docx`

### Step 3: Quick Test (2 minutes)

1. Navigate to `/upload` page
2. Upload the `.docx` file
3. Go to document list (likely `/documents` or `/file-management`)
4. Find the uploaded document
5. **Click Preview button**
   - Expected: PDF opens in browser tab (NOT download)
   - Console should show: `[Preview] Response headers: { ..., displayFileName: 'Test_Document.pdf' }`

6. **Click Preview again** (2nd time)
   - Expected: Instant display (cache hit)
   - Console should show: `[Preview] Using existing PDF:`

7. **Click Download button**
   - Expected: Browser downloads original `.docx` file
   - Downloaded filename should be `Test_Document.docx` (NOT .pdf)

### Step 4: Full Test Suite (Optional, 20 minutes)

If Quick Test passes, run full suite:
```
.kiro/specs/file-preview-download/START_TESTING_NOW.md
```

Tests include:
- Word/Excel/PowerPoint preview
- File caching
- Original file preservation
- Permission checks
- Error scenarios

---

## What to Watch For

### In Browser
- ✅ PDF displays inline (doesn't download)
- ✅ No JavaScript errors in DevTools
- ✅ Download brings original file format

### In Console
Watch for these logs (prefix `[Preview]` or `[PDFConversion]`):

**First preview** (should take 5-15 seconds):
```
[Preview] File check: { extension: 'docx', needsConversion: true, hasPdfPath: false }
[Preview] No PDF found, attempting on-the-fly conversion...
[PDFConversion] Converting with CloudConvert: { fileName: 'Test_Document.docx' ... }
[PDFConversion] Creating CloudConvert job...
[PDFConversion] CloudConvert conversion successful: /uploads/xxxx.pdf
[Preview] On-the-fly conversion successful: /uploads/xxxx.pdf
[Preview] Response headers: { contentType: 'application/pdf', disposition: 'inline', displayFileName: 'Test_Document.pdf' }
```

**Second preview** (should be instant):
```
[Preview] File check: { extension: 'docx', needsConversion: true, hasPdfPath: true }
[Preview] Using existing PDF: /uploads/xxxx.pdf
[Preview] Response headers: { contentType: 'application/pdf', disposition: 'inline', displayFileName: 'Test_Document.pdf' }
```

**Download**:
```
[Download] Found! Size: xxxxx bytes
```

---

## Troubleshooting

### "PDF downloads instead of displaying"
- Check browser console for JavaScript errors
- Check `Content-Disposition` header in Network tab
  - Should be: `inline; filename="Document.pdf"` (with .pdf extension)
  - NOT: `attachment; filename="Document.docx"`
- If still downloading, server may need restart

### "Conversion takes >30 seconds or fails"
- Check `.env.local` has `CLOUDCONVERT_API_KEY`
- Check server console for `[PDFConversion]` error messages
- Verify CloudConvert account has available credits

### "Download doesn't return original file"
- Check Network tab - verify `/api/documents/[id]/download` request
- Downloaded file should have original extension (`.docx`, not `.pdf`)
- If wrong, server logic needs fixing

### "Preview shows error page"
- Common: "PDF CONVERSION FAILED"
- Check server console for `[PDFConversion]` errors
- Usually means CloudConvert API key issue

---

## Expected Results

### ✅ SUCCESS - All Working
- Preview shows PDF inline (not download)
- Download returns original file
- Both instant on second access
- No errors in console

**Next**: Proceed to full test suite if desired, then mark as COMPLETE

### ⚠️ PARTIAL - Some Issues
- Note which tests fail
- Check console for specific errors
- Create bug report with error logs
- May need additional fixes

### ❌ FAILURE - Major Issues
- Multiple preview/download issues
- Build or deployment problems
- Check all fixes were applied correctly

---

## File Locations

| File | Purpose |
|------|---------|
| `lib/services/pdf-conversion.service.ts` | PDF conversion logic (CloudConvert API) |
| `app/api/documents/[id]/preview/route.ts` | Preview endpoint (displays PDF inline) |
| `app/api/documents/[id]/download/route.ts` | Download endpoint (returns original file) |
| `lib/services/document.service.ts` | Document and version management |
| `.env.local` | Configuration (CloudConvert API key) |
| `components/file-management-table.tsx` | UI buttons (Preview/Download) |

---

## Important Notes

### PDF Caching
- First preview takes 5-15 seconds (CloudConvert conversion time)
- Second preview is instant (uses cached PDF)
- Cached PDFs stored as `/uploads/{documentId}.pdf`
- Original file stored as `/uploads/{documentId}/{filename}`

### File Preservation
- Original files are NEVER modified
- Only a separate PDF copy is created for preview
- Downloaded files always return original format

### Filename Behavior
- Preview filename: `Document.pdf` (even if original was `.docx`)
- Download filename: Original name and extension (e.g., `Document.docx`)
- This is intentional - Preview shows what's being displayed (PDF), Download shows what's being saved (original)

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run type check
npm run type-check

# View database
npm run db:studio

# Check environment
cat .env.local | grep CLOUDCONVERT
```

---

## Status Dashboard

| Item | Status |
|------|--------|
| CloudConvert API integration | ✅ Fixed |
| Base64 encoding | ✅ Fixed |
| Error handling | ✅ Fixed |
| PDF display (inline) | ✅ Fixed |
| Build | ✅ Passes |
| TypeScript | ✅ No errors |
| Ready to test | ✅ YES |

---

## Time Estimates

- Quick Test: 5 minutes
- Full Test Suite: 20-30 minutes
- If issues found: Varies based on bugs

---

**You're ready to test! 🚀**

Start with Step 1 above. Report any issues found.

