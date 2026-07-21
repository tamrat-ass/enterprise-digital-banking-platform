# Make Tamrat Assefa Weldemeskel a Super Admin

## Quick Steps

### Step 1: Seed System Roles (if not already done)
Make a POST request to initialize roles and permissions:
```bash
curl -X POST http://localhost:3000/api/rbac/seed
```

### Step 2: Make Tamrat Super Admin
Use the email to find the user and assign Super Admin role:

```bash
curl -X POST http://localhost:3000/api/admin/make-super-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "tamrat.assefa@example.com"}'
```

Or if you know the user ID:
```bash
curl -X POST http://localhost:3000/api/admin/make-super-admin \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

### Step 3: Verify
Navigate to `/admin/users` and check that Tamrat now has the Super Admin role.

## Response

Success response:
```json
{
  "success": true,
  "message": "User has been made Super Admin",
  "userId": "...",
  "roleId": "role-super-admin"
}
```

## What Super Admin Can Do

Super Admin has ALL permissions:
- ✅ users.create, users.view, users.update, users.delete
- ✅ documents.create, documents.view, documents.update, documents.delete, documents.upload, documents.preview, documents.download, documents.approve
- ✅ roles.create, roles.view, roles.update, roles.delete
- ✅ approvals.view, approvals.approve
- ✅ reports.view, reports.export
- ✅ categories.create, categories.view, categories.update, categories.delete
- ✅ audit.view

## Notes

- This will **remove any existing roles** and assign **only Super Admin role**
- To assign multiple roles, use `/admin/users` UI or `/api/rbac/user-roles` endpoint
- Make sure the user account exists in the system first
