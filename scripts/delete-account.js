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

async function deleteAccount() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    console.log(`🗑️  Deleting account for: ${email}\n`);
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

    // Delete account
    const deleteResult = await client.query(`
      DELETE FROM account WHERE "userId" = $1
    `, [userId]);

    console.log(`✅ Deleted ${deleteResult.rowCount} account record(s)\n`);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

deleteAccount();
