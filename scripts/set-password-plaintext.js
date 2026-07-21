#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function setPassword() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    const password = process.argv[3] || 'TestPassword123!';

    console.log(`🔧 Setting password (plaintext test) for: ${email}\n`);
    const client = await pool.connect();

    // Find user
    const userResult = await client.query(`
      SELECT id FROM "user" WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      client.release();
      await pool.end();
      process.exit(1);
    }

    const userId = userResult.rows[0].id;

    // Create account with plaintext password (to test if Better Auth hashes it)
    const accountId = `account_${require('crypto').randomBytes(12).toString('hex')}`;
    await client.query(`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [accountId, email, 'email', userId, password]);

    console.log(`✅ Account created with plaintext password\n`);
    console.log(`Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

setPassword();
