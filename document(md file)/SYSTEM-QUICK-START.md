# Enterprise Digital Banking Platform - How It Works (Simplified)

## 🎯 The Big Picture

```
User Signs In → Session Created → Permissions Loaded → Access Controlled
```

Your platform has 3 main parts working together:
1. **Authentication** - User login with email/password
2. **Session Management** - Tracks who's logged in
3. **Permissions** - Controls what each user can do

---

## 1️⃣ User Signs In

**What happens**:
1. User enters email & password on `/sign-in`
2. System validates credentials
3. Creates a session token
4. Sends back cookie (`authToken`)

**Endpoint**: `POST /api/custom-signin`

```javascript
// User sends:
{
  email: "tame@gamil.com",
  password: "TestPassword123!"
}

// System returns:
{
  user: { id, email, name },
  session: { token, expiresAt }
}
// + Cookie set: authToken=xyz123
```

---

## 2️⃣ Session Validation

**What happens when user visits a page**:
1. Browser automatically sends `authToken` cookie
2. Server extracts token from cookie
3. Looks up session in database
4. Checks if session expired
5. Gets the `userId`

**File**: `lib/session.ts` → `validateCustomSession()`

```
Cookie: authToken=abc123xyz
    ↓
Extract from request
    ↓
Query database: SELECT * FROM session WHERE token = 'abc123xyz'
    ↓
Check expiration: Is new Date() > session.expiresAt?
    ↓
Return userId
```

✅ Session valid → Continue  
❌ Session invalid/expired → Redirect to `/sign-in`

---

## 3️⃣ Load User Permissions

**What happens after session is valid**:
1. System has the `userId`
2. Loads user's role from `userRoles` table
3. Loads role's permissions from `rolePermissions` table
4. Builds `CurrentUser` object with all permissions

**File**: `lib/session.ts` → `fetchUserDataFromDatabase(userId)`

**Single Query** (Optimized):
```sql
SELECT 
  roles.name,
  permissions.module,
  permissions.permissionKey
FROM userRoles
  JOIN roles ON roles.id
  JOIN rolePermissions ON roles.id
  JOIN permissions ON permissions.id
WHERE userId = ?
```

**Result**:
```javascript
CurrentUser = {
  id: "user-123",
  name: "Tamrat Assefa",
  email: "tame@gamil.com",
  roleName: "Super Administrator",
  permissions: [
    "users.create",      // Can create users
    "users.edit",        // Can edit users
    "users.delete",      // Can delete users
    "documents.view",    // Can view documents
    "documents.create",  // Can create documents
    // ... 20 more permissions
  ]
}
```

---

## 4️⃣ Permission Check on API

**When user calls an API** (e.g., creating a user):

```javascript
POST /api/users
{
  name: "John Doe",
  email: "john@bank.com"
}
```

**Server does**:
```typescript
// Step 1: Get current user (from session)
const user = await getCurrentUser()

// Step 2: Check permission
const { error } = await requirePermission(req, "users.create")

// Step 3: Permission check logic
if (!user.permissions.includes("users.create")) {
  return 403 Forbidden ❌
}

// Step 4: If has permission
return 200 OK ✅ - Proceed with API
```

---

## 5️⃣ Permission Check on Frontend

**Buttons and UI adjust based on permissions**:

```typescript
// In component:
const currentUser = await getCurrentUser()

// Show "Create User" button only if user can create users
{currentUser?.permissions.includes("users.create") && (
  <button onClick={createUser}>Create User</button>
)}

// Disable "Delete" button if user can't delete
<button 
  disabled={!currentUser?.permissions.includes("users.delete")}
>
  Delete User
</button>
```

**Result**: User can't see/click buttons they don't have permission for

---

## 📊 6 Roles & Their Permissions

| Role | Level | Can Do | Use Case |
|------|-------|--------|----------|
| **Super Admin** | 100 | Everything | System administrator |
| **Executive** | 90 | View everything + Approve | Bank leadership |
| **Compliance Officer** | 70 | View + Edit risk/compliance | Policy management |
| **Auditor** | 60 | Read-only access | Audit verification |
| **Department Head** | 50 | Manage own department | Department oversight |
| **Staff** | 10 | View + Create documents | Day-to-day work |

---

## 🔑 Permission Format

**All permissions follow**: `<module>.<action>`

### Modules
- `users` - User management
- `documents` - Document management
- `approvals` - Approval workflows
- `dashboard` - Dashboard access
- `roles` - Role management
- `compliance` - Compliance items
- `risks` - Risk management
- `analytics` - Analytics and reports

### Actions
- `view` - Read/access
- `create` - Create new
- `edit` - Modify
- `delete` - Remove
- `approve` - Approve requests

### Examples
- `users.create` = Can create new users
- `documents.view` = Can view documents
- `approvals.approve` = Can approve requests
- `compliance.edit` = Can edit compliance items

---

## 👤 Example: User Journey

### Step 1: Admin Creates New User
```
Admin goes to /users → Click "Add User"
Input: Name: "Jane", Email: "jane@bank.com", Role: "Department Head"
System creates user with status "invited"
Email sent to jane@bank.com with invitation link
```

### Step 2: Jane Accepts Invitation
```
Jane clicks email link → Goes to /accept-invitation
Sets password: "Jane123!@#"
Status changes to "active"
```

### Step 3: Jane Signs In
```
Jane goes to /sign-in
Enters: jane@bank.com + Jane123!@#
System creates session and sets authToken cookie
```

### Step 4: Jane Accesses Dashboard
```
Jane's browser sends: Cookie: authToken=xyz123

Server:
1. Validates session ✅
2. Gets userId ✅
3. Loads role: "Department Head" ✅
4. Loads 10 permissions ✅
5. Creates CurrentUser object ✅

Jane sees dashboard with:
- "Create Document" button ✅ (has permission)
- "Delete User" button hidden ❌ (no permission)
```

### Step 5: Jane Creates a Document
```
Jane clicks "Create Document"

Server checks:
1. Session valid? ✅
2. Has "documents.create" permission? ✅
3. Create document ✅

Success: Document created
```

### Step 6: Jane Tries to Delete a User
```
Jane (in browser developer tools) tries:
DELETE /api/users/user-789

Server checks:
1. Session valid? ✅
2. Has "users.delete" permission? ❌

Error: 403 Forbidden - "Insufficient permissions"
```

---

## 🗄️ Database Tables (Simplified)

```
user
├─ id
├─ name
├─ email
├─ status (active/disabled/invited)
└─ passwordHash

user_roles
├─ userId → user
├─ roleId → roles
└─ assignedAt

roles
├─ id
├─ name (e.g., "Department Head")
├─ description
└─ level (priority level)

role_permissions
├─ roleId → roles
├─ permissionId → permissions
└─ createdAt

permissions
├─ id
├─ module (e.g., "users")
├─ permissionKey (e.g., "create")
└─ permissionName ("Create Users")
```

**Relationship**:
```
User → UserRoles → Role → RolePermissions → Permission
  ↓
User gets all permissions from their role
```

---

## ⚡ Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `lib/session.ts` | Validates session & loads permissions |
| `lib/api-utils.ts` | Permission checking function |
| `lib/rbac.ts` | Role & permission definitions |
| `app/api/custom-signin/route.ts` | Login endpoint |
| `app/users/page.tsx` | User management UI |

### Test Credentials
```
Email: tame@gamil.com
Password: TestPassword123!
Role: Super Admin (all permissions)
```

### Common API Endpoints
```
POST   /api/custom-signin              - Login
POST   /api/users                      - Create user
GET    /api/users                      - List users
PUT    /api/users/[id]                 - Update user
DELETE /api/users/[id]                 - Delete user
POST   /api/rbac/user-roles            - Assign role to user
GET    /api/users/me                   - Get current user
```

---

## ✅ How It Keeps You Secure

1. **Authentication**: Only logged-in users can access
2. **Session Tokens**: Secure cookies with expiration
3. **Permission Checking**: Every API validates permissions
4. **Server-Side Enforcement**: Can't bypass from browser
5. **Role-Based**: Easier to manage than individual permissions
6. **Audit Trail**: All actions logged in database

---

## 🔄 Complete Flow (Visual)

```
┌─────────────────┐
│  User Signs In  │
└────────┬────────┘
         ↓
┌──────────────────────────┐
│  Create Session Token    │
│  Set authToken Cookie    │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  User Visits Page        │
│  Browser sends cookie    │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  Validate Session        │
│  Get userId              │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  Load User + Permissions │
│  (Single DB Query)       │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  Build CurrentUser       │
│  with permissions array  │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  Check Permission on     │
│  API or UI               │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│  ✅ Allow or ❌ Deny     │
│  Based on permissions    │
└──────────────────────────┘
```

---

## 📝 Summary

**Your system is built on 3 pillars**:

1. **🔐 Authentication** - User login with secure session
2. **📍 Session Management** - Track who's logged in
3. **🔑 Permission Control** - What each user can do

**Everything works together**:
- User logs in → Session created
- User accesses page → Session validated
- Page loads → Permissions loaded
- User clicks button → Permission checked
- API called → Permission verified
- ✅ Action allowed or ❌ denied

**Result**: Secure, controlled, role-based access system
