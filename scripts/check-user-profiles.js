#!/usr/bin/env node

/**
 * Check user profiles and roles
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
    console.log('🚀 Checking User Profiles and Roles\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get all user profiles with role details
    const result = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        p.id as profile_id,
        p.role_id,
        r.name as role_name,
        r.level
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p."userId"
      LEFT JOIN roles r ON p.role_id = r.id
      ORDER BY u.name
    `);

    console.log('👥 User Profiles:\n');
    for (const row of result.rows) {
      console.log(`User: ${row.name} (${row.email})`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Profile: ${row.profile_id || 'Not created'}`);
      console.log(`  Role: ${row.role_name || 'Not assigned'} (${row.role_id || 'null'})`);
      console.log(`  Level: ${row.level || 'N/A'}\n`);
    }

    // Get available roles
    console.log('\n📋 Available Roles:\n');
    const rolesResult = await client.query(
      'SELECT id, name, level FROM roles ORDER BY level DESC'
    );
    rolesResult.rows.forEach(role => {
      console.log(`  ${role.name}: ${role.id} (Level: ${role.level})`);
    });

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
