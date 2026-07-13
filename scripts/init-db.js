#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script creates all necessary tables in the PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('🔧 Database Initialization Script');
console.log('==================================\n');

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initDatabase() {
  try {
    console.log('📍 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Read SQL file
    console.log('📖 Reading SQL schema file...');
    const sqlFile = path.join(__dirname, 'init-database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Execute SQL
    console.log('🔨 Creating tables...');
    await client.query(sql);
    console.log('✅ Tables created successfully\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created Tables:');
    console.log('==================');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    console.log(`\n✅ Total tables created: ${result.rows.length}`);

    client.release();
    await pool.end();

    console.log('\n🎉 Database initialization completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initDatabase();
