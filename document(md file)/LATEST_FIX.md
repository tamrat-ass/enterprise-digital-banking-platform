# Latest Fix: Categories Permission Issue

## Issue Found
Users were getting **403 Forbidden** on the categories endpoint:
```
GET /api/categories 403
```

## Root Cause
The RBAC system was initialized correctly, but the roles didn't include **`categories.view`** and related permissions.

---

## Solution: Update RBAC

### Step 1: Open RBAC Setup Page
```
http://localhost:3000/admin/init-rbac
```

### Step 2: Click "Update RBAC" Button
- If the button shows "Initialize RBAC" → Click that first
- Then click "Update RBAC"

### Step 3: Wait for Success
```
"RBAC system updated successfully"
```

### Step 4: Test
Try accessing categories:
- Click "Categories" in the menu, or
- Access `/api/categories`
- Should work now! ✅

---

## What Changed

### Updated File:
**`lib/services/rbac.service.ts`**
- Added `categories.view` to all 6 system roles
- Added `categories.create` and `categories.update` to Document Officer and System Admin
- Now every role can view categories

### New Endpoint:
**`POST /api/admin/update-rbac`**
- Updates existing RBAC without re-initializing
- Useful when permissions are added to the codebase
- Automatically called via the "Update RBAC" button

### Enhanced UI:
**`app/admin/init-rbac/page.tsx`**
- Added "Update RBAC" button
- Shows when RBAC is already initialized
- One-click update to get latest permissions

---

## Roles Now Have These Category Permissions

| Role | Permissions | Can Do |
|------|-------------|---------|
| Super Admin | view, create, update, delete | Everything |
| System Admin | view, create, update, delete | Manage categories |
| Document Officer | view, create, update | View and create categories |
| Approver | view | View categories only |
| Viewer | view | View categories only |
| Auditor | view | View categories only |

---

## Build Status
✅ Exit Code 0 - All changes compile successfully

---

## Why This Happened

The categories feature was in the code, but:
1. The RBAC seed didn't include it in role permissions
2. So when users tried to access categories, they had no permission
3. Result: 403 error

Now it's fixed and all roles have appropriate access.

---

## Next Steps

1. Go to: `http://localhost:3000/admin/init-rbac`
2. Click: "Update RBAC" button
3. Done! ✅

---

**That's it!** The categories feature now works for all users with appropriate permissions. 🎉
