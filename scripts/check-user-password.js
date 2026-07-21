#!/usr/bin/env node

/**
 * Check if user has a password hash in the database
 */

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
    console.log('🔍 Checking user password in database...\n');
    const client = await pool.connect();

    // Check user table
    const userResult = await client.query(`
      SELECT id, email, name, "passwordHash", status 
      FROM "user" 
      WHERE email = $1
      LIMIT 1;
    `, ['ahadu@gmail.com']);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found: ahadu@gmail.com\n');
      client.release();
      await pool.end();
      process.exit(0);
    }

    const user = userResult.rows[0];
    console.log('📊 User Information:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? '✅ YES' : '❌ NO'}`);
    if (user.passwordHash) {
      console.log(`   Password Hash (first 50 chars): ${user.passwordHash.substring(0, 50)}...`);
    }

    // Check account table
    console.log('\n📊 Account Information:');
    const accountResult = await client.query(`
      SELECT id, "providerId", password 
      FROM account 
      WHERE "userId" = $1
      LIMIT 1;
    `, [user.id]);

    if (accountResult.rows.length === 0) {
      console.log('   ❌ No account record found');
    } else {
      const account = accountResult.rows[0];
      console.log(`   Provider: ${account.providerId}`);
      console.log(`   Has Password Hash: ${account.password ? '✅ YES' : '❌ NO'}`);
      if (account.password) {
        console.log(`   Password Hash (first 50 chars): ${account.password.substring(0, 50)}...`);
      }
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
