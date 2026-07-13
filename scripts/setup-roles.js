#!/usr/bin/env node

/**
 * Setup roles and permissions in the database
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Define roles with permissions based on RBAC
const ROLES = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    level: 100,
    permissions: '*',
  },
  {
    id: 'role-executive',
    name: 'Executive',
    level: 90,
    permissions: [
      'dashboard:view',
      'documents:view',
      'workflows:view',
      'approvals:view',
      'approvals:approve',
      'projects:view',
      'vendors:view',
      'contracts:view',
      'risk:view',
      'compliance:view',
      'analytics:view',
      'audit:view',
    ],
  },
  {
    id: 'role-compliance-officer',
    name: 'Compliance Officer',
    level: 70,
    permissions: [
      'dashboard:view',
      'documents:view',
      'documents:create',
      'documents:edit',
      'approvals:view',
      'approvals:approve',
      'risk:view',
      'risk:create',
      'risk:edit',
      'compliance:view',
      'compliance:create',
      'compliance:edit',
      'vendors:view',
      'contracts:view',
      'analytics:view',
      'audit:view',
    ],
  },
  {
    id: 'role-auditor',
    name: 'Internal Auditor',
    level: 60,
    permissions: [
      'dashboard:view',
      'documents:view',
      'workflows:view',
      'approvals:view',
      'projects:view',
      'vendors:view',
      'contracts:view',
      'risk:view',
      'compliance:view',
      'audit:view',
      'analytics:view',
    ],
  },
  {
    id: 'role-department-head',
    name: 'Department Head',
    level: 50,
    permissions: [
      'dashboard:view',
      'documents:view',
      'documents:create',
      'documents:edit',
      'approvals:view',
      'approvals:approve',
      'projects:view',
      'projects:create',
      'projects:edit',
      'vendors:view',
      'contracts:view',
      'risk:view',
    ],
  },
  {
    id: 'role-staff',
    name: 'Staff Member',
    level: 10,
    permissions: [
      'dashboard:view',
      'documents:view',
      'documents:create',
      'approvals:view',
      'projects:view',
    ],
  },
];

async function main() {
  try {
    console.log('🚀 Setting Up Roles and Permissions\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check existing roles
    const existingResult = await client.query('SELECT COUNT(*) FROM roles');
    const existingCount = parseInt(existingResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} role(s) already exist in database`);
      console.log('Skipping role creation.\n');
    } else {
      console.log('📝 Creating roles...\n');
      
      for (const role of ROLES) {
        try {
          const permissionsJson = typeof role.permissions === 'string' 
            ? role.permissions 
            : JSON.stringify(role.permissions);
          
          await client.query(
            'INSERT INTO roles (id, name, level, permissions) VALUES ($1, $2, $3, $4)',
            [role.id, role.name, role.level, permissionsJson]
          );
          console.log(`✓ Created role: ${role.name}`);
        } catch (err) {
          console.error(`✗ Error creating ${role.name}: ${err.message}`);
        }
      }
    }

    console.log('\n📋 Available Roles:');
    const rolesResult = await client.query('SELECT id, name, level FROM roles ORDER BY level DESC');
    rolesResult.rows.forEach((role, idx) => {
      console.log(`   [${idx + 1}] ${role.name} (Level: ${role.level})`);
    });

    // Check and update user profiles if needed
    console.log('\n👥 Checking user profiles...\n');
    const usersResult = await client.query('SELECT id, name FROM "user"');
    
    for (const user of usersResult.rows) {
      const profileResult = await client.query(
        'SELECT "userId", role_id FROM profiles WHERE "userId" = $1',
        [user.id]
      );
      
      if (profileResult.rows.length === 0) {
        // Create profile with admin role for the first user
        const roleId = user.name.includes('Admin') ? 'role-super-admin' : 'role-executive';
        try {
          const profileId = 'profile-' + user.id.substring(0, 8);
          await client.query(
            'INSERT INTO profiles (id, "userId", role_id) VALUES ($1, $2, $3)',
            [profileId, user.id, roleId]
          );
          console.log(`✓ Created profile for ${user.name} with role: ${roleId}`);
        } catch (err) {
          console.error(`✗ Error creating profile for ${user.name}: ${err.message}`);
        }
      } else {
        const profile = profileResult.rows[0];
        console.log(`✓ ${user.name} has profile with role: ${profile.role_id}`);
      }
    }

    await client.end();
    console.log('\n✓ Connection closed');
    console.log('\n✨ Setup complete!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
