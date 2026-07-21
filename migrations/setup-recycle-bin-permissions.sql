-- Setup Recycle Bin Permissions
-- This script inserts recycle bin permissions and assigns them to roles

BEGIN;

-- Insert recycle bin permissions if they don't exist
INSERT INTO permissions (id, module, permission_key, permission_name, description)
VALUES 
  ('perm-recycleBin-view', 'recycleBin', 'view', 'View Recycle Bin', 'Permission to view recycle bin and deleted files'),
  ('perm-file-delete', 'file', 'delete', 'Delete Files', 'Permission to delete files (soft delete)'),
  ('perm-file-restore', 'file', 'restore', 'Restore Files', 'Permission to restore files from recycle bin'),
  ('perm-file-permanentDelete', 'file', 'permanentDelete', 'Permanently Delete Files', 'Permission to permanently delete files')
ON CONFLICT (id) DO NOTHING;

-- Add recycle bin permissions to System Admin role
-- First, find the System Admin role
WITH system_admin AS (
  SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1
),
perms AS (
  SELECT id FROM permissions 
  WHERE module IN ('recycleBin', 'file')
)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  'rp-' || s.id || '-' || p.id,
  s.id,
  p.id
FROM system_admin s, perms p
WHERE s.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Add recycle bin permissions to Document Officer role
WITH doc_officer AS (
  SELECT id FROM roles WHERE name = 'Document Officer' LIMIT 1
),
perms AS (
  SELECT id FROM permissions 
  WHERE (module = 'recycleBin' AND permission_key = 'view')
     OR (module = 'file' AND permission_key IN ('delete', 'restore'))
)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  'rp-' || d.id || '-' || p.id,
  d.id,
  p.id
FROM doc_officer d, perms p
WHERE d.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;
