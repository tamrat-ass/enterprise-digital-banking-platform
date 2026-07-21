# RBAC - Complete JSON Examples

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Role Management](#role-management)
3. [Permission Management](#permission-management)
4. [User-Role Assignment](#user-role-assignment)
5. [Real-World Scenarios](#real-world-scenarios)

---

## Authentication

### Sign In Request
```json
POST /api/auth/signin
Content-Type: application/json

{
  "email": "ahadu@gmail.com",
  "password": "TestPassword123!"
}
```

### Sign In Response
```json
{
  "user": {
    "id": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
    "email": "ahadu@gmail.com",
    "name": "Tamrat Assefa Weldemesekel",
    "emailVerified": true
  },
  "session": {
    "id": "abc123-def456",
    "token": "a7ec34362654f85c61df4335054c5468b33d7bd2bcb0728796948ca0d86b9a6d",
    "expiresAt": "2026-07-23T13:14:05.366Z"
  }
}
```

---

## Role Management

### 1. Get All Roles

**Request:**
```json
GET /api/rbac/roles
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "role-admin-001",
      "name": "Administrator",
      "description": "Full system access",
      "isSystem": true,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "permissions": [
        {
          "id": "perm-users-create",
          "module": "users",
          "permissionKey": "create",
          "permissionName": "Create Users",
          "description": "Can create new user accounts"
        },
        {
          "id": "perm-users-delete",
          "module": "users",
          "permissionKey": "delete",
          "permissionName": "Delete Users",
          "description": "Can delete user accounts"
        }
      ]
    },
    {
      "id": "role-compliance-001",
      "name": "Compliance Officer",
      "description": "Manages compliance and audits",
      "isSystem": false,
      "isActive": true,
      "createdAt": "2026-02-15T10:30:00Z",
      "permissions": [
        {
          "id": "perm-compliance-view",
          "module": "compliance",
          "permissionKey": "view",
          "permissionName": "View Compliance",
          "description": "Can view compliance items"
        }
      ]
    }
  ]
}
```

### 2. Get Single Role

**Request:**
```json
GET /api/rbac/roles/role-compliance-001
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-compliance-001",
    "name": "Compliance Officer",
    "description": "Manages compliance and audits",
    "isSystem": false,
    "isActive": true,
    "createdAt": "2026-02-15T10:30:00Z",
    "permissions": [
      {
        "id": "perm-compliance-view",
        "module": "compliance",
        "permissionKey": "view",
        "permissionName": "View Compliance"
      },
      {
        "id": "perm-audit-view",
        "module": "audit",
        "permissionKey": "view",
        "permissionName": "View Audit Logs"
      }
    ]
  }
}
```

### 3. Create Role

**Request:**
```json
POST /api/rbac/roles
Content-Type: application/json
Header: Cookie: authToken={{authToken}}

{
  "name": "Document Manager",
  "description": "Manages document lifecycle and approvals",
  "permissionIds": [
    "perm-documents-create",
    "perm-documents-view",
    "perm-documents-update",
    "perm-documents-approve"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-doc-manager-001",
    "name": "Document Manager",
    "description": "Manages document lifecycle and approvals",
    "isSystem": false,
    "isActive": true,
    "createdAt": "2026-07-16T13:20:00Z",
    "permissions": [
      {
        "id": "perm-documents-create",
        "module": "documents",
        "permissionKey": "create",
        "permissionName": "Create Documents"
      },
      {
        "id": "perm-documents-view",
        "module": "documents",
        "permissionKey": "view",
        "permissionName": "View Documents"
      },
      {
        "id": "perm-documents-update",
        "module": "documents",
        "permissionKey": "update",
        "permissionName": "Update Documents"
      },
      {
        "id": "perm-documents-approve",
        "module": "documents",
        "permissionKey": "approve",
        "permissionName": "Approve Documents"
      }
    ]
  }
}
```

### 4. Update Role

**Request:**
```json
PATCH /api/rbac/roles/role-doc-manager-001
Content-Type: application/json
Header: Cookie: authToken={{authToken}}

{
  "name": "Senior Document Manager",
  "description": "Senior level document management with delegation rights",
  "permissionIds": [
    "perm-documents-create",
    "perm-documents-view",
    "perm-documents-update",
    "perm-documents-approve",
    "perm-documents-delegate",
    "perm-reports-create"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-doc-manager-001",
    "name": "Senior Document Manager",
    "description": "Senior level document management with delegation rights",
    "isSystem": false,
    "isActive": true,
    "createdAt": "2026-07-16T13:20:00Z",
    "permissions": [
      {
        "id": "perm-documents-create",
        "module": "documents",
        "permissionKey": "create",
        "permissionName": "Create Documents"
      },
      {
        "id": "perm-documents-approve",
        "module": "documents",
        "permissionKey": "approve",
        "permissionName": "Approve Documents"
      },
      {
        "id": "perm-documents-delegate",
        "module": "documents",
        "permissionKey": "delegate",
        "permissionName": "Delegate Approvals"
      },
      {
        "id": "perm-reports-create",
        "module": "reports",
        "permissionKey": "create",
        "permissionName": "Create Reports"
      }
    ]
  }
}
```

### 5. Delete Role

**Request:**
```json
DELETE /api/rbac/roles/role-doc-manager-001
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "id": "role-doc-manager-001"
  }
}
```

---

## Permission Management

### 1. Get All Permissions

**Request:**
```json
GET /api/rbac/permissions
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "perm-users-create",
      "module": "users",
      "permissionKey": "create",
      "permissionName": "Create Users",
      "description": "Can create new user accounts"
    },
    {
      "id": "perm-users-view",
      "module": "users",
      "permissionKey": "view",
      "permissionName": "View Users",
      "description": "Can view user information"
    },
    {
      "id": "perm-users-update",
      "module": "users",
      "permissionKey": "update",
      "permissionName": "Update Users",
      "description": "Can modify user information"
    },
    {
      "id": "perm-users-delete",
      "module": "users",
      "permissionKey": "delete",
      "permissionName": "Delete Users",
      "description": "Can delete user accounts"
    },
    {
      "id": "perm-documents-create",
      "module": "documents",
      "permissionKey": "create",
      "permissionName": "Create Documents",
      "description": "Can create new documents"
    },
    {
      "id": "perm-documents-view",
      "module": "documents",
      "permissionKey": "view",
      "permissionName": "View Documents",
      "description": "Can read documents"
    },
    {
      "id": "perm-documents-update",
      "module": "documents",
      "permissionKey": "update",
      "permissionName": "Update Documents",
      "description": "Can modify documents"
    },
    {
      "id": "perm-documents-approve",
      "module": "documents",
      "permissionKey": "approve",
      "permissionName": "Approve Documents",
      "description": "Can approve document submissions"
    },
    {
      "id": "perm-compliance-create",
      "module": "compliance",
      "permissionKey": "create",
      "permissionName": "Create Compliance Items",
      "description": "Can create compliance checks"
    },
    {
      "id": "perm-audit-view",
      "module": "audit",
      "permissionKey": "view",
      "permissionName": "View Audit Logs",
      "description": "Can view system audit logs"
    }
  ]
}
```

### 2. Get Permissions Grouped by Module

**Request:**
```json
GET /api/rbac/permissions?groupBy=module
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "perm-users-create",
        "permissionKey": "create",
        "permissionName": "Create Users",
        "description": "Can create new user accounts"
      },
      {
        "id": "perm-users-view",
        "permissionKey": "view",
        "permissionName": "View Users",
        "description": "Can view user information"
      },
      {
        "id": "perm-users-update",
        "permissionKey": "update",
        "permissionName": "Update Users",
        "description": "Can modify user information"
      },
      {
        "id": "perm-users-delete",
        "permissionKey": "delete",
        "permissionName": "Delete Users",
        "description": "Can delete user accounts"
      }
    ],
    "documents": [
      {
        "id": "perm-documents-create",
        "permissionKey": "create",
        "permissionName": "Create Documents",
        "description": "Can create new documents"
      },
      {
        "id": "perm-documents-view",
        "permissionKey": "view",
        "permissionName": "View Documents",
        "description": "Can read documents"
      },
      {
        "id": "perm-documents-approve",
        "permissionKey": "approve",
        "permissionName": "Approve Documents",
        "description": "Can approve document submissions"
      }
    ],
    "compliance": [
      {
        "id": "perm-compliance-create",
        "permissionKey": "create",
        "permissionName": "Create Compliance Items",
        "description": "Can create compliance checks"
      },
      {
        "id": "perm-compliance-view",
        "permissionKey": "view",
        "permissionName": "View Compliance",
        "description": "Can view compliance information"
      }
    ]
  }
}
```

---

## User-Role Assignment

### 1. Assign Role to User

**Request:**
```json
POST /api/rbac/user-roles
Content-Type: application/json
Header: Cookie: authToken={{authToken}}

{
  "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
  "roleId": "role-compliance-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-role-assignment-001",
    "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
    "roleId": "role-compliance-001",
    "assignedBy": "admin-user-id",
    "assignedAt": "2026-07-16T13:25:00Z"
  }
}
```

### 2. Get User Roles

**Request:**
```json
GET /api/rbac/user-roles/VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO
Header: Cookie: authToken={{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-role-assignment-001",
      "userId": "VJNYQt1OVBZGAtwAM8TqvDa3Lk8T4eVO",
      "roleId": "role-compliance-001",
      "role": {
        "id": "role-compliance-001",
        "name": "Compliance Officer",
        "description": "Manages compliance and audits",
        "permissions": [
          {
            "id": "perm-compliance-view",
            "module": "compliance",
            "permissionKey": "view",
            "permissionName": "View Compliance"
          },
          {
            "id": "perm-audit-view",
            "module": "audit",
            "permissionKey": "view",
            "permissionName": "View Audit Logs"
          }
        ]
      },
      "assignedBy": "admin-user-id",
      "assignedAt": "2026-07-16T13:25:00Z"
    }
  ]
}
```

---

## Real-World Scenarios

### Scenario 1: Onboard New Compliance Officer

**Step 1: Get available permissions**
```json
GET /api/rbac/permissions?groupBy=module
```

**Step 2: Create Compliance Officer role**
```json
POST /api/rbac/roles
{
  "name": "Compliance Officer",
  "description": "Reviews compliance and generates audit reports",
  "permissionIds": [
    "perm-compliance-create",
    "perm-compliance-view",
    "perm-audit-view",
    "perm-documents-view",
    "perm-reports-create"
  ]
}
```
Response: Get `roleId` = "role-compliance-001"

**Step 3: Assign role to new employee**
```json
POST /api/rbac/user-roles
{
  "userId": "new-employee-id",
  "roleId": "role-compliance-001"
}
```

✅ New employee can now view compliance, create audits, and generate reports

---

### Scenario 2: Promote User to Senior Role

**Step 1: Get all roles**
```json
GET /api/rbac/roles
```

**Step 2: Find or create Senior role with more permissions**
```json
POST /api/rbac/roles
{
  "name": "Senior Compliance Officer",
  "description": "Senior compliance role with delegation and approval rights",
  "permissionIds": [
    "perm-compliance-create",
    "perm-compliance-view",
    "perm-audit-view",
    "perm-documents-view",
    "perm-documents-approve",
    "perm-reports-create",
    "perm-reports-export",
    "perm-users-view"
  ]
}
```

**Step 3: Assign new role to promoted user**
```json
POST /api/rbac/user-roles
{
  "userId": "promoted-user-id",
  "roleId": "role-senior-compliance-001"
}
```

✅ User is now promoted with additional permissions

---

### Scenario 3: Adjust Role Permissions

**Step 1: View current role**
```json
GET /api/rbac/roles/role-compliance-001
```

**Step 2: Add new permissions to role**
```json
PATCH /api/rbac/roles/role-compliance-001
{
  "name": "Compliance Officer",
  "description": "Reviews compliance and generates audit reports",
  "permissionIds": [
    "perm-compliance-create",
    "perm-compliance-view",
    "perm-audit-view",
    "perm-documents-view",
    "perm-reports-create",
    "perm-compliance-update"
  ]
}
```

✅ All users with this role now have the new permission (perm-compliance-update)

---

## Error Examples

### Error 1: Missing Required Field
```json
POST /api/rbac/roles
{
  "name": "Test Role"
  // Missing "description" and "permissionIds"
}
```

**Response:**
```json
{
  "success": false,
  "error": "description is required",
  "code": 400
}
```

### Error 2: Unauthorized (No Auth Token)
```json
GET /api/rbac/roles
// Missing Cookie header
```

**Response:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": 401
}
```

### Error 3: Insufficient Permission
```json
DELETE /api/rbac/roles/role-admin-001
// User doesn't have users.delete permission
```

**Response:**
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "code": 403
}
```

### Error 4: Role Not Found
```json
GET /api/rbac/roles/invalid-role-id
```

**Response:**
```json
{
  "success": false,
  "error": "Role not found",
  "code": 404
}
```

---

**All examples are ready to use!** Copy any request into Postman and test. ✅
