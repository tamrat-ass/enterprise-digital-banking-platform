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

async function checkUser() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    console.log(`🔍 Checking user status for: ${email}\n`);
    const client = await pool.connect();

    const result = await client.query(`
      SELECT 
        id,
        email,
        name,
        status,
        "emailVerified",
        "passwordHash",
        "invitationToken",
        "invitationExpiresAt"
      FROM "user"
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('📊 User Status:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? '✅ YES' : '❌ NO'}`);
    console.log(`   Invitation Token: ${user.invitationToken ? '✅ HAS' : '❌ NONE'}`);
    console.log(`   Invitation Expires: ${user.invitationExpiresAt || 'N/A'}\n`);

    if (user.status !== 'active') {
      console.log(`⚠️  WARNING: User status is "${user.status}", should be "active"`);
    }

    if (!user.emailVerified) {
      console.log(`⚠️  WARNING: Email not verified`);
    }

    if (!user.passwordHash) {
      console.log(`⚠️  WARNING: No password hash in user table`);
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkUser();
