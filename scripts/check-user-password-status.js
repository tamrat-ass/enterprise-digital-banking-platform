#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPassword() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node check-user-password-status.js <email>');
      console.log('Example: node check-user-password-status.js tame@gamil.com');
      process.exit(1);
    }

    const client = await pool.connect();

    console.log(`\n📋 Checking password status for: ${email}\n`);

    const result = await client.query(`
      SELECT 
        u.id, u.email, u.name, u."emailVerified", u."passwordHash",
        a.id as account_id, a."providerId", a.password as account_password
      FROM "user" u
      LEFT JOIN account a ON u.id = a."userId"
      WHERE u.email = $1
    `, [email]);

    if (!result.rows.length) {
      console.log('❌ User not found\n');
      client.release();
      await pool.end();
      return;
    }

    const row = result.rows[0];

    console.log('User Table:');
    console.log(`  ID: ${row.id}`);
    console.log(`  Name: ${row.name}`);
    console.log(`  Email: ${row.email}`);
    console.log(`  Email Verified: ${row.emailVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`  passwordHash: ${row.passwordHash ? '✅ SET' : '❌ NULL'}`);

    console.log('\nAccount Table:');
    console.log(`  ID: ${row.account_id || 'N/A'}`);
    console.log(`  Provider: ${row.providerId || 'N/A'}`);
    console.log(`  password: ${row.account_password ? '✅ SET' : '❌ NULL'}`);

    console.log('\n⚠️  Status:');
    if (!row.account_password && !row.passwordHash) {
      console.log('  ❌ NO PASSWORD SET - User needs to set password via /set-new-password');
    } else if (row.account_password && row.passwordHash) {
      console.log('  ✅ PASSWORDS SET - User can sign in');
    } else if (row.passwordHash) {
      console.log('  ⚠️  Only user.passwordHash is set (not in account table)');
      console.log('     Need to set account.password as well');
    } else if (row.account_password) {
      console.log('  ⚠️  Only account.password is set (not in user table)');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkPassword();
