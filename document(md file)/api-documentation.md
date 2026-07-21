# Enterprise Digital Banking Platform - API Documentation

## Base URL
```
http://localhost:3000
```

---

## Authentication APIs

### 1. Sign In (Email & Password)
**POST** `/api/auth/sign-in/email`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": true
  },
  "session": {
    "token": "session-token"
  }
}
```

---

### 2. Sign Out
**POST** `/api/auth/sign-out`

**Response:**
```json
{
  "success": true
}
```

---

### 3. Get Current Session
**GET** `/api/auth/session`

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

---

## User Management APIs

### 4. Get All Users
**GET** `/api/users`

**Response:**
```json
[
  {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "status": "active",
    "roles": []
  }
]
```

---

### 5. Get User by ID
**GET** `/api/users/[id]`

**Response:**
```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@example.com",
  "status": "active",
  "roles": []
}
```

---

### 6. Get Current User
**GET** `/api/users/me`

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "Super Admin",
    "departmentName": "Administration"
  }
}
```

---

### 7. Create User
**POST** `/api/users`

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "roleIds": ["role-id-1", "role-id-2"]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "new-user-id",
  "email": "newuser@example.com"
}
```

---

### 8. Update User
**PUT** `/api/users/[id]`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

---

### 9. Delete User
**DELETE** `/api/users/[id]`

---

### 10. Set Password (After Invitation)
**POST** `/api/users/set-password`

**Request Body:**
```json
{
  "invitationToken": "token-from-email",
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "status": "active",
  "message": "Password set successfully"
}
```

---

### 11. Reset User Password
**POST** `/api/users/reset-password`

**Request Body:**
```json
{
  "userId": "user-id",
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "userId": "user-id"
}
```

---

### 12. Set User PIN
**POST** `/api/users/set-pin`

**Request Body:**
```json
{
  "userId": "user-id",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN set successfully",
  "userId": "user-id"
}
```

---

### 13. Resend Invitation
**POST** `/api/users/resend-invitation`

**Request Body:**
```json
{
  "userId": "user-id",
  "email": "user@example.com"
}
```

---

## RBAC (Role-Based Access Control) APIs

### 14. Get All Roles
**GET** `/api/rbac/roles`

**Response:**
```json
[
  {
    "id": "role-id",
    "name": "Super Admin",
    "description": "Full system access",
    "isSystem": true,
    "isActive": true
  }
]
```

---

### 15. Create Role
**POST** `/api/rbac/roles`

**Request Body:**
```json
{
  "name": "New Role",
  "description": "Role description",
  "permissions": ["permission-id-1", "permission-id-2"]
}
```

---

### 16. Get Role by ID
**GET** `/api/rbac/roles/[id]`

---

### 17. Update Role
**PUT** `/api/rbac/roles/[id]`

**Request Body:**
```json
{
  "name": "Updated Role",
  "description": "Updated description"
}
```

---

### 18. Delete Role
**DELETE** `/api/rbac/roles/[id]`

---

### 19. Get All Permissions
**GET** `/api/rbac/permissions`

**Response:**
```json
[
  {
    "id": "perm-id",
    "module": "users",
    "permissionKey": "create",
    "permissionName": "Create Users",
    "description": "Allows creating new users"
  }
]
```

---

### 20. Assign Role to User
**POST** `/api/rbac/user-roles`

**Request Body:**
```json
{
  "userId": "user-id",
  "roleId": "role-id"
}
```

---

### 21. Remove Role from User
**DELETE** `/api/rbac/user-roles/[userId]/[roleId]`

---

### 22. Seed RBAC (Initial Setup)
**POST** `/api/rbac/seed`

---

## Documents APIs

### 23. Get All Documents
**GET** `/api/documents`

**Query Parameters:**
- `status`: draft, published, archived
- `category`: document category
- `page`: page number
- `limit`: items per page

---

### 24. Create Document
**POST** `/api/documents`

**Request Body:**
```json
{
  "title": "Document Title",
  "description": "Document description",
  "category": "category-id",
  "departmentId": "dept-id",
  "accessLevel": "internal"
}
```

---

### 25. Get Document by ID
**GET** `/api/documents/[id]`

---

### 26. Update Document
**PUT** `/api/documents/[id]`

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "published"
}
```

---

### 27. Delete Document
**DELETE** `/api/documents/[id]`

---

### 28. Download Document
**GET** `/api/documents/[id]/download`

---

### 29. Get Document Preview
**GET** `/api/documents/[id]/preview`

---

### 30. Share Document
**POST** `/api/documents/[id]/share`

**Request Body:**
```json
{
  "userId": "user-id",
  "permission": "view"
}
```

---

## Approval APIs

### 31. Get All Approvals
**GET** `/api/approvals`

**Query Parameters:**
- `status`: pending, approved, rejected
- `page`: page number

---

### 32. Create Approval Request
**POST** `/api/approvals`

**Request Body:**
```json
{
  "title": "Approval Request",
  "entityType": "document",
  "entityId": "entity-id",
  "priority": "high"
}
```

---

### 33. Get Approval by ID
**GET** `/api/approvals/[id]`

---

### 34. Approve Request
**PUT** `/api/approvals/[id]`

**Request Body:**
```json
{
  "status": "approved",
  "comments": "Approved"
}
```

---

### 35. Reject Request
**PUT** `/api/approvals/[id]`

**Request Body:**
```json
{
  "status": "rejected",
  "comments": "Please revise"
}
```

---

## Departments APIs

### 36. Get All Departments
**GET** `/api/departments`

---

### 37. Create Department
**POST** `/api/departments`

**Request Body:**
```json
{
  "name": "Finance",
  "code": "FIN",
  "description": "Finance Department",
  "headName": "Head Name"
}
```

---

### 38. Get Department by ID
**GET** `/api/departments/[id]`

---

### 39. Update Department
**PUT** `/api/departments/[id]`

---

### 40. Delete Department
**DELETE** `/api/departments/[id]`

---

## Divisions APIs

### 41. Get All Divisions
**GET** `/api/divisions`

---

### 42. Create Division
**POST** `/api/divisions`

**Request Body:**
```json
{
  "name": "Sub Division",
  "code": "SD01",
  "departmentId": "dept-id",
  "description": "Division description"
}
```

---

### 43. Get Division by ID
**GET** `/api/divisions/[id]`

---

### 44. Update Division
**PUT** `/api/divisions/[id]`

---

### 45. Delete Division
**DELETE** `/api/divisions/[id]`

---

## Categories APIs

### 46. Get All Categories
**GET** `/api/categories`

---

### 47. Create Category
**POST** `/api/categories`

**Request Body:**
```json
{
  "name": "Policy",
  "code": "POL",
  "description": "Policy documents",
  "color": "#FF5733"
}
```

---

### 48. Get Category by ID
**GET** `/api/categories/[id]`

---

### 49. Update Category
**PUT** `/api/categories/[id]`

---

### 50. Delete Category
**DELETE** `/api/categories/[id]`

---

## Compliance APIs

### 51. Get All Compliance Items
**GET** `/api/compliance`

---

### 52. Create Compliance Item
**POST** `/api/compliance`

**Request Body:**
```json
{
  "framework": "SOX",
  "controlRef": "IT-101",
  "title": "Access Control",
  "description": "User access control policy",
  "status": "active"
}
```

---

### 53. Get Compliance Item by ID
**GET** `/api/compliance/[id]`

---

### 54. Update Compliance Item
**PUT** `/api/compliance/[id]`

---

### 55. Delete Compliance Item
**DELETE** `/api/compliance/[id]`

---

## Risks APIs

### 56. Get All Risks
**GET** `/api/risks`

---

### 57. Create Risk
**POST** `/api/risks`

**Request Body:**
```json
{
  "title": "Operational Risk",
  "description": "Risk description",
  "category": "operational",
  "likelihood": 3,
  "impact": 4,
  "status": "open",
  "ownerName": "Owner Name"
}
```

---

### 58. Get Risk by ID
**GET** `/api/risks/[id]`

---

### 59. Update Risk
**PUT** `/api/risks/[id]`

---

### 60. Delete Risk
**DELETE** `/api/risks/[id]`

---

## Projects APIs

### 61. Get All Projects
**GET** `/api/projects`

---

### 62. Create Project
**POST** `/api/projects`

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Project description",
  "status": "planning",
  "priority": "high",
  "budget": "50000",
  "startDate": "2026-07-16",
  "endDate": "2026-08-16"
}
```

---

### 63. Get Project by ID
**GET** `/api/projects/[id]`

---

### 64. Update Project
**PUT** `/api/projects/[id]`

---

### 65. Delete Project
**DELETE** `/api/projects/[id]`

---

## Contracts APIs

### 66. Get All Contracts
**GET** `/api/contracts`

---

### 67. Create Contract
**POST** `/api/contracts`

**Request Body:**
```json
{
  "title": "Service Contract",
  "counterparty": "Vendor Name",
  "vendorId": "vendor-id",
  "type": "service",
  "value": "100000",
  "startDate": "2026-07-16",
  "endDate": "2026-12-16"
}
```

---

### 68. Get Contract by ID
**GET** `/api/contracts/[id]`

---

### 69. Update Contract
**PUT** `/api/contracts/[id]`

---

### 70. Delete Contract
**DELETE** `/api/contracts/[id]`

---

## Vendors APIs

### 71. Get All Vendors
**GET** `/api/vendors`

---

### 72. Create Vendor
**POST** `/api/vendors`

**Request Body:**
```json
{
  "name": "Vendor Name",
  "category": "IT",
  "contactEmail": "vendor@example.com",
  "status": "active",
  "riskScore": 2,
  "performanceScore": 85
}
```

---

### 73. Get Vendor by ID
**GET** `/api/vendors/[id]`

---

### 74. Update Vendor
**PUT** `/api/vendors/[id]`

---

### 75. Delete Vendor
**DELETE** `/api/vendors/[id]`

---

## Statistics API

### 76. Get Dashboard Statistics
**GET** `/api/stats`

**Response:**
```json
{
  "totalUsers": 150,
  "totalDocuments": 320,
  "activeApprovals": 45,
  "completedApprovals": 200,
  "recentActivities": []
}
```

---

## Admin APIs (For Development/Testing)

### 77. Health Check
**GET** `/api/admin/health`

---

### 78. Initialize Auth
**POST** `/api/admin/init-auth`

---

### 79. Create Tables
**POST** `/api/admin/create-tables`

---

### 80. Setup RBAC
**POST** `/api/admin/setup-rbac`

---

### 81. Make Super Admin
**POST** `/api/admin/make-super-admin`

**Request Body:**
```json
{
  "userId": "user-id"
}
```

---

### 82. Verify Setup
**GET** `/api/admin/verify-setup`

---

### 83. Diagnose
**GET** `/api/admin/diagnose`

---

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <session-token>
Cookie: session=<session-token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Environment Variables Required

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BETTER_AUTH_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NEXT_PUBLIC_CLOUDCONVERT_API_KEY=your-api-key
```

---

## Testing Credentials

**Email**: `ahadu@gmail.com`
**Password**: `TestPassword123!`

---

**Last Updated**: July 16, 2026
**API Version**: 1.0.0
