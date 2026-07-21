# RBAC (Role-Based Access Control) Guide

## Overview

This guide explains how to manage roles, permissions, and user assignments in the Enterprise Digital Banking Platform using the Postman collection or API directly.

---

## Quick Workflow

### 1. Sign In
```json
POST /api/auth/signin
{
  "email": "ahadu@gmail.com",
  "password": "TestPassword123!"
}
```
✅ Response saves `authToken` and `userId` automatically

### 2. View All Roles
```json
GET /api/rbac/roles
Header: Cookie: authToken={{authToken}}
```
✅ Returns list of all roles with their permissions

### 3. View All Permissions
```json
GET /api/rbac/permissions
Header: Cookie: authToken={{authToken}}
```
✅ Returns all available permissions in the system

### 4. Create a New Role
```json
POST /api/rbac/roles
Header: Cookie: authToken={{authToken}}
Body: {
  "name": "Document Reviewer",
  "description": "Can view and comment on documents",
  "permissionIds": ["perm-001", "perm-002"]
}
```
✅ Returns created role with ID

### 5. Assign Role to User
```json
POST /api/rbac/user-roles
Header: Cookie: authToken={{authToken}}
Body: {
  "userId": "user-001",
  "roleId": "role-001"
}
```
✅ User now has all permissions assigned to that role

---

## Detailed API Reference

### 🔑 RBAC - Roles Management

#### Get All Roles
```
GET /api/rbac/roles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "role-001",
      "name": "Admin",
      "description": "Full system access",
      "isSystem": true,
      "isActive": true,
      "createdAt": "2026-07-16T10:00:00Z",
      "permissions": [
        {
          "id": "perm-001",
          "module": "users",
          "permissionKey": "create",
          "permissionName": "Create Users"
        }
      ]
    }
  ]
}
```

#### Get Role by ID
```
GET /api/rbac/roles/:roleId
```

**Response:** Returns single role with all permissions

#### Create Role
```
POST /api/rbac/roles
Content-Type: application/json

{
  "name": "Compliance Officer",
  "description": "Manages compliance checks and audits",
  "permissionIds": ["perm-001", "perm-002", "perm-003"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-new-001",
    "name": "Compliance Officer",
    "description": "Manages compliance checks and audits",
    "isSystem": false,
    "isActive": true,
    "createdAt": "2026-07-16T13:20:00Z",
    "permissions": [...]
  }
}
```

#### Update Role
```
PATCH /api/rbac/roles/:roleId
Content-Type: application/json

{
  "name": "Senior Compliance Officer",
  "description": "Senior level compliance management",
  "permissionIds": ["perm-001", "perm-002", "perm-003", "perm-004"]
}
```

#### Delete Role
```
DELETE /api/rbac/roles/:roleId
```

⚠️ **Note:** System roles cannot be deleted

---

### 🔐 RBAC - Permissions Management

#### Get All Permissions
```
GET /api/rbac/permissions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "perm-001",
      "module": "users",
      "permissionKey": "create",
      "permissionName": "Create Users",
      "description": "Can create new user accounts"
    },
    {
      "id": "perm-002",
      "module": "users",
      "permissionKey": "view",
      "permissionName": "View Users",
      "description": "Can view user information"
    },
    {
      "id": "perm-003",
      "module": "users",
      "permissionKey": "update",
      "permissionName": "Update Users",
      "description": "Can modify user information"
    },
    {
      "id": "perm-004",
      "module": "users",
      "permissionKey": "delete",
      "permissionName": "Delete Users",
      "description": "Can delete user accounts"
    },
    {
      "id": "perm-005",
      "module": "documents",
      "permissionKey": "create",
      "permissionName": "Create Documents",
      "description": "Can create new documents"
    }
  ]
}
```

#### Get Permissions by Module
```
GET /api/rbac/permissions?groupBy=module
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "perm-001",
        "permissionKey": "create",
        "permissionName": "Create Users"
      },
      {
        "id": "perm-002",
        "permissionKey": "view",
        "permissionName": "View Users"
      }
    ],
    "documents": [
      {
        "id": "perm-005",
        "permissionKey": "create",
        "permissionName": "Create Documents"
      }
    ]
  }
}
```

---

### 👤 RBAC - Assign Roles to Users

#### Assign Role to User
```
POST /api/rbac/user-roles
Content-Type: application/json

{
  "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
  "roleId": "role-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-role-001",
    "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
    "roleId": "role-001",
    "assignedBy": "admin-user-id",
    "assignedAt": "2026-07-16T13:25:00Z"
  }
}
```

#### Get User Roles
```
GET /api/rbac/user-roles/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-role-001",
      "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
      "roleId": "role-001",
      "role": {
        "name": "Admin",
        "permissions": [...]
      }
    }
  ]
}
```

---

## Common Use Cases

### Use Case 1: Create a New Department Role
```json
POST /api/rbac/roles
{
  "name": "Finance Department Head",
  "description": "Can manage finance documents and approve financial transactions",
  "permissionIds": [
    "users.view",
    "documents.create",
    "documents.update",
    "documents.approve",
    "reports.view"
  ]
}
```

### Use Case 2: Assign Role to New Employee
```json
// Step 1: Get role ID
GET /api/rbac/roles

// Step 2: Assign role to user
POST /api/rbac/user-roles
{
  "userId": "new-employee-id",
  "roleId": "role-finance-head"
}
```

### Use Case 3: Update Role Permissions
```json
// Step 1: Get current role
GET /api/rbac/roles/role-compliance

// Step 2: Update with new permissions
PATCH /api/rbac/roles/role-compliance
{
  "name": "Senior Compliance Officer",
  "description": "Senior compliance role with additional permissions",
  "permissionIds": [
    "users.view",
    "documents.view",
    "documents.approve",
    "reports.create",
    "reports.export",
    "audit.view"
  ]
}
```

---

## Permission Modules

The system uses these permission modules:

| Module | Permissions | Description |
|--------|-------------|-------------|
| `users` | create, view, update, delete | User management permissions |
| `documents` | create, view, update, delete, approve | Document operations |
| `reports` | create, view, export | Reporting capabilities |
| `audit` | view, export | Audit log access |
| `compliance` | create, view, update, approve | Compliance management |
| `rbac` | create, view, update, delete | RBAC management |

---

## Using Postman Collection

### Import Collection
1. Open Postman
2. Click **Import**
3. Select `Postman-Collection-Fixed.json`
4. Click **Import**

### Authentication Variables
The collection automatically manages:
- `baseUrl` - API base URL (default: http://localhost:3000)
- `authToken` - Session token (auto-filled after sign-in)
- `userId` - Current user ID (auto-filled after sign-in)
- `roleId` - Selected role ID (auto-filled after get roles)
- `permissionId` - Selected permission ID (auto-filled after get permissions)

### Example Flow in Postman
1. Click **🔐 Authentication > Sign In**
2. Click **Send**
3. Variables are auto-saved
4. Click **🔑 RBAC - Roles Management > Get All Roles**
5. Click **Send**
6. `roleId` is auto-saved
7. Click **🔑 RBAC - Roles Management > Get Role by ID**
8. Click **Send** to see role details with permissions

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```
✅ Solution: Sign in first to get authToken

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "User does not have permission to perform this action"
}
```
✅ Solution: Assign appropriate role to user

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "userId and roleId are required"
}
```
✅ Solution: Include all required fields in request body

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Role not found"
}
```
✅ Solution: Verify role ID exists

---

## Security Best Practices

✅ **Do:**
- Always authenticate before accessing RBAC endpoints
- Use minimal permissions (principle of least privilege)
- Review user roles regularly
- Log all role assignments
- Separate concerns by creating specific roles

❌ **Don't:**
- Share authentication tokens
- Assign Admin role to all users
- Leave unused roles active
- Modify system roles (they auto-reset)
- Delete roles that are in use

---

## Questions?

For more information, check:
- `/api/rbac/*` endpoint implementations
- `lib/services/rbac.service.ts` for business logic
- `lib/db/schema.ts` for database structure
