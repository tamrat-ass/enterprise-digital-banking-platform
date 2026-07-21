# Modern Role-Based Access Control (RBAC) System

## Overview

The application now uses a modern, scalable RBAC system with the following components:

1. **Roles**: Job titles with permission sets (Super Admin, Executive, Compliance Officer, etc.)
2. **Permissions**: Granular `module:action` based permissions (documents:view, documents:create, etc.)
3. **Role-Permission Mapping**: Many-to-many relationship defining what permissions each role has
4. **User-Role Assignment**: Users assigned to roles to inherit permissions

## Database Schema

### New Tables

#### `permissions`
```
- id (TEXT, PK)
- key (TEXT, UNIQUE) - "documents:view", "documents:create", etc.
- name (TEXT) - Human readable name
- description (TEXT)
- module (TEXT) - "documents", "approvals", etc.
- action (TEXT) - "view", "create", "edit", "delete", "approve", "admin"
- createdAt (TIMESTAMP)
```

#### `roles` (Updated)
```
- id (TEXT, PK)
- key (TEXT, UNIQUE) - "super_admin", "executive", "staff", etc.
- name (TEXT) - "Super Administrator", "Executive", etc.
- description (TEXT)
- level (INTEGER) - For hierarchy (100=super_admin, 10=staff)
- isSystem (BOOLEAN) - Cannot be deleted if true
- isActive (BOOLEAN)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `role_permissions`
```
- id (TEXT, PK)
- roleId (TEXT, FK -> roles.id)
- permissionId (TEXT, FK -> permissions.id)
- createdAt (TIMESTAMP)
```

#### `user_roles`
```
- id (TEXT, PK)
- userId (TEXT, FK -> user.id)
- roleId (TEXT, FK -> roles.id)
- assignedBy (TEXT) - Who assigned this role
- assignedAt (TIMESTAMP)
```

#### `profiles` (Updated)
```
- Added divisionId (TEXT)
- Removed roleId (replaced by user_roles table)
- Added updatedAt (TIMESTAMP)
```

## Predefined Roles

### 1. Super Administrator (level: 100)
- Full unrestricted access to all modules
- Can manage users, roles, and permissions
- Has wildcard permission "*"

### 2. Executive (level: 90)
- Read-only access to most modules
- Can approve/reject workflows
- View analytics and audit logs

### 3. Compliance Officer (level: 70)
- Full control of compliance and risk modules
- Can create/edit compliance items and risks
- Can approve documents

### 4. Internal Auditor (level: 60)
- Read-only access to all modules
- Full access to audit trails
- Cannot modify anything

### 5. Department Head (level: 50)
- Manage department documents and projects
- Create and approve workflows for department
- Cannot access compliance settings

### 6. Staff Member (level: 10)
- Create and view own documents
- Submit approval requests
- Limited to their department

## API Endpoints

### Roles Management

#### Get All Roles
```
GET /api/rbac/roles
Response: { success: true, data: Role[] }
```

#### Get Single Role
```
GET /api/rbac/roles/:id
Response: { success: true, data: Role }
```

#### Create Role
```
POST /api/rbac/roles
Body: {
  name: string
  key: string (unique, lowercase, no spaces)
  description?: string
  level?: number
  permissionIds: string[]
}
Response: { success: true, data: Role }
```

#### Update Role
```
PATCH /api/rbac/roles/:id
Body: {
  name?: string
  description?: string
  level?: number
  permissionIds?: string[]
}
Response: { success: true, data: Role }
```

### Permissions Management

#### Get All Permissions
```
GET /api/rbac/permissions
Response: { success: true, data: Permission[] }
```

#### Get Permissions Grouped by Module
```
GET /api/rbac/permissions?groupBy=module
Response: { success: true, data: { [module]: Permission[] } }
```

### User Role Assignment

#### Assign Role to User
```
POST /api/rbac/user-roles
Body: {
  userId: string
  roleId: string
}
Response: { success: true, data: { userId, roleId } }
```

### System Admin

#### Seed Roles & Permissions
```
POST /api/rbac/seed
Response: { success: true, data: { message: "..." } }
```

## Session & Permission Resolution

### How Permissions Are Resolved

1. **Get User's Primary Role**
   - Query `user_roles` table for user's assigned role
   - Use first role if multiple assigned

2. **Get Role's Permissions**
   - Query `role_permissions` for all permissions in that role
   - Query `permissions` table for permission details

3. **Populate CurrentUser Object**
   - `user.permissions` = array of Permission keys
   - `user.roleKey` = "super_admin", "executive", etc.
   - `user.roleId` = database role ID

### Type Definitions

```typescript
interface CurrentUser {
  id: string
  name: string
  email: string
  jobTitle: string | null
  roleKey: RoleKey  // "super_admin" | "executive" | etc.
  roleName: string  // "Super Administrator"
  roleId: string | null
  departmentId: string | null
  departmentName: string | null
  permissions: Permission[]  // ["documents:view", "documents:create", ...]
}

type Permission = `${ModuleKey}:${ActionKey}`
// Examples: "documents:view", "approvals:approve", "users:admin"
```

## Usage in API Routes

### Check Single Permission

```typescript
import { requirePermission } from "@/lib/api-utils"

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "documents:view")
  if (error) return error
  
  // User has permission, proceed
})
```

### Check Module Access

```typescript
import { canAccessModule } from "@/lib/rbac"

if (!canAccessModule(user.permissions, "documents")) {
  return errorResponse("No access to documents", 403)
}
```

### Custom Permission Checks

```typescript
if (!user.permissions.includes("documents:admin")) {
  return errorResponse("Admin access required", 403)
}
```

## Admin UI

### Access Admin Panel

- URL: `/admin`
- Restricted to: Super Administrators only
- Sections:
  - Roles Management (`/admin/roles`)
  - Permissions Management (`/admin/permissions`)
  - User Role Assignment (`/admin/users`)

### Create New Role

1. Go to `/admin/roles`
2. Click "New Role"
3. Enter:
   - Role Name (e.g., "Project Manager")
   - Role Key (e.g., "project_manager", must be unique)
   - Description
   - Level (for hierarchy)
   - Select Permissions
4. Click Create

### Assign Role to User

1. Go to `/admin/users`
2. Find user
3. Select new role
4. Click Assign
5. User permissions update immediately on next request

## Implementation Checklist

- [x] Database schema updated with new tables
- [x] RBAC Service (`lib/services/rbac.service.ts`)
- [x] API Endpoints for RBAC management
- [x] Session resolution updated to use database permissions
- [x] Role seeding with predefined roles
- [x] Admin UI landing page
- [x] Roles management page
- [x] Type definitions updated

## Migration Path

If migrating from old system:

1. Run `POST /api/rbac/seed` to create all predefined roles and permissions
2. Migrate old roles from `roles` table
3. Create user role assignments in `user_roles` table
4. Update profiles to remove roleId

## Security Notes

- System roles (marked with `isSystem=true`) cannot be deleted
- Only super_admin can modify role permissions
- Permissions are evaluated on every request, so changes take effect immediately
- Audit all role and permission changes in audit logs
- Use least privilege principle when creating new roles
