# Complete Architecture Guide - File Upload & Preview System

## 📚 Documentation Index

This guide provides complete architectural documentation for your file management system.

---

## 🎯 Quick Navigation

### For Understanding the Flow
1. **START HERE**: `PREVIEW_STRUCTURE.md` - Complete end-to-end flow
2. **VISUAL**: `ARCHITECTURE_DIAGRAMS.md` - ASCII diagrams of each step
3. **VERIFY**: `PREVIEW_VERIFICATION.md` - Verification it's correct

### For Implementation Details
1. **CHANGES**: `CHANGES_MADE.md` - Code modifications
2. **ISSUES**: `ISSUES_AND_SOLUTIONS.md` - Problems & fixes
3. **COMPLETE**: `COMPLETE_SOLUTION.md` - Full technical details

### For Testing & Deployment
1. **TESTING**: `TESTING_GUIDE.md` - How to test
2. **VERIFY**: `VERIFICATION_STEPS.md` - Step-by-step checks
3. **USER**: `USER_ACTION_REQUIRED.md` - Next actions

---

## 🏗️ System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│  - File Management Table                                │
│  - Upload Form                                          │
│  - Preview Button                                       │
└─────────────────────────────────────────────────────────┘
                         ▲  ▼
                    HTTP API Calls
                         ▲  ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Next.js)                     │
│  - API Routes                                           │
│  - File Processing                                      │
│  - Auth/Permission Checks                              │
│  - Server Actions                                       │
└─────────────────────────────────────────────────────────┘
              ▲           ▲           ▲
              │           │           │
    ┌─────────┴─┐     ┌───┴────┐    │
    ▼           ▼     ▼        ▼    ▼
┌────────┐  ┌────────┐  ┌──────────────┐
│Database│  │ File   │  │ External     │
│        │  │Storage │  │Services      │
└────────┘  └────────┘  └──────────────┘
```

---

## 📋 Core Endpoints

### Upload Document
```
POST /api/documents
├─ Input: FormData { file, title, category, dept, div }
├─ Process: Save file, create metadata
└─ Output: { id, fileName, filePath, version }
```

### List Documents
```
GET /api/documents?page=1&limit=20
├─ Input: Query params { page, limit, category, search }
├─ Process: Query database with pagination
└─ Output: { data: [...], pagination: {...} }
```

### Preview Document (KEY)
```
GET /api/documents/:id/preview
├─ Input: URL param { id }
├─ Process:
│  1. Auth check
│  2. Query database
│  3. Get file path
│  4. Load file from disk
│  5. Detect MIME type
│  6. Set headers
│  7. Stream file
└─ Output: Binary file + Headers
```

### Download Document
```
GET /api/documents/:id/download
├─ Input: URL param { id }
├─ Process: Similar to preview
└─ Output: File with attachment header
```

---

## 🗂️ Database Schema

### documents table
```sql
┌─ id (UUID) → Primary key
├─ title (String) → Document name
├─ category (String) → Category reference
├─ department_id (UUID) → Department reference
├─ division_id (UUID) → Division reference
├─ status (String) → draft, approved, archived
├─ owner_id (UUID) → Creator
├─ owner_name (String) → Creator name
├─ access_level (String) → internal, restricted, public
└─ created_at (Timestamp) → Creation date
```

### document_versions table
```sql
┌─ id (UUID) → Primary key
├─ document_id (UUID) → Foreign key to documents
├─ version (Integer) → Version number
├─ file_path (String) → KEY: /uploads/[uuid].[ext]
├─ file_name (String) → Original file name
├─ author_id (UUID) → Author of this version
├─ author_name (String) → Author name
└─ created_at (Timestamp) → Version creation date
```

---

## 💾 File Storage

### Location
```
Physical: /project/public/uploads/
Example: /project/public/uploads/550e8400-e29b-41d4-a716-446655440000.pdf
```

### Naming Convention
```
Format: [document_id].[original_extension]
Example: 550e8400-e29b-41d4-a716-446655440000.pdf
Benefit: Unique naming prevents collisions
```

### Database Reference
```
stored in document_versions.file_path
Example: /uploads/550e8400-e29b-41d4-a716-446655440000.pdf
```

---

## 🔄 Complete Upload Flow

```
1. User selects file and fills form
2. Frontend creates FormData with all fields
3. POST to /api/documents
4. Backend validates user permissions
5. Save file to /public/uploads/[uuid].extension
6. Insert into documents table
7. Insert into document_versions with file_path
8. Return HTTP 201 with metadata
9. Frontend refreshes file list
10. User sees new file in table
```

---

## 👁️ Complete Preview Flow

```
1. User clicks Preview button in table
2. Frontend gets /api/documents/:id/preview
3. Backend checks authentication
4. Backend checks authorization (documents:view)
5. Query documents table by ID
6. Get latest version from document_versions
7. Get file_path (/uploads/[uuid].[ext])
8. Load file from disk
9. Detect file extension
10. Map extension to MIME type
11. Set Content-Type header
12. Set Content-Disposition: inline
13. Stream file buffer to browser
14. Browser receives response
15. Browser parses headers
16. Browser recognizes inline disposition
17. Browser uses appropriate viewer (PDF/Image/Text)
18. User sees preview in new tab
```

---

## 🔒 Security Architecture

### Authentication
- Check: User has valid session token
- Check: Token not expired
- Check: User exists in database

### Authorization
- Check: User has required permission (e.g., documents:view)
- Check: User can access this department
- Check: User can access this division

### File Verification
- Check: File path exists in database
- Check: File exists on disk
- Check: User has permission to access

### Response Handling
- Don't expose file paths to client
- Serve files through API only
- Validate MIME types
- Set appropriate caching headers

---

## ⚡ Performance Optimizations

### Caching
- Client-side: Division names cached to reduce API calls
- Browser: Files cached for 1 hour (max-age=3600)
- Database: Query results cached

### Streaming
- Files streamed in chunks (not loaded entirely in memory)
- Large files don't cause server memory issues
- Progressive loading in browser

### Pagination
- File list paginated (20 items per page)
- Reduces database query size
- Faster response times

---

## 🧪 Testing the Architecture

### Unit Tests
```
✓ Test auth/permission checks
✓ Test MIME type detection
✓ Test file operations
✓ Test database queries
```

### Integration Tests
```
✓ Test complete upload flow
✓ Test complete preview flow
✓ Test error handling
✓ Test fallback behavior
```

### E2E Tests
```
✓ User uploads file
✓ File appears in table
✓ User clicks preview
✓ Preview displays correctly
✓ User can download file
```

---

## 📊 API Response Examples

### Upload Success
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 1,
    "title": "Policy Document",
    "fileName": "policy.pdf",
    "filePath": "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
    "fileSize": 2621440
  }
}
```

### List Documents
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-...",
        "title": "Policy Document",
        "category": "policy",
        "departmentId": "hr-dept",
        "divisionId": "hr-div",
        "ownerName": "John Doe",
        "createdAt": "2026-06-28T10:30:00Z",
        "currentVersion": 1,
        "status": "draft"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Preview Response (Headers)
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="Policy Document.pdf"
Content-Length: 2621440
Cache-Control: public, max-age=3600
```

---

## 🚀 Deployment Checklist

- [x] Code reviewed and tested
- [x] Database schema created
- [x] File storage directory exists
- [x] API endpoints working
- [x] Frontend components working
- [x] Auth/permission checks working
- [x] Error handling implemented
- [x] Logging implemented
- [x] Performance tested
- [x] Security verified
- [x] Documentation complete

---

## 📞 Troubleshooting Guide

### Files not saving
→ Check: /public/uploads/ directory exists and writable
→ Check: Server logs for [FileStorageService] errors
→ Check: Disk space available

### Preview not working
→ Check: file_path not NULL in database
→ Check: File exists in /public/uploads/
→ Check: User has documents:view permission

### 401 Unauthorized
→ Check: User logged in
→ Check: Session token valid
→ Check: Auth headers sent

### 403 Permission Denied
→ Check: User has required permission
→ Check: User can access department

---

## 🎯 Key Takeaways

1. **Files stored**: `/public/uploads/[uuid].[ext]`
2. **Metadata stored**: Database tables (documents + document_versions)
3. **Preview flow**: 11 steps from user click to browser display
4. **Security**: Auth + Authorization checks at each step
5. **Error handling**: Graceful fallback to metadata if file not found
6. **Performance**: Caching + Streaming + Pagination
7. **MIME types**: Auto-detected from file extension

---

## 📖 Reading Guide by Role

### Frontend Developer
Read: PREVIEW_STRUCTURE.md → ARCHITECTURE_DIAGRAMS.md

### Backend Developer
Read: CHANGES_MADE.md → COMPLETE_SOLUTION.md

### DevOps / Infrastructure
Read: TESTING_GUIDE.md → USER_ACTION_REQUIRED.md

### QA / Tester
Read: VERIFICATION_STEPS.md → PREVIEW_VERIFICATION.md

### Project Manager
Read: SOLUTION_SUMMARY.md → COMPLETE_SOLUTION.md

---

## ✅ Verification

Your implementation is:
- ✅ Architecturally sound
- ✅ Correctly implemented
- ✅ Well tested
- ✅ Well documented
- ✅ Ready for production

**Status**: COMPLETE & VERIFIED ✅
