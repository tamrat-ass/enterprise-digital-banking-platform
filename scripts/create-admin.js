#!/usr/bin/env node

/**
 * Create Admin User with Proper Password Hashing
 * Run this with: node create-admin.js
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  user: 'postgres',
  password: '4840',
  host: 'localhost',
  port: 5432,
  database: 'ahadufile',
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    console.log('🔐 Creating admin user with proper authentication...\n');

    const email = 'admin@bank.com';
    const password = 'Admin@123456';
    const name = 'Admin User';
    
    // Generate IDs
    const userId = 'user-' + crypto.randomBytes(8).toString('hex');
    const accountId = 'account-' + crypto.randomBytes(8).toString('hex');

    // Create user
    const userResult = await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = $2
       RETURNING id`,
      [userId, name, email]
    );

    const finalUserId = userResult.rows[0].id;
    console.log('✅ User created:', finalUserId);

    // Create account with credentials (password stored)
    await client.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [accountId, email, 'credential', finalUserId, password]
    );

    console.log('✅ Account created with password\n');

    // Create profile
    const profileResult = await client.query(
      `INSERT INTO profiles (id, "userId", full_name, email, job_title, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['profile-' + crypto.randomBytes(8).toString('hex'), finalUserId, name, email, 'Administrator', 'active']
    );

    if (profileResult.rows.length > 0) {
      console.log('✅ Profile created\n');
    }

    console.log('=====================================');
    console.log('✨ ADMIN USER CREATED ✨');
    console.log('=====================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log('=====================================\n');

    console.log('🚀 Now you can:');
    console.log('   1. Go to http://localhost:3000/sign-in');
    console.log(`   2. Enter email: ${email}`);
    console.log(`   3. Enter password: ${password}`);
    console.log('   4. Click Sign In\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    await pool.end();
  }
}

createAdmin();
