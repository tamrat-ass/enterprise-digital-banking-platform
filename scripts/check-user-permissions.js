#!/usr/bin/env node

/**
 * Check and setup user permissions
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
    console.log('🚀 Checking User Permissions\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get all users
    const usersResult = await client.query('SELECT id, name, email FROM "user" ORDER BY "createdAt" DESC');
    console.log(`📊 Total users: ${usersResult.rows.length}\n`);
    
    for (const user of usersResult.rows) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      
      // Get profile
      const profileResult = await client.query(
        'SELECT role_id, job_title, department_id FROM profiles WHERE "userId" = $1',
        [user.id]
      );
      
      if (profileResult.rows.length === 0) {
        console.log('   Profile: Not set up');
      } else {
        const profile = profileResult.rows[0];
        console.log(`   Role ID: ${profile.role_id || 'Not assigned (default: staff)'}`);
        console.log(`   Job Title: ${profile.job_title || 'N/A'}`);
        console.log(`   Department ID: ${profile.department_id || 'Not assigned'}`);
        
        // Get role details
        if (profile.role_id) {
          const roleResult = await client.query(
            'SELECT name, permissions FROM roles WHERE id = $1',
            [profile.role_id]
          );
          if (roleResult.rows.length > 0) {
            const role = roleResult.rows[0];
            console.log(`   Role Name: ${role.name}`);
            console.log(`   Permissions: ${typeof role.permissions === 'string' ? role.permissions : JSON.stringify(role.permissions)}`);
          }
        } else {
          console.log('   Default Permissions: staff role (limited access)');
        }
      }
    }

    // Check available roles
    console.log('\n\n📋 Available Roles:');
    const rolesResult = await client.query('SELECT id, name, level FROM roles ORDER BY level DESC');
    rolesResult.rows.forEach((role, idx) => {
      console.log(`   [${idx + 1}] ${role.name} (ID: ${role.id}, Level: ${role.level})`);
    });

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
