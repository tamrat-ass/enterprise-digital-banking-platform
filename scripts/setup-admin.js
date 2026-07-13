#!/usr/bin/env node

/**
 * Setup super admin role and assign to Tamrat
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
    console.log('🚀 Setting Up Super Admin\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Delete existing super admin role if any
    console.log('Cleaning up old super admin role...');
    await client.query('DELETE FROM roles WHERE id = $1', ['role-super-admin']);
    
    // Create super admin role
    console.log('Creating Super Admin role...\n');
    await client.query(`
      INSERT INTO roles (id, name, level, permissions)
      VALUES ('role-super-admin', 'Super Administrator', 100, $1::jsonb)
    `, [JSON.stringify(['*'])]);
    console.log('✓ Super Admin role created\n');

    // Get Tamrat's user ID
    const userResult = await client.query(
      'SELECT id, name FROM "user" WHERE email = $1',
      ['ahadu@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ User not found');
      await client.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`👤 User: ${user.name}\n`);

    // Update profile role
    await client.query(
      'UPDATE profiles SET role_id = $1 WHERE "userId" = $2',
      ['role-super-admin', user.id]
    );
    console.log('✓ Role assigned\n');

    // Verify
    console.log('✅ Verification:\n');
    const verifyResult = await client.query(`
      SELECT 
        u.name,
        u.email,
        p.role_id,
        r.name as role_name
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p."userId"
      LEFT JOIN roles r ON p.role_id = r.id
      WHERE u.id = $1
    `, [user.id]);

    const row = verifyResult.rows[0];
    console.log(`User: ${row.name}`);
    console.log(`Email: ${row.email}`);
    console.log(`Role: ${row.role_name}`);
    console.log(`Role ID: ${row.role_id}\n`);
    console.log('✨ Super Admin setup complete!');

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
