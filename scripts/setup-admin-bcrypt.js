#!/usr/bin/env node
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
    console.log('🔐 Creating admin user with bcrypt hashing...\n');

    const email = 'admin@bank.com';
    const plainPassword = 'Admin@123456';
    const name = 'Admin User';
    
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
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
    console.log('✅ User created');

    // Create account with hashed password
    await client.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [accountId, email, 'credential', finalUserId, hashedPassword]
    );

    console.log('✅ Account created with hashed password\n');

    console.log('=====================================');
    console.log('✨ ADMIN USER CREATED ✨');
    console.log('=====================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔐 Password: ${plainPassword}`);
    console.log('=====================================\n');
    console.log('🚀 Go to http://localhost:3000/sign-in');
    console.log('   and enter the credentials above\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    await pool.end();
  }
}

createAdmin();
