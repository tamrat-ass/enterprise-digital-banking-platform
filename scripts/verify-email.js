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

async function verifyEmail() {
  try {
    const email = process.argv[2] || 'ahadu@gmail.com';
    console.log(`✅ Verifying email for: ${email}\n`);
    const client = await pool.connect();

    const result = await client.query(`
      UPDATE "user"
      SET "emailVerified" = true, "updatedAt" = NOW()
      WHERE email = $1
      RETURNING email, "emailVerified"
    `, [email]);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      client.release();
      await pool.end();
      process.exit(1);
    }

    console.log(`✅ Email verified!`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Verified: ${result.rows[0].emailVerified}\n`);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verifyEmail();
