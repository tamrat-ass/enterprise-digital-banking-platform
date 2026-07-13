# Architecture Diagrams - File Upload & Preview System

## 1. COMPLETE SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
│  Browser - File Management Table & Upload Form                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲  ▼
                  HTTP Request/Response (JSON)
                              ▲  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API LAYER                            │
│  ├── POST /api/documents (Upload)                              │
│  ├── GET /api/documents (List files)                           │
│  ├── GET /api/documents/:id/preview (PREVIEW)                 │
│  └── GET /api/documents/:id/download (Download)               │
└─────────────────────────────────────────────────────────────────┘
                    ▲           ▲           ▲
                    │           │           │
        ┌───────────┴───────────┴───────────┴──────────┐
        │                                               │
        ▼                                               ▼
┌──────────────────────────┐              ┌──────────────────────────┐
│   PostgreSQL Database    │              │  File Storage System     │
│  (Metadata)              │              │  /public/uploads/        │
│                          │              │                          │
│ - documents table        │              │ - UUID.pdf               │
│ - document_versions      │              │ - UUID.xlsx              │
│ - file_path reference    │              │ - UUID.png               │
└──────────────────────────┘              └──────────────────────────┘
```

---

## 2. UPLOAD FLOW

```
USER
  │
  │ Selects file & fills form
  │
  ▼
┌─────────────────────────────────┐
│  Frontend Upload Component      │
│  - File selection               │
│  - Form validation              │
│  - Prepare FormData             │
└─────────────────────────────────┘
  │
  │ FormData with file, title, dept, div
  │
  ▼
POST /api/documents
  │
  ▼
┌─────────────────────────────────┐
│  Backend: Parse & Validate      │
│  - Parse FormData               │
│  - Validate user permissions    │
│  - Check file size              │
└─────────────────────────────────┘
  │
  ▼ File content (ArrayBuffer)
┌─────────────────────────────────┐
│ FileStorageService              │
│ - Create /uploads dir if needed │
│ - Save file with UUID name      │
│ - Verify file exists            │
│ - Return file path              │
└─────────────────────────────────┘
  │
  ▼ /uploads/[uuid].pdf
┌─────────────────────────────────┐
│  Database Insert                │
│                                 │
│ documents table:                │
│  id, title, dept_id, div_id     │
│                                 │
│ document_versions table:        │
│  document_id, filePath,         │
│  fileName, version              │
└─────────────────────────────────┘
  │
  ▼ HTTP 201 Created
┌─────────────────────────────────┐
│  Frontend Shows Success          │
│  - Message to user              │
│  - Refresh file list            │
└─────────────────────────────────┘
```

---

## 3. PREVIEW FLOW (KEY PROCESS)

```
USER INTERACTION
  │
  │ Clicks "Preview" button in table
  │ (File ID: 550e8400-e29b-41d4...)
  │
  ▼
Frontend: handleViewFile(fileId)
  │
  │ const previewUrl = `/api/documents/${fileId}/preview`
  │ window.open(previewUrl, '_blank')
  │
  ▼
Browser HTTP Request
  │
  │ GET /api/documents/550e8400-e29b-41d4-a716-446655440000/preview
  │ Headers: { Authorization: Bearer [...] }
  │
  ▼
Backend: GET Handler
  │
  ├─► requirePermission(req, "documents:view")
  │    └─ Check: User logged in? ✓
  │    └─ Check: Has permission? ✓
  │    └─ Authorized ✓
  │
  ├─► Extract ID from URL params
  │    └─ documentId = 550e8400-e29b-41d4-a716-446655440000
  │
  ├─► DocumentService.getDocument(documentId)
  │    └─ Query: SELECT * FROM documents WHERE id = ?
  │    └─ Result: { title, dept_id, div_id, ... }
  │
  ├─► Get latest version
  │    └─ SELECT FROM document_versions WHERE doc_id = ?
  │    └─ Result: { filePath: /uploads/550e8400-... }
  │
  ├─► FileStorageService.getFile(filePath)
  │    └─ Full path: /project/public/uploads/550e8400-...pdf
  │    └─ fs.readFile() → Check if exists
  │    └─ ✓ File found → Return buffer
  │    └─ ✗ File not found → Return null
  │
  ├─► Detect MIME Type
  │    └─ Extension: .pdf
  │    └─ MIME Type: application/pdf
  │
  ├─► Set Response Headers
  │    └─ Content-Type: application/pdf
  │    └─ Content-Disposition: inline ← KEY!
  │    └─ Cache-Control: public, max-age=3600
  │
  └─► Return Response
       └─ Status: 200 OK
       └─ Body: [Binary PDF data]
       │
       ▼
Browser Receives Response
  │
  ├─ Check Status: 200 OK ✓
  │
  ├─ Parse Headers:
  │  └─ Content-Type: application/pdf
  │  └─ Content-Disposition: inline
  │
  ├─ Recognize: This is a PDF to display (not download)
  │
  └─ Stream body data
  │
  ▼
Browser PDF Viewer
  │
  └─ Displays PDF in new tab
     User can: zoom, scroll, print, save
```

---

## 4. DATABASE RELATIONSHIPS

```
┌────────────────────────────┐
│      documents             │
├────────────────────────────┤
│ id (UUID)           [PK]   │
│ title               [str]  │
│ description         [txt]  │
│ category            [str]  │
│ department_id       [UUID] │◄──────┐
│ division_id         [UUID] │◄──────┤
│ owner_id            [UUID] │       │
│ owner_name          [str]  │       │
│ status              [str]  │       │
│ created_at          [ts]   │       │
│ updated_at          [ts]   │       │
└────────────────────────────┘       │
            ▲                        │
            │ 1:Many               │
            │                       │
            │                    References
            │                       │
┌────────────────────────────┐       │
│  document_versions         │       │
├────────────────────────────┤       │
│ id (UUID)           [PK]   │       │
│ document_id (UUID)  [FK]   │───────┘
│ version             [int]  │
│ file_name           [str]  │
│ file_path           [str]  │ ◄─── KEY: /uploads/uuid.pdf
│ change_note         [txt]  │
│ author_id           [UUID] │
│ author_name         [str]  │
│ created_at          [ts]   │
└────────────────────────────┘
```

---

## 5. PREVIEW: FILE NOT FOUND FALLBACK

```
User clicks Preview
  │
  ▼
Backend processes...
  │
  ▼
FileStorageService.getFile(filePath)
  │
  ├─ File found
  │  └─ Return binary buffer
  │  └─ Content-Type: [detected MIME]
  │  └─ Display in browser
  │
  └─ File NOT found (catch error)
     └─ Return metadata as text
     └─ Content-Type: text/plain
     └─ Show helpful message
        
Content returned:
```
DOCUMENT PREVIEW
==============================================================

Title: Policy Document
Description: HR Policy
Category: policy
Status: draft
Access Level: internal

Created by: John Doe
Created at: 6/28/2026, 10:30:00 AM

Note: This document was created before file storage was available.
To preview the actual file, please re-upload the document.
```
     └─ Browser displays as text

---

## 6. MIME TYPES & PREVIEW BEHAVIOR

```
File Type  │ Extension │ MIME Type                              │ Display
───────────┼───────────┼────────────────────────────────────────┼──────────────────
PDF        │ .pdf      │ application/pdf                        │ Browser PDF viewer
───────────┼───────────┼────────────────────────────────────────┼──────────────────
Image      │ .png      │ image/png                              │ Image displayed
           │ .jpg      │ image/jpeg                             │
           │ .gif      │ image/gif                              │
───────────┼───────────┼────────────────────────────────────────┼──────────────────
Text       │ .txt      │ text/plain                             │ Plain text
           │ .csv      │ text/csv                               │
           │ .md       │ text/markdown                          │
───────────┼───────────┼────────────────────────────────────────┼──────────────────
Office     │ .doc      │ application/msword                     │ Download /
           │ .docx     │ application/...wordprocessingml.       │ Google Docs
           │ .xls      │ application/vnd.ms-excel              │
           │ .xlsx     │ application/...spreadsheetml.          │
           │ .ppt      │ application/vnd.ms-powerpoint          │
           │ .pptx     │ application/...presentationml.         │
───────────┼───────────┼────────────────────────────────────────┼──────────────────
Unknown    │ .*        │ application/octet-stream               │ Download
```

---

## 7. COMPLETE HTTP REQUEST/RESPONSE

```
REQUEST
═════════════════════════════════════════════════════════════════
GET /api/documents/550e8400-e29b-41d4-a716-446655440000/preview HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: */*

[No request body]

RESPONSE (Success)
═════════════════════════════════════════════════════════════════
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="Policy Document.pdf"
Content-Length: 2621440
Cache-Control: public, max-age=3600
Date: Thu, 03 Jul 2026 15:30:45 GMT

[Binary PDF data - 2.6 MB]
...
(Streamed to browser in chunks)
...

RESPONSE (File Not Found - Fallback)
═════════════════════════════════════════════════════════════════
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Disposition: inline; filename="Policy Document.txt"
Content-Length: 450
Date: Thu, 03 Jul 2026 15:30:46 GMT

DOCUMENT PREVIEW
==============================================================

Title: Policy Document
...
[Metadata text response]

RESPONSE (Unauthorized)
═════════════════════════════════════════════════════════════════
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": "Permission denied"
}

RESPONSE (File Not Found - with error)
═════════════════════════════════════════════════════════════════
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "error": "Document not found"
}
```

---

## 8. FILE STORAGE LOCATION

```
Project Root
    │
    ├── public/
    │   └── uploads/                    ◄── FILES STORED HERE
    │       ├── 550e8400-e29b-41d4-a716-446655440000.pdf
    │       │   └─ Size: 2.6 MB
    │       │   └─ Created: 2026-06-28
    │       │
    │       ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c0.xlsx
    │       │   └─ Size: 1.2 MB
    │       │
    │       └── 6ba7b811-9dad-11d1-80b4-00c04fd430c1.pdf
    │           └─ Size: 3.4 MB
    │
    ├── app/
    ├── lib/
    ├── components/
    └── package.json

Database References:
  document_versions.filePath = /uploads/550e8400-e29b-41d4-a716-446655440000.pdf
  Full path on disk = /project/public/uploads/550e8400-e29b-41d4-a716-446655440000.pdf
```

---

## 9. SECURITY FLOW

```
User Request
    │
    ▼
┌─────────────────────────────────┐
│  Step 1: Authentication         │
│  - Token exists?                │
│  - Token valid?                 │
│  - User exists in DB?           │
└─────────────────────────────────┘
    │
    ├─ FAIL ──► 401 Unauthorized
    │
    ▼
┌─────────────────────────────────┐
│  Step 2: Authorization          │
│  - User has documents:view?     │
│  - Can see this dept's files?   │
└─────────────────────────────────┘
    │
    ├─ FAIL ──► 403 Forbidden
    │
    ▼
┌─────────────────────────────────┐
│  Step 3: File Access            │
│  - Document exists?             │
│  - File exists on disk?         │
└─────────────────────────────────┘
    │
    ├─ FAIL ──► 404 Not Found
    │
    ▼
┌─────────────────────────────────┐
│  Step 4: Serve File             │
│  - Read from disk               │
│  - Stream to user               │
│  - Log access                   │
└─────────────────────────────────┘
    │
    ▼
200 OK + Binary Data
```

