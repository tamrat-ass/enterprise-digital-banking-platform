#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function fixAccount() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    const password = process.argv[3] || 'TestPassword123!';

    console.log(`🔧 Fixing account for: ${email}\n`);
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

    // Delete existing account
    await client.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
    console.log('✅ Deleted old account record\n');

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('✅ Password hashed\n');

    // Create account with CORRECT provider ID
    console.log('📝 Creating account with providerId: "credential"...');
    const accountId = `account_${require('crypto').randomBytes(12).toString('hex')}`;
    await client.query(`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [accountId, email, 'credential', userId, passwordHash]);
    console.log('✅ Account created\n');

    client.release();
    await pool.end();

    console.log(`🎉 Account fixed!`);
    console.log(`\nCredentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixAccount();
