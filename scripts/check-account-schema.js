#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    const client = await pool.connect();

    console.log('\n📋 Account table schema:');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'account'
      ORDER BY ordinal_position
    `);
    
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n📊 Sample account record for ahadu@gmail.com:');
    const accountResult = await client.query(`
      SELECT a.* FROM account a
      JOIN "user" u ON a."userId" = u.id
      WHERE u.email = $1
      LIMIT 1
    `, ['ahadu@gmail.com']);

    if (accountResult.rows.length > 0) {
      const account = accountResult.rows[0];
      console.log(`  ID: ${account.id}`);
      console.log(`  AccountID: ${account.accountId}`);
      console.log(`  ProviderID: ${account.providerId}`);
      console.log(`  UserID: ${account.userId}`);
      console.log(`  Password (first 30 chars): ${account.password ? account.password.substring(0, 30) + '...' : 'NULL'}`);
      console.log(`  Password type: ${account.password ? typeof account.password : 'NULL'}`);
      console.log(`  CreatedAt: ${account.createdAt}`);
      console.log(`  UpdatedAt: ${account.updatedAt}`);
    } else {
      console.log('  No account found');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkSchema();
