#!/usr/bin/env node

/**
 * Assign Super Admin role to Tamrat Assefa Weldemesekel
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
    console.log('🚀 Assigning Admin Role\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // First, make sure super admin role exists
    console.log('📝 Ensuring Super Admin role exists...\n');
    
    try {
      await client.query(`
        INSERT INTO roles (id, name, level, permissions)
        VALUES ('role-super-admin', 'Super Administrator', 100, '*'::jsonb)
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✓ Super Admin role ready\n');
    } catch (err) {
      console.log('✓ Super Admin role already exists\n');
    }

    // Get Tamrat's user ID
    const userResult = await client.query(
      'SELECT id, name FROM "user" WHERE name = $1',
      ['Tamrat Assefa Weldemesekel']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ User "Tamrat Assefa Weldemesekel" not found');
      await client.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`👤 Found user: ${user.name}`);
    console.log(`   ID: ${user.id}\n`);

    // Update their profile role to super admin
    const updateResult = await client.query(
      'UPDATE profiles SET role_id = $1 WHERE "userId" = $2 RETURNING id, role_id',
      ['role-super-admin', user.id]
    );

    if (updateResult.rows.length > 0) {
      console.log('✓ Profile updated successfully');
      console.log(`   Role ID: ${updateResult.rows[0].role_id}\n`);
    } else {
      console.error('❌ Failed to update profile');
      await client.end();
      process.exit(1);
    }

    // Verify the update
    console.log('✅ Verification:\n');
    const verifyResult = await client.query(`
      SELECT 
        u.name,
        u.email,
        p.role_id,
        r.name as role_name,
        r.level,
        r.permissions
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p."userId"
      LEFT JOIN roles r ON p.role_id = r.id
      WHERE u.id = $1
    `, [user.id]);

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0];
      console.log(`User: ${row.name} (${row.email})`);
      console.log(`Role: ${row.role_name} (${row.role_id})`);
      console.log(`Level: ${row.level}`);
      console.log(`Permissions: ${row.permissions === '*' ? 'Full Access (*)' : 'Specific permissions'}\n`);
      console.log('✨ Admin role assigned successfully!');
    }

    await client.end();
    console.log('\n✓ Connection closed');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
