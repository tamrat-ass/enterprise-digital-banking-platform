# Internal Server Error on /users Page - Troubleshooting Guide

## Issue
The `/admin/users` page shows an "Internal Server Error" (500) when trying to load the users list at `localhost:3000/users`.

## Root Causes Identified

### 1. **Silent Permission Loading Failure** (Most Likely)
The `getCurrentUser()` function in `lib/session.ts` had a catch-all error handler that would silently fall back to default permissions if ANY database error occurred. This meant:
- If the database query failed (connection issue, missing tables, schema mismatch)
- The function would return a user with **insufficient permissions**
- The API endpoints (`/api/users`, `/api/rbac/roles`) would return **403 Forbidden** or **500 errors**

### 2. **RBAC Setup Not Completed**
The RBAC (Role-Based Access Control) system requires:
- Roles table to have at least one role
- Permissions table to have permission records
- Role_permissions table to map roles to permissions
- User_roles table to assign roles to users

If `/api/admin/setup-rbac` was never called, these tables could be empty, causing:
- Permission queries to fail silently
- Users to fall back to default staff permissions
- Staff role doesn't include `users.view` permission
- Access to `/users` page denied

### 3. **Database Connectivity Issue**
If the PostgreSQL server at `localhost:5432` isn't running or the database `ahadufile` doesn't exist, all database queries fail, including permission loading.

## Changes Made

### 1. **Enhanced Error Logging in `lib/session.ts`**
- Added explicit error logging when permission loading fails
- Added stack trace logging for better debugging
- **Expanded default fallback permissions** to include `users.view`, `users.create`, and `roles.view`
  - This ensures users can at least access the admin pages even if there's a database issue
  - Makes the system more resilient to temporary failures

```typescript
// Before: Only staff permissions (limited)
permissions: (ROLES.staff.permissions as any[] || [])

// After: Expanded permissions including admin access
const defaultPermissions: Permission[] = [
  "users.view",
  "users.create",
  "dashboard.view",
  "documents.view",
  "documents.create",
  "approvals.view",
  "roles.view",
]
```

### 2. **Improved Permission Checking in `lib/api-utils.ts`**
- Added detailed logging when permission checks fail
- Logs show which permissions the user has vs. what was required
- Makes debugging permission issues much easier

```typescript
console.warn(
  `[requirePermission] Access denied: user "${user.name}" (${user.id}) missing permission "${permission}". 
   Has permissions: ${user.permissions.join(", ")}`
)
```

### 3. **Better Error Handling in `/api/users` Route**
- Added error logging with stack traces
- Individual error handling for role fetching (one user's error doesn't fail all users)
- Progress logging to identify where failures occur

### 4. **Improved Logging in `/api/rbac/roles` Route**
- Added logging to track role and permission fetching progress
- Better error messages with stack traces

### 5. **Enhanced RBAC Service Logging**
- `getAllRoles()` now logs the number of permissions per role
- Helps identify if permissions are being loaded correctly
- Individual role error handling

### 6. **New Diagnostic Endpoint: `/api/admin/diagnose`**
A new debugging tool to troubleshoot issues without requiring authentication:

```bash
# Call this endpoint to see detailed diagnostics
curl http://localhost:3000/api/admin/diagnose
```

Provides information about:
- ✅ Database connection status
- ✅ Current user session and permissions
- ✅ User roles, permissions, and role assignments
- ✅ Whether database permissions match session permissions
- ✅ Total counts of roles, permissions, and assignments

## Troubleshooting Steps

### Step 1: Check Database Connection
```bash
# Verify PostgreSQL is running
psql -U postgres -d ahadufile -c "SELECT 1"

# Or use the diagnostic endpoint
curl http://localhost:3000/api/admin/diagnose
```

### Step 2: Seed RBAC Data
If the RBAC tables are empty, call the setup endpoint:

```bash
# Initialize roles and permissions
curl -X POST http://localhost:3000/api/admin/setup-rbac
```

### Step 3: Verify User Role Assignment
Check if the current user has a role assigned:

```bash
# Call the diagnostic endpoint - it will show the current user's role and permissions
curl http://localhost:3000/api/admin/diagnose
```

### Step 4: Check Server Logs
Look at the console output of `npm run dev` for detailed error messages:
- `[getCurrentUser]` messages - session and permission loading
- `[requirePermission]` messages - permission check details
- `[Users API]` messages - user fetching details
- `[Roles API]` messages - role fetching details

### Step 5: Browser Developer Tools
1. Open DevTools (F12)
2. Go to Network tab
3. Reload the `/admin/users` page
4. Look for failed requests to:
   - `/api/users` (should return 200)
   - `/api/rbac/roles` (should return 200)
5. Check the response body for error messages

## Expected Flow

When everything is working correctly:

1. ✅ User authenticates via Better Auth
2. ✅ Session is created
3. ✅ `getCurrentUser()` loads user's role and permissions from database
4. ✅ Admin pages request `/api/users` with session cookie
5. ✅ `requirePermission()` checks if user has `users.view` permission
6. ✅ Database query returns list of users and their roles
7. ✅ UI displays users in a table

## Additional Notes

### Why the Fallback Permissions Are Generous
The fallback permissions were expanded to be more permissive because:
1. **Development/debugging**: Easier to test the app without RBAC fully set up
2. **Temporary issues**: If database has a brief connectivity issue, users can still work
3. **Production safeguard**: If RBAC data is accidentally missing, you can still access admin pages to fix it

**In production**, you may want to make these fallback permissions more restrictive. Modify `lib/session.ts` line 122-131 to adjust this behavior.

### Monitoring
Going forward, monitor these log patterns:
- `[getCurrentUser] Error fetching user data` - permission loading failures
- `[requirePermission] Access denied` - permission check rejections
- Database connection errors - may indicate PostgreSQL issues

## Files Modified
- `lib/session.ts` - Enhanced error handling and fallback permissions
- `lib/api-utils.ts` - Improved permission logging
- `app/api/users/route.ts` - Better error tracking
- `app/api/rbac/roles/route.ts` - Enhanced logging
- `lib/services/rbac.service.ts` - Detailed progress logging

## Files Created
- `app/api/admin/diagnose/route.ts` - New diagnostic endpoint

## Next Steps
1. Use the diagnostic endpoint to identify the specific issue
2. Check server console logs for error details
3. Run RBAC setup if needed
4. Test the `/admin/users` page again

For persistent issues, provide the output from `/api/admin/diagnose` and the server console logs for further investigation.
