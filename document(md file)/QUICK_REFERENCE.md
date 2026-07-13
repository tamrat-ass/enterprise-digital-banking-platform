# Quick Reference - Document Management System

## For End Users

### Upload a Document
1. Go to File Management page
2. Click "Upload" button
3. Select file from computer
4. Fill in details (title, category, division, etc.)
5. Click "Upload"
6. ✅ File saved and ready

### Preview a Document
1. Find document in list
2. Click 👁️ (Preview/Eye icon)
3. File opens in new browser window
   - PDFs display in browser
   - Office files download (use Office to open)
4. Filename shown at top

### Download a Document
1. Find document in list
2. Click ⬇️ (Download icon)
3. File downloads to Downloads folder
4. ✅ Ready to open or share

---

## For Developers

### Key Files

**Document Upload:**
- `components/file-upload-form.tsx` - Upload form
- `app/actions/documents.ts` - Upload API call
- `lib/services/document.service.ts` - Business logic

**File Storage:**
- `lib/services/file-storage.service.ts` - Disk storage
- `app/api/documents/[id]/preview/route.ts` - Preview endpoint
- `app/api/documents/[id]/download/route.ts` - Download endpoint

**Database:**
- Schema: `lib/db/schema.ts`
- Migrations: `app/api/admin/add-pdf-path-column/route.ts`

### Common Tasks

**Add new file type:**
1. Edit `MIME_TYPES` in `app/api/documents/[id]/download/route.ts`
2. Add extension and MIME type mapping

**Change file storage location:**
1. Edit `UPLOAD_DIR` in `lib/services/file-storage.service.ts`
2. Update to new path

**Modify filename handling:**
1. Edit line 37 in `app/api/documents/[id]/preview/route.ts`
2. Or line 62 in `app/api/documents/[id]/download/route.ts`

---

## API Endpoints

### Preview (Display in Browser)
```
GET /api/documents/{documentId}/preview
Headers: Authorization: Bearer {token}
Response: File content with inline disposition
```

### Download (Force Download)
```
GET /api/documents/{documentId}/download
Headers: Authorization: Bearer {token}
Response: File content with attachment disposition
```

### Get Document Info
```
GET /api/documents/{documentId}
Headers: Authorization: Bearer {token}
Response: JSON with document metadata and versions
```

---

## Database Schema

### documents table
```
id                TEXT PRIMARY KEY
title             TEXT NOT NULL
description       TEXT
category          TEXT
department_id     TEXT
division_id       TEXT
status            TEXT (draft, approved, archived)
current_version   INTEGER
tags              JSON
owner_id          TEXT
owner_name        TEXT
access_level      TEXT (internal, confidential, etc)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### document_versions table
```
id                TEXT PRIMARY KEY
document_id       TEXT NOT NULL (FK)
version           INTEGER
change_note       TEXT
file_name         TEXT (actual uploaded filename)
file_path         TEXT (/uploads/[documentId].[ext])
pdf_path          TEXT (converted PDF if available)
author_id         TEXT
author_name       TEXT
created_at        TIMESTAMP
```

---

## Troubleshooting

### Issue: 404 on all pages
**Solution:** Restart dev server
```bash
# Stop: Ctrl+C
# Restart:
npm run dev
```

### Issue: Files not downloading with correct name
**Solution:** Check database `file_name` field is populated
- Verify during upload that fileName is captured
- Check document_versions table

### Issue: Preview shows download dialog for PDFs
**Solution:** 
- Check `Content-Disposition` header is `inline`
- Clear browser cache
- Try different browser

### Issue: File not found on disk
**Solution:**
- Check `/public/uploads/` directory exists
- Verify file path in database matches actual file
- Check file permissions

---

## Performance Tips

1. **Large files:** Use pagination for file lists
2. **Many users:** Add caching headers (done: max-age=3600)
3. **Storage:** Monitor `/public/uploads/` disk space
4. **Database:** Add indexes on `document_id`, `owner_id`

---

## Security Checklist

✅ Authentication required for all endpoints
✅ Permission checks (documents:view required)
✅ File path validation (no directory traversal)
✅ Filename escaping (special characters handled)
✅ MIME type validation
✅ Audit logging enabled
✅ Secure headers set

---

## Environment Variables

In `.env.local`:
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
PDF_CONVERSION_TIMEOUT=30000 (optional)
CLOUDCONVERT_ENABLED=false (optional)
CLOUDCONVERT_API_KEY=... (if enabled)
```

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Check for TypeScript errors
npx tsc --noEmit

# Lint code
npm run lint
```

---

## Key Improvements Made

1. ✅ Path normalization for Windows
2. ✅ Complete filenames preserved
3. ✅ Preview vs Download distinction
4. ✅ Database column migration
5. ✅ Proper MIME types
6. ✅ Security headers
7. ✅ Audit logging
8. ✅ Error handling

---

## Support

For issues or questions:
1. Check server logs: `npm run dev` output
2. Check browser console: F12 → Console
3. Check database: Verify data in document_versions table
4. Check file system: Verify files in `/public/uploads/`

---

**System Version:** 1.0 Production Ready ✅
**Last Updated:** July 11, 2026
**Status:** All systems operational
