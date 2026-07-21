# Debug: API Endpoints 404 Error

## Problem
Getting 404 errors on:
- `GET /api/users/me` 
- `GET /api/rbac/roles`
- `GET /api/rbac/permissions`

## Possible Causes

### 1. **Development Server Not Restarted** (Most Likely)
The Next.js dev server caches routes in memory. After the bug fix to `lib/session.ts`, the server needs to restart.

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Then restart it:
npm run dev
```

### 2. **Build Not Updated** 
Files changed but `.next` build cache is stale.

**Solution:**
```bash
# Clear build cache
rm -r .next/

# Rebuild
npm run build

# Restart server
npm run dev
```

### 3. **Routing Issue** (Less Likely)
The route files might not be exporting handlers correctly.

**Verification:**
```bash
# Check if route.ts files exist
ls app/api/users/me/route.ts
ls app/api/rbac/roles/route.ts
ls app/api/rbac/permissions/route.ts
```

All three files exist and export GET handlers.

### 4. **Permission Denied** (Would be 403, not 404)
If user doesn't have `users.view` permission, would get 403 Forbidden, not 404.

## Quick Fix Steps

### Step 1: Stop Development Server
```bash
# In the terminal running npm run dev
Ctrl + C
```

### Step 2: Clear Build Cache
```bash
rm -r .next/
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Test Endpoint
```bash
curl http://localhost:3000/api/users/me
```

Should return user data or 403 (permission denied), NOT 404.

---

## What Happens After

Once server restarts:

1. ✅ Routes will be properly registered
2. ✅ Session data will load correctly
3. ✅ User permissions will be checked
4. ✅ Admin pages will work

---

## Verification

After restarting, check:

```bash
# Test 1: Current user
curl http://localhost:3000/api/users/me

# Expected: 200 with user data OR 403 if missing permission
# NOT 404

# Test 2: Roles
curl http://localhost:3000/api/rbac/roles

# Expected: 200 with roles OR 403 if missing permission  
# NOT 404

# Test 3: Permissions
curl http://localhost:3000/api/rbac/permissions

# Expected: 200 with permissions OR 403 if missing permission
# NOT 404
```

---

## Why This Happens

Next.js development server:
- ✅ Hot-reloads file changes
- ❌ Doesn't always rebuild route manifests
- ❌ Keeps old route cache in memory

Solution: Full restart clears all caches and reregisters all routes.

---

**TL;DR: Stop your dev server and restart it with `npm run dev`**

