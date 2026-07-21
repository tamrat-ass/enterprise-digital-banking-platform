# RBAC System - Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Initialize System Roles (One-time Setup)
```bash
# Make a POST request to seed endpoint
curl -X POST http://localhost:3000/api/rbac/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This creates:
- 6 system roles (Super Admin, System Admin, Document Officer, Approver, Viewer, Auditor)
- 25+ permissions across 7 modules

### Step 2: Access the Admin Panel
1. Navigate to `http://localhost:3000/admin`
2. You should see three management sections

### Step 3: Manage Roles
1. Go to `/admin/roles`
2. View all roles in table format
3. Click "Create Role" to add custom role
4. Click edit (pencil) icon to assign permissions
5. Click delete (trash) icon to remove custom roles

**Table Columns:**
- Role Name - Name and type (System/Custom)
- Users - How many users have this role
- Permissions - How many permissions this role has
- Status - Active/Inactive
- Actions - Edit and Delete buttons

### Step 4: Assign Roles to Users
1. Go to `/admin/users`
2. Click user card to expand
3. Current roles shown with remove (X) button
4. Available roles shown as cards with add (+) button
5. Click to add/remove roles instantly

**Key Features:**
- Users can have multiple roles
- Each role adds its permissions
- Changes apply immediately

### Step 5: View Permissions
1. Go to `/admin/permissions`
2. See all permissions grouped by module
3. View permission names and descriptions

---

## Permission Format

Permissions use dot notation: `module.permissionKey`

### Modules & Permissions

**Users Module**
- users.create - Create users
- users.view - View users
- users.update - Update users
- users.delete - Delete users

**Documents Module**
- documents.create - Create documents
- documents.view - View documents
- documents.update - Update documents
- documents.delete - Delete documents
- documents.upload - Upload documents
- documents.preview - Preview documents
- documents.download - Download documents
- documents.approve - Approve documents

**Roles Module**
- roles.create - Create roles
- roles.view - View roles
- roles.update - Update roles
- roles.delete - Delete roles

**Approvals Module**
- approvals.view - View approvals
- approvals.approve - Approve requests

**Reports Module**
- reports.view - View reports
- reports.export - Export reports

**Categories Module**
- categories.create - Create categories
- categories.view - View categories
- categories.update - Update categories
- categories.delete - Delete categories

**Audit Module**
- audit.view - View audit logs

---

## System Roles Reference

### 1. Super Admin
- **Access:** FULL - All permissions
- **Use Case:** System administrator with unrestricted access
- **System Role:** Yes (cannot delete)

### 2. System Admin
- **Permissions:**
  - users: create, view, update, delete
  - roles: create, view, update, delete
  - audit: view
- **Use Case:** Manage users and roles, view audit logs
- **System Role:** Yes (cannot delete)

### 3. Document Officer
- **Permissions:**
  - documents: create, view, update, upload, preview, download
  - approvals: view
- **Use Case:** Upload and manage documents
- **System Role:** Yes (cannot delete)

### 4. Approver
- **Permissions:**
  - documents: view, preview, download, approve
  - approvals: view, approve
- **Use Case:** Review and approve documents
- **System Role:** Yes (cannot delete)

### 5. Viewer
- **Permissions:**
  - documents: view, preview, download
- **Use Case:** View and download documents only
- **System Role:** Yes (cannot delete)

### 6. Auditor
- **Permissions:**
  - documents: view
  - reports: view
  - audit: view
- **Use Case:** Read-only audit logs and reports
- **System Role:** Yes (cannot delete)

---

## Common Tasks

### Create a Custom Role
1. Go to `/admin/roles`
2. Click "Create Role"
3. Enter role name and description
4. Click edit on new role
5. Select permissions by module
6. Click "Save Changes"

### Assign Multiple Roles to User
1. Go to `/admin/users`
2. Click user to expand
3. Click role buttons to add multiple roles
4. Each role adds its permissions
5. User has union of all role permissions

### Remove a Role from User
1. Go to `/admin/users`
2. Click user to expand
3. Click X button next to role name
4. Role removed instantly

### Edit Role Permissions
1. Go to `/admin/roles`
2. Click edit (pencil) icon
3. Check/uncheck permissions
4. Use "Select All" or "Deselect All" buttons
5. Module sections expand/collapse
6. Click "Save Changes"

### Delete Custom Role
1. Go to `/admin/roles`
2. Find custom role (no System badge)
3. Click delete (trash) icon
4. Confirm deletion

*Note: System roles cannot be deleted*

---

## API Usage Examples

### Get All Roles
```bash
GET /api/rbac/roles
Authorization: Bearer TOKEN

Response:
{
  "data": [
    {
      "id": "role-super-admin",
      "name": "Super Admin",
      "description": "Full system access",
      "isSystem": true,
      "isActive": true,
      "userCount": 2,
      "permissionCount": 25,
      "permissions": [...]
    }
  ]
}
```

### Get All Permissions
```bash
GET /api/rbac/permissions
Authorization: Bearer TOKEN

Response:
{
  "data": [
    {
      "id": "perm-documents-upload",
      "module": "documents",
      "permissionKey": "upload",
      "permissionName": "Upload Documents",
      "description": "Permission to upload documents"
    }
  ]
}
```

### Create Custom Role
```bash
POST /api/rbac/roles
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  "name": "Reviewer",
  "description": "Reviews and approves documents",
  "permissionIds": [
    "perm-documents-view",
    "perm-documents-approve",
    "perm-approvals-view",
    "perm-approvals-approve"
  ]
}
```

### Assign Role to User
```bash
POST /api/rbac/user-roles
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  "userId": "user-123",
  "roleId": "role-document-officer"
}
```

### Remove Role from User
```bash
DELETE /api/rbac/user-roles/{userId}/{roleId}
Authorization: Bearer TOKEN
```

---

## Frontend Usage

### Check Permission in Code
```typescript
const session = useSession()

// Check if user has permission
const canDelete = session?.user?.permissions?.includes("documents.delete")

if (canDelete) {
  // Show delete button
}
```

### Protect API Routes
```typescript
import { requirePermission } from "@/lib/api-utils"

export const DELETE = async (req) => {
  const { error } = await requirePermission(req, "documents.delete")
  if (error) return error // Return 403 if not authorized
  
  // Proceed with deletion
}
```

---

## Troubleshooting

### Permissions Not Showing
- Make sure endpoint has permission checks
- Check if user has required role
- Verify role is assigned to user in `/admin/users`

### Can't Delete Role
- Only custom roles can be deleted
- System roles are protected
- Check if role has no users assigned

### Permission Not Applied
- Permissions applied immediately
- May need to refresh browser
- Check session is updated

### User Can't See All Roles
- Some roles might be inactive
- Check the "Status" column in roles table
- Activate role by editing it

---

## Need Help?

### Documentation
- See `RBAC_IMPLEMENTATION_GUIDE.md` for full details
- See `RBAC_TASK_COMPLETION_SUMMARY.md` for what was built

### API Endpoints
- `GET /api/rbac/roles` - List roles
- `POST /api/rbac/roles` - Create role
- `PATCH /api/rbac/roles/[id]` - Update role
- `DELETE /api/rbac/roles/[id]` - Delete role
- `POST /api/rbac/user-roles` - Assign role
- `DELETE /api/rbac/user-roles/[userId]/[roleId]` - Remove role
- `GET /api/rbac/permissions` - View permissions

### Pages
- `/admin/roles` - Role management (table view)
- `/admin/roles/[id]` - Edit role (permissions)
- `/admin/users` - User management (multi-role)
- `/admin/permissions` - Permission viewer

---

**Ready to use! Start with Step 1 above.**
