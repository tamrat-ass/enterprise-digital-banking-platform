# Getting Started: Permission System (Complete Guide)

## ⚡ Quick Start (2 minutes)

### 1. Initialize RBAC
Open your browser and go to:
```
http://localhost:3000/admin/init-rbac
```

Click the **"Initialize RBAC"** button and wait for success.

✅ **Done! RBAC is initialized.**

---

### 2. Create a User with a Role
Go to:
```
http://localhost:3000/admin/users
```

1. Click **"Add User"**
2. Fill in: Name, Email
3. Select a role: **"Document Officer"** (for example)
4. Click **"Create User"**
5. Page automatically reloads

✅ **User created with permissions!**

---

### 3. Test the Permission
1. Sign in as the new user
2. Try uploading a document
3. Should work now! ✅

---

## Complete Reference

### Available Roles

| Role | Permissions | Use For |
|------|-------------|---------|
| **Super Admin** | All (25) | System administrators |
| **System Admin** | Users, Roles, Audit | Admin staff |
| **Document Officer** | Upload, Create, View documents | Document managers |
| **Approver** | View, Approve documents | Approval staff |
| **Viewer** | View, Download documents | Read-only access |
| **Auditor** | Documents, Reports, Audit (read-only) | Compliance/audit teams |

---

### Available Permissions

**Documents (8):**
- documents.create - Create new documents
- documents.view - View documents
- documents.upload - Upload document files
- documents.preview - Preview as PDF
- documents.download - Download documents
- documents.update - Edit documents
- documents.delete - Delete documents
- documents.approve - Approve documents

**Users (4):**
- users.create - Create user accounts
- users.view - View user list
- users.update - Edit user details
- users.delete - Delete users

**Roles (4):**
- roles.create - Create new roles
- roles.view - View roles
- roles.update - Edit roles and permissions
- roles.delete - Delete roles

**Approvals (2):**
- approvals.view - View approval requests
- approvals.approve - Approve requests

**Reports (2):**
- reports.view - View reports
- reports.export - Export reports

**Categories (4):**
- categories.create, view, update, delete

**Audit (1):**
- audit.view - View audit logs

---

## User Management Workflow

### Create a User
```
1. Go to /admin/users
2. Click "Add User"
3. Enter: Name, Email, Role
4. Click "Create User"
5. ✅ User created with that role's permissions
```

### Edit a User's Role
```
1. Go to /admin/users
2. Click edit icon next to user
3. Change the Role dropdown
4. Click "Save Changes"
5. ✅ Page reloads with new permissions
```

### Remove a User
```
1. Go to /admin/users
2. Click delete icon next to user
3. Confirm
4. ✅ User deleted
```

### Reset User Password
```
1. Go to /admin/users
2. Click key icon next to user
3. Enter new password
4. Click "Reset Password"
5. ✅ Password updated, user can sign in with new password
```

---

## Role Management Workflow

### View/Edit a Role's Permissions
```
1. Go to /admin/roles
2. Click the role name
3. Check/uncheck permissions
4. Click "Save Changes"
5. ✅ All users with that role get the new permissions
```

### Create a Custom Role
```
1. Go to /manage-roles or /admin/roles
2. Click "Create Role"
3. Enter: Name, Description
4. Select permissions
5. Click "Create"
6. ✅ Custom role created and available for assignment
```

---

## Troubleshooting

### Problem: Still Getting 403 After Assigning Role

**Solution Step 1: Check if RBAC is initialized**
```
Go to: http://localhost:3000/api/admin/init-rbac
Should show: "already_initialized" status
```

**Solution Step 2: Check user's permissions**
```
Go to: http://localhost:3000/api/admin/diagnose-permissions
Should show: User's role and all permissions
```

**Solution Step 3: User must log out and back in**
- Old session data might be cached
- Sign out completely
- Sign in again
- Try the action again

**Solution Step 4: Verify role has the permission**
```
1. Go to /admin/roles
2. Find the role assigned to user
3. Check if required permission is checked
4. If not, check it and save
```

---

### Problem: RBAC Not Yet Initialized

**Solution:**
```
1. Go to http://localhost:3000/admin/init-rbac
2. Click "Initialize RBAC" button
3. Wait for success message
```

---

### Problem: User Can't Sign In

**Solution:**
1. Make sure the user's email is spelled correctly
2. Make sure the password is correct (at least 8 chars, with uppercase, lowercase, number, special char)
3. Try resetting the password:
   - Go to `/admin/users`
   - Click key icon next to user
   - Set a new password
   - Click "Reset Password"

---

## API Reference

### User Management
```
GET    /api/users                    - List all users
POST   /api/users                    - Create user
PUT    /api/users/{id}               - Update user
DELETE /api/users/{id}               - Delete user
GET    /api/users/{id}               - Get single user
POST   /api/users/reset-password     - Reset password
```

### Role Management
```
GET    /api/rbac/roles               - List roles
GET    /api/rbac/roles/{id}          - Get role details
POST   /api/rbac/roles               - Create role
PATCH  /api/rbac/roles/{id}          - Update role
DELETE /api/rbac/roles/{id}          - Delete role
```

### Permissions
```
GET    /api/rbac/permissions         - List all permissions
```

### User-Role Assignment
```
POST   /api/rbac/user-roles          - Assign role to user
DELETE /api/rbac/user-roles/{userId}/{roleId} - Remove role
```

### Diagnostics
```
GET    /api/admin/init-rbac          - Initialize RBAC
GET    /api/admin/diagnose-permissions - Check user permissions
```

---

## Database Schema

### Key Tables

**permissions** - All available permissions
```
id                 - Permission ID
module            - Module name (users, documents, roles, etc.)
permission_key    - Permission action (create, view, update, etc.)
permission_name   - Display name
created_at        - Creation timestamp
```

**roles** - All roles (system and custom)
```
id                - Role ID
name              - Role name
description       - Role description
is_system         - True if system role (can't be deleted)
is_active         - Whether role is active
created_at        - Creation timestamp
```

**user_roles** - User-to-role assignments
```
id               - Assignment ID
user_id          - User ID
role_id          - Role ID
assigned_by      - Who assigned it
created_at       - Assignment date
```

**role_permissions** - Role-to-permission assignments
```
id               - Assignment ID
role_id          - Role ID
permission_id    - Permission ID
created_at       - Assignment date
```

---

## Security Notes

### Permission Hierarchy
- Super Admin has all permissions
- System Admin can only manage users, roles, and audit
- Other roles have specific limited permissions
- Permissions are checked on EVERY request

### Permission Checking
- Permissions are fetched fresh from database per request
- Cached only within a single request (React's `cache()`)
- New request stream = fresh permissions

### Best Practices
1. **Don't bypass permission checks**
   - All API routes should call `requirePermission()`
   - All components should check `user.permissions`

2. **Regularly audit permissions**
   - Who has documents.approve?
   - Who has users.delete?
   - Keep security tight

3. **Use roles instead of individual permissions**
   - Assign roles, not permissions directly
   - Makes management easier
   - Clearer security model

---

## Common Tasks

### Make Someone a Document Manager
```
1. Go to /admin/users
2. Click edit on user
3. Change role to "Document Officer"
4. Click "Save Changes"
5. ✅ Done - they can now upload/create documents
```

### Allow Approvers to See Reports
```
1. Go to /admin/roles
2. Click "Approver" role
3. Scroll to "Reports" section
4. Check "View Reports"
5. Click "Save Changes"
6. ✅ All approvers can now view reports
```

### Audit Who Has Admin Access
```
1. Go to /admin/users
2. Look for users with "Super Admin" or "System Admin" roles
3. Regular users should have "Viewer" or "Document Officer" roles
```

### Disable a User
```
1. Go to /admin/users
2. Click edit on user
3. Change status to "Disabled"
4. Click "Save Changes"
5. ✅ User can no longer sign in
```

---

## Frequently Asked Questions

**Q: Why do I get a 403 error?**
A: The user doesn't have the required permission for that action. Check what permissions they have: `/api/admin/diagnose-permissions`

**Q: How do I create a custom role?**
A: Go to `/manage-roles` or `/admin/roles` and click "Create Role". Select the permissions you want and save.

**Q: Can I edit system roles?**
A: Yes! System roles are fully editable. Go to `/admin/roles`, click a system role, and modify its permissions.

**Q: What happens after I assign a role?**
A: The page automatically reloads to pick up the new permissions. The user needs to refresh or sign out/in to see changes take effect immediately.

**Q: How many permissions are there?**
A: 25 total permissions across 7 modules (users, documents, roles, approvals, reports, categories, audit).

**Q: Can a user have multiple roles?**
A: Yes! A user can be assigned multiple roles and will have all permissions from all their roles combined.

---

## Support

**Documentation Files:**
- `RBAC_INITIALIZATION.md` - Detailed initialization guide
- `PERMISSION_SYSTEM_GUIDE.md` - Complete permission system reference
- `FIX_SUMMARY_403_ERRORS.md` - Troubleshooting 403 errors

**Admin Pages:**
- `http://localhost:3000/admin/users` - User management
- `http://localhost:3000/admin/roles` - Role management
- `http://localhost:3000/admin/init-rbac` - Initialize RBAC

**Debug Endpoints:**
- `GET /api/admin/init-rbac` - Initialize & check status
- `GET /api/admin/diagnose-permissions` - Check user permissions

---

**You're all set!** The permission system is ready to use. Start by initializing RBAC at `/admin/init-rbac`. 🎉
