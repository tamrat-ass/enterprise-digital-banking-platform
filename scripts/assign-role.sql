-- SQL Script to assign Super Admin role to Tamrat Assefa Weldemesekel
-- Run this directly in your PostgreSQL database

BEGIN;

-- Step 1: Find the user
SELECT id, name, email FROM users WHERE name = 'Tamrat Assefa Weldemesekel';

-- Step 2: Find Super Admin role
SELECT id, name FROM roles WHERE name = 'Super Admin';

-- Step 3: Assign the role (update these IDs based on the results above)
-- Replace USER_ID and ROLE_ID with actual values from steps 1 and 2
INSERT INTO user_roles (id, user_id, role_id, created_at)
VALUES (gen_random_uuid(), 'USER_ID', 'ROLE_ID', NOW())
ON CONFLICT DO NOTHING;

-- Step 4: Verify the assignment
SELECT ur.id, u.name, r.name as role_name, ur.created_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.name = 'Tamrat Assefa Weldemesekel';

COMMIT;
