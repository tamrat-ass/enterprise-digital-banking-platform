# Quick Reference Card

## 🚀 Start Here

| What | Where | Time |
|------|-------|------|
| **Quick 5-min overview** | `SYSTEM-QUICK-START.md` | 5 min |
| **Visual diagrams** | `VISUAL-SYSTEM-GUIDE.md` | 10 min |
| **Complete details** | `RBAC-WORKFLOW-DOCUMENTATION.md` | 30 min |

---

## 📍 Test the System Right Now

### 1. Start Dev Server
```bash
npm run dev
# Opens http://localhost:3000
```

### 2. Sign In
```
Email: tame@gamil.com
Password: TestPassword123!
```

### 3. Explore
- `/users` - User management
- `/admin/users` - Admin users view
- `/dashboard` - Main dashboard
- `/roles` - Role management

---

## 🔑 Permission Check Points

### API Level
```typescript
// File: Any route handler in /api
const { error } = await requirePermission(req, "users.create")
if (error) return error  // ← Returns 403 if no permission
```

### Frontend Level
```typescript
// File: Any React component
const user = await getCurrentUser()
{user?.permissions.includes("users.delete") && (
  <button>Delete</button>
)}
```

### Page Level
```typescript
// File: Any page.tsx
const user = await requireUser()  // ← Redirects if not logged in
if (!user.permissions.includes("admin")) {
  return <AccessDenied />
}
```

---

## 🎭 6 Roles at a Glance

| Role | Level | Key Permissions |
|------|-------|---|
| Super Admin | 100 | Everything (`*`) |
| Executive | 90 | View all + Approve |
| Compliance Officer | 70 | Compliance + Risks + Approve |
| Auditor | 60 | Read-only all + Audit |
| Department Head | 50 | Department management + Approve |
| Staff | 10 | View + Create documents |

---

## 🛠️ Key Files & What They Do

| File | Purpose | Key Function |
|------|---------|---|
| `lib/session.ts` | Authentication & permissions | `getCurrentUser()` |
| `lib/api-utils.ts` | Permission checking | `requirePermission()` |
| `lib/rbac.ts` | Role & permission definitions | `ROLES`, `hasPermission()` |
| `app/api/custom-signin/route.ts` | User login | Validates credentials |
| `app/users/page.tsx` | User management UI | Create, edit, delete users |
| `app/admin/users/page.tsx` | Admin user view | View all users |

---

## 🔄 Permission Format

**Pattern**: `<module>.<action>`

### Common Permissions
```
users.create        // Can create users
users.edit          // Can edit users
users.delete        // Can delete users
documents.view      // Can view documents
documents.create    // Can create documents
approvals.approve   // Can approve requests
roles.admin         // Full role management
```

---

## 🔌 Important API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/custom-signin` | User login |
| `GET` | `/api/users` | Get all users |
| `POST` | `/api/users` | Create user |
| `PUT` | `/api/users/[id]` | Update user |
| `DELETE` | `/api/users/[id]` | Delete user |
| `GET` | `/api/users/me` | Get current user |
| `POST` | `/api/rbac/user-roles` | Assign role to user |
| `DELETE` | `/api/rbac/user-roles/[userId]/[roleId]` | Remove role |
| `GET` | `/api/rbac/roles` | Get all roles |

---

## 🗄️ Database Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|---|
| `user` | Users | id, email, passwordHash, status |
| `user_roles` | User ↔ Role mapping | userId, roleId |
| `roles` | Role definitions | id, name, level |
| `role_permissions` | Role ↔ Permission mapping | roleId, permissionId |
| `permissions` | Permission definitions | module, permissionKey |
| `session` | Active sessions | userId, token, expiresAt |

---

## 🔒 Security Layers

```
Layer 1: Authentication
├─ Valid credentials required
├─ Password hashed with bcrypt
└─ Email verified before access

Layer 2: Session
├─ Session token in database
├─ Token in httpOnly cookie
├─ Expiration checking
└─ One session per user

Layer 3: Permissions
├─ Check on every API call
├─ Role-based permission inheritance
└─ Enforced server-side

Layer 4: UI
├─ Hide buttons without permission
├─ Disable actions without permission
└─ Client-side feedback only
```

---

## ⚡ Quick Flow

```
1. User signs in
   ↓
2. Session created + cookie set
   ↓
3. User visits page
   ↓
4. Cookie sent to server
   ↓
5. Session validated
   ↓
6. User + permissions loaded (1 query)
   ↓
7. UI renders with permission checks
   ↓
8. User clicks button
   ↓
9. API checks permission
   ↓
10. ✅ Allowed or ❌ Denied
```

---

## 🧪 Testing Permissions

### Via Browser Console
```javascript
// Get current user
fetch('/api/users/me')
  .then(r => r.json())
  .then(d => console.log(d.data.permissions))

// Check specific permission
const hasPermission = d.data.permissions
  .includes('users.create')
console.log(hasPermission) // true or false
```

### Via API Endpoint
```bash
# Get current user
curl http://localhost:3000/api/users/me \
  -H "Cookie: authToken=YOUR_TOKEN"

# Try creating user (check if 200 or 403)
curl -X POST http://localhost:3000/api/users \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@bank.com"}'
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | No valid session | Sign in again |
| `403 Forbidden` | Missing permission | Admin assigns role |
| `Session expired` | Token expired | Sign in again |
| Button doesn't show | Missing permission | Check role permissions |
| API returns `undefined` | Params not awaited | Use `await Promise.resolve(params)` |
| Slow permission load | Multiple queries | Verify single query used |

---

## 📋 User Status States

| Status | Meaning | Can Sign In? |
|--------|---------|---|
| `active` | User complete setup | ✅ Yes |
| `disabled` | Account locked | ❌ No |
| `invited` | Pending invitation | ❌ No |

---

## 💡 Pro Tips

1. **Always use `requirePermission()`** on every API endpoint
2. **Check permissions in UI** to provide good UX
3. **One role per user** currently (can be extended to multiple)
4. **Permission loading is cached** via `cache()` function
5. **Super Admin has `*`** permission (all permissions)
6. **Session expires in 10 years** (dev setting, change for production)

---

## 🚨 Before Going to Production

- [ ] Change session expiration from 10 years to 7-14 days
- [ ] Add HTTPS/TLS for cookie security
- [ ] Set cookie `secure` flag (HTTPS only)
- [ ] Add CSRF protection
- [ ] Enable rate limiting on login
- [ ] Add audit logging for sensitive operations
- [ ] Review and adjust role permissions
- [ ] Add two-factor authentication
- [ ] Implement password expiration policy
- [ ] Add session invalidation on logout

---

## 📞 Where to Find Things

### User Management
- Create user: `/users` → "Add User" button
- Edit user: `/users` → Edit icon
- Delete user: `/users` → Trash icon
- Admin view: `/admin/users`

### Roles & Permissions
- View roles: `/roles`
- Manage roles: `/admin/roles`
- Set permissions: `/admin/permissions`

### Authentication
- Sign in: `/sign-in`
- Reset password: `/set-new-password`
- Accept invitation: `/accept-invitation`

---

## 🎓 Learning Path

**Start here** (in order):

1. **5 min**: Read `SYSTEM-QUICK-START.md` → Understand basic flow
2. **10 min**: Read `VISUAL-SYSTEM-GUIDE.md` → See diagrams
3. **10 min**: Test the system with test credentials
4. **15 min**: Read relevant parts of `RBAC-WORKFLOW-DOCUMENTATION.md`
5. **30 min**: Read source code files:
   - `lib/session.ts` (permission loading)
   - `lib/api-utils.ts` (permission checking)
   - `lib/rbac.ts` (definitions)

---

## 📊 System Statistics

| Metric | Value |
|--------|-------|
| **Pre-defined Roles** | 6 |
| **Total Modules** | 15 |
| **Available Actions** | 10+ per module |
| **Max Permissions per Role** | 25+ |
| **Database Tables** | 6 core |
| **API Endpoints** | 50+ |
| **Query Optimization** | Single query for permissions |

---

## ✅ Checklist: System Working?

- [ ] Can sign in with test credentials
- [ ] See user in `/users` page
- [ ] Can create new user
- [ ] Can edit existing user
- [ ] Can see different UI based on role
- [ ] Can't access API without permission
- [ ] Session persists on page reload
- [ ] Can see user permissions in network tab
- [ ] Dashboard loads with correct role
- [ ] Permission checking works on all pages

---

## 🎯 Next Steps

1. **Understand the flow** using the guides above
2. **Read the code** to see implementations
3. **Test creating users** and assigning roles
4. **Check permission array** in browser dev tools
5. **Try permission checks** in frontend/API
6. **Modify roles** to add new permissions
7. **Add new roles** following the pattern
8. **Extend to production** with security hardening

---

**Questions?** Check the relevant guide or read the source code comments!
