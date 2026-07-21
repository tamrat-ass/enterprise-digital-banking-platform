#!/usr/bin/env node

const bcrypt = require('bcryptjs');
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

async function testLogin() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    const password = process.argv[3] || 'TestPassword123!';

    console.log(`🧪 Testing login for: ${email}\n`);
    const client = await pool.connect();

    // 1. Find user
    console.log('Step 1: Looking up user...');
    const userResult = await client.query(`
      SELECT id, email, status, "emailVerified", "passwordHash"
      FROM "user"
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found\n');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Has Password Hash (user table): ${user.passwordHash ? '✅ YES' : '❌ NO'}\n`);

    // 2. Check status and email verification
    console.log('Step 2: Checking authentication requirements...');
    if (user.status !== 'active') {
      console.log(`❌ User status is "${user.status}", should be "active"\n`);
    } else {
      console.log(`✅ User status is "active"\n`);
    }

    if (!user.emailVerified) {
      console.log(`⚠️  Email not verified (might block login)\n`);
    } else {
      console.log(`✅ Email is verified\n`);
    }

    // 3. Look up credential account
    console.log('Step 3: Looking up credential account...');
    const accountResult = await client.query(`
      SELECT id, "accountId", "providerId", password
      FROM account
      WHERE "userId" = $1 AND "providerId" = $2
    `, [user.id, 'credential']);

    if (accountResult.rows.length === 0) {
      console.log(`❌ No credential account found\n`);
      client.release();
      await pool.end();
      process.exit(1);
    }

    const account = accountResult.rows[0];
    console.log(`✅ Credential account found:`);
    console.log(`   ID: ${account.id}`);
    console.log(`   Account ID (email): ${account.accountId}`);
    console.log(`   Provider: ${account.providerId}`);
    console.log(`   Has Password Hash: ${account.password ? '✅ YES' : '❌ NO'}\n`);

    // 4. Verify password
    console.log('Step 4: Verifying password...');
    if (!account.password) {
      console.log(`❌ No password hash found\n`);
      client.release();
      await pool.end();
      process.exit(1);
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      console.log(`❌ Password does not match hash\n`);
      console.log(`   Input password: ${password}`);
      console.log(`   Hash (first 30): ${account.password.substring(0, 30)}...\n`);
    } else {
      console.log(`✅ Password matches hash\n`);
    }

    // 5. Summary
    console.log('='.repeat(50));
    console.log('🧪 LOGIN TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`User Status: ${user.status === 'active' ? '✅' : '❌'} ${user.status}`);
    console.log(`Email Verified: ${user.emailVerified ? '✅' : '❌'} ${user.emailVerified}`);
    console.log(`Credential Account: ${accountResult.rows.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`Password Valid: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(50));

    if (user.status === 'active' && user.emailVerified && passwordMatch) {
      console.log('\n🎉 LOGIN SHOULD WORK!\n');
    } else {
      console.log('\n❌ LOGIN WILL FAIL - Issues found above\n');
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testLogin();
