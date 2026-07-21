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

async function verify() {
  try {
    console.log('🔍 Verifying PIN column in database...\n');
    const client = await pool.connect();

    // Check all columns in user table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user'
      ORDER BY ordinal_position;
    `);

    console.log('📊 User table columns:');
    console.log('======================');
    result.rows.forEach((col, idx) => {
      const marker = col.column_name === 'pin' ? '✅' : '  ';
      console.log(`${marker} ${idx + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    const hasPin = result.rows.some(r => r.column_name === 'pin');
    console.log(`\n${hasPin ? '✅ PIN column EXISTS' : '❌ PIN column MISSING'}`);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verify();
