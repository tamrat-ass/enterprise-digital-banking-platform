# RBAC - Quick Reference Guide

## The 3-Table Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   USERS     │         │   ROLES     │         │ PERMISSIONS  │
│             │         │             │         │              │
│ id          │◄────────│ id          │◄────────│ id           │
│ name        │  via    │ name        │  via    │ module       │
│ email       │ user    │ description │ role    │ action       │
│ status      │ roles   │ isSystem    │ perms   │ name         │
└─────────────┘         └─────────────┘         └──────────────┘
```

## Data Flow Summary

```
USER SIGNS IN
    ↓
SESSION CREATED (authToken cookie)
    ↓
USER MAKES REQUEST
    ↓
SESSION VALIDATED (extract userId from token)
    ↓
PERMISSIONS LOADED (single optimized query)
    ↓
PERMISSION CHECKED (API endpoint or UI)
    ↓
✅ ALLOWED or ❌ FORBIDDEN
```

## Permission Format

```
module . action

users.create          ← Can CREATE users
documents.view        ← Can VIEW documents
approvals.approve     ← Can APPROVE requests
compliance.edit       ← Can EDIT compliance items
```

## Pre-defined Roles

| Role | Level | Key Permissions | Use Case |
|------|-------|-----------------|----------|
| Super Admin | 100 | ALL | Full access |
| Executive | 90 | Dashboard, view, approve | Leadership |
| Compliance Officer | 70 | Compliance, risk, approve | Governance |
| Auditor | 60 | View-only + audit | Verification |
| Dept Head | 50 | Create, edit, approve in dept | Management |
| Staff | 10 | View, create basic items | Contributors |

## API Endpoints

### User Management
```
POST   /api/users                    Create user
GET    /api/users                    List users
PUT    /api/users/{id}              Update user
DELETE /api/users/{id}              Delete user
```

### Role Management
```
GET    /api/rbac/roles              List roles
POST   /api/rbac/roles              Create role
PUT    /api/rbac/roles/{id}         Update role
DELETE /api/rbac/roles/{id}         Delete role
```

### User-Role Assignment
```
POST   /api/rbac/user-roles         Assign role to user
DELETE /api/rbac/user-roles/{userId}/{roleId}  Remove role
```

### Permission Management
```
GET    /api/rbac/permissions        List permissions
POST   /api/rbac/permissions        Create permission
```

## Code Examples

### Check Permission in API

```typescript
// In API route handler
const { error } = await requirePermission(req, "users.create")
if (error) return error  // ❌ Forbidden

// Continue with logic
return successResponse({ ... })  // ✅ Success
```

### Check Permission in Component

```typescript
// In React component
const currentUser = await getCurrentUser()

if (!currentUser?.permissions.includes("users.create")) {
  return <div>Access Denied</div>
}

// Show UI
return <CreateUserButton />
```

### Show/Hide UI Based on Permission

```typescript
<button 
  disabled={!currentUser?.permissions.includes("users.delete")}
>
  Delete User
</button>

{currentUser?.permissions.includes("documents.approve") && (
  <ApprovalPanel />
)}
```

## How Permissions Work

### Assignment Flow

```
Admin creates user
    ↓
Admin assigns role to user
    ↓
User's permissions = Role's permissions
    ↓
User signs in
    ↓
CurrentUser.permissions loaded from database
    ↓
Permissions checked on API and UI
```

### Permission Checking

```
When API is called:
1. Get user from session token
2. Load permissions from database
3. Check if permission exists in user.permissions array
4. If YES → Allow ✅
5. If NO → Return 403 Forbidden ❌
```

## Database Queries

### Get User's Permissions (Optimized Single Query)

```sql
SELECT permissions.module, permissions.permissionKey
FROM user_roles
JOIN roles ON user_roles.roleId = roles.id
JOIN role_permissions ON roles.id = role_permissions.roleId
JOIN permissions ON role_permissions.permissionId = permissions.id
WHERE user_roles.userId = 'user-123'
```

### Assign Role to User

```sql
INSERT INTO user_roles (id, userId, roleId, assignedBy, assignedAt)
VALUES (
  'userRole-' || random(),
  'user-123',
  'role-dept-head',
  'admin-001',
  NOW()
)
```

### Get All Roles

```sql
SELECT * FROM roles WHERE isActive = true
```

## CurrentUser Object

```typescript
{
  id: "user-123",
  name: "John Admin",
  email: "john@bank.com",
  roleName: "Super Administrator",
  roleId: "role-super-admin",
  departmentName: "Executive",
  permissions: [
    "users.create",
    "users.edit",
    "users.delete",
    "documents.view",
    "documents.create",
    "documents.approve",
    // ... more permissions
  ]
}
```

## Key Functions

### Session Validation
```typescript
// lib/session.ts
validateCustomSession(): Promise<string | null>
// Returns userId if session is valid
```

### Get Current User
```typescript
// lib/session.ts
getCurrentUser(): Promise<CurrentUser | null>
// Returns user with permissions loaded
```

### Fetch Permissions
```typescript
// lib/session.ts
fetchUserDataFromDatabase(userId): Promise<CurrentUser | null>
// Fetches role + permissions for user
```

### Check Permission
```typescript
// lib/rbac.ts
hasPermission(permissions, "users.create"): boolean
// Returns true if permission exists
```

### Require Permission
```typescript
// lib/api-utils.ts
requirePermission(req, "users.create")
// Returns error if permission missing
```

## Workflow Example: Create User

```
1. Admin goes to /users page
   └─ CurrentUser loaded with permissions

2. Admin can see "Create User" button?
   └─ Check: permissions.includes("users.create")
   └─ YES → Show button ✅
   └─ NO → Hide button ❌

3. Admin clicks "Create User"
   └─ Fills form
   └─ Selects role
   └─ Clicks submit

4. POST /api/users is called
   └─ Check: requirePermission(req, "users.create")
   └─ Has permission? → Continue ✅
   └─ No permission? → Return 403 ❌

5. If allowed, create user
   └─ INSERT into user table
   └─ INSERT into user_roles table (link role)
   └─ Send invitation email

6. New user receives invitation
   └─ Clicks link
   └─ Sets password
   └─ Status: active

7. New user signs in
   └─ Session created
   └─ Permissions loaded (from their role)
   └─ Dashboard shows with role-based UI
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| User sees 403 error | No permission | Check role has permission in database |
| Permission not working | API not checking | Add `requirePermission()` to API |
| Button not showing | Wrong permission check | Verify permission name matches |
| Slow permission loading | Multiple queries | Ensure single optimized query in use |
| User locked out | Status not "active" | Change user.status to "active" |

## Testing Checklist

- [ ] Create user and assign role
- [ ] Sign in and verify permissions loaded
- [ ] Try API without permission (should fail 403)
- [ ] Try API with permission (should succeed)
- [ ] Check UI hides buttons for missing permissions
- [ ] Change role and verify permissions update
- [ ] Remove role and verify user has no permissions
- [ ] Sign out and verify session invalidated

## Security Notes

✅ Permissions checked SERVER-SIDE (not client-side only)
✅ Every API endpoint validates permissions
✅ User status must be "active" to sign in
✅ Email must be verified to use account
✅ Session token stored securely in httpOnly cookie
✅ Tokens have expiration (configurable)

## Performance Tips

✅ Use single optimized query for permissions (done)
✅ Permissions array instead of individual lookups
✅ Cache CurrentUser object (react cache used)
✅ Index foreign keys in database
✅ Denormalize if needed for high-load scenarios

---

**Key Takeaway**: 
Role → Permissions → User → Access Control

Assign a role to a user, and they automatically get all permissions for that role. Simple, scalable, secure!
