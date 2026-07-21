# File Preview and Download Behavior Specification

## Overview
Users need to preview Office documents (Word, Excel, PowerPoint) as PDFs in the browser while downloading the original file format for editing purposes.

## Requirements

### 1. Preview Functionality
- **REQ-1.1**: System converts Word (.docx, .doc), Excel (.xlsx, .xls), and PowerPoint (.pptx, .ppt) files to PDF on-the-fly
- **REQ-1.2**: PDF conversion happens asynchronously without blocking the user's preview request
- **REQ-1.3**: Converted PDF displays inline in the browser (not downloaded)
- **REQ-1.4**: Preview works with CloudConvert API (configured via CLOUDCONVERT_API_KEY)
- **REQ-1.5**: If conversion fails, system gracefully falls back (shows error or original file info)

### 2. Download Functionality
- **REQ-2.1**: Download button returns the ORIGINAL file with original filename and extension
- **REQ-2.2**: Original file is never modified or replaced during conversion
- **REQ-2.3**: Download preserves original file format (.docx, .xlsx, .pptx, etc.)
- **REQ-2.4**: Download includes proper Content-Disposition headers for file save dialog

### 3. Storage Strategy
- **REQ-3.1**: Original uploaded file stored as-is (e.g., document.docx)
- **REQ-3.2**: Converted PDF stored separately with .pdf extension (e.g., document.pdf)
- **REQ-3.3**: PDF path tracked in database (document_versions.pdf_path) for caching
- **REQ-3.4**: If PDF already cached, reuse it instead of re-converting

### 4. API Endpoints
- **REQ-4.1**: GET `/api/documents/[id]/preview` - Returns PDF for inline display
- **REQ-4.2**: GET `/api/documents/[id]/download` - Returns original file for download

### 5. User Experience
- **REQ-5.1**: Preview button shows PDF in new browser tab
- **REQ-5.2**: Download button triggers native browser download dialog
- **REQ-5.3**: Both operations require document view permission
- **REQ-5.4**: Loading indicators show progress during conversion

## Acceptance Criteria

- ✅ User clicks Preview → Browser shows PDF inline
- ✅ User clicks Download → Browser downloads original .docx/.xlsx/.pptx file
- ✅ Original file remains unchanged after preview
- ✅ Multiple previews reuse cached PDF (no re-conversion)
- ✅ Conversion happens within 20 seconds or gracefully fails
- ✅ Both endpoints are properly authenticated
- ✅ File MIME types are correct (PDF for preview, Office format for download)
