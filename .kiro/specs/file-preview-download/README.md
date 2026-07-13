# File Preview and Download Behavior Specification

## Quick Summary

This specification defines how the system handles file preview and download for documents, particularly Office files (Word, Excel, PowerPoint).

**Core Requirement**: Convert Office files to PDF for browser preview while keeping the original file unchanged for download.

### Key Features
- 📄 **Preview**: Display Office documents as PDFs in the browser
- 💾 **Download**: Download original file (not PDF) with original format
- 🔄 **Caching**: Reuse converted PDFs for faster subsequent previews
- 🛡️ **Original Protection**: Original files are never modified
- ⚡ **Performance**: 20-second conversion timeout for responsive UX

---

## Document Structure

This spec consists of 4 documents:

### 1. **requirements.md** - Business Requirements
What the system MUST do from a user's perspective.

Key requirements:
- Preview converts Office files to PDF
- Download returns original file
- Storage keeps original unchanged
- API endpoints properly authenticated

### 2. **design.md** - Technical Design
HOW the system implements the requirements.

Key sections:
- Architecture diagram
- Component responsibilities
- Database schema design
- File storage layout
- Error handling strategy
- Security considerations

### 3. **tasks.md** - Implementation Tasks
Specific tasks to implement and test.

9 tasks covering:
- Preview functionality (Tasks 1-2)
- Download functionality (Task 3)
- UI integration (Task 4)
- Database verification (Task 5)
- End-to-end testing (Task 6)
- Edge cases (Task 7)
- Optimization (Task 8)
- Documentation (Task 9)

### 4. **IMPLEMENTATION_STATUS.md** - Current Status
Assessment of what's already implemented vs. what needs fixing.

Status:
- ✅ 4/4 core components already implemented
- ⏳ Database schema needs verification
- 🧪 Needs comprehensive testing

---

## Quick Start

### For Developers
1. Read `requirements.md` to understand what needs to be done
2. Review `design.md` to understand the architecture
3. Follow `tasks.md` to implement/verify functionality
4. Use `IMPLEMENTATION_STATUS.md` to track progress

### For QA/Testing
1. Review `requirements.md` for acceptance criteria
2. Follow test cases in `tasks.md` Task 6
3. Test edge cases in `tasks.md` Task 7

### For Project Managers
1. Check `tasks.md` for timeline estimates
2. Review `IMPLEMENTATION_STATUS.md` for current progress
3. Use task priorities (P0, P1, P2) for scheduling

---

## Current Implementation Status

### ✅ Complete (Ready to Use)
- [x] Download route always returns original file
- [x] Preview route triggers PDF conversion
- [x] CloudConvert API integration configured
- [x] UI correctly calls preview/download endpoints
- [x] PDF caching logic in place

### ⏳ In Progress (Needs Verification)
- [ ] Database schema has pdf_path column
- [ ] PDF paths are correctly saved to database
- [ ] Conversion completes before preview displays

### 🧪 Not Tested (Needs Testing)
- [ ] End-to-end workflow (upload → preview → download)
- [ ] PDF caching on second preview
- [ ] Error handling and edge cases
- [ ] Performance with large files

---

## User Flow

### Preview Flow
```
User clicks "Preview" button
         ↓
Browser opens `/api/documents/[id]/preview`
         ↓
Server checks: Is this an Office file?
    YES ↓              NO ↓
  Check if PDF    Return original
  already cached  file inline
       ↓              ↓
   Cached?        Done ✓
   YES ↓ NO↓
  Return  Convert
  cached  to PDF
  PDF      ↓
   ↓   Save to disk
   ↓      ↓
   Done ✓ Update DB
         ↓
         Return PDF
         ↓
         Done ✓
```

### Download Flow
```
User clicks "Download" button
         ↓
Browser requests `/api/documents/[id]/download`
         ↓
Server loads ORIGINAL file (filePath)
NOT pdf_path!
         ↓
Set Content-Disposition: attachment
         ↓
Return original file
         ↓
Browser shows download dialog
         ↓
User saves original file
```

---

## File Mappings

| User Action | Endpoint | Returns | Display Method |
|-------------|----------|---------|-----------------|
| Preview Office file | `/preview` | PDF | Browser tab (inline) |
| Preview PDF file | `/preview` | PDF | Browser tab (inline) |
| Preview image | `/preview` | Image | Browser tab (inline) |
| Download Office file | `/download` | Original .docx/.xlsx/.pptx | Download dialog |
| Download PDF | `/download` | Original .pdf | Download dialog |
| Download image | `/download` | Original image | Download dialog |

---

## Configuration

### Environment Variables
```
# CloudConvert API (already configured in .env.local)
CLOUDCONVERT_API_KEY=<your-api-key>
```

### File Storage
```
public/uploads/
├── document-id.docx      # Original Word file
├── document-id.pdf       # Converted PDF
├── document-id.xlsx      # Original Excel file
└── document-id.pdf       # Converted PDF
```

### Database
```sql
-- document_versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL,
  file_path VARCHAR,      -- Original: /uploads/doc.docx
  pdf_path VARCHAR,       -- Converted: /uploads/doc.pdf (NULL if not converted)
  file_name VARCHAR,      -- Original: "Report.docx"
  -- ... other columns
);
```

---

## Troubleshooting

### Issue: Preview shows download dialog instead of displaying PDF

**Cause**: Content-Disposition header is set incorrectly
**Solution**: Verify preview route sets `Content-Disposition: inline` (not `attachment`)

### Issue: Download returns PDF instead of original file

**Cause**: Download route is using `pdfPath` instead of `filePath`
**Solution**: Verify download route uses `currentVersion.filePath` (not `pdfPath`)

### Issue: Second preview is slow

**Cause**: PDF is not being cached in database
**Solution**: Check if `pdf_path` is being saved to database after conversion

### Issue: Conversion times out

**Cause**: CloudConvert API is slow or not responding
**Solution**: Check CloudConvert API status; increase timeout if needed

---

## Testing Checklist

### Basic Functionality
- [ ] Upload .docx file → Preview → See PDF in browser
- [ ] Upload .xlsx file → Preview → See PDF in browser
- [ ] Upload .pptx file → Preview → See PDF in browser
- [ ] Click Download → See original .docx/.xlsx/.pptx file

### Caching
- [ ] First preview triggers conversion
- [ ] Second preview loads cached PDF instantly
- [ ] Database shows pdf_path after first preview

### Edge Cases
- [ ] Large file (>50MB) uploads successfully
- [ ] File with special characters (é, ñ, 中文) works correctly
- [ ] Multiple users preview same file simultaneously
- [ ] Conversion timeout handled gracefully

### Error Handling
- [ ] CloudConvert API down → Graceful fallback
- [ ] File deleted from disk → Clear error message
- [ ] Invalid file format → Clear error message
- [ ] Permission denied → 403 error

---

## Success Criteria

Project is COMPLETE when:
1. ✅ User can upload Office document
2. ✅ User clicks Preview → PDF displays inline in browser
3. ✅ User clicks Download → Original file downloads with correct extension
4. ✅ Original file is never modified
5. ✅ Second preview uses cached PDF (fast)
6. ✅ All edge cases handled gracefully
7. ✅ All error messages are user-friendly
8. ✅ Comprehensive logging for debugging

---

## Related Documentation

- API Documentation: `app/api/documents/README.md`
- Database Schema: `lib/db/schema.ts`
- File Storage: `lib/services/file-storage.service.ts`
- PDF Conversion: `lib/services/pdf-conversion.service.ts`
- Document Service: `lib/services/document.service.ts`

---

## Questions?

Refer to:
- **What should happen?** → `requirements.md`
- **How does it work?** → `design.md`
- **What do I implement?** → `tasks.md`
- **What's already done?** → `IMPLEMENTATION_STATUS.md`
