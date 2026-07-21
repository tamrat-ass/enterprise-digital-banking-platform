# 🏦 Enterprise Digital Banking Platform - Complete Documentation

Welcome! This document provides links to all comprehensive guides for using the API.

---

## 📚 Documentation Index

### 🚀 Getting Started (Read First!)
1. **[API-COMPLETE-GUIDE.md](./API-COMPLETE-GUIDE.md)** ⭐ START HERE
   - Overview of all available endpoints
   - Quick start instructions
   - Common workflows
   - Troubleshooting

### 🔐 Authentication & Login
2. **[LOGIN-ISSUE-RESOLVED.md](./LOGIN-ISSUE-RESOLVED.md)**
   - How authentication was fixed
   - Architecture of the sign-in system
   - Session management explanation

3. **[POSTMAN-SETUP.md](./POSTMAN-SETUP.md)**
   - How to import Postman collection
   - How to set up environment variables
   - How to use the collection

### 🔑 Role-Based Access Control (RBAC)
4. **[RBAC-GUIDE.md](./RBAC-GUIDE.md)** ⭐ RBAC Operations
   - Detailed RBAC API reference
   - All role operations explained
   - Permission management guide
   - Common use cases

5. **[RBAC-EXAMPLES.md](./RBAC-EXAMPLES.md)** 💡 Copy-Paste Ready
   - Real JSON request/response examples
   - All RBAC operations with examples
   - Real-world scenarios
   - Error handling examples

### 📁 Files Included
- `Postman-Collection-Fixed.json` - Complete API collection
- `Postman-Collection.json` - Original collection (outdated)
- `.env.local` - Environment configuration

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Import Postman Collection
1. Open Postman
2. Click **Import**
3. Select `Postman-Collection-Fixed.json`
4. Click **Import**

### Step 3: Sign In
1. Go to **🔐 Authentication > Sign In**
2. Click **Send**
3. Done! Token is auto-saved

---

## 📋 Test Credentials

```
Email:    ahadu@gmail.com
Password: TestPassword123!
```

---

## 🔄 Common Tasks

### Task 1: Set Up New Role
👉 See: [RBAC-GUIDE.md - Use Case 1](./RBAC-GUIDE.md#use-case-1-create-a-new-department-role)

### Task 2: Assign Role to User
👉 See: [RBAC-GUIDE.md - Use Case 2](./RBAC-GUIDE.md#use-case-2-assign-role-to-new-employee)

### Task 3: View Role Permissions
👉 See: [RBAC-EXAMPLES.md - Scenario 1](./RBAC-EXAMPLES.md#scenario-1-onboard-new-compliance-officer)

### Task 4: Test Authentication
👉 See: [POSTMAN-SETUP.md - Sign In First](./POSTMAN-SETUP.md#3-sign-in-first)

---

## 📊 API Overview

### ✅ Available Endpoints

**Authentication (1)**
- `POST /api/auth/signin` - Sign in with email/password

**User Management (3)**
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users/reset-password` - Reset password

**Roles (5)**
- `GET /api/rbac/roles` - Get all roles
- `GET /api/rbac/roles/:id` - Get specific role
- `POST /api/rbac/roles` - Create role
- `PATCH /api/rbac/roles/:id` - Update role
- `DELETE /api/rbac/roles/:id` - Delete role

**Permissions (2)**
- `GET /api/rbac/permissions` - Get all permissions
- `GET /api/rbac/permissions?groupBy=module` - Get permissions by module

**User-Role Assignment (2)**
- `POST /api/rbac/user-roles` - Assign role to user
- `GET /api/rbac/user-roles/:userId` - Get user's roles

**Documents (1)**
- `GET /api/documents` - Get all documents

**Total: 14 endpoints** ✅

---

## 🏗️ System Architecture

### Authentication Flow
```
User Login (Email + Password)
    ↓
/api/auth/signin endpoint
    ↓
Validate bcrypt hash
    ↓
Create database session
    ↓
Set authToken cookie (httpOnly)
    ↓
Return user data + session
    ↓
Redirect to dashboard
```

### RBAC Structure
```
User → User-Role → Role → Role-Permission → Permission
                          ↓
                     (permissions with module + key)
```

### Permission Format
```
Module: What system (users, documents, compliance, etc)
Key: What action (create, view, update, delete, approve)
Example: users.create = Can create users
```

---

## 🔐 Security Features

✅ **httpOnly Cookies** - Prevents XSS attacks
✅ **bcrypt Hashing** - 12-round password hashing
✅ **Session Expiration** - 7-day token expiry
✅ **SameSite Cookies** - Prevents CSRF
✅ **Permission-Based Access** - Fine-grained control

---

## 🐛 Troubleshooting

### Issue: Can't sign in
**Solution:** See [POSTMAN-SETUP.md - Troubleshooting](./POSTMAN-SETUP.md#troubleshooting)

### Issue: Role creation fails
**Solution:** See [RBAC-GUIDE.md - Error Responses](./RBAC-GUIDE.md#error-responses)

### Issue: Missing authToken
**Solution:** Make sure you ran Sign In request first

### Issue: {{baseUrl}} not defined
**Solution:** Collection has default value (http://localhost:3000)

---

## 📁 Source Code Structure

```
app/api/
├── auth/signin/route.ts         ← Custom sign-in endpoint
├── users/
│   ├── route.ts                 ← User management
│   └── reset-password/route.ts  ← Password reset
└── rbac/
    ├── roles/
    │   ├── route.ts             ← Role CRUD
    │   └── [id]/route.ts        ← Role details
    ├── permissions/route.ts     ← Permissions
    └── user-roles/route.ts      ← Role assignment

lib/
├── session.ts                   ← Session validation
├── auth-client.ts              ← Frontend auth
└── services/
    └── rbac.service.ts         ← RBAC business logic
```

---

## 🎓 Learning Path

**Beginner:**
1. Read: [API-COMPLETE-GUIDE.md](./API-COMPLETE-GUIDE.md)
2. Try: Sign in via Postman
3. Explore: Get all endpoints working

**Intermediate:**
1. Read: [RBAC-GUIDE.md](./RBAC-GUIDE.md)
2. Try: Create a new role
3. Try: Assign role to user

**Advanced:**
1. Read: [RBAC-EXAMPLES.md](./RBAC-EXAMPLES.md)
2. Try: All real-world scenarios
3. Try: Error handling

---

## 🚀 Next Steps

- [ ] Start server (`npm run dev`)
- [ ] Import Postman collection
- [ ] Test sign-in endpoint
- [ ] Create new role
- [ ] Assign role to user
- [ ] Build UI for role management
- [ ] Implement document permissions
- [ ] Set up audit logging

---

## 💾 Database Schema

### Core Tables
- **user** - System users with authentication
- **account** - External account credentials (Better Auth)
- **session** - Active user sessions
- **roles** - Role definitions
- **permissions** - Permission definitions
- **role_permissions** - Role → Permission mapping
- **user_roles** - User → Role mapping

### Additional Tables
- **documents** - Document management
- **departments** - Organization structure
- **profiles** - Extended user info
- **audit_logs** - Action tracking

---

## 📞 Support

For specific issues, check:
1. **Authentication problems?** → See [LOGIN-ISSUE-RESOLVED.md](./LOGIN-ISSUE-RESOLVED.md)
2. **RBAC problems?** → See [RBAC-GUIDE.md](./RBAC-GUIDE.md#error-responses)
3. **Postman issues?** → See [POSTMAN-SETUP.md](./POSTMAN-SETUP.md#troubleshooting)
4. **JSON examples?** → See [RBAC-EXAMPLES.md](./RBAC-EXAMPLES.md)

---

## 📝 Notes

- All endpoints require authentication except health check
- All passwords must meet complexity requirements
- Permissions are evaluated at request time
- Sessions expire after 7 days
- System roles cannot be deleted

---

## ✅ What's Ready

- ✅ Authentication (sign-in working)
- ✅ User management (GET, POST password reset)
- ✅ Role management (full CRUD)
- ✅ Permission system (view & grouping)
- ✅ User-role assignment (assign & view)
- ✅ Session management (cookie-based)
- ✅ RBAC service (all business logic)
- ✅ Postman collection (complete)
- ✅ Documentation (comprehensive)

---

## 📈 Performance

- **Database:** PostgreSQL with indexed queries
- **Sessions:** Cached with React's cache()
- **Authentication:** Single cookie validation
- **Permissions:** Evaluated per request

---

**Everything is ready!** 🎉

**Start with:** [API-COMPLETE-GUIDE.md](./API-COMPLETE-GUIDE.md)
