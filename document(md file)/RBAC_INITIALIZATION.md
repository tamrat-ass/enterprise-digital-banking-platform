# RBAC System Initialization Guide

## ⚠️ CRITICAL: You Must Initialize RBAC First!

Before assigning roles to users, you **MUST** initialize the RBAC system by seeding the database with permissions and system roles.

---

## Quick Start: Initialize RBAC (30 seconds)

### Step 1: Sign In
- Go to `/sign-in`
- Sign in with your Super Admin account
- (If you don't have one, create a test account first)

### Step 2: Initialize
- Call the initialization endpoint in your browser or API client:
  ```
  GET /api/admin/init-rbac
  ```
  
  Or run this curl command:
  ```bash
  curl -X GET "http://localhost:3000/api/admin/init-rbac" \
    -H "Cookie: authToken=YOUR_AUTH_TOKEN"
  ```

### Step 3: Verify
The response should show:
```json
{
  "status": "initialized",
  "message": "RBAC system initialized successfully",
  "initialized": true,
  "permissionCount": 25,
  "rolePermissionCount": 40
}
```

✅ **RBAC is now initialized!**

---

## What Gets Initialized

### Permissions (25 total)
The system creates these permissions across modules:

**Users Module:**
- users.create, users.view, users.update, users.delete

**Documents Module:**
- documents.create, documents.view, documents.update, documents.delete
- documents.upload, documents.preview, documents.download, documents.approve

**Roles Module:**
- roles.create, roles.view, roles.update, roles.delete

**Approvals Module:**
- approvals.view, approvals.approve

**Reports Module:**
- reports.view, reports.export

**Categories Module:**
- categories.create, categories.view, categories.update, categories.delete

**Audit Module:**
- audit.view

### System Roles (6 total)

#### 1. **Super Admin** (25 permissions)
- All permissions
- Full system access

#### 2. **System Admin** (9 permissions)
- users.create, users.view, users.update, users.delete
- roles.view, roles.create, roles.update, roles.delete
- audit.view

#### 3. **Document Officer** (6 permissions)
- documents.create, documents.view, documents.update, documents.upload
- documents.preview, documents.download

#### 4. **Approver** (7 permissions)
- documents.view, documents.preview, documents.download
- documents.approve
- approvals.view, approvals.approve

#### 5. **Viewer** (3 permissions)
- documents.view, documents.preview, documents.download

#### 6. **Auditor** (3 permissions)
- documents.view, reports.view, audit.view

---

## Troubleshooting

### Problem: "Must be signed in to initialize RBAC"
**Solution:** You must be authenticated first
- Sign in at `/sign-in`
- Then call `/api/admin/init-rbac` again

### Problem: "RBAC already initialized"
**Solution:** RBAC is already set up
- This is good! You can now use it
- Proceed to assigning roles to users

### Problem: "Failed to initialize RBAC"
**Solution:** Check the server logs for the specific error
- Database connection issue?
- Permission conflict?
- Contact your DBA or system admin

### Problem: After initialization, still getting 403 errors
**Solution:** Make sure you've:
1. ✅ Initialized RBAC (`/api/admin/init-rbac`)
2. ✅ Assigned a role to the user (`/admin/users` → edit user → select role)
3. ✅ User has logged out and back in (or page reloaded)
4. ✅ The role has the required permission

---

## Checking RBAC Status

### Endpoint: Check Status
```
GET /api/admin/diagnose-permissions
```

This endpoint returns:
- Current user info
- Assigned roles
- Available permissions
- Whether role assignment matches database

Use this to debug permission issues!

---

## After Initialization: Assigning Roles

Now that RBAC is initialized, you can:

1. **Go to `/admin/users`**
2. **Click "Add User" or edit existing user**
3. **Select a role from the dropdown:**
   - Super Admin
   - System Admin
   - Document Officer
   - Approver
   - Viewer
   - Auditor
4. **Click "Create User" or "Save Changes"**
5. **Page automatically reloads**
6. **✅ User now has the role's permissions!**

---

## Database Verification

If you want to manually verify the RBAC data:

### Check Permissions Table
```sql
SELECT * FROM permissions LIMIT 10;
```

Expected output: ~25 rows with modules and permission keys

### Check Roles Table
```sql
SELECT * FROM roles WHERE is_system = true;
```

Expected output: 6 system roles (Super Admin, System Admin, etc.)

### Check Role-Permission Links
```sql
SELECT r.name, p.module, p.permission_key, COUNT(*) as count
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.name, p.module, p.permission_key
LIMIT 20;
```

Expected output: 40+ rows linking roles to permissions

---

## API Reference

### Initialize RBAC
```
GET /api/admin/init-rbac
```
- **Response:** RBAC status and counts
- **Authentication:** Required
- **Permissions:** None (bypasses permission checks for first-time setup)

### Diagnose Permissions
```
GET /api/admin/diagnose-permissions
```
- **Response:** Current user permissions and role assignments
- **Authentication:** Required
- **Use for:** Debugging 403 errors

### Seed Roles and Permissions
```
POST /api/rbac/seed
```
- **Response:** Success or error message
- **Authentication:** Required
- **Permissions:** None (bypasses permission checks for first-time setup)

### Assign Role to User
```
POST /api/rbac/user-roles
{
  "userId": "user-id",
  "roleId": "role-id"
}
```
- **Response:** Assignment confirmation
- **Authentication:** Required
- **Permissions:** users.update

---

## Next Steps

After RBAC is initialized:

1. ✅ Create users with roles (`/admin/users`)
2. ✅ Edit role permissions (`/admin/roles`)
3. ✅ View permission assignments (`/api/admin/diagnose-permissions`)
4. ✅ Users get permissions immediately after role assignment

---

## Summary

**The 403 error you were seeing was because:**
1. RBAC wasn't initialized (no permissions in database)
2. When a user was assigned a role, that role had NO permissions
3. All API endpoints returned 403 because user had no permissions

**Now that you can initialize RBAC:**
1. ✅ All 25 permissions are created
2. ✅ All 6 system roles are created  
3. ✅ All roles have their permissions linked
4. ✅ Users get permissions when assigned a role

**Next time you see 403:**
- Check if RBAC is initialized: `GET /api/admin/init-rbac`
- Check user permissions: `GET /api/admin/diagnose-permissions`
- Verify role was assigned: `GET /admin/users` → find user
- Make sure user has the required permission for that action

---

**You're ready to use RBAC!** 🎉
