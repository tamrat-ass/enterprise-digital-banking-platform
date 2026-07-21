# Roles Dropdown Not Loading - Root Cause & Solution

## Root Cause Analysis ✅

The roles dropdown is empty because:

1. **User is not authenticated** - No active session
2. When the admin page loads, it tries to fetch `/api/rbac/roles`
3. The API endpoint checks for authentication via `requirePermission(req, "users.view")`
4. Since there's no authenticated session, it returns **401 Unauthorized**
5. The `roles` state remains empty
6. Dropdown shows only placeholder "-- Select a role --"

## Server Logs Confirm This

```
[getCurrentUser] No session found - user not authenticated
[requirePermission] Access denied: no authenticated user for permission "users.view"
GET /api/rbac/roles 401 in 2.1s
```

## Solution: User Must Sign In First

### Step 1: Sign Up (Create Your Account)

1. Open your browser and go to: `http://localhost:3000`
2. You'll be redirected to `/sign-in`
3. Click "Need an account?" to go to `/sign-up`
4. Fill in the sign-up form:
   - **Full name**: Your name (e.g., "Admin User")
   - **Email**: Your email (e.g., "admin@example.com")
   - **Password**: Create a password (min 8 chars, uppercase, lowercase, number, special char)
   - **Job title**: Optional (e.g., "Administrator")
   - **Role**: Select "Staff Member" (you can change this later)
   - **Department**: Optional

5. Click "Create account"
6. You'll be automatically logged in and redirected to dashboard

### Step 2: Access Admin Panel

1. Once logged in, navigate to the admin panel
2. Go to: `http://localhost:3000/admin/users`
3. Click the "Add User" button
4. **The roles dropdown should now be populated!** ✓

## Why This Works

- The first user to sign up becomes the **Super Administrator** (see `app/actions/profile.ts`)
- Super Admin has permission `users.view` which allows fetching roles
- API endpoint validates authentication and returns roles
- Frontend state populates and dropdown displays roles

## Testing the Fix

### Test 1: Verify You Can See Roles
```
After signing in and navigating to /admin/users:
- Click "Add User" button
- Roles dropdown should show:
  ✓ Approver
  ✓ Compliance Officer
  ✓ Department Head
  ✓ Document Officer
  ✓ Executive
  ✓ Internal Auditor
  ✓ Staff Member
  ✓ Super Administrator
  ✓ System Admin
  ✓ Viewer
```

### Test 2: Create a User with Role
```
1. Enter: Name: "John Doe", Email: "john@example.com"
2. Select a role from dropdown
3. Click "Create User"
4. System will:
   - Send invitation email to john@example.com
   - Show success message
   - User appears in users table with status "Invitation Sent"
```

## What's Already Set Up ✅

- ✅ Database schema (8 new columns for invitation system)
- ✅ RBAC roles and permissions
- ✅ API endpoints (`/api/rbac/roles`, `/api/users`, etc.)
- ✅ Email service (console logging for now)
- ✅ Password hashing (bcryptjs)
- ✅ Better Auth authentication
- ✅ Admin user: ahadu@gmail.com (Super Admin role - but no password set)

## Next Steps After Setup

1. ✅ Sign up (creates first admin account)
2. ✅ See roles dropdown working
3. ✅ Create users via admin panel
4. ✅ Users receive invitation emails
5. ✅ Users click invitation link
6. ✅ Users set password and activate account

## Architecture Diagram

```
Browser (Not Authenticated)
        ↓
  /admin/users page loads
        ↓
  fetchData() called
        ↓
  GET /api/rbac/roles (with credentials: 'include')
        ↓
  [Auth Check]
  ├─ No session in cookies
  ├─ requirePermission() fails
  └─ Returns 401 Unauthorized
        ↓
  roles state = []
        ↓
  Dropdown empty ❌

---

Browser (After Sign-In)
        ↓
  Session cookie established
        ↓
  /admin/users page loads
        ↓
  fetchData() called
        ↓
  GET /api/rbac/roles (with credentials: 'include')
        ↓
  [Auth Check]
  ├─ Session found in cookies
  ├─ User has "users.view" permission
  └─ Returns 200 OK with roles array
        ↓
  roles state = [{ id: 'role-approver', name: 'Approver' }, ...]
        ↓
  Dropdown populated ✓
```

## Files Involved

- `app/admin/users/page.tsx` - Admin UI (fetchData function, roles state)
- `app/api/rbac/roles/route.ts` - GET endpoint (permission check)
- `lib/api-utils.ts` - requirePermission middleware
- `lib/session.ts` - getCurrentUser() and authentication
- `app/actions/profile.ts` - First user becomes Super Admin
- `components/auth-form.tsx` - Sign-up/sign-in form

## Quick Checklist

- [ ] Go to http://localhost:3000
- [ ] Click "Need an account? Sign up"
- [ ] Fill in sign-up form and create account
- [ ] Dashboard loads (you're logged in now!)
- [ ] Go to http://localhost:3000/admin/users
- [ ] Click "Add User" button
- [ ] Verify roles dropdown is populated ✓
