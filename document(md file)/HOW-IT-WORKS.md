# 📚 How Your System Works - Complete Guide

## 🎯 Pick Your Learning Style

Choose one based on how much time you have:

### ⚡ **Super Quick** (5 minutes)
**Want a 1-minute summary?** → Jump to [The Essence](#-the-essence) below

### 🚀 **Quick Start** (10 minutes)
📖 Read: `SYSTEM-QUICK-START.md`
- Simple explanation of each step
- Example user journey
- Key concepts
- Test credentials included

### 🎨 **Visual Learner** (15 minutes)
📖 Read: `VISUAL-SYSTEM-GUIDE.md`
- Complete visual diagrams
- Step-by-step flowcharts
- Permission decision tree
- Database relationships (pictures)

### 📋 **Quick Lookup** (Anytime)
📖 Read: `QUICK-REFERENCE.md`
- Permission checklists
- API endpoints table
- Role comparison
- Common issues & fixes
- Pro tips

### 📖 **Deep Dive** (30 minutes)
📖 Read: `RBAC-WORKFLOW-DOCUMENTATION.md`
- Architecture diagram
- Data flow explanation
- Database schema details
- Code examples
- Performance optimization
- Security features
- Troubleshooting guide

---

## ⚡ The Essence

**Your system does 3 things:**

```
1. AUTHENTICATE
   User signs in with email/password
   ↓
2. LOAD PERMISSIONS
   Get user's role and all permissions from that role
   ↓
3. ENFORCE ACCESS
   Check permission on every action
   ✅ Allow or ❌ Deny
```

**That's it!** Everything else is details.

---

## 🔍 How It Works in One Sentence

> "When a user logs in, we save their session. When they do something, we check if their role's permissions allow it. If yes, we allow it. If no, we deny it."

---

## 🎬 Quick Example: Jane's Story

**Jane is hired as Department Head**

```
1. ADMIN CREATES JANE
   Enters: name, email, role
   System sends invitation email
   
2. JANE ACCEPTS INVITATION
   Clicks link in email
   Sets password
   
3. JANE SIGNS IN
   Email + password
   System creates session cookie
   
4. JANE VISITS DASHBOARD
   Browser sends cookie
   Server validates session
   Loads Jane's permissions (10+ permissions)
   
5. UI RENDERS FOR JANE
   Shows only buttons Jane can use:
   ✅ "Create Document" (has permission)
   ✅ "Approve Request" (has permission)
   ❌ "Delete User" (hidden - no permission)
   
6. JANE CREATES A DOCUMENT
   Clicks "Create Document"
   Server checks: Does Jane have "documents.create"?
   ✅ Yes → Document created
   
7. JANE TRIES TO DELETE A USER
   In browser console: DELETE /api/users/123
   Server checks: Does Jane have "users.delete"?
   ❌ No → Error: "Insufficient permissions"
```

---

## 🏗️ Architecture Overview

```
USER AUTHENTICATION (lib/auth-client.ts)
     ↓
     ├─ Validate credentials
     ├─ Create session token
     ├─ Set httpOnly cookie
     └─ Return user data
          ↓
          SESSION VALIDATION (lib/session.ts)
          ├─ Extract cookie from request
          ├─ Check if session exists
          ├─ Check if not expired
          └─ Get userId
               ↓
               PERMISSION LOADING (lib/session.ts)
               ├─ Query user's role
               ├─ Query role's permissions (25+)
               ├─ Load department info
               └─ Build CurrentUser object
                    ↓
                    PERMISSION CHECKING (lib/api-utils.ts)
                    ├─ API checks: permission in array?
                    ├─ Frontend checks: permission in array?
                    └─ ✅ Allowed or ❌ Denied
```

---

## 📍 Where Everything Lives

| Purpose | File |
|---------|------|
| **Session & Permissions** | `lib/session.ts` |
| **Permission Checking** | `lib/api-utils.ts` |
| **Role Definitions** | `lib/rbac.ts` |
| **User Login** | `app/api/custom-signin/route.ts` |
| **User Management UI** | `app/users/page.tsx` |
| **Admin Users** | `app/admin/users/page.tsx` |

---

## 🔐 Security: 4 Layers

**Layer 1: Authentication**
- Email + password required
- Password hashed with bcrypt
- Email must be verified

**Layer 2: Session**
- Secure cookie (httpOnly)
- Token stored in database
- Expiration checking

**Layer 3: Permissions**
- Checked on every API call
- Role-based (not individual)
- Server-side enforced

**Layer 4: UI**
- Buttons hidden without permission
- Server handles actual access
- Client-side is just feedback

---

## ⚙️ How It Works: The Mechanism

### Step 1: User Logs In
```
User submits email + password
    ↓
POST /api/custom-signin
    ↓
System validates credentials
    ↓
Creates session record
    ↓
Sets cookie + returns token
```

### Step 2: User Visits Page
```
Browser automatically sends cookie
    ↓
validateCustomSession() runs
    ↓
Finds session in database
    ↓
Checks expiration
    ↓
Returns userId
```

### Step 3: Load User Data
```
User authenticated with userId
    ↓
fetchUserDataFromDatabase() runs (1 query!)
    ↓
Joins: user_roles → roles → role_permissions → permissions
    ↓
Gets all permissions for user's role (25+)
    ↓
Builds CurrentUser object with permissions array
```

### Step 4: Display Page
```
React component gets CurrentUser
    ↓
Checks permissions array for each button:
  - "Create Document" → includes("documents.create")? ✅
  - "Delete User" → includes("users.delete")? ❌
    ↓
Shows/hides buttons accordingly
```

### Step 5: User Actions
```
User clicks button
    ↓
API endpoint receives request + permission
    ↓
requirePermission() checks permission
    ↓
If ✅ has permission → Execute
If ❌ no permission → Return 403 Forbidden
```

---

## 🎭 The 6 Roles

| # | Role | What They Can Do |
|---|------|---|
| 1 | **Super Admin** | Everything (all 25+ permissions) |
| 2 | **Executive** | View everything, approve requests |
| 3 | **Compliance Officer** | Manage compliance & risks |
| 4 | **Auditor** | Read-only, see audit trails |
| 5 | **Department Head** | Manage their department |
| 6 | **Staff** | View, create documents |

---

## 🧮 Permission Format

**Pattern**: `module.action`

Examples:
- `users.create` - Create users
- `users.edit` - Edit users
- `users.delete` - Delete users
- `documents.view` - View documents
- `approvals.approve` - Approve requests
- `roles.admin` - Manage roles

---

## 🗂️ Database Design

**5 Main Tables:**

```
users (who they are)
  ↓ (1 role per user)
  ├─ user_roles (junction)
      ↓ (links to role)
      └─ roles (what role is it)
          ↓ (1+ permissions per role)
          ├─ role_permissions (junction)
              ↓ (links to permission)
              └─ permissions (what can they do)
```

**Data Flow:**
1. User logged in → Get userId
2. Find user's role in user_roles
3. Find role's permissions in role_permissions
4. Combine into permissions array
5. Attach to CurrentUser object

---

## ⚡ Performance: 1 Query

**Old Way** (Slow ❌):
- Query 1: Get user's role
- Query 2: Get role's permissions
- Total: 2 database requests

**New Way** (Fast ✅):
- 1 Combined query with JOINs
- Gets: role + all permissions + department + job title
- Total: 1 database request (~50% faster)

---

## 🔑 Key Concepts

### Permission
A specific action allowed by a role
Example: `users.create`

### Role
A set of permissions grouped together
Example: "Department Head" has 10 permissions

### User-Role Assignment
Links a user to a role
Example: Jane is assigned "Department Head" role

### CurrentUser Object
Built when user signs in:
```javascript
{
  id: "user-456",
  name: "Jane Manager",
  email: "jane@bank.com",
  roleName: "Department Head",
  permissions: ["users.view", "documents.create", ...]
}
```

### Permission Check
Verify permission exists in permissions array
```javascript
user.permissions.includes("documents.create") // true or false
```

---

## ✅ How to Verify It's Working

1. **Sign in** with test credentials
   - Email: `tame@gamil.com`
   - Password: `TestPassword123!`

2. **Check current user**
   - Open DevTools → Network tab
   - Visit `/users`
   - Look at fetch to `/api/users/me`
   - See the `permissions` array

3. **Try creating a user**
   - Click "Add User" button
   - Fill in details
   - Click "Create"
   - Should succeed (have permission)

4. **Check permissions array**
   - Open DevTools → Console
   - Paste: `fetch('/api/users/me').then(r=>r.json()).then(d=>console.log(d.data.permissions))`
   - See all your permissions

5. **Verify permission checking**
   - Go to `/admin/users`
   - Check which buttons show
   - Click and check network tab
   - See API responses (200 or 403)

---

## 🚀 Common Workflows

### Create a New User with Role
```
1. Go to /users
2. Click "Add User"
3. Enter: Name, Email, Role
4. Click "Create User"
5. Email sent to user
6. User accepts invitation
7. User sets password
8. User can now sign in with role + permissions
```

### Assign Role to Existing User
```
1. Go to /users
2. Find user
3. Click Edit icon
4. Select new role
5. Click "Update User"
6. User now has new role's permissions
```

### Check User Permissions
```
1. Sign in as that user
2. Open DevTools → Network tab
3. Refresh page
4. Look for /api/users/me request
5. Check "permissions" array in response
```

---

## 🐛 Debug: Permission Denied (403)

**Problem**: Getting "Forbidden" error

**Solution**:
1. Check: Is user signed in? (Has valid session?)
2. Check: Is user's status "active"?
3. Check: Does user's role have this permission?
4. Check: Is API checking correct permission name?

**Quick Fix**:
```bash
# Check permissions via API
curl http://localhost:3000/api/users/me \
  -H "Cookie: authToken=YOUR_TOKEN"

# Look for the specific permission in the array
```

---

## 🎓 Learning Resources

| Time | Resource | What You'll Learn |
|------|----------|---|
| 1 min | This file (top part) | Big picture |
| 5 min | `SYSTEM-QUICK-START.md` | Each step explained |
| 10 min | `VISUAL-SYSTEM-GUIDE.md` | Diagrams & flows |
| 5 min | `QUICK-REFERENCE.md` | Lookup tables |
| 30 min | `RBAC-WORKFLOW-DOCUMENTATION.md` | Full details |
| 30 min | Read source code | How it's actually coded |

---

## 📝 Source Code to Read

**In order of importance:**

1. **lib/session.ts** (50 lines)
   - `validateCustomSession()` - Checks session
   - `fetchUserDataFromDatabase()` - Loads permissions
   - `getCurrentUser()` - Combines both

2. **lib/api-utils.ts** (30 lines)
   - `requirePermission()` - Permission check
   - `errorResponse()` - Error handling

3. **lib/rbac.ts** (50 lines)
   - `ROLES` - All role definitions
   - `hasPermission()` - Permission utility

4. **app/api/custom-signin/route.ts** (50 lines)
   - Session creation
   - Cookie setting

---

## ✨ Key Takeaways

1. **Every user has ONE role**
2. **Every role has MANY permissions** (10-25)
3. **Permissions are checked EVERYWHERE** (API + Frontend)
4. **Permissions loaded ONCE per session** (then cached)
5. **Permission check is FAST** (array lookup)
6. **Security is LAYERED** (auth + session + permissions)
7. **System is SCALABLE** (easy to add roles/permissions)

---

## 🎯 30-Second Explanation (Elevator Pitch)

> "We have 6 roles. Each role has 10-25 permissions. When a user logs in, we load their role's permissions into their session. Then, whenever they try to do something, we check if their permissions allow it. If yes, they can do it. If no, we deny it."

---

## 🔍 Need More Details?

**For X, read:**
- How sessions work → `SYSTEM-QUICK-START.md` Section 2
- How permissions load → `VISUAL-SYSTEM-GUIDE.md` Section 5
- How APIs check permissions → `QUICK-REFERENCE.md` → Permission Check Points
- Database schema → `RBAC-WORKFLOW-DOCUMENTATION.md` → Database Schema
- Complete user journey → `VISUAL-SYSTEM-GUIDE.md` → Complete User Journey

---

## ✅ Next Steps

1. **Read** `SYSTEM-QUICK-START.md` (10 min)
2. **Read** `VISUAL-SYSTEM-GUIDE.md` (15 min)
3. **Test** with provided credentials
4. **Check** permissions in browser DevTools
5. **Read** source code files
6. **Try** creating users and assigning roles
7. **Explore** permission checking in API

---

## 💬 Questions?

- **"How do I add a new permission?"** → `RBAC-WORKFLOW-DOCUMENTATION.md` → Permission Checking Points
- **"How do I create a new role?"** → `lib/rbac.ts` → Add to ROLES object
- **"How do I check current user permissions?"** → `QUICK-REFERENCE.md` → Testing Permissions
- **"How do I fix 'Access Denied'?"** → `QUICK-REFERENCE.md` → Common Issues & Fixes

---

**Everything you need to understand your system is in these 5 documents.** Pick the one that matches your learning style and start there! 🚀
