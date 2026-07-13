# 📚 API Reference Guide

Complete API documentation for the Enterprise Digital Banking Governance Platform.

## Base URL

```
http://localhost:3000/api        (Development)
https://your-domain.com/api      (Production)
```

## Authentication

All endpoints require authentication via session cookies (set automatically by Better Auth).

For API access, include session in headers:

```bash
curl -X GET http://localhost:3000/api/documents \
  -H "Cookie: session=your-session-token"
```

## Response Format

### Success Response (200/201)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Example",
    ...
  }
}
```

### Error Response (400+)

```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "fieldName": ["Validation error"]
  }
}
```

## Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Documents Module

### List Documents

```http
GET /documents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `search` | string | Search by title |
| `category` | string | Filter by category |
| `status` | string | Filter by status |
| `departmentId` | string | Filter by department |

**Categories:** `policy`, `procedure`, `contract`, `guideline`, `report`, `other`

**Statuses:** `draft`, `approved`, `archived`

**Request:**

```bash
curl -X GET "http://localhost:3000/api/documents?page=1&limit=20&category=policy"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "doc-123",
        "title": "Security Policy",
        "category": "policy",
        "status": "approved",
        "currentVersion": 3,
        "ownerName": "John Doe",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  }
}
```

### Create Document

```http
POST /documents
```

**Request Body:**

```json
{
  "title": "Information Security Policy",
  "description": "Company-wide security guidelines and requirements",
  "category": "policy",
  "departmentId": "dept-456",
  "accessLevel": "internal",
  "tags": ["security", "policy", "2024"],
  "expiryDate": "2025-12-31T23:59:59Z"
}
```

**Field Validation:**

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `title` | ✓ | string | 1-255 chars |
| `description` | | string | |
| `category` | ✓ | enum | policy, procedure, contract, guideline, report, other |
| `departmentId` | | string | UUID |
| `accessLevel` | | enum | internal, restricted, public (default: internal) |
| `tags` | | array | string[] |
| `expiryDate` | | ISO string | Future date |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "doc-789",
    "title": "Information Security Policy",
    "status": "draft",
    "currentVersion": 1,
    "ownerId": "user-123",
    "ownerName": "John Doe",
    "createdAt": "2024-01-22T09:15:00Z"
  }
}
```

**Permissions Required:** `documents:create`

**Possible Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| 400 - Title is required | Missing title | Provide title |
| 401 - Unauthorized | Not logged in | Authenticate first |
| 403 - Insufficient permissions | User role denied | Contact admin |

### Get Document

```http
GET /documents/{id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "doc-789",
    "title": "Information Security Policy",
    "description": "...",
    "category": "policy",
    "status": "approved",
    "currentVersion": 3,
    "versions": [
      {
        "id": "ver-1",
        "version": 1,
        "changeNote": "Initial version",
        "authorName": "John Doe",
        "createdAt": "2024-01-22T09:15:00Z"
      },
      {
        "id": "ver-2",
        "version": 2,
        "changeNote": "Updated security requirements",
        "authorName": "Jane Smith",
        "createdAt": "2024-01-25T14:20:00Z"
      },
      {
        "id": "ver-3",
        "version": 3,
        "changeNote": "Annual review and updates",
        "authorName": "John Doe",
        "createdAt": "2024-01-30T10:45:00Z"
      }
    ],
    "ownerName": "John Doe",
    "createdAt": "2024-01-22T09:15:00Z",
    "updatedAt": "2024-01-30T10:45:00Z"
  }
}
```

**Permissions Required:** `documents:view`

### Update Document

```http
PATCH /documents/{id}
```

**Request Body:** (All fields optional)

```json
{
  "title": "Updated Title",
  "description": "New description",
  "category": "procedure",
  "accessLevel": "restricted",
  "tags": ["security", "updated"],
  "expiryDate": "2026-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "doc-789",
    "title": "Updated Title",
    ...
  }
}
```

**Permissions Required:** `documents:edit`

### Delete Document

```http
DELETE /documents/{id}
```

**Note:** Documents are soft-deleted (status changed to `archived`)

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Document archived"
  }
}
```

**Permissions Required:** `documents:delete`

---

## Approvals Module

### List Approval Requests

```http
GET /approvals
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | pending, approved, rejected |
| `priority` | string | low, medium, high, urgent |
| `entityType` | string | document, contract, policy, budget, vendor, project |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "approval-123",
        "title": "Approve Q1 Budget",
        "entityType": "budget",
        "entityId": "proj-456",
        "status": "pending",
        "priority": "high",
        "requestedByName": "John Doe",
        "currentStep": 1,
        "totalSteps": 2,
        "dueDate": "2024-02-15T17:00:00Z",
        "createdAt": "2024-02-01T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Approval Request

```http
POST /approvals
```

**Request Body:**

```json
{
  "title": "Approve Security Policy Update",
  "entityType": "document",
  "entityId": "doc-789",
  "workflowId": "wf-456",
  "priority": "high",
  "dueDate": "2024-02-15T17:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "approval-789",
    "title": "Approve Security Policy Update",
    "status": "pending",
    "currentStep": 1,
    "totalSteps": 1,
    "createdAt": "2024-02-01T10:30:00Z"
  }
}
```

### Get Approval Request

```http
GET /approvals/{id}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "approval-123",
    "title": "Approve Q1 Budget",
    "status": "pending",
    "priority": "high",
    "entity": {
      "id": "proj-456",
      "title": "Q1 Budget Allocation",
      ...
    },
    ...
  }
}
```

### Approve/Reject Request

```http
POST /approvals/{id}
```

**Request Body:**

```json
{
  "approve": true,
  "comment": "Approved. All requirements met and budget is within limits."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "approved"
  }
}
```

**Permissions Required:** `approvals:approve`

---

## Projects Module

### List Projects

```http
GET /projects
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | planning, active, on_hold, completed, cancelled |
| `departmentId` | string | Filter by department |
| `priority` | string | low, medium, high, critical |
| `search` | string | Search by name |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "proj-123",
        "name": "Digital Transformation Initiative",
        "status": "active",
        "priority": "high",
        "progress": 65,
        "budget": "5000000",
        "spent": "2500000",
        "riskLevel": "medium",
        "ownerName": "Alice Johnson",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Project

```http
POST /projects
```

**Request Body:**

```json
{
  "name": "Digital Transformation Initiative",
  "description": "Modernize banking systems and customer interfaces",
  "departmentId": "dept-tech",
  "status": "planning",
  "priority": "high",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "budget": "5000000",
  "riskLevel": "medium"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj-789",
    "name": "Digital Transformation Initiative",
    "status": "planning",
    "progress": 0,
    "createdAt": "2024-02-01T10:00:00Z"
  }
}
```

**Permissions Required:** `projects:create`

### Update Project

```http
PATCH /projects/{id}
```

**Request Body:** (All fields optional)

```json
{
  "status": "active",
  "progress": 25,
  "riskLevel": "low"
}
```

### Delete Project

```http
DELETE /projects/{id}
```

**Note:** Sets status to `cancelled`

**Permissions Required:** `projects:delete`

---

## Vendors Module

### List Vendors

```http
GET /vendors
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Vendor category |
| `status` | string | active, inactive, under_review |
| `riskRating` | string | low, medium, high, critical |
| `search` | string | Search by name |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "vend-123",
        "name": "CloudTech Solutions",
        "category": "Cloud Services",
        "status": "active",
        "riskRating": "low",
        "riskScore": 20,
        "dueDiligenceStatus": "completed",
        "contractValue": "500000",
        "renewalDate": "2024-12-31"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Vendor

```http
POST /vendors
```

**Request Body:**

```json
{
  "name": "SecureBank Technologies",
  "category": "Technology Services",
  "contactEmail": "vendor@securebank.com",
  "status": "active",
  "riskRating": "medium",
  "dueDiligenceStatus": "in_progress",
  "contractValue": "250000",
  "onboardedDate": "2024-01-15T00:00:00Z",
  "renewalDate": "2025-01-15T00:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "vend-789",
    "name": "SecureBank Technologies",
    "riskScore": 50,
    "status": "active"
  }
}
```

### Get Vendor Details

```http
GET /vendors/{id}
```

**Response includes related contracts:**

```json
{
  "success": true,
  "data": {
    "id": "vend-123",
    "name": "CloudTech Solutions",
    "contracts": [
      {
        "id": "cont-456",
        "title": "Cloud Services Agreement 2024",
        "status": "active",
        "value": "500000",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      }
    ],
    ...
  }
}
```

---

## Contracts Module

### List Contracts

```http
GET /contracts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "cont-123",
        "title": "Cloud Services Agreement",
        "counterparty": "CloudTech Solutions",
        "type": "service",
        "status": "active",
        "value": "500000",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "autoRenew": true,
        "ownerName": "John Doe"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Contract

```http
POST /contracts
```

**Request Body:**

```json
{
  "title": "Data Processing Agreement",
  "counterparty": "DataFlow Inc.",
  "vendorId": "vend-456",
  "type": "service",
  "value": "150000",
  "startDate": "2024-03-01T00:00:00Z",
  "endDate": "2025-02-28T23:59:59Z",
  "autoRenew": false,
  "status": "draft"
}
```

---

## Risks Module

### List Risks

```http
GET /risks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `severity` | string | low, medium, high, critical |
| `status` | string | open, mitigated, resolved, monitored |
| `category` | string | operational, credit, market, liquidity, regulatory, reputational |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "risk-123",
        "title": "Cyber Security Threat",
        "category": "operational",
        "severity": "high",
        "status": "open",
        "likelihood": 4,
        "impact": 5,
        "ownerName": "Security Team",
        "control": "Multi-factor authentication, intrusion detection"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Risk

```http
POST /risks
```

**Request Body:**

```json
{
  "title": "Data Breach Vulnerability",
  "description": "Potential exposure of customer financial data",
  "category": "operational",
  "departmentId": "dept-security",
  "likelihood": 3,
  "impact": 5,
  "status": "open",
  "control": "Data encryption, access controls, monitoring"
}
```

**Likelihood & Impact:** 1-5 scale

**Severity Calculation:**
- Score = Likelihood × Impact
- Low: 1-5, Medium: 6-11, High: 12-19, Critical: 20+

### Update Risk

```http
PATCH /risks/{id}
```

**Severity auto-updates** when likelihood or impact changes

---

## Compliance Module

### List Compliance Items

```http
GET /compliance
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `framework` | string | SOC 2, ISO 27001, etc. |
| `status` | string | compliant, non_compliant, partial, remediation |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "comp-123",
        "framework": "ISO 27001",
        "controlRef": "A.12.3.1",
        "title": "Cryptographic Controls",
        "status": "compliant",
        "ownerName": "Security Officer",
        "lastReviewed": "2024-01-20",
        "nextReview": "2024-04-20"
      }
    ],
    "pagination": { ... }
  }
}
```

### Create Compliance Item

```http
POST /compliance
```

**Request Body:**

```json
{
  "framework": "SOC 2 Type II",
  "controlRef": "CC6.1",
  "title": "Change Management Process",
  "description": "Formal change management procedures for all systems",
  "status": "not_assessed",
  "ownerName": "Operations Manager",
  "nextReview": "2024-03-31T23:59:59Z"
}
```

---

## Statistics & Dashboard

### Get Overall Statistics

```http
GET /stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "documents": {
      "total": 245,
      "draft": 15,
      "approved": 220,
      "archived": 10
    },
    "projects": {
      "total": 12,
      "active": 5,
      "completed": 4,
      "onHold": 2,
      "avgProgress": 62,
      "highRisk": 1
    },
    "vendors": {
      "total": 48,
      "active": 42,
      "inactive": 6,
      "highRisk": 8
    },
    "approvals": {
      "total": 512,
      "pending": 23,
      "approved": 458,
      "rejected": 31
    },
    "risks": {
      "total": 89,
      "critical": 2,
      "high": 12,
      "open": 45,
      "mitigated": 32
    },
    "compliance": {
      "total": 156,
      "compliant": 142,
      "nonCompliant": 5,
      "partial": 9
    }
  }
}
```

---

## Error Handling

### Common Error Responses

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "title": ["Title is required"],
    "category": ["Invalid category"]
  }
}
```

**Permission Error:**
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "errors": {}
}
```

**Not Found:**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

---

## Rate Limiting (Future)

Planned rate limits:
- 100 requests/minute for authenticated users
- 10 requests/minute for unauthenticated requests
- Per-endpoint custom limits

---

## Pagination

All list endpoints support pagination:

```http
GET /api/documents?page=2&limit=50
```

**Pagination Response:**

```json
{
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 245,
    "pages": 5
  }
}
```

Calculate:
- `offset = (page - 1) × limit`
- `pages = ceil(total / limit)`

---

## Filtering & Searching

### Text Search

```bash
GET /api/documents?search=security
```

Searches in:
- Document titles
- Vendor names
- Project names
- Risk descriptions

### Category/Status Filters

```bash
GET /api/documents?category=policy&status=approved
GET /api/risks?severity=high&status=open
GET /api/vendors?riskRating=critical
```

---

## Webhook Events (Future)

Planned webhook support for:

```
- document.created
- document.approved
- approval.requested
- approval.completed
- risk.created
- risk.escalated
- compliance.status_changed
```

---

## SDK/Client Libraries (Future)

Planned client libraries:
- JavaScript/TypeScript SDK
- Python SDK
- Go SDK
- REST client examples

---

## Support & Issues

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup issues
- Review [README.md](./README.md) for architecture
- Create GitHub issues for bugs
- Contact support team for urgent issues

---

**Last Updated:** February 2024 | Version: 1.0.0
