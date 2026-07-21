# System Visual Guide - See How It Works

## 🎬 Complete User Journey (Visual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  JANE'S COMPLETE JOURNEY                                                 │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣  ADMIN CREATES JANE
    ┌─────────────┐
    │  Click      │
    │  "Add User" │
    └──────┬──────┘
           ↓
    ┌──────────────────────────┐
    │  Enter:                  │
    │  Name: Jane Manager      │
    │  Email: jane@bank.com    │
    │  Role: Department Head   │
    └──────┬───────────────────┘
           ↓
    ┌──────────────────────────┐
    │  System Creates:         │
    │  ✅ User record          │
    │  ✅ UserRole link        │
    │  ✅ Email sent           │
    └──────┬───────────────────┘
           ↓
    📧 Jane receives email with invitation link


2️⃣  JANE ACCEPTS INVITATION
    ┌─────────────┐
    │  Jane opens │
    │  email link │
    └──────┬──────┘
           ↓
    ┌──────────────────────────┐
    │  /accept-invitation      │
    │  Jane sets password      │
    │  Enters: Jane123!@#      │
    └──────┬───────────────────┘
           ↓
    ┌──────────────────────────┐
    │  System:                 │
    │  ✅ Hash password        │
    │  ✅ Store in database    │
    │  ✅ Mark "active"        │
    │  ✅ Verify email         │
    └──────┬───────────────────┘
           ↓
    Jane is ready to sign in!


3️⃣  JANE SIGNS IN
    ┌──────────────────────────┐
    │  /sign-in form:          │
    │  jane@bank.com           │
    │  Jane123!@#              │
    └──────┬───────────────────┘
           ↓
    ┌──────────────────────────┐
    │  POST /api/custom-signin │
    │                          │
    │  1. Validate email       │
    │  2. Check password hash  │
    │  3. Create session token │
    │  4. Store in database    │
    │  5. Send back token      │
    │  6. Set cookie           │
    └──────┬───────────────────┘
           ↓
    ┌──────────────────────────┐
    │  Browser:                │
    │  Cookie: authToken=xyz   │
    │                          │
    │  Jane is logged in!      │
    └──────┬───────────────────┘
           ↓
    ✅ Redirect to /dashboard


4️⃣  JANE VISITS DASHBOARD
    ┌──────────────┐
    │  Browser GET │
    │  /dashboard  │
    └──────┬───────┘
           ↓
    ┌─────────────────────────────────────────┐
    │  Server receives request                 │
    │  + Automatically sends: authToken cookie │
    └──────┬────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────┐
    │  lib/session.ts: validateCustomSession  │
    │                                         │
    │  1. Extract cookie                      │
    │     authToken = "xyz123..."             │
    │  2. Query database:                     │
    │     SELECT * FROM session               │
    │     WHERE token = "xyz123..."           │
    │  3. Check expiration                    │
    │     Is expired? No ✅                   │
    │  4. Return userId                       │
    │     userId = "user-456"                 │
    └──────┬────────────────────────────────────┘
           ↓
    ✅ Session valid! Continue...


5️⃣  LOAD PERMISSIONS (SINGLE QUERY)
    ┌──────────────────────────────────────┐
    │  fetchUserDataFromDatabase(userId)   │
    │                                      │
    │  SELECT:                             │
    │  - User's role                       │
    │  - Role's permissions (all 10+)      │
    │  - Department name                   │
    │  - Job title                         │
    │                                      │
    │  FROM:                               │
    │  - user_roles                        │
    │  - roles                             │
    │  - role_permissions                  │
    │  - permissions                       │
    │  - profiles                          │
    │  - departments                       │
    │                                      │
    │  WHERE userId = "user-456"           │
    │                                      │
    │  Result: ONE query ⚡                │
    └──────┬───────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │  CurrentUser Object Built:           │
    │  {                                   │
    │    id: "user-456",                   │
    │    name: "Jane Manager",             │
    │    email: "jane@bank.com",           │
    │    roleName: "Department Head",      │
    │    permissions: [                    │
    │      "dashboard.view",      ✅       │
    │      "documents.view",      ✅       │
    │      "documents.create",    ✅       │
    │      "documents.edit",      ✅       │
    │      "approvals.view",      ✅       │
    │      "approvals.approve",   ✅       │
    │      "projects.view",       ✅       │
    │      "projects.create",     ✅       │
    │      "projects.edit",       ✅       │
    │      "users.create",        ❌       │
    │      "users.delete",        ❌       │
    │    ]                                 │
    │  }                                   │
    └──────┬───────────────────────────────┘
           ↓
    ✅ User object ready with permissions!


6️⃣  UI RENDERS BASED ON PERMISSIONS
    ┌──────────────────────────────────────────────────┐
    │  Dashboard Page Checks Permissions:              │
    │                                                  │
    │  {currentUser?.permissions.includes(            │
    │    "documents.create"                           │
    │  ) && (                                          │
    │    <button>Create Document</button>   ✅ SHOW   │
    │  )}                                              │
    │                                                  │
    │  {currentUser?.permissions.includes(            │
    │    "users.delete"                               │
    │  ) && (                                          │
    │    <button>Delete User</button>       ❌ HIDE   │
    │  )}                                              │
    │                                                  │
    │  <button                                         │
    │    disabled={                                    │
    │      !currentUser?.permissions.includes(        │
    │        "projects.create"                        │
    │      )                                           │
    │    }                                             │
    │  >Create Project</button>             ✅ SHOWN  │
    │                                       (Disabled) │
    └──────┬───────────────────────────────────────────┘
           ↓
    Dashboard displays with correct buttons visible/hidden


7️⃣  JANE TRIES TO CREATE A DOCUMENT
    ┌────────────────────────────────┐
    │  Jane clicks                   │
    │  "Create Document"             │
    └──────┬─────────────────────────┘
           ↓
    ┌────────────────────────────────────────────┐
    │  Browser sends:                            │
    │  POST /api/documents                       │
    │  {                                         │
    │    title: "Q3 Report",                     │
    │    category: "Financial"                   │
    │  }                                         │
    │  + Cookie: authToken=xyz123                │
    └──────┬───────────────────────────────────────┘
           ↓
    ┌────────────────────────────────────────────┐
    │  Server API Handler:                       │
    │                                            │
    │  1. Get current user                       │
    │     const user = getCurrentUser()          │
    │     → Jane's permissions loaded            │
    │                                            │
    │  2. Check permission                       │
    │     const { error } = requirePermission(   │
    │       req,                                 │
    │       "documents.create"                   │
    │     )                                      │
    │                                            │
    │  3. Verify permission exists               │
    │     user.permissions.includes(             │
    │       "documents.create"                   │
    │     ) → true ✅                            │
    │                                            │
    │  4. Permission granted!                    │
    │     Continue with document creation        │
    │                                            │
    │  5. Create document in database            │
    │     INSERT INTO documents (...)            │
    │     ✅ Success!                            │
    └──────┬───────────────────────────────────────┘
           ↓
    Response: 200 OK - Document created! ✅


8️⃣  JANE TRIES TO DELETE A USER (NOT ALLOWED)
    ┌────────────────────────────────┐
    │  Jane tries in browser console │
    │  DELETE /api/users/user-789    │
    └──────┬─────────────────────────┘
           ↓
    ┌────────────────────────────────────────────┐
    │  Server API Handler:                       │
    │                                            │
    │  1. Get current user                       │
    │     const user = getCurrentUser()          │
    │     → Jane's permissions loaded            │
    │                                            │
    │  2. Check permission                       │
    │     const { error } = requirePermission(   │
    │       req,                                 │
    │       "users.delete"                       │
    │     )                                      │
    │                                            │
    │  3. Verify permission exists               │
    │     user.permissions.includes(             │
    │       "users.delete"                       │
    │     ) → false ❌                           │
    │                                            │
    │  4. Permission DENIED!                     │
    │     Return error immediately               │
    │                                            │
    │  5. Don't execute delete operation         │
    │     No database changes                    │
    └──────┬───────────────────────────────────────┘
           ↓
    Response: 403 Forbidden ❌
    Error: "Insufficient permissions"

```

---

## 🔄 Permission Check Flow (Decision Tree)

```
                    API CALLED
                        │
                        ↓
        ┌───────────────────────────────┐
        │  Extract authToken from       │
        │  request cookies              │
        └───────────────┬───────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │  Query session table          │
        │  SELECT * FROM session        │
        │  WHERE token = ?              │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
    ❌ NOT FOUND                    ✅ FOUND
        │                                │
        ↓                                ↓
    Return 401              ┌─────────────────────┐
    Unauthorized            │ Check expiration    │
                            │ Is now > expiresAt? │
                            └────────┬────────────┘
                                     │
                        ┌────────────┴──────────────┐
                        │                           │
                    ❌ EXPIRED              ✅ VALID
                        │                           │
                        ↓                           ↓
                    Return 401          ┌──────────────────────┐
                    Session             │ Get userId from      │
                    Expired             │ session.userId       │
                                        └────────┬─────────────┘
                                                 │
                                                 ↓
                                    ┌────────────────────────┐
                                    │ Load user permissions  │
                                    │ via single query       │
                                    └────────┬───────────────┘
                                             │
                                             ↓
                                    ┌────────────────────────┐
                                    │ Build CurrentUser      │
                                    │ with permissions array │
                                    └────────┬───────────────┘
                                             │
                                             ↓
                                    ┌────────────────────────┐
                                    │ Check: Does            │
                                    │ permissions include    │
                                    │ required permission?   │
                                    └────────┬───────────────┘
                                             │
                        ┌────────────────────┴──────────────────┐
                        │                                       │
                    ❌ NO                                    ✅ YES
                        │                                       │
                        ↓                                       ↓
                    Return 403              ┌──────────────────────────┐
                    Forbidden               │ ALLOW                    │
                    Insufficient            │ Execute API operation    │
                    Permissions             │ Proceed with business    │
                                            │ logic                    │
                                            │ Return 200 OK ✅         │
                                            └──────────────────────────┘
```

---

## 🗂️ Database Relationships (Visual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA MODEL                                      │
└─────────────────────────────────────────────────────────────────────┘


┌──────────────┐
│    USER      │
├──────────────┤
│ id (PK)      │──┐
│ name         │  │
│ email        │  │
│ status       │  │
│ passwordHash │  │
└──────────────┘  │
                  │
                  │ (1 to many)
                  │
                  ↓
        ┌──────────────────┐
        │   USER_ROLES     │
        ├──────────────────┤
        │ id (PK)          │
        │ userId (FK)      │──┐
        │ roleId (FK)      │  │
        │ assignedAt       │  │
        └──────────────────┘  │
                              │
                              │ (many to many)
                              │
                              ↓
                    ┌─────────────────┐
                    │      ROLES      │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ name            │
                    │ description     │
                    │ level           │
                    └────────┬────────┘
                             │
                             │ (1 to many)
                             │
                             ↓
                    ┌─────────────────────────┐
                    │  ROLE_PERMISSIONS       │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ roleId (FK)             │
                    │ permissionId (FK)       │
                    └────────┬────────────────┘
                             │
                             │ (many to many)
                             │
                             ↓
                    ┌─────────────────────────┐
                    │    PERMISSIONS          │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ module (e.g., "users")  │
                    │ permissionKey           │
                    │ (e.g., "create")        │
                    └─────────────────────────┘


EXAMPLE DATA:

User: Tamrat (user-123)
  → UserRoles: role-super-admin
    → Role: Super Administrator
      → RolePermissions: [perm-1, perm-2, ... perm-25]
        → Permissions:
           - module: "users", key: "create" → users.create
           - module: "users", key: "edit" → users.edit
           - module: "documents", key: "view" → documents.view
           - ... 22 more
```

---

## 📊 Role Hierarchy (Permission Levels)

```
┌──────────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                                │
│              (Higher level = More permissions)                   │
└──────────────────────────────────────────────────────────────────┘


Level 100  ████████████████████████████████████████  Super Admin
           ✅ Everything
           ✅ All 25+ permissions
           ✅ All modules


Level 90   ████████████████████████████████░░░░░░░░  Executive
           ✅ View all modules
           ✅ Approve requests
           ❌ Create/edit documents
           ❌ Manage users


Level 70   ████████████████████░░░░░░░░░░░░░░░░░░░░  Compliance Officer
           ✅ View + manage compliance
           ✅ View + manage risks
           ✅ Approve requests
           ✅ Create/edit documents
           ❌ Manage users


Level 60   ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Auditor
           ✅ Read-only access
           ✅ View everything
           ✅ Full audit trail
           ❌ Create/edit anything
           ❌ Approve


Level 50   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Department Head
           ✅ Manage own department
           ✅ Create/edit documents
           ✅ Approve in department
           ❌ Manage other departments
           ❌ Manage users


Level 10   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Staff
           ✅ View dashboard
           ✅ View documents
           ✅ Create documents
           ❌ Approve
           ❌ Edit others' documents
           ❌ Delete

```

---

## 🔐 Security Checkpoints

```
REQUEST FROM BROWSER
        │
        ↓
┌─────────────────────────────────┐
│ CHECKPOINT 1: Valid Session?    │
│ Check: authToken exists?        │
│ Check: Session not expired?     │
└──────┬──────────────────────────┘
       │
       ├─❌ → Return 401 Unauthorized
       │
       ✅
       │
       ↓
┌─────────────────────────────────────┐
│ CHECKPOINT 2: User Active?         │
│ Check: user.status = "active"?    │
│ Check: email verified?            │
└──────┬──────────────────────────────┘
       │
       ├─❌ → Return 401 Unauthorized
       │
       ✅
       │
       ↓
┌─────────────────────────────────────┐
│ CHECKPOINT 3: Has Permission?      │
│ Check: permission in user array?  │
│ Check: Role includes permission?  │
└──────┬──────────────────────────────┘
       │
       ├─❌ → Return 403 Forbidden
       │
       ✅
       │
       ↓
┌─────────────────────────────────────┐
│ ✅ ALL CHECKS PASSED              │
│ Execute API operation              │
│ Return 200 OK                      │
└─────────────────────────────────────┘
```

---

## ⚡ Performance: Single Query (Optimized)

```
BEFORE (2 SEPARATE QUERIES):

Query 1: Get User Role
┌─────────────────────────────────────────────────────┐
│ SELECT u.*, r.*, p.jobTitle, d.name                │
│ FROM user_roles u                                   │
│ JOIN roles r ON u.roleId = r.id                    │
│ JOIN profiles p ON u.userId = p.userId             │
│ JOIN departments d ON p.departmentId = d.id        │
│ WHERE u.userId = ?                                  │
└─────────────────────────────────────────────────────┘
        Result: 1 row (user's role + department)


Query 2: Get Role Permissions
┌─────────────────────────────────────────────────────┐
│ SELECT rp.*, perm.*                                 │
│ FROM role_permissions rp                            │
│ JOIN permissions perm ON rp.permissionId = perm.id │
│ WHERE rp.roleId = ?                                 │
└─────────────────────────────────────────────────────┘
        Result: 25+ rows (all permissions for role)

Total: 2 database round trips ❌


AFTER (1 SINGLE QUERY):

Query: Get Everything in One Go
┌────────────────────────────────────────────────────────────┐
│ SELECT ur.roleId, r.name,                                 │
│        rp.permissionId, perm.module, perm.permissionKey,  │
│        prof.jobTitle, dept.name                           │
│ FROM user_roles ur                                        │
│ INNER JOIN roles r ON ur.roleId = r.id                  │
│ LEFT JOIN role_permissions rp ON r.id = rp.roleId        │
│ LEFT JOIN permissions perm ON rp.permissionId = perm.id  │
│ LEFT JOIN profiles prof ON ur.userId = prof.userId       │
│ LEFT JOIN departments dept ON prof.departmentId = dept.id│
│ WHERE ur.userId = ?                                       │
└────────────────────────────────────────────────────────────┘
        Result: 25+ rows (all data combined)
        
Processing:
1. Get first row → role name
2. Loop all rows → collect permission modules+keys
3. Deduplicate permissions via Set()
4. Build CurrentUser object

Total: 1 database round trip ✅

RESULT: ~50% faster permission loading ⚡
```

---

## 🎯 Summary: How Security Works

```
┌────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION (Who are you?)                           │
│    └─ User provides email + password                       │
│       └─ System validates → Creates session token         │
│          └─ Returns secure cookie                         │
├────────────────────────────────────────────────────────────┤
│ 2. SESSION MANAGEMENT (Are you still you?)                 │
│    └─ User makes request + sends cookie                   │
│       └─ System validates token + checks expiration       │
│          └─ Gets userId                                   │
├────────────────────────────────────────────────────────────┤
│ 3. PERMISSION LOADING (What can you do?)                   │
│    └─ System loads user's role                            │
│       └─ Loads role's permissions (25+)                   │
│          └─ Builds CurrentUser with permission array      │
├────────────────────────────────────────────────────────────┤
│ 4. PERMISSION CHECKING (Can you do this?)                  │
│    └─ API checks: permission in array?                    │
│       └─ Frontend checks: permission in array?            │
│          └─ ✅ Allowed or ❌ Denied                        │
└────────────────────────────────────────────────────────────┘
```

