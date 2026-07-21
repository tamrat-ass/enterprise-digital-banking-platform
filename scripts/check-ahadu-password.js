#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAhadu() {
  try {
    const client = await pool.connect();
    
    console.log('📋 Checking ahadu@gmail.com account password status:\n');
    
    const result = await client.query(`
      SELECT 
        u.id, u.email, u.name, u."passwordHash",
        a.id as account_id, a."providerId", a.password as account_password
      FROM "user" u
      LEFT JOIN account a ON u.id = a."userId"
      WHERE u.email = $1
    `, ['ahadu@gmail.com']);
    
    if (!result.rows.length) {
      console.log('User not found');
      client.release();
      await pool.end();
      return;
    }

    const row = result.rows[0];
    
    console.log('User Table:');
    console.log(`  ID: ${row.id}`);
    console.log(`  Email: ${row.email}`);
    console.log(`  Name: ${row.name}`);
    console.log(`  passwordHash: ${row.passwordHash ? '✅ SET' : '❌ NULL'}`);
    if (row.passwordHash) {
      console.log(`    (first 30 chars: ${row.passwordHash.substring(0, 30)}...)`);
    }
    
    console.log('\nAccount Table:');
    console.log(`  ID: ${row.account_id || 'N/A'}`);
    console.log(`  Provider ID: ${row.providerId || 'N/A'}`);
    console.log(`  password: ${row.account_password ? '✅ SET' : '❌ NULL'}`);
    if (row.account_password) {
      console.log(`    (first 30 chars: ${row.account_password.substring(0, 30)}...)`);
    }
    
    console.log('\n⚠️  Problem Analysis:');
    if (!row.account_password) {
      console.log('  The account.password field is NULL!');
      console.log('  This is why login fails - the signin endpoint needs account.password');
      console.log('\n💡 Solution: Update the account.password field with the hash');
    } else {
      console.log('  ✅ account.password is set - login should work');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkAhadu();
