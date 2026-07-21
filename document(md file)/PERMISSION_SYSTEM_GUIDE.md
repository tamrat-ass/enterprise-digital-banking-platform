# Permission System & Role Assignment Guide

## Current Status: ✅ FULLY OPERATIONAL

All permission and role assignment features are now working correctly. Here's everything you need to know:

---

## 1. How the Permission System Works

### Two-Part Permission System:
1. **Backend Permission Checking** (`/api/users/me`, API endpoints)
   - Every API request checks user permissions via `requirePermission()`
   - Permissions are fetched fresh from the database (NOT cached across requests)
   - Fresh user data is loaded for each new API call

2. **Frontend Permission Display** 
   - User management pages show all available roles
   - Admin can assign/change roles for any user
   - After role assignment, page automatically reloads to pick up new permissions

---

## 2. How to Assign Permissions to a User

### Method 1: Super Admin User Management (Recommended)
**Location:** `/admin/users` or `/users`

**Steps:**
1. Click "Add User" or click edit icon next to existing user
2. Select a role from the dropdown (or assign in edit modal)
3. Click "Create User" or "Save Changes"
4. System automatically:
   - Assigns the role to the user
   - Calls `/api/auth/refresh-session` to fetch fresh permissions
   - Reloads the page after 1 second
   - User immediately has all permissions for that role

**Example Workflow:**
```
1. Admin clicks "Add User"
2. Fills: Name = "Ahmed", Email = "ahmed@bank.com", Role = "Document Officer"
3. Clicks "Create User"
   ↓
   POST /api/users (creates user)
   ↓
   POST /api/rbac/user-roles (assigns role)
   ↓
   POST /api/auth/refresh-session (fetches fresh permissions from DB)
   ↓
   Page reloads after 1 second
   ↓
   ✅ Ahmed now has all "Document Officer" permissions
```

### Method 2: Admin Roles Editor
**Location:** `/admin/roles` → Click role → Edit role

**Steps:**
1. Navigate to `/admin/roles`
2. Click a role to edit it
3. Check/uncheck permissions in the "Permissions" section
4. Click "Save Changes"
5. All users with that role automatically get those permissions on their next request

---

## 3. Available Roles & Their Permissions

### System Roles (Built-in):

#### **Super Admin**
- All permissions (25+)
- Full system access
- Can manage all users, roles, documents, approvals

#### **System Admin**
- Permissions:
  - users.create, users.view, users.update, users.delete
  - roles.view, roles.create, roles.update, roles.delete
  - audit.view
- Can manage users and roles but not documents

#### **Document Officer**
- Permissions:
  - documents.create, documents.view, documents.update, documents.upload
  - documents.preview, documents.download
- Can upload and manage documents

#### **Approver**
- Permissions:
  - documents.view, documents.preview, documents.download
  - documents.approve
  - approvals.view, approvals.approve
- Can review and approve documents

#### **Auditor**
- Permissions:
  - documents.view, reports.view, audit.view
- Read-only access to documents, reports, and audit logs

#### **Viewer**
- Permissions:
  - documents.view, documents.preview, documents.download
- Can only view and download documents

---

## 4. How Permissions Work After Assignment

### When a Role is Assigned:

```
┌─────────────────────────────────────────────────┐
│ Super Admin assigns "Document Officer" to Ahmed │
└──────────────┬──────────────────────────────────┘
               ↓
    POST /api/rbac/user-roles
    {
      userId: "ahmed-id",
      roleId: "document-officer-id"
    }
┌──────────────────────────────────────────────────┐
│ Database Updated:                                │
│ - user_roles table: Ahmed → Document Officer    │
│ - role_permissions table: Read permissions      │
└──────────────┬──────────────────────────────────┘
               ↓
    POST /api/auth/refresh-session
    - Queries fresh user data from database
    - Gets role info
    - Gets all permissions for that role
    - Returns { requiresReload: true }
┌──────────────────────────────────────────────────┐
│ Frontend:                                        │
│ - Receives refresh response                     │
│ - Waits 1 second                                │
│ - Calls window.location.reload()                │
└──────────────┬──────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│ New Request Stream:                              │
│ - Fresh React cache() is created                │
│ - getCurrentUser() queries database again       │
│ - Loads Ahmed's role and permissions            │
│ - All API endpoints see new permissions ✅      │
└──────────────────────────────────────────────────┘
```

### Why the Page Reload is Necessary:

The project uses React's `cache()` function to memoize user data per request:

```javascript
export const getCurrentUser = cache(async () => {
  // Queries database for user, role, and permissions
  // Results are memoized for the duration of this request
})
```

**This means:**
- ✅ Within a single request, permissions are consistent
- ✅ When a new request comes in, fresh data is loaded
- ❌ Within the same request stream, old cached data would be used

**Solution:** Page reload creates a new request stream where fresh permissions are loaded.

---

## 5. Testing Permission Assignment

### Step-by-Step Test:

1. **Create a Test User**
   - Go to `/admin/users` or `/users`
   - Click "Add User"
   - Name: "Test User"
   - Email: "test@bank.com"
   - Role: "Viewer"
   - Click "Create User"
   - Page reloads automatically ✅

2. **Verify Viewer Permissions**
   - The user should be able to:
     - View documents ✅
     - Preview documents ✅
     - Download documents ✅
   - The user should NOT be able to:
     - Upload documents ❌
     - Approve documents ❌
     - Manage users ❌

3. **Upgrade to Document Officer**
   - Go back to `/admin/users`
   - Click edit on "Test User"
   - Change role to "Document Officer"
   - Click "Save Changes"
   - Page reloads automatically ✅

4. **Verify Document Officer Permissions**
   - The user should NOW be able to:
     - Upload documents ✅
     - Create documents ✅
   - But still NOT be able to:
     - Approve documents ❌
     - Manage users ❌

---

## 6. Troubleshooting: Why New Permissions Aren't Working

### If you see 403 errors after assigning new permissions:

**Before (Broken):**
```
1. Assign role to user
   ↓
2. Old permissions still cached in session
   ↓
3. User tries to use new permission
   ↓
4. 403 Forbidden (permission check fails)
```

**Now (Fixed):**
```
1. Assign role to user
   ↓
2. Refresh session endpoint called
   ↓
3. Page reloads (new request stream)
   ↓
4. Fresh permissions loaded from database
   ↓
5. User tries to use new permission
   ↓
6. ✅ Succeeds (fresh permissions match)
```

### If page doesn't reload after role assignment:

1. Check browser console for errors
2. Check network tab - look for `/api/auth/refresh-session` call
3. Verify the role was actually assigned in the database:
   - Check `user_roles` table
   - Check `role_permissions` table

### If permission still shows as denied:

1. Verify the role has that permission:
   - Go to `/admin/roles`
   - Click the role
   - Check if permission is checked
   - If not checked, check it and save

2. Verify user is assigned to the correct role:
   - Go to `/admin/users`
   - Click edit on user
   - Confirm the role is selected

3. Check API logs for permission validation:
   - Look for `[requirePermission]` logs
   - Should show the permission being checked
   - Should show user has permission after role assignment

---

## 7. Permission Format

Permissions are stored as `module.key`:

```
users.create          - Can create users
users.view            - Can view users
users.update          - Can update users
users.delete          - Can delete users
documents.create      - Can create documents
documents.upload      - Can upload documents
documents.approve     - Can approve documents
documents.preview     - Can preview documents (PDF)
documents.download    - Can download documents
roles.create          - Can create new roles
roles.update          - Can edit roles
approvals.view        - Can view approvals
approvals.approve     - Can approve requests
audit.view            - Can view audit logs
reports.view          - Can view reports
categories.view       - Can view categories
```

---

## 8. System Architecture

### Database Tables:
- `user` - User accounts
- `roles` - Role definitions (system + custom)
- `permissions` - Permission definitions
- `user_roles` - Links users to roles (many-to-many)
- `role_permissions` - Links roles to permissions (many-to-many)

### Key Files:
- `/lib/session.ts` - Loads user data and permissions (uses `cache()`)
- `/lib/services/rbac.service.ts` - Role and permission management
- `/app/api/rbac/user-roles/route.ts` - Assigns roles to users
- `/app/api/auth/refresh-session/route.ts` - Fetches fresh permissions
- `/app/users/users-client.tsx` - User management UI with auto-reload
- `/app/admin/roles/[id]/page.tsx` - Role editor with permissions

---

## 9. API Endpoints

### Role Management:
```
GET    /api/rbac/roles                 - Get all roles
GET    /api/rbac/roles/{roleId}        - Get single role with permissions
POST   /api/rbac/roles                 - Create new role
PATCH  /api/rbac/roles/{roleId}        - Update role and permissions
DELETE /api/rbac/roles/{roleId}        - Delete role
```

### User-Role Assignment:
```
POST   /api/rbac/user-roles            - Assign role to user
DELETE /api/rbac/user-roles/{userId}/{roleId} - Remove role from user
```

### Permissions:
```
GET    /api/rbac/permissions           - Get all permissions (grouped by module)
```

### Session:
```
POST   /api/auth/refresh-session       - Get fresh user permissions
```

---

## 10. Best Practices

### For Admins:
1. **Always use the UI** to manage roles and permissions
   - Go to `/admin/roles` or `/manage-roles`
   - Don't modify the database directly

2. **Create custom roles** for specific job functions
   - Example: "Finance Approver" with documents.approve + audit.view

3. **Use system roles** for common functions
   - Super Admin, Document Officer, Approver, Viewer

4. **Review permissions regularly**
   - Who has document.approve?
   - Who has users.delete?
   - Keep security tight

### For Developers:
1. **Use `requirePermission()` in API routes**
   ```typescript
   const { error } = await requirePermission(req, 'documents.approve')
   if (error) return error
   ```

2. **Check permissions in components**
   ```typescript
   const user = await getCurrentUser()
   if (!user.permissions.includes('documents.upload')) {
     return <NoAccessPage />
   }
   ```

3. **Never bypass permission checks**
   - Always call `requirePermission()`
   - Always check user permissions before rendering sensitive features

---

## 11. Summary

✅ **Permission System Status:**
- All role assignments working
- Permissions correctly checked on every request
- System roles can be edited (was fixed)
- Custom roles can be created and managed
- User-friendly admin interface
- Automatic page reload after role changes

✅ **What's Fixed:**
- Password reset now works correctly
- Role assignment refreshes permissions immediately
- System roles are fully editable
- 403 errors after role assignment are resolved
- Build compiles successfully

**You're ready to use the permission system!** 🎉

---

For questions or issues, refer to the relevant section above or check the git history for implementation details.
