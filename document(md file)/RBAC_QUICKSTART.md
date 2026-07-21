# Modern RBAC System - Quick Start Guide

## What's New

A complete redesign of the role and permission system using modern best practices:
- Database-backed roles and permissions
- Scalable architecture for managing access control
- Admin UI for role and permission management
- Fine-grained permission control

## Key Features

✅ **Predefined System Roles** - Super Admin, Executive, Compliance Officer, Auditor, Department Head, Staff
✅ **Granular Permissions** - Module:Action based (documents:view, approvals:approve, etc.)
✅ **Database Persistence** - All roles and permissions stored in database
✅ **Session Integration** - Permissions loaded on every request
✅ **Admin UI** - Manage roles and assign users without code changes
✅ **Audit Trail** - Track who assigned what role and when
✅ **Hierarchical Roles** - Role levels for determining seniority

## Quick Setup

### 1. Seed the Database (Admin Only)

```bash
# Via API (if you're a super_admin)
curl -X POST http://localhost:3000/api/rbac/seed \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=YOUR_SESSION"
```

This creates all predefined roles and permissions in the database.

### 2. View Roles

```
GET http://localhost:3000/api/rbac/roles
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "role-super_admin",
      "key": "super_admin",
      "name": "Super Administrator",
      "level": 100,
      "permissions": [
        { "id": "perm-...", "key": "documents:view", "module": "documents", "action": "view" },
        ...
      ]
    }
  ]
}
```

### 3. Assign Role to User

```bash
curl -X POST http://localhost:3000/api/rbac/user-roles \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=YOUR_SESSION" \
  -d '{
    "userId": "user-123",
    "roleId": "role-executive"
  }'
```

### 4. Check User Permissions

User permissions are automatically loaded on every request. Access the current user:

```typescript
// In a server action or API route
import { getCurrentUser } from "@/lib/session"

const user = await getCurrentUser()
console.log(user.permissions) // ["documents:view", "approvals:view", ...]
console.log(user.roleKey) // "executive"
```

## Using Permissions in Code

### API Routes

```typescript
import { requirePermission } from "@/lib/api-utils"

export const POST = withErrorHandling(async (req: NextRequest) => {
  // User must have "documents:create" permission
  const { error, user } = await requirePermission(req, "documents:create")
  if (error) return error
  
  // Proceed with creation
})
```

### Server Actions

```typescript
import { getCurrentUser } from "@/lib/session"

export async function deleteDocument(docId: string) {
  const user = await getCurrentUser()
  
  if (!user?.permissions.includes("documents:delete")) {
    throw new Error("Permission denied")
  }
  
  // Proceed with deletion
}
```

### Page Protection

```typescript
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const user = await getCurrentUser()
  
  // Only super admins can access
  if (user?.roleKey !== "super_admin") {
    redirect("/dashboard")
  }
  
  // Render admin panel
}
```

## Admin Dashboard

### Access Admin Panel
- URL: `http://localhost:3000/admin`
- Restricted to: Super Administrators only
- Features:
  - View all roles and their permissions
  - Create new custom roles
  - Manage user-role assignments
  - View all available permissions

### Create a Custom Role

1. Go to `/admin/roles`
2. Click "New Role"
3. Fill in:
   - **Role Name**: e.g., "Project Manager"
   - **Role Key**: e.g., "project_manager" (unique identifier)
   - **Description**: What this role does
   - **Level**: Hierarchy level (higher = more privileged)
   - **Permissions**: Select which permissions this role has
4. Click Create

### Assign Role to User

1. Go to `/admin/users` 
2. Search for user
3. Select new role from dropdown
4. Click Assign
5. User's permissions update on next request

## Permission Format

All permissions follow the pattern: `<module>:<action>`

### Modules
- `dashboard` - Dashboard and analytics
- `documents` - Document management
- `workflows` - Workflow management
- `approvals` - Approval workflows
- `projects` - Project management
- `vendors` - Vendor management
- `contracts` - Contract management
- `risk` - Risk management
- `compliance` - Compliance management
- `users` - User management
- `audit` - Audit trail access
- `analytics` - Analytics and reporting

### Actions
- `view` - Read/view permission
- `create` - Create new items
- `edit` - Modify existing items
- `delete` - Delete items
- `approve` - Approve/reject requests
- `admin` - Full administrative access to module

### Examples
- `documents:view` - View documents
- `documents:create` - Create new documents
- `approvals:approve` - Approve requests
- `users:admin` - Full user management
- `risk:edit` - Modify risk assessments

## Database Schema

### Users & Roles Flow

```
user (Better Auth table)
  └── user_roles (M:M junction)
      └── roles
          └── role_permissions (M:M junction)
              └── permissions
```

### New Tables Added
- `permissions` - All system permissions
- `roles` - Role definitions (updated)
- `role_permissions` - Maps roles to permissions
- `user_roles` - Maps users to roles

## Migration from Old System

If upgrading from the old system:

```sql
-- Old system cleanup (if needed)
ALTER TABLE profiles DROP COLUMN roleId;

-- New system is ready to use
POST /api/rbac/seed  -- Seeds predefined roles
```

## Best Practices

1. **Use Principle of Least Privilege**
   - Give users only the permissions they need
   - Don't make everyone admins

2. **Create Role Hierarchies**
   - Use the `level` field to establish hierarchy
   - Higher level = more access

3. **Name Permissions Clearly**
   - Format: module:action
   - Be consistent in naming

4. **Audit Role Changes**
   - Track who assigned what role and when
   - Review access logs regularly

5. **Review Permissions Regularly**
   - Audit what permissions each role has
   - Remove unnecessary permissions

## Troubleshooting

### User has permission but still denied access?

1. Check if permission is spelled correctly
2. Verify user's role has the permission
3. Check if permission exists in database
4. User session may be cached - clear cookies and refresh

### Cannot see admin panel?

1. Verify your role is "super_admin"
2. Check `user_roles` table for your user
3. Verify role has "users:admin" permission

### Permission not working in code?

1. Verify permission key format: `module:action`
2. Check if permission exists: `GET /api/rbac/permissions`
3. Verify role has permission assigned
4. Check logs for error details

## API Reference

See `RBAC_MODERN.md` for complete API documentation including:
- Detailed endpoint specifications
- Request/response examples
- Error handling
- Type definitions
