-- Add Dashboard Permissions to Database
-- This script adds the missing dashboard permissions if they don't already exist

-- Step 1: Insert dashboard permissions
INSERT INTO permissions (id, module, permission_key, permission_name, description)
VALUES
  ('perm-dashboard-view', 'dashboard', 'view', 'View Dashboard', 'Permission to view dashboard'),
  ('perm-dashboard-create', 'dashboard', 'create', 'Create Dashboard Items', 'Permission to create dashboard items'),
  ('perm-dashboard-edit', 'dashboard', 'edit', 'Edit Dashboard', 'Permission to edit dashboard'),
  ('perm-dashboard-delete', 'dashboard', 'delete', 'Delete Dashboard Items', 'Permission to delete dashboard items'),
  ('perm-dashboard-admin', 'dashboard', 'admin', 'Administer Dashboard', 'Permission to administer dashboard')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Verify permissions were added
SELECT COUNT(*) as dashboard_permissions_count FROM permissions WHERE module = 'dashboard';

-- Step 3: Get all roles
SELECT id, name FROM roles;

-- Step 4: Add dashboard.view to all roles (copy this for each role and replace ROLE_ID)
-- Example: INSERT INTO role_permissions (id, role_id, permission_id) VALUES ('rp-{ROLE_ID}-dashboard-view', '{ROLE_ID}', 'perm-dashboard-view') ON CONFLICT DO NOTHING;

-- Step 5: Optional - Add dashboard.admin to System Admin
-- UPDATE role_permissions SET permission_id = 'perm-dashboard-admin' WHERE role_id = 'role-system-admin' AND permission_id = 'perm-dashboard-view';
-- INSERT INTO role_permissions (id, role_id, permission_id) VALUES ('rp-role-system-admin-dashboard-admin', 'role-system-admin', 'perm-dashboard-admin') ON CONFLICT DO NOTHING;
