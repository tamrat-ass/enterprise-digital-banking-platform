# Why Preview is Downloading Instead of Displaying

## The Issue
When you click the preview icon on a DOCX file, the browser downloads it instead of displaying it inline.

## Why This Happens

### Browser Limitation
**Browsers cannot natively display Office files** (.docx, .xlsx, .pptx) like they do with PDFs or images.

When your code opens the preview URL in a new window with:
```
window.open('/api/documents/[id]/preview', '_blank')
```

The browser receives the DOCX file but has no way to display it, so it automatically downloads it instead.

### What You're Seeing
- MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Header: `Content-Disposition: inline` (tells browser to display, not download)
- Result: Browser downloads anyway because it can't display the format

## Solutions

### ✅ Solution 1: Convert to PDF (Recommended)

**Install LibreOffice for automatic PDF conversion:**

```bash
# Step 1: Install LibreOffice (if not already installed)
# Windows: Download from https://www.libreoffice.org/download/
# Then:

npm install libreoffice-convert
```

**How it works:**
1. When user uploads a DOCX file
2. System automatically converts to PDF in the background
3. Preview endpoint serves PDF instead
4. Browsers display PDFs natively ✅

**Code already supports this** - PDF conversion runs automatically in DocumentService.createDocument()

---

### ✅ Solution 2: Change to Download Button

Instead of "Preview", rename it to "Download/Open" and serve with:
```typescript
'Content-Disposition': `attachment; filename="${fileName}"`
```

This makes the download intentional instead of surprising.

**File:** `components/file-management-table.tsx`

```typescript
// Change the button title and behavior
title="Download document" // was "Preview"

// Users know to expect download for Office files
```

---

### ✅ Solution 3: Use Online Office Viewer

Redirect Office files to Microsoft Office Online or Google Docs viewer:

```typescript
// For DOCX files, show viewer instead
const fileExtension = latestVersion.filePath.split('.').pop()?.toLowerCase()
const officeFormats = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']

if (officeFormats.includes(fileExtension)) {
  // Serve from viewer like:
  // https://view.officeapps.live.com/op/view.aspx?src=[file-url]
  // OR
  // https://docs.google.com/viewer?url=[file-url]
}
```

---

### ✅ Solution 4: Serve with Correct Headers for Download

Change `Content-Disposition` from `inline` to `attachment`:

```typescript
// File: app/api/documents/[id]/preview/route.ts

return new NextResponse(fileBuffer as unknown as any, {
  status: 200,
  headers: {
    'Content-Type': preview.mimeType,
    'Content-Disposition': `attachment; filename="${displayFileName}"`, // Changed to 'attachment'
    'Cache-Control': 'public, max-age=3600',
  },
})
```

This tells browser "this is a download, not something to display"

---

## Recommended Implementation

**Combine Solutions 1 + 2:**

1. **Install LibreOffice conversion** for PDF files
   ```bash
   npm install libreoffice-convert
   ```

2. **For PDFs**: Display inline ✅
3. **For Office files without PDF**: Download/Open ✅

**Current Code Flow:**
```
1. Upload DOCX file
2. Conversion job queues (async)
3. PDF conversion happens in background
4. Next time user previews → Gets PDF → Displays ✅
5. First view → Gets DOCX → Downloads (expected)
```

---

## Quick Fix (No Installation)

If you don't want to install LibreOffice, just change the header:

**File:** `app/api/documents/[id]/preview/route.ts` (line ~75)

```typescript
// Change from:
'Content-Disposition': `inline; filename="${displayFileName}"`,

// To:
'Content-Disposition': `attachment; filename="${displayFileName}"`,
```

**Result:** Files will download with proper filename instead of trying to display

---

## Testing

### Current Behavior
```
Click Preview (DOCX) → Browser downloads file
```

### With LibreOffice Installed
```
Click Preview (DOCX) → Converts to PDF → Browser displays PDF ✅
```

### With Attachment Header
```
Click Preview (DOCX) → Browser downloads file with proper name ✅
```

---

## Summary

| Scenario | Solution | Effort |
|----------|----------|--------|
| Want to display Office files | Install LibreOffice | Medium |
| Okay with downloading Office files | Change header to `attachment` | Easy |
| Want online viewer | Implement viewer redirect | Medium |
| Want both PDF preview + Download button | Combine Solutions | Hard |

**Recommended:** Install LibreOffice for automatic PDF conversion
