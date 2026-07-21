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

async function checkAccount() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    console.log(`🔍 Checking account details for: ${email}\n`);
    const client = await pool.connect();

    // Get user first
    const userResult = await client.query(`
      SELECT id FROM "user" WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const userId = userResult.rows[0].id;

    // Get all account details
    const accountResult = await client.query(`
      SELECT 
        id,
        "accountId",
        "providerId",
        "userId",
        password,
        "createdAt",
        "updatedAt"
      FROM account 
      WHERE "userId" = $1
    `, [userId]);

    if (accountResult.rows.length === 0) {
      console.log('❌ No account record found for this user');
    } else {
      console.log('✅ Account records found:\n');
      accountResult.rows.forEach((acc, idx) => {
        console.log(`Account ${idx + 1}:`);
        console.log(`  ID: ${acc.id}`);
        console.log(`  Account ID: ${acc.accountId}`);
        console.log(`  Provider ID: ${acc.providerId}`);
        console.log(`  User ID: ${acc.userId}`);
        console.log(`  Has Password: ${acc.password ? '✅ YES' : '❌ NO'}`);
        if (acc.password) {
          console.log(`  Password (first 30 chars): ${acc.password.substring(0, 30)}...`);
        }
        console.log(`  Created: ${acc.createdAt}`);
        console.log(`  Updated: ${acc.updatedAt}\n`);
      });
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkAccount();
