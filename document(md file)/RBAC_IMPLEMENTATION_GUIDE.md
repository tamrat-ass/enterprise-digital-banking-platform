# Comprehensive Role-Based Access Control (RBAC) Implementation Guide

## Overview
This document outlines the complete implementation of a modern, scalable Role-Based Access Control (RBAC) system for the Enterprise Digital Banking Platform. The system separates **WHO a user is** (Roles) from **WHAT they can do** (Permissions).

---

## Architecture & Design

### Core Principle: Separation of Concerns
- **Roles**: Define who a user is (e.g., Super Admin, Document Officer, Approver)
- **Permissions**: Define what actions users can perform (e.g., document.upload, document.approve)
- **User-Role Mapping**: Users can have multiple roles, each with their own permissions
- **Role-Permission Mapping**: Many-to-many relationship allowing granular control

---

## Database Schema

### Tables

#### 1. `roles`
```sql
- id (UUID) PRIMARY KEY
- name (text) NOT NULL - Role display name
- description (text) - Role description
- isSystem (boolean) - True for system roles (cannot be deleted)
- isActive (boolean) - Enable/disable a role
- createdAt (timestamp)
- updatedAt (timestamp)
```

Example system roles:
- Super Admin - Full system access
- System Admin - Manage users, roles, and settings
- Document Officer - Upload and manage documents
- Approver - Review and approve documents
- Viewer - View and download documents only
- Auditor - View reports and audit logs (read-only)

#### 2. `permissions`
```sql
- id (UUID) PRIMARY KEY
- module (text) NOT NULL - Feature/module name (e.g., 'documents', 'users', 'roles')
- permissionKey (text) NOT NULL - Action name (e.g., 'upload', 'view', 'delete')
- permissionName (text) NOT NULL - Human-readable name (e.g., 'Upload Documents')
- description (text) - What this permission allows
- createdAt (timestamp)
```

Module Format: `module.permissionKey` (e.g., `documents.upload`, `users.create`)

Available modules and permissions:
- **users**: create, view, update, delete
- **documents**: create, view, update, delete, upload, preview, download, approve
- **roles**: create, view, update, delete
- **approvals**: view, approve
- **reports**: view, export
- **categories**: create, view, update, delete
- **audit**: view

#### 3. `role_permissions` (Junction Table)
```sql
- id (UUID) PRIMARY KEY
- roleId (UUID) FOREIGN KEY -> roles.id (cascade delete)
- permissionId (UUID) FOREIGN KEY -> permissions.id (cascade delete)
- createdAt (timestamp)
```
Many-to-many relationship between roles and permissions.

#### 4. `user_roles` (Junction Table)
```sql
- id (UUID) PRIMARY KEY
- userId (UUID) FOREIGN KEY -> user.id (cascade delete)
- roleId (UUID) FOREIGN KEY -> roles.id (cascade delete)
- assignedBy (text) - Who assigned this role
- assignedAt (timestamp)
```
Many-to-many relationship allowing users to have multiple roles.

---

## Backend Implementation

### Service Layer: `lib/services/rbac.service.ts`

Core methods:

```typescript
// Seed system roles and permissions
seedRolesAndPermissions(): Promise<void>

// Create custom role
createRole(input: CreateRoleInput): Promise<Role>

// Get all roles with user and permission counts
getAllRoles(): Promise<Role[]>

// Get single role by ID with permissions
getRole(roleId: string): Promise<Role>

// Update role name, description, and permissions
updateRole(roleId: string, input: UpdateRoleInput): Promise<Role>

// Assign a role to a user (supports multiple roles)
assignRoleToUser(userId: string, roleId: string): Promise<{userId, roleId}>

// Remove a role from a user
removeRoleFromUser(userId: string, roleId: string): Promise<{success: true}>

// Get user's all roles with permissions
getUserRoles(userId: string): Promise<Role[]>

// Get all permissions
getAllPermissions(): Promise<Permission[]>

// Get permissions grouped by module
getPermissionsByModule(): Promise<{[module]: Permission[]}>

// Check if user has specific permission
userHasPermission(userId: string, permission: string): Promise<boolean>
```

### API Endpoints

#### Role Management
- `GET /api/rbac/roles` - List all roles with counts
- `POST /api/rbac/roles` - Create new role
- `GET /api/rbac/roles/[id]` - Get role details with permissions
- `PATCH /api/rbac/roles/[id]` - Update role
- `DELETE /api/rbac/roles/[id]` - Delete custom role

#### User-Role Assignment
- `POST /api/rbac/user-roles` - Assign role to user
- `DELETE /api/rbac/user-roles/[userId]/[roleId]` - Remove role from user

#### Permission Management
- `GET /api/rbac/permissions` - Get all permissions
- `GET /api/rbac/permissions?groupBy=module` - Get permissions grouped by module

#### Seed
- `POST /api/rbac/seed` - Initialize system roles and permissions

---

## Frontend Components & Pages

### 1. Role Management Page (`/admin/roles`)
**Features:**
- Table view showing:
  - Role Name (with System badge if applicable)
  - Users Count (expandable stat)
  - Permissions Count (expandable stat)
  - Status (Active/Inactive)
  - Actions (Edit, Delete)
- Search/Filter by role name and description
- Filter: All, System Roles, Custom Roles
- Create Role button
- Stats footer showing total, system, and custom role counts
- Beautiful table design with hover effects

**UI Components:**
- Search bar with icon
- Filter buttons
- Table with sortable columns
- Badge styling for role type and status
- Action buttons with icons

### 2. Edit Role Page (`/admin/roles/[id]`)
**Features:**
- Role name and description editor
- Module-grouped permission checkboxes with:
  - Module collapse/expand with permission count badge
  - Individual permission checkboxes
  - Permission name and description
  - Select All / Deselect All button
  - Progress indicator (X of Y permissions selected)
- Save Changes button
- Cancel button
- System role warning (cannot edit permissions)
- Real-time validation
- Success/Error messages
- Redirect to roles list after save

**Permission UI:**
```
☑ Dashboard     
  ☑ View  

☑ Users     
  ☑ Create     
  ☑ View     
  ☑ Update     
  ☑ Delete  

☑ Documents     
  ☑ Upload     
  ☑ Preview     
  ☑ Download     
  ☑ Update     
  ☑ Delete     
  ☑ Approve  
```

### 3. User Management Page (`/admin/users`)
**Features:**
- User list with search capability
- Expandable user cards showing:
  - User name and email
  - Current role count badge
  - Assigned roles with remove button (X icon)
  - Available roles to add (card-style buttons with + icon)
- Multiple role assignment support
- Role removal with confirmation
- Real-time feedback messages
- How it works info box

**User Flow:**
1. Click user to expand
2. View assigned roles
3. Click role button to add new role
4. Click X on role to remove
5. Changes reflect immediately

---

## Permission Checking

### Backend Authorization
Use the `requirePermission()` utility in API routes:

```typescript
import { requirePermission, successResponse, errorResponse } from "@/lib/api-utils"

export const GET = async (req: NextRequest) => {
  const { error } = await requirePermission(req, "documents.view")
  if (error) return error // User doesn't have permission

  // Proceed with endpoint logic
  return successResponse(data)
}
```

### Frontend Permission Checks
Check session for permissions (loaded on login):

```typescript
const session = useSession()
const canDelete = session?.user?.permissions?.includes("documents.delete")

if (!canDelete) {
  // Hide or disable delete button
}
```

---

## System Roles & Default Permissions

### 1. Super Admin
**Permissions:** ALL (full system access)
- Can do everything
- System role (cannot be deleted)

### 2. System Admin
**Purpose:** Manage users, roles, and settings
**Permissions:**
- users: create, view, update, delete
- roles: view, create, update, delete
- audit: view

### 3. Document Officer
**Purpose:** Upload and manage documents
**Permissions:**
- documents: create, view, update, upload, preview, download
- approvals: view
- categories: view

### 4. Approver
**Purpose:** Review and approve documents
**Permissions:**
- documents: view, preview, download, approve
- approvals: view, approve

### 5. Viewer
**Purpose:** View and download documents only
**Permissions:**
- documents: view, preview, download

### 6. Auditor
**Purpose:** View reports and audit logs (read-only)
**Permissions:**
- documents: view
- reports: view
- audit: view

---

## Scalability & Extensibility

### Adding New Modules/Permissions
1. Define permissions in the database
2. Assign to roles as needed
3. Check permissions in API routes using `requirePermission()`

### Adding New Roles
1. Use Role Management UI to create role
2. Assign permissions via checkbox interface
3. Assign role to users via User Management UI

### Removing Permissions
1. Edit role via Role Management
2. Uncheck permissions
3. Save changes

---

## How It Works: Permission Flow

### User authenticates:
1. User logs in
2. Backend creates session with user's permissions
3. Session loads all user roles
4. All permissions from all roles are merged

### User requests resource:
1. Frontend includes session with request
2. Backend checks if user has required permission
3. If no permission: return 403 Forbidden
4. If permission exists: proceed with action

### Example - Deleting a document:
```
User (ID: user-123) attempts to DELETE /api/documents/doc-456

Backend checks:
1. Get user's roles (Document Officer, Approver)
2. Get all permissions from these roles
3. Check if any role has "documents.delete"
4. Return 403 if not, proceed if yes
```

---

## Implementation Status

### ✅ Completed
- [x] Database schema (roles, permissions, role_permissions, user_roles)
- [x] RBAC Service with full methods
- [x] API endpoints for roles, permissions, and user-roles
- [x] Role Management page (table view)
- [x] Edit Role page (permission checkboxes)
- [x] User Management page (multi-role assignment)
- [x] Permission checking utilities
- [x] System roles seeding
- [x] Build validation (0 errors)

### 🔄 Next Steps (Optional)
- [ ] Add permission validation to all protected API routes
- [ ] Create role assignment workflows
- [ ] Add bulk role assignment
- [ ] Implement role templates
- [ ] Add audit logging for role changes
- [ ] Create permission report generator

---

## Usage Examples

### Seed System Roles & Permissions
```bash
curl -X POST http://localhost:3000/api/rbac/seed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Create Custom Role
```bash
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager",
    "description": "Department manager with oversight",
    "permissionIds": ["perm-documents-view", "perm-documents-approve"]
  }'
```

### Assign Role to User
```bash
curl -X POST http://localhost:3000/api/rbac/user-roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "roleId": "role-document-officer"
  }'
```

---

## Support & Documentation

For more information:
- See `/admin/roles` for role management
- See `/admin/users` for user role assignment
- See `/admin/permissions` for permission viewer
- Check API routes for endpoint specifics

