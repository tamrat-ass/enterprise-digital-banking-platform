# Technical Design: File Preview and Download

## Architecture Overview

```
User Clicks Preview/Download
        ↓
File Management UI (file-management-table.tsx)
        ↓
    ┌─────────────────────────────────────┐
    │  Preview Route                      │
    │  GET /api/documents/[id]/preview    │
    └──────────────┬──────────────────────┘
                   ↓
    ┌─────────────────────────────────────┐
    │  Check if Office format?            │
    │  (docx, xlsx, pptx, etc.)           │
    └──────────────┬──────────────────────┘
                   ↓
            ┌──────┴──────┐
            ↓             ↓
        YES (Office)   NO (PDF, image, etc.)
            ↓             ↓
    ┌──────────────┐  ┌─────────────────┐
    │ Check cached │  │ Return original │
    │ PDF in DB    │  │ file inline     │
    └──────┬───────┘  └─────────────────┘
           ↓
      ┌────┴────┐
      ↓         ↓
   Found    Not Found
      ↓         ↓
   Return   Convert to PDF
   cached   (CloudConvert API)
   PDF         ↓
              Save PDF
              to disk
              ↓
           Update DB
           with pdf_path
              ↓
           Return PDF
```

## Component Details

### 1. Preview Route (`/api/documents/[id]/preview`)

**Responsibilities:**
- Fetch document from database
- Determine if conversion needed
- Return converted PDF or original file
- Set correct MIME type and Content-Disposition

**Flow:**
```typescript
1. Authenticate user (requirePermission)
2. Get document & latest version
3. Detect file extension (docx, xlsx, etc.)
4. If Office format:
   a. Check if pdf_path already in DB
   b. If yes → Return cached PDF
   c. If no → Convert via CloudConvert API
   d. Save converted PDF to disk
   e. Update database with pdf_path
   f. Return PDF
5. If other format:
   a. Return original file inline
6. Set headers:
   - Content-Type: application/pdf (or appropriate MIME)
   - Content-Disposition: inline (display in browser)
```

### 2. Download Route (`/api/documents/[id]/download`)

**Responsibilities:**
- Return the ORIGINAL file only
- Never convert or modify
- Set Content-Disposition: attachment (trigger download)

**Flow:**
```typescript
1. Authenticate user
2. Get document & latest version
3. Load original file from disk (filePath, not pdfPath)
4. Set headers:
   - Content-Type: original file MIME type
   - Content-Disposition: attachment; filename="original.docx"
5. Return file
```

### 3. UI Layer (`file-management-table.tsx`)

**Preview Button Action:**
- Calls `/api/documents/[id]/preview`
- Opens in new tab with `window.open()`
- Browser displays PDF inline

**Download Button Action:**
- Calls `/api/documents/[id]/download`
- Creates blob from response
- Triggers native download dialog

## Database Schema

### document_versions table

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Version identifier |
| document_id | UUID | Reference to document |
| version | INT | Version number |
| file_path | VARCHAR | Original file location (e.g., /uploads/doc-id.docx) |
| pdf_path | VARCHAR | Converted PDF location (e.g., /uploads/doc-id.pdf) |
| file_name | VARCHAR | Original filename (e.g., "Report.docx") |
| author_id | UUID | Who uploaded this version |
| author_name | VARCHAR | Name of uploader |

## File Storage Layout

```
public/
├── uploads/
│   ├── doc-id-1.docx          ← Original Word file
│   ├── doc-id-1.pdf           ← Converted PDF (created on first preview)
│   ├── doc-id-2.xlsx          ← Original Excel file
│   ├── doc-id-2.pdf           ← Converted PDF
│   └── ...
```

## Supported File Types

### Convertible to PDF (Preview Only)
- Word: .docx, .doc
- Excel: .xlsx, .xls
- PowerPoint: .pptx, .ppt
- OpenDocument: .odt, .odp, .ods

### Direct Preview (No Conversion)
- PDF: .pdf
- Images: .jpg, .jpeg, .png, .gif, .webp, .svg
- Text: .txt, .csv, .json, .xml

## Error Handling

| Scenario | Behavior |
|----------|----------|
| PDF conversion timeout (>20s) | Return original file with download prompt |
| CloudConvert API fails | Return original file with download prompt |
| File not found on disk | Return 404 with error message |
| Permission denied | Return 403 with error message |
| Invalid file format | Return 400 with error message |

## Performance Considerations

1. **Caching Strategy**
   - First preview: Convert and cache in DB
   - Subsequent previews: Load cached PDF from disk
   - No re-conversion unless file is re-uploaded

2. **Async Conversion During Upload**
   - PDF conversion happens in background after upload
   - User doesn't wait for conversion to complete
   - First preview might still trigger conversion if not done yet

3. **Timeout Handling**
   - 20-second timeout for preview conversions (fail fast)
   - 60-second timeout for background upload conversions

## Security Considerations

1. **Authentication**: All endpoints require `documents:view` permission
2. **File Path Validation**: Use FileStorageService for safe path handling
3. **MIME Type Validation**: Verify file extension before processing
4. **Content-Disposition**: Prevent path traversal attacks with proper filename escaping
