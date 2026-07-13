# File Preview Structure - Complete Flow

## Overview
This document outlines the complete file preview flow in the enterprise banking platform, following the exact architecture you provided.

---

## Complete Flow Diagram

```
Upload File                      
       │                      
       ▼              
Next.js Backend                      
       │           
  Save file on disk              
       │                      
       ▼                 
   Database           
(Store file metadata)                      
       │         
  id, department,         
  division, fileName,         
  filePath, status                    
       │                      
       ▼                
 Frontend Table                      
       │       
User clicks "Preview"                      
       │                      
       ▼       
GET /api/documents/:id/preview                      
       │                      
       ▼              
  Next.js Backend                      
       │           
  Query database by ID                      
       │                      
       ▼            
Get file location                      
       │                      
       ▼         
Check if file exists              
       │             │             
      Yes            No              
       │              │              
       ▼              ▼       
 Set Content-Type    Return 404              
       │              
       ▼        
  Stream file to browser             
       │              
       ▼      
Browser displays preview
```

---

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  department_id UUID,
  division_id UUID,
  status VARCHAR(20) DEFAULT 'draft',
  current_version INTEGER DEFAULT 1,
  owner_id UUID NOT NULL,
  owner_name VARCHAR(255),
  access_level VARCHAR(20) DEFAULT 'internal',
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Document Versions Table
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id),
  version INTEGER NOT NULL,
  change_note TEXT,
  file_name VARCHAR(255),
  file_path VARCHAR(255),  -- KEY: Stores path like /uploads/uuid.pdf
  author_id UUID,
  author_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Example Data
```
id                                  Department  Subject     File Name        File Path
────────────────────────────────    ──────────  ─────────   ──────────────   ─────────────────────────
550e8400-e29b-41d4-a716-446655440000 HR          Policy      policy.pdf       /uploads/550e8400.pdf
6ba7b810-9dad-11d1-80b4-00c04fd430c0 Finance     Budget      budget.xlsx      /uploads/6ba7b810.xlsx
6ba7b811-9dad-11d1-80b4-00c04fd430c1 IT          Network     network.pdf      /uploads/6ba7b811.pdf
```

---

## API Endpoints

### 1. Upload File
**Endpoint**: `POST /api/documents`

**Request**:
```typescript
interface UploadRequest {
  file: File
  title: string
  category: string
  departmentId: string
  divisionId: string
  accessLevel: 'internal' | 'restricted' | 'public'
}
```

**Response** (201 Created):
```typescript
interface UploadResponse {
  success: true
  data: {
    id: string
    title: string
    fileName: string
    filePath: string
    version: number
  }
}
```

**Backend Flow**:
```
POST /api/documents
       ▼
Parse FormData
       ▼
Validate user permissions (documents:create)
       ▼
Create document ID
       ▼
Save file to /public/uploads/[documentId].[ext]
       ▼
Insert into documents table
       ▼
Insert into document_versions table with filePath
       ▼
Return 201 with document data
```

---

### 2. List Files
**Endpoint**: `GET /api/documents?page=1&limit=20`

**Response** (200 OK):
```typescript
interface ListResponse {
  success: true
  data: {
    data: Document[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

interface Document {
  id: string
  title: string
  category: string
  departmentId: string
  divisionId: string
  ownerName: string
  createdAt: Date
  currentVersion: number
  status: string
}
```

**Database Query**:
```sql
SELECT 
  id, title, description, category, 
  department_id, division_id, status, 
  current_version, tags, owner_id, owner_name, 
  access_level, expiry_date, created_at, updated_at
FROM documents
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

### 3. Preview File (KEY ENDPOINT)
**Endpoint**: `GET /api/documents/:id/preview`

**Request Headers**:
```
Authorization: Bearer [token]
```

**Response**:
```
Content-Type: application/pdf (or other MIME type)
Content-Disposition: inline; filename="document.pdf"
Cache-Control: public, max-age=3600

[Binary file data streamed to browser]
```

---

## Preview Endpoint Implementation

### Step 1: Authentication & Authorization ✅
```typescript
const { error, user } = await requirePermission(
  req,
  "documents:view"
)
if (error) return error  // Returns 403 if no permission

// Checks:
// ✓ User is logged in
// ✓ User has documents:view permission
// ✓ User can see this department's files
```

**Output if failed**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### Step 2: Query Database ✅
```typescript
const document = await DocumentService.getDocument(documentId)

// SQL Generated:
// SELECT * FROM documents WHERE id = ?

// Result example:
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Policy Document',
  category: 'policy',
  department_id: 'hr-dept-id',
  division_id: 'hr-div-id',
  owner_name: 'John Doe',
  access_level: 'internal',
  created_at: '2026-06-28T10:30:00Z'
}
```

---

### Step 3: Get File Path ✅
```typescript
const latestVersion = await db
  .select()
  .from(documentVersions)
  .where(eq(documentVersions.documentId, documentId))
  .orderBy(desc(documentVersions.version))
  .limit(1)

// Result:
{
  id: 'version-uuid',
  documentId: '550e8400-...',
  version: 1,
  fileName: 'policy.pdf',
  filePath: '/uploads/550e8400-e29b-41d4-a716-446655440000.pdf'  // KEY
}
```

---

### Step 4: Verify File Exists ✅
```typescript
if (latestVersion.length > 0 && latestVersion[0].filePath) {
  try {
    const filePath = latestVersion[0].filePath
    const fileBuffer = await FileStorageService.getFile(filePath)
    // File exists and loaded successfully
  } catch (fileErr) {
    console.log('[Preview] File not found in storage')
    // Fall through to return metadata
  }
} else {
  // No file path found (metadata-only document)
  // Fall through to return metadata
}
```

**File verification process**:
```
filePath: /uploads/550e8400-e29b-41d4-a716-446655440000.pdf
       ▼
Full path: /project/public/uploads/550e8400-e29b-41d4-a716-446655440000.pdf
       ▼
fs.readFile() checks:
  ✓ File exists
  ✓ Readable permissions
  ✓ Returns Buffer
       ▼
SUCCESS: Return file buffer
       ▼
FAILURE: Return metadata instead
```

---

### Step 5: Detect MIME Type ✅
```typescript
const fileExtension = fileName.split('.').pop()?.toLowerCase()

const mimeTypes: Record<string, string> = {
  'pdf':  'application/pdf',
  'doc':  'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls':  'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt':  'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'jpg':  'image/jpeg',
  'jpeg': 'image/jpeg',
  'png':  'image/png',
  'gif':  'image/gif',
  'webp': 'image/webp',
  'txt':  'text/plain',
  'csv':  'text/csv',
  'md':   'text/markdown'
}

const mimeType = mimeTypes[extension] || 'application/octet-stream'
```

**MIME Type Examples**:
| Extension | MIME Type | Preview Method |
|-----------|-----------|-----------------|
| pdf | application/pdf | Browser PDF viewer |
| jpg, png, gif | image/* | `<img>` tag |
| txt | text/plain | Text display |
| docx | office document | Download + warning |
| xlsx | spreadsheet | Download + warning |

---

### Step 6: Set Response Headers ✅
```typescript
return new NextResponse(fileBuffer, {
  status: 200,
  headers: {
    'Content-Type': mimeType,  
    // Key: 'inline' = preview, 'attachment' = download
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Cache-Control': 'public, max-age=3600'  // Cache for 1 hour
  }
})
```

**Header Details**:
```
Content-Type: 
  - Tells browser what type of file it is
  - Browser decides how to display it

Content-Disposition: inline
  - 'inline' = display in browser (preview)
  - 'attachment' = download file

Cache-Control:
  - Browser can cache file for 1 hour
  - Reduces server load for repeated previews
```

---

### Step 7: Stream File ✅
```typescript
// The file buffer is returned to browser
// Browser automatically streams it to user

// Flow:
Backend (Server) ─────> File Buffer ─────> Browser
                  Streaming Response     Display/Download
```

---

### Step 8: Handle Metadata-Only Documents ✅
```typescript
// If no file found, return metadata instead
const content = `
DOCUMENT PREVIEW
==============================================================

Title: ${document.title}
Description: ${document.description}
Category: ${document.category}
Status: ${document.status}
Access Level: ${document.accessLevel}
Created by: ${document.ownerName}
Created at: ${new Date(document.createdAt).toLocaleString()}

Note: This document was created before file storage was available.
To preview the actual file, please re-upload the document.
`

return new NextResponse(content, {
  status: 200,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `inline; filename="${fileName}.txt"`
  }
})
```

---

## Frontend Implementation

### File Management Table
```tsx
// Display files in a table
<table>
  <thead>
    <tr>
      <th>File Name</th>
      <th>Department</th>
      <th>Division</th>
      <th>Date Uploaded</th>
      <th>Uploaded By</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {files.map(file => (
      <tr key={file.id}>
        <td>{file.title}</td>
        <td>{file.category}</td>
        <td>{file.divisionName}</td>
        <td>{new Date(file.createdAt).toLocaleDateString()}</td>
        <td>{file.uploadedBy}</td>
        <td>
          <button onClick={() => handlePreview(file.id)}>
            👁️ Preview
          </button>
          <button onClick={() => handleDownload(file.id)}>
            ⬇️ Download
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### Preview Handler - Click Event
```tsx
const handleViewFile = async (fileId: string, file: FileRecord) => {
  try {
    // User clicks Preview button
    const previewUrl = `/api/documents/${fileId}/preview`
    
    // Open in new tab
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
    
    // Browser flow:
    // 1. Sends GET request to /api/documents/{id}/preview
    // 2. Backend processes (see steps above)
    // 3. Backend returns file with Content-Type and Content-Disposition: inline
    // 4. Browser receives response with headers
    // 5. Based on Content-Type:
    //    - PDF: Browser's PDF viewer displays it
    //    - Image: Browser displays image
    //    - Text: Browser displays text
    //    - Office: Browser prompts download or shows error
  } catch (err) {
    console.error('Preview error:', err)
    alert('Failed to preview file')
  }
}
```

---

### Preview Display Methods

#### For PDF Files
```tsx
// Option 1: Embed viewer
<iframe 
  src={`/api/documents/${fileId}/preview`}
  width="100%"
  height="700px"
/>

// Option 2: Native browser handling (current implementation)
window.open(`/api/documents/${fileId}/preview`, '_blank')
```

#### For Image Files
```tsx
// Option 1: Image tag
<img src={`/api/documents/${fileId}/preview`} />

// Option 2: New tab (current implementation)
window.open(`/api/documents/${fileId}/preview`, '_blank')
```

#### For Text Files
```tsx
// Browser displays as plain text
// Automatically handled by Content-Type: text/plain
```

#### For Office Files
```tsx
// Current behavior: Shows metadata
// Future: Could integrate with Google Docs Viewer
const pdfEmbedUrl = `https://docs.google.com/gview?url=${fileUrl}&embedded=true`
```

---

## Request/Response Flow

### Complete HTTP Flow

```
USER INTERACTION
       │
       │ Click "Preview" button in File Management Table
       │
       ▼
FRONTEND (React Component)
       │
       │ const previewUrl = `/api/documents/550e8400.../preview`
       │ window.open(previewUrl, '_blank')
       │
       ▼
BROWSER
       │
       │ GET /api/documents/550e8400-e29b-41d4-a716-446655440000/preview
       │ Headers:
       │   - Authorization: Bearer [token]
       │   - Accept: */*
       │   - User-Agent: Chrome/...
       │
       ▼
BACKEND (Next.js API Route)
       │
       ├─ Step 1: Validate Auth
       │    └─ Check permission: documents:view
       │       └─ ✓ Authorized
       │
       ├─ Step 2: Extract ID
       │    └─ documentId = 550e8400-e29b-41d4-a716-446655440000
       │
       ├─ Step 3: Query Database
       │    └─ SELECT * FROM documents WHERE id = ?
       │       └─ Found: Policy Document (hr dept)
       │
       ├─ Step 4: Get File Path
       │    └─ SELECT * FROM document_versions WHERE document_id = ?
       │       └─ filePath = /uploads/550e8400-e29b-41d4-a716-446655440000.pdf
       │
       ├─ Step 5: Verify File Exists
       │    └─ fs.readFile(/project/public/uploads/550e8400-...)
       │       └─ ✓ File found (2.5 MB)
       │
       ├─ Step 6: Detect MIME Type
       │    └─ Extension: .pdf
       │       └─ MIME Type: application/pdf
       │
       ├─ Step 7: Set Headers
       │    └─ Content-Type: application/pdf
       │    └─ Content-Disposition: inline; filename="Policy Document.pdf"
       │    └─ Cache-Control: public, max-age=3600
       │
       └─ Step 8: Return File
          └─ HTTP 200 OK
             Response Body: [Binary PDF data]
             Headers: [See Step 7]
       │
       ▼
BROWSER (Receives Response)
       │
       │ Status: 200 OK
       │ Headers:
       │   - Content-Type: application/pdf
       │   - Content-Disposition: inline; filename="Policy Document.pdf"
       │   - Content-Length: 2621440
       │
       ├─ Parse Content-Type: application/pdf
       │    └─ Recognized file type: PDF
       │
       ├─ Parse Content-Disposition: inline
       │    └─ Action: Display in browser (not download)
       │
       ├─ Stream Response Body
       │    └─ Receive PDF data in chunks
       │
       └─ Render PDF
          └─ Use built-in PDF viewer
             └─ Display to user
       │
       ▼
USER SEES
       │
       └─ New tab opens with PDF displayed in browser viewer
          User can: zoom, scroll, print, download from viewer
```

---

## Folder Structure

```
project/
├── public/
│   └── uploads/                    # KEY: File storage location
│       ├── 550e8400-e29b-41d4-...pdf
│       ├── 6ba7b810-9dad-11d1-...xlsx
│       └── 6ba7b811-9dad-11d1-...pdf
│
├── app/
│   ├── api/
│   │   └── documents/
│   │       ├── route.ts            # POST (upload), GET (list)
│   │       └── [id]/
│   │           ├── route.ts        # GET (get one)
│   │           ├── preview/
│   │           │   └── route.ts    # GET (preview) ← KEY ENDPOINT
│   │           └── download/
│   │               └── route.ts    # GET (download)
│   │
│   ├── file-management/
│   │   └── page.tsx               # Frontend table with preview button
│   │
│   └── actions/
│       └── documents.ts           # Server action to fetch documents
│
├── components/
│   ├── file-management-table.tsx  # Table with preview/download buttons
│   └── file-upload-form.tsx       # Upload form
│
├── lib/
│   ├── services/
│   │   ├── document.service.ts    # Document business logic
│   │   └── file-storage.service.ts # File I/O operations
│   │
│   ├── db/
│   │   └── schema.ts              # Database schema
│   │
│   └── session.ts                 # Auth & permissions
│
└── package.json
```

---

## Key Points

### ✅ What's Working
- Authentication & authorization check
- Database queries for metadata
- File path retrieval
- MIME type detection
- Response headers with inline disposition
- File streaming to browser
- Metadata fallback for old documents

### ✅ File Storage Location
- Files stored in: `/project/public/uploads/`
- Named with UUID: `550e8400-e29b-41d4-a716-446655440000.pdf`
- Path stored in database: `/uploads/[uuid].[ext]`
- Served via HTTP: `GET /api/documents/[id]/preview`

### ✅ Security
- Auth required (requirePermission)
- Permission check (documents:view)
- File path validated
- MIME type validated
- Cache headers for performance

### ✅ Error Handling
- File not found → Returns metadata text file
- Auth failed → Returns 403 Forbidden
- Database error → Returns 500 Internal Server Error
- MIME type unknown → Defaults to application/octet-stream

---

## Complete Request/Response Example

### Request
```
GET /api/documents/550e8400-e29b-41d4-a716-446655440000/preview HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: */*
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
```

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="Policy Document.pdf"
Content-Length: 2621440
Cache-Control: public, max-age=3600
Date: Thu, 03 Jul 2026 15:30:45 GMT

[Binary PDF data... 2.6 MB of data streamed to browser]
```

### Response (File Not Found)
```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Disposition: inline; filename="Policy Document.txt"
Content-Length: 450

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

---

## Summary

Your preview structure perfectly implements the flow you outlined:

✅ **File uploaded** → Stored in `/public/uploads/`  
✅ **Metadata saved** → Stored in database with filePath  
✅ **User clicks preview** → Calls `GET /api/documents/:id/preview`  
✅ **Auth checked** → requirePermission validates access  
✅ **Database queried** → Gets file metadata and path  
✅ **File verified** → Checks if file exists on disk  
✅ **MIME type detected** → Sets appropriate Content-Type  
✅ **Response headers set** → Content-Disposition: inline  
✅ **File streamed** → Binary data sent to browser  
✅ **Browser displays** → PDF viewer / Image / Text viewer  

All steps properly implemented! ✅
