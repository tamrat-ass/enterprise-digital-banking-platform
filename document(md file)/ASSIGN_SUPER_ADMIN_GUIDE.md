# How to Assign Super Admin Role to Tamrat Assefa Weldemesekel

The user **Tamrat Assefa Weldemesekel** currently has "No Role Assigned". Here are three methods to assign the **Super Admin** role:

---

## Method 1: Using the Admin API Endpoint (Recommended)

### Prerequisites
- Development server running: `npm run dev`
- Server accessible at `http://localhost:3000`

### Option A: Development Mode (Automatic Authorization)

```bash
curl -X POST http://localhost:3000/api/admin/assign-super-admin \
  -H "Content-Type: application/json"
```

**In development mode, no authorization key is required.**

### Option B: Production Mode (With Authorization Key)

```bash
curl -X POST http://localhost:3000/api/admin/assign-super-admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Setup-Key: your-setup-key"
```

Or in the request body:

```bash
curl -X POST http://localhost:3000/api/admin/assign-super-admin \
  -H "Content-Type: application/json" \
  -d '{"setupKey": "your-setup-key", "userName": "Tamrat Assefa Weldemesekel"}'
```

**Setup Key Options:**
1. Use environment variable: `ADMIN_SETUP_KEY` (set in `.env.local`)
2. Default in development: No key needed
3. For production: Set `ADMIN_SETUP_KEY` in your deployment environment

---

## Method 2: Using the TypeScript Script (Direct Database)

### Prerequisites
- Node.js installed
- DATABASE_URL environment variable set

### Steps

```bash
# Install dependencies if needed
npm install

# Run the script
npx tsx scripts/assign-super-admin.ts "Tamrat Assefa Weldemesekel"
```

### What it does:
- Connects directly to the database
- Finds the user
- Removes existing roles
- Assigns Super Admin role
- Verifies the assignment

### Expected Output:
```
[Assign Super Admin] Starting role assignment for: Tamrat Assefa Weldemesekel
[Assign Super Admin] Found user: { userId: 'xxx', name: 'Tamrat Assefa Weldemesekel', email: 'tamrat@example.com' }
[Assign Super Admin] Found role: { roleId: 'role-super-admin', name: 'Super Admin' }
[Assign Super Admin] Role assigned successfully
✅ Super Admin role successfully assigned!
```

---

## Method 3: Direct SQL Query (Database Client)

### Prerequisites
- PostgreSQL client or database admin tool (pgAdmin, DBeaver, etc.)
- Direct access to the database

### Steps

1. **Open your database client** and connect to your PostgreSQL database

2. **Run the following SQL queries in order:**

```sql
-- Step 1: Find the user ID
SELECT id, name, email FROM users 
WHERE name = 'Tamrat Assefa Weldemesekel';
-- Copy the ID from the result

-- Step 2: Find the Super Admin role ID
SELECT id, name FROM roles 
WHERE name = 'Super Admin';
-- Copy the ID from the result

-- Step 3: Remove existing roles (optional but recommended)
DELETE FROM user_roles 
WHERE user_id = 'USER_ID_FROM_STEP_1';

-- Step 4: Assign Super Admin role
INSERT INTO user_roles (id, user_id, role_id, created_at)
VALUES (gen_random_uuid(), 'USER_ID_FROM_STEP_1', 'ROLE_ID_FROM_STEP_2', NOW());

-- Step 5: Verify the assignment
SELECT ur.id, u.name, r.name as role_name, ur.created_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.name = 'Tamrat Assefa Weldemesekel';
```

3. **Expected result:** The verification query should return one row with:
   - name: "Tamrat Assefa Weldemesekel"
   - role_name: "Super Admin"

---

## Method 4: Using the Web Admin Interface (If Assignment Works)

### Steps

1. Navigate to **Admin > Users**
2. Find "Tamrat Assefa Weldemesekel" in the table
3. Click the **Shield icon** in the Actions column
4. In the expanded section, click **"Super Admin"** in the "Available Roles" section
5. Wait for the success message

⚠️ **Note**: If the UI method isn't working (as reported), use one of the methods above instead.

---

## Troubleshooting

### Issue: "User not found"
- **Solution**: Verify the exact user name matches in the database
- Check: `SELECT * FROM users WHERE name LIKE '%Tamrat%';`

### Issue: "Super Admin role not found"
- **Solution**: Verify the role exists in the database
- Check: `SELECT * FROM roles WHERE name = 'Super Admin';`

### Issue: "Role assignment fails silently"
- **Solution**: Check the application logs
- Look for errors in `/app/api/rbac/user-roles/route.ts`

### Issue: Role not showing in the UI after assignment
- **Solution**: Clear browser cache and reload
- Or open an incognito window to verify

---

## Files Created for This Task

1. **`app/api/admin/assign-super-admin/route.ts`**
   - API endpoint for role assignment
   - Can be called from the frontend or via curl

2. **`scripts/assign-super-admin.ts`**
   - TypeScript script for direct database assignment
   - No server required

3. **`assign-role.sql`**
   - Raw SQL queries for manual assignment
   - Use with any PostgreSQL client

4. **`ASSIGN_SUPER_ADMIN_GUIDE.md`** (this file)
   - Complete documentation

---

## Quick Reference

| Method | Speed | Complexity | Requires Server |
|--------|-------|-----------|-----------------|
| API Endpoint | Fast | Low | Yes |
| TypeScript Script | Fast | Low | No |
| SQL Query | Very Fast | Medium | No |
| Web UI | Slow | Low | Yes |

---

## Verification

After assigning the role, verify it worked:

```sql
SELECT u.name, r.name as role_name 
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.name = 'Tamrat Assefa Weldemesekel';
```

**Expected result:** One row showing:
- name: "Tamrat Assefa Weldemesekel"
- role_name: "Super Admin"

---

## What Happens After Role Assignment

Once the Super Admin role is assigned, the user will have:
- ✅ Full system access
- ✅ All permissions granted
- ✅ Access to admin dashboard
- ✅ Ability to manage users, roles, permissions
- ✅ Ability to manage all platform features

The change takes effect immediately on next login or page refresh.

---

**Date**: July 15, 2026  
**Status**: Ready to use  
**Last Updated**: After implementing pagination fixes

