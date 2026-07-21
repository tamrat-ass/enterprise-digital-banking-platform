# Implementation Tasks: File Preview and Download

## Task 1: Verify Preview Route Correctly Handles Original Files
**Status**: `ready`
**Priority**: P0
**Description**: Ensure the preview route returns original files for non-Office formats (PDF, images, text) without attempting conversion.

**Acceptance Criteria**:
- [ ] PDF files are returned with Content-Type: application/pdf
- [ ] Images are returned with correct MIME type (image/png, image/jpeg, etc.)
- [ ] Text files are returned with Content-Type: text/plain
- [ ] All files use Content-Disposition: inline
- [ ] No conversion attempted for these formats

**Implementation Notes**:
- File: `app/api/documents/[id]/preview/route.ts`
- Current implementation should already handle this
- Verify the mime type mapping includes all previewable formats

---

## Task 2: Implement PDF Conversion on First Preview
**Status**: `ready`
**Priority**: P0
**Description**: When user previews an Office document for the first time, trigger PDF conversion via CloudConvert API and cache the result.

**Acceptance Criteria**:
- [ ] Office files (.docx, .xlsx, .pptx) trigger PDF conversion
- [ ] Conversion uses CloudConvert API with configured API key
- [ ] Conversion completes within 20 seconds
- [ ] Converted PDF is saved to disk with .pdf extension
- [ ] PDF path is stored in database (document_versions.pdf_path)
- [ ] Subsequent previews load cached PDF
- [ ] If conversion fails, original file is returned with download option

**Implementation Notes**:
- File: `lib/services/pdf-conversion.service.ts`
- CloudConvert API key is already configured in .env.local
- Use relative path format for pdf_path storage: `/uploads/doc-id.pdf`
- Set 20-second timeout for preview conversions

---

## Task 3: Ensure Download Returns Original File Only
**Status**: `ready`
**Priority**: P0
**Description**: Download endpoint must always return the original uploaded file, never the converted PDF.

**Acceptance Criteria**:
- [ ] Download uses `filePath` from database (original file)
- [ ] Download never uses `pdfPath`
- [ ] Original filename is preserved in Content-Disposition header
- [ ] File extension matches original (e.g., .docx, .xlsx, .pptx)
- [ ] Content-Type matches original file format
- [ ] Content-Disposition header set to: `attachment; filename="OriginalName.docx"`

**Implementation Notes**:
- File: `app/api/documents/[id]/download/route.ts`
- Verify this file exists and uses correct filePath
- Test with Word, Excel, PowerPoint files
- Filename should be escaped for special characters

---

## Task 4: Update UI to Differentiate Preview and Download
**Status**: `ready`
**Priority**: P0
**Description**: Ensure UI correctly calls preview endpoint for Preview button and download endpoint for Download button.

**Acceptance Criteria**:
- [ ] Preview button calls `/api/documents/[id]/preview`
- [ ] Download button calls `/api/documents/[id]/download`
- [ ] Preview opens in new tab (for inline PDF display)
- [ ] Download triggers native browser download dialog
- [ ] Both buttons have clear icons and labels
- [ ] Error messages are user-friendly

**Implementation Notes**:
- File: `components/file-management-table.tsx`
- Preview: `window.open(previewUrl, '_blank')`
- Download: Use blob + createElement('a') pattern
- Already partially implemented; verify it's correct

---

## Task 5: Verify Database Schema Supports PDF Caching
**Status**: `ready`
**Priority**: P0
**Description**: Ensure document_versions table has pdf_path column to store converted PDF paths.

**Acceptance Criteria**:
- [ ] document_versions.pdf_path column exists
- [ ] pdf_path is nullable VARCHAR
- [ ] Can store paths like `/uploads/doc-id.pdf`
- [ ] Migration script is applied if needed

**Implementation Notes**:
- File: `lib/db/schema.ts`
- Column should be optional (nullable)
- Check if migration exists or create one

---

## Task 6: Test End-to-End Preview Flow
**Status**: `ready`
**Priority**: P0
**Description**: Comprehensive test of the complete preview workflow.

**Acceptance Criteria**:
- [ ] Upload a .docx file
- [ ] Click Preview button
- [ ] PDF displays in browser within 20 seconds
- [ ] Click Download button
- [ ] Original .docx file is downloaded
- [ ] Original file is not modified
- [ ] Second preview loads cached PDF immediately
- [ ] All permissions and authentication work

**Test Cases**:
1. Upload Word document → Preview → Verify PDF displayed
2. Upload Excel file → Preview → Verify PDF displayed
3. Upload PowerPoint → Preview → Verify PDF displayed
4. Upload PDF → Preview → Verify PDF displayed inline
5. Upload image → Preview → Verify image displayed inline
6. Click Download after preview → Verify original file downloaded
7. Re-upload same file → Verify new PDF is generated

**Implementation Notes**:
- Use browser DevTools Network tab to verify correct endpoints
- Check console logs for [Preview] and [PDFConversion] messages
- Verify database shows pdf_path populated after conversion

---

## Task 7: Handle Edge Cases and Error Scenarios
**Status**: `ready`
**Priority**: P1
**Description**: Ensure system gracefully handles errors and edge cases.

**Acceptance Criteria**:
- [ ] Conversion timeout shows user-friendly error
- [ ] CloudConvert API failure falls back to original file
- [ ] Missing file shows appropriate error message
- [ ] Invalid file format rejected with clear message
- [ ] Concurrent preview requests don't cause race conditions
- [ ] Very large files are handled appropriately

**Edge Cases to Test**:
1. Preview very large Word file (>50MB)
2. Preview while CloudConvert API is down
3. Multiple users preview same file simultaneously
4. Preview file that was deleted from disk
5. Preview file with special characters in name

**Implementation Notes**:
- Add retry logic for CloudConvert API failures
- Implement file size validation before conversion
- Use file locks to prevent concurrent conversions

---

## Task 8: Performance and Caching Optimization
**Status**: `ready`
**Priority**: P2
**Description**: Optimize preview performance with proper caching strategy.

**Acceptance Criteria**:
- [ ] Cached PDFs load in <100ms on second preview
- [ ] No unnecessary re-conversions happen
- [ ] Browser caching headers are set correctly
- [ ] Cache-Control header prevents stale content

**Implementation Notes**:
- Set Cache-Control: public, max-age=3600 for PDFs
- Set Cache-Control: no-cache, no-store for original Office files
- Consider Redis caching for metadata lookups
- Monitor CloudConvert API quota usage

---

## Task 9: Documentation and Logging
**Status**: `ready`
**Priority**: P2
**Description**: Add comprehensive logging and documentation for debugging.

**Acceptance Criteria**:
- [ ] Console logs show conversion progress
- [ ] Log includes file size, format, and timing
- [ ] Log shows cache hit/miss decisions
- [ ] Error logs are descriptive and actionable

**Implementation Notes**:
- Use consistent log prefix: `[Preview]` and `[PDFConversion]`
- Log at INFO level for successful operations
- Log at WARN level for retries
- Log at ERROR level for failures

---

## Summary

**Total Tasks**: 9
**Priority P0 Tasks**: 8 (must have)
**Priority P1 Tasks**: 1 (important)
**Priority P2 Tasks**: 2 (nice to have)

**Estimated Timeline**:
- Core implementation: 2-3 hours
- Testing: 1-2 hours
- Edge case handling: 1-2 hours
- **Total**: ~4-7 hours
