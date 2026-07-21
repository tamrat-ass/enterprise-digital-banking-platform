# How to Apply Dashboard Permissions Fix

**Quick Steps to Get Dashboard Permissions Working**

---

## If RBAC Is Not Yet Initialized

### Step 1: Navigate to RBAC Init Page
```
http://localhost:3000/admin/init-rbac
```

### Step 2: Click Initialize RBAC Button
This will:
- ✅ Create all 30 permissions (including 5 dashboard permissions)
- ✅ Create all 6 system roles
- ✅ Link permissions to roles
- ✅ Dashboard module now visible with 5 permissions

### Step 3: Verify in Admin Dashboard
1. Go to: `http://localhost:3000/admin/dashboard`
2. Click any role to edit
3. Scroll down and look for "Dashboard" module
4. You should see:
   - ☐ View Dashboard
   - ☐ Create Dashboard Items  
   - ☐ Edit Dashboard
   - ☐ Delete Dashboard Items
   - ☐ Administer Dashboard

---

## If RBAC Was Already Initialized

You need to add the new dashboard permissions manually:

### Option A: Refresh Permissions (Easier)

1. Go to: `http://localhost:3000/admin/permissions-maintenance`
2. Click "Refresh All Permissions" button
3. Wait for completion
4. The 4 new dashboard permissions will be added

### Option B: Run Seed Directly (Command Line)

```bash
curl -X POST http://localhost:3000/api/rbac/seed \
  -H "Cookie: authToken=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### Option C: SQL Update (Direct Database)

```sql
-- Add missing dashboard permissions
INSERT INTO permissions (id, module, permission_key, permission_name, description)
VALUES 
  ('perm-dashboard-create', 'dashboard', 'create', 'Create Dashboard Items', 'Permission to create dashboard'),
  ('perm-dashboard-edit', 'dashboard', 'edit', 'Edit Dashboard', 'Permission to edit dashboard'),
  ('perm-dashboard-delete', 'dashboard', 'delete', 'Delete Dashboard Items', 'Permission to delete dashboard'),
  ('perm-dashboard-admin', 'dashboard', 'admin', 'Administer Dashboard', 'Permission to admin dashboard')
ON CONFLICT DO NOTHING;

-- Add to System Admin role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  'rp-role-system-admin-dashboard-admin',
  r.id,
  p.id
FROM roles r, permissions p
WHERE r.name = 'System Admin' 
  AND p.module = 'dashboard' 
  AND p.permission_key = 'admin'
ON CONFLICT DO NOTHING;
```

---

## Verify It Worked

### Check 1: Dashboard Permissions Exist
```bash
curl http://localhost:3000/api/rbac/permissions \
  -H "Cookie: authToken=YOUR_AUTH_TOKEN"

# Should include these in response:
# "dashboard": {
#   "view": { permissionName: "View Dashboard", ... },
#   "create": { permissionName: "Create Dashboard Items", ... },
#   "edit": { permissionName: "Edit Dashboard", ... },
#   "delete": { permissionName: "Delete Dashboard Items", ... },
#   "admin": { permissionName: "Administer Dashboard", ... }
# }
```

### Check 2: Admin UI Shows All Permissions
1. Go to: `/admin/dashboard`
2. Click any role
3. Look for "Dashboard" section
4. Count should be 5 permissions visible
5. Previously was only 1

### Check 3: Assign to Role and Test
1. Edit a role and check `dashboard.view`
2. Save the role
3. Create/edit a user with this role
4. User can now access dashboard
5. Dashboard menu appears in BankingLayout

---

## Troubleshooting

### Problem: Dashboard permissions still don't show

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Sign out and sign back in
3. If still not showing, refresh RBAC from `/admin/permissions-maintenance`

### Problem: Error when clicking "Refresh All Permissions"

**Solution:**
1. Check if RBAC is initialized
2. Try `/admin/init-rbac` instead
3. Check server logs for detailed error
4. May need to manually run SQL insert

### Problem: Dashboard module shows but permissions greyed out

**Solution:**
1. Check if admin user has `users.update` permission
2. Check if role being edited is locked (system role)
3. Try editing a custom role instead
4. Check browser console for JavaScript errors

---

## What Happens After

Once applied, the admin dashboard will show:

```
Role: System Admin

Permissions by Module:
┌─ Users (4 permissions) ─────────
│  ☑ View Users
│  ☑ Create Users
│  ☑ Update Users
│  ☑ Delete Users
└─────────────────────────────────

┌─ Dashboard (5 permissions) ─────  ← NOW VISIBLE!
│  ☑ View Dashboard              ← Previously only this
│  ☐ Create Dashboard Items      ← NEW
│  ☐ Edit Dashboard              ← NEW
│  ☐ Delete Dashboard Items      ← NEW
│  ☑ Administer Dashboard        ← NEW
└─────────────────────────────────

┌─ Documents (8 permissions) ─────
│  [...]
└─────────────────────────────────
```

---

## Summary

✅ Dashboard module now has 5 complete permissions  
✅ Available in admin panel for role assignment  
✅ System Admin automatically gets `dashboard.admin`  
✅ Super Admin gets all dashboard permissions  
✅ Custom roles can now control dashboard access granularly

**Next:** Assign these permissions to roles in `/admin/dashboard` page!
