# 🚀 Enterprise Digital Banking Platform - Complete API Guide

## ✅ What's Ready

### Authentication ✅
- **Sign In**: `/api/auth/signin` - Custom working endpoint
- **Session Management**: Automatic cookie-based sessions
- **Token Validation**: Cookie parsing and validation

### User Management ✅
- **Get All Users**: `/api/users`
- **Get User by ID**: `/api/users/:id`
- **Reset Password**: `/api/users/reset-password`

### Role Management ✅
- **Get All Roles**: `/api/rbac/roles`
- **Get Role by ID**: `/api/rbac/roles/:id`
- **Create Role**: `POST /api/rbac/roles`
- **Update Role**: `PATCH /api/rbac/roles/:id`
- **Delete Role**: `DELETE /api/rbac/roles/:id`

### Permission Management ✅
- **Get All Permissions**: `/api/rbac/permissions`
- **Get Permissions by Module**: `/api/rbac/permissions?groupBy=module`

### User-Role Assignment ✅
- **Assign Role to User**: `POST /api/rbac/user-roles`
- **Get User Roles**: `/api/rbac/user-roles/:userId`

### Documents ✅
- **Get All Documents**: `/api/documents`

---

## 📦 Available Files

### Configuration Files
- `Postman-Collection-Fixed.json` - Complete Postman collection with all endpoints
- `.env.local` - Environment configuration

### Documentation
- `POSTMAN-SETUP.md` - Postman setup instructions
- `RBAC-GUIDE.md` - Detailed RBAC operations guide
- `LOGIN-ISSUE-RESOLVED.md` - Authentication solution documentation
- `API-COMPLETE-GUIDE.md` - This file

### Source Code
- `app/api/auth/signin/route.ts` - Custom authentication endpoint
- `lib/session.ts` - Session validation logic
- `app/api/rbac/**` - All RBAC endpoints
- `lib/services/rbac.service.ts` - RBAC business logic

---

## 🎯 Getting Started

### Step 1: Start the Server
```bash
npm run dev
```
Server runs at: http://localhost:3000

### Step 2: Import Postman Collection
1. Open Postman
2. Click **Import**
3. Select `Postman-Collection-Fixed.json`
4. Click **Import**

### Step 3: Sign In
1. Go to **🔐 Authentication > Sign In**
2. Click **Send**
3. You'll see `authToken` and `userId` saved automatically

### Step 4: Explore Endpoints
- Click any endpoint in the collection
- Click **Send**
- View the response

---

## 📋 Test Credentials

```
Email:    ahadu@gmail.com
Password: TestPassword123!
```

---

## 🔄 Common Workflows

### Workflow 1: Set Up New Role with Permissions
```
1. GET /api/rbac/permissions
   ↓ (Note permission IDs you want)
2. POST /api/rbac/roles
   ↓ (Create role with selected permissionIds)
3. Copy role ID from response
```

### Workflow 2: Assign Role to User
```
1. GET /api/rbac/roles
   ↓ (Find role ID)
2. POST /api/rbac/user-roles
   ↓ (Send userId and roleId)
3. User now has all role permissions
```

### Workflow 3: Verify User Permissions
```
1. POST /api/auth/signin
   ↓ (Sign in as user)
2. GET /api/rbac/user-roles/{{userId}}
   ↓ (See all roles assigned)
3. GET /api/rbac/roles/{{roleId}}
   ↓ (See all permissions in role)
```

---

## 🔐 Authentication Details

### How It Works
1. User submits email + password to `/api/auth/signin`
2. Endpoint validates credentials against bcrypt hash
3. Creates session in database
4. Sets `authToken` cookie (httpOnly, 7-day expiry)
5. Returns user data + session info

### Cookie Format
```
Name:     authToken
Value:    [32-byte hex token]
HttpOnly: true
SameSite: lax
Path:     /
MaxAge:   604800 (7 days)
```

### Using Token in Requests
All authenticated endpoints accept:
```
Header: Cookie: authToken={{authToken}}
```
Postman automatically sends this!

---

## 🔑 RBAC Architecture

### Entities
- **User** - System users
- **Role** - Grouping of permissions
- **Permission** - Specific action on a module
- **UserRole** - Junction table linking users to roles
- **RolePermission** - Junction table linking roles to permissions

### Permission Format
```
{
  "module": "users",           // What system (users, documents, etc)
  "permissionKey": "create",   // What action (create, view, update, delete)
  "permissionName": "Create Users"  // Display name
}
```

### Full Permission Example
```
users.create    = Can create new users
users.view      = Can see user information
users.update    = Can modify user information
users.delete    = Can remove users
documents.view  = Can read documents
documents.approve = Can approve documents
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

---

## 🧪 Testing Examples

### Test 1: Create and Assign Role
```bash
# 1. Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"ahadu@gmail.com","password":"TestPassword123!"}'

# Extract authToken from response

# 2. Get all permissions
curl -X GET http://localhost:3000/api/rbac/permissions \
  -H "Cookie: authToken=[token]"

# 3. Create role
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Cookie: authToken=[token]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Role","description":"Test","permissionIds":["perm-001"]}'

# 4. Assign role to user
curl -X POST http://localhost:3000/api/rbac/user-roles \
  -H "Cookie: authToken=[token]" \
  -H "Content-Type: application/json" \
  -d '{"userId":"[userId]","roleId":"[roleId]"}'
```

---

## 🐛 Troubleshooting

### Issue: `authToken` is empty
**Solution:** Make sure you've run the Sign In request successfully

### Issue: 401 Unauthorized on protected endpoints
**Solution:** Sign in first, then use the token in subsequent requests

### Issue: 403 Forbidden on role creation
**Solution:** Your user needs "users.create" permission. Sign in with a user that has admin role

### Issue: Postman says {{baseUrl}} not found
**Solution:** The collection includes baseUrl by default (http://localhost:3000), or create an environment with it

### Issue: Role creation works but permissions not assigned
**Solution:** Make sure permissionIds are valid. Use GET /api/rbac/permissions to get IDs

---

## 🔗 Related Files

- **Authentication**: `app/api/auth/signin/route.ts`
- **Session Management**: `lib/session.ts`
- **User Management**: `app/api/users/route.ts`
- **Roles**: `app/api/rbac/roles/route.ts`
- **Permissions**: `app/api/rbac/permissions/route.ts`
- **User-Roles**: `app/api/rbac/user-roles/route.ts`
- **RBAC Service**: `lib/services/rbac.service.ts`
- **Database Schema**: `lib/db/schema.ts`

---

## 📚 Next Steps

1. ✅ Sign in and verify authentication
2. ✅ Create new roles with permissions
3. ✅ Assign roles to users
4. ✅ Test protected endpoints
5. 🔄 Build UI for role management
6. 🔄 Implement document permissions
7. 🔄 Add audit logging for RBAC changes

---

## 💡 Best Practices

✅ **Do:**
- Use Postman collection for API testing
- Review RBAC-GUIDE.md for detailed operation steps
- Test authentication before other endpoints
- Use meaningful role names
- Assign minimal permissions needed

❌ **Don't:**
- Share authentication tokens
- Create roles for single users
- Give everyone Admin role
- Delete system roles
- Change permission IDs

---

## 🆘 Need Help?

1. Check `RBAC-GUIDE.md` for RBAC operations
2. Check `POSTMAN-SETUP.md` for Postman help
3. Check `LOGIN-ISSUE-RESOLVED.md` for auth issues
4. Review endpoint implementations in `app/api/`

---

**Everything is ready!** 🎉 Start exploring the API with Postman.
