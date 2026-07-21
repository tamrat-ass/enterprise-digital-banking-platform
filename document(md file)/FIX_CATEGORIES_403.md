# Fix: 403 Error on Categories Endpoint

## Problem
```
Failed to fetch categories: 403
GET /api/categories 403
```

## Root Cause
The roles created by the RBAC seed weren't including `categories.view` and related permissions.

**What happened:**
1. RBAC was initialized
2. Roles were created (Document Officer, Viewer, etc.)
3. But these roles didn't have `categories.view` permission assigned
4. When users tried to access `/api/categories`, they got 403

## Solution

### Option 1: Update RBAC (Recommended for existing installations)

**Go to:**
```
http://localhost:3000/admin/init-rbac
```

**Click:** "Update RBAC" button

This re-runs the seed with the fixed permissions and updates all existing roles.

### Option 2: Re-initialize RBAC (If you're starting fresh)

**Go to:**
```
http://localhost:3000/admin/init-rbac
```

**Click:** "Initialize RBAC" button (if not already initialized)

Then **Click:** "Update RBAC" button to get the latest permissions

---

## What Was Fixed

All system roles now have the following category permissions added:

### Super Admin
- categories.view, categories.create, categories.update, categories.delete (all 4)

### System Admin
- categories.view, categories.create, categories.update, categories.delete (all 4)

### Document Officer
- categories.view, categories.create, categories.update (3)

### Approver
- categories.view (1)

### Viewer
- categories.view (1)

### Auditor
- categories.view (1)

---

## Verification

After clicking "Update RBAC":

1. **Check status shows:** "RBAC system updated successfully"
2. **Go to:** `/api/admin/diagnose-permissions`
3. **Look for:** `"categories.view"` in the permissions list
4. **Now try:** `/api/categories` - should work! ✅

---

## How It Works

```
API Request: GET /api/categories
       ↓
Check Permission: "categories.view"
       ↓
Before Fix: User role didn't have categories.view
           ↓ 403 Forbidden
       ↓
After Fix: User role now has categories.view
          ↓ 200 OK - List of categories returned
```

---

## Next Time This Happens

If you add new permissions or update roles in the future:

1. Update the `seedRolesAndPermissions()` function in `lib/services/rbac.service.ts`
2. Go to `/admin/init-rbac`
3. Click "Update RBAC"
4. Done! ✅

---

## What Changed

### File Modified:
- `lib/services/rbac.service.ts` - Added categories permissions to all system roles

### Files Created:
- `app/api/admin/update-rbac/route.ts` - Endpoint to update RBAC without re-initializing

---

## Build Status

✅ Exit Code 0 - Build succeeds

---

**Summary:** 
- ❌ Before: Roles didn't have categories permissions
- ✅ After: All roles have appropriate categories permissions
- 🔧 Fix: Click "Update RBAC" at `/admin/init-rbac`

**Do this now:**
1. Open: `http://localhost:3000/admin/init-rbac`
2. Click: "Update RBAC" button
3. Try: `/api/categories` again - should work! ✅
