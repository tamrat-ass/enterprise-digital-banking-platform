#!/usr/bin/env node

/**
 * Fix user permissions to include documents:admin
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('🔧 Fixing User Permissions\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Update super admin role permissions
    console.log('Updating Super Admin role permissions...\n');
    
    const superAdminPermissions = [
      'dashboard:view', 'dashboard:create', 'dashboard:edit', 'dashboard:admin',
      'documents:view', 'documents:create', 'documents:edit', 'documents:delete', 'documents:admin',
      'workflows:view', 'workflows:create', 'workflows:edit', 'workflows:admin',
      'approvals:view', 'approvals:create', 'approvals:approve', 'approvals:admin',
      'projects:view', 'projects:create', 'projects:edit', 'projects:delete', 'projects:admin',
      'vendors:view', 'vendors:create', 'vendors:edit', 'vendors:delete', 'vendors:admin',
      'contracts:view', 'contracts:create', 'contracts:edit', 'contracts:delete', 'contracts:admin',
      'risk:view', 'risk:create', 'risk:edit', 'risk:delete', 'risk:admin',
      'compliance:view', 'compliance:create', 'compliance:edit', 'compliance:delete', 'compliance:admin',
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:admin',
      'audit:view', 'audit:admin',
      'analytics:view', 'analytics:admin',
    ];

    await client.query(
      'UPDATE roles SET permissions = $1::jsonb WHERE id = $2',
      [JSON.stringify(superAdminPermissions), 'role-super-admin']
    );
    console.log('✓ Updated Super Admin permissions\n');

    // Verify user role
    console.log('Verifying user permissions...\n');
    const userResult = await client.query(`
      SELECT 
        u.name,
        u.email,
        p.role_id,
        r.name as role_name,
        r.permissions
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p."userId"
      LEFT JOIN roles r ON p.role_id = r.id
      WHERE u.email = 'ahadu@gmail.com'
    `);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`User: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role_name}`);
      
      const perms = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions;
      
      if (typeof perms === 'object' && Array.isArray(perms)) {
        console.log(`Permissions: ${perms.length} permissions`);
        console.log(`  - documents:view: ${perms.includes('documents:view') ? '✓' : '✗'}`);
        console.log(`  - documents:admin: ${perms.includes('documents:admin') ? '✓' : '✗'}`);
        console.log(`  - documents:create: ${perms.includes('documents:create') ? '✓' : '✗'}`);
      } else {
        console.log(`Permissions: ${perms}`);
      }
    }

    await client.end();
    console.log('\n✓ Connection closed');
    console.log('\n✨ Permissions fixed! Refresh your browser to see changes.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
