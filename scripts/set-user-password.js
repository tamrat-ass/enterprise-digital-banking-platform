#!/usr/bin/env node

/**
 * Manually set user password - for fixing password reset issues
 */

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

async function setPassword() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    const password = process.argv[3] || 'TestPassword123!';

    console.log(`🔧 Setting password for user: ${email}\n`);
    const client = await pool.connect();

    // Find user
    const userResult = await client.query(`
      SELECT id, email, name FROM "user" WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      client.release();
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}\n`);

    // Hash password
    console.log(`🔐 Hashing password...`);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log(`✅ Password hashed\n`);

    // Update user table
    console.log(`📝 Updating user table...`);
    await client.query(`
      UPDATE "user" 
      SET "passwordHash" = $1, "passwordChangedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = $2
    `, [passwordHash, user.id]);
    console.log(`✅ User table updated\n`);

    // Update or create account
    console.log(`📝 Updating account table...`);
    const accountResult = await client.query(`
      SELECT id FROM account WHERE "userId" = $1
    `, [user.id]);

    if (accountResult.rows.length === 0) {
      // Create account
      const accountId = `account_${require('crypto').randomBytes(12).toString('hex')}`;
      await client.query(`
        INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [accountId, user.email, 'email', user.id, passwordHash]);
      console.log(`✅ Account created\n`);
    } else {
      // Update account
      await client.query(`
        UPDATE account 
        SET password = $1, "updatedAt" = NOW()
        WHERE "userId" = $2
      `, [passwordHash, user.id]);
      console.log(`✅ Account updated\n`);
    }

    client.release();
    await pool.end();

    console.log(`🎉 Password set successfully!`);
    console.log(`\nCredentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

setPassword();
