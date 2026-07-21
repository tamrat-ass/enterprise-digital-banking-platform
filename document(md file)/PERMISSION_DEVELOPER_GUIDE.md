# Permission System - Developer Guide

## Quick Reference

### Using Permissions in Pages

#### Pattern 1: Server Component (Recommended)
```typescript
import { getCurrentUser, requireUser } from "@/lib/session"
import { BankingLayout } from "@/components/banking-layout"

export default async function MyPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  // Always pass permissions to BankingLayout
  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration",
      permissions: user.permissions || [] // ✅ ALWAYS PASS THIS
    }}>
      <div>Your page content</div>
    </BankingLayout>
  )
}
```

#### Pattern 2: Client Component (Admin Pages)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"

export default function AdminPage() {
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUserPermissions(data.data?.permissions || [])
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  return (
    <BankingLayout user={{
      name: 'Admin',
      role: 'Administrator',
      department: 'System',
      // ✅ Use fetched permissions OR fallback to dummy permission
      permissions: (userPermissions.length > 0 ? userPermissions : ['admin.view']) as any
    }}>
      <div>Admin page content</div>
    </BankingLayout>
  )
}
```

---

## API Endpoints

### Check Current User Permissions
```bash
GET /api/users/me

Response:
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "Ahmed",
    "email": "ahmed@bank.com",
    "roleName": "Document Officer",
    "permissions": [
      "documents.create",
      "documents.view",
      "documents.update",
      "categories.view"
    ]
  }
}
```

### Refresh User Permissions (After Role Assignment)
```bash
POST /api/auth/refresh-session

Response:
{
  "success": true,
  "requiresReload": true,
  "data": {
    "user": {
      "id": "user_123",
      "permissions": [...]
    }
  }
}
```

### Assign Role to User
```bash
POST /api/rbac/user-roles

Body:
{
  "userId": "user_123",
  "roleId": "role_456"
}

Response:
{
  "success": true,
  "permissions": [
    "documents.create",
    "documents.view",
    // ... all permissions from that role
  ]
}
```

---

## Permission Structure

### Format
Permissions are in format: `module.action`

**Examples:**
- `documents.view` - Can view documents
- `documents.create` - Can create documents
- `approvals.approve` - Can approve items
- `audit.view` - Can view audit logs
- `users.update` - Can update users
- `roles.create` - Can create roles

### Modules
```
dashboard, documents, workflows, approvals, projects, 
vendors, contracts, risk, compliance, users, audit, 
analytics, roles, categories, reports
```

### Actions
```
view, create, edit, delete, approve, admin, update, 
upload, preview, download
```

---

## Permission Checking in APIs

### Check Specific Permission
```typescript
import { requirePermission } from "@/lib/api-utils"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "documents.create")
  if (error) return error // Returns 403 if permission denied

  // User has permission, continue with logic
  // ...
})
```

### Check Any Permission from a Set
```typescript
const currentUser = await getCurrentUser()

const hasDocumentAccess = currentUser.permissions.some(p =>
  p === "documents.view" ||
  p === "documents.create" ||
  p === "documents.update"
)

if (!hasDocumentAccess) {
  return errorResponse("Forbidden", 403)
}
```

### Check Module Access
```typescript
const currentUser = await getCurrentUser()

// Check if user has ANY document-related permission
const hasDocumentModuleAccess = currentUser.permissions.some(p =>
  p.startsWith("documents.")
)

if (!hasDocumentModuleAccess) {
  return errorResponse("Forbidden", 403)
}
```

---

## Common Patterns

### Pattern 1: Dashboard with Any Permission
```typescript
// Dashboard shows if user has ANY permission (general access)
if (!user.permissions || user.permissions.length === 0) {
  redirect('/no-access')
}
```

### Pattern 2: Specific Feature Access
```typescript
// Categories shows if user has category-related permission
const hasAccess = user.permissions.some(p => 
  p === "categories.view" || 
  p === "categories.create" ||
  p === "categories.update" ||
  p === "categories.delete"
)

if (!hasAccess) {
  redirect('/no-access')
}
```

### Pattern 3: Menu Item Filtering
```typescript
// BankingLayout filters menu items based on permissions
const menuItems = allMenuItems.filter(item =>
  user.permissions.some(p => 
    p === item.permission || 
    p.startsWith(item.permission.split('.')[0])
  )
)
```

---

## Debugging Permissions

### Check User's Current Permissions
```bash
GET /api/admin/diagnose-permissions

Response:
{
  "user": {
    "id": "user_123",
    "name": "Ahmed",
    "role": "Document Officer",
    "permissions": ["documents.create", "categories.view"],
    "permissions_from_role": [
      "documents.view",
      "documents.create",
      "documents.update",
      // ... all role permissions
    ]
  },
  "match": true // Does actual match role?
}
```

### Permission Assignment Verification
```bash
POST /api/admin/fix-existing-roles

Verifies all user-role assignments are correct
Returns count of users and any issues found
```

---

## TypeScript Types

### Permission Type
```typescript
type Permission = `${ModuleKey}.${"view" | "create" | "edit" | "delete" | "approve" | "admin" | "update" | "upload" | "preview" | "download"}`

// Examples:
const p1: Permission = "documents.view" // ✅ Valid
const p2: Permission = "documents.create" // ✅ Valid
const p3: Permission = "invalid.action" // ❌ Type Error
```

### CurrentUser Type
```typescript
interface CurrentUser {
  id: string
  name: string
  email: string
  jobTitle: string | null
  roleName: string
  roleId: string | null
  departmentId: string | null
  departmentName: string | null
  permissions: Permission[] // Array of specific permission strings
}
```

### BankingLayout User Type
```typescript
interface BankingLayoutProps {
  user?: {
    name: string
    role: string
    department: string
    avatar?: string
    permissions: Permission[] // Must pass this!
  }
}
```

---

## Troubleshooting

### Issue: User sees "Access Denied" but should have permissions

**Checklist:**
1. ✅ Is page passing `permissions` to BankingLayout?
2. ✅ Is user's role assigned in database?
3. ✅ Does role have the required permissions?
4. ✅ Did user reload page after role assignment?
5. ✅ Check `/api/admin/diagnose-permissions` to verify

### Issue: Menu items not showing even with permissions

**Solution:**
```typescript
// BankingLayout checks if permission STARTS WITH module prefix
// So these all work:
userPermissions = ["documents.view"] // ✅ Shows document items
userPermissions = ["documents.create"] // ✅ Shows document items
userPermissions = ["documents.admin"] // ✅ Shows document items

// But this doesn't work:
userPermissions = ["dashboard.view"] // ❌ Won't show document items
```

### Issue: TypeScript error when passing permissions

**Solution:**
```typescript
// ❌ Wrong - TypeScript error
<BankingLayout user={{ permissions: ["documents.view"] }}>

// ✅ Right - Cast as any to bypass type checking
<BankingLayout user={{ permissions: ["documents.view"] as any }}>
```

---

## Key Files

- `lib/rbac.ts` - Permission type definitions
- `lib/session.ts` - User loading with permissions
- `lib/api-utils.ts` - Permission checking utilities
- `components/banking-layout.tsx` - Permission-based menu filtering
- `app/api/auth/refresh-session/route.ts` - Session refresh after role change
- `app/api/rbac/user-roles/route.ts` - Role assignment endpoint

---

## Summary

✅ **Always pass permissions to BankingLayout**
✅ **Use server components for best practices**
✅ **Session refresh happens automatically after role assignment**
✅ **Permissions are loaded from database on every request**
✅ **Menu items filtered based on permission prefix matching**
