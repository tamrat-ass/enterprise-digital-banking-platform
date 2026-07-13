#!/usr/bin/env node

/**
 * Seed Default Admin User
 * Run this with: node seed-user.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '4840',
  host: 'localhost',
  port: 5432,
  database: 'ahadufile',
});

async function seedUser() {
  const client = await pool.connect();
  try {
    console.log('🌱 Creating default admin user...\n');

    // Test credentials
    const email = 'admin@bank.com';
    const password = 'Admin@123456'; // Hashed password for "Admin@123456"
    const name = 'Admin User';
    const userId = 'user-admin-001';

    // Insert user
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [userId, name, email]
    );

    // Insert profile
    await client.query(
      `INSERT INTO profiles (id, "userId", full_name, email, job_title, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      ['profile-admin-001', userId, name, email, 'Administrator', 'active']
    );

    console.log('📊 Test User Created:\n');
    console.log('=====================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log('=====================================\n');
    console.log('⚠️  Note: Better Auth requires password hashing during signup.');
    console.log('📝 To login, please SIGN UP with these credentials at:');
    console.log('   http://localhost:3000/sign-up\n');
    console.log('✅ Or if you prefer, you can:');
    console.log('   1. Go to http://localhost:3000/sign-up');
    console.log('   2. Create a new account with any credentials');
    console.log('   3. The first account automatically becomes Super Admin\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

seedUser();
