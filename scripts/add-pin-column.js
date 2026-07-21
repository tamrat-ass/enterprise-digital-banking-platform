#!/usr/bin/env node

/**
 * Migration Script: Add PIN column to user table
 * This script adds the PIN column for password reset functionality
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function addPinColumn() {
  try {
    console.log('🔧 Adding PIN Column Migration');
    console.log('================================\n');

    console.log('📍 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Check if column already exists
    console.log('🔍 Checking if PIN column already exists...');
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'pin';
    `);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  PIN column already exists\n');
      client.release();
      await pool.end();
      console.log('✅ Migration completed (no changes needed)\n');
      process.exit(0);
    }

    // Add PIN column
    console.log('🔨 Adding PIN column to user table...');
    await client.query(`
      ALTER TABLE "user" ADD COLUMN "pin" TEXT;
    `);
    console.log('✅ PIN column added successfully\n');

    // Add comment
    console.log('📝 Adding column comment...');
    await client.query(`
      COMMENT ON COLUMN "user"."pin" IS 'User 4-6 digit PIN for authentication (should be encrypted in production)';
    `);
    console.log('✅ Column comment added\n');

    // Verify
    console.log('🔍 Verifying column...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'pin';
    `);

    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log(`✅ Column verified:`);
      console.log(`   - Name: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Nullable: ${col.is_nullable}\n`);
    }

    client.release();
    await pool.end();

    console.log('🎉 Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addPinColumn();
