#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyEmail() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node verify-user-email.js <email>');
      console.log('Example: node verify-user-email.js tame@gamil.com');
      process.exit(1);
    }

    const client = await pool.connect();

    console.log(`\n🔍 Verifying email for: ${email}\n`);

    // First check if user exists
    const checkResult = await client.query(`
      SELECT id, email, "emailVerified" FROM "user" WHERE email = $1
    `, [email]);

    if (!checkResult.rows.length) {
      console.log('❌ User not found');
      client.release();
      await pool.end();
      return;
    }

    const user = checkResult.rows[0];
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current verification status: ${user.emailVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}\n`);

    if (user.emailVerified) {
      console.log('✅ Email is already verified!');
      client.release();
      await pool.end();
      return;
    }

    // Update email verification
    console.log('🔄 Updating email verification status...');
    const updateResult = await client.query(`
      UPDATE "user" 
      SET "emailVerified" = true, "updatedAt" = NOW()
      WHERE email = $1
      RETURNING id, email, "emailVerified"
    `, [email]);

    if (updateResult.rows.length) {
      console.log('✅ Email verification status updated!\n');
      console.log('Updated user:');
      console.log(`  ID: ${updateResult.rows[0].id}`);
      console.log(`  Email: ${updateResult.rows[0].email}`);
      console.log(`  Verified: ${updateResult.rows[0].emailVerified ? '✅ YES' : '❌ NO'}\n`);
      console.log('✅ User can now sign in!');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verifyEmail();
