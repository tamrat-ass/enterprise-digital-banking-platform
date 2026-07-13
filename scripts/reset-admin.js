#!/usr/bin/env node

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  user: 'postgres',
  password: '4840',
  host: 'localhost',
  port: 5432,
  database: 'ahadufile',
});

async function resetAdmin() {
  const client = await pool.connect();
  try {
    console.log('🔄 Resetting admin user...\n');

    // Delete old accounts
    await client.query(`DELETE FROM account WHERE "userId" = 'user-admin-001'`);
    console.log('✅ Old accounts deleted');

    // Create new account with a simple hashed password-like format
    // Using a UUID-based approach similar to Better Auth
    const accountId = 'account-' + crypto.randomBytes(12).toString('hex');
    const email = 'admin@bank.com';
    
    // For Better Auth, we need to use a password that works with their verification
    // Let's use a simple approach: create the account without password first
    await client.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [accountId, email, 'email', 'user-admin-001']
    );

    console.log('✅ New account created\n');

    console.log('=====================================');
    console.log('✨ ADMIN USER RESET ✨');
    console.log('=====================================');
    console.log('📧 Email: admin@bank.com');
    console.log('');
    console.log('🚀 PLEASE SIGNUP AT:');
    console.log('   http://localhost:3000/sign-up');
    console.log('');
    console.log('   Use any password you want');
    console.log('   First user = Super Admin');
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

resetAdmin();
